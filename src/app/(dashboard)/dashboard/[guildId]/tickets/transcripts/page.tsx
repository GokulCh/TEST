"use client";

import {
	FileText,
	Search,
	Download,
	Eye,
	Clock,
	Users,
} from "lucide-react";
import { useState } from "react";

export default function Page() {
	const [searchQuery, setSearchQuery] = useState("");

	const transcripts: Array<{
		id: string;
		user: string;
		category: string;
		closedBy: string;
		date: string;
		rating: string;
	}> = [];

	const filteredTranscripts = transcripts.filter(
		(t) =>
			t.user.toLowerCase().includes(searchQuery.toLowerCase()) ||
			t.id.toLowerCase().includes(searchQuery.toLowerCase())
	);

	return (
		<div className="w-full p-6 lg:p-8 space-y-6 animate-in fade-in duration-300 select-none max-w-7xl mx-auto text-left">
			{/* HUD PANEL HEADER */}
			<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border-subtle pb-6">
				<div>
					<h1 className="font-mono text-[10px] font-bold uppercase tracking-widest text-fg-muted">
						// Tickets Archive Core
					</h1>
					<h2 className="text-2xl font-black tracking-tight text-fg-default mt-1">
						Archived Logs & Transcripts
					</h2>
				</div>
			</div>

			{/* SEARCH BAR */}
			<div className="flex flex-col sm:flex-row gap-3">
				<div className="flex-1 relative">
					<Search className="absolute left-3 top-2.5 size-4 text-fg-muted/60" />
					<input
						type="text"
						placeholder="Search archives by player name or transcript ID..."
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
						className="w-full h-10 pl-10 pr-4 bg-panel-bg/20 border border-border-subtle rounded-xl font-mono text-xs text-fg-default focus:outline-none focus:border-primary-500/50"
					/>
				</div>
			</div>

			{/* LOGS TABLE */}
			<div className="border border-border-subtle bg-panel-bg/20 backdrop-blur-md rounded-xl overflow-hidden">
				<div className="overflow-x-auto">
					<table className="w-full text-left font-mono text-[11px] border-collapse">
						<thead>
							<tr className="border-b border-border-subtle bg-bg-canvas/50 uppercase text-fg-muted text-[9px] font-black tracking-widest">
								<th className="p-4">Transcript ID</th>
								<th className="p-4">Creator Player</th>
								<th className="p-4">Category</th>
								<th className="p-4">Closed By</th>
								<th className="p-4">Status / Resolution</th>
								<th className="p-4 text-right">Archived Date</th>
								<th className="p-4 text-right">Actions</th>
							</tr>
						</thead>
						<tbody className="divide-y divide-border-subtle/40">
							{filteredTranscripts.map((t) => (
								<tr key={t.id} className="hover:bg-panel-bg/10 transition-colors">
									<td className="p-4 font-bold text-fg-default">{t.id}</td>
									<td className="p-4 font-bold">{t.user}</td>
									<td className="p-4 text-fg-muted">{t.category}</td>
									<td className="p-4 text-fg-muted">{t.closedBy}</td>
									<td className="p-4">
										<span
											className={`inline-block font-bold px-1.5 py-0.5 rounded text-[8px] uppercase tracking-wider ${
												t.rating === "Action Taken"
													? "text-red-500 bg-red-500/10 border border-red-500/20"
													: t.rating === "Resolved"
														? "text-success bg-success/10 border border-success/20"
														: "text-cyan-500 bg-cyan-500/10 border border-cyan-500/20"
											}`}
										>
											{t.rating}
										</span>
									</td>
									<td className="p-4 text-right text-fg-muted">{t.date}</td>
									<td className="p-4 text-right">
										<div className="flex gap-2 justify-end">
											<button className="size-7 flex items-center justify-center border border-border-subtle hover:bg-panel-bg/40 text-fg-muted hover:text-fg-default rounded-md transition-all cursor-pointer">
												<Eye className="size-3.5" />
											</button>
											<button className="size-7 flex items-center justify-center border border-border-subtle hover:bg-panel-bg/40 text-fg-muted hover:text-fg-default rounded-md transition-all cursor-pointer">
												<Download className="size-3.5" />
											</button>
										</div>
									</td>
								</tr>
							))}

							{filteredTranscripts.length === 0 && (
								<tr>
									<td colSpan={7} className="p-8 text-center text-fg-muted uppercase text-[10px]">
										No matching archives registered in the system
									</td>
								</tr>
							)}
						</tbody>
					</table>
				</div>
			</div>
		</div>
	);
}
