import type {
  DashboardData,
  Employee,
  Integration,
  Job,
  JobDraft,
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

async function sendJson<T>(path: string, method: string, body?: unknown): Promise<T> {
  const res = await fetch(`/api${path}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
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
  createJob: (draft: JobDraft) => sendJson<Job>('/jobs', 'POST', draft),
  deleteJob: (jobId: string) => sendJson<{ deleted: string }>(`/jobs/${jobId}`, 'DELETE'),
  candidatePool: () => getJson<ScoredCandidate[]>('/candidates'),
  candidate: (hubspotId: string) => getJson<ScoredCandidate>(`/candidates/${hubspotId}`),
  dashboard: () => getJson<DashboardData>('/dashboard'),
  employees: () => getJson<Employee[]>('/employees'),
  importEmployees: async (file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    const res = await fetch('/api/employees/import', { method: 'POST', body: formData })
    if (!res.ok) {
      const detail = await res.json().catch(() => null)
      throw new Error(detail?.detail ?? `Import failed: ${res.status}`)
    }
    return res.json() as Promise<{ imported: number }>
  },
  scoringWeights: () => getJson<ScoringWeights>('/settings/scoring-weights'),
  updateScoringWeights: (weights: ScoringWeights) =>
    sendJson<ScoringWeights>('/settings/scoring-weights', 'PUT', weights),
  integrations: () => getJson<Integration[]>('/settings/integrations'),
}
