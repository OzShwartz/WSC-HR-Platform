import { useEffect, useMemo, useState } from 'react'
import { api } from '../api/client'
import type { Employee } from '../types'
import { Search } from 'lucide-react'

export function Employees() {
  const [employees, setEmployees] = useState<Employee[] | null>(null)
  const [query, setQuery] = useState('')

  useEffect(() => {
    api.employees().then(setEmployees)
  }, [])

  const filtered = useMemo(() => {
    if (!employees) return []
    const q = query.trim().toLowerCase()
    if (!q) return employees
    return employees.filter((e) =>
      [e.full_name, e.title, e.department, ...e.work_history].join(' ').toLowerCase().includes(q),
    )
  }, [employees, query])

  if (!employees) return <div className="text-neutral-400 dark:text-neutral-500">Loading…</div>

  const byDepartment = filtered.reduce<Record<string, Employee[]>>((acc, e) => {
    ;(acc[e.department] ??= []).push(e)
    return acc
  }, {})

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-neutral-900 dark:text-neutral-50">WSC Team</h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            Current employee roster — used to detect mutual LinkedIn connections and referral potential
          </p>
        </div>
        <div className="relative">
          <Search size={15} className="absolute top-1/2 left-3 -translate-y-1/2 text-neutral-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search name, title, department…"
            className="w-72 rounded-lg border border-neutral-200 bg-white py-2 pr-3 pl-9 text-sm text-neutral-900 outline-none focus:border-neutral-400 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
          />
        </div>
      </div>

      <div className="text-xs text-neutral-400 dark:text-neutral-500">
        {filtered.length} of {employees.length} shown
      </div>

      {Object.entries(byDepartment).map(([department, members]) => (
        <div key={department}>
          <h2 className="mb-2 text-xs font-bold uppercase tracking-wide text-neutral-400 dark:text-neutral-500">
            {department} &middot; {members.length}
          </h2>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
            {members.map((e) => (
              <div
                key={e.employee_id}
                className="rounded-xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900"
              >
                <div className="font-semibold text-neutral-900 dark:text-neutral-100">{e.full_name}</div>
                <div className="text-sm text-neutral-500 dark:text-neutral-400">{e.title}</div>
                {e.work_history.length > 0 && (
                  <div className="mt-2 text-[11px] text-neutral-400 dark:text-neutral-500">
                    Previously: {e.work_history.join('; ')}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
