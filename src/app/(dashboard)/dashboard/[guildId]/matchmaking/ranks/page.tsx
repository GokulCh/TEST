"use client";

import { AlertCircle, Award, CheckCircle2, Loader2, Palette, Plus, Save, Shield, Trash2, TrendingDown, Zap } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useGuildConfig } from "@/features/dashboard/config-provider";
import { useGuildSnapshot } from "@/hooks/useGuildSnapshot";
import { useUnsavedChanges } from "@/hooks/use-unsaved-changes";
import type { RankConfig } from "@/lib/db-types";
import RoleDropdown from "@/components/ui/RoleDropdown";

export default function Page() {
	const { meta, isLoading, isSaving, saveMetaSection } = useGuildConfig();
	const { roleOptions } = useGuildSnapshot();
	const [ranks, setRanks] = useState<RankConfig[]>([]);
	const [saveSuccess, setSaveSuccess] = useState(false);
	const [saveError, setSaveError] = useState<string | null>(null);

	useEffect(() => {
		if (meta?.ranks?.length) setRanks([...meta.ranks].sort((a, b) => a.order - b.order));
	}, [meta]);

	const globalLocal = useMemo(() => ({ ranks }), [ranks]);
	const globalSaved = useMemo(() => {
		if (!meta?.ranks?.length) return null;
		return { ranks: [...meta.ranks].sort((a, b) => a.order - b.order) };
	}, [meta]);
	useUnsavedChanges(globalLocal, globalSaved);

	const update = (idx: number, field: keyof RankConfig, value: unknown) =>
		setRanks((prev) => prev.map((r, i) => (i === idx ? { ...r, [field]: value } : r)));

	const flashSuccess = () => { setSaveSuccess(true); setTimeout(() => setSaveSuccess(false), 2500); };

	const handleSave = async () => {
		setSaveError(null);
		try { await saveMetaSection("ranks", ranks); flashSuccess(); }
		catch (e) { setSaveError(e instanceof Error ? e.message : "Save failed"); }
	};

	if (isLoading)
		return <div className="flex items-center justify-center h-64"><Loader2 className="size-6 animate-spin text-primary-500" /></div>;

	return (
		<div className="w-full p-6 lg:p-8 space-y-6 animate-in fade-in duration-300 select-none max-w-7xl mx-auto text-left">
			<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border-subtle pb-6">
				<div>
					<h1 className="font-mono text-[10px] font-bold uppercase tracking-widest text-fg-muted">// Matchmaker Progression Mechanics</h1>
					<h2 className="text-2xl font-black tracking-tight text-fg-default mt-1">Rank Thresholds & Economy Studio</h2>
				</div>
				<div className="flex items-center gap-2 self-start sm:self-auto">
					{saveSuccess && <span className="flex items-center gap-1.5 font-mono text-[10px] text-success uppercase tracking-wider"><CheckCircle2 className="size-3.5" /> Saved</span>}
					<button onClick={handleSave} disabled={isSaving} className="h-9 px-4 flex items-center gap-2 border border-primary-500/20 bg-primary-500/10 hover:bg-primary-500/20 text-primary-500 font-mono font-bold text-[11px] uppercase tracking-wider rounded-lg transition-all active:scale-98 cursor-pointer shadow-sm disabled:opacity-60">
						{isSaving ? <Loader2 className="size-3.5 animate-spin" /> : <Save className="size-3.5" />}
						<span>{isSaving ? "Syncing..." : "Commit Ranks Setup"}</span>
					</button>
				</div>
			</div>

			{saveError && <div className="flex items-center gap-3 p-3 rounded-lg border border-danger/30 bg-danger/10 text-danger"><AlertCircle className="size-4 shrink-0" /><p className="font-mono text-[10px] uppercase">{saveError}</p></div>}

			<div className="flex justify-between items-center bg-panel-bg/10 p-4 border border-border-subtle rounded-xl">
				<div>
					<h3 className="font-mono text-xs font-black text-fg-default uppercase tracking-wide">Roster Tier Nodes</h3>
					<p className="font-mono text-[9px] text-fg-muted uppercase mt-0.5">Define ELO bands, K-factor economy and Discord role assignments for each rank tier</p>
				</div>
				<button
					onClick={() => setRanks((prev) => [...prev, { rank_name: "New Tier", color: "#6366F1", min_elo: 0, max_elo: 999, order: prev.length + 1, role_id: "", k_factor_win: 20, k_factor_loss: 20, mvp_bonus: 3, decay: 0 }])}
					className="h-8 px-3 flex items-center gap-1.5 border border-dashed border-primary-500/30 text-primary-500 bg-primary-500/5 hover:bg-primary-500/10 rounded-lg font-mono font-bold text-[10px] uppercase tracking-wider transition-all active:scale-98 cursor-pointer"
				>
					<Plus className="size-3.5" /> Append New Rank Bracket
				</button>
			</div>

			{ranks.length === 0 && (
				<div className="p-8 border border-dashed border-border-subtle/40 rounded-xl text-center font-mono text-xs text-fg-muted uppercase tracking-wider">
					No ranks configured yet — click &ldquo;Append New Rank Bracket&rdquo; to add one.
				</div>
			)}

			<div className="space-y-6">
				{ranks.map((rank, idx) => (
					<div key={idx} className="p-5 border border-border-subtle bg-panel-bg/20 backdrop-blur-md rounded-xl space-y-4 shadow-xs text-left">
						<div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-border-subtle/40 pb-3 gap-3">
							<div className="flex items-center gap-3">
								<div style={{ backgroundColor: rank.color ?? "#6366F1" }} className="size-5 rounded-md border border-black/20 shrink-0 flex items-center justify-center text-white text-[9px] font-bold font-mono">{rank.order}</div>
								<input type="text" value={rank.rank_name} onChange={(e) => update(idx, "rank_name", e.target.value)} className="font-mono text-sm font-black text-fg-default uppercase bg-transparent border-b border-transparent hover:border-border-subtle focus:border-primary-500/50 focus:outline-none px-1 py-0.5 rounded" />
							</div>
							<div className="flex items-center gap-2 self-end sm:self-auto">
								<div className="flex items-center gap-1.5 bg-bg-canvas/40 border border-border-subtle rounded-lg px-2 h-8">
									<Palette className="size-3.5 text-fg-muted" />
									<input type="color" value={rank.color ?? "#6366F1"} onChange={(e) => update(idx, "color", e.target.value)} className="w-5 h-5 bg-transparent border-0 cursor-pointer rounded p-0" />
									<input type="text" value={rank.color ?? ""} onChange={(e) => update(idx, "color", e.target.value)} className="w-16 bg-transparent text-[10px] font-mono font-bold text-fg-default uppercase focus:outline-none" />
								</div>
								<button onClick={() => setRanks(ranks.filter((_, i) => i !== idx))} className="size-8 flex items-center justify-center border border-border-subtle hover:bg-red-500/10 text-fg-muted hover:text-red-400 rounded-lg cursor-pointer">
									<Trash2 className="size-3.5" />
								</button>
							</div>
						</div>

						<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
							{([
								{ label: "Minimum ELO", field: "min_elo" },
								{ label: "Maximum ELO", field: "max_elo" },
								{ label: "Ladder Order", field: "order" },
							] as { label: string; field: keyof RankConfig }[]).map(({ label, field }) => (
								<div key={field} className="space-y-1">
									<label className="block font-mono text-[9px] font-bold text-fg-muted uppercase tracking-wider">{label}</label>
									<div className="relative">
										<Award className="absolute left-2.5 top-2 size-3.5 text-fg-muted/60" />
										<input type="number" value={(rank[field] as number) ?? 0} onChange={(e) => update(idx, field, Number(e.target.value))} className="w-full h-8 pl-8 pr-3 bg-bg-canvas/40 border border-border-subtle rounded-md font-mono text-xs text-fg-default focus:outline-none focus:border-primary-500/50" />
									</div>
								</div>
							))}
							<div className="space-y-1">
								<label className="block font-mono text-[9px] font-bold text-fg-muted uppercase tracking-wider">Discord Role</label>
								<RoleDropdown
									value={rank.role_id}
									onChange={(value) => update(idx, "role_id", value)}
									roles={roleOptions}
									placeholder="Select a role"
								/>
							</div>
						</div>

						<div className="pt-3 border-t border-border-subtle/30 grid grid-cols-2 lg:grid-cols-4 gap-4">
							{([
								{ label: "K-Factor Win", field: "k_factor_win", icon: <Zap className="size-3 text-success" /> },
								{ label: "K-Factor Loss", field: "k_factor_loss", icon: <Zap className="size-3 text-rose-500" /> },
								{ label: "MVP Bonus", field: "mvp_bonus", icon: <Zap className="size-3 text-amber-500" /> },
								{ label: "Decay Weight", field: "decay", icon: <TrendingDown className="size-3 text-indigo-400" /> },
							] as { label: string; field: keyof RankConfig; icon: React.ReactNode }[]).map(({ label, field, icon }) => (
								<div key={field} className="space-y-1">
									<div className="font-mono text-[9px] font-bold text-fg-default uppercase tracking-wide flex items-center gap-1">{icon}<span>{label}</span></div>
									<input type="number" value={(rank[field] as number) ?? 0} onChange={(e) => update(idx, field, Number(e.target.value))} className="w-full h-8 px-2.5 bg-bg-canvas/40 border border-border-subtle rounded-md font-mono text-xs text-fg-default focus:outline-none focus:border-primary-500/50" />
								</div>
							))}
						</div>
					</div>
				))}
			</div>
		</div>
	);
}
