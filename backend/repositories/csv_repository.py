"""Repository layer - the only place in the codebase that knows about CSV files.

Per docs/06-folder-structure.md, swapping CSV for HubSpot/LinkedIn/Comeet APIs
or a real database later should mean rewriting this file, not the services or
scoring engine that consume it. Every read method returns plain domain models
(backend/models/candidate.py), never raw pandas rows.
"""

from __future__ import annotations

from pathlib import Path

import pandas as pd

from backend.models.candidate import (
    Candidate,
    ConferenceAttendee,
    JobOpening,
    LinkedInProfile,
    WscEmployee,
)
from backend.utils.parsing import clean_str, split_list, to_optional_float


class CsvRepository:
    """Loads all four mock data exports from a data directory.

    In production this class is replaced by HubSpotRepository /
    LinkedInRepository / ComeetRepository implementations behind the same
    read interface - see docs/11-tradeoffs.md #4.
    """

    def __init__(self, data_dir: str | Path):
        self.data_dir = Path(data_dir)

    def _read(self, filename: str) -> pd.DataFrame:
        path = self.data_dir / filename
        if not path.exists():
            raise FileNotFoundError(f"Expected data file not found: {path}")
        return pd.read_csv(path)

    def load_candidates(self) -> list[Candidate]:
        attendees_df = self._read("conference_attendees.csv")
        linkedin_by_url = self._load_linkedin_by_url()

        candidates: list[Candidate] = []
        for _, row in attendees_df.iterrows():
            attendee = ConferenceAttendee(
                hubspot_id=clean_str(row.get("hubspot_id")),
                full_name=clean_str(row.get("full_name")),
                email=clean_str(row.get("email")),
                company=clean_str(row.get("company")),
                title=clean_str(row.get("title")),
                conference_name=clean_str(row.get("conference_name")),
                conference_domain=clean_str(row.get("conference_domain")),
                conference_date=clean_str(row.get("conference_date")),
                source=clean_str(row.get("source")),
                notes=clean_str(row.get("notes")),
                linkedin_url=clean_str(row.get("linkedin_url")),
            )
            linkedin = linkedin_by_url.get(attendee.linkedin_url) if attendee.linkedin_url else None
            candidates.append(Candidate(attendee=attendee, linkedin=linkedin))
        return candidates

    def _load_linkedin_by_url(self) -> dict[str, LinkedInProfile]:
        df = self._read("linkedin_profiles.csv")
        profiles: dict[str, LinkedInProfile] = {}
        for _, row in df.iterrows():
            url = clean_str(row.get("linkedin_url"))
            if not url:
                continue
            profiles[url] = LinkedInProfile(
                linkedin_url=url,
                full_name=clean_str(row.get("full_name")),
                current_company=clean_str(row.get("current_company")),
                current_title=clean_str(row.get("current_title")),
                location=clean_str(row.get("location")),
                years_experience=to_optional_float(row.get("years_experience")),
                top_skills=split_list(row.get("top_skills")),
                industry=clean_str(row.get("industry")),
                past_companies=split_list(row.get("past_companies")),
                past_titles=split_list(row.get("past_titles"), delimiter=";"),
                wsc_mutual_connections=split_list(row.get("wsc_mutual_connections")),
            )
        return profiles

    def load_employees(self) -> dict[str, WscEmployee]:
        df = self._read("wsc_employees.csv")
        employees: dict[str, WscEmployee] = {}
        for _, row in df.iterrows():
            employee_id = clean_str(row.get("employee_id"))
            employees[employee_id] = WscEmployee(
                employee_id=employee_id,
                full_name=clean_str(row.get("full_name")),
                title=clean_str(row.get("title")),
                department=clean_str(row.get("department")),
                linkedin_id=clean_str(row.get("linkedin_id")),
                work_history=split_list(row.get("work_history")),
            )
        return employees

    def load_jobs(self) -> dict[str, JobOpening]:
        df = self._read("job_openings.csv")
        jobs: dict[str, JobOpening] = {}
        for _, row in df.iterrows():
            job_id = clean_str(row.get("job_id"))
            jobs[job_id] = JobOpening(
                job_id=job_id,
                title=clean_str(row.get("title")),
                department=clean_str(row.get("department")),
                seniority=clean_str(row.get("seniority")),
                key_domains=split_list(row.get("key_domains")),
                required_skills=split_list(row.get("required_skills")),
                nice_to_have=split_list(row.get("nice_to_have")),
            )
        return jobs

    def get_job(self, job_id: str) -> JobOpening:
        jobs = self.load_jobs()
        if job_id not in jobs:
            available = ", ".join(sorted(jobs)) or "(none)"
            raise KeyError(f"Unknown job_id '{job_id}'. Available: {available}")
        return jobs[job_id]

    def next_job_id(self) -> str:
        existing = self.load_jobs()
        numbers = [int(jid[3:]) for jid in existing if jid.startswith("JOB") and jid[3:].isdigit()]
        return f"JOB{(max(numbers) + 1) if numbers else 1:03d}"

    def save_job(self, job: JobOpening) -> None:
        """Upsert by job_id and rewrite job_openings.csv in full - this is a small,
        infrequently-written file, so read-modify-write-whole-file is simpler and
        safer than trying to patch a single CSV row in place."""
        jobs = self.load_jobs()
        jobs[job.job_id] = job
        self._write_jobs(jobs)

    def delete_job(self, job_id: str) -> bool:
        jobs = self.load_jobs()
        if job_id not in jobs:
            return False
        del jobs[job_id]
        self._write_jobs(jobs)
        return True

    def _write_jobs(self, jobs: dict[str, JobOpening]) -> None:
        rows = [
            {
                "job_id": j.job_id,
                "title": j.title,
                "department": j.department,
                "seniority": j.seniority,
                "key_domains": ";".join(j.key_domains),
                "required_skills": ";".join(j.required_skills),
                "nice_to_have": ";".join(j.nice_to_have),
            }
            for j in jobs.values()
        ]
        pd.DataFrame(rows, columns=[
            "job_id", "title", "department", "seniority", "key_domains", "required_skills", "nice_to_have",
        ]).to_csv(self.data_dir / "job_openings.csv", index=False)

    def save_employees(self, employees: list[WscEmployee]) -> int:
        """Upsert a batch of employees (by employee_id) into wsc_employees.csv.
        Used by the CSV import feature - see docs/11-tradeoffs.md #4 on assuming
        HubSpot/LinkedIn/Comeet access already exists and today's actual data
        path being a CSV export from each system."""
        existing = self.load_employees()
        for e in employees:
            existing[e.employee_id] = e
        rows = [
            {
                "employee_id": e.employee_id,
                "full_name": e.full_name,
                "title": e.title,
                "department": e.department,
                "linkedin_id": e.linkedin_id,
                "work_history": ";".join(e.work_history),
            }
            for e in existing.values()
        ]
        pd.DataFrame(rows, columns=[
            "employee_id", "full_name", "title", "department", "linkedin_id", "work_history",
        ]).to_csv(self.data_dir / "wsc_employees.csv", index=False)
        return len(employees)
