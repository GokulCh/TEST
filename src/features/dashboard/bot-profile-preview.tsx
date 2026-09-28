/* eslint-disable @next/next/no-img-element */
import { Bot, Sparkles } from "lucide-react";
import type { GuildAppearanceConfig } from "@/lib/db-types";

/** Plain-text rendering of the bio's markdown (no HTML is ever produced). */
export function formatBio(text: string | null | undefined): string {
	if (!text) return "Bot profile description.";
	return text
		.replace(/\*\*(.*?)\*\*/g, "*$1*") // bold
		.replace(/__(.*?)__/g, "_$1_") // italic
		.replace(/`(.*?)`/g, '"$1"') // code
		.replace(/\*([^*]+)\*/g, "$1") // then drop any remaining markers
		.replace(/_([^_]+)_/g, "$1");
}

/** What the bot's Discord profile will look like with the given appearance. */
export function BotProfilePreview({ appearance }: { appearance: GuildAppearanceConfig }) {
	return (
		<div className="w-full bg-[#18191c] rounded-xl overflow-hidden text-left font-sans select-none border border-neutral-800 shadow-2xl">
			<div className={`h-24 w-full relative ${appearance.banner ? "bg-gradient-to-r from-indigo-900 to-purple-900" : "bg-neutral-700"}`}>
				{appearance.banner && <img src={appearance.banner} alt="" className="absolute inset-0 w-full h-full object-cover" />}
				{appearance.banner && (
					<div className="absolute inset-0 flex items-center justify-center opacity-20">
						<Sparkles className="size-12 text-white/40 rotate-12" />
					</div>
				)}
			</div>
			<div className="px-4 pb-4 relative">
				<div className="absolute -top-9 left-4 size-16 rounded-full bg-[#18191c] p-1">
					{appearance.avatar ? (
						<img src={appearance.avatar} alt="" className="size-full rounded-full object-cover" />
					) : (
						<div className="size-full rounded-full flex items-center justify-center bg-gradient-to-tr from-violet-600 to-cyan-500">
							<Bot className="size-8 text-white" />
						</div>
					)}
					<div className="absolute bottom-0 right-0 size-3.5 bg-[#23a55a] rounded-full border-2 border-[#18191c]" />
				</div>
				<div className="pt-9 space-y-3">
					<div className="flex items-center gap-1.5">
						<span className="text-white font-bold text-base tracking-wide">{appearance.nickname || "Unnamed Bot"}</span>
						<span className="bg-[#5865f2] text-white text-xs font-extrabold px-1 rounded capitalize">BOT</span>
					</div>
					<div className="h-px bg-neutral-800/80" />
					<div className="space-y-1">
						<h5 className="text-xs font-medium text-white">About Me</h5>
						<p className="text-neutral-300 text-xs leading-relaxed font-light whitespace-pre-wrap">{formatBio(appearance.bio)}</p>
					</div>
				</div>
			</div>
		</div>
	);
}
