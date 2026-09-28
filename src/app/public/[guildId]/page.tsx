import Link from "next/link";
import { PageBuilderEditor } from "@/components/public/page-builder-editor";
import { PublicEditLauncher } from "@/components/public/public-edit-launcher";
import {
	ArrowRight,
	ChevronRight,
	Gamepad2,
	Trophy,
	Users,
	Zap,
	Activity,
} from "@/components/shared/icons";
import { PublicCard, SectionHeading } from "./public-shell";
import { getGuildPlayers } from "./player-data";
import { getPublicStats, getPublicGuildName, getActiveSeason } from "./server-data";

export default async function PublicHome({
	params,
	searchParams,
}: {
	params: Promise<{ guildId: string }>;
	searchParams: Promise<{ edit?: string }>;
}) {
	const { guildId } = await params;
	const { edit } = await searchParams;
	// Use relative paths for subdomain routing
	const base = "";
	const [publicPlayers, stats, guildName, activeSeason] = await Promise.all([
		getGuildPlayers(guildId),
		getPublicStats(guildId),
		getPublicGuildName(guildId),
		getActiveSeason(guildId),
	]);

	const publicStats = [
		["Online now", String(stats.activeGames)],
		["Registered players", String(stats.registeredPlayers)],
		["Games played", String(stats.totalGames)],
		["Season", activeSeason],
	] as [string, string][];
	return (
		<div>
			{edit === "1" && (
				<div className="fixed inset-0 z-40 overflow-auto bg-background/95 backdrop-blur-sm">
					<PageBuilderEditor guildId={guildId} guildName={guildName} />
				</div>
			)}
			{edit !== "1" && <PublicEditLauncher />}
			<section className="relative overflow-hidden border-b border-white/[0.06]">
				<div className="pointer-events-none absolute right-[8%] top-16 hidden size-56 rotate-12 rounded-[2rem] border border-cyan-300/10 lg:block" />
				<div className="pointer-events-none absolute right-[11%] top-24 hidden size-56 rotate-12 rounded-[2rem] border border-cyan-300/10 lg:block" />
				<div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_70%_20%,rgba(34,211,238,.13),transparent_30%),radial-gradient(circle_at_20%_55%,rgba(124,58,237,.1),transparent_26%)]" />
				<div className="relative mx-auto grid max-w-[95rem] gap-12 px-5 pb-20 pt-20 sm:px-8 lg:grid-cols-[1.1fr_.9fr] lg:items-center lg:pb-28 lg:pt-28">
					<div className="pointer-events-none absolute bottom-4 left-1/2 hidden h-px w-2/3 -translate-x-1/2 bg-gradient-to-r from-transparent via-cyan-300/30 to-transparent lg:block" />
					<div>
						<div className="mb-6 inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/[0.06] px-3 py-1.5 text-xs text-cyan-200">
							<Zap className="size-3" /> {activeSeason} · Live
						</div>
						<h1 className="max-w-3xl text-5xl font-bold leading-[.98] tracking-[-0.06em] sm:text-7xl">
							Play sharper.
							<br />
							<span className="text-cyan-300">Climb higher.</span>
						</h1>
						<p className="mt-7 max-w-xl text-lg leading-8 text-white/55">
							{guildName} is a competitive community for players who
							want fair matchmaking, clear stats, and memorable games.
						</p>
						<div className="mt-9 flex flex-wrap gap-3">
							<Link
								href={`${base}/leaderboard`}
								className="flex items-center gap-2 rounded-xl bg-cyan-400 px-5 py-3 text-sm font-bold text-[#071016] transition-transform hover:-translate-y-1"
							>
								Enter the rankings <ArrowRight className="size-4" />
							</Link>
							<Link
								href={`${base}/players`}
								className="rounded-xl border border-white/15 px-5 py-3 text-sm font-bold text-white/80 transition-colors hover:bg-white/[0.08]"
							>
								Meet the players
							</Link>
						</div>
					</div>
					<PublicCard className="relative overflow-hidden p-6 sm:p-7">
						<div className="absolute -right-14 -top-14 size-40 rounded-full bg-cyan-400/10 blur-3xl" />
						<div className="mb-7 flex items-center justify-between">
							<span className="text-xs text-white/45">
								Community status
							</span>
							<span className="flex items-center gap-2 text-xs text-emerald-300">
								<i className="size-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]" />{" "}
								Online
							</span>
						</div>
						<div className="grid grid-cols-2 gap-3">
							{publicStats.map(([label, value]) => (
								<div
									key={label}
									className="rounded-xl border border-white/[0.07] bg-black/20 p-4"
								>
									<p className="text-xs text-white/35">{label}</p>
									<p className="mt-2 text-2xl font-bold tracking-tight">
										{value}
									</p>
								</div>
							))}
						</div>
						<div className="mt-5 flex items-center gap-2 border-t border-white/[0.08] pt-5 text-xs text-white/45">
							<Activity className="size-3.5 text-cyan-300" /> ELO-based
							matchmaking is active
						</div>
					</PublicCard>
				</div>
			</section>
			<section className="mx-auto max-w-[95rem] px-5 pb-14 pt-16 sm:px-8 sm:pt-20">
				<div className="mb-4">
					<p className="text-xs text-white/30">
						Explore the community
					</p>
				</div>
				<div className="motion-stagger grid gap-4 md:grid-cols-3">
					{[
						[
							"Players",
							"Browse competitors and find the top players this season.",
							Users,
							"/players",
						],
						[
							"Games",
							"Track recent matches, game modes, maps, and results.",
							Gamepad2,
							"/games",
						],
						[
							"Leaderboard",
							"See who is leading the community in every ranked queue.",
							Trophy,
							"/leaderboard",
						],
					].map(([title, desc, Icon, href]) => (
						<Link href={`${base}${href}`} key={title as string}>
							<PublicCard className="group h-full p-6 transition-transform hover:-translate-y-1">
								<div className="mb-9 flex justify-between">
									<span className="grid size-10 place-items-center rounded-xl bg-white/[0.07] text-cyan-300">
										<Icon className="size-5" />
									</span>
									<ChevronRight className="size-4 text-white/25 transition-transform group-hover:translate-x-1" />
								</div>
								<h3 className="text-xl font-bold">{title as string}</h3>
								<p className="mt-2 text-sm leading-6 text-white/45">
									{desc as string}
								</p>
							</PublicCard>
						</Link>
					))}
				</div>
			</section>
			<section className="motion-stagger mx-auto grid max-w-[95rem] gap-4 px-5 pb-24 sm:px-8 md:grid-cols-2 lg:grid-cols-4">
				{[
					[
						"About",
						"/about",
						"A fair, transparent place to compete and track your progress.",
					],
					[
						"Creators",
						"/creators",
						"Meet the players, streamers, and community members who keep things exciting.",
					],
					[
						"Partners",
						"/partners",
						"Explore the teams and organizations helping build better ranked play.",
					],
					[
						"Support",
						"/support",
						"Find answers, help, and the right place to ask questions.",
					],
				].map(([title, href, copy]) => (
					<Link key={title} href={`${base}${href}`}>
						<PublicCard className="group h-full p-5 transition-transform hover:-translate-y-1">
							<h2 className="mt-3 text-lg font-bold">{title}</h2>
							<p className="mt-2 text-sm leading-6 text-white/45">{copy}</p>
							<span className="mt-5 inline-flex items-center gap-1 text-xs font-bold text-cyan-300">
								Explore{" "}
								<ArrowRight className="size-3 transition-transform group-hover:translate-x-1" />
							</span>
						</PublicCard>
					</Link>
				))}
			</section>
		</div>
	);
}
