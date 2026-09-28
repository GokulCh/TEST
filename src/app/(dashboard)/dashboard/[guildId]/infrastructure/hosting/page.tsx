"use client";

import { Activity, Bot, Lock, Server } from "lucide-react";
import { AddButton, DeleteButton, EmptyState, Field, InfoCard, InfoText, ListLayout, Panel, SectionBar, StatRow, TextInput, Toggle } from "@/components/panel/form-parts";
import { PageShell } from "@/components/panel/page-shell";
import OptionDropdown from "@/components/ui/OptionDropdown";
import { useGuildConfig } from "@/features/dashboard/config-provider";
import { useGuildData, useGuildWrite } from "@/hooks/use-guild-data";
import { useSectionForm } from "@/hooks/use-section-form";
import type { BotStatus } from "@/lib/db-types";

type BotTier = "titan" | "champion";

interface BotAccount {
	username: string;
	stable_id?: string;
	status: BotStatus;
	tier?: BotTier;
	is_enabled: boolean;
	password?: string; // Only for new passwords, never sent from server
	has_password: boolean; // Indicates if password is set
}

const STATUS_META: Record<BotStatus, { label: string; className: string }> = {
	offline: { label: "Offline", className: "text-fg-muted bg-panel-bg border-border-subtle" },
	starting: { label: "Starting", className: "text-amber-400 bg-amber-500/10 border-amber-500/30" },
	available: { label: "Available", className: "text-success bg-success/10 border-success/30" },
	busy: { label: "Busy", className: "text-rose-400 bg-rose-500/10 border-rose-500/30" },
	cooldown: { label: "Cooldown", className: "text-sky-400 bg-sky-500/10 border-sky-500/30" },
};

const TIER_OPTIONS = [{ value: "titan", label: "Titan" }, { value: "champion", label: "Champion" }];
const STATUS_OPTIONS = Object.entries(STATUS_META).map(([value, m]) => ({ value, label: m.label }));

