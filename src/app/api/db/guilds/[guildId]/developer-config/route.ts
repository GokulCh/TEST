import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/requireInternalAuth";

const DEVELOPER_USER_ID = "716417561008275497";

export async function GET(
	req: NextRequest,
	{ params }: { params: Promise<{ guildId: string }> }
) {
	try {
		const session = await requireAuth();
		
		// Check if user is the authorized developer
		if (session.userId !== DEVELOPER_USER_ID) {
			return NextResponse.json(
				{ error: "Unauthorized - Developer access required" },
				{ status: 403 }
			);
		}

		const { guildId } = await params;
		
		// Fetch developer configuration from the database API
		const dbApiUrl = process.env.NEXT_PUBLIC_DB_API_URL;
		if (!dbApiUrl) {
			// Return default empty config if DB API URL is not configured
			return NextResponse.json({
				data: {
					update_logs: [],
					page_configs: [],
					category_configs: [],
				}
			});
		}

		const response = await fetch(`${dbApiUrl}/v1/guilds/${guildId}/developer-config`, {
			method: "GET",
			headers: {
				"Content-Type": "application/json",
			},
		});

		if (!response.ok) {
			// If not found, return default empty config
			if (response.status === 404) {
				return NextResponse.json({
					data: {
						update_logs: [],
						page_configs: [],
						category_configs: [],
					}
				});
			}
			throw new Error(`Failed to fetch developer config: ${response.statusText}`);
		}

		const data = await response.json();
		return NextResponse.json(data);
	} catch (error) {
		console.error("Error fetching developer config:", error);
		return NextResponse.json(
			{ error: "Failed to fetch developer configuration" },
			{ status: 500 }
		);
	}
}

export async function PUT(
	req: NextRequest,
	{ params }: { params: Promise<{ guildId: string }> }
) {
	try {
		const session = await requireAuth();
		
		// Check if user is the authorized developer
		if (session.userId !== DEVELOPER_USER_ID) {
			return NextResponse.json(
				{ error: "Unauthorized - Developer access required" },
				{ status: 403 }
			);
		}

		const { guildId } = await params;
		const body = await req.json();

		// Update developer configuration via the database API
		const dbApiUrl = process.env.NEXT_PUBLIC_DB_API_URL;
		if (!dbApiUrl) {
			return NextResponse.json(
				{ error: "Database API URL not configured" },
				{ status: 500 }
			);
		}

		const response = await fetch(`${dbApiUrl}/v1/guilds/${guildId}/developer-config`, {
			method: "PUT",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify(body),
		});

		if (!response.ok) {
			throw new Error(`Failed to update developer config: ${response.statusText}`);
		}

		const data = await response.json();
		return NextResponse.json(data);
	} catch (error) {
		console.error("Error updating developer config:", error);
		return NextResponse.json(
			{ error: "Failed to update developer configuration" },
			{ status: 500 }
		);
	}
}