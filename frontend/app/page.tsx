import { Header } from "@/components/veritas/header"
import { Hero } from "@/components/veritas/hero"
import { Footer } from "@/components/veritas/footer"
import { getSummaryMetrics } from "@/lib/convex-data"

export const dynamic = "force-dynamic"

export default async function HomePage() {
  const summary = await getSummaryMetrics()

  return (
    <main className="min-h-screen bg-background">
      <Header />
      <Hero summary={summary} />
      <Footer />
    </main>
  )
}
