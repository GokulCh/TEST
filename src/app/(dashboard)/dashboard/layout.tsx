import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { GuildContextBar } from "@/components/layout/guild-context-bar";
import { MobileHeader } from "@/components/layout/mobile-header";
import { Sidebar } from "@/components/layout/sidebar";

export default function DashboardLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<DashboardShell>
			<div className="flex min-h-screen bg-bg-canvas">
				<Sidebar />
				<div className="relative flex min-w-0 flex-1 flex-col overflow-hidden">
					<div className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-[radial-gradient(ellipse_at_top,color-mix(in_oklch,var(--color-primary-500)_12%,transparent),transparent_68%)] opacity-60" />
					<div className="relative flex min-w-0 flex-1 flex-col">
						<MobileHeader />
						<GuildContextBar />
						<Breadcrumbs />
						<main className="mx-auto w-full max-w-[1440px] flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
					</div>
				</div>
				{/* <HelpDrawer /> */}
			</div>
		</DashboardShell>
	);
}
