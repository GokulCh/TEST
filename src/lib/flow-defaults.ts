/** Defaults for the `flows` config sections, used when a guild has never configured them. */

import type { FlowsConfig } from "@/lib/db-types";

export const DEFAULT_PARTY_FLOW: FlowsConfig["party"] = {
  max_size: 4,
  inactivity_disband_time: 10,
  elo_modifier_is_enabled: true,
  elo_modifier_multiplier: 1.25,
  elo_modifier_games_threshold: 3,
  elo_modifier_flat_adjustment: 0,
  min_queue_size: 0,
  require_all_members_in_queue: true,
  max_elo_difference: 300,
  elo_aggregation_method: "average",
};

export const DEFAULT_STANDARD_FLOW: FlowsConfig["standard"] = {
  is_enabled: true,
  randomness_percent: 0,
  max_party_size: null,
  keep_party_on_same_team: true,
  balance_party_groups: true,
  allow_splitting_parties: false,
};

export const DEFAULT_CAPTAIN_FLOW: FlowsConfig["captain"] = {
  is_enabled: false,
  pick_timeout_seconds: 30,
  top_elo_captain_chance: 50,
  show_elo_in_pick_menu: true,
  auto_assign_party_members: true,
  max_party_size: null,
  one_captain_per_party: false,
  default_picking_type: "alternating",
  alternating_min_players: 8,
};

/**
 * `flows` as it should be written: everything already stored is kept, `patch`
 * replaces its sections, and party/standard/captain fall back to defaults.
 */
export function withFlowDefaults(stored: Partial<FlowsConfig> | undefined, patch: Record<string, unknown> = {}): FlowsConfig {
  return {
    ...stored,
    party: stored?.party || DEFAULT_PARTY_FLOW,
    standard: stored?.standard || DEFAULT_STANDARD_FLOW,
    captain: stored?.captain || DEFAULT_CAPTAIN_FLOW,
    ...patch,
  } as FlowsConfig;
}
