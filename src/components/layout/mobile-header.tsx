"use client"

import Link from "next/link"
import { MobileSidebar } from "@/components/layout/mobile-sidebar"
import { AppearanceToggle } from "@/components/shared/appearance-toggle"

export function MobileHeader() {
  return (
    <header className="flex lg:hidden h-14 items-center justify-between border-b border-border-subtle bg-panel-bg px-4">
      <div className="flex items-center gap-3">
        <MobileSidebar />
        <Link href="/dashboard" className="font-display text-title-card font-bold">
          RB Config
        </Link>
      </div>
      <AppearanceToggle />
    </header>
  )
}
