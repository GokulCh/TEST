"use client";

import {
	AlertTriangle,
	ChevronDown,
	ChevronRight,
	Loader2,
	Save,
	Search,
	Settings2,
	Terminal,
	ToggleLeft,
	ToggleRight,
	Trash2,
	Zap,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useGuildConfig } from "@/features/dashboard/config-provider";
import { useUnsavedChanges } from "@/hooks/use-unsaved-changes";
import { useGuildSnapshot } from "@/hooks/useGuildSnapshot";
import RoleDropdown from "@/components/ui/RoleDropdown";
import ChannelDropdown from "@/components/ui/ChannelDropdown";
import CategoryDropdown from "@/components/ui/CategoryDropdown";

type RequirementType = "role" | "channel" | "category" | "thread";

interface RequirementEntry {
	type: RequirementType;
	key: string;
	optional: boolean;
	label: string;
}

interface CommandRequirements {
	roles: Record<string, CommandRequirementEntry>;
	channels: Record<string, CommandRequirementEntry>;
	categories: Record<string, CommandRequirementEntry>;
	threads: Record<string, CommandRequirementEntry>;
}

interface CommandRequirementEntry {
	key: string;
	optional: boolean;
	error_message?: string;
}

interface CommandEntry {
	name: string;
	category: string;
	description: string;
	is_enabled: boolean | null;
	is_slash_enabled: boolean | null;
	is_prefix_enabled: boolean | null;
	aliases: string[];
	allowed_roles: string[] | null;
	denied_roles: string[] | null;
	allowed_channels: string[] | null;
	disallowed_channels: string[] | null;
	subcommands: Record<string, SubcommandEntry>;
	cooldown: number;
	requirements?: CommandRequirements;
}

interface SubcommandEntry {
	is_enabled: boolean | null;
	is_slash_enabled: boolean | null;
	is_prefix_enabled: boolean | null;
	aliases: string[];
	allowed_roles: string[] | null;
	denied_roles: string[] | null;
	allowed_channels: string[] | null;
	disallowed_channels: string[] | null;
	cooldown: number;
}



const CATEGORIES = ["general", "general/game", "general/profile", "moderation/discord", "moderation/game", "moderation/player"];

// Helper to flatten requirements from organized structure
const flattenRequirements = (requirements?: CommandRequirements): RequirementEntry[] => {
	if (!requirements) return [];
	
	const flat: RequirementEntry[] = [];
	
	Object.entries(requirements.roles || {}).forEach(([key, req]) => {
		flat.push({ type: "role", key, optional: req.optional, label: key });
	});
	
	Object.entries(requirements.channels || {}).forEach(([key, req]) => {
		flat.push({ type: "channel", key, optional: req.optional, label: key });
	});
	
	Object.entries(requirements.categories || {}).forEach(([key, req]) => {
		flat.push({ type: "category", key, optional: req.optional, label: key });
	});
	
	Object.entries(requirements.threads || {}).forEach(([key, req]) => {
		flat.push({ type: "thread", key, optional: req.optional, label: key });
	});
	
	return flat;
};

// Helper to check if a command needs configuration
const commandNeedsConfiguration = (cmd: CommandEntry, configuredRequirements: Record<string, string>) => {
	const flatRequirements = flattenRequirements(cmd.requirements);
	if (flatRequirements.length === 0) return false;
	
	return flatRequirements.some(req => {
		if (req.optional) return false;
		const key = req.key;
		// Check if the requirement is configured
		return !configuredRequirements[key] || configuredRequirements[key] === "";
	});
};

// Helper to get configuration status for a command
const getCommandConfigStatus = (cmd: CommandEntry, configuredRequirements: Record<string, string>) => {
	const flatRequirements = flattenRequirements(cmd.requirements);
	if (flatRequirements.length === 0) return null;
	
	const missing = flatRequirements.filter(req => {
		if (req.optional) return false;
		const key = req.key;
		return !configuredRequirements[key] || configuredRequirements[key] === "";
	});
	
	const optionalMissing = flatRequirements.filter(req => {
		return req.optional && (!configuredRequirements[req.key] || configuredRequirements[req.key] === "");
	});
	
	return {
		hasRequirements: true,
		needsConfiguration: missing.length > 0,
		missing: missing,
		optionalMissing: optionalMissing,
		total: flatRequirements.length,
		configured: flatRequirements.length - missing.length,
	};
};

