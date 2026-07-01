from __future__ import annotations

from dataclasses import dataclass

from backend.models.ai_output import AIOutput
from backend.models.candidate import Candidate
from backend.models.score import ScoreBreakdown


@dataclass
class PipelineResult:
    candidate: Candidate
    score: ScoreBreakdown
    summary: AIOutput
    recommendation_narrative: AIOutput
    explanation: AIOutput
