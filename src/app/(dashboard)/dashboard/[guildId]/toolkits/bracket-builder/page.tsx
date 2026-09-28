"use client";

import { Sliders, Award } from "lucide-react";
import { useState } from "react";
import { useUnsavedChanges } from "@/hooks/use-unsaved-changes";

import { PageShell } from "@/components/panel/page-shell";
const DEFAULT_TOURNAMENT = {
	type: "SINGLE_ELIMINATION",
	slots: 0,
	autoSeeding: false,
	roundsCount: 0,
};

export default function Page() {
	const [tournament, setTournament] = useState({ ...DEFAULT_TOURNAMENT });
	const [savedTournament, setSavedTournament] = useState({ ...DEFAULT_TOURNAMENT });

	const { isDirty } = useUnsavedChanges(tournament, savedTournament);

	const handleInputChange = (field: keyof typeof tournament, value: unknown) => {
		setTournament((prev) => ({ ...prev, [field]: value }));
	};

	// ponytail: local only, no backend section for this page yet; the shell labels it a preview.
	const handleSaveChanges = () => {
	setSavedTournament({ ...tournament });
	};

	return (
		<PageShell preview eyebrow="Toolkits" title="Bracket Builder" onSave={handleSaveChanges} dirty={isDirty}>

			<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
				{/* CONFIG */}
				<div className="lg:col-span-2 space-y-6">
					<div className="p-5 rounded-xl border border-border-subtle bg-panel-bg/40 space-y-4 shadow-xs text-left">
						<div className="flex items-center gap-2 border-b border-border-subtle/50 pb-2.5">
							<Sliders className="size-4 text-cyan-500" />
							<h3 className="text-sm font-semibold text-fg-default">
								Bracket Configurations
							</h3>
						</div>

						<div className="space-y-4 font-mono text-xs">
							<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
								<div className="space-y-1.5">
									<label className="block font-semibold text-fg-default">
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
									<label className="block font-semibold text-fg-default">
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
									<span className="block text-[13px] font-semibold text-fg-default">
										Auto-Seeding Logic
									</span>
									<span className="text-xs text-fg-muted">
										Automatically seed teams using collective roster ELO weights.
									</span>
								</div>
								<button
									onClick={() => handleInputChange("autoSeeding", !tournament.autoSeeding)}
									className={`h-7 px-3 font-medium rounded-md border ${
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
					<div className="p-5 rounded-xl border border-border-subtle bg-panel-bg/40 space-y-4 h-fit text-left">
						<div className="flex items-center gap-2 border-b border-border-subtle/50 pb-2.5">
							<Award className="size-4 text-amber-500" />
							<h3 className="text-sm font-semibold text-fg-default">
								Competitive Rules
							</h3>
						</div>
						<p className="text-xs text-fg-muted leading-relaxed">
							Brackets deploy instantly as graphical messages in Discord channels. Users click match nodes to join regional game servers.
						</p>
					</div>
				</div>
			</div>
		</PageShell>
	);
}
