import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api } from '../api/client'
import type { Job, ScoredCandidate } from '../types'
import { RecommendationBadge } from '../components/RecommendationBadge'
import { CandidateDrawer } from '../components/CandidateDrawer'
import { ArrowLeft, Search } from 'lucide-react'

const ALL = 'All'

export function JobDetail() {
  const { jobId } = useParams<{ jobId: string }>()
  const [job, setJob] = useState<Job | null>(null)
  const [candidates, setCandidates] = useState<ScoredCandidate[] | null>(null)
  const [selected, setSelected] = useState<ScoredCandidate | null>(null)
  const [query, setQuery] = useState('')
  const [recommendation, setRecommendation] = useState(ALL)

  useEffect(() => {
    if (!jobId) return
    setJob(null)
    setCandidates(null)
    setQuery('')
    setRecommendation(ALL)
    api.jobCandidates(jobId).then((data) => {
      setJob(data.job)
      setCandidates(data.candidates)
    })
  }, [jobId])

  const recommendationOptions = useMemo(() => {
    if (!candidates) return [ALL]
    return [ALL, ...Array.from(new Set(candidates.map((c) => c.score.recommendation)))]
  }, [candidates])

  const filtered = useMemo(() => {
    if (!candidates) return []
    const q = query.trim().toLowerCase()
    return candidates.filter((c) => {
      const matchesQuery =
        !q ||
        [c.candidate.full_name, c.candidate.company, c.candidate.linkedin?.current_title ?? c.candidate.title]
          .join(' ')
          .toLowerCase()
          .includes(q)
      const matchesRec = recommendation === ALL || c.score.recommendation === recommendation
      return matchesQuery && matchesRec
    })
  }, [candidates, query, recommendation])

  if (!job || !candidates) return <div className="text-neutral-400 dark:text-neutral-500">Loading…</div>

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link
          to="/jobs"
          className="inline-flex items-center gap-1 text-xs font-medium text-neutral-500 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-100"
        >
          <ArrowLeft size={13} /> All Jobs
        </Link>
        <h1 className="mt-1 text-xl font-bold text-neutral-900 dark:text-neutral-50">{job.title}</h1>
        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          {job.department} &middot; {job.seniority} &middot; {candidates.length} candidates evaluated
        </p>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {job.required_skills.map((s) => (
            <span key={s} className="rounded bg-neutral-900 px-2 py-0.5 text-[11px] text-white dark:bg-neutral-100 dark:text-neutral-900">
              {s}
            </span>
          ))}
          {job.nice_to_have.map((s) => (
            <span key={s} className="rounded bg-neutral-100 px-2 py-0.5 text-[11px] text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300">
              {s}
            </span>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative">
          <Search size={15} className="absolute top-1/2 left-3 -translate-y-1/2 text-neutral-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search candidates…"
            className="w-64 rounded-lg border border-neutral-200 bg-white py-2 pr-3 pl-9 text-sm text-neutral-900 outline-none focus:border-neutral-400 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
          />
        </div>
        <select
          value={recommendation}
          onChange={(e) => setRecommendation(e.target.value)}
          className="rounded-lg border border-neutral-200 bg-white py-2 px-3 text-sm text-neutral-900 outline-none focus:border-neutral-400 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
        >
          {recommendationOptions.map((r) => (
            <option key={r} value={r}>
              {r === ALL ? 'All recommendations' : r}
            </option>
          ))}
        </select>
        <span className="text-xs text-neutral-400 dark:text-neutral-500">
          {filtered.length} of {candidates.length} shown
        </span>
      </div>

      <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-neutral-100 bg-neutral-50 text-left text-xs uppercase tracking-wide text-neutral-400 dark:border-neutral-800 dark:bg-neutral-800/50 dark:text-neutral-500">
              <th className="px-4 py-3">#</th>
              <th className="px-4 py-3">Candidate</th>
              <th className="px-4 py-3">Title</th>
              <th className="px-4 py-3">Score</th>
              <th className="px-4 py-3">Recommendation</th>
              <th className="px-4 py-3">Connections</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((c) => (
              <tr
                key={c.candidate.hubspot_id}
                onClick={() => setSelected(c)}
                className="cursor-pointer border-b border-neutral-50 last:border-0 hover:bg-neutral-50 dark:border-neutral-800/60 dark:hover:bg-neutral-800/40"
              >
                <td className="px-4 py-3 text-neutral-400 dark:text-neutral-500">{c.rank}</td>
                <td className="px-4 py-3 font-medium text-neutral-900 dark:text-neutral-100">{c.candidate.full_name}</td>
                <td className="px-4 py-3 text-neutral-600 dark:text-neutral-400">
                  {c.candidate.linkedin?.current_title || c.candidate.title}
                </td>
                <td className="px-4 py-3 font-semibold text-neutral-900 dark:text-neutral-100">{c.score.overall_score}</td>
                <td className="px-4 py-3">
                  <RecommendationBadge recommendation={c.score.recommendation} />
                </td>
                <td className="px-4 py-3 text-neutral-600 dark:text-neutral-400">
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
