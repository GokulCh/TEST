/** /api/db/guilds/[guildId]/loggers: GET returns the list, PUT saves it; body: { loggers: [...] } */

import { panelsKeyRoute } from "@/lib/server/sections";

export const { GET, PUT } = panelsKeyRoute({ key: "loggers", body: "loggers", label: "loggers", empty: [] });
