import { SetupWizard } from "@/features/onboarding/components/setup-wizard";
import { Suspense } from "react";

// SetupWizard uses useSearchParams, which requires Suspense in the App Router
export default function SetupPage() {
	return (
		<div className="w-full py-12 md:py-20 relative">
			<Suspense>
				<SetupWizard />
			</Suspense>
		</div>
	);
}
