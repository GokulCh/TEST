"use client";

import { FlaskConical, Info, Layers, PackageX, Plus, Ruler, Save, Timer, ToggleLeft, ToggleRight, Trash2 } from "lucide-react";
import { useState } from "react";
import { useUnsavedChanges } from "@/hooks/use-unsaved-changes";

import { PageShell } from "@/components/panel/page-shell";
import { Button } from "@/components/panel/form-parts";
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

	// ponytail: local only, no backend section for this page yet; the shell labels it a preview.
	const handleSaveChanges = () => {
	setSavedPresets(JSON.parse(JSON.stringify(presets)));
	};

	return (
		<PageShell preview eyebrow="Sanctions" title="Game Presets" onSave={handleSaveChanges} dirty={isDirty}>

			{/* ACTION BAR */}
			<div className="flex justify-between items-center bg-panel-bg/10 p-4 border border-border-subtle rounded-xl">
				<div>
					<h3 className="text-[13px] font-semibold text-fg-default">
						Game Presets
					</h3>
					<p className="text-xs text-fg-muted mt-0.5">
						Game settings applied when matches start
					</p>
				</div>
				<Button variant="dashed" size="sm"
					onClick={handleAddPreset}>
					<Plus className="size-3.5" /> Add Preset
				</Button>
			</div>

			<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
				<div className="lg:col-span-2 space-y-4">
					{presets.map((preset) => (
						<div
							key={preset.id}
							className="p-4 border border-border-subtle bg-panel-bg/20 rounded-xl space-y-4 shadow-xs motion-fade"
						>
							{/* PRESET HEADER */}
							<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border-subtle/20">
								<div className="flex items-center gap-3">
									<div className="size-9 rounded-lg border border-primary-500/20 bg-primary-500/10 flex items-center justify-center">
										<Layers className="size-4 text-primary-500" />
									</div>
									<div>
										<p className="text-xs font-medium text-fg-muted">
											Preset #{preset.id}
										</p>
										<h3 className="text-[13px] font-semibold text-fg-default">
											{preset.name}
										</h3>
									</div>
								</div>
								<div className="flex items-center gap-2 shrink-0">
									<button
										onClick={() => togglePreset(preset.id)}
										className={`h-8 px-3 border rounded-md text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
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
										<span className="text-xs font-medium text-fg-muted">
											Build Height
										</span>
									</div>
									<span className="text-sm font-semibold text-fg-default">
										{preset.baseBuildHeight}
									</span>
								</div>
								<div className="p-3 rounded-lg border border-border-subtle/40 bg-bg-canvas/20 space-y-1.5">
									<div className="flex items-center gap-1.5">
										<Timer className="size-3 text-fg-muted" />
										<span className="text-xs font-medium text-fg-muted">
											Events Duration
										</span>
									</div>
									<span className="text-sm font-semibold text-fg-default">
										{preset.eventsDuration}s
									</span>
								</div>
								<div className="p-3 rounded-lg border border-border-subtle/40 bg-bg-canvas/20 space-y-1.5">
									<span className="text-xs font-medium text-fg-muted">
										Phases
									</span>
									<span className="text-sm font-semibold text-fg-default">
										{preset.phases}
									</span>
								</div>
								<div className="p-3 rounded-lg border border-border-subtle/40 bg-bg-canvas/20 space-y-1.5">
									<span className="text-xs font-medium text-fg-muted">
										Triggers
									</span>
									<span className="text-sm font-semibold text-fg-default">
										{preset.triggers}
									</span>
								</div>
							</div>

							{/* POTION SIGNATURE */}
							<div className="space-y-1.5">
								<div className="flex items-center gap-1.5">
									<FlaskConical className="size-3 text-fg-muted" />
									<span className="text-xs font-medium text-fg-muted">
										Potion Signature
									</span>
								</div>
								<div className="flex flex-wrap gap-1.5">
									{preset.potions.length === 0 ? (
										<span className="text-xs text-fg-muted">
											None configured
										</span>
									) : (
										preset.potions.map((p) => (
											<span
												key={p.tier}
												className="px-2 py-0.5 rounded-md border border-border-subtle/40 bg-success/5 text-xs font-medium text-success capitalize"
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
									<span className="text-xs font-medium text-fg-muted">
										Initial Banned Items
									</span>
								</div>
								<div className="space-y-1.5">
									{preset.bannedItems.length === 0 ? (
										<span className="text-xs text-fg-muted">
											Nothing banned at launch
										</span>
									) : (
										preset.bannedItems.map((grp) => (
											<div key={grp.category} className="flex items-center gap-2 flex-wrap">
												<span className="text-xs font-medium text-amber-500">
													{grp.category}:
												</span>
												{grp.items.map((item) => (
													<span
														key={item}
														className="px-2 py-0.5 rounded-md border border-border-subtle/40 bg-rose-500/5 text-xs text-rose-400 capitalize"
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
								<span className="block text-xs font-medium text-fg-muted">
									Base Toggles
								</span>
								<div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
									{preset.toggles.map((t) => (
										<div
											key={t.key}
											className={`px-2 py-1 rounded-md border text-xs font-medium ${
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
					<div className="p-5 rounded-xl border border-border-subtle bg-panel-bg/40 space-y-4 h-fit">
						<div className="flex items-center gap-2 border-b border-border-subtle/50 pb-2.5">
							<Layers className="size-4 text-cyan-500" />
							<h3 className="text-sm font-semibold text-fg-default">
								How Presets Work
							</h3>
						</div>
						<p className="text-xs text-fg-muted leading-relaxed text-left">
							Presets are applied when matches start and control game rules like build limits, item bans, and game phases.
						</p>
					</div>

					<div className="p-4 border border-dashed border-border-subtle bg-panel-bg/5 rounded-xl space-y-2">
						<div className="flex items-center gap-1.5 text-[13px] font-semibold text-fg-default">
							<Info className="size-3.5 text-primary-500" />
							<span>Enforcement Note</span>
						</div>
						<p className="text-xs text-fg-muted leading-normal text-left">
							Player rules are managed separately. These presets only control game settings and competitive rules.
						</p>
					</div>
				</div>
			</div>
		</PageShell>
	);
}
