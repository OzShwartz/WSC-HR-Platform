# 01 — Product Requirements Document

**Version:** 1.0
**Status:** MVP
**Governed by:** [00-project-constitution.md](00-project-constitution.md)

## 1. Executive Summary

### Background

WSC Sports invests significant resources in attending professional conferences, meetups, hackathons, and industry events to identify top engineering, AI, product, and technology talent.

Today, recruiters collect valuable contacts through business cards, handwritten notes, LinkedIn connections, and badge scans. Most of these leads disappear after the conference. There is no centralized talent pool, no standardized enrichment process, and no intelligent way to rediscover candidates when new positions open. As a result, conference ROI drops and recruiters repeatedly re-search for candidates they have already met.

### Product Vision

Talent Intelligence Platform (TIP) is an AI-first internal recruitment platform designed to transform conference attendees into an intelligent, searchable, and continuously evolving talent pool. It combines deterministic business logic, explainable AI, and configurable scoring engines to help recruiters identify the best candidates within seconds — receiving transparent recommendations with AI reasoning and detailed score explanations, instead of manually reviewing hundreds of profiles.

The first version operates locally against CSV files, with an architecture designed to later connect to HubSpot, LinkedIn, Comeet, MCP servers, and cloud services (see [12-roadmap.md](12-roadmap.md)).

### Business Goals

- Increase conference ROI
- Reduce recruiter workload
- Build long-term talent pools
- Improve hiring quality
- Reduce manual candidate screening
- Accelerate hiring decisions
- Standardize candidate evaluation

### Technical Goals

- Production-ready, modular architecture
- Clean separation between AI and business logic
- Support future cloud deployment and API integrations
- No hardcoded logic — everything configurable

### Success Metrics

The platform is successful when:

- Recruiters can register a candidate in under 60 seconds.
- Recruiters can identify the best candidates for a role in under 30 seconds.
- Every recommendation and every score is explainable and transparent.
- Conference candidates become reusable hiring assets rather than one-time contacts.

## 2. Business Problem

### Candidate Capture

Business cards disappear, recruiter notes differ in format and quality, information is inconsistent, and contacts become fragmented across notebooks, phones, and inboxes.

### Candidate Quality — Signal vs. Noise

Conference attendees are not necessarily relevant to the domain of the conference itself. A DevOps conference, for example, draws platform engineers, SREs, and cloud engineers — but also recruiters, sales engineers, IT managers, consultants, and vendors. Attendance alone says nothing about candidate quality. **The system must distinguish signal from noise automatically, without requiring a recruiter to screen every attendee by hand.**

### Candidate Matching

When a new role opens, recruiters manually search LinkedIn and spreadsheets from scratch. Past conference candidates are almost never reused, even when they were a strong fit for a role that opens six months later.

### Candidate Evaluation

Recruiters evaluate candidates inconsistently. No standard methodology, scoring model, or explainability exists today.

### Problem Statement

The organization lacks an intelligent, centralized, reusable system capable of turning conference attendees into high-quality, rediscoverable hiring opportunities.

## 3. Grounding: The Recruitment Task Brief

This PRD is being executed against a specific take-home brief ([recruitment-task/index.html](../recruitment-task/index.html)), which scopes the MVP concretely:

- **Input data** (`recruitment-task/data/`): `conference_attendees.csv` (75 contacts across 4 conferences), `linkedin_profiles.csv` (enrichment data with mutual-connection signal), `wsc_employees.csv` (current roster, used for mutual-connection and referral detection), `job_openings.csv` (active roles, each pipeline run is scoped to one `job_id`).
- **Known data limitations to design around**: not every attendee has a matching LinkedIn profile; not every LinkedIn profile has mutual connections. The pipeline must degrade gracefully rather than fail or silently drop these contacts.
- **Minimum required behavior**: accept a `job_id`, and produce a structured, recruiter-usable output ranking/flagging candidates for that role — runnable end-to-end against the CSVs, with `JOB001` (Senior ML Engineer) as the required demo case.

Everything in [02-product-specification.md](02-product-specification.md) (Dashboard, full CRM-style Candidate Pool, Jobs module, Settings, AI Center) describes the **target-state platform** this MVP is a first slice of. The tradeoff between building that full slice vs. a focused pipeline for the take-home window is addressed explicitly in [11-tradeoffs.md](11-tradeoffs.md).

## 4. User Personas

**Recruiter** (primary user) — registers conference attendees, searches the candidate pool, reviews AI recommendations, manages the talent pool, contacts candidates, maintains notes.

**HR Manager** — reviews recruitment performance and AI quality, configures scoring, analyzes hiring metrics, manages integrations.

**Future Admin** — manages users, permissions, audit logs, integrations, knowledge base, and prompt versions.

## 5. User Journey

```
Conference
  ↓
Recruiter opens Registration Page
  ↓
Registers candidate
  ↓
Candidate enters Talent Pool
  ↓
Automatic enrichment (LinkedIn match)
  ↓
AI Classification (domain, seniority, relevance)
  ↓
Scoring Engine (deterministic)
  ↓
Job Matching
  ↓
Recruiter Review
  ↓
Candidate Contact
  ↓
Hiring Pipeline
  ↓
Historical Analytics
```

## 6. Product Modules (Overview)

Five modules make up the target platform, detailed in [02-product-specification.md](02-product-specification.md): **Dashboard**, **Conference Registration**, **Candidate Pool**, **Jobs**, and **Settings** (including the AI Center). The Dashboard is the central navigation hub; every module is fully interconnected.

## 7. Assumptions to Address

Per the recruitment brief, these are the open questions any implementation must take a stated position on (answered concretely in [03-scoring-engine.md](03-scoring-engine.md) and [11-tradeoffs.md](11-tradeoffs.md)):

1. How is "domain relevance" defined and detected per attendee, not just per conference?
2. How is a contact with no LinkedIn match handled — filtered out, or kept with a lower-confidence indication?
3. Does the *number* of mutual connections matter, or is any-vs-none sufficient?
4. Should candidates already in the ATS (Comeet) — e.g. previously rejected — be flagged differently?
5. What is the intended refresh cadence — one-time batch job, or run after every conference?
6. Who triggers the pipeline in production — a recruiter manually, or an automated event (e.g. badge-scan export)?
7. What privacy/GDPR considerations apply to storing and processing LinkedIn data at scale?

## 8. Acceptance Criteria (MVP)

The MVP is considered complete when:

- Recruiters can register candidates in under one minute.
- Candidates are automatically scored using configurable, deterministic rules.
- AI generates summaries, recommendations, and explanations for every candidate.
- Jobs can be created, edited, and archived.
- The dashboard presents real-time hiring insights and KPIs.
- CSV import/export works for candidates, jobs, and conference data.
- White/Gray/Black list status functions correctly.
- Every score is explainable and auditable.
- The architecture is modular, testable, and ready for future integration with HubSpot, LinkedIn, Comeet, MCP, Azure, and AWS.
- All business logic is isolated from AI logic; all prompts and knowledge are externalized to Markdown.

## Final Design Philosophy

TIP is not a simple recruitment dashboard — it is designed as an AI-native Talent Intelligence Operating System that combines deterministic engineering with explainable AI to create a trusted decision-support tool. Every recommendation is transparent, every score is configurable, every AI response is grounded, and every module is independently extensible. The architecture should evolve from a local CSV-based MVP into a cloud-native enterprise platform without a fundamental rewrite.
