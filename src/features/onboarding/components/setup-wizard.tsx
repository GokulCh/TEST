"use client";

import {
	AlertCircle,
	ArrowLeft,
	ArrowRight,
	Bot,
	CheckCircle2,
	ExternalLink,
	Globe,
	Loader2,
	MessageSquareCode,
	Paintbrush,
	PlusCircle,
	RefreshCw,
	Search,
	ShieldCheck,
	Sliders,
	Sparkles,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { PanelGuild } from "@/lib/db-types";

type VisualStep =
	| "DISCORD_CONNECT"
	| "SERVER_SELECT"
	| "PROVISION_DOMAIN"
	| "THEME_SELECT"
	| "BOT_INVITE"
	| "SUCCESS_MOCK";

interface SelectedGuildContext {
	id: string;
	name: string;
	dbId?: string;
}

interface ThemePreset {
	id: string;
	name: string;
	primary: string;
	panelBg: string;
	canvasBg: string;
}

const PRESETS: Record<string, ThemePreset> = {
	indigo: { id: "indigo", name: "Core Indigo", primary: "#4f46e5", panelBg: "#1e1b4b", canvasBg: "#090514" },
	emerald: { id: "emerald", name: "Obsidian Emerald", primary: "#10b981", panelBg: "#064e3b", canvasBg: "#020617" },
	rose: { id: "rose", name: "Crimson Velvet", primary: "#f43f5e", panelBg: "#4c0519", canvasBg: "#0f0507" },
	amber: { id: "amber", name: "Cyber Amber", primary: "#f59e0b", panelBg: "#451a03", canvasBg: "#0c0a09" },
	violet: { id: "violet", name: "Midnight Neon", primary: "#8b5cf6", panelBg: "#2e1065", canvasBg: "#0b041a" },
	cyan: { id: "cyan", name: "Glacial Matrix", primary: "#06b6d4", panelBg: "#164e63", canvasBg: "#04151f" },
	fuchsia: { id: "fuchsia", name: "Synthwave Dusk", primary: "#d946ef", panelBg: "#4a044e", canvasBg: "#120214" },
	sky: { id: "sky", name: "Atmosphere Node", primary: "#0ea5e9", panelBg: "#0c4a6e", canvasBg: "#03111a" },
	teal: { id: "teal", name: "Deep Abyssal", primary: "#14b8a6", panelBg: "#134e4a", canvasBg: "#021210" },
	lime: { id: "lime", name: "Radioactive FSM", primary: "#84cc16", panelBg: "#271c06", canvasBg: "#0a0d03" },
	orange: { id: "orange", name: "Magma Cluster", primary: "#f97316", panelBg: "#431407", canvasBg: "#140702" },
	zinc: { id: "zinc", name: "Monochrome Pro", primary: "#71717a", panelBg: "#18181b", canvasBg: "#09090b" },
	slate: { id: "slate", name: "Stealth Slate", primary: "#64748b", panelBg: "#1e293b", canvasBg: "#0f172a" },
	blue: { id: "blue", name: "Sapphire Core", primary: "#3b82f6", panelBg: "#1e3a8a", canvasBg: "#050b1e" },
	purple: { id: "purple", name: "Eldritch Warp", primary: "#a855f7", panelBg: "#3b0764", canvasBg: "#0d0217" },
	pink: { id: "pink", name: "Cyberpunk Sakura", primary: "#ec4899", panelBg: "#500724", canvasBg: "#14020a" },
	red: { id: "red", name: "Alert Matrix", primary: "#ef4444", panelBg: "#450a0a", canvasBg: "#140303" },
	neutral: { id: "neutral", name: "Asphalt Industrial", primary: "#737373", panelBg: "#262626", canvasBg: "#171717" },
	stone: { id: "stone", name: "Warm Quarks", primary: "#78716c", panelBg: "#292524", canvasBg: "#1c1917" },
	gold: { id: "gold", name: "Imperial Relic", primary: "#d4af37", panelBg: "#3a2f0f", canvasBg: "#120f05" },
};

export function SetupWizard() {
	const [step, setStep] = useState<VisualStep>("DISCORD_CONNECT");
	const [isSimulating, setIsSimulating] = useState(false);
	const [isLoadingAuth, setIsLoadingAuth] = useState(false);
	const [guilds, setGuilds] = useState<PanelGuild[]>([]);
	const [guildsLoading, setGuildsLoading] = useState(false);
	const [guildsError, setGuildsError] = useState<string | null>(null);
	const [searchQuery, setSearchQuery] = useState("");
	const [visibleCount, setVisibleCount] = useState(10);
	const [registeringId, setRegisteringId] = useState<string | null>(null);
	const [registerError, setRegisterError] = useState<string | null>(null);
	const router = useRouter();
	const searchParams = useSearchParams();

	const [activeGuild, setActiveGuild] = useState<SelectedGuildContext | null>(null);
	const [subdomain, setSubdomain] = useState("");
	const [themeMode, setThemeMode] = useState<"preset" | "custom">("preset");
	const [selectedPreset, setSelectedPreset] = useState("emerald");
	const [customPrimary, setCustomPrimary] = useState("#3b82f6");
	const [customPanel, setCustomPanel] = useState("#1e293b");
	const customCanvas = "#0f172a";
	const [botInvited, setBotInvited] = useState(false);

	// ── Load guilds from API ─────────────────────────────────────────────────
	const loadGuilds = useCallback(async () => {
		setGuildsLoading(true);
		setGuildsError(null);
		
		const fetchWithRetry = async (maxRetries = 3): Promise<PanelGuild[]> => {
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
						throw new Error(`Failed to load guilds (${res.status})`);
					}
					const data = await res.json();
					return data.guilds ?? [];
				} catch (err) {
					if (attempt === maxRetries) throw err;
					const delayMs = Math.min(1000 * Math.pow(2, attempt), 5000);
					await new Promise(resolve => setTimeout(resolve, delayMs));
				}
			}
			return [];
		};
		
		try {
			const guilds = await fetchWithRetry();
			setGuilds(guilds);
		} catch (err) {
			setGuildsError(
				err instanceof Error ? err.message : "Failed to load servers",
			);
		} finally {
			setGuildsLoading(false);
		}
	}, []);

	// ── On mount: check if we're returning from OAuth callback or already authenticated ──────────────
	useEffect(() => {
		const checkExistingSession = async () => {
			const stepParam = searchParams.get("step");
			const errorParam = searchParams.get("error");

			if (errorParam) {
				// OAuth returned an error — stay on DISCORD_CONNECT and show message
				return;
			}

			if (stepParam === "server_select") {
				// Returning from OAuth callback with a valid session
				setStep("SERVER_SELECT");
				loadGuilds();
				return;
			}

			// Check if user is already authenticated
			try {
				const res = await fetch("/api/auth/session");
				const data = await res.json();
				if (data.session) {
					// User is already authenticated, skip to server selection
					setStep("SERVER_SELECT");
					loadGuilds();
				}
			} catch (error) {
				console.error("Failed to check existing session:", error);
				// Stay on DISCORD_CONNECT if session check fails
			}
		};

		checkExistingSession();
	}, [searchParams, loadGuilds]);

	const filteredGuilds = useMemo(() => {
		if (!searchQuery.trim()) return guilds;
		return guilds.filter((g) =>
			g.name.toLowerCase().includes(searchQuery.toLowerCase()),
		);
	}, [searchQuery, guilds]);

	const configuredGuilds = filteredGuilds.filter((g) => g.isRegistered);
	const unconfiguredGuilds = filteredGuilds
		.filter((g) => !g.isRegistered)
		.slice(0, visibleCount);

	const activeThemeColors = useMemo(() => {
		if (themeMode === "preset") return PRESETS[selectedPreset] ?? PRESETS.emerald;
		return { id: "custom", name: "Custom Matrix Node", primary: customPrimary, panelBg: customPanel, canvasBg: customCanvas };
	}, [themeMode, selectedPreset, customPrimary, customPanel]);

	// ── Step transitions ───��─────────────────────────────────────────────────
	const handleStepTransition = (nextStep: VisualStep) => {
		setIsSimulating(true);
		setTimeout(() => {
			setIsSimulating(false);
			setStep(nextStep);
		}, 400);
	};

	// ── Discord OAuth: get auth URL then redirect ────────────────────────────
	const handleDiscordConnect = async () => {
		setIsLoadingAuth(true);
		try {
			const res = await fetch("/api/auth/session", { method: "POST" });
			const data = await res.json();
			if (data.url) {
				window.location.href = data.url;
			} else {
				throw new Error("No auth URL returned");
			}
		} catch {
			setIsLoadingAuth(false);
		}
	};

	// ── Navigate to existing registered guild dashboard ──────────────────────
	const handleConfiguredGuildClick = (guild: PanelGuild) => {
		setIsSimulating(true);
		setTimeout(() => {
			// Use the DB id as the guildId in the route (it's the snowflake — we
			// use snowflake everywhere in routes for human-readability)
			router.push(`/dashboard/${guild.id}`);
		}, 600);
	};

	// ── Start onboarding flow for an unconfigured guild ──────────────────────
	const handleNewGuildClick = (guild: PanelGuild) => {
		setActiveGuild({ id: guild.id, name: guild.name });
		setSubdomain(
			guild.name.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 16),
		);
		handleStepTransition("PROVISION_DOMAIN");
	};

	// ── Register guild in DB and move to success ─────────────────────────────
	const handleCompleteRegistration = async () => {
		if (!activeGuild) return;
		setRegisteringId(activeGuild.id);
		setRegisterError(null);

		try {
			const res = await fetch(
				`/api/db/guilds/${activeGuild.id}/register`,
				{
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ name: activeGuild.name }),
				},
			);

			if (!res.ok) {
				const contentType = res.headers.get("content-type");
				let errorMessage = "Registration failed";
				
				if (contentType && contentType.includes("application/json")) {
					try {
						const body = await res.json();
						errorMessage = body.error ?? errorMessage;
					} catch {
						errorMessage = `Registration failed (status: ${res.status})`;
					}
				} else {
					const text = await res.text();
					errorMessage = `Server error: received HTML instead of JSON (status: ${res.status})`;
					console.error("Non-JSON response:", text.substring(0, 200));
				}
				
				throw new Error(errorMessage);
			}

			const data = await res.json();
			// Update local guild state so it shows as registered
			setGuilds((prev) =>
				prev.map((g) =>
					g.id === activeGuild.id
						? { ...g, isRegistered: true, dbId: data.guild?.id }
						: g,
				),
			);
			setActiveGuild((prev) =>
				prev ? { ...prev, dbId: data.guild?.id } : prev,
			);
			handleStepTransition("SUCCESS_MOCK");
		} catch (err) {
			setRegisterError(
				err instanceof Error ? err.message : "Registration failed",
			);
		} finally {
			setRegisteringId(null);
		}
	};

	const oauthError = searchParams.get("error");

	return (
		<div className="relative w-full px-8 lg:px-16 py-12 lg:py-20 overflow-hidden">
			{/* Background glow */}
			<div aria-hidden className="pointer-events-none absolute inset-0 -z-50 overflow-hidden select-none">
				<div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[65rem] h-[45rem] bg-primary-500/10 rounded-full blur-[140px]" />
			</div>

			{/* Loading overlay */}
			{(isSimulating || isLoadingAuth) && (
				<div className="fixed inset-0 bg-bg-canvas/60 backdrop-blur-md z-50 flex flex-col items-center justify-center space-y-4">
					<Loader2 className="size-6 text-primary-500 animate-spin" />
					<p className="font-mono text-[10px] tracking-widest text-fg-muted uppercase">
						{isLoadingAuth ? "// Initiating OAuth handshake..." : "// Syncing state cluster..."}
					</p>
				</div>
			)}

			<div className="mx-auto flex flex-col items-center space-y-8">

				{/* ═══════════════ STEP 1: DISCORD CONNECT ═══════════════ */}
				{step === "DISCORD_CONNECT" && (
					<div className="w-full max-w-3xl flex flex-col items-center space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
						<div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-primary-50 border border-primary-500/20 text-primary-500 text-[10px] font-mono font-bold uppercase tracking-widest select-none">
							Identity Verification Layer
						</div>
						<h1 className="text-hero text-fg-default font-black tracking-tighter sm:text-5xl lg:text-6xl max-w-2xl leading-none">
							Connect Your Account
						</h1>
						<p className="text-description max-w-2xl font-medium text-fg-muted text-base sm:text-lg leading-relaxed">
							To manage setups or initialize new clusters, connect your Discord account.
							<span className="block mt-2 text-sm text-fg-muted/80">
								This syncs your managed servers and deployment credentials securely.
							</span>
						</p>

						{/* OAuth error banner */}
						{oauthError && (
							<div className="w-full max-w-md flex items-center gap-3 p-4 rounded-xl border border-danger/30 bg-danger/10 text-danger">
								<AlertCircle className="size-4 shrink-0" />
								<p className="font-mono text-xs uppercase tracking-wide">
									{oauthError === "invalid_state"
										? "CSRF validation failed — please try again."
										: oauthError === "access_denied"
											? "Discord access was denied."
											: `Auth error: ${oauthError}`}
								</p>
							</div>
						)}

						<div className="w-full max-w-md pt-4">
							<button
								onClick={handleDiscordConnect}
								disabled={isLoadingAuth}
								className="group w-full flex items-center justify-between p-5 rounded-xl border-2 border-border-subtle/60 bg-panel-bg/40 backdrop-blur-md hover:border-primary-500/50 transition-all duration-200 active:scale-[0.99] cursor-pointer text-left disabled:opacity-60 disabled:cursor-not-allowed"
							>
								<div className="flex items-center gap-4">
									<div className="p-3 bg-muted rounded-lg group-hover:bg-primary-500/10 group-hover:text-primary-500 transition-colors">
										<MessageSquareCode className="h-6 w-6" />
									</div>
									<div>
										<h3 className="text-sm font-mono font-bold uppercase tracking-wider text-fg-default">
											Authorize with Discord
										</h3>
										<p className="text-xs text-fg-muted mt-0.5">
											Sign in via secure OAuth2 protocol.
										</p>
									</div>
								</div>
								<ArrowRight className="size-4 text-fg-muted group-hover:text-primary-500 group-hover:translate-x-1 transition-all" />
							</button>
						</div>
					</div>
				)}

				{/* ═══════════════ STEP 2: SERVER SELECT ═══════════════ */}
				{step === "SERVER_SELECT" && (
					<div className="w-full flex flex-col items-center space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
						<div className="max-w-3xl space-y-4">
							<div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-primary-50 border border-primary-500/20 text-primary-500 text-[10px] font-mono font-bold uppercase tracking-widest select-none">
								Select Workspace Node
							</div>
							<h1 className="text-hero text-fg-default font-black tracking-tighter sm:text-5xl lg:text-6xl max-w-2xl leading-none">
								Select Server Node
							</h1>
						</div>

						{/* Search */}
						<div className="w-full max-w-xl relative">
							<div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-fg-muted/70">
								<Search className="size-4" />
							</div>
							<input
								type="text"
								value={searchQuery}
								onChange={(e) => { setSearchQuery(e.target.value); setVisibleCount(10); }}
								placeholder="Search indexing nodes..."
								className="w-full h-12 pl-11 pr-4 bg-panel-bg/40 backdrop-blur-md border border-border-subtle rounded-control font-medium text-sm text-fg-default placeholder-fg-muted focus:outline-none focus:border-primary-500/50 transition-colors"
							/>
							<button
								onClick={loadGuilds}
								title="Refresh guild list"
								className="absolute inset-y-0 right-3 flex items-center px-2 text-fg-muted hover:text-primary-500 transition-colors"
							>
								<RefreshCw className={`size-4 ${guildsLoading ? "animate-spin text-primary-500" : ""}`} />
							</button>
						</div>

						{/* Error state */}
						{guildsError && (
							<div className="w-full max-w-xl flex items-center gap-3 p-4 rounded-xl border border-danger/30 bg-danger/10 text-danger">
								<AlertCircle className="size-4 shrink-0" />
								<p className="font-mono text-xs">{guildsError}</p>
								<button onClick={loadGuilds} className="ml-auto font-mono text-[10px] uppercase underline">Retry</button>
							</div>
						)}

						{/* Loading skeleton */}
						{guildsLoading && (
							<div className="w-full max-w-7xl grid grid-cols-1 lg:grid-cols-2 gap-4">
								{Array.from({ length: 4 }).map((_, i) => (
									<div key={i} className="h-24 rounded-xl border border-border-subtle/40 bg-panel-bg/20 animate-pulse" />
								))}
							</div>
						)}

						{!guildsLoading && (
							<div className="grid grid-cols-1 lg:grid-cols-2 gap-8 w-full max-w-7xl pt-2 text-left items-start">
								{/* Configured */}
								<div className="space-y-4">
									<div className="flex items-center gap-2 px-1">
										<Sliders className="size-3.5 text-primary-500" />
										<h2 className="text-xs font-mono font-bold uppercase tracking-wider text-fg-default">
											Configured Workspaces
										</h2>
										<span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-panel-bg/80 border border-border-subtle text-fg-muted">
											{configuredGuilds.length} Active
										</span>
									</div>

									<div className="space-y-3 max-h-[26rem] overflow-y-auto pr-1 select-none">
										{configuredGuilds.length === 0 && !guildsLoading && (
											<p className="font-mono text-[9px] text-fg-muted uppercase tracking-wide border border-dashed border-border-subtle/60 rounded-lg p-4">
												No configured workspaces yet.
											</p>
										)}
										{configuredGuilds.map((guild) => (
											<div
												key={guild.id}
												onClick={() => handleConfiguredGuildClick(guild)}
												className="group block p-5 rounded-xl border-2 border-border-subtle/60 bg-panel-bg/40 backdrop-blur-md hover:border-success/50 transition-all duration-200 active:scale-98 cursor-pointer"
											>
												<div className="flex items-center justify-between">
													<div className="flex items-center gap-4">
														{guild.iconUrl ? (
															<img src={guild.iconUrl} alt="" className="size-10 rounded-lg object-cover border border-border-subtle/40" />
														) : (
															<div className="p-3 bg-muted rounded-lg group-hover:bg-success/10 group-hover:text-success transition-colors">
																<ShieldCheck className="h-5 w-5" />
															</div>
														)}
														<div>
															<h3 className="text-sm font-mono font-bold uppercase tracking-wider text-fg-default truncate max-w-[200px]">
																{guild.name}
															</h3>
															<p className="text-xs text-fg-muted mt-1 leading-relaxed">
																{guild.owner ? "Server Owner" : "Admin"} · Click to open dashboard
															</p>
														</div>
													</div>
													<ArrowRight className="size-4 shrink-0 text-fg-muted group-hover:text-success group-hover:translate-x-1 transition-all" />
												</div>
											</div>
										))}
									</div>
								</div>

								{/* Unconfigured */}
								<div className="space-y-4">
									<div className="flex items-center gap-2 px-1">
										<PlusCircle className="size-3.5 text-fg-muted" />
										<h2 className="text-xs font-mono font-bold uppercase tracking-wider text-fg-muted">
											Available Guilds
										</h2>
										<span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-panel-bg/40 border border-border-subtle/40 text-fg-muted/60">
											{filteredGuilds.filter((g) => !g.isRegistered).length} Pending
										</span>
									</div>

									<div className="space-y-3 max-h-[26rem] overflow-y-auto pr-1 select-none">
										{unconfiguredGuilds.length === 0 && !guildsLoading && (
											<p className="font-mono text-[9px] text-fg-muted uppercase tracking-wide border border-dashed border-border-subtle/60 rounded-lg p-4">
												All your servers are already configured.
											</p>
										)}
										{unconfiguredGuilds.map((guild) => (
											<div
												key={guild.id}
												onClick={() => handleNewGuildClick(guild)}
												className="group block p-5 rounded-xl border-2 border-dashed border-border-subtle/60 bg-panel-bg/20 backdrop-blur-md hover:border-primary-500/50 transition-all duration-200 active:scale-98 cursor-pointer"
											>
												<div className="flex items-center justify-between">
													<div className="flex items-center gap-4">
														{guild.iconUrl ? (
															<img src={guild.iconUrl} alt="" className="size-10 rounded-lg object-cover border border-border-subtle/40" />
														) : (
															<div className="p-3 bg-muted rounded-lg group-hover:bg-primary-500/10 group-hover:text-primary-500 transition-colors">
																<Sparkles className="h-5 w-5" />
															</div>
														)}
														<div>
															<h3 className="text-sm font-mono font-bold uppercase tracking-wider text-fg-default truncate max-w-[200px]">
																{guild.name}
															</h3>
															<p className="text-xs text-fg-muted mt-1 leading-relaxed">
																Unconfigured. Click to deploy engine instance.
															</p>
														</div>
													</div>
													<ArrowRight className="size-4 shrink-0 text-fg-muted group-hover:text-primary-500 group-hover:translate-x-1 transition-all" />
												</div>
											</div>
										))}
										{filteredGuilds.filter((g) => !g.isRegistered).length > visibleCount && (
											<button
												onClick={() => setVisibleCount((v) => v + 10)}
												className="w-full py-2 font-mono text-[10px] uppercase tracking-wider text-fg-muted hover:text-primary-500 transition-colors"
											>
												Show more...
											</button>
										)}
									</div>
								</div>
							</div>
						)}

						<div className="pt-4 w-full max-w-7xl text-left">
							<button
								onClick={() => setStep("DISCORD_CONNECT")}
								className="inline-flex items-center border border-border-subtle bg-panel-bg/40 hover:bg-panel-bg text-fg-default font-mono font-bold text-xs h-12 px-8 rounded-control transition-colors cursor-pointer active:scale-98"
							>
								<ArrowLeft className="size-4 mr-2" /> Back to Verification
							</button>
						</div>
					</div>
				)}

				{/* ═══════════════ STEP 2A: DOMAIN SELECTION ═══════════════ */}
				{step === "PROVISION_DOMAIN" && (
					<div className="w-full max-w-2xl flex flex-col items-center space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
						<div className="space-y-4 text-center">
							<div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-primary-50 border border-primary-500/20 text-primary-500 text-[10px] font-mono font-bold uppercase tracking-widest select-none">
								Step 1 // Cluster Routing Core
							</div>
							<h1 className="text-hero text-fg-default font-black tracking-tighter sm:text-4xl lg:text-5xl max-w-2xl leading-none">
								Claim Workspace Domain
							</h1>
							{activeGuild && (
								<p className="text-xs font-mono text-fg-muted uppercase tracking-wider">
									Setting up: <span className="text-primary-500 font-black">{activeGuild.name}</span>
								</p>
							)}
						</div>

						<div className="w-full max-w-md bg-panel-bg/40 backdrop-blur-md p-6 rounded-xl border border-border-subtle/80 text-left space-y-4">
							<label className="text-[10px] font-mono font-bold uppercase tracking-wider text-fg-default flex items-center gap-1.5">
								<Globe className="size-3.5 text-primary-500" /> Desired Portal Domain URL
							</label>
							<div className="flex items-center relative rounded-control border border-border-subtle bg-bg-canvas overflow-hidden focus-within:border-primary-500/50 transition-colors">
								<input
									type="text"
									value={subdomain}
									onChange={(e) => setSubdomain(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
									placeholder="your-guild"
									className="flex-1 h-12 px-4 text-sm font-semibold text-fg-default bg-transparent focus:outline-none text-right placeholder-fg-muted/50"
								/>
								<div className="h-12 px-4 bg-muted border-l border-border-subtle flex items-center font-mono text-xs font-bold text-fg-muted select-none uppercase tracking-wider">
									.myrbw.dev
								</div>
							</div>
						</div>

						<div className="flex items-center justify-between w-full max-w-md pt-2">
							<button
								onClick={() => handleStepTransition("SERVER_SELECT")}
								className="inline-flex items-center font-mono text-[10px] uppercase font-bold tracking-wider text-fg-muted hover:text-fg-default transition-colors"
							>
								<ArrowLeft className="size-3.5 mr-1" /> Back
							</button>
							<button
								disabled={!subdomain.trim()}
								onClick={() => handleStepTransition("THEME_SELECT")}
								className="inline-flex items-center gap-2 bg-primary-500 hover:bg-primary-600 disabled:opacity-40 text-white font-mono font-bold text-xs uppercase tracking-wider h-11 px-6 rounded-control transition-all shadow-lg shadow-primary-500/10 active:scale-98 cursor-pointer"
							>
								Continue <ArrowRight className="size-3.5" />
							</button>
						</div>
					</div>
				)}

				{/* ═══════════════ STEP 2B: THEME SELECT ═══════════════ */}
				{step === "THEME_SELECT" && (
					<div className="w-full max-w-5xl flex flex-col items-center space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
						<div className="space-y-4 text-center max-w-2xl">
							<div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-primary-50 border border-primary-500/20 text-primary-500 text-[10px] font-mono font-bold uppercase tracking-widest select-none">
								Step 2 // Layout Appearance Matrix
							</div>
							<h1 className="text-hero text-fg-default font-black tracking-tighter sm:text-4xl lg:text-5xl max-w-2xl leading-none">
								Select Interface Theme
							</h1>
						</div>

						<div className="grid grid-cols-1 lg:grid-cols-12 gap-8 w-full items-start">
							<div className="lg:col-span-7 bg-panel-bg/40 border border-border-subtle p-6 rounded-xl space-y-6">
								<div className="grid grid-cols-2 gap-2 bg-muted p-1 rounded-lg border border-border-subtle/40">
									<button
										onClick={() => setThemeMode("preset")}
										className={`py-2 text-xs font-mono font-bold uppercase tracking-wider rounded-md transition-colors ${themeMode === "preset" ? "bg-bg-canvas text-fg-default shadow-sm" : "text-fg-muted hover:text-fg-default"}`}
									>
										System Presets ({Object.keys(PRESETS).length})
									</button>
									<button
										onClick={() => setThemeMode("custom")}
										className={`py-2 text-xs font-mono font-bold uppercase tracking-wider rounded-md transition-colors ${themeMode === "custom" ? "bg-bg-canvas text-fg-default shadow-sm" : "text-fg-muted hover:text-fg-default"}`}
									>
										Custom Engine
									</button>
								</div>

								{themeMode === "preset" ? (
									<div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[22.5rem] overflow-y-auto pr-1.5 text-left">
										{Object.values(PRESETS).map((p) => (
											<div
												key={p.id}
												onClick={() => setSelectedPreset(p.id)}
												className={`p-4 rounded-xl border-2 bg-bg-canvas cursor-pointer transition-all active:scale-[0.98] flex flex-col justify-between h-20 group ${selectedPreset === p.id ? "border-primary-500" : "border-border-subtle/60 hover:border-border-subtle"}`}
											>
												<span className="font-mono text-xs font-bold uppercase tracking-wider text-fg-default group-hover:text-primary-500 transition-colors">{p.name}</span>
												<div className="flex gap-1.5 pt-2">
													<div className="size-3.5 rounded border border-border-subtle/30" style={{ backgroundColor: p.primary }} />
													<div className="size-3.5 rounded border border-border-subtle/30" style={{ backgroundColor: p.panelBg }} />
													<div className="size-3.5 rounded border border-border-subtle/30" style={{ backgroundColor: p.canvasBg }} />
												</div>
											</div>
										))}
									</div>
								) : (
									<div className="space-y-4 text-left animate-in fade-in duration-200">
										<div className="space-y-2">
											<label className="text-[10px] font-mono font-bold text-fg-muted uppercase tracking-wider">Primary Action Vector</label>
											<div className="flex items-center gap-3">
												<input type="color" value={customPrimary} onChange={(e) => setCustomPrimary(e.target.value)} className="size-10 bg-transparent border border-border-subtle rounded cursor-pointer" />
												<input type="text" value={customPrimary} onChange={(e) => setCustomPrimary(e.target.value)} className="flex-1 h-10 px-3 bg-bg-canvas border border-border-subtle rounded-md font-mono text-xs uppercase font-bold text-fg-default focus:outline-none" />
											</div>
										</div>
										<div className="space-y-2">
											<label className="text-[10px] font-mono font-bold text-fg-muted uppercase tracking-wider">Panel Core Background</label>
											<div className="flex items-center gap-3">
												<input type="color" value={customPanel} onChange={(e) => setCustomPanel(e.target.value)} className="size-10 bg-transparent border border-border-subtle rounded cursor-pointer" />
												<input type="text" value={customPanel} onChange={(e) => setCustomPanel(e.target.value)} className="flex-1 h-10 px-3 bg-bg-canvas border border-border-subtle rounded-md font-mono text-xs uppercase font-bold text-fg-default focus:outline-none" />
											</div>
										</div>
									</div>
								)}
							</div>

							{/* Live preview */}
							<div className="lg:col-span-5 border border-border-subtle bg-bg-canvas/50 p-6 rounded-xl flex flex-col space-y-4 sticky top-4">
								<div className="text-left font-mono text-[10px] text-fg-muted uppercase tracking-wider flex items-center gap-1.5 select-none">
									<Paintbrush className="size-3.5" /> Real-Time Buffering
								</div>
								<div className="w-full rounded-xl border border-border-subtle/80 p-5 space-y-4 transition-all duration-300 shadow-xl" style={{ backgroundColor: activeThemeColors.canvasBg }}>
									<div className="w-full p-4 rounded-lg border flex items-center justify-between shadow-sm" style={{ backgroundColor: activeThemeColors.panelBg, borderColor: `${activeThemeColors.primary}30` }}>
										<div className="flex items-center gap-2">
											<div className="size-2 rounded-full animate-pulse" style={{ backgroundColor: activeThemeColors.primary }} />
											<div className="h-2 w-20 rounded bg-fg-default/20" />
										</div>
										<div className="h-4 w-12 rounded flex items-center justify-center text-[8px] font-mono font-bold text-white" style={{ backgroundColor: activeThemeColors.primary }}>LIVE</div>
									</div>
									<div className="grid grid-cols-2 gap-2">
										<div className="h-16 rounded-md bg-fg-default/[0.01] border border-border-subtle/30 p-2.5 space-y-2">
											<div className="h-1.5 w-10 rounded bg-fg-muted/30" />
											<div className="h-2.5 w-14 rounded" style={{ backgroundColor: activeThemeColors.primary }} />
										</div>
										<div className="h-16 rounded-md bg-fg-default/[0.01] border border-border-subtle/30 p-2.5 space-y-2">
											<div className="h-1.5 w-14 rounded bg-fg-muted/30" />
											<div className="h-1.5 w-8 rounded bg-fg-default/20" />
										</div>
									</div>
								</div>
								<div className="text-[11px] font-mono tracking-wide text-center text-fg-muted pt-1">
									Active Vector: <span className="font-bold" style={{ color: activeThemeColors.primary }}>{activeThemeColors.primary}</span>
								</div>
							</div>
						</div>

						<div className="flex items-center justify-between w-full max-w-5xl pt-2">
							<button onClick={() => handleStepTransition("PROVISION_DOMAIN")} className="inline-flex items-center font-mono text-[10px] uppercase font-bold tracking-wider text-fg-muted hover:text-fg-default transition-colors">
								<ArrowLeft className="size-3.5 mr-1" /> Back
							</button>
							<button onClick={() => handleStepTransition("BOT_INVITE")} className="inline-flex items-center gap-2 bg-primary-500 hover:bg-primary-600 text-white font-mono font-bold text-xs uppercase tracking-wider h-12 px-8 rounded-control transition-all shadow-lg shadow-primary-500/10 active:scale-98 cursor-pointer">
								Continue <ArrowRight className="size-3.5" />
							</button>
						</div>
					</div>
				)}

				{/* ═══════════════ STEP 2C: BOT INVITE ═══════════════ */}
				{step === "BOT_INVITE" && (
					<div className="w-full max-w-2xl flex flex-col items-center space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
						<div className="space-y-4 text-center">
							<div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-primary-50 border border-primary-500/20 text-primary-500 text-[10px] font-mono font-bold uppercase tracking-widest select-none">
								Step 3 // Engine Deployment Core
							</div>
							<h1 className="text-hero text-fg-default font-black tracking-tighter sm:text-4xl lg:text-5xl max-w-2xl leading-none">
								Deploy Headless Client Bot
							</h1>
							<p className="text-sm text-fg-muted max-w-md mx-auto leading-relaxed">
								Add our orchestrator bot to your Discord server to enable matchmaking, ELO tracking, and lifecycle management.
							</p>
						</div>

						<div className="w-full max-w-md bg-panel-bg/40 backdrop-blur-md p-6 rounded-xl border border-border-subtle/80 flex flex-col items-center space-y-5 text-center">
							<div className={`p-4 rounded-full border ${botInvited ? "bg-success/10 border-success/20 text-success" : "bg-primary-500/10 border-primary-500/10 text-primary-500 animate-pulse"}`}>
								{botInvited ? <CheckCircle2 className="size-8" /> : <Bot className="size-8" />}
							</div>
							<div className="space-y-1">
								<h3 className="text-sm font-mono font-bold uppercase text-fg-default">
									{botInvited ? "Bot Instance Deployed" : "RBW Engine Client v2"}
								</h3>
								<p className="text-xs text-fg-muted">
									{botInvited ? `Connected to ${activeGuild?.name ?? "your server"}` : "Requires Administrator permission to deploy"}
								</p>
							</div>

							{!botInvited && (
								<a
									href={`https://discord.com/oauth2/authorize?client_id=${process.env.NEXT_PUBLIC_DISCORD_CLIENT_ID ?? ""}&permissions=8&scope=bot+applications.commands&guild_id=${activeGuild?.id ?? ""}`}
									target="_blank"
									rel="noopener noreferrer"
									onClick={() => setTimeout(() => setBotInvited(true), 3000)}
									className="w-full inline-flex items-center justify-center gap-2 bg-primary-500 hover:bg-primary-600 text-white font-mono font-bold text-xs uppercase tracking-wider h-11 px-6 rounded-control transition-all shadow-lg shadow-primary-500/10 active:scale-98 cursor-pointer"
								>
									Open Discord Invite <ExternalLink className="size-3.5" />
								</a>
							)}

							<button
								onClick={() => setBotInvited(true)}
								className="text-[10px] font-mono text-fg-muted/60 hover:text-fg-muted uppercase tracking-wider underline"
							>
								{botInvited ? "Confirmed" : "Mark as added manually"}
							</button>
						</div>

						<div className="flex items-center justify-between w-full max-w-md pt-2">
							<button onClick={() => handleStepTransition("THEME_SELECT")} className="inline-flex items-center font-mono text-[10px] uppercase font-bold tracking-wider text-fg-muted hover:text-fg-default transition-colors">
								<ArrowLeft className="size-3.5 mr-1" /> Back
							</button>
							<button
								disabled={!!registeringId}
								onClick={handleCompleteRegistration}
								className="inline-flex items-center gap-2 bg-primary-500 hover:bg-primary-600 disabled:opacity-60 text-white font-mono font-bold text-xs uppercase tracking-wider h-12 px-8 rounded-control transition-all shadow-lg active:scale-98 cursor-pointer"
							>
								{registeringId ? (
									<><Loader2 className="size-3.5 animate-spin" /> Provisioning...</>
								) : (
									<>Complete Setup <ArrowRight className="size-3.5" /></>
								)}
							</button>
						</div>

						{registerError && (
							<div className="w-full max-w-md flex items-center gap-3 p-3 rounded-lg border border-danger/30 bg-danger/10 text-danger">
								<AlertCircle className="size-4 shrink-0" />
								<p className="font-mono text-[10px] uppercase">{registerError}</p>
							</div>
						)}
					</div>
				)}

				{/* ═══════════════ SUCCESS ═══════════════ */}
				{step === "SUCCESS_MOCK" && (
					<div className="w-full max-w-2xl flex flex-col items-center space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300 text-center">
						<div className="p-6 bg-success/10 border border-success/20 rounded-full">
							<CheckCircle2 className="size-12 text-success" />
						</div>
						<div className="space-y-3">
							<div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-success/10 border border-success/20 text-success text-[10px] font-mono font-bold uppercase tracking-widest">
								Workspace Provisioned
							</div>
							<h1 className="text-hero text-fg-default font-black tracking-tighter sm:text-4xl lg:text-5xl leading-none">
								Setup Complete
							</h1>
							<p className="text-sm text-fg-muted max-w-md mx-auto leading-relaxed">
								<span className="font-bold text-fg-default">{activeGuild?.name}</span> has been registered and is ready to configure.
							</p>
						</div>

						<button
							onClick={() => router.push(`/dashboard/${activeGuild?.id}?tour=1`)}
							className="inline-flex items-center gap-3 bg-primary-500 hover:bg-primary-600 text-white font-mono font-bold text-sm uppercase tracking-wider h-14 px-10 rounded-control transition-all shadow-lg shadow-primary-500/20 active:scale-98 cursor-pointer"
						>
							Open Dashboard <ArrowRight className="size-4" />
						</button>
					</div>
				)}
			</div>
		</div>
	);
}
