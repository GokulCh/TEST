"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut, RefreshCw, Swords } from "lucide-react";
import { SidebarNav, useGuardedNavigate } from "@/components/layout/sidebar-nav";
import { Button, Skeleton } from "@/components/panel/form-parts";
import { useSession } from "@/hooks/use-session";
import { apiSend } from "@/lib/client/api";

export function Sidebar() {
	const router = useRouter();
	const { session } = useSession();
	const guardedNavigate = useGuardedNavigate();
	const [isLoggingOut, setIsLoggingOut] = useState(false);

	const handleLogout = async () => {
		setIsLoggingOut(true);
		try {
			await apiSend("POST", "/api/auth/logout");
		} catch {
			// leave regardless
		}
		router.push("/");
	};

	return (
		<aside data-tour="sidebar" className="hidden lg:flex w-64 flex-col border-r border-border-subtle bg-panel-bg/40 backdrop-blur-md relative z-10 select-none">
			{isLoggingOut && (
				<div className="motion-fade absolute inset-0 z-50 flex flex-col items-center justify-center gap-3 bg-bg-canvas/80 backdrop-blur-sm">
					<RefreshCw className="size-5 animate-spin text-fg-muted" />
					<p className="text-xs font-medium text-fg-muted">Signing out…</p>
				</div>
			)}

			<div className="flex h-14 shrink-0 items-center border-b border-border-subtle px-4">
				<a href="/" onClick={(e) => guardedNavigate(e, "/")} className="flex cursor-pointer items-center gap-2 font-bold transition-opacity hover:opacity-90">
					<span className="flex size-7 items-center justify-center rounded-md border border-border-subtle bg-primary-50 text-primary-500 shadow-sm">
						<Swords className="size-4" />
					</span>
					<span className="font-display text-base font-bold tracking-tight text-fg-default">myrbw.dev</span>
				</a>
			</div>

			<div className="flex shrink-0 flex-col gap-3 border-b border-border-subtle bg-bg-canvas/20 p-4">
				<div className="flex items-center gap-3">
					<div className="relative size-10 shrink-0 overflow-hidden rounded-lg border border-border-subtle bg-panel-bg">
						{/* eslint-disable-next-line @next/next/no-img-element */}
						<img src={session?.avatarUrl ?? "https://cdn.discordapp.com/embed/avatars/0.png"} alt="" className="size-full object-cover" />
						<div className="absolute bottom-0 right-0 size-2.5 rounded-full border border-bg-canvas bg-success" />
					</div>
					<div className="min-w-0 flex-1 text-left">
						{session ? (
							<>
								<div className="truncate text-sm font-semibold text-fg-default">{session.globalName ?? session.username}</div>
								<div className="text-xs text-success">Signed in</div>
							</>
						) : (
							<div className="space-y-1.5">
								<Skeleton className="h-3.5 w-24" />
								<Skeleton className="h-3 w-16" />
							</div>
						)}
					</div>
				</div>
				<div className="flex gap-2">
					<Button variant="secondary" size="sm" onClick={(e) => guardedNavigate(e, "/setup")} icon={<RefreshCw className="size-3.5 text-fg-muted" />} className="flex-1">
						Switch server
					</Button>
					<Button variant="ghost" size="icon" onClick={handleLogout} disabled={isLoggingOut} title="Sign out" aria-label="Sign out" className="border border-border-subtle hover:border-danger/40 hover:bg-danger/10 hover:text-danger">
						<LogOut className="size-4" />
					</Button>
				</div>
			</div>

			<nav className="flex-1 overflow-y-auto p-3 space-y-1.5 pb-32 scrollbar-thin">
				<SidebarNav />
			</nav>
		</aside>
	);
}
