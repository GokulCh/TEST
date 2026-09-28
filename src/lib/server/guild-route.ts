/**
 * One wrapper for every /api/db/guilds/[guildId]/** handler: awaits the params,
 * authorizes the caller, hands the handler a small context and maps every
 * failure to a JSON response, so routes only contain what is specific to them.
 *
 *   export const GET = guildRoute(async ({ guildId }) => ({ data: await dbApi.… }), "Failed to fetch X");
 *
 * A handler returns the JSON body (or a Response to send as is) and throws
 * `HttpError` for validation failures.
 */

import { NextRequest, NextResponse } from "next/server";
import { ApiError } from "@/lib/server/api-client";
import { GuildAuthorizationError, requireGuildAccess, requireGuildAccessByDbId } from "@/lib/server/guild-authorization";
import type { SessionData } from "@/lib/db-types";

/** Discord snowflake: 17-20 digits. */
export const SNOWFLAKE_RE = /^\d{17,20}$/;

export class HttpError extends Error {
  constructor(public readonly status: number, message: string) {
    super(message);
    this.name = "HttpError";
  }
}

export interface GuildContext {
  req: NextRequest;
  /** The route's [guildId]: a database id, or a snowflake for `auth: "snowflake"` routes. */
  guildId: string;
  session: SessionData;
  /** Parsed JSON body (parsed once, however often it is asked for); a malformed body is a 400. */
  json: <T = unknown>() => Promise<T>;
  /** Integer query param, falling back to `def` and clamped to [min, max]. */
  intParam: (name: string, def: number, min: number, max: number) => number;
}

export interface GuildRouteOptions {
  /** `"snowflake"` for routes addressed by Discord id (registration). Default: database id. */
  auth?: "db" | "snowflake";
  /** Seconds the caller's browser may reuse a successful response (private, never a shared cache). */
  cacheSeconds?: number;
}

/**
 * Maps a failure to a panel response. Auth responses and `HttpError`s pass
 * through. A Database API status is passed through too (412 becomes 409, a
 * lost edit race), but only 4xx bodies carry a useful message (the API hides
 * the cause of every 500), so 5xx and unknown errors get `fallback`.
 */
export function errorResponse(err: unknown, fallback: string): Response {
  if (err instanceof Response) return err;
  if (err instanceof HttpError) return NextResponse.json({ error: err.message }, { status: err.status });
  if (err instanceof GuildAuthorizationError) return NextResponse.json({ error: err.message }, { status: 403 });
  if (err instanceof ApiError) {
    if (err.isPreconditionFailed) {
      return NextResponse.json({ error: "This was changed by someone else while saving. Reload and try again." }, { status: 409 });
    }
    if (err.status >= 500) console.error(`[${fallback}]`, err.message);
    return NextResponse.json({ error: err.status < 500 ? err.serverMessage || fallback : fallback }, { status: err.status });
  }
  console.error(`[${fallback}]`, err);
  return NextResponse.json({ error: fallback }, { status: 500 });
}

export function guildRoute(
  handler: (ctx: GuildContext) => Promise<unknown>,
  fallback: string,
  { auth = "db", cacheSeconds }: GuildRouteOptions = {},
) {
  return async (req: NextRequest, { params }: { params: Promise<{ guildId: string }> }): Promise<Response> => {
    try {
      const { guildId } = await params;
      if (auth === "snowflake" && !SNOWFLAKE_RE.test(guildId)) throw new HttpError(400, "Invalid guild ID");
      let body: Promise<unknown> | undefined;
      const session = await (auth === "snowflake" ? requireGuildAccess(guildId) : requireGuildAccessByDbId(guildId));

      const out = await handler({
        req,
        guildId,
        session,
        json: <T,>() => (body ??= req.json().catch(() => Promise.reject(new HttpError(400, "Invalid JSON body")))) as Promise<T>,
        intParam: (name, def, min, max) => {
          const raw = req.nextUrl.searchParams.get(name);
          const n = Number(raw);
          return raw && Number.isInteger(n) ? Math.min(Math.max(n, min), max) : def;
        },
      });
      if (out instanceof Response) return out;

      const res = NextResponse.json(out);
      res.headers.set("Cache-Control", cacheSeconds ? `private, max-age=${cacheSeconds}` : "no-store");
      return res;
    } catch (err) {
      return errorResponse(err, fallback);
    }
  };
}

export const ok = { ok: true } as const;
