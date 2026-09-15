"use client";

import {
	UserX,
	Save,
	Plus,
	Trash2,
	Search,
	Clock,
	Info,
} from "lucide-react";
import { useState } from "react";

export default function Page() {
	const [isSaving, setIsSaving] = useState(false);
	const [searchQuery, setSearchQuery] = useState("");

	const [blacklist, setBlacklist] = useState<Array<{
		id: string;
		user: string;
		reason: string;
		duration: string;
		assignedBy: string;
		date: string;
	}>>([]);

	const handleSaveChanges = () => {
		setIsSaving(true);
		setTimeout(() => setIsSaving(false), 900);
	};

	const handleDeleteEntry = (id: string) => {
		setBlacklist(blacklist.filter((item) => item.id !== id));
	};

	const handleAddEntry = () => {
		setBlacklist([
			...blacklist,
			{
				id: `bl-${Date.now()}`,
				user: "",
				reason: "",
				duration: "7 Days",
				assignedBy: "",
				date: new Date().toISOString().split("T")[0],
			},
		]);
	};

	const filteredBlacklist = blacklist.filter((item) =>
		item.user.toLowerCase().includes(searchQuery.toLowerCase())
	);

	return (
		<div className="w-full p-6 lg:p-8 space-y-6 animate-in fade-in duration-300 select-none max-w-7xl mx-auto text-left">
			{/* HUD PANEL HEADER */}
			<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border-subtle pb-6">
				<div>
					<h1 className="font-mono text-[10px] font-bold uppercase tracking-widest text-fg-muted">
						// Tickets Lockout desk
					</h1>
					<h2 className="text-2xl font-black tracking-tight text-fg-default mt-1">
						Support Blacklist
					</h2>
				</div>

				<button
					onClick={handleSaveChanges}
					className="h-9 px-4 flex items-center gap-2 border border-primary-500/20 bg-primary-500/10 hover:bg-primary-500/20 text-primary-500 font-mono font-bold text-[11px] uppercase tracking-wider rounded-lg transition-all active:scale-98 cursor-pointer shadow-sm self-start sm:self-auto"
				>
					<Save className="size-3.5" />
					<span>
						{isSaving ? "Updating Blacklists..." : "Commit Blacklist Registry"}
					</span>
				</button>
			</div>

			{/* ACTION HUB */}
			<div className="flex flex-col sm:flex-row justify-between items-center bg-panel-bg/10 p-4 border border-border-subtle rounded-xl gap-4">
				<div className="text-left">
					<h3 className="font-mono text-xs font-black text-fg-default uppercase tracking-wide">
						Exclusion Registry
					</h3>
					<p className="font-mono text-[9px] text-fg-muted uppercase mt-0.5">
						Restrict malicious accounts from generating support ticket channels
					</p>
				</div>
				<button
					onClick={handleAddEntry}
					className="h-8 px-3 flex items-center gap-1.5 border border-dashed border-primary-500/30 text-primary-500 bg-primary-500/5 hover:bg-primary-500/10 rounded-lg font-mono font-bold text-[10px] uppercase tracking-wider transition-all active:scale-98 cursor-pointer"
				>
					<Plus className="size-3.5" /> Blacklist Player
				</button>
			</div>

			{/* SEARCH BAR */}
			<div className="relative">
				<Search className="absolute left-3 top-2.5 size-4 text-fg-muted/60" />
				<input
					type="text"
					placeholder="Search blacklist by player username..."
					value={searchQuery}
					onChange={(e) => setSearchQuery(e.target.value)}
					className="w-full h-10 pl-10 pr-4 bg-panel-bg/20 border border-border-subtle rounded-xl font-mono text-xs text-fg-default focus:outline-none focus:border-primary-500/50"
				/>
			</div>

			{/* GRID */}
			<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
				{/* BLACKLIST TABLE */}
				<div className="lg:col-span-2 border border-border-subtle bg-panel-bg/20 backdrop-blur-md rounded-xl overflow-hidden">
					<div className="overflow-x-auto">
						<table className="w-full text-left font-mono text-[11px] border-collapse">
							<thead>
								<tr className="border-b border-border-subtle bg-bg-canvas/50 uppercase text-fg-muted text-[9px] font-black tracking-widest">
									<th className="p-4">Blocked User</th>
									<th className="p-4">Reason</th>
									<th className="p-4">Duration</th>
									<th className="p-4">Enforcer</th>
									<th className="p-4 text-right">Age</th>
									<th className="p-4 text-right">Action</th>
								</tr>
							</thead>
							<tbody className="divide-y divide-border-subtle/40">
								{filteredBlacklist.map((item) => (
									<tr key={item.id} className="hover:bg-panel-bg/10 transition-colors">
										<td className="p-4 font-bold text-fg-default">{item.user}</td>
										<td className="p-4 text-fg-muted max-w-[200px] truncate">{item.reason}</td>
										<td className="p-4">
											<span className="inline-block font-bold text-rose-400 bg-rose-500/10 px-1.5 py-0.5 rounded text-[8px] uppercase tracking-wider">
												{item.duration}
											</span>
										</td>
										<td className="p-4 text-fg-muted">{item.assignedBy}</td>
										<td className="p-4 text-right text-fg-muted">{item.date}</td>
										<td className="p-4 text-right">
											<button
												onClick={() => handleDeleteEntry(item.id)}
												className="size-7 flex items-center justify-center border border-border-subtle hover:bg-red-500/10 text-fg-muted hover:text-red-400 rounded-md transition-all cursor-pointer"
											>
												<Trash2 className="size-3.5" />
											</button>
										</td>
									</tr>
								))}

								{filteredBlacklist.length === 0 && (
									<tr>
										<td colSpan={6} className="p-8 text-center text-fg-muted uppercase text-[10px]">
											Blacklist registry is empty
										</td>
									</tr>
								)}
							</tbody>
						</table>
					</div>
				</div>

				<div className="space-y-6">
					<div className="p-5 border border-border-subtle bg-panel-bg/20 backdrop-blur-md rounded-xl space-y-4 h-fit">
						<div className="flex items-center gap-2 border-b border-border-subtle/50 pb-2.5">
							<Clock className="size-4 text-cyan-500" />
							<h3 className="font-mono text-[11px] font-bold text-fg-default uppercase tracking-widest">
								Exclusion Enforcement
							</h3>
						</div>
						<p className="font-mono text-[9px] text-fg-muted uppercase tracking-wide leading-relaxed text-left">
							Blacklisted users are blocked immediately at the Discord Gateway level. They will receive automated warning mutes if they attempt to click ticket panel channels.
						</p>
					</div>

					<div className="p-4 border border-dashed border-border-subtle bg-panel-bg/5 rounded-xl space-y-2">
						<div className="flex items-center gap-1.5 font-mono text-[10px] font-bold text-fg-default uppercase tracking-wider">
							<Info className="size-3.5 text-primary-500" />
							<span>Exclusions Policy</span>
						</div>
						<p className="font-mono text-[9px] text-fg-muted uppercase leading-normal text-left">
							Player usernames must exactly match their verified linked usernames within the Minecraft database registry layer.
						</p>
					</div>
				</div>
			</div>
		</div>
	);
}
