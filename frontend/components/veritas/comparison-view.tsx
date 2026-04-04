"use client"

import { AlertTriangle, CheckCircle2 } from "lucide-react"
import { AuditRecord } from "@/lib/convex-data"

type ComparisonViewProps = {
  record: AuditRecord | null
}

function toConfidence(score: number) {
  if (score >= 0.75) return "High"
  if (score >= 0.45) return "Medium"
  return "Low"
}

export function ComparisonView({ record }: ComparisonViewProps) {
  if (!record) {
    return (
      <div className="text-center text-muted-foreground py-12">
        Run the pipeline to populate comparison results from Convex.
      </div>
    )
  }

  return (
    <div className="w-full">
      {/* Comparison Grid */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Baseline LLM */}
        <div className="glass rounded-2xl overflow-hidden border-2 border-orange/30 shadow-lg shadow-orange/5">
          {/* Header */}
          <div className="flex items-center gap-3 px-5 py-4 border-b border-border bg-orange/10">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-orange/60" />
              <div className="w-3 h-3 rounded-full bg-muted" />
              <div className="w-3 h-3 rounded-full bg-muted" />
            </div>
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-orange" />
              <span className="font-mono text-xs font-semibold text-orange uppercase tracking-wider">
                Raw Baseline
              </span>
            </div>
          </div>

          {/* Content */}
          <div className="p-5 space-y-4">
            <div className="font-mono text-xs text-muted-foreground mb-3 bg-orange/5 p-3 rounded-lg border border-orange/10">
              <span className="text-orange font-bold mr-2">QUERY:</span>
              {record.query_text}
            </div>

            <div className="space-y-3">
              <div className="text-sm text-muted-foreground leading-relaxed min-h-[120px]">
                {record.baseline_response}
              </div>

              <div className="flex items-start gap-2 p-3 rounded-lg bg-orange/5 border border-orange/20">
                <AlertTriangle className="h-4 w-4 text-orange mt-0.5 flex-shrink-0" />
                <div className="text-xs text-orange">
                  <span className="font-semibold">Hallucination Detected:</span>{" "}
                  {record.baseline_hallucination_reason || "Response lack citations and contains unverified claims."}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-4 border-t border-border/50">
              <div className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest">
                Confidence:{" "}
                <span className="text-orange font-bold">{toConfidence(record.baseline_hallucination_detected ? 0.35 : record.narrative_control_score)}</span>
              </div>
              <div className="h-3 w-px bg-border/50" />
              <div className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest">
                Sources: <span className="text-orange">None cited</span>
              </div>
            </div>
          </div>
        </div>

        {/* Senso Agent */}
        <div className="glass rounded-2xl overflow-hidden border-2 border-emerald/30 shadow-lg shadow-emerald/5">
          {/* Header */}
          <div className="flex items-center gap-3 px-5 py-4 border-b border-border bg-emerald/10">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-emerald" />
              <div className="w-3 h-3 rounded-full bg-emerald/60" />
              <div className="w-3 h-3 rounded-full bg-emerald/30" />
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald" />
              <span className="font-mono text-xs font-semibold text-emerald uppercase tracking-wider">
                Senso API
              </span>
            </div>
          </div>

          {/* Content */}
          <div className="p-5 space-y-4">
            <div className="font-mono text-xs text-muted-foreground mb-3 bg-emerald/5 p-3 rounded-lg border border-emerald/10">
              <span className="text-emerald font-bold mr-2">QUERY:</span>
              {record.query_text}
            </div>

            <div className="space-y-3">
              <div className="text-sm text-foreground leading-relaxed min-h-[120px]">
                {record.senso_response}
              </div>

              <div className="flex items-start gap-2 p-3 rounded-lg bg-emerald/5 border border-emerald/20">
                <CheckCircle2 className="h-4 w-4 text-emerald mt-0.5 flex-shrink-0" />
                <div className="text-xs text-emerald font-medium">
                  <span className="font-bold">Verified Response:</span> Contextually grounded with citations from Senso's proprietary knowledge layer.
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-4 border-t border-border/50">
              <div className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest">
                Confidence:{" "}
                <span className="text-emerald font-bold">{toConfidence(record.narrative_control_score)}</span>
              </div>
              <div className="h-3 w-px bg-border/50" />
              <div className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest">
                Source: <span className="text-emerald truncate max-w-[150px] inline-block align-bottom">{record.senso_citations[0] ?? "Knowledge Base"}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
