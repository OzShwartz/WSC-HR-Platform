"""Scoring-engine tests - docs/08-testing-strategy.md ("Scoring Tests" is the
highest-value test category: if the score is wrong, every downstream
recommendation is wrong regardless of the AI layer)."""

from __future__ import annotations

from backend.config.config_loader import load_domain_signals, load_scoring_weights, load_seniority_bands
from backend.models.candidate import Candidate, ConferenceAttendee, JobOpening, LinkedInProfile, WscEmployee
from backend.services.scoring_engine import score_candidate

WEIGHTS = load_scoring_weights()
DOMAIN_SIGNALS = load_domain_signals()
SENIORITY_BANDS = load_seniority_bands()

JOB = JobOpening(
    job_id="JOBTEST",
    title="Senior ML Engineer",
    department="AI/ML",
    seniority="Senior",
    key_domains=["Computer Vision", "Deep Learning"],
    required_skills=["Python", "PyTorch", "Computer Vision"],
    nice_to_have=["Docker"],
)

EMPLOYEES: dict[str, WscEmployee] = {
    "WSC001": WscEmployee("WSC001", "David Cohen", "VP Engineering", "Engineering", "david-cohen-wsc", []),
    "WSC002": WscEmployee("WSC002", "Maya Levi", "Senior ML Engineer", "AI/ML", "maya-levi-ml", []),
}


def _attendee(title: str, notes: str = "", linkedin_url: str = "") -> ConferenceAttendee:
    return ConferenceAttendee(
        hubspot_id="HS1",
        full_name="Test Person",
        email="t@example.com",
        company="Acme",
        title=title,
        conference_name="Test Conf",
        conference_domain="Computer Vision & AI",
        conference_date="2025-01-01",
        source="Badge Scan",
        notes=notes,
        linkedin_url=linkedin_url,
    )


def test_strong_technical_match_scores_high():
    li = LinkedInProfile(
        linkedin_url="li/strong",
        full_name="Test Person",
        current_company="Acme",
        current_title="ML Engineer",
        location="Tel Aviv",
        years_experience=6,
        top_skills=["Python", "PyTorch", "Computer Vision", "Deep Learning"],
        industry="Computer Vision",
        wsc_mutual_connections=["WSC001", "WSC002"],
    )
    candidate = Candidate(attendee=_attendee("ML Engineer", linkedin_url="li/strong"), linkedin=li)
    score = score_candidate(candidate, JOB, EMPLOYEES, WEIGHTS, DOMAIN_SIGNALS, SENIORITY_BANDS)

    assert score.overall_score >= 65
    assert score.recommendation in {"Strong Match", "Excellent Match"}
    assert score.confidence > 0.7


def test_noise_role_at_relevant_conference_is_dampened():
    """The exact scenario the recruitment brief calls out: a non-technical role
    attending a technical conference must not score as if it were a domain fit."""
    li = LinkedInProfile(
        linkedin_url="li/noise",
        full_name="Test Person",
        current_company="Acme",
        current_title="Account Executive",
        location="Tel Aviv",
        years_experience=6,
        top_skills=["Salesforce", "Negotiation"],
        industry="Sales",
    )
    candidate = Candidate(attendee=_attendee("Sales Account Executive", linkedin_url="li/noise"), linkedin=li)
    score = score_candidate(candidate, JOB, EMPLOYEES, WEIGHTS, DOMAIN_SIGNALS, SENIORITY_BANDS)

    assert score.domain_relevance_multiplier <= 0.15
    assert score.recommendation == "Do Not Contact"


def test_missing_linkedin_is_kept_not_dropped_and_flagged_low_confidence():
    candidate = Candidate(attendee=_attendee("ML Engineer", linkedin_url=""), linkedin=None)
    score = score_candidate(candidate, JOB, EMPLOYEES, WEIGHTS, DOMAIN_SIGNALS, SENIORITY_BANDS)

    assert score is not None  # candidate is never dropped outright
    assert score.confidence < 0.6
    skills_sub = score.sub_score("skills")
    assert skills_sub.insufficient_data is True


def test_mutual_connections_diminishing_returns():
    def score_with_n_connections(n: int) -> float:
        li = LinkedInProfile(
            linkedin_url="li/conn",
            full_name="Test Person",
            current_company="Acme",
            current_title="ML Engineer",
            location="Tel Aviv",
            years_experience=6,
            top_skills=["Python", "PyTorch", "Computer Vision"],
            industry="Computer Vision",
            wsc_mutual_connections=["WSC001", "WSC002"][:n],
        )
        candidate = Candidate(attendee=_attendee("ML Engineer", linkedin_url="li/conn"), linkedin=li)
        score = score_candidate(candidate, JOB, EMPLOYEES, WEIGHTS, DOMAIN_SIGNALS, SENIORITY_BANDS)
        return score.sub_score("mutual_connections").raw_score

    zero, one, two = score_with_n_connections(0), score_with_n_connections(1), score_with_n_connections(2)
    assert zero == 0
    assert one > zero
    assert two > one
    # diminishing returns: the second connection adds less than the first
    assert (two - one) < one
