"use client";

import { Eye, Palette } from "lucide-react";
import { Button, Field, InfoCard, TextInput } from "@/components/panel/form-parts";
import { PageShell } from "@/components/panel/page-shell";
import { useGuildResourceForm } from "@/hooks/use-guild-data";

interface PanelConfig {
	title: string;
	description: string;
	color: string;
	buttonText: string;
	buttonEmoji: string;
	channel: string;
}

const DEFAULT_PANEL: PanelConfig = { title: "", description: "", color: "#5865f2", buttonText: "", buttonEmoji: "", channel: "" };

export default function Page() {
	const { value: panel, update, isDirty, submit, saving, justSaved, error, isLoading } = useGuildResourceForm<PanelConfig>(
		"panel-creator",
		"panel",
		DEFAULT_PANEL,
		(stored) => ({ ...DEFAULT_PANEL, ...stored }),
	);

	return (
		<PageShell eyebrow="Tickets" title="Ticket Panels" loading={isLoading} onSave={submit} saveLabel="Deploy panel" saving={saving} dirty={isDirty} justSaved={justSaved} error={error}>
			<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
				<div className="lg:col-span-2 space-y-6">
					<InfoCard icon={<Palette className="size-4 text-primary-500" />} title="Embed Visual Parameters">
						<div className="space-y-4">
							<Field label="Panel Title">
								<TextInput value={panel.title} onValueChange={(title) => update({ title })} />
							</Field>
							<Field label="Panel Body Description">
								<textarea
									rows={3}
									value={panel.description}
									onChange={(e) => update({ description: e.target.value })}
									className="w-full p-3 bg-bg-canvas/40 border border-border-subtle rounded-lg text-sm text-fg-default resize-none leading-relaxed transition-[border-color,box-shadow] duration-150 hover:border-fg-muted/30 focus:outline-none focus:border-primary-500/60 focus:ring-2 focus:ring-primary-500/15"
								/>
							</Field>
							<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
								<Field label="Button Text">
									<TextInput value={panel.buttonText} onValueChange={(buttonText) => update({ buttonText })} />
								</Field>
								<Field label="Button Emoji">
									<TextInput value={panel.buttonEmoji} onValueChange={(buttonEmoji) => update({ buttonEmoji })} />
								</Field>
							</div>
							<Field label="Target Deployment Channel">
								<TextInput value={panel.channel} onValueChange={(channel) => update({ channel })} />
							</Field>
						</div>
					</InfoCard>
				</div>

				<div className="space-y-4">
					<div className="flex items-center gap-2 border-b border-border-subtle/50 pb-2.5 px-1 text-left">
						<Eye className="size-3.5 text-fg-muted" />
						<h3 className="text-xs font-medium text-fg-muted">Embed Live Preview</h3>
					</div>

					<div className="w-full bg-[#18191c] rounded-xl p-4 text-left font-sans select-none border border-neutral-800 shadow-2xl relative space-y-4">
						<div className="border-l-4 border-[#5865f2] pl-3 space-y-1">
							<div className="text-white font-bold text-sm">{panel.title || <span className="opacity-40">Panel Title</span>}</div>
							<p className="text-neutral-300 text-xs font-light leading-relaxed">{panel.description || <span className="opacity-40">Panel description…</span>}</p>
						</div>
						<Button variant="secondary" size="sm">
							<span>{panel.buttonEmoji}</span>
							<span>{panel.buttonText || "Open Ticket"}</span>
						</Button>
					</div>
				</div>
			</div>
		</PageShell>
	);
}
