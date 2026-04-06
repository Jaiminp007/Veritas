"use client"

import { SummaryMetrics } from "@/lib/convex-data"
import { Zap, ShieldAlert, Target } from "lucide-react"
import { useCountUp, useFadeIn } from "@/hooks/use-count-up"

type GlobalMetricsProps = {
  summary: SummaryMetrics | null
}

export function GlobalMetrics({ summary }: GlobalMetricsProps) {
  if (!summary) return null

  const metrics = [
    {
      label: "Avg Senso NCS",
      target: summary.avg_senso_ncs * 100,
      format: (v: number) => `${v.toFixed(1)}%`,
      description: "Narrative Control Score (Senso)",
      icon: Target,
      color: "text-emerald",
      bg: "bg-emerald/10",
      border: "border-emerald/20",
    },
    {
      label: "Performance Lift",
      target: summary.avg_delta * 100,
      format: (v: number) => `+${v.toFixed(1)}%`,
      description: "Improvement over baseline LLM",
      icon: Zap,
      color: "text-cyan",
      bg: "bg-cyan/10",
      border: "border-cyan/20",
    },
    {
      label: "Baseline Hallucination Rate",
      target: summary.hallucination_rate_baseline * 100,
      format: (v: number) => `${v.toFixed(1)}%`,
      description: "Ungrounded claims in raw LLM",
      icon: ShieldAlert,
      color: "text-orange",
      bg: "bg-orange/10",
      border: "border-orange/20",
    },
    {
      label: "Senso Hallucination Rate",
      target: summary.hallucination_rate_senso * 100,
      format: (v: number) => `${v.toFixed(1)}%`,
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
          {metrics.map((metric, i) => (
            <MetricCard key={metric.label} metric={metric} delay={i * 100} />
          ))}
        </div>
      </div>
    </section>
  )
}

function MetricCard({
  metric,
  delay,
}: {
  metric: {
    label: string
    target: number
    format: (v: number) => string
    description: string
    icon: React.ComponentType<{ className?: string }>
    color: string
    bg: string
    border: string
  }
  delay: number
}) {
  const { value, ref: countRef } = useCountUp(metric.target, 1000, 1)
  const { ref: fadeRef, visible } = useFadeIn(delay)

  return (
    <div
      ref={(el) => {
        (countRef as React.MutableRefObject<HTMLDivElement | null>).current = el;
        (fadeRef as React.MutableRefObject<HTMLDivElement | null>).current = el;
      }}
      className={`p-6 rounded-2xl glass border ${metric.border} hover:scale-[1.02] transition-all duration-700 ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
      }`}
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
        {metric.format(value)}
      </div>
      <p className="text-xs text-muted-foreground">
        {metric.description}
      </p>
    </div>
  )
}
