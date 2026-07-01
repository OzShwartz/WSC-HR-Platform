# 11 — Tradeoffs

The recruitment task explicitly asks for the reasoning behind the approach — this doc is that reasoning made explicit, so design choices scattered across the other docs don't read as arbitrary.

## 1. Full platform design vs. a focused pipeline

The recruitment brief asks for a pipeline: take CSVs in, take a `job_id`, produce a structured, usable output. The design docs in this project ([02-product-specification.md](02-product-specification.md) onward) describe a full five-module platform (Dashboard, Registration, Candidate Pool, Jobs, Settings, AI Center).

**Why design the bigger thing anyway:** the brief's evaluation criteria explicitly reward "explains why each step exists and what real integrations would replace the CSV mocks" and "what the pipeline would look like at scale" — i.e. it's testing product/architecture thinking, not just script-writing. Designing the target platform first, then implementing the pipeline slice that the take-home window actually allows, produces a better-justified pipeline than designing the pipeline in isolation would.

**The risk this creates:** over-scoping a 1–2 day deliverable. The mitigation is explicit in [01-prd.md](01-prd.md) §3 — the actual deliverable is the pipeline; everything else in [02-product-specification.md](02-product-specification.md) is target-state context, not a implementation commitment for the take-home window itself.

## 2. Deterministic scoring vs. AI scoring

The scoring engine ([03-scoring-engine.md](03-scoring-engine.md)) is 100% rule-based; the LLM only narrates results.

**Why:** a pure LLM-scored candidate ranking is not reproducible, not auditable, and not defensible to a candidate who asks why they weren't contacted. A recruiting tool that can't explain its own ranking is a liability, not a feature — this is the single most important design decision in the project and it's stated as a constitutional rule ([00-project-constitution.md](00-project-constitution.md)), not just a preference.

**Cost of this choice:** deterministic rules can't capture nuance an LLM might catch (e.g. an unusually-worded but strong profile). This is accepted deliberately — the AI Confidence Modifier and AI-generated summary exist precisely to surface that nuance *alongside* the score, without letting it silently override the score.

## 3. Domain relevance as a separate signal from conference relevance

It would be simpler to assume "attended a relevant conference → relevant candidate." The brief's whole premise is that this assumption is false (IT managers/vendors at a DevOps conference). Domain Match and Conference Relevance are therefore kept as two separate, independently-weighted sub-scores rather than one combined "conference fit" score — see [03-scoring-engine.md](03-scoring-engine.md).

## 4. CSV mocks vs. live integrations

**Why CSV for the MVP:** the brief explicitly forbids connecting to live LinkedIn/HubSpot/Comeet accounts. Beyond that constraint, CSV keeps the pipeline runnable by anyone with no credentials, which is the actual evaluation format.

**Production replacement, mapped 1:1:**
- `conference_attendees.csv` → HubSpot contacts/lists API (badge-scan or lead-capture integration feeding HubSpot directly)
- `linkedin_profiles.csv` → LinkedIn (Talent/Sales Navigator API, or a licensed enrichment vendor, since LinkedIn's own API access for this use case is restricted)
- `wsc_employees.csv` → HR system / internal directory API
- `job_openings.csv` → Comeet API (jobs are already there — no duplicate data entry)

This mapping is why the Repository Pattern ([06-folder-structure.md](06-folder-structure.md)/[07-development-standards.md](07-development-standards.md)) exists — swapping CSV for these APIs should be a repository-layer change, not a rewrite of scoring or AI logic.

## 5. Batch pipeline vs. real-time capture

**MVP:** recruiter-triggered batch run against a `job_id`.

**Why not real-time for the MVP:** real-time only pays off once capture (badge scans, HubSpot forms) is itself real-time — building real-time scoring against a batch-exported CSV mock would be solving a problem the current data can't actually exercise. Real-time is the right target for production (see [12-roadmap.md](12-roadmap.md)), not for this deliverable.

## 6. What was deprioritized for this submission

- **Comeet cross-referencing** (flagging previously-rejected candidates) — no ATS data is provided in the mock set, so this is designed for (`comeet_status` field reserved, [03-scoring-engine.md](03-scoring-engine.md) Q4) but not implemented against real data.
- **Education scoring** — the provided LinkedIn mock has no education field; rather than fabricate a scoring input the data can't support, it's a documented no-op weight.
- **GDPR/data-retention implementation** — addressed as a design requirement ([05-system-architecture.md](05-system-architecture.md)), not as working code, since there's no real personal data in scope for this task.
- **Full UI (Dashboard/Settings/etc.)** — per the brief's own "bonus" framing, a simple HTML/CLI recruiter-facing summary view is the actual target for this submission, not the full React app described in [02-product-specification.md](02-product-specification.md).

## 7. What's answered vs. genuinely open among the brief's 7 assumption questions

Answered with a concrete mechanism: domain relevance (§1), missing LinkedIn handling (§2), mutual-connection weighting (§3). Answered as a design position without implementation: ATS flagging (§4), refresh cadence (§5), trigger ownership (§6). Flagged as needing a real compliance/legal decision rather than an engineering one: GDPR handling at scale (§7) — this is deliberately not something to guess at in a take-home task.
