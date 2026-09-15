export function HomeSection() {
  return (
    <section className="flex-center min-h-[80vh] px-6">
      <div className="page-layout-wrapper items-center text-center">
        <h1 className="text-hero">Ranked Bedwars</h1>
        <p className="text-description max-w-2xl">
          Configure, manage, and monitor your Ranked Bedwars Discord bot — all from one dashboard.
        </p>
        <div className="flex gap-4 mt-8">
          <a
            href="/dashboard"
            className="rounded-lg bg-primary-500 px-6 py-3 font-semibold text-white hover:bg-primary-600 transition-colors"
          >
            Go to Dashboard
          </a>
        </div>
      </div>
    </section>
  )
}
