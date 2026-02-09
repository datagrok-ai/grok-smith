import { useState } from 'react'

import type { ReactNode } from 'react'

export interface NavItem {
  label: string
  href: string
  icon?: string
}

export interface PageLayoutProps {
  title: string
  nav?: NavItem[]
  children: ReactNode
}

export function PageLayout({ title, nav = [], children }: PageLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true)

  return (
    <div className="flex h-screen bg-background font-sans text-foreground">
      {/* Sidebar */}
      <aside
        className={`${
          sidebarOpen ? 'w-60' : 'w-0 overflow-hidden'
        } flex flex-col border-r border-border bg-muted transition-all duration-200`}
      >
        <div className="flex h-14 items-center gap-2 border-b border-border px-4">
          <span className="text-lg font-semibold text-primary">Datagrok</span>
        </div>
        <nav className="flex-1 p-2">
          {nav.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-foreground hover:bg-neutral-200"
            >
              {item.icon && <span>{item.icon}</span>}
              {item.label}
            </a>
          ))}
        </nav>
      </aside>

      {/* Main area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        <header className="flex h-14 items-center gap-4 border-b border-border px-6">
          <button
            type="button"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="rounded-md p-1 text-muted-foreground hover:bg-neutral-200 hover:text-foreground"
            aria-label="Toggle sidebar"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
          <h1 className="text-lg font-medium">{title}</h1>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-auto p-6">{children}</main>
      </div>
    </div>
  )
}
