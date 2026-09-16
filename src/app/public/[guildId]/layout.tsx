import { PublicShell } from "./public-shell"

export default async function PublicLayout({ children, params }: { children: React.ReactNode; params: Promise<{ guildId: string }> }) {
  const { guildId } = await params
  return <PublicShell guildId={guildId}>{children}</PublicShell>
}

export async function generateMetadata({ params }: { params: Promise<{ guildId: string }> }) {
  const { guildId } = await params
  return { title: `${guildId.toUpperCase()} Community`, description: `Public community portal for ${guildId}.` }
}
