"use client";

import {
	Gift,
	Save,
	Plus,
	Trash2,
	ToggleLeft,
	ToggleRight,
	Calendar,
	Sliders,
} from "lucide-react";
import { useState } from "react";
import { useUnsavedChanges } from "@/hooks/use-unsaved-changes";

interface GiveawayRecord {
	id: string;
	prize: string;
	winners: number;
	requiredElo: number;
	status: string;
	endsIn: string;
}

export default function Page() {
	const [isSaving, setIsSaving] = useState(false);

	const [giveaways, setGiveaways] = useState<GiveawayRecord[]>([]);
	const [savedGiveaways, setSavedGiveaways] = useState<GiveawayRecord[]>([]);

	const { isDirty } = useUnsavedChanges(giveaways, savedGiveaways);

	const handleSaveChanges = () => {
		setIsSaving(true);
		setTimeout(() => {
			setSavedGiveaways(JSON.parse(JSON.stringify(giveaways)));
			setIsSaving(false);
		}, 900);
	};

	const handleDeleteGiveaway = (id: string) => {
		setGiveaways(giveaways.filter((g) => g.id !== id));
	};

	const handleAddGiveaway = () => {
		setGiveaways([
			...giveaways,
			{
				id: `gv-${Date.now()}`,
				prize: "",
				winners: 1,
				requiredElo: 0,
				status: "Active",
				endsIn: "",
			},
		]);
	};

	const updateGiveaway = (id: string, updates: Partial<GiveawayRecord>) => {
		setGiveaways((prev) => prev.map((g) => (g.id === id ? { ...g, ...updates } : g)));
	};

	return (
		<div className="w-full p-6 lg:p-8 space-y-6 animate-in fade-in duration-300 select-none max-w-7xl mx-auto text-left">
			{/* HUD PANEL HEADER */}
			<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border-subtle pb-6">
				<div>
					<h1 className="font-mono text-[10px] font-bold uppercase tracking-widest text-fg-muted">
						// Platform Rewards Engine
					</h1>
					<h2 className="text-2xl font-black tracking-tight text-fg-default mt-1">
						Giveaways Engine
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
						{isSaving ? "Syncing Giveaways..." : "Commit Giveaways Registry"}
					</span>
				</button>
			</div>

			{/* ACTION BAR */}
			<div className="flex justify-between items-center bg-panel-bg/10 p-4 border border-border-subtle rounded-xl">
				<div>
					<h3 className="font-mono text-xs font-black text-fg-default uppercase tracking-wide">
						Active Raffles
					</h3>
					<p className="font-mono text-[9px] text-fg-muted uppercase mt-0.5">
						Create ELO-restricted giveaways to incentivize queue activity
					</p>
				</div>
				<button
					onClick={handleAddGiveaway}
					className="h-8 px-3 flex items-center gap-1.5 border border-dashed border-primary-500/30 text-primary-500 bg-primary-500/5 hover:bg-primary-500/10 rounded-lg font-mono font-bold text-[10px] uppercase tracking-wider transition-all active:scale-98 cursor-pointer"
				>
					<Plus className="size-3.5" /> Dispatch Giveaway
				</button>
			</div>

			<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
				{/* GIVEAWAYS LIST */}
				<div className="lg:col-span-2 space-y-4">
					{giveaways.map((g) => (
						<div
							key={g.id}
							className="p-4 border border-border-subtle bg-panel-bg/20 rounded-xl space-y-3 shadow-xs animate-in fade-in duration-150 text-left"
						>
							<div className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-end">
								<div className="space-y-1">
									<label className="block font-mono text-[9px] font-bold text-fg-default uppercase tracking-wider">
										Prize Description
									</label>
									<input
										type="text"
										value={g.prize}
										onChange={(e) => updateGiveaway(g.id, { prize: e.target.value })}
										className="w-full h-8 px-2.5 bg-bg-canvas/40 border border-border-subtle rounded-md font-mono text-xs text-fg-default focus:outline-none focus:border-primary-500/50"
									/>
								</div>

								<div className="space-y-1">
									<label className="block font-mono text-[9px] font-bold text-fg-default uppercase tracking-wider">
										Winners Count
									</label>
									<input
										type="number"
										value={g.winners}
										onChange={(e) => updateGiveaway(g.id, { winners: parseInt(e.target.value) || 1 })}
										className="w-full h-8 px-2.5 bg-bg-canvas/40 border border-border-subtle rounded-md font-mono text-xs text-fg-default focus:outline-none focus:border-primary-500/50"
									/>
								</div>

								<div className="space-y-1">
									<label className="block font-mono text-[9px] font-bold text-fg-default uppercase tracking-wider">
										Required ELO Gate
									</label>
									<input
										type="number"
										value={g.requiredElo}
										onChange={(e) => updateGiveaway(g.id, { requiredElo: parseInt(e.target.value) || 0 })}
										className="w-full h-8 px-2.5 bg-bg-canvas/40 border border-border-subtle rounded-md font-mono text-xs text-fg-default focus:outline-none focus:border-primary-500/50"
									/>
								</div>

								<div className="flex gap-2 justify-end sm:justify-start">
									<span className="h-8 px-3 flex items-center border border-success/20 bg-success/10 text-success font-mono text-[9px] font-bold uppercase tracking-wider rounded-md">
										{g.status}
									</span>

									<button
										onClick={() => handleDeleteGiveaway(g.id)}
										className="size-8 flex items-center justify-center border border-border-subtle hover:bg-red-500/10 text-fg-muted hover:text-red-400 rounded-md transition-all cursor-pointer"
									>
										<Trash2 className="size-3.5" />
									</button>
								</div>
							</div>
						</div>
					))}
				</div>

				<div className="space-y-6">
					<div className="p-5 border border-border-subtle bg-panel-bg/20 backdrop-blur-md rounded-xl space-y-4 h-fit text-left">
						<div className="flex items-center gap-2 border-b border-border-subtle/50 pb-2.5">
							<Sliders className="size-4 text-cyan-500" />
							<h3 className="font-mono text-[11px] font-bold text-fg-default uppercase tracking-widest">
								Entry Gates
							</h3>
						</div>
						<p className="font-mono text-[9px] text-fg-muted uppercase tracking-wide leading-relaxed">
							Setting ELO requirements bars players below rating limits. Entry commands are processed instantly upon ticket buttons interaction.
						</p>
					</div>
				</div>
			</div>
		</div>
	);
}
