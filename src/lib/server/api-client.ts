/**
 * Typed HTTP client for the Ranked-Bedwars-Database-Go API.
 * All calls are server-side only — the master key is never sent to the browser.
 *
 * Every path here mirrors internal/api/router.go in the Database repo (and its
 * Go SDK in sdk/). The contract, in short:
 *
 *   - One credential: the panel serves every guild, so every call uses
 *     DATABASE_MASTER_API_KEY. Guild-bound keys are read-only and single-guild.
 *   - Every write needs an actor (X-Actor), recorded in the guild's audit log.
 *     `dbApi` writes as "panel"; `dbApi.as(userId)` writes as that user.
 *   - Single resources are returned bare. Lists come back as
 *     { data, total, limit, offset } with a hard page cap of 100.
 *   - Guild and player ids accept either a database id or a Discord snowflake.
 *   - Config and state rows are written with If-Match set to the row's
 *     `updated_at`; a stale value is a 412 (ApiError.isPreconditionFailed).
 *   - Bodies reject unknown fields (400), so send only what the API decodes.
 *
 * Usage (server components / API routes only):
 *   import { dbApi } from "@/lib/server/api-client";
 *   const guild = await dbApi.guilds.getBySnowflake("123456789");
 *   await dbApi.as(session.userId).guildConfig.saveField(id, "prefix", "!");
 */

import type {
  GuildModel,
  GuildConfigModel,
  GuildSnapshotBundle,
  GuildStatesModel,
  GameMetaModel,
  GameSeasonModel,
  SeasonConfig,
  PlayerConfigModel,
  PlayerStatsModel,
  PlayerStrikeModel,
  PlayerPunishmentModel,
  PlayerApiKeyModel,
  GuildEventModel,
  GameModel,
  GameParticipantModel,
  Listing,
  SnapshotState,
} from "@/lib/db-types";
import { globalRateLimiters } from "@/lib/server/rate-limiter";
import { globalCircuitBreakers } from "@/lib/server/circuit-breaker";

// ── Config ─────────────────────────────────────────────────────────────────────

const DEFAULT_ACTOR = "panel";

function baseUrl(): string {
  const v = process.env.DATABASE_API_URL;
  if (!v) throw new Error("DATABASE_API_URL is not set");
  return v.replace(/\/$/, "");
}

function masterKey(): string {
  const v = process.env.DATABASE_MASTER_API_KEY;
  if (!v) throw new Error("DATABASE_MASTER_API_KEY is not set");
  return v;
}

/** Percent-encode a path segment so snowflakes and subdomains can't break the route. */
function seg(value: string | number): string {
  return encodeURIComponent(String(value));
}

type Query = Record<string, string | number | boolean | undefined>;

/** Build a "?" query string, skipping empty values so we never send `limit=`. */
function query(params: Query): string {
  const parts: string[] = [];
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === "") continue;
    parts.push(`${key}=${encodeURIComponent(String(value))}`);
  }
  return parts.length ? `?${parts.join("&")}` : "";
}

/** Server page cap for every list route. */
const PAGE_SIZE = 100;

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
  get isForbidden() { return this.status === 403; }
  /** Duplicate resource, e.g. claiming a public subdomain owned by another guild. */
  get isConflict() { return this.status === 409; }
  /** If-Match mismatch on a config/state write: the row changed since it was read. */
  get isPreconditionFailed() { return this.status === 412; }
  get isRateLimited() { return this.status === 429; }
  get isServerError() { return this.status >= 500; }

  /** The `error` string from the API envelope, falling back to the raw body. */
  get serverMessage(): string {
    try {
      const parsed = JSON.parse(this.body) as { error?: string };
      if (parsed && typeof parsed.error === "string") return parsed.error;
    } catch {
      // not JSON
    }
    return this.body;
  }
}

