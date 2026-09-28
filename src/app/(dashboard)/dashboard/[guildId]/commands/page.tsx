"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, Search, Terminal } from "lucide-react";
import { PageShell } from "@/components/panel/page-shell";
import { CommandCard } from "@/features/commands/command-card";
import { runWithToast } from "@/lib/client/notify";
import { BulkActions, InterceptorsCard, type Interceptors } from "@/features/commands/command-controls";
import {
	applyRequirements, CATEGORIES, defaultPermission, needsConfiguration, requirementsFromSnapshot, toEntries, toStored,
	type CommandEntry, type StoredCommands,
} from "@/features/commands/command-model";
import { useGuildConfig } from "@/features/dashboard/config-provider";
import { useGuildData, useGuildWrite } from "@/hooks/use-guild-data";
import { useSectionForm } from "@/hooks/use-section-form";
import type { GuildSnapshotBundle } from "@/lib/db-types";

interface CommandsForm {
	commands: CommandEntry[];
	/** Snapshot key -> Discord id that the commands' requirements point at. */
	requirements: Record<string, string>;
}

const NO_COMMANDS: CommandsForm = { commands: [], requirements: {} };
const DEFAULT_INTERCEPTORS: Interceptors = { prefix: "=", isPrefixEnabled: true, isSlashEnabled: true };

