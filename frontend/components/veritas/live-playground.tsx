"use client"

import { useState } from "react"
import {
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  FileText,
  Loader2,
  Send,
  Terminal,
} from "lucide-react"
import { Button } from "@/components/ui/button"

type PlaygroundResult = {
  query: string
  baseline_response: string
  senso_response: string
  senso_citations: string[]
  latency_ms: number
}

const SOURCE_DOCS = [
  {
    name: "SOP 50 10 8 — SBA Lending Rules",
    description: "Current SBA 7(a) & 504 program rules, effective June 2025",
    file: "SOP 50 10 8 Technical Updates effective 6.1.2025.pdf",
  },
  {
    name: "TILA & Regulation Z",
    description: "Consumer credit protection & compliance overview",
    file: "Truth in Lending Act (TILA) & Regulation Z (Reg Z)_ Consumer Credit Protection & Compliance Overview.pdf",
  },
  {
    name: "First National CU — Rate Sheet Q1 2025",
    description: "Internal lending rates, LTV adjustments, credit tiers",
    file: "First National Credit Union — Internal Rate Sheet Q1 2025.pdf",
  },
  {
    name: "Federal Funds Rate (FRED)",
    description: "Fed funds effective rate data from St. Louis Fed",
    file: "Federal Funds Effective Rate (FEDFUNDS) _ FRED _ St. Louis Fed.pdf",
  },
  {
    name: "SBA 504 Loan Program",
    description: "504 loan structure, eligibility, and fixed-rate terms",
    file: "504 loans _ U.S. Small Business Administration.pdf",
  },
]

const SAMPLE_QUERIES = [
  "What is the maximum SBA 7(a) loan amount I can get?",
  "Are there prepayment penalties on SBA loans?",
  "What is the current Prime Rate for SBA loan pricing?",
  "Can I use an SBA 504 loan for working capital?",
]

