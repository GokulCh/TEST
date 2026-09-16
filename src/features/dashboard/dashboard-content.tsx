"use client";

import {
	AlertCircle,
	ArrowRight,
	Loader2,
	PlusCircle,
	ShieldCheck,
	Sliders,
	Swords,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import type { PanelGuild } from "@/lib/db-types";

export function DashboardContent() {
	const [guilds, setGuilds] = useState<PanelGuild[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		const fetchWithRetry = async (maxRetries = 3): Promise<void> => {
			for (let attempt = 0; attempt <= maxRetries; attempt++) {
				try {
					const res = await fetch("/api/guilds");
					if (!res.ok) {
						if (res.status === 429 || res.status === 500) {
							const delayMs = Math.min(1000 * Math.pow(2, attempt), 5000);
							if (attempt < maxRetries) {
								await new Promise(resolve => setTimeout(resolve, delayMs));
								continue;
							}
						}
						throw new Error(`Failed to fetch guilds (${res.status})`);
					}
					const data = await res.json();
					setGuilds(data.guilds ?? []);
					setLoading(false);
					return;
				} catch (e) {
					if (attempt === maxRetries) {
						setError(e instanceof Error ? e.message : "Failed to fetch guilds");
						setLoading(false);
						return;
					}
					const delayMs = Math.min(1000 * Math.pow(2, attempt), 5000);
					await new Promise(resolve => setTimeout(resolve, delayMs));
				}
			}
		};
		
		fetchWithRetry();
	}, []);

	const configured = guilds.filter((g) => g.isRegistered);
	const unconfigured = guilds.filter((g) => !g.isRegistered);

	return (
		<div className="w-full max-w-5xl mx-auto p-6 lg:p-8 space-y-8 animate-in fade-in duration-300">
			{/* Header */}
			<div className="border-b border-border-subtle pb-6">
				<h1 className="font-mono text-[10px] font-bold uppercase tracking-widest text-fg-muted">
					// Workspace Node Directory
				</h1>
				<h2 className="text-2xl font-black tracking-tight text-fg-default mt-1">
					Select a Server
				</h2>
				<p className="text-sm text-fg-muted mt-2 max-w-lg">
					Choose a configured workspace to manage, or register a new server to get started.
				</p>
			</div>

			{/* Error */}
			{error && (
				<div className="flex items-center gap-3 p-4 rounded-xl border border-danger/30 bg-danger/10 text-danger">
					<AlertCircle className="size-4 shrink-0" />
					<p className="font-mono text-xs uppercase">{error}</p>
				</div>
			)}

			{/* Loading */}
			{loading && (
				<div className="flex flex-col items-center justify-center py-24 gap-4 text-fg-muted">
					<Loader2 className="size-6 animate-spin text-primary-500" />
					<p className="font-mono text-[10px] uppercase tracking-widest">Loading workspaces...</p>
				</div>
			)}

			{!loading && !error && (
				<div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
					{/* Configured */}
					<div className="space-y-4">
						<div className="flex items-center gap-2 px-1">
							<Sliders className="size-3.5 text-primary-500" />
							<h3 className="text-xs font-mono font-bold uppercase tracking-wider text-fg-default">
								Configured Workspaces
							</h3>
							<span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-panel-bg/80 border border-border-subtle text-fg-muted">
								{configured.length}
							</span>
						</div>

						<div className="space-y-3">
							{configured.length === 0 && (
								<div className="p-5 rounded-xl border border-dashed border-border-subtle/50 text-center">
									<p className="font-mono text-[10px] text-fg-muted uppercase tracking-wider">
										No configured workspaces yet.
									</p>
								</div>
							)}
							{configured.map((guild) => (
								<Link
									key={guild.id}
									href={`/dashboard/${guild.id}`}
									className="group flex items-center justify-between p-5 rounded-xl border-2 border-border-subtle/60 bg-panel-bg/40 hover:border-primary-500/50 transition-all duration-200"
								>
									<div className="flex items-center gap-4">
										{guild.iconUrl ? (
											<img
												src={guild.iconUrl}
												alt=""
												className="size-10 rounded-lg border border-border-subtle/40 object-cover"
											/>
										) : (
											<div className="p-2.5 bg-muted rounded-lg group-hover:bg-primary-500/10 transition-colors">
												<ShieldCheck className="size-5 text-fg-muted group-hover:text-primary-500" />
											</div>
										)}
										<div>
											<div className="font-mono text-sm font-bold uppercase tracking-wider text-fg-default truncate max-w-[180px]">
												{guild.name}
											</div>
											<div className="font-mono text-[9px] text-fg-muted uppercase tracking-wider mt-0.5">
												{guild.owner ? "Owner" : "Admin"} · ID {guild.id}
											</div>
										</div>
									</div>
									<ArrowRight className="size-4 text-fg-muted group-hover:text-primary-500 group-hover:translate-x-1 transition-all shrink-0" />
								</Link>
							))}
						</div>
					</div>

					{/* Unconfigured */}
					<div className="space-y-4">
						<div className="flex items-center gap-2 px-1">
							<PlusCircle className="size-3.5 text-fg-muted" />
							<h3 className="text-xs font-mono font-bold uppercase tracking-wider text-fg-muted">
								Available to Register
							</h3>
							<span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-panel-bg/40 border border-border-subtle/40 text-fg-muted/60">
								{unconfigured.length}
							</span>
						</div>

						<div className="space-y-3">
							{unconfigured.length === 0 && (
								<div className="p-5 rounded-xl border border-dashed border-border-subtle/50 text-center">
									<p className="font-mono text-[10px] text-fg-muted uppercase tracking-wider">
										All servers are already registered.
									</p>
								</div>
							)}
							{unconfigured.map((guild) => (
								<Link
									key={guild.id}
									href={`/setup?step=new&guildId=${guild.id}`}
									className="group flex items-center justify-between p-5 rounded-xl border-2 border-dashed border-border-subtle/60 bg-panel-bg/20 hover:border-primary-500/50 transition-all duration-200"
								>
									<div className="flex items-center gap-4">
										{guild.iconUrl ? (
											<img
												src={guild.iconUrl}
												alt=""
												className="size-10 rounded-lg border border-border-subtle/40 object-cover"
											/>
										) : (
											<div className="p-2.5 bg-muted rounded-lg group-hover:bg-primary-500/10 transition-colors">
												<Swords className="size-5 text-fg-muted group-hover:text-primary-500" />
											</div>
										)}
										<div>
											<div className="font-mono text-sm font-bold uppercase tracking-wider text-fg-default truncate max-w-[180px]">
												{guild.name}
											</div>
											<div className="font-mono text-[9px] text-fg-muted uppercase tracking-wider mt-0.5">
												Click to register &amp; deploy
											</div>
										</div>
									</div>
									<ArrowRight className="size-4 text-fg-muted group-hover:text-primary-500 group-hover:translate-x-1 transition-all shrink-0" />
								</Link>
							))}
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
