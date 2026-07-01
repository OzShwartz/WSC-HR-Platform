import { useEffect, useMemo, useState } from 'react'
import { api } from '../api/client'
import type { ScoredCandidate } from '../types'
import { RecommendationBadge } from '../components/RecommendationBadge'
import { CandidateDrawer } from '../components/CandidateDrawer'
import { MultiSelectDropdown } from '../components/MultiSelectDropdown'
import { Search } from 'lucide-react'

const ALL = 'All'

export function CandidatePool() {
  const [pool, setPool] = useState<ScoredCandidate[] | null>(null)
  const [query, setQuery] = useState('')
  const [recommendation, setRecommendation] = useState(ALL)
  const [departments, setDepartments] = useState<string[]>([])
  const [selected, setSelected] = useState<ScoredCandidate | null>(null)

  useEffect(() => {
    api.candidatePool().then(setPool)
  }, [])

  const recommendationOptions = useMemo(() => {
    if (!pool) return [ALL]
    return [ALL, ...Array.from(new Set(pool.map((c) => c.score.recommendation)))]
  }, [pool])

  const departmentOptions = useMemo(() => {
    if (!pool) return []
    return Array.from(new Set(pool.map((c) => c.best_matching_job?.department).filter(Boolean))).sort() as string[]
  }, [pool])

  const filtered = useMemo(() => {
    if (!pool) return []
    const q = query.trim().toLowerCase()
    return pool.filter((c) => {
      const matchesQuery =
        !q ||
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
          .includes(q)
      const matchesRec = recommendation === ALL || c.score.recommendation === recommendation
      const matchesDept = departments.length === 0 || (c.best_matching_job && departments.includes(c.best_matching_job.department))
      return matchesQuery && matchesRec && matchesDept
    })
  }, [pool, query, recommendation, departments])

  if (!pool) return <div className="text-neutral-400 dark:text-neutral-500">Loading...</div>

  const sorted = [...filtered].sort((a, b) => b.score.overall_score - a.score.overall_score)

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-neutral-900 dark:text-neutral-50">Candidate Pool</h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            Every conference attendee ever registered - {pool.length} total
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search size={15} className="absolute top-1/2 left-3 -translate-y-1/2 text-neutral-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search name, company, skill, conference..."
              className="w-64 rounded-lg border border-neutral-200 bg-white py-2 pr-3 pl-9 text-sm text-neutral-900 outline-none focus:border-neutral-400 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
            />
          </div>
          <MultiSelectDropdown
            label="Departments"
            options={departmentOptions}
            selected={departments}
            onChange={setDepartments}
          />
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
        </div>
      </div>

      <div className="text-xs text-neutral-400 dark:text-neutral-500">
        {sorted.length} of {pool.length} shown
      </div>

      <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-neutral-100 bg-neutral-50 text-left text-xs uppercase tracking-wide text-neutral-400 dark:border-neutral-800 dark:bg-neutral-800/50 dark:text-neutral-500">
              <th className="px-4 py-3">Candidate</th>
              <th className="px-4 py-3">Company</th>
              <th className="px-4 py-3">Best Matching Job</th>
              <th className="px-4 py-3">Department</th>
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
                className="cursor-pointer border-b border-neutral-50 last:border-0 hover:bg-neutral-50 dark:border-neutral-800/60 dark:hover:bg-neutral-800/40"
              >
                <td className="px-4 py-3 font-medium text-neutral-900 dark:text-neutral-100">
                  {c.candidate.full_name}
                  {!c.candidate.has_linkedin && (
                    <span className="ml-2 rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
                      no LinkedIn
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-neutral-600 dark:text-neutral-400">{c.candidate.company}</td>
                <td className="px-4 py-3 text-neutral-600 dark:text-neutral-400">{c.best_matching_job?.title}</td>
                <td className="px-4 py-3 text-neutral-600 dark:text-neutral-400">{c.best_matching_job?.department}</td>
                <td className="px-4 py-3 font-semibold text-neutral-900 dark:text-neutral-100">{c.score.overall_score}</td>
                <td className="px-4 py-3">
                  <RecommendationBadge recommendation={c.score.recommendation} />
                </td>
                <td className="px-4 py-3 text-neutral-500 dark:text-neutral-400">{c.candidate.conference_name}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selected && <CandidateDrawer result={selected} onClose={() => setSelected(null)} />}
    </div>
  )
}
