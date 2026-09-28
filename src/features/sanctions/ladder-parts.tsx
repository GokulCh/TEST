"use client";

/** Pieces the strike ladder and punishment ladder pages share. */

import type { ReactNode } from "react";
import OptionDropdown from "@/components/ui/OptionDropdown";
import { AddButton, DeleteButton, Field, InfoCard, InfoText, NoteCard, NumberInput, Panel, SelectInput, Toggle } from "@/components/panel/form-parts";

export type OffenceMode = "persistent" | "active_only" | "season_reset";
export type DurationUnit = "minutes" | "hours" | "days";

export const DURATION_UNITS: { value: DurationUnit; label: string }[] = [
	{ value: "minutes", label: "Minutes" },
	{ value: "hours", label: "Hours" },
	{ value: "days", label: "Days" },
];

const OFFENCE_MODES = [
	{ value: "persistent", label: "Persistent (Lifetime)" },
	{ value: "active_only", label: "Active Only" },
	{ value: "season_reset", label: "Season Reset" },
];

/** Editable levels carry a stable `_key` (never persisted) so rows keep their identity while renamed or reordered. */
export interface Keyed { _key: string }

export const patchByKey = <T extends Keyed>(list: T[], key: string, patch: Partial<T>) =>
	list.map((item) => (item._key === key ? { ...item, ...patch } : item));

export function OffenceModeField({ value, onChange, className }: { value: OffenceMode; onChange: (mode: OffenceMode) => void; className?: string }) {
	return (
		<Panel className={className}>
			<Field label="Offence Accounting Mode">
				<OptionDropdown value={value} onChange={(v) => onChange(v as OffenceMode)} options={OFFENCE_MODES} />
			</Field>
		</Panel>
	);
}

/** Header row of a level card: icon + editable name, active toggle, delete. `children` sits under the name. */
export function LevelHeader({
	icon,
	name,
	onName,
	enabled,
	onEnabled,
	onDelete,
	children,
}: {
	icon: ReactNode;
	name: string;
	onName: (name: string) => void;
	enabled: boolean;
	onEnabled: (enabled: boolean) => void;
	onDelete: () => void;
	children?: ReactNode;
}) {
	return (
		<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-border-subtle/20">
			<div className="space-y-0.5">
				<div className="flex items-center gap-2">
					{icon}
					<input type="text" value={name} onChange={(e) => onName(e.target.value)} className="text-[13px] font-semibold text-fg-default bg-transparent border-b border-transparent hover:border-border-subtle focus:border-primary-500/50 focus:outline-none px-1" />
				</div>
				{children}
			</div>
			<div className="flex items-center gap-2 shrink-0">
				<Toggle checked={enabled} onChange={onEnabled} size="sm" className="px-3 h-8" />
				<DeleteButton onClick={onDelete} className="rounded-md" />
			</div>
		</div>
	);
}

/** A step's duration and unit inputs, side by side. */
export function DurationFields({ duration, unit, onDuration, onUnit }: { duration: number; unit: DurationUnit; onDuration: (n: number) => void; onUnit: (u: DurationUnit) => void }) {
	return (
		<>
			<Field label="Duration" mini>
				<NumberInput mini value={duration} onValueChange={onDuration} />
			</Field>
			<Field label="Unit" mini>
				<SelectInput mini value={unit} onValueChange={(u) => onUnit(u as DurationUnit)} options={DURATION_UNITS} />
			</Field>
		</>
	);
}

export function AddStepButton({ onClick }: { onClick: () => void }) {
	return <AddButton onClick={onClick} className="w-full justify-center">Append Escalation Step</AddButton>;
}

/** The right-hand explainer column: one titled card and one dashed note. */
export function LadderSidebar({
	cardIcon,
	cardTitle,
	cardText,
	noteIcon,
	noteTitle,
	noteText,
}: {
	cardIcon: ReactNode;
	cardTitle: string;
	cardText: string;
	noteIcon: ReactNode;
	noteTitle: string;
	noteText: string;
}) {
	return (
		<div className="space-y-6">
			<InfoCard icon={cardIcon} title={cardTitle}>
				<InfoText>{cardText}</InfoText>
			</InfoCard>
			<NoteCard icon={noteIcon} title={noteTitle}>{noteText}</NoteCard>
		</div>
	);
}
