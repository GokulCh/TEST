"use client";

import {
	GitBranch,
	Save,
	Plus,
	Trash2,
	ToggleLeft,
	ToggleRight,
	Sliders,
	Award,
} from "lucide-react";
import { useState } from "react";
import { useUnsavedChanges } from "@/hooks/use-unsaved-changes";

const DEFAULT_TOURNAMENT = {
	type: "SINGLE_ELIMINATION",
	slots: 0,
	autoSeeding: false,
	roundsCount: 0,
};

export default function Page() {
	const [isSaving, setIsSaving] = useState(false);
	const [tournament, setTournament] = useState({ ...DEFAULT_TOURNAMENT });
	const [savedTournament, setSavedTournament] = useState({ ...DEFAULT_TOURNAMENT });

	const { isDirty } = useUnsavedChanges(tournament, savedTournament);

	const handleInputChange = (field: keyof typeof tournament, value: unknown) => {
		setTournament((prev) => ({ ...prev, [field]: value }));
	};

	const handleSaveChanges = () => {
		setIsSaving(true);
		setTimeout(() => {
			setSavedTournament({ ...tournament });
			setIsSaving(false);
		}, 900);
	};

	return (
		<div className="w-full p-6 lg:p-8 space-y-6 animate-in fade-in duration-300 select-none max-w-7xl mx-auto text-left">
			{/* HUD PANEL HEADER */}
			<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border-subtle pb-6">
				<div>
					<h1 className="font-mono text-[10px] font-bold uppercase tracking-widest text-fg-muted">
						// Toolkit Tournament Creator
					</h1>
					<h2 className="text-2xl font-black tracking-tight text-fg-default mt-1">
						Bracket Builder
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
						{isSaving ? "Publishing Brackets..." : "Deploy Tournament Brackets"}
					</span>
				</button>
			</div>

			<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
				{/* CONFIG */}
				<div className="lg:col-span-2 space-y-6">
					<div className="p-5 border border-border-subtle bg-panel-bg/20 backdrop-blur-md rounded-xl space-y-4 shadow-xs text-left">
						<div className="flex items-center gap-2 border-b border-border-subtle/50 pb-2.5">
							<Sliders className="size-4 text-cyan-500" />
							<h3 className="font-mono text-[11px] font-bold text-fg-default uppercase tracking-widest">
								Bracket Configurations
							</h3>
						</div>

						<div className="space-y-4 font-mono text-xs">
							<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
								<div className="space-y-1.5">
									<label className="block font-bold text-fg-default uppercase tracking-wider">
										Tournament Type
									</label>
									<select
										value={tournament.type}
										onChange={(e) => handleInputChange("type", e.target.value)}
										className="w-full h-9 px-2 bg-bg-canvas/40 border border-border-subtle rounded-lg text-fg-default focus:outline-none focus:border-primary-500/50"
									>
										<option value="SINGLE_ELIMINATION">Single Elimination</option>
										<option value="DOUBLE_ELIMINATION">Double Elimination</option>
									</select>
								</div>

								<div className="space-y-1.5">
									<label className="block font-bold text-fg-default uppercase tracking-wider">
										Max Slots Limit (Teams)
									</label>
									<select
										value={tournament.slots}
										onChange={(e) => handleInputChange("slots", parseInt(e.target.value))}
										className="w-full h-9 px-2 bg-bg-canvas/40 border border-border-subtle rounded-lg text-fg-default focus:outline-none focus:border-primary-500/50"
									>
										<option value="8">8 Teams</option>
										<option value="16">16 Teams</option>
										<option value="32">32 Teams</option>
									</select>
								</div>
							</div>

							<div className="flex items-center justify-between p-3 rounded-lg border border-border-subtle/40 bg-bg-canvas/30">
								<div className="space-y-0.5">
									<span className="block font-mono text-[10px] font-bold text-fg-default uppercase tracking-wider">
										Auto-Seeding Logic
									</span>
									<span className="font-mono text-[8px] text-fg-muted uppercase tracking-wide">
										Automatically seed teams using collective roster ELO weights.
									</span>
								</div>
								<button
									onClick={() => handleInputChange("autoSeeding", !tournament.autoSeeding)}
									className={`h-7 px-3 font-mono font-bold uppercase tracking-wider rounded-md border ${
										tournament.autoSeeding
											? "bg-success/10 border-success/30 text-success"
											: "bg-panel-bg border-border-subtle text-fg-muted"
									}`}
								>
									{tournament.autoSeeding ? "ACTIVE" : "MANUAL"}
								</button>
							</div>
						</div>
					</div>
				</div>

				{/* TEST DISPLAY */}
				<div className="space-y-6">
					<div className="p-5 border border-border-subtle bg-panel-bg/20 backdrop-blur-md rounded-xl space-y-4 h-fit text-left">
						<div className="flex items-center gap-2 border-b border-border-subtle/50 pb-2.5">
							<Award className="size-4 text-amber-500" />
							<h3 className="font-mono text-[11px] font-bold text-fg-default uppercase tracking-widest">
								Competitive Rules
							</h3>
						</div>
						<p className="font-mono text-[9px] text-fg-muted uppercase tracking-wide leading-relaxed">
							Brackets deploy instantly as graphical messages in Discord channels. Users click match nodes to join regional game servers.
						</p>
					</div>
				</div>
			</div>
		</div>
	);
}
