"use client";

import {
	Code2,
	Save,
	Eye,
	Palette,
	Info,
	Image as ImageIcon,
	Plus,
	Trash2,
} from "lucide-react";
import { useState } from "react";

type PresetKey = "default" | "success" | "error" | "pending" | "info" | "warning" | "clear";

interface PresetSettings {
	author_title: string;
	author_icon: string;
	color: string;
	footer_text: string;
	footer_icon: string;
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

export default function Page() {
	const [isSaving, setIsSaving] = useState(false);
	const [activePreset, setActivePreset] = useState<PresetKey>("default");

	const [showAuthorIcon, setShowAuthorIcon] = useState(true);
	const [showAuthorTitle, setShowAuthorTitle] = useState(true);
	const [showThumbnail, setShowThumbnail] = useState(false);
	const [showFooterIcon, setShowFooterIcon] = useState(true);
	const [showFooterText, setShowFooterText] = useState(true);
	const [showTimestamp, setShowTimestamp] = useState(true);

	const [presets, setPresets] = useState<Record<PresetKey, PresetSettings>>(DEFAULT_PRESETS);

	const [assetIcons, setAssetIcons] = useState<Record<string, string>>({});
	const [assetThumbnails, setAssetThumbnails] = useState<Record<string, string>>({});
	const [newIconKey, setNewIconKey] = useState("");
	const [newIconUrl, setNewIconUrl] = useState("");
	const [newThumbKey, setNewThumbKey] = useState("");
	const [newThumbUrl, setNewThumbUrl] = useState("");

	const updatePreset = (key: PresetKey, updates: Partial<PresetSettings>) => {
		setPresets((prev) => ({ ...prev, [key]: { ...prev[key], ...updates } }));
	};

	const handleSaveChanges = () => {
		setIsSaving(true);
		setTimeout(() => setIsSaving(false), 900);
	};

	const active = presets[activePreset];

	const addIcon = () => {
		if (!newIconKey.trim()) return;
		setAssetIcons((prev) => ({ ...prev, [newIconKey.trim()]: newIconUrl.trim() }));
		setNewIconKey("");
		setNewIconUrl("");
	};

	const addThumb = () => {
		if (!newThumbKey.trim()) return;
		setAssetThumbnails((prev) => ({ ...prev, [newThumbKey.trim()]: newThumbUrl.trim() }));
		setNewThumbKey("");
		setNewThumbUrl("");
	};

	const G_TOGGLES = [
		{ label: "Show Author Icon", active: showAuthorIcon, set: setShowAuthorIcon },
		{ label: "Show Author Title", active: showAuthorTitle, set: setShowAuthorTitle },
		{ label: "Show Thumbnail", active: showThumbnail, set: setShowThumbnail },
		{ label: "Show Footer Icon", active: showFooterIcon, set: setShowFooterIcon },
		{ label: "Show Footer Text", active: showFooterText, set: setShowFooterText },
		{ label: "Show Timestamp", active: showTimestamp, set: setShowTimestamp },
	];

	return (
		<div className="w-full p-6 lg:p-8 space-y-6 animate-in fade-in duration-300 select-none max-w-7xl mx-auto text-left">
			{/* HUD PANEL HEADER */}
			<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border-subtle pb-6">
				<div>
					<h1 className="font-mono text-[10px] font-bold uppercase tracking-widest text-fg-muted">
						// Embed Preset Engine (guild_configs.embed)
					</h1>
					<h2 className="text-2xl font-black tracking-tight text-fg-default mt-1">
						Embed Studio
					</h2>
				</div>

				<button
					onClick={handleSaveChanges}
					className="h-9 px-4 flex items-center gap-2 border border-primary-500/20 bg-primary-500/10 hover:bg-primary-500/20 text-primary-500 font-mono font-bold text-[11px] uppercase tracking-wider rounded-lg transition-all active:scale-98 cursor-pointer shadow-sm self-start sm:self-auto"
				>
					<Save className="size-3.5" />
					<span>
						{isSaving ? "Caching Template..." : "Commit Embed Template"}
					</span>
				</button>
			</div>

			{/* GLOBAL DISPLAY TOGGLES */}
			<div className="p-4 border border-border-subtle bg-panel-bg/10 rounded-xl">
				<div className="flex items-center gap-2 border-b border-border-subtle/50 pb-2.5 mb-3">
					<Palette className="size-4 text-primary-500" />
					<h3 className="font-mono text-[11px] font-bold text-fg-default uppercase tracking-widest">
						Global Display Toggles
					</h3>
				</div>
				<div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
					{G_TOGGLES.map((t) => (
						<button
							key={t.label}
							onClick={() => t.set(!t.active)}
							className={`h-9 px-2 border rounded-lg font-mono text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer ${
								t.active
									? "border-success/30 bg-success/10 text-success"
									: "border-border-subtle bg-bg-canvas/20 text-fg-muted hover:text-fg-default"
							}`}
						>
							{t.label}
						</button>
					))}
				</div>
			</div>

			<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
				{/* PRESET EDITOR */}
				<div className="p-5 border border-border-subtle bg-panel-bg/20 backdrop-blur-md rounded-xl space-y-4 shadow-xs text-left">
					<div className="flex items-center gap-2 border-b border-border-subtle/50 pb-2.5">
						<Code2 className="size-4 text-primary-500" />
						<h3 className="font-mono text-[11px] font-bold text-fg-default uppercase tracking-widest">
							Preset Style Editor
						</h3>
					</div>

					{/* Preset Switcher */}
					<div className="flex flex-wrap gap-2">
						{(Object.keys(PRESET_LABELS) as PresetKey[]).map((k) => (
							<button
								key={k}
								onClick={() => setActivePreset(k)}
								className="flex items-center gap-1.5 h-7 px-2.5 border rounded-md font-mono text-[9px] font-bold uppercase tracking-wider transition-all cursor-pointer"
								style={{
									borderColor: activePreset === k ? presets[k].color : undefined,
									background: activePreset === k ? `${presets[k].color}22` : undefined,
									color: activePreset === k ? presets[k].color : undefined,
								}}
							>
								<span className="size-2 rounded-full shrink-0" style={{ background: presets[k].color }} />
								{PRESET_LABELS[k]}
							</button>
						))}
					</div>

					<div className="space-y-3 pt-1">
						<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
							<div className="space-y-1">
								<label className="block font-mono text-[8px] font-bold text-fg-muted uppercase tracking-wider">
									Author Title
								</label>
								<input
									type="text"
									value={active.author_title}
									onChange={(e) => updatePreset(activePreset, { author_title: e.target.value })}
									className="w-full h-8 px-2.5 bg-bg-canvas/40 border border-border-subtle rounded-md font-mono text-xs text-fg-default focus:outline-none focus:border-primary-500/50"
								/>
							</div>
							<div className="space-y-1">
								<label className="block font-mono text-[8px] font-bold text-fg-muted uppercase tracking-wider">
									Accent Color
								</label>
								<div className="flex items-center gap-2">
									<input
										type="color"
										value={active.color}
										onChange={(e) => updatePreset(activePreset, { color: e.target.value })}
										className="size-8 rounded-md border border-border-subtle bg-bg-canvas/40 cursor-pointer"
									/>
									<input
										type="text"
										value={active.color}
										onChange={(e) => updatePreset(activePreset, { color: e.target.value })}
										className="flex-1 h-8 px-2.5 bg-bg-canvas/40 border border-border-subtle rounded-md font-mono text-xs text-fg-default focus:outline-none focus:border-primary-500/50"
									/>
								</div>
							</div>
						</div>

						<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
							<div className="space-y-1">
								<label className="block font-mono text-[8px] font-bold text-fg-muted uppercase tracking-wider">
									Author Icon (Asset Key / URL)
								</label>
								<input
									type="text"
									value={active.author_icon}
									onChange={(e) => updatePreset(activePreset, { author_icon: e.target.value })}
									placeholder="rbbadge or full URL"
									className="w-full h-8 px-2.5 bg-bg-canvas/40 border border-border-subtle rounded-md font-mono text-xs text-fg-default focus:outline-none focus:border-primary-500/50"
								/>
							</div>
							<div className="space-y-1">
								<label className="block font-mono text-[8px] font-bold text-fg-muted uppercase tracking-wider">
									Footer Icon (Asset Key / URL)
								</label>
								<input
									type="text"
									value={active.footer_icon}
									onChange={(e) => updatePreset(activePreset, { footer_icon: e.target.value })}
									placeholder="owner or full URL"
									className="w-full h-8 px-2.5 bg-bg-canvas/40 border border-border-subtle rounded-md font-mono text-xs text-fg-default focus:outline-none focus:border-primary-500/50"
								/>
							</div>
						</div>

						<div className="space-y-1">
							<label className="block font-mono text-[8px] font-bold text-fg-muted uppercase tracking-wider">
								Footer Text
							</label>
							<input
								type="text"
								value={active.footer_text}
								onChange={(e) => updatePreset(activePreset, { footer_text: e.target.value })}
								className="w-full h-8 px-2.5 bg-bg-canvas/40 border border-border-subtle rounded-md font-mono text-xs text-fg-default focus:outline-none focus:border-primary-500/50"
							/>
						</div>
					</div>
				</div>

				{/* LIVE PREVIEW + ASSETS */}
				<div className="space-y-4">
					<div className="flex items-center gap-2 border-b border-border-subtle/50 pb-2.5 px-1 text-left">
						<Eye className="size-3.5 text-fg-muted" />
						<h3 className="font-mono text-[10px] font-bold text-fg-muted uppercase tracking-widest">
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
										<span className="text-neutral-400 text-[10px] font-bold uppercase">
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
								<div className="flex items-center gap-2 pt-2 text-[9px] text-neutral-400 uppercase font-bold">
									{showFooterIcon && <div className="size-3.5 rounded-full bg-neutral-700 flex items-center justify-center text-[7px]">҂</div>}
									{showFooterText && <span>{active.footer_text || "No Footer Text"}</span>}
									{showTimestamp && <span>Today at 12:00</span>}
								</div>
							)}
						</div>
					</div>

