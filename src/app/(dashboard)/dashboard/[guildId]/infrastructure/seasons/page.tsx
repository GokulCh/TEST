"use client";

import { CalendarDays, History, Sparkles, TrendingDown } from "lucide-react";
import { useMemo } from "react";
import { AddButton, DeleteButton, EmptyState, Field, InfoCard, InfoText, NumberInput, Panel, SectionBar, TextInput, Toggle } from "@/components/panel/form-parts";
import { PageShell } from "@/components/panel/page-shell";
import { DatePicker } from "@/components/ui/DatePicker";
import { useGuildConfig } from "@/features/dashboard/config-provider";
import { useSectionForm } from "@/hooks/use-section-form";
import type { EloEngineConfig, GameSeasonModel, SeasonConfig } from "@/lib/db-types";

/**
 * The DB owns `number` and the active flag, so the editor works on the writable
 * subset. `key` gives unsaved seasons — which have no `id` yet — a stable React
 * identity, and is stripped before the list is sent.
 */
type SeasonDraft = SeasonConfig & { id?: number; number: number; key: string };
type Decay = { enabled: boolean; decayFloor: number; inactivityDays: number };
interface FormValue { seasons: SeasonDraft[]; decay: Decay }

const NO_DECAY: Decay = { enabled: false, decayFloor: 0, inactivityDays: 0 };

/** Map a stored season onto the fields the editor can write. */
function toDraft(season: GameSeasonModel): SeasonDraft {
	return {
		id: season.id,
		number: season.number,
		key: `season-${season.id}`,
		name: season.name,
		description: season.description,
		start_date: season.starts_at.slice(0, 10),
		end_date: season.ends_at ? season.ends_at.slice(0, 10) : "",
		is_enabled: season.is_active,
	};
}

const seasonProblem = (s: SeasonDraft) =>
	!s.name.trim() ? "Give this season a name" : s.end_date && s.start_date && s.end_date < s.start_date ? "The end date is before the start date" : null;
const validateSeasons = ({ seasons }: FormValue) => {
	const bad = seasons.find((s) => seasonProblem(s));
	return bad ? `Season #${bad.number}: ${seasonProblem(bad)}` : null;
};

