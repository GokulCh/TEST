import type { Metadata } from "next"
import { PlayerManagementSection } from "@/features/players/components/player-management-section"

export const metadata: Metadata = {
  title: "Players - Ranked Bedwars Configuration",
}

export default function PlayersPage() {
  return <PlayerManagementSection />
}
