"use client";

import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import { useIsSubdomain } from "@/hooks/use-is-subdomain";
import { pageIdForPathname } from "@/lib/navigation";

const label = (segment: string) => segment.replace(/-/g, " ").replace(/^./, (c) => c.toUpperCase());

/** Path of the current page under the dashboard, linking to every ancestor that is a real page. */
export function Breadcrumbs() {
	const pathname = usePathname();
	const guildId = useParams()?.guildId as string | undefined;
	const isSubdomain = useIsSubdomain();
	const segments = pathname.split("/").filter(Boolean);
	if (segments.length === 0) return null;

	// On a guild subdomain the guild id is not part of the visible path.
	const shown = isSubdomain ? segments.filter((seg, idx) => !(idx === 1 && !isNaN(Number(seg)) && seg.length > 12)) : segments;
	const trail = shown.slice(1).filter((seg) => seg !== guildId);

	return (
		<nav aria-label="Breadcrumb" className="flex h-10 items-center gap-1.5 overflow-x-auto whitespace-nowrap border-b border-border-subtle/50 px-4 text-xs sm:px-6">
			<Link href="/dashboard" className="font-medium text-fg-muted transition-colors hover:text-primary-500">
				Dashboard
			</Link>
			{trail.map((segment, index) => {
				const href = "/" + shown.slice(0, shown.indexOf(segment) + 1).join("/");
				const isLast = index === trail.length - 1;
				// Group folders (sanctions, toolkits, ...) are not pages: they are shown, not linked.
				const plain = isLast || !pageIdForPathname(href, guildId);
				return (
					<span key={href} className="flex items-center gap-1.5">
						<ChevronRight className="size-3 shrink-0 text-fg-muted/40" />
						{plain ? (
							<span aria-current={isLast ? "page" : undefined} className={isLast ? "font-semibold text-fg-default" : "text-fg-muted"}>
								{label(segment)}
							</span>
						) : (
							<Link href={href} className="text-fg-muted transition-colors hover:text-fg-default">
								{label(segment)}
							</Link>
						)}
					</span>
				);
			})}
		</nav>
	);
}
