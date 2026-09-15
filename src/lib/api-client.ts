/**
 * Typed HTTP client for the Ranked-Bedwars-Database-Go API.
 * All calls are server-side only — the API key is never sent to the browser.
 *
 * Usage (server components / API routes only):
 *   import { dbApi } from "@/lib/api-client";
 *   const guild = await dbApi.guilds.getBySnowflake("123456789");
 */

import type {
  GuildModel,
  GuildConfigModel,
  GuildFull,
  GuildSnapshotBundle,
  GuildAppearanceConfig,
  GuildRequirements,
  GuildCommandsMap,
  GuildPermissionsConfig,
  RegistrationVerificationConfig,
  EloEngineConfig,
  FlowsConfig,
  PunishmentLadderConfig,
  StrikeLadderConfig,
  GameMetaModel,
  ModeConfig,
  MapConfig,
  RankConfig,
  SeasonConfig,
  QueueConfig,
  PlayerModel,
  PlayerConfigModel,
  PlayerStatsModel,
  GameModel,
  GameParticipantModel,
  PlayerPunishmentModel,
  PlayerStrikeModel,
  GuildEventModel,
  PanelThemeConfig,
  LeaderboardDisplayConfig,
  PanelAuditSettings,
  PanelPortalSettings,
  DeveloperConfig,
  GameServerConfig,
  BotStoredConfig,
  BotConfigInput,
  APIResponse,
  SnapshotState,
} from "@/lib/db-types";

// ── Config ─────────────────────────────────────────────────────────────────────

function baseUrl(): string {
  const v = process.env.DATABASE_API_URL;
  if (!v) throw new Error("DATABASE_API_URL is not set");
  return v.replace(/\/$/, "");
}

function apiKey(): string {
  const v = process.env.DATABASE_API_KEY;
  if (!v) throw new Error("DATABASE_API_KEY is not set");
  return v;
}

// ── Core fetch wrapper ─────────────────────────────────────────────────────────

class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly body: string,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }

  get isNotFound() { return this.status === 404; }
  get isBadRequest() { return this.status === 400; }
  get isUnauthorized() { return this.status === 401; }
}

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
): Promise<T> {
  const url = `${baseUrl()}${path}`;
  const init: RequestInit = {
    method,
    headers: {
      "Content-Type": "application/json",
      "X-API-Key": apiKey(),
    },
  };
  if (body !== undefined && method !== "GET" && method !== "DELETE") {
    init.body = JSON.stringify(body);
  }

  const res = await fetch(url, init);

  if (res.status === 204) {
    return undefined as unknown as T;
  }

  const text = await res.text();

  if (!res.ok) {
    throw new ApiError(
      res.status,
      text,
      `DB API ${method} ${path} → ${res.status}: ${text}`,
    );
  }

  if (!text) return undefined as unknown as T;

  const envelope = JSON.parse(text) as APIResponse<T>;
  return envelope.data;
}

const get = <T>(path: string) => request<T>("GET", path);
const post = <T>(path: string, body?: unknown) => request<T>("POST", path, body);
const put = <T>(path: string, body?: unknown) => request<T>("PUT", path, body);
const patch = <T>(path: string, body?: unknown) => request<T>("PATCH", path, body);
const del = <T>(path: string) => request<T>("DELETE", path);

// ── Guild service ──────────────────────────────────────────────────────────────

const guilds = {
  getBySnowflake: (snowflakeId: string) =>
    get<GuildModel>(`/v1/guilds/snowflake/${snowflakeId}`),

  getBySnowflakeFull: (snowflakeId: string) =>
    get<GuildFull>(`/v1/guilds/snowflake/${snowflakeId}/full`),

  exists: (snowflakeId: string) =>
    get<{ exists: boolean }>(
      `/v1/guilds/exists?snowflake_id=${encodeURIComponent(snowflakeId)}`,
    ),

  upsertBySnowflake: (snowflakeId: string, name: string) =>
    put<GuildModel>(`/v1/guilds/snowflake/${snowflakeId}`, { name }),

  getSnapshot: (guildId: string) =>
    get<GuildSnapshotBundle>(`/v1/guilds/${guildId}/snapshot`),

  saveSnapshotState: (guildId: string, state: SnapshotState) =>
    put<void>(`/v1/guilds/${guildId}/snapshot/state`, state),

  /** Check registration status for multiple snowflakes in parallel */
  checkRegistrationBatch: async (
    snowflakeIds: string[],
  ): Promise<Record<string, boolean>> => {
    const results = await Promise.allSettled(
      snowflakeIds.map((id) => guilds.exists(id)),
    );
    const map: Record<string, boolean> = {};
    snowflakeIds.forEach((id, i) => {
      const r = results[i];
      map[id] = r.status === "fulfilled" ? r.value.exists : false;
    });
    return map;
  },
};