					{/* ASSET LIBRARY */}
					<div className="p-4 border border-dashed border-border-subtle bg-panel-bg/5 rounded-xl space-y-3 text-left">
						<div className="flex items-center gap-1.5 font-mono text-[10px] font-bold text-fg-default uppercase tracking-wider">
							<ImageIcon className="size-3.5 text-primary-500" />
							<span>Embed Asset Library</span>
						</div>
						<p className="font-mono text-[8px] text-fg-muted uppercase tracking-wide -mt-1">
							Referenced by key (e.g. rbbadge) from preset icon fields
						</p>

						<div className="space-y-3">
							<div className="flex flex-wrap gap-1.5">
								{Object.entries(assetIcons).map(([k, v]) => (
									<div key={k} className="flex items-center gap-1.5 px-2 h-6 border border-border-subtle rounded-md bg-bg-canvas/30">
										<span className="font-mono text-[9px] font-bold text-fg-default">{k}</span>
										<span className="font-mono text-[8px] text-fg-muted truncate max-w-[160px]">{v}</span>
										<button
											onClick={() => setAssetIcons((prev) => { const n = { ...prev }; delete n[k]; return n; })}
											className="text-fg-muted hover:text-red-400 cursor-pointer"
										>
											<Trash2 className="size-3" />
										</button>
									</div>
								))}
								<div className="flex items-center gap-1.5">
									<input
										type="text"
										value={newIconKey}
										onChange={(e) => setNewIconKey(e.target.value)}
										placeholder="key"
										className="h-6 w-16 px-1.5 bg-bg-canvas/40 border border-border-subtle rounded-md font-mono text-[9px] text-fg-default focus:outline-none"
									/>
									<input
										type="text"
										value={newIconUrl}
										onChange={(e) => setNewIconUrl(e.target.value)}
										placeholder="https://cdn.../icon.png"
										className="h-6 w-40 px-1.5 bg-bg-canvas/40 border border-border-subtle rounded-md font-mono text-[9px] text-fg-default focus:outline-none"
									/>
									<button onClick={addIcon} className="size-6 flex items-center justify-center border border-primary-500/30 text-primary-500 rounded-md hover:bg-primary-500/10 cursor-pointer">
										<Plus className="size-3" />
									</button>
								</div>
							</div>
						</div>

