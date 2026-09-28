/** /api/db/guilds/[guildId]/panel-creator: GET returns the panel creator config, PUT saves it; body: { panel } */

import { panelsKeyRoute } from "@/lib/server/sections";

export const { GET, PUT } = panelsKeyRoute({ key: "panel_creator", body: "panel", label: "panel creator config", empty: null });
