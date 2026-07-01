"""Small, dependency-free parsing helpers shared by repositories."""

from __future__ import annotations

import math


def split_list(raw: str | float | None, delimiter: str = ";") -> list[str]:
    """Parse a semicolon-delimited CSV cell into a clean list of strings.

    Handles the two ways pandas represents "empty": NaN (float) and "".
    """
    if raw is None:
        return []
    if isinstance(raw, float) and math.isnan(raw):
        return []
    text = str(raw).strip()
    if not text:
        return []
    return [part.strip() for part in text.split(delimiter) if part.strip()]


def to_optional_float(raw) -> float | None:
    if raw is None:
        return None
    if isinstance(raw, float) and math.isnan(raw):
        return None
    text = str(raw).strip()
    if not text:
        return None
    try:
        return float(text)
    except ValueError:
        return None


def clean_str(raw) -> str:
    if raw is None:
        return ""
    if isinstance(raw, float) and math.isnan(raw):
        return ""
    return str(raw).strip()
