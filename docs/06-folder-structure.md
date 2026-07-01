# 06 - Folder Structure

Repository layout for the implementation, aligned to the layers in [05-system-architecture.md](05-system-architecture.md) and the rules in [07-development-standards.md](07-development-standards.md).

```
src/
  app/            # app shell, routing, providers
  components/     # reusable, presentation-only UI building blocks
  pages/          # route-level views composed from components
  layouts/        # shared page chrome (nav, dashboard shell, etc.)
  hooks/          # reusable React hooks
  contexts/       # React context providers (theme, auth, etc.)
  services/       # frontend-side API clients, orchestration
  repositories/   # frontend data-access abstractions (if needed)
  ai/
    agents/       # per-agent orchestration (classification, matching, etc. - 04-ai-architecture.md)
    knowledge/    # local cache/reference of knowledge docs - 10-knowledge-base.md
    prompts/      # prompt templates - 09-prompt-strategy.md
  config/         # runtime configuration (scoring weights, thresholds, feature flags)
  constants/      # static enums/lookups (statuses, tag lists, etc.)
  types/          # shared TypeScript types
  utils/          # pure helper functions
  assets/         # static assets
  tests/          # frontend test suites - 08-testing-strategy.md
  docs/           # this documentation set

backend/
  api/            # FastAPI route definitions (API Layer)
  services/       # Business Services - deterministic logic, orchestrates scoring + AI
  repositories/   # Repository Pattern - CSV today, DB-backed later
  models/         # domain models
  schemas/        # Pydantic request/response schemas
  utils/          # pure helper functions
  tests/          # backend test suites - 08-testing-strategy.md
```

## Rationale

- `ai/` is isolated from `services/` so that swapping a prompt or an LLM provider never touches business logic - enforcing the AI/business-logic separation from [00-project-constitution.md](00-project-constitution.md).
- `repositories/` on both frontend and backend exist so CSV-to-database migration ([12-roadmap.md](12-roadmap.md)) is a repository-layer change, not an application-wide rewrite.
- `config/` and `constants/` are split deliberately: `config/` holds values an HR Manager can change at runtime (scoring weights, thresholds); `constants/` holds values that only change with a code release (status enums, tag vocabularies).
- `prompts/` and `knowledge/` are plain files, not code, so they can be edited and versioned independently of an application deploy.
