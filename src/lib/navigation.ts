/**
 * The dashboard's page registry: the single list of pages, their groups and
 * their access ids. The sidebar renders it, the page-access guard and the
 * developer console read it, and the developer's stored config refers to it by id.
 */

import {
  AlertTriangle, AppWindow, Binary, Calculator, CalendarDays, Code2, Cpu, Database, Eye, FileCode, FileText, Flame, Gavel, Gift,
  GitBranch, Globe, Hammer, History, Image, LayoutDashboard, LifeBuoy, ListOrdered, Mail, Map as MapIcon, PlusSquare, Radio, Scale,
  ScrollText, Server, Shield, SlidersHorizontal, Sparkles, Swords, Terminal, Ticket, UserCheck, Users, UsersRound, UserX,
  Webhook, Zap, type LucideIcon,
} from "lucide-react";
import type { DeveloperCategoryConfig, DeveloperConfig, DeveloperPageConfig } from "@/lib/db-types";

export interface NavPage {
  /** Stable id: what the developer config and the access guard refer to. */
  id: string;
  /** Path below /dashboard/[guildId] ("" is the overview). */
  path: string;
  label: string;
  icon: LucideIcon;
  /** Name in the developer console when it differs from the sidebar label. */
  adminName?: string;
  /** Only the developer may open it. */
  restricted?: boolean;
  /** `data-tour` attribute for the onboarding tour. */
  tour?: string;
}

export interface NavGroup {
  id: string;
  label: string;
  adminName: string;
  icon: LucideIcon;
  /** Full Tailwind class names (they must appear literally for Tailwind to generate them). */
  iconClass: string;
  dimClass: string;
  tour: string;
  pages: NavPage[];
  /** Pages of other sections the developer console files under this group. */
  adminExtraPages?: string[];
}

const page = (id: string, path: string, label: string, icon: LucideIcon, extra: Partial<NavPage> = {}): NavPage => ({ id, path, label, icon, ...extra });

export const CORE_PAGES: NavPage[] = [
  page("overview", "", "Overview", LayoutDashboard, { adminName: "Overview", tour: "overview-nav" }),
  page("players", "/players", "Players", Users, { adminName: "Player Profiles", tour: "players-nav" }),
  page("matches", "/matches", "Games", Swords, { adminName: "Live Matches", tour: "games-nav" }),
  page("commands", "/commands", "Commands", Terminal, { adminName: "Custom Commands", tour: "commands-nav" }),
];

export const NAV_GROUPS: NavGroup[] = [
  {
    id: "infrastructure", label: "Infrastructure", adminName: "Infrastructure", icon: Server, iconClass: "text-cyan-500", dimClass: "text-cyan-500/60", tour: "infrastructure-module",
    pages: [
      page("proxies", "/infrastructure/auto-proxy", "Server Instance", Cpu, { adminName: "Instance Proxies" }),
      page("hosting", "/infrastructure/hosting", "Bot Nodes", Server),
      page("maps", "/infrastructure/maps", "Map Registries", MapIcon),
      page("seasons", "/infrastructure/seasons", "Season Breaks", CalendarDays),
    ],
  },
  {
    id: "matchmaking", label: "Matchmaking", adminName: "Matchmaking", icon: ListOrdered, iconClass: "text-violet-500", dimClass: "text-violet-500/60", tour: "matchmaking-module",
    adminExtraPages: ["players", "matches"],
    pages: [
      page("queues", "/matchmaking/queues", "Queue Systems", ListOrdered),
      page("ranks", "/matchmaking/ranks", "Rank Thresholds", UserCheck),
      page("weights", "/matchmaking/weights", "Stat Weighting", Scale),
      page("teams", "/matchmaking/team-formation", "Team Generation", UsersRound),
      page("leaderboards", "/matchmaking/leaderboards", "Global Leaderboards", Flame),
      page("parties", "/matchmaking/parties", "Party Restraints", SlidersHorizontal),
    ],
  },
  {
    id: "moderation", label: "Moderation", adminName: "Sanctions & Security", icon: Shield, iconClass: "text-rose-500", dimClass: "text-rose-500/60", tour: "moderation-module",
    pages: [
      page("strike-logs", "/sanctions/strike-logs", "Strike Records", AlertTriangle),
      page("strike-ladder", "/sanctions/strike-ladder", "Strike Auto-Ladder", History),
      page("punish-logs", "/sanctions/punishment-logs", "Punishment Logs", Hammer),
      page("punish-ladder", "/sanctions/punishment-ladder", "Enforcement Rules", Gavel),
      page("anticheat", "/sanctions/anticheat", "Anti-Cheat Matrix", Binary),
      page("settings-access", "/moderation/settings-access", "Settings Access Control", Shield),
    ],
  },
  {
    id: "tickets", label: "Tickets", adminName: "Ticket Subsystem", icon: LifeBuoy, iconClass: "text-orange-500", dimClass: "text-orange-500/60", tour: "tickets-module",
    pages: [
      page("tickets-live", "/tickets/active", "Live Support Hub", Ticket),
      page("tickets-arch", "/tickets/transcripts", "Archived Logs", FileText),
      page("tickets-claim", "/tickets/claims", "Staff Routing", UsersRound),
      page("tickets-black", "/tickets/blacklist", "Support Blacklist", UserX),
      page("tickets-drop", "/tickets/panel-creator", "Drop Embed Panels", PlusSquare),
    ],
  },
  {
    id: "toolkits", label: "Toolkits", adminName: "Creator Toolkits", icon: Image, iconClass: "text-emerald-500", dimClass: "text-emerald-500/60", tour: "toolkits-module",
    pages: [
      page("banners", "/toolkits/banner-builder", "Banner Builder", Image),
      page("brackets", "/toolkits/bracket-builder", "Bracket Builder", GitBranch),
      page("webhooks", "/toolkits/webhook-builder", "Webhook Builder", Webhook),
      page("embeds", "/toolkits/embeds", "Embed Studio", Code2),
      page("panels", "/toolkits/panel-deployer", "Panel Deployer", FileCode),
    ],
  },
  {
    id: "capabilities", label: "Capabilities", adminName: "Capabilities", icon: Sparkles, iconClass: "text-indigo-500", dimClass: "text-indigo-500/60", tour: "capabilities-module",
    pages: [
      page("perks", "/capabilities/perks", "Tier Perks", Sparkles),
      page("giveaways", "/capabilities/giveaways", "Giveaways Engine", Gift),
      page("reaction-roles", "/capabilities/reaction-roles", "Reaction Roles", Radio),
      page("loggers", "/capabilities/loggers", "Event Loggers", ScrollText),
      page("streaks", "/capabilities/streaks", "Daily Streaks", Zap),
    ],
  },
  {
    id: "simulations", label: "Simulations", adminName: "Simulation Models", icon: Calculator, iconClass: "text-sky-500", dimClass: "text-sky-500/60", tour: "simulations-module",
    pages: [
      page("sim-elo", "/simulators/elo", "ELO Projection", Calculator),
      page("sim-prog", "/simulators/progression", "Rank Progression", Calculator),
      page("sim-party", "/simulators/party", "Party Balancing", Calculator),
      page("sim-queue", "/simulators/queue", "Queue Math", Calculator),
      page("sim-capt", "/simulators/captain", "Captain Pick", Calculator),
      page("sim-strike", "/simulators/strike-preview", "Strike Preview", Calculator),
    ],
  },
];

