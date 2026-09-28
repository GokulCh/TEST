/** /api/db/guilds/[guildId]/giveaways: GET returns the list, PUT saves it; body: { giveaways: [...] } */

import { panelsKeyRoute } from "@/lib/server/sections";

export const { GET, PUT } = panelsKeyRoute({ key: "giveaways", body: "giveaways", label: "giveaways", empty: [] });
