"use client";

import {
	Activity,
	AlertCircle,
	CheckCircle2,
	Cpu,
	Globe,
	KeyRound,
	Loader2,
	Save,
	Server,
	ShieldCheck,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useGuildConfig } from "@/features/dashboard/config-provider";
import { useUnsavedChanges } from "@/hooks/use-unsaved-changes";
import type { GameServerConfig, BotStoredConfig } from "@/lib/db-types";

export default function Page() {
	const { meta, dbGuildId, isLoading } = useGuildConfig();
	const [server, setServer] = useState<GameServerConfig>({ host: "", port: 25565, version: "1.8.9", is_enabled: false, auth: { type: "none" }, verification: { provider: "none" }, tierKeywords: {} });
	const [bots, setBots] = useState<BotStoredConfig[]>([]);
	const [isSaving, setIsSaving] = useState(false);
	const [saveSuccess, setSaveSuccess] = useState(false);
	const [saveError, setSaveError] = useState<string | null>(null);

	// Saved state for unsaved changes detection
	const [savedServer, setSavedServer] = useState<GameServerConfig>({ host: "", port: 25565, version: "1.8.9", is_enabled: false, auth: { type: "none" }, verification: { provider: "none" }, tierKeywords: {} });
	const [savedBots, setSavedBots] = useState<BotStoredConfig[]>([]);

	useEffect(() => {
		if (!meta) return;
		if (meta.server && typeof meta.server === "object") {
			const serverData = meta.server as GameServerConfig;
			setServer(serverData);
			setSavedServer(serverData);
		}
		if (Array.isArray(meta.bots)) {
			const botsData = meta.bots as BotStoredConfig[];
			setBots(botsData);
			setSavedBots(botsData);
		}
	}, [meta]);

	const flashSuccess = () => { setSaveSuccess(true); setTimeout(() => setSaveSuccess(false), 2500); };

	// Global unsaved changes detection
	const globalLocal = useMemo(() => ({ server, bots }), [server, bots]);
	const globalSaved = useMemo(() => ({ server: savedServer, bots: savedBots }), [savedServer, savedBots]);
	const { isDirty } = useUnsavedChanges(globalLocal, globalSaved);

	const handleSave = async () => {
		if (!dbGuildId) return;
		setSaveError(null);
		setIsSaving(true);
		try {
			await Promise.all([
				fetch(`/api/db/guilds/${dbGuildId}/meta`, {
					method: "PUT",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ section: "server", data: server }),
				}),
				fetch(`/api/db/guilds/${dbGuildId}/meta`, {
					method: "PUT",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ section: "bots", data: bots }),
				}),
			]);
			flashSuccess();
			// Update saved state after successful save
			setSavedServer(server);
			setSavedBots(bots);
		} catch (e) {
			setSaveError(e instanceof Error ? e.message : "Save failed");
		} finally {
			setIsSaving(false);
		}
	};

	if (isLoading)
		return (
			<div className="flex items-center justify-center h-64">
				<Loader2 className="size-6 animate-spin text-primary-500" />
			</div>
		);

	return (
		<div className="w-full p-6 lg:p-8 space-y-6 animate-in fade-in duration-300 select-none max-w-7xl mx-auto text-left">
			<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border-subtle pb-6">
				<div>
					<h1 className="font-mono text-[10px] font-bold uppercase tracking-widest text-fg-muted">// Infrastructure Server Link</h1>
					<h2 className="text-2xl font-black tracking-tight text-fg-default mt-1">Instance Proxies</h2>
				</div>
				<div className="flex items-center gap-2 self-start sm:self-auto">
					{saveSuccess && <span className="flex items-center gap-1.5 font-mono text-[10px] text-success uppercase tracking-wider"><CheckCircle2 className="size-3.5" /> Saved</span>}
					<button onClick={handleSave} disabled={isSaving || !dbGuildId} className={`h-9 px-4 flex items-center gap-2 font-mono font-bold text-[11px] uppercase tracking-wider rounded-lg transition-all active:scale-98 cursor-pointer shadow-sm disabled:opacity-60 border ${
						isDirty
							? "border-warning/40 bg-warning/15 hover:bg-warning/25 text-warning"
							: "border-primary-500/20 bg-primary-500/10 hover:bg-primary-500/20 text-primary-500"
					}`}>
						{isSaving ? <Loader2 className="size-3.5 animate-spin" /> : <Save className="size-3.5" />}
						<span>{isSaving ? "Pushing..." : "Commit Connection Config"}</span>
					</button>
				</div>
			</div>

			{saveError && (
				<div className="flex items-center gap-3 p-3 rounded-lg border border-danger/30 bg-danger/10 text-danger">
					<AlertCircle className="size-4 shrink-0" />
					<p className="font-mono text-[10px] uppercase">{saveError}</p>
				</div>
			)}

			<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
				<div className="lg:col-span-2 space-y-6">
					{/* Endpoint */}
					<div className="p-5 border border-border-subtle bg-panel-bg/20 backdrop-blur-md rounded-xl space-y-4 shadow-xs">
						<div className="flex items-center justify-between border-b border-border-subtle/50 pb-2.5">
							<div className="flex items-center gap-2"><Globe className="size-4 text-cyan-500" /><h3 className="font-mono text-[11px] font-bold text-fg-default uppercase tracking-widest">Server Endpoint</h3></div>
							<button onClick={() => setServer((s) => ({ ...s, is_enabled: !s.is_enabled }))} className={`h-6 px-2 border rounded-md font-mono text-[8px] font-bold uppercase tracking-wider flex items-center gap-1 transition-all ${server.is_enabled ? "bg-success/10 border-success/30 text-success" : "bg-panel-bg border-border-subtle text-fg-muted"}`}>
								{server.is_enabled ? "Enabled" : "Disabled"}
							</button>
						</div>
						<div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
							<div className="sm:col-span-2 space-y-1">
								<label className="block font-mono text-[9px] font-bold text-fg-default uppercase tracking-wider">Host</label>
								<input type="text" value={server.host} onChange={(e) => setServer((s) => ({ ...s, host: e.target.value }))} placeholder="play.example.net" className="w-full h-8 px-2.5 bg-bg-canvas/40 border border-border-subtle rounded-md font-mono text-xs text-fg-default focus:outline-none focus:border-primary-500/50" />
							</div>
							<div className="space-y-1">
								<label className="block font-mono text-[9px] font-bold text-fg-default uppercase tracking-wider">Port</label>
								<input type="number" value={server.port ?? 25565} onChange={(e) => setServer((s) => ({ ...s, port: Number(e.target.value) }))} className="w-full h-8 px-2.5 bg-bg-canvas/40 border border-border-subtle rounded-md font-mono text-xs text-fg-default focus:outline-none focus:border-primary-500/50" />
							</div>
						</div>
						<div className="space-y-1">
							<label className="block font-mono text-[9px] font-bold text-fg-default uppercase tracking-wider">Minecraft Version</label>
							<input type="text" value={server.version} onChange={(e) => setServer((s) => ({ ...s, version: e.target.value }))} className="w-full h-8 px-2.5 bg-bg-canvas/40 border border-border-subtle rounded-md font-mono text-xs text-fg-default focus:outline-none focus:border-primary-500/50" />
						</div>
					</div>

					{/* Auth & Verification */}
					<div className="p-5 border border-border-subtle bg-panel-bg/20 backdrop-blur-md rounded-xl space-y-4 shadow-xs">
						<div className="flex items-center gap-2 border-b border-border-subtle/50 pb-2.5">
							<KeyRound className="size-4 text-violet-500" />
							<h3 className="font-mono text-[11px] font-bold text-fg-default uppercase tracking-widest">Auth & Verification</h3>
						</div>
						<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
							<div className="space-y-1">
								<label className="block font-mono text-[9px] font-bold text-fg-default uppercase tracking-wider">Auth Strategy</label>
								<select value={server.auth?.type ?? "none"} onChange={(e) => setServer((s) => ({ ...s, auth: { type: e.target.value as "none" | "per_bot" } }))} className="w-full h-8 px-2 bg-bg-canvas/40 border border-border-subtle rounded-md font-mono text-xs text-fg-default focus:outline-none">
									<option value="none">None</option>
									<option value="per_bot">Per Bot Credentials</option>
								</select>
							</div>
							<div className="space-y-1">
								<label className="block font-mono text-[9px] font-bold text-fg-default uppercase tracking-wider">Verification Provider</label>
								<select value={server.verification?.provider ?? "none"} onChange={(e) => setServer((s) => ({ ...s, verification: { provider: e.target.value as "none" | "jartex_stats" | "mojang" } }))} className="w-full h-8 px-2 bg-bg-canvas/40 border border-border-subtle rounded-md font-mono text-xs text-fg-default focus:outline-none">
									<option value="none">None</option>
									<option value="jartex_stats">Jartex Stats</option>
									<option value="mojang">Mojang</option>
								</select>
							</div>
						</div>

						{bots.length > 0 && (
							<div className="space-y-2 pt-1 animate-in fade-in duration-150">
								<div className="flex items-center gap-2 border-b border-border-subtle/50 pb-2">
									<ShieldCheck className="size-3.5 text-emerald-500" />
									<span className="font-mono text-[10px] font-bold text-fg-default uppercase tracking-wider">Bot Credential Registry ({bots.length} bots)</span>
								</div>
								<div className="space-y-1.5">
									{bots.map((bot, i) => (
										<div key={i} className="flex items-center justify-between p-2.5 border border-border-subtle/40 rounded-lg bg-bg-canvas/20">
											<div className="min-w-0">
												<div className="font-mono text-[11px] font-bold text-fg-default uppercase tracking-wide truncate">{bot.username}</div>
												<div className="font-mono text-[9px] text-fg-muted uppercase tracking-wider">{bot.stable_id ?? `bot-${i + 1}`} · {bot.status}</div>
											</div>
											<div className="flex items-center gap-2">
												<span className={`font-mono text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border ${bot.is_enabled ? "bg-success/10 border-success/30 text-success" : "bg-panel-bg border-border-subtle text-fg-muted"}`}>
													{bot.is_enabled ? "Active" : "Off"}
												</span>
												{bot.has_password && <span className="font-mono text-[8px] font-bold uppercase text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded">Cred Set</span>}
											</div>
										</div>
									))}
								</div>
							</div>
						)}
					</div>
				</div>

				{/* Right sidebar */}
				<div className="space-y-6">
					{Object.keys(server.tierKeywords ?? {}).length > 0 && (
						<div className="p-5 border border-border-subtle bg-panel-bg/20 backdrop-blur-md rounded-xl space-y-4 shadow-xs">
							<div className="flex items-center gap-2 border-b border-border-subtle/50 pb-2.5">
								<Server className="size-4 text-amber-500" />
								<h3 className="font-mono text-[11px] font-bold text-fg-default uppercase tracking-widest">Tier Keywords</h3>
							</div>
							<div className="space-y-3">
								{Object.entries(server.tierKeywords ?? {}).map(([tier, keywords]) => (
									<div key={tier} className="space-y-1.5">
										<span className={`inline-block font-mono text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded border ${tier === "titan" ? "border-amber-500/30 bg-amber-500/10 text-amber-400" : "border-cyan-500/30 bg-cyan-500/10 text-cyan-400"}`}>{tier}</span>
										<div className="flex flex-wrap gap-1.5">
											{keywords.map((kw, i) => <span key={i} className="font-mono text-[9px] text-fg-muted uppercase bg-bg-canvas/40 border border-border-subtle/60 px-1.5 py-0.5 rounded">{kw}</span>)}
										</div>
									</div>
								))}
							</div>
						</div>
					)}

					<div className="p-5 border border-border-subtle bg-panel-bg/20 backdrop-blur-md rounded-xl space-y-4 shadow-xs">
						<div className="flex items-center gap-2 border-b border-border-subtle/50 pb-2.5">
							<Activity className="size-4 text-cyan-500" />
							<h3 className="font-mono text-[11px] font-bold text-fg-default uppercase tracking-widest">Connection Status</h3>
						</div>
						<div className="space-y-3 font-mono text-[10px] text-fg-muted uppercase">
							<div className="flex justify-between"><span>Link State:</span><span className={server.is_enabled ? "text-success" : "text-fg-muted"}>{server.is_enabled ? "Online" : "Offline"}</span></div>
							<div className="flex justify-between"><span>Endpoint:</span><span className="text-fg-default font-bold">{server.host || "—"}:{server.port ?? 25565}</span></div>
							<div className="flex justify-between"><span>Version:</span><span className="text-fg-default">{server.version || "—"}</span></div>
							<div className="flex justify-between"><span>Total Bots:</span><span className="text-fg-default">{bots.length}</span></div>
							<div className="flex justify-between"><span>Active Bots:</span><span className="text-fg-default">{bots.filter((b) => b.is_enabled).length}</span></div>
						</div>
					</div>

					<div className="p-5 border border-border-subtle bg-panel-bg/20 backdrop-blur-md rounded-xl space-y-4 shadow-xs">
						<div className="flex items-center gap-2 border-b border-border-subtle/50 pb-2.5">
							<Cpu className="size-4 text-emerald-500" />
							<h3 className="font-mono text-[11px] font-bold text-fg-default uppercase tracking-widest">Auto Link Behaviour</h3>
						</div>
						<p className="font-mono text-[9px] text-fg-muted uppercase tracking-wide leading-relaxed text-left">
							Per-bot credentials are stored encrypted (AES-GCM) server side — passwords are never returned to the panel.
						</p>
					</div>
				</div>
			</div>
		</div>
	);
}
