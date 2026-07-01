# 09 - Prompt Strategy

Governs how every LLM call in [04-ai-architecture.md](04-ai-architecture.md) is constructed.

## Prompt Rules

- Every prompt lives outside application code, version-controlled, and reusable.
- Each prompt focuses on a single task - no multi-purpose "do everything" prompts.

## Prompt Categories

Candidate Classification · Candidate Summary · Candidate Recommendation · Candidate Comparison · Job Analysis · Conference Analysis · Dashboard Insights · Explainability · Validation.

## Prompt Metadata

Every prompt carries: version, created date, modified date, author, description, status. This is what makes "prompt version" a meaningful field to attach to every AI output, per [00-project-constitution.md](00-project-constitution.md).

## Prompt Engineering Principles

- Use explicit instructions.
- Provide structured context, not free-form dumps.
- Include representative examples (few-shot - see below).
- Constrain the response format; prefer JSON output so downstream validation is mechanical, not string-parsing.
- Avoid ambiguous wording.
- Never expose internal reasoning meant for the model to the end user's response.
- Never request information the task doesn't need - this is the prompt-level enforcement of the context-window strategy in [04-ai-architecture.md](04-ai-architecture.md).

## Context Window Strategy (per task)

| Task | Context sent |
|---|---|
| Candidate Summary | Candidate + LinkedIn + Conference + Skills + target Job - nothing else |
| Dashboard Insights | Aggregated statistics only - never individual candidate profiles |

Smaller, targeted context isn't just cheaper - it's more consistent, since irrelevant fields give the model more surface area to latch onto the wrong signal.

## Grounding Strategy

Every prompt is grounded in trusted sources only: candidate profile, job definition, scoring rules, company guidelines, conference metadata, and the knowledge base ([10-knowledge-base.md](10-knowledge-base.md)). No internet access, no external assumptions - if it isn't in the grounding set, the model isn't supposed to know it.

## Few-Shot Learning

Every AI task should include representative examples, pulled from the knowledge base's few-shot documents. Examples measurably improve classification consistency, recommendation quality, output formatting, and reduce hallucination - this is treated as a required input to prompt design, not an optional nicety.

## Guardrails & Failure Handling

The platform validates every response for missing fields, invalid recommendation values, unsupported assumptions, confidence threshold, response format, and business-rule violations. On failure:

```
Retry → Fallback Prompt → Human Review
```

A fallback prompt is a simplified, more constrained version of the original - fewer degrees of freedom, stricter format - used specifically when the first attempt failed validation, rather than retrying the identical prompt and expecting a different result.
