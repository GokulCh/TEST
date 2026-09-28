"use client";

import type { ReactNode } from "react";
import { AlertTriangle, ArrowRight } from "lucide-react";
import { Button } from "@/components/panel/form-parts";
import type { UseTabGuardResult } from "@/hooks/use-tab-guard";

export interface GuardedTab<T extends string> {
	key: T;
	/** Plain-text name, used in the unsaved-changes warning. */
	title: string;
	/** What the tab button shows (defaults to `title`). */
	label?: ReactNode;
}

/**
 * Tab strip whose switches go through `useTabGuard`: a tab with unsaved edits
 * shows a dot, and leaving it asks to stay or discard first.
 */
export function GuardedTabs<T extends string>({ tabs, active, guard }: { tabs: GuardedTab<T>[]; active: T; guard: UseTabGuardResult<T> }) {
	return (
		<>
			<div role="tablist" className="flex gap-1 overflow-x-auto border-b border-border-subtle/60">
				{tabs.map((tab) => (
					<button
						key={tab.key}
						type="button"
						role="tab"
						aria-selected={active === tab.key}
						onClick={() => guard.requestTabSwitch(tab.key)}
						className={`relative -mb-px flex cursor-pointer items-center gap-2 whitespace-nowrap border-b-2 px-4 py-2.5 text-[13px] font-medium transition-colors duration-150 ${
							active === tab.key ? "border-primary-500 text-primary-500" : "border-transparent text-fg-muted hover:text-fg-default"
						}`}
					>
						{tab.label ?? tab.title}
						{guard.isTabDirty(tab.key) && <span className="size-1.5 shrink-0 rounded-full bg-warning" title="Unsaved changes" />}
					</button>
				))}
			</div>

			{guard.pendingTab && (
				<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border border-warning/30 bg-warning/10 motion-fade">
					<div className="flex items-center gap-3">
						<AlertTriangle className="size-4 text-warning shrink-0" />
						<div className="text-left">
							<p className="text-[13px] font-semibold text-warning">
								Unsaved changes in &ldquo;{tabs.find((t) => t.key === active)?.title}&rdquo;
							</p>
							<p className="mt-0.5 text-xs text-warning/80">Save or discard before switching tabs.</p>
						</div>
					</div>
					<div className="flex shrink-0 items-center gap-2">
						<Button variant="secondary" size="sm" onClick={guard.cancelTabSwitch}>Stay</Button>
						<Button variant="warning" size="sm" onClick={guard.confirmTabSwitch} icon={<ArrowRight className="size-3" />}>Discard &amp; switch</Button>
					</div>
				</div>
			)}
		</>
	);
}
