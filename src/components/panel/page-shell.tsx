"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { AlertCircle, Check, Save } from "lucide-react";
import { toast } from "sonner";
import { Badge, Button, Skeleton } from "@/components/panel/form-parts";
import { useUnsavedChangesContext } from "@/lib/contexts/changes-context";
import { errorMessage } from "@/lib/client/notify";

/** The error strip shown under a page header. */
export function ErrorBanner({ children }: { children: ReactNode }) {
	if (!children) return null;
	return (
		<div role="alert" className="flex items-start gap-3 rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-danger motion-fade">
			<AlertCircle className="mt-0.5 size-4 shrink-0" />
			<p className="text-sm leading-snug">{children}</p>
		</div>
	);
}

/** Placeholder with the shape of a config page (header, a bar, a few cards) while its data loads. */
export function PageSkeleton() {
	return (
		<div className="mx-auto w-full max-w-7xl space-y-6" aria-busy="true" aria-label="Loading">
			<div className="flex items-end justify-between gap-4 border-b border-border-subtle pb-5">
				<div className="space-y-2.5">
					<Skeleton className="h-3 w-40" />
					<Skeleton className="h-7 w-64" />
				</div>
				<Skeleton className="h-9 w-32" />
			</div>
			<Skeleton className="h-16 rounded-xl" />
			<div className="grid gap-6 lg:grid-cols-3">
				<div className="space-y-4 lg:col-span-2">
					<Skeleton className="h-44 rounded-xl" />
					<Skeleton className="h-44 rounded-xl" />
				</div>
				<Skeleton className="h-52 rounded-xl" />
			</div>
		</div>
	);
}

/** Placeholder shaped like a table page (header, a toolbar, table rows) for routes whose content is a `DataTable`. */
export function TablePageSkeleton({ rows = 8 }: { rows?: number }) {
	return (
		<div className="mx-auto w-full max-w-7xl space-y-6" aria-busy="true" aria-label="Loading">
			<div className="flex items-end justify-between gap-4 border-b border-border-subtle pb-5">
				<div className="space-y-2.5">
					<Skeleton className="h-3 w-40" />
					<Skeleton className="h-7 w-64" />
				</div>
				<Skeleton className="h-9 w-32" />
			</div>
			<div className="flex flex-col gap-3 sm:flex-row sm:items-center">
				<Skeleton className="h-10 flex-1 rounded-xl" />
				<Skeleton className="h-9 w-28 shrink-0 rounded-lg" />
			</div>
			<div className="overflow-hidden rounded-xl border border-border-subtle bg-panel-bg/40">
				<div className="border-b border-border-subtle bg-bg-canvas/40 p-4">
					<Skeleton className="h-3 w-1/3" />
				</div>
				<div className="divide-y divide-border-subtle/40">
					{Array.from({ length: rows }, (_, i) => (
						<div key={i} className="flex items-center gap-6 px-4 py-3.5">
							<Skeleton className="h-3 w-16" />
							<Skeleton className="h-3 flex-1" />
							<Skeleton className="hidden h-3 w-24 sm:block" />
							<Skeleton className="h-3 w-12" />
						</div>
					))}
				</div>
			</div>
		</div>
	);
}

/** The bits of a `useSectionForm` result the shell needs; pass the whole form as `form`. */
interface ShellForm {
	submit: () => Promise<unknown>;
	saving: boolean;
	isDirty: boolean;
	error: string | null;
}

interface PageShellProps {
	/** Small line above the title: the section this page belongs to. */
	eyebrow: string;
	title: string;
	/** Extra content under the title (description, links). */
	subtitle?: ReactNode;
	/** Show the skeleton instead of the page while the data loads. */
	loading?: boolean;
	/** A `useSectionForm` result: wires save, saving, dirty and error in one prop. */
	form?: ShellForm;
	/**
	 * Save handler. May be async: the shell shows the loading state while it runs,
	 * a success toast when it resolves and an error toast when it throws.
	 */
	onSave?: () => unknown;
	saveLabel?: string;
	/** Kept for older call sites; the button shows "Saving…" whatever this says. */
	savingLabel?: string;
	/** Force the busy state (e.g. a save that runs outside `onSave`). */
	saving?: boolean;
	/** Unsaved edits: the save button turns solid. */
	dirty?: boolean;
	/** Kept for older call sites; the shell tracks its own "Saved" flash. */
	justSaved?: boolean;
	error?: string | null;
	/** Toast text after a successful save. */
	successMessage?: string;
	/** This page keeps its data in the browser only; saving says so instead of claiming a database write. */
	preview?: boolean;
	/** Extra header controls, placed before the save button. */
	actions?: ReactNode;
	children: ReactNode;
}

