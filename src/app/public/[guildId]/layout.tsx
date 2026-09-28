import { redirect } from "next/navigation"
import { PublicShell } from "./public-shell"
import { getPublicGuildInfo } from "./server-data"
import { resolvePublicGuildId } from "@/lib/server/portal-domains"
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
  const resolved = await resolvePublicGuildId(guildId)
  const guild = await getPublicGuildInfo(resolved)
  if (!guild.exists) return {}
  
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://myrbw.dev"
  const guildUrl = `${baseUrl}/public/${guildId}`
  
  return {
    title: `${guild.name} - Ranked Bedwars`,
    description: `Join ${guild.name} on Ranked Bedwars - Competitive Minecraft Bedwars with ELO matchmaking, leaderboards, and fair play.`,
    openGraph: {
      title: `${guild.name} - Ranked Bedwars`,
      description: `Join ${guild.name} on Ranked Bedwars - Competitive Minecraft Bedwars with ELO matchmaking, leaderboards, and fair play.`,
      url: guildUrl,
      siteName: "Ranked Bedwars",
      type: "website",
      images: [
        {
          url: `${baseUrl}/og-image.png`,
          width: 1200,
          height: 630,
          alt: `${guild.name} - Ranked Bedwars`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${guild.name} - Ranked Bedwars`,
      description: `Join ${guild.name} on Ranked Bedwars - Competitive Minecraft Bedwars with ELO matchmaking, leaderboards, and fair play.`,
      images: [`${baseUrl}/og-image.png`],
    },
    other: {
      "discord:server_id": guildId,
      "discord:server_name": guild.name,
    },
  }
}