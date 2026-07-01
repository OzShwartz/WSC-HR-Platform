"""Deterministic candidate scoring engine — docs/03-scoring-engine.md.

Everything here is plain arithmetic and string matching. No LLM call happens
in this module, ever — per docs/00-project-constitution.md, "AI never
calculates scores, it only explains them." The AI layer (backend/ai/) takes
the ScoreBreakdown this module produces and narrates it; it never overrides
the numbers.
"""

from __future__ import annotations

import re

from backend.config.config_loader import DomainSignals, ScoringWeights
from backend.models.candidate import Candidate, JobOpening, WscEmployee
from backend.models.score import ScoreBreakdown, SubScore

_SENIOR_TITLE_MARKERS = ("vp", "vice president", "head", "director", "principal", "staff", "chief")

_WORD_RE = re.compile(r"[a-z0-9+#]+")


def _tokenize(text: str) -> set[str]:
    return set(_WORD_RE.findall(text.lower()))


def _stem(word: str) -> str:
    """Crude suffix-stripping so 'analysis'/'analytics' or 'engineer'/'engineering'
    count as the same signal without pulling in a full NLP dependency."""
    return word[:5] if len(word) > 5 else word


def _stem_tokenize(text: str) -> set[str]:
    return {_stem(w) for w in _WORD_RE.findall(text.lower())}


def _phrase_coverage(candidate_terms: set[str], phrases: list[str], threshold: float = 0.5) -> tuple[float, list[str]]:
    """Fraction of `phrases` (each a domain phrase like 'Computer Vision') whose
    stemmed words are at least `threshold` covered by candidate_terms. Matching
    whole phrases against a coverage threshold avoids the false precision of
    flattening every phrase into one big bag-of-words denominator, which
    over-penalizes multi-word domains."""
    if not phrases:
        return 0.0, []
    matched = []
    for phrase in phrases:
        phrase_terms = _stem_tokenize(phrase)
        if not phrase_terms:
            continue
        overlap = len(phrase_terms & candidate_terms) / len(phrase_terms)
        if overlap >= threshold:
            matched.append(phrase)
    return len(matched) / len(phrases), matched


def _normalize_skill(skill: str, synonyms: dict[str, str]) -> str:
    key = skill.strip().lower()
    return synonyms.get(key, key)


def _normalize_skills(skills: list[str], synonyms: dict[str, str]) -> set[str]:
    return {_normalize_skill(s, synonyms) for s in skills if s.strip()}


def _overlap_ratio(candidate_terms: set[str], target_terms: set[str]) -> float:
    """Fraction of target_terms found in candidate_terms — how much of what the
    job asks for shows up in the candidate's profile. Not symmetric Jaccard:
    a candidate with many extra unrelated skills shouldn't be penalized."""
    if not target_terms:
        return 0.0
    matched = sum(1 for t in target_terms if t in candidate_terms)
    return matched / len(target_terms)


