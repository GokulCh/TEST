/** Skeleton for the public portal pages while their data loads (keeps the portal's own dark look). */
export default function PublicLoading() {
	const block = "skeleton rounded-xl border border-white/[0.06]";
	return (
		<div className="mx-auto max-w-[95rem] px-5 py-16 sm:px-8 sm:py-24" aria-busy="true" aria-label="Loading">
			<div className="mx-auto mb-10 flex max-w-2xl flex-col items-center gap-3">
				<div className={`${block} h-3 w-32`} />
				<div className={`${block} h-10 w-full max-w-md`} />
				<div className={`${block} h-4 w-3/4`} />
			</div>
			<div className="grid gap-4 md:grid-cols-3">
				<div className={`${block} h-40`} />
				<div className={`${block} h-40`} />
				<div className={`${block} h-40`} />
			</div>
		</div>
	);
}
