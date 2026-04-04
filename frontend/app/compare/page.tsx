import { Header } from "@/components/veritas/header"
import { ComparisonBrowser } from "@/components/veritas/comparison-browser"
import { Footer } from "@/components/veritas/footer"
import { getAuditRecords } from "@/lib/convex-data"

export const metadata = {
  title: "Compare | Veritas Benchmark",
  description: "Explore the full benchmark suite of 25 financial compliance queries.",
}

export const dynamic = "force-dynamic"

export default async function ComparePage() {
  const records = await getAuditRecords(25)

  return (
    <main className="min-h-screen bg-background">
      <Header />
      
      {/* Page Header */}
      <section className="pt-32 pb-12 px-6 border-b border-border/40">
        <div className="max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-6">
            <div className="flex gap-1">
              <span className="w-2 h-2 rounded-full bg-orange" />
              <span className="w-2 h-2 rounded-full bg-emerald" />
            </div>
            <span className="text-sm text-muted-foreground">
              Full Benchmark Suite (25 Queries)
            </span>
          </div>
          <h1 className="font-display text-4xl sm:text-5xl font-bold tracking-tight text-foreground mb-4">
            Model <span className="text-cyan">Comparison</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Deep dive into the performance delta between standard LLMs and Senso-augmented responses across various compliance categories.
          </p>
        </div>
      </section>

      {/* Browser Section */}
      <ComparisonBrowser records={records} />
      
      <Footer />
    </main>
  )
}
