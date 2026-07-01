import { useEffect, useState } from 'react'
import { api } from '../api/client'
import type { Integration, ScoringWeights } from '../types'

const LABELS: Record<keyof ScoringWeights, string> = {
  skills: 'Skills',
  experience: 'Experience',
  title: 'Title Similarity',
  industry: 'Industry Match',
  mutual_connections: 'Mutual Connections',
  conference_relevance: 'Conference Relevance',
  education: 'Education',
  recruiter_feedback: 'Recruiter Feedback',
}

export function Settings() {
  const [weights, setWeights] = useState<ScoringWeights | null>(null)
  const [integrations, setIntegrations] = useState<Integration[] | null>(null)

  useEffect(() => {
    api.scoringWeights().then(setWeights)
    api.integrations().then(setIntegrations)
  }, [])

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-bold text-neutral-900">Settings</h1>
        <p className="text-sm text-neutral-500">Configuration — nothing here is hardcoded in the app</p>
      </div>

      <div className="rounded-xl border border-neutral-200 bg-white p-5">
        <h2 className="mb-1 text-sm font-bold uppercase tracking-wide text-neutral-500">Scoring Configuration</h2>
        <p className="mb-4 text-xs text-neutral-400">
          Read from backend/config/scoring_weights.json — changing it recalculates every candidate score.
        </p>
        {!weights ? (
          <div className="text-neutral-400">Loading…</div>
        ) : (
          <div className="flex flex-col gap-2">
            {(Object.keys(LABELS) as (keyof ScoringWeights)[]).map((key) => (
              <div key={key} className="flex items-center gap-3">
                <div className="w-44 text-sm text-neutral-700">{LABELS[key]}</div>
                <div className="h-2 flex-1 rounded-full bg-neutral-100">
                  <div
                    className="h-2 rounded-full bg-[#0B0B0B]"
                    style={{ width: `${weights[key] * 100}%` }}
                  />
                </div>
                <div className="w-12 text-right text-sm font-semibold text-neutral-900">
                  {Math.round(weights[key] * 100)}%
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="rounded-xl border border-neutral-200 bg-white p-5">
        <h2 className="mb-1 text-sm font-bold uppercase tracking-wide text-neutral-500">Integrations</h2>
        <p className="mb-4 text-xs text-neutral-400">
          Assumes access to these systems already exists; today's data path is a CSV export from each.
        </p>
        {!integrations ? (
          <div className="text-neutral-400">Loading…</div>
        ) : (
          <div className="flex flex-col divide-y divide-neutral-100">
            {integrations.map((it) => (
              <div key={it.name} className="flex items-center justify-between py-3">
                <div>
                  <div className="text-sm font-semibold text-neutral-900">{it.name}</div>
                  <div className="text-xs text-neutral-500">{it.mode}</div>
                </div>
                <span
                  className={`rounded px-2.5 py-1 text-[11px] font-bold uppercase ${
                    it.status === 'Connected'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-neutral-100 text-neutral-500'
                  }`}
                >
                  {it.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="rounded-xl border border-neutral-200 bg-white p-5">
        <h2 className="mb-1 text-sm font-bold uppercase tracking-wide text-neutral-500">AI Configuration</h2>
        <p className="text-xs text-neutral-400">
          AI narratives use an LLM when ANTHROPIC_API_KEY / OPENAI_API_KEY is set in .env, and fall back to a
          deterministic template otherwise. Deterministic scores never depend on the LLM either way.
        </p>
      </div>
    </div>
  )
}
