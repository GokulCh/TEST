"use client";

/** Editors for one game mode and one queue group, used by the queue configuration page. */

import { Database, Plus, Trash2, Users, Zap } from "lucide-react";
import { Button, DeleteButton, Field, NumberInput, Panel, TextInput, Toggle } from "@/components/panel/form-parts";
import CategoryDropdown from "@/components/ui/CategoryDropdown";
import ChannelDropdown from "@/components/ui/ChannelDropdown";
import OptionDropdown from "@/components/ui/OptionDropdown";
import { useGuildSnapshot } from "@/hooks/useGuildSnapshot";
import type { ModeConfig, QueueConfig } from "@/lib/db-types";

type ModeType = ModeConfig["type"];
export const MODE_TYPES: ModeType[] = ["casual", "classic", "captain", "party", "event", "elo", "standard"];
const MODE_TYPE_OPTIONS = MODE_TYPES.map((type) => ({ value: type, label: type }));

const COUNT_FIELDS = [
	{ label: "Team Count", field: "team_count" },
	{ label: "Players Per Team", field: "players_per_team" },
	{ label: "Max Players", field: "max_players" },
	{ label: "GUI Slot", field: "gui_slot" },
] as const;

const MODE_FLAGS = [
	{ key: "is_party_queue_enabled", label: "Party Queue", icon: Users },
	{ key: "is_elo_gain_enabled", label: "ELO Points", icon: Zap },
	{ key: "is_stats_tracking_enabled", label: "Track Stats", icon: Database },
	{ key: "is_auto_striking_enabled", label: "Auto Striking", icon: Zap },
	{ key: "is_enabled", label: "Mode Enabled", icon: Zap },
	{ key: "is_queue_category", label: "Queue Category", icon: Database },
] as const;

export const newMode = (slot: number): ModeConfig => ({
	name: "New Custom Mode", stable_id: "new_mode", type: "classic", team_count: 2, players_per_team: 4, max_players: 8, gui_slot: slot,
	is_enabled: true, is_elo_gain_enabled: true, is_stats_tracking_enabled: true, is_auto_striking_enabled: true, is_party_queue_enabled: false, is_queue_category: false,
});

export const newGroup = (): QueueConfig => ({
	name: "New Queue Group", category_id: null, waiting_vc_id: null, is_enabled: true, settings: [],
	voice_team_template: "Team {team} - {mode}", voice_waiting_template: "Waiting - {mode}",
});

const MINI = "bg-panel-bg/40";

export function ModeCard({ mode, onChange, onRemove }: { mode: ModeConfig; onChange: (patch: Partial<ModeConfig>) => void; onRemove: () => void }) {
	return (
		<div className="p-5 bg-bg-canvas/30 border border-border-subtle rounded-xl space-y-5">
			<div className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-end">
				<Field label="Mode Display Label">
					<TextInput mini value={mode.name} onValueChange={(name) => onChange({ name })} className={MINI} />
				</Field>
				<Field label="Stable ID">
					<TextInput mini value={mode.stable_id ?? ""} onValueChange={(stable_id) => onChange({ stable_id })} className={MINI} />
				</Field>
				<Field label="Mode Type">
					<OptionDropdown value={mode.type} onChange={(value) => onChange({ type: value as ModeType })} options={MODE_TYPE_OPTIONS} placeholder="Select mode type" />
				</Field>
				<div className="flex items-end justify-end">
					<Button variant="danger" size="sm" onClick={onRemove}>
						<Trash2 className="size-3" /> Remove
					</Button>
				</div>
			</div>

			<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 pt-4 border-t border-border-subtle/30">
				{COUNT_FIELDS.map(({ label, field }) => (
					<Field key={field} label={label}>
						<NumberInput mini value={mode[field]} onValueChange={(n) => onChange({ [field]: n })} className={MINI} />
					</Field>
				))}
				<Field label="Settings Preset ID">
					<input
						type="text"
						value={mode.settings_id ?? ""}
						onChange={(e) => onChange({ settings_id: e.target.value ? Number(e.target.value) : undefined })}
						placeholder="PG preset"
						className="w-full h-8 px-2.5 bg-panel-bg/40 border border-border-subtle rounded-md font-mono text-xs text-fg-default focus:outline-none focus:border-primary-500/50"
					/>
				</Field>
			</div>

			<div className="space-y-3 pt-4 border-t border-border-subtle/30">
				<span className="block text-xs font-medium text-primary-500">// Mode Settings</span>
				<div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
					{MODE_FLAGS.map(({ key, label, icon: Icon }) => (
						<div
							key={key}
							onClick={() => onChange({ [key]: !mode[key] })}
							className={`p-3 border rounded-xl flex items-center justify-between cursor-pointer transition-all ${mode[key] ? "bg-primary-500/5 border-primary-500/20" : "bg-bg-canvas/10 border-border-subtle/50 opacity-60"}`}
						>
							<span className="block text-[13px] font-semibold text-fg-default">{label}</span>
							<Icon className={`size-3.5 ${mode[key] ? "text-primary-500" : "text-fg-muted"}`} />
						</div>
					))}
				</div>
			</div>
		</div>
	);
}

