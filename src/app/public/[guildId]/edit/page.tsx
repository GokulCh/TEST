import { requireGuildAccess } from "@/lib/server/guild-authorization";
import { resolvePublicGuildId } from "@/lib/server/portal-domains";
import { getPublicGuildInfo } from "../server-data";
import { PageBuilderEditor } from "@/components/public/page-builder-editor";

export default async function PublicGuildEditor({ params }: { params: Promise<{ guildId: string }> }) {
  const { guildId } = await params;
  const resolved = await resolvePublicGuildId(guildId);
  await requireGuildAccess(resolved);
  const guild = await getPublicGuildInfo(resolved);
  return <PageBuilderEditor guildId={resolved} guildName={guild.name} />;
}
