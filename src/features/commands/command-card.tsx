"use client";

import { AlertTriangle, ChevronDown, ChevronRight, Settings2, ToggleLeft, ToggleRight } from "lucide-react";
import { Field, NumberInput, Toggle } from "@/components/panel/form-parts";
import CategoryDropdown from "@/components/ui/CategoryDropdown";
import ChannelDropdown from "@/components/ui/ChannelDropdown";
import MultiOptionDropdown from "@/components/ui/MultiOptionDropdown";
import RoleDropdown from "@/components/ui/RoleDropdown";
import { useGuildSnapshot } from "@/hooks/useGuildSnapshot";
import { cn } from "@/lib/utils";
import { configStatus, flattenRequirements, type CommandEntry, type RequirementEntry } from "./command-model";

/** The dropdown that picks the Discord entity a requirement refers to. */
function RequirementDropdown({ req, value, onChange }: { req: RequirementEntry; value: string; onChange: (value: string) => void }) {
	const { roleOptions, categoryOptions, channels, threads } = useGuildSnapshot();
	const hint = req.optional ? "Optional — select a" : "Select a";
	if (req.type === "role") return <RoleDropdown value={value} onChange={onChange} roles={roleOptions} placeholder={`${hint} role`} />;
	if (req.type === "category") return <CategoryDropdown value={value} onChange={onChange} categoryOptions={categoryOptions} placeholder={`${hint} category`} />;
	return <ChannelDropdown value={value} onChange={onChange} channels={channels} threads={threads} placeholder={`${hint} channel`} />;
}

/** A tri-state flag: `false` switches it off, anything else leaves it on (null = inherit). */
const FlagButton = ({ label, value, onChange }: { label: string; value: boolean | null; onChange: (v: boolean | null) => void }) => (
	<button
		onClick={() => onChange(value === false ? null : false)}
		className={cn(
			"h-7 px-2.5 border rounded-md text-xs font-medium flex items-center justify-center gap-1.5 transition-all cursor-pointer",
			value !== false ? "bg-primary-500/10 border-primary-500/30 text-primary-500" : "bg-panel-bg border-border-subtle text-fg-muted",
		)}
	>
		{value !== false ? <ToggleRight className="size-3.5" /> : <ToggleLeft className="size-3.5" />}
		{label}
	</button>
);

const listInputClass = "w-full h-9 px-2 bg-bg-canvas/40 border border-border-subtle rounded-md text-sm text-fg-default transition-[border-color,box-shadow] duration-150 hover:border-fg-muted/30 focus:outline-none focus:border-primary-500/60 focus:ring-2 focus:ring-primary-500/15";

export interface CommandCardProps {
	cmd: CommandEntry;
	/** Snapshot key -> Discord id chosen so far. */
	configured: Record<string, string>;
	expanded: boolean;
	selected: boolean;
	onToggleExpand: () => void;
	onToggleSelected: () => void;
	onChange: (patch: Partial<CommandEntry>) => void;
	onRequirement: (key: string, value: string) => void;
}

