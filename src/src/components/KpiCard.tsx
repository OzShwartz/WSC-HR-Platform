export function KpiCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-4">
      <div className="text-xs font-medium uppercase tracking-wide text-neutral-500">{label}</div>
      <div className="mt-1 text-2xl font-bold text-neutral-900">{value}</div>
      {sub && <div className="mt-0.5 text-xs text-neutral-500">{sub}</div>}
    </div>
  )
}
