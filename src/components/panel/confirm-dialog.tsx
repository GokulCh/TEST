"use client";

import type { ReactNode } from "react";
import * as AlertDialog from "@radix-ui/react-alert-dialog";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/panel/form-parts";

/**
 * Themed replacement for window.confirm: focus-trapped, closes on Escape.
 * Controlled: render it with `open` and handle `onConfirm` / `onCancel`.
 */
export function ConfirmDialog({
	open,
	title,
	children,
	confirmLabel = "Confirm",
	cancelLabel = "Cancel",
	tone = "danger",
	busy,
	onConfirm,
	onCancel,
}: {
	open: boolean;
	title: string;
	children?: ReactNode;
	confirmLabel?: string;
	cancelLabel?: string;
	tone?: "danger" | "warning";
	busy?: boolean;
	onConfirm: () => void;
	onCancel: () => void;
}) {
	return (
		<AlertDialog.Root open={open} onOpenChange={(o) => !o && !busy && onCancel()}>
			<AlertDialog.Portal>
				<AlertDialog.Overlay data-slot="overlay" className="fixed inset-0 z-[9998] bg-bg-canvas/70 backdrop-blur-sm" />
				<AlertDialog.Content
					data-slot="dialog"
					className="fixed left-1/2 top-1/2 z-[9999] w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-2xl border border-border-subtle bg-panel-bg shadow-2xl focus:outline-none"
				>
					<div className="flex gap-3.5 p-5">
						<span className={`flex size-9 shrink-0 items-center justify-center rounded-xl border ${tone === "danger" ? "border-danger/25 bg-danger/10 text-danger" : "border-warning/25 bg-warning/10 text-warning"}`}>
							<AlertTriangle className="size-4" />
						</span>
						<div className="min-w-0 space-y-1 text-left">
							<AlertDialog.Title className="text-base font-semibold tracking-tight text-fg-default">{title}</AlertDialog.Title>
							<AlertDialog.Description asChild>
								<div className="text-sm leading-relaxed text-fg-muted">{children}</div>
							</AlertDialog.Description>
						</div>
					</div>
					<div className="flex flex-col-reverse gap-2 border-t border-border-subtle/60 bg-bg-canvas/30 px-5 py-3 sm:flex-row sm:justify-end">
						<AlertDialog.Cancel asChild>
							<Button variant="secondary" disabled={busy}>{cancelLabel}</Button>
						</AlertDialog.Cancel>
						<Button variant={tone === "danger" ? "danger" : "warning"} loading={busy} onClick={onConfirm}>
							{confirmLabel}
						</Button>
					</div>
				</AlertDialog.Content>
			</AlertDialog.Portal>
		</AlertDialog.Root>
	);
}
