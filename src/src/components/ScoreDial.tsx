export function ScoreDial({ score, confidence }: { score: number; confidence: number }) {
  return (
    <div className="flex items-baseline gap-3">
      <div className="text-3xl font-extrabold text-neutral-900">
        {Math.round(score)}
        <span className="text-sm font-medium text-neutral-400">/100</span>
      </div>
      <div className="text-xs text-neutral-500">confidence {Math.round(confidence * 100)}%</div>
    </div>
  )
}
