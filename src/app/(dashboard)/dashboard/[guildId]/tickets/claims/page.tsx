"use client";

import { Info, Shield } from "lucide-react";
import { useState } from "react";
import { useUnsavedChanges } from "@/hooks/use-unsaved-changes";

import { PageShell } from "@/components/panel/page-shell";
import { AddButton, DeleteButton, Field, InfoCard, InfoText, ListLayout, NoteCard, Panel, SectionBar, SelectInput, TextInput, Toggle } from "@/components/panel/form-parts";

interface RoutingRule {
	id: string;
	category: string;
	destinationRole: string;
	fallbackStaff: string;
	enabled: boolean;
}

const DESTINATION_ROLES = ["Admin Team", "Mod Team", "Helper Staff"];

export default function Page() {
	const [autoClaim, setAutoClaim] = useState(true);
	const [savedAutoClaim, setSavedAutoClaim] = useState(true);

	const [rules, setRules] = useState<RoutingRule[]>([]);
	const [savedRules, setSavedRules] = useState<RoutingRule[]>([]);

	const { isDirty } = useUnsavedChanges([autoClaim, rules], [savedAutoClaim, savedRules]);

	const updateRule = (id: string, updates: Partial<RoutingRule>) => setRules((prev) => prev.map((r) => (r.id === id ? { ...r, ...updates } : r)));

	// ponytail: local only, no backend section for this page yet; the shell labels it a preview.
	const handleSaveChanges = () => {
	setSavedRules(JSON.parse(JSON.stringify(rules)));
	setSavedAutoClaim(autoClaim);
	};

	const handleAddRule = () =>
		setRules((prev) => [...prev, { id: `route-${Date.now()}`, category: "New Support Thread", destinationRole: "Helper Staff", fallbackStaff: "", enabled: true }]);

	return (
		<PageShell preview eyebrow="Tickets" title="Staff Routing" onSave={handleSaveChanges} dirty={isDirty}>
			<SectionBar
				title="Automated Dispatch Balancer"
				description="Route newly opened support tickets to specific moderation groups automatically based on category tags."
				action={<Toggle checked={autoClaim} onChange={setAutoClaim} onLabel="Dispatch Balancer Active" offLabel="Manual Claims Only" />}
			/>

			<SectionBar
				title="Routing Maps"
				description="Map ticket categories to targeted staff role groups"
				action={<AddButton onClick={handleAddRule}>Append Routing Rule</AddButton>}
			/>

			<ListLayout
				sidebar={
					<>
						<InfoCard icon={<Shield className="size-4 text-cyan-500" />} title="Escalation Routing">
							<InfoText>If a claimed staff member remains idle for 30 minutes without posting updates inside the support panel thread, the ticket is auto-escalated back to fallback admins.</InfoText>
						</InfoCard>
						<NoteCard icon={<Info className="size-3.5 text-primary-500" />} title="Database Synced">
							Discord group roles are fetched dynamically via OAuth guild credentials mapped inside connection parameters.
						</NoteCard>
					</>
				}
			>
				{rules.map((rule) => (
					<Panel key={rule.id} className="motion-fade">
						<div className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-end">
							<Field label="Category Tag"><TextInput mini value={rule.category} onValueChange={(category) => updateRule(rule.id, { category })} /></Field>
							<Field label="Target Role Group"><SelectInput mini value={rule.destinationRole} onValueChange={(destinationRole) => updateRule(rule.id, { destinationRole })} options={DESTINATION_ROLES} /></Field>
							<Field label="Fallback User"><TextInput mini value={rule.fallbackStaff} onValueChange={(fallbackStaff) => updateRule(rule.id, { fallbackStaff })} /></Field>
							<div className="flex gap-2 justify-end sm:justify-start">
								<Toggle size="sm" checked={rule.enabled} onChange={(enabled) => updateRule(rule.id, { enabled })} className="px-3" />
								<DeleteButton onClick={() => setRules((prev) => prev.filter((r) => r.id !== rule.id))} label="Delete routing rule" />
							</div>
						</div>
					</Panel>
				))}
			</ListLayout>
		</PageShell>
	);
}
