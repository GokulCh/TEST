import { guildRoute, HttpError } from "@/lib/server/guild-route";
import { dbApi } from "@/lib/server/api-client";

const MAX_BYTES = 500_000;

export const GET = guildRoute(async ({ guildId }) => {
  const pageBuilder = await dbApi.guildConfig.field<Record<string, unknown> | null>(guildId, "page_builder");
  return { data: pageBuilder ?? null };
}, "Failed to fetch page builder");

export const PUT = guildRoute(async ({ guildId, json }) => {
  const body = await json<{ pageBuilder?: unknown }>();
  if (!body || typeof body !== "object" || body.pageBuilder === undefined) {
    throw new HttpError(400, "pageBuilder is required");
  }
  const serialized = JSON.stringify(body.pageBuilder);
  if (serialized.length > MAX_BYTES) throw new HttpError(413, "Page builder configuration is too large");
  await dbApi.guildConfig.saveField(guildId, "page_builder", body.pageBuilder);
  return { ok: true };
}, "Failed to save page builder");

export const PATCH = guildRoute(async ({ guildId, json }) => {
  const body = await json<{ published?: unknown }>();
  if (!body || typeof body !== "object" || typeof body.published !== "boolean") {
    throw new HttpError(400, "published must be a boolean");
  }
  const current = (await dbApi.guildConfig.field<Record<string, unknown> | null>(guildId, "page_builder")) ?? {};
  const next = { ...current, published: body.published };
  await dbApi.guildConfig.saveField(guildId, "page_builder", next);
  return { ok: true, data: next };
}, "Failed to publish page builder");

export const PUT_PAGE_BUILDER = PUT;
export const PATCH_PAGE_BUILDER = PATCH;

export const dynamic = "force-dynamic";
