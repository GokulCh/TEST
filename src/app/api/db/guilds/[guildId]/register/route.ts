/**
 * POST /api/db/guilds/[guildId]/register   ([guildId] is the Discord snowflake)
 * Registers a Discord server in the database. Idempotent: new, existing and
 * previously deleted guilds all succeed.
 *
 * Body: { name }   Response: { guild: GuildModel }
 */

import { dbApi } from "@/lib/server/api-client";
import { guildRoute, HttpError } from "@/lib/server/guild-route";

export const POST = guildRoute(
  async ({ guildId, session, json }) => {
    const name = (await json<{ name?: unknown } | null>())?.name;
    if (typeof name !== "string" || !name.trim() || name.trim().length > 255) {
      throw new HttpError(400, "Guild name is required (max 255 characters)");
    }
    return { guild: await dbApi.as(session.userId).guilds.register(guildId, name.trim()) };
  },
  "Failed to register guild",
  { auth: "snowflake" },
);