export default function Page() {
	const { seasons: stored, config, isLoading, isSaving, saveSeasons, saveConfigSection } = useGuildConfig();

	const saved = useMemo<FormValue>(() => {
		const d = config?.elo_engine?.elo_decay;
		return {
			seasons: stored.map(toDraft).sort((a, b) => b.number - a.number),
			decay: d ? { enabled: d.enabled, decayFloor: d.decayFloor, inactivityDays: d.inactivityDays } : NO_DECAY,
		};
	}, [stored, config]);

	// saveSeasons adopts the DB's reconciled list, which re-syncs `stored` and so the form.
	const { value, update, isDirty, submit, justSaved, error } = useSectionForm<FormValue>(saved, saved, async ({ seasons, decay }) => {
		const eloEngine: EloEngineConfig = { ...(config?.elo_engine ?? {}), elo_decay: { ...decay } };
		// Strip the local-only key; a season without an id is created by the DB, which also assigns its number.
		const payload: SeasonConfig[] = seasons.map(({ key: _key, ...season }) => season);
		await Promise.all([saveSeasons(payload), saveConfigSection("elo-engine", eloEngine)]);
	}, validateSeasons);
	const { seasons, decay } = value;

	const setSeasons = (fn: (s: SeasonDraft[]) => SeasonDraft[]) => update({ seasons: fn(seasons) });
	const updateSeason = (key: string, updates: Partial<SeasonDraft>) => setSeasons((prev) => prev.map((s) => (s.key === key ? { ...s, ...updates } : s)));
	const setDecay = (patch: Partial<Decay>) => update({ decay: { ...decay, ...patch } });
	const nextNumber = seasons.length > 0 ? Math.max(...seasons.map((s) => s.number)) + 1 : 1;

	return (
		<PageShell eyebrow="Infrastructure" title="Season Management" loading={isLoading} onSave={submit} saving={isSaving} dirty={isDirty} justSaved={justSaved} error={error}>
			<Panel className="p-5 space-y-4 shadow-sm">
				<div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
					<div className="space-y-1 text-left">
						<h3 className="flex items-center gap-2 text-[13px] font-semibold text-fg-default">
							<TrendingDown className="size-4 text-amber-500" />
							ELO Decay Settings
						</h3>
						<p className="text-xs text-fg-muted max-w-xl leading-relaxed">
							Lowers ELO for inactive players. Decay stops at the minimum level and only starts after the set inactive period.
						</p>
					</div>
					<Toggle checked={decay.enabled} onChange={(enabled) => setDecay({ enabled })} onLabel="Decay Active" offLabel="Decay Paused" className="shrink-0" />
				</div>
				<div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
					<Field label="Decay Floor (Min ELO)">
						<NumberInput value={decay.decayFloor} onValueChange={(decayFloor) => setDecay({ decayFloor })} />
					</Field>
					<Field label="Inactivity Window (Days)">
						<NumberInput value={decay.inactivityDays} onValueChange={(inactivityDays) => setDecay({ inactivityDays })} />
					</Field>
				</div>
			</Panel>

			<SectionBar
				title="Seasons"
				description="Set active seasons and schedule future competitive periods"
				action={
					<AddButton
						onClick={() =>
							setSeasons((prev) => [
								...prev,
								{ key: `new-${nextNumber}`, number: nextNumber, name: `Season ${nextNumber}: New Rotation`, description: "", start_date: new Date().toISOString().slice(0, 10), end_date: "", is_enabled: false },
							])
						}
					>
						Add Season
					</AddButton>
				}
			/>

			{seasons.length === 0 && <EmptyState>No seasons configured — click &ldquo;Add Season&rdquo; to create one.</EmptyState>}

			{seasons.length > 0 && (
				<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
					<div className="lg:col-span-2 space-y-4">
						{seasons.map((s) => (
							<Panel key={s.key} className="space-y-3">
								<div className="flex justify-between items-center border-b border-border-subtle/20 pb-2">
									<div className="flex items-center gap-2">
										<CalendarDays className="size-3.5 text-primary-500" />
										<span className="text-[13px] font-semibold text-fg-default">Season #{s.number}</span>
									</div>
									<div className="flex items-center gap-2">
										<span className={`text-xs font-medium px-1.5 py-0.5 rounded border ${s.is_enabled ? "bg-success/10 border-success/30 text-success" : "bg-panel-bg border-border-subtle text-fg-muted"}`}>
											{s.is_enabled ? "Active" : "Archived"}
										</span>
										<DeleteButton onClick={() => setSeasons((prev) => prev.filter((x) => x.key !== s.key))} className="size-7 rounded-md" />
									</div>
								</div>

								<div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
									<Field label="Season Name" error={!s.name.trim() ? "Give this season a name" : null}>
										<TextInput value={s.name} onValueChange={(name) => updateSeason(s.key, { name })} />
									</Field>
									<Field label="Start Date">
										<DatePicker value={s.start_date?.slice(0, 10) ?? ""} onChange={(start_date) => updateSeason(s.key, { start_date })} placeholder="Select start date" />
									</Field>
									<Field label="End Date" error={s.end_date && s.start_date && s.end_date < s.start_date ? "Before the start date" : null}>
										<DatePicker value={(s.end_date ?? "").slice(0, 10)} onChange={(end_date) => updateSeason(s.key, { end_date })} placeholder="Select end date" />
									</Field>
								</div>

								<Field label="Description">
									<TextInput value={s.description ?? ""} onValueChange={(description) => updateSeason(s.key, { description })} />
								</Field>

								<div className="flex items-center justify-between pt-1 border-t border-border-subtle/10">
									<span className="text-xs text-fg-muted">Season State</span>
									<Toggle size="sm" checked={s.is_enabled} onChange={(is_enabled) => updateSeason(s.key, { is_enabled })} offLabel="Archived" className="h-7 px-2.5" />
								</div>
							</Panel>
						))}
					</div>

					<div className="space-y-6">
						<InfoCard icon={<Sparkles className="size-4 text-cyan-500" />} title="Season Rewards">
							<InfoText>Discord roles and badges are automatically given to top players when a season ends.</InfoText>
						</InfoCard>
						<InfoCard icon={<History className="size-4 text-amber-500" />} title="Season Archives">
							<InfoText>Archived seasons keep leaderboards and stats available for viewing past seasons.</InfoText>
						</InfoCard>
					</div>
				</div>
			)}
		</PageShell>
	);
}
