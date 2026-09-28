/** Types and pure helpers of the commands manager. */

import type { SnapshotState } from "@/lib/db-types";

export type RequirementType = "role" | "channel" | "category" | "thread";

export interface RequirementEntry {
	type: RequirementType;
	key: string;
	optional: boolean;
	label: string;
}

interface CommandRequirementEntry {
	key: string;
	optional: boolean;
	error_message?: string;
}

export interface CommandRequirements {
	roles: Record<string, CommandRequirementEntry>;
	channels: Record<string, CommandRequirementEntry>;
	categories: Record<string, CommandRequirementEntry>;
	threads: Record<string, CommandRequirementEntry>;
}

export interface SubcommandEntry {
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

export interface CommandEntry extends Omit<SubcommandEntry, "cooldown"> {
	name: string;
	category: string;
	description: string;
	subcommands: Record<string, SubcommandEntry>;
	cooldown: number;
	requirements: CommandRequirements;
}

/** The guild config's `commands` field: an object keyed by command name. */
export type StoredCommands = Record<string, Partial<Omit<CommandEntry, "name">>>;

export const CATEGORIES = ["general", "general/game", "general/profile", "moderation/discord", "moderation/game", "moderation/player"];

const REQUIREMENT_KINDS = [
	["roles", "role"],
	["channels", "channel"],
	["categories", "category"],
	["threads", "thread"],
] as const;

export const flattenRequirements = (requirements?: CommandRequirements): RequirementEntry[] =>
	REQUIREMENT_KINDS.flatMap(([field, type]) =>
		Object.entries(requirements?.[field] ?? {}).map(([key, req]) => ({ type, key, optional: req.optional, label: key })),
	);

const isSet = (configured: Record<string, string>, key: string) => !!configured[key];

/** Requirement summary of a command against the ids configured so far; null when it has none. */
export function configStatus(cmd: CommandEntry, configured: Record<string, string>) {
	const all = flattenRequirements(cmd.requirements);
	if (all.length === 0) return null;
	const missing = all.filter((r) => !r.optional && !isSet(configured, r.key));
	return { missing, total: all.length, configured: all.length - missing.length, needsConfiguration: missing.length > 0 };
}

export const needsConfiguration = (cmd: CommandEntry, configured: Record<string, string>) => !!configStatus(cmd, configured)?.needsConfiguration;

export const defaultPermission = (commandName: string) => ({
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

/** Stored object -> editable list (the command's own name is always one of its aliases). */
export function toEntries(stored: StoredCommands | null | undefined): CommandEntry[] {
	return Object.entries(stored ?? {}).map(([name, cmd]) => {
		const aliases = Array.isArray(cmd.aliases) ? cmd.aliases : [];
		return {
			name,
			category: cmd.category || "general",
			description: cmd.description || "",
			is_enabled: cmd.is_enabled as boolean | null, // stored as is: a missing flag stays missing
			is_slash_enabled: cmd.is_slash_enabled as boolean | null,
			is_prefix_enabled: cmd.is_prefix_enabled as boolean | null,
			aliases: aliases.includes(name) ? aliases : [name, ...aliases],
			allowed_roles: cmd.allowed_roles || null,
			denied_roles: cmd.denied_roles || null,
			allowed_channels: cmd.allowed_channels || null,
			disallowed_channels: cmd.disallowed_channels || null,
			subcommands: cmd.subcommands || {},
			cooldown: cmd.cooldown ?? 3,
			requirements: cmd.requirements || { roles: {}, channels: {}, categories: {}, threads: {} },
		};
	});
}

/** Editable list -> the object the API stores. */
export function toStored(commands: CommandEntry[]): StoredCommands {
	return Object.fromEntries(commands.map(({ name, ...rest }) => [name, rest]));
}

// ── Requirements live in the guild snapshot: each key maps to a Discord id ───

const COLLECTIONS = ["roles", "channels", "categories", "threads"] as const;

/** Snapshot key -> Discord id, across roles, channels, categories and threads. */
export const requirementsFromSnapshot = (state: SnapshotState | undefined): Record<string, string> =>
	Object.fromEntries(COLLECTIONS.flatMap((c) => Object.entries(state?.[c] ?? {}).map(([key, record]) => [key, record.id])));

/** The snapshot collections with the configured ids written back. */
export function applyRequirements(state: SnapshotState, configured: Record<string, string>) {
	return Object.fromEntries(
		COLLECTIONS.map((c) => [c, Object.fromEntries(Object.entries(state[c] ?? {}).map(([key, record]) => [key, { ...record, id: configured[key] || record.id }]))]),
	);
}
