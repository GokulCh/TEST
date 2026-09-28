/**
 * Public API v1 Proxy
 * Routes requests from api.myrbw.dev to the database API
 * 
 * This is a secure proxy that:
 * 1. Validates API keys
 * 2. Forwards requests to the database API
 * 3. Returns responses to clients
 * 
 * The database API URL is never exposed to clients
 */

import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  return NextResponse.json({
    status: "ok",
    version: "v1",
    endpoints: {
      guilds: "/v1/guilds/{guildId}/...",
      docs: "https://docs.myrbw.dev/api",
    },
  });
}

export async function OPTIONS(req: NextRequest) {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization, X-API-Key",
    },
  });
}