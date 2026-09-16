"use client";

import { Info, Plus, Save, Shield, Sparkles, ToggleLeft, ToggleRight, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { useGuildSnapshot } from "@/hooks/useGuildSnapshot";
import { useUnsavedChanges } from "@/hooks/use-unsaved-changes";
import RoleDropdown from "@/components/ui/RoleDropdown";

interface PerkRecord {
	id: string;
	name: string;
	description: string;
	elo_multiplier: number;
	starting_elo: number;
	map_voting_multiplier: number;
	source: "role" | "topgg_vote";
	allowedRoles: string;
	deniedRoles: string;
	permissions: string;
	enabled: boolean;
}

export default function Page() {
	const { roleOptions } = useGuildSnapshot();
	const [isSaving, setIsSaving] = useState(false);

	const [perks, setPerks] = useState<PerkRecord[]>([]);

	// Saved state for unsaved changes detection
	const [savedPerks, setSavedPerks] = useState<PerkRecord[]>([]);

	const updatePerk = (id: string, updates: Partial<PerkRecord>) => {
		setPerks((prev) => prev.map((p) => (p.id === id ? { ...p, ...updates } : p)));
	};

	const handleToggleEnabled = (id: string) => {
		setPerks((prev) => prev.map((p) => (p.id === id ? { ...p, enabled: !p.enabled } : p)));
	};

	const handleDeletePerk = (id: string) => {
		setPerks((prev) => prev.filter((p) => p.id !== id));
	};

	const handleAddPerk = () => {
		setPerks((prev) => [
			...prev,
			{
				id: `pk-${Date.now()}`,
				name: "New Perk",
				description: "",
				elo_multiplier: 1.0,
				starting_elo: 0,
				map_voting_multiplier: 1.0,
				source: "role",
				allowedRoles: "",
				deniedRoles: "",
				permissions: "",
				enabled: true,
			},
		]);
	};

	// Global unsaved changes detection
	const globalLocal = useMemo(() => ({ perks }), [perks]);
	const globalSaved = useMemo(() => ({ perks: savedPerks }), [savedPerks]);
	const { isDirty } = useUnsavedChanges(globalLocal, globalSaved);

	const handleSaveChanges = () => {
		setIsSaving(true);
		setTimeout(() => {
			setIsSaving(false);
			setSavedPerks(perks);
		}, 900);
	};

	return (
		<div className="w-full p-6 lg:p-8 space-y-6 animate-in fade-in duration-300 select-none max-w-7xl mx-auto text-left">
			{/* HUD PANEL HEADER */}
			<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border-subtle pb-6">
				<div>
					<h1 className="font-mono text-[10px] font-bold uppercase tracking-widest text-fg-muted">
						// Perk Registry (game_meta.perks)
					</h1>
					<h2 className="text-2xl font-black tracking-tight text-fg-default mt-1">
						Tier Perks Configuration
					</h2>
				</div>

				<button
					onClick={handleSaveChanges}
					className={`h-9 px-4 flex items-center gap-2 font-mono font-bold text-[11px] uppercase tracking-wider rounded-lg transition-all active:scale-98 cursor-pointer shadow-sm self-start sm:self-auto border ${
						isDirty
							? "border-warning/40 bg-warning/15 hover:bg-warning/25 text-warning"
							: "border-primary-500/20 bg-primary-500/10 hover:bg-primary-500/20 text-primary-500"
					}`}
				>
					<Save className="size-3.5" />
					<span>
						{isSaving ? "Publishing Perks..." : "Commit Perks Layout"}
					</span>
				</button>
			</div>

			{/* ACTION BAR */}
			<div className="flex justify-between items-center bg-panel-bg/10 p-4 border border-border-subtle rounded-xl">
				<div>
					<h3 className="font-mono text-xs font-black text-fg-default uppercase tracking-wide">
						Perk Definitions
					</h3>
					<p className="font-mono text-[9px] text-fg-muted uppercase mt-0.5">
						Configure ELO, map-vote and role-scope modifiers per perk
					</p>
				</div>
				<button
					onClick={handleAddPerk}
					className="h-8 px-3 flex items-center gap-1.5 border border-dashed border-primary-500/30 text-primary-500 bg-primary-500/5 hover:bg-primary-500/10 rounded-lg font-mono font-bold text-[10px] uppercase tracking-wider transition-all active:scale-98 cursor-pointer"
				>
					<Plus className="size-3.5" /> Append Perk
				</button>
			</div>

			<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
				{/* PERKS LIST */}
				<div className="lg:col-span-2 space-y-4">
					{perks.map((p) => (
						<div
							key={p.id}
							className="p-4 border border-border-subtle bg-panel-bg/20 rounded-xl space-y-3 shadow-xs animate-in fade-in duration-150 text-left"
						>
							<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-border-subtle/20">
								<div className="space-y-1">
									<div className="flex items-center gap-2">
										<Sparkles className="size-3.5 text-primary-500" />
										<input
											type="text"
											value={p.name}
											onChange={(e) => updatePerk(p.id, { name: e.target.value })}
											className="bg-transparent font-mono text-xs font-black text-fg-default uppercase tracking-wide focus:outline-none border-b border-transparent focus:border-primary-500/50"
										/>
									</div>
									<input
										type="text"
										value={p.description}
										onChange={(e) => updatePerk(p.id, { description: e.target.value })}
										className="w-full bg-transparent font-mono text-[9px] text-fg-muted uppercase tracking-wide focus:outline-none"
									/>
								</div>
								<div className="flex items-center gap-2 shrink-0">
									<button
										onClick={() => handleToggleEnabled(p.id)}
										className={`h-8 px-3 border rounded-md font-mono text-[9px] font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer ${
											p.enabled
												? "bg-success/10 border-success/30 text-success"
												: "bg-panel-bg border-border-subtle text-fg-muted"
										}`}
									>
										{p.enabled ? <ToggleRight className="size-4" /> : <ToggleLeft className="size-4" />}
										<span>{p.enabled ? "Active" : "Disabled"}</span>
									</button>
									<button
										onClick={() => handleDeletePerk(p.id)}
										className="size-8 flex items-center justify-center border border-border-subtle hover:bg-red-500/10 text-fg-muted hover:text-red-400 rounded-md transition-all cursor-pointer"
									>
										<Trash2 className="size-3.5" />
									</button>
								</div>
							</div>

							<div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
								<div className="space-y-1">
									<label className="block font-mono text-[8px] font-bold text-fg-muted uppercase tracking-wider">
										Elo Multiplier
									</label>
									<input
										type="number"
										step="0.05"
										value={p.elo_multiplier}
										onChange={(e) => updatePerk(p.id, { elo_multiplier: parseFloat(e.target.value) || 0 })}
										className="w-full h-8 px-2.5 bg-bg-canvas/40 border border-border-subtle rounded-md font-mono text-xs text-fg-default focus:outline-none"
									/>
								</div>
								<div className="space-y-1">
									<label className="block font-mono text-[8px] font-bold text-fg-muted uppercase tracking-wider">
										Starting Elo
									</label>
									<input
										type="number"
										value={p.starting_elo}
										onChange={(e) => updatePerk(p.id, { starting_elo: Number(e.target.value) || 0 })}
										className="w-full h-8 px-2.5 bg-bg-canvas/40 border border-border-subtle rounded-md font-mono text-xs text-fg-default focus:outline-none"
									/>
								</div>
								<div className="space-y-1">
									<label className="block font-mono text-[8px] font-bold text-fg-muted uppercase tracking-wider">
										Map Voting Multiplier
									</label>
									<input
										type="number"
										step="0.1"
										value={p.map_voting_multiplier}
										onChange={(e) => updatePerk(p.id, { map_voting_multiplier: parseFloat(e.target.value) || 0 })}
										className="w-full h-8 px-2.5 bg-bg-canvas/40 border border-border-subtle rounded-md font-mono text-xs text-fg-default focus:outline-none"
									/>
								</div>
							</div>

							<div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
								<div className="space-y-1">
									<label className="block font-mono text-[8px] font-bold text-fg-muted uppercase tracking-wider">
										Source
									</label>
									<select
										value={p.source}
										onChange={(e) => updatePerk(p.id, { source: e.target.value as "role" | "topgg_vote" })}
										className="w-full h-8 px-2 bg-bg-canvas/40 border border-border-subtle rounded-md font-mono text-xs text-fg-default focus:outline-none"
									>
										<option value="role">Role</option>
										<option value="topgg_vote">Top.gg Vote</option>
									</select>
								</div>
								<div className="space-y-1">
									<label className="block font-mono text-[8px] font-bold text-fg-muted uppercase tracking-wider">
										Permissions
									</label>
									<input
										type="text"
										value={p.permissions}
										onChange={(e) => updatePerk(p.id, { permissions: e.target.value })}
										placeholder="comma separated"
										className="w-full h-8 px-2.5 bg-bg-canvas/40 border border-border-subtle rounded-md font-mono text-xs text-fg-default focus:outline-none"
									/>
								</div>
								<div className="space-y-1">
									<label className="block font-mono text-[8px] font-bold text-fg-muted uppercase tracking-wider">
										Allowed Roles
									</label>
									<RoleDropdown
										value={p.allowedRoles}
										onChange={(value) => updatePerk(p.id, { allowedRoles: value })}
										roles={roleOptions}
										placeholder="Select allowed role"
									/>
								</div>
								<div className="space-y-1 sm:col-span-2">
									<label className="block font-mono text-[8px] font-bold text-fg-muted uppercase tracking-wider">
										Denied Roles
									</label>
									<RoleDropdown
										value={p.deniedRoles}
										onChange={(value) => updatePerk(p.id, { deniedRoles: value })}
										roles={roleOptions}
										placeholder="Select denied role"
									/>
								</div>
							</div>
						</div>
					))}
				</div>

				<div className="space-y-6">
					<div className="p-5 border border-border-subtle bg-panel-bg/20 backdrop-blur-md rounded-xl space-y-4 h-fit text-left">
						<div className="flex items-center gap-2 border-b border-border-subtle/50 pb-2.5">
							<Shield className="size-4 text-cyan-500" />
							<h3 className="font-mono text-[11px] font-bold text-fg-default uppercase tracking-widest">
								Perk Sources
							</h3>
						</div>
						<p className="font-mono text-[9px] text-fg-muted uppercase tracking-wide leading-relaxed">
							Role-sourced perks unlock when a member holds an allowed role.
							Top.gg vote perks are granted inside the vote window and revoked on
							expiry. Allowed roles win over denied roles at evaluation time.
						</p>
					</div>

					<div className="p-4 border border-dashed border-border-subtle bg-panel-bg/5 rounded-xl space-y-2 text-left">
						<div className="flex items-center gap-1.5 font-mono text-[10px] font-bold text-fg-default uppercase tracking-wider">
							<Info className="size-3.5 text-primary-500" />
							<span>Multipliers</span>
						</div>
						<p className="font-mono text-[9px] text-fg-muted uppercase leading-normal">
							Elo and map-vote multipliers stack across perks a member owns.
							Multipliers here are distinct from the rank K-factor and MVP bonus
							defined in the ranks registry.
						</p>
					</div>
				</div>
			</div>
		</div>
	);
}