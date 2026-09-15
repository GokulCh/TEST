"use client";

import { Info, Plus, Radio, Save, Shield, ToggleLeft, ToggleRight, Trash2 } from "lucide-react";
import { useState } from "react";
import { useGuildSnapshot } from "@/hooks/useGuildSnapshot";
import ChannelDropdown from "@/components/ui/ChannelDropdown";
import RoleDropdown from "@/components/ui/RoleDropdown";

interface ReactionRoleRecord {
	id: string;
	emoji: string;
	message_id: string;
	channel_id: string;
	role_id: string;
	enabled: boolean;
}

export default function Page() {
	const [isSaving, setIsSaving] = useState(false);

	const [roles, setRoles] = useState<ReactionRoleRecord[]>([]);
	const { channels, threads, roleOptions } = useGuildSnapshot();

	const updateRole = (id: string, updates: Partial<ReactionRoleRecord>) => {
		setRoles((prev) => prev.map((r) => (r.id === id ? { ...r, ...updates } : r)));
	};

	const handleToggleEnabled = (id: string) => {
		setRoles((prev) => prev.map((r) => (r.id === id ? { ...r, enabled: !r.enabled } : r)));
	};

	const handleDeleteRole = (id: string) => {
		setRoles((prev) => prev.filter((r) => r.id !== id));
	};

	const handleAddRole = () => {
		setRoles((prev) => [
			...prev,
			{
				id: `rr-${Date.now()}`,
				emoji: "",
				message_id: "",
				channel_id: "",
				role_id: "",
				enabled: true,
			},
		]);
	};

	const handleSaveChanges = () => {
		setIsSaving(true);
		setTimeout(() => setIsSaving(false), 900);
	};

	return (
		<div className="w-full p-6 lg:p-8 space-y-6 animate-in fade-in duration-300 select-none max-w-7xl mx-auto text-left">
			{/* HUD PANEL HEADER */}
			<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border-subtle pb-6">
				<div>
					<h1 className="font-mono text-[10px] font-bold uppercase tracking-widest text-fg-muted">
						// Role Binding Registry (guild_configs.reactions)
					</h1>
					<h2 className="text-2xl font-black tracking-tight text-fg-default mt-1">
						Reaction Roles Setup
					</h2>
				</div>

				<button
					onClick={handleSaveChanges}
					className="h-9 px-4 flex items-center gap-2 border border-primary-500/20 bg-primary-500/10 hover:bg-primary-500/20 text-primary-500 font-mono font-bold text-[11px] uppercase tracking-wider rounded-lg transition-all active:scale-98 cursor-pointer shadow-sm self-start sm:self-auto"
				>
					<Save className="size-3.5" />
					<span>
						{isSaving ? "Syncing Reactions..." : "Commit Reaction Roles"}
					</span>
				</button>
			</div>

			{/* ACTION BAR */}
			<div className="flex justify-between items-center bg-panel-bg/10 p-4 border border-border-subtle rounded-xl">
				<div>
					<h3 className="font-mono text-xs font-black text-fg-default uppercase tracking-wide">
						Reaction Bindings
					</h3>
					<p className="font-mono text-[9px] text-fg-muted uppercase mt-0.5">
						Bind emoji reactions on pinned messages to role snowflakes
					</p>
				</div>
				<button
					onClick={handleAddRole}
					className="h-8 px-3 flex items-center gap-1.5 border border-dashed border-primary-500/30 text-primary-500 bg-primary-500/5 hover:bg-primary-500/10 rounded-lg font-mono font-bold text-[10px] uppercase tracking-wider transition-all active:scale-98 cursor-pointer"
				>
					<Plus className="size-3.5" /> Append Reaction Role
				</button>
			</div>

			<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
				{/* REACTION ROLES LIST */}
				<div className="lg:col-span-2 space-y-4">
					{roles.map((r) => (
						<div
							key={r.id}
							className="p-4 border border-border-subtle bg-panel-bg/20 rounded-xl space-y-3 shadow-xs animate-in fade-in duration-150 text-left"
						>
							<div className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-end">
								<div className="space-y-1">
									<label className="block font-mono text-[9px] font-bold text-fg-default uppercase tracking-wider">
										Reaction Emoji
									</label>
									<input
										type="text"
										value={r.emoji}
										onChange={(e) => updateRole(r.id, { emoji: e.target.value })}
										className="w-full h-8 px-2.5 bg-bg-canvas/40 border border-border-subtle rounded-md font-mono text-xs text-fg-default focus:outline-none focus:border-primary-500/50"
									/>
								</div>

								<div className="space-y-1">
									<label className="block font-mono text-[9px] font-bold text-fg-default uppercase tracking-wider">
										Message ID
									</label>
									<input
										type="text"
										value={r.message_id}
										onChange={(e) => updateRole(r.id, { message_id: e.target.value })}
										className="w-full h-8 px-2.5 bg-bg-canvas/40 border border-border-subtle rounded-md font-mono text-xs text-fg-default focus:outline-none focus:border-primary-500/50"
									/>
								</div>

								<div className="space-y-1">
									<label className="block font-mono text-[9px] font-bold text-fg-default uppercase tracking-wider">
										Channel
									</label>
									<ChannelDropdown
										value={r.channel_id}
										onChange={(value) => updateRole(r.id, { channel_id: value })}
										channels={channels}
										threads={threads}
										placeholder="Select a channel"
									/>
								</div>

								<div className="space-y-1">
									<label className="block font-mono text-[9px] font-bold text-fg-default uppercase tracking-wider">
										Role
									</label>
									<RoleDropdown
										value={r.role_id}
										onChange={(value) => updateRole(r.id, { role_id: value })}
										roles={roleOptions}
										placeholder="Select a role"
									/>
								</div>
							</div>

							<div className="flex justify-end gap-2 pt-1 border-t border-border-subtle/20">
								<button
									onClick={() => handleToggleEnabled(r.id)}
									className={`h-8 px-3 border rounded-md font-mono text-[9px] font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer ${
										r.enabled
											? "bg-success/10 border-success/30 text-success"
											: "bg-panel-bg border-border-subtle text-fg-muted"
									}`}
								>
									{r.enabled ? <ToggleRight className="size-4" /> : <ToggleLeft className="size-4" />}
									<span>{r.enabled ? "Active" : "Disabled"}</span>
								</button>

								<button
									onClick={() => handleDeleteRole(r.id)}
									className="size-8 flex items-center justify-center border border-border-subtle hover:bg-red-500/10 text-fg-muted hover:text-red-400 rounded-md transition-all cursor-pointer"
								>
									<Trash2 className="size-3.5" />
								</button>
							</div>
						</div>
					))}
				</div>

				<div className="space-y-6">
					<div className="p-5 border border-border-subtle bg-panel-bg/20 backdrop-blur-md rounded-xl space-y-4 h-fit text-left">
						<div className="flex items-center gap-2 border-b border-border-subtle/50 pb-2.5">
							<Shield className="size-4 text-cyan-500" />
							<h3 className="font-mono text-[11px] font-bold text-fg-default uppercase tracking-widest">
								Requirements
							</h3>
						</div>
						<p className="font-mono text-[9px] text-fg-muted uppercase tracking-wide leading-relaxed">
							Rows reference one guild_configs.reactions entry each. The bot must
							hold Manage Roles above every target role in the server hierarchy to
							self-serve the assignment.
						</p>
					</div>

					<div className="p-4 border border-dashed border-border-subtle bg-panel-bg/5 rounded-xl space-y-2 text-left">
						<div className="flex items-center gap-1.5 font-mono text-[10px] font-bold text-fg-default uppercase tracking-wider">
							<Info className="size-3.5 text-primary-500" />
							<span>Emoji Inputs</span>
						</div>
						<p className="font-mono text-[9px] text-fg-muted uppercase leading-normal">
							Paste a raw unicode emoji or a custom emoji in name:id form, e.g.{" "}
							<Radio className="inline size-3 text-primary-400" /> rbbadge:981234567890.
						</p>
					</div>
				</div>
			</div>
		</div>
	);
}