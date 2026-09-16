"use client";

import {
	Crosshair,
	Info,
	Save,
	Shield,
	SlidersHorizontal,
	ToggleLeft,
	ToggleRight,
} from "lucide-react";
import { useState } from "react";
import { useUnsavedChanges } from "@/hooks/use-unsaved-changes";

const DEFAULT_WEIGHTS = {
	killMultiplier: 0,
	deathDeduction: 0,
	finalKillMultiplier: 0,
	bedBreakMultiplier: 0,
	mvpFlatBonus: 0,
	winStreakScale: 0,
	maxPerformanceCap: 0,
};

export default function Page() {
	const [isSaving, setIsSaving] = useState(false);

	const [performanceEloEnabled, setPerformanceEloEnabled] = useState(false);
	const [savedPerformanceEloEnabled, setSavedPerformanceEloEnabled] = useState(false);

	const [weights, setWeights] = useState({ ...DEFAULT_WEIGHTS });
	const [savedWeights, setSavedWeights] = useState({ ...DEFAULT_WEIGHTS });

	const { isDirty } = useUnsavedChanges(
		[performanceEloEnabled, weights],
		[savedPerformanceEloEnabled, savedWeights],
	);

	const handleInputChange = (field: keyof typeof weights, value: number) => {
		setWeights((prev) => ({ ...prev, [field]: value }));
	};

	const handleSaveChanges = () => {
		setIsSaving(true);
		setTimeout(() => {
			setSavedWeights({ ...weights });
			setSavedPerformanceEloEnabled(performanceEloEnabled);
			setIsSaving(false);
		}, 900);
	};

	return (
		<div className="w-full p-6 lg:p-8 space-y-6 animate-in fade-in duration-300 select-none max-w-7xl mx-auto text-left">
			{/* HUD PANEL HEADER */}
			<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border-subtle pb-6">
				<div>
					<h1 className="font-mono text-[10px] font-bold uppercase tracking-widest text-fg-muted">
						// Elo Engine Rating Deliberation (game_meta.ranks / elo_decay)
					</h1>
					<h2 className="text-2xl font-black tracking-tight text-fg-default mt-1">
						Stat Weighting Configurations
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
						{isSaving
							? "Updating Pipeline Modifiers..."
							: "Commit Weight Formulations"}
					</span>
				</button>
			</div>

			{/* GLOBAL MASTER RUNTIME INTERCEPT INTERFACE */}
			<div className="p-5 border border-border-subtle bg-panel-bg/20 backdrop-blur-md rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
				<div className="space-y-1 text-left">
					<h3 className="font-mono text-xs font-black text-fg-default uppercase tracking-wide">
						Performance-Based ELO Engine
					</h3>
					<p className="font-mono text-[9px] text-fg-muted uppercase max-w-xl leading-relaxed">
						When activated, the matchmaking engine hooks into deep in-game
						telemetry metrics to dynamically scale rating shifts alongside base
						win/loss parameters.
					</p>
				</div>
				<button
					onClick={() => setPerformanceEloEnabled(!performanceEloEnabled)}
					className={`h-9 px-4 border rounded-lg font-mono text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all shrink-0 cursor-pointer ${
						performanceEloEnabled
							? "bg-success/10 border-success/30 text-success"
							: "bg-panel-bg border-border-subtle text-fg-muted"
					}`}
				>
					{performanceEloEnabled ? (
						<ToggleRight className="size-4" />
					) : (
						<ToggleLeft className="size-4" />
					)}
					<span>
						{performanceEloEnabled ? "Intercept Active" : "Bypassed / Flat ELO"}
					</span>
				</button>
			</div>

			{/* CORE CONFIGURATION PANELS COMPONENT SPLIT GRID */}
			{performanceEloEnabled ? (
				<div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in duration-200">
					{/* LEFT COMPONENT PANES: MULTIPLIER SLIDERS & DIALS */}
					<div className="lg:col-span-2 space-y-6">
						{/* Combat Vector Modifiers */}
						<div className="p-5 border border-border-subtle bg-panel-bg/20 backdrop-blur-md rounded-xl space-y-4 shadow-xs">
							<div className="flex items-center gap-2 border-b border-border-subtle/50 pb-2.5">
								<Crosshair className="size-4 text-primary-500" />
								<h3 className="font-mono text-[11px] font-bold text-fg-default uppercase tracking-widest">
									Combat Scalar Vectors
								</h3>
							</div>

							<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
								<div className="space-y-1.5">
									<label className="block font-mono text-[10px] font-bold text-fg-default uppercase tracking-wider">
										Standard Kill Modifier
									</label>
									<input
										type="number"
										step="0.05"
										value={weights.killMultiplier}
										onChange={(e) =>
											handleInputChange(
												"killMultiplier",
												parseFloat(e.target.value) || 0,
											)
										}
										className="w-full h-9 px-3 bg-bg-canvas/40 border border-border-subtle rounded-lg font-mono text-xs text-fg-default focus:outline-none focus:border-primary-500/50"
									/>
								</div>
								<div className="space-y-1.5">
									<label className="block font-mono text-[10px] font-bold text-fg-default uppercase tracking-wider">
										Standard Death Deduction
									</label>
									<input
										type="number"
										step="0.05"
										value={weights.deathDeduction}
										onChange={(e) =>
											handleInputChange(
												"deathDeduction",
												parseFloat(e.target.value) || 0,
											)
										}
										className="w-full h-9 px-3 bg-bg-canvas/40 border border-border-subtle rounded-lg font-mono text-xs text-fg-default focus:outline-none focus:border-primary-500/50"
									/>
								</div>
							</div>
						</div>

						{/* Objective Variable Parameters */}
						<div className="p-5 border border-border-subtle bg-panel-bg/20 backdrop-blur-md rounded-xl space-y-4 shadow-xs">
							<div className="flex items-center gap-2 border-b border-border-subtle/50 pb-2.5">
								<Shield className="size-4 text-cyan-500" />
								<h3 className="font-mono text-[11px] font-bold text-fg-default uppercase tracking-widest">
									Objective Priority Modifiers
								</h3>
							</div>

							<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
								<div className="space-y-1.5">
									<label className="block font-mono text-[10px] font-bold text-fg-default uppercase tracking-wider">
										Final Kill Weight Modifier
									</label>
									<input
										type="number"
										step="0.1"
										value={weights.finalKillMultiplier}
										onChange={(e) =>
											handleInputChange(
												"finalKillMultiplier",
												parseFloat(e.target.value) || 0,
											)
										}
										className="w-full h-9 px-3 bg-bg-canvas/40 border border-border-subtle rounded-lg font-mono text-xs text-fg-default focus:outline-none focus:border-primary-500/50"
									/>
								</div>
								<div className="space-y-1.5">
									<label className="block font-mono text-[10px] font-bold text-fg-default uppercase tracking-wider">
										Bed Destruction Weight
									</label>
									<input
										type="number"
										step="0.1"
										value={weights.bedBreakMultiplier}
										onChange={(e) =>
											handleInputChange(
												"bedBreakMultiplier",
												parseFloat(e.target.value) || 0,
											)
										}
										className="w-full h-9 px-3 bg-bg-canvas/40 border border-border-subtle rounded-lg font-mono text-xs text-fg-default focus:outline-none focus:border-primary-500/50"
									/>
								</div>
							</div>
						</div>
					</div>

					{/* RIGHT COMPONENT PANES: POOL SAFETY BOUNDS & CONSTRAINTS */}
					<div className="space-y-6">
						<div className="p-5 border border-border-subtle bg-panel-bg/20 backdrop-blur-md rounded-xl space-y-4 shadow-xs">
							<div className="flex items-center gap-2 border-b border-border-subtle/50 pb-2.5">
								<SlidersHorizontal className="size-4 text-amber-500" />
								<h3 className="font-mono text-[11px] font-bold text-fg-default uppercase tracking-widest">
									Engine Guardrails
								</h3>
							</div>

							<div className="space-y-4 text-left">
								<div className="space-y-1.5">
									<label className="block font-mono text-[10px] font-bold text-fg-default uppercase tracking-wider">
										Absolute Performance Cap
									</label>
									<input
										type="number"
										value={weights.maxPerformanceCap}
										onChange={(e) =>
											handleInputChange(
												"maxPerformanceCap",
												parseInt(e.target.value) || 0,
											)
										}
										className="w-full h-9 px-3 bg-bg-canvas/40 border border-border-subtle rounded-lg font-mono text-xs text-fg-default focus:outline-none focus:border-primary-500/50"
									/>
									<span className="block font-mono text-[8px] text-fg-muted uppercase tracking-wide">
										Maximum volatile bonus ELO capped per individual run
									</span>
								</div>

								<div className="space-y-1.5">
									<label className="block font-mono text-[10px] font-bold text-fg-default uppercase tracking-wider">
										Win Streak Scaling Index
									</label>
									<input
										type="number"
										step="0.05"
										value={weights.winStreakScale}
										onChange={(e) =>
											handleInputChange(
												"winStreakScale",
												parseFloat(e.target.value) || 0,
											)
										}
										className="w-full h-9 px-3 bg-bg-canvas/40 border border-border-subtle rounded-lg font-mono text-xs text-fg-default focus:outline-none focus:border-primary-500/50"
									/>
								</div>
							</div>
						</div>

						{/* Quick Explainer Panel Primitive */}
						<div className="p-4 border border-dashed border-border-subtle bg-panel-bg/5 rounded-xl space-y-2 text-left">
							<div className="flex items-center gap-1.5 font-mono text-[10px] font-bold text-fg-default uppercase tracking-wider">
								<Info className="size-3.5 text-primary-500" />
								<span>Formula Processing Note</span>
							</div>
							<div className="bg-bg-canvas/50 border border-border-subtle/60 p-2.5 rounded-lg font-mono text-[10px] text-fg-muted uppercase tracking-wide space-y-1">
								<div className="text-fg-default font-bold">
									Delta Evaluation (player_stats)
								</div>
								<div className="text-primary-400 font-mono text-[11px] leading-relaxed">
									Rank.k_factor_win / k_factor_loss + mvp_count * mvp_bonus
								</div>
								<div className="text-[9px] text-fg-muted/60 mt-1">
									Momentum terms sample kills, final_kills, beds_destroyed and
									win_streak deltas; volatile bonus ELO stays bound within the
									guardrail cap above.
								</div>
							</div>
						</div>
					</div>
				</div>
			) : (
				/* INACTIVE STATE HOOK PLUG */
				<div className="p-12 border border-dashed border-border-subtle/50 rounded-2xl bg-panel-bg/5 text-center font-mono space-y-2 max-w-xl mx-auto">
					<h3 className="text-xs font-bold uppercase tracking-wider text-fg-muted">
						Performance Interceptors Halted
					</h3>
					<p className="text-[10px] text-fg-muted/60 uppercase tracking-wide leading-relaxed">
						The matchmaker configuration is currently locked to a flat
						evaluation setup. Win/Loss metrics are calculated strictly using
						target division presets defined on the rank parameters tabs.
					</p>
				</div>
			)}
		</div>
	);
}
