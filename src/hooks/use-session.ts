"use client";

import useSWR from "swr";
import { apiFetch } from "@/lib/client/api";

/** The signed-in user as /api/auth/session returns it (never carries tokens). */
export interface PublicSession {
	userId: string;
	username: string;
	globalName: string | null;
	discriminator: string;
	avatar: string | null;
	avatarUrl: string;
	/** Decided by the server against DEVELOPER_USER_ID. */
	isDeveloper: boolean;
}

/** One shared request for every component that needs the user. */
export function useSession() {
	const { data, isLoading } = useSWR<{ session: PublicSession | null }>("/api/auth/session", apiFetch, {
		revalidateOnFocus: false,
		shouldRetryOnError: false,
	});
	const session = data?.session ?? null;
	return { session, isDeveloper: !!session?.isDeveloper, isLoading };
}
