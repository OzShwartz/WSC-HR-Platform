"""FastAPI layer over the Core pipeline - prds/05-system-architecture.md.

This is a thin translation layer: every route calls into backend/services/
(the same pipeline the CLI uses) and serializes the result. No scoring or AI
logic lives here - see prds/07-development-standards.md ("Service Rules").
"""

from __future__ import annotations

import dataclasses
import json
from collections import Counter
from functools import lru_cache
from pathlib import Path

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, ValidationError

REPO_ROOT = Path(__file__).resolve().parent.parent.parent
load_dotenv(REPO_ROOT / ".env")

from backend.config.config_loader import CONFIG_DIR, ScoringWeights, load_scoring_weights  # noqa: E402
from backend.models.candidate import JobOpening, WscEmployee  # noqa: E402
from backend.models.pipeline_result import PipelineResult  # noqa: E402
from backend.repositories.csv_repository import CsvRepository  # noqa: E402
from backend.services.pipeline import run_pipeline  # noqa: E402
from backend.utils.parsing import clean_str, split_list  # noqa: E402


class JobPayload(BaseModel):
    title: str
    department: str
    seniority: str
    key_domains: list[str] = []
    required_skills: list[str] = []
    nice_to_have: list[str] = []

DATA_DIR = REPO_ROOT / "recruitment-task" / "data"

