import { useEffect, useMemo, useState } from 'react'
import { api } from '../api/client'
import type { ScoredCandidate } from '../types'
import { RecommendationBadge } from '../components/RecommendationBadge'
import { CandidateDrawer } from '../components/CandidateDrawer'

export function CandidatePool() {
  const [pool, setPool] = useState<ScoredCandidate[] | null>(null)
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState<ScoredCandidate | null>(null)

  useEffect(() => {
    api.candidatePool().then(setPool)
  }, [])

  const filtered = useMemo(() => {
    if (!pool) return []
    const q = query.trim().toLowerCase()
    if (!q) return pool
    return pool.filter((c) =>
      [
        c.candidate.full_name,
        c.candidate.company,
        c.candidate.title,
        c.candidate.conference_name,
        c.candidate.linkedin?.industry ?? '',
        ...(c.candidate.linkedin?.top_skills ?? []),
      ]
        .join(' ')
        .toLowerCase()
        .includes(q),
    )
  }, [pool, query])

  if (!pool) return <div className="text-neutral-400">Loading…</div>

  const sorted = [...filtered].sort((a, b) => b.score.overall_score - a.score.overall_score)

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-neutral-900">Candidate Pool</h1>
          <p className="text-sm text-neutral-500">Every conference attendee ever registered — {pool.length} total</p>
        </div>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search name, company, skill, conference…"
          className="w-72 rounded-lg border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-neutral-400"
        />
      </div>

      <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-neutral-100 bg-neutral-50 text-left text-xs uppercase tracking-wide text-neutral-400">
              <th className="px-4 py-3">Candidate</th>
              <th className="px-4 py-3">Company</th>
              <th className="px-4 py-3">Best Matching Job</th>
              <th className="px-4 py-3">Score</th>
              <th className="px-4 py-3">Recommendation</th>
              <th className="px-4 py-3">Conference</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((c) => (
              <tr
                key={c.candidate.hubspot_id}
                onClick={() => setSelected(c)}
                className="cursor-pointer border-b border-neutral-50 last:border-0 hover:bg-neutral-50"
              >
                <td className="px-4 py-3 font-medium text-neutral-900">
                  {c.candidate.full_name}
                  {!c.candidate.has_linkedin && (
                    <span className="ml-2 rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-800">
                      no LinkedIn
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-neutral-600">{c.candidate.company}</td>
                <td className="px-4 py-3 text-neutral-600">{c.best_matching_job?.title}</td>
                <td className="px-4 py-3 font-semibold text-neutral-900">{c.score.overall_score}</td>
                <td className="px-4 py-3">
                  <RecommendationBadge recommendation={c.score.recommendation} />
                </td>
                <td className="px-4 py-3 text-neutral-500">{c.candidate.conference_name}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selected && <CandidateDrawer result={selected} onClose={() => setSelected(null)} />}
    </div>
  )
}
