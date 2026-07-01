"""Score models - the explainability contract from docs/00-project-constitution.md.

Every sub-score and the overall score carry raw value, weight, reasoning,
evidence, and a flag for whether the underlying data was actually available
- never just a bare number.
"""

from __future__ import annotations

from dataclasses import dataclass, field


@dataclass
class SubScore:
    name: str
    raw_score: float  # 0-100, before weighting
    weight: float  # 0-1, from backend/config/scoring_weights.json
    reasoning: str
    evidence: list[str] = field(default_factory=list)
    insufficient_data: bool = False

    @property
    def weighted_score(self) -> float:
        return round(self.raw_score * self.weight, 2)


@dataclass
class ScoreBreakdown:
    overall_score: float
    confidence: float  # 0-1 - how much of the overall score rests on real (non-missing) data
    domain_relevance_multiplier: float
    sub_scores: list[SubScore]
    recommendation: str
    strengths: list[str]
    weaknesses: list[str]
    missing_skills: list[str]

    def sub_score(self, name: str) -> SubScore:
        for s in self.sub_scores:
            if s.name == name:
                return s
        raise KeyError(name)
