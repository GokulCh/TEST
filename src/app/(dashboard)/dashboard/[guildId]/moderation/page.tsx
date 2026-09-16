import type { Metadata } from "next"
import { PunishmentsSection } from "@/features/moderation/components/punishments-section"
import { StrikesSection } from "@/features/moderation/components/strikes-section"

export const metadata: Metadata = {
  title: "Moderation - Ranked Bedwars Configuration",
}

export default function ModerationPage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-title">Moderation</h1>
      <PunishmentsSection />
      <StrikesSection />
    </div>
  )
}
