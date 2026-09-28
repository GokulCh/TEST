import type { Metadata } from "next"
import { BracketBuilderSection } from "@/features/bracket-builder/bracket-builder-section"

export const metadata: Metadata = {
  title: "Bracket Builder - Ranked Bedwars Configuration",
}

export default function BracketBuilderPage() {
  return <BracketBuilderSection />
}
