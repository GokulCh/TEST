"use client";

import { Award, Palette, TrendingDown, Zap } from "lucide-react";
import { useMemo } from "react";
import { AddButton, DeleteButton, EmptyState, Field, NumberInput, Panel, SectionBar } from "@/components/panel/form-parts";
import { PageShell } from "@/components/panel/page-shell";
import RoleDropdown from "@/components/ui/RoleDropdown";
import { useGuildConfig } from "@/features/dashboard/config-provider";
import { useGuildSnapshot } from "@/hooks/useGuildSnapshot";
import { useSectionForm } from "@/hooks/use-section-form";
import type { RankConfig } from "@/lib/db-types";

const NEW_RANK = (order: number): RankConfig => ({
	rank_name: "New Tier", color: "#6366F1", min_elo: 0, max_elo: 999, order, role_id: "", k_factor_win: 20, k_factor_loss: 20, mvp_bonus: 3, decay: 0,
});

const RANGE_FIELDS: { label: string; field: "min_elo" | "max_elo" | "order" }[] = [
	{ label: "Minimum ELO", field: "min_elo" },
	{ label: "Maximum ELO", field: "max_elo" },
	{ label: "Ladder Order", field: "order" },
];

const FACTOR_FIELDS: { label: string; field: "k_factor_win" | "k_factor_loss" | "mvp_bonus" | "decay"; icon: React.ReactNode }[] = [
	{ label: "K-Factor Win", field: "k_factor_win", icon: <Zap className="size-3 text-success" /> },
	{ label: "K-Factor Loss", field: "k_factor_loss", icon: <Zap className="size-3 text-rose-500" /> },
	{ label: "MVP Bonus", field: "mvp_bonus", icon: <Zap className="size-3 text-amber-500" /> },
	{ label: "Decay Weight", field: "decay", icon: <TrendingDown className="size-3 text-indigo-400" /> },
];

const rankProblem = (r: RankConfig) => (!r.rank_name.trim() ? "Give this rank a name" : r.min_elo > r.max_elo ? "Minimum ELO can't be above the maximum" : null);
const validateRanks = (list: RankConfig[]) => {
	const i = list.findIndex((r) => rankProblem(r));
	return i < 0 ? null : `Rank ${i + 1}: ${rankProblem(list[i])}`;
};

export default function Page() {
	const { meta, isLoading, saveMetaSection } = useGuildConfig();
	const { roleOptions } = useGuildSnapshot();

	// An empty list is a valid saved state, so track it too (null only while meta loads).
	const saved = useMemo(() => (meta ? [...(meta.ranks ?? [])].sort((a, b) => a.order - b.order) : null), [meta]);
	const form = useSectionForm<RankConfig[]>(saved, [], (r) => saveMetaSection("ranks", r), validateRanks);
	const { value: ranks, setValue: setRanks } = form;

	const update = (idx: number, field: keyof RankConfig, value: unknown) =>
		setRanks((prev) => prev.map((r, i) => (i === idx ? { ...r, [field]: value } : r)));

	return (
		<PageShell eyebrow="Matchmaking" title="Rank Configuration" loading={isLoading} form={form}>
			<SectionBar
				title="Player Ranks"
				description="Set ELO ranges, K-factor values, and Discord roles for each rank"
				action={<AddButton onClick={() => setRanks((prev) => [...prev, NEW_RANK(prev.length + 1)])}>Add Rank</AddButton>}
			/>

			{ranks.length === 0 && <EmptyState>No ranks configured yet — click &ldquo;Add Rank&rdquo; to add one.</EmptyState>}

			<div className="space-y-6">
				{ranks.map((rank, idx) => (
					<Panel key={idx} className="p-5 space-y-4">
						<div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-border-subtle/40 pb-3 gap-3">
							<div className="flex items-center gap-3">
								<div style={{ backgroundColor: rank.color ?? "#6366F1" }} className="size-5 rounded-md border border-black/20 shrink-0 flex items-center justify-center text-white text-xs font-medium">{rank.order}</div>
								<input type="text" value={rank.rank_name} onChange={(e) => update(idx, "rank_name", e.target.value)} className="text-sm font-semibold text-fg-default bg-transparent border-b border-transparent hover:border-border-subtle focus:border-primary-500/50 focus:outline-none px-1 py-0.5 rounded aria-[invalid=true]:border-danger/60" aria-label="Rank name" aria-invalid={!rank.rank_name.trim() || undefined} placeholder="Rank name" />
							</div>
							<div className="flex items-center gap-2 self-end sm:self-auto">
								<div className="flex items-center gap-1.5 bg-bg-canvas/40 border border-border-subtle rounded-lg px-2 h-8">
									<Palette className="size-3.5 text-fg-muted" />
									<input type="color" value={rank.color ?? "#6366F1"} onChange={(e) => update(idx, "color", e.target.value)} className="w-5 h-5 bg-transparent border-0 cursor-pointer rounded p-0" />
									<input type="text" value={rank.color ?? ""} onChange={(e) => update(idx, "color", e.target.value)} className="w-16 bg-transparent text-[13px] font-semibold text-fg-default focus:outline-none" />
								</div>
								<DeleteButton onClick={() => setRanks(ranks.filter((_, i) => i !== idx))} />
							</div>
						</div>

						<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
							{RANGE_FIELDS.map(({ label, field }) => (
								<Field key={field} label={label} error={field === "max_elo" && rank.min_elo > rank.max_elo ? "Must be at least the minimum" : null}>
									<div className="relative">
										<Award className="absolute left-2.5 top-2 size-3.5 text-fg-muted/60" />
										<NumberInput value={rank[field] ?? 0} onValueChange={(n) => update(idx, field, n)} className="h-8 pl-8 pr-3 rounded-md" />
									</div>
								</Field>
							))}
							<Field label="Discord Role">
								<RoleDropdown value={rank.role_id} onChange={(value) => update(idx, "role_id", value)} roles={roleOptions} placeholder="Select a role" />
							</Field>
						</div>

						<div className="pt-3 border-t border-border-subtle/30 grid grid-cols-2 lg:grid-cols-4 gap-4">
							{FACTOR_FIELDS.map(({ label, field, icon }) => (
								<div key={field} className="space-y-1">
									<div className="text-[13px] font-semibold text-fg-default flex items-center gap-1">{icon}<span>{label}</span></div>
									<NumberInput value={rank[field] ?? 0} onValueChange={(n) => update(idx, field, n)} />
								</div>
							))}
						</div>
					</Panel>
				))}
			</div>
		</PageShell>
	);
}
