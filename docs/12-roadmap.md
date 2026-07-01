# 12 — Roadmap

Phased path from the local CSV-based MVP to a cloud-native platform with live integrations, per the architecture in [05-system-architecture.md](05-system-architecture.md).

## Phase 1 — MVP (current)

Local, CSV-driven pipeline: deterministic scoring engine, AI classification/summary/recommendation against mock data, single-`job_id` runs, optional CLI/HTML recruiter view. Covered by [01-prd.md](01-prd.md) through [10-knowledge-base.md](10-knowledge-base.md).

## Phase 2 — Real Integrations & Access Control

- Authentication and RBAC (Recruiter / HR Manager / Admin, per [01-prd.md](01-prd.md) personas).
- **HubSpot integration** — conference attendees captured as HubSpot contacts/lists directly, replacing `conference_attendees.csv`.
- **LinkedIn integration** — licensed API or enrichment vendor, replacing `linkedin_profiles.csv`, with a defined refresh cadence (addresses [11-tradeoffs.md](11-tradeoffs.md) §5).
- **Comeet integration** — webhook-based sync so ATS status (e.g. previously rejected) flags candidates automatically ([03-scoring-engine.md](03-scoring-engine.md) Q4).

## Phase 3 — Cloud Deployment

- Containerization (Docker), CI/CD via GitHub Actions ([08-testing-strategy.md](08-testing-strategy.md)).
- Cloud deployment target (Azure or AWS), with storage migrating from CSV to a managed database (SQLite → PostgreSQL / Azure SQL / AWS RDS, per [05-system-architecture.md](05-system-architecture.md)).

## Phase 4 — Intelligence at Scale

- Vector database + semantic search — candidate search by meaning, not just keyword/field match.
- Live AI Copilot — conversational interface over the candidate pool for recruiters.
- Automatic candidate enrichment on ingestion, rather than on-demand batch runs.
- Email automation and calendar integration (Outlook/Google Calendar) for outreach scheduling.
- MCP server support and Slack/Teams notifications, per [05-system-architecture.md](05-system-architecture.md) integrations table.

## Design Constraint Across All Phases

Every phase must be reachable without a fundamental architectural rewrite — this is why the Repository Pattern, Service Layer, and AI/business-logic separation ([00-project-constitution.md](00-project-constitution.md), [06-folder-structure.md](06-folder-structure.md), [07-development-standards.md](07-development-standards.md)) are enforced from Phase 1, not deferred until they're needed.
