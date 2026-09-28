"use client";

import { Mail, MessageCircle, Info } from "lucide-react";

import { PageShell } from "@/components/panel/page-shell";
import { InfoCard } from "@/components/panel/form-parts";
export default function Page() {
	return (
		<PageShell eyebrow="Networking" title="Contact">

			<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
				{/* CONTACT INFO */}
				<div className="lg:col-span-2 space-y-6">
					<InfoCard icon={<MessageCircle className="size-4 text-primary-500" />} title="Developer Contact Information">
						<div className="space-y-4">
							<div className="p-4 border border-primary-500/20 bg-primary-500/5 rounded-xl space-y-3">
								<div className="flex items-center gap-3">
									<div className="size-10 rounded-lg bg-indigo-500/20 flex items-center justify-center">
										<MessageCircle className="size-5 text-indigo-500" />
									</div>
									<div>
										<p className="text-xs font-medium text-fg-muted">
											Discord Username
										</p>
										<p className="text-lg font-semibold text-fg-default mt-1">
											wiggels
										</p>
									</div>
								</div>
								<div className="pt-3 border-t border-border-subtle/30">
									<p className="text-xs text-fg-muted leading-relaxed">
										Feel free to contact me anytime on Discord if you have questions, need support, or want to discuss the Ranked Bedwars Configuration system.
									</p>
								</div>
							</div>

							<div className="p-4 border border-border-subtle/50 bg-panel-bg/40 rounded-xl space-y-3">
								<div className="flex items-center gap-2">
									<Info className="size-4 text-cyan-500" />
									<p className="text-[13px] font-semibold text-fg-default">
										Availability
									</p>
								</div>
								<p className="text-xs text-fg-muted leading-relaxed">
									I'm typically available to respond to Discord messages within 24-48 hours. For urgent issues or bugs, please include detailed information about what you were doing when the issue occurred.
								</p>
							</div>
						</div>
					</InfoCard>
				</div>

				<div className="space-y-6">
					<InfoCard icon={<Mail className="size-4 text-amber-500" />} title="Best Practices">
						<div className="space-y-3">
							<div className="flex items-start gap-2">
								<div className="size-1.5 rounded-full bg-success mt-1.5 shrink-0" />
								<p className="text-xs text-fg-muted leading-relaxed">
									Include screenshots or error messages when reporting bugs
								</p>
							</div>
							<div className="flex items-start gap-2">
								<div className="size-1.5 rounded-full bg-success mt-1.5 shrink-0" />
								<p className="text-xs text-fg-muted leading-relaxed">
									Be specific about configuration changes you were making
								</p>
							</div>
							<div className="flex items-start gap-2">
								<div className="size-1.5 rounded-full bg-success mt-1.5 shrink-0" />
								<p className="text-xs text-fg-muted leading-relaxed">
									Mention your Discord username in your message
								</p>
							</div>
						</div>
					</InfoCard>
				</div>
			</div>
		</PageShell>
	);
}
