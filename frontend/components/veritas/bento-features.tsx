"use client"

import { ArrowRight, CheckCircle2, Database, Cpu } from "lucide-react"
import { CategoryMetrics, SummaryMetrics } from "@/lib/convex-data"

type BentoFeaturesProps = {
  categories: CategoryMetrics[]
  summary: SummaryMetrics | null
}

function formatPercent(value: number) {
  return `${(value * 100).toFixed(1)}%`
}

export function BentoFeatures({ categories, summary }: BentoFeaturesProps) {
  const topCategories = [...categories].sort((a, b) => b.avg_delta - a.avg_delta).slice(0, 4)
  const citationAccuracy = summary?.citation_accuracy ?? 0
  const avgSensoNcs = summary?.avg_senso_ncs ?? 0
  const avgBaselineNcs = summary?.avg_baseline_ncs ?? 0

  return (
    <section className="py-24 px-6">
      <div className="max-w-6xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-foreground mb-4">
            Built for <span className="text-cyan">Production</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Enterprise-grade features designed for real-world financial
            compliance workloads.
          </p>
        </div>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Large - Ingestion Analytics */}
          <div className="sm:col-span-2 lg:col-span-2 lg:row-span-2 glass rounded-2xl p-6 border border-border hover:border-cyan/30 transition-all duration-300 hover:scale-[1.01] group">
            <div className="h-full flex flex-col">
              <div className="flex items-center gap-2 mb-4">
                <div className="p-2 rounded-lg bg-cyan/10">
                  <Database className="h-5 w-5 text-cyan" />
                </div>
                <h3 className="font-display text-lg font-semibold text-foreground">
                  Ingestion Analytics
                </h3>
              </div>

              <p className="text-sm text-muted-foreground mb-6">
                Real-time vector search accuracy monitoring with semantic
                similarity scoring across your compliance document corpus.
              </p>

              {/* Gauge Visualization */}
              <div className="flex-1 flex items-center justify-center">
                <div className="relative w-48 h-48">
                  {/* Background circle */}
                  <svg className="w-full h-full -rotate-90">
                    <circle
                      cx="96"
                      cy="96"
                      r="80"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="12"
                      className="text-secondary"
                    />
                    <circle
                      cx="96"
                      cy="96"
                      r="80"
                      fill="none"
                      stroke="url(#gaugeGradient)"
                      strokeWidth="12"
                      strokeLinecap="round"
                      strokeDasharray="502"
                      strokeDashoffset="75"
                      className="drop-shadow-[0_0_10px_rgba(0,240,255,0.5)]"
                    />
                    <defs>
                      <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#00F0FF" />
                        <stop offset="100%" stopColor="#2AC78A" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="font-display text-4xl font-bold text-cyan">
                      {formatPercent(citationAccuracy)}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      Citation Accuracy
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t border-border">
                <div>
                  <div className="font-mono text-sm text-emerald font-semibold">
                    {formatPercent(avgSensoNcs)}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Avg Senso NCS
                  </div>
                </div>
                <div>
                  <div className="font-mono text-sm text-cyan font-semibold">
                    {formatPercent(avgBaselineNcs)}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Avg Baseline NCS
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: Medium - Adversarial Audit */}
          <div className="sm:col-span-2 lg:col-span-2 glass rounded-2xl p-6 border border-border hover:border-emerald/30 transition-all duration-300 hover:scale-[1.01]">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 rounded-lg bg-emerald/10">
                <CheckCircle2 className="h-5 w-5 text-emerald" />
              </div>
              <h3 className="font-display text-lg font-semibold text-foreground">
                Adversarial Audit
              </h3>
            </div>

            <p className="text-sm text-muted-foreground mb-4">
              Complex financial queries successfully resolved through Senso
              integration.
            </p>

            <div className="space-y-2">
              {topCategories.map((row) => (
                <div
                  key={row.category}
                  className="flex items-center gap-3 p-3 rounded-lg bg-secondary/30 group/item hover:bg-secondary/50 transition-colors cursor-pointer"
                >
                  <CheckCircle2 className="h-4 w-4 text-emerald flex-shrink-0" />
                  <span className="text-sm text-foreground truncate">
                    {row.category}: {formatPercent(row.avg_delta)} lift
                  </span>
                  <ArrowRight className="h-4 w-4 text-muted-foreground ml-auto opacity-0 group-hover/item:opacity-100 transition-opacity" />
                </div>
              ))}
              {topCategories.length === 0 && (
                <div className="text-sm text-muted-foreground p-3 rounded-lg bg-secondary/30">
                  Category metrics will appear after a completed run.
                </div>
              )}
            </div>
          </div>

          {/* Card 3: Small - System Architecture */}
          <div className="glass rounded-2xl p-6 border border-border hover:border-cyan/30 transition-all duration-300 hover:scale-[1.01]">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 rounded-lg bg-cyan/10">
                <Cpu className="h-5 w-5 text-cyan" />
              </div>
              <h3 className="font-display text-lg font-semibold text-foreground">
                Architecture
              </h3>
            </div>

            {/* Simple Flow Diagram */}
            <div className="flex items-center justify-between gap-2 py-4">
              <div className="flex flex-col items-center gap-1">
                <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center">
                  <span className="text-xs font-mono text-foreground">User</span>
                </div>
              </div>

              <div className="flex-1 h-px bg-gradient-to-r from-secondary via-cyan to-secondary" />

              <div className="flex flex-col items-center gap-1">
                <div className="w-12 h-10 rounded-lg bg-cyan/20 border border-cyan/30 flex items-center justify-center cyan-glow">
                  <span className="text-[10px] font-mono text-cyan font-semibold">
                    Veritas
                  </span>
                </div>
              </div>

              <div className="flex-1 h-px bg-gradient-to-r from-secondary via-emerald to-secondary" />

              <div className="flex flex-col items-center gap-1">
                <div className="w-12 h-10 rounded-lg bg-emerald/20 border border-emerald/30 flex items-center justify-center emerald-glow">
                  <span className="text-[10px] font-mono text-emerald font-semibold">
                    Senso
                  </span>
                </div>
              </div>
            </div>

            <div className="text-xs text-muted-foreground text-center">
              Request → Context Layer → Response
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
