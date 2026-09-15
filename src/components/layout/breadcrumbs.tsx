"use client";

import { ChevronRight, Terminal } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function Breadcrumbs() {
	const pathname = usePathname();
	const segments = pathname.split("/").filter(Boolean);

	// Suppress tracing if we are at root level
	if (segments.length === 0) return null;

	return (
		<nav className="flex items-center gap-2 px-6 h-10 border-b border-border-subtle/40 bg-panel-bg/10 backdrop-blur-xs select-none">
			{/* ROOT DIRECTORY ANCHOR INDICATOR */}
			<div className="flex items-center gap-1.5 text-fg-muted/60 pr-1">
				<Terminal className="size-3.5" />
			</div>

			<Link
				href="/dashboard"
				className="font-mono text-[11px] font-bold uppercase tracking-wider text-fg-muted hover:text-primary-500 transition-colors active:scale-98"
			>
				root
			</Link>

			{/* DYNAMIC SEGMENT COMPILER LOOP */}
			{segments.slice(1).map((segment, index) => {
				// Safely reconstruct paths while keeping your layout layers perfectly unified
				const href = "/" + segments.slice(0, index + 2).join("/");
				const label = segment.replace(/-/g, " ");
				const isLast = index === segments.slice(1).length - 1;

				// If the segment is a raw dynamic guildId parameter, style it subtly as a variable node
				const isGuildId =
					(index === 0 && !isNaN(Number(segment))) || segment.length > 12;

				return (
					<span
						key={href}
						className="flex items-center gap-2 font-mono text-[11px]"
					>
						<ChevronRight className="size-3 text-fg-muted/40 block shrink-0" />

						{isLast ? (
							<span
								className={`font-bold tracking-wide ${
									isGuildId
										? "text-primary-500/90 font-mono text-[10px]"
										: "text-fg-default lowercase"
								}`}
							>
								{isGuildId ? `node[${label.slice(0, 6)}...]` : label}
							</span>
						) : (
							<Link
								href={href}
								className={`font-bold tracking-wide transition-colors active:scale-98 ${
									isGuildId
										? "text-fg-muted font-mono text-[10px] hover:text-primary-500"
										: "text-fg-muted lowercase hover:text-fg-default"
								}`}
							>
								{isGuildId ? `node[${label.slice(0, 6)}...]` : label}
							</Link>
						)}
					</span>
				);
			})}
		</nav>
	);
}