def compute_domain_relevance(
    candidate: Candidate, job: JobOpening, domain_signals: DomainSignals
) -> tuple[float, str, list[str]]:
    """The signal-vs-noise gate (docs/03-scoring-engine.md).

    Returns (multiplier in [0.1, 1.0], human-readable reasoning, evidence).
    The multiplier dampens Title/Skills/Industry sub-scores so that superficial
    keyword overlap from an off-domain role (recruiter, vendor, IT manager at
    a technical conference) can't inflate the overall score.
    """
    li = candidate.linkedin
    title_text = " ".join(
        filter(None, [candidate.attendee.title, li.current_title if li else "", " ".join(li.past_titles) if li else ""])
    ).lower()

    noise_hits = [kw for kw in domain_signals.noise_title_keywords if kw in title_text]
    if noise_hits:
        return (
            0.15,
            f"Title reads as a non-technical/adjacent role ({', '.join(noise_hits)}), "
            "not the job's professional domain — dampened regardless of conference attendance.",
            noise_hits,
        )

    candidate_text = title_text
    candidate_skills = set()
    if li:
        candidate_text += " " + " ".join(li.top_skills) + " " + li.industry
        candidate_skills = _normalize_skills(li.top_skills, domain_signals.skill_synonyms)
    candidate_stemmed = _stem_tokenize(candidate_text)

    domain_coverage, matched_domains = _phrase_coverage(candidate_stemmed, job.key_domains)
    required_skills = _normalize_skills(job.required_skills, domain_signals.skill_synonyms)
    skill_overlap = _overlap_ratio(candidate_skills, required_skills)

    # Either signal alone (clearly the right domain, OR clearly has the required skills) is
    # enough to establish domain fit — they don't need to both be strong.
    overlap = max(domain_coverage, skill_overlap)
    multiplier = round(0.4 + 0.6 * min(overlap * 1.5, 1.0), 2)  # floor 0.4, reaches 1.0 at ~67%+ overlap
    matched_skills = sorted(s for s in required_skills if s in candidate_skills)
    evidence = matched_domains + matched_skills
    reasoning = (
        f"{len(matched_domains)}/{len(job.key_domains)} job domains matched ({matched_domains}); "
        f"{len(matched_skills)}/{len(required_skills)} required skills present."
        if evidence
        else "No overlap found between candidate profile and job domain/skills — treated as weak domain fit, not zero."
    )
    return multiplier, reasoning, evidence


def score_skills(candidate: Candidate, job: JobOpening, domain_signals: DomainSignals, domain_multiplier: float) -> SubScore:
    li = candidate.linkedin
    if li is None or not li.top_skills:
        return SubScore(
            name="skills",
            raw_score=30.0,
            weight=0,  # set by caller
            reasoning="No LinkedIn skills data available; scored from conference title/notes only, low confidence.",
            insufficient_data=True,
        )

    candidate_skills = _normalize_skills(li.top_skills, domain_signals.skill_synonyms)
    required = _normalize_skills(job.required_skills, domain_signals.skill_synonyms)
    nice = _normalize_skills(job.nice_to_have, domain_signals.skill_synonyms)

    required_ratio = _overlap_ratio(candidate_skills, required)
    nice_ratio = _overlap_ratio(candidate_skills, nice)
    raw = (required_ratio * 0.8 + nice_ratio * 0.2) * 100 * domain_multiplier
    matched = sorted(s for s in required | nice if s in candidate_skills)
    return SubScore(
        name="skills",
        raw_score=round(min(raw, 100), 1),
        weight=0,
        reasoning=(
            f"{required_ratio:.0%} of required skills and {nice_ratio:.0%} of nice-to-have skills matched "
            f"(domain relevance x{domain_multiplier})."
        ),
        evidence=matched,
    )


def score_experience(candidate: Candidate, job: JobOpening, seniority_bands: dict) -> SubScore:
    li = candidate.linkedin
    if li is None or li.years_experience is None:
        return SubScore(
            name="experience",
            raw_score=50.0,
            weight=0,
            reasoning="No years-of-experience data available; neutral score applied.",
            insufficient_data=True,
        )

    lo, hi = seniority_bands.get(job.seniority, seniority_bands["_default"])
    years = li.years_experience
    if lo <= years <= hi:
        raw = 100.0
    elif years < lo:
        gap = lo - years
        raw = max(40.0, 100.0 - gap * 15)
    else:
        gap = years - hi
        raw = max(60.0, 100.0 - gap * 8)  # overqualified tapers more gently than underqualified
    role_label = job.title if job.seniority.lower() in job.title.lower() else f"{job.seniority} {job.title}"
    return SubScore(
        name="experience",
        raw_score=round(raw, 1),
        weight=0,
        reasoning=f"{years:.0f} years experience vs. expected {lo}-{hi} years for {role_label}.",
        evidence=[f"years_experience={years:.0f}"],
    )


