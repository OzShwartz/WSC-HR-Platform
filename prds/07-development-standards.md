# 07 - Development Standards

## Naming Conventions

- **PascalCase** - components, classes, types.
- **camelCase** - variables, functions, hooks.
- **UPPER_CASE** - constants, enum-like literals.

## Component Rules

- One responsibility per component.
- No business logic inside UI components - components render state and emit events; they never calculate scores, filter data, or call the LLM directly.
- Reusable by default - a component built for one page should still work if reused on another.

## Service Rules

- Stateless - a service call's output depends only on its inputs, never on hidden internal state.
- Independent - a service should be callable and testable in isolation from the rest of the app.
- Business Services orchestrate Repository + AI Service calls, following the layering in [05-system-architecture.md](05-system-architecture.md); they never bypass a layer.

## Architectural Patterns in Use

- **Service Layer** - all business logic behind services, never in route handlers or UI components.
- **Repository Pattern** - all data access behind repositories, so storage can change without touching services.
- **Dependency Injection** - services and repositories are injected, not constructed ad hoc, so they can be swapped/mocked in tests.
- **Config Layer** - runtime-configurable values (scoring weights, AI thresholds) are read from config, never hardcoded - see [06-folder-structure.md](06-folder-structure.md).

## Prompt Rules

- No prompts inside application code.
- Prompts live in Markdown, outside the codebase's logic files - see [09-prompt-strategy.md](09-prompt-strategy.md).

## Configuration Rules

- Everything configurable, nothing hardcoded - scoring weights, AI thresholds, feature flags, and business rules all live in config, not in conditionals scattered through the code.
- If a value might reasonably differ per job, per HR Manager preference, or per environment, it belongs in config - not as a literal in code.
