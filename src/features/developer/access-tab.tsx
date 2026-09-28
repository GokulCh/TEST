"use client";

import { Eye, EyeOff, Lock, Shield } from "lucide-react";
import { InfoCard, InfoText } from "@/components/panel/form-parts";
import { cn } from "@/lib/utils";

/** Preview-mode toggle: shows the navigation the way a normal user experiences it. */
export function PreviewToggle({
	preview,
	onToggle,
	className,
	labels = ["Preview Mode", "Exit Preview"],
}: {
	preview: boolean;
	onToggle: () => void;
	className?: string;
	labels?: [string, string];
}) {
	return (
		<button
			onClick={onToggle}
			className={cn(
				"h-9 flex items-center justify-center gap-2 border font-medium text-xs rounded-lg transition-all active:scale-98 cursor-pointer shadow-sm",
				preview ? "border-amber-500/40 bg-amber-500/10 hover:bg-amber-500/20 text-amber-500" : "border-border-subtle bg-panel-bg/40 hover:bg-panel-bg text-fg-muted",
				className,
			)}
		>
			{preview ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
			<span>{preview ? labels[1] : labels[0]}</span>
		</button>
	);
}

export function AccessTab({ preview, onPreview }: { preview: boolean; onPreview: (next: boolean) => void }) {
	return (
		<div className="space-y-4">
			<InfoCard icon={<Lock className="size-4 text-amber-500" />} title="Access Control & Preview">
				<InfoText>As a developer, you can access and configure any guild&apos;s nodes and settings directly. Use preview mode to see what normal users experience.</InfoText>
			</InfoCard>

			<div className="p-5 border border-primary-500/20 bg-primary-500/5 rounded-xl flex items-center gap-3">
				<Shield className="size-5 text-primary-500" />
				<div>
					<h4 className="text-[13px] font-semibold text-fg-default">Developer Access</h4>
					<p className="text-xs text-fg-muted mt-1">Cross-guild access is enabled for your developer account</p>
				</div>
			</div>

			<div className="p-5 border border-amber-500/20 bg-amber-500/5 rounded-xl space-y-4">
				<div className="flex items-center gap-3">
					<Eye className="size-5 text-amber-500" />
					<div>
						<h4 className="text-[13px] font-semibold text-fg-default">Preview Mode</h4>
						<p className="text-xs text-fg-muted mt-1">Enable preview mode to see the navigation and page visibility as a normal user would experience it</p>
					</div>
				</div>
				<PreviewToggle preview={preview} onToggle={() => onPreview(!preview)} className="w-full px-4" labels={["Enter Preview Mode", "Exit Preview Mode"]} />
			</div>

			{preview && (
				<div className="p-4 border border-dashed border-amber-500/30 bg-amber-500/5 rounded-xl space-y-3">
					<div className="flex items-center gap-2">
						<Eye className="size-4 text-amber-500" />
						<h4 className="text-xs font-medium text-amber-500">Preview Active</h4>
					</div>
					<p className="text-xs text-fg-muted leading-relaxed">
						You are currently viewing the configuration as a normal user. Disabled pages and restricted categories will appear hidden or locked. Navigation reflects the current visibility settings.
					</p>
				</div>
			)}
		</div>
	);
}
