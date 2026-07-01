# Talent Intelligence Platform (TIP)

**An AI-assisted talent pool platform that turns conference attendees into a queryable, explainable candidate pipeline.**

## Origin

This project is being built as a submission for the **AI Solution Manager** take-home recruitment task ([recruitment-task/index.html](recruitment-task/index.html)). The brief: design and build a system that captures conference attendees as talent leads, enriches them with LinkedIn data, and surfaces the right candidates when a role opens up — while automatically separating signal (genuine domain-relevant professionals) from noise (vendors, sales reps, unrelated attendees) without manual screening.

The repository is organized as:

| Folder | Contents |
|---|---|
| [`recruitment-task/`](recruitment-task/) | The original assignment as received: task brief (`index.html`) and the mock source data (`data/*.csv`). Treated as read-only ground truth for scope and evaluation criteria. |
| [`docs/`](docs/) | The structured design documentation this project is built against. Start here. |
| [`backend/`](backend/) | The working pipeline — repositories, deterministic scoring engine, AI agents, CLI runner. See "Running the Pipeline" below. |
| [`brand/`](brand/) | WSC Sports brand reference (logo, colors) used in the HTML recruiter report. |
| [`output/`](output/) | Generated CSV/HTML outputs per job (checked in per the "Output CSV" deliverable). |

> **Note:** a `PRDs/` folder with the raw design notes this project started from existed earlier in this repo's history but disappeared from disk outside of any action taken here — its content is fully preserved in `docs/`, but the original files themselves are gone.

## Status

Core pipeline is implemented and working end-to-end against the provided CSVs (see `backend/`). Not yet built: the API layer and the full React frontend described in [02-product-specification.md](docs/02-product-specification.md) — those are the next phases per [11-tradeoffs.md](docs/11-tradeoffs.md).

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

- [x] Working pipeline code, runnable against the provided CSVs, with setup instructions — see below
- [x] Output CSV for `JOB001` (Senior ML Engineer) — [output/JOB001_candidates.csv](output/JOB001_candidates.csv)
- [x] Design document — see [docs/](docs/), particularly [01-prd.md](docs/01-prd.md) and [11-tradeoffs.md](docs/11-tradeoffs.md)
- [x] Stated assumptions — see [03-scoring-engine.md](docs/03-scoring-engine.md) §Edge Cases & Assumptions and [11-tradeoffs.md](docs/11-tradeoffs.md)
- [ ] Executive summary for a non-technical audience

## Running the Pipeline

Requires Python 3.11+.

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r backend/requirements.txt

# Optional — enables real LLM calls for summaries/recommendations.
# Without this, the pipeline runs fully on deterministic fallback narratives.
cp .env.example .env   # then fill in ANTHROPIC_API_KEY or OPENAI_API_KEY

python -m backend.run_pipeline --job-id JOB001 --html
```

This writes `output/JOB001_candidates.csv` (the required deliverable) and, with `--html`, a branded recruiter-facing summary at `output/JOB001_report.html`. Swap `JOB001` for `JOB002`/`JOB003`/`JOB004` to try other openings.

Run the test suite (scoring-engine edge cases — docs/08-testing-strategy.md):

```bash
python -m pytest backend/tests/
```

### How the AI layer behaves without a key

Every AI narrative (candidate summary, recommendation explanation) is generated by an LLM if `ANTHROPIC_API_KEY` or `OPENAI_API_KEY` is set in `.env`, and falls back to a deterministic template built directly from the same score breakdown if not. The `ai_source` column in the output CSV shows which path was used for each row. The deterministic scoring itself (`overall_score`, `recommendation`) never depends on an LLM either way — see [docs/00-project-constitution.md](docs/00-project-constitution.md).
