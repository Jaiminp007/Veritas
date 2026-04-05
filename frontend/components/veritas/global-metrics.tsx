"use client"

import { SummaryMetrics } from "@/lib/convex-data"
import { BarChart3, Zap, ShieldAlert, Target } from "lucide-react"

type GlobalMetricsProps = {
  summary: SummaryMetrics | null
}

function formatPercent(value: number) {
  return `${(value * 100).toFixed(1)}%`
}

export function GlobalMetrics({ summary }: GlobalMetricsProps) {
  if (!summary) return null

  const metrics = [
    {
      label: "Avg Senso NCS",
      value: formatPercent(summary.avg_senso_ncs),
      description: "Narrative Control Score (Senso)",
      icon: Target,
      color: "text-emerald",
      bg: "bg-emerald/10",
      border: "border-emerald/20",
    },
    {
      label: "Performance Lift",
      value: `+${formatPercent(summary.avg_delta)}`,
      description: "Improvement over baseline LLM",
      icon: Zap,
      color: "text-cyan",
      bg: "bg-cyan/10",
      border: "border-cyan/20",
    },
    {
      label: "Baseline Hallucination Rate",
      value: formatPercent(summary.hallucination_rate_baseline),
      description: "Ungrounded claims in raw LLM",
      icon: ShieldAlert,
      color: "text-orange",
      bg: "bg-orange/10",
      border: "border-orange/20",
    },
    {
      label: "Senso Hallucination Rate",
      value: formatPercent(summary.hallucination_rate_senso),
      description: "Post-Senso verification rate",
      icon: ShieldAlert,
      color: "text-emerald",
      bg: "bg-emerald/10",
      border: "border-emerald/20",
    },
  ]

  return (
    <section className="pb-12 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {metrics.map((metric) => (
            <div
              key={metric.label}
              className={`p-6 rounded-2xl glass border ${metric.border} hover:scale-[1.02] transition-all duration-300`}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className={`p-2 rounded-lg ${metric.bg}`}>
                  <metric.icon className={`h-5 w-5 ${metric.color}`} />
                </div>
                <span className="text-xs font-mono text-muted-foreground uppercase tracking-widest">
                  {metric.label}
                </span>
              </div>
              <div className={`text-3xl font-display font-bold ${metric.color} mb-1`}>
                {metric.value}
              </div>
              <p className="text-xs text-muted-foreground">
                {metric.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
