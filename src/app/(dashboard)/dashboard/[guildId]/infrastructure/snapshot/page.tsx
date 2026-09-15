"use client";

import {
	AlertCircle,
	CheckCircle2,
	Database,
	Loader2,
	RefreshCw,
	Save,
	ShieldAlert,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useGuildConfig } from "@/features/dashboard/config-provider";

interface SnapshotData {
	channels: Record<string, { id: string; name: string; type: string; parent_id: string | null; position: number }>;
	categories: Record<string, { id: string; name: string; type: string; position: number }>;
	roles: Record<string, { id: string; name: string; color: string; position: number }>;
	threads: Record<string, { id: string; name: string; type: string; parent_id: string | null; position: number }>;
}

export default function Page() {
	const { dbGuildId } = useGuildConfig();
	const [isLoading, setIsLoading] = useState(true);
	const [isSaving, setIsSaving] = useState(false);
	const [isRefreshing, setIsRefreshing] = useState(false);
	const [saveSuccess, setSaveSuccess] = useState(false);
	const [saveError, setSaveError] = useState<string | null>(null);
	const [snapshot, setSnapshot] = useState<SnapshotData | null>(null);

	const loadSnapshot = useCallback(async (showSpinner = false) => {
		if (!dbGuildId) return;
		if (showSpinner) setIsRefreshing(true);
		setIsLoading(true);
		setSaveError(null);
		try {
			const res = await fetch(`/api/db/guilds/${dbGuildId}/snapshot`);
			if (!res.ok) throw new Error(`Failed to load snapshot (${res.status})`);
			const data = await res.json();
			setSnapshot(data.data || null);
		} catch (error) {
			setSaveError(error instanceof Error ? error.message : "Failed to load snapshot");
		} finally {
			setIsLoading(false);
			setIsRefreshing(false);
		}
	}, [dbGuildId]);

	useEffect(() => {
		if (dbGuildId) loadSnapshot();
	}, [dbGuildId, loadSnapshot]);

	const handleSave = async () => {
		if (!dbGuildId || !snapshot) return;
		setIsSaving(true);
		setSaveError(null);
		try {
			const res = await fetch(`/api/db/guilds/${dbGuildId}/snapshot`, {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(snapshot),
			});
			if (!res.ok) throw new Error("Failed to save snapshot");
			setSaveSuccess(true);
			setTimeout(() => setSaveSuccess(false), 2500);
		} catch (error) {
			setSaveError(error instanceof Error ? error.message : "Save failed");
		} finally {
			setIsSaving(false);
		}
	};

	if (isLoading) {
		return (
			<div className="flex items-center justify-center h-64">
				<Loader2 className="size-6 animate-spin text-primary-500" />
			</div>
		);
	}

	return (
		<div className="w-full p-6 lg:p-8 space-y-6 animate-in fade-in duration-300 select-none max-w-7xl mx-auto">
			{/* Header */}
			<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border-subtle pb-6">
				<div>
					<h1 className="font-mono text-[10px] font-bold uppercase tracking-widest text-fg-muted">
						// Infrastructure Layer
					</h1>
					<h2 className="text-2xl font-black tracking-tight text-fg-default mt-1">
						Guild Snapshot Manager
					</h2>
				</div>
				<div className="flex items-center gap-2 self-start sm:self-auto">
					{saveSuccess && (
						<span className="flex items-center gap-1.5 font-mono text-[10px] text-success uppercase tracking-wider">
							<CheckCircle2 className="size-3.5" /> Saved
						</span>
					)}
					<button
						onClick={() => loadSnapshot(true)}
						disabled={isRefreshing}
						className="h-9 px-4 flex items-center gap-2 border border-border-subtle bg-panel-bg/40 text-fg-default font-mono font-bold text-[11px] uppercase tracking-wider rounded-lg transition-all hover:bg-panel-bg hover:border-primary-500/40 active:scale-98 cursor-pointer shadow-sm disabled:opacity-60"
					>
						<RefreshCw className={`size-3.5 text-fg-muted ${isRefreshing ? "animate-spin text-primary-500" : ""}`} />
						<span>Sync from Discord</span>
					</button>
					<button
						onClick={handleSave}
						disabled={isSaving}
						className="h-9 px-4 flex items-center gap-2 border border-primary-500/20 bg-primary-500/10 hover:bg-primary-500/20 text-primary-500 font-mono font-bold text-[11px] uppercase tracking-wider rounded-lg transition-all active:scale-98 cursor-pointer shadow-sm disabled:opacity-60"
					>
						{isSaving ? <Loader2 className="size-3.5 animate-spin" /> : <Save className="size-3.5" />}
						<span>{isSaving ? "Saving..." : "Commit Changes"}</span>
					</button>
				</div>
			</div>

			{saveError && (
				<div className="flex items-center gap-3 p-3 rounded-lg border border-danger/30 bg-danger/10 text-danger">
					<AlertCircle className="size-4 shrink-0" />
					<p className="font-mono text-[10px] uppercase">{saveError}</p>
				</div>
			)}

			{/* Info banner */}
			<div className="p-4 border border-primary-500/20 bg-primary-500/5 rounded-xl flex items-start gap-3">
				<Database className="size-5 text-primary-500 shrink-0 mt-0.5" />
				<div className="space-y-1 text-left">
					<h3 className="font-mono text-xs font-bold text-fg-default uppercase tracking-wide">Guild Snapshot Data</h3>
					<p className="font-mono text-[10px] text-fg-muted leading-relaxed">
						This page displays and allows interaction with the guild's channels, categories, roles, and threads as stored in the database. Changes here affect how the bot references Discord entities.
					</p>
				</div>
			</div>

			{!snapshot ? (
				<div className="p-8 border border-dashed border-border-subtle/60 rounded-xl text-center">
					<ShieldAlert className="size-8 text-fg-muted mx-auto mb-3" />
					<p className="font-mono text-[10px] text-fg-muted uppercase tracking-wider">
						No snapshot data available. Click "Sync from Discord" to fetch the current guild state.
					</p>
				</div>
			) : (
				<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
					{/* Channels */}
					<div className="p-5 border border-border-subtle bg-panel-bg/20 rounded-xl space-y-4">
						<div className="flex items-center gap-2 border-b border-border-subtle/50 pb-2.5">
							<Database className="size-4 text-cyan-500" />
							<h3 className="font-mono text-[11px] font-bold text-fg-default uppercase tracking-widest">
								Channels ({Object.keys(snapshot.channels).length})
							</h3>
						</div>
						<div className="space-y-2 max-h-96 overflow-y-auto">
							{Object.entries(snapshot.channels).map(([key, channel]) => (
								<div key={key} className="p-3 bg-bg-canvas/30 border border-border-subtle/40 rounded-lg">
									<div className="flex justify-between items-start gap-2">
										<div className="min-w-0">
											<p className="font-mono text-xs font-bold text-fg-default truncate">{channel.name}</p>
											<p className="font-mono text-[9px] text-fg-muted mt-0.5">{channel.id}</p>
										</div>
										<span className="font-mono text-[8px] uppercase text-fg-muted bg-panel-bg px-1.5 py-0.5 rounded">
											{channel.type}
										</span>
									</div>
								</div>
							))}
						</div>
					</div>

					{/* Categories */}
					<div className="p-5 border border-border-subtle bg-panel-bg/20 rounded-xl space-y-4">
						<div className="flex items-center gap-2 border-b border-border-subtle/50 pb-2.5">
							<Database className="size-4 text-violet-500" />
							<h3 className="font-mono text-[11px] font-bold text-fg-default uppercase tracking-widest">
								Categories ({Object.keys(snapshot.categories).length})
							</h3>
						</div>
						<div className="space-y-2 max-h-96 overflow-y-auto">
							{Object.entries(snapshot.categories).map(([key, category]) => (
								<div key={key} className="p-3 bg-bg-canvas/30 border border-border-subtle/40 rounded-lg">
									<div className="flex justify-between items-start gap-2">
										<div className="min-w-0">
											<p className="font-mono text-xs font-bold text-fg-default truncate">{category.name}</p>
											<p className="font-mono text-[9px] text-fg-muted mt-0.5">{category.id}</p>
										</div>
										<span className="font-mono text-[8px] uppercase text-fg-muted bg-panel-bg px-1.5 py-0.5 rounded">
											{category.type}
										</span>
									</div>
								</div>
							))}
						</div>
					</div>

					{/* Roles */}
					<div className="p-5 border border-border-subtle bg-panel-bg/20 rounded-xl space-y-4">
						<div className="flex items-center gap-2 border-b border-border-subtle/50 pb-2.5">
							<ShieldAlert className="size-4 text-amber-500" />
							<h3 className="font-mono text-[11px] font-bold text-fg-default uppercase tracking-widest">
								Roles ({Object.keys(snapshot.roles).length})
							</h3>
						</div>
						<div className="space-y-2 max-h-96 overflow-y-auto">
							{Object.entries(snapshot.roles).map(([key, role]) => (
								<div key={key} className="p-3 bg-bg-canvas/30 border border-border-subtle/40 rounded-lg">
									<div className="flex justify-between items-start gap-2">
										<div className="min-w-0">
											<p className="font-mono text-xs font-bold text-fg-default truncate">{role.name}</p>
											<p className="font-mono text-[9px] text-fg-muted mt-0.5">{role.id}</p>
										</div>
										<span 
											className="font-mono text-[8px] uppercase text-fg-default px-1.5 py-0.5 rounded"
											style={{ backgroundColor: `#${role.color}20`, border: `1px solid #${role.color}40` }}
										>
											#{role.color}
										</span>
									</div>
								</div>
							))}
						</div>
					</div>

					{/* Threads */}
					<div className="p-5 border border-border-subtle bg-panel-bg/20 rounded-xl space-y-4">
						<div className="flex items-center gap-2 border-b border-border-subtle/50 pb-2.5">
							<Database className="size-4 text-rose-500" />
							<h3 className="font-mono text-[11px] font-bold text-fg-default uppercase tracking-widest">
								Threads ({Object.keys(snapshot.threads).length})
							</h3>
						</div>
						<div className="space-y-2 max-h-96 overflow-y-auto">
							{Object.entries(snapshot.threads).map(([key, thread]) => (
								<div key={key} className="p-3 bg-bg-canvas/30 border border-border-subtle/40 rounded-lg">
									<div className="flex justify-between items-start gap-2">
										<div className="min-w-0">
											<p className="font-mono text-xs font-bold text-fg-default truncate">{thread.name}</p>
											<p className="font-mono text-[9px] text-fg-muted mt-0.5">{thread.id}</p>
										</div>
										<span className="font-mono text-[8px] uppercase text-fg-muted bg-panel-bg px-1.5 py-0.5 rounded">
											{thread.type}
										</span>
									</div>
								</div>
							))}
						</div>
					</div>
				</div>
			)}
		</div>
	);
}