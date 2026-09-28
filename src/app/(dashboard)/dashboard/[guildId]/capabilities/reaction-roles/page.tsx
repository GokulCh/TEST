"use client";

import { Info, Radio, Shield } from "lucide-react";
import { useMemo } from "react";
import { AddButton, DeleteButton, Field, InfoCard, InfoText, ListLayout, NoteCard, Panel, SectionBar, TextInput, Toggle } from "@/components/panel/form-parts";
import { PageShell } from "@/components/panel/page-shell";
import ChannelDropdown from "@/components/ui/ChannelDropdown";
import RoleDropdown from "@/components/ui/RoleDropdown";
import { useGuildConfig } from "@/features/dashboard/config-provider";
import { useGuildSnapshot } from "@/hooks/useGuildSnapshot";
import { useSectionForm } from "@/hooks/use-section-form";
import type { ReactionRoleConfig } from "@/lib/db-types";
import { patchById, removeById } from "@/lib/list";

interface ReactionRoleRecord {
	id: string;
	emoji: string;
	message_id: string;
	channel_id: string;
	role_id: string;
	enabled: boolean;
}

export default function Page() {
	const { config, isLoading, isSaving, saveConfigSection } = useGuildConfig();
	const { channels, threads, roleOptions } = useGuildSnapshot();

	// The API keeps guild_configs.reactions as an object, so the bindings are stored keyed by their id.
	const saved = useMemo(() => (config ? (Object.values(config.reactions ?? {}) as unknown as ReactionRoleRecord[]) : null), [config]);
	const { value: roles, setValue: setRoles, isDirty, submit, justSaved, error } = useSectionForm<ReactionRoleRecord[]>(saved, [], (r) =>
		saveConfigSection("reactions", Object.fromEntries(r.map((rule) => [rule.id, rule])) as unknown as Record<string, ReactionRoleConfig>),
	);
	const update = (id: string, patch: Partial<ReactionRoleRecord>) => setRoles((r) => patchById(r, id, patch));

	return (
		<PageShell eyebrow="Capabilities" title="Reaction Roles Setup" loading={isLoading} onSave={submit} saving={isSaving} dirty={isDirty} justSaved={justSaved} error={error}>
			<SectionBar
				title="Reaction Bindings"
				description="Bind emoji reactions on pinned messages to role snowflakes"
				action={<AddButton onClick={() => setRoles((r) => [...r, { id: `rr-${Date.now()}`, emoji: "", message_id: "", channel_id: "", role_id: "", enabled: true }])}>Append Reaction Role</AddButton>}
			/>
			<ListLayout
				sidebar={
					<>
						<InfoCard icon={<Shield className="size-4 text-cyan-500" />} title="Requirements">
							<InfoText>Rows reference one guild_configs.reactions entry each. The bot must hold Manage Roles above every target role in the server hierarchy to self-serve the assignment.</InfoText>
						</InfoCard>
						<NoteCard icon={<Info className="size-3.5 text-primary-500" />} title="Emoji Inputs">
							Paste a raw unicode emoji or a custom emoji in name:id form, e.g. <Radio className="inline size-3 text-primary-400" /> rbbadge:981234567890.
						</NoteCard>
					</>
				}
			>
				{roles.map((r) => (
					<Panel key={r.id} className="space-y-3">
						<div className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-end">
							<Field label="Reaction Emoji">
								<TextInput mini value={r.emoji} onValueChange={(emoji) => update(r.id, { emoji })} className="bg-bg-canvas/40" />
							</Field>
							<Field label="Message ID">
								<TextInput mini value={r.message_id} onValueChange={(message_id) => update(r.id, { message_id })} className="bg-bg-canvas/40" />
							</Field>
							<Field label="Channel">
								<ChannelDropdown value={r.channel_id} onChange={(channel_id) => update(r.id, { channel_id })} channels={channels} threads={threads} placeholder="Select a channel" />
							</Field>
							<Field label="Role">
								<RoleDropdown value={r.role_id} onChange={(role_id) => update(r.id, { role_id })} roles={roleOptions} placeholder="Select a role" />
							</Field>
						</div>
						<div className="flex justify-end gap-2 pt-1 border-t border-border-subtle/20">
							<Toggle size="sm" checked={r.enabled} onChange={(enabled) => update(r.id, { enabled })} className="px-3" />
							<DeleteButton onClick={() => setRoles((list) => removeById(list, r.id))} className="rounded-md" />
						</div>
					</Panel>
				))}
			</ListLayout>
		</PageShell>
	);
}
