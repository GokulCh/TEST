export type PublicPlayer = {
  id: string
  name: string
  slug: string
  rank: string
  elo: number
  wins: number
  games: number
  streak: number
  avatar: string
}

export type PublicGame = { id: string; mode: string; map: string; winner: string; score: string; time: string }

export const guildDisplayName = (guildId: string) => guildId === "demo" ? "PRBW NETWORK" : guildId.replace(/[-_]/g, " ").toUpperCase()
export const guildDomain = (guildId: string) => `${guildId === "demo" ? "prbw" : guildId}.myrbw.dev`

export function slugifyName(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}
