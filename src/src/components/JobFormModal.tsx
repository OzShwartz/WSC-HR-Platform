import { useState, type ReactNode } from 'react'
import { X } from 'lucide-react'
import { api } from '../api/client'
import type { Job } from '../types'

const SENIORITY_OPTIONS = ['Entry', 'Junior', 'Mid', 'Mid-Senior', 'Senior', 'Lead', 'Principal', 'Staff']

function toList(text: string): string[] {
  return text
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
}

export function JobFormModal({ onClose, onSaved }: { onClose: () => void; onSaved: (job: Job) => void }) {
  const [title, setTitle] = useState('')
  const [department, setDepartment] = useState('')
  const [seniority, setSeniority] = useState(SENIORITY_OPTIONS[4])
  const [keyDomains, setKeyDomains] = useState('')
  const [requiredSkills, setRequiredSkills] = useState('')
  const [niceToHave, setNiceToHave] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const valid = title.trim() && department.trim() && seniority.trim()

  async function saveAndClose() {
    if (!valid || saving) return
    setSaving(true)
    setError('')
    try {
      const job = await api.createJob({
        title: title.trim(),
        department: department.trim(),
        seniority: seniority.trim(),
        key_domains: toList(keyDomains),
        required_skills: toList(requiredSkills),
        nice_to_have: toList(niceToHave),
      })
      onSaved(job)
      onClose()
    } catch (e) {
      setError(String(e))
      setSaving(false)
    }
  }

  // The X button must always be able to dismiss the modal — if the form isn't
  // valid yet, "close" just cancels (no partial job gets created); if it is
  // valid, closing saves it, same as clicking Save Job.
  function handleCloseIconClick() {
    if (valid) {
      saveAndClose()
    } else {
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-2xl dark:bg-neutral-900">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-neutral-900 dark:text-neutral-50">Add Job</h2>
          <button
            onClick={handleCloseIconClick}
            title={valid ? 'Close (saves the job)' : 'Close (discards this unfinished job)'}
            className="rounded-full p-1.5 text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800"
          >
            <X size={16} />
          </button>
        </div>

        <div className="mt-4 flex flex-col gap-3">
          <Field label="Title *">
            <input value={title} onChange={(e) => setTitle(e.target.value)} className={inputClass} placeholder="e.g. Senior ML Engineer" />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Department *">
              <input value={department} onChange={(e) => setDepartment(e.target.value)} className={inputClass} placeholder="e.g. AI/ML" />
            </Field>
            <Field label="Seniority *">
              <select value={seniority} onChange={(e) => setSeniority(e.target.value)} className={inputClass}>
                {SENIORITY_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </Field>
          </div>
          <Field label="Key Domains" hint="comma-separated">
            <input value={keyDomains} onChange={(e) => setKeyDomains(e.target.value)} className={inputClass} placeholder="Computer Vision, Deep Learning" />
          </Field>
          <Field label="Required Skills" hint="comma-separated">
            <input
              value={requiredSkills}
              onChange={(e) => setRequiredSkills(e.target.value)}
              className={inputClass}
              placeholder="Python, PyTorch, AWS"
            />
          </Field>
          <Field label="Nice to Have" hint="comma-separated">
            <input value={niceToHave} onChange={(e) => setNiceToHave(e.target.value)} className={inputClass} placeholder="Docker, Kubernetes" />
          </Field>
        </div>

        {error && <div className="mt-3 text-sm text-red-600 dark:text-red-400">{error}</div>}

        <div className="mt-5 flex items-center justify-end gap-3">
          {!valid && <span className="text-xs text-neutral-400 dark:text-neutral-500">Title, Department and Seniority are required.</span>}
          <button
            onClick={saveAndClose}
            disabled={!valid || saving}
            className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40 dark:bg-[#D0F200] dark:text-neutral-900"
          >
            {saving ? 'Saving...' : 'Save Job'}
          </button>
        </div>
      </div>
    </div>
  )
}

const inputClass =
  'w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 outline-none focus:border-neutral-400 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100'

function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400">
        {label} {hint && <span className="font-normal text-neutral-400 dark:text-neutral-500">({hint})</span>}
      </span>
      {children}
    </label>
  )
}
