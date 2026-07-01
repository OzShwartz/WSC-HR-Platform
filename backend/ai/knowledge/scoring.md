---
version: v1
---

# Scoring Rules (grounding summary for the AI layer)

The deterministic scoring engine (backend/services/scoring_engine.py) is the
single source of truth for every candidate's numeric score. The AI layer must
never invent a different score, weight, or ranking — it only narrates the
scores and sub-scores it is given.

Sub-scores and what they mean:

- **skills** — overlap between the candidate's LinkedIn skills and the job's
  required / nice-to-have skills.
- **experience** — years of experience vs. the band expected for the job's
  seniority level.
- **title** — similarity between the candidate's current title and the job
  title.
- **industry** — overlap between the candidate's industry and the job's
  domain.
- **mutual_connections** — WSC employees the candidate is connected to on
  LinkedIn, with diminishing returns per additional connection.
- **conference_relevance** — how well the conference the candidate was met at
  matches the job's domain.
- **domain_relevance_gate** — not a weighted score on its own; a multiplier
  applied to skills/title/industry that dampens candidates whose title reads
  as an adjacent, non-technical role (recruiter, sales, vendor, IT support)
  even if they attended a relevant conference.

A candidate with `insufficient_data: true` on a sub-score had no LinkedIn
match (or no data for that specific field) — the AI should say so plainly
rather than implying the missing data was itself a negative signal.
