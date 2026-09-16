import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/requireInternalAuth";
import { dbApi } from "@/lib/api-client";

type Params = { params: Promise<{ guildId: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
	try {
		await requireAuth();
	} catch (err) {
		return err as Response;
	}

	const { guildId } = await params;

	try {
		const snapshot = await dbApi.guilds.getSnapshot(guildId);
		return NextResponse.json({ data: snapshot });
	} catch (err: unknown) {
		const status =
			err && typeof err === "object" && "status" in err
				? (err as { status: number }).status
				: 500;
		return NextResponse.json(
			{ error: "Failed to fetch snapshot" },
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

	let body: any;
	try {
		body = await req.json();
	} catch {
		return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
	}

	try {
		await dbApi.guilds.saveSnapshotState(guildId, body);
		return NextResponse.json({ ok: true });
	} catch (err: unknown) {
		console.error("Error updating snapshot:", err);
		const status =
			err && typeof err === "object" && "status" in err
				? (err as { status: number }).status
				: 500;
		return NextResponse.json(
			{ error: "Failed to update snapshot" },
			{ status },
		);
	}
}