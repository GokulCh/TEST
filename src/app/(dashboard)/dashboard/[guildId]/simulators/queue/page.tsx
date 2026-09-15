"use client";

import {
	Calculator,
	Activity,
	SlidersHorizontal,
	Info,
} from "lucide-react";
import { useState } from "react";

export default function Page() {
	const [activePlayers, setActivePlayers] = useState(0);
	const [searchExpansion, setSearchExpansion] = useState(0); // ELO per tick

	const simulatedWaitTime = activePlayers > 0 && searchExpansion > 0
		? Math.max(10, Math.round(600 / (activePlayers * (searchExpansion / 50))))
		: 0;

	return (
		<div className="w-full p-6 lg:p-8 space-y-6 animate-in fade-in duration-300 select-none max-w-7xl mx-auto text-left">
			{/* HUD PANEL HEADER */}
			<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border-subtle pb-6">
				<div>
					<h1 className="font-mono text-[10px] font-bold uppercase tracking-widest text-fg-muted">
						// Simulator Operations Layer
					</h1>
					<h2 className="text-2xl font-black tracking-tight text-fg-default mt-1">
						Queue Math Simulator
					</h2>
				</div>
			</div>

			<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
				{/* INPUTS */}
				<div className="lg:col-span-2 space-y-6">
					<div className="p-5 border border-border-subtle bg-panel-bg/20 backdrop-blur-md rounded-xl space-y-4 shadow-xs">
						<div className="flex items-center gap-2 border-b border-border-subtle/50 pb-2.5">
							<SlidersHorizontal className="size-4 text-primary-500" />
							<h3 className="font-mono text-[11px] font-bold text-fg-default uppercase tracking-widest">
								Simulate Queue Bounds
							</h3>
						</div>

						<div className="grid grid-cols-1 sm:grid-cols-2 gap-4 font-mono text-xs text-left">
							<div className="space-y-1.5">
								<label className="block font-bold text-fg-default uppercase tracking-wider">
									Active Queue Pool Players
								</label>
								<input
									type="number"
									value={activePlayers}
									onChange={(e) => setActivePlayers(parseInt(e.target.value) || 0)}
									className="w-full h-9 px-3 bg-bg-canvas/40 border border-border-subtle rounded-lg text-fg-default focus:outline-none"
								/>
							</div>

							<div className="space-y-1.5">
								<label className="block font-bold text-fg-default uppercase tracking-wider">
									ELO Range Expansion Rate ( / Sec)
								</label>
								<input
									type="number"
									value={searchExpansion}
									onChange={(e) => setSearchExpansion(parseInt(e.target.value) || 10)}
									className="w-full h-9 px-3 bg-bg-canvas/40 border border-border-subtle rounded-lg text-fg-default focus:outline-none"
								/>
							</div>
						</div>
					</div>
				</div>

				{/* RESULTS */}
				<div className="space-y-6">
					<div className="p-5 border border-border-subtle bg-panel-bg/20 backdrop-blur-md rounded-xl space-y-4 h-fit text-left">
						<div className="flex items-center gap-2 border-b border-border-subtle/50 pb-2.5">
							<Activity className="size-4 text-cyan-500" />
							<h3 className="font-mono text-[11px] font-bold text-fg-default uppercase tracking-widest">
								Simulated Wait Times
							</h3>
						</div>

						<div className="space-y-3 font-mono text-xs text-fg-muted uppercase">
							<div className="flex justify-between items-center">
								<span>Est. Avg Wait Time:</span>
								<span className="font-black text-sm text-success">
									{simulatedWaitTime} Seconds
								</span>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
