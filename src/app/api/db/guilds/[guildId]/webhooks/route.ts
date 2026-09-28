/** /api/db/guilds/[guildId]/webhooks: GET returns the list, PUT saves it; body: { webhooks: [...] } */

import { panelsKeyRoute } from "@/lib/server/sections";

export const { GET, PUT } = panelsKeyRoute({ key: "webhooks", body: "webhooks", label: "webhooks", empty: [] });
