# 11 - Tradeoffs

The recruitment task explicitly asks for the reasoning behind the approach - this doc is that reasoning made explicit, so design choices scattered across the other docs don't read as arbitrary.

## 1. Full platform design vs. a focused pipeline

The recruitment brief asks for a pipeline: take CSVs in, take a `job_id`, produce a structured, usable output. The design docs in this project ([02-product-specification.md](02-product-specification.md) onward) describe a full five-module platform (Dashboard, Registration, Candidate Pool, Jobs, Settings, AI Center).

**Why design the bigger thing anyway:** the brief's evaluation criteria explicitly reward "explains why each step exists and what real integrations would replace the CSV mocks" and "what the pipeline would look like at scale" - i.e. it's testing product/architecture thinking, not just script-writing. Designing the target platform first, then implementing the pipeline slice that the take-home window actually allows, produces a better-justified pipeline than designing the pipeline in isolation would.

**The risk this creates:** over-scoping a 1–2 day deliverable. The original mitigation was to treat [02-product-specification.md](02-product-specification.md) as target-state context only, and ship just the pipeline for the take-home window. In practice, the full build went further than that: the deterministic pipeline, a FastAPI backend, and a working React app (Dashboard, Candidate Pool, Jobs, WSC Team, Settings) all ended up built and running end-to-end, not just designed. That was a deliberate scope call made explicitly during the build, not scope creep - the required deliverable (pipeline + `JOB001` CSV output + this design document) was finished first and is unaffected either way; the app is additive on top of it.

## 2. Deterministic scoring vs. AI scoring

The scoring engine ([03-scoring-engine.md](03-scoring-engine.md)) is 100% rule-based; the LLM only narrates results.

**Why:** a pure LLM-scored candidate ranking is not reproducible, not auditable, and not defensible to a candidate who asks why they weren't contacted. A recruiting tool that can't explain its own ranking is a liability, not a feature - this is the single most important design decision in the project and it's stated as a constitutional rule ([00-project-constitution.md](00-project-constitution.md)), not just a preference.

**Cost of this choice:** deterministic rules can't capture nuance an LLM might catch (e.g. an unusually-worded but strong profile). This is accepted deliberately - the AI Confidence Modifier and AI-generated summary exist precisely to surface that nuance *alongside* the score, without letting it silently override the score.

## 3. Domain relevance as a separate signal from conference relevance

It would be simpler to assume "attended a relevant conference → relevant candidate." The brief's whole premise is that this assumption is false (IT managers/vendors at a DevOps conference). Domain Match and Conference Relevance are therefore kept as two separate, independently-weighted sub-scores rather than one combined "conference fit" score - see [03-scoring-engine.md](03-scoring-engine.md).

## 4. CSV mocks vs. live integrations

**Why CSV for the MVP:** the brief explicitly forbids connecting to live LinkedIn/HubSpot/Comeet accounts. Beyond that constraint, CSV keeps the pipeline runnable by anyone with no credentials, which is the actual evaluation format.

