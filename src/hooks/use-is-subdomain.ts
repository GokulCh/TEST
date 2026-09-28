"use client";

import { useEffect, useState } from "react";

import { isSubdomain as isGuildSubdomain } from "@/lib/routing-utils";

/**
 * Whether the app is being served from a per-guild subdomain (prbw.myrbw.dev)
 * rather than the apex domain.
 *
 * The apex — including its `www.` alias — puts the guild in the path
 * (/dashboard/<guildId>). Subdomains carry the guild in the hostname and use
 * clean URLs (/dashboard). Getting this backwards sends every sidebar link to
 * the wrong place, so the decision lives in `isSubdomain` and is read here only
 * in the browser, where `window` exists.
 *
 * Returns `false` on the server and on the first client render, then settles to
 * the real value. `suppressHydrationWarning` on the consuming subtree covers the
 * one-render difference.
 */
export function useIsSubdomain(): boolean {
	const [value, setValue] = useState(false);

	useEffect(() => {
		setValue(isGuildSubdomain(window.location.host));
	}, []);

	return value;
}