/** Single choke point: limiter + breaker + auth + ApiError. Writes carry X-Actor. */
async function send<T>(
  method: string,
  path: string,
  actor: string,
  body?: unknown,
  headers?: Record<string, string>,
): Promise<T> {
  return globalCircuitBreakers.database.execute(async () => {
    return globalRateLimiters.database.execute(async () => {
      const init: RequestInit = {
        method,
        headers: {
          "Content-Type": "application/json",
          "X-API-Key": masterKey(),
          ...(method !== "GET" ? { "X-Actor": actor } : {}),
          ...headers,
        },
      };
      if (body !== undefined && method !== "GET" && method !== "DELETE") {
        init.body = JSON.stringify(body);
      }

      const res = await fetch(`${baseUrl()}${path}`, init);
      if (res.status === 204) return undefined as T;

      const text = await res.text();
      if (!res.ok) {
        throw new ApiError(res.status, text, `DB API ${method} ${path} → ${res.status}: ${text}`);
      }
      return (text ? JSON.parse(text) : undefined) as T;
    });
  });
}

/** Walks limit/offset until a short page comes back; `max` bounds runaway tables. */
async function pageAll<T>(fetchPage: (limit: number, offset: number) => Promise<Listing<T>>, max = 100_000): Promise<T[]> {
  const out: T[] = [];
  for (let offset = 0; offset < max; offset += PAGE_SIZE) {
    const { data } = await fetchPage(PAGE_SIZE, offset);
    out.push(...data);
    if (data.length < PAGE_SIZE) break;
  }
  return out;
}

/** `limit` rows from `offset`, stitched from as many capped pages as needed. */
async function pageUpTo<T>(
  fetchPage: (limit: number, offset: number) => Promise<Listing<T>>,
  limit: number,
  offset = 0,
): Promise<T[]> {
  const out: T[] = [];
  while (out.length < limit) {
    const want = Math.min(PAGE_SIZE, limit - out.length);
    const { data } = await fetchPage(want, offset + out.length);
    out.push(...data);
    if (data.length < want) break;
  }
  return out;
}

const guildRoot = (guildId: string | number) => `/v1/guilds/${seg(guildId)}`;

