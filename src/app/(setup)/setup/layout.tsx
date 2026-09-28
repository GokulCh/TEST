import type { ReactNode } from "react";
import { SiteShell } from "@/components/layout/site-shell";

export default function SetupLayout({ children }: { children: ReactNode }) {
	return <SiteShell cta={null}>{children}</SiteShell>;
}
