"use client";

import {
	UsersRound,
	Save,
	SlidersHorizontal,
	UserCheck,
	Shuffle,
	RefreshCw,
} from "lucide-react";
import { useState } from "react";
import { useUnsavedChanges } from "@/hooks/use-unsaved-changes";

const DEFAULT_CONFIG = {
	maxEloDelta: 150,
	minQueueSize: 2,
	requireAllMembersInQueue: true,
	eloAggregationMethod: "average",
	captainsPickTimeout: 30,
	autoPickFallback: true,
	preferPartiesTogether: true,
	dynamicRoleLocks: false,
};

export default function Page() {
	const [isSaving, setIsSaving] = useState(false);
	const [activeAlgorithm, setActiveAlgorithm] = useState<"elo" | "captains" | "random">("elo");
	const [savedAlgorithm] = useState<"elo" | "captains" | "random">("elo");

	const [config, setConfig] = useState({ ...DEFAULT_CONFIG });
	const [savedConfig, setSavedConfig] = useState({ ...DEFAULT_CONFIG });

	const { isDirty } = useUnsavedChanges(
		[activeAlgorithm, config],
		[savedAlgorithm, savedConfig],
	);

	const handleConfigChange = (key: string, value: unknown) => {
		setConfig((prev) => ({ ...prev, [key]: value }));
	};

	const handleSaveChanges = () => {
		setIsSaving(true);
		setTimeout(() => {
			setSavedConfig({ ...config });
			setIsSaving(false);
		}, 900);
	};

	return (
		<div className="w-full p-6 lg:p-8 space-y-6 animate-in fade-in duration-300 select-none max-w-7xl mx-auto text-left">
			{/* HUD PANEL HEADER */}
			<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border-subtle pb-6">
				<div>
					<h1 className="font-mono text-[10px] font-bold uppercase tracking-widest text-fg-muted">
						// Team Deliberation (flows.party / mode.team_count)
					</h1>
					<h2 className="text-2xl font-black tracking-tight text-fg-default mt-1">
						Team Generation Rules
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
						{isSaving ? "Writing Generation Scheme..." : "Commit Generation Rules"}
					</span>
				</button>
			</div>

			{/* ALGORITHM SELECTION GRID */}
			<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
				<button
					onClick={() => setActiveAlgorithm("elo")}
					className={`p-4 border rounded-xl flex flex-col text-left transition-all ${
						activeAlgorithm === "elo"
							? "bg-primary-500/10 border-primary-500/40 text-primary-500"
							: "border-border-subtle hover:border-border-subtle/80 bg-panel-bg/20 text-fg-muted"
					}`}
				>
					<div className="flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-wider mb-2">
						<SlidersHorizontal className="size-4" />
						<span>Balanced ELO Matchmaker</span>
					</div>
					<p className="font-mono text-[9px] uppercase tracking-wide opacity-80 leading-relaxed">
						Distributes players to minimize net average ELO variance between teams. Ideal for solo-queue ladders.
					</p>
				</button>

				<button
					onClick={() => setActiveAlgorithm("captains")}
					className={`p-4 border rounded-xl flex flex-col text-left transition-all ${
						activeAlgorithm === "captains"
							? "bg-primary-500/10 border-primary-500/40 text-primary-500"
							: "border-border-subtle hover:border-border-subtle/80 bg-panel-bg/20 text-fg-muted"
					}`}
				>
					<div className="flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-wider mb-2">
						<UserCheck className="size-4" />
						<span>Captains Draft Sequence</span>
					</div>
					<p className="font-mono text-[9px] uppercase tracking-wide opacity-80 leading-relaxed">
						Designates the highest ELO players as Captains to take turns drafting remaining players.
					</p>
				</button>

				<button
					onClick={() => setActiveAlgorithm("random")}
					className={`p-4 border rounded-xl flex flex-col text-left transition-all ${
						activeAlgorithm === "random"
							? "bg-primary-500/10 border-primary-500/40 text-primary-500"
							: "border-border-subtle hover:border-border-subtle/80 bg-panel-bg/20 text-fg-muted"
					}`}
				>
					<div className="flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-wider mb-2">
						<Shuffle className="size-4" />
						<span>Randomized Scramble</span>
					</div>
					<p className="font-mono text-[9px] uppercase tracking-wide opacity-80 leading-relaxed">
						Disregards statistics entirely for casual/unranked queues. Maximizes queue velocity.
					</p>
				</button>
			</div>

			{/* PARAMETERS CONFIG CONTAINER */}
			<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
				<div className="lg:col-span-2 space-y-6">
					<div className="p-5 border border-border-subtle bg-panel-bg/20 backdrop-blur-md rounded-xl space-y-4 shadow-xs">
						<div className="flex items-center gap-2 border-b border-border-subtle/50 pb-2.5">
							<UsersRound className="size-4 text-cyan-500" />
							<h3 className="font-mono text-[11px] font-bold text-fg-default uppercase tracking-widest">
								Algorithm Fine-Tuning
							</h3>
						</div>

						{activeAlgorithm === "elo" && (
							<div className="space-y-4 animate-in fade-in duration-150">
								<div className="space-y-1.5">
									<label className="block font-mono text-[10px] font-bold text-fg-default uppercase tracking-wider">
										Max ELO Difference
									</label>
									<input
										type="number"
										value={config.maxEloDelta}
										onChange={(e) => handleConfigChange("maxEloDelta", parseInt(e.target.value) || 0)}
										className="w-full h-9 px-3 bg-bg-canvas/40 border border-border-subtle rounded-lg font-mono text-xs text-fg-default focus:outline-none focus:border-primary-500/50"
									/>
									<span className="block font-mono text-[8px] text-fg-muted uppercase tracking-wide">
										The queue balancer rejects formations exceeding this rating disparity.
									</span>
								</div>

								<div className="space-y-1.5">
									<label className="block font-mono text-[10px] font-bold text-fg-default uppercase tracking-wider">
										Elo Aggregation Method
									</label>
									<select
										value={config.eloAggregationMethod}
										onChange={(e) => handleConfigChange("eloAggregationMethod", e.target.value)}
										className="w-full h-9 px-3 bg-bg-canvas/40 border border-border-subtle rounded-lg font-mono text-xs text-fg-default focus:outline-none focus:border-primary-500/50"
									>
										<option value="average">Average</option>
										<option value="highest">Highest Member</option>
										<option value="sum">Sum</option>
										<option value="leader">Party Leader</option>
									</select>
								</div>

								<div className="space-y-1.5">
									<label className="block font-mono text-[10px] font-bold text-fg-default uppercase tracking-wider">
										Minimum Queue Size
									</label>
									<input
										type="number"
										value={config.minQueueSize}
										onChange={(e) => handleConfigChange("minQueueSize", parseInt(e.target.value) || 0)}
										className="w-full h-9 px-3 bg-bg-canvas/40 border border-border-subtle rounded-lg font-mono text-xs text-fg-default focus:outline-none focus:border-primary-500/50"
									/>
								</div>

								<div className="flex items-center justify-between p-3 rounded-lg border border-border-subtle/40 bg-bg-canvas/30">
									<div className="space-y-0.5">
										<span className="block font-mono text-[10px] font-bold text-fg-default uppercase tracking-wider">
											Require All Members In Queue
										</span>
										<span className="font-mono text-[8px] text-fg-muted uppercase tracking-wide">
											A party only queues when every member has joined the channel.
										</span>
									</div>
									<button
										onClick={() => handleConfigChange("requireAllMembersInQueue", !config.requireAllMembersInQueue)}
										className={`h-7 px-3 font-mono text-[9px] font-bold uppercase tracking-wider rounded-md border ${
											config.requireAllMembersInQueue
												? "bg-success/10 border-success/30 text-success"
												: "bg-panel-bg border-border-subtle text-fg-muted"
										}`}
									>
										{config.requireAllMembersInQueue ? "ON" : "OFF"}
									</button>
								</div>

								<div className="flex items-center justify-between p-3 rounded-lg border border-border-subtle/40 bg-bg-canvas/30">
									<div className="space-y-0.5">
										<span className="block font-mono text-[10px] font-bold text-fg-default uppercase tracking-wider">
											Keep Parties Together
										</span>
										<span className="font-mono text-[8px] text-fg-muted uppercase tracking-wide">
											Prioritize keeping pre-formed parties on the same roster where feasible.
										</span>
									</div>
									<button
										onClick={() => handleConfigChange("preferPartiesTogether", !config.preferPartiesTogether)}
										className={`h-7 px-3 font-mono text-[9px] font-bold uppercase tracking-wider rounded-md border ${
											config.preferPartiesTogether
												? "bg-success/10 border-success/30 text-success"
												: "bg-panel-bg border-border-subtle text-fg-muted"
										}`}
									>
										{config.preferPartiesTogether ? "ON" : "OFF"}
									</button>
								</div>
							</div>
						)}

						{activeAlgorithm === "captains" && (
							<div className="space-y-4 animate-in fade-in duration-150">
								<div className="space-y-1.5">
									<label className="block font-mono text-[10px] font-bold text-fg-default uppercase tracking-wider">
										Captain Turn Selection Timer (Seconds)
									</label>
									<input
										type="number"
										value={config.captainsPickTimeout}
										onChange={(e) => handleConfigChange("captainsPickTimeout", parseInt(e.target.value) || 0)}
										className="w-full h-9 px-3 bg-bg-canvas/40 border border-border-subtle rounded-lg font-mono text-xs text-fg-default focus:outline-none focus:border-primary-500/50"
									/>
								</div>

								<div className="flex items-center justify-between p-3 rounded-lg border border-border-subtle/40 bg-bg-canvas/30">
									<div className="space-y-0.5">
										<span className="block font-mono text-[10px] font-bold text-fg-default uppercase tracking-wider">
											Auto-Pick Fallback
										</span>
										<span className="font-mono text-[8px] text-fg-muted uppercase tracking-wide">
											Automatically pick the highest remaining ELO player if draft timer expires.
										</span>
									</div>
									<button
										onClick={() => handleConfigChange("autoPickFallback", !config.autoPickFallback)}
										className={`h-7 px-3 font-mono text-[9px] font-bold uppercase tracking-wider rounded-md border ${
											config.autoPickFallback
												? "bg-success/10 border-success/30 text-success"
												: "bg-panel-bg border-border-subtle text-fg-muted"
										}`}
									>
										{config.autoPickFallback ? "ON" : "OFF"}
									</button>
								</div>
							</div>
						)}

						{activeAlgorithm === "random" && (
							<div className="p-4 border border-dashed border-border-subtle/60 rounded-lg text-center font-mono text-xs text-fg-muted uppercase tracking-wide">
								No parameters needed. Scrambler mode operates on basic array shuffles.
							</div>
						)}
					</div>

				</div>

				<div className="p-5 border border-border-subtle bg-panel-bg/20 backdrop-blur-md rounded-xl space-y-4 h-fit">
					<div className="flex items-center gap-2 border-b border-border-subtle/50 pb-2.5">
						<RefreshCw className="size-4 text-amber-500" />
						<h3 className="font-mono text-[11px] font-bold text-fg-default uppercase tracking-widest">
							Algorithm Test Metrics
						</h3>
					</div>

					<div className="font-mono text-[10px] uppercase space-y-2 text-fg-muted">
						<div className="flex justify-between border-b border-border-subtle/20 pb-1">
							<span>Selected engine:</span>
							<span className="text-primary-500 font-bold">{activeAlgorithm}</span>
						</div>
						<div className="flex justify-between border-b border-border-subtle/20 pb-1">
							<span>Aggregation method:</span>
							<span className="text-success">{config.eloAggregationMethod}</span>
						</div>
						<div className="flex justify-between pb-1">
							<span>Max queue disparity:</span>
							<span className="text-fg-default">{config.maxEloDelta} ELO</span>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
