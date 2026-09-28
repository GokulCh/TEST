"use client";

import { useEffect, useMemo, useState } from "react";
import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { SortableContext, arrayMove, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Eye, GripVertical, LayoutTemplate, Monitor, Palette, Plus, Save, Smartphone, Sparkles, Type, Upload, Video, WandSparkles } from "lucide-react";
import { cn } from "@/lib/utils";

type BlockType = "hero" | "stats" | "collection" | "rich-text" | "image" | "button" | "video";
type Block = { id: string; type: BlockType; title: string; description: string; accent?: string };
type BuilderState = { activePage: string; published: boolean; theme: { accent: string; radius: string }; pages: Record<string, { label: string; hidden?: boolean; blocks: Block[] }> };

const initialState: BuilderState = {
  activePage: "home", published: false, theme: { accent: "cyan", radius: "xl" }, pages: {
    home: { label: "Home", blocks: [
      { id: "hero", type: "hero", title: "Play sharper. Climb higher.", description: "A bold hero section with your guild's live season and primary call to action." },
      { id: "stats", type: "stats", title: "Community status", description: "Live read-only stats from the public guild API." },
      { id: "collection", type: "collection", title: "Explore the community", description: "A responsive three-column collection grid." },
    ] },
    about: { label: "About", blocks: [{ id: "about-copy", type: "rich-text", title: "Built for competitive communities", description: "Share your story, rules, and what makes your guild different." }] },
    creators: { label: "Creators", blocks: [{ id: "creator-grid", type: "collection", title: "Meet the creators", description: "Showcase streamers, players, and community builders." }] },
    leaderboard: { label: "Leaderboard", blocks: [{ id: "leaderboard", type: "stats", title: "Season leaderboard", description: "A live read-only leaderboard data binding." }] },
  },
};

const palette: { type: BlockType; label: string; icon: typeof Type; description: string }[] = [
  { type: "hero", label: "Hero", icon: Sparkles, description: "Headline, copy, and CTA" },
  { type: "stats", label: "Live stats", icon: WandSparkles, description: "Read-only API binding" },
  { type: "collection", label: "Collection grid", icon: LayoutTemplate, description: "Cards from a collection" },
  { type: "rich-text", label: "Rich text", icon: Type, description: "Formatted content" },
  { type: "image", label: "Image", icon: Upload, description: "Upload or remote image" },
  { type: "button", label: "Button", icon: Plus, description: "Link to a destination" },
  { type: "video", label: "Video embed", icon: Video, description: "Embed a video" },
];

function SortableBlock({ block, selected, onSelect }: { block: Block; selected: boolean; onSelect: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: block.id });
  return <button ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition }} onClick={onSelect} className={cn("group w-full rounded-2xl border bg-card p-5 text-left transition", selected ? "border-primary shadow-[0_0_0_2px_hsl(var(--primary)/.18)]" : "border-border hover:border-primary/50")} {...attributes}>
    <div className="flex items-start gap-3"><span {...listeners} className="mt-1 cursor-grab text-muted-foreground opacity-0 transition group-hover:opacity-100" aria-label={`Reorder ${block.title}`}><GripVertical className="size-4" /></span><div className="min-w-0 flex-1"><div className="mb-2 flex items-center justify-between"><span className="text-[10px] font-semibold uppercase tracking-[.18em] text-primary">{block.type}</span><span className="text-xs text-muted-foreground">{selected ? "Selected" : "Edit"}</span></div><h3 className="text-lg font-semibold tracking-tight">{block.title}</h3><p className="mt-1 text-sm leading-6 text-muted-foreground">{block.description}</p></div></div>
  </button>;
}

