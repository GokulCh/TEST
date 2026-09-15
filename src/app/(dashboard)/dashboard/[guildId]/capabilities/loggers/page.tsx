"use client";

import {
	ScrollText,
	Save,
	Plus,
	Trash2,
	ToggleLeft,
	ToggleRight,
	Info,
	Radio,
} from "lucide-react";
import { useState } from "react";

export default function Page() {
	const [isSaving, setIsSaving] = useState(false);

	const [loggers, setLoggers] = useState<Array<{
		id: string;
		category: string;
		channel: string;
		enabled: boolean;
	}>>([]);

	const handleSaveChanges = () => {
		setIsSaving(true);
		setTimeout(() => setIsSaving(false), 900);
	};

	const handleToggleEnabled = (id: string) => {
		setLoggers(
			loggers.map((l) => (l.id === id ? { ...l, enabled: !l.enabled } : l))
		);
	};

	const handleDeleteLogger = (id: string) => {
		setLoggers(loggers.filter((l) => l.id !== id));
	};

	const handleAddLogger = () => {
		setLoggers([
			...loggers,
			{
				id: `log-${Date.now()}`,
				category: "New System Category",
				channel: "",
				enabled: true,
			},
		]);
	};

	return (
		<div className="w-full p-6 lg:p-8 space-y-6 animate-in fade-in duration-300 select-none max-w-7xl mx-auto text-left">
			{/* HUD PANEL HEADER */}
			<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border-subtle pb-6">
				<div>
					<h1 className="font-mono text-[10px] font-bold uppercase tracking-widest text-fg-muted">
						// Platform Audit logging
					</h1>
					<h2 className="text-2xl font-black tracking-tight text-fg-default mt-1">
						Event Loggers Settings
					</h2>
				</div>

				<button
					onClick={handleSaveChanges}
					className="h-9 px-4 flex items-center gap-2 border border-primary-500/20 bg-primary-500/10 hover:bg-primary-500/20 text-primary-500 font-mono font-bold text-[11px] uppercase tracking-wider rounded-lg transition-all active:scale-98 cursor-pointer shadow-sm self-start sm:self-auto"
				>
					<Save className="size-3.5" />
					<span>
						{isSaving ? "Syncing Loggers..." : "Commit Loggers Settings"}
					</span>
				</button>
			</div>

			{/* ACTION BAR */}
			<div className="flex justify-between items-center bg-panel-bg/10 p-4 border border-border-subtle rounded-xl">
				<div>
					<h3 className="font-mono text-xs font-black text-fg-default uppercase tracking-wide">
						Active Event log streams
					</h3>
					<p className="font-mono text-[9px] text-fg-muted uppercase mt-0.5">
						Map internal bot event telemetry to specific Discord channels
					</p>
				</div>
				<button
					onClick={handleAddLogger}
					className="h-8 px-3 flex items-center gap-1.5 border border-dashed border-primary-500/30 text-primary-500 bg-primary-500/5 hover:bg-primary-500/10 rounded-lg font-mono font-bold text-[10px] uppercase tracking-wider transition-all active:scale-98 cursor-pointer"
				>
					<Plus className="size-3.5" /> Append Log Stream
				</button>
			</div>

			<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
				{/* LOGGERS LIST */}
				<div className="lg:col-span-2 space-y-4">
					{loggers.map((l) => (
						<div
							key={l.id}
							className="p-4 border border-border-subtle bg-panel-bg/20 rounded-xl space-y-3 shadow-xs animate-in fade-in duration-150 text-left"
						>
							<div className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-end">
								<div className="space-y-1 sm:col-span-2">
									<label className="block font-mono text-[9px] font-bold text-fg-default uppercase tracking-wider">
										Log Category
									</label>
									<select
										defaultValue={l.category}
										className="w-full h-8 px-2 bg-bg-canvas/40 border border-border-subtle rounded-md font-mono text-xs text-fg-default focus:outline-none"
									>
										<option>Queue Actions</option>
										<option>Match Outcomes</option>
										<option>Staff Commands</option>
										<option>Punishment Escalations</option>
										<option>New System Category</option>
									</select>
								</div>

								<div className="space-y-1">
									<label className="block font-mono text-[9px] font-bold text-fg-default uppercase tracking-wider">
										Destination Channel
									</label>
									<input
										type="text"
										defaultValue={l.channel}
										className="w-full h-8 px-2.5 bg-bg-canvas/40 border border-border-subtle rounded-md font-mono text-xs text-fg-default focus:outline-none"
									/>
								</div>

								<div className="flex gap-2 justify-end sm:justify-start">
									<button
										onClick={() => handleToggleEnabled(l.id)}
										className={`h-8 px-3 border rounded-md font-mono text-[9px] font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all ${
											l.enabled
												? "bg-success/10 border-success/30 text-success"
												: "bg-panel-bg border-border-subtle text-fg-muted"
										}`}
									>
										{l.enabled ? <ToggleRight className="size-4" /> : <ToggleLeft className="size-4" />}
										<span>{l.enabled ? "Active" : "Disabled"}</span>
									</button>

									<button
										onClick={() => handleDeleteLogger(l.id)}
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
							<Radio className="size-4 text-cyan-500 animate-pulse" />
							<h3 className="font-mono text-[11px] font-bold text-fg-default uppercase tracking-widest">
								Channel Streamer
							</h3>
						</div>
						<p className="font-mono text-[9px] text-fg-muted uppercase tracking-wide leading-relaxed">
							Broadcasters output JSON formatted log streams. Debug levels can be restricted inside application configurations.
						</p>
					</div>
				</div>
			</div>
		</div>
	);
}