export function LivePlayground() {
  const [query, setQuery] = useState("Is the SBA 7(a) guarantee fee waived for all small businesses in 2025?")
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<PlaygroundResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async () => {
    const trimmed = query.trim()
    if (trimmed.length < 5 || isLoading) return

    setIsLoading(true)
    setError(null)
    setResult(null)

    try {
      const res = await fetch("/api/playground", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: trimmed }),
      })

      if (res.status === 429) {
        setError("Rate limit exceeded. Please wait a moment before trying again.")
        return
      }

      const data = await res.json()

      if (!res.ok) {
        setError(data.detail ?? "Something went wrong. Please try again.")
        return
      }

      setResult(data)
    } catch {
      setError("Network error. Could not reach the server.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  return (
    <section className="relative px-6 py-12">
      <div className="max-w-6xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-6">
            <Terminal className="h-3.5 w-3.5 text-cyan" />
            <span className="text-sm text-muted-foreground">
              Interactive Demo
            </span>
          </div>
          <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-[-0.04em] text-foreground mb-4">
            Live Playground
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
            Type any financial compliance question and watch Senso outperform the
            raw baseline in real time.
          </p>
        </div>

        {/* Source Docs + Input Side-by-Side */}
        <div className="flex flex-col lg:flex-row gap-4 lg:gap-6 mb-2">

        {/* Source Documents - Left on desktop, top horizontal scroll on mobile */}
        <div className="flex flex-col glass rounded-2xl border border-border/50 p-4 lg:w-56 lg:shrink-0">
          <div className="flex items-center gap-2 mb-3">
            <FileText className="h-3.5 w-3.5 text-cyan" />
            <span className="font-mono text-[10px] font-semibold text-cyan uppercase tracking-wider">
              Sources
            </span>
          </div>
          <div className="flex lg:flex-col gap-2 lg:gap-1.5 overflow-x-auto lg:overflow-x-visible pb-1 lg:pb-0">
            {SOURCE_DOCS.map((doc) => (
              <a
                key={doc.file}
                href={`/docs/${doc.file}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs text-muted-foreground hover:text-cyan hover:bg-cyan/5 transition-colors group whitespace-nowrap lg:whitespace-normal shrink-0 lg:shrink"
              >
                <FileText className="h-3 w-3 shrink-0 opacity-60 group-hover:opacity-100" />
                <span className="truncate">{doc.name}</span>
                <ExternalLink className="h-2.5 w-2.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity ml-auto" />
              </a>
            ))}
          </div>
        </div>

        {/* Input Area */}
        <div className="glass rounded-2xl border border-cyan/20 p-6 flex-1">
          <div className="flex items-start gap-4">
            <span className="font-mono text-cyan text-sm mt-3 select-none hidden sm:block">
              {">_"}
            </span>
            <textarea
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Enter a custom compliance query..."
              rows={2}
              className="flex-1 bg-transparent border-none outline-none resize-none font-mono text-sm text-foreground placeholder:text-muted-foreground/50 py-2"
              disabled={isLoading}
            />
            <Button
              onClick={handleSubmit}
              disabled={isLoading || query.trim().length < 5}
              className="bg-cyan text-background hover:bg-cyan/90 px-6 py-5 font-semibold shrink-0"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Run
                </>
              )}
            </Button>
          </div>

          {/* Sample Queries */}
          <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-border/30">
            <span className="text-xs text-muted-foreground/60 mr-1 mt-1">
              Try:
            </span>
            {SAMPLE_QUERIES.map((sample) => (
              <button
                key={sample}
                onClick={() => {
                  setQuery(sample)
                  setResult(null)
                  setError(null)
                }}
                className="text-xs px-3 py-1.5 rounded-full glass border border-border/50 text-muted-foreground hover:text-cyan hover:border-cyan/30 transition-colors cursor-pointer"
                disabled={isLoading}
              >
                {sample.length > 50 ? sample.slice(0, 50) + "..." : sample}
              </button>
            ))}
          </div>
        </div>

        </div>

        <p className="text-xs text-foreground font-mono text-center mb-8 mt-2">
          runs on vibes and a free tier — don't go crazy :)
        </p>

        {/* Error State */}
        {error && (
          <div className="glass rounded-2xl border border-red-500/30 p-5 mb-8">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-red-400 shrink-0" />
              <p className="text-sm text-red-400">{error}</p>
            </div>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="grid md:grid-cols-2 gap-6">
            {/* Baseline Skeleton */}
            <div className="glass rounded-2xl overflow-hidden border-2 border-orange/30">
              <div className="flex items-center gap-3 px-5 py-4 border-b border-border bg-orange/10">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-orange/60" />
                  <div className="w-3 h-3 rounded-full bg-muted" />
                  <div className="w-3 h-3 rounded-full bg-muted" />
                </div>
                <span className="font-mono text-xs font-semibold text-orange uppercase tracking-wider">
                  Raw Baseline
                </span>
              </div>
              <div className="p-5 space-y-3">
                <div className="flex items-center gap-3 text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm font-mono">Querying LLM...</span>
                </div>
                <div className="space-y-2">
                  <div className="h-4 rounded bg-muted/30 animate-pulse w-full" />
                  <div className="h-4 rounded bg-muted/30 animate-pulse w-5/6" />
                  <div className="h-4 rounded bg-muted/30 animate-pulse w-4/6" />
                </div>
              </div>
            </div>
            {/* Senso Skeleton */}
            <div className="glass rounded-2xl overflow-hidden border-2 border-emerald/30">
              <div className="flex items-center gap-3 px-5 py-4 border-b border-border bg-emerald/10">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-emerald" />
                  <div className="w-3 h-3 rounded-full bg-emerald/60" />
                  <div className="w-3 h-3 rounded-full bg-emerald/30" />
                </div>
                <span className="font-mono text-xs font-semibold text-emerald uppercase tracking-wider">
                  Senso API
                </span>
              </div>
              <div className="p-5 space-y-3">
                <div className="flex items-center gap-3 text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm font-mono">Querying Senso API...</span>
                </div>
                <div className="space-y-2">
                  <div className="h-4 rounded bg-muted/30 animate-pulse w-full" />
                  <div className="h-4 rounded bg-muted/30 animate-pulse w-5/6" />
                  <div className="h-4 rounded bg-muted/30 animate-pulse w-4/6" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Results */}
        {result && !isLoading && (
          <div className="space-y-4">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Baseline Card */}
              <div className="glass rounded-2xl overflow-hidden border-2 border-orange/30 shadow-lg shadow-orange/5">
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
                <div className="p-5 space-y-4">
                  <div className="font-mono text-xs text-muted-foreground bg-orange/5 p-3 rounded-lg border border-orange/10">
                    <span className="text-orange font-bold mr-2">QUERY:</span>
                    {result.query}
                  </div>
                  <div className="text-sm text-muted-foreground leading-relaxed max-h-[400px] overflow-y-auto whitespace-pre-wrap">
                    {result.baseline_response}
                  </div>
                  <div className="flex items-center gap-2 pt-4 border-t border-border/50">
                    <div className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest">
                      Sources: <span className="text-orange">None cited</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Senso Card */}
              <div className="glass rounded-2xl overflow-hidden border-2 border-emerald/30 shadow-lg shadow-emerald/5">
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
                <div className="p-5 space-y-4">
                  <div className="font-mono text-xs text-muted-foreground bg-emerald/5 p-3 rounded-lg border border-emerald/10">
                    <span className="text-emerald font-bold mr-2">QUERY:</span>
                    {result.query}
                  </div>
                  <div className="text-sm text-foreground leading-relaxed max-h-[400px] overflow-y-auto whitespace-pre-wrap">
                    {result.senso_response}
                  </div>

                  {/* Citations */}
                  {result.senso_citations.length > 0 && (
                    <div className="flex items-start gap-2 p-3 rounded-lg bg-emerald/5 border border-emerald/20">
                      <CheckCircle2 className="h-4 w-4 text-emerald mt-0.5 flex-shrink-0" />
                      <div className="text-xs text-emerald space-y-1 min-w-0">
                        <span className="font-bold">
                          Verified with {result.senso_citations.length} source
                          {result.senso_citations.length > 1 ? "s" : ""}:
                        </span>
                        {result.senso_citations.slice(0, 3).map((cite, i) => (
                          <p
                            key={i}
                            className="font-mono text-emerald/80 truncate"
                          >
                            {cite}
                          </p>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-2 pt-4 border-t border-border/50">
                    <div className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest">
                      Sources:{" "}
                      <span className="text-emerald">
                        {result.senso_citations.length > 0
                          ? `${result.senso_citations.length} cited`
                          : "Knowledge Base"}
                      </span>
                    </div>
                    <div className="h-3 w-px bg-border/50" />
                    <div className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest">
                      Latency:{" "}
                      <span className="text-cyan">
                        {(result.latency_ms / 1000).toFixed(1)}s
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