export function PageBuilderEditor({ guildId, guildName }: { guildId: string; guildName: string }) {
  const [state, setState] = useState<BuilderState>(initialState);
  const [selectedId, setSelectedId] = useState("hero");
  const [device, setDevice] = useState<"desktop" | "mobile">("desktop");
  const [saveState, setSaveState] = useState<"saved" | "saving" | "error">("saved");
  const page = state.pages[state.activePage];
  const selected = page.blocks.find((block) => block.id === selectedId) ?? page.blocks[0];
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  useEffect(() => { fetch(`/api/db/guilds/${guildId}/page-builder`).then((r) => r.ok ? r.json() : null).then((payload) => { if (payload?.data?.pages) setState({ ...initialState, ...payload.data }); }).catch(() => undefined); }, [guildId]);
  useEffect(() => { if (saveState === "saving") { const timer = window.setTimeout(() => { fetch(`/api/db/guilds/${guildId}/page-builder`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ pageBuilder: state }) }).then((r) => setSaveState(r.ok ? "saved" : "error")).catch(() => setSaveState("error")); }, 1500); return () => window.clearTimeout(timer); } }, [guildId, saveState, state]);
  const update = (next: BuilderState) => { setState(next); setSaveState("saving"); };
  const onDragEnd = ({ active, over }: DragEndEvent) => { if (!over || active.id === over.id) return; const oldIndex = page.blocks.findIndex((b) => b.id === active.id); const newIndex = page.blocks.findIndex((b) => b.id === over.id); update({ ...state, pages: { ...state.pages, [state.activePage]: { ...page, blocks: arrayMove(page.blocks, oldIndex, newIndex) } } }); };
  const addBlock = (type: BlockType) => { const item = palette.find((p) => p.type === type)!; const block = { id: `${type}-${Date.now()}`, type, title: item.label, description: item.description }; update({ ...state, pages: { ...state.pages, [state.activePage]: { ...page, blocks: [...page.blocks, block] } } }); setSelectedId(block.id); };
  const publish = async () => { setSaveState("saving"); const response = await fetch(`/api/db/guilds/${guildId}/page-builder`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ published: true }) }); if (response.ok) { setState((current) => ({ ...current, published: true })); setSaveState("saved"); } else setSaveState("error"); };
  const previewWidth = device === "mobile" ? "max-w-[390px]" : "max-w-[860px]";
  return <main className="min-h-screen bg-muted/30 text-foreground"><header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b bg-background/95 px-5 backdrop-blur"><div className="flex items-center gap-3"><div className="grid size-9 place-items-center rounded-xl bg-primary text-primary-foreground"><WandSparkles className="size-4" /></div><div><p className="text-sm font-semibold">{guildName} site builder</p><p className="text-xs text-muted-foreground">Draft · {saveState === "saving" ? "Saving changes…" : saveState === "error" ? "Save failed" : "All changes saved"}</p></div></div><div className="flex items-center gap-2"><button className="hidden items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium sm:flex"><Eye className="size-4" /> Preview site</button><button onClick={publish} className="flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground"><Save className="size-4" /> Publish</button></div></header><div className="grid min-h-[calc(100vh-4rem)] grid-cols-[240px_minmax(0,1fr)_280px]"><aside className="border-r bg-background p-4"><div className="mb-4 flex items-center justify-between"><p className="text-xs font-semibold uppercase tracking-[.16em] text-muted-foreground">Pages</p><button className="rounded-md p-1.5 hover:bg-muted" aria-label="Add page"><Plus className="size-4" /></button></div><div className="flex flex-col gap-1">{Object.entries(state.pages).map(([key, item]) => <button key={key} onClick={() => { update({ ...state, activePage: key }); setSelectedId(item.blocks[0]?.id ?? ""); }} className={cn("flex items-center justify-between rounded-lg px-3 py-2.5 text-left text-sm", state.activePage === key ? "bg-primary/10 font-semibold text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground")}><span>{item.label}</span>{item.hidden && <span className="text-[10px]">Hidden</span>}</button>)}</div><div className="mt-8 border-t pt-5"><p className="mb-3 text-xs font-semibold uppercase tracking-[.16em] text-muted-foreground">Add block</p><div className="flex flex-col gap-1">{palette.map((item) => <button key={item.type} onClick={() => addBlock(item.type)} className="flex items-center gap-3 rounded-lg px-2 py-2 text-left text-sm text-muted-foreground hover:bg-muted hover:text-foreground"><item.icon className="size-4 text-primary" /><span>{item.label}</span></button>)}</div></div></aside><section className="overflow-auto p-6 lg:p-10"><div className="mx-auto flex max-w-[900px] items-center justify-between pb-5"><div><p className="text-xs font-semibold uppercase tracking-[.16em] text-muted-foreground">Editing page</p><h1 className="mt-1 text-2xl font-semibold tracking-tight">{page.label}</h1></div><div className="flex items-center gap-1 rounded-lg border bg-background p-1"><button onClick={() => setDevice("desktop")} className={cn("rounded-md p-2", device === "desktop" && "bg-muted")} aria-label="Desktop preview"><Monitor className="size-4" /></button><button onClick={() => setDevice("mobile")} className={cn("rounded-md p-2", device === "mobile" && "bg-muted")} aria-label="Mobile preview"><Smartphone className="size-4" /></button></div></div><div className={cn("mx-auto min-h-[720px] rounded-3xl border bg-background p-5 shadow-sm transition-all sm:p-8", previewWidth)}><div className="mb-8 flex items-center justify-between border-b pb-5"><span className="font-semibold">{guildName}</span><nav className="hidden gap-4 text-xs text-muted-foreground sm:flex">{Object.values(state.pages).slice(0, 4).map((item) => <span key={item.label}>{item.label}</span>)}</nav><span className="size-2 rounded-full bg-emerald-500" /></div><DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}><SortableContext items={page.blocks.map((b) => b.id)} strategy={verticalListSortingStrategy}><div className="flex flex-col gap-4">{page.blocks.map((block) => <SortableBlock key={block.id} block={block} selected={selected?.id === block.id} onSelect={() => setSelectedId(block.id)} />)}</div></SortableContext></DndContext></div></section><aside className="border-l bg-background p-5"><div className="mb-6 flex items-center gap-2"><Palette className="size-4 text-primary" /><p className="font-semibold">Inspector</p></div>{selected ? <div className="flex flex-col gap-5"><div><p className="text-xs font-semibold uppercase tracking-[.16em] text-muted-foreground">Block</p><h2 className="mt-2 text-lg font-semibold">{selected.title}</h2><p className="mt-1 text-sm text-muted-foreground">{selected.type} block</p></div><label className="flex flex-col gap-2 text-sm font-medium">Title<input value={selected.title} onChange={(event) => update({ ...state, pages: { ...state.pages, [state.activePage]: { ...page, blocks: page.blocks.map((block) => block.id === selected.id ? { ...block, title: event.target.value } : block) } } })} className="rounded-lg border bg-background px-3 py-2 font-normal outline-none ring-primary focus:ring-2" /></label><label className="flex flex-col gap-2 text-sm font-medium">Description<textarea value={selected.description} onChange={(event) => update({ ...state, pages: { ...state.pages, [state.activePage]: { ...page, blocks: page.blocks.map((block) => block.id === selected.id ? { ...block, description: event.target.value } : block) } } })} className="min-h-24 rounded-lg border bg-background px-3 py-2 font-normal outline-none ring-primary focus:ring-2" /></label><div className="border-t pt-5"><p className="mb-3 text-xs font-semibold uppercase tracking-[.16em] text-muted-foreground">Site theme</p><div className="flex gap-2">{["cyan", "violet", "rose", "amber"].map((accent) => <button key={accent} onClick={() => update({ ...state, theme: { ...state.theme, accent } })} className={cn("size-7 rounded-full border-2", accent === state.theme.accent && "ring-2 ring-primary ring-offset-2")} style={{ backgroundColor: `var(--${accent}-accent, ${accent})` }} aria-label={`${accent} accent`} />)}</div></div></div> : <p className="text-sm text-muted-foreground">Select a block to inspect it.</p>}</aside></div></main>;
}
