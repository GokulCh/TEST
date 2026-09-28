/**
 * Clears everything the server keeps per user, when a session ends.
 */

import { guildPermissionCache } from "@/lib/server/bounded-cache";
import { globalRateLimiters } from "@/lib/server/rate-limiter";

export function cleanupUserSession(userId: string): void {
  guildPermissionCache.clearUser(userId);
  globalRateLimiters.discord.clearUser(userId);
  globalRateLimiters.external.clearUser(userId);
  // The database rate limiter is shared by every user and stays.
}
