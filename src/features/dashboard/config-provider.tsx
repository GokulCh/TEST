"use client";

/**
 * GuildConfigContext
 * Loads the full guild config + game meta + matchmaking queues from the database
 * when a guild dashboard is opened, and provides save helpers to each page.
 *
 * Usage:
 *   const { config, meta, queues, saveConfigSection, saveMetaSection, saveQueues, isLoading } = useGuildConfig();
 */

import React, {
	createContext,
	useCallback,
	useContext,
	useEffect,
	useState,
} from "react";
import { useUnsavedChangesContext } from "@/lib/contexts/changes-context";
import type {
	GuildConfigModel,
	GameMetaModel,
	QueueConfig,
	GuildAppearanceConfig,
	GuildRequirements,
	GuildCommandsMap,
	GuildPermissionsConfig,
	RegistrationVerificationConfig,
	EloEngineConfig,
	FlowsConfig,
	PunishmentLadderConfig,
	StrikeLadderConfig,
	PanelConfig,
	InteractivePanelConfig,
	ReactionRoleConfig,
	SettingRestriction,
	GuildEmbedConfig,
	ModeConfig,
	MapConfig,
	RankConfig,
	SeasonConfig,
} from "@/lib/db-types";

// ── Types ─────────────────────────────────────────────────────────────────────

type ConfigSection =
	| "prefix"
	| "prefix-enabled"
	| "slash-enabled"
	| "appearance"
	| "requirements"
	| "commands"
	| "permissions"
	| "registration-verification"
	| "elo-engine"
	| "flows"
	| "punishment-ladder"
	| "strike-ladder"
	| "panels"
	| "interactive-panels"
	| "reactions"
	| "embed"
	| "banner-layouts"
	| "settings-restrictions"
	| "account-age-whitelist";

type MetaSection = "modes" | "maps" | "ranks" | "seasons";

type ConfigSectionData = {
	prefix: string;
	"prefix-enabled": boolean;
	"slash-enabled": boolean;
	appearance: GuildAppearanceConfig;
	requirements: GuildRequirements;
	commands: GuildCommandsMap;
	permissions: GuildPermissionsConfig;
	"registration-verification": RegistrationVerificationConfig;
	"elo-engine": EloEngineConfig;
	flows: FlowsConfig;
	"punishment-ladder": PunishmentLadderConfig;
	"strike-ladder": StrikeLadderConfig;
	panels: Record<string, PanelConfig>;
	"interactive-panels": Record<string, InteractivePanelConfig>;
	reactions: Record<string, ReactionRoleConfig>;
	embed: GuildEmbedConfig;
	"banner-layouts": Record<string, unknown> | null;
	"settings-restrictions": Record<string, SettingRestriction>;
	"account-age-whitelist": string[];
};

type MetaSectionData = {
	modes: ModeConfig[];
	maps: MapConfig[];
	ranks: RankConfig[];
	seasons: SeasonConfig[];
};

interface GuildConfigContextValue {
	/** The database integer ID for this guild */
	dbGuildId: string | null;
	config: GuildConfigModel | null;
	meta: GameMetaModel | null;
	queues: QueueConfig[];
	isLoading: boolean;
	isSaving: boolean;
	loadError: string | null;
	/** Save a single config section to the DB */
	saveConfigSection: <K extends ConfigSection>(
		section: K,
		data: ConfigSectionData[K],
	) => Promise<void>;
	/** Save a single meta section to the DB */
	saveMetaSection: <K extends MetaSection>(
		section: K,
		data: MetaSectionData[K],
	) => Promise<void>;
	/** Save queue architecture */
	saveQueues: (queues: QueueConfig[]) => Promise<void>;
	/** Reload all data from DB */
	reload: () => void;
}

const GuildConfigContext = createContext<GuildConfigContextValue | null>(null);

export function useGuildConfig(): GuildConfigContextValue {
	const ctx = useContext(GuildConfigContext);
	if (!ctx) throw new Error("useGuildConfig must be used inside GuildConfigProvider");
	return ctx;
}

// ── Provider ──────────────────────────────────────────────────────────────────

