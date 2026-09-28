import Link from "next/link";
import { SiteShell } from "@/components/layout/site-shell";

export default function NotFound() {
	return (
		<SiteShell>
			<div className="mx-auto flex max-w-xl flex-col items-center px-6 py-24 text-center">
				<p className="text-sm font-semibold text-primary-500">404</p>
				<h1 className="mt-3 text-title">We couldn’t find that page.</h1>
				<p className="mt-3 text-description">The link may be out of date, or the page may have moved.</p>
				<Link href="/" className="button-primary mt-8">
					Back to home
				</Link>
			</div>
		</SiteShell>
	);
}
