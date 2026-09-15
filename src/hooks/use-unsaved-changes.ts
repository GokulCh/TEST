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

import { useEffect, useRef } from "react";
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

	// Track whether savedState has been populated at least once
	const savedStateReady = savedState != null;

	// Keep a stable ref to the latest savedState so we don't add it to
	// the effect dep array (we only want to trigger on localState changes
	// once a baseline is established).
	const savedStateRef = useRef(savedState);
	useEffect(() => {
		savedStateRef.current = savedState;
	}, [savedState]);

	useEffect(() => {
		// Don't fire dirty detection until the saved state is loaded from DB
		// UNLESS localState has content while savedState is null (going from nothing to something)
		if (!savedStateReady) {
			// If we have local content but no saved state yet, mark as dirty
			if (localState != null) {
				markDirty();
			}
			return;
		}

		if (deepEqual(localState, savedStateRef.current)) {
			markClean();
		} else {
			markDirty();
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [localState, savedStateReady, markDirty, markClean]);

	// When the component unmounts (page navigation), clean up dirty state so
	// the next page doesn't inherit a stale dirty flag.
	useEffect(() => {
		return () => {
			markClean();
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	return {
		isDirty,
		resetDirty: markClean,
	};
}
