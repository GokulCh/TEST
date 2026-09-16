"use client";

import {
	Database,
	Save,
	RefreshCw,
	Trash2,
	ToggleLeft,
	ToggleRight,
	Info,
	Download,
} from "lucide-react";
import { useState, useMemo } from "react";
import { useUnsavedChanges } from "@/hooks/use-unsaved-changes";

export default function Page() {
	const [isSaving, setIsSaving] = useState(false);
	const [dailyBackups, setDailyBackups] = useState(true);

	const [backups, setBackups] = useState<Array<{
		id: string;
		name: string;
		size: string;
		date: string;
		status: string;
	}>>([]);

	const [savedSnapshot, setSavedSnapshot] = useState(() => ({ dailyBackups: true, backups: [] as Array<typeof backups[number]> }));
	const globalLocal = useMemo(() => ({ dailyBackups, backups }), [dailyBackups, backups]);
	const globalSaved = useMemo(() => savedSnapshot, [savedSnapshot]);
	useUnsavedChanges(globalLocal, globalSaved);

	const handleSaveChanges = () => {
		setSavedSnapshot({ dailyBackups, backups });
		setIsSaving(true);
		setTimeout(() => setIsSaving(false), 900);
	};

	const handleDeleteBackup = (id: string) => {
		setBackups(backups.filter((b) => b.id !== id));
	};

	const handleCreateBackup = () => {
		setBackups([
			...backups,
			{
				id: `BKP-${Date.now().toString().substring(10)}`,
				name: "Manual Snapshot Registry",
				size: "140 MB",
				date: new Date().toISOString().replace("T", " ").substring(0, 16),
				status: "Synced",
			},
		]);
	};

	return (
		<div className="w-full p-6 lg:p-8 space-y-6 animate-in fade-in duration-300 select-none max-w-7xl mx-auto text-left">
			{/* HUD PANEL HEADER */}
			<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border-subtle pb-6">
				<div>
					<h1 className="font-mono text-[10px] font-bold uppercase tracking-widest text-fg-muted">
						// Gateway Preservation Layer
					</h1>
					<h2 className="text-2xl font-black tracking-tight text-fg-default mt-1">
						Backup & Restore
					</h2>
				</div>

				<button
					onClick={handleCreateBackup}
					className="h-9 px-4 flex items-center gap-2 border border-primary-500/20 bg-primary-500/10 hover:bg-primary-500/20 text-primary-500 font-mono font-bold text-[11px] uppercase tracking-wider rounded-lg transition-all active:scale-98 cursor-pointer shadow-sm self-start sm:self-auto"
				>
					<Save className="size-3.5" />
					<span>Create Snapshot</span>
				</button>
			</div>

			{/* AUTO BACKUP TOGGLE */}
			<div className="p-5 border border-border-subtle bg-panel-bg/20 backdrop-blur-md rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
				<div className="space-y-1 text-left">
					<h3 className="font-mono text-xs font-black text-fg-default uppercase tracking-wide">
						Automated Backup Scheduler
					</h3>
					<p className="font-mono text-[9px] text-fg-muted uppercase max-w-xl leading-relaxed">
						Instruct the database layer to automatically package and backup configurations and stats telemetry indices daily.
					</p>
				</div>
				<button
					onClick={() => setDailyBackups(!dailyBackups)}
					className={`h-9 px-4 border rounded-lg font-mono text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all shrink-0 cursor-pointer ${
						dailyBackups
							? "bg-success/10 border-success/30 text-success"
							: "bg-panel-bg border-border-subtle text-fg-muted"
					}`}
				>
					{dailyBackups ? <ToggleRight className="size-4" /> : <ToggleLeft className="size-4" />}
					<span>{dailyBackups ? "Scheduler Active" : "Scheduler Muted"}</span>
				</button>
			</div>

			{/* ACTION BAR */}
			<div className="flex justify-between items-center bg-panel-bg/10 p-4 border border-border-subtle rounded-xl">
				<div>
					<h3 className="font-mono text-xs font-black text-fg-default uppercase tracking-wide">
						Restore Points Registry
					</h3>
					<p className="font-mono text-[9px] text-fg-muted uppercase mt-0.5">
						Rollback the active matchmaker to previous stable configurations
					</p>
				</div>
			</div>

			<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
				{/* BACKUPS LIST */}
				<div className="lg:col-span-2 space-y-4">
					{backups.map((b) => (
						<div
							key={b.id}
							className="p-4 border border-border-subtle bg-panel-bg/20 rounded-xl space-y-3 shadow-xs animate-in fade-in duration-150 text-left"
						>
							<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-border-subtle/20">
								<div>
									<div className="flex items-center gap-2">
										<span className="font-mono text-sm font-black text-fg-default">
											{b.name}
										</span>
										<span
											className={`font-mono text-[8px] font-bold uppercase px-1.5 py-0.2 rounded border ${
												b.status === "Synced"
													? "bg-success/10 border-success/30 text-success"
													: "bg-panel-bg border-border-subtle text-fg-muted"
											}`}
										>
											{b.status}
										</span>
									</div>
									<div className="font-mono text-[9px] text-fg-muted uppercase mt-0.5 flex gap-3">
										<span>ID: {b.id}</span>
										<span>Size: {b.size}</span>
										<span>Archived: {b.date}</span>
									</div>
								</div>

								<div className="flex gap-2 shrink-0">
									<button className="h-8 px-3 border border-primary-500/20 bg-primary-500/10 hover:bg-primary-500/20 text-primary-500 font-mono text-[9px] font-bold uppercase tracking-wider rounded-md transition-all active:scale-95 cursor-pointer">
										Restore Snapshot
									</button>
									<button
										onClick={() => handleDeleteBackup(b.id)}
										className="size-8 flex items-center justify-center border border-border-subtle hover:bg-red-500/10 text-fg-muted hover:text-red-400 rounded-md transition-all cursor-pointer"
									>
										<Trash2 className="size-3.5" />
									</button>
								</div>
							</div>
						</div>
					))}
				</div>

				<div className="space-y-6">
					<div className="p-5 border border-border-subtle bg-panel-bg/20 backdrop-blur-md rounded-xl space-y-4 h-fit text-left">
						<div className="flex items-center gap-2 border-b border-border-subtle/50 pb-2.5">
							<Database className="size-4 text-cyan-500" />
							<h3 className="font-mono text-[11px] font-bold text-fg-default uppercase tracking-widest">
								Redundancy Storage
							</h3>
						</div>
						<p className="font-mono text-[9px] text-fg-muted uppercase tracking-wide leading-relaxed">
							Snapshots are archived locally on bot nodes. You can sync them to AWS S3 storage layers inside settings overrides.
						</p>
					</div>
				</div>
			</div>
		</div>
	);
}
