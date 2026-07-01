"""Loads prompt templates from backend/ai/prompts/*.md - docs/09-prompt-strategy.md.

Prompts are plain Markdown, not Python strings, so they can be edited and
reviewed independently of the code that calls them (docs/00-project-constitution.md
rule #9). Each file has a YAML-ish frontmatter block with a `version`, a
`# System` section, and a `# User Prompt Template` section with `{field}`
placeholders filled via `str.format(**context)`.
"""

from __future__ import annotations

import re
from dataclasses import dataclass
from pathlib import Path

PROMPTS_DIR = Path(__file__).parent / "prompts"
KNOWLEDGE_DIR = Path(__file__).parent / "knowledge"

_VERSION_RE = re.compile(r"version:\s*(\S+)")


@dataclass
class PromptTemplate:
    version: str
    system: str
    user_template: str

    def render(self, **context: object) -> str:
        return self.user_template.format(**context)


def _extract_section(text: str, header: str) -> str:
    pattern = rf"#\s*{re.escape(header)}\s*\n(.*?)(?=\n#\s|\Z)"
    match = re.search(pattern, text, re.DOTALL)
    return match.group(1).strip() if match else ""


def load_prompt(name: str) -> PromptTemplate:
    path = PROMPTS_DIR / f"{name}.md"
    text = path.read_text()
    version_match = _VERSION_RE.search(text.split("---")[1] if "---" in text else "")
    return PromptTemplate(
        version=version_match.group(1) if version_match else "unknown",
        system=_extract_section(text, "System"),
        user_template=_extract_section(text, "User Prompt Template"),
    )


def load_knowledge(*names: str) -> str:
    """Concatenate knowledge documents by filename (without extension) for grounding."""
    chunks = []
    for name in names:
        path = KNOWLEDGE_DIR / f"{name}.md"
        if path.exists():
            chunks.append(path.read_text())
    return "\n\n".join(chunks)


def knowledge_version(*names: str) -> str:
    versions = []
    for name in names:
        path = KNOWLEDGE_DIR / f"{name}.md"
        if path.exists():
            match = _VERSION_RE.search(path.read_text())
            versions.append(f"{name}:{match.group(1) if match else 'unknown'}")
    return ",".join(versions)
