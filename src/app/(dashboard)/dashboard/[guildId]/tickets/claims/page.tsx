"use client";

import {
	UsersRound,
	Save,
	Plus,
	Trash2,
	ToggleLeft,
	ToggleRight,
	Info,
	Shield,
} from "lucide-react";
import { useState } from "react";
import { useUnsavedChanges } from "@/hooks/use-unsaved-changes";

interface RoutingRule {
	id: string;
	category: string;
	destinationRole: string;
	fallbackStaff: string;
	enabled: boolean;
}

const DESTINATION_ROLES = ["Admin Team", "Mod Team", "Helper Staff"];

export default function Page() {
	const [isSaving, setIsSaving] = useState(false);
	const [autoClaim, setAutoClaim] = useState(true);
	const [savedAutoClaim, setSavedAutoClaim] = useState(true);

	const [rules, setRules] = useState<RoutingRule[]>([]);
	const [savedRules, setSavedRules] = useState<RoutingRule[]>([]);

	const { isDirty } = useUnsavedChanges(
		[autoClaim, rules],
		[savedAutoClaim, savedRules],
	);

	const updateRule = (id: string, updates: Partial<RoutingRule>) => {
		setRules((prev) => prev.map((r) => (r.id === id ? { ...r, ...updates } : r)));
	};

	const handleSaveChanges = () => {
		setIsSaving(true);
		setTimeout(() => {
			setSavedRules(JSON.parse(JSON.stringify(rules)));
			setSavedAutoClaim(autoClaim);
			setIsSaving(false);
		}, 900);
	};

	const handleToggleEnabled = (id: string) => {
		setRules(rules.map((r) => (r.id === id ? { ...r, enabled: !r.enabled } : r)));
	};

	const handleDeleteRule = (id: string) => {
		setRules(rules.filter((r) => r.id !== id));
	};

	const handleAddRule = () => {
		setRules([
			...rules,
			{
				id: `route-${Date.now()}`,
				category: "New Support Thread",
				destinationRole: "Helper Staff",
				fallbackStaff: "",
				enabled: true,
			},
		]);
	};

	return (
		<div className="w-full p-6 lg:p-8 space-y-6 animate-in fade-in duration-300 select-none max-w-7xl mx-auto text-left">
			{/* HUD PANEL HEADER */}
			<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border-subtle pb-6">
				<div>
					<h1 className="font-mono text-[10px] font-bold uppercase tracking-widest text-fg-muted">
						// Tickets Dispatch Parameters
					</h1>
					<h2 className="text-2xl font-black tracking-tight text-fg-default mt-1">
						Staff Routing Console
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
						{isSaving ? "Publishing Routes..." : "Commit Routing Setup"}
					</span>
				</button>
			</div>

			{/* AUTO ASSIGN TOGGLE */}
			<div className="p-5 border border-border-subtle bg-panel-bg/20 backdrop-blur-md rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
				<div className="space-y-1 text-left">
					<h3 className="font-mono text-xs font-black text-fg-default uppercase tracking-wide">
						Automated Dispatch Balancer
					</h3>
					<p className="font-mono text-[9px] text-fg-muted uppercase max-w-xl leading-relaxed">
						Route newly opened support tickets to specific moderation groups automatically based on category tags.
					</p>
				</div>
				<button
					onClick={() => setAutoClaim(!autoClaim)}
					className={`h-9 px-4 border rounded-lg font-mono text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all shrink-0 cursor-pointer ${
						autoClaim
							? "bg-success/10 border-success/30 text-success"
							: "bg-panel-bg border-border-subtle text-fg-muted"
					}`}
				>
					{autoClaim ? <ToggleRight className="size-4" /> : <ToggleLeft className="size-4" />}
					<span>{autoClaim ? "Dispatch Balancer Active" : "Manual Claims Only"}</span>
				</button>
			</div>

			{/* ACTION BAR */}
			<div className="flex justify-between items-center bg-panel-bg/10 p-4 border border-border-subtle rounded-xl">
				<div>
					<h3 className="font-mono text-xs font-black text-fg-default uppercase tracking-wide">
						Routing Maps
					</h3>
					<p className="font-mono text-[9px] text-fg-muted uppercase mt-0.5">
						Map ticket categories to targeted staff role groups
					</p>
				</div>
				<button
					onClick={handleAddRule}
					className="h-8 px-3 flex items-center gap-1.5 border border-dashed border-primary-500/30 text-primary-500 bg-primary-500/5 hover:bg-primary-500/10 rounded-lg font-mono font-bold text-[10px] uppercase tracking-wider transition-all active:scale-98 cursor-pointer"
				>
					<Plus className="size-3.5" /> Append Routing Rule
				</button>
			</div>

			<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
				{/* RULES LIST */}
				<div className="lg:col-span-2 space-y-4">
					{rules.map((rule) => (
						<div
							key={rule.id}
							className="p-4 border border-border-subtle bg-panel-bg/20 rounded-xl space-y-3 shadow-xs animate-in fade-in duration-150 text-left"
						>
							<div className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-end">
								<div className="space-y-1">
									<label className="block font-mono text-[9px] font-bold text-fg-default uppercase tracking-wider">
										Category Tag
									</label>
									<input
										type="text"
										value={rule.category}
										onChange={(e) => updateRule(rule.id, { category: e.target.value })}
										className="w-full h-8 px-2.5 bg-bg-canvas/40 border border-border-subtle rounded-md font-mono text-xs text-fg-default focus:outline-none focus:border-primary-500/50"
									/>
								</div>

								<div className="space-y-1">
									<label className="block font-mono text-[9px] font-bold text-fg-default uppercase tracking-wider">
										Target Role Group
									</label>
									<select
										value={rule.destinationRole}
										onChange={(e) => updateRule(rule.id, { destinationRole: e.target.value })}
										className="w-full h-8 px-2 bg-bg-canvas/40 border border-border-subtle rounded-md font-mono text-xs text-fg-default focus:outline-none focus:border-primary-500/50"
									>
										{DESTINATION_ROLES.map((r) => (
											<option key={r}>{r}</option>
										))}
									</select>
								</div>

								<div className="space-y-1">
									<label className="block font-mono text-[9px] font-bold text-fg-default uppercase tracking-wider">
										Fallback User
									</label>
									<input
										type="text"
										value={rule.fallbackStaff}
										onChange={(e) => updateRule(rule.id, { fallbackStaff: e.target.value })}
										className="w-full h-8 px-2.5 bg-bg-canvas/40 border border-border-subtle rounded-md font-mono text-xs text-fg-default focus:outline-none focus:border-primary-500/50"
									/>
								</div>

								<div className="flex gap-2 justify-end sm:justify-start">
									<button
										onClick={() => handleToggleEnabled(rule.id)}
										className={`h-8 px-3 border rounded-md font-mono text-[9px] font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer ${
											rule.enabled
												? "bg-success/10 border-success/30 text-success"
												: "bg-panel-bg border-border-subtle text-fg-muted"
										}`}
									>
										{rule.enabled ? <ToggleRight className="size-4" /> : <ToggleLeft className="size-4" />}
										<span>{rule.enabled ? "Active" : "Disabled"}</span>
									</button>

									<button
										onClick={() => handleDeleteRule(rule.id)}
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
					<div className="p-5 border border-border-subtle bg-panel-bg/20 backdrop-blur-md rounded-xl space-y-4 h-fit">
						<div className="flex items-center gap-2 border-b border-border-subtle/50 pb-2.5">
							<Shield className="size-4 text-cyan-500" />
							<h3 className="font-mono text-[11px] font-bold text-fg-default uppercase tracking-widest">
								Escalation Routing
							</h3>
						</div>
						<p className="font-mono text-[9px] text-fg-muted uppercase tracking-wide leading-relaxed text-left">
							If a claimed staff member remains idle for 30 minutes without posting updates inside the support panel thread, the ticket is auto-escalated back to fallback admins.
						</p>
					</div>

					<div className="p-4 border border-dashed border-border-subtle bg-panel-bg/5 rounded-xl space-y-2">
						<div className="flex items-center gap-1.5 font-mono text-[10px] font-bold text-fg-default uppercase tracking-wider">
							<Info className="size-3.5 text-primary-500" />
							<span>Database Synced</span>
						</div>
						<p className="font-mono text-[9px] text-fg-muted uppercase leading-normal text-left">
							Discord group roles are fetched dynamically via OAuth guild credentials mapped inside connection parameters.
						</p>
					</div>
				</div>
			</div>
		</div>
	);
}
