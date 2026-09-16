import { GuildConfigProvider } from "@/features/dashboard/config-provider";
import { PageAccessGuard } from "@/components/shared/page-access-guard";

interface Props {
	children: React.ReactNode;
	params: Promise<{ guildId: string }>;
}

export default async function GuildLayout({ children, params }: Props) {
	const { guildId } = await params;
	return (
		<GuildConfigProvider guildSnowflake={guildId}>
			<PageAccessGuard>
				<div className="dashboard-page-enter">{children}</div>
			</PageAccessGuard>
		</GuildConfigProvider>
	);
}
