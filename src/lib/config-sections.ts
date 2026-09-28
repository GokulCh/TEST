/**
 * The panel's config section names and the guild config column each one is
 * stored in. Shared by the /config route (which writes the column) and the
 * dashboard's config provider (which mirrors the write locally).
 */

import type { GuildConfigModel } from "@/lib/db-types";

export const CONFIG_FIELDS = {
  prefix: "prefix",
  "prefix-enabled": "is_prefix_enabled",
  "slash-enabled": "is_slash_enabled",
  appearance: "appearance",
  commands: "commands",
  permissions: "permissions",
  "registration-verification": "registration_verification",
  "elo-engine": "elo_engine",
  flows: "flows",
  "punishment-ladder": "punishment_ladder",
  "strike-ladder": "strike_ladder",
  panels: "panels",
  "interactive-panels": "interactive_panels",
  reactions: "reactions",
  embed: "embed",
  "banner-layouts": "banner_layouts",
  "settings-restrictions": "settings_restrictions",
  "account-age-whitelist": "account_age_whitelist",
} as const satisfies Record<string, keyof GuildConfigModel>;

export type ConfigSection = keyof typeof CONFIG_FIELDS;

/** Panel-only settings (portal, theme, leaderboards) live in the same row and are written through the same /config route. */
export const PANEL_FIELDS = {
  theme: "theme",
  leaderboards: "leaderboards",
  domain: "public_domain",
  "audit-settings": "audit_settings",
  "portal-settings": "portal_settings",
} as const satisfies Record<string, keyof GuildConfigModel>;

export type PanelSection = keyof typeof PANEL_FIELDS;