						<div className="space-y-1 pt-1 border-t border-border-subtle/30">
							<div className="flex flex-wrap gap-1.5">
								{Object.entries(assetThumbnails).map(([k, v]) => (
									<div key={k} className="flex items-center gap-1.5 px-2 h-6 border border-border-subtle rounded-md bg-bg-canvas/30">
										<span className="font-mono text-[9px] font-bold text-fg-default">{k}</span>
										<span className="font-mono text-[8px] text-fg-muted truncate max-w-[160px]">{v}</span>
										<button
											onClick={() => setAssetThumbnails((prev) => { const n = { ...prev }; delete n[k]; return n; })}
											className="text-fg-muted hover:text-red-400 cursor-pointer"
										>
											<Trash2 className="size-3" />
										</button>
									</div>
								))}
								<div className="flex items-center gap-1.5">
									<input
										type="text"
										value={newThumbKey}
										onChange={(e) => setNewThumbKey(e.target.value)}
										placeholder="key"
										className="h-6 w-16 px-1.5 bg-bg-canvas/40 border border-border-subtle rounded-md font-mono text-[9px] text-fg-default focus:outline-none"
									/>
									<input
										type="text"
										value={newThumbUrl}
										onChange={(e) => setNewThumbUrl(e.target.value)}
										placeholder="https://cdn.../thumb.png"
										className="h-6 w-40 px-1.5 bg-bg-canvas/40 border border-border-subtle rounded-md font-mono text-[9px] text-fg-default focus:outline-none"
									/>
									<button onClick={addThumb} className="size-6 flex items-center justify-center border border-primary-500/30 text-primary-500 rounded-md hover:bg-primary-500/10 cursor-pointer">
										<Plus className="size-3" />
									</button>
								</div>
							</div>
						</div>
					</div>

					<div className="p-4 border border-border-subtle bg-panel-bg/5 rounded-xl space-y-2 text-left">
						<div className="flex items-center gap-1.5 font-mono text-[10px] font-bold text-fg-default uppercase tracking-wider">
							<Info className="size-3.5 text-primary-500" />
							<span>Preset Routing</span>
						</div>
						<p className="font-mono text-[9px] text-fg-muted uppercase leading-normal">
							Each command family selects a preset at render time by key. Icon fields
							accept an asset-library key or a direct URL; the library lives next to
							the presets in embed.assets.
						</p>
					</div>
				</div>
			</div>
		</div>
	);
}