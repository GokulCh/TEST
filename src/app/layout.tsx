import { ThemeProvider } from "@/components/shared/theme-provider"
import { Toaster } from "@/components/shared/toaster"
import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: {
    default: "myrbw.dev — Competitive infrastructure for Discord",
    template: "%s — myrbw.dev",
  },
  description: "Operate competitive Minecraft communities from one focused command center.",
  applicationName: "myrbw.dev",
  openGraph: {
    type: "website",
    siteName: "myrbw.dev",
    title: "myrbw.dev — Competitive infrastructure for Discord",
    description: "Operate competitive Minecraft communities from one focused command center.",
  },
  twitter: {
    card: "summary_large_image",
    title: "myrbw.dev — Competitive infrastructure for Discord",
    description: "Operate competitive Minecraft communities from one focused command center.",
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased" suppressHydrationWarning>
        <ThemeProvider>
          <div className="motion-page contents">{children}</div>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  )
}
