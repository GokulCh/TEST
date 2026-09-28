"use client";

/** The screens of the setup wizard. The wizard owns the state; each step gets what it shows and what it may do. */

import type { ReactNode } from "react";
import {
	AlertCircle, ArrowLeft, ArrowRight, Bot, CheckCircle2, ExternalLink, Globe, MessageSquareCode, Paintbrush, PlusCircle,
	RefreshCw, Search, ShieldCheck, Sliders, Sparkles,
} from "lucide-react";
import { ErrorBanner } from "@/components/panel/page-shell";
import { PUBLIC_PORTAL_ROOT_DOMAIN } from "@/lib/config-public-url";
import type { PanelGuild } from "@/lib/db-types";
import { THEME_PRESETS, type ThemePreset } from "@/lib/theme-presets";
import { Button } from "@/components/panel/form-parts";
import { isValidSubdomain } from "@/lib/portal-domain-utils";

const enter = "motion-page";
const heroTitle = "text-hero text-fg-default text-center font-bold tracking-tighter leading-[1.05]";

function Badge({ children, tone = "primary" }: { children: ReactNode; tone?: "primary" | "success" }) {
	const cls = tone === "success" ? "bg-success/10 border-success/20 text-success" : "bg-primary-50 border-primary-500/20 text-primary-500 select-none";
	return <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-md border text-xs font-medium ${cls}`}>{children}</div>;
}

/** The wizard's full step order, for the persistent progress track. */
export const WIZARD_STEPS = [
	{ id: "DISCORD_CONNECT", label: "Sign in" },
	{ id: "SERVER_SELECT", label: "Server" },
	{ id: "PROVISION_DOMAIN", label: "Domain" },
	{ id: "THEME_SELECT", label: "Theme" },
	{ id: "BOT_INVITE", label: "Invite bot" },
	{ id: "SUCCESS_MOCK", label: "Done" },
] as const;

/** Numbered track across the whole flow; each per-step screen still shows its own finer-grained badge underneath. */
export function StepProgress({ current }: { current: (typeof WIZARD_STEPS)[number]["id"] }) {
    const activeIndex = WIZARD_STEPS.findIndex((s) => s.id === current);
    const progressPercent = activeIndex / (WIZARD_STEPS.length - 1);

    return (
        <div className="relative mx-auto w-full max-w-2xl px-3" aria-label="Setup progress">
            {/* Track Background Line */}
            <div className="absolute top-3 left-[8.33%] right-[8.33%] h-px bg-border-subtle" />

            {/* Active Track Progress Line */}
            <div
                className="absolute top-3 left-[8.33%] h-px bg-primary-500 transition-all duration-300"
                style={{ width: `calc(83.34% * ${progressPercent})` }}
            />

            {/* Step Nodes */}
            <ol className="relative z-10 grid grid-cols-6 text-center">
                {WIZARD_STEPS.map((s, i) => {
                    const done = i < activeIndex;
                    const active = i === activeIndex;

                    return (
                        <li key={s.id} className="flex flex-col items-center">
                            {/* Circle Indicator */}
                            <span
                                aria-current={active ? "step" : undefined}
                                className={`flex size-6 items-center justify-center rounded-full border text-[11px] font-semibold leading-none transition-colors duration-200 ${
                                    done
                                        ? "border-primary-500 bg-primary-500 text-white"
                                        : active
                                            ? "border-primary-500 bg-bg-canvas text-primary-500"
                                            : "border-border-subtle bg-bg-canvas text-fg-muted"
                                }`}
                            >
                                {done ? <CheckCircle2 className="size-3.5" /> : <span>{i + 1}</span>}
                            </span>

                            {/* Label */}
                            <span
                                className={`mt-1.5 hidden text-center text-[11px] font-medium sm:block ${
                                    active ? "text-fg-default" : "text-fg-muted"
                                }`}
                            >
                                {s.label}
                            </span>
                        </li>
                    );
                })}
            </ol>
        </div>
    );
}

function BackButton({ onClick, children = "Back" }: { onClick: () => void; children?: ReactNode }) {
	return (
		<Button variant="secondary" onClick={onClick}>
			<ArrowLeft className="size-3.5 mr-1" /> {children}
		</Button>
	);
}

function NavRow({ width, back, next }: { width: string; back: ReactNode; next: ReactNode }) {
	return <div className={`flex items-center justify-between w-full ${width} pt-2`}>{back}{next}</div>;
}

// ── 1. Discord ──────────────────────────────────────────────────────────────

const OAUTH_ERRORS: Record<string, string> = { invalid_state: "CSRF validation failed — please try again.", access_denied: "Discord access was denied." };

export function ConnectStep({ oauthError, loading, onConnect }: { oauthError: string | null; loading: boolean; onConnect: () => void }) {
	return (
		<div className={`w-full max-w-3xl flex flex-col items-center space-y-8 ${enter}`}>
			<Badge>Step 1 · Sign in</Badge>
			<h1 className={`${heroTitle} sm:text-5xl lg:text-6xl max-w-2xl`}>Connect your Discord account</h1>
			<p className="text-description max-w-2xl font-medium text-fg-muted text-base sm:text-lg leading-relaxed">
				Connect Discord to manage your servers or set up a new one.
				<span className="block mt-2 text-sm text-fg-muted/80">We only read which servers you manage.</span>
			</p>

			{oauthError && (
				<div className="w-full max-w-md flex items-center gap-3 p-4 rounded-xl border border-danger/30 bg-danger/10 text-danger">
					<AlertCircle className="size-4 shrink-0" />
					<p className="text-xs">{OAUTH_ERRORS[oauthError] ?? `Auth error: ${oauthError}`}</p>
				</div>
			)}

			<div className="w-full max-w-md pt-4">
				<Button variant="secondary" className="group h-auto w-full justify-between py-4" onClick={onConnect} loading={loading}>
					<div className="flex items-center gap-4">
						<div className="p-3 bg-muted rounded-lg group-hover:bg-primary-500/10 group-hover:text-primary-500 transition-colors">
							<MessageSquareCode className="h-6 w-6" />
						</div>
						<div className="text-left">
							<h3 className="text-sm font-semibold text-fg-default">Authorize with Discord</h3>
							<p className="text-xs text-fg-muted mt-0.5">Sign in securely with OAuth2.</p>
						</div>
					</div>
					<ArrowRight className="size-4 text-fg-muted group-hover:text-primary-500 group-hover:translate-x-1 transition-all" />
				</Button>
			</div>
		</div>
	);
}

// ── 2. Server select ────────────────────────────────────────────────────────

function GuildTile({ guild, onClick, tone, fallback, caption }: { guild: PanelGuild; onClick: () => void; tone: "success" | "primary"; fallback: ReactNode; caption: string }) {
	const configured = tone === "success";
	return (
		<div
			onClick={onClick}
			className={`group block p-5 rounded-xl border-2 backdrop-blur-md transition-all duration-200 active:scale-98 cursor-pointer ${
				configured ? "border-border-subtle/60 bg-panel-bg/40 hover:border-success/50" : "border-dashed border-border-subtle/60 bg-panel-bg/20 hover:border-primary-500/50"
			}`}
		>
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-4">
					{guild.iconUrl ? (
						// eslint-disable-next-line @next/next/no-img-element
						<img src={guild.iconUrl} alt="" className="size-10 rounded-lg object-cover border border-border-subtle/40" />
					) : (
						<div className={`p-3 bg-muted rounded-lg transition-colors ${configured ? "group-hover:bg-success/10 group-hover:text-success" : "group-hover:bg-primary-500/10 group-hover:text-primary-500"}`}>{fallback}</div>
					)}
					<div>
						<h3 className="text-sm font-semibold text-fg-default truncate max-w-[200px]">{guild.name}</h3>
						<p className="text-xs text-fg-muted mt-1 leading-relaxed">{caption}</p>
					</div>
				</div>
				<ArrowRight className={`size-4 shrink-0 text-fg-muted group-hover:translate-x-1 transition-all ${configured ? "group-hover:text-success" : "group-hover:text-primary-500"}`} />
			</div>
		</div>
	);
}

const emptyNote = "text-xs text-fg-muted border border-dashed border-border-subtle/60 rounded-lg p-4";

export function ServerSelectStep({
    configured,
    unconfigured,
    pendingCount,
    loading,
    error,
    query,
    onQuery,
    onReload,
    onOpen,
    onNew,
    onShowMore,
    onBack,
}: {
    configured: PanelGuild[];
    /** Already limited to what is visible. */
    unconfigured: PanelGuild[];
    pendingCount: number;
    loading: boolean;
    error: string | null;
    query: string;
    onQuery: (q: string) => void;
    onReload: () => void;
    onOpen: (g: PanelGuild) => void;
    onNew: (g: PanelGuild) => void;
    onShowMore: () => void;
    onBack: () => void;
}) {
    return (
        <div className={`w-full flex flex-col items-center space-y-8 ${enter}`}>
            {/* Header Section */}
            <div className="w-full max-w-7xl flex flex-col items-center space-y-4 text-center">
                <Badge>Your servers</Badge>
                <h1 className={`${heroTitle} sm:text-5xl lg:text-6xl`}>Choose a server</h1>
            </div>

            {/* Search Bar + Resync Button Controls Bar */}
            <div className="w-full max-w-xl flex items-center gap-3">
                <div className="relative flex-1">
                    <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-fg-muted/70">
                        <Search className="size-4" />
                    </div>
                    <input
                        type="text"
                        value={query}
                        onChange={(e) => onQuery(e.target.value)}
                        placeholder="Search indexing nodes..."
                        className="w-full h-12 pl-11 pr-4 bg-panel-bg/40 backdrop-blur-md border border-border-subtle rounded-control font-medium text-sm text-fg-default placeholder-fg-muted focus:outline-none focus:border-primary-500/50 transition-colors"
                    />
                </div>
                <Button
                    variant="secondary"
                    onClick={onReload}
                    title="Refresh guild list"
                    className="size-12 p-0 flex items-center justify-center shrink-0 rounded-control"
                >
                    <RefreshCw className={`size-4 ${loading ? "animate-spin text-primary-500" : ""}`} />
                </Button>
            </div>

            {error && (
                <div className="w-full max-w-xl flex items-center gap-3 p-4 rounded-xl border border-danger/30 bg-danger/10 text-danger">
                    <AlertCircle className="size-4 shrink-0" />
                    <p className="font-mono text-xs">{error}</p>
                    <Button variant="secondary" className="ml-auto" onClick={onReload}>Retry</Button>
                </div>
            )}

            {loading && (
                <div className="w-full max-w-7xl grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="h-24 rounded-xl border border-border-subtle/40 bg-panel-bg/20 animate-pulse" />
                    ))}
                </div>
            )}

            {!loading && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 w-full max-w-7xl pt-2 text-left items-start">
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 px-1">
                            <Sliders className="size-3.5 text-primary-500" />
                            <h2 className="text-[13px] font-semibold text-fg-default">Configured Workspaces</h2>
                            <span className="text-xs px-1.5 py-0.5 rounded bg-panel-bg/80 border border-border-subtle text-fg-muted">{configured.length} Active</span>
                        </div>
                        <div className="space-y-3 max-h-[26rem] overflow-y-auto pr-1 select-none">
                            {configured.length === 0 && <p className={emptyNote}>No configured workspaces yet.</p>}
                            {configured.map((g) => (
                                <GuildTile key={g.id} guild={g} tone="success" onClick={() => onOpen(g)} fallback={<ShieldCheck className="h-5 w-5" />} caption={`${g.owner ? "Server Owner" : "Admin"} · Click to open dashboard`} />
                            ))}
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center gap-2 px-1">
                            <PlusCircle className="size-3.5 text-fg-muted" />
                            <h2 className="text-xs font-medium text-fg-muted">Available Guilds</h2>
                            <span className="text-xs px-1.5 py-0.5 rounded bg-panel-bg/40 border border-border-subtle/40 text-fg-muted/60">{pendingCount} Pending</span>
                        </div>
                        <div className="space-y-3 max-h-[26rem] overflow-y-auto pr-1 select-none">
                            {unconfigured.length === 0 && <p className={emptyNote}>All your servers are already configured.</p>}
                            {unconfigured.map((g) => (
                                <GuildTile key={g.id} guild={g} tone="primary" onClick={() => onNew(g)} fallback={<Sparkles className="h-5 w-5" />} caption="Unconfigured. Click to deploy engine instance." />
                            ))}
                            {pendingCount > unconfigured.length && (
                                <Button variant="secondary" className="w-full" onClick={onShowMore}>
                                    Show more...
                                </Button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            <div className="pt-4 w-full max-w-7xl text-left">
                <Button variant="secondary" onClick={onBack}>
                    <ArrowLeft className="size-4 mr-2" /> Back to Verification
                </Button>
            </div>
        </div>
    );
}

// ── 3. Domain ───────────────────────────────────────────────────────────────

export function DomainStep({ guildName, subdomain, onSubdomain, onBack, onNext }: { guildName?: string; subdomain: string; onSubdomain: (v: string) => void; onBack: () => void; onNext: () => void }) {
	return (
		<div className={`w-full max-w-2xl flex flex-col items-center space-y-8 ${enter}`}>
			<div className="space-y-4 text-center">
				<Badge>Step 1 of 3 · Portal address</Badge>
				<h1 className={`${heroTitle} sm:text-4xl lg:text-5xl max-w-2xl`}>Claim your portal address</h1>
				{guildName && (
					<p className="text-xs text-fg-muted">
						Setting up: <span className="text-primary-500 font-semibold">{guildName}</span>
					</p>
				)}
			</div>

			<div className="w-full max-w-md bg-panel-bg/40 backdrop-blur-md p-6 rounded-xl border border-border-subtle/80 text-left space-y-4">
				<label className="text-[13px] font-semibold text-fg-default flex items-center gap-1.5">
					<Globe className="size-3.5 text-primary-500" /> Portal address
				</label>
				<div className="flex items-center relative rounded-control border border-border-subtle bg-bg-canvas overflow-hidden focus-within:border-primary-500/50 transition-colors">
					<input
						type="text"
						value={subdomain}
						onChange={(e) => onSubdomain(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
						placeholder="your-guild"
						className="flex-1 h-12 px-4 text-sm font-semibold text-fg-default bg-transparent focus:outline-none text-right placeholder-fg-muted/50"
					/>
					<div className="h-12 px-4 bg-muted border-l border-border-subtle flex items-center text-xs font-medium text-fg-muted select-none">.{PUBLIC_PORTAL_ROOT_DOMAIN}</div>
				</div>
				{subdomain && !isValidSubdomain(subdomain) && <p role="alert" className="text-xs text-danger motion-fade">Use letters, numbers and single hyphens, without starting or ending on a hyphen.</p>}
			</div>

			<NavRow
				width="max-w-md"
				back={<BackButton onClick={onBack} />}
				next={
					<Button variant="primary" disabled={!subdomain.trim() || !isValidSubdomain(subdomain)} onClick={onNext} className="h-11 px-6" icon={<ArrowRight className="size-3.5" />}>Continue</Button>
				}
			/>
		</div>
	);
}

// ── 4. Theme ────────────────────────────────────────────────────────────────

export interface ThemeChoice {
	mode: "preset" | "custom";
	presetId: string;
	customPrimary: string;
	customPanel: string;
}

/** What the wizard shows for a choice: the preset's palette, or the two custom colors over a fixed canvas. */
export function resolveTheme(choice: ThemeChoice): Pick<ThemePreset, "id" | "name" | "primary" | "panelBg" | "canvasBg"> {
	if (choice.mode === "preset") return THEME_PRESETS[choice.presetId] ?? THEME_PRESETS.emerald;
	return { id: "custom", name: "Custom", primary: choice.customPrimary, panelBg: choice.customPanel, canvasBg: "#0f172a" };
}

function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
	return (
		<div className="space-y-2">
			<label className="text-xs font-medium text-fg-muted">{label}</label>
			<div className="flex items-center gap-3">
				<input type="color" value={value} onChange={(e) => onChange(e.target.value)} className="size-10 bg-transparent border border-border-subtle rounded cursor-pointer" />
				<input type="text" value={value} onChange={(e) => onChange(e.target.value)} className="flex-1 h-10 px-3 bg-bg-canvas border border-border-subtle rounded-md text-[13px] font-semibold text-fg-default focus:outline-none" />
			</div>
		</div>
	);
}

export function ThemeStep({ choice, onChoice, onBack, onNext }: { choice: ThemeChoice; onChoice: (patch: Partial<ThemeChoice>) => void; onBack: () => void; onNext: () => void }) {
	const active = resolveTheme(choice);
	const tab = (mode: ThemeChoice["mode"], label: string) => (
		<button
			onClick={() => onChoice({ mode })}
			className={`py-2 text-xs font-medium rounded-md transition-colors ${choice.mode === mode ? "bg-bg-canvas text-fg-default shadow-sm" : "text-fg-muted hover:text-fg-default"}`}
		>
			{label}
		</button>
	);

	return (
		<div className={`w-full max-w-5xl flex flex-col items-center space-y-8 ${enter}`}>
			<div className="space-y-4 text-center max-w-2xl">
				<Badge>Step 2 of 3 · Appearance</Badge>
				<h1 className={`${heroTitle} sm:text-4xl lg:text-5xl max-w-2xl`}>Select Interface Theme</h1>
			</div>

			<div className="grid grid-cols-1 lg:grid-cols-12 gap-8 w-full items-start">
				<div className="lg:col-span-7 bg-panel-bg/40 border border-border-subtle p-6 rounded-xl space-y-6">
					<div className="grid grid-cols-2 gap-2 bg-muted p-1 rounded-lg border border-border-subtle/40">
						{tab("preset", `System Presets (${Object.keys(THEME_PRESETS).length})`)}
						{tab("custom", "Custom")}
					</div>

					{choice.mode === "preset" ? (
						<div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[22.5rem] overflow-y-auto pr-1.5 text-left">
							{Object.values(THEME_PRESETS).map((p) => (
								<div
									key={p.id}
									onClick={() => onChoice({ presetId: p.id })}
									className={`p-4 rounded-xl border-2 bg-bg-canvas cursor-pointer transition-all active:scale-[0.98] flex flex-col justify-between h-20 group ${choice.presetId === p.id ? "border-primary-500" : "border-border-subtle/60 hover:border-border-subtle"}`}
								>
									<span className="text-[13px] font-semibold text-fg-default group-hover:text-primary-500 transition-colors">{p.name}</span>
									<div className="flex gap-1.5 pt-2">
										{[p.primary, p.panelBg, p.canvasBg].map((c) => (
											<div key={c} className="size-3.5 rounded border border-border-subtle/30" style={{ backgroundColor: c }} />
										))}
									</div>
								</div>
							))}
						</div>
					) : (
						<div className="space-y-4 text-left motion-fade">
							<ColorField label="Primary Action Vector" value={choice.customPrimary} onChange={(customPrimary) => onChoice({ customPrimary })} />
							<ColorField label="Panel background" value={choice.customPanel} onChange={(customPanel) => onChoice({ customPanel })} />
						</div>
					)}
				</div>

				<div className="lg:col-span-5 border border-border-subtle bg-bg-canvas/50 p-6 rounded-xl flex flex-col space-y-4 sticky top-4">
					<div className="text-left text-xs text-fg-muted flex items-center gap-1.5 select-none">
						<Paintbrush className="size-3.5" /> Real-Time Buffering
					</div>
					<div className="w-full rounded-xl border border-border-subtle/80 p-5 space-y-4 transition-all duration-300 shadow-xl" style={{ backgroundColor: active.canvasBg }}>
						<div className="w-full p-4 rounded-lg border flex items-center justify-between shadow-sm" style={{ backgroundColor: active.panelBg, borderColor: `${active.primary}30` }}>
							<div className="flex items-center gap-2">
								<div className="size-2 rounded-full animate-pulse" style={{ backgroundColor: active.primary }} />
								<div className="h-2 w-20 rounded bg-fg-default/20" />
							</div>
							<div className="h-4 w-12 rounded flex items-center justify-center text-xs font-medium text-white" style={{ backgroundColor: active.primary }}>LIVE</div>
						</div>
						<div className="grid grid-cols-2 gap-2">
							<div className="h-16 rounded-md bg-fg-default/[0.01] border border-border-subtle/30 p-2.5 space-y-2">
								<div className="h-1.5 w-10 rounded bg-fg-muted/30" />
								<div className="h-2.5 w-14 rounded" style={{ backgroundColor: active.primary }} />
							</div>
							<div className="h-16 rounded-md bg-fg-default/[0.01] border border-border-subtle/30 p-2.5 space-y-2">
								<div className="h-1.5 w-14 rounded bg-fg-muted/30" />
								<div className="h-1.5 w-8 rounded bg-fg-default/20" />
							</div>
						</div>
					</div>
					<div className="text-xs text-center text-fg-muted pt-1">
						Active Vector: <span className="font-bold" style={{ color: active.primary }}>{active.primary}</span>
					</div>
				</div>
			</div>

			<NavRow
				width="max-w-5xl"
				back={<BackButton onClick={onBack} />}
				next={
					<Button variant="primary" onClick={onNext} className="h-12 px-8" icon={<ArrowRight className="size-3.5" />}>Continue</Button>
				}
			/>
		</div>
	);
}

// ── 5. Bot invite ───────────────────────────────────────────────────────────

export function InviteStep({
	guild,
	invited,
	onInvited,
	registering,
	error,
	onBack,
	onComplete,
}: {
	guild: { id: string; name: string } | null;
	invited: boolean;
	onInvited: () => void;
	registering: boolean;
	error: string | null;
	onBack: () => void;
	onComplete: () => void;
}) {
	return (
		<div className={`w-full max-w-2xl flex flex-col items-center space-y-8 ${enter}`}>
			<div className="space-y-4 text-center">
				<Badge>Step 3 of 3 · Invite the bot</Badge>
				<h1 className={`${heroTitle} sm:text-4xl lg:text-5xl max-w-2xl`}>Invite the bot to your server</h1>
				<p className="text-sm text-fg-muted max-w-md mx-auto leading-relaxed">Add our orchestrator bot to your Discord server to enable matchmaking, ELO tracking, and lifecycle management.</p>
			</div>

			<div className="w-full max-w-md bg-panel-bg/40 backdrop-blur-md p-6 rounded-xl border border-border-subtle/80 flex flex-col items-center space-y-5 text-center">
				<div className={`p-4 rounded-full border ${invited ? "bg-success/10 border-success/20 text-success" : "bg-primary-500/10 border-primary-500/10 text-primary-500 animate-pulse"}`}>
					{invited ? <CheckCircle2 className="size-8" /> : <Bot className="size-8" />}
				</div>
				<div className="space-y-1">
					<h3 className="text-sm font-semibold text-fg-default">{invited ? "Bot invited" : "Ranked Bedwars bot"}</h3>
					<p className="text-xs text-fg-muted">{invited ? `Connected to ${guild?.name ?? "your server"}` : "Requires Administrator permission to deploy"}</p>
				</div>

				{!invited && (
					<a
						href={`https://discord.com/oauth2/authorize?client_id=${process.env.NEXT_PUBLIC_DISCORD_CLIENT_ID ?? ""}&permissions=8&scope=bot+applications.commands&guild_id=${guild?.id ?? ""}`}
						target="_blank"
						rel="noopener noreferrer"
						className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-primary-500 px-6 text-[13px] font-medium text-white shadow-sm transition-[background-color,transform] duration-150 hover:bg-primary-600 active:scale-[.98]"
					>
						Open Discord invite <ExternalLink className="size-3.5" />
					</a>
				)}

				<Button variant="secondary" onClick={onInvited}>
					{invited ? "Bot added" : "I’ve added the bot"}
				</Button>
			</div>

			<NavRow
				width="max-w-md"
				back={<BackButton onClick={onBack} />}
				next={
					<Button variant="primary" loading={registering} onClick={onComplete} className="h-12 px-8" icon={<ArrowRight className="size-3.5" />}>{registering ? "Setting up…" : "Complete setup"}</Button>
				}
			/>

			<div className="w-full max-w-md">
				<ErrorBanner>{error}</ErrorBanner>
			</div>
		</div>
	);
}

// ── 6. Done ─────────────────────────────────────────────────────────────────

export function SuccessStep({ guildName, onOpen }: { guildName?: string; onOpen: () => void }) {
	return (
		<div className={`w-full max-w-2xl flex flex-col items-center space-y-8 ${enter} text-center`}>
			<div className="p-6 bg-success/10 border border-success/20 rounded-full">
				<CheckCircle2 className="size-12 text-success" />
			</div>
			<div className="space-y-3">
				<Badge tone="success">Server set up</Badge>
				<h1 className={`${heroTitle} sm:text-4xl lg:text-5xl`}>Setup Complete</h1>
				<p className="text-sm text-fg-muted max-w-md mx-auto leading-relaxed">
					<span className="font-bold text-fg-default">{guildName}</span> has been registered and is ready to configure.
				</p>
			</div>
			<Button variant="primary" onClick={onOpen} className="h-14 px-10 text-sm" icon={<ArrowRight className="size-4" />}>Open dashboard</Button>
		</div>
	);
}
