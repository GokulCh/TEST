"use client";

import { useEffect } from "react";
import { useParams, usePathname, useRouter } from "next/navigation";
import { AlertTriangle, Lock } from "lucide-react";
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
			<div className="flex items-center justify-center h-64">
				<div role="status" aria-label="Checking access" className="animate-spin size-6 border-2 border-primary-500/30 border-t-primary-500 rounded-full" />
			</div>
		);
	}

	if (!access.allowed) {
		return (
			<div className="flex items-center justify-center h-64">
				<div className="text-center space-y-4 max-w-md">
					<Lock className="size-12 text-fg-muted mx-auto" />
					<div>
						<h3 className="text-base font-semibold text-fg-default">Access restricted</h3>
						<p className="font-mono text-xs text-fg-muted mt-2">{access.reason}</p>
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
