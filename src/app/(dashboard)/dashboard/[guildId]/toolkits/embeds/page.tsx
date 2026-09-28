"use client";

import { Code2, Eye, Palette, Info, Image as ImageIcon, Plus, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { useGuildConfig } from "@/features/dashboard/config-provider";
import { useSectionForm } from "@/hooks/use-section-form";
import type { GuildEmbedConfig } from "@/lib/db-types";

import { PageShell } from "@/components/panel/page-shell";
import { Button, Field, InfoCard, NoteCard, Toggle, TextInput } from "@/components/panel/form-parts";
type PresetKey = "default" | "success" | "error" | "pending" | "info" | "warning" | "clear";

interface PresetSettings {
	author_title: string;
	author_icon: string;
	color: string;
	footer_text: string;
	footer_icon: string;
}

interface EmbedState {
	presets: Record<PresetKey, PresetSettings>;
	assetIcons: Record<string, string>;
	assetThumbnails: Record<string, string>;
	showAuthorIcon: boolean;
	showAuthorTitle: boolean;
	showThumbnail: boolean;
	showFooterIcon: boolean;
	showFooterText: boolean;
	showTimestamp: boolean;
}

const DEFAULT_PRESETS: Record<PresetKey, PresetSettings> = {
	default: { author_title: "", author_icon: "", color: "#5865f2", footer_text: "", footer_icon: "" },
	success: { author_title: "", author_icon: "", color: "#23a55a", footer_text: "", footer_icon: "" },
	error: { author_title: "", author_icon: "", color: "#f23f43", footer_text: "", footer_icon: "" },
	pending: { author_title: "", author_icon: "", color: "#f0b232", footer_text: "", footer_icon: "" },
	info: { author_title: "", author_icon: "", color: "#1973c8", footer_text: "", footer_icon: "" },
	warning: { author_title: "", author_icon: "", color: "#e67e22", footer_text: "", footer_icon: "" },
	clear: { author_title: "", author_icon: "", color: "#2b2d31", footer_text: "", footer_icon: "" },
};

const PRESET_LABELS: Record<PresetKey, string> = {
	default: "Default",
	success: "Success",
	error: "Error",
	pending: "Pending",
	info: "Info",
	warning: "Warning",
	clear: "Clear",
};

const DEFAULT_EMBED_STATE: EmbedState = {
	presets: DEFAULT_PRESETS,
	assetIcons: {},
	assetThumbnails: {},
	showAuthorIcon: true,
	showAuthorTitle: true,
	showThumbnail: false,
	showFooterIcon: true,
	showFooterText: true,
	showTimestamp: true,
};

/** The database stores snake_case; the editor works on camelCase, with defaults for anything never saved. */
function fromStored(stored: Partial<GuildEmbedConfig> | null | undefined): EmbedState {
	return {
		presets: { ...DEFAULT_PRESETS, ...(stored?.presets as Partial<Record<PresetKey, PresetSettings>> | undefined) },
		assetIcons: stored?.assets?.icons ?? {},
		assetThumbnails: stored?.assets?.thumbnails ?? {},
		showAuthorIcon: stored?.show_author_icon ?? DEFAULT_EMBED_STATE.showAuthorIcon,
		showAuthorTitle: stored?.show_author_title ?? DEFAULT_EMBED_STATE.showAuthorTitle,
		showThumbnail: stored?.show_thumbnail ?? DEFAULT_EMBED_STATE.showThumbnail,
		showFooterIcon: stored?.show_footer_icon ?? DEFAULT_EMBED_STATE.showFooterIcon,
		showFooterText: stored?.show_footer_text ?? DEFAULT_EMBED_STATE.showFooterText,
		showTimestamp: stored?.show_timestamp ?? DEFAULT_EMBED_STATE.showTimestamp,
	};
}

function toStored(e: EmbedState): GuildEmbedConfig {
	return {
		show_author_icon: e.showAuthorIcon,
		show_author_title: e.showAuthorTitle,
		show_thumbnail: e.showThumbnail,
		show_footer_icon: e.showFooterIcon,
		show_footer_text: e.showFooterText,
		show_timestamp: e.showTimestamp,
		presets: e.presets,
		assets: { icons: e.assetIcons, thumbnails: e.assetThumbnails },
	};
}

export default function Page() {
	const { config, isLoading, saveConfigSection } = useGuildConfig();
	const [activePreset, setActivePreset] = useState<PresetKey>("default");

	const saved = useMemo(() => (config ? fromStored(config.embed) : null), [config]);
	const form = useSectionForm<EmbedState>(saved, DEFAULT_EMBED_STATE, (e) => saveConfigSection("embed", toStored(e)));
	const { value: embedState, setValue: setEmbedState } = form;

	// Convenience helpers
	const presets = embedState.presets;
	const { showAuthorIcon, showAuthorTitle, showThumbnail, showFooterIcon, showFooterText, showTimestamp, assetIcons, assetThumbnails } = embedState;

	const [newIconKey, setNewIconKey] = useState("");
	const [newIconUrl, setNewIconUrl] = useState("");
	const [newThumbKey, setNewThumbKey] = useState("");
	const [newThumbUrl, setNewThumbUrl] = useState("");

	const updatePreset = (key: PresetKey, updates: Partial<PresetSettings>) => {
		setEmbedState((prev) => ({
			...prev,
			presets: { ...prev.presets, [key]: { ...prev.presets[key], ...updates } },
		}));
	};

	const toggleDisplay = (field: keyof Pick<EmbedState, "showAuthorIcon" | "showAuthorTitle" | "showThumbnail" | "showFooterIcon" | "showFooterText" | "showTimestamp">) => {
		setEmbedState((prev) => ({ ...prev, [field]: !prev[field] }));
	};

	const addIcon = () => {
		if (!newIconKey.trim()) return;
		setEmbedState((prev) => ({ ...prev, assetIcons: { ...prev.assetIcons, [newIconKey.trim()]: newIconUrl.trim() } }));
		setNewIconKey("");
		setNewIconUrl("");
	};

	const addThumb = () => {
		if (!newThumbKey.trim()) return;
		setEmbedState((prev) => ({ ...prev, assetThumbnails: { ...prev.assetThumbnails, [newThumbKey.trim()]: newThumbUrl.trim() } }));
		setNewThumbKey("");
		setNewThumbUrl("");
	};

	const removeIcon = (k: string) => {
		setEmbedState((prev) => {
			const n = { ...prev.assetIcons };
			delete n[k];
			return { ...prev, assetIcons: n };
		});
	};

	const removeThumb = (k: string) => {
		setEmbedState((prev) => {
			const n = { ...prev.assetThumbnails };
			delete n[k];
			return { ...prev, assetThumbnails: n };
		});
	};

	const active = presets[activePreset];

	const G_TOGGLES: Array<{ label: string; field: keyof Pick<EmbedState, "showAuthorIcon" | "showAuthorTitle" | "showThumbnail" | "showFooterIcon" | "showFooterText" | "showTimestamp">; active: boolean }> = [
		{ label: "Show Author Icon", field: "showAuthorIcon", active: showAuthorIcon },
		{ label: "Show Author Title", field: "showAuthorTitle", active: showAuthorTitle },
		{ label: "Show Thumbnail", field: "showThumbnail", active: showThumbnail },
		{ label: "Show Footer Icon", field: "showFooterIcon", active: showFooterIcon },
		{ label: "Show Footer Text", field: "showFooterText", active: showFooterText },
		{ label: "Show Timestamp", field: "showTimestamp", active: showTimestamp },
	];

	return (
		<PageShell eyebrow="Toolkits" title="Embed Designer" loading={isLoading} form={form}>

			{/* GLOBAL DISPLAY TOGGLES */}
			<InfoCard icon={<Palette className="size-4 text-primary-500" />} title="Display Options">
				<div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
					{G_TOGGLES.map((t) => (
						<Toggle key={t.label} size="sm" checked={t.active} onChange={() => toggleDisplay(t.field)} onLabel={t.label} offLabel={t.label} className="w-full" />
					))}
				</div>
			</InfoCard>

			<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
				{/* PRESET EDITOR */}
				<InfoCard icon={<Code2 className="size-4 text-primary-500" />} title="Style Editor">
					{/* Preset Switcher */}
					<div className="flex flex-wrap gap-2">
						{(Object.keys(PRESET_LABELS) as PresetKey[]).map((k) => (
							<Button variant="secondary" size="sm"
								key={k}
								onClick={() => setActivePreset(k)}
								
								style={{
									borderColor: activePreset === k ? presets[k].color : undefined,
									background: activePreset === k ? `${presets[k].color}22` : undefined,
									color: activePreset === k ? presets[k].color : undefined,
								}}>
								<span className="size-2 rounded-full shrink-0" style={{ background: presets[k].color }} />
								{PRESET_LABELS[k]}
							</Button>
						))}
					</div>

					<div className="space-y-3 pt-1">
						<div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
							<Field label="Author Title" mini>
								<TextInput mini value={active.author_title} onValueChange={(v) => updatePreset(activePreset, { author_title: v })} />
							</Field>
							<Field label="Accent Color" mini>
								<div className="flex items-center gap-2">
									<input type="color" value={active.color} onChange={(e) => updatePreset(activePreset, { color: e.target.value })} className="size-8 shrink-0 cursor-pointer rounded-md border border-border-subtle bg-bg-canvas/40" />
									<TextInput mini className="flex-1" value={active.color} onValueChange={(v) => updatePreset(activePreset, { color: v })} />
								</div>
							</Field>
						</div>

						<div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
							<Field label="Author Icon (Asset Key / URL)" mini>
								<TextInput mini value={active.author_icon} onValueChange={(v) => updatePreset(activePreset, { author_icon: v })} placeholder="rbbadge or full URL" />
							</Field>
							<Field label="Footer Icon (Asset Key / URL)" mini>
								<TextInput mini value={active.footer_icon} onValueChange={(v) => updatePreset(activePreset, { footer_icon: v })} placeholder="owner or full URL" />
							</Field>
						</div>

						<Field label="Footer Text" mini>
							<TextInput mini value={active.footer_text} onValueChange={(v) => updatePreset(activePreset, { footer_text: v })} />
						</Field>
					</div>
				</InfoCard>

				{/* LIVE PREVIEW + ASSETS */}
				<div className="space-y-4">
					<div className="flex items-center gap-2 border-b border-border-subtle/50 pb-2.5 px-1 text-left">
						<Eye className="size-3.5 text-fg-muted" />
						<h3 className="text-xs font-medium text-fg-muted">
							Discord Render Preview
						</h3>
					</div>

					<div className="w-full bg-[#18191c] rounded-xl p-4 text-left font-sans select-none border border-neutral-800 shadow-2xl relative space-y-3">
						<div className="border-l-4 pl-3 space-y-2" style={{ borderColor: active.color || "#5865f2" }}>
							{(showAuthorIcon || showAuthorTitle) && (
								<div className="flex items-center gap-2">
									{showAuthorIcon && active.author_icon && (
										<div className="size-5 rounded-full bg-neutral-700 flex items-center justify-center text-neutral-300 text-[8px] font-bold">
											҂
										</div>
									)}
									{showAuthorTitle && (
										<span className="text-neutral-400 text-xs font-medium">
											{active.author_title || "No Author Title"}
										</span>
									)}
								</div>
							)}
							{showThumbnail && (
								<div className="size-12 rounded-lg bg-neutral-800 flex items-center justify-center text-neutral-400 text-[8px]">
									[THUMB]
								</div>
							)}
							<div className="text-white font-bold text-sm">Season 4 Championship Arena</div>
							<p className="text-neutral-300 text-xs font-light leading-relaxed">
								Competitive bedwars matches are now open. Link your account to queue.
							</p>
							{(showFooterText || showFooterIcon || showTimestamp) && (
								<div className="flex items-center gap-2 pt-2 text-xs text-neutral-400 font-medium">
									{showFooterIcon && <div className="size-3.5 rounded-full bg-neutral-700 flex items-center justify-center text-[7px]">҂</div>}
									{showFooterText && <span>{active.footer_text || "No Footer Text"}</span>}
									{showTimestamp && <span>Today at 12:00</span>}
								</div>
							)}
						</div>
					</div>

					{/* ASSET LIBRARY */}
					<div className="p-4 border border-dashed border-border-subtle bg-panel-bg/5 rounded-xl space-y-3 text-left">
						<div className="flex items-center gap-1.5 text-[13px] font-semibold text-fg-default">
							<ImageIcon className="size-3.5 text-primary-500" />
							<span>Embed Asset Library</span>
						</div>
						<p className="text-xs text-fg-muted -mt-1">
							Referenced by key (e.g. rbbadge) from preset icon fields
						</p>

						<div className="space-y-3">
							<div className="flex flex-wrap gap-1.5">
								{Object.entries(assetIcons).map(([k, v]) => (
									<div key={k} className="flex items-center gap-1.5 px-2 h-6 border border-border-subtle rounded-md bg-bg-canvas/30">
										<span className="text-[13px] font-semibold text-fg-default">{k}</span>
										<span className="text-xs text-fg-muted truncate max-w-[160px]">{v}</span>
										<Button variant="secondary" size="icon"
											onClick={() => removeIcon(k)} aria-label="Remove icon"><Trash2 className="size-3" /></Button>
									</div>
								))}
								<div className="flex items-center gap-1.5">
									<TextInput mini className="w-16" value={newIconKey} onValueChange={setNewIconKey} placeholder="key" />
									<TextInput mini className="w-40" value={newIconUrl} onValueChange={setNewIconUrl} placeholder="https://cdn.../icon.png" />
									<Button variant="secondary" size="icon" onClick={addIcon} aria-label="Add icon"><Plus className="size-3" /></Button>
								</div>
							</div>
						</div>

						<div className="space-y-1 pt-1 border-t border-border-subtle/30">
							<div className="flex flex-wrap gap-1.5">
								{Object.entries(assetThumbnails).map(([k, v]) => (
									<div key={k} className="flex items-center gap-1.5 px-2 h-6 border border-border-subtle rounded-md bg-bg-canvas/30">
										<span className="text-[13px] font-semibold text-fg-default">{k}</span>
										<span className="text-xs text-fg-muted truncate max-w-[160px]">{v}</span>
										<Button variant="secondary" size="icon"
											onClick={() => removeThumb(k)} aria-label="Remove thumbnail"><Trash2 className="size-3" /></Button>
									</div>
								))}
								<div className="flex items-center gap-1.5">
									<TextInput mini className="w-16" value={newThumbKey} onValueChange={setNewThumbKey} placeholder="key" />
									<TextInput mini className="w-40" value={newThumbUrl} onValueChange={setNewThumbUrl} placeholder="https://cdn.../thumb.png" />
									<Button variant="secondary" size="icon" onClick={addThumb} aria-label="Add thumbnail"><Plus className="size-3" /></Button>
								</div>
							</div>
						</div>
					</div>

					<NoteCard icon={<Info className="size-3.5 text-primary-500" />} title="Preset Routing">
						Each command family selects a preset at render time by key. Icon fields
						accept an asset-library key or a direct URL; the library lives next to
						the presets in embed.assets.
					</NoteCard>
				</div>
			</div>
		</PageShell>
	);
}
