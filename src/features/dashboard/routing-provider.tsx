"use client";

import { createContext, useContext, ReactNode } from "react";
import { useIsSubdomain } from "@/hooks/use-is-subdomain";

interface RoutingContextType {
	guildId: string;
	isSubdomain: boolean;
	getPath: (path: string) => string;
}

const RoutingContext = createContext<RoutingContextType | undefined>(undefined);

export function RoutingProvider({ 
	guildId, 
	children 
}: { 
	guildId: string; 
	children: ReactNode;
}) {
	const isSubdomain = useIsSubdomain();

	const getPath = (path: string): string => {
		if (isSubdomain) {
			// On subdomain: use clean URL without guild ID
			// Remove /dashboard/{guildId} pattern and replace with /dashboard
			return path.replace(/^\/dashboard\/[^\/]+/, "/dashboard");
		} else {
			// On main domain: include guild ID in path
			return path.replace(/^\/dashboard/, `/dashboard/${guildId}`);
		}
	};

	return (
		<RoutingContext.Provider value={{ guildId, isSubdomain, getPath }}>
			{children}
		</RoutingContext.Provider>
	);
}

export function useRouting() {
	const context = useContext(RoutingContext);
	if (!context) {
		throw new Error("useRouting must be used within RoutingProvider");
	}
	return context;
}