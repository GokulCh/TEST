"use client";

import { ArrowRight, Globe, PlusCircle, ShieldCheck, Sliders, Swords } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { EmptyState, Skeleton } from "@/components/panel/form-parts";
import { ErrorBanner } from "@/components/panel/page-shell";
import { useGuilds } from "@/hooks/use-guilds";
import { PUBLIC_PORTAL_ROOT_DOMAIN } from "@/lib/config-public-url";
import type { PanelGuild } from "@/lib/db-types";

const rootDomain = () => PUBLIC_PORTAL_ROOT_DOMAIN.replace(/^\.+/, "").replace(/^www\./, "").toLowerCase();

/** A registered guild with a portal subdomain opens on that subdomain; the rest under /dashboard/{id}. */
function dashboardUrl(guild: PanelGuild): string {
	if (!guild.subdomain) return `/dashboard/${guild.id}`;
	const protocol = typeof window !== "undefined" ? window.location.protocol : "https:";
	return `${protocol}//${guild.subdomain}.${rootDomain()}/dashboard`;
}

/** One row of the directory: icon (or a fallback), name, a caption and an arrow. */
function GuildLink({ guild, href, fallbackIcon, dashed, children }: { guild: PanelGuild; href: string; fallbackIcon: ReactNode; dashed?: boolean; children: ReactNode }) {
	return (
		<Link
			href={href}
			className={`group flex items-center justify-between p-5 rounded-xl border hover:-translate-y-0.5 hover:border-primary-500/50 hover:shadow-md transition-[transform,border-color,box-shadow] duration-200 ${dashed ? "border-dashed border-border-subtle/60 bg-panel-bg/20" : "border-border-subtle/60 bg-panel-bg/40"}`}
		>
			<div className="flex items-center gap-4">
				{guild.iconUrl ? (
					// eslint-disable-next-line @next/next/no-img-element
					<img src={guild.iconUrl} alt="" className="size-10 rounded-lg border border-border-subtle/40 object-cover" />
				) : (
					<div className="p-2.5 bg-muted rounded-lg group-hover:bg-primary-500/10 transition-colors">{fallbackIcon}</div>
				)}
				<div>
					<div className="text-sm font-semibold text-fg-default truncate max-w-[180px]">{guild.name}</div>
					<div className="text-xs text-fg-muted mt-0.5 flex items-center gap-2">{children}</div>
				</div>
			</div>
			<ArrowRight className="size-4 text-fg-muted group-hover:text-primary-500 group-hover:translate-x-1 transition-all shrink-0" />
		</Link>
	);
}

function Column({ icon, title, count, muted, children }: { icon: ReactNode; title: string; count: number; muted?: boolean; children: ReactNode }) {
	return (
		<div className="space-y-4">
			<div className="flex items-center gap-2 px-1">
				{icon}
				<h3 className={`text-xs font-medium ${muted ? "text-fg-muted" : "text-fg-default"}`}>{title}</h3>
				<span className="text-xs px-1.5 py-0.5 rounded bg-panel-bg/60 border border-border-subtle/60 text-fg-muted">{count}</span>
			</div>
			<div className="space-y-3">{children}</div>
		</div>
	);
}

export function DashboardContent() {
	const { guilds, error, isLoading } = useGuilds();
	const configured = guilds.filter((g) => g.isRegistered);
	const unconfigured = guilds.filter((g) => !g.isRegistered);

	return (
		<div className="motion-stagger mx-auto w-full max-w-5xl space-y-8">
			<div className="border-b border-border-subtle pb-6">
				<p className="text-xs font-medium text-fg-muted">Your servers</p>
				<h1 className="mt-1 text-2xl font-semibold tracking-tight text-fg-default">Choose a server</h1>
				<p className="text-sm text-fg-muted mt-2 max-w-lg">Open a server you have already set up, or register a new one to get started.</p>
			</div>

			<ErrorBanner>{error}</ErrorBanner>

			{isLoading && (
				<div className="grid grid-cols-1 gap-8 lg:grid-cols-2" aria-busy="true" aria-label="Loading servers">
					{[0, 1].map((c) => (
						<div key={c} className="space-y-3">
							<Skeleton className="h-4 w-40" />
							<Skeleton className="h-20 rounded-xl" />
							<Skeleton className="h-20 rounded-xl" />
						</div>
					))}
				</div>
			)}

			{!isLoading && !error && (
				<div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
					<Column icon={<Sliders className="size-3.5 text-primary-500" />} title="Configured servers" count={configured.length}>
						{configured.length === 0 && <EmptyState>No configured servers yet.</EmptyState>}
						{configured.map((guild) => (
							<GuildLink key={guild.id} guild={guild} href={dashboardUrl(guild)} fallbackIcon={<ShieldCheck className="size-5 text-fg-muted group-hover:text-primary-500" />}>
								<span>{guild.owner ? "Owner" : "Admin"} · ID {guild.id}</span>
								{guild.subdomain && (
									<span className="flex items-center gap-1 text-primary-500">
										<Globe className="size-3" />
										{guild.subdomain}.{rootDomain()}
									</span>
								)}
							</GuildLink>
						))}
					</Column>

					<Column icon={<PlusCircle className="size-3.5 text-fg-muted" />} title="Available to register" count={unconfigured.length} muted>
						{unconfigured.length === 0 && <EmptyState>All servers are already registered.</EmptyState>}
						{unconfigured.map((guild) => (
							<GuildLink key={guild.id} guild={guild} href={`/setup?step=new&guildId=${guild.id}`} fallbackIcon={<Swords className="size-5 text-fg-muted group-hover:text-primary-500" />} dashed>
								Set up this server
							</GuildLink>
						))}
					</Column>
				</div>
			)}
		</div>
	);
}
