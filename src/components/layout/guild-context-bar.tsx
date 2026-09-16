"use client";

import { Cpu, ShieldCheck } from "lucide-react";
import { useParams } from "next/navigation";

export function GuildContextBar() {
	const params = useParams();
	const guildId = params?.guildId as string | undefined;

	if (!guildId) return null;

	return (
		<div className="flex items-center justify-between border-b border-border-subtle bg-panel-bg/40 backdrop-blur-md px-6 h-14 select-none transition-colors duration-300 relative z-10">
			{/* LEFT ASPECT: TELEMETRY TRACKER LAYER */}
			<div className="flex items-center gap-3">
				{/* Animated status anchor tracking your heartbeat matrix */}
				<span className="relative flex size-2">
					<span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75" />
					<span className="relative inline-flex rounded-full size-2 bg-success" />
				</span>

				<div className="flex items-center gap-1.5 font-mono text-[11px] font-bold tracking-wider text-fg-default uppercase">
					<Cpu className="size-3.5 text-fg-muted" />
					<span>Active Cluster Node //</span>
					<span className="text-primary-500 font-mono font-black select-all tracking-normal lowercase">
						{guildId}
					</span>
				</div>
			</div>

			{/* RIGHT ASPECT: HIGH-DENSITY STATUS BADGE INDICATOR */}
			<div className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-success/10 border border-success/20 text-success text-[9px] font-mono font-bold uppercase tracking-widest">
				<ShieldCheck className="size-3" />
				Secure Loop Sync
			</div>
		</div>
	);
}
