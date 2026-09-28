import type { Metadata } from "next"
import { EloCalculatorSection } from "@/features/simulators/components/elo-calculator-section"
import { PartyCalculatorSection } from "@/features/simulators/components/party-calculator-section"
import { QueueCalculatorSection } from "@/features/simulators/components/queue-calculator-section"
import { RankProgressionSection } from "@/features/simulators/components/rank-progression-section"
import { StrikePreviewSection } from "@/features/simulators/components/strike-preview-section"
import { CaptainCalculatorSection } from "@/features/simulators/components/captain-calculator-section"

export const metadata: Metadata = {
  title: "Simulators - Ranked Bedwars Configuration",
}

export default function SimulatorsPage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-title">Simulators</h1>
      <EloCalculatorSection />
      <PartyCalculatorSection />
      <QueueCalculatorSection />
      <RankProgressionSection />
      <StrikePreviewSection />
      <CaptainCalculatorSection />
    </div>
  )
}
