import type { ReactNode } from 'react'
import type { ScoredCandidate } from '../types'
import { RecommendationBadge } from './RecommendationBadge'
import { ScoreDial } from './ScoreDial'
import { ExternalLink, X } from 'lucide-react'

function linkedInHref(url: string): string {
  if (!url) return ''
  return url.startsWith('http') ? url : `https://${url}`
}

export function CandidateDrawer({ result, onClose }: { result: ScoredCandidate; onClose: () => void }) {
  const { candidate, score, summary, recommendation_narrative: narrative } = result
  const li = candidate.linkedin

  return (
    <div className="fixed inset-0 z-20 flex justify-end bg-black/30" onClick={onClose}>
      <div
        className="h-full w-full max-w-lg overflow-y-auto bg-white p-6 shadow-2xl dark:bg-neutral-900"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-lg font-bold text-neutral-900 dark:text-neutral-50">{candidate.full_name}</h2>
            <div className="text-sm text-neutral-500 dark:text-neutral-400">
              {(li?.current_title || candidate.title)} @ {(li?.current_company || candidate.company)}
            </div>
            <div className="mt-1.5 flex items-center gap-2">
              {!candidate.has_linkedin && (
                <span className="inline-block rounded bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
                  No LinkedIn match
                </span>
              )}
              {candidate.linkedin_url && (
                <a
                  href={linkedInHref(candidate.linkedin_url)}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 rounded bg-[#0A66C2]/10 px-2 py-0.5 text-[11px] font-semibold text-[#0A66C2] hover:bg-[#0A66C2]/20 dark:bg-[#0A66C2]/20"
                >
                  <ExternalLink size={11} /> LinkedIn Profile
                </a>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-1.5 text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800"
          >
            <X size={16} />
          </button>
        </div>

        <div className="mt-4 flex items-center justify-between rounded-lg border border-neutral-100 p-4 dark:border-neutral-800">
          <ScoreDial score={score.overall_score} confidence={score.confidence} />
          <RecommendationBadge recommendation={score.recommendation} />
        </div>

        <Section title="AI Summary">
          <p className="text-sm text-neutral-700 dark:text-neutral-300">{summary.content}</p>
          <div className="mt-1 text-[11px] text-neutral-400 dark:text-neutral-500">source: {summary.source}</div>
        </Section>

        <Section title="Why This Recommendation">
          <p className="text-sm text-neutral-700 dark:text-neutral-300">{narrative.content}</p>
        </Section>

        {score.missing_skills.length > 0 && (
          <Section title="Missing Required Skills">
            <div className="flex flex-wrap gap-1.5">
              {score.missing_skills.map((s) => (
                <span
                  key={s}
                  className="rounded bg-red-50 px-2 py-0.5 text-[11px] text-red-700 dark:bg-red-900/30 dark:text-red-300"
                >
                  {s}
                </span>
              ))}
            </div>
          </Section>
        )}

        <Section title="Score Breakdown">
          <div className="flex flex-col gap-2">
            {score.sub_scores
              .filter((s) => s.name !== 'domain_relevance_gate')
              .map((s) => (
                <div key={s.name} className="rounded-lg border border-neutral-100 p-2.5 dark:border-neutral-800">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold capitalize text-neutral-800 dark:text-neutral-200">
                      {s.name.replace(/_/g, ' ')}
                    </span>
                    <span className="text-neutral-500 dark:text-neutral-400">
                      {s.raw_score} × {Math.round(s.weight * 100)}% = {s.weighted_score}
                      {s.insufficient_data && (
                        <span className="ml-1 rounded bg-amber-100 px-1.5 py-0.5 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
                          insufficient data
                        </span>
                      )}
                    </span>
                  </div>
                  <div className="mt-1 h-1.5 w-full rounded-full bg-neutral-100 dark:bg-neutral-800">
                    <div
                      className="h-1.5 rounded-full bg-neutral-900 dark:bg-[#D0F200]"
                      style={{ width: `${Math.min(100, s.raw_score)}%` }}
                    />
                  </div>
                  <div className="mt-1 text-[11px] text-neutral-500 dark:text-neutral-400">{s.reasoning}</div>
                </div>
              ))}
          </div>
        </Section>

        {li && (
          <Section title="LinkedIn">
            <div className="text-sm text-neutral-700 dark:text-neutral-300">
              {li.years_experience ?? '?'} yrs &middot; {li.industry}
            </div>
            <div className="mt-1 flex flex-wrap gap-1.5">
              {li.top_skills.map((s) => (
                <span
                  key={s}
                  className="rounded bg-neutral-100 px-2 py-0.5 text-[11px] text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300"
                >
                  {s}
                </span>
              ))}
            </div>
          </Section>
        )}

        <Section title="Conference">
          <div className="text-sm text-neutral-700 dark:text-neutral-300">
            {candidate.conference_name} — {candidate.conference_domain} ({candidate.conference_date})
          </div>
          {candidate.notes && (
            <div className="mt-1 text-xs italic text-neutral-500 dark:text-neutral-400">"{candidate.notes}"</div>
          )}
        </Section>
      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="mt-5">
      <h3 className="mb-1.5 text-xs font-bold uppercase tracking-wide text-neutral-400 dark:text-neutral-500">
        {title}
      </h3>
      {children}
    </div>
  )
}
