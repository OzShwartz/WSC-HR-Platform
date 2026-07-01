# 03 — Candidate Scoring Engine

## Philosophy

Candidate evaluation must never rely on a single score. Every recommendation is composed of multiple transparent sub-scores, each independently configurable and deterministically calculated. Per [00-project-constitution.md](00-project-constitution.md): **AI never calculates scores — it only explains them.**

## Overall Score

```
Overall Score =
    Experience Score          × Experience Weight
  + Skills Score               × Skills Weight
  + Title Similarity Score     × Title Weight
  + Domain Match Score         × Domain Weight
  + Industry Match Score       × Industry Weight
  + Conference Relevance Score × Conference Weight
  + Mutual Connections Score   × Connections Weight
  + Education Score            × Education Weight
  + Recruiter Feedback         × Feedback Weight
  (all weights configurable per job in Settings; always sum to 100%)
```

**Default weight configuration** (from [02-product-specification.md](02-product-specification.md) — Settings):

| Component | Default Weight |
|---|---|
| Skills | 25% |
| Experience | 20% |
| Title Similarity | 15% |
| Industry Match | 10% |
| Mutual Connections | 10% |
| Conference Relevance | 10% |
| Education | 5% |
| Recruiter Feedback | 5% |
| **Total** | **100%** |

Domain Match is treated as a **gate feeding into the model**, not a bolt-on weight (see Domain Relevance below) — it primarily modulates the Title/Skills/Industry inputs rather than acting as a fully independent tenth line item, since "does this person actually belong to the target domain" is really the aggregate question the whole score is trying to answer.

Changing any weight in Settings recalculates all candidate scores for that job automatically.

## Sub-Score Definitions

**Experience Score** — years of experience (`years_experience` in `linkedin_profiles.csv`), relevant experience (overlap between `past_titles`/`past_companies` and the job's domain), leadership/management signal in title history, and career progression trend.

**Skills Score** — overlap between candidate `top_skills` and the job's `required_skills` (primary weight) and `nice_to_have` (secondary weight), normalized for skill-list length so a candidate with many loosely-related skills doesn't outscore a tight match. Missing required skills are surfaced explicitly, not silently penalized into an unexplained low score.

**Title Match** — string/semantic similarity between `title` (current), `current_title` (LinkedIn), and historical titles (`past_titles`) vs. the job's `title` and `key_domains`.

**Domain Match** — the core signal-vs-noise mechanism (see below). Determines whether the candidate genuinely belongs to the professional domain the job (and the conference) requires, e.g. ML Engineer / AI Researcher / Data Scientist / Platform Engineer / DevOps vs. IT Manager / Sales Engineer / Recruiter / Consultant.

**Industry Match** — candidate's current and past industries (`industry`, `past_companies` in `linkedin_profiles.csv`) vs. the job's domain (e.g. "Sports Technology" vs. general enterprise software).

**Mutual Connections** — parses `wsc_mutual_connections` (semicolon-separated WSC employee IDs) against `wsc_employees.csv`, weighted by connection count, connected employee's seniority/department relevance, and referral potential (see Edge Cases below for exactly how count is treated).

**Conference Relevance** — how well the conference the candidate was met at (`conference_name`/`conference_domain` in `conference_attendees.csv`) matches the job's `key_domains`, plus any speaker/activity signal from `notes`/`source`.

**Education** — degree level and field relevance where available (not present in the current CSV mock — treated as a zero-weight/no-op component until an education data source exists, rather than penalizing every candidate for missing data the pipeline was never given).

**Recruiter Feedback** — a bounded manual adjustment a recruiter can apply after reviewing a candidate. Deliberately capped to a small maximum delta so it can nudge, not override, the deterministic score.

**AI Confidence Modifier** — not a scoring input but an overlay: the AI Classification Agent's confidence in its own domain/seniority read is displayed alongside the score, so a recruiter can see when a high score rests on an uncertain classification.

## Explainability of Every Score

Each sub-score, and the overall score, carries:

- Raw Value
- Weighted Value
- Reasoning
- Evidence
- Supporting Data
- Confidence

## Edge Cases & Assumptions (Recruitment Task §5)

These map directly to the assumption questions posed in the recruitment brief:

1. **How is "domain relevance" defined?** Domain Match is computed deterministically from structured fields already present in the mock data — `title`, `current_title`, `past_titles`, `top_skills`, `industry`, and `conference_domain` — matched against the job's `key_domains`. A title/skill vocabulary maps professional roles to domains (e.g. "SRE," "Platform Engineer," "Cloud Engineer" → Infrastructure/DevOps domain), so an IT Manager or vendor rep at a DevOps conference scores low on Domain Match even though their Conference Relevance is high — the two signals are kept separate specifically so conference attendance alone can never fake domain fit.
2. **Candidate with no LinkedIn match:** kept, never silently dropped. Skills, Title, Industry, and Mutual Connections scores fall back to whatever the conference-attendee record alone provides (title, company, notes), the missing sub-scores are marked `insufficient_data` rather than defaulted to zero, and the Overall Score is flagged with a lower confidence rather than penalized as if the missing data were a negative signal.
3. **Mutual connections — count vs. presence:** the number matters. Score scales with connection count up to a diminishing-returns cap (so 3 connections outscores 1, but 10 doesn't outscore 3 by 3.3x — the marginal value of each additional connection past the first couple is small), and is further weighted by the seniority/department of the connected WSC employee(s).
4. **Candidates already in the ATS (Comeet):** out of scope for the CSV-based MVP (no ATS data is provided), but the design reserves a `comeet_status` field for this exact purpose — see [11-tradeoffs.md](11-tradeoffs.md) and [12-roadmap.md](12-roadmap.md). Previously-rejected candidates should be flagged distinctly rather than silently re-surfaced.
5. **Refresh cadence:** MVP is a batch job run per job_id on demand. Production design targets re-running enrichment/scoring after every conference import, not a fixed schedule — see [11-tradeoffs.md](11-tradeoffs.md).
6. **Trigger:** MVP is recruiter-triggered (manual run against a `job_id`). Production trigger options are discussed in [12-roadmap.md](12-roadmap.md).
7. **Privacy/GDPR:** addressed at the architecture level in [05-system-architecture.md](05-system-architecture.md) and [11-tradeoffs.md](11-tradeoffs.md) — this doc only notes that LinkedIn-derived fields are treated as personal data requiring a lawful basis and retention policy in any live deployment.
