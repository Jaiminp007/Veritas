"use client"

import { ArrowRight, Play } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { SummaryMetrics } from "@/lib/convex-data"

function formatPercent(value: number) {
  return `${(value * 100).toFixed(1)}%`
}

type HeroProps = {
  summary: SummaryMetrics | null
}

export function Hero({ summary }: HeroProps) {
  const totalQueries = summary?.total ?? 0
  const averageDelta = summary?.avg_delta ?? 0
  const baselineHallucinationRate = summary?.hallucination_rate_baseline ?? 0
  const sensoHallucinationRate = summary?.hallucination_rate_senso ?? 0
  const hallucinationsPrevented =
    baselineHallucinationRate > 0
      ? (baselineHallucinationRate - sensoHallucinationRate) / baselineHallucinationRate
      : 0

  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center px-6 pt-20 pb-12 overflow-hidden">
      {/* Grid background */}
      <div className="absolute inset-0 grid-background pointer-events-none" />
      
      {/* Subtle radial fade at edges */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,oklch(0_0_0)_70%)] pointer-events-none" />

      <div className="relative z-10 max-w-5xl mx-auto text-center">
        {/* Live Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-8">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan" />
          </span>
          <span className="text-sm text-muted-foreground">
            Veritas Benchmark v1.0 - Built for{" "}
            <span className="text-cyan font-medium">Senso.ai</span>
          </span>
        </div>

        {/* Headline */}
        <h1 className="font-display text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-[-0.05em] text-foreground mb-6 text-balance">
          The Ground Truth for{" "}
          <span className="text-cyan">Financial LLMs</span>
        </h1>

        {/* Sub-headline */}
        <p className="text-lg sm:text-xl text-muted-foreground max-w-3xl mx-auto mb-10 leading-relaxed text-pretty">
          Benchmarking raw LLMs against the Senso Context Layer. Built to
          demonstrate adversarial query resolution and verified accuracy for
          the Senso API.
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
          <Button
            size="lg"
            className="bg-foreground text-background hover:bg-foreground/90 px-8 py-6 text-base font-semibold"
            asChild
          >
            <Link href="/results">
              <Play className="mr-2 h-4 w-4" />
              View Benchmark Results
            </Link>
          </Button>
          <Button
            variant="outline"
            size="lg"
            className="glass border-border hover:border-cyan/50 px-8 py-6 text-base"
            asChild
          >
            <a href="https://github.com/Jaiminp007/Veritas" target="_blank" rel="noopener noreferrer">
              <ArrowRight className="mr-2 h-4 w-4" />
              View Source Code
            </a>
          </Button>
        </div>

        {/* Metric Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-4xl mx-auto">
          <MetricCard
            value={totalQueries.toLocaleString()}
            label="Queries Processed"
            color="cyan"
          />
          <MetricCard
            value={`${averageDelta >= 0 ? "+" : ""}${formatPercent(averageDelta)}`}
            label="Senso Performance Lift"
            color="emerald"
          />
          <MetricCard
            value={`${hallucinationsPrevented > 0 ? "+" : ""}${formatPercent(hallucinationsPrevented)}`}
            label="Hallucinations Prevented"
            color="orange"
          />
        </div>
      </div>
    </section>
  )
}

function MetricCard({
  value,
  label,
  color,
}: {
  value: string
  label: string
  color: "cyan" | "emerald" | "orange"
}) {
  const borderClass = {
    cyan: "border-cyan/20 hover:border-cyan/40",
    emerald: "border-emerald/20 hover:border-emerald/40",
    orange: "border-orange/20 hover:border-orange/40",
  }[color]

  const textClass = {
    cyan: "text-cyan",
    emerald: "text-emerald",
    orange: "text-orange",
  }[color]

  return (
    <div
      className={`glass rounded-xl p-6 border ${borderClass} transition-all duration-300 hover:scale-[1.02]`}
    >
      <div className={`font-display text-3xl sm:text-4xl font-bold ${textClass} mb-2`}>
        {value}
      </div>
      <div className="text-sm text-muted-foreground">{label}</div>
    </div>
  )
}
