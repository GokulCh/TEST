"use client";

import { CheckCircle, Globe, Info } from "lucide-react";
import { use, useMemo } from "react";
import { Field, InfoCard, InfoText, Panel, StatRow } from "@/components/panel/form-parts";
import { PageShell } from "@/components/panel/page-shell";
import { useGuildConfig } from "@/features/dashboard/config-provider";
import { useSectionForm } from "@/hooks/use-section-form";
import { PUBLIC_PORTAL_ROOT_DOMAIN } from "@/lib/config-public-url";
import { extractSubdomain, isValidSubdomain } from "@/lib/portal-domain-utils";

const subdomainProblem = (sub: string) => (sub && !isValidSubdomain(sub) ? "Use letters, numbers and single hyphens, without starting or ending on a hyphen." : null);

const PREVIEW_LINK = "inline-flex items-center rounded-lg border border-primary-500/30 px-3 py-2 text-xs font-medium text-primary-500 transition-colors hover:bg-primary-500/10";

export default function Page({ params }: { params: Promise<{ guildId: string }> }) {
	const { guildId } = use(params);
	const { config, isLoading, isSaving, savePanelSection } = useGuildConfig();
	const rootDomain = PUBLIC_PORTAL_ROOT_DOMAIN;

	const saved = useMemo(() => (config ? ((typeof config.public_domain === "string" && extractSubdomain(config.public_domain)) || "") : null), [config]);
	const { value: subdomain, setValue: setSubdomain, isDirty, submit, error } = useSectionForm<string>(saved, "", (sub) => savePanelSection("domain", sub), (sub) => subdomainProblem(sub));

	const domain = subdomain ? `${subdomain}.${rootDomain}` : "";
	const sslValid = !!saved;

	return (
		<PageShell eyebrow="Networking" title="Portal Domain" loading={isLoading} onSave={submit} saving={isSaving} dirty={isDirty} error={error}>
			<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
				<div className="lg:col-span-2 space-y-6">
					<div className="p-5 border border-primary-500/20 bg-primary-500/5 rounded-xl space-y-3 text-left">
						<div className="flex items-center gap-2"><Globe className="size-4 text-primary-500" /><h3 className="text-sm font-semibold text-fg-default">Public portal preview</h3></div>
						<p className="text-sm leading-6 text-fg-muted">The public community portal is separate from this dashboard. Your registered subdomain routes straight to the live portal for your guild — preview it via the subdomain link below while configuring DNS.</p>
						{domain ? (
							<a href={`https://${domain}`} target="_blank" rel="noreferrer" className={PREVIEW_LINK}>Open {domain}</a>
						) : (
							<a href={`/public/${guildId}`} target="_blank" rel="noreferrer" className={PREVIEW_LINK}>Open portal preview</a>
						)}
					</div>

					<InfoCard icon={<Globe className="size-4 text-primary-500" />} title="Custom Domain Binding">
						<Field label="Public portal subdomain" error={subdomainProblem(subdomain)} hint={`The ${rootDomain} domain is managed by the platform. Subdomains are unique: one already claimed by another guild (or the platform) can't be reused.`}>
							<div className="flex h-9 overflow-hidden rounded-lg border border-border-subtle bg-bg-canvas/40 transition-[border-color,box-shadow] duration-150 focus-within:border-primary-500/60 focus-within:ring-2 focus-within:ring-primary-500/15 has-[input[aria-invalid=true]]:border-danger/60">
								<input
									type="text"
									value={subdomain}
									onChange={(e) => setSubdomain(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
									className="min-w-0 flex-1 bg-transparent px-3 text-sm text-fg-default placeholder:text-fg-muted/60 focus:outline-none"
									aria-label="Portal subdomain"
									aria-invalid={!!subdomainProblem(subdomain) || undefined}
									placeholder="your-guild"
								/>
								<span className="flex items-center border-l border-border-subtle px-3 font-mono text-xs text-fg-muted">.{rootDomain}</span>
							</div>
						</Field>
					</InfoCard>

					<Panel className="p-5 space-y-4">
						<h3 className="text-sm font-semibold text-fg-default border-b border-border-subtle/30 pb-2">Required DNS Records</h3>
						<div className="overflow-x-auto">
							<table className="w-full text-left text-xs border-collapse">
								<thead>
									<tr className="border-b border-border-subtle bg-bg-canvas/50 text-fg-muted font-medium">
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
											<td colSpan={4} className="p-6 text-center text-fg-muted text-xs">Enter a domain above to see required DNS records</td>
										</tr>
									)}
								</tbody>
							</table>
						</div>
					</Panel>
				</div>

				<div className="space-y-6">
					<InfoCard icon={<CheckCircle className="size-4 text-success" />} title="SSL/TLS Status">
						<div className="space-y-3 text-xs text-fg-muted">
							<StatRow label="SSL Encryption" className={`font-semibold ${sslValid ? "text-success" : "text-amber-400"}`}>
								{sslValid ? "VALID" : "PENDING"} (LETS_ENCRYPT)
							</StatRow>
						</div>
					</InfoCard>
					<InfoCard icon={<Info className="size-4 text-cyan-500" />} title="How routing works">
						<InfoText>
							Requests to {subdomain ? `${subdomain}.${rootDomain}` : `your-sub.${rootDomain}`} are routed to your guild&apos;s public portal automatically after the CNAME above points at this platform. No other guild can occupy the same subdomain.
						</InfoText>
					</InfoCard>
				</div>
			</div>
		</PageShell>
	);
}
