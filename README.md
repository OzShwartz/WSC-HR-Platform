# Talent Intelligence Platform (TIP)

**An AI-assisted talent pool platform that turns conference attendees into a queryable, explainable candidate pipeline.**

## Origin

This project is being built as a submission for the **AI Solution Manager** take-home recruitment task ([recruitment-task/index.html](recruitment-task/index.html)). The brief: design and build a system that captures conference attendees as talent leads, enriches them with LinkedIn data, and surfaces the right candidates when a role opens up — while automatically separating signal (genuine domain-relevant professionals) from noise (vendors, sales reps, unrelated attendees) without manual screening.

The repository is organized in three layers:

| Folder | Contents |
|---|---|
| [`recruitment-task/`](recruitment-task/) | The original assignment as received: task brief (`index.html`) and the mock source data (`data/*.csv`). Treated as read-only ground truth for scope and evaluation criteria. |
| [`PRDs/`](PRDs/) | Raw, unstructured design notes written while thinking through the problem (`prd0.md`–`prd4.md`). Kept as historical source material. |
| [`docs/`](docs/) | The structured design documentation derived from those notes — the actual spec this project is built against. Start here. |

## Status

Design phase complete. Implementation has not started yet — the next step is building the pipeline (and, time permitting, the surrounding app) described in these docs against the CSVs in `recruitment-task/data/`.

## Documentation Index

| Doc | What it covers |
|---|---|
| [00 — Project Constitution](docs/00-project-constitution.md) | The non-negotiable principles: AI assists, never decides; determinism is the source of truth; every AI output is explainable. |
| [01 — Product Requirements Document](docs/01-prd.md) | Background, business problem, vision, goals, personas, user journey, acceptance criteria. |
| [02 — Product Specification](docs/02-product-specification.md) | Module-by-module functional spec: Dashboard, Conference Registration, Candidate Pool, Jobs, Settings. |
| [03 — Scoring Engine](docs/03-scoring-engine.md) | The deterministic candidate-scoring model: components, weights, formulas, edge-case handling. |
| [04 — AI Architecture](docs/04-ai-architecture.md) | AI services/agents, execution pipeline, guardrails, validation, confidence, model independence. |
| [05 — System Architecture](docs/05-system-architecture.md) | Layered technical architecture, stack, storage, integrations, logging, error handling. |
| [06 — Folder Structure](docs/06-folder-structure.md) | Repository/codebase layout for the implementation. |
| [07 — Development Standards](docs/07-development-standards.md) | Naming, component/service rules, configuration-over-hardcoding. |
| [08 — Testing Strategy](docs/08-testing-strategy.md) | Test types, golden dataset, CI/CD pipeline. |
| [09 — Prompt Strategy](docs/09-prompt-strategy.md) | Prompt categories, context-window discipline, grounding, few-shot strategy. |
| [10 — Knowledge Base](docs/10-knowledge-base.md) | The externalized knowledge documents that ground every AI call. |
| [11 — Tradeoffs](docs/11-tradeoffs.md) | Key design tradeoffs and why this scope was chosen for a 1–2 day task. |
| [12 — Roadmap](docs/12-roadmap.md) | Phased plan from local MVP to cloud-native platform with live integrations. |

## Recruitment Task Deliverables Checklist

Per [recruitment-task/index.html](recruitment-task/index.html) §4:

- [ ] Working pipeline code, runnable against the provided CSVs, with setup instructions
- [ ] Output CSV for `JOB001` (Senior ML Engineer)
- [x] Design document — see [docs/](docs/), particularly [01-prd.md](docs/01-prd.md) and [11-tradeoffs.md](docs/11-tradeoffs.md)
- [x] Stated assumptions — see [03-scoring-engine.md](docs/03-scoring-engine.md) §Edge Cases & Assumptions and [11-tradeoffs.md](docs/11-tradeoffs.md)
- [ ] Executive summary for a non-technical audience

## Running the Pipeline

Not yet implemented. This section will be filled in with dependencies and run instructions once the pipeline is built.
