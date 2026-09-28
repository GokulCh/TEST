import { useMemo } from "react";
import type { GuildSnapshotBundle, SnapshotChannelRecord } from "@/lib/db-types";
import { useGuildData } from "@/hooks/use-guild-data";

export interface ChannelOption {
	id: string;
	name: string;
	type: "text" | "voice" | "category" | "thread";
	parent_id?: string | null;
}

export interface CategoryOption {
	id: string;
	name: string;
	type: "category";
	position: number;
}

export interface RoleOption {
	id: string;
	name: string;
	color: string;
	position: number;
}

const channelType = (type: string): ChannelOption["type"] => (type === "2" ? "voice" : "text");

/** Channels, categories, threads and roles the bot last reported. One request, shared by every caller. */
export function useGuildSnapshot() {
	const { data, error, isLoading } = useGuildData<GuildSnapshotBundle>("snapshot");

	const parsed = useMemo(() => {
		const state = data?.state;
		const named = (rec: SnapshotChannelRecord) => ({ id: rec.id, name: rec.name });
		return {
			channels: Object.values(state?.channels ?? {}).map((c): ChannelOption => ({ ...named(c), type: channelType(c.type), parent_id: c.parent_id })),
			categories: Object.values(state?.categories ?? {}).map((c): CategoryOption => ({ ...named(c), type: "category", position: c.position || 0 })),
			threads: Object.values(state?.threads ?? {}).map((t): ChannelOption => ({ ...named(t), type: "thread", parent_id: t.parent_id })),
			roles: Object.values(state?.roles ?? {}).map((r): RoleOption => ({ id: r.id, name: r.name, color: r.color || "0", position: r.position || 0 })),
		};
	}, [data]);

	return {
		channels: parsed.channels,
		categoryOptions: parsed.categories,
		threads: parsed.threads,
		roles: parsed.roles,
		roleOptions: parsed.roles,
		isLoading,
		error: error ? (error instanceof Error ? error.message : "Failed to load snapshot") : null,
	};
}
