"use client";

import {
	AlertTriangle,
	Calculator,
	Info,
	Sliders,
} from "lucide-react";
import { useState } from "react";

export default function Page() {
	const [activeStrikes, setActiveStrikes] = useState(0);

	let previewAction = "Warning Prompt + Logged";
	let severityColor = "text-success bg-success/10 border-success/30";

	if (activeStrikes === 1) {
		previewAction = "Warning Prompt + Logged";
		severityColor = "text-cyan-500 bg-cyan-500/10 border-cyan-500/30";
	} else if (activeStrikes === 2) {
		previewAction = "Queue Restriction Lock (24h)";
		severityColor = "text-amber-500 bg-amber-500/10 border-amber-500/30";
	} else if (activeStrikes >= 3 && activeStrikes < 5) {
		previewAction = "Full Server Competitive Ban (7d)";
		severityColor = "text-rose-500 bg-rose-500/10 border-rose-500/30";
	} else if (activeStrikes >= 5) {
		previewAction = "Blacklist Exile Outcast (Permanent)";
		severityColor = "text-red-500 bg-red-500/10 border-red-500/30";
	}

	return (
		<div className="w-full p-6 lg:p-8 space-y-6 animate-in fade-in duration-300 select-none max-w-7xl mx-auto text-left">
			{/* HUD PANEL HEADER */}
			<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border-subtle pb-6">
				<div>
					<h1 className="font-mono text-[10px] font-bold uppercase tracking-widest text-fg-muted">
						// Simulator Escalation Preview
					</h1>
					<h2 className="text-2xl font-black tracking-tight text-fg-default mt-1">
						Strike Preview
					</h2>
				</div>
			</div>

			<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
				{/* INPUT */}
				<div className="lg:col-span-2 space-y-6">
					<div className="p-5 border border-border-subtle bg-panel-bg/20 backdrop-blur-md rounded-xl space-y-4 shadow-xs">
						<div className="flex items-center gap-2 border-b border-border-subtle/50 pb-2.5">
							<Sliders className="size-4 text-primary-500" />
							<h3 className="font-mono text-[11px] font-bold text-fg-default uppercase tracking-widest">
								Simulation Parameters
							</h3>
						</div>

						<div className="space-y-1.5 font-mono text-xs text-left">
							<label className="block font-bold text-fg-default uppercase tracking-wider">
								Simulated Player Strikes Count
							</label>
							<input
								type="number"
								value={activeStrikes}
								onChange={(e) => setActiveStrikes(Math.max(0, parseInt(e.target.value) || 0))}
								className="w-full h-10 px-3 bg-bg-canvas/40 border border-border-subtle rounded-lg text-fg-default focus:outline-none"
							/>
						</div>
					</div>

					{/* ESCALATED PREVIEW */}
					<div className="p-5 border border-border-subtle bg-panel-bg/20 backdrop-blur-md rounded-xl space-y-4 shadow-xs text-left">
						<h3 className="font-mono text-[11px] font-bold text-fg-default uppercase tracking-widest border-b border-border-subtle/30 pb-2">
							Expected Automated Action
						</h3>

						<div className="p-4 border rounded-xl flex items-center justify-between font-mono text-xs">
							<div className="space-y-0.5">
								<span className="block font-bold text-fg-default uppercase tracking-wider">
									Punishment Severity
								</span>
								<span className="text-[10px] text-fg-muted uppercase tracking-wide">
									Calculated result mapped directly to current strike auto-ladder settings.
								</span>
							</div>

							<span className={`h-8 px-4 flex items-center border rounded-md font-bold uppercase tracking-wider ${severityColor}`}>
								{previewAction}
							</span>
						</div>
					</div>
				</div>

				<div className="space-y-6">
					<div className="p-5 border border-border-subtle bg-panel-bg/20 backdrop-blur-md rounded-xl space-y-4 h-fit text-left">
						<div className="flex items-center gap-2 border-b border-border-subtle/50 pb-2.5">
							<AlertTriangle className="size-4 text-rose-500 animate-pulse" />
							<h3 className="font-mono text-[11px] font-bold text-fg-default uppercase tracking-widest">
								Escalation Logs
							</h3>
						</div>
						<p className="font-mono text-[9px] text-fg-muted uppercase tracking-wide leading-relaxed">
							Decay rules will expunge active strikes from target player records periodically. Ensure your strike ladder mappings are aligned with guild safety constraints.
						</p>
					</div>
				</div>
			</div>
		</div>
	);
}
