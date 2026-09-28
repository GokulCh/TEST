"use client";

import type { ReactNode } from "react";
import { GitCompare, RefreshCw, Search } from "lucide-react";
import { Button, Skeleton, inputClass } from "@/components/panel/form-parts";
import { ErrorBanner } from "@/components/panel/page-shell";
import { cn } from "@/lib/utils";

export function SearchInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
	return (
		<div className="relative flex-1">
			<Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-fg-muted/70" />
			<input
				type="search"
				aria-label={placeholder}
				placeholder={placeholder}
				value={value}
				onChange={(e) => onChange(e.target.value)}
				className={cn(inputClass, "h-10 rounded-xl bg-panel-bg/30 pl-10 pr-4")}
			/>
		</div>
	);
}

export function RefreshButton({ onClick, refreshing, label = "Refresh" }: { onClick: () => void; refreshing: boolean; label?: string }) {
	return (
		<Button onClick={onClick} disabled={refreshing} aria-busy={refreshing || undefined} icon={<RefreshCw className={cn("size-3.5", refreshing ? "animate-spin text-primary-500" : "text-fg-muted")} />}>
			{label}
		</Button>
	);
}

/** Header toggle that puts a page into side-by-side comparison. */
export function CompareToggle({ active, onToggle }: { active: boolean; onToggle: () => void }) {
	return (
		<Button aria-pressed={active} variant={active ? "dashed" : "secondary"} onClick={onToggle} icon={<GitCompare className="size-3.5" />}>
			{active ? "Exit compare" : "Compare"}
		</Button>
	);
}

/** Table-shaped placeholder while a list loads. */
export function LoadingBlock({ rows = 6 }: { rows?: number }) {
	return (
		<div className="overflow-hidden rounded-xl border border-border-subtle bg-panel-bg/40" aria-busy="true" aria-label="Loading">
			<div className="border-b border-border-subtle bg-bg-canvas/40 p-4">
				<Skeleton className="h-3 w-1/3" />
			</div>
			<div className="divide-y divide-border-subtle/40">
				{Array.from({ length: rows }, (_, i) => (
					<div key={i} className="flex items-center gap-6 px-4 py-3.5">
						<Skeleton className="h-3 w-16" />
						<Skeleton className="h-3 flex-1" />
						<Skeleton className="hidden h-3 w-24 sm:block" />
						<Skeleton className="h-3 w-12" />
					</div>
				))}
			</div>
		</div>
	);
}

export interface Column {
	label: string;
	right?: boolean;
}

/** Bordered table card: header row from `columns`, `children` are the <tr> rows. Shows `empty` when there are none. */
export function DataTable({
	columns,
	empty,
	isEmpty,
	footer,
	children,
}: {
	columns: (string | Column)[];
	empty: string;
	isEmpty: boolean;
	footer?: ReactNode;
	children: ReactNode;
}) {
	return (
		<div className="overflow-hidden rounded-xl border border-border-subtle bg-panel-bg/40 motion-fade">
			<div className="overflow-x-auto">
				<table className="w-full border-collapse text-left font-mono text-xs tabular-nums">
					<thead>
						<tr className="border-b border-border-subtle bg-bg-canvas/40 font-sans text-[11px] font-semibold uppercase tracking-wide text-fg-muted">
							{columns.map((c) => {
								const col = typeof c === "string" ? { label: c } : c;
								return (
									<th key={col.label} scope="col" className={cn("whitespace-nowrap px-4 py-3", col.right && "text-right")}>
										{col.label}
									</th>
								);
							})}
						</tr>
					</thead>
					<tbody className="divide-y divide-border-subtle/40 [&>tr]:transition-colors [&>tr:hover]:bg-panel-bg/60">
						{children}
						{isEmpty && (
							<tr>
								<td colSpan={columns.length} className="p-10 text-center font-sans text-sm text-fg-muted">
									{empty}
								</td>
							</tr>
						)}
					</tbody>
				</table>
			</div>
			{footer && <div className="flex items-center justify-between border-t border-border-subtle/60 px-4 py-2.5 text-xs text-fg-muted">{footer}</div>}
		</div>
	);
}

/** Loading skeleton, error strip or the table, whichever applies. */
export function TableState({ loading, error, children }: { loading: boolean; error: unknown; children: ReactNode }) {
	if (loading) return <LoadingBlock />;
	if (error) return <ErrorBanner>{error instanceof Error ? error.message : "Failed to load"}</ErrorBanner>;
	return <>{children}</>;
}
