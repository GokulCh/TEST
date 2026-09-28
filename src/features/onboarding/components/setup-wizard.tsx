"use client";

import { toast } from "sonner";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Spinner } from "@/components/panel/form-parts";
import { useGuilds } from "@/hooks/use-guilds";
import { useSession } from "@/hooks/use-session";
import { ApiRequestError, apiSend } from "@/lib/client/api";
import { PUBLIC_PORTAL_ROOT_DOMAIN } from "@/lib/config-public-url";
import type { PanelGuild } from "@/lib/db-types";
import { navigateToDashboard } from "@/lib/routing-utils";
import { ConnectStep, DomainStep, InviteStep, resolveTheme, ServerSelectStep, StepProgress, SuccessStep, ThemeStep, type ThemeChoice } from "./wizard-steps";

type Step = "DISCORD_CONNECT" | "SERVER_SELECT" | "PROVISION_DOMAIN" | "THEME_SELECT" | "BOT_INVITE" | "SUCCESS_MOCK";

interface ActiveGuild {
	id: string;
	name: string;
	dbId?: string;
}

const PAGE_SIZE = 10;

const portalRoot = () => PUBLIC_PORTAL_ROOT_DOMAIN.replace(/^\.+/, "").replace(/^www\./, "").toLowerCase();

/** Registration failures the user can act on get a plain-language message. */
function registrationMessage(err: unknown): string {
	if (!(err instanceof ApiRequestError)) return err instanceof Error ? err.message : "Registration failed";
	if (err.status === 401) return "Authentication expired. Please reconnect your Discord account.";
	if (err.status === 403) return "You don't have permission to register this server.";
	if (err.status === 500) return "Server error. Please try again later.";
	return err.message;
}

