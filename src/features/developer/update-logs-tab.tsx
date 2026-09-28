"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button, DeleteButton, EmptyState, Field, InfoCard, Panel, TextInput, Toggle } from "@/components/panel/form-parts";
import type { DeveloperUpdateLog } from "@/lib/db-types";
import { removeById } from "@/lib/list";

const BLANK = { title: "", content: "", version: "", is_featured: false };

/** Adds and removes the update-log entries players see in the changelog. */
export function UpdateLogsTab({ logs, onChange }: { logs: DeveloperUpdateLog[]; onChange: (logs: DeveloperUpdateLog[]) => void }) {
	const [draft, setDraft] = useState(BLANK);

	const add = () => {
		if (!draft.title || !draft.content) return;
		onChange([...logs, { id: `log-${Date.now()}`, ...draft, date: new Date().toISOString() }]);
		setDraft(BLANK);
	};

	return (
		<div className="space-y-6">
			<InfoCard icon={<Plus className="size-4 text-primary-500" />} title="Add Developer Update Log">
				<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
					<Field label="Title">
						<TextInput value={draft.title} onValueChange={(title) => setDraft({ ...draft, title })} />
					</Field>
					<Field label="Version">
						<TextInput value={draft.version} onValueChange={(version) => setDraft({ ...draft, version })} placeholder="v1.0.0" />
					</Field>
				</div>
				<Field label="Content">
					<textarea
						rows={3}
						value={draft.content}
						onChange={(e) => setDraft({ ...draft, content: e.target.value })}
						className="w-full p-3 bg-bg-canvas/40 border border-border-subtle rounded-lg text-sm text-fg-default resize-none transition-[border-color,box-shadow] duration-150 hover:border-fg-muted/30 focus:outline-none focus:border-primary-500/60 focus:ring-2 focus:ring-primary-500/15"
					/>
				</Field>
				<div className="flex items-center justify-between">
					<span className="text-xs text-fg-default">Featured</span>
					<Toggle size="sm" checked={draft.is_featured} onChange={(is_featured) => setDraft({ ...draft, is_featured })} onLabel="Yes" offLabel="No" className="h-7 px-2.5" />
				</div>
				<Button variant="primary" size="sm" onClick={add}>
					<Plus className="size-3.5" /> Add Log
				</Button>
			</InfoCard>

			<div className="space-y-4">
				{logs.length === 0 && <EmptyState>No update logs yet</EmptyState>}
				{logs.map((log) => (
					<Panel key={log.id} className="p-5 space-y-3">
						<div className="flex items-start justify-between gap-3">
							<div className="flex-1">
								<div className="flex items-center gap-2">
									<h4 className="text-sm font-semibold text-fg-default">{log.title}</h4>
									{log.is_featured && <span className="text-xs font-medium text-primary-500 bg-primary-500/10 px-1.5 py-0.5 rounded capitalize">Featured</span>}
								</div>
								<p className="text-xs text-fg-muted mt-1">
									{log.version} • {new Date(log.date).toLocaleDateString()}
								</p>
							</div>
							<DeleteButton onClick={() => onChange(removeById(logs, log.id))} />
						</div>
						<p className="font-mono text-xs text-fg-default leading-relaxed">{log.content}</p>
					</Panel>
				))}
			</div>
		</div>
	);
}
