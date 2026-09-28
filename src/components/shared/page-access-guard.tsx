"use client";

import { useEffect } from "react";
import { useParams, usePathname, useRouter } from "next/navigation";
import { AlertTriangle, Lock } from "lucide-react";
import { Spinner } from "@/components/panel/form-parts";
import { useDeveloperConfig } from "@/hooks/use-developer-config";
import { useSession } from "@/hooks/use-session";
import { pageAccess, pageIdForPathname, type PageAccess } from "@/lib/navigation";

/**
 * Blocks a dashboard page the guild's developer config has switched off, then
 * sends the user to the overview. Developers open everything, and any failure
 * to load the config leaves pages open.
 */
export function PageAccessGuard({ children }: { children: React.ReactNode }) {
	const guildId = useParams()?.guildId as string | undefined;
	const pathname = usePathname();
	const router = useRouter();
	const { session, isDeveloper, isLoading: sessionLoading } = useSession();
	const { data: developerConfig, isLoading: configLoading } = useDeveloperConfig(guildId);

	const loading = sessionLoading || (!isDeveloper && configLoading);
	const access: PageAccess = isDeveloper
		? { allowed: true }
		: !session
			? { allowed: false, reason: "No session" }
			: pageAccess(developerConfig, pageIdForPathname(pathname, guildId));

	useEffect(() => {
		if (loading || access.allowed) return;
		// A short delay so the locked state is visible before the redirect.
		const t = setTimeout(() => router.replace("/dashboard"), 1500);
		return () => clearTimeout(t);
	}, [loading, access.allowed, router]);

	if (loading) {
		return (
			<div role="status" aria-label="Checking access" className="motion-fade flex h-64 items-center justify-center">
				<Spinner className="size-6 text-primary-500" />
			</div>
		);
	}

	if (!access.allowed) {
		return (
			<div className="motion-fade flex h-64 items-center justify-center">
				<div className="max-w-md space-y-4 text-center">
					<div className="mx-auto flex size-12 items-center justify-center rounded-full border border-border-subtle bg-panel-bg/60">
						<Lock className="size-5 text-fg-muted" />
					</div>
					<div>
						<h3 className="text-base font-semibold text-fg-default">Access restricted</h3>
						<p className="mt-2 font-mono text-xs text-fg-muted">{access.reason}</p>
					</div>
					<div className="flex items-center justify-center gap-2 text-fg-muted/60">
						<AlertTriangle className="size-4" />
						<p className="text-xs">Redirecting to the overview…</p>
					</div>
				</div>
			</div>
		);
	}

	return <>{children}</>;
}
