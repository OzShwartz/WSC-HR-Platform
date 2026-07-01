"""The end-to-end pipeline - docs/01-prd.md user journey, condensed to a batch run.

Input goes CSV → Candidate models → deterministic ScoreBreakdown → AI
narratives (LLM if configured, deterministic fallback otherwise). This is the
single function both the CLI runner (backend/run_pipeline.py) and the future
FastAPI endpoint call - the orchestration logic lives here exactly once.
"""

from __future__ import annotations

from pathlib import Path
from typing import Literal

from backend.ai.agents.explainability_agent import build_explanation
from backend.ai.agents.recommendation_agent import generate_recommendation
from backend.ai.agents.summary_agent import generate_summary
from backend.ai.llm_client import LLMClient, get_llm_client
from backend.config.config_loader import load_domain_signals, load_scoring_weights, load_seniority_bands
from backend.models.candidate import JobOpening
from backend.models.pipeline_result import PipelineResult
from backend.repositories.csv_repository import CsvRepository
from backend.services.scoring_engine import score_candidate


def run_pipeline(
    data_dir: str | Path, job_id: str, llm: LLMClient | None | Literal["auto"] = "auto"
) -> tuple[JobOpening, list[PipelineResult]]:
    """Score every candidate against `job_id` and generate AI narratives.

    `llm=None` forces the deterministic fallback path (useful for tests /
    offline runs). `llm="auto"` (default) checks the environment for an API
    key via get_llm_client() and uses it if present.
    """
    if llm == "auto":
        llm = get_llm_client()

    repo = CsvRepository(data_dir)
    job = repo.get_job(job_id)
    candidates = repo.load_candidates()
    employees = repo.load_employees()

    weights = load_scoring_weights()
    domain_signals = load_domain_signals()
    seniority_bands = load_seniority_bands()

    results: list[PipelineResult] = []
    for candidate in candidates:
        score = score_candidate(candidate, job, employees, weights, domain_signals, seniority_bands)
        summary = generate_summary(candidate, job, llm)
        recommendation = generate_recommendation(candidate, job, score, llm)
        explanation = build_explanation(score)
        results.append(
            PipelineResult(
                candidate=candidate,
                score=score,
                summary=summary,
                recommendation_narrative=recommendation,
                explanation=explanation,
            )
        )

    results.sort(key=lambda r: r.score.overall_score, reverse=True)
    return job, results
