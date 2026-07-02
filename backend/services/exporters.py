"""Turns pipeline results into the two required deliverables:
a recruiter-usable CSV, and (bonus) a branded HTML summary view.

prds/01-prd.md §"Define the output": the output must be structured and usable
by a recruiter without additional processing - every column here is meant to
be read directly, not post-processed.
"""

from __future__ import annotations

import html
from pathlib import Path

import pandas as pd

from backend.models.candidate import JobOpening
from backend.models.pipeline_result import PipelineResult

_RECOMMENDATION_COLORS = {
    "Excellent Match": "#0B7A3E",
    "Strong Match": "#3B8F3B",
    "Potential Match": "#B8860B",
    "Needs Manual Review": "#6B7280",
    "Low Priority": "#B45309",
    "Do Not Contact": "#7A1F1F",
}

_BRAND_INK = "#0B0B0B"
_BRAND_ACCENT = "#D0F200"


def results_to_dataframe(results: list[PipelineResult]) -> pd.DataFrame:
    rows = []
    for rank, r in enumerate(results, start=1):
        li = r.candidate.linkedin
        connected_names = [e.split(" (")[0] for e in r.score.sub_score("mutual_connections").evidence]
        rows.append(
            {
                "rank": rank,
                "full_name": r.candidate.full_name,
                "email": r.candidate.attendee.email,
                "current_title": (li.current_title if li else r.candidate.attendee.title),
                "current_company": (li.current_company if li else r.candidate.attendee.company),
                "years_experience": li.years_experience if li else "",
                "overall_score": r.score.overall_score,
                "recommendation": r.score.recommendation,
                "confidence": r.score.confidence,
                "has_linkedin_match": r.candidate.has_linkedin,
                "domain_relevance": r.score.domain_relevance_multiplier,
                "missing_required_skills": "; ".join(r.score.missing_skills),
                "mutual_connections_count": len(connected_names),
                "mutual_connections": "; ".join(connected_names),
                "referral_suggestion": r.score.referral_suggestion,
                "conference_name": r.candidate.attendee.conference_name,
                "conference_domain": r.candidate.attendee.conference_domain,
                "linkedin_url": r.candidate.attendee.linkedin_url,
                "ai_summary": r.summary.content,
                "ai_recommendation_narrative": r.recommendation_narrative.content,
                "ai_source": r.summary.source,
            }
        )
    return pd.DataFrame(rows)


def write_csv(results: list[PipelineResult], path: str | Path) -> Path:
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    results_to_dataframe(results).to_csv(path, index=False)
    return path


def _badge(recommendation: str) -> str:
    color = _RECOMMENDATION_COLORS.get(recommendation, "#6B7280")
    return f'<span class="badge" style="background:{color}">{html.escape(recommendation)}</span>'


def _candidate_card(rank: int, r: PipelineResult) -> str:
    c = r.candidate
    li = c.linkedin
    title = html.escape((li.current_title if li else c.attendee.title) or "")
    company = html.escape((li.current_company if li else c.attendee.company) or "")
    linkedin_flag = "" if c.has_linkedin else '<span class="pill">No LinkedIn match</span>'
    missing = ", ".join(r.score.missing_skills) or "none"
    connections = len(r.score.sub_score("mutual_connections").evidence)

    return f"""
    <div class="card">
      <div class="card-header">
        <div>
          <span class="rank">#{rank}</span>
          <span class="name">{html.escape(c.full_name)}</span>
          {linkedin_flag}
        </div>
        {_badge(r.score.recommendation)}
      </div>
      <div class="card-sub">{title} @ {company} &middot; {html.escape(c.attendee.conference_name)}</div>
      <div class="score-row">
        <div class="score-big">{r.score.overall_score:.0f}<span class="score-max">/100</span></div>
        <div class="score-meta">confidence {r.score.confidence:.0%} &middot; {connections} mutual connection(s)</div>
      </div>
      <p class="summary">{html.escape(r.summary.content)}</p>
      <p class="narrative"><strong>Why:</strong> {html.escape(r.recommendation_narrative.content)}</p>
      <p class="missing"><strong>Missing required skills:</strong> {html.escape(missing)}</p>
      {f'<p class="referral"><strong>Warm intro:</strong> {html.escape(r.score.referral_suggestion)}</p>' if r.score.referral_suggestion else ""}
    </div>
    """


def write_html(job: JobOpening, results: list[PipelineResult], path: str | Path, logo_path: str | None = None) -> Path:
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)

    logo_html = (
        f'<img src="{html.escape(logo_path)}" alt="WSC Sports" class="logo" />'
        if logo_path
        else '<span class="logo-text">WSC SPORTS</span>'
    )
    cards = "\n".join(_candidate_card(i, r) for i, r in enumerate(results, start=1))

    doc = f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<title>Talent Intelligence Platform - {html.escape(job.title)}</title>
<style>
  :root {{ --ink: {_BRAND_INK}; --accent: {_BRAND_ACCENT}; }}
  * {{ box-sizing: border-box; }}
  body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; background: #fafafa; color: var(--ink); }}
  header {{ background: white; color: var(--ink); padding: 28px 40px; display: flex; align-items: center; gap: 18px; border-bottom: 1px solid #eee; }}
  header .logo {{ height: 22px; }}
  header .logo-text {{ font-weight: 800; letter-spacing: 1px; font-size: 15px; }}
  header h1 {{ font-size: 20px; margin: 0; font-weight: 600; }}
  header p {{ margin: 2px 0 0; opacity: .6; font-size: 13px; }}
  .accent-bar {{ height: 4px; background: var(--accent); }}
  main {{ max-width: 880px; margin: 0 auto; padding: 32px 24px 80px; }}
  .card {{ background: white; border: 1px solid #e5e7eb; border-radius: 12px; padding: 20px 22px; margin-bottom: 16px; }}
  .card-header {{ display: flex; justify-content: space-between; align-items: center; }}
  .rank {{ color: #9ca3af; font-weight: 700; margin-right: 8px; }}
  .name {{ font-weight: 700; font-size: 16px; }}
  .pill {{ background: #fef3c7; color: #92400e; font-size: 11px; padding: 2px 8px; border-radius: 10px; margin-left: 8px; }}
  .badge {{ color: white; font-size: 11px; font-weight: 700; padding: 4px 10px; border-radius: 6px; text-transform: uppercase; }}
  .card-sub {{ color: #555; font-size: 13px; margin: 6px 0 12px; }}
  .score-row {{ display: flex; align-items: baseline; gap: 12px; margin-bottom: 10px; }}
  .score-big {{ font-size: 28px; font-weight: 800; }}
  .score-max {{ font-size: 14px; color: #9ca3af; font-weight: 500; }}
  .score-meta {{ font-size: 12px; color: #6b7280; }}
  .summary, .narrative, .missing, .referral {{ font-size: 13px; margin: 6px 0; }}
  .referral {{ background: rgba(208,242,0,0.15); border-radius: 6px; padding: 6px 10px; }}
</style>
</head>
<body>
<header>
  {logo_html}
  <div>
    <h1>Candidate Recommendations - {html.escape(job.title)}</h1>
    <p>{html.escape(job.department)} &middot; {html.escape(job.seniority)} &middot; {len(results)} candidates evaluated</p>
  </div>
</header>
<div class="accent-bar"></div>
<main>
{cards}
</main>
</body>
</html>"""
    path.write_text(doc)
    return path
