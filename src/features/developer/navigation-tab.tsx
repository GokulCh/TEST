"use client";

import { useState } from "react";
import { Code, Lock } from "lucide-react";
import { EmptyState, InfoCard, InfoText, Panel, Toggle } from "@/components/panel/form-parts";
import type { DeveloperCategoryConfig, DeveloperPageConfig } from "@/lib/db-types";
import { patchById } from "@/lib/list";
import { cn } from "@/lib/utils";

/** Switches whole groups of pages, and single pages inside them, on or off. */
export function NavigationTab({
	pages,
	categories,
	preview,
	onPages,
	onCategories,
}: {
	pages: DeveloperPageConfig[];
	categories: DeveloperCategoryConfig[];
	/** Preview shows the result as a normal user sees it: no controls, hidden groups dimmed. */
	preview: boolean;
	onPages: (pages: DeveloperPageConfig[]) => void;
	onCategories: (categories: DeveloperCategoryConfig[]) => void;
}) {
	const [query, setQuery] = useState("");
	const q = query.toLowerCase();
	const nameOf = (id: string) => pages.find((p) => p.id === id)?.name ?? "";
	const visible = categories.filter((c) => !q || `${c.name} ${c.pages.map(nameOf)}`.toLowerCase().includes(q));

	return (
		<div className="space-y-5">
			<div className="flex flex-col gap-3 rounded-xl border border-border-subtle bg-panel-bg/20 p-4 sm:flex-row sm:items-center sm:justify-between">
				<div>
					<p className="text-[13px] font-semibold text-fg-default">Navigation Control</p>
					<p className="mt-1 text-xs text-fg-muted">Manage standalone pages and grouped categories from one view.</p>
				</div>
				<input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Filter pages or categories..." className="h-9 w-full rounded-lg border border-border-subtle bg-bg-canvas/40 px-3 text-sm text-fg-default sm:max-w-xs transition-[border-color,box-shadow] duration-150 hover:border-fg-muted/30 focus:outline-none focus:border-primary-500/60 focus:ring-2 focus:ring-primary-500/15" />
			</div>

			<InfoCard icon={<Code className="size-4 text-violet-500" />} title="Category Control">
				<InfoText>Disable an entire category or fine-tune the individual pages inside it. Category locks apply to every page in the group, so you only configure each visibility rule once.</InfoText>
			</InfoCard>

			{categories.length === 0 && <EmptyState>No categories configured yet</EmptyState>}

			{visible.map((category) => (
				<Panel key={category.id} className={cn("space-y-3", preview && !category.is_enabled && "border-dashed border-border-subtle/30 opacity-50")}>
					<div className="flex items-center justify-between">
						<div>
							<p className="text-sm font-semibold text-fg-default">{category.name}</p>
							<p className="text-xs text-fg-muted mt-0.5">{category.pages.length} pages</p>
						</div>
						{!preview && <Toggle size="sm" checked={category.is_enabled} onChange={(is_enabled) => onCategories(patchById(categories, category.id, { is_enabled }))} onLabel="Visible" offLabel="Hidden" className="px-3" />}
					</div>
					<div className="pl-3 border-l border-border-subtle/30 space-y-1">
						{category.pages.map((pageId) => {
							const page = pages.find((p) => p.id === pageId);
							if (!page || (q && !`${page.name} ${page.path}`.toLowerCase().includes(q))) return null;
							return (
								<div key={pageId} className="flex items-center justify-between gap-3 rounded-lg border border-border-subtle/30 bg-bg-canvas/20 px-3 py-2">
									<div className="min-w-0">
										<div className="flex items-center gap-2">
											{page.is_restricted && <Lock className="size-3 text-amber-500" />}
											<p className="truncate text-[13px] font-semibold text-fg-default">{page.name}</p>
											{!page.is_enabled && <span className="text-xs text-danger">Disabled</span>}
										</div>
										<p className="text-xs text-fg-muted">{page.path}</p>
									</div>
									{!preview && <Toggle size="sm" checked={page.is_enabled} onChange={(is_enabled) => onPages(patchById(pages, page.id, { is_enabled }))} onLabel="On" offLabel="Off" className="h-7 px-2.5 text-[8px]" />}
								</div>
							);
						})}
					</div>
				</Panel>
			))}
		</div>
	);
}
