"use client"

import { useState } from "react"
import Link from "next/link"
import { useParams, usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

const navItems = [
  { href: "", label: "Overview" },
  { href: "/players", label: "Players" },
  { href: "/matches", label: "Games" },
  { href: "/commands", label: "Commands" },
  { href: "/matchmaking", label: "Matchmaking" },
  { href: "/infrastructure/hosting", label: "Hosting" },
  { href: "/moderation", label: "Moderation" },
  { href: "/toolkits/banner-builder", label: "Banner Builder" },
  { href: "/toolkits/bracket-builder", label: "Bracket Builder" },
  { href: "/simulators", label: "Simulators" },
  { href: "/networking/audit-logs", label: "Audit Logs" },
]

export function MobileSidebar() {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()
  const params = useParams()
  const guildId = params?.guildId as string | undefined

  return (
    <>
      <button
        onClick={() => setOpen(!open)}
        className="p-2 text-fg-muted hover:text-fg-default"
        aria-label="Toggle sidebar"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M3 12h18M3 6h18M3 18h18" />
        </svg>
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40 bg-black/50" onClick={() => setOpen(false)} />
          <aside className="fixed inset-y-0 left-0 z-50 w-64 bg-panel-bg border-r border-border-subtle p-4">
            <div className="flex items-center justify-between mb-6">
              <span className="font-display font-bold">RB Config</span>
              <button onClick={() => setOpen(false)} className="text-fg-muted hover:text-fg-default">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>
            <nav>
              <ul className="flex flex-col gap-1">
                {navItems.map((item) => {
                  const href = guildId ? `/dashboard/${guildId}${item.href}` : `/dashboard${item.href}`
                  const isActive = pathname.startsWith(href)
                  return (
                    <li key={item.href}>
                      <Link
                        href={href}
                        onClick={() => setOpen(false)}
                        className={cn(
                          "flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                          isActive
                            ? "bg-primary-50 text-primary-600"
                            : "text-fg-muted hover:bg-panel-bg hover:text-fg-default"
                        )}
                      >
                        {item.label}
                      </Link>
                    </li>
                  )
                })}
              </ul>
            </nav>
          </aside>
        </>
      )}
    </>
  )
}
