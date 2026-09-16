"use client";

import {
	Globe,
	Save,
	CheckCircle,
	XCircle,
	SlidersHorizontal,
	Info,
} from "lucide-react";
import { use, useState, useMemo } from "react";
import { useUnsavedChanges } from "@/hooks/use-unsaved-changes";

export default function Page({ params }: { params: Promise<{ guildId: string }> }) {
	const { guildId } = use(params);
	const [isSaving, setIsSaving] = useState(false);
	const [domain, setDomain] = useState("");
	const [sslStatus, setSslStatus] = useState("VALID");
	const [savedSnapshot, setSavedSnapshot] = useState(() => ({ domain: "", sslStatus: "VALID" }));

	const globalLocal = useMemo(() => ({ domain, sslStatus }), [domain, sslStatus]);
	const globalSaved = useMemo(() => savedSnapshot, [savedSnapshot]);
	useUnsavedChanges(globalLocal, globalSaved);

	const handleSaveChanges = () => {
		setSavedSnapshot({ domain, sslStatus });
		setIsSaving(true);
		setTimeout(() => setIsSaving(false), 900);
	};

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

				<button
					onClick={handleSaveChanges}
					className="h-9 px-4 flex items-center gap-2 border border-primary-500/20 bg-primary-500/10 hover:bg-primary-500/20 text-primary-500 font-mono font-bold text-[11px] uppercase tracking-wider rounded-lg transition-all active:scale-98 cursor-pointer shadow-sm self-start sm:self-auto"
				>
					<Save className="size-3.5" />
					<span>
						{isSaving ? "Validating SSL Caches..." : "Commit Domain Setup"}
					</span>
				</button>
			</div>

			<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
				<div className="lg:col-span-2 space-y-6">
					<div className="p-5 border border-primary-500/20 bg-primary-500/5 rounded-xl space-y-3 text-left">
						<div className="flex items-center gap-2"><Globe className="size-4 text-primary-500" /><h3 className="font-mono text-[11px] font-bold text-fg-default uppercase tracking-widest">Public portal preview</h3></div>
						<p className="text-sm leading-6 text-fg-muted">The public community portal is separate from this dashboard. Preview the landing page, players, games, leaderboard, and store before connecting DNS.</p>
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
								Gateway Domain Address
							</label>
							<input
								type="text"
								value={domain}
								onChange={(e) => setDomain(e.target.value)}
								className="w-full h-10 px-3 bg-bg-canvas/40 border border-border-subtle rounded-lg text-fg-default focus:outline-none"
							/>
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
												<td className="p-3">portal</td>
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
								<span className="font-black text-success">
									{sslStatus} (LETS_ENCRYPT)
								</span>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