**Production replacement, mapped 1:1:**
- `conference_attendees.csv` → HubSpot contacts/lists API (badge-scan or lead-capture integration feeding HubSpot directly)
- `linkedin_profiles.csv` → LinkedIn (Talent/Sales Navigator API, or a licensed enrichment vendor, since LinkedIn's own API access for this use case is restricted)
- `wsc_employees.csv` → HR system / internal directory API
- `job_openings.csv` → Comeet API (jobs are already there - no duplicate data entry)

This mapping is why the Repository Pattern ([06-folder-structure.md](06-folder-structure.md)/[07-development-standards.md](07-development-standards.md)) exists - swapping CSV for these APIs should be a repository-layer change, not a rewrite of scoring or AI logic.

## 5. Batch pipeline vs. real-time capture

**MVP:** recruiter-triggered batch run against a `job_id`.

**Why not real-time for the MVP:** real-time only pays off once capture (badge scans, HubSpot forms) is itself real-time - building real-time scoring against a batch-exported CSV mock would be solving a problem the current data can't actually exercise. Real-time is the right target for production (see [12-roadmap.md](12-roadmap.md)), not for this deliverable.

## 6. What was deprioritized for this submission

- **Comeet cross-referencing** (flagging previously-rejected candidates) - no ATS data is provided in the mock set, so this is designed for (`comeet_status` field reserved, [03-scoring-engine.md](03-scoring-engine.md) Q4) but not implemented against real data.
- **Education scoring** - the provided LinkedIn mock has no education field; rather than fabricate a scoring input the data can't support, it's a documented no-op weight.
- **GDPR/data-retention implementation** - addressed as a design requirement ([05-system-architecture.md](05-system-architecture.md)), not as working code, since there's no real personal data in scope for this task.
- **Auth/RBAC, CI/CD, live LinkedIn/HubSpot/Comeet integrations, conference registration intake form** - all explicitly deferred to the roadmap ([12-roadmap.md](12-roadmap.md)); the app itself was built beyond the brief's minimum ask (see §1 above), but these specific pieces were a deliberate line drawn to keep the submission finishable.

## 7. At scale - hundreds of conferences, thousands of contacts

The current build works well for the actual take-home data (75 candidates, 4 conferences, 5 jobs) precisely because it isn't yet solving for scale. Here's what would actually have to change:

**Storage & scoring compute.** Today, `list_candidate_pool()` re-scores every candidate against every job on every request, straight from CSV files read fresh each time. That's fine at 75×5; it doesn't survive thousands of candidates × hundreds of open jobs. Production needs the `candidate_job_scores` table from the ERD ([presentation/erd-diagram.png](../presentation/erd-diagram.png)) populated by an async event, not a synchronous request: score a candidate against all open jobs once when they're captured, score all candidates against a job once when it opens, and serve reads from that cache. Recomputation only happens when a job's requirements or the scoring weights change.

**Matching quality.** Exact-string skill/domain matching (chosen deliberately here for transparency and auditability, per [00-project-constitution.md](00-project-constitution.md)) doesn't hold up as vocabulary grows across hundreds of conferences and industries - today's `skill_synonyms` config is a handful of manually-maintained pairs (`k8s` → `kubernetes`); at scale that list is unmaintainable by hand. This is precisely why [12-roadmap.md](12-roadmap.md) Phase 4 calls for embeddings/vector search for skill and domain similarity - as an additional *signal* the deterministic engine weighs in, not a replacement for it.

**Identity resolution.** At scale the same person turns up at multiple conferences over multiple years. Today every attendee row is independent; production needs deduplication (email or LinkedIn URL first, fuzzy name+company as a fallback) so a candidate's history accumulates instead of fragmenting into duplicate records across conferences.

**Ingestion.** Enrichment (LinkedIn, HubSpot) moves from "assume it already happened" (today's CSV mock) to rate-limited, queued batch jobs - bulk-enriching thousands of contacts synchronously isn't realistic against real API rate limits.

**Search & UI.** The Candidate Pool page loads the whole pool into the browser and filters client-side - correct at 75 rows, wrong at tens of thousands. That becomes server-side pagination and filtering against indexed Postgres (or a dedicated search index), not "ship everything to the client."

**AI cost.** Already a stated principle in [04-ai-architecture.md](04-ai-architecture.md) (cache responses, minimal context, batch requests) - it matters more as volume grows, not less: batching summary generation and reusing cached summaries for unchanged candidates is the difference between a reasonable LLM bill and a runaway one at thousands of contacts.

## 8. What's answered vs. genuinely open among the brief's 7 assumption questions

Answered with a concrete mechanism: domain relevance (§1), missing LinkedIn handling (§2), mutual-connection weighting (§3). Answered as a design position without implementation: ATS flagging (§4), refresh cadence (§5), trigger ownership (§6). Flagged as needing a real compliance/legal decision rather than an engineering one: GDPR handling at scale (§7) - this is deliberately not something to guess at in a take-home task.
