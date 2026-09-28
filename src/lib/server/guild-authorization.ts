/**
 * Guild authorization utilities
 * Verifies that authenticated users have permission to access specific guilds
 */

import { requireAuth } from "@/lib/server/auth";
import { fetchUserGuilds, filterManageableGuilds } from "@/lib/server/discord-oauth";
import type { SessionData } from "@/lib/db-types";
import { BoundedCache, guildPermissionCache } from "@/lib/server/bounded-cache";
import { dbApi } from "@/lib/server/api-client";

/**
 * Authorization error for when user lacks guild access
 */
export class GuildAuthorizationError extends Error {
  constructor(message: string = "You do not have permission to access this guild") {
    super(message);
    this.name = "GuildAuthorizationError";
  }
}

/**
 * Get the list of guild IDs the current user can manage
 * Uses bounded caching to reduce Discord API calls and prevent memory leaks
 * Enhanced for multi-user scenarios with user isolation
 */
async function getUserManageableGuilds(session: SessionData): Promise<string[]> {
  const cacheKey = session.userId;
  const cached = guildPermissionCache.get(cacheKey, session.userId);
  
  // Return cached data if still valid
  if (cached) {
    return cached.manageableGuilds;
  }
  
  // Fetch fresh data from Discord with per-user rate limiting
  const allGuilds = await fetchUserGuilds(session.accessToken, session.userId);
  const manageable = filterManageableGuilds(allGuilds);
  const manageableIds = manageable.map(g => g.id);
  
  // Update cache with 5-minute TTL and user ID for isolation
  guildPermissionCache.set(cacheKey, { manageableGuilds: manageableIds }, 5 * 60 * 1000, session.userId);
  
  return manageableIds;
}

/**
 * Verify that the current user has permission to access a specific guild
 * @param guildId - The Discord snowflake ID of the guild
 * @throws GuildAuthorizationError if user lacks permission
 * @throws Error if authentication fails
 */
export async function requireGuildAccess(guildId: string): Promise<SessionData> {
  const session = await requireAuth();
  
  const manageableGuilds = await getUserManageableGuilds(session);
  
  if (!manageableGuilds.includes(guildId)) {
    throw new GuildAuthorizationError();
  }
  
  return session;
}

/** A guild's snowflake never changes, so a database id resolves once per hour at most. */
const snowflakeByDbId = new BoundedCache<string>(1000, 60 * 60 * 1000);

async function snowflakeOf(dbGuildId: string): Promise<string> {
  const cached = snowflakeByDbId.get(dbGuildId);
  if (cached) return cached;
  const { snowflake_id } = await dbApi.guilds.getById(dbGuildId);
  snowflakeByDbId.set(dbGuildId, snowflake_id);
  return snowflake_id;
}

/**
 * Verify that the current user can manage a guild, addressed by database ID.
 * @throws Response (401) when not signed in
 * @throws GuildAuthorizationError when the user cannot manage the guild
 * @throws ApiError when the Database API fails (404 = unknown guild); callers map its status
 */
export async function requireGuildAccessByDbId(dbGuildId: string): Promise<SessionData> {
  const session = await requireAuth();
  const [snowflake, manageable] = await Promise.all([snowflakeOf(dbGuildId), getUserManageableGuilds(session)]);
  if (!manageable.includes(snowflake)) throw new GuildAuthorizationError();
  return session;
}
