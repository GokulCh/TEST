"use client";

import type { ReactNode } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";

/** Form dialog: focus-trapped, closes on Escape / overlay click. Controlled via `open` and `onClose`. */
export function Modal({
	open,
	title,
	description,
	onClose,
	footer,
	children,
}: {
	open: boolean;
	title: string;
	description?: string;
	onClose: () => void;
	footer?: ReactNode;
	children: ReactNode;
}) {
	return (
		<Dialog.Root open={open} onOpenChange={(o) => !o && onClose()}>
			<Dialog.Portal>
				<Dialog.Overlay data-slot="overlay" className="fixed inset-0 z-[9998] bg-bg-canvas/70 backdrop-blur-sm" />
				<Dialog.Content
					data-slot="dialog"
					className="fixed left-1/2 top-1/2 z-[9999] flex max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-2xl border border-border-subtle bg-panel-bg shadow-2xl focus:outline-none"
				>
					<div className="flex items-start justify-between gap-4 border-b border-border-subtle/60 px-5 py-4">
						<div className="min-w-0 text-left">
							<Dialog.Title className="text-base font-semibold tracking-tight text-fg-default">{title}</Dialog.Title>
							<Dialog.Description className={description ? "mt-0.5 text-xs text-fg-muted" : "sr-only"}>{description ?? title}</Dialog.Description>
						</div>
						<Dialog.Close aria-label="Close" className="flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-lg text-fg-muted transition-colors hover:bg-panel-bg hover:text-fg-default">
							<X className="size-4" />
						</Dialog.Close>
					</div>
					<div className="space-y-4 overflow-y-auto px-5 py-4 text-left">{children}</div>
					{footer && <div className="flex flex-col-reverse gap-2 border-t border-border-subtle/60 bg-bg-canvas/30 px-5 py-3 sm:flex-row sm:justify-end">{footer}</div>}
				</Dialog.Content>
			</Dialog.Portal>
		</Dialog.Root>
	);
}
