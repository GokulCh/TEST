"use client";

import {
	Calculator,
	RefreshCw,
	TrendingUp,
	Info,
} from "lucide-react";
import { useState } from "react";

export default function Page() {
	const [teamAElo, setTeamAElo] = useState(0);
	const [teamBElo, setTeamBElo] = useState(0);
	const [outcome, setOutcome] = useState<"A_WON" | "B_WON">("A_WON");

	// Simple Elo calculation simulation logic
	const kFactor = 32;
	const expectedScoreA = 1 / (1 + Math.pow(10, (teamBElo - teamAElo) / 400));
	const expectedScoreB = 1 - expectedScoreA;

	const actualScoreA = outcome === "A_WON" ? 1 : 0;
	const actualScoreB = outcome === "B_WON" ? 1 : 0;

	const eloShiftA = Math.round(kFactor * (actualScoreA - expectedScoreA));
	const eloShiftB = Math.round(kFactor * (actualScoreB - expectedScoreB));

	return (
		<div className="w-full p-6 lg:p-8 space-y-6 animate-in fade-in duration-300 select-none max-w-7xl mx-auto text-left">
			{/* HUD PANEL HEADER */}
			<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border-subtle pb-6">
				<div>
					<h1 className="font-mono text-[10px] font-bold uppercase tracking-widest text-fg-muted">
						// Simulator Calculation Layer
					</h1>
					<h2 className="text-2xl font-black tracking-tight text-fg-default mt-1">
						ELO Projection Simulator
					</h2>
				</div>
			</div>

			<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
				{/* INPUTS CONTAINER */}
				<div className="lg:col-span-2 space-y-6">
					<div className="p-5 border border-border-subtle bg-panel-bg/20 backdrop-blur-md rounded-xl space-y-4 shadow-xs">
						<div className="flex items-center gap-2 border-b border-border-subtle/50 pb-2.5">
							<Calculator className="size-4 text-primary-500" />
							<h3 className="font-mono text-[11px] font-bold text-fg-default uppercase tracking-widest">
								Projection Variables
							</h3>
						</div>

						<div className="grid grid-cols-1 sm:grid-cols-2 gap-4 font-mono text-xs">
							<div className="space-y-1.5">
								<label className="block font-bold text-fg-default uppercase tracking-wider">
									Team A Avg ELO
								</label>
								<input
									type="number"
									value={teamAElo}
									onChange={(e) => setTeamAElo(parseInt(e.target.value) || 1000)}
									className="w-full h-9 px-3 bg-bg-canvas/40 border border-border-subtle rounded-lg text-fg-default focus:outline-none"
								/>
							</div>

							<div className="space-y-1.5">
								<label className="block font-bold text-fg-default uppercase tracking-wider">
									Team B Avg ELO
								</label>
								<input
									type="number"
									value={teamBElo}
									onChange={(e) => setTeamBElo(parseInt(e.target.value) || 1000)}
									className="w-full h-9 px-3 bg-bg-canvas/40 border border-border-subtle rounded-lg text-fg-default focus:outline-none"
								/>
							</div>
						</div>

						{/* OUTCOME SWITCH */}
						<div className="space-y-3 pt-2">
							<span className="block font-mono text-[9px] font-black text-primary-500 uppercase tracking-widest">
								// Simulated Match Winner
							</span>
							<div className="grid grid-cols-2 gap-3">
								<button
									onClick={() => setOutcome("A_WON")}
									className={`h-9 font-mono text-xs font-bold uppercase tracking-wider rounded-xl border transition-all ${
										outcome === "A_WON"
											? "bg-success/10 border-success/30 text-success"
											: "bg-panel-bg border-border-subtle text-fg-muted"
									}`}
								>
									Team A Wins
								</button>
								<button
									onClick={() => setOutcome("B_WON")}
									className={`h-9 font-mono text-xs font-bold uppercase tracking-wider rounded-xl border transition-all ${
										outcome === "B_WON"
											? "bg-success/10 border-success/30 text-success"
											: "bg-panel-bg border-border-subtle text-fg-muted"
									}`}
								>
									Team B Wins
								</button>
							</div>
						</div>
					</div>
				</div>

				{/* SIMULATED RESULTS */}
				<div className="space-y-6">
					<div className="p-5 border border-border-subtle bg-panel-bg/20 backdrop-blur-md rounded-xl space-y-4 h-fit text-left">
						<div className="flex items-center gap-2 border-b border-border-subtle/50 pb-2.5">
							<TrendingUp className="size-4 text-cyan-500" />
							<h3 className="font-mono text-[11px] font-bold text-fg-default uppercase tracking-widest">
								Simulated Rating Shift
							</h3>
						</div>

						<div className="space-y-3 font-mono text-xs text-fg-muted uppercase">
							<div className="flex justify-between items-center border-b border-border-subtle/20 pb-2">
								<span>Team A Shift:</span>
								<span className={`font-black text-sm ${eloShiftA >= 0 ? "text-success" : "text-rose-500"}`}>
									{eloShiftA >= 0 ? `+${eloShiftA}` : eloShiftA} ELO
								</span>
							</div>

							<div className="flex justify-between items-center">
								<span>Team B Shift:</span>
								<span className={`font-black text-sm ${eloShiftB >= 0 ? "text-success" : "text-rose-500"}`}>
									{eloShiftB >= 0 ? `+${eloShiftB}` : eloShiftB} ELO
								</span>
							</div>
						</div>
					</div>

					<div className="p-4 border border-dashed border-border-subtle bg-panel-bg/5 rounded-xl space-y-2">
						<div className="flex items-center gap-1.5 font-mono text-[10px] font-bold text-fg-default uppercase tracking-wider">
							<Info className="size-3.5 text-primary-500" />
							<span>Formula Note</span>
						</div>
						<p className="font-mono text-[9px] text-fg-muted uppercase leading-normal text-left">
							The simulator uses a default K-Factor weight value of 32. Performance-based multiplier boosts are disabled in these projections.
						</p>
					</div>
				</div>
			</div>
		</div>
	);
}
