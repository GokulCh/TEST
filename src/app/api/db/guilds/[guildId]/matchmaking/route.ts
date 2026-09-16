/**
 * /api/db/guilds/[guildId]/matchmaking
 *
 * GET  → returns { queues: QueueConfig[] }
 * PUT  → saves queue architecture; body: { queues: QueueConfig[] }
 *
 * [guildId] is the DATABASE integer ID (string).
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/requireInternalAuth";
import { dbApi } from "@/lib/api-client";
import type { QueueConfig } from "@/lib/db-types";

type Params = { params: Promise<{ guildId: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    await requireAuth();
  } catch (err) {
    return err as Response;
  }

  const { guildId } = await params;

  try {
    const queues = await dbApi.matchmaking.getQueues(guildId);
    return NextResponse.json({ data: { queues } });
  } catch (err: unknown) {
    const status =
      err && typeof err === "object" && "status" in err
        ? (err as { status: number }).status
        : 500;
    return NextResponse.json(
      { error: "Failed to fetch matchmaking config" },
      { status },
    );
  }
}

export async function PUT(req: NextRequest, { params }: Params) {
  try {
    await requireAuth();
  } catch (err) {
    return err as Response;
  }

  const { guildId } = await params;

  let body: { queues: QueueConfig[] };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  try {
    await dbApi.matchmaking.saveQueues(guildId, body.queues);
    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    console.error("[matchmaking PUT]", err);
    const status =
      err && typeof err === "object" && "status" in err
        ? (err as { status: number }).status
        : 500;
    return NextResponse.json(
      { error: "Failed to save queues" },
      { status },
    );
  }
}
