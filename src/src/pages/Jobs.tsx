import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api/client'
import type { Job } from '../types'

export function Jobs() {
  const [jobs, setJobs] = useState<Job[] | null>(null)

  useEffect(() => {
    api.jobs().then(setJobs)
  }, [])

  if (!jobs) return <div className="text-neutral-400">Loading…</div>

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-bold text-neutral-900">Jobs</h1>
        <p className="text-sm text-neutral-500">Open positions — each with its own candidate ranking</p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {jobs.map((job) => (
          <Link
            key={job.job_id}
            to={`/jobs/${job.job_id}`}
            className="rounded-xl border border-neutral-200 bg-white p-5 transition-shadow hover:shadow-md"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-neutral-900">{job.title}</h2>
              <span className="rounded bg-neutral-100 px-2 py-0.5 text-xs font-semibold text-neutral-600">
                {job.job_id}
              </span>
            </div>
            <div className="mt-1 text-xs text-neutral-500">
              {job.department} &middot; {job.seniority}
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {job.required_skills.map((s) => (
                <span key={s} className="rounded bg-[#0B0B0B]/5 px-2 py-0.5 text-[11px] text-neutral-700">
                  {s}
                </span>
              ))}
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
