import type { LucideIcon } from "lucide-react";

export interface StatCardProps {
	label: string;
	value: string;
	/** Badge text for a neutral card (e.g. "All-time"). */
	change: string;
	icon: LucideIcon;
	color: string;
	bg: string;
	/** "up" / "down" show an arrow; "neutral" shows `change`. */
	direction: "up" | "down" | "neutral";
}

export function StatCard({ label, value, change, icon: Icon, color, bg, direction }: StatCardProps) {
	return (
		<div className="p-4 rounded-xl border border-border-subtle bg-panel-bg/40 shadow-sm flex items-center justify-between transition-all hover:border-border-subtle/80 group">
			<div className="space-y-1.5 min-w-0">
				<span className="block text-[12px] font-medium text-fg-muted truncate">{label}</span>
				<div className="flex items-baseline gap-2">
					<span className="text-2xl font-semibold text-fg-default">{value}</span>
					{direction === "neutral" ? (
						<span className="text-xs font-medium text-success bg-success/10 px-1.5 py-0.5 rounded capitalize">{change}</span>
					) : (
						<span className={`font-mono text-[10px] font-bold px-1.5 py-0.5 rounded ${direction === "up" ? "text-success bg-success/10" : "text-red-500 bg-red-500/10"}`}>{direction === "up" ? "↑" : "↓"}</span>
					)}
				</div>
			</div>
			<div className={`size-12 rounded-lg flex items-center justify-center shrink-0 border border-border-subtle/30 shadow-inner group-hover:scale-105 transition-transform ${bg}`}>
				<Icon className={`size-6 ${color}`} />
			</div>
		</div>
	);
}
