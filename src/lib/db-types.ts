/**
 * TypeScript mirror of the Go database models and types.
 * These shapes match the JSON that the Ranked-Bedwars-Database-Go API returns
 * and accepts — used throughout the config panel for typed API calls.
 */

// ── Primitives ────────────────────────────────────────────────────────────────

/** uint IDs are serialised as strings by the Go API to preserve JS precision. */
export type DBID = string;

// ── Guilds ────────────────────────────────────────────────────────────────────

export type GuildTier = "classic" | "premium" | "enterprise";

export interface GuildModel {
  id: DBID;
  snowflake_id: string;
  name: string;
  tier: GuildTier;
  is_enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface GuildConfigModel {
  id: DBID;
  guild_id: DBID;
  prefix: string;
  is_prefix_enabled: boolean;
  is_slash_enabled: boolean;
  appearance: GuildAppearanceConfig;
  panels: Record<string, PanelConfig>;
  interactive_panels: Record<string, InteractivePanelConfig>;
  reactions: Record<string, ReactionRoleConfig>;
  requirements: GuildRequirements;
  commands: GuildCommandsMap;
  permissions: GuildPermissionsConfig;
  settings_restrictions: Record<string, SettingRestriction>;
  account_age_whitelist: string[];
  punishment_ladder: PunishmentLadderConfig;
  strike_ladder: StrikeLadderConfig;
  embed: GuildEmbedConfig;
  flows: FlowsConfig;
  registration_verification: RegistrationVerificationConfig;
  elo_engine: EloEngineConfig;
  banner_layouts: Record<string, unknown> | null;
  // Panel-specific configuration (merged from guild_panel_configs)
  theme: PanelThemeConfig;
  leaderboards: LeaderboardDisplayConfig[];
  public_domain: string | null;
  audit_settings: PanelAuditSettings;
  portal_settings: PanelPortalSettings;
  developer_config: DeveloperConfig;
  member_count: number;
  member_count_updated_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface GuildSnapshotModel {
  id: DBID;
  guild_id: DBID;
  channels: Record<string, string>;
  categories: Record<string, string>;
  roles: Record<string, string>;
  threads: Record<string, string>;
}

export interface SnapshotChannelRecord {
  id: string;
  name: string;
  type: string;
  parent_id: string;
  position: number;
}

export interface SnapshotThreadRecord extends SnapshotChannelRecord {
  archived: boolean;
}

export interface SnapshotRoleRecord {
  id: string;
  name: string;
  color: string;
  position: number;
}

export interface SnapshotState {
  channels: Record<string, SnapshotChannelRecord>;
  categories: Record<string, SnapshotChannelRecord>;
  roles: Record<string, SnapshotRoleRecord>;
  threads: Record<string, SnapshotThreadRecord>;
}

export interface GuildFull {
  guild: GuildModel;
  config: GuildConfigModel | null;
  snapshot: GuildSnapshotModel | null;
}

export interface GuildSnapshotBundle {
  guild_id: DBID;
  snowflake_id: string;
  state: SnapshotState;
  requirements: GuildRequirements;
  updated_at: string;
}

// ── Guild config sub-types ────────────────────────────────────────────────────

export interface GuildAppearanceConfig {
  nickname: string | null;
  avatar: string | null;
  bio: string | null;
  banner: string | null;
}

export interface GuildRequirements {
  roles: Record<string, string>;
  channels: Record<string, string>;
  categories: Record<string, string>;
  threads: Record<string, string>;
}

export interface GuildCommandPermission {
  category: string;
  description: string;
  is_enabled: boolean | null;
  is_slash_enabled: boolean | null;
  is_prefix_enabled: boolean | null;
  aliases: string[];
  allowed_roles: string[] | null;
  denied_roles: string[] | null;
  allowed_channels: string[] | null;
  disallowed_channels: string[] | null;
  subcommands: Record<string, GuildSubcommandPermission>;
  cooldown: number;
}

export interface GuildSubcommandPermission {
  is_enabled: boolean | null;
  is_slash_enabled: boolean | null;
  is_prefix_enabled: boolean | null;
  aliases: string[];
  allowed_roles: string[] | null;
  denied_roles: string[] | null;
  allowed_channels: string[] | null;
  disallowed_channels: string[] | null;
  cooldown: number;
}

export type GuildCommandsMap = Record<string, GuildCommandPermission>;

export type GuildPermissionsConfig = Record<
  string,
  { allowed_roles: string[]; denied_roles: string[] }
>;

export interface SettingRestriction {
  allowed_roles: string[];
  allowed_perks: string[];
  require_booster: boolean;
  is_locked: boolean;
}

export interface PanelConfig {
  name: string;
  description: string | null;
  channel_id: string | null;
  message_id: string | null;
  is_enabled: boolean;
  data: Record<string, unknown>;
}

export interface InteractivePanelConfig {
  id: string;
  key: string;
  name: string;
  description: string | null;
  format: string;
  enabled: boolean;
  content: unknown[];
  actions: Record<string, unknown>;
  automations: unknown[];
  deployed_channel_id: string | null;
  deployed_message_id: string | null;
}

export interface ReactionRoleConfig {
  emoji: string;
  message_id: string;
  channel_id: string;
  role_id: string;
  is_enabled: boolean;
}

export interface PunishmentLadderLevel {
  id: string;
  punishmentType: string;
  name: string;
  description: string | null;
  enabled: boolean | null;
  steps: Array<{
    type: string;
    duration?: number;
    durationUnit?: string;
  }>;
}

export interface PunishmentLadderConfig {
  offence_mode?: "persistent" | "active_only" | "season_reset";
  levels: Record<string, PunishmentLadderLevel>;
}

export interface StrikeLadderStep {
  strikes_required: number;
  weight?: number;
  action: string;
  duration?: number;
  durationUnit?: string;
  elo_removal?: number;
  ban_days?: number;
  restriction_role_id?: string;
  debuff_days?: number;
  disqualify_days?: number;
}

export interface StrikeLadderLevel {
  id: string;
  name: string;
  description: string | null;
  enabled: boolean | null;
  steps: StrikeLadderStep[];
}

export interface StrikeLadderConfig {
  decay_interval_days?: number;
  offence_mode?: "persistent" | "active_only" | "season_reset";
  levels: Record<string, StrikeLadderLevel>;
}

export interface GuildEmbedConfig {
  show_author_icon: boolean;
  show_author_title: boolean;
  show_thumbnail: boolean;
  show_footer_icon: boolean;
  show_footer_text: boolean;
  show_timestamp: boolean;
  presets: Record<string, unknown>;
  assets: { icons: Record<string, string>; thumbnails: Record<string, string> };
}

export interface FlowsConfig {
  party: {
    max_size: number;
    inactivity_disband_time: number;
    elo_modifier_is_enabled: boolean;
    elo_modifier_multiplier: number;
    elo_modifier_games_threshold: number;
    elo_modifier_flat_adjustment: number;
    min_queue_size: number;
    require_all_members_in_queue: boolean;
    max_elo_difference: number;
    elo_aggregation_method: string;
    is_enabled?: boolean;
  };
  standard: {
    is_enabled: boolean;
    randomness_percent: number;
    max_party_size: number | null;
    keep_party_on_same_team: boolean;
    balance_party_groups: boolean;
    allow_splitting_parties: boolean;
  };
  captain: {
    is_enabled: boolean;
    pick_timeout_seconds: number;
    top_elo_captain_chance: number;
    show_elo_in_pick_menu: boolean;
    auto_assign_party_members: boolean;
    max_party_size: number | null;
    one_captain_per_party: boolean;
    default_picking_type: string;
    alternating_min_players: number;
  };
}

export type RegistrationVerificationMode =
  | "database_only"
  | "network_api"
  | "custom_api";

export interface RegistrationVerificationConfig {
  mode: RegistrationVerificationMode;
  network_preset_id: "auto" | "jartex" | "pika";
  custom_profile_url: string | null;
}

export interface EloEngineConfig {
  rank_thresholds?: unknown[];
  performance_weights?: Array<{ stat: string; multiplier: number }>;
  anti_farming_multiplier?: number;
  elo_decay?: {
    enabled: boolean;
    decayFloor: number;
    inactivityDays: number;
  };
}

// ── Game Meta ─────────────────────────────────────────────────────────────────

export type BotStatus = "offline" | "starting" | "available" | "busy" | "cooldown";

export type GameModeType =
  | "casual"
  | "classic"
  | "captain"
  | "party"
  | "event"
  | "elo"
  | "standard";

export interface ModeConfig {
  name: string;
  stable_id?: string;
  category?: string;
  type: GameModeType;
  description?: string;
  team_count: number;
  players_per_team: number;
  max_players: number;
  gui_slot: number;
  is_enabled: boolean;
  is_elo_gain_enabled: boolean;
  is_stats_tracking_enabled: boolean;
  is_auto_striking_enabled: boolean;
  is_party_queue_enabled: boolean;
  is_queue_category: boolean;
  settings_id?: number;
}

export interface MapConfig {
  name: string;
  stable_id?: string;
  map_height?: number;
  gui_slot?: number;
  is_enabled: boolean;
  is_map_available: boolean;
  mode_settings?: Record<string, { teams: string[] }>;
  teams?: string[];
}

export interface SeasonConfig {
  id: number;
  name: string;
  description?: string;
  start_date: string;
  end_date?: string;
  is_enabled: boolean;
}

export interface RankConfig {
  rank_name: string;
  min_elo: number;
  max_elo?: number;
  k_factor_win: number;
  k_factor_loss: number;
  role_id: string;
  mvp_bonus: number;
  decay?: number;
  color?: string;
  order: number;
}

export interface GameMetaModel {
  id: DBID;
  guild_id: DBID;
  maps: MapConfig[];
  modes: ModeConfig[];
  seasons: Record<string, SeasonConfig>;
  ranks: RankConfig[];
  perks: unknown[];
  bots: BotStoredConfig[];
  settings: unknown[];
  server: GameServerConfig;
  topgg: unknown;
}

// ── Matchmaking ───────────────────────────────────────────────────────────────

export interface QueueChannelSetting {
  id?: string;
  name?: string;
  mode: string;
  channel_id: string;
  is_enabled: boolean;
  setting_id?: unknown;
  allowed_ranks?: string[];
  denied_ranks?: string[];
}

export interface QueueConfig {
  name: string;
  category_id?: string | null;
  waiting_vc_id?: string | null;
  is_enabled: boolean;
  settings: QueueChannelSetting[];
  voice_team_template?: string | null;
  voice_waiting_template?: string | null;
}

// ── Players ───────────────────────────────────────────────────────────────────

export interface PlayerModel {
  id: DBID;
  snowflake_id: string;
  last_seen: string;
  created_at: string;
}

export interface PlayerConfigModel {
  id: DBID;
  player_id: DBID;
  guild_id: DBID;
  username: string;
  nickname: string | null;
  embed_color: string;
  is_elo_visible: boolean;
  is_stats_visible: boolean;
  is_party_invites_enabled: boolean;
  is_party_autowarp_enabled: boolean;
  is_ping_on_results_enabled: boolean;
  is_ping_on_alerts_enabled: boolean;
}

export interface PlayerStatsModel {
  id: DBID;
  player_id: DBID;
  guild_id: DBID;
  season_key: string;
  rank: string;
  elo: number;
  highest_elo: number;
  games_played: number;
  wins: number;
  losses: number;
  win_streak: number;
  highest_win_streak: number;
  loss_streak: number;
}

// ── Games ─────────────────────────────────────────────────────────────────────

export type GameStatus =
  | "waiting"
  | "starting"
  | "ongoing"
  | "completed"
  | "cancelled"
  | "voided";

export interface GameModel {
  id: DBID;
  guild_id: DBID;
  map_id: DBID;
  mode_id: DBID;
  season_id: DBID;
  bot_id: DBID | null;
  game_number: number | null;
  status: GameStatus;
  started_at: string | null;
  ended_at: string | null;
}

// ── API response envelopes ─────────────────────────────────────────────────────

export interface APIResponse<T> {
  data: T;
}

export interface APIError {
  error: string;
}

// ── Panel-specific enriched types ─────────────────────────────────────────────

/** A Discord guild as seen by the panel: Discord metadata + DB registration state */
export interface PanelGuild {
  /** Discord snowflake */
  id: string;
  name: string;
  icon: string | null;
  iconUrl: string | null;
  owner: boolean;
  permissions: string;
  /** Whether this guild is registered in the database */
  isRegistered: boolean;
  /** DB row id (only present when isRegistered = true) */
  dbId?: DBID;
}

/** Player appearance configuration */
export interface PlayerAppearanceConfig {
  nickname: string | null;
  embed_color: string;
}

/** Authenticated session stored in the cookie */
export interface SessionData {
  userId: string;
  username: string;
  globalName: string | null;
  discriminator: string;
  avatar: string | null;
  avatarUrl: string;
  accessToken: string;
  refreshToken: string;
  /** Unix ms when the access token expires */
  expiresAt: number;
  /** Player appearance configuration (per-guild) - can be undefined for backward compatibility */
  playerAppearance?: Record<string, PlayerAppearanceConfig> | undefined;
}

// ── Panel Config (guild_panel_configs) ───────────────────────────────────────

/** Portal theme / colour scheme */
export interface PanelThemeConfig {
  preset_id?: string | null;
  primary: string;
  panel_bg: string;
  canvas_bg: string;
}

/** One scoreboard block shown on the public portal */
export interface LeaderboardDisplayConfig {
  id: string;
  name: string;
  metric: "elo" | "wins" | "highest_streak" | "kills" | "final_kills" | "beds_destroyed" | "mvp_count";
  reward_role_id: string;
  is_enabled: boolean;
}

/** Panel-side audit logging settings */
export interface PanelAuditSettings {
  retention_days: number;
  log_config_changes: boolean;
  log_moderation_actions: boolean;
  log_player_registrations: boolean;
}

/** Portal visibility settings */
export interface PanelPortalSettings {
  is_public: boolean;
  show_leaderboard: boolean;
  show_player_profiles: boolean;
  custom_css?: string | null;
}

/** Developer update log entry */
export interface DeveloperUpdateLog {
  id: string;
  title: string;
  content: string;
  version: string;
  date: string;
  is_featured: boolean;
}

/** Developer page configuration */
export interface DeveloperPageConfig {
  id: string;
  name: string;
  path: string;
  is_enabled: boolean;
  is_restricted: boolean;
}

/** Developer category configuration */
export interface DeveloperCategoryConfig {
  id: string;
  name: string;
  is_enabled: boolean;
  pages: string[];
}

/** Developer-specific panel configuration */
export interface DeveloperConfig {
  update_logs: DeveloperUpdateLog[];
  page_configs: DeveloperPageConfig[];
  category_configs: DeveloperCategoryConfig[];
}

// ── Player enriched types ─────────────────────────────────────────────────────

/** Player punishment row from player_punishments */
export type PunishmentType = "warning" | "chat_mute" | "vc_mute" | "queue_ban" | "server_ban" | "restrict";

export interface PlayerPunishmentModel {
  id: DBID;
  guild_id: DBID;
  player_id: DBID;
  staff_id: string;
  type: PunishmentType;
  reason: string;
  evidence: string | null;
  expires_at: string | null;
  is_enabled: boolean;
  revoked_by: string | null;
  revoke_reason: string | null;
  revoked_at: string | null;
  created_at: string;
  updated_at: string;
}

/** Player strike row from player_strikes */
export interface PlayerStrikeModel {
  id: DBID;
  guild_id: DBID;
  player_id: DBID;
  game_id: DBID | null;
  staff_id: string;
  reason: string;
  weight: number;
  elo_amount: number;
  elo_old: number;
  elo_new: number;
  elo_removal: number;
  ban_days: number;
  level: number | null;
  restriction_role_id: string | null;
  restriction_role_name: string | null;
  is_enabled: boolean;
  is_appealed: boolean;
  is_voided: boolean;
  is_template: boolean;
  expires_at: string | null;
  debuff_until: string | null;
  disqualified_until: string | null;
  created_at: string;
  updated_at: string;
}

/** Full game participant row */
export interface GameParticipantModel {
  id: DBID;
  guild_id: DBID;
  game_id: DBID;
  player_id: DBID;
  team: string;
  elo_before: number;
  elo_after: number;
  elo_change: number;
  kills: number;
  deaths: number;
  final_kills: number;
  assists: number;
  beds_destroyed: number;
  beds_lost: number;
  first_bloods: number;
  is_winner: boolean;
  is_captain: boolean;
  is_mvp: boolean;
  win_streak_before: number;
  win_streak_after: number;
}

/** Guild event (audit trail) */
export interface GuildEventModel {
  id: DBID;
  guild_id: DBID;
  type: string;
  message_id: string;
  channel_id: string;
  initiator_id: string;
  status: string;
  reason: string | null;
  metadata: unknown;
  resolved_at: string | null;
  created_at: string;
  updated_at: string;
}

/** GameServerConfig stored in game_meta.server */
export interface GameServerConfig {
  host: string;
  port?: number;
  version: string;
  is_enabled?: boolean;
  auth?: { type: "none" | "per_bot" };
  verification?: { provider: "none" | "jartex_stats" | "mojang" };
  tierKeywords?: Record<string, string[]>;
}

/** BotStoredConfig stored in game_meta.bots array */
export interface BotStoredConfig {
  username: string;
  stable_id?: string;
  status: "offline" | "starting" | "available" | "busy" | "cooldown";
  is_enabled: boolean;
  tier?: string;
  password_ciphertext?: string;
  password_set_at?: string;
  has_password?: boolean;
}

/** BotConfigInput used for sending bot data to API (includes plaintext password) */
export interface BotConfigInput {
  username: string;
  stable_id?: string;
  status: "offline" | "starting" | "available" | "busy" | "cooldown";
  is_enabled: boolean;
  tier?: string;
  password?: string;
}
