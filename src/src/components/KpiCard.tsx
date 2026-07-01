import type { LucideIcon } from 'lucide-react'

export function KpiCard({
  label,
  value,
  sub,
  icon: Icon,
}: {
  label: string
  value: string | number
  sub?: string
  icon?: LucideIcon
}) {
  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
      <div className="flex items-center justify-between">
        <div className="text-xs font-medium uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
          {label}
        </div>
        {Icon && (
          <div className="rounded-md bg-neutral-100 p-1.5 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400">
            <Icon size={14} />
          </div>
        )}
      </div>
      <div className="mt-1 text-2xl font-bold text-neutral-900 dark:text-neutral-50">{value}</div>
      {sub && <div className="mt-0.5 text-xs text-neutral-500 dark:text-neutral-400">{sub}</div>}
    </div>
  )
}
