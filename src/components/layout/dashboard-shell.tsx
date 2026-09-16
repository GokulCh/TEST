"use client";

/**
 * DashboardShell
 *
 * Client-side wrapper for the dashboard layout. It owns:
 *   - UnsavedChangesProvider  (context for dirty state)
 *   - SaveBar                 (wired to isDirty)
 *   - NavigationGuardDialog   (modal shown when user tries to leave a dirty page)
 *
 * The parent layout.tsx is a Server Component so it cannot import context
 * providers directly — this component is the client boundary.
 */

import { UnsavedChangesProvider, useUnsavedChangesContext } from "@/lib/contexts/changes-context";
import { SaveBar } from "@/components/layout/save-bar";
import { AlertTriangle, ArrowRight, X } from "lucide-react";
import React from "react";

// ── Navigation Guard Dialog ────────────────────────────────────────────────

function NavigationGuardDialog() {
	const { pendingHref, confirmNavigation, cancelNavigation } =
		useUnsavedChangesContext();

	if (!pendingHref) return null;

	return (
		<>
			{/* Backdrop */}
			<div
				className="fixed inset-0 z-[9998] bg-bg-canvas/70 backdrop-blur-sm motion-fade"
				onClick={cancelNavigation}
			/>

			{/* Dialog panel */}
			<div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 pointer-events-none">
				<div className="pointer-events-auto w-full max-w-sm border border-border-subtle bg-panel-bg backdrop-blur-md rounded-2xl shadow-2xl motion-modal overflow-hidden">
					{/* Header stripe */}
					<div className="flex items-start justify-between gap-3 px-5 pt-5 pb-4 border-b border-border-subtle/50">
						<div className="flex items-center gap-3">
							<span className="flex items-center justify-center size-9 rounded-xl bg-warning/10 border border-warning/20 shrink-0">
								<AlertTriangle className="size-4 text-warning" />
							</span>
							<div className="text-left">
								<p className="font-mono text-[10px] font-bold uppercase tracking-widest text-fg-muted">
									// unsaved_changes_detected
								</p>
								<h2 className="font-black text-base text-fg-default tracking-tight mt-0.5">
									Unsaved Changes
								</h2>
							</div>
						</div>
						<button
							onClick={cancelNavigation}
							className="size-7 flex items-center justify-center rounded-lg text-fg-muted hover:text-fg-default hover:bg-panel-bg/60 transition-colors cursor-pointer shrink-0"
						>
							<X className="size-4" />
						</button>
					</div>

					{/* Body */}
					<div className="px-5 py-4 text-left space-y-1">
						<p className="text-sm text-fg-default leading-relaxed">
							You have unsaved changes on this page. Leaving now will discard them permanently.
						</p>
						<p className="font-mono text-[10px] text-fg-muted uppercase tracking-wide">
							This action cannot be undone.
						</p>
					</div>

					{/* Actions */}
					<div className="px-5 pb-5 flex flex-col sm:flex-row gap-2 sm:justify-end">
						{/* Stay */}
						<button
							onClick={cancelNavigation}
							className="h-9 px-4 font-mono font-bold text-[11px] uppercase tracking-wider rounded-lg border border-border-subtle bg-panel-bg/40 text-fg-default hover:bg-panel-bg hover:border-border-subtle/80 transition-all active:scale-98 cursor-pointer"
						>
							Stay on Page
						</button>

						{/* Discard & leave */}
						<button
							onClick={confirmNavigation}
							className="h-9 px-4 font-mono font-bold text-[11px] uppercase tracking-wider rounded-lg border border-danger/30 bg-danger/10 text-danger hover:bg-danger/20 hover:border-danger/50 transition-all active:scale-98 cursor-pointer flex items-center gap-2"
						>
							Discard & Leave
							<ArrowRight className="size-3.5" />
						</button>
					</div>
				</div>
			</div>
		</>
	);
}

// ── Shell ──────────────────────────────────────────────────────────────────

interface DashboardShellProps {
	children: React.ReactNode;
}

/**
 * Wrap this around the inner content of the dashboard layout so that
 * UnsavedChangesProvider and the guard dialog are available to all children.
 */
export function DashboardShell({ children }: DashboardShellProps) {
	return (
		<UnsavedChangesProvider>
			{children}
			<SaveBar />
			<NavigationGuardDialog />
		</UnsavedChangesProvider>
	);
}
