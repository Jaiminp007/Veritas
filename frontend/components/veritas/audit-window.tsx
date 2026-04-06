"use client"

import { CheckCircle2, Clock, AlertCircle } from "lucide-react"
import { AuditRecord } from "@/lib/convex-data"

type AuditWindowProps = {
  records: AuditRecord[]
}

function formatLatency(ms: number) {
  return `${Math.round(ms)}ms`
}

function statusLabel(record: AuditRecord) {
  return record.senso_hallucination_detected ? "flagged" : "verified"
}

export function AuditWindow({ records }: AuditWindowProps) {
  return (
    <section className="py-24 px-6">
      <div className="max-w-5xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-foreground mb-4">
            Real-Time <span className="text-cyan">Audit Log</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Live benchmark traces showing every query processed through the
            Senso Context Layer.
          </p>
        </div>

        {/* macOS-style Window */}
        <div
          className="glass rounded-2xl overflow-hidden border border-border"
          style={{
            transform: "perspective(1000px) rotateX(2deg)",
            transformOrigin: "center bottom",
          }}
        >
          {/* Window Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-secondary/50 border-b border-border">
            <div className="flex items-center gap-2">
              <div className="flex gap-2">
                <div className="w-3 h-3 rounded-full bg-[#FF5F57]" />
                <div className="w-3 h-3 rounded-full bg-[#FEBC2E]" />
                <div className="w-3 h-3 rounded-full bg-[#28C840]" />
              </div>
            </div>
            <div className="font-mono text-xs text-muted-foreground">
              Senso API Audit Log
            </div>
            <div className="w-16" />
          </div>

          {/* Scrollable Table */}
          <div className="overflow-x-auto">
            <div className="min-w-[640px]">
              {/* Table Header */}
              <div className="grid grid-cols-12 gap-4 px-6 py-3 bg-secondary/30 border-b border-border text-xs font-mono uppercase tracking-wider text-muted-foreground">
                <div className="col-span-3">Request ID</div>
                <div className="col-span-3">Category</div>
                <div className="col-span-2">Latency</div>
                <div className="col-span-2">Accuracy</div>
                <div className="col-span-2">Status</div>
              </div>

              {/* Table Body */}
              <div className="divide-y divide-border">
                {records.map((record, index) => (
                  <div
                    key={record._id}
                    className={`grid grid-cols-12 gap-4 px-6 py-4 hover:bg-secondary/20 transition-colors ${
                      index === 0 ? "bg-cyan/5" : ""
                    }`}
                  >
                    <div className="col-span-3 font-mono text-sm text-cyan">
                      {record.query_id || record._id.slice(-8)}
                    </div>
                    <div className="col-span-3 text-sm text-foreground">
                      {record.category}
                    </div>
                    <div className="col-span-2 font-mono text-sm text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatLatency(record.latency_ms)}
                    </div>
                    <div className="col-span-2">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-secondary rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${record.narrative_control_score >= 0.5 ? "bg-emerald" : "bg-orange"}`}
                            style={{ width: `${Math.round(record.narrative_control_score * 100)}%` }}
                          />
                        </div>
                        <span className="font-mono text-xs text-emerald">
                          {Math.round(record.narrative_control_score * 100)}%
                        </span>
                      </div>
                    </div>
                    <div className="col-span-2">
                      {statusLabel(record) === "verified" ? (
                        <div className="flex items-center gap-1 text-emerald text-sm">
                          <CheckCircle2 className="h-4 w-4" />
                          <span>Verified</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 text-yellow-500 text-sm">
                          <AlertCircle className="h-4 w-4" />
                          <span>Flagged</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {records.length === 0 && (
                  <div className="px-6 py-8 text-sm text-muted-foreground text-center">
                    No benchmark records available yet.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Window Footer */}
          <div className="px-6 py-3 bg-secondary/30 border-t border-border flex items-center justify-between">
            <div className="font-mono text-xs text-muted-foreground">
              Showing {Math.min(10, records.length)} of {records.length.toLocaleString()} traces
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald animate-pulse" />
              <span className="font-mono text-xs text-emerald">
                Convex Synced
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
