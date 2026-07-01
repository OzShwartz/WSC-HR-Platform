"""The explainability contract every AI output must satisfy - docs/00-project-constitution.md."""

from __future__ import annotations

from dataclasses import dataclass, field


@dataclass
class AIOutput:
    content: str
    confidence: float
    reasoning: str
    evidence: list[str] = field(default_factory=list)
    assumptions: list[str] = field(default_factory=list)
    prompt_version: str = "v1"
    knowledge_version: str = "v1"
    source: str = "fallback_template"  # e.g. "llm:anthropic:claude-..." or "fallback_template"
