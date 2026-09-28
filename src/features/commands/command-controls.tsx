"use client";

import { useState } from "react";
import { Check, Terminal, Trash2, X, Zap } from "lucide-react";
import { Button, Field, InfoCard, TextInput, Toggle } from "@/components/panel/form-parts";
import { useGuildSnapshot } from "@/hooks/useGuildSnapshot";
import { cn } from "@/lib/utils";

export interface Interceptors {
	prefix: string;
	isPrefixEnabled: boolean;
	isSlashEnabled: boolean;
}

const tile = "flex min-h-[92px] flex-col justify-between gap-3 p-3 border border-border-subtle/40 rounded-lg bg-bg-canvas/20";
const tileTitle = "text-[13px] font-semibold text-fg-default";

/** Prefix and slash switches of the bot, saved on their own. */
export function InterceptorsCard({
	value,
	onChange,
	onSave,
	saving,
	dirty,
	prefixError,
}: {
	value: Interceptors;
	onChange: (patch: Partial<Interceptors>) => void;
	onSave: () => void;
	saving: boolean;
	dirty: boolean;
	prefixError?: string | null;
}) {
	return (
		<InfoCard icon={<Terminal className="size-4 text-cyan-500" />} title="Command Interceptors">
			<div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
				<div className={tile}>
					<div className="flex items-center gap-2">
						<Terminal className="size-3.5 text-primary-500" />
						<span className={tileTitle}>Prefix Configuration</span>
					</div>
					<Field label="Prefix" mini error={prefixError}>
						<TextInput mini maxLength={10} value={value.prefix} onValueChange={(prefix) => onChange({ prefix })} className="font-mono" />
					</Field>
				</div>
				<div className={tile}>
					<div className="flex items-center gap-2">
						<Terminal className="size-3.5 text-primary-500" />
						<span className={tileTitle}>Prefix Commands</span>
					</div>
					<Toggle size="sm" checked={value.isPrefixEnabled} onChange={(isPrefixEnabled) => onChange({ isPrefixEnabled })} onLabel="Enabled" className="w-full" />
				</div>
				<div className={tile}>
					<div className="flex items-center gap-2">
						<Zap className="size-3.5 text-emerald-500" />
						<span className={tileTitle}>Slash Commands</span>
					</div>
					<Toggle size="sm" checked={value.isSlashEnabled} onChange={(isSlashEnabled) => onChange({ isSlashEnabled })} onLabel="Enabled" className="w-full" />
				</div>
			</div>
			<Button variant={dirty ? "primary" : "secondary"} size="sm" onClick={onSave} loading={saving} className="self-start">
				{saving ? "Saving…" : "Save"}
			</Button>
		</InfoCard>
	);
}

const selectClass = "h-9 appearance-none rounded-md border border-border-subtle bg-bg-canvas px-3 text-xs text-fg-default outline-none transition-colors focus:border-primary-500/50";
const smallButton = "rounded-md border border-border-subtle bg-bg-canvas/60 px-3 py-1.5 text-xs font-medium text-fg-muted transition-colors hover:border-primary-500/40 hover:text-primary-500";
const actionButton = "inline-flex h-9 items-center gap-1.5 rounded-md border px-3 text-xs font-medium transition-colors disabled:opacity-40";

/** Permission edits applied to every selected command at once. */
export function BulkActions({
	selectedCount,
	onSelectAll,
	onClear,
	onApplyRole,
	onReset,
}: {
	selectedCount: number;
	onSelectAll: () => void;
	onClear: () => void;
	onApplyRole: (field: "allowed_roles" | "denied_roles", roleId: string, mode: "add" | "remove") => void;
	onReset: () => void;
}) {
	const { roleOptions } = useGuildSnapshot();
	const [field, setField] = useState<"allowed_roles" | "denied_roles">("allowed_roles");
	const [role, setRole] = useState("");
	const idle = !role || selectedCount === 0;

	return (
		<div className="w-full space-y-4 rounded-xl border border-border-subtle bg-panel-bg/20 p-5 shadow-sm">
			<div className="flex flex-col items-center justify-between gap-3 text-center sm:flex-row sm:text-left">
				<div>
					<h3 className="text-[13px] font-semibold text-fg-default">Bulk command actions</h3>
					<p className="mt-1 text-xs text-fg-muted">Select commands, then apply permissions or reset their overrides.</p>
				</div>
				<div className="flex items-center gap-2">
					<button type="button" onClick={onSelectAll} className={smallButton}>Select all</button>
					<button type="button" onClick={onClear} className={smallButton}>Clear</button>
					<span className="rounded-md bg-primary-500/10 px-2.5 py-1.5 text-xs font-medium text-primary-500 capitalize">{selectedCount} selected</span>
				</div>
			</div>
			<div className="flex flex-wrap items-center justify-center gap-2 border-t border-border-subtle/60 pt-4">
				<select value={field} onChange={(e) => setField(e.target.value as typeof field)} className={selectClass}>
					<option value="allowed_roles">Allowed roles</option>
					<option value="denied_roles">Denied roles</option>
				</select>
				<select value={role} onChange={(e) => setRole(e.target.value)} className={`${selectClass} min-w-48`}>
					<option value="">Select a role</option>
					{roleOptions.map((r) => (
						<option key={r.id} value={r.id}>{r.name}</option>
					))}
				</select>
				<button type="button" disabled={idle} onClick={() => onApplyRole(field, role, "add")} className={`${actionButton} border-success/30 bg-success/10 text-success hover:bg-success/15`}><Check className="size-3.5" /> Add role</button>
				<button type="button" disabled={idle} onClick={() => onApplyRole(field, role, "remove")} className={`${actionButton} border-danger/30 bg-danger/10 text-danger hover:bg-danger/15`}><X className="size-3.5" /> Remove role</button>
				<button type="button" disabled={selectedCount === 0} onClick={onReset} className={`${actionButton} border-warning/30 bg-warning/10 text-warning hover:bg-warning/15`}><Trash2 className="size-3.5" /> Reset selected</button>
			</div>
		</div>
	);
}
