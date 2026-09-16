"use client";

import {
	FlaskConical,
	Info,
	Layers,
	PackageX,
	Plus,
	Ruler,
	Save,
	Timer,
	ToggleLeft,
	ToggleRight,
	Trash2,
} from "lucide-react";
import { useState } from "react";
import { useUnsavedChanges } from "@/hooks/use-unsaved-changes";

interface PresetRecord {
	id: number;
	name: string;
	enabled: boolean;
	baseBuildHeight: number | "Not Set";
	eventsDuration: number;
	potions: { tier: string; custom: boolean }[];
	bannedItems: { category: string; items: string[] }[];
	toggles: { key: string; value: boolean }[];
	phases: number;
	triggers: number;
}

const DEFAULT_TOGGLES = [
	{ key: "spectators", value: true },
	{ key: "breakAll", value: true },
	{ key: "shopPrices", value: true },
	{ key: "gameTimer", value: true },
	{ key: "doubleJump", value: false },
	{ key: "naturalRegen", value: true },
	{ key: "instantRespawn", value: false },
	{ key: "inventorySteal", value: false },
];

export default function Page() {
	const [isSaving, setIsSaving] = useState(false);
	const [presets, setPresets] = useState<PresetRecord[]>([]);
	const [savedPresets, setSavedPresets] = useState<PresetRecord[]>([]);

	const { isDirty } = useUnsavedChanges(presets, savedPresets);

	const togglePreset = (id: number) => {
		setPresets((prev) =>
			prev.map((p) => (p.id === id ? { ...p, enabled: !p.enabled } : p))
		);
	};

	const handleAddPreset = () => {
		setPresets((prev) => [
			...prev,
			{
				id: Math.max(0, ...prev.map((p) => p.id)) + 1,
				name: "Untitled Preset",
				enabled: true,
				baseBuildHeight: "Not Set",
				eventsDuration: 120,
				potions: [],
				bannedItems: [],
				toggles: DEFAULT_TOGGLES.map((t) => ({ ...t })),
				phases: 4,
				triggers: 0,
			},
		]);
	};

	const handleDeletePreset = (id: number) => {
		setPresets((prev) => prev.filter((p) => p.id !== id));
	};

	const handleSaveChanges = () => {
		setIsSaving(true);
		setTimeout(() => {
			setSavedPresets(JSON.parse(JSON.stringify(presets)));
			setIsSaving(false);
		}, 900);
	};

	return (
		<div className="w-full p-6 lg:p-8 space-y-6 animate-in fade-in duration-300 select-none max-w-7xl mx-auto text-left">
			{/* HUD PANEL HEADER */}
			<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border-subtle pb-6">
				<div>
					<h1 className="font-mono text-[10px] font-bold uppercase tracking-widest text-fg-muted">
						// Competitive Game Preset Registry
					</h1>
					<h2 className="text-2xl font-black tracking-tight text-fg-default mt-1">
						Preset Registry
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
						{isSaving ? "Syncing Presets..." : "Commit Preset Registry"}
					</span>
				</button>
			</div>

			{/* ACTION BAR */}
			<div className="flex justify-between items-center bg-panel-bg/10 p-4 border border-border-subtle rounded-xl">
				<div>
					<h3 className="font-mono text-xs font-black text-fg-default uppercase tracking-wide">
						Match State Presets
					</h3>
					<p className="font-mono text-[9px] text-fg-muted uppercase mt-0.5">
						game_meta.settings records applied on match launch
					</p>
				</div>
				<button
					onClick={handleAddPreset}
					className="h-8 px-3 flex items-center gap-1.5 border border-dashed border-primary-500/30 text-primary-500 bg-primary-500/5 hover:bg-primary-500/10 rounded-lg font-mono font-bold text-[10px] uppercase tracking-wider transition-all active:scale-98 cursor-pointer"
				>
					<Plus className="size-3.5" /> Append Preset
				</button>
			</div>

			<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
				<div className="lg:col-span-2 space-y-4">
					{presets.map((preset) => (
						<div
							key={preset.id}
							className="p-4 border border-border-subtle bg-panel-bg/20 rounded-xl space-y-4 shadow-xs animate-in fade-in duration-150"
						>
							{/* PRESET HEADER */}
							<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border-subtle/20">
								<div className="flex items-center gap-3">
									<div className="size-9 rounded-lg border border-primary-500/20 bg-primary-500/10 flex items-center justify-center">
										<Layers className="size-4 text-primary-500" />
									</div>
									<div>
										<p className="font-mono text-[9px] font-bold text-fg-muted uppercase tracking-wider">
											Preset #{preset.id}
										</p>
										<h3 className="font-mono text-xs font-black text-fg-default uppercase tracking-wide">
											{preset.name}
										</h3>
									</div>
								</div>
								<div className="flex items-center gap-2 shrink-0">
									<button
										onClick={() => togglePreset(preset.id)}
										className={`h-8 px-3 border rounded-md font-mono text-[9px] font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer ${
											preset.enabled
												? "bg-success/10 border-success/30 text-success"
												: "bg-panel-bg border-border-subtle text-fg-muted"
										}`}
									>
										{preset.enabled ? (
											<ToggleRight className="size-4" />
										) : (
											<ToggleLeft className="size-4" />
										)}
										<span>{preset.enabled ? "Active" : "Disabled"}</span>
									</button>
									<button
										onClick={() => handleDeletePreset(preset.id)}
										className="size-8 flex items-center justify-center border border-border-subtle hover:bg-red-500/10 text-fg-muted hover:text-red-400 rounded-md transition-all cursor-pointer"
									>
										<Trash2 className="size-3.5" />
									</button>
								</div>
							</div>

							{/* RULES METRICS */}
							<div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
								<div className="p-3 rounded-lg border border-border-subtle/40 bg-bg-canvas/20 space-y-1.5">
									<div className="flex items-center gap-1.5">
										<Ruler className="size-3 text-fg-muted" />
										<span className="font-mono text-[8px] font-bold text-fg-muted uppercase tracking-wider">
											Build Height
										</span>
									</div>
									<span className="font-mono text-sm font-black text-fg-default">
										{preset.baseBuildHeight}
									</span>
								</div>
								<div className="p-3 rounded-lg border border-border-subtle/40 bg-bg-canvas/20 space-y-1.5">
									<div className="flex items-center gap-1.5">
										<Timer className="size-3 text-fg-muted" />
										<span className="font-mono text-[8px] font-bold text-fg-muted uppercase tracking-wider">
											Events Duration
										</span>
									</div>
									<span className="font-mono text-sm font-black text-fg-default">
										{preset.eventsDuration}s
									</span>
								</div>
								<div className="p-3 rounded-lg border border-border-subtle/40 bg-bg-canvas/20 space-y-1.5">
									<span className="font-mono text-[8px] font-bold text-fg-muted uppercase tracking-wider">
										Phases
									</span>
									<span className="font-mono text-sm font-black text-fg-default">
										{preset.phases}
									</span>
								</div>
								<div className="p-3 rounded-lg border border-border-subtle/40 bg-bg-canvas/20 space-y-1.5">
									<span className="font-mono text-[8px] font-bold text-fg-muted uppercase tracking-wider">
										Triggers
									</span>
									<span className="font-mono text-sm font-black text-fg-default">
										{preset.triggers}
									</span>
								</div>
							</div>

							{/* POTION SIGNATURE */}
							<div className="space-y-1.5">
								<div className="flex items-center gap-1.5">
									<FlaskConical className="size-3 text-fg-muted" />
									<span className="font-mono text-[8px] font-bold text-fg-muted uppercase tracking-wider">
										Potion Signature
									</span>
								</div>
								<div className="flex flex-wrap gap-1.5">
									{preset.potions.length === 0 ? (
										<span className="font-mono text-[9px] text-fg-muted uppercase tracking-wider">
											None configured
										</span>
									) : (
										preset.potions.map((p) => (
											<span
												key={p.tier}
												className="px-2 py-0.5 rounded-md border border-border-subtle/40 bg-success/5 font-mono text-[9px] font-bold text-success uppercase tracking-wider"
											>
												{p.tier}
											</span>
										))
									)}
								</div>
							</div>

							{/* BANNED ITEMS */}
							<div className="space-y-1.5">
								<div className="flex items-center gap-1.5">
									<PackageX className="size-3 text-fg-muted" />
									<span className="font-mono text-[8px] font-bold text-fg-muted uppercase tracking-wider">
										Initial Banned Items
									</span>
								</div>
								<div className="space-y-1.5">
									{preset.bannedItems.length === 0 ? (
										<span className="font-mono text-[9px] text-fg-muted uppercase tracking-wider">
											Nothing banned at launch
										</span>
									) : (
										preset.bannedItems.map((grp) => (
											<div key={grp.category} className="flex items-center gap-2 flex-wrap">
												<span className="font-mono text-[9px] font-bold text-amber-500 uppercase tracking-wider">
													{grp.category}:
												</span>
												{grp.items.map((item) => (
													<span
														key={item}
														className="px-2 py-0.5 rounded-md border border-border-subtle/40 bg-rose-500/5 font-mono text-[9px] text-rose-400 uppercase tracking-wider"
													>
														{item}
													</span>
												))}
											</div>
										))
									)}
								</div>
							</div>

							{/* BASE TOGGLES */}
							<div className="space-y-1.5">
								<span className="block font-mono text-[8px] font-bold text-fg-muted uppercase tracking-wider">
									Base Toggles
								</span>
								<div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
									{preset.toggles.map((t) => (
										<div
											key={t.key}
											className={`px-2 py-1 rounded-md border font-mono text-[9px] font-bold uppercase tracking-wider ${
												t.value
													? "border-success/30 bg-success/10 text-success"
													: "border-border-subtle/40 bg-bg-canvas/20 text-fg-muted"
											}`}
										>
											{t.key}
										</div>
									))}
								</div>
							</div>
						</div>
					))}
				</div>

				<div className="space-y-6">
					<div className="p-5 border border-border-subtle bg-panel-bg/20 backdrop-blur-md rounded-xl space-y-4 h-fit">
						<div className="flex items-center gap-2 border-b border-border-subtle/50 pb-2.5">
							<Layers className="size-4 text-cyan-500" />
							<h3 className="font-mono text-[11px] font-bold text-fg-default uppercase tracking-widest">
								Preset Inheritance
							</h3>
						</div>
						<p className="font-mono text-[9px] text-fg-muted uppercase tracking-wide leading-relaxed text-left">
							Records persisted to game_meta.settings are selected on match
							launch and govern generators, height caps, equipment bans and phase
							transitions for the whole lobby.
						</p>
					</div>

					<div className="p-4 border border-dashed border-border-subtle bg-panel-bg/5 rounded-xl space-y-2">
						<div className="flex items-center gap-1.5 font-mono text-[10px] font-bold text-fg-default uppercase tracking-wider">
							<Info className="size-3.5 text-primary-500" />
							<span>Enforcement Overlay</span>
						</div>
						<p className="font-mono text-[9px] text-fg-muted uppercase leading-normal text-left">
							Player-conduct enforcement is driven by the strike and punishment
							ladders. Presets here only define the competitive rules a lobby runs
							under.
						</p>
					</div>
				</div>
			</div>
		</div>
	);
}
