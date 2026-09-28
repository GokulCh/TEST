"use client";

/**
 * DashboardShell
 *
 * Client-side wrapper for the dashboard layout. It owns:
 *   - UnsavedChangesProvider  (context for dirty state)
 *   - SaveBar                 (floating save / discard bar while dirty)
 *   - NavigationGuardDialog   (confirm shown when user tries to leave a dirty page)
 *
 * The parent layout.tsx is a Server Component so it cannot import context
 * providers directly — this component is the client boundary.
 */

import { UnsavedChangesProvider, useUnsavedChangesContext } from "@/lib/contexts/changes-context";
import { SaveBar } from "@/components/layout/save-bar";
import { ConfirmDialog } from "@/components/panel/confirm-dialog";
import { AlertTriangle, X } from "lucide-react";
import React from "react";

function NavigationGuardDialog() {
	const { pendingHref, confirmNavigation, cancelNavigation } = useUnsavedChangesContext();
	return (
		<ConfirmDialog
			open={!!pendingHref}
			tone="warning"
			title="Leave without saving?"
			confirmLabel="Discard & leave"
			cancelLabel="Stay on page"
			onConfirm={confirmNavigation}
			onCancel={cancelNavigation}
		>
			You have unsaved changes on this page. Leaving now discards them.
		</ConfirmDialog>
	);
}

export function DashboardShell({ children }: { children: React.ReactNode }) {
	const [showMobileNotice, setShowMobileNotice] = React.useState(true);

	return (
		<UnsavedChangesProvider>
			{showMobileNotice && (
				<div className="motion-fade mx-3 mt-3 flex items-start gap-3 rounded-xl border border-warning/25 bg-warning/10 px-4 py-3 text-warning md:hidden" role="status">
					<AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
					<div className="min-w-0 flex-1 text-left">
						<p className="text-[13px] font-semibold">Best on a larger screen</p>
						<p className="mt-0.5 text-xs leading-5 text-fg-muted">The dashboard works on mobile, but a desktop browser gives the clearest view of configuration panels.</p>
					</div>
					<button type="button" onClick={() => setShowMobileNotice(false)} className="cursor-pointer rounded-md p-1 text-warning/70 transition-colors hover:bg-warning/10 hover:text-warning" aria-label="Dismiss notice">
						<X className="size-4" aria-hidden="true" />
					</button>
				</div>
			)}
			{children}
			<SaveBar />
			<NavigationGuardDialog />
		</UnsavedChangesProvider>
	);
}
