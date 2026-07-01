import { useEffect, useRef, useState } from 'react'
import { ChevronDown } from 'lucide-react'

export function MultiSelectDropdown({
  label,
  options,
  selected,
  onChange,
}: {
  label: string
  options: string[]
  selected: string[]
  onChange: (next: string[]) => void
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  function toggle(option: string) {
    onChange(selected.includes(option) ? selected.filter((o) => o !== option) : [...selected, option])
  }

  const buttonText = selected.length === 0 ? `All ${label}` : `${selected.length} ${label} selected`

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-lg border border-neutral-200 bg-white py-2 px-3 text-sm text-neutral-900 outline-none focus:border-neutral-400 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
      >
        {buttonText}
        <ChevronDown size={14} className="text-neutral-400" />
      </button>
      {open && (
        <div className="absolute top-full right-0 z-10 mt-1 max-h-64 w-56 overflow-y-auto rounded-lg border border-neutral-200 bg-white p-1.5 shadow-lg dark:border-neutral-700 dark:bg-neutral-800">
          {selected.length > 0 && (
            <button
              onClick={() => onChange([])}
              className="mb-1 w-full rounded px-2 py-1 text-left text-xs font-medium text-neutral-500 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-700"
            >
              Clear all
            </button>
          )}
          {options.map((option) => (
            <label
              key={option}
              className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-sm text-neutral-700 hover:bg-neutral-50 dark:text-neutral-200 dark:hover:bg-neutral-700"
            >
              <input
                type="checkbox"
                checked={selected.includes(option)}
                onChange={() => toggle(option)}
                className="accent-neutral-900 dark:accent-[#D0F200]"
              />
              {option}
            </label>
          ))}
        </div>
      )}
    </div>
  )
}
