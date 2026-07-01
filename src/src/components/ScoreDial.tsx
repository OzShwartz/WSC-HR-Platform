export function ScoreDial({ score, confidence }: { score: number; confidence: number }) {
  return (
    <div className="flex items-baseline gap-3">
      <div className="text-3xl font-extrabold text-neutral-900 dark:text-neutral-50">
        {Math.round(score)}
        <span className="text-sm font-medium text-neutral-400 dark:text-neutral-500">/100</span>
      </div>
      <div className="text-xs text-neutral-500 dark:text-neutral-400">confidence {Math.round(confidence * 100)}%</div>
    </div>
  )
}
