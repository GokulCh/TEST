"use client";

import { Cpu, Eye, Palette, ShieldAlert, Server, Swords, Users } from "lucide-react";
import { useParams } from "next/navigation";
import { useMemo } from "react";
import { RefreshButton } from "@/components/panel/data-table";
import { Badge, Button, Field, InfoCard, TextInput } from "@/components/panel/form-parts";
import { PageShell } from "@/components/panel/page-shell";
import { BotProfilePreview } from "@/features/dashboard/bot-profile-preview";
import { useGuildConfig } from "@/features/dashboard/config-provider";
import { StatCard, type StatCardProps } from "@/features/dashboard/stat-card";
import { useGuildData } from "@/hooks/use-guild-data";
import { useSectionForm } from "@/hooks/use-section-form";
import { runWithToast } from "@/lib/client/notify";
import type { GuildAppearanceConfig } from "@/lib/db-types";

interface GuildStats {
	activeGames: number;
	totalGames: number;
	activeStrikes: number;
	registeredPlayers: number;
}

const NO_APPEARANCE: GuildAppearanceConfig = { nickname: null, avatar: null, bio: null, banner: null };

export default function Page() {
	const guildId = useParams()?.guildId as string | undefined;
	const { dbGuildId, config, isLoading: configLoading, saveConfigSection } = useGuildConfig();
	const { data: stats, error: statsError, isLoading: statsLoading, isValidating, mutate } = useGuildData<GuildStats>("stats");

	const saved = useMemo<GuildAppearanceConfig | null>(
		() => (config?.appearance ? { nickname: config.appearance.nickname ?? null, avatar: config.appearance.avatar ?? null, bio: config.appearance.bio ?? null, banner: config.appearance.banner ?? null } : null),
		[config],
	);
	const { value: appearance, update, isDirty, submit, saving, error: appearanceError } = useSectionForm<GuildAppearanceConfig>(saved, NO_APPEARANCE, (a) => saveConfigSection("appearance", a));

	const cards: StatCardProps[] = [
		{ label: "Registered Players", value: stats ? stats.registeredPlayers.toLocaleString() : "—", change: "Total", icon: Users, color: "text-violet-500", bg: "bg-violet-500/10", direction: "up" },
		{ label: "Active Games", value: stats ? String(stats.activeGames) : "—", change: "Active", icon: Swords, color: "text-cyan-500", bg: "bg-cyan-500/10", direction: "neutral" },
		{ label: "Active Strikes", value: stats ? String(stats.activeStrikes) : "—", change: stats?.activeStrikes === 0 ? "Clean" : "Pending", icon: ShieldAlert, color: "text-rose-500", bg: "bg-rose-500/10", direction: stats?.activeStrikes === 0 ? "up" : "down" },
		{ label: "Total Games Played", value: stats ? stats.totalGames.toLocaleString() : "—", change: "All-time", icon: Server, color: "text-emerald-500", bg: "bg-emerald-500/10", direction: "neutral" },
	];

	return (
		<PageShell
			eyebrow="Community overview"
			title="Dashboard"
			loading={configLoading || (statsLoading && !stats)}
			actions={<RefreshButton onClick={() => mutate()} refreshing={isValidating && !statsLoading} />}
			error={statsError?.message ?? appearanceError}
		>
			<div data-tour="overview-stats" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
				{cards.map((card) => (
					<StatCard key={card.label} {...card} />
				))}
			</div>

			<InfoCard icon={<Cpu className="size-4 text-cyan-500" />} title="Connection Status">
				<div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
					<div className="p-3 bg-bg-canvas/30 border border-border-subtle/40 rounded-lg space-y-1">
						<span className="block text-xs font-medium text-fg-muted">Database</span>
						<span className="text-base font-semibold text-fg-default">Connected <span className="text-xs text-success font-normal">// Online</span></span>
					</div>
					<div className="p-3 bg-bg-canvas/30 border border-border-subtle/40 rounded-lg space-y-1">
						<span className="block text-xs font-medium text-fg-muted">Guild ID</span>
						<span className="text-sm font-semibold text-fg-default select-all">{dbGuildId ?? "Resolving..."}</span>
					</div>
					<div className="p-3 bg-bg-canvas/30 border border-border-subtle/40 rounded-lg space-y-1">
						<span className="block text-xs font-medium text-fg-muted">Server ID</span>
						<span className="text-sm font-semibold text-fg-default select-all">{guildId ?? "—"}</span>
					</div>
				</div>
			</InfoCard>

			<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
				<div data-tour="bot-identity">
					<InfoCard icon={<Palette className="size-4 text-violet-500" />} title="Bot Identity Configuration">
						<Field label="Bot Instance Nickname">
							<TextInput value={appearance.nickname ?? ""} onValueChange={(v) => update({ nickname: v || null })} />
						</Field>
						<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
							<Field label="Avatar URL">
								<TextInput value={appearance.avatar ?? ""} onValueChange={(v) => update({ avatar: v || null })} placeholder="https://cdn.example.com/avatar.png" />
							</Field>
							<Field label="Banner URL">
								<TextInput value={appearance.banner ?? ""} onValueChange={(v) => update({ banner: v || null })} placeholder="https://cdn.example.com/banner.png" />
							</Field>
						</div>
						<Field label="About Me Description" hint="*bold* • _italic_ • `code` • New lines preserved">
							<textarea
								rows={3}
								value={appearance.bio ?? ""}
								onChange={(e) => update({ bio: e.target.value || null })}
								placeholder="Supports basic markdown formatting"
								className="w-full p-3 bg-bg-canvas/40 border border-border-subtle rounded-lg text-sm text-fg-default resize-none leading-relaxed transition-[border-color,box-shadow] duration-150 hover:border-fg-muted/30 focus:outline-none focus:border-primary-500/60 focus:ring-2 focus:ring-primary-500/15"
							/>
						</Field>
						<Button variant={isDirty ? "primary" : "secondary"} size="sm" onClick={() => void runWithToast(submit, { success: "Bot identity saved" })} loading={saving} className="self-start">
							{saving ? "Saving…" : "Save identity"}
						</Button>
					</InfoCard>
				</div>

				<div className="space-y-4 h-fit">
					<div className="flex items-center justify-between border-b border-border-subtle/50 pb-2.5 px-1">
						<div className="flex items-center gap-2">
							<Eye className="size-4 text-fg-muted" />
							<h3 className="text-xs font-medium text-fg-muted">Discord Profile Preview</h3>
						</div>
						<Badge tone="success">Live preview</Badge>
					</div>
					<BotProfilePreview appearance={appearance} />
				</div>
			</div>
		</PageShell>
	);
}
