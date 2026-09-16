"use client";

/**
 * UnsavedChangesContext
 *
 * Tracks whether any page in the dashboard has unsaved changes ("dirty" state).
 * Provides:
 *   - isDirty          — true when there are unsaved changes
 *   - markDirty()      — call when the user modifies a field
 *   - markClean()      — call after a successful save (or discard)
 *   - pendingHref      — the navigation target the user tried to visit while dirty
 *   - requestNavigation(href) — intercepts a link click; shows the guard dialog if dirty
 *   - confirmNavigation()     — user chose "Discard & Leave"
 *   - cancelNavigation()      — user chose "Stay on Page"
 *
 * The SaveBar and Sidebar both consume this context. Pages call markDirty/markClean
 * via the useUnsavedChanges hook.
 */

import React, {
	createContext,
	useCallback,
	useContext,
	useEffect,
	useRef,
	useState,
} from "react";
import { useRouter } from "next/navigation";

interface UnsavedChangesContextValue {
	isDirty: boolean;
	markDirty: () => void;
	markClean: () => void;
	/** href the user attempted to navigate to while dirty; null = no pending nav */
	pendingHref: string | null;
	/** Call from link onClick — returns true if navigation is allowed immediately */
	requestNavigation: (href: string) => boolean;
	/** Confirm discard and execute the pending navigation */
	confirmNavigation: () => void;
	/** Cancel the pending navigation — stay on page */
	cancelNavigation: () => void;
}

const UnsavedChangesContext = createContext<UnsavedChangesContextValue | null>(null);

export function useUnsavedChangesContext(): UnsavedChangesContextValue {
	const ctx = useContext(UnsavedChangesContext);
	if (!ctx)
		throw new Error(
			"useUnsavedChangesContext must be used inside UnsavedChangesProvider",
		);
	return ctx;
}

// ── Provider ──────────────────────────────────────────────────────────────────

interface Props {
	children: React.ReactNode;
}

export function UnsavedChangesProvider({ children }: Props) {
	const router = useRouter();
	const [isDirty, setIsDirty] = useState(false);
	const [pendingHref, setPendingHref] = useState<string | null>(null);

	// Keep a ref so the beforeunload handler is always current
	const isDirtyRef = useRef(isDirty);
	useEffect(() => {
		isDirtyRef.current = isDirty;
	}, [isDirty]);

	// ── Browser tab / refresh guard ──────────────────────────────────────
	useEffect(() => {
		const handler = (e: BeforeUnloadEvent) => {
			if (!isDirtyRef.current) return;
			e.preventDefault();
			// Most browsers show a generic message; setting returnValue triggers it
			e.returnValue = "";
		};
		window.addEventListener("beforeunload", handler);
		return () => window.removeEventListener("beforeunload", handler);
	}, []);

	const markDirty = useCallback(() => setIsDirty(true), []);
	const markClean = useCallback(() => {
		setIsDirty(false);
		setPendingHref(null);
	}, []);

	/**
	 * Returns true if navigation can proceed immediately (not dirty).
	 * Returns false and records the target href when dirty (triggers guard dialog).
	 */
	const requestNavigation = useCallback(
		(href: string): boolean => {
			if (!isDirtyRef.current) return true;
			setPendingHref(href);
			return false;
		},
		[],
	);

	const confirmNavigation = useCallback(() => {
		const target = pendingHref;
		setIsDirty(false);
		setPendingHref(null);
		if (target) router.push(target);
	}, [pendingHref, router]);

	const cancelNavigation = useCallback(() => {
		setPendingHref(null);
	}, []);

	return (
		<UnsavedChangesContext.Provider
			value={{
				isDirty,
				markDirty,
				markClean,
				pendingHref,
				requestNavigation,
				confirmNavigation,
				cancelNavigation,
			}}
		>
			{children}
		</UnsavedChangesContext.Provider>
	);
}
