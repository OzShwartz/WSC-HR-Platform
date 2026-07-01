import type { ReactNode } from 'react'
import { NavLink } from 'react-router-dom'
import { Briefcase, LayoutDashboard, Settings as SettingsIcon, Users, Building2 } from 'lucide-react'

const NAV = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/candidates', label: 'Candidate Pool', icon: Users },
  { to: '/jobs', label: 'Jobs', icon: Briefcase },
  { to: '/employees', label: 'WSC Team', icon: Building2 },
  { to: '/settings', label: 'Settings', icon: SettingsIcon },
]

export function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <aside className="flex w-60 flex-col border-r border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
        <div className="flex items-center gap-2 border-b border-neutral-100 px-5 py-5 dark:border-neutral-800">
          <div className="rounded-md bg-white p-1.5">
            <img src="/wsc-logo.svg" alt="WSC Sports" className="h-4" />
          </div>
        </div>
        <div className="px-5 pt-4 pb-1 text-[11px] font-semibold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
          Talent Intelligence
        </div>
        <nav className="flex flex-col gap-1 px-3 py-2">
          {NAV.map((item) => {
            const Icon = item.icon
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-neutral-900 text-white dark:bg-[#D0F200] dark:text-neutral-900'
                      : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-100'
                  }`
                }
              >
                <Icon size={16} strokeWidth={2} />
                {item.label}
              </NavLink>
            )
          })}
        </nav>
        <div className="mt-auto border-t border-neutral-100 px-5 py-4 text-[11px] text-neutral-400 dark:border-neutral-800 dark:text-neutral-600">
          MVP — local CSV data
        </div>
      </aside>
      <main className="flex-1 overflow-y-auto">
        <div className="h-1 w-full bg-[#D0F200]" />
        <div className="mx-auto max-w-6xl px-8 py-8">{children}</div>
      </main>
    </div>
  )
}
