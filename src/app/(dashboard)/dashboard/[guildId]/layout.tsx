import { GuildConfigProvider } from "@/features/dashboard/config-provider";
import { RoutingProvider } from "@/features/dashboard/routing-provider";
import { PageAccessGuard } from "@/components/shared/page-access-guard";
import { SetupTour } from "@/components/onboarding/setup-tour";
import { ThemeScope } from "@/components/shared/theme-scope";
import { headers } from "next/headers";
import { isSubdomain } from "@/lib/routing-utils";

interface Props {
	children: React.ReactNode;
	params: Promise<{ guildId: string }>;
}

export default async function GuildLayout({ children, params }: Props) {
	const { guildId } = await params;
	
	// Check if we're on a subdomain
	const headersList = await headers();
	const host = headersList.get('host') || '';
	const onSubdomain = isSubdomain(host);
	
	// On subdomain, the guildId comes from the proxy rewrite
	// On main domain, it comes from the URL parameter
	// Both should be the same guild ID
	const effectiveGuildId = guildId;
	
	return (
		<RoutingProvider guildId={effectiveGuildId}>
			<GuildConfigProvider guildSnowflake={effectiveGuildId}>
				<ThemeScope dashboard>
					<PageAccessGuard>
						<div className="motion-page min-h-full">{children}</div>
						<SetupTour />
					</PageAccessGuard>
				</ThemeScope>
			</GuildConfigProvider>
		</RoutingProvider>
	);
}
