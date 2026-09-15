"use client";

import {
	Calculator,
	RefreshCw,
	UserCheck,
	Info,
	Users,
	Plus,
	Trash2,
} from "lucide-react";
import { useState } from "react";

export default function Page() {
	const [activeTurn, setActiveTurn] = useState<"CAP_A" | "CAP_B">("CAP_A");
	const [teamA, setTeamA] = useState<string[]>([]);
	const [teamB, setTeamB] = useState<string[]>([]);
	const [pool, setPool] = useState<string[]>([]);

	const handlePickPlayer = (player: string) => {
		setPool(pool.filter((p) => p !== player));
		if (activeTurn === "CAP_A") {
			setTeamA([...teamA, player]);
			setActiveTurn("CAP_B");
		} else {
			setTeamB([...teamB, player]);
			setActiveTurn("CAP_A");
		}
	};

	const handleReset = () => {
		setTeamA([]);
		setTeamB([]);
		setPool([]);
		setActiveTurn("CAP_A");
	};

	const handleAddPlayer = () => {
		setPool((prev) => [...prev, ""]);
	};

	const handleRemovePlayer = (idx: number) => {
		setPool((prev) => prev.filter((_, i) => i !== idx));
	};

	const handleUpdatePlayer = (idx: number, value: string) => {
		setPool((prev) => prev.map((p, i) => (i === idx ? value : p)));
	};

	return (
		<div className="w-full p-6 lg:p-8 space-y-6 animate-in fade-in duration-300 select-none max-w-7xl mx-auto text-left">
			{/* HUD PANEL HEADER */}
			<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border-subtle pb-6">
				<div>
					<h1 className="font-mono text-[10px] font-bold uppercase tracking-widest text-fg-muted">
						// Simulator Draft Sequence
					</h1>
					<h2 className="text-2xl font-black tracking-tight text-fg-default mt-1">
						Captain Pick Sequence
					</h2>
				</div>

				<button
					onClick={handleReset}
					className="h-9 px-4 flex items-center gap-2 border border-primary-500/20 bg-primary-500/10 hover:bg-primary-500/20 text-primary-500 font-mono font-bold text-[11px] uppercase tracking-wider rounded-lg transition-all active:scale-98 cursor-pointer shadow-sm self-start sm:self-auto"
				>
					<RefreshCw className="size-3.5" />
					<span>Reset Draft</span>
				</button>
			</div>

			<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
				{/* POOL */}
				<div className="lg:col-span-2 space-y-4">
					<div className="p-5 border border-border-subtle bg-panel-bg/20 backdrop-blur-md rounded-xl space-y-4 shadow-xs text-left">
						<div className="flex items-center justify-between border-b border-border-subtle/50 pb-2.5">
							<div className="flex items-center gap-2">
								<Users className="size-4 text-cyan-500" />
								<h3 className="font-mono text-[11px] font-bold text-fg-default uppercase tracking-widest">
									Available Player Pool
								</h3>
							</div>
							<div className="flex items-center gap-2">
								<button
									onClick={handleAddPlayer}
									className="h-7 px-2 flex items-center gap-1 border border-dashed border-primary-500/30 text-primary-500 bg-primary-500/5 hover:bg-primary-500/10 rounded-md font-mono text-[9px] font-bold uppercase tracking-wider transition-all cursor-pointer"
								>
									<Plus className="size-3" /> Add Player
								</button>
								<span className="font-mono text-[9px] text-primary-400 bg-primary-500/10 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">
									{activeTurn === "CAP_A" ? "Captain Alpha Turn" : "Captain Beta Turn"}
								</span>
							</div>
						</div>

						<div className="grid grid-cols-2 gap-3">
							{pool.map((p, i) => (
								<div key={i} className="flex gap-2">
									<input
										type="text"
										value={p}
										onChange={(e) => handleUpdatePlayer(i, e.target.value)}
										className="flex-1 h-10 px-3 bg-bg-canvas/30 border border-border-subtle/40 rounded-xl text-left text-xs font-mono text-fg-default font-bold focus:outline-none focus:border-primary-500/30"
										placeholder="Player Name (ELO)"
									/>
									{pool.length > 0 && (
										<>
											<button
												onClick={() => handlePickPlayer(p)}
												className="h-10 px-3 bg-primary-500/10 hover:bg-primary-500/20 border border-primary-500/30 rounded-xl text-xs font-mono text-primary-500 font-bold flex items-center justify-center transition-all cursor-pointer"
												disabled={!p}
											>
												Pick
											</button>
											<button
												onClick={() => handleRemovePlayer(i)}
												className="h-10 px-2 border border-border-subtle hover:bg-red-500/10 text-fg-muted hover:text-red-400 rounded-xl transition-all cursor-pointer"
											>
												<Trash2 className="size-3.5" />
											</button>
										</>
									)}
								</div>
							))}

							{pool.length === 0 && (
								<div className="col-span-2 text-center py-4 font-mono text-xs text-fg-muted uppercase">
									All players drafted
								</div>
							)}
						</div>
					</div>
				</div>

				{/* ROSTERS */}
				<div className="space-y-4">
					<div className="p-4 border border-border-subtle bg-panel-bg/20 rounded-xl space-y-2 text-left">
						<h4 className="font-mono text-xs font-black text-cyan-400 uppercase tracking-wide">
							Team Alpha (Captain A)
						</h4>
						<div className="font-mono text-xs space-y-1 text-fg-muted">
							{teamA.map((p, idx) => (
								<div key={idx} className="border-b border-border-subtle/10 pb-0.5">
									{p}
								</div>
							))}
							{teamA.length === 0 && <div className="text-[10px] text-fg-muted/40 uppercase">Roster Empty</div>}
						</div>
					</div>

					<div className="p-4 border border-border-subtle bg-panel-bg/20 rounded-xl space-y-2 text-left">
						<h4 className="font-mono text-xs font-black text-violet-400 uppercase tracking-wide">
							Team Beta (Captain B)
						</h4>
						<div className="font-mono text-xs space-y-1 text-fg-muted">
							{teamB.map((p, idx) => (
								<div key={idx} className="border-b border-border-subtle/10 pb-0.5">
									{p}
								</div>
							))}
							{teamB.length === 0 && <div className="text-[10px] text-fg-muted/40 uppercase">Roster Empty</div>}
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
