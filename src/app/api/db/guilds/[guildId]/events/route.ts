/**
 * GET /api/db/guilds/[guildId]/events
 * The guild's event trail (audit log), newest first.
 *
 * Query params: limit (default 50), offset (default 0)
 */

import { dbApi } from "@/lib/server/api-client";
import { guildRoute } from "@/lib/server/guild-route";

export const GET = guildRoute(
  async ({ guildId, intParam }) => ({ data: await dbApi.events.page(guildId, intParam("limit", 50, 1, 1000), intParam("offset", 0, 0, Number.MAX_SAFE_INTEGER)) }),
  "Failed to fetch events",
);
