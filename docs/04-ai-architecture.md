# 04 — AI Architecture

Implements the AI principles from [00-project-constitution.md](00-project-constitution.md): AI augments recruiter judgment, never replaces it, and every output is explainable.

## AI Responsibilities vs. Application Responsibilities

| AI (reasoning only) | Application (deterministic) |
|---|---|
| Candidate understanding, summarization, classification | Filtering, sorting, searching, ranking |
| Semantic similarity, recommendation generation | Scoring, business rules |
| Explainability narratives, executive insights | CSV processing, data validation |
| Skill-gap analysis | Duplicate detection, calculations |

## AI Services / Agents

Each agent has a single responsibility:

- **Candidate Classification Agent** — identifies domain, seniority, normalizes titles, categorizes industry, extracts strengths, estimates confidence.
- **Candidate Matching Agent** — compares candidates against jobs, computes semantic similarity, identifies missing skills, generates match explanations and improvement suggestions.
- **Candidate Recommendation Agent** — generates recruiter recommendations, prioritizes outreach, highlights risk, explains candidate potential.
- **Candidate Summary Service/Agent** — produces recruiter-friendly summaries, e.g. *"Senior Backend Engineer with 8 years of experience building distributed systems. Strong expertise in Go, Kubernetes and AWS. Previously worked at Wix and Monday. Excellent fit for Senior Platform Engineer. High confidence recommendation."*
- **Candidate Comparison Service** — given candidates A/B/C and a target job, returns a ranking, strengths/weaknesses, a comparison matrix, and a hiring recommendation with reasoning.
- **Explainability Agent** — answers, for every recommendation: Why was this candidate selected? Which information influenced it? Which requirements are missing? How confident is the AI?
- **Dashboard/Executive Insights Agent** — generates aggregate insights: highest-quality conference, most valuable candidate source, most requested technologies, common hiring bottlenecks, candidates worth contacting today, hidden high-potential candidates.
- **Validation Agent** — validates AI outputs, prevents hallucination, verifies required fields, checks reasoning quality, enforces confidence thresholds.
- **Knowledge Agent** — retrieves relevant knowledge documents, provides context, supports grounding, selects few-shot examples, prepares the final AI context.

## AI Execution Pipeline

Every AI request — regardless of which agent — follows the same pipeline:

```
User Request
  ↓
Business Service
  ↓
Context Builder            (assembles only the minimum required fields)
  ↓
Knowledge Retrieval         (10-knowledge-base.md)
  ↓
Grounding                   (attach trusted source documents; no internet, no external assumptions)
  ↓
Prompt Assembly             (09-prompt-strategy.md)
  ↓
Guardrails                  (pre-flight checks before the LLM call)
  ↓
LLM
  ↓
Response Validation         (schema, required fields, confidence threshold, business rules)
  ↓
Explainability              (attach reasoning, evidence, confidence)
  ↓
Final Response
```

## Context Window Strategy

Only relevant information is ever sent to the model:

| Task | Receives | Explicitly excludes |
|---|---|---|
| Candidate Summary | Candidate + LinkedIn + Conference + Skills + target Job | The rest of the candidate pool |
| Dashboard Insights | Aggregated statistics only | Every individual candidate profile |

This is a cost and quality control, not just a cost control — smaller, targeted context produces more consistent output than dumping the entire dataset into the prompt.

## Grounding

Every AI request is grounded against trusted sources only: the candidate profile, the job definition, the scoring rules, company guidelines, conference metadata, and the knowledge base ([10-knowledge-base.md](10-knowledge-base.md)). No internet access, no external assumptions.

## Guardrails & Validation

The platform validates every AI response for: missing fields, invalid recommendation values, unsupported assumptions, confidence threshold, response format/JSON schema, and business-rule violations (e.g. a "Do Not Contact" recommendation for a candidate on the White List).

**On validation failure:**
```
Retry → Fallback Prompt → Human Review
```

## Confidence Scoring

Every AI output includes a confidence score, reasoning, evidence, source documents, prompt version, and knowledge version. Example:

> Recommendation: Strong Match · Confidence: 94% · Evidence: Python, AWS, Kubernetes, Platform Engineering, 8 Years Experience

## Cost Optimization

- Cache responses; reuse summaries rather than regenerating on every view.
- Batch requests where possible.
- Send minimal context per the table above.
- Reuse embeddings; avoid duplicate prompts for unchanged data.

## Model Independence

The AI architecture must remain provider-agnostic. Supported future providers: OpenAI, Claude, Gemini, Azure OpenAI, and local models. Swapping providers must never require a business-logic change — this is enforced by keeping every LLM call behind the Business Service layer described in [05-system-architecture.md](05-system-architecture.md), never called directly from UI or scoring code.

## Human-in-the-Loop

AI recommendations are advisory. Recruiters always make the final decision, and every recommendation can be accepted, rejected, edited, or annotated. Recruiter feedback is stored and factored back in via the bounded Recruiter Feedback score component ([03-scoring-engine.md](03-scoring-engine.md)).

## Responsible AI

Recommendations may only be influenced by professional qualifications — never age, gender, nationality, religion, ethnicity, or other protected characteristics.
