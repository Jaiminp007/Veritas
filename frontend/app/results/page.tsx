import { Header } from "@/components/veritas/header"
import { AuditWindow } from "@/components/veritas/audit-window"
import { BentoFeatures } from "@/components/veritas/bento-features"
import { GlobalMetrics } from "@/components/veritas/global-metrics"
import { Footer } from "@/components/veritas/footer"
import { getAuditRecords, getCategoryMetrics, getSummaryMetrics } from "@/lib/convex-data"

export const metadata = {
  title: "Results | Veritas Benchmark",
  description: "Real-time benchmark results and audit logs from the Senso Context Layer.",
}

export const dynamic = "force-dynamic"

export default async function ResultsPage() {
  const [summary, categories, records] = await Promise.all([
    getSummaryMetrics(),
    getCategoryMetrics(),
    getAuditRecords(20),
  ])

  return (
    <main className="min-h-screen bg-background">
      <Header />
      
      {/* Page Header */}
      <section className="pt-32 pb-12 px-6">
        <div className="max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-6">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald" />
            </span>
            <span className="text-sm text-muted-foreground">
              Live Data
            </span>
          </div>
          <h1 className="font-display text-4xl sm:text-5xl font-bold tracking-tight text-foreground mb-4">
            Benchmark <span className="text-cyan">Results</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-12">
            Real-time performance metrics and audit logs from every query processed through the Veritas benchmark system.
          </p>
        </div>
      </section>

      {/* Metrics Strip */}
      <GlobalMetrics summary={summary} />

      {/* Grid Background Wrapper */}
      <div className="relative">
        <div className="absolute inset-0 grid-background pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,oklch(0_0_0)_80%)] pointer-events-none" />
        <div className="relative z-10 pt-24">
          <AuditWindow records={records} />
          <BentoFeatures summary={summary} categories={categories} />
        </div>
      </div>
      
      <Footer />
    </main>
  )
}
