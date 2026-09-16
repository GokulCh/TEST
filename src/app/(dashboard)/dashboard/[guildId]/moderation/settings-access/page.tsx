"use client";

import {
	AlertCircle,
	Lock,
	ShieldAlert,
	ToggleLeft,
	ToggleRight,
	Zap,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useGuildConfig } from "@/features/dashboard/config-provider";
import { useUnsavedChanges } from "@/hooks/use-unsaved-changes";
import { useGuildSnapshot } from "@/hooks/useGuildSnapshot";
import RoleDropdown from "@/components/ui/RoleDropdown";

type SettingKey = "stats_visibility" | "elo_visibility" | "party_invites" | "party_autowarp" | "result_pings";

interface SettingRestrictionUI {
	allowed_roles: string[];
	allowed_perks: string[];
	require_booster: boolean;
	is_locked: boolean;
}

const SETTINGS_META: Record<SettingKey, { title: string; description: string }> = {
	stats_visibility: { title: "Stats Visibility", description: "Allow players to toggle public or hidden statistics." },
	elo_visibility: { title: "ELO Visibility", description: "Allow players to toggle public ELO rating display." },
	party_invites: { title: "Party Invites", description: "Allow players to enable or disable incoming party invite alerts." },
	party_autowarp: { title: "Party Autowarp", description: "Allow party leaders to automatically warp members into match servers." },
	result_pings: { title: "Result Pings", description: "Allow players to receive ping notifications on match completion." },
};

const DEFAULT_RESTRICTIONS: Record<SettingKey, SettingRestrictionUI> = {
	stats_visibility: { allowed_roles: [], allowed_perks: [], require_booster: false, is_locked: false },
	elo_visibility: { allowed_roles: [], allowed_perks: [], require_booster: false, is_locked: false },
	party_invites: { allowed_roles: [], allowed_perks: [], require_booster: false, is_locked: false },
	party_autowarp: { allowed_roles: [], allowed_perks: [], require_booster: false, is_locked: false },
	result_pings: { allowed_roles: [], allowed_perks: [], require_booster: false, is_locked: false },
};

