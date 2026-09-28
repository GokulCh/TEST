"use client";

import { Calendar, Flame, Volume2 } from "lucide-react";
import { useMemo, useState } from "react";
import { AddButton, DeleteButton, EmptyState, Field, InfoCard, InfoText, ListLayout, Panel, SectionBar, SelectInput, TextInput, Toggle } from "@/components/panel/form-parts";
import { PageShell } from "@/components/panel/page-shell";
import RoleDropdown from "@/components/ui/RoleDropdown";
import { useGuildConfig } from "@/features/dashboard/config-provider";
import { useGuildSnapshot } from "@/hooks/useGuildSnapshot";
import { useSectionForm } from "@/hooks/use-section-form";
import type { LeaderboardDisplayConfig } from "@/lib/db-types";
import { patchById, removeById } from "@/lib/list";

const METRICS: Array<{ value: LeaderboardDisplayConfig["metric"]; label: string }> = [
	{ value: "elo", label: "ELO Rating" },
	{ value: "wins", label: "Wins Count" },
	{ value: "highest_streak", label: "Highest Streak" },
	{ value: "kills", label: "Kills Count" },
	{ value: "final_kills", label: "Final Kills" },
	{ value: "beds_destroyed", label: "Beds Destroyed" },
	{ value: "mvp_count", label: "MVP Count" },
];

export default function Page() {
	const { config, isLoading, isSaving, savePanelSection } = useGuildConfig();
	const { roleOptions } = useGuildSnapshot();
	const [webhooksEnabled, setWebhooksEnabled] = useState(true);

	const saved = useMemo(() => (config ? (config.leaderboards ?? []) : null), [config]);
	const { value: boards, setValue: setBoards, isDirty, submit, justSaved, error } = useSectionForm<LeaderboardDisplayConfig[]>(saved, [], (b) => savePanelSection("leaderboards", b));
	const update = (id: string, patch: Partial<LeaderboardDisplayConfig>) => setBoards((b) => patchById(b, id, patch));

	return (
		<PageShell eyebrow="Matchmaking" title="Leaderboards" loading={isLoading} onSave={submit} saving={isSaving} dirty={isDirty} error={error}>
			<SectionBar
				title="Leaderboards"
				description="Configure score lists shown on the public website"
				action={<AddButton onClick={() => setBoards((b) => [...b, { id: `lb-${Date.now()}`, name: "New Stats Metric", metric: "elo", reward_role_id: "", is_enabled: true }])}>Add Leaderboard</AddButton>}
			/>

			{boards.length === 0 && <EmptyState>No leaderboards configured — click &ldquo;Add Leaderboard&rdquo; to create one.</EmptyState>}

			<ListLayout
				sidebar={
					<>
						<InfoCard icon={<Volume2 className="size-4 text-cyan-500" />} title="Auto Webhooks">
							<div className="flex items-center justify-between p-3 rounded-lg border border-border-subtle/40 bg-bg-canvas/30">
								<div className="space-y-0.5 text-left">
									<span className="block text-[13px] font-semibold text-fg-default">Broadcast Top-10</span>
									<span className="text-xs text-fg-muted">Send leaderboard summaries on resets.</span>
								</div>
								<button onClick={() => setWebhooksEnabled(!webhooksEnabled)} className={`h-7 px-3 text-xs font-medium rounded-md border cursor-pointer ${webhooksEnabled ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/30" : "bg-panel-bg border-border-subtle text-fg-muted"}`}>
									{webhooksEnabled ? "ON" : "OFF"}
								</button>
							</div>
						</InfoCard>
						<InfoCard icon={<Calendar className="size-4 text-amber-500" />} title="Season Resets">
							<InfoText>Stats are tracked by season and archived when a season ends.</InfoText>
						</InfoCard>
						<InfoCard icon={<Flame className="size-4 text-rose-500" />} title="Storage">
							<InfoText>
								Leaderboard display config is stored in <code className="text-primary-400">guild_panel_configs.leaderboards</code> — separate from match engine data.
							</InfoText>
						</InfoCard>
					</>
				}
			>
				{boards.map((lb) => (
					<Panel key={lb.id} className="space-y-3">
						<div className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-end">
							<Field label="Board Name">
								<TextInput mini value={lb.name} onValueChange={(name) => update(lb.id, { name })} className="bg-bg-canvas/40" />
							</Field>
							<Field label="Score Metric">
								<SelectInput mini value={lb.metric} onValueChange={(metric) => update(lb.id, { metric: metric as LeaderboardDisplayConfig["metric"] })} options={METRICS} className="bg-bg-canvas/40 px-2" />
							</Field>
							<Field label="Reward Role">
								<RoleDropdown value={lb.reward_role_id} onChange={(reward_role_id) => update(lb.id, { reward_role_id })} roles={roleOptions} placeholder="Select reward role" />
							</Field>
							<div className="flex gap-2 justify-end sm:justify-start">
								<Toggle size="sm" checked={lb.is_enabled} onChange={(is_enabled) => update(lb.id, { is_enabled })} onLabel="Live" offLabel="Muted" className="px-3" />
								<DeleteButton onClick={() => setBoards((b) => removeById(b, lb.id))} className="rounded-md" />
							</div>
						</div>
					</Panel>
				))}
			</ListLayout>
		</PageShell>
	);
}
