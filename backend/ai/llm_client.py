"""Model-agnostic LLM client abstraction - docs/04-ai-architecture.md ("Model Independence").

Business/AI services never import openai/anthropic directly - they call
`get_llm_client()` and get back either a working client or None. None means
"no key configured," and every agent in backend/ai/agents/ must have a
deterministic fallback for that case (docs/00-project-constitution.md: the
pipeline must work end-to-end with zero external API keys).

Swapping providers, or adding a new one, means editing this file only.
"""

from __future__ import annotations

import os
from typing import Protocol


class LLMClient(Protocol):
    model_name: str
    provider: str

    def complete(self, system: str, prompt: str) -> str:
        """Return the model's raw text completion for a single-turn prompt."""
        ...


class OpenAIClient:
    provider = "openai"

    def __init__(self, api_key: str, model: str = "gpt-4o-mini"):
        from openai import OpenAI  # imported lazily so the dependency is optional

        self._client = OpenAI(api_key=api_key)
        self.model_name = model

    def complete(self, system: str, prompt: str) -> str:
        response = self._client.chat.completions.create(
            model=self.model_name,
            messages=[
                {"role": "system", "content": system},
                {"role": "user", "content": prompt},
            ],
            temperature=0.2,
            max_tokens=400,
        )
        return (response.choices[0].message.content or "").strip()


class AnthropicClient:
    provider = "anthropic"

    def __init__(self, api_key: str, model: str = "claude-sonnet-4-5"):
        import anthropic  # imported lazily so the dependency is optional

        self._client = anthropic.Anthropic(api_key=api_key)
        self.model_name = model

    def complete(self, system: str, prompt: str) -> str:
        response = self._client.messages.create(
            model=self.model_name,
            max_tokens=400,
            temperature=0.2,
            system=system,
            messages=[{"role": "user", "content": prompt}],
        )
        return "".join(block.text for block in response.content if hasattr(block, "text")).strip()


def get_llm_client() -> LLMClient | None:
    """Returns a real LLM client if a key is configured in the environment, else None.

    Precedence: ANTHROPIC_API_KEY, then OPENAI_API_KEY. Model names can be
    overridden via ANTHROPIC_MODEL / OPENAI_MODEL env vars.
    """
    anthropic_key = os.getenv("ANTHROPIC_API_KEY")
    if anthropic_key:
        try:
            return AnthropicClient(anthropic_key, os.getenv("ANTHROPIC_MODEL", "claude-sonnet-4-5"))
        except ImportError:
            pass

    openai_key = os.getenv("OPENAI_API_KEY")
    if openai_key:
        try:
            return OpenAIClient(openai_key, os.getenv("OPENAI_MODEL", "gpt-4o-mini"))
        except ImportError:
            pass

    return None
