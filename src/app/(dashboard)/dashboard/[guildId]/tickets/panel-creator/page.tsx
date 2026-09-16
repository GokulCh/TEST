"use client";

import {
	PlusSquare,
	Save,
	Eye,
	Palette,
	Send,
	MessageSquare,
	Sparkles,
} from "lucide-react";
import { useState } from "react";
import { useUnsavedChanges } from "@/hooks/use-unsaved-changes";

interface PanelConfig {
	title: string;
	description: string;
	color: string;
	buttonText: string;
	buttonEmoji: string;
	channel: string;
}

const DEFAULT_PANEL: PanelConfig = {
	title: "",
	description: "",
	color: "#5865f2",
	buttonText: "",
	buttonEmoji: "",
	channel: "",
};

export default function Page() {
	const [isSaving, setIsSaving] = useState(false);
	const [panel, setPanel] = useState<PanelConfig>({ ...DEFAULT_PANEL });
	const [savedPanel, setSavedPanel] = useState<PanelConfig>({ ...DEFAULT_PANEL });

	const { isDirty } = useUnsavedChanges(panel, savedPanel);

	const handleInputChange = (field: keyof PanelConfig, value: string) => {
		setPanel((prev) => ({ ...prev, [field]: value }));
	};

	const handleSaveChanges = () => {
		setIsSaving(true);
		setTimeout(() => {
			setSavedPanel({ ...panel });
			setIsSaving(false);
		}, 900);
	};

	return (
		<div className="w-full p-6 lg:p-8 space-y-6 animate-in fade-in duration-300 select-none max-w-7xl mx-auto text-left">
			{/* HUD PANEL HEADER */}
			<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border-subtle pb-6">
				<div>
					<h1 className="font-mono text-[10px] font-bold uppercase tracking-widest text-fg-muted">
						// Tickets Interface Dispatcher
					</h1>
					<h2 className="text-2xl font-black tracking-tight text-fg-default mt-1">
						Drop Embed Panels
					</h2>
				</div>

				<button
					onClick={handleSaveChanges}
					className={`h-9 px-4 flex items-center gap-2 border font-mono font-bold text-[11px] uppercase tracking-wider rounded-lg transition-all active:scale-98 cursor-pointer shadow-sm self-start sm:self-auto ${
						isDirty
							? "border-warning/40 bg-warning/10 hover:bg-warning/20 text-warning"
							: "border-primary-500/20 bg-primary-500/10 hover:bg-primary-500/20 text-primary-500"
					}`}
				>
					<Send className="size-3.5" />
					<span>
						{isSaving ? "Dispatching Embed..." : "Deploy Support Panel"}
					</span>
				</button>
			</div>

			<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
				{/* CONFIGURATOR */}
				<div className="lg:col-span-2 space-y-6">
					<div className="p-5 border border-border-subtle bg-panel-bg/20 backdrop-blur-md rounded-xl space-y-4 shadow-xs text-left">
						<div className="flex items-center gap-2 border-b border-border-subtle/50 pb-2.5">
							<Palette className="size-4 text-primary-500" />
							<h3 className="font-mono text-[11px] font-bold text-fg-default uppercase tracking-widest">
								Embed Visual Parameters
							</h3>
						</div>

						<div className="space-y-4 font-mono text-xs">
							<div className="space-y-1.5">
								<label className="block font-bold text-fg-default uppercase tracking-wider">
									Panel Title
								</label>
								<input
									type="text"
									value={panel.title}
									onChange={(e) => handleInputChange("title", e.target.value)}
									className="w-full h-9 px-3 bg-bg-canvas/40 border border-border-subtle rounded-lg text-fg-default focus:outline-none focus:border-primary-500/50"
								/>
							</div>

							<div className="space-y-1.5">
								<label className="block font-bold text-fg-default uppercase tracking-wider">
									Panel Body Description
								</label>
								<textarea
									rows={3}
									value={panel.description}
									onChange={(e) => handleInputChange("description", e.target.value)}
									className="w-full p-3 bg-bg-canvas/40 border border-border-subtle rounded-lg text-fg-default focus:outline-none focus:border-primary-500/50 resize-none leading-relaxed"
								/>
							</div>

							<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
								<div className="space-y-1.5">
									<label className="block font-bold text-fg-default uppercase tracking-wider">
										Button Text
									</label>
									<input
										type="text"
										value={panel.buttonText}
										onChange={(e) => handleInputChange("buttonText", e.target.value)}
										className="w-full h-9 px-3 bg-bg-canvas/40 border border-border-subtle rounded-lg text-fg-default focus:outline-none focus:border-primary-500/50"
									/>
								</div>

								<div className="space-y-1.5">
									<label className="block font-bold text-fg-default uppercase tracking-wider">
										Button Emoji
									</label>
									<input
										type="text"
										value={panel.buttonEmoji}
										onChange={(e) => handleInputChange("buttonEmoji", e.target.value)}
										className="w-full h-9 px-3 bg-bg-canvas/40 border border-border-subtle rounded-lg text-fg-default focus:outline-none focus:border-primary-500/50"
									/>
								</div>
							</div>

							<div className="space-y-1.5">
								<label className="block font-bold text-fg-default uppercase tracking-wider">
									Target Deployment Channel
								</label>
								<input
									type="text"
									value={panel.channel}
									onChange={(e) => handleInputChange("channel", e.target.value)}
									className="w-full h-9 px-3 bg-bg-canvas/40 border border-border-subtle rounded-lg text-fg-default focus:outline-none focus:border-primary-500/50"
								/>
							</div>
						</div>
					</div>
				</div>

				{/* WYSIWYG PREVIEW */}
				<div className="space-y-4">
					<div className="flex items-center gap-2 border-b border-border-subtle/50 pb-2.5 px-1 text-left">
						<Eye className="size-3.5 text-fg-muted" />
						<h3 className="font-mono text-[10px] font-bold text-fg-muted uppercase tracking-widest">
							Embed Live Preview
						</h3>
					</div>

					<div className="w-full bg-[#18191c] rounded-xl p-4 text-left font-sans select-none border border-neutral-800 shadow-2xl relative space-y-4">
						<div className="border-l-4 border-[#5865f2] pl-3 space-y-1">
							<div className="text-white font-bold text-sm">
								{panel.title || <span className="opacity-40">Panel Title</span>}
							</div>
							<p className="text-neutral-300 text-xs font-light leading-relaxed">
								{panel.description || <span className="opacity-40">Panel description…</span>}
							</p>
						</div>

						<button className="h-8 px-4 bg-[#5865f2] hover:bg-[#4752c4] text-white text-xs font-semibold rounded flex items-center gap-1.5 transition-all">
							<span>{panel.buttonEmoji}</span>
							<span>{panel.buttonText || "Open Ticket"}</span>
						</button>
					</div>
				</div>
			</div>
		</div>
	);
}
