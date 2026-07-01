export interface Job {
  job_id: string
  title: string
  department: string
  seniority: string
  key_domains: string[]
  required_skills: string[]
  nice_to_have: string[]
}

export interface SubScore {
  name: string
  raw_score: number
  weight: number
  reasoning: string
  evidence: string[]
  insufficient_data: boolean
  weighted_score: number
}

export interface ScoreBreakdown {
  overall_score: number
  confidence: number
  domain_relevance_multiplier: number
  sub_scores: SubScore[]
  recommendation: string
  strengths: string[]
  weaknesses: string[]
  missing_skills: string[]
}

export interface AIOutput {
  content: string
  confidence: number
  reasoning: string
  evidence: string[]
  assumptions: string[]
  prompt_version: string
  knowledge_version: string
  source: string
}

export interface LinkedInProfile {
  linkedin_url: string
  full_name: string
  current_company: string
  current_title: string
  location: string
  years_experience: number | null
  top_skills: string[]
  industry: string
  past_companies: string[]
  past_titles: string[]
  wsc_mutual_connections: string[]
}

export interface CandidateSummary {
  hubspot_id: string
  full_name: string
  email: string
  title: string
  company: string
  conference_name: string
  conference_domain: string
  conference_date: string
  notes: string
  linkedin_url: string
  has_linkedin: boolean
  linkedin: LinkedInProfile | null
}

export interface ScoredCandidate {
  rank: number
  candidate: CandidateSummary
  score: ScoreBreakdown
  summary: AIOutput
  recommendation_narrative: AIOutput
  explanation: AIOutput
  best_matching_job?: { job_id: string; title: string }
}

export interface DashboardData {
  total_candidates: number
  total_jobs: number
  average_score: number
  conference_count: number
  top_conference: { name: string | null; count: number }
  most_requested_skill: string | null
  recommendation_counts: Record<string, number>
  top_candidates: {
    full_name: string
    overall_score: number
    recommendation: string
    best_matching_job: string
  }[]
}

export interface ScoringWeights {
  skills: number
  experience: number
  title: number
  industry: number
  mutual_connections: number
  conference_relevance: number
  education: number
  recruiter_feedback: number
}

export interface Integration {
  name: string
  status: string
  mode: string
  last_sync: string
}
