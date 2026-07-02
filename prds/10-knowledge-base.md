# 10 - Knowledge Base

The knowledge base is how the platform grounds AI reasoning in real business context, per [00-project-constitution.md](00-project-constitution.md) ("knowledge must be externalized") and [04-ai-architecture.md](04-ai-architecture.md) (the Knowledge Agent and grounding step).

## Purpose

Provide the AI layer with structured company and domain knowledge that lives outside prompts and outside code, so it can be reviewed, versioned, and updated by an HR Manager without a deploy.

## Knowledge Documents

| File | Purpose |
|---|---|
| `company.md` | Company Overview - who WSC Sports is, for context in candidate-facing summaries |
| `recruitment.md` | Hiring Philosophy & Recruitment Guidelines - how the company wants candidates evaluated |
| `scoring.md` | Scoring Rules - the human-readable explanation of [03-scoring-engine.md](03-scoring-engine.md), used to keep AI narratives consistent with the deterministic engine |
| `job-guidelines.md` | Job Definitions - how roles/departments/seniority levels are structured |
| `skills.md` | Skill Definitions - canonical skill vocabulary and synonyms (e.g. "K8s" = "Kubernetes") |
| `titles.md` | Title normalization map - how raw job titles map to normalized domains/seniority |
| `department-guidelines.md` | Department Definitions |
| `conference-guidelines.md` | Conference Types - how each conference type/domain maps to expected professional domains |
| `best-practices.md` | General recruiting best practices to keep AI recommendations aligned with team norms |
| `examples.md` / `few-shot-examples.md` | Prompt Examples & Few-Shot Examples - representative labeled cases per [09-prompt-strategy.md](09-prompt-strategy.md) |
| `guardrails.md` | The explicit rules the Validation Agent checks AI output against |

## Versioning

Every knowledge document is versioned. The version of every document used to ground a given AI response is attached to that response's output (`knowledge_version`), so a recruiter - or a future audit - can always reconstruct exactly what the AI knew when it produced a given recommendation.

## How It's Used

1. The Knowledge Agent retrieves the subset of documents relevant to the current task (e.g. `scoring.md` + `titles.md` for a classification call - not the entire knowledge base).
2. Retrieved content is attached to the prompt as grounding context ([09-prompt-strategy.md](09-prompt-strategy.md)).
3. The Validation Agent checks the AI's output against `guardrails.md` before it reaches a recruiter.

## Maintenance

Knowledge documents are subject to Knowledge Validation in CI ([08-testing-strategy.md](08-testing-strategy.md)) - stale or contradictory knowledge degrades every AI response that depends on it, silently, so drift here is treated as seriously as a failing unit test.
