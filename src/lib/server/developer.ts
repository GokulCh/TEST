/** The one Discord user who may see and edit developer-only config (update logs). */

import type { GuildConfigModel } from "@/lib/db-types";

export const isDeveloper = (userId: string) => !!process.env.DEVELOPER_USER_ID && userId === process.env.DEVELOPER_USER_ID;

/** Removes `developer_config` (incl. update logs) unless the requester is the developer. */
export function stripDeveloperConfig(cfg: GuildConfigModel, userId: string) {
  if (isDeveloper(userId)) return cfg;
  const { developer_config: _omit, ...rest } = cfg;
  return rest;
}
