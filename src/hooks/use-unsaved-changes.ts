"use client";

/**
 * useUnsavedChanges
 *
 * Compares a page's local (edited) state against the last-saved (DB) state
 * and automatically calls markDirty / markClean on the global context whenever
 * the comparison flips.
 *
 * Usage in a page:
 *
 *   const { isDirty } = useUnsavedChanges(localState, savedState);
 *
 * - localState  — the live, user-edited value (one object covering all fields, or
 *                 pass an array of values if your page has multiple independent state
 *                 variables: useUnsavedChanges([a, b, c], [savedA, savedB, savedC]))
 * - savedState  — the reference value to compare against (typically from the DB /
 *                 context). Pass null / undefined while loading to suppress dirty
 *                 detection until the saved value is known.
 *
 * The hook also exposes `resetDirty()` which pages can call after a successful save
 * if they handle markClean themselves (config-provider already calls markClean via
 * the context, so most pages don't need this).
 *
 * Deep equality is performed with JSON.stringify — sufficient for plain config
 * objects and arrays of primitives. For cyclic or non-serialisable values, swap in
 * a proper deep-equal library.
 */

import { useEffect, useId } from "react";
import { useUnsavedChangesContext } from "@/lib/contexts/changes-context";

function deepEqual(a: unknown, b: unknown): boolean {
	// Fast-path: same reference or both nullish
	if (a === b) return true;
	if (a == null || b == null) return a === b;
	try {
		return JSON.stringify(a) === JSON.stringify(b);
	} catch {
		return false;
	}
}

interface UseUnsavedChangesResult {
	/** Mirror of the global isDirty — useful for page-local UI (e.g. highlighting save button) */
	isDirty: boolean;
	/**
	 * Manually mark the page as clean. Normally not needed — config-provider
	 * calls markClean after a successful save. Useful for pages that manage
	 * their own save logic outside of config-provider.
	 */
	resetDirty: () => void;
}

export function useUnsavedChanges(
	localState: unknown,
	savedState: unknown,
): UseUnsavedChangesResult {
	const { isDirty, markDirty, markClean } = useUnsavedChangesContext();
	const sourceId = useId();

	useEffect(() => {
		// Don't fire dirty detection until the saved state is loaded from DB.
		// Pass null / undefined while loading to suppress dirty detection until
		// the saved value is known (matches the hook's documented contract and
		// prevents a false "unsaved changes" flash on page load).
		if (savedState == null) {
			return;
		}

		if (deepEqual(localState, savedState)) {
			markClean(sourceId);
		} else {
			markDirty(sourceId);
		}
	}, [localState, savedState, sourceId, markDirty, markClean]);

	// When the component unmounts (page navigation), clean up dirty state so
	// the next page doesn't inherit a stale dirty flag.
	useEffect(() => {
		const handleDiscard = () => {
			// Local editor state is owned by each page. Reloading the current route
			// restores every editor from its persisted server snapshot, including
			// controlled inputs that do not expose a shared reset action.
			window.location.reload();
		};
		window.addEventListener("dashboard:discard-changes", handleDiscard);
		return () => {
			window.removeEventListener("dashboard:discard-changes", handleDiscard);
			markClean(sourceId);
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	return {
		isDirty,
		resetDirty: () => markClean(sourceId),
	};
}
