/**
 * Public API v1 Guild Proxy (Catch-all)
 * Proxies all requests from api.myrbw.dev/v1/guilds/{guildId}/... to the database API
 */

import { NextRequest, NextResponse } from "next/server";

type Params = { params: Promise<{ guildId: string; path?: string[] }> };

async function proxyRequest(req: NextRequest, guildId: string, path: string[] = []) {
  try {
    // Forward request to database API
    const databaseUrl = process.env.DATABASE_API_URL;
    if (!databaseUrl) {
      return NextResponse.json({ error: "Database API not configured" }, { status: 500 });
    }

    const url = new URL(req.url);
    // Params arrive decoded: reject dot segments (would escape /v1/guilds/{id}, e.g. into
    // /v1/master) and re-encode the rest so "/" or "?" cannot alter the target path.
    const segments = [guildId, ...path];
    if (segments.some((s) => s === "" || s === "." || s === "..")) {
      return NextResponse.json({ error: "Invalid path" }, { status: 400 });
    }
    const pathString = segments.map(encodeURIComponent).join("/");
    const queryString = url.search;

    const targetUrl = `${databaseUrl.replace(/\/$/, "")}/v1/guilds/${pathString}${queryString}`;

    // Forward only credentials that were actually sent (empty headers are not valid keys).
    const headers: Record<string, string> = {
      "Content-Type": req.headers.get("Content-Type") || "application/json",
    };
    const key = req.headers.get("X-API-Key");
    const auth = req.headers.get("Authorization");
    if (key) headers["X-API-Key"] = key;
    if (auth) headers["Authorization"] = auth;

    const response = await fetch(targetUrl, {
      method: req.method,
      headers,
      body: req.method !== "GET" && req.method !== "DELETE" ? await req.text() : undefined,
    });

    const data = await response.text();
    
    return new NextResponse(data, {
      status: response.status,
      headers: {
        "Content-Type": response.headers.get("Content-Type") || "application/json",
        "Access-Control-Allow-Origin": "*",
        ...(response.headers.get("Retry-After")
          ? { "Retry-After": response.headers.get("Retry-After")! }
          : {}),
      },
    });
  } catch (error) {
    console.error("[API Proxy] Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization, X-API-Key",
    },
  });
}

export async function GET(req: NextRequest, { params }: Params) {
  const { guildId, path } = await params;
  return proxyRequest(req, guildId, path);
}

export async function POST(req: NextRequest, { params }: Params) {
  const { guildId, path } = await params;
  return proxyRequest(req, guildId, path);
}

export async function PUT(req: NextRequest, { params }: Params) {
  const { guildId, path } = await params;
  return proxyRequest(req, guildId, path);
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const { guildId, path } = await params;
  return proxyRequest(req, guildId, path);
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const { guildId, path } = await params;
  return proxyRequest(req, guildId, path);
}