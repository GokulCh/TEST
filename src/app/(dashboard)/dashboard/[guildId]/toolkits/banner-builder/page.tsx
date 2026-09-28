"use client";

import { Image as ImageIcon, Palette, Eye, RefreshCw, Sparkles, Code2 } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { useGuildConfig } from "@/features/dashboard/config-provider";
import { useSectionForm } from "@/hooks/use-section-form";

import { PageShell } from "@/components/panel/page-shell";
import { Button, InfoCard } from "@/components/panel/form-parts";
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

/** The stored map is free-form JSON: fill anything missing with the defaults so older saves still open. */
function normalise(stored: Record<string, unknown> | null | undefined): Record<string, BannerLayout> {
	return Object.fromEntries(Object.entries(stored ?? {}).map(([k, v]) => [k, { ...DEFAULT_BANNER, ...(v as Partial<BannerLayout>) }]));
}

export default function Page() {
	const { config, isLoading, saveConfigSection } = useGuildConfig();
	const [layoutKey, setLayoutKey] = useState("");

	const saved = useMemo(() => (config ? normalise(config.banner_layouts) : null), [config]);
	const form = useSectionForm<Record<string, BannerLayout>>(saved, {}, (layouts) => saveConfigSection("banner-layouts", layouts));
	const layouts = form.value;

	const savedLayouts = Object.keys(layouts);
	// Until a key is typed or picked, edit the first stored layout.
	const key = layoutKey || savedLayouts[0] || "";
	const banner = layouts[key] ?? DEFAULT_BANNER;

	const handleInputChange = (field: keyof BannerLayout, value: unknown) => {
		if (!key.trim()) {
			toast.error("Enter a layout key first", { description: "Layouts are saved under their key." });
			return;
		}
		form.setValue((prev) => ({ ...prev, [key]: { ...(prev[key] ?? DEFAULT_BANNER), [field]: value } }));
	};

	const handleStoreLayout = () => {
		const name = key.trim();
		if (!name || layouts[name]) return;
		form.setValue((prev) => ({ ...prev, [name]: { ...DEFAULT_BANNER } }));
	};

	const registryPayload = JSON.stringify({ [key || "draft"]: banner }, null, 2);

	return (
		<PageShell eyebrow="Toolkits" title="Banner &amp; Card Builder" loading={isLoading} form={form}>

			<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
				{/* CONFIG PANEL */}
				<div className="lg:col-span-2 space-y-6">
					<InfoCard icon={<Palette className="size-4 text-primary-500" />} title="Graphic Properties">
						{/* Layout Key + Saved Registry */}
						<div className="flex flex-wrap items-end gap-3">
							<div className="space-y-1.5 flex-1 min-w-[180px]">
								<label className="block text-[13px] font-semibold text-fg-default">
									Layout Key
								</label>
								<input
									type="text"
									value={key}
									onChange={(e) => setLayoutKey(e.target.value)}
									className="w-full h-9 px-3 bg-bg-canvas/40 border border-border-subtle rounded-lg text-sm text-fg-default transition-[border-color,box-shadow] duration-150 hover:border-fg-muted/30 focus:outline-none focus:border-primary-500/60 focus:ring-2 focus:ring-primary-500/15"
								/>
							</div>
							<div className="space-y-1.5">
								<label className="block text-[13px] font-semibold text-fg-default">
									Stored Layouts
								</label>
								<div className="flex flex-wrap gap-1.5">
									{savedLayouts.map((k) => (
										<button
											key={k}
											onClick={() => setLayoutKey(k)}
											className={`h-8 px-2.5 border rounded-md text-xs font-medium transition-all cursor-pointer ${
												key === k
													? "border-primary-500/40 text-primary-500 bg-primary-500/5"
													: "border-border-subtle text-fg-muted bg-panel-bg hover:text-fg-default"
											}`}
										>
											{k}
										</button>
									))}
									<Button variant="dashed" size="sm"
										onClick={handleStoreLayout}>
										<RefreshCw className="size-3 inline mr-1" /> Store Key
									</Button>
								</div>
							</div>
						</div>

						<div className="space-y-4 font-mono text-xs text-left">
							<div className="space-y-1.5">
								<label className="block font-semibold text-fg-default">
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
								<span className="block font-semibold text-fg-default">
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
											<span className="block font-medium">
												{opt.label}
											</span>
											<span className="text-xs mt-1">
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
										<span className="font-semibold text-fg-default">{t.label}</span>
										<button
											onClick={() => handleInputChange(t.key, !banner[t.key])}
											className={`h-7 px-3 font-medium rounded-md border transition-all cursor-pointer ${
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
					</InfoCard>

					{/* REGISTRY JSON PAYLOAD */}
					<div className="p-4 border border-border-subtle bg-panel-bg/10 rounded-xl space-y-2 text-left">
						<div className="flex items-center gap-1.5 text-[13px] font-semibold text-fg-default border-b border-border-subtle/50 pb-2">
							<Code2 className="size-3.5 text-primary-500" />
							<span>Registry Payload (banner_layouts)</span>
						</div>
						<p className="text-xs text-fg-muted -mt-1">
							Column is nullable raw JSON — keyed per layout, rendered as overlay cards
						</p>
						<pre className="w-full p-3 bg-bg-canvas/40 border border-border-subtle rounded-lg text-xs text-fg-default leading-relaxed overflow-x-auto">
							{registryPayload}
						</pre>
					</div>
				</div>

				{/* CANVAS PREVIEW */}
				<div className="space-y-4">
					<div className="flex items-center gap-2 border-b border-border-subtle/50 pb-2.5 px-1 text-left">
						<Eye className="size-3.5 text-fg-muted" />
						<h3 className="text-xs font-medium text-fg-muted">
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
						<div className="text-xs opacity-80 text-white font-medium">
							// {banner.titleText}
						</div>

						<div className="space-y-1">
							<div className="flex items-center gap-2">
								{banner.showRankIcon && (
									<div className="size-7 rounded bg-[#18191c]/30 border border-white/20 flex items-center justify-center">
										<ImageIcon className="size-3.5 text-white/80" />
									</div>
								)}
								<div className="text-white font-extrabold text-xl">
									SpeedyBed
								</div>
							</div>
							<div className="text-xs text-white/80 flex gap-3">
								{banner.showElo && <span>ELO: 1,842</span>}
								{banner.showWins && <span>Wins: 142</span>}
							</div>
						</div>

						<div className="absolute right-4 bottom-4 opacity-15">
							<Sparkles className="size-16 text-white" />
						</div>
					</div>

					<div className="p-4 border border-dashed border-border-subtle bg-panel-bg/5 rounded-xl space-y-2 text-left">
						<p className="text-xs text-fg-muted leading-relaxed">
							Banners render from the keyed layout objects at request time; fields
							not present fall back to renderer defaults.
						</p>
					</div>
				</div>
			</div>
		</PageShell>
	);
}
