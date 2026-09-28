"use client";

import { useState } from "react";
import type React from "react";
import { useParams, usePathname, useRouter } from "next/navigation";
import { Layers } from "lucide-react";
import { DropdownTrigger, NavGroupSection, NavLink } from "@/components/layout/sidebar-parts";
import { ThemeSwitcher } from "@/components/layout/theme-switcher";
import { useDeveloperConfig } from "@/hooks/use-developer-config";
import { useIsSubdomain } from "@/hooks/use-is-subdomain";
import { useSession } from "@/hooks/use-session";
import { useUnsavedChangesContext } from "@/lib/contexts/changes-context";
import { CORE_PAGES, NAV_GROUPS, pageAccess, SYSTEM_PAGES, type NavPage } from "@/lib/navigation";

/** Click handler that navigates unless there are unsaved changes, in which case the guard dialog takes over. */
export function useGuardedNavigate(after?: () => void) {
	const router = useRouter();
	const { requestNavigation } = useUnsavedChangesContext();
	return (e: React.MouseEvent, href: string) => {
		e.preventDefault();
		if (requestNavigation(href)) router.push(href);
		after?.();
	};
}

/**
 * The dashboard's page list, built from the navigation registry. The desktop
 * sidebar and the mobile drawer both render it; `onNavigate` lets the drawer close itself.
 */
export function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
	const guildId = useParams()?.guildId as string | undefined;
	const pathname = usePathname();
	const isSubdomain = useIsSubdomain();
	const { isDeveloper } = useSession();
	const { data: developerConfig } = useDeveloperConfig(guildId);
	const guardedNavigate = useGuardedNavigate(onNavigate);

	const [modulesExpanded, setModulesExpanded] = useState(true);
	const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});

	if (!guildId) {
		return (
			<div className="p-4 border border-dashed border-border-subtle/50 rounded-xl text-center">
				<p className="text-xs text-fg-muted">No server selected</p>
			</div>
		);
	}

	// Clean URLs on a guild subdomain; the guild id is part of the path on the main domain.
	const baseHref = isSubdomain ? "/dashboard" : `/dashboard/${guildId}`;

	const renderPage = (page: NavPage, iconClass?: string) => {
		const href = `${baseHref}${page.path}`;
		// Locked pages stay visible so everyone can see what exists; developers open everything.
		const accessible = isDeveloper || pageAccess(developerConfig, page.id).allowed;
		return <NavLink key={page.id} page={page} href={href} active={pathname === href} accessible={accessible} iconClass={iconClass} onNavigate={guardedNavigate} />;
	};

	return (
		<>
			<div className="space-y-0.5">{CORE_PAGES.map((p) => renderPage(p, "text-fg-muted/60"))}</div>

			<div className="space-y-0.5">
				<DropdownTrigger label="Modules" icon={Layers} open={modulesExpanded} onToggle={() => setModulesExpanded(!modulesExpanded)} tour="modules-nav" />
				{modulesExpanded && (
					<div className="pl-2 ml-1 border-l border-border-subtle/50 space-y-1.5 pt-1 motion-fade">
						{NAV_GROUPS.map((group) => (
							<NavGroupSection key={group.id} group={group} open={!!openGroups[group.id]} onToggle={() => setOpenGroups((s) => ({ ...s, [group.id]: !s[group.id] }))} renderPage={renderPage} />
						))}
					</div>
				)}
			</div>

			<div className="space-y-0.5 border-t border-border-subtle/40 pt-2">
				{SYSTEM_PAGES.filter((p) => !p.restricted || isDeveloper).map((p) => renderPage(p, "text-fg-muted/60"))}
			</div>
			<ThemeSwitcher />
		</>
	);
}