export default function Page() {
	const { meta, reload } = useGuildConfig();
	const write = useGuildWrite();
	const { data, isLoading, mutate } = useGuildData<BotAccount[]>("bots");

	// After a save the bot list is reloaded: new passwords come back as `has_password`, never as text.
	const { value: bots, setValue: setBots, isDirty, submit, saving, justSaved, error } = useSectionForm<BotAccount[]>(data ?? null, [], async (list) => {
		await write("PUT", "bots", { bots: list });
		await mutate();
		reload(); // the game config (server page) holds the same bots
	});
	const updateBot = (index: number, updates: Partial<BotAccount>) => setBots((prev) => prev.map((b, i) => (i === index ? { ...b, ...updates } : b)));

	const count = (pred: (b: BotAccount) => boolean) => bots.filter(pred).length;
	const server = meta?.server;

	return (
		<PageShell eyebrow="Infrastructure" title="Bot Accounts" loading={isLoading} onSave={submit} saving={saving} dirty={isDirty} justSaved={justSaved} error={error}>
			<SectionBar
				title="Game Bot Accounts"
				description="Add Minecraft bot accounts that will host games on your server"
				action={
					<AddButton onClick={() => setBots((prev) => [...prev, { username: "NewBotAccount", stable_id: "new_bot", status: "offline", tier: "champion", is_enabled: true, password: "", has_password: false }])}>
						Add Bot Account
					</AddButton>
				}
			/>

			{bots.length === 0 && <EmptyState>No bot accounts configured yet — click &ldquo;Add Bot Account&rdquo; to add one.</EmptyState>}

			{bots.length > 0 && (
				<ListLayout
					sidebar={
						<>
							<InfoCard icon={<Server className="size-4 text-cyan-500" />} title="Game Server Connection">
								<div className="space-y-2 text-xs text-fg-muted">
									<StatRow label="Endpoint" className="font-bold">{server?.host ?? ""}:{server?.port ?? 25565}</StatRow>
									<StatRow label="MC Version" className="font-bold">{server?.version ?? "1.8.9"}</StatRow>
									<StatRow label="Link State" className={server?.is_enabled ? "text-success" : "text-fg-muted"}>{server?.is_enabled ? "Connected" : "Disconnected"}</StatRow>
								</div>
								<InfoText>Connection settings, authentication, and verification are managed in the Server Configuration section.</InfoText>
							</InfoCard>

							<InfoCard icon={<Activity className="size-4 text-violet-500" />} title="Bot Account Status">
								<div className="space-y-3 text-xs text-fg-muted">
									<StatRow label="Total Accounts" className="font-bold">{bots.length}</StatRow>
									<StatRow label="Available" className="text-success">{count((b) => b.status === "available")}</StatRow>
									<StatRow label="In Games" className="text-rose-400">{count((b) => b.status === "busy")}</StatRow>
									<StatRow label="Offline" className="text-fg-muted">{count((b) => b.status === "offline" || b.status === "cooldown")}</StatRow>
									<StatRow label="Titan Tier" className="text-amber-400">{count((b) => b.tier === "titan")}</StatRow>
									<StatRow label="Champion Tier" className="text-cyan-400">{count((b) => b.tier === "champion")}</StatRow>
								</div>
							</InfoCard>

							<InfoCard icon={<Bot className="size-4 text-amber-500" />} title="How It Works">
								<InfoText>Bot accounts are used to host games on your server. Tier indicates the account level (Titan or Champion), and status shows if the account is available to play.</InfoText>
							</InfoCard>
						</>
					}
				>
					{bots.map((bot, index) => (
						<Panel key={index} className="space-y-3">
							<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
								<Field label="Bot Username">
									<TextInput mini value={bot.username} onValueChange={(username) => updateBot(index, { username })} className="bg-bg-canvas/40" />
								</Field>
								<Field label="Stable ID">
									<TextInput mini value={bot.stable_id ?? ""} onValueChange={(stable_id) => updateBot(index, { stable_id: stable_id || undefined })} className="bg-bg-canvas/40" />
								</Field>
								<Field label="Password">
									<div className="relative">
										<input
											type="password"
											value={bot.password ?? ""}
											onChange={(e) => updateBot(index, { password: e.target.value })}
											placeholder={bot.has_password ? "•••••••• (encrypted)" : "Set new password"}
											className="w-full h-8 px-2.5 pr-8 bg-bg-canvas/40 border border-border-subtle rounded-md text-sm text-fg-default transition-[border-color,box-shadow] duration-150 hover:border-fg-muted/30 focus:outline-none focus:border-primary-500/60 focus:ring-2 focus:ring-primary-500/15"
										/>
										{bot.has_password && <Lock className="absolute right-2 top-1/2 -translate-y-1/2 size-3.5 text-success" />}
									</div>
								</Field>
								<Field label="Tier Class">
									<OptionDropdown value={bot.tier ?? "champion"} onChange={(value) => updateBot(index, { tier: value as BotTier })} options={TIER_OPTIONS} placeholder="Select tier" />
								</Field>
								<div className="flex gap-2 justify-end sm:justify-start">
									<Toggle size="sm" checked={bot.is_enabled} onChange={(is_enabled) => updateBot(index, { is_enabled })} onLabel="Enabled" className="px-3" />
									<DeleteButton onClick={() => setBots((prev) => prev.filter((_, i) => i !== index))} className="rounded-md" />
								</div>
							</div>

							<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2.5 border-t border-border-subtle/10">
								<div className="flex items-center gap-1.5">
									<span className="text-xs font-medium text-fg-muted">Runtime State</span>
									<OptionDropdown value={bot.status} onChange={(value) => updateBot(index, { status: value as BotStatus })} options={STATUS_OPTIONS} placeholder="Select status" />
								</div>
								<div className="flex items-center gap-2">
									<span className={`inline-flex items-center gap-1 text-xs font-medium px-1.5 py-0.5 rounded border ${STATUS_META[bot.status].className}`}>{STATUS_META[bot.status].label}</span>
									<span className="inline-flex items-center gap-1 text-xs font-medium px-1.5 py-0.5 rounded border border-amber-500/30 bg-amber-500/10 text-amber-400 capitalize">
										{bot.tier === "titan" ? "Titan Class" : "Champion Class"}
									</span>
								</div>
							</div>
						</Panel>
					))}
				</ListLayout>
			)}
		</PageShell>
	);
}
