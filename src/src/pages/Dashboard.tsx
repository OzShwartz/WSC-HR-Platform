import { useEffect, useState } from 'react'
import { api } from '../api/client'
import type { DashboardData } from '../types'
import { KpiCard } from '../components/KpiCard'
import { RecommendationBadge } from '../components/RecommendationBadge'

export function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    api.dashboard().then(setData).catch((e) => setError(String(e)))
  }, [])

  if (error) return <div className="text-red-600">Failed to load dashboard: {error}</div>
  if (!data) return <div className="text-neutral-400">Loading…</div>

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-bold text-neutral-900">Dashboard</h1>
        <p className="text-sm text-neutral-500">Conference-to-hire pipeline at a glance</p>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <KpiCard label="Total Candidates" value={data.total_candidates} />
        <KpiCard label="Open Jobs" value={data.total_jobs} />
        <KpiCard label="Average Score" value={data.average_score} />
        <KpiCard label="Conferences" value={data.conference_count} />
        <KpiCard label="Top Conference" value={data.top_conference.name ?? '—'} sub={`${data.top_conference.count} attendees`} />
        <KpiCard label="Most Requested Skill" value={data.most_requested_skill ?? '—'} />
        <KpiCard label="Strong Matches" value={data.recommendation_counts['Strong Match'] ?? 0} />
        <KpiCard label="Do Not Contact" value={data.recommendation_counts['Do Not Contact'] ?? 0} />
      </div>

      <div className="rounded-xl border border-neutral-200 bg-white p-5">
        <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-neutral-500">
          Recommendation Distribution
        </h2>
        <div className="flex flex-wrap gap-2">
          {Object.entries(data.recommendation_counts).map(([label, count]) => (
            <div key={label} className="flex items-center gap-2 rounded-lg border border-neutral-100 px-3 py-2">
              <RecommendationBadge recommendation={label} />
              <span className="text-sm font-semibold text-neutral-700">{count}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-neutral-200 bg-white p-5">
        <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-neutral-500">
          Top Candidates Right Now
        </h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-neutral-100 text-left text-xs uppercase tracking-wide text-neutral-400">
              <th className="pb-2">Candidate</th>
              <th className="pb-2">Best Matching Job</th>
              <th className="pb-2">Score</th>
              <th className="pb-2">Recommendation</th>
            </tr>
          </thead>
          <tbody>
            {data.top_candidates.map((c) => (
              <tr key={c.full_name} className="border-b border-neutral-50 last:border-0">
                <td className="py-2.5 font-medium text-neutral-900">{c.full_name}</td>
                <td className="py-2.5 text-neutral-600">{c.best_matching_job}</td>
                <td className="py-2.5 font-semibold text-neutral-900">{c.overall_score}</td>
                <td className="py-2.5">
                  <RecommendationBadge recommendation={c.recommendation} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