export default function Page() {
	const { config, saveConfigSection } = useGuildConfig();
	const write = useGuildWrite();
	const commandsRes = useGuildData<StoredCommands>("commands");
	const snapshotRes = useGuildData<GuildSnapshotBundle>("snapshot");

	const [searchQuery, setSearchQuery] = useState("");
	const [expanded, setExpanded] = useState<Set<string>>(new Set());
	const [selected, setSelected] = useState<Set<string>>(new Set());

	// ── Commands + the Discord ids their requirements point at ──
	const savedMain = useMemo<CommandsForm | null>(
		() => (commandsRes.data === undefined ? null : { commands: toEntries(commandsRes.data), requirements: requirementsFromSnapshot(snapshotRes.data?.state) }),
		[commandsRes.data, snapshotRes.data],
	);
	const main = useSectionForm<CommandsForm>(savedMain, NO_COMMANDS, async ({ commands, requirements }) => {
		const snapshot = snapshotRes.data;
		if (snapshot && JSON.stringify(requirements) !== JSON.stringify(requirementsFromSnapshot(snapshot.state))) {
			await write("PUT", "snapshot", applyRequirements(snapshot.state, requirements));
			await snapshotRes.mutate();
		}
		const stored = toStored(commands);
		await write("PUT", "commands", { commands: stored });
		await commandsRes.mutate(stored, { revalidate: false });
	});
	const { commands, requirements } = main.value;

	// ── Prefix / slash switches ──
	const savedInterceptors = useMemo<Interceptors | null>(
		() => (config ? { prefix: config.prefix ?? "=", isPrefixEnabled: config.is_prefix_enabled ?? true, isSlashEnabled: config.is_slash_enabled ?? true } : null),
		[config],
	);
	const interceptors = useSectionForm<Interceptors>(
		savedInterceptors,
		DEFAULT_INTERCEPTORS,
		async (v) => {
			await saveConfigSection("prefix", v.prefix);
			await saveConfigSection("prefix-enabled", v.isPrefixEnabled);
			await saveConfigSection("slash-enabled", v.isSlashEnabled);
		},
		(v) => (v.prefix.trim() ? null : "The prefix can't be empty"),
	);

	const setCommands = (fn: (list: CommandEntry[]) => CommandEntry[]) => main.setValue((v) => ({ ...v, commands: fn(v.commands) }));
	const updateCommand = (name: string, patch: Partial<CommandEntry>) => setCommands((list) => list.map((c) => (c.name === name ? { ...c, ...patch } : c)));
	const toggleIn = (set: Set<string>, name: string) => {
		const next = new Set(set);
		if (!next.delete(name)) next.add(name);
		return next;
	};

	// Commands still missing a required id come first, then everything by category.
	const sorted = useMemo(
		() => [...commands].sort((a, b) => Number(needsConfiguration(b, requirements)) - Number(needsConfiguration(a, requirements)) || a.category.localeCompare(b.category)),
		[commands, requirements],
	);
	const q = searchQuery.toLowerCase();
	const matches = (c: CommandEntry) => !q || c.name.toLowerCase().includes(q) || c.description.toLowerCase().includes(q);
	const needingConfig = sorted.filter((c) => needsConfiguration(c, requirements) && matches(c));

	const applyRole = (field: "allowed_roles" | "denied_roles", roleId: string, mode: "add" | "remove") =>
		setCommands((list) =>
			list.map((c) => {
				if (!selected.has(c.name)) return c;
				const current = c[field] ?? [];
				const next = mode === "add" ? [...new Set([...current, roleId])] : current.filter((r) => r !== roleId);
				return { ...c, [field]: next.length ? next : null };
			}),
		);
	const resetSelected = () =>
		setCommands((list) => list.map((c) => (selected.has(c.name) ? { ...c, ...defaultPermission(c.name), category: c.category, description: c.description } : c)));

	const renderCard = (cmd: CommandEntry) => (
		<CommandCard
			key={cmd.name}
			cmd={cmd}
			configured={requirements}
			expanded={expanded.has(cmd.name)}
			selected={selected.has(cmd.name)}
			onToggleExpand={() => setExpanded((s) => toggleIn(s, cmd.name))}
			onToggleSelected={() => setSelected((s) => toggleIn(s, cmd.name))}
			onChange={(patch) => updateCommand(cmd.name, patch)}
			onRequirement={(key, value) => main.setValue((v) => ({ ...v, requirements: { ...v.requirements, [key]: value } }))}
		/>
	);

	return (
		<PageShell
			eyebrow="Commands"
			title="Commands Manager"
			loading={commandsRes.isLoading}
			form={main}
			error={commandsRes.error?.message}
		>
			<div className="flex justify-between items-center gap-4 bg-panel-bg/10 p-4 border border-border-subtle rounded-xl">
				<div>
					<h3 className="flex items-center gap-2 text-[13px] font-semibold text-fg-default">
						<Terminal className="size-4 text-primary-500" />
						Registered Bot Command Descriptors
					</h3>
					<p className="text-xs text-fg-muted mt-0.5">
						Per-guild permission overrides for every slash and prefix command in the bot ({commands.filter((c) => c.is_enabled !== false).length}/{commands.length} enabled)
					</p>
				</div>
				<div className="relative">
					<Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-fg-muted" />
					<input
						type="text"
						placeholder="Search commands..."
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
						className="w-64 h-9 pl-10 pr-4 bg-bg-canvas/40 border border-border-subtle rounded-lg text-sm text-fg-default transition-[border-color,box-shadow] duration-150 hover:border-fg-muted/30 focus:outline-none focus:border-primary-500/60 focus:ring-2 focus:ring-primary-500/15"
					/>
				</div>
			</div>

			<InterceptorsCard value={interceptors.value} onChange={interceptors.update} onSave={() => void runWithToast(interceptors.submit)} saving={interceptors.saving} dirty={interceptors.isDirty} prefixError={interceptors.value.prefix.trim() ? null : interceptors.error} />

			<BulkActions
				selectedCount={selected.size}
				onSelectAll={() => setSelected(new Set(sorted.map((c) => c.name)))}
				onClear={() => setSelected(new Set())}
				onApplyRole={applyRole}
				onReset={resetSelected}
			/>

			<div className="flex flex-col gap-5 overflow-visible">
				{needingConfig.length > 0 && (
					<div className="space-y-3 overflow-visible">
						<div className="flex items-center gap-2 border-b border-amber-500/30 pb-2">
							<AlertTriangle className="size-3.5 text-amber-500" />
							<span className="text-xs font-medium text-amber-500">Requires Configuration</span>
							<span className="text-xs text-fg-muted">
								{needingConfig.length} {needingConfig.length === 1 ? "command" : "commands"}
							</span>
						</div>
						<div className="grid grid-cols-1 items-start md:grid-cols-2 gap-4">{needingConfig.map(renderCard)}</div>
					</div>
				)}

				{CATEGORIES.map((category) => {
					const inCategory = sorted.filter((c) => c.category === category && !needsConfiguration(c, requirements) && matches(c));
					if (inCategory.length === 0) return null;
					return (
						<div key={category} className="space-y-3 overflow-visible">
							<div className="flex items-center gap-2 border-b border-border-subtle/50 pb-2">
								<span className="text-[13px] font-semibold text-fg-default">{category}</span>
								<span className="text-xs text-fg-muted">{inCategory.length} commands</span>
							</div>
							<div className="grid grid-cols-1 items-start md:grid-cols-2 gap-4">{inCategory.map(renderCard)}</div>
						</div>
					);
				})}
			</div>
		</PageShell>
	);
}
