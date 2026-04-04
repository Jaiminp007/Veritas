"use client"

import { useState } from "react"
import { AuditRecord } from "@/lib/convex-data"
import { ComparisonView } from "./comparison-view"
import { CheckCircle2, AlertTriangle, Search, ChevronRight, BarChart3 } from "lucide-react"
import { cn } from "@/lib/utils"

type ComparisonBrowserProps = {
  records: AuditRecord[]
}

export function ComparisonBrowser({ records }: ComparisonBrowserProps) {
  const [selectedId, setSelectedId] = useState<string | null>(
    records.sort((a, b) => b.ncs_delta - a.ncs_delta)[0]?._id ?? null
  )
  const [searchQuery, setSearchQuery] = useState("")

  const selectedRecord = records.find((r) => r._id === selectedId) ?? null

  const filteredRecords = records.filter((r) =>
    r.query_text.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.category.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="flex flex-col lg:flex-row min-h-[800px] border-t border-border/40">
      {/* Sidebar: Query List */}
      <div className="w-full lg:w-[400px] border-r border-border/40 bg-background/50 backdrop-blur-sm flex flex-col">
        <div className="p-6 border-b border-border/40">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Filter by query or category..."
              className="w-full pl-10 pr-4 py-2 bg-secondary/50 border border-border/50 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-cyan/50 transition-all"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex items-center justify-between mt-4 px-1">
            <span className="text-xs font-mono text-muted-foreground uppercase tracking-widest">
              {filteredRecords.length} Queries Found
            </span>
            <div className="flex gap-2">
               <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-emerald" />
                  <span className="text-[10px] text-muted-foreground uppercase">Verified</span>
               </div>
               <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-orange" />
                  <span className="text-[10px] text-muted-foreground uppercase">Hallucinated</span>
               </div>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1">
          {filteredRecords.map((record) => (
            <button
              key={record._id}
              onClick={() => setSelectedId(record._id)}
              className={cn(
                "w-full text-left p-4 rounded-xl transition-all duration-200 group relative",
                selectedId === record._id
                  ? "bg-cyan/5 border border-cyan/20 ring-1 ring-cyan/20"
                  : "hover:bg-white/5 border border-transparent"
              )}
            >
              <div className="flex items-start gap-3">
                <div className={cn(
                  "mt-1 flex-shrink-0 w-2 h-2 rounded-full",
                  record.baseline_hallucination_detected ? "bg-orange" : "bg-emerald"
                )} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-mono text-cyan/70 uppercase tracking-tighter truncate">
                      {record.category}
                    </span>
                    <span className={cn(
                      "text-[10px] font-mono",
                      record.ncs_delta > 0 ? "text-emerald" : "text-muted-foreground"
                    )}>
                      +{Math.round(record.ncs_delta * 100)}% NCS
                    </span>
                  </div>
                  <p className={cn(
                    "text-sm leading-snug line-clamp-2",
                    selectedId === record._id ? "text-foreground font-medium" : "text-muted-foreground group-hover:text-foreground"
                  )}>
                    {record.query_text}
                  </p>
                </div>
                <ChevronRight className={cn(
                  "h-4 w-4 mt-1 transition-transform",
                  selectedId === record._id ? "text-cyan translate-x-1" : "text-muted-foreground opacity-0 group-hover:opacity-100"
                )} />
              </div>
            </button>
          ))}
          {filteredRecords.length === 0 && (
             <div className="p-8 text-center">
                <BarChart3 className="h-8 w-8 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">No queries match your search.</p>
             </div>
          )}
        </div>
      </div>

      {/* Main Content: Comparison View */}
      <div className="flex-1 bg-background overflow-y-auto">
        <div className="p-6 md:p-12 max-w-5xl mx-auto">
           {selectedRecord ? (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex items-center gap-3 mb-8">
                   <div className="px-3 py-1 rounded-full bg-cyan/10 border border-cyan/20 text-cyan text-[10px] font-mono uppercase tracking-widest">
                      Detail View
                   </div>
                   <div className="h-px flex-1 bg-border/40" />
                   <div className="text-xs text-muted-foreground font-mono">
                      Query ID: {selectedRecord.query_id}
                   </div>
                </div>
                
                <ComparisonView record={selectedRecord} />
                
                {/* Detailed Stats */}
                <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-6">
                   <div className="p-6 rounded-2xl glass border border-border/50">
                      <div className="text-xs text-muted-foreground uppercase tracking-widest mb-2">Impact Score</div>
                      <div className="text-2xl font-display font-bold text-cyan">
                         +{Math.round(selectedRecord.ncs_delta * 100)}%
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-2">
                         Improvement in Narrative Control Score over baseline LLM.
                      </p>
                   </div>
                   <div className="p-6 rounded-2xl glass border border-border/50">
                      <div className="text-xs text-muted-foreground uppercase tracking-widest mb-2">Latency</div>
                      <div className="text-2xl font-display font-bold text-foreground">
                         {selectedRecord.latency_ms}ms
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-2">
                         Total round-trip time for Senso API response.
                      </p>
                   </div>
                   <div className="p-6 rounded-2xl glass border border-border/50">
                      <div className="text-xs text-muted-foreground uppercase tracking-widest mb-2">Citation Status</div>
                      <div className="text-2xl font-display font-bold text-emerald">
                         {selectedRecord.senso_citations.length > 0 ? "Verified" : "Missing"}
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-2">
                         {selectedRecord.senso_citations.length > 0 ? "Grounded in official PDF documentation." : "No specific citation found in docs."}
                      </p>
                   </div>
                </div>
              </div>
           ) : (
              <div className="flex flex-col items-center justify-center h-[600px] text-center">
                 <div className="w-16 h-16 rounded-3xl bg-secondary flex items-center justify-center mb-6">
                    <BarChart3 className="h-8 w-8 text-muted-foreground" />
                 </div>
                 <h3 className="text-xl font-bold mb-2">Select a Query</h3>
                 <p className="text-muted-foreground max-w-xs">
                    Choose any of the 25 benchmark queries from the sidebar to see the side-by-side performance analysis.
                 </p>
              </div>
           )}
        </div>
      </div>
    </div>
  )
}
