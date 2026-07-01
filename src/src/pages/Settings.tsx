import { useEffect, useState } from 'react'
import { api } from '../api/client'
import type { Integration, ScoringWeights } from '../types'
import { useTheme } from '../hooks/useTheme'
import { Moon, Sun, Save, CheckCircle2, AlertCircle } from 'lucide-react'

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
const KEYS = Object.keys(LABELS) as (keyof ScoringWeights)[]

export function Settings() {
  const { theme, toggle } = useTheme()
  const [weights, setWeights] = useState<ScoringWeights | null>(null)
  const [draft, setDraft] = useState<Record<keyof ScoringWeights, number> | null>(null)
  const [integrations, setIntegrations] = useState<Integration[] | null>(null)
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    api.scoringWeights().then((w) => {
      setWeights(w)
      setDraft(Object.fromEntries(KEYS.map((k) => [k, Math.round(w[k] * 100)])) as Record<keyof ScoringWeights, number>)
    })
    api.integrations().then(setIntegrations)
  }, [])

  const total = draft ? KEYS.reduce((sum, k) => sum + (draft[k] || 0), 0) : 0
  const dirty = draft && weights && KEYS.some((k) => draft[k] !== Math.round(weights[k] * 100))

  async function save() {
    if (!draft || total !== 100) return
    setStatus('saving')
    try {
      const payload = Object.fromEntries(KEYS.map((k) => [k, draft[k] / 100])) as unknown as ScoringWeights
      const saved = await api.updateScoringWeights(payload)
      setWeights(saved)
      setStatus('saved')
      setTimeout(() => setStatus('idle'), 2000)
    } catch (e) {
      setErrorMsg(String(e))
      setStatus('error')
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-bold text-neutral-900 dark:text-neutral-50">Settings</h1>
        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          Configuration — nothing here is hardcoded in the app
        </p>
      </div>

      <div className="rounded-xl border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900">
        <h2 className="mb-1 text-sm font-bold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
          Appearance
        </h2>
        <p className="mb-4 text-xs text-neutral-400 dark:text-neutral-500">Persisted locally in your browser.</p>
        <div className="flex items-center gap-3">
          <button
            onClick={toggle}
            className="flex items-center gap-2 rounded-lg border border-neutral-200 px-3 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-800"
          >
            {theme === 'dark' ? <Moon size={15} /> : <Sun size={15} />}
            {theme === 'dark' ? 'Dark mode' : 'Light mode'}
          </button>
          <span className="text-xs text-neutral-400 dark:text-neutral-500">Click to switch</span>
        </div>
      </div>

      <div className="rounded-xl border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900">
        <div className="mb-1 flex items-center justify-between">
          <h2 className="text-sm font-bold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
            Scoring Configuration
          </h2>
          <span
            className={`text-xs font-semibold ${total === 100 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}
          >
            Total: {total}%
          </span>
        </div>
        <p className="mb-4 text-xs text-neutral-400 dark:text-neutral-500">
          Persists to backend/config/scoring_weights.json — saving recalculates every candidate score.
        </p>
        {!draft ? (
          <div className="text-neutral-400 dark:text-neutral-500">Loading…</div>
        ) : (
          <div className="flex flex-col gap-3">
            {KEYS.map((key) => (
              <div key={key} className="flex items-center gap-3">
                <div className="w-44 text-sm text-neutral-700 dark:text-neutral-300">{LABELS[key]}</div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={draft[key]}
                  onChange={(e) => setDraft({ ...draft, [key]: Number(e.target.value) })}
                  className="h-2 flex-1 accent-neutral-900 dark:accent-[#D0F200]"
                />
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={draft[key]}
                  onChange={(e) => setDraft({ ...draft, [key]: Number(e.target.value) })}
                  className="w-16 rounded border border-neutral-200 bg-white px-2 py-1 text-right text-sm text-neutral-900 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
                />
                <span className="text-sm text-neutral-500 dark:text-neutral-400">%</span>
              </div>
            ))}

            <div className="mt-2 flex items-center gap-3">
              <button
                onClick={save}
                disabled={!dirty || total !== 100 || status === 'saving'}
                className="flex items-center gap-2 rounded-lg bg-neutral-900 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40 dark:bg-[#D0F200] dark:text-neutral-900"
              >
                <Save size={15} /> {status === 'saving' ? 'Saving…' : 'Save Weights'}
              </button>
              {status === 'saved' && (
                <span className="flex items-center gap-1 text-sm text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 size={15} /> Saved
                </span>
              )}
              {status === 'error' && (
                <span className="flex items-center gap-1 text-sm text-red-600 dark:text-red-400">
                  <AlertCircle size={15} /> {errorMsg}
                </span>
              )}
              {total !== 100 && (
                <span className="text-sm text-red-600 dark:text-red-400">Weights must sum to 100% to save.</span>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="rounded-xl border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900">
        <h2 className="mb-1 text-sm font-bold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
          Integrations
        </h2>
        <p className="mb-4 text-xs text-neutral-400 dark:text-neutral-500">
          Assumes access to these systems already exists; today's data path is a CSV export from each.
        </p>
        {!integrations ? (
          <div className="text-neutral-400 dark:text-neutral-500">Loading…</div>
        ) : (
          <div className="flex flex-col divide-y divide-neutral-100 dark:divide-neutral-800">
            {integrations.map((it) => (
              <div key={it.name} className="flex items-center justify-between py-3">
                <div>
                  <div className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">{it.name}</div>
                  <div className="text-xs text-neutral-500 dark:text-neutral-400">{it.mode}</div>
                </div>
                <span
                  className={`rounded px-2.5 py-1 text-[11px] font-bold uppercase ${
                    it.status === 'Connected'
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300'
                      : 'bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400'
                  }`}
                >
                  {it.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="rounded-xl border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900">
        <h2 className="mb-1 text-sm font-bold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
          AI Configuration
        </h2>
        <p className="text-xs text-neutral-400 dark:text-neutral-500">
          AI narratives use an LLM when ANTHROPIC_API_KEY / OPENAI_API_KEY is set in .env, and fall back to a
          deterministic template otherwise. Deterministic scores never depend on the LLM either way.
        </p>
      </div>
    </div>
  )
}
