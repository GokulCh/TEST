"use client";

import { useEffect } from "react";
import { RotateCcw, Save } from "lucide-react";
import { Button } from "@/components/panel/form-parts";
import { useUnsavedChangesContext } from "@/lib/contexts/changes-context";

/** Floating bar that appears while the page has unsaved edits. Ctrl/Cmd+S saves. */
export function SaveBar() {
	const { isDirty, discardChanges, saveAction } = useUnsavedChangesContext();
	const run = saveAction?.run;

	useEffect(() => {
		if (!isDirty || !run) return;
		const onKey = (e: KeyboardEvent) => {
			if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
				e.preventDefault();
				run();
			}
		};
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	}, [isDirty, run]);

	if (!isDirty) return null;

	return (
		<div
			role="region"
			aria-label="Unsaved changes"
			className="motion-bar fixed bottom-5 left-1/2 z-[1020] flex w-[calc(100%-2rem)] max-w-xl items-center justify-between gap-3 rounded-2xl border border-warning/30 bg-panel-bg/90 px-4 py-2.5 shadow-2xl backdrop-blur-md lg:left-[calc(50%+8rem)]"
		>
			<div className="flex min-w-0 items-center gap-2.5">
				<span className="relative flex size-2 shrink-0">
					<span className="absolute inline-flex size-full animate-ping rounded-full bg-warning opacity-70" />
					<span className="relative inline-flex size-2 rounded-full bg-warning" />
				</span>
				<p className="truncate text-[13px] font-medium text-fg-default">Unsaved changes</p>
			</div>
			<div className="flex shrink-0 items-center gap-2">
				<Button variant="ghost" size="sm" onClick={discardChanges} disabled={saveAction?.saving} icon={<RotateCcw className="size-3.5" />}>
					Discard
				</Button>
				{saveAction && (
					<Button variant="primary" size="sm" onClick={saveAction.run} loading={saveAction.saving} icon={<Save className="size-3.5" />}>
						{saveAction.saving ? "Saving…" : "Save"}
					</Button>
				)}
			</div>
		</div>
	);
}
