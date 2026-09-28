"use client";

import useSWR from "swr";
import { apiFetch } from "@/lib/client/api";
import type { PanelGuild } from "@/lib/db-types";

/**
 * The Discord servers the signed-in user can manage, with their registration
 * status in the Database API. One shared request; failures retry with backoff.
 */
/** Pass `false` until the user is known to be signed in, so nothing is requested (and retried) before that. */
export function useGuilds(enabled = true) {
	const { data, error, isLoading, mutate } = useSWR<{ guilds?: PanelGuild[] }>(enabled ? "/api/guilds" : null, apiFetch, {
		revalidateOnFocus: false,
		errorRetryCount: 3,
	});
	return { guilds: data?.guilds ?? [], error: error instanceof Error ? error.message : null, isLoading, mutate };
}