/** Accepts "2026-01-31" or any ISO string; the API needs RFC 3339. */
function isoDate(value: string): string {
  const d = new Date(/^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T00:00:00Z` : value);
  if (isNaN(d.getTime())) throw new ApiError(400, "", `Invalid date: ${value}`);
  return d.toISOString();
}

/** Strike is live: enabled, not voided or appealed, not expired. Mirrors the API's own definition. */
export function isActiveStrike(s: PlayerStrikeModel): boolean {
  return s.is_enabled && !s.is_voided && !s.is_appealed && (!s.expires_at || new Date(s.expires_at).getTime() > Date.now());
}

// ── Client ─────────────────────────────────────────────────────────────────────

/** Every route, bound to the actor its writes are recorded under. */
function build(actor: string) {
  const get = <T>(path: string) => send<T>("GET", path, actor);
  const list = <T>(path: string, q: Query = {}) => get<Listing<T>>(`${path}${query(q)}`);
  const post = <T>(path: string, body?: unknown, headers?: Record<string, string>) => send<T>("POST", path, actor, body, headers);
  const put = <T>(path: string, body?: unknown, headers?: Record<string, string>) => send<T>("PUT", path, actor, body, headers);
  const patch = <T>(path: string, body?: unknown, headers?: Record<string, string>) => send<T>("PATCH", path, actor, body, headers);
  const del = <T>(path: string) => send<T>("DELETE", path, actor);

  /** A list route's `total` with one row fetched: the cheapest count the API offers. */
  const count = async (path: string, q: Query = {}) => ({ count: (await list<unknown>(path, { ...q, limit: 1 })).total ?? 0 });

  /**
   * Read → write a row guarded by If-Match. Re-reads and retries on 412 so a
   * concurrent save of a different field never fails the caller; a persistent
   * conflict surfaces as the final 412.
   */
  async function guarded<Row extends { updated_at: string }, R>(
    rowPath: string,
    write: (row: Row, ifMatch: { "If-Match": string }) => Promise<R>,
    retries = 3,
  ): Promise<R> {
    for (let attempt = 0; ; attempt++) {
      const row = await get<Row>(rowPath);
      try {
        return await write(row, { "If-Match": row.updated_at });
      } catch (e) {
        if (e instanceof ApiError && e.isPreconditionFailed && attempt < retries) continue;
        throw e;
      }
    }
  }

  /** Guild and game config share one shape: a row of named JSON fields. */
  const configOf = (which: "guild" | "game") => {
    const row = (guildId: string) => `${guildRoot(guildId)}/configs/${which}`;
    return {
      /** The whole config row. */
      get: <T>(guildId: string) => get<T>(row(guildId)),

      /** One field (snake_case column name, e.g. "elo_engine"); JSON null comes back as null. */
      field: <T>(guildId: string, field: string) => get<T>(`${row(guildId)}/${seg(field)}`),

      /** Replaces one field with `value`. */
      saveField: (guildId: string, field: string, value: unknown) =>
        guarded<{ updated_at: string }, void>(row(guildId), (r, h) =>
          put<void>(`${row(guildId)}/${seg(field)}`, value, h),
        ),

      /** Read field → mutate → write, retrying on 412. Returns the saved value. */
      updateField: async <T>(guildId: string, field: string, mutate: (current: T) => T | Promise<T>, retries = 3): Promise<T> => {
        let next!: T;
        await guarded<{ updated_at: string } & Record<string, unknown>, void>(
          row(guildId),
          async (r, h) => {
            next = await mutate(r[field] as T);
            await put<void>(`${row(guildId)}/${seg(field)}`, next, h);
          },
          retries,
        );
        return next;
      },
    };
  };

  const guildConfig = configOf("guild");
  const gameConfig = configOf("game");

  const gameList = (guildId: string, limit?: number, offset = 0, status?: string) => {
    const page = (l: number, o: number) => list<GameModel>(`${guildRoot(guildId)}/games`, { limit: l, offset: o, status });
    return limit === undefined ? pageAll(page) : pageUpTo(page, limit, offset);
  };

  const gameParticipants = async (guildId: string, gameId: string | number) =>
    (await list<GameParticipantModel>(`${guildRoot(guildId)}/games/${seg(gameId)}/players`)).data;

  const seasonList = async (guildId: string) =>
    (await pageAll((limit, offset) => list<GameSeasonModel>(`${guildRoot(guildId)}/seasons`, { limit, offset }))).sort(
      (a, b) => a.number - b.number,
    );

  const playerConfigs = (guildId: string, limit: number, offset = 0) =>
    pageUpTo(
      async (l, o) => {
        const r = await list<{ config: PlayerConfigModel }>(`${guildRoot(guildId)}/players`, { limit: l, offset: o });
        return { ...r, data: r.data.map((v) => v.config) };
      },
      limit,
      offset,
    );

  const playerStats = (guildId: string, limit: number, offset = 0) =>
    pageUpTo((l, o) => list<PlayerStatsModel>(`${guildRoot(guildId)}/leaderboard`, { limit: l, offset: o }), limit, offset);

  /** `listAll` walks every page; `page` returns `limit` rows from `offset`, stitched across the API's page cap. */
  const guildRows = <T>(sub: string) => {
    const page = (guildId: string) => (limit: number, offset: number) =>
      list<T>(`${guildRoot(guildId)}/${sub}`, { limit, offset });
    return {
      listAll: (guildId: string) => pageAll(page(guildId)),
      page: (guildId: string, limit: number, offset = 0) => pageUpTo(page(guildId), limit, offset),
    };
  };

  return {
    guilds: {
      count: () => count("/v1/guilds"),

      countEnabled: () => count("/v1/guilds", { enabled: true }),

      /** Accepts a database id or a Discord snowflake; 404 when not registered. */
      getById: (guildId: string) => get<GuildModel>(guildRoot(guildId)),

      getBySnowflake: (snowflakeId: string) => get<GuildModel>(guildRoot(snowflakeId)),

      /** The guild that claimed this portal subdomain; 404 when nobody has. */
      getByPublicDomain: (subdomain: string) => get<GuildModel>(`/v1/guilds${query({ public_domain: subdomain })}`),

      /**
       * Registers the guild with its config, game config and state rows (201), or
       * returns the existing / previously deleted guild (200). Safe to repeat.
       */
      register: (snowflakeId: string, name: string) =>
        post<GuildModel>("/v1/guilds", { snowflake_id: snowflakeId, name }),

      /** Channels, categories, roles and threads the bot last reported. */
      getSnapshot: async (guildId: string): Promise<GuildSnapshotBundle> => {
        const s = await get<GuildStatesModel>(`${guildRoot(guildId)}/states`);
        return {
          guild_id: s.guild_id,
          state: { channels: s.channels, categories: s.categories, roles: s.roles, threads: s.threads },
          updated_at: s.updated_at,
        };
      },

      /** Writes only the collections present in `state`; the rest are left untouched. */
      saveSnapshotState: (guildId: string, state: Partial<SnapshotState>) =>
        guarded<GuildStatesModel, void>(`${guildRoot(guildId)}/states`, (_r, h) =>
          patch<void>(`${guildRoot(guildId)}/states`, state, h),
        ),
    },

    /** Guild-level config: prefix, appearance, panels, ladders, theme, developer_config, ... */
    guildConfig: {
      ...guildConfig,
      get: (guildId: string) => guildConfig.get<GuildConfigModel>(guildId),

      /** Null when the guild has not claimed a subdomain. */
      getPublicDomain: (guildId: string) => guildConfig.field<string | null>(guildId, "public_domain"),

      /**
       * Claims a subdomain for the guild; "" releases the claim. Throws ApiError
       * 409 when it is taken. Length/format are not checked by the API: the
       * caller validates (see isValidSubdomain).
       */
      setPublicDomain: (guildId: string, domain: string) => guildConfig.saveField(guildId, "public_domain", domain || null),
    },

    /** Game-level config: maps, modes, ranks, perks, bots, server, queues, ... */
    gameConfig: {
      ...gameConfig,
      get: (guildId: string) => gameConfig.get<GameMetaModel>(guildId),
    },

    games: {
      /** One page (limit ≤ 100), newest first. */
      page: (guildId: string, q: Query = {}) => list<GameModel>(`${guildRoot(guildId)}/games`, q),

      /** `limit` games from `offset` (stitched across pages), or every game when `limit` is omitted. */
      list: gameList,

      /** Games that are waiting or in progress. */
      listActive: async (guildId: string) =>
        (await Promise.all(["waiting", "in_progress"].map((s) => gameList(guildId, undefined, 0, s)))).flat(),

      /** Status is one of waiting | in_progress | completed | cancelled. */
      countByStatus: (guildId: string, status: string) => count(`${guildRoot(guildId)}/games`, { status }),

      countTotal: (guildId: string) => count(`${guildRoot(guildId)}/games`),

      getParticipants: gameParticipants,

      /**
       * Participants of several games, each joined with the player's username.
       * Usernames live on the guild player config, so every distinct player is
       * looked up once for the whole batch.
       */
      participantsWithUsernames: async (guildId: string, gameIds: Array<string | number>) => {
        const games = await Promise.all(gameIds.map((id) => gameParticipants(guildId, id).catch(() => [])));
        const ids = [...new Set(games.flat().map((p) => p.player_id))];
        const names = new Map<string | number, string>();
        await Promise.all(
          ids.map((id) =>
            get<PlayerConfigModel>(`${guildRoot(guildId)}/players/${seg(id)}/config`)
              .then((c) => void names.set(id, c.username))
              .catch(() => {}), // a removed player simply has no name
          ),
        );
        return games.map((ps) => ps.map((p) => ({ ...p, username: names.get(p.player_id) })));
      },
    },

    seasons: {
      /** Every season, oldest number first. */
      list: seasonList,

      getActive: (guildId: string) => get<GameSeasonModel>(`${guildRoot(guildId)}/seasons/active`),

      /**
       * Reconciles the guild's seasons with `desired`: entries with an `id` are
       * updated in place, entries without one are created (the API assigns the
       * number), and stored seasons missing from the list are deleted (soft delete,
       * with the season's games and stats; the API can restore them).
       * `is_enabled` maps to the single active season: the enabled entry becomes
       * active, and if none is enabled the active season is ended.
       * Returns the reconciled list.
       */
      sync: async (guildId: string, desired: SeasonConfig[]): Promise<GameSeasonModel[]> => {
        const root = `${guildRoot(guildId)}/seasons`;
        const stored = await seasonList(guildId);
        const byId = new Map(stored.map((s) => [s.id, s]));
        const kept = new Set(desired.map((s) => s.id));
        const time = (v?: string | null) => (v ? new Date(v).getTime() : null);

        for (const s of stored) if (!kept.has(s.id)) await del<void>(`${root}/${s.number}`);

        const numbers = new Map<SeasonConfig, number>();
        for (const s of desired) {
          const starts = isoDate(s.start_date);
          const ends = s.end_date ? isoDate(s.end_date) : null;
          const old = s.id === undefined ? undefined : byId.get(s.id);
          if (!old) {
            const made = await post<GameSeasonModel>(root, { name: s.name, description: s.description ?? "", starts_at: starts });
            numbers.set(s, made.number);
            if (ends) await patch<GameSeasonModel>(`${root}/${made.number}`, { ends_at: ends });
            continue;
          }
          numbers.set(s, old.number);
          const diff: Record<string, unknown> = {};
          if (s.name !== old.name) diff.name = s.name;
          if ((s.description ?? "") !== old.description) diff.description = s.description ?? "";
          if (time(starts) !== time(old.starts_at)) diff.starts_at = starts;
          if (time(ends) !== time(old.ends_at)) diff.ends_at = ends;
          if (Object.keys(diff).length) await patch<GameSeasonModel>(`${root}/${old.number}`, diff);
        }

        // The API has one active season: keep the current one if it is still
        // enabled, otherwise the newest enabled one; with none enabled, end it.
        const active = stored.find((s) => s.is_active && kept.has(s.id));
        const enabled = desired.filter((s) => s.is_enabled).sort((a, b) => numbers.get(b)! - numbers.get(a)!);
        const target = enabled.find((s) => active && s.id === active.id) ?? enabled[0];
        if (target) {
          const number = numbers.get(target)!;
          if (active?.number !== number) await post<GameSeasonModel>(`${root}/${number}/activate`);
        } else if (active) {
          await post<GameSeasonModel>(`${root}/${active.number}/end`); // stamps ends_at = now
          const asked = desired.find((s) => s.id === active.id)?.end_date;
          await patch<GameSeasonModel>(`${root}/${active.number}`, { ends_at: asked ? isoDate(asked) : null });
        }
        return seasonList(guildId);
      },
    },

    players: {
      count: (guildId: string) => count(`${guildRoot(guildId)}/players`),

      /** Player configs of the guild (newest registration first), `limit` from `offset`. */
      listConfigByGuild: (guildId: string, limit = 500, offset = 0) => playerConfigs(guildId, limit, offset),

      listAllConfigByGuild: (guildId: string) => playerConfigs(guildId, 100_000),

      /** Active-season stats of the guild ordered by elo, one row per player. */
      listStatsByGuild: (guildId: string, limit = 500, offset = 0) => playerStats(guildId, limit, offset),

      listAllStatsByGuild: (guildId: string) => playerStats(guildId, 100_000),
    },

    /** Guild-wide strikes. The API has no "active" filter, so callers use isActiveStrike. */
    strikes: guildRows<PlayerStrikeModel>("strikes"),

    punishments: guildRows<PlayerPunishmentModel>("punishments"),

    /** The guild's event trail (audit log), newest first. */
    events: guildRows<GuildEventModel>("events"),

    /** The guild's own API keys. Only the prefix is readable; the full key is in the create response once. */
    apiKeys: {
      ...guildRows<PlayerApiKeyModel>("api-keys"),
      get: (guildId: string, keyId: string | number) => get<PlayerApiKeyModel>(`${guildRoot(guildId)}/api-keys/${seg(keyId)}`),
      create: (guildId: string, name: string, expiresAt: Date | null) =>
        post<{ key: string; api_key: PlayerApiKeyModel }>(`${guildRoot(guildId)}/api-keys`, { name, expires_at: expiresAt }),
      setActive: (guildId: string, keyId: string | number, isActive: boolean) =>
        patch<PlayerApiKeyModel>(`${guildRoot(guildId)}/api-keys/${seg(keyId)}`, { is_active: isActive }),
      remove: (guildId: string, keyId: string | number) => del<void>(`${guildRoot(guildId)}/api-keys/${seg(keyId)}`),
    },
  };
}

// ── Exported API object ────────────────────────────────────────────────────────

export const dbApi = {
  ...build(DEFAULT_ACTOR),
  /** The same client, with writes recorded in the audit log under `actor` (e.g. a Discord user id). */
  as: (actor: string) => build(actor),
};

export { ApiError };
