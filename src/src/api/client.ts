import type {
  DashboardData,
  Integration,
  Job,
  ScoredCandidate,
  ScoringWeights,
} from '../types'

async function getJson<T>(path: string): Promise<T> {
  const res = await fetch(`/api${path}`)
  if (!res.ok) {
    throw new Error(`API ${path} failed: ${res.status}`)
  }
  return res.json() as Promise<T>
}

export const api = {
  jobs: () => getJson<Job[]>('/jobs'),
  job: (jobId: string) => getJson<Job>(`/jobs/${jobId}`),
  jobCandidates: (jobId: string) =>
    getJson<{ job: Job; candidates: ScoredCandidate[] }>(`/jobs/${jobId}/candidates`),
  candidatePool: () => getJson<ScoredCandidate[]>('/candidates'),
  dashboard: () => getJson<DashboardData>('/dashboard'),
  scoringWeights: () => getJson<ScoringWeights>('/settings/scoring-weights'),
  integrations: () => getJson<Integration[]>('/settings/integrations'),
}