// ── Guild Config service ───────────────────────────────────────────────────────

const guildConfig = {
  get: (guildId: string) =>
    get<GuildConfigModel>(`/v1/guilds/${guildId}/config`),

  exists: (guildId: string) =>
    get<{ exists: boolean }>(`/v1/guilds/${guildId}/config/exists`),

  upsert: (guildId: string) =>
    put<GuildConfigModel>(`/v1/guilds/${guildId}/config`),

  updatePrefix: (guildId: string, prefix: string) =>
    patch<void>(`/v1/guilds/${guildId}/config/prefix`, { prefix }),

  updatePrefixEnabled: (guildId: string, value: boolean) =>
    patch<void>(`/v1/guilds/${guildId}/config/prefix-enabled`, { value }),

  updateSlashEnabled: (guildId: string, value: boolean) =>
    patch<void>(`/v1/guilds/${guildId}/config/slash-enabled`, { value }),

  saveAppearance: (guildId: string, body: GuildAppearanceConfig) =>
    put<void>(`/v1/guilds/${guildId}/config/appearance`, body),

  getAppearance: (guildId: string) =>
    get<GuildAppearanceConfig>(`/v1/guilds/${guildId}/config/appearance`),

  saveRequirements: (guildId: string, body: GuildRequirements) =>
    put<void>(`/v1/guilds/${guildId}/config/requirements`, body),

  getRequirements: (guildId: string) =>
    get<GuildRequirements>(`/v1/guilds/${guildId}/config/requirements`),

  saveCommands: (guildId: string, body: GuildCommandsMap) =>
    put<void>(`/v1/guilds/${guildId}/config/commands`, body),

  getCommands: (guildId: string) =>
    get<GuildCommandsMap>(`/v1/guilds/${guildId}/config/commands`),

  savePermissions: (guildId: string, body: GuildPermissionsConfig) =>
    put<void>(`/v1/guilds/${guildId}/config/permissions`, body),

  getPermissions: (guildId: string) =>
    get<GuildPermissionsConfig>(`/v1/guilds/${guildId}/config/permissions`),

  saveRegistrationVerification: (
    guildId: string,
    body: RegistrationVerificationConfig,
  ) =>
    put<void>(`/v1/guilds/${guildId}/config/registration-verification`, body),

  getRegistrationVerification: (guildId: string) =>
    get<RegistrationVerificationConfig>(
      `/v1/guilds/${guildId}/config/registration-verification`,
    ),

  saveEloEngine: (guildId: string, body: EloEngineConfig) =>
    put<void>(`/v1/guilds/${guildId}/config/elo-engine`, body),

  getEloEngine: (guildId: string) =>
    get<EloEngineConfig>(`/v1/guilds/${guildId}/config/elo-engine`),

  saveFlows: (guildId: string, body: FlowsConfig) =>
    put<void>(`/v1/guilds/${guildId}/config/flows`, body),

  getFlows: (guildId: string) =>
    get<FlowsConfig>(`/v1/guilds/${guildId}/config/flows`),

  savePunishmentLadder: (guildId: string, body: PunishmentLadderConfig) =>
    put<void>(`/v1/guilds/${guildId}/config/punishment-ladder`, body),

  getPunishmentLadder: (guildId: string) =>
    get<PunishmentLadderConfig>(`/v1/guilds/${guildId}/config/punishment-ladder`),

  saveStrikeLadder: (guildId: string, body: StrikeLadderConfig) =>
    put<void>(`/v1/guilds/${guildId}/config/strike-ladder`, body),

  getStrikeLadder: (guildId: string) =>
    get<StrikeLadderConfig>(`/v1/guilds/${guildId}/config/strike-ladder`),

  savePanels: (guildId: string, body: Record<string, unknown>) =>
    put<void>(`/v1/guilds/${guildId}/config/panels`, body),

  getPanels: (guildId: string) =>
    get<Record<string, unknown>>(`/v1/guilds/${guildId}/config/panels`),

  saveInteractivePanels: (guildId: string, body: Record<string, unknown>) =>
    put<void>(`/v1/guilds/${guildId}/config/interactive-panels`, body),

  getInteractivePanels: (guildId: string) =>
    get<Record<string, unknown>>(`/v1/guilds/${guildId}/config/interactive-panels`),

  saveReactions: (guildId: string, body: Record<string, unknown>) =>
    put<void>(`/v1/guilds/${guildId}/config/reactions`, body),

  getReactions: (guildId: string) =>
    get<Record<string, unknown>>(`/v1/guilds/${guildId}/config/reactions`),

  saveEmbed: (guildId: string, body: Record<string, unknown>) =>
    put<void>(`/v1/guilds/${guildId}/config/embed`, body),

  getEmbed: (guildId: string) =>
    get<Record<string, unknown>>(`/v1/guilds/${guildId}/config/embed`),

  saveBannerLayouts: (guildId: string, body: Record<string, unknown>) =>
    put<void>(`/v1/guilds/${guildId}/config/banner-layouts`, body),

  getBannerLayouts: (guildId: string) =>
    get<Record<string, unknown>>(`/v1/guilds/${guildId}/config/banner-layouts`),

  saveSettingsRestrictions: (guildId: string, body: Record<string, unknown>) =>
    put<void>(`/v1/guilds/${guildId}/config/settings-restrictions`, body),

  getSettingsRestrictions: (guildId: string) =>
    get<Record<string, unknown>>(`/v1/guilds/${guildId}/config/settings-restrictions`),

  saveAccountAgeWhitelist: (guildId: string, body: unknown[]) =>
    put<void>(`/v1/guilds/${guildId}/config/account-age-whitelist`, body),

  getAccountAgeWhitelist: (guildId: string) =>
    get<unknown[]>(`/v1/guilds/${guildId}/config/account-age-whitelist`),
};

