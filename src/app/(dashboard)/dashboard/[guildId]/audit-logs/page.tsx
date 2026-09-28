import { redirect } from "next/navigation"
import { getDashboardPath } from "@/lib/routing-utils"

// This route is superseded by /networking/audit-logs (see lib/navigation.ts, id "audit"),
// which holds the real, fully-built audit trail. Forward here instead of a dead-end page.
export default async function AuditLogsPage({ params }: { params: Promise<{ guildId: string }> }) {
  const { guildId } = await params
  redirect(getDashboardPath(guildId, "/dashboard/networking/audit-logs"))
}
