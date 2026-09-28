"use client";

import { Info, Shield, Sparkles } from "lucide-react";
import { useMemo } from "react";
import { AddButton, DeleteButton, Field, InfoCard, InfoText, ListLayout, NoteCard, NumberInput, Panel, SectionBar, SelectInput, TextInput, Toggle } from "@/components/panel/form-parts";
import { PageShell } from "@/components/panel/page-shell";
import RoleDropdown from "@/components/ui/RoleDropdown";
import { useGuildConfig } from "@/features/dashboard/config-provider";
import { useGuildSnapshot } from "@/hooks/useGuildSnapshot";
import { useSectionForm } from "@/hooks/use-section-form";
import type { PerkConfig } from "@/lib/db-types";
import { patchById, removeById } from "@/lib/list";

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

const NEW_PERK = (): PerkRecord => ({
	id: `pk-${Date.now()}`, name: "New Perk", description: "", elo_multiplier: 1.0, starting_elo: 0, map_voting_multiplier: 1.0,
	source: "role", allowedRoles: "", deniedRoles: "", permissions: "", enabled: true,
});

/** Stored perks may predate some fields: fill the gaps so every editor input is controlled. */
const toRecord = (p: Partial<PerkRecord>, i: number): PerkRecord => ({ ...NEW_PERK(), name: "", ...p, id: p.id ?? `pk-${i}` });

const numberFields = [
	{ label: "Elo Multiplier", key: "elo_multiplier", step: 0.05 },
	{ label: "Starting Elo", key: "starting_elo", step: 1 },
	{ label: "Map Voting Multiplier", key: "map_voting_multiplier", step: 0.1 },
] as const;

export default function Page() {
	const { meta, isLoading, isSaving, saveMetaSection } = useGuildConfig();
	const { roleOptions } = useGuildSnapshot();

	const saved = useMemo(() => (meta ? ((meta.perks ?? []) as Partial<PerkRecord>[]).map(toRecord) : null), [meta]);
	const { value: perks, setValue: setPerks, isDirty, submit, justSaved, error } = useSectionForm<PerkRecord[]>(saved, [], (p) =>
		saveMetaSection("perks", p as unknown as PerkConfig[]),
	);
	const update = (id: string, patch: Partial<PerkRecord>) => setPerks((p) => patchById(p, id, patch));

	return (
		<PageShell eyebrow="Capabilities" title="Perks" loading={isLoading} onSave={submit} saving={isSaving} dirty={isDirty} justSaved={justSaved} error={error}>
			<SectionBar
				title="Perk Definitions"
				description="Configure ELO, map-vote and role-scope modifiers per perk"
				action={<AddButton onClick={() => setPerks((p) => [...p, NEW_PERK()])}>Append Perk</AddButton>}
			/>
			<ListLayout
				sidebar={
					<>
						<InfoCard icon={<Shield className="size-4 text-cyan-500" />} title="Perk Sources">
							<InfoText>Role-sourced perks unlock when a member holds an allowed role. Top.gg vote perks are granted inside the vote window and revoked on expiry. Allowed roles win over denied roles at evaluation time.</InfoText>
						</InfoCard>
						<NoteCard icon={<Info className="size-3.5 text-primary-500" />} title="Multipliers">
							Elo and map-vote multipliers stack across perks a member owns. Multipliers here are distinct from the rank K-factor and MVP bonus defined in the ranks registry.
						</NoteCard>
					</>
				}
			>
				{perks.map((p) => (
					<Panel key={p.id} className="space-y-3 motion-fade">
						<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-border-subtle/20">
							<div className="space-y-1">
								<div className="flex items-center gap-2">
									<Sparkles className="size-3.5 text-primary-500" />
									<input type="text" value={p.name} onChange={(e) => update(p.id, { name: e.target.value })} className="bg-transparent text-[13px] font-semibold text-fg-default focus:outline-none border-b border-transparent focus:border-primary-500/50" />
								</div>
								<input type="text" value={p.description} onChange={(e) => update(p.id, { description: e.target.value })} className="w-full bg-transparent text-xs text-fg-muted focus:outline-none" />
							</div>
							<div className="flex items-center gap-2 shrink-0">
								<Toggle size="sm" checked={p.enabled} onChange={(enabled) => update(p.id, { enabled })} className="px-3" />
								<DeleteButton onClick={() => setPerks((list) => removeById(list, p.id))} className="rounded-md" />
							</div>
						</div>

						<div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
							{numberFields.map(({ label, key, step }) => (
								<Field key={key} label={label} mini>
									<NumberInput mini step={step} value={p[key]} onValueChange={(n) => update(p.id, { [key]: n })} className="bg-bg-canvas/40" />
								</Field>
							))}
						</div>

						<div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
							<Field label="Source" mini>
								<SelectInput mini value={p.source} onValueChange={(source) => update(p.id, { source: source as PerkRecord["source"] })} options={[{ value: "role", label: "Role" }, { value: "topgg_vote", label: "Top.gg Vote" }]} className="bg-bg-canvas/40 px-2" />
							</Field>
							<Field label="Permissions" mini>
								<TextInput mini value={p.permissions} onValueChange={(permissions) => update(p.id, { permissions })} placeholder="comma separated" className="bg-bg-canvas/40" />
							</Field>
							<Field label="Allowed Roles" mini>
								<RoleDropdown value={p.allowedRoles} onChange={(allowedRoles) => update(p.id, { allowedRoles })} roles={roleOptions} placeholder="Select allowed role" />
							</Field>
							<Field label="Denied Roles" mini className="sm:col-span-2">
								<RoleDropdown value={p.deniedRoles} onChange={(deniedRoles) => update(p.id, { deniedRoles })} roles={roleOptions} placeholder="Select denied role" />
							</Field>
						</div>
					</Panel>
				))}
			</ListLayout>
		</PageShell>
	);
}
