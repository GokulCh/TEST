"use client";

import { Clock, Info } from "lucide-react";
import { useState } from "react";
import { useUnsavedChanges } from "@/hooks/use-unsaved-changes";

import { DataTable, SearchInput } from "@/components/panel/data-table";
import { AddButton, DeleteButton, InfoCard, InfoText, ListLayout, NoteCard, SectionBar } from "@/components/panel/form-parts";
import { PageShell } from "@/components/panel/page-shell";

interface BlacklistEntry {
	id: string;
	user: string;
	reason: string;
	duration: string;
	assignedBy: string;
	date: string;
}

const DURATIONS = ["1 Day", "3 Days", "7 Days", "14 Days", "30 Days", "Permanent"];
const cellInput = "bg-transparent focus:outline-none w-full placeholder:text-fg-muted/40";

export default function Page() {
	const [searchQuery, setSearchQuery] = useState("");

	const [blacklist, setBlacklist] = useState<BlacklistEntry[]>([]);
	const [savedBlacklist, setSavedBlacklist] = useState<BlacklistEntry[]>([]);

	const { isDirty } = useUnsavedChanges(blacklist, savedBlacklist);

	const updateEntry = (id: string, updates: Partial<BlacklistEntry>) => setBlacklist((prev) => prev.map((item) => (item.id === id ? { ...item, ...updates } : item)));

	// ponytail: local only, no backend section for this page yet; the shell labels it a preview.
	const handleSaveChanges = () => {
	setSavedBlacklist(JSON.parse(JSON.stringify(blacklist)));
	};

	const handleAddEntry = () =>
		setBlacklist((prev) => [...prev, { id: `bl-${Date.now()}`, user: "", reason: "", duration: "7 Days", assignedBy: "", date: new Date().toISOString().split("T")[0] }]);

	const filtered = blacklist.filter((item) => item.user.toLowerCase().includes(searchQuery.toLowerCase()));

	return (
		<PageShell preview eyebrow="Tickets" title="Support Blacklist" onSave={handleSaveChanges} dirty={isDirty}>
			<SectionBar
				title="Exclusion Registry"
				description="Restrict malicious accounts from generating support ticket channels"
				action={<AddButton onClick={handleAddEntry}>Blacklist Player</AddButton>}
			/>
			<SearchInput value={searchQuery} onChange={setSearchQuery} placeholder="Search blacklist by player username..." />

			<ListLayout
				sidebar={
					<>
						<InfoCard icon={<Clock className="size-4 text-cyan-500" />} title="Exclusion Enforcement">
							<InfoText>Blacklisted users are blocked immediately at the Discord Gateway level. They will receive automated warning mutes if they attempt to click ticket panel channels.</InfoText>
						</InfoCard>
						<NoteCard icon={<Info className="size-3.5 text-primary-500" />} title="Exclusions Policy">
							Player usernames must exactly match their verified linked usernames within the Minecraft database registry layer.
						</NoteCard>
					</>
				}
			>
				<DataTable columns={["Blocked User", "Reason", "Duration", "Enforcer", { label: "Age", right: true }, { label: "Action", right: true }]} empty="Blacklist registry is empty" isEmpty={filtered.length === 0}>
					{filtered.map((item) => (
						<tr key={item.id} className="hover:bg-panel-bg/10 transition-colors">
							<td className="p-4"><input type="text" value={item.user} onChange={(e) => updateEntry(item.id, { user: e.target.value })} placeholder="username" className={`${cellInput} font-bold text-fg-default`} /></td>
							<td className="p-4 max-w-[200px]"><input type="text" value={item.reason} onChange={(e) => updateEntry(item.id, { reason: e.target.value })} placeholder="reason" className={`${cellInput} text-fg-muted truncate`} /></td>
							<td className="p-4">
								<select value={item.duration} onChange={(e) => updateEntry(item.id, { duration: e.target.value })} className="bg-transparent font-bold text-rose-400 focus:outline-none cursor-pointer">
									{DURATIONS.map((d) => <option key={d}>{d}</option>)}
								</select>
							</td>
							<td className="p-4"><input type="text" value={item.assignedBy} onChange={(e) => updateEntry(item.id, { assignedBy: e.target.value })} placeholder="staff" className={`${cellInput} text-fg-muted`} /></td>
							<td className="p-4 text-right text-fg-muted">{item.date}</td>
							<td className="p-4"><DeleteButton onClick={() => setBlacklist((prev) => prev.filter((b) => b.id !== item.id))} label="Remove from blacklist" className="ml-auto" /></td>
						</tr>
					))}
				</DataTable>
			</ListLayout>
		</PageShell>
	);
}
