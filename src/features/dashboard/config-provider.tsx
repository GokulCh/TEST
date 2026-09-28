"use client";

/**
 * GuildConfigContext
 * Loads the guild config, game meta, queues and seasons once when a guild
 * dashboard opens (SWR: deduped, cached, retried with backoff) and gives each
 * page save helpers that write through the panel's API and mirror the result
 * locally.
 *
 *   const { config, meta, queues, seasons, saveConfigSection, saveMetaSection, saveSeasons, saveQueues, isLoading } = useGuildConfig();
 */

import React, { createContext, useCallback, useContext, useMemo, useState } from "react";
import useSWR, { type SWRConfiguration } from "swr";
import { ServiceUnavailable } from "@/components/shared/service-unavailable";
import { CONFIG_FIELDS, PANEL_FIELDS, type ConfigSection, type PanelSection } from "@/lib/config-sections";
import { apiFetch, apiSend, fetchData } from "@/lib/client/api";
import type {
	EloEngineConfig,
	FlowsConfig,
	GameMetaModel,
	GameServerConfig,
	GameSeasonModel,
	GuildAppearanceConfig,
	GuildCommandsMap,
	GuildConfigModel,
	GuildEmbedConfig,
	LeaderboardDisplayConfig,
	GuildPermissionsConfig,
	InteractivePanelConfig,
	MapConfig,
	ModeConfig,
	PanelConfig,
	PanelAuditSettings,
	PanelGuild,
	PanelPortalSettings,
	PanelThemeConfig,
	PerkConfig,
	PunishmentLadderConfig,
	QueueConfig,
	RankConfig,
	ReactionRoleConfig,
	RegistrationVerificationConfig,
	SeasonConfig,
	SettingRestriction,
	StrikeLadderConfig,
} from "@/lib/db-types";

type PanelSectionData = {
	theme: PanelThemeConfig;
	leaderboards: LeaderboardDisplayConfig[];
	/** The portal subdomain; "" releases it. */
	domain: string;
	"audit-settings": PanelAuditSettings;
	"portal-settings": PanelPortalSettings;
};

type MetaSection = "modes" | "maps" | "ranks" | "server" | "perks";

type ConfigSectionData = {
	prefix: string;
	"prefix-enabled": boolean;
	"slash-enabled": boolean;
	appearance: GuildAppearanceConfig;
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
	server: GameServerConfig;
	perks: PerkConfig[];
};

