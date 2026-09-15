"use client";

/**
 * useTabGuard
 *
 * Tracks per-tab dirty state and intercepts tab switches when the current
 * tab has unsaved changes.
 *
 * Usage:
 *
 *   const tabGuard = useTabGuard({
 *     activeTab,
 *     setActiveTab,
 *     tabSnapshots: {
 *       core:         { local: coreLocal,   saved: coreSaved   },
 *       appearance:   { local: appLocal,    saved: appSaved    },
 *       verification: { local: verifyLocal, saved: verifySaved },
 *     },
 *   });
 *
 *   // Replace your tab button onClick:
 *   onClick={() => tabGuard.requestTabSwitch("appearance")}
 *
 *   // Render the guard banner above tabs (only shown when blocking):
 *   {tabGuard.guardBanner}
 *
 *   // Check if a specific tab has unsaved changes (for dot indicators):
 *   tabGuard.isTabDirty("core")
 *
 * When the user clicks a tab while the current tab is dirty:
 *   - The switch is blocked and `pendingTab` is recorded.
 *   - `guardBanner` becomes non-null — render it above the tab strip.
 *   - "Discard & Switch" calls `confirmTabSwitch()` — discards current-tab
 *     local state by resetting it to saved, then switches.
 *   - "Stay" calls `cancelTabSwitch()`.
 *
 * Deep equality uses JSON.stringify (same as useUnsavedChanges).
 */

import { useCallback, useMemo, useState } from "react";

function deepEqual(a: unknown, b: unknown): boolean {
	if (a === b) return true;
	if (a == null || b == null) return a === b;
	try {
		return JSON.stringify(a) === JSON.stringify(b);
	} catch {
		return false;
	}
}

export interface TabSnapshot {
	local: unknown;
	saved: unknown;
}

export interface UseTabGuardOptions<T extends string> {
	activeTab: T;
	setActiveTab: (tab: T) => void;
	/** Map of tab key → { local, saved } snapshots for dirty detection */
	tabSnapshots: Partial<Record<T, TabSnapshot>>;
	/**
	 * Optional callback fired when "Discard & Switch" is confirmed.
	 * Use this to reset the current tab's local state back to saved values.
	 * Called with the tab being discarded.
	 */
	onDiscard?: (discardedTab: T) => void;
}

export interface UseTabGuardResult<T extends string> {
	/** Returns true if the given tab has unsaved local changes */
	isTabDirty: (tab: T) => boolean;
	/**
	 * Call this instead of setActiveTab directly.
	 * Blocks the switch and records pendingTab if the current tab is dirty.
	 */
	requestTabSwitch: (target: T) => void;
	/** The tab the user is trying to switch to; null when no switch is pending */
	pendingTab: T | null;
	/** Confirm: discard current-tab changes and switch to pendingTab */
	confirmTabSwitch: () => void;
	/** Cancel: dismiss the guard and stay on the current tab */
	cancelTabSwitch: () => void;
}

export function useTabGuard<T extends string>({
	activeTab,
	setActiveTab,
	tabSnapshots,
	onDiscard,
}: UseTabGuardOptions<T>): UseTabGuardResult<T> {
	const [pendingTab, setPendingTab] = useState<T | null>(null);

	const isTabDirty = useCallback(
		(tab: T): boolean => {
			const snap = tabSnapshots[tab];
			if (!snap) return false;
			// If saved is null but local has content, it's dirty (going from nothing to something)
			if (snap.saved == null && snap.local != null) return true;
			// If local is null but saved has content, it's dirty (going from something to nothing)
			if (snap.local == null && snap.saved != null) return true;
			// If both are null, it's not dirty
			if (snap.saved == null && snap.local == null) return false;
			// Otherwise compare the values
			return !deepEqual(snap.local, snap.saved);
		},
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[tabSnapshots],
	);

	const requestTabSwitch = useCallback(
		(target: T) => {
			if (target === activeTab) return;
			if (isTabDirty(activeTab)) {
				setPendingTab(target);
			} else {
				setActiveTab(target);
			}
		},
		[activeTab, isTabDirty, setActiveTab],
	);

	const confirmTabSwitch = useCallback(() => {
		if (!pendingTab) return;
		onDiscard?.(activeTab);
		setActiveTab(pendingTab);
		setPendingTab(null);
	}, [pendingTab, activeTab, onDiscard, setActiveTab]);

	const cancelTabSwitch = useCallback(() => {
		setPendingTab(null);
	}, []);

	return {
		isTabDirty,
		requestTabSwitch,
		pendingTab,
		confirmTabSwitch,
		cancelTabSwitch,
	};
}
