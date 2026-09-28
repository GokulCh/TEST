import type { Metadata } from "next"
import { HostingSection } from "@/features/hosting/hosting-section"

export const metadata: Metadata = {
  title: "Hosting - Ranked Bedwars Configuration",
}

export default function HostingPage() {
  return <HostingSection />
}