def score_title(candidate: Candidate, job: JobOpening, domain_multiplier: float) -> SubScore:
    li = candidate.linkedin
    current_title = (li.current_title if li else candidate.attendee.title) or candidate.attendee.title
    candidate_terms = _tokenize(current_title)
    job_terms = _tokenize(job.title)
    overlap = _overlap_ratio(candidate_terms, job_terms)
    raw = overlap * 100 * domain_multiplier
    return SubScore(
        name="title",
        raw_score=round(min(raw, 100), 1),
        weight=0,
        reasoning=f"'{current_title}' vs. target title '{job.title}' — {overlap:.0%} term overlap (domain relevance x{domain_multiplier}).",
        evidence=[current_title],
        insufficient_data=li is None,
    )


def score_industry(candidate: Candidate, job: JobOpening, domain_multiplier: float) -> SubScore:
    li = candidate.linkedin
    if li is None or not li.industry:
        conf_terms = _stem_tokenize(candidate.attendee.conference_domain)
        coverage, matched = _phrase_coverage(conf_terms, job.key_domains)
        return SubScore(
            name="industry",
            raw_score=round(min(coverage * 100 * domain_multiplier, 100), 1),
            weight=0,
            reasoning="No LinkedIn industry field; approximated from conference domain instead.",
            evidence=matched,
            insufficient_data=True,
        )
    # Industry field alone is often a single short phrase ("Sports Technology") — widen the
    # candidate signal with title/skills so multi-word job domains have enough to match against.
    candidate_text = " ".join(filter(None, [li.industry, li.current_title, " ".join(li.top_skills)]))
    candidate_terms = _stem_tokenize(candidate_text)
    coverage, matched = _phrase_coverage(candidate_terms, job.key_domains)
    return SubScore(
        name="industry",
        raw_score=round(min(coverage * 100 * domain_multiplier, 100), 1),
        weight=0,
        reasoning=f"Industry '{li.industry}' vs. job domains {job.key_domains} — {len(matched)}/{len(job.key_domains)} domains matched ({matched}).",
        evidence=matched,
    )


def score_mutual_connections(candidate: Candidate, employees: dict[str, WscEmployee]) -> SubScore:
    li = candidate.linkedin
    if li is None or not li.wsc_mutual_connections:
        return SubScore(
            name="mutual_connections",
            raw_score=0.0,
            weight=0,
            reasoning="No mutual WSC connections found.",
            insufficient_data=li is None,
        )

    n = len(li.wsc_mutual_connections)
    base = 100 * (1 - 0.5**n)  # diminishing returns: 1->50, 2->75, 3->87.5, ...
    connected = [employees[eid] for eid in li.wsc_mutual_connections if eid in employees]
    senior_bonus = sum(5 for e in connected if any(m in e.title.lower() for m in _SENIOR_TITLE_MARKERS))
    raw = min(100.0, base + senior_bonus)
    evidence = [f"{e.full_name} ({e.title}, {e.department})" for e in connected]
    return SubScore(
        name="mutual_connections",
        raw_score=round(raw, 1),
        weight=0,
        reasoning=f"{n} mutual WSC connection(s), diminishing-returns scaled" + (" + seniority bonus" if senior_bonus else ""),
        evidence=evidence,
    )


def score_conference_relevance(candidate: Candidate, job: JobOpening) -> SubScore:
    attendee = candidate.attendee
    conf_terms = _stem_tokenize(attendee.conference_domain) | _stem_tokenize(attendee.conference_name)
    coverage, matched = _phrase_coverage(conf_terms, job.key_domains)
    raw = coverage * 100
    notes = attendee.notes.lower()
    speaker_bonus = 10 if any(w in notes for w in ("spoke", "speaker", "presented", "panel")) else 0
    raw = min(100.0, raw + speaker_bonus)
    return SubScore(
        name="conference_relevance",
        raw_score=round(raw, 1),
        weight=0,
        reasoning=(
            f"Conference domain '{attendee.conference_domain}' matched {len(matched)}/{len(job.key_domains)} job domains ({matched})."
            + (" Speaker/active-participation bonus applied." if speaker_bonus else "")
        ),
        evidence=[attendee.conference_name],
    )