// ── Matchmaking service ────────────────────────────────────────────────────────

const matchmaking = {
  get: (guildId: string) =>
    get<{ id: string; guild_id: string; queues: QueueConfig[]; parties: unknown[] }>(
      `/v1/games/guild/${guildId}/matchmaking`,
    ),

  exists: (guildId: string) =>
    get<{ exists: boolean }>(`/v1/games/guild/${guildId}/matchmaking/exists`),

  upsert: (guildId: string) =>
    put<unknown>(`/v1/games/guild/${guildId}/matchmaking`),

  getQueues: (guildId: string) =>
    get<QueueConfig[]>(`/v1/games/guild/${guildId}/matchmaking/queues`),

  saveQueues: (guildId: string, queues: QueueConfig[]) =>
    put<void>(`/v1/games/guild/${guildId}/matchmaking/queues`, queues),
};

// ── Player service ─────────────────────────────────────────────────────────────

const players = {
  getBySnowflake: (snowflakeId: string) =>
    get<PlayerModel>(`/v1/players/snowflake/${snowflakeId}`),

  listConfigByGuild: (guildId: string, limit = 500) =>
    get<PlayerConfigModel[]>(`/v1/players/config/guild/${guildId}?limit=${limit}`),

  getStatsByGuildSeason: (
    guildId: string,
    seasonKey: string,
    page = 1,
    limit = 50,
  ) =>
    get<PlayerStatsModel[]>(
      `/v1/players/stats/guild/${guildId}/season/${seasonKey}?page=${page}&limit=${limit}`,
    ),

  listStatsByGuild: (guildId: string, limit = 500) =>
    get<PlayerStatsModel[]>(`/v1/players/stats/guild/${guildId}?limit=${limit}`),
};

