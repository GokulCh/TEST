/**
 * Config sections: the panel names a section, the Database API stores it as one
 * field of the guild or game config row. Every section-shaped route is a table
 * of `Section`s plus `saveSection`, or a `panelsKeyRoute` for a key of `panels`.
 */

import { dbApi } from "@/lib/server/api-client";
import { guildRoute, HttpError, ok, type GuildContext } from "./guild-route";

export interface Section {
  /** The config column the section is stored in. */
  field: string;
  /** JSON null is a valid value (the API otherwise rejects it with a 400). */
  nullable?: boolean;
  /** Returns a message when `data` is not acceptable. */
  check?: (data: unknown) => string | undefined;
}

/** A section stored under the same name in a column. */
export const plain = (field: string, check?: Section["check"]): Section => ({ field, check });

/**
 * Handles `PUT { section, data }`: validates it against `sections` and writes
 * the field (If-Match guarded, retried on a lost race by the client).
 */
export async function saveSection(
  { session, guildId, json }: GuildContext,
  scope: "guildConfig" | "gameConfig",
  sections: Record<string, Section>,
  kind: string,
) {
  const { section, data } = (await json<{ section?: unknown; data?: unknown } | null>()) ?? {};
  const spec = typeof section === "string" && Object.hasOwn(sections, section) ? sections[section] : undefined;
  if (data === undefined || (data === null && !spec?.nullable)) throw new HttpError(400, "data is required");
  if (!spec) throw new HttpError(400, `Unknown ${kind} section: ${String(section)}`);
  const problem = spec.check?.(data);
  if (problem) throw new HttpError(400, problem);
  await dbApi.as(session.userId)[scope].saveField(guildId, spec.field, data);
  return ok;
}

/** GET/PUT for one key of the guild config's `panels` JSON (giveaways, loggers, webhooks, panel creator). */
export function panelsKeyRoute({ key, body, label, empty }: { key: string; body: string; label: string; empty: [] | null }) {
  return {
    GET: guildRoute(async ({ guildId }) => ({ data: (await dbApi.guildConfig.get(guildId)).panels?.[key] || empty }), `Failed to fetch ${label}`),
    PUT: guildRoute(async (ctx) => {
      const value = (await ctx.json<Record<string, unknown> | null>())?.[body];
      if (empty === null ? value === undefined : !Array.isArray(value)) {
        throw new HttpError(400, empty === null ? `${body} is required` : `${body} must be an array`);
      }
      // Re-reads and retries on a stale If-Match, so concurrent saves of different keys don't overwrite each other.
      await dbApi.as(ctx.session.userId).guildConfig.updateField<Record<string, unknown> | null>(
        ctx.guildId,
        "panels",
        (panels) => ({ ...(panels ?? {}), [key]: value }),
      );
      return ok;
    }, `Failed to save ${label}`),
  };
}