const DEFAULT_PERMISSION = (commandName: string) => ({
	is_enabled: false,
	is_slash_enabled: false,
	is_prefix_enabled: false,
	aliases: [commandName],
	allowed_roles: null,
	denied_roles: null,
	allowed_channels: null,
	disallowed_channels: null,
	subcommands: {} as Record<string, SubcommandEntry>,
	cooldown: 3,
});

export default function Page() {
	const { dbGuildId, config } = useGuildConfig();
	const { roleOptions, categoryOptions, channels, threads } = useGuildSnapshot();

	const [isSaving, setIsSaving] = useState(false);
	const [isLoading, setIsLoading] = useState(true);
	const [commands, setCommands] = useState<CommandEntry[]>([]);
	const [expandedCommands, setExpandedCommands] = useState<Set<string>>(new Set());
	const [searchQuery, setSearchQuery] = useState("");

	// Command interceptors state
	const [prefix, setPrefix] = useState("=");
	const [isPrefixEnabled, setIsPrefixEnabled] = useState(true);
	const [isSlashEnabled, setIsSlashEnabled] = useState(true);
	const [isSavingCommands, setIsSavingCommands] = useState(false);

	// Requirements configuration state
	const [configuredRequirements, setConfiguredRequirements] = useState<Record<string, string>>({});

	// Saved state for unsaved changes detection
	const [savedCommands, setSavedCommands] = useState<CommandEntry[]>([]);
	const [savedRequirements, setSavedRequirements] = useState<Record<string, string>>({});
	const [savedPrefix, setSavedPrefix] = useState("=");
	const [savedPrefixEnabled, setSavedPrefixEnabled] = useState(true);
	const [savedSlashEnabled, setSavedSlashEnabled] = useState(true);

	// Sync command interceptors from config
	useEffect(() => {
		if (config) {
			setPrefix(config.prefix ?? "=");
			setIsPrefixEnabled(config.is_prefix_enabled ?? true);
			setIsSlashEnabled(config.is_slash_enabled ?? true);
			// Update saved state for unsaved changes detection
			setSavedPrefix(config.prefix ?? "=");
			setSavedPrefixEnabled(config.is_prefix_enabled ?? true);
			setSavedSlashEnabled(config.is_slash_enabled ?? true);
		}
	}, [config]);

	const handleSaveCommandInterceptors = async () => {
		if (!dbGuildId) return;
		setIsSavingCommands(true);
		try {
			const res = await fetch(`/api/db/guilds/${dbGuildId}/config`, {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					section: "prefix",
					data: prefix,
				}),
			});
			if (!res.ok) throw new Error("Failed to save prefix");

			await fetch(`/api/db/guilds/${dbGuildId}/config`, {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					section: "prefix-enabled",
					data: isPrefixEnabled,
				}),
			});

			await fetch(`/api/db/guilds/${dbGuildId}/config`, {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					section: "slash-enabled",
					data: isSlashEnabled,
				}),
			});

			// Update saved state after successful save
			setSavedPrefix(prefix);
			setSavedPrefixEnabled(isPrefixEnabled);
			setSavedSlashEnabled(isSlashEnabled);
		} catch (error) {
			console.error("Failed to save command interceptors:", error);
		} finally {
			setIsSavingCommands(false);
		}
	};

	// Load requirements configuration
	useEffect(() => {
		if (!dbGuildId) return;

		const loadRequirements = async () => {
			try {
				const res = await fetch(`/api/db/guilds/${dbGuildId}/config`);
				if (res.ok) {
					const data = await res.json();
					const requirements = data.data?.requirements;
					if (requirements) {
						const combinedRequirements = {
							...(requirements.roles || {}),
							...(requirements.channels || {}),
							...(requirements.categories || {}),
							...(requirements.threads || {}),
						};
						setConfiguredRequirements(combinedRequirements);
						setSavedRequirements(combinedRequirements);
					}
				}
			} catch (error) {
				console.error("Failed to load requirements:", error);
			}
		};

		loadRequirements();
	}, [dbGuildId]);

	// Load commands from API
	useEffect(() => {
		if (!dbGuildId) return;

		const loadCommands = async () => {
			setIsLoading(true);
			try {
				const res = await fetch(`/api/db/guilds/${dbGuildId}/commands`);
				if (res.ok) {
					const data = await res.json();
					// Convert object to array format expected by the component
					const commandsArray = data.data
						? Object.entries(data.data).map(([name, cmd]: [string, any]) => {
								// Ensure command name is always in aliases
								const existingAliases = Array.isArray(cmd.aliases) ? cmd.aliases : [];
								const aliases = existingAliases.includes(name) ? existingAliases : [name, ...existingAliases];
								return {
									name,
									category: cmd.category || "general",
									description: cmd.description || "",
									is_enabled: cmd.is_enabled,
									is_slash_enabled: cmd.is_slash_enabled,
									is_prefix_enabled: cmd.is_prefix_enabled,
									aliases: aliases,
									allowed_roles: cmd.allowed_roles || null,
									denied_roles: cmd.denied_roles || null,
									allowed_channels: cmd.allowed_channels || null,
									disallowed_channels: cmd.disallowed_channels || null,
									subcommands: cmd.subcommands || {},
									cooldown: cmd.cooldown ?? 3,
									requirements: cmd.requirements || {
										roles: {},
										channels: {},
										categories: {},
										threads: {},
									},
								};
							})
						: [];
					setCommands(commandsArray);
					setSavedCommands(commandsArray);
				}
			} catch (error) {
				console.error("Failed to load commands:", error);
			} finally {
				setIsLoading(false);
			}
		};

		loadCommands();
	}, [dbGuildId]);

	const updateCommand = (name: string, updates: Partial<CommandEntry>) => {
		setCommands((prev) =>
			prev.map((c) => (c.name === name ? { ...c, ...updates } : c))
		);
	};

	const updateRequirement = (key: string, value: string) => {
		setConfiguredRequirements(prev => ({
			...prev,
			[key]: value,
		}));
	};

	const saveRequirements = async () => {
		if (!dbGuildId) return;
		try {
			// Separate requirements by type
			const roles: Record<string, string> = {};
			const channels: Record<string, string> = {};
			const categories: Record<string, string> = {};
			const threads: Record<string, string> = {};

			Object.entries(configuredRequirements).forEach(([key, value]) => {
				if (key.startsWith("guild_role_")) {
					roles[key] = value;
				} else if (key.startsWith("guild_channel_")) {
					channels[key] = value;
				} else if (key.startsWith("guild_category_")) {
					categories[key] = value;
				} else if (key.startsWith("guild_thread_")) {
					threads[key] = value;
				}
			});

			await fetch(`/api/db/guilds/${dbGuildId}/config`, {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					section: "requirements",
					data: {
						roles,
						channels,
						categories,
						threads,
					},
				}),
			});
		} catch (error) {
			console.error("Failed to save requirements:", error);
		}
	};

	// Helper to get display aliases (command name + additional aliases)
	const getDisplayAliases = (cmd: CommandEntry) => {
		const additionalAliases = cmd.aliases.filter(a => a !== cmd.name);
		return additionalAliases.join(", ");
	};

	// Helper to update aliases while preserving command name
	const updateAliases = (cmdName: string, newValue: string) => {
		const parts = newValue.split(",").map(s => s.trim()).filter(Boolean);
		// Always include command name as first alias
		const aliases = [cmdName, ...parts.filter(a => a !== cmdName)];
		updateCommand(cmdName, { aliases });
	};

	const toggleExpand = (name: string) => {
		setExpandedCommands((prev) => {
			const next = new Set(prev);
			if (next.has(name)) {
				next.delete(name);
			} else {
				next.add(name);
			}
			return next;
		});
	};

	const handleSaveChanges = async () => {
		if (!dbGuildId) return;
		setIsSaving(true);
		try {
			// Save requirements first
			await saveRequirements();

			// Convert array back to object format for API
			const commandsObject = Array.isArray(commands) ? commands.reduce((acc, cmd) => {
				acc[cmd.name] = {
					category: cmd.category,
					description: cmd.description,
					is_enabled: cmd.is_enabled,
					is_slash_enabled: cmd.is_slash_enabled,
					is_prefix_enabled: cmd.is_prefix_enabled,
					aliases: cmd.aliases,
					allowed_roles: cmd.allowed_roles,
					denied_roles: cmd.denied_roles,
					allowed_channels: cmd.allowed_channels,
					disallowed_channels: cmd.disallowed_channels,
					subcommands: cmd.subcommands,
					cooldown: cmd.cooldown,
					requirements: cmd.requirements || [],
				};
				return acc;
			}, {} as Record<string, any>) : {};

			const res = await fetch(`/api/db/guilds/${dbGuildId}/commands`, {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ commands: commandsObject }),
			});
			if (!res.ok) throw new Error("Failed to save commands");

			// Update saved state after successful save
			setSavedCommands(commands);
			setSavedRequirements(configuredRequirements);
			setSavedPrefix(prefix);
			setSavedPrefixEnabled(isPrefixEnabled);
			setSavedSlashEnabled(isSlashEnabled);
		} catch (error) {
			console.error("Failed to save commands:", error);
		} finally {
			setIsSaving(false);
		}
	};

	const enabledCount = Array.isArray(commands) ? commands.filter((c) => c.is_enabled !== false).length : 0;

	// Global unsaved changes detection (main commands + requirements)
	const globalLocal = useMemo(() => ({
		commands,
		requirements: configuredRequirements,
	}), [commands, configuredRequirements]);

	const globalSaved = useMemo(() => ({
		commands: savedCommands,
		requirements: savedRequirements,
	}), [savedCommands, savedRequirements]);

	const { isDirty: commandsDirty } = useUnsavedChanges(globalLocal, globalSaved);

	// Separate dirty state for command interceptors
	const interceptorsLocal = useMemo(() => ({
		prefix,
		isPrefixEnabled,
		isSlashEnabled,
	}), [prefix, isPrefixEnabled, isSlashEnabled]);

	const interceptorsSaved = useMemo(() => ({
		prefix: savedPrefix,
		isPrefixEnabled: savedPrefixEnabled,
		isSlashEnabled: savedSlashEnabled,
	}), [savedPrefix, savedPrefixEnabled, savedSlashEnabled]);

	const { isDirty: interceptorsDirty } = useUnsavedChanges(interceptorsLocal, interceptorsSaved);

	// Combined dirty state for main save button
	const isDirty = commandsDirty || interceptorsDirty;

	// Sort commands: those needing configuration first, then by category
	const sortedCommands = Array.isArray(commands) ? [...commands].sort((a, b) => {
		const aNeedsConfig = commandNeedsConfiguration(a, configuredRequirements);
		const bNeedsConfig = commandNeedsConfiguration(b, configuredRequirements);
		
		if (aNeedsConfig && !bNeedsConfig) return -1;
		if (!aNeedsConfig && bNeedsConfig) return 1;
		
		// Both need config or both don't, sort by category
		return a.category.localeCompare(b.category);
	}) : [];

	// Commands that still need their requirements configured — pulled to the top
	const commandsNeedingConfig = Array.isArray(sortedCommands)
		? sortedCommands.filter(
				(c) =>
					commandNeedsConfiguration(c, configuredRequirements) &&
					(searchQuery === "" ||
						c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
						c.description.toLowerCase().includes(searchQuery.toLowerCase()))
			)
		: [];

	// Render the appropriate dropdown for a requirement based on its type
	const renderRequirementDropdown = (req: RequirementEntry) => {
		const value = configuredRequirements[req.key] || "";
		if (req.type === "role") {
			return (
				<RoleDropdown
					value={value}
					onChange={(v) => updateRequirement(req.key, v)}
					roles={roleOptions}
					placeholder={req.optional ? "Optional — select a role" : "Select a role"}
				/>
			);
		}
		if (req.type === "category") {
			return (
				<CategoryDropdown
					value={value}
					onChange={(v) => updateRequirement(req.key, v)}
					categoryOptions={categoryOptions}
					placeholder={req.optional ? "Optional — select a category" : "Select a category"}
				/>
			);
		}
		return (
			<ChannelDropdown
				value={value}
				onChange={(v) => updateRequirement(req.key, v)}
				channels={channels}
				threads={threads}
				placeholder={req.optional ? "Optional — select a channel" : "Select a channel"}
			/>
		);
	};

	// Render a single command config card
	const renderCommandCard = (cmd: CommandEntry) => {
		const isExpanded = expandedCommands.has(cmd.name);
		const needsConfig = commandNeedsConfiguration(cmd, configuredRequirements);
		const configStatus = getCommandConfigStatus(cmd, configuredRequirements);
		const requirements = flattenRequirements(cmd.requirements);

		return (
			<div
				key={cmd.name}
				className={`border border-border-subtle bg-panel-bg/20 rounded-xl shadow-xs animate-in fade-in duration-150 ${
					needsConfig ? "border-amber-500/30 bg-amber-500/5" : ""
				}`}
			>
				{/* Command Header - Always Visible */}
				<div
					onClick={() => toggleExpand(cmd.name)}
					className="p-4 cursor-pointer hover:bg-panel-bg/30 transition-all"
				>
					<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
						<div className="min-w-0 flex-1">
							<div className="flex items-center gap-2">
								{isExpanded ? (
									<ChevronDown className="size-4 text-fg-muted shrink-0" />
								) : (
									<ChevronRight className="size-4 text-fg-muted shrink-0" />
								)}
								<span className="font-mono text-sm font-black text-fg-default">
									{cmd.name}
								</span>
								<span className={`inline-block font-mono text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded ${
									cmd.is_enabled !== false ? "text-success bg-success/10" : "text-fg-muted bg-panel-bg"
								}`}>
									{cmd.is_enabled !== false ? "Active" : "Disabled"}
								</span>
							</div>
							<p className="font-mono text-[9px] text-fg-muted uppercase tracking-wide mt-1 pl-6">
								{cmd.description || "No description"}
							</p>
						</div>

						<div className="flex items-center gap-2 shrink-0">
							{needsConfig && (
								<AlertTriangle className="size-4 text-amber-500" aria-label="Requires configuration" />
							)}
							<button
								onClick={(e) => {
									e.stopPropagation();
									updateCommand(cmd.name, { is_enabled: cmd.is_enabled === false ? null : false });
								}}
								className={`h-8 px-3 border rounded-md font-mono text-[9px] font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer ${
									cmd.is_enabled !== false
										? "bg-success/10 border-success/30 text-success"
										: "bg-panel-bg border-border-subtle text-fg-muted"
								}`}
							>
								{cmd.is_enabled !== false ? (
									<ToggleRight className="size-4" />
								) : (
									<ToggleLeft className="size-4" />
								)}
								<span>{cmd.is_enabled !== false ? "Active" : "Disabled"}</span>
							</button>
						</div>
					</div>
				</div>

				{/* Configuration Warning + Quick-Fix Dropdowns */}
				{needsConfig && (
					<div className="px-4 py-3 bg-amber-500/10 border-t border-amber-500/20 space-y-3">
						<div className="flex items-center gap-2">
							<AlertTriangle className="size-3.5 text-amber-500 shrink-0" />
							<span className="font-mono text-[9px] text-amber-500 uppercase tracking-wider">
								{configStatus?.missing.length === 1 
									? `Requires: ${configStatus.missing[0].label}` 
									: `Requires ${configStatus?.missing.length} configurations`}
							</span>
						</div>
						{configStatus && configStatus.missing.length > 0 && (
							<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
								{flattenRequirements(cmd.requirements).filter(req => !req.optional && (!configuredRequirements[req.key] || configuredRequirements[req.key] === "")).map((req) => (
									<div key={req.key} className="space-y-1">
										<label className="flex items-center gap-1.5 font-mono text-[9px] font-bold text-amber-500 uppercase tracking-wider">
											{req.label}
										</label>
										{renderRequirementDropdown(req)}
									</div>
								))}
							</div>
						)}
					</div>
				)}

				{/* Expanded Configuration */}
				{isExpanded && (
					<div className="px-4 pb-4 pt-4 border-t border-border-subtle/20 space-y-4 animate-in fade-in duration-150">
						{/* Required Configuration Dropdowns */}
						{flattenRequirements(cmd.requirements).length > 0 && (
							<div className="space-y-2">
								<div className="flex items-center gap-2 border-b border-amber-500/30 pb-1.5">
									<Settings2 className="size-3.5 text-amber-500" />
									<span className="font-mono text-[9px] font-bold text-fg-default uppercase tracking-wider">
										Required Configuration
									</span>
									<span className="font-mono text-[8px] text-fg-muted uppercase tracking-wider">
										{configStatus?.configured ?? 0}/{flattenRequirements(cmd.requirements).length} set
									</span>
								</div>
								<div className="grid grid-cols-1 sm:grid-cols-2 gap-3 overflow-visible">
									{flattenRequirements(cmd.requirements).map((req) => (
										<div key={req.key} className="space-y-1 overflow-visible">
											<label className="flex items-center gap-1.5 font-mono text-[9px] font-bold text-fg-muted uppercase tracking-wider">
												{req.label}
												<span className={`px-1 py-px rounded font-mono text-[7px] font-black uppercase tracking-widest ${
													req.optional ? "text-cyan-500 bg-cyan-500/10" : "text-amber-500 bg-amber-500/10"
												}`}>
													{req.optional ? "Optional" : "Required"}
												</span>
											</label>
											{renderRequirementDropdown(req)}
										</div>
									))}
								</div>
							</div>
						)}

						<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
							<div className="space-y-1">
								<label className="block font-mono text-[9px] font-bold text-fg-muted uppercase tracking-wider">
									Category
								</label>
								<div className="w-full h-7 px-2 bg-bg-canvas/20 border border-border-subtle rounded-md font-mono text-xs text-fg-muted flex items-center">
									{cmd.category}
								</div>
							</div>
							<div className="space-y-1">
								<label className="block font-mono text-[9px] font-bold text-fg-muted uppercase tracking-wider">
									Description
								</label>
								<div className="w-full h-7 px-2 bg-bg-canvas/20 border border-border-subtle rounded-md font-mono text-xs text-fg-muted flex items-center truncate">
									{cmd.description || "No description"}
								</div>
							</div>
						</div>

						<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
							<button
								onClick={() =>
									updateCommand(cmd.name, {
										is_slash_enabled: cmd.is_slash_enabled === false ? null : false,
									})
								}
								className={`h-7 px-2.5 border rounded-md font-mono text-[9px] font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
								cmd.is_slash_enabled !== false
									? "bg-primary-500/10 border-primary-500/30 text-primary-500"
									: "bg-panel-bg border-border-subtle text-fg-muted"
							}`}
							>
								{cmd.is_slash_enabled !== false ? (
									<ToggleRight className="size-3.5" />
								) : (
									<ToggleLeft className="size-3.5" />
								)}
								Slash Enabled
							</button>
							<button
								onClick={() =>
									updateCommand(cmd.name, {
										is_prefix_enabled: cmd.is_prefix_enabled === false ? null : false,
									})
								}
								className={`h-7 px-2.5 border rounded-md font-mono text-[9px] font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
								cmd.is_prefix_enabled !== false
									? "bg-primary-500/10 border-primary-500/30 text-primary-500"
									: "bg-panel-bg border-border-subtle text-fg-muted"
							}`}
							>
								{cmd.is_prefix_enabled !== false ? (
									<ToggleRight className="size-3.5" />
								) : (
									<ToggleLeft className="size-3.5" />
								)}
								Prefix Enabled
							</button>
						</div>

						<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
							<div className="space-y-1">
								<label className="block font-mono text-[9px] font-bold text-fg-muted uppercase tracking-wider">
									Additional Aliases
								</label>
								<input
									type="text"
									placeholder="alias1, alias2"
									value={getDisplayAliases(cmd)}
									onChange={(e) => updateAliases(cmd.name, e.target.value)}
									className="w-full h-9 px-2 bg-bg-canvas/40 border border-border-subtle rounded-md font-mono text-xs text-fg-default focus:outline-none"
								/>
								<p className="font-mono text-[8px] text-fg-muted mt-1">
									Command name "{cmd.name}" is always included
								</p>
							</div>
							<div className="space-y-1">
								<label className="block font-mono text-[9px] font-bold text-fg-muted uppercase tracking-wider">
									Cooldown (seconds)
								</label>
								<input
									type="number"
									min="0"
									value={cmd.cooldown}
									onChange={(e) => updateCommand(cmd.name, { cooldown: parseInt(e.target.value) || 3 })}
									className="w-full h-9 px-2 bg-bg-canvas/40 border border-border-subtle rounded-md font-mono text-xs text-fg-default focus:outline-none"
								/>
								<p className="font-mono text-[8px] text-fg-muted mt-1">
									Default: 3 seconds
								</p>
							</div>
						</div>

						<div className="grid grid-cols-1 sm:grid-cols-2 gap-3 overflow-visible">
							<div className="space-y-1 overflow-visible">
								<label className="block font-mono text-[9px] font-bold text-fg-muted uppercase tracking-wider">
									Allowed Roles
								</label>
								<RoleDropdown
									value={cmd.allowed_roles?.[0] || ""}
									onChange={(value) =>
										updateCommand(cmd.name, {
											allowed_roles: value ? [value] : null,
										})
									}
									roles={roleOptions}
									placeholder="Select allowed role"
								/>
							</div>
							<div className="space-y-1">
								<label className="block font-mono text-[9px] font-bold text-fg-muted uppercase tracking-wider">
									Denied Roles
								</label>
								<RoleDropdown
									value={cmd.denied_roles?.[0] || ""}
									onChange={(value) =>
										updateCommand(cmd.name, {
											denied_roles: value ? [value] : null,
										})
									}
									roles={roleOptions}
									placeholder="Select denied role"
								/>
							</div>
						</div>

						<div className="grid grid-cols-1 sm:grid-cols-2 gap-3 overflow-visible">
							<div className="space-y-1 overflow-visible">
								<label className="block font-mono text-[9px] font-bold text-fg-muted uppercase tracking-wider">
									Allowed Channels
								</label>
								<ChannelDropdown
									value={cmd.allowed_channels?.[0] || ""}
									onChange={(value) =>
										updateCommand(cmd.name, {
											allowed_channels: value ? [value] : null,
										})
									}
									channels={channels}
									threads={threads}
									placeholder="Select allowed channel"
								/>
							</div>
							<div className="space-y-1">
								<label className="block font-mono text-[9px] font-bold text-fg-muted uppercase tracking-wider">
									Disallowed Channels
								</label>
								<ChannelDropdown
									value={cmd.disallowed_channels?.[0] || ""}
									onChange={(value) =>
										updateCommand(cmd.name, {
											disallowed_channels: value ? [value] : null,
										})
									}
									channels={channels}
									threads={threads}
									placeholder="Select disallowed channel"
								/>
							</div>
						</div>
					</div>
				)}
			</div>
		);
	};

	if (isLoading) {
		return (
			<div className="flex items-center justify-center h-64">
				<Loader2 className="size-6 animate-spin text-primary-500" />
			</div>
		);
	}

	return (
		<div className="w-full p-6 lg:p-8 space-y-6 animate-in fade-in duration-300 select-none max-w-7xl mx-auto text-left overflow-visible">
			{/* HUD PANEL HEADER */}
			<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border-subtle pb-6">
				<div>
					<h1 className="font-mono text-[10px] font-bold uppercase tracking-widest text-fg-muted">
						// Infrastructure Interface
					</h1>
					<h2 className="text-2xl font-black tracking-tight text-fg-default mt-1">
						Commands Manager
					</h2>
				</div>

				<button
					onClick={handleSaveChanges}
					disabled={isSaving}
					className={`h-9 px-4 flex items-center gap-2 font-mono font-bold text-[11px] uppercase tracking-wider rounded-lg transition-all active:scale-98 cursor-pointer shadow-sm self-start sm:self-auto disabled:opacity-60 border ${
						isDirty
							? "border-warning/40 bg-warning/15 hover:bg-warning/25 text-warning"
							: "border-primary-500/20 bg-primary-500/10 hover:bg-primary-500/20 text-primary-500"
					}`}
				>
					{isSaving ? <Loader2 className="size-3.5 animate-spin" /> : <Save className="size-3.5" />}
					<span>
						{isSaving ? "Publishing Commands..." : "Commit Command Interceptors"}
					</span>
				</button>
			</div>

			{/* ACTION BAR */}
			<div className="flex justify-between items-center bg-panel-bg/10 p-4 border border-border-subtle rounded-xl">
				<div>
					<h3 className="flex items-center gap-2 font-mono text-xs font-black text-fg-default uppercase tracking-wide">
						<Terminal className="size-4 text-primary-500" />
						Registered Bot Command Descriptors
					</h3>
					<p className="font-mono text-[9px] text-fg-muted uppercase mt-0.5">
						Per-guild permission overrides for every slash and prefix command in
						the bot ({enabledCount}/{Array.isArray(commands) ? commands.length : 0} enabled)
					</p>
				</div>
				<div className="relative">
					<Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-fg-muted" />
					<input
						type="text"
						placeholder="Search commands..."
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
						className="w-64 h-9 pl-10 pr-4 bg-bg-canvas/40 border border-border-subtle rounded-lg font-mono text-xs text-fg-default focus:outline-none focus:border-primary-500/50"
					/>
				</div>
			</div>

			{/* COMMAND INTERCEPTORS */}
			<div className="p-5 border border-border-subtle bg-panel-bg/20 backdrop-blur-md rounded-xl shadow-sm text-left space-y-4">
				<div className="flex items-center justify-between border-b border-border-subtle/50 pb-2.5">
					<div className="flex items-center gap-2">
						<Terminal className="size-4 text-cyan-500" />
						<h3 className="font-mono text-[11px] font-bold text-fg-default uppercase tracking-widest">Command Interceptors</h3>
					</div>
					<button
						onClick={handleSaveCommandInterceptors}
						disabled={isSavingCommands}
						className={`h-8 px-3 flex items-center gap-2 font-mono font-bold text-[10px] uppercase tracking-wider rounded-lg transition-all active:scale-98 cursor-pointer shadow-sm disabled:opacity-60 border ${
							interceptorsDirty
								? "border-warning/40 bg-warning/15 hover:bg-warning/25 text-warning"
								: "border-primary-500/20 bg-primary-500/10 hover:bg-primary-500/20 text-primary-500"
						}`}
					>
						{isSavingCommands ? (
							<div className="size-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
						) : (
							<Save className="size-3" />
						)}
						<span>{isSavingCommands ? "Saving..." : "Save"}</span>
					</button>
				</div>
				<div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
					<div className="space-y-1.5 text-left">
						<label className="block font-mono text-[10px] font-bold text-fg-default uppercase tracking-wider">Prefix</label>
						<input type="text" maxLength={10} value={prefix} onChange={(e) => setPrefix(e.target.value)} className="w-full h-9 px-3 bg-bg-canvas/40 border border-border-subtle rounded-lg font-mono text-xs text-fg-default focus:outline-none focus:border-primary-500/50" />
					</div>
					<div className="flex items-center justify-between p-3 border border-border-subtle/40 rounded-lg bg-bg-canvas/20">
						<div className="flex items-center gap-2">
							<Terminal className="size-3.5 text-primary-500" />
							<span className="font-mono text-[10px] font-bold text-fg-default uppercase tracking-wider">Prefix Commands</span>
						</div>
						<button
							onClick={() => setIsPrefixEnabled(!isPrefixEnabled)}
							className={`h-7 px-2.5 border rounded-md font-mono text-[9px] font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
								isPrefixEnabled
									? "bg-primary-500/10 border-primary-500/30 text-primary-500"
									: "bg-panel-bg border-border-subtle text-fg-muted"
							}`}
						>
							{isPrefixEnabled ? <ToggleRight className="size-3.5" /> : <ToggleLeft className="size-3.5" />}
							{isPrefixEnabled ? "Enabled" : "Disabled"}
						</button>
					</div>
					<div className="flex items-center justify-between p-3 border border-border-subtle/40 rounded-lg bg-bg-canvas/20">
						<div className="flex items-center gap-2">
							<Zap className="size-3.5 text-emerald-500" />
							<span className="font-mono text-[10px] font-bold text-fg-default uppercase tracking-wider">Slash Commands</span>
						</div>
						<button
							onClick={() => setIsSlashEnabled(!isSlashEnabled)}
							className={`h-7 px-2.5 border rounded-md font-mono text-[9px] font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
								isSlashEnabled
									? "bg-primary-500/10 border-primary-500/30 text-primary-500"
									: "bg-panel-bg border-border-subtle text-fg-muted"
							}`}
						>
							{isSlashEnabled ? <ToggleRight className="size-3.5" /> : <ToggleLeft className="size-3.5" />}
							{isSlashEnabled ? "Enabled" : "Disabled"}
						</button>
					</div>
				</div>
			</div>

				{/* COMMAND SECTIONS */}
				<div className="flex flex-col gap-5 overflow-visible">
					{/* COMMANDS THAT STILL NEED CONFIGURATION — PULLED TO THE TOP */}
					{commandsNeedingConfig.length > 0 && (
						<div className="space-y-3 overflow-visible">
							<div className="flex items-center gap-2 border-b border-amber-500/30 pb-2">
								<AlertTriangle className="size-3.5 text-amber-500" />
								<span className="font-mono text-[10px] font-black text-amber-500 uppercase tracking-widest">
									Requires Configuration
								</span>
								<span className="font-mono text-[8px] text-fg-muted uppercase tracking-wider">
									{commandsNeedingConfig.length} {commandsNeedingConfig.length === 1 ? "command" : "commands"}
								</span>
							</div>
								<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
									{commandsNeedingConfig.map((cmd) => renderCommandCard(cmd))}
								</div>
							</div>
					)}

					{CATEGORIES.map((category) => {
						const categoryCommands = Array.isArray(sortedCommands) 
							? sortedCommands.filter((c) => c.category === category && 
								!commandNeedsConfiguration(c, configuredRequirements) &&
								(searchQuery === "" || 
									c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
									c.description.toLowerCase().includes(searchQuery.toLowerCase())))
							: [];
						
						if (categoryCommands.length === 0) return null;
						
						return (
						<div key={category} className="space-y-3 overflow-visible">
							<div className="flex items-center gap-2 border-b border-border-subtle/50 pb-2">
								<span className="font-mono text-[10px] font-black text-fg-default uppercase tracking-widest">
									{category}
								</span>
								<span className="font-mono text-[8px] text-fg-muted uppercase tracking-wider">
									{categoryCommands.length} commands
								</span>
							</div>

								<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
									{categoryCommands.map((cmd) => renderCommandCard(cmd))}
								</div>
							</div>
							);
						})}
				</div>
			</div>
		</div>
		);
	}