interface GuildConfigContextValue {
	/** The database integer ID for this guild */
	dbGuildId: string | null;
	config: GuildConfigModel | null;
	meta: GameMetaModel | null;
	queues: QueueConfig[];
	/** Guild seasons as the DB stores them */
	seasons: GameSeasonModel[];
	isLoading: boolean;
	isSaving: boolean;
	loadError: string | null;
	/** Save a single config section to the DB */
	saveConfigSection: <K extends ConfigSection>(section: K, data: ConfigSectionData[K]) => Promise<void>;
	/** Save one panel-only setting (portal domain, leaderboards, ...) */
	savePanelSection: <K extends PanelSection>(section: K, data: PanelSectionData[K]) => Promise<void>;
	/** Save a single meta section to the DB */
	saveMetaSection: <K extends MetaSection>(section: K, data: MetaSectionData[K]) => Promise<void>;
	/**
	 * Reconcile the guild's season list. The DB owns season numbers and the
	 * active flag, so the saved list is replaced by the DB's response.
	 */
	saveSeasons: (seasons: SeasonConfig[]) => Promise<void>;
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

/**
 * Editors copy `config` into local state when it changes, so nothing may
 * refetch behind an open editor: data is refreshed by saves and by `reload`.
 */
const LOAD: SWRConfiguration = { revalidateOnFocus: false, revalidateOnReconnect: false, errorRetryCount: 3 };
/** A required resource that failed keeps retrying every minute until it loads. */
const RETRY_WHEN_EMPTY = (latest: unknown) => (latest ? 0 : 60_000);
/** Optional resources (a guild may have none configured): no retries, empty on failure. */
const OPTIONAL: SWRConfiguration = { ...LOAD, shouldRetryOnError: false };

/** The database id of a guild, registering it first when the panel has not seen it before. */
async function resolveDbGuildId(snowflake: string): Promise<string> {
	const { guilds = [] } = await apiFetch<{ guilds?: PanelGuild[] }>("/api/guilds");
	const guild = guilds.find((g) => g.id === snowflake);
	if (guild?.dbId) return guild.dbId;
	try {
		const { guild: created } = await apiSend<{ guild?: { id: string | number } }>("POST", `/api/db/guilds/${snowflake}/register`, {
			name: guild?.name ?? snowflake,
		});
		if (created?.id != null) return String(created.id);
	} catch {
		// the guild may already exist: the API accepts the snowflake as its id
	}
	return snowflake;
}

interface Props {
	/** Discord snowflake ID from the URL param */
	guildSnowflake: string;
	children: React.ReactNode;
}

export function GuildConfigProvider({ guildSnowflake, children }: Props) {
	// A counter, not a flag: two concurrent writes must not report "done" when the first one lands.
	const [pendingWrites, setPendingWrites] = useState(0);
	const isSaving = pendingWrites > 0;

	const id = useSWR(["db-guild-id", guildSnowflake], ([, s]: [string, string]) => resolveDbGuildId(s), {
		...LOAD,
		refreshInterval: RETRY_WHEN_EMPTY,
	});
	const dbGuildId = id.data ?? null;
	const base = dbGuildId ? `/api/db/guilds/${dbGuildId}` : null;

	const config = useSWR<GuildConfigModel>(base && `${base}/config`, fetchData, { ...LOAD, refreshInterval: RETRY_WHEN_EMPTY });
	const meta = useSWR<GameMetaModel>(base && `${base}/meta`, fetchData, { ...LOAD, refreshInterval: RETRY_WHEN_EMPTY });
	const queues = useSWR<QueueConfig[]>(base && `${base}/matchmaking`, async (url: string) => (await fetchData<{ queues: QueueConfig[] }>(url)).queues, OPTIONAL);
	const seasons = useSWR<GameSeasonModel[]>(base && `${base}/seasons`, fetchData, OPTIONAL);

	const failure: unknown = id.error ?? config.error ?? meta.error;
	const loadError = failure ? (failure instanceof Error ? failure.message : "Database service unavailable") : null;
	const isLoading = !loadError && !(config.data && meta.data);

	const { mutate: mutateId } = id;
	const { mutate: mutateConfig } = config;
	const { mutate: mutateMeta } = meta;
	const { mutate: mutateQueues } = queues;
	const { mutate: mutateSeasons } = seasons;

	const reload = useCallback(() => {
		void Promise.all([mutateId(), mutateConfig(), mutateMeta(), mutateQueues(), mutateSeasons()]);
	}, [mutateId, mutateConfig, mutateMeta, mutateQueues, mutateSeasons]);

	/**
	 * PUT `body` to a panel route and run `mirror` to update the local copy. The dirty flag
	 * is not cleared here: each editor clears its own once the mirrored value matches its edits,
	 * so saving one form never disarms the unsaved-changes guard of another on the same page.
	 */
	const write = useCallback(
		async <T,>(path: string, body: unknown, mirror: (res: T) => unknown) => {
			if (!base) throw new Error("Guild DB ID not resolved yet");
			setPendingWrites((n) => n + 1);
			try {
				mirror(await apiSend<T>("PUT", `${base}/${path}`, body));
			} finally {
				setPendingWrites((n) => n - 1);
			}
		},
		[base],
	);

	const saveConfigSection = useCallback<GuildConfigContextValue["saveConfigSection"]>(
		(section, data) =>
			write("config", { section, data }, () =>
				mutateConfig((prev) => prev && { ...prev, [CONFIG_FIELDS[section]]: data }, { revalidate: false }),
			),
		[write, mutateConfig],
	);

	const savePanelSection = useCallback<GuildConfigContextValue["savePanelSection"]>(
		(section, data) =>
			write("config", { section, data }, () =>
				mutateConfig((prev) => prev && { ...prev, [PANEL_FIELDS[section]]: section === "domain" ? data || null : data }, { revalidate: false }),
			),
		[write, mutateConfig],
	);

	const saveMetaSection = useCallback<GuildConfigContextValue["saveMetaSection"]>(
		(section, data) => write("meta", { section, data }, () => mutateMeta((prev) => prev && { ...prev, [section]: data }, { revalidate: false })),
		[write, mutateMeta],
	);

	// The DB assigns season numbers and the active flag, so adopt its reconciled list.
	const saveSeasons = useCallback(
		(list: SeasonConfig[]) =>
			write<{ data?: GameSeasonModel[] }>("seasons", list, (res) => mutateSeasons(res?.data ?? [], { revalidate: false })),
		[write, mutateSeasons],
	);

	const saveQueues = useCallback(
		(next: QueueConfig[]) => write("matchmaking", { queues: next }, () => mutateQueues(next, { revalidate: false })),
		[write, mutateQueues],
	);

	const value = useMemo<GuildConfigContextValue>(
		() => ({
			dbGuildId,
			config: config.data ?? null,
			meta: meta.data ?? null,
			queues: queues.data ?? EMPTY_QUEUES,
			seasons: seasons.data ?? EMPTY_SEASONS,
			isLoading,
			isSaving,
			loadError,
			saveConfigSection,
			savePanelSection,
			saveMetaSection,
			saveSeasons,
			saveQueues,
			reload,
		}),
		[dbGuildId, config.data, meta.data, queues.data, seasons.data, isLoading, isSaving, loadError, saveConfigSection, savePanelSection, saveMetaSection, saveSeasons, saveQueues, reload],
	);

	return <GuildConfigContext.Provider value={value}>{loadError ? <ServiceUnavailable onRetry={reload} /> : children}</GuildConfigContext.Provider>;
}

// Stable empties: a fresh [] per render would re-run every editor's sync effect.
const EMPTY_QUEUES: QueueConfig[] = [];
const EMPTY_SEASONS: GameSeasonModel[] = [];