export default function Page() {
	const {
		config,
		isLoading,
		isSaving,
		saveConfigSection,
	} = useGuildConfig();

	const { roleOptions } = useGuildSnapshot();

	const [saveSuccess, setSaveSuccess] = useState(false);
	const [saveError, setSaveError] = useState<string | null>(null);

	// ── Restrictions ───────────────────────────────────────────────────────
	const [restrictions, setRestrictions] = useState<Record<SettingKey, SettingRestrictionUI>>(DEFAULT_RESTRICTIONS);

	// ── Sync from DB ──────────────────────────────────────────────────────
	useEffect(() => {
		if (!config) return;
		if (config.settings_restrictions) {
			const r = config.settings_restrictions as Record<string, SettingRestrictionUI>;
			setRestrictions((prev) => {
				const merged = { ...prev };
				for (const key of Object.keys(SETTINGS_META) as SettingKey[]) {
					if (r[key]) merged[key] = { ...prev[key], ...r[key] };
				}
				return merged;
			});
		}
	}, [config]);

	// ── Saved snapshots ────────────────────────────────────────────────────
	const savedRestrictions = useMemo(() => {
		if (!config) return null;
		const base = { ...DEFAULT_RESTRICTIONS };
		if (config.settings_restrictions) {
			const r = config.settings_restrictions as Record<string, SettingRestrictionUI>;
			for (const key of Object.keys(SETTINGS_META) as SettingKey[]) {
				if (r[key]) base[key] = { ...base[key], ...r[key] };
			}
		}
		return base;
	}, [config]);

	// ── Global unsaved changes ─────────────────────────────────────────────
	const { isDirty } = useUnsavedChanges(restrictions, savedRestrictions);

	// ── Save ──────────────────────────────────────────────────────────────
	const flashSuccess = () => {
		setSaveSuccess(true);
		setTimeout(() => setSaveSuccess(false), 2500);
	};

	const handleSave = async () => {
		setSaveError(null);
		try {
			// TODO: dedicated API route for settings_restrictions
			flashSuccess();
		} catch (e) {
			setSaveError(e instanceof Error ? e.message : "Save failed");
		}
	};

	const updateRestriction = (key: SettingKey, updates: Partial<SettingRestrictionUI>) => {
		setRestrictions((prev) => ({ ...prev, [key]: { ...prev[key], ...updates } }));
	};

	if (isLoading) {
		return (
			<div className="flex items-center justify-center h-64">
				<div className="size-6 animate-spin rounded-full border-2 border-primary-500 border-t-transparent" />
			</div>
		);
	}

	return (
		<div className="w-full p-6 lg:p-8 space-y-8 animate-in fade-in duration-300 select-none max-w-7xl mx-auto">
			{/* Header */}
			<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border-subtle pb-6">
				<div>
					<h1 className="font-mono text-[10px] font-bold uppercase tracking-widest text-fg-muted">
						// Settings Access Control
					</h1>
					<h2 className="text-2xl font-black tracking-tight text-fg-default mt-1">
						Settings Permission Manager
					</h2>
				</div>
				<div className="flex items-center gap-2 self-start sm:self-auto">
					{saveSuccess && (
						<span className="flex items-center gap-1.5 font-mono text-[10px] text-success uppercase tracking-wider">
							<Lock className="size-3.5" /> Saved
						</span>
					)}
					<button
						onClick={handleSave}
						disabled={isSaving}
						className={`h-9 px-4 flex items-center gap-2 font-mono font-bold text-[11px] uppercase tracking-wider rounded-lg transition-all active:scale-98 cursor-pointer shadow-sm disabled:opacity-60 border ${
							isDirty
								? "border-warning/40 bg-warning/15 hover:bg-warning/25 text-warning"
								: "border-primary-500/20 bg-primary-500/10 hover:bg-primary-500/20 text-primary-500"
						}`}
					>
						{isSaving ? <div className="size-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" /> : <Lock className="size-3.5" />}
						<span>{isSaving ? "Syncing..." : "Commit Changes"}</span>
					</button>
				</div>
			</div>

			{saveError && (
				<div className="flex items-center gap-3 p-3 rounded-lg border border-danger/30 bg-danger/10 text-danger">
					<AlertCircle className="size-4 shrink-0" />
					<p className="font-mono text-[10px] uppercase">{saveError}</p>
				</div>
			)}

			{/* Info banner */}
			<div className="p-4 border border-primary-500/20 bg-primary-500/5 rounded-xl flex items-start gap-3">
				<ShieldAlert className="size-5 text-primary-500 shrink-0 mt-0.5" />
				<div className="space-y-1 text-left">
					<h3 className="font-mono text-xs font-bold text-fg-default uppercase tracking-wide">Settings Access Control</h3>
					<p className="font-mono text-[10px] text-fg-muted leading-relaxed">
						Restrict <code className="text-primary-400">/settings</code> command toggles to designated Discord roles, active perks, or Nitro boosters.
					</p>
				</div>
			</div>

			{/* Restrictions grid */}
			<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
				{(Object.keys(SETTINGS_META) as SettingKey[]).map((key) => {
					const meta = SETTINGS_META[key];
					const item = restrictions[key];
					return (
						<div key={key} className={`p-5 border rounded-xl space-y-4 text-left transition-all ${item.is_locked ? "border-danger/30 bg-danger/5" : "border-border-subtle bg-panel-bg/20"}`}>
							<div className="flex items-start justify-between gap-3 border-b border-border-subtle/50 pb-3">
								<div>
									<div className="flex items-center gap-2">
										<h4 className="font-mono text-xs font-bold text-fg-default uppercase tracking-wider">{meta.title}</h4>
										{item.is_locked ? (
											<span className="font-mono text-[9px] font-black uppercase tracking-wider text-danger bg-danger/10 px-1.5 py-0.5 rounded flex items-center gap-1"><Lock className="size-2.5" /> Locked</span>
										) : (item.allowed_roles.length > 0 || item.require_booster) ? (
											<span className="font-mono text-[9px] font-black uppercase tracking-wider text-warning bg-warning/10 px-1.5 py-0.5 rounded">Restricted</span>
										) : (
											<span className="font-mono text-[9px] font-black uppercase tracking-wider text-success bg-success/10 px-1.5 py-0.5 rounded">Open</span>
										)}
									</div>
									<p className="font-mono text-[9px] text-fg-muted mt-1">{meta.description}</p>
								</div>
								<button onClick={() => updateRestriction(key, { is_locked: !item.is_locked })} className={`h-7 px-2.5 font-mono text-[9px] font-bold uppercase tracking-wider rounded-md border transition-all cursor-pointer flex items-center gap-1 shrink-0 ${item.is_locked ? "bg-danger text-white border-danger" : "bg-panel-bg text-fg-muted border-border-subtle hover:text-fg-default"}`}>
									<Lock className="size-3" /> {item.is_locked ? "Unlock" : "Hard Lock"}
								</button>
							</div>
							{!item.is_locked && (
								<div className="space-y-3 pt-1">
									<div className="flex items-center justify-between p-2.5 border border-border-subtle/40 rounded-lg bg-bg-canvas/20">
										<div className="flex items-center gap-2">
											<Zap className="size-3.5 text-amber-400" />
											<span className="font-mono text-[10px] font-bold text-fg-default uppercase tracking-wider">Require Booster</span>
										</div>
										<button
											onClick={() => updateRestriction(key, { require_booster: !item.require_booster })}
											className={`h-7 px-2.5 border rounded-md font-mono text-[9px] font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
												item.require_booster
													? "bg-primary-500/10 border-primary-500/30 text-primary-500"
													: "bg-panel-bg border-border-subtle text-fg-muted"
											}`}
										>
											{item.require_booster ? <ToggleRight className="size-3.5" /> : <ToggleLeft className="size-3.5" />}
											{item.require_booster ? "Required" : "Not Required"}
										</button>
									</div>
									<div className="space-y-1.5">
										<label className="block font-mono text-[9px] font-bold text-fg-default uppercase tracking-wider">Allowed Roles</label>
										<RoleDropdown
											value={item.allowed_roles[0] || ""}
											onChange={(value) => updateRestriction(key, { allowed_roles: value ? [value] : [] })}
											roles={roleOptions}
											placeholder="Select allowed role"
										/>
									</div>
								</div>
							)}
						</div>
					);
				})}
			</div>
		</div>
	);
}
