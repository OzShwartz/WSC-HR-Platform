# 05 — System Architecture

## Layered Architecture

```
React (UI)
  ↓
API Layer
  ↓
Business Services        (deterministic rules, orchestrates AI + scoring)
  ↓
AI Services              (04-ai-architecture.md)
  ↓
Repository Layer         (data access abstraction)
  ↓
CSV Storage              (MVP) → SQLite / PostgreSQL / Azure SQL / AWS RDS (future)
```

The Repository Layer exists specifically so that swapping CSV for a real database later touches one layer, not the whole app — Business Services and AI Services never talk to storage directly.

## Technical Stack

**Frontend:** React, TypeScript, TailwindCSS, shadcn/ui, React Router, React Query, responsive design.

**Backend:** Python, FastAPI, Pandas, Pydantic, Service Layer, Repository Pattern.

**AI Layer:** Prompt Templates, Knowledge Base, Few-Shot Examples, Grounding, Guardrails, Confidence Scores, Explainability, with Future RAG and MCP support.

**Data Storage:** CSV files for the MVP; SQLite/PostgreSQL/Azure SQL/AWS RDS as production targets (see [12-roadmap.md](12-roadmap.md)).

## Non-Functional Requirements

Performance, maintainability, scalability, explainability, accessibility, modularity, configurability, security by design, production-ready architecture from day one — even while running locally against CSVs.

## Integrations

| Integration | MVP | Future |
|---|---|---|
| Candidate/Job data | CSV | HubSpot (contacts/marketing), Comeet (ATS webhook) |
| Professional enrichment | Mock LinkedIn CSV | LinkedIn API |
| Notifications | — | Slack, Microsoft Teams |
| Scheduling | — | Google Calendar, Microsoft Outlook |
| Extensibility | — | REST APIs, MCP servers |
| Storage/Compute | Local filesystem | Azure Storage, AWS S3, Vector Database |

Every integration, once live, is expected to expose: connection status, last sync timestamp, authentication status, health check, logs, and sync frequency — surfaced in Settings ([02-product-specification.md](02-product-specification.md)).

## Logging & Monitoring

- Audit Log (see below)
- AI Logs (prompt version, score version, knowledge version attached to every AI call)
- Performance metrics: latency, error rates

## Audit Log

Every meaningful action is logged: candidate created/updated/deleted, job created/updated, score changed, prompt changed, knowledge updated, settings changed, CSV imported/exported, AI summary generated.

## Error Handling

Failure modes the system must define explicit behavior for, rather than let surface as unhandled exceptions:

| Failure | Expected behavior |
|---|---|
| Missing LinkedIn match for a candidate | Keep the candidate; mark dependent sub-scores `insufficient_data`; lower overall confidence, not the score itself ([03-scoring-engine.md](03-scoring-engine.md)) |
| Malformed/broken CSV row | Skip the row, log it, continue processing the rest of the file — never abort the whole run |
| Prompt execution failure | Retry once, then fall back to a simpler prompt, then flag for human review ([04-ai-architecture.md](04-ai-architecture.md)) |
| LLM does not respond / times out | Same retry → fallback → human-review path; deterministic score is still returned since it never depended on the LLM |
| Invalid/non-conforming JSON from the LLM | Fails Response Validation; treated as a validation failure, not surfaced to the recruiter as-is |
| Duplicate candidate detected | Warn; offer merge, cancel, or continue (see Conference Registration, [02-product-specification.md](02-product-specification.md)) |
| Job posting missing required fields (e.g. no `required_skills`) | Reject at job-creation time with a clear validation message — never silently score candidates against an incomplete job definition |

## Why CI/CD Matters Even for a Local MVP

```
GitHub Flow → PR → Lint → Unit Tests → Build → Deploy
```

Even while the deploy target is "run locally," the pipeline is worth having from day one — it's the difference between an MVP that's structured to become production software and one that has to be rewritten to become production software. See [08-testing-strategy.md](08-testing-strategy.md).
