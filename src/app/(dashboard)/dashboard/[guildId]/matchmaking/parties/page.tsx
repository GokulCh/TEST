"use client";

import {
	SlidersHorizontal,
	Save,
	Users,
	Scale,
	ShieldAlert,
	Info,
} from "lucide-react";
import { useState } from "react";

export default function Page() {
	const [isSaving, setIsSaving] = useState(false);
	const [partyLimits, setPartyLimits] = useState({
		maxPartySize: 4,
		maxEloDelta: 300,
		inactivityDisbandTime: 10,
		requireAllMembersInQueue: true,
		eloModifierIsEnabled: true,
		eloModifierMultiplier: 1.25,
		eloModifierGamesThreshold: 3,
		eloModifierFlatAdjustment: 0,
		averagingMethod: "average",
	});

	const handleInputChange = (field: keyof typeof partyLimits, value: any) => {
		setPartyLimits((prev) => ({ ...prev, [field]: value }));
	};

	const handleSaveChanges = () => {
		setIsSaving(true);
		setTimeout(() => setIsSaving(false), 900);
	};

	return (
		<div className="w-full p-6 lg:p-8 space-y-6 animate-in fade-in duration-300 select-none max-w-7xl mx-auto text-left">
			{/* HUD PANEL HEADER */}
			<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border-subtle pb-6">
				<div>
					<h1 className="font-mono text-[10px] font-bold uppercase tracking-widest text-fg-muted">
						// Party Guardrails (flows.party / PartiesConfig)
					</h1>
					<h2 className="text-2xl font-black tracking-tight text-fg-default mt-1">
						Party Restraints Settings
					</h2>
				</div>

				<button
					onClick={handleSaveChanges}
					className="h-9 px-4 flex items-center gap-2 border border-primary-500/20 bg-primary-500/10 hover:bg-primary-500/20 text-primary-500 font-mono font-bold text-[11px] uppercase tracking-wider rounded-lg transition-all active:scale-98 cursor-pointer shadow-sm self-start sm:self-auto"
				>
					<Save className="size-3.5" />
					<span>
						{isSaving ? "Syncing Constraints..." : "Commit Restraints Layout"}
					</span>
				</button>
			</div>

			<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
				<div className="lg:col-span-2 space-y-6">
					{/* GENERAL RESTRICTIONS */}
					<div className="p-5 border border-border-subtle bg-panel-bg/20 backdrop-blur-md rounded-xl space-y-4 shadow-xs">
						<div className="flex items-center gap-2 border-b border-border-subtle/50 pb-2.5">
							<Users className="size-4 text-primary-500" />
							<h3 className="font-mono text-[11px] font-bold text-fg-default uppercase tracking-widest">
								Roster Scaling Rules
							</h3>
						</div>

						<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
							<div className="space-y-1.5">
								<label className="block font-mono text-[10px] font-bold text-fg-default uppercase tracking-wider">
									Max Party Size
								</label>
								<input
									type="number"
									value={partyLimits.maxPartySize}
									onChange={(e) => handleInputChange("maxPartySize", parseInt(e.target.value) || 1)}
									className="w-full h-9 px-3 bg-bg-canvas/40 border border-border-subtle rounded-lg font-mono text-xs text-fg-default focus:outline-none"
								/>
							</div>

							<div className="space-y-1.5">
								<label className="block font-mono text-[10px] font-bold text-fg-default uppercase tracking-wider">
									Max Elo Difference
								</label>
								<input
									type="number"
									value={partyLimits.maxEloDelta}
									onChange={(e) => handleInputChange("maxEloDelta", parseInt(e.target.value) || 0)}
									className="w-full h-9 px-3 bg-bg-canvas/40 border border-border-subtle rounded-lg font-mono text-xs text-fg-default focus:outline-none"
								/>
							</div>

							<div className="space-y-1.5">
								<label className="block font-mono text-[10px] font-bold text-fg-default uppercase tracking-wider">
									Inactivity Disband Time (Minutes)
								</label>
								<input
									type="number"
									value={partyLimits.inactivityDisbandTime}
									onChange={(e) => handleInputChange("inactivityDisbandTime", parseInt(e.target.value) || 0)}
									className="w-full h-9 px-3 bg-bg-canvas/40 border border-border-subtle rounded-lg font-mono text-xs text-fg-default focus:outline-none"
								/>
							</div>

							<div className="flex items-center justify-end p-2 rounded-lg border border-border-subtle/40 bg-bg-canvas/30">
								<div className="space-y-0.5 text-left flex-1">
									<span className="block font-mono text-[10px] font-bold text-fg-default uppercase tracking-wider">
										Require All Members In Queue
									</span>
									<span className="font-mono text-[8px] text-fg-muted uppercase tracking-wide">
										Party only queues when every member is present.
									</span>
								</div>
								<button
									onClick={() => handleInputChange("requireAllMembersInQueue", !partyLimits.requireAllMembersInQueue)}
									className={`h-7 px-3 font-mono text-[9px] font-bold uppercase tracking-wider rounded-md border ${
										partyLimits.requireAllMembersInQueue
											? "bg-success/10 border-success/30 text-success"
											: "bg-panel-bg border-border-subtle text-fg-muted"
									}`}
								>
									{partyLimits.requireAllMembersInQueue ? "ON" : "OFF"}
								</button>
							</div>
						</div>
					</div>

					{/* ELO INHERITANCE SCALAR */}
					<div className="p-5 border border-border-subtle bg-panel-bg/20 backdrop-blur-md rounded-xl space-y-4 shadow-xs">
						<div className="flex items-center gap-2 border-b border-border-subtle/50 pb-2.5">
							<Scale className="size-4 text-cyan-500" />
							<h3 className="font-mono text-[11px] font-bold text-fg-default uppercase tracking-widest">
								Party Rating Coefficient
							</h3>
						</div>

						<div className="space-y-3">
							<span className="block font-mono text-[9px] font-black text-primary-500 uppercase tracking-widest">
								// Party ELO Calculation Method
							</span>

							<div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
								{[
									{ id: "average", label: "Average", desc: "Mean ELO across members." },
									{ id: "highest", label: "Highest", desc: "Uses peak ELO member." },
									{ id: "sum", label: "Sum", desc: "Totals party ELO pool." },
									{ id: "leader", label: "Leader", desc: "Party leader ELO only." },
								].map((opt) => (
									<div
										key={opt.id}
										onClick={() => handleInputChange("averagingMethod", opt.id)}
										className={`p-3 border rounded-xl flex flex-col justify-between cursor-pointer transition-all ${
											partyLimits.averagingMethod === opt.id
												? "bg-primary-500/5 border-primary-500/20 text-primary-500"
												: "bg-bg-canvas/10 border-border-subtle/50 opacity-60 text-fg-muted"
										}`}
									>
										<span className="block font-mono text-[10px] font-bold uppercase tracking-wider">
											{opt.label}
										</span>
										<span className="font-mono text-[8px] uppercase tracking-wide mt-1">
											{opt.desc}
										</span>
									</div>
								))}
							</div>
						</div>
					</div>

					{/* PARTY ELO MODIFIER */}
					<div className="p-5 border border-border-subtle bg-panel-bg/20 backdrop-blur-md rounded-xl space-y-4 shadow-xs">
						<div className="flex items-center justify-between gap-3 border-b border-border-subtle/50 pb-2.5">
							<div className="flex items-center gap-2">
								<SlidersHorizontal className="size-4 text-amber-500" />
								<h3 className="font-mono text-[11px] font-bold text-fg-default uppercase tracking-widest">
									Elo Modifier
								</h3>
							</div>
							<button
								onClick={() => handleInputChange("eloModifierIsEnabled", !partyLimits.eloModifierIsEnabled)}
								className={`h-7 px-3 font-mono text-[9px] font-bold uppercase tracking-wider rounded-md border ${
									partyLimits.eloModifierIsEnabled
										? "bg-success/10 border-success/30 text-success"
										: "bg-panel-bg border-border-subtle text-fg-muted"
								}`}
							>
								{partyLimits.eloModifierIsEnabled ? "ON" : "OFF"}
							</button>
						</div>

						<div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
							<div className="space-y-1.5">
								<label className="block font-mono text-[10px] font-bold text-fg-default uppercase tracking-wider">
									Multiplier
								</label>
								<input
									type="number"
									step="0.05"
									value={partyLimits.eloModifierMultiplier}
									onChange={(e) => handleInputChange("eloModifierMultiplier", parseFloat(e.target.value) || 0)}
									className="w-full h-9 px-3 bg-bg-canvas/40 border border-border-subtle rounded-lg font-mono text-xs text-fg-default focus:outline-none"
								/>
							</div>
							<div className="space-y-1.5">
								<label className="block font-mono text-[10px] font-bold text-fg-default uppercase tracking-wider">
									Games Threshold
								</label>
								<input
									type="number"
									value={partyLimits.eloModifierGamesThreshold}
									onChange={(e) => handleInputChange("eloModifierGamesThreshold", parseInt(e.target.value) || 0)}
									className="w-full h-9 px-3 bg-bg-canvas/40 border border-border-subtle rounded-lg font-mono text-xs text-fg-default focus:outline-none"
								/>
							</div>
							<div className="space-y-1.5">
								<label className="block font-mono text-[10px] font-bold text-fg-default uppercase tracking-wider">
									Flat Adjustment
								</label>
								<input
									type="number"
									value={partyLimits.eloModifierFlatAdjustment}
									onChange={(e) => handleInputChange("eloModifierFlatAdjustment", parseInt(e.target.value) || 0)}
									className="w-full h-9 px-3 bg-bg-canvas/40 border border-border-subtle rounded-lg font-mono text-xs text-fg-default focus:outline-none"
								/>
							</div>
						</div>
					</div>
				</div>

				<div className="space-y-6">
					<div className="p-5 border border-border-subtle bg-panel-bg/20 backdrop-blur-md rounded-xl space-y-4 h-fit">
						<div className="flex items-center gap-2 border-b border-border-subtle/50 pb-2.5">
							<ShieldAlert className="size-4 text-rose-500" />
							<h3 className="font-mono text-[11px] font-bold text-fg-default uppercase tracking-widest">
								Exploitation Control
							</h3>
						</div>
						<p className="font-mono text-[9px] text-fg-muted uppercase tracking-wide leading-relaxed">
							Restraints prevent high-ELO veterans from boosting low-ELO alternate accounts. Delta locks ensure matched queues remain competitive.
						</p>
					</div>

					<div className="p-4 border border-dashed border-border-subtle bg-panel-bg/5 rounded-xl space-y-2">
						<div className="flex items-center gap-1.5 font-mono text-[10px] font-bold text-fg-default uppercase tracking-wider">
							<Info className="size-3.5 text-primary-500" />
							<span>Matching Info</span>
						</div>
						<p className="font-mono text-[9px] text-fg-muted uppercase leading-normal">
							If average party ELO is 1500 and aggregation is set to "Highest"
							(e.g. 1800), the matchmaking balancer treats the entire party as a
							single 1800-rated entry.
						</p>
					</div>
				</div>
			</div>
		</div>
	);
}