export function CommandCard({ cmd, configured, expanded, selected, onToggleExpand, onToggleSelected, onChange, onRequirement }: CommandCardProps) {
	const { roleOptions, channels, threads } = useGuildSnapshot();
	const status = configStatus(cmd, configured);
	const requirements = flattenRequirements(cmd.requirements);
	const needsConfig = !!status?.needsConfiguration;
	const roles = roleOptions.map((r) => ({ value: r.id, label: r.name }));
	const channelOptions = [...channels, ...threads].map((c) => ({ value: c.id, label: c.name }));

	const setAliases = (text: string) => {
		const extra = text.split(",").map((s) => s.trim()).filter(Boolean);
		onChange({ aliases: [cmd.name, ...extra.filter((a) => a !== cmd.name)] }); // the command's own name always stays
	};

	return (
		<div className={cn("border border-border-subtle bg-panel-bg/20 rounded-xl shadow-xs", needsConfig && "border-amber-500/30 bg-amber-500/5")}>
			<div onClick={onToggleExpand} className="p-4 cursor-pointer hover:bg-panel-bg/30">
				<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
					<div className="flex min-w-0 flex-1 items-start gap-3">
						<input
							type="checkbox"
							aria-label={`Select ${cmd.name}`}
							checked={selected}
							onChange={onToggleSelected}
							onClick={(e) => e.stopPropagation()}
							className="mt-1 size-4 appearance-none rounded border border-border-subtle bg-bg-canvas/80 transition-colors checked:border-primary-500 checked:bg-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/30"
						/>
						<div className="min-w-0 flex-1">
							<div className="flex items-center gap-2">
								{expanded ? <ChevronDown className="size-4 text-fg-muted shrink-0" /> : <ChevronRight className="size-4 text-fg-muted shrink-0" />}
								<span className="text-sm font-semibold text-fg-default">{cmd.name}</span>
								<span className={cn("inline-block text-xs font-medium px-1.5 py-0.5 rounded", cmd.is_enabled !== false ? "text-success bg-success/10" : "text-fg-muted bg-panel-bg")}>
									{cmd.is_enabled !== false ? "Active" : "Disabled"}
								</span>
							</div>
							<p className="text-xs text-fg-muted mt-1 pl-6">{cmd.description || "No description"}</p>
						</div>
					</div>

					<div className="flex items-center gap-2 shrink-0">
						{needsConfig ? (
							<AlertTriangle className="size-4 text-amber-500" aria-label="Requires configuration" />
						) : requirements.length > 0 && status?.configured === requirements.length ? (
							<span className="inline-flex items-center gap-1 rounded-md border border-success/25 bg-success/10 px-2 py-1 text-xs font-medium text-success capitalize">
								<Settings2 className="size-3" /> Configured
							</span>
						) : null}
						<div onClick={(e) => e.stopPropagation()}>
							<Toggle size="sm" checked={cmd.is_enabled !== false} onChange={(on) => onChange({ is_enabled: on ? null : false })} className="px-3" />
						</div>
					</div>
				</div>
			</div>

			{needsConfig && status && (
				<div className="px-4 py-3 bg-amber-500/10 border-t border-amber-500/20 space-y-3">
					<div className="flex items-center gap-2">
						<AlertTriangle className="size-3.5 text-amber-500 shrink-0" />
						<span className="text-xs text-amber-500">
							{status.missing.length === 1 ? `Requires: ${status.missing[0].label}` : `Requires ${status.missing.length} configurations`}
						</span>
					</div>
					<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
						{status.missing.map((req) => (
							<div key={req.key} className="space-y-1">
								<label className="flex items-center gap-1.5 text-xs font-medium text-amber-500">{req.label}</label>
								<RequirementDropdown req={req} value={configured[req.key] || ""} onChange={(v) => onRequirement(req.key, v)} />
							</div>
						))}
					</div>
				</div>
			)}

			{expanded && (
				<div className="px-4 pb-4 pt-4 border-t border-border-subtle/20 space-y-4">
					{requirements.length > 0 && !needsConfig && (
						<div className="space-y-2">
							<div className="flex items-center gap-2 border-b border-amber-500/30 pb-1.5">
								<Settings2 className="size-3.5 text-amber-500" />
								<span className="text-[13px] font-semibold text-fg-default">Required Configuration</span>
								<span className="text-xs text-fg-muted">
									{status?.configured ?? 0}/{requirements.length} set
								</span>
							</div>
							<div className="grid grid-cols-1 sm:grid-cols-2 gap-3 overflow-visible">
								{requirements.map((req) => (
									<div key={req.key} className="space-y-1 overflow-visible">
										<label className="flex items-center gap-1.5 text-xs font-medium text-fg-muted">
											{req.label}
											<span className={cn("px-1 py-px rounded text-xs font-medium", req.optional ? "text-cyan-500 bg-cyan-500/10" : "text-amber-500 bg-amber-500/10")}>
												{req.optional ? "Optional" : "Required"}
											</span>
										</label>
										<RequirementDropdown req={req} value={configured[req.key] || ""} onChange={(v) => onRequirement(req.key, v)} />
									</div>
								))}
							</div>
						</div>
					)}

					<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
						<Field label="Category" mini>
							<div className="w-full h-7 px-2 bg-bg-canvas/20 border border-border-subtle rounded-md font-mono text-xs text-fg-muted flex items-center">{cmd.category}</div>
						</Field>
						<Field label="Description" mini>
							<div className="w-full h-7 px-2 bg-bg-canvas/20 border border-border-subtle rounded-md font-mono text-xs text-fg-muted flex items-center truncate">{cmd.description || "No description"}</div>
						</Field>
					</div>

					<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
						<FlagButton label="Slash Enabled" value={cmd.is_slash_enabled} onChange={(v) => onChange({ is_slash_enabled: v })} />
						<FlagButton label="Prefix Enabled" value={cmd.is_prefix_enabled} onChange={(v) => onChange({ is_prefix_enabled: v })} />
					</div>

					<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
						<Field label="Additional Aliases" hint={`Command name "${cmd.name}" is always included`} mini>
							<input type="text" placeholder="alias1, alias2" value={cmd.aliases.filter((a) => a !== cmd.name).join(", ")} onChange={(e) => setAliases(e.target.value)} className={listInputClass} />
						</Field>
						<Field label="Cooldown (seconds)" hint="Default: 3 seconds" mini>
							<NumberInput min="0" value={cmd.cooldown} fallback={3} onValueChange={(cooldown) => onChange({ cooldown: Math.trunc(cooldown) })} className="h-9 px-2 rounded-md" />
						</Field>
					</div>

					<div className="grid grid-cols-1 sm:grid-cols-2 gap-3 overflow-visible">
						<Field label="Allowed Roles" mini className="overflow-visible">
							<MultiOptionDropdown values={cmd.allowed_roles ?? []} onChange={(v) => onChange({ allowed_roles: v.length ? v : null })} options={roles} ariaLabel="Allowed roles" placeholder="Select allowed role" />
						</Field>
						<Field label="Denied Roles" mini>
							<MultiOptionDropdown values={cmd.denied_roles ?? []} onChange={(v) => onChange({ denied_roles: v.length ? v : null })} options={roles} ariaLabel="Denied roles" placeholder="Select denied role" />
						</Field>
					</div>

					<div className="grid grid-cols-1 sm:grid-cols-2 gap-3 overflow-visible">
						<Field label="Allowed Channels" mini className="overflow-visible">
							<MultiOptionDropdown values={cmd.allowed_channels ?? []} onChange={(v) => onChange({ allowed_channels: v.length ? v : null })} options={channelOptions} ariaLabel="Allowed channels" placeholder="Select allowed channel" />
						</Field>
						<Field label="Disallowed Channels" mini>
							<MultiOptionDropdown values={cmd.disallowed_channels ?? []} onChange={(v) => onChange({ disallowed_channels: v.length ? v : null })} options={channelOptions} ariaLabel="Disallowed channels" placeholder="Select disallowed channel" />
						</Field>
					</div>
				</div>
			)}
		</div>
	);
}
