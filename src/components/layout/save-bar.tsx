"use client";

import { useUnsavedChangesContext } from "@/lib/contexts/changes-context";
import { AlertTriangle, CheckCircle2, RotateCcw } from "lucide-react";

export function SaveBar() {
	const { isDirty, discardChanges } = useUnsavedChangesContext();

	return (
		<div
			className={`fixed bottom-0 left-0 right-0 z-sticky border-t backdrop-blur-md px-6 py-3 select-none ${
				isDirty
					? "bg-warning/10 border-warning/30"
					: "bg-panel-bg/40 border-border-subtle"
			}`}
		>
			<div className="mx-auto flex max-w-7xl items-center justify-between">
				{isDirty ? (
					<>
						{/* LEFT: unsaved changes indicator */}
						<div className="flex items-center gap-2.5">
							<span className="relative flex size-2.5">
								<span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-warning opacity-75" />
								<span className="relative inline-flex rounded-full size-2.5 bg-warning" />
							</span>
							<p className="font-mono text-[10px] font-bold uppercase tracking-wider text-warning">
								Unsaved Changes // Commit Required
							</p>
						</div>

						{/* RIGHT: prominent warning badge */}
						<div className="flex items-center gap-3">
							<button
								type="button"
								onClick={discardChanges}
								className="inline-flex items-center gap-1.5 rounded-lg border border-border-subtle bg-panel-bg px-3 py-1.5 font-mono text-[10px] font-bold uppercase tracking-widest text-fg-muted transition-colors hover:border-danger/50 hover:text-danger"
							>
								<RotateCcw className="size-3.5" />
								Discard Changes
							</button>
							<div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-warning/15 border border-warning/40 text-warning text-[10px] font-mono font-bold uppercase tracking-widest">
								<AlertTriangle className="size-3.5 shrink-0" />
								Changes Not Saved
							</div>
							<div className="hidden sm:block font-mono text-[9px] tracking-widest text-warning/60 uppercase">
								// save before navigating
							</div>
						</div>
					</>
				) : (
					<>
						{/* LEFT: all clear */}
						<div className="flex items-center gap-2">
							<span className="relative flex size-2">
								<span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75" />
								<span className="relative inline-flex rounded-full size-2 bg-success" />
							</span>
							<p className="font-mono text-[10px] font-bold uppercase tracking-wider text-fg-muted">
								Telemetry Core // Auto-Sync Enabled
							</p>
						</div>

						{/* RIGHT: synced badge */}
						<div className="flex items-center gap-4">
							<div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-success/10 border border-success/20 text-success text-[10px] font-mono font-bold uppercase tracking-widest">
								<CheckCircle2 className="size-3.5" />
								Matrix Synchronized
							</div>
							<div className="hidden sm:block font-mono text-[9px] tracking-widest text-fg-muted/60 uppercase">
								// block.v2.committed
							</div>
						</div>
					</>
				)}
			</div>
		</div>
	);
}
