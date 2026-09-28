"use client";

/**
 * The panel's design system: every config page is assembled from these, so a
 * change here changes every page. Sentence-case sans for labels and buttons,
 * mono only for values; one radius (lg controls, xl cards), one focus ring,
 * one motion curve.
 */

import { createContext, useContext, useId, type ComponentProps, type ReactNode } from "react";
import { AlertCircle, Loader2, Plus, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

/* ── Buttons & badges ───────────────────────────────────────────────────── */

const BUTTON_VARIANTS = {
	primary: "bg-primary-500 text-white shadow-sm hover:bg-primary-600",
	secondary: "border border-border-subtle bg-panel-bg/40 text-fg-default hover:border-fg-muted/30 hover:bg-panel-bg",
	ghost: "text-fg-muted hover:bg-panel-bg/70 hover:text-fg-default",
	danger: "border border-danger/30 bg-danger/10 text-danger hover:bg-danger/20 hover:border-danger/50",
	warning: "border border-warning/40 bg-warning/15 text-warning hover:bg-warning/25",
	dashed: "border border-dashed border-primary-500/40 bg-primary-500/5 text-primary-500 hover:bg-primary-500/10 hover:border-primary-500/60",
} as const;

const BUTTON_SIZES = { sm: "h-8 px-3 text-xs", md: "h-9 px-4 text-[13px]", icon: "size-8 text-xs" } as const;

export type ButtonProps = ComponentProps<"button"> & {
	variant?: keyof typeof BUTTON_VARIANTS;
	size?: keyof typeof BUTTON_SIZES;
	/** Shows a spinner in place of `icon`, disables the button and marks it busy. */
	loading?: boolean;
	icon?: ReactNode;
};

/** The one button: every page action, dialog action and header control goes through it. */
export function Button({ variant = "secondary", size = "md", loading, icon, className, children, disabled, type = "button", ...rest }: ButtonProps) {
	return (
		<button
			{...rest}
			type={type}
			disabled={disabled || loading}
			aria-busy={loading || undefined}
			className={cn(
				"inline-flex shrink-0 cursor-pointer select-none items-center justify-center gap-2 whitespace-nowrap rounded-lg font-medium transition-[background-color,border-color,color,box-shadow,transform,opacity] duration-150 active:scale-[.98] disabled:pointer-events-none disabled:opacity-50",
				BUTTON_VARIANTS[variant],
				BUTTON_SIZES[size],
				className,
			)}
		>
			{loading ? <Loader2 className="size-3.5 animate-spin" /> : icon}
			{children}
		</button>
	);
}

const BADGE_TONES = {
	neutral: "border-border-subtle bg-panel-bg/60 text-fg-muted",
	primary: "border-primary-500/25 bg-primary-500/10 text-primary-500",
	success: "border-success/25 bg-success/10 text-success",
	warning: "border-warning/30 bg-warning/10 text-warning",
	danger: "border-danger/30 bg-danger/10 text-danger",
} as const;

/** Small status label: state of a row, a count, a tag. */
export function Badge({ tone = "neutral", children, className }: { tone?: keyof typeof BADGE_TONES; children: ReactNode; className?: string }) {
	return (
		<span className={cn("inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[11px] font-medium leading-none", BADGE_TONES[tone], className)}>{children}</span>
	);
}

/* ── Inputs ─────────────────────────────────────────────────────────────── */

const CONTROL =
	"w-full border border-border-subtle bg-bg-canvas/40 text-fg-default placeholder:text-fg-muted/60 transition-[border-color,box-shadow,background-color] duration-150 hover:border-fg-muted/30 focus:outline-none focus:border-primary-500/60 focus:ring-2 focus:ring-primary-500/15 disabled:cursor-not-allowed disabled:opacity-50 aria-[invalid=true]:border-danger/60 aria-[invalid=true]:ring-danger/15";

/** Class string of the panel's text/number inputs. */
export const inputClass = `${CONTROL} h-9 px-3 rounded-lg text-sm`;

/** The compact variant used inside cards and rows. */
export const miniInputClass = `${CONTROL} h-8 px-2.5 rounded-md text-[13px]`;

/** Shares the label's id and the error state with the input inside a Field. */
const FieldContext = createContext<{ id: string; invalid: boolean; describedBy?: string } | null>(null);
const useFieldProps = () => {
	const f = useContext(FieldContext);
	return f ? { id: f.id, "aria-invalid": f.invalid || undefined, "aria-describedby": f.describedBy } : {};
};

/** One labelled input with an optional hint and an inline validation message. */
export function Field({ label, hint, error, children, className = "", mini }: { label: string; hint?: string; error?: string | null; children: ReactNode; className?: string; mini?: boolean }) {
	const id = useId();
	const noteId = `${id}-note`;
	return (
		<FieldContext.Provider value={{ id, invalid: !!error, describedBy: error || hint ? noteId : undefined }}>
			<div className={cn("space-y-1.5", className)}>
				<label htmlFor={id} className={cn("block font-medium text-fg-default/90", mini ? "text-xs" : "text-[13px]")}>
					{label}
				</label>
				{children}
				{error ? (
					<p id={noteId} role="alert" className="flex items-center gap-1 text-xs text-danger motion-fade">
						<AlertCircle className="size-3 shrink-0" />
						{error}
					</p>
				) : (
					hint && (
						<p id={noteId} className="text-xs leading-snug text-fg-muted">
							{hint}
						</p>
					)
				)}
			</div>
		</FieldContext.Provider>
	);
}

/** Number input that reports a number (empty and invalid input become `fallback`). */
export function NumberInput({
	value,
	onValueChange,
	fallback = 0,
	mini,
	className = "",
	...rest
}: Omit<ComponentProps<"input">, "value" | "onChange" | "type"> & { value: number; onValueChange: (n: number) => void; fallback?: number; mini?: boolean }) {
	return (
		<input
			{...useFieldProps()}
			{...rest}
			type="number"
			inputMode="decimal"
			value={value}
			onChange={(e) => onValueChange(Number(e.target.value) || fallback)}
			className={cn(mini ? miniInputClass : inputClass, "tabular-nums", className)}
		/>
	);
}

export function TextInput({
	value,
	onValueChange,
	mini,
	className,
	...rest
}: Omit<ComponentProps<"input">, "value" | "onChange" | "type"> & { value: string; onValueChange: (value: string) => void; mini?: boolean }) {
	return <input {...useFieldProps()} {...rest} type="text" value={value} onChange={(e) => onValueChange(e.target.value)} className={cn(mini ? miniInputClass : inputClass, className)} />;
}

/** Native select over `{ value, label }` options; reports the chosen value. */
export function SelectInput({
	value,
	onValueChange,
	options,
	mini,
	className,
}: {
	value: string;
	onValueChange: (value: string) => void;
	options: readonly (string | { value: string; label: string })[];
	mini?: boolean;
	className?: string;
}) {
	return (
		<select {...useFieldProps()} value={value} onChange={(e) => onValueChange(e.target.value)} className={cn(mini ? miniInputClass : inputClass, "pr-9", className)}>
			{options.map((o) => {
				const opt = typeof o === "string" ? { value: o, label: o } : o;
				return (
					<option key={opt.value} value={opt.value}>
						{opt.label}
					</option>
				);
			})}
		</select>
	);
}

/** On/off switch with a label. `size="sm"` is the compact form for dense rows. */
export function Toggle({
	checked,
	onChange,
	onLabel = "Active",
	offLabel = "Disabled",
	size = "md",
	className = "",
	disabled,
}: {
	checked: boolean;
	onChange: (next: boolean) => void;
	onLabel?: string;
	offLabel?: string;
	size?: "md" | "sm";
	className?: string;
	disabled?: boolean;
}) {
	const dims = size === "sm" ? "h-8 rounded-md px-2.5 text-xs gap-2" : "h-9 rounded-lg px-3 text-[13px] gap-2.5";
	return (
		<button
			type="button"
			role="switch"
			aria-checked={checked}
			disabled={disabled}
			onClick={() => onChange(!checked)}
			className={cn(
				"inline-flex shrink-0 cursor-pointer select-none items-center justify-center border font-medium transition-[background-color,border-color,color] duration-150 active:scale-[.98] disabled:pointer-events-none disabled:opacity-50",
				dims,
				checked ? "border-success/30 bg-success/10 text-success" : "border-border-subtle bg-panel-bg/40 text-fg-muted hover:border-fg-muted/30 hover:text-fg-default",
				className,
			)}
		>
			<span aria-hidden className={cn("relative h-4 w-7 shrink-0 rounded-full transition-colors duration-200", checked ? "bg-success" : "bg-fg-muted/30")}>
				<span className={cn("absolute left-0.5 top-0.5 size-3 rounded-full bg-white shadow-sm transition-transform duration-200 ease-out", checked && "translate-x-3")} />
			</span>
			{checked ? onLabel : offLabel}
		</button>
	);
}

/* ── Cards & layout ─────────────────────────────────────────────────────── */

/** A bordered card. `flush` drops the padding for cards that lay out their own sections. */
export function Panel({ children, className = "", flush }: { children: ReactNode; className?: string; flush?: boolean }) {
	return <div className={cn("rounded-xl border border-border-subtle bg-panel-bg/40 text-left shadow-xs", !flush && "p-5", className)}>{children}</div>;
}

/** Title + description strip with an optional action (usually an AddButton). */
export function SectionBar({ title, description, action, icon }: { title: string; description?: string; action?: ReactNode; icon?: ReactNode }) {
	return (
		<div className="flex flex-col gap-3 rounded-xl border border-border-subtle bg-panel-bg/40 p-4 sm:flex-row sm:items-center sm:justify-between">
			<div className="flex min-w-0 items-center gap-3">
				{icon}
				<div className="min-w-0">
					<h3 className="text-sm font-semibold tracking-tight text-fg-default">{title}</h3>
					{description && <p className="mt-0.5 text-xs leading-snug text-fg-muted">{description}</p>}
				</div>
			</div>
			{action && <div className="shrink-0">{action}</div>}
		</div>
	);
}

/** Titled card: icon and title over a rule, an optional `action` at the right of the header. */
export function InfoCard({ icon, title, action, children }: { icon: ReactNode; title: string; action?: ReactNode; children: ReactNode }) {
	return (
		<Panel className="h-fit space-y-4">
			<div className="flex items-center justify-between gap-2 border-b border-border-subtle/60 pb-3">
				<div className="flex items-center gap-2">
					{icon}
					<h3 className="text-sm font-semibold tracking-tight text-fg-default">{title}</h3>
				</div>
				{action}
			</div>
			{children}
		</Panel>
	);
}

/** Compact card with a coloured heading, for rosters and result groups. `tone` is a full Tailwind text colour class. */
export function MiniCard({ title, tone = "text-cyan-400", children }: { title: string; tone?: string; children: ReactNode }) {
	return (
		<Panel className="space-y-2 p-4">
			<h4 className={cn("text-sm font-semibold tracking-tight", tone)}>{title}</h4>
			<div className="space-y-1 text-xs text-fg-muted">{children}</div>
		</Panel>
	);
}

/** Small-print body text for an InfoCard. */
export function InfoText({ children }: { children: ReactNode }) {
	return <p className="text-left text-xs leading-relaxed text-fg-muted">{children}</p>;
}

/** "Label: value" row for stat cards. */
export function StatRow({ label, children, className }: { label: string; children: ReactNode; className?: string }) {
	return (
		<div className="flex justify-between gap-3">
			<span>{label}</span>
			<span className={cn("font-mono tabular-nums text-fg-default", className)}>{children}</span>
		</div>
	);
}

/** Two-thirds list column plus a one-third side column (explainer cards). */
export function ListLayout({ sidebar, children }: { sidebar?: ReactNode; children: ReactNode }) {
	return (
		<div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
			<div className="space-y-4 lg:col-span-2">{children}</div>
			{sidebar && <div className="space-y-6">{sidebar}</div>}
		</div>
	);
}

/** The dashed side note under an InfoCard. */
export function NoteCard({ icon, title, children }: { icon: ReactNode; title: string; children: ReactNode }) {
	return (
		<div className="space-y-2 rounded-xl border border-dashed border-border-subtle bg-panel-bg/10 p-4 text-left">
			<div className="flex items-center gap-1.5 text-[13px] font-semibold text-fg-default">
				{icon}
				<span>{title}</span>
			</div>
			<p className="text-xs leading-relaxed text-fg-muted">{children}</p>
		</div>
	);
}

/** Bordered row with a title, a hint and an ON/OFF switch. */
export function ToggleRow({ title, description, checked, onChange }: { title: string; description?: string; checked: boolean; onChange: (next: boolean) => void }) {
	return (
		<div className="flex items-center justify-between gap-3 rounded-lg border border-border-subtle/60 bg-bg-canvas/30 p-3 transition-colors hover:border-border-subtle">
			<div className="flex-1 space-y-0.5 text-left">
				<span className="block text-[13px] font-medium text-fg-default">{title}</span>
				{description && <span className="block text-xs leading-snug text-fg-muted">{description}</span>}
			</div>
			<Toggle size="sm" checked={checked} onChange={onChange} onLabel="On" offLabel="Off" />
		</div>
	);
}

/** Selectable card for picking one of a few options. */
export function ChoiceCard({ selected, onSelect, icon, title, description }: { selected: boolean; onSelect: () => void; icon?: ReactNode; title: string; description: string }) {
	return (
		<button
			type="button"
			role="radio"
			aria-checked={selected}
			onClick={onSelect}
			className={cn(
				"flex cursor-pointer flex-col rounded-xl border p-4 text-left transition-[background-color,border-color,color,transform] duration-150 active:scale-[.99]",
				selected ? "border-primary-500/50 bg-primary-500/10 text-primary-500" : "border-border-subtle bg-panel-bg/30 text-fg-muted hover:border-fg-muted/30 hover:bg-panel-bg/60",
			)}
		>
			<div className="mb-1.5 flex items-center gap-2 text-sm font-semibold">
				{icon}
				<span>{title}</span>
			</div>
			<p className="text-xs leading-relaxed opacity-80">{description}</p>
		</button>
	);
}

export function EmptyState({ children, icon }: { children: ReactNode; icon?: ReactNode }) {
	return (
		<div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-border-subtle bg-panel-bg/10 px-6 py-10 text-center text-sm text-fg-muted motion-fade">
			{icon}
			<p className="max-w-md leading-relaxed">{children}</p>
		</div>
	);
}

/** Shimmering placeholder block; size it with className. */
export function Skeleton({ className }: { className?: string }) {
	return <div aria-hidden className={cn("skeleton rounded-lg", className)} />;
}

/* ── Row actions ────────────────────────────────────────────────────────── */

export function AddButton({ onClick, children, className }: { onClick: () => void; children: ReactNode; className?: string }) {
	return (
		<Button variant="dashed" size="sm" onClick={onClick} icon={<Plus className="size-3.5" />} className={className}>
			{children}
		</Button>
	);
}

export function DeleteButton({ onClick, label = "Delete", className }: { onClick: () => void; label?: string; className?: string }) {
	return (
		<button
			type="button"
			onClick={onClick}
			aria-label={label}
			title={label}
			className={cn(
				"flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-lg border border-border-subtle text-fg-muted transition-[background-color,border-color,color,transform] duration-150 hover:border-danger/40 hover:bg-danger/10 hover:text-danger active:scale-95",
				className,
			)}
		>
			<Trash2 className="size-3.5" />
		</button>
	);
}
