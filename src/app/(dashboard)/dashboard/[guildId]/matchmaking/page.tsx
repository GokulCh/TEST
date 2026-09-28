import { redirect } from "next/navigation"
import { getDashboardPath } from "@/lib/routing-utils"

// This index route has no content of its own — the matchmaking module is configured
// across its sub-pages (queues, ranks, weights, etc., see lib/navigation.ts). Send
// anyone who lands here straight to the first of those instead of a dead-end page.
export default async function MatchmakingPage({ params }: { params: Promise<{ guildId: string }> }) {
  const { guildId } = await params
  redirect(getDashboardPath(guildId, "/dashboard/matchmaking/queues"))
}
