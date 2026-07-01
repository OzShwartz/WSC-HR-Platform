import { useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react'
import { api } from '../api/client'
import type { Employee } from '../types'
import { Search, FileSpreadsheet, Download, Upload } from 'lucide-react'
import { MultiSelectDropdown } from '../components/MultiSelectDropdown'

function toCsv(employees: Employee[]): string {
  const header = 'employee_id,full_name,title,department,linkedin_id,work_history'
  const rows = employees.map((e) =>
    [e.employee_id, e.full_name, e.title, e.department, e.linkedin_id, e.work_history.join(';')]
      .map((field) => (field.includes(',') ? `"${field}"` : field))
      .join(','),
  )
  return [header, ...rows].join('\n')
}

export function Employees() {
  const [employees, setEmployees] = useState<Employee[] | null>(null)
  const [query, setQuery] = useState('')
  const [departments, setDepartments] = useState<string[]>([])
  const [menuOpen, setMenuOpen] = useState(false)
  const [importMessage, setImportMessage] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  function load() {
    api.employees().then(setEmployees)
  }

  useEffect(load, [])

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false)
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  const departmentOptions = useMemo(
    () => (employees ? Array.from(new Set(employees.map((e) => e.department))).sort() : []),
    [employees],
  )

  const filtered = useMemo(() => {
    if (!employees) return []
    const q = query.trim().toLowerCase()
    return employees.filter((e) => {
      const matchesQuery =
        !q || [e.full_name, e.title, e.department, ...e.work_history].join(' ').toLowerCase().includes(q)
      const matchesDept = departments.length === 0 || departments.includes(e.department)
      return matchesQuery && matchesDept
    })
  }, [employees, query, departments])

  function exportCsv() {
    if (!employees) return
    const blob = new Blob([toCsv(employees)], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'wsc_employees.csv'
    a.click()
    URL.revokeObjectURL(url)
    setMenuOpen(false)
  }

  async function onImportFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setMenuOpen(false)
    try {
      const result = await api.importEmployees(file)
      setImportMessage(`Imported ${result.imported} employee row(s).`)
      load()
    } catch (err) {
      setImportMessage(String(err))
    }
    setTimeout(() => setImportMessage(''), 4000)
  }

  if (!employees) return <div className="text-neutral-400 dark:text-neutral-500">Loading...</div>

  const byDepartment = filtered.reduce<Record<string, Employee[]>>((acc, e) => {
    ;(acc[e.department] ??= []).push(e)
    return acc
  }, {})

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-neutral-900 dark:text-neutral-50">WSC Team</h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            Current employee roster - used to detect mutual LinkedIn connections and referral potential
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search size={15} className="absolute top-1/2 left-3 -translate-y-1/2 text-neutral-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search name, title, department..."
              className="w-64 rounded-lg border border-neutral-200 bg-white py-2 pr-3 pl-9 text-sm text-neutral-900 outline-none focus:border-neutral-400 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
            />
          </div>
          <MultiSelectDropdown
            label="Departments"
            options={departmentOptions}
            selected={departments}
            onChange={setDepartments}
          />
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setMenuOpen((v) => !v)}
              title="Import / Export CSV"
              className="flex items-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-200 dark:hover:bg-neutral-800"
            >
              <FileSpreadsheet size={15} /> Import / Export
            </button>
            {menuOpen && (
              <div className="absolute top-full right-0 z-10 mt-1 w-48 overflow-hidden rounded-lg border border-neutral-200 bg-white py-1 shadow-lg dark:border-neutral-700 dark:bg-neutral-800">
                <button
                  onClick={exportCsv}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-neutral-700 hover:bg-neutral-50 dark:text-neutral-200 dark:hover:bg-neutral-700"
                >
                  <Download size={14} /> Export CSV
                </button>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-neutral-700 hover:bg-neutral-50 dark:text-neutral-200 dark:hover:bg-neutral-700"
                >
                  <Upload size={14} /> Import CSV
                </button>
              </div>
            )}
            <input ref={fileInputRef} type="file" accept=".csv" onChange={onImportFile} className="hidden" />
          </div>
        </div>
      </div>

      {importMessage && (
        <div className="rounded-lg border border-neutral-200 bg-white px-4 py-2 text-sm text-neutral-700 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-200">
          {importMessage}
        </div>
      )}

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
