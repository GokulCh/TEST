"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

interface NavItem {
  href: string
  label: string
  icon: string
}

export function SidebarNavigation({ items }: { items: NavItem[] }) {
  const pathname = usePathname()

  return (
    <ul className="flex flex-col gap-1">
      {items.map((item) => {
        const isActive = pathname.startsWith(item.href)
        return (
          <li key={item.href}>
            <Link
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
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
  )
}
