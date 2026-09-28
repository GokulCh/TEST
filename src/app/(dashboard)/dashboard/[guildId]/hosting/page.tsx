import { redirect } from "next/navigation"
import { getDashboardPath } from "@/lib/routing-utils"

// This route is superseded by /infrastructure/hosting (see lib/navigation.ts),
// which holds the real, fully-built settings page. Forward here instead of a dead-end page.
export default async function HostingPage({ params }: { params: Promise<{ guildId: string }> }) {
  const { guildId } = await params
  redirect(getDashboardPath(guildId, "/dashboard/infrastructure/hosting"))
}