const FLASH_MS = 2500;

/** The frame every config page shares: header, save button with its feedback, error strip, skeleton while loading. */
export function PageShell({
	eyebrow,
	title,
	subtitle,
	loading,
	form,
	onSave,
	saveLabel = "Save changes",
	saving,
	dirty,
	error,
	successMessage,
	preview,
	actions,
	children,
}: PageShellProps) {
	const save = form?.submit ?? onSave;
	const isDirty = form ? form.isDirty : dirty;
	const shownError = form?.error ?? error;

	const { registerSaveAction } = useUnsavedChangesContext();
	const [busy, setBusy] = useState(false);
	const [saved, setSaved] = useState(false);
	const flash = useRef<ReturnType<typeof setTimeout>>(undefined);
	const saveRef = useRef(save);
	saveRef.current = save;
	const busyRef = useRef(false);
	const messageRef = useRef({ successMessage, preview });
	messageRef.current = { successMessage, preview };
	useEffect(() => () => clearTimeout(flash.current), []);

	const isBusy = busy || !!saving || !!form?.saving;

	const run = useCallback(async () => {
		if (busyRef.current || !saveRef.current) return;
		busyRef.current = true;
		setBusy(true);
		try {
			await saveRef.current();
			const m = messageRef.current;
			toast.success(m.successMessage ?? (m.preview ? "Applied in this session only" : "Changes saved"), {
				description: m.preview ? "This page is not connected to the database yet." : undefined,
			});
			setSaved(true);
			clearTimeout(flash.current);
			flash.current = setTimeout(() => setSaved(false), FLASH_MS);
		} catch (e) {
			toast.error("Couldn't save changes", { description: errorMessage(e, "Save failed") });
		} finally {
			busyRef.current = false;
			setBusy(false);
		}
	}, []);

	// Let the floating save bar trigger the same handler (kept in a ref so typing never re-registers it).
	const hasSave = !!save;
	useEffect(() => {
		if (!hasSave) return;
		registerSaveAction({ run: () => void run(), saving: isBusy });
		return () => registerSaveAction(null);
	}, [hasSave, isBusy, run, registerSaveAction]);

	if (loading) return <PageSkeleton />;

	return (
		<div className="motion-stagger mx-auto w-full max-w-7xl space-y-6 text-left">
			<header className="flex flex-col gap-4 border-b border-border-subtle pb-5 sm:flex-row sm:items-end sm:justify-between">
				<div className="min-w-0">
					<p className="text-xs font-medium text-fg-muted">{eyebrow}</p>
					<div className="mt-1 flex flex-wrap items-center gap-2.5">
						<h1 className="text-2xl font-semibold tracking-tight text-fg-default">{title}</h1>
						{preview && <Badge tone="warning">Local preview</Badge>}
					</div>
					{subtitle}
				</div>
				<div className="flex items-center gap-2 self-start sm:self-auto">
					{saved && !isBusy && (
						<span className="motion-fade flex items-center gap-1.5 text-xs font-medium text-success">
							<Check className="motion-check size-3.5" /> Saved
						</span>
					)}
					{actions}
					{save && (
						<Button
							variant={isDirty ? "primary" : "secondary"}
							onClick={() => void run()}
							loading={isBusy}
							icon={<Save className="size-3.5" />}
							className={isDirty ? "shadow-[0_0_0_3px_color-mix(in_oklab,var(--color-primary-500)_18%,transparent)]" : undefined}
						>
							{isBusy ? "Saving…" : saveLabel}
						</Button>
					)}
				</div>
			</header>
			<ErrorBanner>{shownError}</ErrorBanner>
			{children}
		</div>
	);
}
