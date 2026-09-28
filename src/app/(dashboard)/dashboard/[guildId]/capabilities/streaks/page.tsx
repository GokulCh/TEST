"use client";

import { SlidersHorizontal, Sparkles } from "lucide-react";
import { useState, useMemo } from "react";
import { useUnsavedChanges } from "@/hooks/use-unsaved-changes";

import { PageShell } from "@/components/panel/page-shell";
export default function Page() {
		const [streaks, setStreaks] = useState({
		consecutiveMatches: 0,
		bonusCoinReward: 0,
		eloBonusMultiplier: 1.0,
	});
	const [savedSnapshot, setSavedSnapshot] = useState(() => ({
		streaks: { consecutiveMatches: 0, bonusCoinReward: 0, eloBonusMultiplier: 1.0 },
	}));

	const handleInputChange = (field: keyof typeof streaks, value: any) => {
		setStreaks((prev) => ({ ...prev, [field]: value }));
	};

	const globalLocal = useMemo(() => ({ streaks }), [streaks]);
	const globalSaved = useMemo(() => savedSnapshot, [savedSnapshot]);
	useUnsavedChanges(globalLocal, globalSaved);

	// ponytail: local only, there is no streaks section in the database yet; the shell labels it a preview.
	const handleSaveChanges = () => setSavedSnapshot({ streaks });

	return (
		<PageShell preview eyebrow="Capabilities" title="Daily Streaks Settings" onSave={handleSaveChanges}>

			<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
				{/* CONFIG */}
				<div className="lg:col-span-2 space-y-6">
					<div className="p-5 rounded-xl border border-border-subtle bg-panel-bg/40 space-y-4 shadow-xs text-left">
						<div className="flex items-center gap-2 border-b border-border-subtle/50 pb-2.5">
							<SlidersHorizontal className="size-4 text-primary-500" />
							<h3 className="text-sm font-semibold text-fg-default">
								Daily Streak Coefficients
							</h3>
						</div>

						<div className="space-y-4 font-mono text-xs">
							<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
								<div className="space-y-1.5">
									<label className="block font-semibold text-fg-default">
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
									<label className="block font-semibold text-fg-default">
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
								<label className="block font-semibold text-fg-default">
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
					<div className="p-5 rounded-xl border border-border-subtle bg-panel-bg/40 space-y-4 h-fit text-left">
						<div className="flex items-center gap-2 border-b border-border-subtle/50 pb-2.5">
							<Sparkles className="size-4 text-cyan-500" />
							<h3 className="text-sm font-semibold text-fg-default">
								Active Incentives
							</h3>
						</div>
						<p className="text-xs text-fg-muted leading-relaxed">
							Daily streaks reset if a player does not queue or complete a match session during a rolling 24-hour buffer window.
						</p>
					</div>
				</div>
			</div>
		</PageShell>
	);
}