// ── Strikes/Punishments ────────────────────────────────────────────────────────

const punishments = {
  listByGuild: (guildId: string, limit = 100) =>
    get<PlayerPunishmentModel[]>(`/v1/players/punishments/guild/${guildId}?limit=${limit}`),

  countActive: (guildId: string, playerId: string) =>
    get<{ count: number }>(
      `/v1/players/punishments/guild/${guildId}/player/${playerId}/active/count`,
    ),

  listActiveByPlayer: (guildId: string, playerId: string) =>
    get<PlayerPunishmentModel[]>(
      `/v1/players/punishments/guild/${guildId}/player/${playerId}/active`,
    ),
};

const strikes = {
  listByGuild: (guildId: string, limit = 100) =>
    get<PlayerStrikeModel[]>(`/v1/players/strikes/guild/${guildId}?limit=${limit}`),

  listActiveByGuild: (guildId: string) =>
    get<PlayerStrikeModel[]>(`/v1/players/strikes/guild/${guildId}/active`),

  listByPlayer: (guildId: string, playerId: string) =>
    get<PlayerStrikeModel[]>(`/v1/players/strikes/guild/${guildId}/player/${playerId}`),

  listActiveByPlayer: (guildId: string, playerId: string) =>
    get<PlayerStrikeModel[]>(`/v1/players/strikes/guild/${guildId}/player/${playerId}/active`),

  countActive: (guildId: string, playerId: string) =>
    get<{ weight: number }>(`/v1/players/strikes/guild/${guildId}/player/${playerId}/weight`),
};

// ── Games extended ─────────────────────────────────────────────────────────────

const games = {
  listActive: (guildId: string) =>
    get<GameModel[]>(`/v1/games/guild/${guildId}/active/all`),

  list: (guildId: string, limit = 50, offset = 0) =>
    get<GameModel[]>(`/v1/games/guild/${guildId}?limit=${limit}&offset=${offset}`),

  countByStatus: (guildId: string, status: string) =>
    get<{ count: number }>(
      `/v1/games/guild/${guildId}/status/${status}/count`,
    ),

  countTotal: (guildId: string) =>
    get<{ count: number }>(`/v1/games/guild/${guildId}/count`),

  getParticipants: (gameId: string) =>
    get<GameParticipantModel[]>(`/v1/games/${gameId}/participants`),

  getParticipantsWithPlayers: (gameId: string) =>
    get<Array<GameParticipantModel & { username?: string }>>(`/v1/games/${gameId}/participants/with-players`),
};

// ── Guild events (audit trail) ────────────────────────────────────────────────

const guildEvents = {
  list: (guildId: string, limit = 50) =>
    get<GuildEventModel[]>(`/v1/guilds/${guildId}/events?limit=${limit}`),

  listActive: (guildId: string) =>
    get<GuildEventModel[]>(`/v1/guilds/${guildId}/events/active`),
};

// ── Panel Config service ───────────────────────────────────────────────────────

const panelConfig = {
  getOrCreate: (guildId: string) =>
    put<GuildConfigModel>(`/v1/guilds/${guildId}/panel-config`),

  get: (guildId: string) =>
    get<GuildConfigModel>(`/v1/guilds/${guildId}/panel-config`),

  getTheme: (guildId: string) =>
    get<PanelThemeConfig>(`/v1/guilds/${guildId}/panel-config/theme`),

  saveTheme: (guildId: string, theme: PanelThemeConfig) =>
    put<void>(`/v1/guilds/${guildId}/panel-config/theme`, theme),

  getLeaderboards: (guildId: string) =>
    get<LeaderboardDisplayConfig[]>(`/v1/guilds/${guildId}/panel-config/leaderboards`),

  saveLeaderboards: (guildId: string, boards: LeaderboardDisplayConfig[]) =>
    put<void>(`/v1/guilds/${guildId}/panel-config/leaderboards`, boards),

  setPublicDomain: (guildId: string, domain: string) =>
    put<void>(`/v1/guilds/${guildId}/panel-config/domain`, { domain }),

  getAuditSettings: (guildId: string) =>
    get<PanelAuditSettings>(`/v1/guilds/${guildId}/panel-config/audit-settings`),

  saveAuditSettings: (guildId: string, settings: PanelAuditSettings) =>
    put<void>(`/v1/guilds/${guildId}/panel-config/audit-settings`, settings),

  getPortalSettings: (guildId: string) =>
    get<PanelPortalSettings>(`/v1/guilds/${guildId}/panel-config/portal-settings`),

  savePortalSettings: (guildId: string, settings: PanelPortalSettings) =>
    put<void>(`/v1/guilds/${guildId}/panel-config/portal-settings`, settings),

  getDeveloperConfig: (guildId: string) =>
    get<DeveloperConfig>(`/v1/guilds/${guildId}/panel-config/developer-config`),

  saveDeveloperConfig: (guildId: string, config: DeveloperConfig) =>
    put<void>(`/v1/guilds/${guildId}/panel-config/developer-config`, config),
};

