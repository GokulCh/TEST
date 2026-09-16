import type { Metadata } from "next"
import { MatchmakingSection } from "@/features/matchmaking/matchmaking-section"

export const metadata: Metadata = {
  title: "Matchmaking - Ranked Bedwars Configuration",
}

export default function MatchmakingPage() {
  return <MatchmakingSection />
}
