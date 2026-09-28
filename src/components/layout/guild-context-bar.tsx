"use client";

import { Server } from "lucide-react";
import { useParams } from "next/navigation";
import { Badge } from "@/components/panel/form-parts";
import { useGuilds } from "@/hooks/use-guilds";

/** Slim bar naming the server being configured. */
export function GuildContextBar() {
	const guildId = useParams()?.guildId as string | undefined;
	const { guilds } = useGuilds(!!guildId);
	if (!guildId) return null;
	const name = guilds.find((g) => g.id === guildId)?.name;

	return (
		<div className="relative z-10 flex h-12 select-none items-center justify-between border-b border-border-subtle bg-panel-bg/40 px-4 backdrop-blur-md sm:px-6">
			<div className="flex min-w-0 items-center gap-2.5">
				<Server className="size-4 shrink-0 text-fg-muted" />
				<span className="truncate text-sm font-semibold text-fg-default">{name ?? "Server"}</span>
				<span className="hidden font-mono text-xs text-fg-muted sm:inline">{guildId}</span>
			</div>
			<Badge tone="success" className="hidden sm:inline-flex">
				<span className="size-1.5 rounded-full bg-success" /> Connected
			</Badge>
		</div>
	);
}
