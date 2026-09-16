import type { Metadata } from "next"
import { BannerBuilderSection } from "@/features/banner-builder/banner-builder-section"

export const metadata: Metadata = {
  title: "Banner Builder - Ranked Bedwars Configuration",
}

export default function BannerBuilderPage() {
  return <BannerBuilderSection />
}
