"use client";

import { Hash, MessageSquare, Search } from "lucide-react";
import { useState } from "react";
import type { ChannelOption } from "@/hooks/useGuildSnapshot";

interface ChannelDropdownProps {
	value: string;
	onChange: (value: string) => void;
	channels: ChannelOption[];
	threads: ChannelOption[];
	placeholder?: string;
	className?: string;
}

export default function ChannelDropdown({
	value,
	onChange,
	channels,
	threads,
	placeholder = "Select a channel",
	className = "",
}: ChannelDropdownProps) {
	const [isOpen, setIsOpen] = useState(false);
	const [activeTab, setActiveTab] = useState<"channels" | "threads">("channels");
	const [searchQuery, setSearchQuery] = useState("");

	const filteredChannels = channels.filter((ch) =>
		ch.name.toLowerCase().includes(searchQuery.toLowerCase())
	);
	const filteredThreads = threads.filter((th) =>
		th.name.toLowerCase().includes(searchQuery.toLowerCase())
	);

	const selectedChannel = [...channels, ...threads].find((ch) => ch.id === value);

	return (
		<div className={`relative ${className}`}>
			<button
				type="button"
				onClick={() => setIsOpen(!isOpen)}
				className="w-full h-9 px-3 bg-bg-canvas/40 border border-border-subtle rounded-lg font-mono text-xs text-fg-default focus:outline-none focus:border-primary-500/50 flex items-center justify-between"
			>
				<span className="truncate flex items-center gap-2">
					{selectedChannel ? (
						<>
							{selectedChannel.type === "thread" ? (
								<MessageSquare className="size-3.5 text-rose-400" />
							) : (
								<Hash className="size-3.5 text-cyan-400" />
							)}
							{selectedChannel.name}
						</>
					) : (
						<span className="text-fg-muted">{placeholder}</span>
					)}
				</span>
				<span className="text-fg-muted">▼</span>
			</button>

			{isOpen && (
				<div className="absolute z-[100] w-full mt-1 bg-panel-bg border border-border-subtle rounded-lg shadow-lg max-h-64 overflow-hidden">
					{/* Search */}
					<div className="p-2 border-b border-border-subtle/50">
						<div className="relative">
							<Search className="absolute left-2 top-1/2 -translate-y-1/2 size-3.5 text-fg-muted" />
							<input
								type="text"
								placeholder="Search..."
								value={searchQuery}
								onChange={(e) => setSearchQuery(e.target.value)}
								className="w-full h-7 pl-8 pr-2 bg-bg-canvas/40 border border-border-subtle rounded-md font-mono text-[10px] text-fg-default focus:outline-none focus:border-primary-500/50"
							/>
						</div>
					</div>

					{/* Tabs */}
					<div className="flex border-b border-border-subtle/50">
						<button
							type="button"
							onClick={() => setActiveTab("channels")}
							className={`flex-1 px-3 py-2 font-mono text-[10px] font-bold uppercase tracking-wider border-b-2 transition-all ${
								activeTab === "channels"
									? "border-primary-500 text-primary-500"
									: "border-transparent text-fg-muted hover:text-fg-default"
							}`}
						>
							<Hash className="size-3 inline mr-1" /> Channels
						</button>
						<button
							type="button"
							onClick={() => setActiveTab("threads")}
							className={`flex-1 px-3 py-2 font-mono text-[10px] font-bold uppercase tracking-wider border-b-2 transition-all ${
								activeTab === "threads"
									? "border-primary-500 text-primary-500"
									: "border-transparent text-fg-muted hover:text-fg-default"
							}`}
						>
							<MessageSquare className="size-3 inline mr-1" /> Threads
						</button>
					</div>

					{/* Options */}
					<div className="max-h-48 overflow-y-auto">
						{activeTab === "channels" ? (
							filteredChannels.length > 0 ? (
								filteredChannels.map((channel) => (
									<button
										type="button"
										key={channel.id}
										onClick={() => {
											onChange(channel.id);
											setIsOpen(false);
											setSearchQuery("");
										}}
										className={`w-full px-3 py-2 text-left font-mono text-[10px] text-fg-default hover:bg-bg-canvas/60 transition-all flex items-center gap-2 ${
											value === channel.id ? "bg-primary-500/10 text-primary-500" : ""
										}`}
									>
										<Hash className="size-3.5 text-cyan-400" />
										<span className="truncate">{channel.name}</span>
									</button>
								))
							) : (
								<div className="p-3 text-center font-mono text-[9px] text-fg-muted">
									No channels found
								</div>
							)
						) : (
							filteredThreads.length > 0 ? (
								filteredThreads.map((thread) => (
									<button
										type="button"
										key={thread.id}
										onClick={() => {
											onChange(thread.id);
											setIsOpen(false);
											setSearchQuery("");
										}}
										className={`w-full px-3 py-2 text-left font-mono text-[10px] text-fg-default hover:bg-bg-canvas/60 transition-all flex items-center gap-2 ${
											value === thread.id ? "bg-primary-500/10 text-primary-500" : ""
										}`}
									>
										<MessageSquare className="size-3.5 text-rose-400" />
										<span className="truncate">{thread.name}</span>
									</button>
								))
							) : (
								<div className="p-3 text-center font-mono text-[9px] text-fg-muted">
									No threads found
								</div>
							)
						)}
					</div>
				</div>
			)}
		</div>
	);
}