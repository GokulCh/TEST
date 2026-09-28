"use client";

import { FileCode, Plus, Trash2, Send, MessageSquare, Info, ToggleLeft, ToggleRight, Layers, Cpu } from "lucide-react";
import { useState } from "react";
import { useUnsavedChanges } from "@/hooks/use-unsaved-changes";
import { useGuildSnapshot } from "@/hooks/useGuildSnapshot";
import ChannelDropdown from "@/components/ui/ChannelDropdown";

import { PageShell } from "@/components/panel/page-shell";
import { Button, InfoCard } from "@/components/panel/form-parts";
type ActionType =
	| "ticket_create"
	| "assign_role"
	| "remove_role"
	| "toggle_role"
	| "open_url"
	| "send_ephemeral"
	| "noop";

interface PanelActionUI {
	type: ActionType;
	role_key: string;
	url: string;
	title: string;
	description: string;
}

interface InteractivePanelUI {
	id: string;
	key: string;
	name: string;
	description: string;
	format: "container" | "embed";
	enabled: boolean;
	content: { title: string; text: string; accent: string; footer: string };
	actions: Record<string, PanelActionUI>;
	deployed_channel_id: string;
	deployed_message_id: string;
}

const ACTION_OPTIONS: Array<{ value: ActionType; label: string }> = [
	{ value: "ticket_create", label: "Create Ticket" },
	{ value: "assign_role", label: "Assign Role" },
	{ value: "remove_role", label: "Remove Role" },
	{ value: "toggle_role", label: "Toggle Role" },
	{ value: "open_url", label: "Open URL" },
	{ value: "send_ephemeral", label: "Send Ephemeral" },
	{ value: "noop", label: "No Op" },
];

