import { toast } from "sonner";

/** Message of anything thrown, for toasts and inline errors. */
export const errorMessage = (e: unknown, fallback = "Something went wrong") => (e instanceof Error && e.message ? e.message : fallback);

/**
 * Runs an async action and reports the outcome as a toast. Resolves true on
 * success, false on failure (never rejects), so it is safe in an onClick.
 */
export async function runWithToast(action: () => unknown, opts: { success?: string; failure?: string } = {}): Promise<boolean> {
	try {
		await action();
		toast.success(opts.success ?? "Changes saved");
		return true;
	} catch (e) {
		toast.error(opts.failure ?? "Couldn't save changes", { description: errorMessage(e) });
		return false;
	}
}