interface Props {
	/** Discord snowflake ID from the URL param */
	guildSnowflake: string;
	children: React.ReactNode;
}

export function GuildConfigProvider({ guildSnowflake, children }: Props) {
	const [dbGuildId, setDbGuildId] = useState<string | null>(null);
	const [config, setConfig] = useState<GuildConfigModel | null>(null);
	const [meta, setMeta] = useState<GameMetaModel | null>(null);
	const [queues, setQueues] = useState<QueueConfig[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [isSaving, setIsSaving] = useState(false);
	const [loadError, setLoadError] = useState<string | null>(null);
	const [tick, setTick] = useState(0);

	const { markClean } = useUnsavedChangesContext();

	// ── Helper function for fetching with retry ─────────────────────────────
	const fetchWithRetry = useCallback(async (url: string, maxRetries = 3): Promise<Response> => {
		for (let attempt = 0; attempt <= maxRetries; attempt++) {
			try {
				const res = await fetch(url);
				if (!res.ok) {
					if (res.status === 429 || res.status === 500) {
						const delayMs = Math.min(1000 * Math.pow(2, attempt), 5000);
						if (attempt < maxRetries) {
							await new Promise(resolve => setTimeout(resolve, delayMs));
							continue;
						}
					}
					throw new Error(`Failed to fetch (${res.status})`);
				}
				return res;
			} catch (e) {
				if (attempt === maxRetries) throw e;
				const delayMs = Math.min(1000 * Math.pow(2, attempt), 5000);
				await new Promise(resolve => setTimeout(resolve, delayMs));
			}
		}
		throw new Error('Max retries exceeded');
	}, []);

	// ── Load all data ──────────────────────────────────────────────────────
	useEffect(() => {
		if (!guildSnowflake) return;

		setIsLoading(true);
		setLoadError(null);

		// First resolve the DB ID from the snowflake
		fetchWithRetry(`/api/guilds`)
			.then((r) => r.json())
			.then(async (d) => {
				const guild = (d.guilds ?? []).find(
					(g: { id: string }) => g.id === guildSnowflake,
				);

				// If guild not in registered list, try to fetch DB record directly
				// (the user may have navigated directly via URL)
				let resolvedDbId: string | null = guild?.dbId ?? null;

				if (!resolvedDbId) {
					// Attempt to look up by snowflake via the DB API proxy
					try {
						const gRes = await fetch(`/api/db/guilds/${guildSnowflake}/register`, {
							method: "POST",
							headers: { "Content-Type": "application/json" },
							body: JSON.stringify({ name: guild?.name ?? guildSnowflake }),
						});
						if (gRes.ok) {
							const gData = await gRes.json();
							resolvedDbId = gData.guild?.id ?? null;
						}
					} catch {
						// ignore — guild may already exist, proceed with snowflake as id
					}
					resolvedDbId = resolvedDbId ?? guildSnowflake;
				}

				setDbGuildId(resolvedDbId);

				// Load config, meta, and queues in parallel
				const [configRes, metaRes, queueRes] = await Promise.allSettled([
					fetchWithRetry(`/api/db/guilds/${resolvedDbId}/config`).then((r) => r.json()),
					fetchWithRetry(`/api/db/guilds/${resolvedDbId}/meta`).then((r) => r.json()),
					fetchWithRetry(`/api/db/guilds/${resolvedDbId}/matchmaking`).then((r) => r.json()),
				]);

				if (configRes.status === "fulfilled") setConfig(configRes.value?.data ?? null);
				if (metaRes.status === "fulfilled") setMeta(metaRes.value?.data ?? null);
				if (queueRes.status === "fulfilled") setQueues(queueRes.value?.data?.queues ?? []);
			})
			.catch((e) => setLoadError(e.message))
			.finally(() => setIsLoading(false));
	}, [guildSnowflake, tick, fetchWithRetry]);

	const reload = useCallback(() => setTick((t) => t + 1), []);

	// ── Save helpers ───────────────────────────────────────────────────────
	const saveConfigSection = useCallback(
		async <K extends ConfigSection>(section: K, data: ConfigSectionData[K]) => {
			if (!dbGuildId) throw new Error("Guild DB ID not resolved yet");
			setIsSaving(true);
			try {
				const res = await fetch(`/api/db/guilds/${dbGuildId}/config`, {
					method: "PUT",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ section, data }),
				});
				if (!res.ok) {
					const body = await res.json();
					throw new Error(body.error ?? `Failed to save ${section}`);
				}
				// Optimistically update local config
				setConfig((prev) => {
					if (!prev) return prev;
					switch (section) {
						case "prefix": return { ...prev, prefix: data as string };
						case "prefix-enabled": return { ...prev, is_prefix_enabled: data as boolean };
						case "slash-enabled": return { ...prev, is_slash_enabled: data as boolean };
						case "appearance": return { ...prev, appearance: data as GuildAppearanceConfig };
						case "requirements": return { ...prev, requirements: data as GuildRequirements };
						case "commands": return { ...prev, commands: data as GuildCommandsMap };
						case "permissions": return { ...prev, permissions: data as GuildPermissionsConfig };
						case "registration-verification": return { ...prev, registration_verification: data as RegistrationVerificationConfig };
						case "elo-engine": return { ...prev, elo_engine: data as EloEngineConfig };
						case "flows": return { ...prev, flows: data as FlowsConfig };
						case "punishment-ladder": return { ...prev, punishment_ladder: data as PunishmentLadderConfig };
						case "strike-ladder": return { ...prev, strike_ladder: data as StrikeLadderConfig };
						case "panels": return { ...prev, panels: data as Record<string, PanelConfig> };
						case "interactive-panels": return { ...prev, interactive_panels: data as Record<string, InteractivePanelConfig> };
						case "reactions": return { ...prev, reactions: data as Record<string, ReactionRoleConfig> };
						case "embed": return { ...prev, embed: data as GuildEmbedConfig };
						case "banner-layouts": return { ...prev, banner_layouts: data as Record<string, unknown> | null };
						case "settings-restrictions": return { ...prev, settings_restrictions: data as Record<string, SettingRestriction> };
						case "account-age-whitelist": return { ...prev, account_age_whitelist: data as string[] };
						default: return prev;
					}
				});
				markClean();
			} finally {
				setIsSaving(false);
			}
		},
		[dbGuildId, markClean],
	);

	const saveMetaSection = useCallback(
		async <K extends MetaSection>(section: K, data: MetaSectionData[K]) => {
			if (!dbGuildId) throw new Error("Guild DB ID not resolved yet");
			setIsSaving(true);
			try {
				const res = await fetch(`/api/db/guilds/${dbGuildId}/meta`, {
					method: "PUT",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ section, data }),
				});
				if (!res.ok) {
					const body = await res.json();
					throw new Error(body.error ?? `Failed to save meta ${section}`);
				}
				// Optimistically update local meta
				setMeta((prev) => {
					if (!prev) return prev;
					return { ...prev, [section]: data };
				});
				markClean();
			} finally {
				setIsSaving(false);
			}
		},
		[dbGuildId, markClean],
	);

	const saveQueues = useCallback(
		async (newQueues: QueueConfig[]) => {
			if (!dbGuildId) throw new Error("Guild DB ID not resolved yet");
			setIsSaving(true);
			try {
				const res = await fetch(`/api/db/guilds/${dbGuildId}/matchmaking`, {
					method: "PUT",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ queues: newQueues }),
				});
				if (!res.ok) {
					const body = await res.json();
					throw new Error(body.error ?? "Failed to save queues");
				}
				setQueues(newQueues);
				markClean();
			} finally {
				setIsSaving(false);
			}
		},
		[dbGuildId, markClean],
	);

	return (
		<GuildConfigContext.Provider
			value={{
				dbGuildId,
				config,
				meta,
				queues,
				isLoading,
				isSaving,
				loadError,
				saveConfigSection,
				saveMetaSection,
				saveQueues,
				reload,
			}}
		>
			{children}
		</GuildConfigContext.Provider>
	);
}
