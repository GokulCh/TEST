import type { Metadata } from "next"
import { MatchesSection } from "@/features/matches/components/matches-section"

export const metadata: Metadata = {
  title: "Matches - Ranked Bedwars Configuration",
}

export default function MatchesPage() {
  return <MatchesSection />
}
