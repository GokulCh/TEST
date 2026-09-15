"use client";

import {
	Ticket,
	UserCheck,
	Clock,
	AlertCircle,
	XCircle,
	Users,
} from "lucide-react";
import { useState } from "react";

export default function Page() {
	const [activeCategory, setActiveCategory] = useState("ALL");

	const [tickets, setTickets] = useState<Array<{
		id: string;
		user: string;
		category: string;
		priority: string;
		assignedStaff: string;
		status: string;
		time: string;
	}>>([]);

	const handleClaimTicket = (id: string, staffName: string) => {
		setTickets(
			tickets.map((t) =>
				t.id === id ? { ...t, assignedStaff: staffName, status: "Claimed" } : t
			)
		);
	};

	const handleCloseTicket = (id: string) => {
		setTickets(tickets.filter((t) => t.id !== id));
	};

	const filteredTickets = tickets.filter(
		(t) => activeCategory === "ALL" || t.category.toUpperCase().includes(activeCategory.toUpperCase())
	);

	return (
		<div className="w-full p-6 lg:p-8 space-y-6 animate-in fade-in duration-300 select-none max-w-7xl mx-auto text-left">
			{/* HUD PANEL HEADER */}
			<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border-subtle pb-6">
				<div>
					<h1 className="font-mono text-[10px] font-bold uppercase tracking-widest text-fg-muted">
						// Tickets Dispatch Core
					</h1>
					<h2 className="text-2xl font-black tracking-tight text-fg-default mt-1">
						Live Support Hub
					</h2>
				</div>
			</div>

			{/* CATEGORY TABS */}
			<div className="flex border-b border-border-subtle/40 gap-2">
				{["ALL", "ELO Appeal", "Hacker Report", "General Inquiry"].map((cat) => (
					<button
						key={cat}
						onClick={() => setActiveCategory(cat)}
						className={`px-4 py-2 font-mono text-[11px] font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
							activeCategory === cat
								? "border-primary-500 text-primary-500"
								: "border-transparent text-fg-muted hover:text-fg-default"
						}`}
					>
						{cat}
					</button>
				))}
			</div>

			{/* TICKETS LIST */}
			<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
				<div className="lg:col-span-2 space-y-4">
					{filteredTickets.map((t) => (
						<div
							key={t.id}
							className="p-4 border border-border-subtle bg-panel-bg/20 rounded-xl space-y-3 shadow-xs animate-in fade-in duration-150 text-left"
						>
							<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-border-subtle/20">
								<div>
									<div className="flex items-center gap-2">
										<span className="font-mono text-sm font-black text-fg-default">
											{t.id}
										</span>
										<span
											className={`font-mono text-[8px] font-bold uppercase px-1.5 py-0.2 rounded ${
												t.priority === "Critical"
													? "bg-red-500/10 text-red-500 border border-red-500/20"
													: t.priority === "High"
														? "bg-amber-500/10 text-amber-500 border border-amber-500/20"
														: "bg-panel-bg text-fg-muted"
											}`}
										>
											{t.priority}
										</span>
									</div>
									<div className="font-mono text-[10px] text-fg-muted uppercase mt-0.5 flex items-center gap-1.5">
										<Users className="size-3 text-fg-muted/60" /> {t.user}
										<span className="text-fg-muted/40">|</span>
										<Clock className="size-3 text-fg-muted/60" /> {t.time}
									</div>
								</div>

								<div className="flex gap-2 shrink-0">
									{t.status === "Open" ? (
										<button
											onClick={() => handleClaimTicket(t.id, "Staff_User")}
											className="h-8 px-3 border border-primary-500/20 bg-primary-500/10 hover:bg-primary-500/20 text-primary-500 font-mono text-[9px] font-bold uppercase tracking-wider rounded-md transition-all active:scale-95 cursor-pointer"
										>
											Claim Ticket
										</button>
									) : (
										<span className="h-8 px-3 flex items-center border border-success/20 bg-success/10 text-success font-mono text-[9px] font-bold uppercase tracking-wider rounded-md">
											<UserCheck className="size-3 mr-1" /> Claimed by {t.assignedStaff}
										</span>
									)}

									<button
										onClick={() => handleCloseTicket(t.id)}
										className="size-8 flex items-center justify-center border border-border-subtle hover:bg-red-500/10 text-fg-muted hover:text-red-400 rounded-md transition-all cursor-pointer"
									>
										<XCircle className="size-3.5" />
									</button>
								</div>
							</div>
						</div>
					))}

					{filteredTickets.length === 0 && (
						<div className="p-12 border border-dashed border-border-subtle/50 rounded-2xl bg-panel-bg/5 text-center font-mono text-xs text-fg-muted uppercase">
							No open tickets registered under this category
						</div>
					)}
				</div>

				<div className="space-y-6">
					<div className="p-5 border border-border-subtle bg-panel-bg/20 backdrop-blur-md rounded-xl space-y-4 h-fit">
						<div className="flex items-center gap-2 border-b border-border-subtle/50 pb-2.5">
							<AlertCircle className="size-4 text-cyan-500" />
							<h3 className="font-mono text-[11px] font-bold text-fg-default uppercase tracking-widest">
								Support SLA Guard
							</h3>
						</div>
						<p className="font-mono text-[9px] text-fg-muted uppercase tracking-wide leading-relaxed text-left">
							Open tickets should be claimed by moderators within 15 minutes of creation. Critical tickets trigger mobile staff notifications automatically.
						</p>
					</div>
				</div>
			</div>
		</div>
	);
}
