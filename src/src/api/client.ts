import type {
  DashboardData,
  Employee,
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

async function putJson<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`/api${path}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const detail = await res.json().catch(() => null)
    throw new Error(detail?.detail ?? `API ${path} failed: ${res.status}`)
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
  employees: () => getJson<Employee[]>('/employees'),
  scoringWeights: () => getJson<ScoringWeights>('/settings/scoring-weights'),
  updateScoringWeights: (weights: ScoringWeights) =>
    putJson<ScoringWeights>('/settings/scoring-weights', weights),
  integrations: () => getJson<Integration[]>('/settings/integrations'),
}