export function SetupWizard() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const oauthError = searchParams.get("error");
	const stepParam = searchParams.get("step");

	const { session } = useSession();
	const [step, setStep] = useState<Step>("DISCORD_CONNECT");
	const { guilds, error: guildsError, isLoading: guildsLoading, mutate: reloadGuilds } = useGuilds(step !== "DISCORD_CONNECT");
	const [transitioning, setTransitioning] = useState(false);
	const [connecting, setConnecting] = useState(false);
	const [query, setQuery] = useState("");
	const [visible, setVisible] = useState(PAGE_SIZE);
	const [activeGuild, setActiveGuild] = useState<ActiveGuild | null>(null);
	const [subdomain, setSubdomain] = useState("");
	const [theme, setTheme] = useState<ThemeChoice>({ mode: "preset", presetId: "default", customPrimary: "#3b82f6", customPanel: "#1e293b" });
	const [botInvited, setBotInvited] = useState(false);
	const [registering, setRegistering] = useState(false);
	const [registerError, setRegisterError] = useState<string | null>(null);

	// Returning from the OAuth callback, or already signed in: go straight to the server list.
	useEffect(() => {
		if (oauthError) return; // stay on the connect screen and show the message
		if (stepParam === "server_select" || session) setStep("SERVER_SELECT");
	}, [oauthError, stepParam, session]);

	// The chosen theme repaints the wizard while the user picks.
	const activeTheme = useMemo(() => resolveTheme(theme), [theme]);
	useEffect(() => {
		const root = document.documentElement.style;
		root.setProperty("--primary-500", activeTheme.primary);
		root.setProperty("--primary-600", activeTheme.primary);
		root.setProperty("--primary-50", `${activeTheme.primary}26`);
		root.setProperty("--panel-bg", activeTheme.panelBg);
		root.setProperty("--bg-canvas", activeTheme.canvasBg);
	}, [activeTheme]);

	const filtered = useMemo(() => {
		const q = query.trim().toLowerCase();
		return q ? guilds.filter((g) => g.name.toLowerCase().includes(q)) : guilds;
	}, [query, guilds]);
	const configured = filtered.filter((g) => g.isRegistered);
	const unconfigured = filtered.filter((g) => !g.isRegistered);

	const goTo = (next: Step) => {
		setTransitioning(true);
		setTimeout(() => {
			setTransitioning(false);
			setStep(next);
		}, 250);
	};

	const connect = async () => {
		setConnecting(true);
		try {
			const { url } = await apiSend<{ url?: string }>("POST", "/api/auth/session");
			if (!url) throw new Error("No auth URL returned");
			window.location.href = url;
		} catch {
			setConnecting(false);
			toast.error("Couldn't start the Discord sign-in", { description: "Please try again in a moment." });
		}
	};

	const openConfigured = (guild: PanelGuild) => {
		setTransitioning(true);
		setTimeout(() => {
			if (guild.subdomain) window.location.href = `${window.location.protocol}//${guild.subdomain}.${portalRoot()}/dashboard`;
			else navigateToDashboard(router, guild.id);
		}, 600);
	};

	const startNew = (guild: PanelGuild) => {
		setActiveGuild({ id: guild.id, name: guild.name });
		setSubdomain(guild.name.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 16));
		goTo("PROVISION_DOMAIN");
	};

	/** Registers the guild (idempotent), claims the chosen subdomain, and moves on. */
	const complete = async () => {
		if (!activeGuild) return;
		setRegistering(true);
		setRegisterError(null);
		try {
			const { guild } = await apiSend<{ guild?: { id: string | number } }>("POST", `/api/db/guilds/${activeGuild.id}/register`, { name: activeGuild.name });
			const dbId = guild?.id != null ? String(guild.id) : undefined;
			setActiveGuild({ ...activeGuild, dbId });
			void reloadGuilds(); // it now shows as registered

			if (subdomain.trim() && dbId) {
				// A taken subdomain must not block registration: the user can claim another on the domain page.
				await apiSend("PUT", `/api/db/guilds/${dbId}/config`, { section: "domain", data: subdomain.trim() }).catch(() => toast.warning("Server registered, but the portal address wasn’t saved", { description: "It may already be taken. You can pick another under Networking → Portal Domain." }));
			}
			goTo("SUCCESS_MOCK");
		} catch (err) {
			setRegisterError(registrationMessage(err));
		} finally {
			setRegistering(false);
		}
	};

	const openDashboard = () => {
		if (!activeGuild) return;
		if (subdomain.trim()) window.location.href = `${window.location.protocol}//${subdomain.trim()}.${portalRoot()}/dashboard?tour=1`;
		else navigateToDashboard(router, activeGuild.id, "/dashboard?tour=1");
	};

	return (
		<div className="relative w-full px-8 lg:px-16 py-12 lg:py-20 overflow-hidden">
			{(transitioning || connecting) && (
				<div className="fixed inset-0 bg-bg-canvas/60 backdrop-blur-md z-50 flex flex-col items-center justify-center space-y-4">
					<Spinner className="size-6 text-primary-500" />
					<p className="text-xs text-fg-muted">{connecting ? "Connecting to Discord…" : "Loading…"}</p>
				</div>
			)}

			<div className="mx-auto mb-10 w-full max-w-2xl">
				<StepProgress current={step} />
			</div>

			<div key={step} className="motion-page mx-auto flex flex-col items-center space-y-8">
				{step === "DISCORD_CONNECT" && <ConnectStep oauthError={oauthError} loading={connecting} onConnect={connect} />}

				{step === "SERVER_SELECT" && (
					<ServerSelectStep
						configured={configured}
						unconfigured={unconfigured.slice(0, visible)}
						pendingCount={unconfigured.length}
						loading={guildsLoading}
						error={guildsError}
						query={query}
						onQuery={(q) => {
							setQuery(q);
							setVisible(PAGE_SIZE);
						}}
						onReload={() => void reloadGuilds()}
						onOpen={openConfigured}
						onNew={startNew}
						onShowMore={() => setVisible((v) => v + PAGE_SIZE)}
						onBack={() => setStep("DISCORD_CONNECT")}
					/>
				)}

				{step === "PROVISION_DOMAIN" && <DomainStep guildName={activeGuild?.name} subdomain={subdomain} onSubdomain={setSubdomain} onBack={() => goTo("SERVER_SELECT")} onNext={() => goTo("THEME_SELECT")} />}

				{step === "THEME_SELECT" && <ThemeStep choice={theme} onChoice={(patch) => setTheme((t) => ({ ...t, ...patch }))} onBack={() => goTo("PROVISION_DOMAIN")} onNext={() => goTo("BOT_INVITE")} />}

				{step === "BOT_INVITE" && (
					<InviteStep guild={activeGuild} invited={botInvited} onInvited={() => setBotInvited(true)} registering={registering} error={registerError} onBack={() => goTo("THEME_SELECT")} onComplete={complete} />
				)}

				{step === "SUCCESS_MOCK" && <SuccessStep guildName={activeGuild?.name} onOpen={openDashboard} />}
			</div>
		</div>
	);
}
