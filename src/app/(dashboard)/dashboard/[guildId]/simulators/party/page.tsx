"use client";

import {
	Calculator,
	RefreshCw,
	SlidersHorizontal,
	Info,
	Users,
	Plus,
	Trash2,
} from "lucide-react";
import { useState } from "react";

export default function Page() {
	const [playerElos, setPlayerElos] = useState<number[]>([]);

	const handleEloChange = (idx: number, val: number) => {
		const next = [...playerElos];
		next[idx] = val;
		setPlayerElos(next);
	};

	const handleAddPlayer = () => {
		setPlayerElos((prev) => [...prev, 0]);
	};

	const handleRemovePlayer = (idx: number) => {
		setPlayerElos((prev) => prev.filter((_, i) => i !== idx));
	};

	// Balancing algorithm (simplified greedy partition)
	const sorted = [...playerElos].sort((a, b) => b - a);
	const teamA: number[] = [];
	const teamB: number[] = [];
	let sumA = 0;
	let sumB = 0;

	for (const elo of sorted) {
		if (sumA <= sumB && teamA.length < 4) {
			teamA.push(elo);
			sumA += elo;
		} else if (teamB.length < 4) {
			teamB.push(elo);
			sumB += elo;
		} else {
			teamA.push(elo);
			sumA += elo;
		}
	}

	const avgA = teamA.length > 0 ? Math.round(sumA / teamA.length) : 0;
	const avgB = teamB.length > 0 ? Math.round(sumB / teamB.length) : 0;
	const delta = Math.abs(avgA - avgB);

	return (
		<div className="w-full p-6 lg:p-8 space-y-6 animate-in fade-in duration-300 select-none max-w-7xl mx-auto text-left">
			{/* HUD PANEL HEADER */}
			<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border-subtle pb-6">
				<div>
					<h1 className="font-mono text-[10px] font-bold uppercase tracking-widest text-fg-muted">
						// Simulator Balancing Engine
					</h1>
					<h2 className="text-2xl font-black tracking-tight text-fg-default mt-1">
						Party Balancing Simulator
					</h2>
				</div>
			</div>

			<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
				{/* INPUTS CONTAINER */}
				<div className="lg:col-span-2 space-y-6">
					<div className="p-5 border border-border-subtle bg-panel-bg/20 backdrop-blur-md rounded-xl space-y-4 shadow-xs">
						<div className="flex items-center justify-between border-b border-border-subtle/50 pb-2.5">
							<div className="flex items-center gap-2">
								<Users className="size-4 text-primary-500" />
								<h3 className="font-mono text-[11px] font-bold text-fg-default uppercase tracking-widest">
									Pool Player ELOs
								</h3>
							</div>
							<div className="flex gap-2">
								<button
									onClick={handleAddPlayer}
									className="h-7 px-2 flex items-center gap-1 border border-dashed border-primary-500/30 text-primary-500 bg-primary-500/5 hover:bg-primary-500/10 rounded-md font-mono text-[9px] font-bold uppercase tracking-wider transition-all cursor-pointer"
								>
									<Plus className="size-3" /> Add Player
								</button>
							</div>
						</div>

						<div className="grid grid-cols-2 sm:grid-cols-4 gap-4 font-mono text-xs text-left">
							{playerElos.map((elo, i) => (
								<div key={i} className="space-y-1">
									<div className="flex items-center justify-between">
										<label className="block font-bold text-fg-default uppercase tracking-wider">
											Player {i + 1}
										</label>
										<button
											onClick={() => handleRemovePlayer(i)}
											className="size-5 flex items-center justify-center border border-border-subtle hover:bg-red-500/10 text-fg-muted hover:text-red-400 rounded transition-all cursor-pointer"
										>
											<Trash2 className="size-3" />
										</button>
									</div>
									<input
										type="number"
										value={elo}
										onChange={(e) => handleEloChange(i, parseInt(e.target.value) || 0)}
										className="w-full h-8 px-2 bg-bg-canvas/40 border border-border-subtle rounded-md text-fg-default focus:outline-none"
									/>
								</div>
							))}
						</div>
					</div>

					{/* BALANCED TEAMS */}
					<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
						<div className="p-4 border border-border-subtle bg-panel-bg/20 rounded-xl space-y-2 text-left">
							<h4 className="font-mono text-xs font-black text-cyan-400 uppercase tracking-wide">
								Team Alpha
							</h4>
							<div className="font-mono text-xs space-y-1 text-fg-muted">
								{teamA.map((elo, idx) => (
									<div key={idx} className="flex justify-between border-b border-border-subtle/10 pb-0.5">
										<span>Member ELO:</span>
										<span className="text-fg-default font-bold">{elo}</span>
									</div>
								))}
								<div className="flex justify-between pt-1 text-fg-default font-black border-t border-border-subtle/30">
									<span>Avg Rating:</span>
									<span>{avgA}</span>
								</div>
							</div>
						</div>

						<div className="p-4 border border-border-subtle bg-panel-bg/20 rounded-xl space-y-2 text-left">
							<h4 className="font-mono text-xs font-black text-violet-400 uppercase tracking-wide">
								Team Beta
							</h4>
							<div className="font-mono text-xs space-y-1 text-fg-muted">
								{teamB.map((elo, idx) => (
									<div key={idx} className="flex justify-between border-b border-border-subtle/10 pb-0.5">
										<span>Member ELO:</span>
										<span className="text-fg-default font-bold">{elo}</span>
									</div>
								))}
								<div className="flex justify-between pt-1 text-fg-default font-black border-t border-border-subtle/30">
									<span>Avg Rating:</span>
									<span>{avgB}</span>
								</div>
							</div>
						</div>
					</div>
				</div>

				<div className="space-y-6">
					<div className="p-5 border border-border-subtle bg-panel-bg/20 backdrop-blur-md rounded-xl space-y-4 h-fit text-left">
						<div className="flex items-center gap-2 border-b border-border-subtle/50 pb-2.5">
							<SlidersHorizontal className="size-4 text-cyan-500" />
							<h3 className="font-mono text-[11px] font-bold text-fg-default uppercase tracking-widest">
								Simulated Delta Variance
							</h3>
						</div>

						<div className="space-y-3 font-mono text-xs text-fg-muted uppercase">
							<div className="flex justify-between items-center">
								<span>Rating delta:</span>
								<span className={`font-black text-sm ${delta < 100 ? "text-success" : "text-amber-500"}`}>
									{delta} ELO Gap
								</span>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
