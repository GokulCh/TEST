/**
 * /api/db/guilds/[guildId]/commands
 *
 * GET  → { data: GuildCommandsMap }
 * PUT  → saves the commands; body: { commands: GuildCommandsMap }
 */

import { dbApi } from "@/lib/server/api-client";
import type { GuildCommandsMap } from "@/lib/db-types";
import { guildRoute, HttpError } from "@/lib/server/guild-route";

export const GET = guildRoute(
  async ({ guildId }) => ({ data: await dbApi.guildConfig.field<GuildCommandsMap>(guildId, "commands") }),
  "Failed to fetch commands",
);

export const PUT = guildRoute(async ({ guildId, session, json }) => {
  const commands = (await json<{ commands?: unknown } | null>())?.commands;
  if (!commands || typeof commands !== "object" || Array.isArray(commands)) throw new HttpError(400, "commands must be an object");
  await dbApi.as(session.userId).guildConfig.saveField(guildId, "commands", commands);
  return { success: true };
}, "Failed to save commands");
