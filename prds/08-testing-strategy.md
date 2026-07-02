# 08 - Testing Strategy

Testing is one of the most commonly under-invested areas in projects like this one - it's called out here deliberately so it doesn't get treated as an afterthought once the scoring/AI pieces feel "done."

## Test Types

- **Unit Tests** - pure functions: scoring math, normalization, validation helpers.
- **Integration Tests** - full request paths through API → Business Service → Repository.
- **Scoring Tests** - the deterministic scoring engine ([03-scoring-engine.md](03-scoring-engine.md)) is the system's source of truth, so it gets its own dedicated test category: known inputs must always produce the same, hand-verifiable output. This is the single highest-value test category in the project - if the score is wrong, every downstream recommendation is wrong regardless of how good the AI layer is.
- **AI Tests** - verify prompt output shape and Guardrails/Validation behavior, not "is the LLM smart," using the Golden Dataset below.
- **Regression Tests** - re-run past known-good scenarios after any scoring, prompt, or knowledge-base change to confirm nothing shifted unexpectedly.
- **Golden Dataset** - a fixed, hand-labeled set of candidates with known-correct scores/classifications/recommendations, used to catch silent drift in both scoring logic and AI output.
- **Prompt Validation** - every prompt template is tested against the Golden Dataset before a new prompt version ships.
- **Knowledge Validation** - knowledge documents ([10-knowledge-base.md](10-knowledge-base.md)) are checked for staleness/contradiction as part of CI, since bad grounding data silently degrades every AI response that depends on it.
- **UI Tests** - critical flows only (registration, search, job matching view), not exhaustive coverage.

## CI/CD

```
GitHub Flow → PR → Lint → Unit Tests → Build → Deploy
```

This pipeline is worth having even while "Deploy" just means running locally - a project that never had CI/CD bolted on retroactively is materially easier to actually take to production later, and the discipline itself (lint + tests gating every PR) is what keeps the scoring engine and prompts from silently drifting as the codebase grows.
