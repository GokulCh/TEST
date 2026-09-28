"use client"

import { Monitor, Moon, Sun } from "lucide-react"
import { useTheme } from "@/components/shared/theme-provider"

export function AppearanceToggle() {
  const { theme, setTheme } = useTheme()

  const next = theme === "light" ? "dark" : theme === "dark" ? "system" : "light"
  const Icon = theme === "dark" ? Moon : theme === "light" ? Sun : Monitor

  return (
    <button
      onClick={() => setTheme(next)}
      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-fg-muted transition-colors hover:bg-panel-bg hover:text-fg-default"
    >
      <Icon className="size-4" aria-hidden />
      <span className="capitalize">{theme}</span>
    </button>
  )
}
