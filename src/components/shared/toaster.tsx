"use client";

import { Toaster as Sonner } from "sonner";
import { useTheme } from "@/components/shared/theme-provider";

/** App-wide toast host, styled with the panel tokens. Top-right keeps it clear of the floating save bar. */
export function Toaster() {
	const { theme } = useTheme();
	return (
		<Sonner
			theme={theme}
			position="top-right"
			closeButton
			duration={3500}
			visibleToasts={4}
			toastOptions={{
				classNames: {
					toast: "!bg-panel-bg !text-fg-default !border !border-border-subtle !rounded-xl !shadow-lg !font-sans !text-sm !gap-3",
					title: "!font-semibold !text-fg-default",
					description: "!text-fg-muted !text-xs",
					closeButton: "!bg-panel-bg !border-border-subtle !text-fg-muted hover:!text-fg-default",
					success: "[&_[data-icon]]:!text-success",
					error: "!border-danger/40 [&_[data-icon]]:!text-danger",
					warning: "[&_[data-icon]]:!text-warning",
				},
			}}
		/>
	);
}