export default function Page() {
	const { channels, threads } = useGuildSnapshot();
	const [selectedKey, setSelectedKey] = useState<string | null>(null);

	const [panels, setPanels] = useState<InteractivePanelUI[]>([]);
	const [savedPanels, setSavedPanels] = useState<InteractivePanelUI[]>([]);

	const { isDirty } = useUnsavedChanges(panels, savedPanels);

	const updatePanel = (key: string, updates: Partial<InteractivePanelUI>) => {
		setPanels((prev) => prev.map((p) => (p.key === key ? { ...p, ...updates } : p)));
	};

	const updateAction = (panelKey: string, actionId: string, updates: Partial<PanelActionUI>) => {
		setPanels((prev) =>
			prev.map((p) =>
				p.key === panelKey ? { ...p, actions: { ...p.actions, [actionId]: { ...p.actions[actionId], ...updates } } } : p
			)
		);
	};

	const handleAddPanel = () => {
		const key = `panel-${Date.now()}`;
		setPanels((prev) => [
			...prev,
			{
				id: `ip-${Date.now()}`,
				key,
				name: "",
				description: "",
				format: "container",
				enabled: true,
				content: { title: "", text: "", accent: "#eab308", footer: "" },
				actions: {},
				deployed_channel_id: "",
				deployed_message_id: "",
			},
		]);
		setSelectedKey(key);
	};

	const handleDeletePanel = (key: string) => {
		setPanels((prev) => prev.filter((p) => p.key !== key));
		if (selectedKey === key) {
			const remaining = panels.filter((p) => p.key !== key);
			setSelectedKey(remaining.length > 0 ? remaining[0].key : null);
		}
	};

	// ponytail: local only, no backend section for this page yet; the shell labels it a preview.
	const handleSaveChanges = () => {
	setSavedPanels(JSON.parse(JSON.stringify(panels)));
	};

	const active = panels.find((p) => p.key === selectedKey) ?? panels[0];

	return (
		<PageShell preview eyebrow="Toolkits" title="Panel Deployer" onSave={handleSaveChanges} dirty={isDirty}>

			{/* ACTION BAR */}
			<div className="flex justify-between items-center bg-panel-bg/10 p-4 border border-border-subtle rounded-xl">
				<div>
					<h3 className="text-[13px] font-semibold text-fg-default">
						Panel Definitions
					</h3>
					<p className="text-xs text-fg-muted mt-0.5">
						Deployable container / embed panels bound to component actions
					</p>
				</div>
				<Button variant="dashed" size="sm"
					onClick={handleAddPanel}>
					<Plus className="size-3.5" /> Append Panel
				</Button>
			</div>

			<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
				{/* PANEL LIST + EDITOR */}
				<div className="lg:col-span-2 space-y-4">
					<div className="space-y-2">
						{panels.map((p) => (
							<div
								key={p.key}
								onClick={() => setSelectedKey(p.key)}
								className={`p-3 border rounded-xl transition-all cursor-pointer flex items-center justify-between ${
									selectedKey === p.key
										? "border-primary-500/40 bg-primary-500/5"
										: "border-border-subtle bg-panel-bg/20 hover:border-border-subtle/80"
								}`}
							>
								<div className="min-w-0">
									<div className="flex items-center gap-2">
										<Layers className="size-3.5 text-primary-500" />
										<span className="text-[13px] font-semibold text-fg-default">{p.name}</span>
										<span className={`text-xs font-medium px-1.5 py-0.5 rounded ${p.format === "container" ? "bg-cyan-500/10 text-cyan-400" : "bg-violet-500/10 text-violet-400"}`}>
											{p.format}
										</span>
									</div>
									<div className="text-xs text-fg-muted mt-0.5 flex gap-3">
										<span>key: {p.key}</span>
										{p.deployed_message_id ? <span>deployed ✓</span> : <span>undeployed</span>}
									</div>
								</div>
								<div className="flex items-center gap-2 shrink-0">
									<span className={`text-xs font-medium ${p.enabled ? "text-success" : "text-fg-muted"}`}>
										{p.enabled ? "Active" : "Disabled"}
									</span>
									<Button variant="secondary"
										onClick={(e) => {
											e.stopPropagation();
											updatePanel(p.key, { enabled: !p.enabled });
										}}>
										{p.enabled ? <ToggleRight className="size-5 text-success" /> : <ToggleLeft className="size-5" />}
									</Button>
									<button
										onClick={(e) => {
											e.stopPropagation();
											handleDeletePanel(p.key);
										}}
										className="size-8 flex items-center justify-center border border-border-subtle hover:bg-red-500/10 text-fg-muted hover:text-red-400 rounded-md transition-all cursor-pointer"
									>
										<Trash2 className="size-3.5" />
									</button>
								</div>
							</div>
						))}
					</div>

					{active && (
						<InfoCard icon={<FileCode className="size-4 text-primary-500" />} title={`Editor — ${active.name}`}>
							<div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
								<div className="space-y-1">
									<label className="block text-xs font-medium text-fg-muted">
										Key
									</label>
									<input
										type="text"
										value={active.key}
										onChange={(e) => updatePanel(active.key, { key: e.target.value })}
										className="w-full h-8 px-2.5 bg-bg-canvas/40 border border-border-subtle rounded-md text-sm text-fg-default transition-[border-color,box-shadow] duration-150 hover:border-fg-muted/30 focus:outline-none focus:border-primary-500/60 focus:ring-2 focus:ring-primary-500/15"
									/>
								</div>
								<div className="space-y-1">
									<label className="block text-xs font-medium text-fg-muted">
										Name
									</label>
									<input
										type="text"
										value={active.name}
										onChange={(e) => updatePanel(active.key, { name: e.target.value })}
										className="w-full h-8 px-2.5 bg-bg-canvas/40 border border-border-subtle rounded-md text-sm text-fg-default transition-[border-color,box-shadow] duration-150 hover:border-fg-muted/30 focus:outline-none focus:border-primary-500/60 focus:ring-2 focus:ring-primary-500/15"
									/>
								</div>
								<div className="space-y-1">
									<label className="block text-xs font-medium text-fg-muted">
										Format
									</label>
									<select
										value={active.format}
										onChange={(e) => updatePanel(active.key, { format: e.target.value as "container" | "embed" })}
										className="w-full h-8 px-2 bg-bg-canvas/40 border border-border-subtle rounded-md text-sm text-fg-default transition-[border-color,box-shadow] duration-150 hover:border-fg-muted/30 focus:outline-none focus:border-primary-500/60 focus:ring-2 focus:ring-primary-500/15"
									>
										<option value="container">container</option>
										<option value="embed">embed</option>
									</select>
								</div>
							</div>

							<div className="space-y-1">
								<label className="block text-xs font-medium text-fg-muted">
									Description
								</label>
								<input
									type="text"
									value={active.description}
									onChange={(e) => updatePanel(active.key, { description: e.target.value })}
									className="w-full h-8 px-2.5 bg-bg-canvas/40 border border-border-subtle rounded-md text-sm text-fg-default transition-[border-color,box-shadow] duration-150 hover:border-fg-muted/30 focus:outline-none focus:border-primary-500/60 focus:ring-2 focus:ring-primary-500/15"
								/>
							</div>

							{/* CONTENT BLOCK */}
							<div className="p-3 border border-border-subtle/40 rounded-lg bg-bg-canvas/20 space-y-3">
								<div className="flex items-center gap-1.5 text-[13px] font-semibold text-fg-default">
									<MessageSquare className="size-3.5 text-cyan-500" />
									<span>Content Block</span>
								</div>
								<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
									<div className="space-y-1">
										<label className="block text-xs font-medium text-fg-muted">
											Title
										</label>
										<input
											type="text"
											value={active.content.title}
											onChange={(e) => updatePanel(active.key, { content: { ...active.content, title: e.target.value } })}
											className="w-full h-8 px-2.5 bg-bg-canvas/40 border border-border-subtle rounded-md text-sm text-fg-default transition-[border-color,box-shadow] duration-150 hover:border-fg-muted/30 focus:outline-none focus:border-primary-500/60 focus:ring-2 focus:ring-primary-500/15"
										/>
									</div>
									<div className="space-y-1">
										<label className="block text-xs font-medium text-fg-muted">
											Accent
										</label>
										<div className="flex items-center gap-2">
											<input
												type="color"
												value={active.content.accent}
												onChange={(e) => updatePanel(active.key, { content: { ...active.content, accent: e.target.value } })}
												className="size-8 rounded-md border border-border-subtle bg-bg-canvas/40 cursor-pointer"
											/>
											<input
												type="text"
												value={active.content.accent}
												onChange={(e) => updatePanel(active.key, { content: { ...active.content, accent: e.target.value } })}
												className="flex-1 h-8 px-2.5 bg-bg-canvas/40 border border-border-subtle rounded-md text-sm text-fg-default transition-[border-color,box-shadow] duration-150 hover:border-fg-muted/30 focus:outline-none focus:border-primary-500/60 focus:ring-2 focus:ring-primary-500/15"
											/>
										</div>
									</div>
								</div>
								<div className="space-y-1">
									<label className="block text-xs font-medium text-fg-muted">
										Body Text
									</label>
									<textarea
										rows={2}
										value={active.content.text}
										onChange={(e) => updatePanel(active.key, { content: { ...active.content, text: e.target.value } })}
										className="w-full p-2.5 bg-bg-canvas/40 border border-border-subtle rounded-md text-[13px] text-fg-default resize-none leading-relaxed transition-[border-color,box-shadow] duration-150 hover:border-fg-muted/30 focus:outline-none focus:border-primary-500/60 focus:ring-2 focus:ring-primary-500/15"
									/>
								</div>
								<div className="space-y-1">
									<label className="block text-xs font-medium text-fg-muted">
										Footer
									</label>
									<input
										type="text"
										value={active.content.footer}
										onChange={(e) => updatePanel(active.key, { content: { ...active.content, footer: e.target.value } })}
										className="w-full h-8 px-2.5 bg-bg-canvas/40 border border-border-subtle rounded-md text-sm text-fg-default transition-[border-color,box-shadow] duration-150 hover:border-fg-muted/30 focus:outline-none focus:border-primary-500/60 focus:ring-2 focus:ring-primary-500/15"
									/>
								</div>
							</div>

							{/* ACTIONS */}
							<div className="p-3 border border-border-subtle/40 rounded-lg bg-bg-canvas/20 space-y-3">
								<div className="flex items-center justify-between">
									<div className="flex items-center gap-1.5 text-[13px] font-semibold text-fg-default">
										<Cpu className="size-3.5 text-violet-500" />
										<span>Component Actions</span>
									</div>
									<Button variant="dashed" size="sm"
										onClick={() => {
											const id = `action-${Date.now()}`;
											updatePanel(active.key, {
												actions: {
													...active.actions,
													[id]: { type: "noop", role_key: "", url: "", title: "New Action", description: "" },
												},
											});
										}}>
										<Plus className="size-3" /> Add Action
									</Button>
								</div>

								{Object.keys(active.actions).length === 0 && (
									<p className="text-xs text-fg-muted">No actions bound to this panel.</p>
								)}

								<div className="space-y-2">
									{Object.entries(active.actions).map(([actionId, action]) => (
										<div key={actionId} className="p-3 border border-border-subtle/40 rounded-lg bg-bg-canvas/30 space-y-2.5">
											<div className="flex items-center justify-between">
												<span className="text-[13px] font-semibold text-fg-default">
													binding: {actionId}
												</span>
												<button
													onClick={() => {
														const n = { ...active.actions };
														delete n[actionId];
														updatePanel(active.key, { actions: n });
													}}
													className="size-7 flex items-center justify-center border border-border-subtle hover:bg-red-500/10 text-fg-muted hover:text-red-400 rounded-md transition-all cursor-pointer"
												>
													<Trash2 className="size-3" />
												</button>
											</div>
											<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
												<div className="space-y-1">
													<label className="block text-xs font-medium text-fg-muted">
														Action Type
													</label>
													<select
														value={action.type}
														onChange={(e) => updateAction(active.key, actionId, { type: e.target.value as ActionType })}
														className="w-full h-8 px-2 bg-bg-canvas/40 border border-border-subtle rounded-md text-[13px] text-fg-default transition-[border-color,box-shadow] duration-150 hover:border-fg-muted/30 focus:outline-none focus:border-primary-500/60 focus:ring-2 focus:ring-primary-500/15"
													>
														{ACTION_OPTIONS.map((o) => (
															<option key={o.value} value={o.value}>{o.label}</option>
														))}
													</select>
												</div>
												<div className="space-y-1">
													<label className="block text-xs font-medium text-fg-muted">
														Button Label
													</label>
													<input
														type="text"
														value={action.title}
														onChange={(e) => updateAction(active.key, actionId, { title: e.target.value })}
														className="w-full h-8 px-2.5 bg-bg-canvas/40 border border-border-subtle rounded-md text-[13px] text-fg-default transition-[border-color,box-shadow] duration-150 hover:border-fg-muted/30 focus:outline-none focus:border-primary-500/60 focus:ring-2 focus:ring-primary-500/15"
													/>
												</div>
											</div>
											<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
												<div className="space-y-1">
													<label className="block text-xs font-medium text-fg-muted">
														Role Key
													</label>
													<input
														type="text"
														value={action.role_key}
														onChange={(e) => updateAction(active.key, actionId, { role_key: e.target.value })}
														placeholder="e.g. support, ranked"
														className="w-full h-8 px-2.5 bg-bg-canvas/40 border border-border-subtle rounded-md text-[13px] text-fg-default transition-[border-color,box-shadow] duration-150 hover:border-fg-muted/30 focus:outline-none focus:border-primary-500/60 focus:ring-2 focus:ring-primary-500/15"
													/>
												</div>
												<div className="space-y-1">
													<label className="block text-xs font-medium text-fg-muted">
														URL
													</label>
													<input
														type="text"
														value={action.url}
														onChange={(e) => updateAction(active.key, actionId, { url: e.target.value })}
														placeholder="https://..."
														className="w-full h-8 px-2.5 bg-bg-canvas/40 border border-border-subtle rounded-md text-[13px] text-fg-default transition-[border-color,box-shadow] duration-150 hover:border-fg-muted/30 focus:outline-none focus:border-primary-500/60 focus:ring-2 focus:ring-primary-500/15"
													/>
												</div>
											</div>
										</div>
									))}
								</div>
							</div>

							{/* DEPLOYMENT */}
							<div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
								<div className="space-y-1">
									<label className="block text-xs font-medium text-fg-muted">
										Deployed Channel
									</label>
									<ChannelDropdown
										value={active.deployed_channel_id || ""}
										onChange={(value) => updatePanel(active.key, { deployed_channel_id: value || "" })}
										channels={channels}
										threads={threads}
										placeholder="Select channel"
									/>
								</div>
								<div className="space-y-1">
									<label className="block text-xs font-medium text-fg-muted">
										Deployed Message ID
									</label>
									<input
										type="text"
										value={active.deployed_message_id}
										onChange={(e) => updatePanel(active.key, { deployed_message_id: e.target.value })}
										placeholder="message snowflake"
										className="w-full h-8 px-2.5 bg-bg-canvas/40 border border-border-subtle rounded-md text-[13px] text-fg-default transition-[border-color,box-shadow] duration-150 hover:border-fg-muted/30 focus:outline-none focus:border-primary-500/60 focus:ring-2 focus:ring-primary-500/15"
									/>
								</div>
							</div>
						</InfoCard>
					)}
				</div>

				<div className="space-y-6">
					<InfoCard icon={<Send className="size-4 text-cyan-500" />} title="Channel Dispatcher">
						<p className="text-xs text-fg-muted leading-relaxed">
							Deploying writes deployed_channel_id and deployed_message_id so the bot
							can refresh the panel in place on config changes.
						</p>
					</InfoCard>

					<div className="p-4 border border-dashed border-border-subtle bg-panel-bg/5 rounded-xl space-y-2 text-left">
						<div className="flex items-center gap-1.5 text-[13px] font-semibold text-fg-default">
							<Info className="size-3.5 text-primary-500" />
							<span>Action Handlers</span>
						</div>
						<p className="text-xs text-fg-muted leading-normal">
							Role actions resolve role_key through the guild permissions map.
							ticket_create spins a thread through a configured ticket system.
						</p>
					</div>
				</div>
			</div>
		</PageShell>
	);
}
