"use client";

import type React from "react";
import { ChevronRight, Lock, type LucideIcon } from "lucide-react";
import type { NavGroup, NavPage } from "@/lib/navigation";

export interface NavLinkProps {
	page: NavPage;
	href: string;
	active: boolean;
	/** False renders the page as locked (still visible, not clickable). */
	accessible: boolean;
	/** Tailwind class of the icon when the link is not active. */
	iconClass?: string;
	onNavigate: (e: React.MouseEvent, href: string) => void;
}

/** A guarded <a> rather than <Link>, so navigation can be intercepted while there are unsaved changes. */
export function NavLink({ page, href, active, accessible, iconClass = "text-fg-muted/70", onNavigate }: NavLinkProps) {
	const Icon = page.icon;
	return (
		<a
			data-tour={page.tour}
			href={href}
			aria-current={active ? "page" : undefined}
			onClick={(e) => (accessible ? onNavigate(e, href) : e.preventDefault())}
			className={`group/link relative flex h-9 items-center gap-2.5 rounded-lg px-3 text-[13px] font-medium transition-[background-color,color,transform] duration-150 active:scale-[.98] ${accessible ? "cursor-pointer" : "cursor-not-allowed opacity-60"} ${
				active ? "bg-primary-500/10 text-primary-500" : "text-fg-muted hover:bg-panel-bg/60 hover:text-fg-default"
			}`}
		>
			{active && <span aria-hidden className="absolute -left-1 top-2 h-5 w-0.5 rounded-full bg-primary-500" />}
			<Icon className={`size-4 shrink-0 transition-transform duration-150 group-hover/link:scale-110 ${active ? "text-primary-500" : iconClass}`} />
			<span className="truncate">{page.label}</span>
			{!accessible && <Lock className="ml-auto size-3.5 shrink-0 text-warning" aria-label="Locked" />}
		</a>
	);
}

export function DropdownTrigger({
	label,
	icon: Icon,
	open,
	onToggle,
	nested,
	iconClass = "text-primary-500",
	tour,
}: {
	label: string;
	icon: LucideIcon;
	open: boolean;
	onToggle: () => void;
	nested?: boolean;
	iconClass?: string;
	tour?: string;
}) {
	return (
		<button
			type="button"
			data-tour={tour}
			onClick={onToggle}
			aria-expanded={open}
			className={`flex w-full cursor-pointer items-center justify-between rounded-lg px-3 transition-[background-color,color,transform] duration-150 active:scale-[.98] ${
				nested ? "h-8 text-xs font-semibold text-fg-muted hover:bg-panel-bg/40 hover:text-fg-default" : "h-9 text-[13px] font-medium text-fg-muted hover:bg-panel-bg/60 hover:text-fg-default"
			}`}
		>
			<div className="flex items-center gap-2.5">
				<Icon className={`size-4 ${iconClass}`} />
				<span>{label}</span>
			</div>
			<ChevronRight className={`size-3.5 shrink-0 text-fg-muted/60 transition-transform duration-200 ${open ? "rotate-90" : ""}`} />
		</button>
	);
}

/** One collapsible group of pages, tinted with the group's color. */
export function NavGroupSection({
	group,
	open,
	onToggle,
	renderPage,
}: {
	group: NavGroup;
	open: boolean;
	onToggle: () => void;
	renderPage: (page: NavPage, iconClass: string) => React.ReactNode;
}) {
	return (
		<div className="space-y-0.5">
			<DropdownTrigger label={group.label} icon={group.icon} open={open} onToggle={onToggle} nested iconClass={group.iconClass} tour={group.tour} />
			{open && <div className="space-y-0.5 pl-2 motion-fade">{group.pages.map((p) => renderPage(p, group.dimClass))}</div>}
		</div>
	);
}
