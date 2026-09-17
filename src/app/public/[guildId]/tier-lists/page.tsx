"use client"

import Link from "next/link"
import { ArrowLeft, Clipboard, Download, Palette, Plus, RotateCcw, Search, Trash2 } from "lucide-react"
import { toBlob } from "html-to-image"
import useSWR from "swr"
import { use, useMemo, useRef, useState } from "react"
import { PublicCard, SectionHeading } from "../public-shell"

type PoolPlayer = { id: string; name: string }
type Tier = { id: string; label: string; color: string; players: string[] }

const palette = ["#ff4d5b", "#ff8246", "#ffad45", "#ffd447", "#75df82", "#4bbcf3", "#a77cff", "#e78cff"]
const initialTiers: Tier[] = ["S+", "S", "A+", "A", "B", "C", "D", "F"].map((label, index) => ({ id: `${label}-${index}`, label, color: palette[index], players: [] }))

const fetcher = (url: string) => fetch(url).then((response) => { if (!response.ok) throw new Error("Unable to load players"); return response.json() })

export default function TierListsPage({ params }: { params: Promise<{ guildId: string }> }) {
  const { guildId } = use(params)
  const [tiers, setTiers] = useState(initialTiers)
  const [search, setSearch] = useState("")
  const [selected, setSelected] = useState<string | null>(null)
  const [exporting, setExporting] = useState(false)
  const [openPicker, setOpenPicker] = useState<string | null>(null)
  const boardRef = useRef<HTMLDivElement>(null)
  
  const { data: playerResponse, error: playerError, isLoading: playersLoading } = useSWR<{ data?: { configs?: Array<{ player_id: string; username: string; nickname: string | null }>; stats?: Array<{ player_id: string }> } }>(`/api/public/${guildId}/players?limit=500`, fetcher)
  
  const players = useMemo<PoolPlayer[]>(() => {
    const configs = playerResponse?.data?.configs ?? []
    return configs.map((player) => ({ id: String(player.player_id), name: player.nickname || player.username }))
  }, [playerResponse])
  
  const assigned = useMemo(() => new Set(tiers.flatMap((tier) => tier.players.map(String))), [tiers])
  const pool = useMemo(() => players.filter((player) => !assigned.has(player.id) && player.name.toLowerCase().includes(search.toLowerCase())), [assigned, players, search])

  const updateTier = (id: string, patch: Partial<Tier>) => {
    setTiers((current) => current.map((tier) => tier.id === id ? { ...tier, ...patch } : tier))
  }
  
  const place = (tierId: string, playerId: string) => { 
    setTiers((current) => current.map((tier) => ({ 
      ...tier, 
      players: tier.id === tierId 
        ? [...tier.players.filter((id) => id !== playerId), playerId] 
        : tier.players.filter((id) => id !== playerId) 
    })))
    setSelected(null) 
  }
  
  const removePlayer = (playerId: string) => {
    setTiers((current) => current.map((tier) => ({ ...tier, players: tier.players.filter((id) => id !== playerId) })))
  }
  
  const removeTier = (id: string) => {
    setTiers((current) => current.length > 1 ? current.filter((tier) => tier.id !== id) : current)
  }
  
  const reset = () => { 
    setTiers(initialTiers)
    setSelected(null) 
  }

  const handleDragStart = (playerId: string, sourceTierId?: string) => (event: React.DragEvent) => {
    event.dataTransfer.setData("playerId", playerId)
    if (sourceTierId) {
      event.dataTransfer.setData("sourceTier", sourceTierId)
    }
  }

  const handleDrop = (tierId: string) => (event: React.DragEvent) => {
    event.preventDefault()
    const playerId = event.dataTransfer.getData("playerId")
    const sourceTier = event.dataTransfer.getData("sourceTier")
    
    if (playerId) {
      setTiers((current) => {
        let updated = current
        if (sourceTier) {
          updated = updated.map((t) => t.id === sourceTier ? { ...t, players: t.players.filter((pId) => pId !== playerId) } : t)
        }
        return updated.map((tier) => ({
          ...tier,
          players: tier.id === tierId 
            ? [...tier.players.filter((id) => id !== playerId), playerId] 
            : tier.players.filter((id) => id !== playerId)
        }))
      })
      setSelected(null)
    }
  }

  const makeImage = async () => {
    if (!boardRef.current) return null
    setExporting(true)
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)))

    const source = boardRef.current
    const exportWidth = Math.max(source.scrollWidth, source.clientWidth)
    const exportHeight = source.scrollHeight
    const clone = source.cloneNode(true) as HTMLDivElement
    clone.removeAttribute("data-exporting")
    Object.assign(clone.style, {
      position: "fixed",
      left: "0",
      top: "0",
      width: `${exportWidth}px`,
      minWidth: `${exportWidth}px`,
      maxWidth: "none",
      height: `${exportHeight}px`,
      minHeight: `${exportHeight}px`,
      maxHeight: "none",
      overflow: "visible",
      margin: "0",
      zIndex: "-1",
    })
    document.body.appendChild(clone)

    try {
      return await toBlob(clone, {
        pixelRatio: 2,
        cacheBust: true,
        backgroundColor: "#070a0f",
        width: exportWidth,
        height: exportHeight,
        style: { width: `${exportWidth}px`, height: `${exportHeight}px`, maxWidth: "none", maxHeight: "none", overflow: "visible" },
      })
    } finally {
      clone.remove()
      setExporting(false)
    }
  }
  
  const copyBoard = async () => { 
    const blob = await makeImage()
    if (blob) await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]) 
  }
  
  const downloadImage = async () => { 
    const blob = await makeImage()
    if (!blob) return
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = "tier-list.png"
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <main className="mx-auto max-w-[95rem] px-5 py-12 sm:px-8 sm:py-20">
      <Link href={`/public/${guildId}`} className="mb-10 inline-flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-xs font-semibold text-white/55 hover:border-cyan-300/30 hover:text-cyan-200">
        <ArrowLeft className="size-3.5" /> Community hub
      </Link>
      <div className="mx-auto max-w-4xl text-center">
        <SectionHeading eyebrow="TIER LIST MAKER" title="Rank the players." description="Drag players into a tier, or select one from the pool and tap a row. Rename, add, and remove tiers to make the board yours." />
      </div>
      <div className="mx-auto mt-8 flex max-w-6xl justify-center gap-3">
        <button type="button" onClick={copyBoard} disabled={exporting} className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-4 py-3 text-sm font-semibold text-white/70 hover:border-cyan-300/30 hover:text-cyan-200 disabled:opacity-50">
          <Clipboard className="size-4" /> Copy board
        </button>
        <button type="button" onClick={downloadImage} disabled={exporting} className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-4 py-3 text-sm font-semibold text-white/70 hover:border-cyan-300/30 hover:text-cyan-200 disabled:opacity-50">
          <Download className="size-4" /> Download image
        </button>
      </div>
      <div ref={boardRef} className="mx-auto mt-8 max-w-6xl space-y-2 bg-[#070a0f] p-1" data-exporting={exporting ? "true" : "false"}>
        {tiers.map((tier) => (
          <div key={tier.id} className="flex min-h-16 overflow-hidden rounded-xl border border-white/10 bg-white/[0.025]" onDragOver={(event) => event.preventDefault()} onDrop={handleDrop(tier.id)}>
            <div className="flex w-20 shrink-0 items-center justify-center sm:w-28" style={{ backgroundColor: tier.color }}>
              <input aria-label={`Rename ${tier.label} tier`} value={tier.label} onChange={(event) => updateTier(tier.id, { label: event.target.value })} className="w-full bg-transparent px-2 text-center text-xl font-black text-[#071016] outline-none sm:text-2xl" />
            </div>
            <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2 p-2" onClick={() => selected && place(tier.id, selected)}>
              {tier.players.map((playerId) => {
                const player = players.find((item) => item.id === playerId)
                return player ? (
                  <button key={player.id} type="button" draggable onDragStart={handleDragStart(player.id, tier.id)} onClick={() => removePlayer(player.id)} className="flex items-center gap-2 rounded-lg border border-white/10 bg-black/25 px-3 py-2 text-xs font-semibold text-white/80 hover:border-red-300/30 hover:bg-red-300/10 hover:text-red-200 cursor-pointer">
                    <img src={`https://mc-heads.net/avatar/${player.name}/32`} alt="" className="size-6 rounded-md" />
                    {player.name}
                  </button>
                ) : null
              })}
              {tier.players.length === 0 && <span className="px-2 font-mono text-[10px] font-bold tracking-[.15em] text-white/20">DROP PLAYERS HERE</span>}
            </div>
            <div className={`flex items-center gap-2 px-3 ${exporting ? "hidden" : ""}`} data-export-hide>
              <div className="relative">
                <button type="button" aria-label={`Change ${tier.label} color`} aria-expanded={openPicker === tier.id} onClick={() => setOpenPicker(openPicker === tier.id ? null : tier.id)} className="group inline-flex size-9 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] shadow-inner transition hover:border-cyan-300/40 hover:bg-cyan-300/[0.08]" title={`Change ${tier.label} color`}>
                  <Palette className="size-4 text-white/45 transition group-hover:text-cyan-200" />
                </button>
                {openPicker === tier.id && (
                  <div className="absolute right-0 top-11 z-20 w-64 rounded-xl border border-white/10 bg-[#101720]/95 p-3 shadow-2xl shadow-black/50 backdrop-blur-xl">
                    <div className="mb-3 flex items-center justify-between">
                      <div>
                        <p className="font-mono text-[10px] font-bold tracking-[.16em] text-cyan-200">TIER COLOR</p>
                        <p className="mt-1 text-xs text-white/40">Choose a board accent</p>
                      </div>
                      <span className="size-7 rounded-lg border border-white/15" style={{ backgroundColor: tier.color }} />
                    </div>
                    <div className="grid grid-cols-8 gap-1.5">
                      {palette.map((color) => (
                        <button key={color} type="button" aria-label={`Use ${color}`} onClick={() => updateTier(tier.id, { color })} className="size-6 rounded-md border border-white/10 transition hover:scale-110 hover:border-white/70" style={{ backgroundColor: color }} />
                      ))}
                    </div>
                    <label className="mt-3 block">
                      <span className="sr-only">Custom hex color</span>
                      <input value={tier.color} onChange={(event) => updateTier(tier.id, { color: event.target.value })} onBlur={(event) => { if (!/^#[0-9a-fA-F]{6}$/.test(event.target.value)) updateTier(tier.id, { color: tier.color }) }} className="h-9 w-full rounded-lg border border-white/10 bg-black/20 px-3 font-mono text-xs uppercase text-white/75 outline-none transition focus:border-cyan-300/50" placeholder="#RRGGBB" />
                    </label>
                  </div>
                )}
              </div>
              <span className="hidden font-mono text-[9px] font-bold uppercase tracking-wider text-white/25 xl:inline">Color</span>
              <button type="button" aria-label={`Remove ${tier.label} tier`} onClick={() => removeTier(tier.id)} className="rounded-lg p-2 text-white/25 transition hover:bg-red-400/10 hover:text-red-300">
                <Trash2 className="size-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
      <div className="mx-auto mt-4 flex max-w-6xl flex-wrap items-center justify-between gap-3">
        <button type="button" onClick={() => setTiers((current) => [...current, { id: `tier-${Date.now()}`, label: "New", color: palette[current.length % palette.length], players: [] }])} className="inline-flex items-center gap-2 rounded-lg border border-dashed border-white/15 px-4 py-3 text-sm font-semibold text-white/55 hover:border-cyan-300/30 hover:text-cyan-200">
          <Plus className="size-4" /> Add tier
        </button>
        <button type="button" onClick={reset} className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-4 py-3 text-sm font-semibold text-white/45 hover:text-white">
          <RotateCcw className="size-4" /> Reset board
        </button>
      </div>
      <PublicCard className="mx-auto mt-6 max-w-6xl p-4">
        <div className="flex items-center gap-3">
          <Search className="size-4 text-white/35" />
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search players" className="min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-white/30" />
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {playersLoading ? (
            <p className="text-xs text-white/35">Loading registered players…</p>
          ) : playerError ? (
            <p className="text-xs text-red-300/70">Unable to load registered players.</p>
          ) : pool.length === 0 ? (
            <p className="text-xs text-white/35">No registered players found.</p>
          ) : (
            pool.map((player) => (
              <button key={player.id} type="button" draggable onDragStart={handleDragStart(player.id)} onClick={() => setSelected(player.id)} className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-semibold ${selected === player.id ? "border-cyan-300/50 bg-cyan-300/10 text-cyan-200" : "border-white/10 bg-white/[0.03] text-white/70 hover:border-white/25"}`}>
                <img src={`https://mc-heads.net/avatar/${player.name}/32`} alt="" className="size-6 rounded-md" />
                {player.name}
              </button>
            ))
          )}
        </div>
      </PublicCard>
    </main>
  )
}
