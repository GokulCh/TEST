/**
 * POST /api/auth/session/player-appearance
 * Updates player appearance configuration in the session state.
 *
 * Request body:
 *   guildId: string - The guild ID to associate the appearance with
 *   playerAppearance: { nickname: string | null, embed_color: string }
 */
import { NextRequest, NextResponse } from "next/server";
import { getSession, setSession } from "@/lib/session";
import type { SessionData, PlayerAppearanceConfig } from "@/lib/db-types";

export async function POST(req: NextRequest) {
	try {
		const session = await getSession();
		if (!session) {
			return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
		}

		const body = await req.json();
		const { guildId, playerAppearance } = body;

		if (!guildId || !playerAppearance) {
			return NextResponse.json({ error: "Missing guildId or playerAppearance" }, { status: 400 });
		}

		// Validate player appearance structure
		const appearance: PlayerAppearanceConfig = {
			nickname: playerAppearance.nickname || null,
			embed_color: playerAppearance.embed_color || "#5865F2",
		};

		// Initialize playerAppearance if it doesn't exist
		const updatedSession: SessionData = {
			...session,
			playerAppearance: {
				...(session.playerAppearance || {}),
				[guildId]: appearance,
			},
		};

		// Update session
		await setSession(updatedSession);

		return NextResponse.json({ success: true });
	} catch (error) {
		console.error("[player-appearance POST]", error);
		return NextResponse.json({ error: "Failed to update player appearance" }, { status: 500 });
	}
}
