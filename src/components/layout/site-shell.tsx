import Link from "next/link";
import type { ReactNode } from "react";
import { Swords } from "@/components/shared/icons";
import { ThemeScope } from "@/components/shared/theme-scope";

const NAV = [
	{ href: "/", label: "Home" },
	{ href: "/reference", label: "API reference" },
] as const;

/** Header, content area and footer shared by the marketing, setup and reference pages. */
export function SiteShell({ children, cta = { href: "/setup", label: "Open dashboard" } }: { children: ReactNode; cta?: { href: string; label: string } | null }) {
	return (
		<ThemeScope>
			<div className="flex min-h-screen flex-col justify-between overflow-x-hidden bg-bg-canvas font-sans text-fg-default antialiased">
				<header className="sticky top-0 z-[1020] border-b border-border-subtle/70 bg-bg-canvas/80 backdrop-blur-xl">
					<div className="mx-auto flex h-16 max-w-[95rem] items-center justify-between gap-4 px-4 sm:px-8">
						<Link href="/" className="flex items-center gap-2.5 font-bold transition-opacity hover:opacity-90">
							<span className="flex-center size-7 rounded-md border border-border-subtle bg-primary-50 text-primary-500 shadow-sm">
								<Swords className="size-4" />
							</span>
							<span className="font-display text-sm font-bold tracking-tight text-fg-default">myrbw.dev</span>
						</Link>
						<nav aria-label="Primary" className="flex items-center gap-1 text-sm">
							{NAV.map((l) => (
								<Link key={l.href} href={l.href} className="hidden rounded-lg px-3 py-2 font-medium text-fg-muted transition-colors hover:bg-panel-bg hover:text-fg-default sm:block">
									{l.label}
								</Link>
							))}
							{cta && (
								<Link href={cta.href} className="ml-1 rounded-lg bg-primary-500 px-3.5 py-2 text-[13px] font-semibold text-white transition-[background-color,transform] duration-150 hover:bg-primary-600 active:scale-[.98]">
									{cta.label}
								</Link>
							)}
						</nav>
					</div>
				</header>

				<main className="motion-page flex w-full flex-1 flex-col justify-center">{children}</main>

				<footer className="border-t border-border-subtle bg-panel-bg/30 py-5 backdrop-blur-xs">
					<div className="mx-auto flex max-w-[95rem] flex-col items-center justify-between gap-2 px-4 text-xs text-fg-muted sm:flex-row sm:px-8">
						<span className="flex items-center gap-1.5">
							<span className="size-1.5 rounded-full bg-success" />
							Platform services online
						</span>
						<span>&copy; {new Date().getFullYear()} myrbw.dev. Built for competitive Minecraft communities.</span>
					</div>
				</footer>
			</div>
		</ThemeScope>
	);
}
