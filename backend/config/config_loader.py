"""Loads externally-editable scoring/domain configuration.

Per prds/00-project-constitution.md ("everything configurable, nothing
hardcoded"), the scoring weights and the domain signal-vs-noise vocabulary
live in plain JSON files in this folder, not as literals in the scoring
engine. This module is the only place that reads them.
"""

from __future__ import annotations

import json
from pathlib import Path

from pydantic import BaseModel, model_validator

CONFIG_DIR = Path(__file__).parent


class ScoringWeights(BaseModel):
    skills: float
    experience: float
    title: float
    industry: float
    mutual_connections: float
    conference_relevance: float
    education: float
    recruiter_feedback: float

    @model_validator(mode="after")
    def weights_sum_to_one(self) -> "ScoringWeights":
        total = (
            self.skills
            + self.experience
            + self.title
            + self.industry
            + self.mutual_connections
            + self.conference_relevance
            + self.education
            + self.recruiter_feedback
        )
        if abs(total - 1.0) > 0.01:
            raise ValueError(
                f"Scoring weights must sum to 1.0 (100%), got {total:.3f}. "
                "Fix backend/config/scoring_weights.json."
            )
        return self


class DomainSignals(BaseModel):
    noise_title_keywords: list[str]
    skill_synonyms: dict[str, str]


def load_scoring_weights(path: Path | None = None) -> ScoringWeights:
    path = path or (CONFIG_DIR / "scoring_weights.json")
    data = json.loads(path.read_text())
    data.pop("_comment", None)
    return ScoringWeights(**data)


def load_domain_signals(path: Path | None = None) -> DomainSignals:
    path = path or (CONFIG_DIR / "domain_signals.json")
    data = json.loads(path.read_text())
    data.pop("_comment", None)
    return DomainSignals(**data)


def load_seniority_bands(path: Path | None = None) -> dict[str, list[float]]:
    path = path or (CONFIG_DIR / "seniority_bands.json")
    data = json.loads(path.read_text())
    data.pop("_comment", None)
    return data
