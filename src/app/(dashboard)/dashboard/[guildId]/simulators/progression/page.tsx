"use client";

import {
	Calculator,
	Trophy,
	SlidersHorizontal,
	Info,
} from "lucide-react";
import { useState } from "react";

export default function Page() {
	const [eloInput, setEloInput] = useState(0);

	const ranks = [
		{ name: "Bronze Division", minElo: 0, maxElo: 999 },
		{ name: "Silver Division", minElo: 1000, maxElo: 1299 },
		{ name: "Gold Division", minElo: 1300, maxElo: 1599 },
		{ name: "Diamond Division", minElo: 1600, maxElo: 1999 },
		{ name: "Master Division", minElo: 2000, maxElo: 9999 },
	];

	const currentRank = ranks.find((r) => eloInput >= r.minElo && eloInput <= r.maxElo) || ranks[0];
	const nextRank = ranks[ranks.indexOf(currentRank) + 1] || null;

	let progressPercent = 100;
	if (nextRank) {
		const range = currentRank.maxElo - currentRank.minElo;
		const progress = eloInput - currentRank.minElo;
		progressPercent = Math.min(100, Math.max(0, Math.round((progress / range) * 100)));
	}

	return (
		<div className="w-full p-6 lg:p-8 space-y-6 animate-in fade-in duration-300 select-none max-w-7xl mx-auto text-left">
			{/* HUD PANEL HEADER */}
			<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border-subtle pb-6">
				<div>
					<h1 className="font-mono text-[10px] font-bold uppercase tracking-widest text-fg-muted">
						// Simulator Progression Layer
					</h1>
					<h2 className="text-2xl font-black tracking-tight text-fg-default mt-1">
						Rank Progression Visualizer
					</h2>
				</div>
			</div>

			<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
				{/* INPUT */}
				<div className="lg:col-span-2 space-y-6">
					<div className="p-5 border border-border-subtle bg-panel-bg/20 backdrop-blur-md rounded-xl space-y-4 shadow-xs">
						<div className="flex items-center gap-2 border-b border-border-subtle/50 pb-2.5">
							<SlidersHorizontal className="size-4 text-primary-500" />
							<h3 className="font-mono text-[11px] font-bold text-fg-default uppercase tracking-widest">
								Simulation Parameters
							</h3>
						</div>

						<div className="space-y-1.5 font-mono text-xs text-left">
							<label className="block font-bold text-fg-default uppercase tracking-wider">
								Simulate Player ELO Rating
							</label>
							<input
								type="number"
								value={eloInput}
								onChange={(e) => setEloInput(parseInt(e.target.value) || 0)}
								className="w-full h-10 px-3 bg-bg-canvas/40 border border-border-subtle rounded-lg text-fg-default focus:outline-none"
							/>
						</div>
					</div>

					{/* PROGRESS BAR DISPLAY */}
					<div className="p-5 border border-border-subtle bg-panel-bg/20 backdrop-blur-md rounded-xl space-y-4 shadow-xs text-left">
						<h3 className="font-mono text-[11px] font-bold text-fg-default uppercase tracking-widest border-b border-border-subtle/30 pb-2">
							Progress to Next Division
						</h3>

						<div className="space-y-4 font-mono text-xs">
							<div className="flex justify-between items-center font-bold">
								<span className="text-primary-500">{currentRank.name}</span>
								{nextRank ? (
									<span className="text-fg-muted">Next: {nextRank.name}</span>
								) : (
									<span className="text-success font-black">Max Rank Achieved</span>
								)}
							</div>

							<div className="w-full bg-bg-canvas/40 border border-border-subtle h-4 rounded-full overflow-hidden relative">
								<div
									className="bg-gradient-to-r from-primary-500 to-cyan-500 h-full transition-all duration-300"
									style={{ width: `${progressPercent}%` }}
								/>
							</div>

							<div className="flex justify-between text-[10px] text-fg-muted uppercase">
								<span>Current ELO: {eloInput}</span>
								{nextRank && (
									<span>Required ELO: {nextRank.minElo} ({nextRank.minElo - eloInput} more ELO)</span>
								)}
							</div>
						</div>
					</div>
				</div>

				<div className="space-y-6">
					<div className="p-5 border border-border-subtle bg-panel-bg/20 backdrop-blur-md rounded-xl space-y-4 h-fit text-left">
						<div className="flex items-center gap-2 border-b border-border-subtle/50 pb-2.5">
							<Trophy className="size-4 text-amber-500" />
							<h3 className="font-mono text-[11px] font-bold text-fg-default uppercase tracking-widest">
								Rank Boundaries
							</h3>
						</div>

						<div className="space-y-2 font-mono text-[10px] text-fg-muted uppercase">
							{ranks.map((r, i) => (
								<div key={i} className="flex justify-between border-b border-border-subtle/10 pb-1">
									<span>{r.name}:</span>
									<span className="text-fg-default font-bold">{r.minElo}+ ELO</span>
								</div>
							))}
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
