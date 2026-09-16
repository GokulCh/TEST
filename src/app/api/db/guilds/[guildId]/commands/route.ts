/**
 * /api/db/guilds/[guildId]/commands
 *
 * GET  → returns commands for the guild
 * PUT  → saves commands for the guild
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/requireInternalAuth";
import { dbApi } from "@/lib/api-client";
import type { GuildCommandsMap } from "@/lib/db-types";

type Params = { params: Promise<{ guildId: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
	try {
		await requireAuth();
	} catch (err) {
		return err as Response;
	}

	const { guildId } = await params;

	try {
		const commands = await dbApi.guildConfig.getCommands(guildId);
		return NextResponse.json({ data: commands });
	} catch (err: unknown) {
		const status =
			err && typeof err === "object" && "status" in err
				? (err as { status: number }).status
				: 500;
		return NextResponse.json(
			{ error: "Failed to fetch commands" },
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

	let body: { commands: unknown };
	try {
		body = await req.json();
	} catch {
		return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
	}

	const { commands } = body;

	try {
		await dbApi.guildConfig.saveCommands(guildId, commands as GuildCommandsMap);
		return NextResponse.json({ success: true });
	} catch (err: unknown) {
		const status =
			err && typeof err === "object" && "status" in err
				? (err as { status: number }).status
				: 500;
		return NextResponse.json(
			{ error: "Failed to save commands" },
			{ status },
		);
	}
}
