import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Reference - Ranked Bedwars Configuration",
}

export default function ReferencePage() {
  return (
    <div className="page-layout-wrapper p-6">
      <h1 className="text-title">Reference</h1>
      <p className="text-description">API reference and developer documentation.</p>
    </div>
  )
}
