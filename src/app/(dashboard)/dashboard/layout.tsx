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
			<div className="flex min-h-screen">
				<Sidebar />
				<div className="flex flex-1 flex-col">
					<MobileHeader />
					<GuildContextBar />
					<Breadcrumbs />
					<main className="motion-page flex-1 overflow-x-hidden bg-bg-canvas/80 px-4 py-5 sm:px-6 lg:px-8">{children}</main>
				</div>
				{/* <HelpDrawer /> */}
			</div>
		</DashboardShell>
	);
}
