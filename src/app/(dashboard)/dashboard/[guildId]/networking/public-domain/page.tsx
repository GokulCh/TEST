"use client";

import {
	AlertCircle,
	CheckCircle,
	CheckCircle2,
	Globe,
	Loader2,
	Save,
	Info,
} from "lucide-react";
import { use, useCallback, useEffect, useMemo, useState } from "react";
import { useGuildConfig } from "@/features/dashboard/config-provider";
import { useUnsavedChanges } from "@/hooks/use-unsaved-changes";
import { PUBLIC_PORTAL_ROOT_DOMAIN } from "@/lib/config-public-url";
import { extractSubdomain, isValidSubdomain } from "@/lib/portal-domain-utils";

export default function Page({ params }: { params: Promise<{ guildId: string }> }) {
	const { guildId } = use(params);
	const { dbGuildId } = useGuildConfig();
	const rootDomain = PUBLIC_PORTAL_ROOT_DOMAIN;

	const [subdomain, setSubdomain] = useState("");
	const [savedSubdomain, setSavedSubdomain] = useState<string | null>(null);
	const [loading, setLoading] = useState(true);
	const [isSaving, setIsSaving] = useState(false);
	const [saveSuccess, setSaveSuccess] = useState(false);
	const [saveError, setSaveError] = useState<string | null>(null);

	const domain = subdomain ? `${subdomain}.${rootDomain}` : "";
	const sslStatus = savedSubdomain ? "VALID" : "PENDING";

	const load = useCallback(async () => {
		if (!dbGuildId) return;
		try {
			const res = await fetch(`/api/db/guilds/${dbGuildId}/panel-config`);
			if (!res.ok) throw new Error(`${res.status}`);
			const data = await res.json();
			const stored = data.data?.public_domain;
			const currentSub = typeof stored === "string" ? extractSubdomain(stored) : null;
			setSubdomain(currentSub ?? "");
			setSavedSubdomain(currentSub);
		} catch {
			// fall through to empty (unconfigured) state
		} finally {
			setLoading(false);
		}
	}, [dbGuildId]);

	useEffect(() => { load(); }, [load]);

	const globalLocal = useMemo(() => ({ subdomain }), [subdomain]);
	const globalSaved = useMemo(
		() => (savedSubdomain === null ? null : { subdomain: savedSubdomain }),
		[savedSubdomain],
	);
	useUnsavedChanges(globalLocal, globalSaved);

	const flashSuccess = () => { setSaveSuccess(true); setTimeout(() => setSaveSuccess(false), 2500); };

	const handleSaveChanges = async () => {
		if (!dbGuildId) return;
		setSaveError(null);
		setIsSaving(true);
		try {
			if (subdomain && !isValidSubdomain(subdomain)) {
				throw new Error("Invalid subdomain. Use letters, numbers, and hyphens (no spaces).");
			}
			const res = await fetch(`/api/db/guilds/${dbGuildId}/panel-config`, {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ section: "domain", data: domain }),
			});
			if (!res.ok) {
				const body = await res.json();
				throw new Error(body.error ?? "Save failed");
			}
			setSavedSubdomain(subdomain);
			flashSuccess();
		} catch (e) {
			setSaveError(e instanceof Error ? e.message : "Save failed");
		} finally {
			setIsSaving(false);
		}
	};

	if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="size-6 animate-spin text-primary-500" /></div>;

	return (
		<div className="w-full p-6 lg:p-8 space-y-6 animate-in fade-in duration-300 select-none max-w-7xl mx-auto text-left">
			{/* HUD PANEL HEADER */}
			<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border-subtle pb-6">
				<div>
					<h1 className="font-mono text-[10px] font-bold uppercase tracking-widest text-fg-muted">
						// Gateway Domain Bindings
					</h1>
					<h2 className="text-2xl font-black tracking-tight text-fg-default mt-1">
						Portal Domain Settings
					</h2>
				</div>

				<div className="flex items-center gap-2 self-start sm:self-auto">
					{saveSuccess && <span className="flex items-center gap-1.5 font-mono text-[10px] text-success uppercase tracking-wider"><CheckCircle2 className="size-3.5" /> Saved</span>}
					<button
						onClick={handleSaveChanges}
						disabled={isSaving || !dbGuildId}
						className="h-9 px-4 flex items-center gap-2 border border-primary-500/20 bg-primary-500/10 hover:bg-primary-500/20 text-primary-500 font-mono font-bold text-[11px] uppercase tracking-wider rounded-lg transition-all active:scale-98 cursor-pointer shadow-sm disabled:opacity-60"
					>
						{isSaving ? <Loader2 className="size-3.5 animate-spin" /> : <Save className="size-3.5" />}
						<span>
							{isSaving ? "Saving..." : "Commit Domain Setup"}
						</span>
					</button>
				</div>
			</div>

			{saveError && <div className="flex items-center gap-3 p-3 rounded-lg border border-danger/30 bg-danger/10 text-danger"><AlertCircle className="size-4 shrink-0" /><p className="font-mono text-[10px] uppercase">{saveError}</p></div>}

			<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
				<div className="lg:col-span-2 space-y-6">
					<div className="p-5 border border-primary-500/20 bg-primary-500/5 rounded-xl space-y-3 text-left">
						<div className="flex items-center gap-2"><Globe className="size-4 text-primary-500" /><h3 className="font-mono text-[11px] font-bold text-fg-default uppercase tracking-widest">Public portal preview</h3></div>
						<p className="text-sm leading-6 text-fg-muted">The public community portal is separate from this dashboard. Your registered subdomain routes straight to the live portal for your guild — preview it via the dash-first link below while configuring DNS.</p>
						<a href={`/public/${guildId}`} target="_blank" rel="noreferrer" className="inline-flex items-center rounded-lg border border-primary-500/30 px-3 py-2 font-mono text-[11px] font-bold uppercase tracking-wider text-primary-500 transition-colors hover:bg-primary-500/10">Open portal preview</a>
					</div>
					{/* DOMAIN INPUT */}
					<div className="p-5 border border-border-subtle bg-panel-bg/20 backdrop-blur-md rounded-xl space-y-4 shadow-xs">
						<div className="flex items-center gap-2 border-b border-border-subtle/50 pb-2.5">
							<Globe className="size-4 text-primary-500" />
							<h3 className="font-mono text-[11px] font-bold text-fg-default uppercase tracking-widest">
								Custom Domain Binding
							</h3>
						</div>

						<div className="space-y-1.5 font-mono text-xs text-left">
							<label className="block font-bold text-fg-default uppercase tracking-wider">
								Public Portal Subdomain
							</label>
							<div className="flex h-10 overflow-hidden rounded-lg border border-border-subtle bg-bg-canvas/40 focus-within:border-primary-500/50">
								<input
									type="text"
									value={subdomain}
									onChange={(e) => setSubdomain(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
									className="min-w-0 flex-1 bg-transparent px-3 text-fg-default focus:outline-none"
									aria-label="Portal subdomain"
									placeholder="your-guild"
								/>
								<span className="flex items-center border-l border-border-subtle px-3 text-fg-muted">.{rootDomain}</span>
							</div>
							<p className="text-[10px] normal-case tracking-normal text-fg-muted">The {rootDomain} domain is managed by the platform. Subdomains are unique: a subdomain already claimed by another guild (or the platform) cannot be reused.</p>
						</div>
					</div>

					{/* DNS TABLE */}
					<div className="p-5 border border-border-subtle bg-panel-bg/20 backdrop-blur-md rounded-xl space-y-4 shadow-xs text-left">
						<h3 className="font-mono text-[11px] font-bold text-fg-default uppercase tracking-widest border-b border-border-subtle/30 pb-2">
							Required DNS Records
						</h3>

						<div className="overflow-x-auto">
							<table className="w-full text-left font-mono text-[10px] border-collapse">
								<thead>
									<tr className="border-b border-border-subtle bg-bg-canvas/50 uppercase text-fg-muted font-black tracking-widest">
										<th className="p-3">Type</th>
										<th className="p-3">Name Host</th>
										<th className="p-3">Target Value</th>
										<th className="p-3 text-right">Status</th>
									</tr>
								</thead>
								<tbody className="divide-y divide-border-subtle/40">
									{domain ? (
										<>
											<tr className="hover:bg-panel-bg/5">
												<td className="p-3 font-bold text-fg-default">CNAME</td>
												<td className="p-3">{subdomain}</td>
												<td className="p-3 text-fg-muted">{domain}</td>
												<td className="p-3 text-right text-fg-muted font-bold">Pending</td>
											</tr>
											<tr className="hover:bg-panel-bg/5">
												<td className="p-3 font-bold text-fg-default">TXT</td>
												<td className="p-3">_rbw-verification</td>
												<td className="p-3 text-fg-muted">—</td>
												<td className="p-3 text-right text-fg-muted font-bold">Pending</td>
											</tr>
										</>
									) : (
										<tr>
											<td colSpan={4} className="p-6 text-center text-fg-muted uppercase text-[10px]">
												Enter a domain above to see required DNS records
											</td>
										</tr>
									)}
								</tbody>
							</table>
						</div>
					</div>
				</div>

				<div className="space-y-6">
					<div className="p-5 border border-border-subtle bg-panel-bg/20 backdrop-blur-md rounded-xl space-y-4 h-fit text-left">
						<div className="flex items-center gap-2 border-b border-border-subtle/50 pb-2.5">
							<CheckCircle className="size-4 text-success" />
							<h3 className="font-mono text-[11px] font-bold text-fg-default uppercase tracking-widest">
								SSL/TLS Status
							</h3>
						</div>

						<div className="space-y-3 font-mono text-xs text-fg-muted uppercase">
							<div className="flex justify-between items-center">
								<span>SSL Encryption:</span>
								<span className={`font-black ${sslStatus === "VALID" ? "text-success" : "text-amber-400"}`}>
									{sslStatus} (LETS_ENCRYPT)
								</span>
							</div>
						</div>
					</div>

					<div className="p-5 border border-border-subtle bg-panel-bg/20 backdrop-blur-md rounded-xl space-y-4 h-fit text-left">
						<div className="flex items-center gap-2 border-b border-border-subtle/50 pb-2.5">
							<Info className="size-4 text-cyan-500" />
							<h3 className="font-mono text-[11px] font-bold text-fg-default uppercase tracking-widest">
								How routing works
							</h3>
						</div>
						<p className="font-mono text-[9px] text-fg-muted uppercase tracking-wide leading-relaxed text-left">
							Requests to {subdomain ? `${subdomain}.${rootDomain}` : `your-sub.${rootDomain}`} are routed to your guild&apos;s public portal automatically after the CNAME above points at this platform. No other guild can occupy the same subdomain.
						</p>
					</div>
				</div>
			</div>
		</div>
	);
}