"use client";

import { Lock, ShieldAlert, Zap } from "lucide-react";
import { useMemo } from "react";
import { Field, Panel, Toggle } from "@/components/panel/form-parts";
import { PageShell } from "@/components/panel/page-shell";
import RoleDropdown from "@/components/ui/RoleDropdown";
import { useGuildConfig } from "@/features/dashboard/config-provider";
import { useGuildSnapshot } from "@/hooks/useGuildSnapshot";
import { useSectionForm } from "@/hooks/use-section-form";
import { cn } from "@/lib/utils";

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
const KEYS = Object.keys(SETTINGS_META) as SettingKey[];

const OPEN: SettingRestrictionUI = { allowed_roles: [], allowed_perks: [], require_booster: false, is_locked: false };
const DEFAULT_RESTRICTIONS = Object.fromEntries(KEYS.map((k) => [k, OPEN])) as Record<SettingKey, SettingRestrictionUI>;

const BADGE = "text-xs font-medium px-1.5 py-0.5 rounded";

export default function Page() {
	const { config, isLoading, isSaving, saveConfigSection } = useGuildConfig();
	const { roleOptions } = useGuildSnapshot();

	// Stored restrictions laid over the defaults, so every setting always has an entry.
	const saved = useMemo(() => {
		if (!config) return null;
		const stored = (config.settings_restrictions ?? {}) as Record<string, SettingRestrictionUI>;
		return Object.fromEntries(KEYS.map((k) => [k, { ...OPEN, ...stored[k] }])) as Record<SettingKey, SettingRestrictionUI>;
	}, [config]);
	const { value: restrictions, setValue, isDirty, submit, justSaved, error } = useSectionForm(saved, DEFAULT_RESTRICTIONS, (r) => saveConfigSection("settings-restrictions", r));

	const updateRestriction = (key: SettingKey, updates: Partial<SettingRestrictionUI>) => setValue((prev) => ({ ...prev, [key]: { ...prev[key], ...updates } }));

	return (
		<PageShell eyebrow="Moderation" title="Settings Access" loading={isLoading} onSave={submit} saving={isSaving} dirty={isDirty} justSaved={justSaved} error={error}>
			<div className="p-4 border border-primary-500/20 bg-primary-500/5 rounded-xl flex items-start gap-3">
				<ShieldAlert className="size-5 text-primary-500 shrink-0 mt-0.5" />
				<div className="space-y-1 text-left">
					<h3 className="text-[13px] font-semibold text-fg-default">Settings Access Control</h3>
					<p className="text-xs text-fg-muted leading-relaxed">
						Restrict <code className="text-primary-400">/settings</code> command toggles to designated Discord roles, active perks, or Nitro boosters.
					</p>
				</div>
			</div>

			<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
				{KEYS.map((key) => {
					const { title, description } = SETTINGS_META[key];
					const item = restrictions[key];
					return (
						<Panel key={key} className={cn("p-5 space-y-4 transition-all", item.is_locked && "border-danger/30 bg-danger/5")}>
							<div className="flex items-start justify-between gap-3 border-b border-border-subtle/50 pb-3">
								<div>
									<div className="flex items-center gap-2">
										<h4 className="text-[13px] font-semibold text-fg-default">{title}</h4>
										{item.is_locked ? (
											<span className={`${BADGE} text-danger bg-danger/10 flex items-center gap-1`}><Lock className="size-2.5" /> Locked</span>
										) : item.allowed_roles.length > 0 || item.require_booster ? (
											<span className={`${BADGE} text-warning bg-warning/10`}>Restricted</span>
										) : (
											<span className={`${BADGE} text-success bg-success/10`}>Open</span>
										)}
									</div>
									<p className="text-xs text-fg-muted mt-1">{description}</p>
								</div>
								<button onClick={() => updateRestriction(key, { is_locked: !item.is_locked })} className={cn("h-7 px-2.5 text-xs font-medium rounded-md border transition-all cursor-pointer flex items-center gap-1 shrink-0", item.is_locked ? "bg-danger text-white border-danger" : "bg-panel-bg text-fg-muted border-border-subtle hover:text-fg-default")}>
									<Lock className="size-3" /> {item.is_locked ? "Unlock" : "Hard Lock"}
								</button>
							</div>
							{!item.is_locked && (
								<div className="space-y-3 pt-1">
									<div className="flex items-center justify-between p-2.5 border border-border-subtle/40 rounded-lg bg-bg-canvas/20">
										<div className="flex items-center gap-2">
											<Zap className="size-3.5 text-amber-400" />
											<span className="text-[13px] font-semibold text-fg-default">Require Booster</span>
										</div>
										<Toggle size="sm" checked={item.require_booster} onChange={(require_booster) => updateRestriction(key, { require_booster })} onLabel="Required" offLabel="Not Required" className="h-7 px-2.5" />
									</div>
									<Field label="Allowed Roles">
										<RoleDropdown
											value={item.allowed_roles[0] || ""}
											onChange={(value) => updateRestriction(key, { allowed_roles: value ? [value] : [] })}
											roles={roleOptions}
											placeholder="Select allowed role"
										/>
									</Field>
								</div>
							)}
						</Panel>
					);
				})}
			</div>
		</PageShell>
	);
}
