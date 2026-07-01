import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api } from '../api/client'
import type { Job, ScoredCandidate } from '../types'
import { RecommendationBadge } from '../components/RecommendationBadge'
import { CandidateDrawer } from '../components/CandidateDrawer'

export function JobDetail() {
  const { jobId } = useParams<{ jobId: string }>()
  const [job, setJob] = useState<Job | null>(null)
  const [candidates, setCandidates] = useState<ScoredCandidate[] | null>(null)
  const [selected, setSelected] = useState<ScoredCandidate | null>(null)

  useEffect(() => {
    if (!jobId) return
    setJob(null)
    setCandidates(null)
    api.jobCandidates(jobId).then((data) => {
      setJob(data.job)
      setCandidates(data.candidates)
    })
  }, [jobId])

  if (!job || !candidates) return <div className="text-neutral-400">Loading…</div>

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link to="/jobs" className="text-xs font-medium text-neutral-500 hover:text-neutral-800">
          ← All Jobs
        </Link>
        <h1 className="mt-1 text-xl font-bold text-neutral-900">{job.title}</h1>
        <p className="text-sm text-neutral-500">
          {job.department} &middot; {job.seniority} &middot; {candidates.length} candidates evaluated
        </p>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {job.required_skills.map((s) => (
            <span key={s} className="rounded bg-neutral-900 px-2 py-0.5 text-[11px] text-white">
              {s}
            </span>
          ))}
          {job.nice_to_have.map((s) => (
            <span key={s} className="rounded bg-neutral-100 px-2 py-0.5 text-[11px] text-neutral-600">
              {s}
            </span>
          ))}
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-neutral-100 bg-neutral-50 text-left text-xs uppercase tracking-wide text-neutral-400">
              <th className="px-4 py-3">#</th>
              <th className="px-4 py-3">Candidate</th>
              <th className="px-4 py-3">Title</th>
              <th className="px-4 py-3">Score</th>
              <th className="px-4 py-3">Recommendation</th>
              <th className="px-4 py-3">Connections</th>
            </tr>
          </thead>
          <tbody>
            {candidates.map((c) => (
              <tr
                key={c.candidate.hubspot_id}
                onClick={() => setSelected(c)}
                className="cursor-pointer border-b border-neutral-50 last:border-0 hover:bg-neutral-50"
              >
                <td className="px-4 py-3 text-neutral-400">{c.rank}</td>
                <td className="px-4 py-3 font-medium text-neutral-900">{c.candidate.full_name}</td>
                <td className="px-4 py-3 text-neutral-600">
                  {c.candidate.linkedin?.current_title || c.candidate.title}
                </td>
                <td className="px-4 py-3 font-semibold text-neutral-900">{c.score.overall_score}</td>
                <td className="px-4 py-3">
                  <RecommendationBadge recommendation={c.score.recommendation} />
                </td>
                <td className="px-4 py-3 text-neutral-600">
                  {c.candidate.linkedin?.wsc_mutual_connections.length ?? 0}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selected && <CandidateDrawer result={selected} onClose={() => setSelected(null)} />}
    </div>
  )
}
