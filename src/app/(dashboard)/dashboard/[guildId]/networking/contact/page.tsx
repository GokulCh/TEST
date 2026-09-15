"use client";

import {
	Mail,
	MessageCircle,
	Info,
} from "lucide-react";

export default function Page() {
	return (
		<div className="w-full p-6 lg:p-8 space-y-6 animate-in fade-in duration-300 select-none max-w-7xl mx-auto text-left">
			{/* HUD PANEL HEADER */}
			<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border-subtle pb-6">
				<div>
					<h1 className="font-mono text-[10px] font-bold uppercase tracking-widest text-fg-muted">
						// Gateway Administrative Core
					</h1>
					<h2 className="text-2xl font-black tracking-tight text-fg-default mt-1">
						Core Contact
					</h2>
				</div>
			</div>

			<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
				{/* CONTACT INFO */}
				<div className="lg:col-span-2 space-y-6">
					<div className="p-5 border border-border-subtle bg-panel-bg/20 backdrop-blur-md rounded-xl space-y-4 shadow-xs text-left">
						<div className="flex items-center gap-2 border-b border-border-subtle/50 pb-2.5">
							<MessageCircle className="size-4 text-primary-500" />
							<h3 className="font-mono text-[11px] font-bold text-fg-default uppercase tracking-widest">
								Developer Contact Information
							</h3>
						</div>

						<div className="space-y-4">
							<div className="p-4 border border-primary-500/20 bg-primary-500/5 rounded-xl space-y-3">
								<div className="flex items-center gap-3">
									<div className="size-10 rounded-lg bg-indigo-500/20 flex items-center justify-center">
										<MessageCircle className="size-5 text-indigo-500" />
									</div>
									<div>
										<p className="font-mono text-xs font-bold text-fg-muted uppercase tracking-wider">
											Discord Username
										</p>
										<p className="font-mono text-lg font-bold text-fg-default mt-1">
											wiggels
										</p>
									</div>
								</div>
								<div className="pt-3 border-t border-border-subtle/30">
									<p className="font-mono text-[10px] text-fg-muted leading-relaxed">
										Feel free to contact me anytime on Discord if you have questions, need support, or want to discuss the Ranked Bedwars Configuration system.
									</p>
								</div>
							</div>

							<div className="p-4 border border-border-subtle/50 bg-panel-bg/40 rounded-xl space-y-3">
								<div className="flex items-center gap-2">
									<Info className="size-4 text-cyan-500" />
									<p className="font-mono text-xs font-bold text-fg-default uppercase tracking-wider">
										Availability
									</p>
								</div>
								<p className="font-mono text-[10px] text-fg-muted leading-relaxed">
									I'm typically available to respond to Discord messages within 24-48 hours. For urgent issues or bugs, please include detailed information about what you were doing when the issue occurred.
								</p>
							</div>
						</div>
					</div>
				</div>

				<div className="space-y-6">
					<div className="p-5 border border-border-subtle bg-panel-bg/20 backdrop-blur-md rounded-xl space-y-4 h-fit text-left">
						<div className="flex items-center gap-2 border-b border-border-subtle/50 pb-2.5">
							<Mail className="size-4 text-amber-500" />
							<h3 className="font-mono text-[11px] font-bold text-fg-default uppercase tracking-widest">
								Best Practices
							</h3>
						</div>
						<div className="space-y-3">
							<div className="flex items-start gap-2">
								<div className="size-1.5 rounded-full bg-success mt-1.5 shrink-0" />
								<p className="font-mono text-[9px] text-fg-muted uppercase tracking-wide leading-relaxed">
									Include screenshots or error messages when reporting bugs
								</p>
							</div>
							<div className="flex items-start gap-2">
								<div className="size-1.5 rounded-full bg-success mt-1.5 shrink-0" />
								<p className="font-mono text-[9px] text-fg-muted uppercase tracking-wide leading-relaxed">
									Be specific about configuration changes you were making
								</p>
							</div>
							<div className="flex items-start gap-2">
								<div className="size-1.5 rounded-full bg-success mt-1.5 shrink-0" />
								<p className="font-mono text-[9px] text-fg-muted uppercase tracking-wide leading-relaxed">
									Mention your Discord username in your message
								</p>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
