/** "just now", "12m ago", "3h ago", "2d ago"; "—" without a timestamp. */
export function relativeTime(ts: string | null | undefined): string {
	if (!ts) return "—";
	const minutes = Math.floor((Date.now() - new Date(ts).getTime()) / 60000);
	if (minutes < 2) return "just now";
	if (minutes < 60) return `${minutes}m ago`;
	const hours = Math.floor(minutes / 60);
	if (hours < 24) return `${hours}h ago`;
	return `${Math.floor(hours / 24)}d ago`;
}