export const SYSTEM_PAGES: NavPage[] = [
  page("domain", "/networking/public-domain", "Portal Domain", Globe),
  page("audit", "/networking/audit-logs", "Audit Tracing", Eye),
  page("backups", "/networking/backups", "Backup & Restore", Database),
  page("api-manager", "/api-manager", "API Manager", AppWindow),
  page("developer", "/developer", "Developer Console", Shield, { adminName: "Developer Console", restricted: true }),
  page("contact", "/networking/contact", "Core Contact", Mail),
];

export const ALL_PAGES: NavPage[] = [...CORE_PAGES, ...NAV_GROUPS.flatMap((g) => g.pages), ...SYSTEM_PAGES];

const BY_PATH = new Map(ALL_PAGES.map((p) => [p.path, p.id]));

/** The page id of a pathname such as /dashboard/123/players (main domain) or /dashboard/players (guild subdomain). */
export function pageIdForPathname(pathname: string, guildId?: string): string | undefined {
  const rest = pathname.replace(/^\/dashboard/, "");
  const below = guildId && (rest === `/${guildId}` || rest.startsWith(`/${guildId}/`)) ? rest.slice(guildId.length + 1) : rest;
  return BY_PATH.get(below.replace(/\/$/, ""));
}

// ── Developer console defaults & access rules ───────────────────────────────

/** Every page and group as the developer console lists it before anything is saved. */
export function defaultDeveloperNavigation(): { pages: DeveloperPageConfig[]; categories: DeveloperCategoryConfig[] } {
  const pages = ALL_PAGES.map((p) => ({
    id: p.id,
    name: p.adminName ?? p.label,
    path: `/dashboard/[guildId]${p.path}`,
    is_enabled: true,
    is_restricted: !!p.restricted,
  }));
  const categories = NAV_GROUPS.map((g) => ({
    id: g.id,
    name: g.adminName,
    is_enabled: true,
    pages: [...g.pages.map((p) => p.id), ...(g.adminExtraPages ?? [])],
  }));
  return { pages, categories };
}

export interface PageAccess { allowed: boolean; reason?: string }

/**
 * Whether a non-developer may open a page under the guild's developer config.
 * Pages the config does not mention are open, and so is everything while no
 * config has been saved.
 */
export function pageAccess(config: Pick<DeveloperConfig, "page_configs" | "category_configs"> | null | undefined, pageId: string | undefined): PageAccess {
  if (!pageId || !config?.page_configs?.length) return { allowed: true };
  const page = config.page_configs.find((p) => p.id === pageId);
  if (!page) return { allowed: true };
  if (!page.is_enabled) return { allowed: false, reason: "Page disabled" };
  if (page.is_restricted) return { allowed: false, reason: "Page restricted to developers" };
  if (config.category_configs?.some((c) => c.pages.includes(pageId) && !c.is_enabled)) return { allowed: false, reason: "Category disabled" };
  return { allowed: true };
}