export function QueueGroupCard({
	group,
	modes,
	onChange,
	onRemove,
}: {
	group: QueueConfig;
	modes: ModeConfig[];
	onChange: (patch: Partial<QueueConfig>) => void;
	onRemove: () => void;
}) {
	const { channels, categoryOptions, threads } = useGuildSnapshot();
	const modeOptions = modes.map((m) => ({ value: m.stable_id ?? m.name, label: m.name }));
	const updateListener = (si: number, patch: Partial<QueueConfig["settings"][number]>) =>
		onChange({ settings: group.settings.map((s, i) => (i === si ? { ...s, ...patch } : s)) });

	return (
		<Panel className="p-5 space-y-4">
			<div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end border-b border-border-subtle/40 pb-4">
				<Field label="Queue Group Name">
					<TextInput value={group.name} onValueChange={(name) => onChange({ name })} />
				</Field>
				<Field label="Discord Category">
					<CategoryDropdown value={group.category_id ?? ""} onChange={(value) => onChange({ category_id: value || null })} categoryOptions={categoryOptions} placeholder="Select a category" />
				</Field>
				<Field label="Waiting Voice Channel">
					<ChannelDropdown value={group.waiting_vc_id ?? ""} onChange={(value) => onChange({ waiting_vc_id: value || null })} channels={channels.filter((ch) => ch.type === "voice")} threads={[]} placeholder="Select a voice channel" />
				</Field>
				<div className="flex gap-2 justify-end">
					<Toggle checked={group.is_enabled} onChange={(is_enabled) => onChange({ is_enabled })} />
					<DeleteButton onClick={onRemove} className="size-9" />
				</div>
			</div>

			<div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-b border-border-subtle/20 pb-4">
				<Field label="Team Voice Channel Template" hint="Variables: {team}, {mode}, {rank}">
					<TextInput value={group.voice_team_template ?? ""} onValueChange={(v) => onChange({ voice_team_template: v || null })} placeholder="Team {team} - {mode}" />
				</Field>
				<Field label="Waiting Voice Channel Template" hint="Variables: {mode}, {rank}">
					<TextInput value={group.voice_waiting_template ?? ""} onValueChange={(v) => onChange({ voice_waiting_template: v || null })} placeholder="Waiting - {mode}" />
				</Field>
			</div>

			<div className="space-y-2.5">
				<div className="flex justify-between items-center px-1">
					<span className="text-xs font-medium text-fg-muted">// Queue Listener Channels</span>
					<Button variant="secondary"
						onClick={() => onChange({ settings: [...group.settings, { name: "New Voice Listener", mode: modes[0]?.stable_id ?? "", channel_id: "", is_enabled: true, allowed_ranks: [], denied_ranks: [] }] })}>
						<Plus className="size-2.5" /> Append Listener
					</Button>
				</div>

				{group.settings.length === 0 && (
					<p className="text-xs text-fg-muted border border-dashed border-border-subtle/60 rounded-lg p-3">No listeners bound — append a voice channel listener.</p>
				)}

				<div className="space-y-2">
					{group.settings.map((setting, si) => (
						<div key={si} className="grid grid-cols-1 sm:grid-cols-12 gap-3 p-3 rounded-xl border border-border-subtle/50 bg-bg-canvas/20 items-end">
							<Field label="Listener Name" mini className="sm:col-span-3">
								<TextInput mini value={setting.name ?? ""} onValueChange={(name) => updateListener(si, { name })} className={MINI} />
							</Field>
							<Field label="Channel" mini className="sm:col-span-3">
								<ChannelDropdown value={setting.channel_id} onChange={(channel_id) => updateListener(si, { channel_id })} channels={channels} threads={threads} placeholder="Select a channel" />
							</Field>
							<Field label="Bound Mode" mini className="sm:col-span-3">
								<OptionDropdown value={setting.mode} onChange={(mode) => updateListener(si, { mode })} options={modeOptions} placeholder="Select bound mode" />
							</Field>
							<div className="sm:col-span-2 flex items-end gap-2">
								<Toggle size="sm" checked={setting.is_enabled} onChange={(is_enabled) => updateListener(si, { is_enabled })} onLabel="On" offLabel="Off" className="flex-1" />
								<DeleteButton onClick={() => onChange({ settings: group.settings.filter((_, i) => i !== si) })} className="rounded-md" label="Remove listener" />
							</div>
						</div>
					))}
				</div>
			</div>
		</Panel>
	);
}
