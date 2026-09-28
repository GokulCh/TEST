"use client";

/**
 * Data access for pages under a guild dashboard. Reads go through SWR (one
 * shared cache: two components asking for the same path share one request);
 * writes go through `useGuildWrite`. Paths are relative to
 * /api/db/guilds/{dbGuildId}/, e.g. "strikes?limit=200".
 */

import { useCallback, useMemo } from "react";
import useSWR, { type SWRConfiguration } from "swr";
import { useGuildConfig } from "@/features/dashboard/config-provider";
import { useSectionForm } from "@/hooks/use-section-form";
import { apiSend, fetchData } from "@/lib/client/api";

/** Pages edit what they read, so nothing refetches behind an open editor. */
const READ: SWRConfiguration = { revalidateOnFocus: false, revalidateOnReconnect: false };

/** `data` is undefined while loading; pass `null` as `path` to hold the request back. */
export function useGuildData<T>(path: string | null, config?: SWRConfiguration<T>) {
	const { dbGuildId } = useGuildConfig();
	return useSWR<T>(dbGuildId && path ? `/api/db/guilds/${dbGuildId}/${path}` : null, fetchData, { ...READ, ...config });
}

/** `write("PUT", "loggers", { loggers })` -> the route's JSON response. */
export function useGuildWrite() {
	const { dbGuildId } = useGuildConfig();
	return useCallback(
		<T = { ok: true }>(method: "POST" | "PUT" | "PATCH" | "DELETE", path: string, body?: unknown) => {
			if (!dbGuildId) throw new Error("Guild DB ID not resolved yet");
			return apiSend<T>(method, `/api/db/guilds/${dbGuildId}/${path}`, body);
		},
		[dbGuildId],
	);
}

/**
 * A value kept at its own panel route (`loggers`, `giveaways`, ...): loads it,
 * edits a copy, and PUTs `{ [bodyKey]: value }` back. `normalize` turns the
 * stored value (null when never saved) into the editable shape.
 */
export function useGuildResourceForm<T>(path: string, bodyKey: string, empty: T, normalize?: (stored: T | null) => T) {
	const { data, isLoading, error, mutate } = useGuildData<T | null>(path);
	const write = useGuildWrite();
	const saved = useMemo(() => (data === undefined ? null : normalize ? normalize(data) : (data ?? empty)), [data]); // eslint-disable-line react-hooks/exhaustive-deps
	const form = useSectionForm<T>(saved, empty, async (value) => {
		await write("PUT", path, { [bodyKey]: value });
		await mutate(value, { revalidate: false });
	});
	return { ...form, isLoading, loadError: error ? (error instanceof Error ? error.message : "Failed to load") : null };
}
