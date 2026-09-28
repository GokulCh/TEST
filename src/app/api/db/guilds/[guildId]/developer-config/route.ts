/**
 * /api/db/guilds/[guildId]/developer-config
 *
 * GET → { data: DeveloperConfig } (only the developer gets the update logs)
 * PUT → saves the DeveloperConfig (developer only)
 *
 * Stored as the `developer_config` field of the guild config.
 */

import { ApiError, dbApi } from "@/lib/server/api-client";
import type { DeveloperConfig } from "@/lib/db-types";
import { isDeveloper } from "@/lib/server/developer";
import { guildRoute, HttpError, ok } from "@/lib/server/guild-route";

export const GET = guildRoute(async ({ guildId, session }) => {
  let cfg: Partial<DeveloperConfig> | null = null;
  try {
    cfg = await dbApi.guildConfig.field<Partial<DeveloperConfig>>(guildId, "developer_config");
  } catch (err) {
    if (!(err instanceof ApiError && err.isNotFound)) throw err; // no config row yet: empty default
  }
  const data: DeveloperConfig = {
    update_logs: isDeveloper(session.userId) ? (cfg?.update_logs ?? []) : [],
    page_configs: cfg?.page_configs ?? [],
    category_configs: cfg?.category_configs ?? [],
  };
  return { data };
}, "Failed to fetch developer configuration");

export const PUT = guildRoute(async ({ guildId, session, json }) => {
  if (!process.env.DEVELOPER_USER_ID) throw new HttpError(503, "Developer access not configured");
  if (!isDeveloper(session.userId)) throw new HttpError(403, "Unauthorized - Developer access required");
  const body = await json<Partial<DeveloperConfig> | null>();
  if (!body || !Array.isArray(body.update_logs) || !Array.isArray(body.page_configs) || !Array.isArray(body.category_configs)) {
    throw new HttpError(400, "update_logs, page_configs and category_configs must be arrays");
  }
  await dbApi.as(session.userId).guildConfig.saveField(guildId, "developer_config", {
    update_logs: body.update_logs,
    page_configs: body.page_configs,
    category_configs: body.category_configs,
  });
  return ok;
}, "Failed to update developer configuration");
