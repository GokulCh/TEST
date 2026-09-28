import type { Metadata } from "next"
import { ArrowRight, CircleDot, Terminal, ShieldCheck, Database, Globe, Lock } from "@/components/shared/icons"

export const metadata: Metadata = {
  title: "API Reference - Ranked Bedwars",
  description: "Comprehensive API documentation for Ranked Bedwars",
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://api.myrbw.dev";

const permissions = [
  { value: "read_only", description: "GET/HEAD only, bound to the guild the key was created in. This is the only level the API Manager issues." },
  { value: "master", description: "Read and write access to every guild. Held by the dashboard backend only; never issued to players. Never share it." },
];

const conventions = [
  { title: "Pagination", body: "List endpoints take ?limit= and ?offset= (or ?per_page= and ?page=). Default limit is 20, max 100; larger values are rejected with 400. Lists respond with {\"data\": [...], \"total\": N, \"limit\": L, \"offset\": O}." },
  { title: "Ids", body: "{guildId} and {playerId} accept a database id or a Discord snowflake. Ids from another guild return 404. Every other id (game, strike, punishment, ...) is a database id." },
  { title: "Responses", body: "A single resource is returned as-is, with no wrapper. Errors are {\"error\": \"...\"}. 204 has no body. Send X-API-Key (or Authorization: Bearer) on every request." },
  { title: "Field access", body: "Append a JSON path to read one field (.../configs/game/maps/0/name), or pass ?fields=a,b to keep only those top-level fields." },
  { title: "Seasons", body: "Stats, strikes, decays and the leaderboard take ?season_id=; it defaults to the guild's active season." },
  { title: "Writes", body: "Writes need the master key and an X-Actor header naming who made the change; the change is recorded in the guild's audit log. Bodies reject unknown fields with 400. Config and state writes also need If-Match set to the row's updated_at from a previous read (412 if it changed since)." },
];

const errorCodes = [
  ["400", "Malformed JSON, unknown field, invalid id or limit, missing X-Actor / If-Match on a write"],
  ["401", "Missing, invalid, inactive, admin-disabled or expired API key"],
  ["403", "Key lacks permission (write with a read_only key, other guild, master-only route)"],
  ["404", "Resource not found, or it belongs to another guild"],
  ["409", "Conflict: duplicate resource (e.g. a username or claimed subdomain)"],
  ["412", "If-Match no longer matches the row's updated_at: reload and retry"],
  ["429", "Rate limited; honour the Retry-After header"],
  ["500", "Generic internal server error (details are only in server logs)"],
];

export default function ReferencePage() {
  return (
    <div className="relative overflow-hidden">
      {/* Hero Section */}
      <section className="relative mx-auto grid max-w-[95rem] gap-12 overflow-hidden px-4 pb-20 pt-16 sm:px-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:gap-20 lg:pb-28 lg:pt-24">
        <div className="relative z-10 max-w-2xl">
          <div className="eyebrow"><CircleDot className="size-3 text-success" /> Developer resources</div>
          <h1 className="mt-6 text-hero max-w-3xl">Build with Ranked Bedwars data.</h1>
          <p className="mt-6 max-w-xl text-lg leading-8 text-fg-muted">Access guild-specific player statistics, game results, and competitive data through our read-only API. Perfect for dashboards, analytics, and custom integrations.</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a href="/setup" className="button-primary"><span>Get API access</span><ArrowRight className="size-4" /></a>
          </div>
          <div className="mt-10 flex flex-wrap gap-x-6 gap-y-3 text-xs text-fg-muted">
            <span className="flex items-center gap-2"><ShieldCheck className="size-3.5 text-success" /> Read-only access</span>
            <span className="flex items-center gap-2"><Lock className="size-3.5 text-primary-500" /> Guild-scoped</span>
            <span className="flex items-center gap-2"><Globe className="size-3.5 text-primary-500" /> RESTful API</span>
          </div>
        </div>

        <div className="command-preview panel-container relative z-10 overflow-hidden p-0">
          <div className="flex items-center justify-between border-b border-border-subtle px-5 py-4">
            <div className="flex items-center gap-3"><span className="flex size-8 items-center justify-center rounded-lg bg-primary-50 text-primary-500"><Terminal className="size-4" /></span><div><p className="text-xs text-fg-muted">API reference</p><p className="text-sm font-semibold">API Documentation</p></div></div>
            <span className="status-pill status-success"><span className="size-1.5 rounded-full bg-success" /> API v1</span>
          </div>
          <div className="grid gap-3 p-5 sm:grid-cols-3">
            {[
              ["Base URL", API_BASE_URL, "production endpoint"],
              ["Authentication", "X-API-Key header", "required for all requests"],
              ["Access scope", "Guild-specific", "read-only data access"],
            ].map(([label, value, note]) => <div key={label} className="surface-inset rounded-lg p-3"><p className="text-xs text-fg-muted">{label}</p><p className="mt-2 text-sm font-bold tracking-tight">{value}</p><p className="mt-1 text-xs text-success">{note}</p></div>)}
          </div>
          <div className="border-t border-border-subtle px-5 py-4"><div className="mb-3 flex items-center justify-between"><p className="text-xs text-fg-muted">Getting started</p><span className="text-xs text-fg-muted">Quick reference</span></div><p className="font-mono text-xs leading-6 text-fg-muted">Register your guild through the setup flow to generate API keys. All access is scoped to your specific guild.</p></div>
          <div className="flex items-center justify-between border-t border-border-subtle bg-panel-bg/60 px-5 py-3 text-xs text-fg-muted"><span>Access model: guild-scoped</span><span className="flex items-center gap-1.5 text-success"><span className="size-1.5 rounded-full bg-success" /> read-only</span></div>
        </div>
      </section>

      {/* Requirements Section */}
      <section className="border-y border-border-subtle bg-panel-bg/35">
        <div className="mx-auto max-w-[95rem] px-4 py-16 sm:px-8">
          <div className="max-w-2xl">
            <p className="eyebrow">Before you begin</p>
            <h2 className="mt-4 text-title">Requirements for API access.</h2>
            <p className="mt-3 text-description">To use the Ranked Bedwars API, you need to register your guild and generate an API key through the configuration panel.</p>
          </div>
          <div className="mt-10 grid gap-3 md:grid-cols-2">
            <div className="surface-inset rounded-xl border border-dashed border-primary-500/40 p-5">
              <p className="text-xs text-fg-muted">01 / register</p>
              <p className="mt-3 font-semibold">Register your guild through the setup flow.</p>
            </div>
            <div className="surface-inset rounded-xl border border-border-subtle p-5">
              <p className="text-xs text-fg-muted">02 / generate</p>
              <p className="mt-3 font-semibold">Create API keys in the API Manager dashboard.</p>
            </div>
            <div className="surface-inset rounded-xl border border-border-subtle p-5">
              <p className="text-xs text-fg-muted">03 / scope</p>
              <p className="mt-3 font-semibold">Keys are read-only; optionally set an expiry date in the future.</p>
            </div>
            <div className="surface-inset rounded-xl border border-border-subtle p-5">
              <p className="text-xs text-fg-muted">04 / integrate</p>
              <p className="mt-3 font-semibold">Use your key to access guild-specific data.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Available Endpoints */}
      <section className="mx-auto max-w-[95rem] px-4 py-20 sm:px-8">
        <div className="max-w-2xl">
          <p className="eyebrow">Available endpoints</p>
          <h2 className="mt-4 text-title">Guild data endpoints.</h2>
          <p className="mt-3 text-description">Keys created in the API Manager are read-only and scoped to your guild. Only read endpoints are listed here.</p>
        </div>

        <div className="mt-10 space-y-6">
          {/* Players Endpoints */}
          <div className="panel-container p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex size-10 items-center justify-center rounded-lg bg-primary-50 text-primary-500">
                <Database className="size-5" />
              </div>
              <div>
                <h3 className="font-semibold">Players</h3>
                <p className="text-sm text-fg-muted">Access player statistics and profiles</p>
              </div>
            </div>
            <div className="space-y-3">
              <div className="surface-inset rounded-lg p-4">
                <code className="font-mono text-sm">GET /v1/guilds/{'{guildId}'}/players</code>
                <p className="mt-2 text-sm text-fg-muted">List players with their config (limit/offset; filter with ?username= or ?nickname=)</p>
              </div>
              <div className="surface-inset rounded-lg p-4">
                <code className="font-mono text-sm">GET /v1/guilds/{'{guildId}'}/players/{'{playerId}'}</code>
                <p className="mt-2 text-sm text-fg-muted">Get one player and their guild config</p>
              </div>
              <div className="surface-inset rounded-lg p-4">
                <code className="font-mono text-sm">GET /v1/guilds/{'{guildId}'}/leaderboard</code>
                <p className="mt-2 text-sm text-fg-muted">Season leaderboard ordered by elo, each row with its position (?season_id=, limit/offset)</p>
              </div>
              <div className="surface-inset rounded-lg p-4">
                <code className="font-mono text-sm">GET /v1/guilds/{'{guildId}'}/players/{'{playerId}'}/stats</code>
                <p className="mt-2 text-sm text-fg-muted">Get player statistics and ELO for one season (?season_id=); /stats/rank gives the leaderboard position</p>
              </div>
              <div className="surface-inset rounded-lg p-4">
                <code className="font-mono text-sm">GET /v1/guilds/{'{guildId}'}/players/{'{playerId}'}/config</code>
                <p className="mt-2 text-sm text-fg-muted">Get player configuration settings</p>
              </div>
            </div>
          </div>

          {/* Games Endpoints */}
          <div className="panel-container p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex size-10 items-center justify-center rounded-lg bg-primary-50 text-primary-500">
                <Terminal className="size-5" />
              </div>
              <div>
                <h3 className="font-semibold">Games</h3>
                <p className="text-sm text-fg-muted">Access game history and results</p>
              </div>
            </div>
            <div className="space-y-3">
              <div className="surface-inset rounded-lg p-4">
                <code className="font-mono text-sm">GET /v1/guilds/{'{guildId}'}/games</code>
                <p className="mt-2 text-sm text-fg-muted">List games, newest first (?season_id=, ?status=waiting|in_progress|completed|cancelled, ?bot_name=, limit/offset)</p>
              </div>
              <div className="surface-inset rounded-lg p-4">
                <code className="font-mono text-sm">GET /v1/guilds/{'{guildId}'}/games/{'{gameId}'}</code>
                <p className="mt-2 text-sm text-fg-muted">Get specific game details</p>
              </div>
              <div className="surface-inset rounded-lg p-4">
                <code className="font-mono text-sm">GET /v1/guilds/{'{guildId}'}/games/{'{gameId}'}/players</code>
                <p className="mt-2 text-sm text-fg-muted">Get game participants and results</p>
              </div>
              <div className="surface-inset rounded-lg p-4">
                <code className="font-mono text-sm">GET /v1/guilds/{'{guildId}'}/games/number/{'{gameNumber}'}</code>
                <p className="mt-2 text-sm text-fg-muted">Get a game by its number within a season (?season_id=)</p>
              </div>
            </div>
          </div>

          {/* Seasons Endpoints */}
          <div className="panel-container p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex size-10 items-center justify-center rounded-lg bg-primary-50 text-primary-500">
                <Globe className="size-5" />
              </div>
              <div>
                <h3 className="font-semibold">Seasons</h3>
                <p className="text-sm text-fg-muted">Access season data and configurations</p>
              </div>
            </div>
            <div className="space-y-3">
              <div className="surface-inset rounded-lg p-4">
                <code className="font-mono text-sm">GET /v1/guilds/{'{guildId}'}/seasons</code>
                <p className="mt-2 text-sm text-fg-muted">List all seasons in your guild</p>
              </div>
              <div className="surface-inset rounded-lg p-4">
                <code className="font-mono text-sm">GET /v1/guilds/{'{guildId}'}/seasons/active</code>
                <p className="mt-2 text-sm text-fg-muted">Get the currently active season</p>
              </div>
            </div>
          </div>

          {/* Meta Endpoints */}
          <div className="panel-container p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex size-10 items-center justify-center rounded-lg bg-primary-50 text-primary-500">
                <ShieldCheck className="size-5" />
              </div>
              <div>
                <h3 className="font-semibold">Configuration</h3>
                <p className="text-sm text-fg-muted">Access game configuration and settings</p>
              </div>
            </div>
            <div className="space-y-3">
              <div className="surface-inset rounded-lg p-4">
                <code className="font-mono text-sm">GET /v1/guilds/{'{guildId}'}/configs</code>
                <p className="mt-2 text-sm text-fg-muted">Get the guild and game configuration (fields holding credentials are omitted)</p>
              </div>
              <div className="surface-inset rounded-lg p-4">
                <code className="font-mono text-sm">GET /v1/guilds/{'{guildId}'}/configs/game/maps</code>
                <p className="mt-2 text-sm text-fg-muted">Get available maps</p>
              </div>
              <div className="surface-inset rounded-lg p-4">
                <code className="font-mono text-sm">GET /v1/guilds/{'{guildId}'}/configs/game/ranks</code>
                <p className="mt-2 text-sm text-fg-muted">Get available ranks</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Conventions */}
      <section className="mx-auto max-w-[95rem] px-4 pb-20 sm:px-8">
        <div className="max-w-2xl">
          <p className="eyebrow">Conventions</p>
          <h2 className="mt-4 text-title">Pagination, updates and errors.</h2>
        </div>
        <div className="mt-10 grid gap-3 md:grid-cols-2">
          {conventions.map((c) => (
            <div key={c.title} className="surface-inset rounded-lg p-4">
              <p className="text-xs text-fg-muted">{c.title}</p>
              <p className="mt-2 text-sm text-fg-muted">{c.body}</p>
            </div>
          ))}
        </div>
        <div className="mt-6 panel-container p-6 space-y-2">
          {errorCodes.map(([code, text]) => (
            <div key={code} className="flex gap-4 text-sm">
              <code className="font-mono text-primary-500 w-10 shrink-0">{code}</code>
              <span className="text-fg-muted">{text}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Permissions Section */}
      <section className="border-y border-border-subtle bg-panel-bg/35">
        <div className="mx-auto max-w-[95rem] px-4 py-16 sm:px-8">
          <div className="max-w-2xl">
            <p className="eyebrow">Access control</p>
            <h2 className="mt-4 text-title">Key permission levels.</h2>
            <p className="mt-3 text-description">Every key has one permission level. A key an administrator disabled stays disabled (admin_disabled) and cannot be re-activated by its owner.</p>
          </div>
          <div className="mt-10 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {permissions.map((perm) => (
              <div key={perm.value} className="surface-inset rounded-lg p-4">
                <code className="font-mono text-xs text-primary-500">{perm.value}</code>
                <p className="mt-2 text-sm text-fg-muted">{perm.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Example Usage */}
      <section className="mx-auto max-w-[95rem] px-4 py-20 sm:px-8">
        <div className="max-w-2xl">
          <p className="eyebrow">Example usage</p>
          <h2 className="mt-4 text-title">Start making requests.</h2>
          <p className="mt-3 text-description">Use your API key to access guild-specific data. Replace placeholders with your actual guild ID and API key.</p>
        </div>
        <div className="mt-10 panel-container p-6">
          <div className="surface-inset rounded-lg p-4">
            <p className="text-xs text-fg-muted mb-3">Example: Get Player Statistics</p>
            <pre className="font-mono text-sm bg-bg-canvas/30 p-4 rounded-lg overflow-x-auto">
              <code>curl -H "X-API-Key: your_api_key" {API_BASE_URL}/v1/guilds/{'{guildId}'}/players/{'{playerId}'}/stats</code>
            </pre>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="mx-auto max-w-[95rem] px-4 pb-20 sm:px-8">
        <div className="rounded-2xl border border-primary-500/25 bg-primary-50/40 px-6 py-10 sm:px-10 lg:flex lg:items-center lg:justify-between">
          <div>
            <p className="eyebrow">Ready to integrate</p>
            <h2 className="mt-4 text-title">Start building with Ranked Bedwars data.</h2>
          </div>
          <a href="/setup" className="button-primary mt-7 lg:mt-0">Get API access <ArrowRight className="size-4" /></a>
        </div>
      </section>
    </div>
  );
}
