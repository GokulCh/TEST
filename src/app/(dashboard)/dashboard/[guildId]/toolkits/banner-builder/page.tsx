"use client";

import {
	Image as ImageIcon,
	Save,
	Palette,
	Eye,
	RefreshCw,
	Sparkles,
	Code2,
} from "lucide-react";
import { useState } from "react";
import { useUnsavedChanges } from "@/hooks/use-unsaved-changes";

type ThemeKey = "CLASSIC" | "CYBERPUNK" | "NEON";

interface BannerLayout {
	theme: ThemeKey;
	showElo: boolean;
	showWins: boolean;
	showRankIcon: boolean;
	titleText: string;
}

const DEFAULT_BANNER: BannerLayout = {
	theme: "CLASSIC",
	showElo: false,
	showWins: false,
	showRankIcon: false,
	titleText: "",
};

export default function Page() {
	const [isSaving, setIsSaving] = useState(false);
	const [layoutKey, setLayoutKey] = useState("");
	const [banner, setBanner] = useState<BannerLayout>({ ...DEFAULT_BANNER });
	const [savedBanner, setSavedBanner] = useState<BannerLayout>({ ...DEFAULT_BANNER });

	const [savedLayouts, setSavedLayouts] = useState<string[]>([]);

	const { isDirty } = useUnsavedChanges(
		[layoutKey, banner, savedLayouts],
		[layoutKey, savedBanner, savedLayouts],
	);

	const handleInputChange = (field: keyof BannerLayout, value: unknown) => {
		setBanner((prev) => ({ ...prev, [field]: value }));
	};

	const handleSaveChanges = () => {
		setIsSaving(true);
		setTimeout(() => {
			setSavedBanner({ ...banner });
			setIsSaving(false);
		}, 900);
	};

	const handleStoreLayout = () => {
		if (!layoutKey.trim()) return;
		if (!savedLayouts.includes(layoutKey.trim())) {
			setSavedLayouts((prev) => [...prev, layoutKey.trim()]);
		}
	};

	const registryPayload = JSON.stringify(
		{
			[layoutKey || "draft"]: banner,
		},
		null,
		2
	);

	return (
		<div className="w-full p-6 lg:p-8 space-y-6 animate-in fade-in duration-300 select-none max-w-7xl mx-auto text-left">
			{/* HUD PANEL HEADER */}
			<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border-subtle pb-6">
				<div>
					<h1 className="font-mono text-[10px] font-bold uppercase tracking-widest text-fg-muted">
						// Banner Layout Registry (guild_configs.banner_layouts)
					</h1>
					<h2 className="text-2xl font-black tracking-tight text-fg-default mt-1">
						Banner &amp; Card Builder
					</h2>
				</div>

				<button
					onClick={handleSaveChanges}
					className={`h-9 px-4 flex items-center gap-2 border font-mono font-bold text-[11px] uppercase tracking-wider rounded-lg transition-all active:scale-98 cursor-pointer shadow-sm self-start sm:self-auto ${
						isDirty
							? "border-warning/40 bg-warning/10 hover:bg-warning/20 text-warning"
							: "border-primary-500/20 bg-primary-500/10 hover:bg-primary-500/20 text-primary-500"
					}`}
				>
					<Save className="size-3.5" />
					<span>
						{isSaving ? "Compiling Assets..." : "Commit Banner Config"}
					</span>
				</button>
			</div>

			<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
				{/* CONFIG PANEL */}
				<div className="lg:col-span-2 space-y-6">
					<div className="p-5 border border-border-subtle bg-panel-bg/20 backdrop-blur-md rounded-xl space-y-4 shadow-xs">
						<div className="flex items-center gap-2 border-b border-border-subtle/50 pb-2.5">
							<Palette className="size-4 text-primary-500" />
							<h3 className="font-mono text-[11px] font-bold text-fg-default uppercase tracking-widest">
								Graphic Properties
							</h3>
						</div>

						{/* Layout Key + Saved Registry */}
						<div className="flex flex-wrap items-end gap-3">
							<div className="space-y-1.5 flex-1 min-w-[180px]">
								<label className="block font-mono text-[9px] font-bold text-fg-default uppercase tracking-wider">
									Layout Key
								</label>
								<input
									type="text"
									value={layoutKey}
									onChange={(e) => setLayoutKey(e.target.value)}
									className="w-full h-9 px-3 bg-bg-canvas/40 border border-border-subtle rounded-lg font-mono text-xs text-fg-default focus:outline-none focus:border-primary-500/50"
								/>
							</div>
							<div className="space-y-1.5">
								<label className="block font-mono text-[9px] font-bold text-fg-default uppercase tracking-wider">
									Stored Layouts
								</label>
								<div className="flex flex-wrap gap-1.5">
									{savedLayouts.map((k) => (
										<button
											key={k}
											onClick={() => setLayoutKey(k)}
											className={`h-8 px-2.5 border rounded-md font-mono text-[9px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
												layoutKey === k
													? "border-primary-500/40 text-primary-500 bg-primary-500/5"
													: "border-border-subtle text-fg-muted bg-panel-bg hover:text-fg-default"
											}`}
										>
											{k}
										</button>
									))}
									<button
										onClick={handleStoreLayout}
										className="h-8 px-2.5 border border-dashed border-primary-500/30 text-primary-500 bg-primary-500/5 hover:bg-primary-500/10 rounded-md font-mono text-[9px] font-black uppercase tracking-wider transition-all active:scale-95 cursor-pointer"
									>
										<RefreshCw className="size-3 inline mr-1" /> Store Key
									</button>
								</div>
							</div>
						</div>

						<div className="space-y-4 font-mono text-xs text-left">
							<div className="space-y-1.5">
								<label className="block font-bold text-fg-default uppercase tracking-wider">
									Banner Header Title
								</label>
								<input
									type="text"
									value={banner.titleText}
									onChange={(e) => handleInputChange("titleText", e.target.value)}
									className="w-full h-9 px-3 bg-bg-canvas/40 border border-border-subtle rounded-lg text-fg-default focus:outline-none focus:border-primary-500/50"
								/>
							</div>

							<div className="space-y-3">
								<span className="block font-bold text-fg-default uppercase tracking-wider">
									Theme Matrix Variant
								</span>
								<div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
									{[
										{ id: "CLASSIC" as ThemeKey, label: "Classic Dark", desc: "Minimal obsidian theme." },
										{ id: "CYBERPUNK" as ThemeKey, label: "Cyber Orange", desc: "Vibrant high-contrast carbon." },
										{ id: "NEON" as ThemeKey, label: "Neon Blue", desc: "Electric cyber glow." },
									].map((opt) => (
										<div
											key={opt.id}
											onClick={() => handleInputChange("theme", opt.id)}
											className={`p-3 border rounded-xl flex flex-col justify-between cursor-pointer transition-all ${
												banner.theme === opt.id
													? "bg-primary-500/5 border-primary-500/20 text-primary-500"
													: "bg-bg-canvas/10 border-border-subtle/50 opacity-60 text-fg-muted"
											}`}
										>
											<span className="block font-bold uppercase tracking-wider">
												{opt.label}
											</span>
											<span className="text-[8px] uppercase tracking-wide mt-1">
												{opt.desc}
											</span>
										</div>
									))}
								</div>
							</div>

							{/* TOGGLES */}
							<div className="space-y-2 pt-2 border-t border-border-subtle/20">
								{[
									{ key: "showElo" as const, label: "Show ELO Rating" },
									{ key: "showWins" as const, label: "Show Wins Count" },
									{ key: "showRankIcon" as const, label: "Show Rank Icon" },
								].map((t) => (
									<div key={t.key} className="flex items-center justify-between p-2.5 rounded-lg border border-border-subtle/40 bg-bg-canvas/30">
										<span className="font-bold text-fg-default uppercase tracking-wider">{t.label}</span>
										<button
											onClick={() => handleInputChange(t.key, !banner[t.key])}
											className={`h-7 px-3 font-mono font-bold uppercase tracking-wider rounded-md border transition-all cursor-pointer ${
												banner[t.key]
													? "bg-success/10 border-success/30 text-success"
													: "bg-panel-bg border-border-subtle text-fg-muted"
											}`}
										>
											{banner[t.key] ? "ON" : "OFF"}
										</button>
									</div>
								))}
							</div>
						</div>
					</div>

					{/* REGISTRY JSON PAYLOAD */}
					<div className="p-4 border border-border-subtle bg-panel-bg/10 rounded-xl space-y-2 text-left">
						<div className="flex items-center gap-1.5 font-mono text-[10px] font-bold text-fg-default uppercase tracking-wider border-b border-border-subtle/50 pb-2">
							<Code2 className="size-3.5 text-primary-500" />
							<span>Registry Payload (banner_layouts)</span>
						</div>
						<p className="font-mono text-[8px] text-fg-muted uppercase tracking-wide -mt-1">
							Column is nullable raw JSON — keyed per layout, rendered as overlay cards
						</p>
						<pre className="w-full p-3 bg-bg-canvas/40 border border-border-subtle rounded-lg font-mono text-[10px] text-fg-default leading-relaxed overflow-x-auto">
							{registryPayload}
						</pre>
					</div>
				</div>

				{/* CANVAS PREVIEW */}
				<div className="space-y-4">
					<div className="flex items-center gap-2 border-b border-border-subtle/50 pb-2.5 px-1 text-left">
						<Eye className="size-3.5 text-fg-muted" />
						<h3 className="font-mono text-[10px] font-bold text-fg-muted uppercase tracking-widest">
							Asset Live Preview
						</h3>
					</div>

					<div
						className={`w-full aspect-[2/1] rounded-xl border flex flex-col justify-between p-5 relative overflow-hidden transition-all text-left ${
							banner.theme === "CYBERPUNK"
								? "bg-gradient-to-br from-amber-600 to-red-600 border-amber-500/30 shadow-[0_0_15px_rgba(245,158,11,0.1)]"
								: banner.theme === "NEON"
									? "bg-gradient-to-br from-indigo-700 to-cyan-500 border-indigo-500/30 shadow-[0_0_15px_rgba(99,102,241,0.1)]"
									: "bg-[#18191c] border-neutral-800 shadow-2xl"
						}`}
					>
						<div className="font-mono text-[8px] tracking-widest opacity-80 text-white font-black uppercase">
							// {banner.titleText}
						</div>

						<div className="space-y-1">
							<div className="flex items-center gap-2">
								{banner.showRankIcon && (
									<div className="size-7 rounded bg-[#18191c]/30 border border-white/20 flex items-center justify-center">
										<ImageIcon className="size-3.5 text-white/80" />
									</div>
								)}
								<div className="text-white font-extrabold text-xl font-mono uppercase tracking-tight">
									SpeedyBed
								</div>
							</div>
							<div className="font-mono text-[10px] text-white/80 uppercase tracking-wider flex gap-3">
								{banner.showElo && <span>ELO: 1,842</span>}
								{banner.showWins && <span>Wins: 142</span>}
							</div>
						</div>

						<div className="absolute right-4 bottom-4 opacity-15">
							<Sparkles className="size-16 text-white" />
						</div>
					</div>

					<div className="p-4 border border-dashed border-border-subtle bg-panel-bg/5 rounded-xl space-y-2 text-left">
						<p className="font-mono text-[9px] text-fg-muted uppercase leading-relaxed">
							Banners render from the keyed layout objects at request time; fields
							not present fall back to renderer defaults.
						</p>
					</div>
				</div>
			</div>
		</div>
	);
}
