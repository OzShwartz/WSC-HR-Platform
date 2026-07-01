const COLORS: Record<string, string> = {
  'Excellent Match': 'bg-emerald-700',
  'Strong Match': 'bg-emerald-600',
  'Potential Match': 'bg-amber-600',
  'Needs Manual Review': 'bg-slate-500',
  'Low Priority': 'bg-orange-700',
  'Do Not Contact': 'bg-red-800',
}

export function RecommendationBadge({ recommendation }: { recommendation: string }) {
  const color = COLORS[recommendation] ?? 'bg-slate-500'
  return (
    <span
      className={`inline-block rounded px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-white ${color}`}
    >
      {recommendation}
    </span>
  )
}
