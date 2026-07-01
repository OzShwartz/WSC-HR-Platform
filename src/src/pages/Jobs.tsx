import { useEffect, useMemo, useState, type MouseEvent } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api/client'
import type { Job } from '../types'
import { Plus, Search, Trash2 } from 'lucide-react'
import { JobFormModal } from '../components/JobFormModal'

export function Jobs() {
  const [jobs, setJobs] = useState<Job[] | null>(null)
  const [query, setQuery] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  useEffect(() => {
    api.jobs().then(setJobs)
  }, [])

  const filtered = useMemo(() => {
    if (!jobs) return []
    const q = query.trim().toLowerCase()
    if (!q) return jobs
    return jobs.filter((job) =>
      [job.title, job.department, job.seniority, ...job.required_skills, ...job.key_domains]
        .join(' ')
        .toLowerCase()
        .includes(q),
    )
  }, [jobs, query])

  async function handleDelete(e: MouseEvent, jobId: string) {
    e.preventDefault()
    e.stopPropagation()
    if (!confirm(`Remove ${jobId}? This deletes it from job_openings.csv.`)) return
    setDeletingId(jobId)
    try {
      await api.deleteJob(jobId)
      setJobs((prev) => prev?.filter((j) => j.job_id !== jobId) ?? null)
    } finally {
      setDeletingId(null)
    }
  }

  if (!jobs) return <div className="text-neutral-400 dark:text-neutral-500">Loading...</div>

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-neutral-900 dark:text-neutral-50">Jobs</h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            Open positions - each with its own candidate ranking
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search size={15} className="absolute top-1/2 left-3 -translate-y-1/2 text-neutral-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search title, department, skill..."
              className="w-72 rounded-lg border border-neutral-200 bg-white py-2 pr-3 pl-9 text-sm text-neutral-900 outline-none focus:border-neutral-400 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100 dark:focus:border-neutral-500"
            />
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-1.5 rounded-lg bg-neutral-900 px-3 py-2 text-sm font-semibold text-white dark:bg-[#D0F200] dark:text-neutral-900"
          >
            <Plus size={15} /> Add Job
          </button>
        </div>
      </div>

      {filtered.length === 0 && (
        <div className="rounded-xl border border-dashed border-neutral-200 p-8 text-center text-sm text-neutral-400 dark:border-neutral-800">
          No jobs match "{query}".
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {filtered.map((job) => (
          <Link
            key={job.job_id}
            to={`/jobs/${job.job_id}`}
            className="group relative rounded-xl border border-neutral-200 bg-white p-5 transition-shadow hover:shadow-md dark:border-neutral-800 dark:bg-neutral-900 dark:hover:shadow-none dark:hover:border-neutral-600"
          >
            <button
              onClick={(e) => handleDelete(e, job.job_id)}
              disabled={deletingId === job.job_id}
              title="Remove job"
              className="absolute top-4 right-4 rounded-md p-1.5 text-neutral-300 opacity-0 hover:bg-red-50 hover:text-red-600 group-hover:opacity-100 dark:text-neutral-600 dark:hover:bg-red-900/30 dark:hover:text-red-400"
            >
              <Trash2 size={15} />
            </button>
            <div className="flex items-center justify-between pr-8">
              <h2 className="text-base font-bold text-neutral-900 dark:text-neutral-50">{job.title}</h2>
              <span className="rounded bg-neutral-100 px-2 py-0.5 text-xs font-semibold text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300">
                {job.job_id}
              </span>
            </div>
            <div className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
              {job.department} &middot; {job.seniority}
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {job.required_skills.map((s) => (
                <span
                  key={s}
                  className="rounded bg-[#0B0B0B]/5 px-2 py-0.5 text-[11px] text-neutral-700 dark:bg-white/10 dark:text-neutral-300"
                >
                  {s}
                </span>
              ))}
            </div>
          </Link>
        ))}
      </div>

      {showForm && (
        <JobFormModal
          onClose={() => setShowForm(false)}
          onSaved={(job) => setJobs((prev) => [...(prev ?? []), job])}
        />
      )}
    </div>
  )
}
