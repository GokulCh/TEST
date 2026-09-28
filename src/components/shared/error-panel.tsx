"use client";

import type { ReactNode } from "react";
import { AlertTriangle } from "lucide-react";

/** Centered notice for full-page failures (error boundaries, missing pages, unavailable services). */
export function ErrorPanel({ title, children, actions, tone = "danger" }: { title: string; children?: ReactNode; actions?: ReactNode; tone?: "danger" | "warning" }) {
	const toneCls = tone === "danger" ? "border-danger/30 bg-danger/10 text-danger" : "border-warning/30 bg-warning/10 text-warning";
	return (
		<div className="flex min-h-[420px] items-center justify-center px-6 py-12">
			<section role="alert" className="motion-modal w-full max-w-lg rounded-2xl border border-border-subtle bg-panel-bg/60 p-8 text-center shadow-sm">
				<div className={`mx-auto flex size-12 items-center justify-center rounded-full border ${toneCls}`}>
					<AlertTriangle className="size-5" aria-hidden="true" />
				</div>
				<h2 className="mt-5 text-xl font-semibold tracking-tight text-fg-default">{title}</h2>
				{children && <div className="mx-auto mt-3 max-w-md text-sm leading-6 text-fg-muted">{children}</div>}
				{actions && <div className="mt-6 flex flex-wrap items-center justify-center gap-3">{actions}</div>}
			</section>
		</div>
	);
}
