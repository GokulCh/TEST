"use client";

import {
	AlertCircle,
	CheckCircle2,
	Layers,
	Loader2,
	Map,
	Package,
	Plus,
	Save,
	ToggleLeft,
	ToggleRight,
	Trash2,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useGuildConfig } from "@/features/dashboard/config-provider";
import { useUnsavedChanges } from "@/hooks/use-unsaved-changes";
import type { MapConfig } from "@/lib/db-types";

type MapEntry = MapConfig & { item_type?: "paper" | "map" };

export default function Page() {
	const { meta, isLoading, isSaving, saveMetaSection } = useGuildConfig();
	const [maps, setMaps] = useState<MapEntry[]>([]);
	const [saveSuccess, setSaveSuccess] = useState(false);
	const [saveError, setSaveError] = useState<string | null>(null);

	// Saved state for unsaved changes detection
	const [savedMaps, setSavedMaps] = useState<MapEntry[]>([]);

	useEffect(() => {
		if (meta?.maps) {
			const mapsData = meta.maps as MapEntry[];
			setMaps(mapsData);
			setSavedMaps(mapsData);
		}
	}, [meta]);

	const flashSuccess = () => {
		setSaveSuccess(true);
		setTimeout(() => setSaveSuccess(false), 2500);
	};

	const handleSave = async () => {
		setSaveError(null);
		try {
			await saveMetaSection("maps", maps);
			flashSuccess();
			// Update saved state after successful save
			setSavedMaps(maps);
		} catch (e) {
			setSaveError(e instanceof Error ? e.message : "Save failed");
		}
	};

	const updateMap = (idx: number, updates: Partial<MapEntry>) =>
		setMaps((prev) => prev.map((m, i) => (i === idx ? { ...m, ...updates } : m)));

	// Global unsaved changes detection
	const globalLocal = useMemo(() => ({ maps }), [maps]);
	const globalSaved = useMemo(() => ({ maps: savedMaps }), [savedMaps]);
	const { isDirty } = useUnsavedChanges(globalLocal, globalSaved);

	const availableMaps = maps.filter((m) => m.is_enabled && m.is_map_available).length;

	if (isLoading)
		return (
			<div className="flex items-center justify-center h-64">
				<Loader2 className="size-6 animate-spin text-primary-500" />
			</div>
		);

	return (
		<div className="w-full p-6 lg:p-8 space-y-6 animate-in fade-in duration-300 select-none max-w-7xl mx-auto text-left">
			{/* Header */}
			<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border-subtle pb-6">
				<div>
					<h1 className="font-mono text-[10px] font-bold uppercase tracking-widest text-fg-muted">
						// Infrastructure Arena Index
					</h1>
					<h2 className="text-2xl font-black tracking-tight text-fg-default mt-1">
						Map Registries
					</h2>
				</div>
				<div className="flex items-center gap-2 self-start sm:self-auto">
					{saveSuccess && (
						<span className="flex items-center gap-1.5 font-mono text-[10px] text-success uppercase tracking-wider">
							<CheckCircle2 className="size-3.5" /> Saved
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
						{isSaving ? <Loader2 className="size-3.5 animate-spin" /> : <Save className="size-3.5" />}
						<span>{isSaving ? "Writing..." : "Commit Map Index"}</span>
					</button>
				</div>
			</div>

			{saveError && (
				<div className="flex items-center gap-3 p-3 rounded-lg border border-danger/30 bg-danger/10 text-danger">
					<AlertCircle className="size-4 shrink-0" />
					<p className="font-mono text-[10px] uppercase">{saveError}</p>
				</div>
			)}

			{/* Action bar */}
			<div className="flex justify-between items-center bg-panel-bg/10 p-4 border border-border-subtle rounded-xl">
				<div className="flex items-center gap-2">
					<Map className="size-4 text-primary-500" />
					<div>
						<h3 className="font-mono text-xs font-black text-fg-default uppercase tracking-wide">Game Map Pool</h3>
						<p className="font-mono text-[9px] text-fg-muted uppercase mt-0.5">Register map metadata, build heights and per-mode team assignments</p>
					</div>
				</div>
				<button
					onClick={() =>
						setMaps((prev) => [
							...prev,
							{
								name: "New Custom Map",
								stable_id: "new_map",
								map_height: 128,
								gui_slot: prev.length + 1,
								item_type: "map",
								is_enabled: true,
								is_map_available: true,
								mode_settings: {},
							},
						])
					}
					className="h-8 px-3 flex items-center gap-1.5 border border-dashed border-primary-500/30 text-primary-500 bg-primary-500/5 hover:bg-primary-500/10 rounded-lg font-mono font-bold text-[10px] uppercase tracking-wider transition-all active:scale-98 cursor-pointer"
				>
					<Plus className="size-3.5" /> Register Arena Map
				</button>
			</div>

			{maps.length === 0 && (
				<div className="p-8 border border-dashed border-border-subtle/40 rounded-xl text-center font-mono text-xs text-fg-muted uppercase tracking-wider">
					No maps configured yet — click &ldquo;Register Arena Map&rdquo; to add one.
				</div>
			)}

			<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
				<div className="lg:col-span-2 space-y-4">
					{maps.map((m, idx) => (
						<div key={idx} className="p-4 border border-border-subtle bg-panel-bg/20 rounded-xl space-y-3 shadow-xs">
							<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
								{[
									{ label: "Map Name", key: "name" as const, type: "text" },
									{ label: "Stable ID", key: "stable_id" as const, type: "text" },
									{ label: "Map Height", key: "map_height" as const, type: "number" },
									{ label: "GUI Slot", key: "gui_slot" as const, type: "number" },
								].map(({ label, key, type }) => (
									<div key={key} className="space-y-1">
										<label className="block font-mono text-[9px] font-bold text-fg-default uppercase tracking-wider">{label}</label>
										<input
											type={type}
											value={(m[key] as string | number) ?? ""}
											onChange={(e) => updateMap(idx, { [key]: type === "number" ? Number(e.target.value) : e.target.value })}
											className="w-full h-8 px-2.5 bg-bg-canvas/40 border border-border-subtle rounded-md font-mono text-xs text-fg-default focus:outline-none focus:border-primary-500/50"
										/>
									</div>
								))}
							</div>

							<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-border-subtle/10">
								<div className="flex flex-wrap items-center gap-2">
									<div className="space-y-1">
										<label className="block font-mono text-[9px] font-bold text-fg-default uppercase tracking-wider">Item Type</label>
										<select
											value={m.item_type ?? "map"}
											onChange={(e) => updateMap(idx, { item_type: e.target.value as "paper" | "map" })}
											className="h-7 px-2 bg-bg-canvas/40 border border-border-subtle rounded-md font-mono text-[10px] text-fg-default focus:outline-none"
										>
											<option value="paper">Paper</option>
											<option value="map">Map</option>
										</select>
									</div>
									{[
										{ label: "Enabled", key: "is_enabled" as const },
										{ label: "Available", key: "is_map_available" as const },
									].map(({ label, key }) => (
										<div key={key} className="space-y-1">
											<label className="block font-mono text-[9px] font-bold text-fg-default uppercase tracking-wider">{label}</label>
											<button
												onClick={() => updateMap(idx, { [key]: !m[key] })}
												className={`h-7 px-2.5 border rounded-md font-mono text-[9px] font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all ${m[key] ? "bg-success/10 border-success/30 text-success" : "bg-panel-bg border-border-subtle text-fg-muted"}`}
											>
												{m[key] ? <ToggleRight className="size-4" /> : <ToggleLeft className="size-4" />}
												{m[key] ? "Active" : "Inactive"}
											</button>
										</div>
									))}
								</div>
								<button
									onClick={() => setMaps(maps.filter((_, i) => i !== idx))}
									className="size-8 flex items-center justify-center border border-border-subtle hover:bg-red-500/10 text-fg-muted hover:text-red-400 rounded-md transition-all cursor-pointer"
								>
									<Trash2 className="size-3.5" />
								</button>
							</div>

							{m.mode_settings && Object.keys(m.mode_settings).length > 0 && (
								<div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-border-subtle/10">
									<span className="font-mono text-[9px] font-bold text-fg-muted uppercase tracking-wider">Mode Assignments:</span>
									{Object.entries(m.mode_settings).map(([mode, ms]) => (
										<span key={mode} className="font-mono text-[9px] text-fg-muted uppercase bg-bg-canvas/40 border border-border-subtle/60 px-1.5 py-0.5 rounded">
											{mode} → {ms.teams.join(" | ") || "Unassigned"}
										</span>
									))}
								</div>
							)}
						</div>
					))}
				</div>

				<div className="space-y-6">
					<div className="p-5 border border-border-subtle bg-panel-bg/20 backdrop-blur-md rounded-xl space-y-4 shadow-xs">
						<div className="flex items-center gap-2 border-b border-border-subtle/50 pb-2.5">
							<Layers className="size-4 text-cyan-500" />
							<h3 className="font-mono text-[11px] font-bold text-fg-default uppercase tracking-widest">Map Pool Telemetry</h3>
						</div>
						<div className="space-y-3 font-mono text-[10px] text-fg-muted uppercase">
							<div className="flex justify-between"><span>Registered Maps:</span><span className="text-fg-default font-bold">{maps.length}</span></div>
							<div className="flex justify-between"><span>Ready For Rotation:</span><span className="text-success">{availableMaps}</span></div>
							<div className="flex justify-between"><span>Paper Items:</span><span className="text-fg-default">{maps.filter((m) => m.item_type === "paper").length}</span></div>
							<div className="flex justify-between"><span>Map Items:</span><span className="text-fg-default">{maps.filter((m) => m.item_type !== "paper").length}</span></div>
						</div>
					</div>
					<div className="p-5 border border-border-subtle bg-panel-bg/20 backdrop-blur-md rounded-xl space-y-4 shadow-xs">
						<div className="flex items-center gap-2 border-b border-border-subtle/50 pb-2.5">
							<Package className="size-4 text-amber-500" />
							<h3 className="font-mono text-[11px] font-bold text-fg-default uppercase tracking-widest">Arena Availability</h3>
						</div>
						<p className="font-mono text-[9px] text-fg-muted uppercase tracking-wide leading-relaxed text-left">
							Enabled controls whether the map can be selected at all, while Availability marks it as currently rotating.
						</p>
					</div>
				</div>
			</div>
		</div>
	);
}
