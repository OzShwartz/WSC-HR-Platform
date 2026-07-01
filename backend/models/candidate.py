"""Domain models for a conference-attendee candidate and its enrichment data.

These are plain dataclasses, not Pydantic schemas - schemas (backend/schemas/)
are for API/IO validation; models are the internal representation the
services and scoring engine operate on.
"""

from __future__ import annotations

from dataclasses import dataclass, field


@dataclass
class ConferenceAttendee:
    hubspot_id: str
    full_name: str
    email: str
    company: str
    title: str
    conference_name: str
    conference_domain: str
    conference_date: str
    source: str
    notes: str
    linkedin_url: str


@dataclass
class LinkedInProfile:
    linkedin_url: str
    full_name: str
    current_company: str
    current_title: str
    location: str
    years_experience: float | None
    top_skills: list[str] = field(default_factory=list)
    industry: str = ""
    past_companies: list[str] = field(default_factory=list)
    past_titles: list[str] = field(default_factory=list)
    wsc_mutual_connections: list[str] = field(default_factory=list)


@dataclass
class WscEmployee:
    employee_id: str
    full_name: str
    title: str
    department: str
    linkedin_id: str
    work_history: list[str] = field(default_factory=list)


@dataclass
class JobOpening:
    job_id: str
    title: str
    department: str
    seniority: str
    key_domains: list[str] = field(default_factory=list)
    required_skills: list[str] = field(default_factory=list)
    nice_to_have: list[str] = field(default_factory=list)


@dataclass
class Candidate:
    """A conference attendee merged with its (possibly missing) LinkedIn enrichment."""

    attendee: ConferenceAttendee
    linkedin: LinkedInProfile | None = None

    @property
    def has_linkedin(self) -> bool:
        return self.linkedin is not None

    @property
    def full_name(self) -> str:
        return self.attendee.full_name
