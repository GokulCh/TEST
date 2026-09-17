import { redirect } from "next/navigation"
import { PublicShell } from "./public-shell"
import { getPublicGuildInfo } from "./server-data"
import { resolvePublicGuildId } from "@/lib/portal-domains"
import { PUBLIC_PORTAL_ROOT_DOMAIN } from "@/lib/config-public-url"

// Where unknown/unregistered guilds should be sent. Uses the app URL in
// development so local previews redirect to localhost's landing page; falls
// back to the apex portal domain in production.
const PORTAL_LANDING_URL =
  process.env.NEXT_PUBLIC_APP_URL ?? `https://${PUBLIC_PORTAL_ROOT_DOMAIN}`

export default async function PublicLayout({ children, params }: { children: React.ReactNode; params: Promise<{ guildId: string }> }) {
  const { guildId } = await params
  const resolved = await resolvePublicGuildId(guildId)
  const guild = await getPublicGuildInfo(resolved)
  if (!guild.exists) {
    redirect(PORTAL_LANDING_URL)
  }
  return <PublicShell guildId={guildId} guildName={guild.name}>{children}</PublicShell>
}

export async function generateMetadata({ params }: { params: Promise<{ guildId: string }> }) {
  const { guildId } = await params
  const guild = await getPublicGuildInfo(guildId)
  if (!guild.exists) return {}
  return { title: `${guild.name} Community`, description: `Public community portal for ${guild.name}.` }
}