"use client";

import { Activity, Cpu, Globe, KeyRound, Server, ShieldCheck } from "lucide-react";
import { useMemo } from "react";
import { Field, InfoCard, InfoText, NumberInput, Panel, StatRow, TextInput } from "@/components/panel/form-parts";
import { PageShell } from "@/components/panel/page-shell";
import OptionDropdown from "@/components/ui/OptionDropdown";
import { useGuildConfig } from "@/features/dashboard/config-provider";
import { useSectionForm } from "@/hooks/use-section-form";
import type { GameServerConfig } from "@/lib/db-types";

const NO_SERVER: GameServerConfig = { host: "", port: 25565, version: "1.8.9", is_enabled: false, auth: { type: "none" }, verification: { provider: "none" }, tierKeywords: {} };

export default function Page() {
	const { meta, isLoading, isSaving, saveMetaSection } = useGuildConfig();

	const saved = useMemo<GameServerConfig | null>(() => {
		const s = meta?.server as GameServerConfig | undefined;
		if (!s || typeof s !== "object") return null;
		return { ...s, host: s.host ?? "", port: s.port ?? 25565, version: s.version ?? "1.8.9", auth: s.auth ?? { type: "none" }, verification: s.verification ?? { provider: "none" }, tierKeywords: s.tierKeywords ?? {} };
	}, [meta]);
	// Only the server is written: the bot list is read-only here and is managed on the hosting page.
	const { value: server, update, isDirty, submit, justSaved, error } = useSectionForm<GameServerConfig>(saved, NO_SERVER, (s) => saveMetaSection("server", s));
	const bots = meta?.bots ?? [];
	const tiers = Object.entries(server.tierKeywords ?? {});

	return (
		<PageShell eyebrow="Infrastructure" title="Server Configuration" loading={isLoading} onSave={submit} saving={isSaving} dirty={isDirty} justSaved={justSaved} error={error}>
			<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
				<div className="lg:col-span-2 space-y-6">
					<InfoCard
						icon={<Globe className="size-4 text-cyan-500" />}
						title="Server Endpoint"
					>
						<div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
							<Field label="Host" className="sm:col-span-2">
								<TextInput value={server.host} onValueChange={(host) => update({ host })} placeholder="play.example.net" />
							</Field>
							<Field label="Port">
								<NumberInput value={server.port ?? 25565} onValueChange={(port) => update({ port })} />
							</Field>
						</div>
						<Field label="Minecraft Version">
							<TextInput value={server.version} onValueChange={(version) => update({ version })} />
						</Field>
						<button
							onClick={() => update({ is_enabled: !server.is_enabled })}
							className={`h-6 px-2 border rounded-md text-xs font-medium flex items-center gap-1 transition-all ${server.is_enabled ? "bg-success/10 border-success/30 text-success" : "bg-panel-bg border-border-subtle text-fg-muted"}`}
						>
							{server.is_enabled ? "Enabled" : "Disabled"}
						</button>
					</InfoCard>

					<InfoCard icon={<KeyRound className="size-4 text-violet-500" />} title="Auth & Verification">
						<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
							<Field label="Auth Strategy">
								<OptionDropdown value={server.auth?.type ?? "none"} onChange={(value) => update({ auth: { type: value as "none" | "per_bot" } })} options={[{ value: "none", label: "None" }, { value: "per_bot", label: "Per Bot Credentials" }]} ariaLabel="Auth strategy" />
							</Field>
							<Field label="Verification Provider">
								<OptionDropdown value={server.verification?.provider ?? "none"} onChange={(value) => update({ verification: { provider: value as "none" | "jartex_stats" | "mojang" } })} options={[{ value: "none", label: "None" }, { value: "jartex_stats", label: "Jartex Stats" }, { value: "mojang", label: "Mojang" }]} ariaLabel="Verification provider" />
							</Field>
						</div>

						{bots.length > 0 && (
							<div className="space-y-2 pt-1 motion-fade">
								<div className="flex items-center gap-2 border-b border-border-subtle/50 pb-2">
									<ShieldCheck className="size-3.5 text-emerald-500" />
									<span className="text-[13px] font-semibold text-fg-default">Bot Credential Registry ({bots.length} bots)</span>
								</div>
								<div className="space-y-1.5">
									{bots.map((bot, i) => (
										<div key={i} className="flex items-center justify-between p-2.5 border border-border-subtle/40 rounded-lg bg-bg-canvas/20">
											<div className="min-w-0">
												<div className="text-sm font-semibold text-fg-default truncate">{bot.username}</div>
												<div className="text-xs text-fg-muted">{bot.stable_id ?? `bot-${i + 1}`} · {bot.status}</div>
											</div>
											<div className="flex items-center gap-2">
												<span className={`text-xs font-medium px-1.5 py-0.5 rounded border ${bot.is_enabled ? "bg-success/10 border-success/30 text-success" : "bg-panel-bg border-border-subtle text-fg-muted"}`}>
													{bot.is_enabled ? "Active" : "Off"}
												</span>
												{bot.has_password && <span className="text-xs font-medium text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded capitalize">Cred Set</span>}
											</div>
										</div>
									))}
								</div>
							</div>
						)}
					</InfoCard>
				</div>

				<div className="space-y-6">
					{tiers.length > 0 && (
						<InfoCard icon={<Server className="size-4 text-amber-500" />} title="Tier Keywords">
							<div className="space-y-3">
								{tiers.map(([tier, keywords]) => (
									<div key={tier} className="space-y-1.5">
										<span className={`inline-block text-xs font-medium px-1.5 py-0.5 rounded border ${tier === "titan" ? "border-amber-500/30 bg-amber-500/10 text-amber-400" : "border-cyan-500/30 bg-cyan-500/10 text-cyan-400"}`}>{tier}</span>
										<div className="flex flex-wrap gap-1.5">
											{keywords.map((kw, i) => <span key={i} className="text-xs text-fg-muted bg-bg-canvas/40 border border-border-subtle/60 px-1.5 py-0.5 rounded capitalize">{kw}</span>)}
										</div>
									</div>
								))}
							</div>
						</InfoCard>
					)}

					<InfoCard icon={<Activity className="size-4 text-cyan-500" />} title="Connection Status">
						<div className="space-y-3 text-xs text-fg-muted">
							<StatRow label="Link State" className={server.is_enabled ? "text-success" : "text-fg-muted"}>{server.is_enabled ? "Online" : "Offline"}</StatRow>
							<StatRow label="Endpoint" className="font-bold">{server.host || "—"}:{server.port ?? 25565}</StatRow>
							<StatRow label="Version">{server.version || "—"}</StatRow>
							<StatRow label="Total Bots">{bots.length}</StatRow>
							<StatRow label="Active Bots">{bots.filter((b) => b.is_enabled).length}</StatRow>
						</div>
					</InfoCard>

					<InfoCard icon={<Cpu className="size-4 text-emerald-500" />} title="Auto Link Behaviour">
						<InfoText>Bot passwords are stored securely and encrypted on the server for protection.</InfoText>
					</InfoCard>
				</div>
			</div>
		</PageShell>
	);
}
