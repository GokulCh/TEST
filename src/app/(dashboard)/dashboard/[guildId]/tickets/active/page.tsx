"use client";

import { Ticket, UserCheck, Clock, AlertCircle, XCircle, Users } from "lucide-react";
import { useState } from "react";

import { PageShell } from "@/components/panel/page-shell";
import { Button } from "@/components/panel/form-parts";
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
		<PageShell eyebrow="Tickets" title="Support Tickets">

			{/* CATEGORY TABS */}
			<div className="flex border-b border-border-subtle/40 gap-2">
				{["ALL", "ELO Appeal", "Hacker Report", "General Inquiry"].map((cat) => (
					<button
						key={cat}
						onClick={() => setActiveCategory(cat)}
						className={`px-4 py-2 text-xs font-medium border-b-2 transition-all cursor-pointer ${
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
							className="p-4 border border-border-subtle bg-panel-bg/20 rounded-xl space-y-3 shadow-xs motion-fade text-left"
						>
							<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-border-subtle/20">
								<div>
									<div className="flex items-center gap-2">
										<span className="text-sm font-semibold text-fg-default">
											{t.id}
										</span>
										<span
											className={`text-xs font-medium px-1.5 py-0.2 rounded ${
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
									<div className="text-xs text-fg-muted mt-0.5 flex items-center gap-1.5">
										<Users className="size-3 text-fg-muted/60" /> {t.user}
										<span className="text-fg-muted/40">|</span>
										<Clock className="size-3 text-fg-muted/60" /> {t.time}
									</div>
								</div>

								<div className="flex gap-2 shrink-0">
									{t.status === "Open" ? (
										<Button variant="primary" size="sm"
											onClick={() => handleClaimTicket(t.id, "Staff_User")}>
											Claim Ticket
										</Button>
									) : (
										<span className="h-8 px-3 flex items-center border border-success/20 bg-success/10 text-success text-xs font-medium rounded-md">
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
						<div className="p-12 border border-dashed border-border-subtle/50 rounded-2xl bg-panel-bg/5 text-center text-xs text-fg-muted">
							No open tickets registered under this category
						</div>
					)}
				</div>

				<div className="space-y-6">
					<div className="p-5 rounded-xl border border-border-subtle bg-panel-bg/40 space-y-4 h-fit">
						<div className="flex items-center gap-2 border-b border-border-subtle/50 pb-2.5">
							<AlertCircle className="size-4 text-cyan-500" />
							<h3 className="text-sm font-semibold text-fg-default">
								Response Guidelines
							</h3>
						</div>
						<p className="text-xs text-fg-muted leading-relaxed text-left">
							Open tickets should be claimed by moderators within 15 minutes. Critical tickets send automatic notifications to staff.
						</p>
					</div>
				</div>
			</div>
		</PageShell>
	);
}
