"use client";

import { RefreshCw } from "lucide-react";
import { Button } from "@/components/panel/form-parts";
import { ErrorPanel } from "@/components/shared/error-panel";

/** A page inside the dashboard threw: the sidebar and unsaved-changes guard stay usable. */
export default function DashboardError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
	return (
		<ErrorPanel title="This page ran into a problem" actions={<Button variant="primary" onClick={reset} icon={<RefreshCw className="size-3.5" />}>Reload page</Button>}>
			Something failed while rendering this page. Try again, or use the sidebar to go somewhere else.
		</ErrorPanel>
	);
}
