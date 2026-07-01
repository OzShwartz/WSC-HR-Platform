"""Explainability Agent - docs/04-ai-architecture.md.

Unlike the summary and recommendation agents, this one never calls an LLM at
all: "why was this candidate scored this way" is already fully captured in
the deterministic ScoreBreakdown, so formatting it is application logic, not
reasoning. Keeping it LLM-free means this output can never hallucinate.
"""

from __future__ import annotations

from backend.models.ai_output import AIOutput
from backend.models.score import ScoreBreakdown


def build_explanation(score: ScoreBreakdown) -> AIOutput:
    lines = [f"Overall: {score.overall_score}/100 → {score.recommendation} (confidence {score.confidence:.0%})"]
    for sub in score.sub_scores:
        flag = " [insufficient data]" if sub.insufficient_data else ""
        lines.append(
            f"- {sub.name} = {sub.raw_score} (weight {sub.weight:.0%}, contributes {sub.weighted_score}){flag}: {sub.reasoning}"
        )

    assumptions = ["Missing LinkedIn/skills/experience data is treated as reduced confidence, not as a negative score."]
    if score.domain_relevance_multiplier <= 0.15:
        assumptions.append("Title matched a known non-technical/adjacent-role pattern; domain relevance was dampened accordingly.")

    return AIOutput(
        content="\n".join(lines),
        confidence=score.confidence,
        reasoning="Deterministic formatting of the scoring engine's own sub-scores - no LLM involved.",
        evidence=[e for sub in score.sub_scores for e in sub.evidence],
        assumptions=assumptions,
        prompt_version="n/a",
        knowledge_version="n/a",
        source="deterministic",
    )
