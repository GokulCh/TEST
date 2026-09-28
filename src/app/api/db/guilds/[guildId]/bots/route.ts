/**
 * /api/db/guilds/[guildId]/bots
 *
 * GET  → { data } the guild's bots without password ciphertexts
 * PUT  → saves the bots, encrypting new passwords and keeping unchanged ones
 */

import { dbApi } from "@/lib/server/api-client";
import type { BotConfigInput, BotStoredConfig } from "@/lib/db-types";
import { encryptPassword, CIPHER_PREFIX } from "@/lib/server/bot-credentials";
import { guildRoute, HttpError } from "@/lib/server/guild-route";

export const GET = guildRoute(async ({ guildId }) => {
  const { bots } = await dbApi.gameConfig.get(guildId);
  return {
    data: (bots ?? []).map((bot) => ({
      username: bot.username,
      stable_id: bot.stable_id,
      status: bot.status,
      is_enabled: bot.is_enabled,
      tier: bot.tier,
      has_password: !!bot.password_ciphertext,
    })),
  };
}, "Failed to fetch bots");

export const PUT = guildRoute(async ({ guildId, session, json }) => {
  const bots = (await json<{ bots?: BotConfigInput[] } | null>())?.bots;
  if (!Array.isArray(bots) || bots.some((b) => !b || typeof b !== "object" || typeof b.username !== "string")) {
    throw new HttpError(400, "bots must be an array of bot objects");
  }

  const existing: BotStoredConfig[] = (await dbApi.gameConfig.get(guildId)).bots ?? [];
  const processed: BotStoredConfig[] = await Promise.all(
    bots.map(async (input, index) => {
      // Match by stable_id so reordering never moves a password to another bot.
      const old = existing.find((b) => b.stable_id && b.stable_id === input.stable_id) ?? existing[index];
      let ciphertext: string | undefined;
      let setAt: string | undefined;
      if (input.password?.trim()) {
        ciphertext = await encryptPassword(input.password);
        setAt = new Date().toISOString();
      } else if (old?.password_ciphertext) {
        if (!old.password_ciphertext.startsWith(CIPHER_PREFIX)) {
          throw new HttpError(400, "Legacy password format detected. Please re-enter the password.");
        }
        ciphertext = old.password_ciphertext;
        setAt = old.password_set_at;
      }
      return {
        username: input.username,
        stable_id: input.stable_id,
        status: input.status,
        is_enabled: input.is_enabled,
        tier: input.tier,
        password_ciphertext: ciphertext || null,
        password_set_at: setAt || null,
      };
    }),
  );

  await dbApi.as(session.userId).gameConfig.saveField(guildId, "bots", processed);
  return { success: true };
}, "Failed to save bots");
