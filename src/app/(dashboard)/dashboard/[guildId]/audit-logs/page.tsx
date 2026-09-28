import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Audit Logs - Ranked Bedwars Configuration",
}

export default function AuditLogsPage() {
  return (
    <div>
      <h1 className="text-title">Audit Logs</h1>
      <p className="text-description">Monitor configuration changes and moderation actions.</p>
    </div>
  )
}