// ── Game meta extended ────────────────────────────────────────────────────────

const gameMeta = {
  get: (guildId: string) =>
    get<GameMetaModel>(`/v1/games/guild/${guildId}/meta`),

  exists: (guildId: string) =>
    get<{ exists: boolean }>(`/v1/games/guild/${guildId}/meta/exists`),

  upsert: (guildId: string) =>
    put<GameMetaModel>(`/v1/games/guild/${guildId}/meta`),

  getModes: (guildId: string) =>
    get<ModeConfig[]>(`/v1/games/guild/${guildId}/meta/modes`),

  saveModes: (guildId: string, modes: ModeConfig[]) =>
    put<void>(`/v1/games/guild/${guildId}/meta/modes`, modes),

  getMaps: (guildId: string) =>
    get<MapConfig[]>(`/v1/games/guild/${guildId}/meta/maps`),

  saveMaps: (guildId: string, maps: MapConfig[]) =>
    put<void>(`/v1/games/guild/${guildId}/meta/maps`, maps),

  getRanks: (guildId: string) =>
    get<RankConfig[]>(`/v1/games/guild/${guildId}/meta/ranks`),

  saveRanks: (guildId: string, ranks: RankConfig[]) =>
    put<void>(`/v1/games/guild/${guildId}/meta/ranks`, ranks),

  getSeasons: (guildId: string) =>
    get<Record<string, SeasonConfig>>(`/v1/games/guild/${guildId}/meta/seasons`),

  saveSeasons: (guildId: string, seasons: SeasonConfig[]) =>
    put<void>(`/v1/games/guild/${guildId}/meta/seasons`, seasons),

  getServer: (guildId: string) =>
    get<GameServerConfig>(`/v1/games/guild/${guildId}/meta/server`),

  saveServer: (guildId: string, server: GameServerConfig) =>
    put<void>(`/v1/games/guild/${guildId}/meta/server`, server),

  getBots: (guildId: string) =>
    get<BotStoredConfig[]>(`/v1/guilds/${guildId}/bots`),

  saveBots: (guildId: string, bots: BotConfigInput[]) =>
    put<void>(`/v1/guilds/${guildId}/bots`, { bots }),
};

// ── Guild registration flow ────────────────────────────────────────────────────

/**
 * Fully registers a new Discord server:
 *  1. Upsert guild row
 *  2. Upsert guild config
 *  3. Upsert game meta
 *  4. Upsert matchmaking
 *
 * Returns the created GuildModel.
 */
async function registerGuild(
  snowflakeId: string,
  name: string,
): Promise<GuildModel> {
  const guild = await guilds.upsertBySnowflake(snowflakeId, name);
  const dbId = guild.id;

  // Upsert config, meta, and matchmaking in parallel
  await Promise.all([
    guildConfig.upsert(dbId),
    gameMeta.upsert(dbId),
    matchmaking.upsert(dbId),
  ]);

  return guild;
}

// ── Exported API object ────────────────────────────────────────────────────────

export const dbApi = {
  guilds,
  guildConfig,
  panelConfig,
  gameMeta,
  matchmaking,
  games,
  players,
  punishments,
  strikes,
  guildEvents,
  registerGuild,
};

export { ApiError };
