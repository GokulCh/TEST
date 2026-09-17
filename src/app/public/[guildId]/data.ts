export type PublicPlayer = {
  id: string
  name: string
  rank: string
  elo: number
  wins: number
  games: number
  streak: number
  avatar: string
  avatarUrl: string
}

export const publicPlayers: PublicPlayer[] = [
  { id: "wriggles", name: "WIGGLES", rank: "MASTER", elo: 1842, wins: 142, games: 196, streak: 8, avatar: "W", avatarUrl: "https://nmsr.nickac.dev/face/_Wiggels" },
  { id: "prbw", name: "PRBW", rank: "DIAMOND", elo: 1716, wins: 118, games: 178, streak: 5, avatar: "P", avatarUrl: "https://nmsr.nickac.dev/face/PRBW" },
  { id: "maven", name: "MAVEN", rank: "DIAMOND", elo: 1654, wins: 104, games: 164, streak: 3, avatar: "M", avatarUrl: "https://nmsr.nickac.dev/face/MAVEN" },
  { id: "notch", name: "NOTCH", rank: "PLATINUM", elo: 1548, wins: 92, games: 157, streak: 2, avatar: "N", avatarUrl: "https://nmsr.nickac.dev/face/NOTCH" },
  { id: "cobalt", name: "COBALT", rank: "PLATINUM", elo: 1490, wins: 87, games: 149, streak: 4, avatar: "C", avatarUrl: "https://nmsr.nickac.dev/face/COBALT" },
  { id: "orbit", name: "ORBIT", rank: "GOLD", elo: 1362, wins: 70, games: 142, streak: 1, avatar: "O", avatarUrl: "https://nmsr.nickac.dev/face/ORBIT" },
]

export type PublicGame = { id: string; mode: string; map: string; winner: string; score: string; time: string }

export const publicGames: PublicGame[] = [
  { id: "#8842", mode: "SOLOS", map: "Rooftop", winner: "WIGGLES", score: "5 — 3", time: "12 min ago" },
  { id: "#8841", mode: "DOUBLES", map: "Lighthouse", winner: "PRBW", score: "5 — 1", time: "28 min ago" },
  { id: "#8840", mode: "SOLOS", map: "Ashfire", winner: "MAVEN", score: "5 — 4", time: "41 min ago" },
  { id: "#8839", mode: "RANKED", map: "Hollow", winner: "COBALT", score: "3 — 2", time: "1 hr ago" },
]

export const storeItems = [
  { name: "CHAMPION", detail: "30 days of premium queue access", price: "$9.99", accent: "from-cyan-400/20" },
  { name: "ELO BOOST", detail: "Cosmetic profile badge + frame", price: "$4.99", accent: "from-violet-400/20" },
  { name: "SUPPORTER", detail: "Support the server and unlock perks", price: "$14.99", accent: "from-emerald-400/20" },
]

export const guildDisplayName = (guildId: string) => guildId === "demo" ? "PRBW NETWORK" : guildId.replace(/[-_]/g, " ").toUpperCase()
export const guildDomain = (guildId: string) => `${guildId === "demo" ? "prbw" : guildId}.myrbw.dev`

export const publicStats = [
  ["ONLINE NOW", "128"],
  ["REGISTERED PLAYERS", "2,481"],
  ["GAMES PLAYED", "84,209"],
  ["SEASON", "S14"],
] as const
