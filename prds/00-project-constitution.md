# 00 - Project Constitution

This document is the set of principles every other design decision in this project must be consistent with. Where any other doc appears to conflict with this one, this one wins.

## The Core Idea

Talent Intelligence Platform (TIP) is an **AI-assisted decision-support system**, not an AI decision-making system. It exists to remove repetitive screening work from recruiters and surface well-reasoned candidate recommendations - it does not exist to make hiring decisions for them.

## Non-Negotiable Principles

1. **AI assists. AI never replaces the recruiter.** Every AI output is advisory. A human always makes the final call.
2. **Business logic is deterministic.** Filtering, sorting, searching, ranking, scoring, business rules, CSV processing, data validation, duplicate detection, and all calculations are plain, auditable application code - never an LLM call.
3. **AI is reserved for tasks that require reasoning**, not tasks that require arithmetic: candidate summarization, classification, natural-language explanation, recommendation narratives, comparative reasoning, and executive insight generation.
4. **AI never calculates scores. AI only explains them.** The scoring engine ([03-scoring-engine.md](03-scoring-engine.md)) is 100% deterministic and configurable; the LLM's job is to narrate *why* a score came out the way it did, not to produce the number.
5. **No black-box decisions.** Every recommendation the system produces must be traceable to the data that produced it.
6. **Every AI output must be explainable**, and must carry, at minimum:
   - Confidence score
   - Reasoning
   - Evidence
   - Assumptions
   - Supporting data
   - Prompt version
   - Knowledge version
7. **Everything is configurable. Nothing is hardcoded.** Scoring weights, thresholds, prompts, and knowledge are all externalized so an HR Manager can change platform behavior without a code change.
8. **Knowledge is externalized.** Business/domain knowledge that grounds AI reasoning lives in versioned Markdown files ([10-knowledge-base.md](10-knowledge-base.md)), not in prompts or code.
9. **Prompts are version-controlled and live outside application code** ([09-prompt-strategy.md](09-prompt-strategy.md)).
10. **AI receives the minimum context necessary** for the task at hand - never the whole database, never irrelevant candidate fields.
11. **Every AI output is validated before it reaches a recruiter** - required fields, schema, confidence threshold, and business-rule compliance are all checked. Failures degrade gracefully: retry → fallback prompt → human review ([04-ai-architecture.md](04-ai-architecture.md)).
12. **The platform is model-agnostic.** Swapping the underlying LLM provider must never require a business-logic change.

## Responsible AI

Recommendations may only be influenced by professional qualifications. They must never factor in age, gender, nationality, religion, ethnicity, or any other protected characteristic. Any signal correlated with a protected characteristic is out of scope for scoring or classification, by design.

## Known Limitations (Accepted by Design)

AI, by nature, can misclassify titles, misread ambiguous profiles, miss implicit skills, or produce low-confidence output. The system does not try to eliminate this - it contains it:

- Every recommendation is advisory, never final.
- Human review remains mandatory before any candidate is contacted or rejected.
- Confidence score is always displayed alongside a recommendation.
- The deterministic score, not the AI narrative, is the system's source of truth.

## Why This Matters for Everything Downstream

Every other doc in this project should be read against these rules. If a future feature request would require the AI to make an irreversible decision unsupervised, or would hide its reasoning from the recruiter, it is out of scope as written and needs to come back through this constitution first.
