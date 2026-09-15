"use client";

import {
	Zap,
	Save,
	SlidersHorizontal,
	Info,
	Sparkles,
} from "lucide-react";
import { useState } from "react";

export default function Page() {
	const [isSaving, setIsSaving] = useState(false);
	const [streaks, setStreaks] = useState({
		consecutiveMatches: 0,
		bonusCoinReward: 0,
		eloBonusMultiplier: 1.0,
	});

	const handleInputChange = (field: keyof typeof streaks, value: any) => {
		setStreaks((prev) => ({ ...prev, [field]: value }));
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
						// Platform Incentives engine
					</h1>
					<h2 className="text-2xl font-black tracking-tight text-fg-default mt-1">
						Daily Streaks Settings
					</h2>
				</div>

				<button
					onClick={handleSaveChanges}
					className="h-9 px-4 flex items-center gap-2 border border-primary-500/20 bg-primary-500/10 hover:bg-primary-500/20 text-primary-500 font-mono font-bold text-[11px] uppercase tracking-wider rounded-lg transition-all active:scale-98 cursor-pointer shadow-sm self-start sm:self-auto"
				>
					<Save className="size-3.5" />
					<span>
						{isSaving ? "Syncing Streaks..." : "Commit Streaks Matrix"}
					</span>
				</button>
			</div>

			<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
				{/* CONFIG */}
				<div className="lg:col-span-2 space-y-6">
					<div className="p-5 border border-border-subtle bg-panel-bg/20 backdrop-blur-md rounded-xl space-y-4 shadow-xs text-left">
						<div className="flex items-center gap-2 border-b border-border-subtle/50 pb-2.5">
							<SlidersHorizontal className="size-4 text-primary-500" />
							<h3 className="font-mono text-[11px] font-bold text-fg-default uppercase tracking-widest">
								Daily Streak Coefficients
							</h3>
						</div>

						<div className="space-y-4 font-mono text-xs">
							<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
								<div className="space-y-1.5">
									<label className="block font-bold text-fg-default uppercase tracking-wider">
										Consecutive Matches Required
									</label>
									<input
										type="number"
										value={streaks.consecutiveMatches}
										onChange={(e) => handleInputChange("consecutiveMatches", parseInt(e.target.value) || 0)}
										className="w-full h-9 px-3 bg-bg-canvas/40 border border-border-subtle rounded-lg text-fg-default focus:outline-none"
									/>
								</div>

								<div className="space-y-1.5">
									<label className="block font-bold text-fg-default uppercase tracking-wider">
										Bonus Coin Reward
									</label>
									<input
										type="number"
										value={streaks.bonusCoinReward}
										onChange={(e) => handleInputChange("bonusCoinReward", parseInt(e.target.value) || 0)}
										className="w-full h-9 px-3 bg-bg-canvas/40 border border-border-subtle rounded-lg text-fg-default focus:outline-none"
									/>
								</div>
							</div>

							<div className="space-y-1.5">
								<label className="block font-bold text-fg-default uppercase tracking-wider">
									ELO Multiplier Bonus (e.g. 1.1 = +10% gain)
								</label>
								<input
									type="number"
									step="0.05"
									value={streaks.eloBonusMultiplier}
									onChange={(e) => handleInputChange("eloBonusMultiplier", parseFloat(e.target.value) || 1)}
									className="w-full h-9 px-3 bg-bg-canvas/40 border border-border-subtle rounded-lg text-fg-default focus:outline-none"
								/>
							</div>
						</div>
					</div>
				</div>

				<div className="space-y-6">
					<div className="p-5 border border-border-subtle bg-panel-bg/20 backdrop-blur-md rounded-xl space-y-4 h-fit text-left">
						<div className="flex items-center gap-2 border-b border-border-subtle/50 pb-2.5">
							<Sparkles className="size-4 text-cyan-500" />
							<h3 className="font-mono text-[11px] font-bold text-fg-default uppercase tracking-widest">
								Active Incentives
							</h3>
						</div>
						<p className="font-mono text-[9px] text-fg-muted uppercase tracking-wide leading-relaxed">
							Daily streaks reset if a player does not queue or complete a match session during a rolling 24-hour buffer window.
						</p>
					</div>
				</div>
			</div>
		</div>
	);
}
