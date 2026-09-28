"use client";

import useSWR from "swr";
import { fetchData } from "@/lib/client/api";
import type { DeveloperConfig } from "@/lib/db-types";

/**
 * The guild's developer config (page/category switches; update logs for the
 * developer only). Keyed by the guild id of the URL so the sidebar, the
 * access guard and the developer console share one request and one cache.
 */
export function useDeveloperConfig(guildId: string | undefined) {
	return useSWR<DeveloperConfig>(guildId ? `/api/db/guilds/${guildId}/developer-config` : null, fetchData, { revalidateOnFocus: false });
}