app = FastAPI(title="Talent Intelligence Platform API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)


def _serialize_score(score) -> dict:
    """dataclasses.asdict() only serializes fields, not @property values - so
    SubScore.weighted_score (a computed property) has to be added explicitly
    or the frontend silently gets `undefined` for it."""
    data = dataclasses.asdict(score)
    for sub, sub_obj in zip(data["sub_scores"], score.sub_scores):
        sub["weighted_score"] = sub_obj.weighted_score
    return data


def _serialize_result(r: PipelineResult, rank: int) -> dict:
    return {
        "rank": rank,
        "candidate": {
            "hubspot_id": r.candidate.attendee.hubspot_id,
            "full_name": r.candidate.full_name,
            "email": r.candidate.attendee.email,
            "title": r.candidate.attendee.title,
            "company": r.candidate.attendee.company,
            "conference_name": r.candidate.attendee.conference_name,
            "conference_domain": r.candidate.attendee.conference_domain,
            "conference_date": r.candidate.attendee.conference_date,
            "notes": r.candidate.attendee.notes,
            "linkedin_url": r.candidate.attendee.linkedin_url,
            "has_linkedin": r.candidate.has_linkedin,
            "linkedin": dataclasses.asdict(r.candidate.linkedin) if r.candidate.linkedin else None,
        },
        "score": _serialize_score(r.score),
        "summary": dataclasses.asdict(r.summary),
        "recommendation_narrative": dataclasses.asdict(r.recommendation_narrative),
        "explanation": dataclasses.asdict(r.explanation),
    }


@lru_cache(maxsize=8)
def _job_results_cached(job_id: str):
    return run_pipeline(DATA_DIR, job_id)


def _all_jobs() -> dict:
    return CsvRepository(DATA_DIR).load_jobs()


@app.get("/api/jobs")
def list_jobs():
    jobs = _all_jobs()
    return [dataclasses.asdict(j) for j in jobs.values()]


@app.get("/api/jobs/{job_id}")
def get_job(job_id: str):
    jobs = _all_jobs()
    if job_id not in jobs:
        raise HTTPException(404, f"Unknown job_id '{job_id}'")
    return dataclasses.asdict(jobs[job_id])


@app.post("/api/jobs")
def create_job(payload: JobPayload):
    repo = CsvRepository(DATA_DIR)
    job = JobOpening(job_id=repo.next_job_id(), **payload.model_dump())
    repo.save_job(job)
    _job_results_cached.cache_clear()
    return dataclasses.asdict(job)


@app.delete("/api/jobs/{job_id}")
def delete_job(job_id: str):
    repo = CsvRepository(DATA_DIR)
    if not repo.delete_job(job_id):
        raise HTTPException(404, f"Unknown job_id '{job_id}'")
    _job_results_cached.cache_clear()
    return {"deleted": job_id}


@app.get("/api/jobs/{job_id}/candidates")
def get_job_candidates(job_id: str):
    if job_id not in _all_jobs():
        raise HTTPException(404, f"Unknown job_id '{job_id}'")
    job, results = _job_results_cached(job_id)
    return {
        "job": dataclasses.asdict(job),
        "candidates": [_serialize_result(r, i) for i, r in enumerate(results, start=1)],
    }


@app.get("/api/candidates")
def list_candidate_pool():
    """Every candidate, each tagged with their best-matching job across all openings -
    the Candidate Pool table view (prds/02-product-specification.md)."""
    jobs = _all_jobs()
    best_by_candidate: dict[str, dict] = {}
    for job_id in jobs:
        job, results = _job_results_cached(job_id)
        for i, r in enumerate(results, start=1):
            key = r.candidate.attendee.hubspot_id
            current_best = best_by_candidate.get(key)
            if current_best is None or r.score.overall_score > current_best["score"]["overall_score"]:
                entry = _serialize_result(r, i)
                entry["best_matching_job"] = {"job_id": job.job_id, "title": job.title, "department": job.department}
                best_by_candidate[key] = entry
    return list(best_by_candidate.values())


@app.get("/api/candidates/{hubspot_id}")
def get_candidate(hubspot_id: str):
    """A single candidate's full profile (scored against their best-matching job) -
    used to open the Candidate Drawer from anywhere that only has a hubspot_id handy
    (Dashboard's top candidates, WSC Team's reverse connection view), without those
    pages having to load the entire pool up front."""
    for entry in list_candidate_pool():
        if entry["candidate"]["hubspot_id"] == hubspot_id:
            return entry
    raise HTTPException(404, f"Unknown candidate hubspot_id '{hubspot_id}'")


@app.get("/api/dashboard")
def dashboard():
    jobs = _all_jobs()
    pool = list_candidate_pool()
    recommendation_counts = Counter(c["score"]["recommendation"] for c in pool)
    conference_counts = Counter(c["candidate"]["conference_name"] for c in pool)
    scores = [c["score"]["overall_score"] for c in pool]

    skill_counts: Counter = Counter()
    for job in jobs.values():
        skill_counts.update(job.required_skills)

    top_conference = conference_counts.most_common(1)[0] if conference_counts else (None, 0)
    top_candidates = sorted(pool, key=lambda c: c["score"]["overall_score"], reverse=True)[:5]

    return {
        "total_candidates": len(pool),
        "total_jobs": len(jobs),
        "average_score": round(sum(scores) / len(scores), 1) if scores else 0,
        "conference_count": len(conference_counts),
        "top_conference": {"name": top_conference[0], "count": top_conference[1]},
        "most_requested_skill": skill_counts.most_common(1)[0][0] if skill_counts else None,
        "recommendation_counts": dict(recommendation_counts),
        "top_candidates": [
            {
                "hubspot_id": c["candidate"]["hubspot_id"],
                "full_name": c["candidate"]["full_name"],
                "overall_score": c["score"]["overall_score"],
                "recommendation": c["score"]["recommendation"],
                "best_matching_job": c["best_matching_job"]["title"],
            }
            for c in top_candidates
        ],
    }


@app.get("/api/employees")
def list_employees():
    """Includes the reverse view of mutual connections: for each employee, which
    candidates (from the current pool) list them as a mutual connection. This is
    what lets a recruiter look at an employee and ask "who could you introduce us
    to?" instead of only seeing connections from the candidate's side."""
    employees = CsvRepository(DATA_DIR).load_employees()
    pool = list_candidate_pool()

    connections: dict[str, list[dict]] = {eid: [] for eid in employees}
    for c in pool:
        linkedin = c["candidate"]["linkedin"]
        if not linkedin:
            continue
        for eid in linkedin["wsc_mutual_connections"]:
            if eid in connections:
                connections[eid].append(
                    {
                        "hubspot_id": c["candidate"]["hubspot_id"],
                        "full_name": c["candidate"]["full_name"],
                        "overall_score": c["score"]["overall_score"],
                        "recommendation": c["score"]["recommendation"],
                        "best_matching_job": c["best_matching_job"]["title"],
                    }
                )

    result = []
    for e in employees.values():
        row = dataclasses.asdict(e)
        row["connected_candidates"] = sorted(connections[e.employee_id], key=lambda x: -x["overall_score"])
        result.append(row)
    return result


REQUIRED_EMPLOYEE_COLUMNS = {"employee_id", "full_name", "title", "department", "linkedin_id"}


@app.post("/api/employees/import")
async def import_employees(file: UploadFile):
    """Expects the same column schema as recruitment-task/data/wsc_employees.csv:
    employee_id, full_name, title, department, linkedin_id, work_history (';'-separated).
    Upserts by employee_id - re-importing a known employee updates their row."""
    import pandas as pd
    from io import BytesIO

    raw = await file.read()
    try:
        df = pd.read_csv(BytesIO(raw))
    except Exception as e:
        raise HTTPException(400, f"Could not parse CSV: {e}") from e

    missing = REQUIRED_EMPLOYEE_COLUMNS - set(df.columns)
    if missing:
        raise HTTPException(422, f"CSV is missing required columns: {sorted(missing)}")

    employees = [
        WscEmployee(
            employee_id=clean_str(row.get("employee_id")),
            full_name=clean_str(row.get("full_name")),
            title=clean_str(row.get("title")),
            department=clean_str(row.get("department")),
            linkedin_id=clean_str(row.get("linkedin_id")),
            work_history=split_list(row.get("work_history")),
        )
        for _, row in df.iterrows()
        if clean_str(row.get("employee_id"))
    ]

    repo = CsvRepository(DATA_DIR)
    count = repo.save_employees(employees)
    _job_results_cached.cache_clear()  # mutual-connection scoring depends on the employee roster
    return {"imported": count}


@app.get("/api/settings/scoring-weights")
def scoring_weights():
    return load_scoring_weights().model_dump()


@app.put("/api/settings/scoring-weights")
def update_scoring_weights(payload: dict):
    """Persists to backend/config/scoring_weights.json - the same file the CLI
    and every other pipeline entry point reads, so an edit here changes every
    candidate's score everywhere, not just in this session (prds/00-project-
    constitution.md: "everything configurable, nothing hardcoded")."""
    try:
        weights = ScoringWeights(**payload)
    except ValidationError as e:
        raise HTTPException(422, str(e)) from e

    path = CONFIG_DIR / "scoring_weights.json"
    data = weights.model_dump()
    data["_comment"] = json.loads(path.read_text()).get("_comment", "")
    path.write_text(json.dumps(data, indent=2) + "\n")

    _job_results_cached.cache_clear()  # weights changed - every cached ranking is now stale
    return weights.model_dump()


@app.get("/api/settings/integrations")
def integrations():
    """Mocked connection status - prds/11-tradeoffs.md #4: the assumption in this
    MVP is that HubSpot/LinkedIn/Comeet access already exists, and today's actual
    data path is a CSV export from each, matching recruitment-task/data/*.csv."""
    return [
        {"name": "HubSpot", "status": "Connected", "mode": "CSV import (conference_attendees.csv)", "last_sync": "manual"},
        {"name": "LinkedIn", "status": "Connected", "mode": "CSV import (linkedin_profiles.csv)", "last_sync": "manual"},
        {"name": "Comeet", "status": "Not connected", "mode": "Planned - ATS status flagging", "last_sync": "-"},
    ]