def score_education() -> SubScore:
    return SubScore(
        name="education",
        raw_score=50.0,
        weight=0,
        reasoning="No education data available in the current data sources — neutral placeholder score.",
        insufficient_data=True,
    )


def score_recruiter_feedback() -> SubScore:
    return SubScore(
        name="recruiter_feedback",
        raw_score=50.0,
        weight=0,
        reasoning="No recruiter feedback recorded yet — this is a first-pass batch score.",
        insufficient_data=True,
    )


def _recommendation_for(overall: float, confidence: float, is_noise: bool) -> str:
    if is_noise:
        return "Do Not Contact"
    if confidence < 0.5:
        return "Needs Manual Review"
    if overall >= 80:
        return "Excellent Match"
    if overall >= 65:
        return "Strong Match"
    if overall >= 50:
        return "Potential Match"
    if overall >= 35:
        return "Low Priority"
    return "Do Not Contact"


def score_candidate(
    candidate: Candidate,
    job: JobOpening,
    employees: dict[str, WscEmployee],
    weights: ScoringWeights,
    domain_signals: DomainSignals,
    seniority_bands: dict,
) -> ScoreBreakdown:
    domain_multiplier, domain_reasoning, domain_evidence = compute_domain_relevance(candidate, job, domain_signals)
    is_noise = domain_multiplier <= 0.15

    weight_map = {
        "skills": weights.skills,
        "experience": weights.experience,
        "title": weights.title,
        "industry": weights.industry,
        "mutual_connections": weights.mutual_connections,
        "conference_relevance": weights.conference_relevance,
        "education": weights.education,
        "recruiter_feedback": weights.recruiter_feedback,
    }

    sub_scores = [
        score_skills(candidate, job, domain_signals, domain_multiplier),
        score_experience(candidate, job, seniority_bands),
        score_title(candidate, job, domain_multiplier),
        score_industry(candidate, job, domain_multiplier),
        score_mutual_connections(candidate, employees),
        score_conference_relevance(candidate, job),
        score_education(),
        score_recruiter_feedback(),
    ]
    for s in sub_scores:
        s.weight = weight_map[s.name]

    overall = round(sum(s.weighted_score for s in sub_scores), 1)
    confidence = round(sum(s.weight for s in sub_scores if not s.insufficient_data), 2)
    if candidate.linkedin is None:
        confidence = round(confidence * 0.7, 2)  # no enrichment at all — extra haircut

    ranked = sorted(sub_scores, key=lambda s: s.weighted_score, reverse=True)
    strengths = [f"{s.name.replace('_', ' ').title()}: {s.reasoning}" for s in ranked[:2] if s.raw_score >= 60]
    weaknesses = [
        f"{s.name.replace('_', ' ').title()}: {s.reasoning}" for s in ranked[-2:] if s.raw_score < 50
    ]

    required_normalized = _normalize_skills(job.required_skills, domain_signals.skill_synonyms)
    candidate_normalized = (
        _normalize_skills(candidate.linkedin.top_skills, domain_signals.skill_synonyms) if candidate.linkedin else set()
    )
    missing_skills = sorted(job.required_skills, key=lambda s: s.lower())
    missing_skills = [s for s in job.required_skills if _normalize_skill(s, domain_signals.skill_synonyms) not in candidate_normalized]

    recommendation = _recommendation_for(overall, confidence, is_noise)

    domain_sub = SubScore(
        name="domain_relevance_gate",
        raw_score=round(domain_multiplier * 100, 1),
        weight=0.0,
        reasoning=domain_reasoning,
        evidence=domain_evidence,
    )
    sub_scores.append(domain_sub)

    return ScoreBreakdown(
        overall_score=overall,
        confidence=confidence,
        domain_relevance_multiplier=domain_multiplier,
        sub_scores=sub_scores,
        recommendation=recommendation,
        strengths=strengths,
        weaknesses=weaknesses,
        missing_skills=missing_skills,
    )
