"use client";

import { Hash, MessageSquare } from "lucide-react";
import type { ChannelOption } from "@/hooks/useGuildSnapshot";
import OptionDropdown from "./OptionDropdown";

interface ChannelDropdownProps {
	value: string;
	onChange: (value: string) => void;
	channels: ChannelOption[];
	threads: ChannelOption[];
	placeholder?: string;
	className?: string;
}

export default function ChannelDropdown({ value, onChange, channels, threads, placeholder = "Select a channel", className = "" }: ChannelDropdownProps) {
	const options = [
		...channels.map((channel) => ({ value: channel.id, label: channel.name, searchLabel: channel.name, icon: <Hash className="size-3.5 shrink-0 text-cyan-400" /> })),
		...threads.map((thread) => ({ value: thread.id, label: thread.name, searchLabel: thread.name, icon: <MessageSquare className="size-3.5 shrink-0 text-rose-400" /> })),
	];

	return <OptionDropdown value={value} onChange={onChange} placeholder={placeholder} ariaLabel="Channel" className={className} options={options} emptyLabel="No channels found" />;
}
