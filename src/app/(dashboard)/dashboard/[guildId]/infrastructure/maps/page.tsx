"use client";

import { Layers, Map, Package } from "lucide-react";
import { AddButton, DeleteButton, EmptyState, Field, InfoCard, InfoText, NumberInput, Panel, SectionBar, StatRow, TextInput, Toggle } from "@/components/panel/form-parts";
import { PageShell } from "@/components/panel/page-shell";
import { useGuildConfig } from "@/features/dashboard/config-provider";
import { useSectionForm } from "@/hooks/use-section-form";
import type { MapConfig } from "@/lib/db-types";

type MapEntry = MapConfig & { item_type?: "paper" | "map" };

const NEW_MAP = (slot: number): MapEntry => ({
	name: "New Custom Map", stable_id: "new_map", map_height: 128, gui_slot: slot, item_type: "map", is_enabled: true, is_map_available: true, mode_settings: {},
});

export default function Page() {
	const { meta, isLoading, isSaving, saveMetaSection } = useGuildConfig();
	const { value: maps, setValue: setMaps, isDirty, submit, justSaved, error } = useSectionForm<MapEntry[]>(
		meta ? (meta.maps as MapEntry[]) : null,
		[],
		(m) => saveMetaSection("maps", m),
	);

	const updateMap = (idx: number, updates: Partial<MapEntry>) => setMaps((prev) => prev.map((m, i) => (i === idx ? { ...m, ...updates } : m)));
	const availableMaps = maps.filter((m) => m.is_enabled && m.is_map_available).length;

	return (
		<PageShell eyebrow="Infrastructure" title="Map Configuration" loading={isLoading} onSave={submit} saving={isSaving} dirty={isDirty} justSaved={justSaved} error={error}>
			<SectionBar
				title="Game Maps"
				icon={<Map className="size-4 text-primary-500" />}
				description="Add maps, set build heights, and assign teams for each game mode"
				action={<AddButton onClick={() => setMaps((prev) => [...prev, NEW_MAP(prev.length + 1)])}>Add Map</AddButton>}
			/>

			{maps.length === 0 && <EmptyState>No maps configured yet — click &ldquo;Add Map&rdquo; to add one.</EmptyState>}

			{maps.length > 0 && (
				<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
					<div className="lg:col-span-2 space-y-4">
						{maps.map((m, idx) => (
							<Panel key={idx} className="space-y-3">
								<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
									<Field label="Map Name">
										<TextInput value={m.name ?? ""} onValueChange={(name) => updateMap(idx, { name })} />
									</Field>
									<Field label="Stable ID">
										<TextInput value={m.stable_id ?? ""} onValueChange={(stable_id) => updateMap(idx, { stable_id })} />
									</Field>
									<Field label="Map Height">
										<NumberInput value={m.map_height} onValueChange={(map_height) => updateMap(idx, { map_height })} />
									</Field>
									<Field label="GUI Slot">
										<NumberInput value={m.gui_slot} onValueChange={(gui_slot) => updateMap(idx, { gui_slot })} />
									</Field>
								</div>

								<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-border-subtle/10">
									<div className="flex flex-wrap items-center gap-2">
										<Field label="Item Type">
											<select
												value={m.item_type ?? "map"}
												onChange={(e) => updateMap(idx, { item_type: e.target.value as "paper" | "map" })}
												className="h-7 px-2 bg-bg-canvas/40 border border-border-subtle rounded-md text-[13px] text-fg-default transition-[border-color,box-shadow] duration-150 hover:border-fg-muted/30 focus:outline-none focus:border-primary-500/60 focus:ring-2 focus:ring-primary-500/15"
											>
												<option value="paper">Paper</option>
												<option value="map">Map</option>
											</select>
										</Field>
										<Field label="Enabled">
											<Toggle size="sm" checked={m.is_enabled} onChange={(is_enabled) => updateMap(idx, { is_enabled })} offLabel="Inactive" className="h-7 px-2.5" />
										</Field>
										<Field label="Available">
											<Toggle size="sm" checked={m.is_map_available} onChange={(is_map_available) => updateMap(idx, { is_map_available })} offLabel="Inactive" className="h-7 px-2.5" />
										</Field>
									</div>
									<DeleteButton onClick={() => setMaps(maps.filter((_, i) => i !== idx))} className="rounded-md" />
								</div>

								{m.mode_settings && Object.keys(m.mode_settings).length > 0 && (
									<div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-border-subtle/10">
										<span className="text-xs font-medium text-fg-muted">Mode Assignments:</span>
										{Object.entries(m.mode_settings).map(([mode, ms]) => (
											<span key={mode} className="text-xs text-fg-muted bg-bg-canvas/40 border border-border-subtle/60 px-1.5 py-0.5 rounded capitalize">
												{mode} → {ms.teams.join(" | ") || "Unassigned"}
											</span>
										))}
									</div>
								)}
							</Panel>
						))}
					</div>

					<div className="space-y-6">
						<InfoCard icon={<Layers className="size-4 text-cyan-500" />} title="Map Status">
							<div className="space-y-3 text-xs text-fg-muted">
								<StatRow label="Total Maps" className="font-bold">{maps.length}</StatRow>
								<StatRow label="Available" className="text-success">{availableMaps}</StatRow>
								<StatRow label="Paper Type">{maps.filter((m) => m.item_type === "paper").length}</StatRow>
								<StatRow label="Map Type">{maps.filter((m) => m.item_type !== "paper").length}</StatRow>
							</div>
						</InfoCard>
						<InfoCard icon={<Package className="size-4 text-amber-500" />} title="Map Availability">
							<InfoText>Enabled controls if the map can be used. Available shows if it&apos;s currently in rotation.</InfoText>
						</InfoCard>
					</div>
				</div>
			)}
		</PageShell>
	);
}
