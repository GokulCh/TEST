"use client";

/**
 * useSectionForm: the state every config editor shares. It keeps an editable
 * copy of a saved value, resyncs it when the saved value changes, feeds the
 * global unsaved-changes bar, and wraps saving with the "Saved" flash and the
 * error message.
 *
 *   const form = useSectionForm(ranksFromMeta, [], (ranks) => saveMetaSection("ranks", ranks), validateRanks);
 *   <PageShell onSave={form.submit} saving={form.saving} dirty={form.isDirty} error={form.error}> ... form.value / form.setValue
 *
 * `saved` is the value as the database holds it (null while it loads), `empty`
 * what to edit until then. `validate` runs before every save and returns a
 * message to block it (shown inline and as a toast).
 *
 * `submit` rejects when the save (or validation) fails, after recording `error`;
 * PageShell awaits it and raises the toast, so callers that use it elsewhere must catch.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { useUnsavedChanges } from "@/hooks/use-unsaved-changes";

const FLASH_MS = 2500;

export function useSectionForm<T>(saved: T | null | undefined, empty: T, save: (value: T) => Promise<void>, validate?: (value: T) => string | null | undefined) {
	const [value, setValue] = useState<T>(saved ?? empty);
	const [saving, setSaving] = useState(false);
	const [justSaved, setJustSaved] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const flash = useRef<ReturnType<typeof setTimeout>>(undefined);

	// Resync on content, not identity: a refetch that changed nothing must not discard edits.
	const savedKey = JSON.stringify(saved ?? null);
	useEffect(() => {
		if (saved != null) setValue(saved);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [savedKey]);

	useEffect(() => () => clearTimeout(flash.current), []);

	// "Discard changes" puts the saved value back instead of reloading the page.
	const discard = useCallback(() => {
		setValue(saved ?? empty);
		setError(null);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [savedKey]);
	useUnsavedChanges(value, saved ?? null, discard);
	const isDirty = saved != null && JSON.stringify(value) !== savedKey;

	/** Merge a partial change into an object-shaped value. */
	const update = useCallback((patch: Partial<T>) => setValue((v) => ({ ...v, ...patch })), []);

	const submit = useCallback(async () => {
		setError(null);
		const problem = validate?.(value);
		if (problem) {
			setError(problem);
			throw new Error(problem);
		}
		setSaving(true);
		try {
			await save(value);
			setJustSaved(true);
			clearTimeout(flash.current);
			flash.current = setTimeout(() => setJustSaved(false), FLASH_MS);
		} catch (e) {
			const message = e instanceof Error ? e.message : "Save failed";
			setError(message);
			throw e instanceof Error ? e : new Error(message);
		} finally {
			setSaving(false);
		}
	}, [save, validate, value]);

	return { value, setValue, update, isDirty, submit, saving, justSaved, error };
}
