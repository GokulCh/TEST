import { useEffect, useState } from "react";
import { useGuildConfig } from "@/features/dashboard/config-provider";

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

export function useGuildSnapshot() {
	const { dbGuildId } = useGuildConfig();
	const [channels, setChannels] = useState<ChannelOption[]>([]);
	const [categories, setCategories] = useState<CategoryOption[]>([]);
	const [threads, setThreads] = useState<ChannelOption[]>([]);
	const [roles, setRoles] = useState<RoleOption[]>([]);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		if (!dbGuildId) return;

		const loadSnapshot = async () => {
			setIsLoading(true);
			setError(null);
			try {
				const res = await fetch(`/api/db/guilds/${dbGuildId}/snapshot`);
				if (!res.ok) throw new Error(`Failed to load snapshot (${res.status})`);
				const data = await res.json();
				
				if (data.data && data.data.state) {
					const state = data.data.state;
					
					// Parse channels - handle both direct object and record format
					const channelOptions: ChannelOption[] = Object.values(state.channels || {}).map((val: any) => ({
						id: val.id,
						name: val.name,
						type: val.type === "0" ? "text" : val.type === "2" ? "voice" : "text",
						parent_id: val.parent_id,
					}));

					// Parse categories
					const categoryOptions: CategoryOption[] = Object.values(state.categories || {}).map((val: any) => ({
						id: val.id,
						name: val.name,
						type: "category",
						position: val.position || 0,
					}));

					// Parse threads
					const threadOptions: ChannelOption[] = Object.values(state.threads || {}).map((val: any) => ({
						id: val.id,
						name: val.name,
						type: "thread",
						parent_id: val.parent_id,
					}));

					// Parse roles
					const roleOptions: RoleOption[] = Object.values(state.roles || {}).map((val: any) => ({
						id: val.id,
						name: val.name,
						color: val.color || "0",
						position: val.position || 0,
					}));

					setChannels(channelOptions);
					setCategories(categoryOptions);
					setThreads(threadOptions);
					setRoles(roleOptions);
				} else {
					// Handle empty snapshot state
					setChannels([]);
					setCategories([]);
					setThreads([]);
					setRoles([]);
				}
			} catch (err) {
				setError(err instanceof Error ? err.message : "Failed to load snapshot");
				// Set empty arrays on error to prevent undefined issues
				setChannels([]);
				setCategories([]);
				setThreads([]);
				setRoles([]);
			} finally {
				setIsLoading(false);
			}
		};

		loadSnapshot();
	}, [dbGuildId]);

	return {
		channels,
		categoryOptions: categories,
		threads,
		roles,
		roleOptions: roles,
		isLoading,
		error,
	};
}