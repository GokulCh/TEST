import { redirect } from "next/navigation"
import { getDashboardPath } from "@/lib/routing-utils"

// This route is superseded by /toolkits/bracket-builder (see lib/navigation.ts),
// which holds the real, fully-built editor. Forward here instead of a dead-end page.
export default async function BracketBuilderPage({ params }: { params: Promise<{ guildId: string }> }) {
  const { guildId } = await params
  redirect(getDashboardPath(guildId, "/dashboard/toolkits/bracket-builder"))
}
