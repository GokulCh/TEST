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
					<main className="flex-1 p-6">{children}</main>
				</div>
				{/* <HelpDrawer /> */}
			</div>
		</DashboardShell>
	);
}
