"use client";

import { RefreshCw } from "lucide-react";
import { Button } from "@/components/panel/form-parts";
import { ErrorPanel } from "@/components/shared/error-panel";

/** Last-resort boundary: any uncaught render error below the root layout. */
export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
	return (
		<div className="flex min-h-screen items-center justify-center bg-bg-canvas text-fg-default">
			<ErrorPanel
				title="Something went wrong"
				actions={
					<>
						<Button variant="primary" onClick={reset} icon={<RefreshCw className="size-3.5" />}>
							Try again
						</Button>
						<a href="/" className="text-sm font-medium text-fg-muted transition-colors hover:text-fg-default">
							Back to home
						</a>
					</>
				}
			>
				An unexpected error interrupted this page. Nothing you saved was lost.
			</ErrorPanel>
		</div>
	);
}
