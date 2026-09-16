import { ThemeProvider } from "@/components/shared/theme-provider"
import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: {
    default: "myrbw.dev — Competitive infrastructure for Discord",
    template: "%s — myrbw.dev",
  },
  description: "Operate competitive Minecraft communities from one focused command center.",
  applicationName: "myrbw.dev",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  )
}
