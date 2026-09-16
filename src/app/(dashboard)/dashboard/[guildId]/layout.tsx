import { GuildConfigProvider } from "@/features/dashboard/config-provider";
import { PageAccessGuard } from "@/components/shared/page-access-guard";
import { SetupTour } from "@/components/onboarding/setup-tour";

interface Props {
	children: React.ReactNode;
	params: Promise<{ guildId: string }>;
}

export default async function GuildLayout({ children, params }: Props) {
	const { guildId } = await params;
	return (
		<GuildConfigProvider guildSnowflake={guildId}>
			<PageAccessGuard>
				<div className="motion-page min-h-full">{children}</div>
				<SetupTour />
			</PageAccessGuard>
		</GuildConfigProvider>
	);
}
