import { Header } from "@/components/veritas/header"
import { Footer } from "@/components/veritas/footer"
import { Database, Cpu, Network, Shield, Zap, Layers, FlaskConical, Scale } from "lucide-react"

export const metadata = {
  title: "Architecture | Veritas Benchmark",
  description: "Technical architecture, scoring methodology, and system design of the Veritas benchmark platform.",
}

export default function ArchitecturePage() {
  return (
    <main className="min-h-screen bg-background">
      <Header />

      {/* Page Header */}
      <section className="pt-32 pb-12 px-6">
        <div className="max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-6">
            <Cpu className="h-4 w-4 text-cyan" />
            <span className="text-sm text-muted-foreground">
              System Design
            </span>
          </div>
          <h1 className="font-display text-4xl sm:text-5xl font-bold tracking-tight text-foreground mb-4">
            Technical <span className="text-cyan">Architecture</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            How Veritas integrates with the Senso Context Layer to deliver verified, accurate financial compliance responses.
          </p>
        </div>
      </section>

      {/* Grid Background Wrapper */}
      <div className="relative">
        <div className="absolute inset-0 grid-background pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,oklch(0_0_0)_80%)] pointer-events-none" />
        <div className="relative z-10">
          <SystemDiagram />
          <ScoringMethodology />
          <TechStack />
          <DataFlow />
        </div>
      </div>

      <Footer />
    </main>
  )
}

function SystemDiagram() {
  return (
    <section className="py-16 px-6">
      <div className="max-w-5xl mx-auto">
        <div className="glass rounded-2xl p-8 border border-border">
          <h2 className="font-display text-2xl font-bold text-foreground mb-8 text-center">
            System Overview
          </h2>
          
          {/* Architecture Diagram */}
          <div className="flex flex-col items-center gap-6">
            {/* User Layer */}
            <div className="flex items-center gap-4">
              <div className="glass rounded-xl p-4 border border-border flex items-center gap-3">
                <div className="p-2 rounded-lg bg-secondary">
                  <Network className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <div className="text-sm font-medium text-foreground">Client</div>
                  <div className="text-xs text-muted-foreground">User Query</div>
                </div>
              </div>
            </div>
            
            {/* Arrow Down */}
            <div className="h-8 w-px bg-gradient-to-b from-border via-cyan to-border" />
            
            {/* Veritas Layer */}
            <div className="glass rounded-xl p-6 border-2 border-cyan/30 w-full max-w-[320px]">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg bg-cyan/10">
                  <Layers className="h-5 w-5 text-cyan" />
                </div>
                <div>
                  <div className="text-lg font-semibold text-cyan">Veritas</div>
                  <div className="text-xs text-muted-foreground">Benchmark Orchestrator</div>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-2 rounded-lg bg-secondary/50 text-muted-foreground">Query Parser</div>
                <div className="p-2 rounded-lg bg-secondary/50 text-muted-foreground">Response Validator</div>
                <div className="p-2 rounded-lg bg-secondary/50 text-muted-foreground">Audit Logger</div>
                <div className="p-2 rounded-lg bg-secondary/50 text-muted-foreground">Metrics Engine</div>
              </div>
            </div>
            
            {/* Split Arrows */}
            <div className="flex items-center gap-8 sm:gap-16">
              <div className="flex flex-col items-center">
                <div className="h-6 w-px bg-gradient-to-b from-cyan to-orange" />
                <div className="text-xs text-orange font-mono">baseline</div>
              </div>
              <div className="flex flex-col items-center">
                <div className="h-6 w-px bg-gradient-to-b from-cyan to-emerald" />
                <div className="text-xs text-emerald font-mono">augmented</div>
              </div>
            </div>
            
            {/* LLM Layer */}
            <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-8">
              <div className="glass rounded-xl p-4 border border-orange/30 text-center w-full sm:w-auto">
                <div className="text-sm font-medium text-orange">Raw LLM</div>
                <div className="text-xs text-muted-foreground mt-1">No Context</div>
              </div>
              <div className="glass rounded-xl p-4 border-2 border-emerald/30 text-center w-full sm:w-auto">
                <div className="text-sm font-medium text-emerald">Senso API</div>
                <div className="text-xs text-muted-foreground mt-1">Context Layer</div>
              </div>
            </div>
            
            {/* Arrow to Data */}
            <div className="h-8 w-px bg-gradient-to-b from-emerald via-border to-border" />
            
            {/* Data Layer */}
            <div className="glass rounded-xl p-4 border border-border flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald/10">
                <Database className="h-5 w-5 text-emerald" />
              </div>
              <div>
                <div className="text-sm font-medium text-foreground">Vector Store</div>
                <div className="text-xs text-muted-foreground">1.2M+ Embeddings</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function ScoringMethodology() {
  return (
    <section className="py-16 px-6">
      <div className="max-w-5xl mx-auto">
        <h2 className="font-display text-2xl font-bold text-foreground mb-8 text-center">
          Scoring Methodology
        </h2>

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* NCS Formula */}
          <div className="glass rounded-2xl p-6 border border-cyan/30">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 rounded-lg bg-cyan/10">
                <Scale className="h-5 w-5 text-cyan" />
              </div>
              <h3 className="font-display text-lg font-semibold text-foreground">
                Narrative Control Score (NCS)
              </h3>
            </div>
            <div className="font-mono text-sm bg-secondary/30 p-4 rounded-lg mb-4 text-center">
              <span className="text-cyan">NCS</span>
              <span className="text-muted-foreground"> = </span>
              <span className="text-emerald">&alpha;</span>
              <span className="text-muted-foreground"> &middot; citation_match &minus; </span>
              <span className="text-orange">&beta;</span>
              <span className="text-muted-foreground"> &middot; hallucination_penalty + </span>
              <span className="text-cyan">&delta;</span>
              <span className="text-muted-foreground"> &middot; key_fact_coverage</span>
            </div>
            <div className="space-y-2 text-sm text-muted-foreground">
              <div className="flex justify-between">
                <span><span className="text-emerald font-mono">&alpha;</span> = Citation weight</span>
                <span className="font-mono text-foreground">0.5</span>
              </div>
              <div className="flex justify-between">
                <span><span className="text-orange font-mono">&beta;</span> = Hallucination penalty weight</span>
                <span className="font-mono text-foreground">0.8</span>
              </div>
              <div className="flex justify-between">
                <span><span className="text-cyan font-mono">&delta;</span> = Key fact coverage weight</span>
                <span className="font-mono text-foreground">0.3</span>
              </div>
            </div>
          </div>

          {/* Judge Pipeline */}
          <div className="glass rounded-2xl p-6 border border-emerald/30">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 rounded-lg bg-emerald/10">
                <FlaskConical className="h-5 w-5 text-emerald" />
              </div>
              <h3 className="font-display text-lg font-semibold text-foreground">
                Judge Pipeline
              </h3>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Each response is evaluated by an independent judge LLM against ground truth key facts, then hardened with rule-based checks.
            </p>
            <div className="space-y-2">
              {[
                { label: "Negation-aware overlap", desc: "Detects contradictions, not just keyword matches" },
                { label: "Refusal detection", desc: "Distinguishes honest refusals from lazy non-answers" },
                { label: "Zero-fact penalty", desc: "Flags confident answers that cover no key facts" },
                { label: "Numeric validation", desc: "Ensures specific numbers and percentages are present" },
              ].map((item) => (
                <div key={item.label} className="flex items-start gap-2 text-sm">
                  <Shield className="h-4 w-4 text-emerald mt-0.5 shrink-0" />
                  <div>
                    <span className="text-foreground font-medium">{item.label}</span>
                    <span className="text-muted-foreground"> — {item.desc}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Scoring Breakdown */}
        <div className="glass rounded-2xl p-6 border border-border">
          <h3 className="font-display text-lg font-semibold text-foreground mb-4">
            How Scores Are Computed
          </h3>
          <div className="grid md:grid-cols-3 gap-6 text-sm">
            <div>
              <div className="text-emerald font-semibold mb-2">Citation Match</div>
              <p className="text-muted-foreground">
                Token overlap between Senso citations and ground truth key facts. Threshold: 35%. Baseline gets 0 (no citations available).
              </p>
            </div>
            <div>
              <div className="text-orange font-semibold mb-2">Hallucination Penalty</div>
              <p className="text-muted-foreground">
                0.0 (no issue) to 1.0 (severe). Judge LLM evaluates against key facts, then rule-based hardening catches edge cases the LLM misses.
              </p>
            </div>
            <div>
              <div className="text-cyan font-semibold mb-2">Key Fact Coverage</div>
              <p className="text-muted-foreground">
                Fraction of ground truth facts present in the response. Uses negation-aware matching to catch contradictions. Threshold: 45%.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function TechStack() {
  const technologies = [
    {
      category: "Frontend",
      items: ["Next.js 16", "React 19", "Tailwind CSS", "TypeScript"],
      color: "cyan",
    },
    {
      category: "Backend",
      items: ["FastAPI", "Senso API", "GitHub Models (GPT-4o-mini)", "Convex"],
      color: "emerald",
    },
    {
      category: "Infrastructure",
      items: ["Vercel", "Render", "Convex Cloud", "GitHub Actions"],
      color: "orange",
    },
  ]

  return (
    <section className="py-16 px-6">
      <div className="max-w-5xl mx-auto">
        <h2 className="font-display text-2xl font-bold text-foreground mb-8 text-center">
          Tech Stack
        </h2>
        
        <div className="grid md:grid-cols-3 gap-6">
          {technologies.map((tech) => (
            <div key={tech.category} className="glass rounded-2xl p-6 border border-border">
              <h3 className={`font-display text-lg font-semibold mb-4 ${
                tech.color === "cyan" ? "text-cyan" : 
                tech.color === "emerald" ? "text-emerald" : "text-orange"
              }`}>
                {tech.category}
              </h3>
              <ul className="space-y-2">
                {tech.items.map((item) => (
                  <li key={item} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <div className={`w-1.5 h-1.5 rounded-full ${
                      tech.color === "cyan" ? "bg-cyan" : 
                      tech.color === "emerald" ? "bg-emerald" : "bg-orange"
                    }`} />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function DataFlow() {
  const steps = [
    {
      icon: Network,
      title: "Query Ingestion",
      description: "User submits a financial compliance query through the Veritas interface.",
    },
    {
      icon: Layers,
      title: "Dual Processing",
      description: "Query is sent to both raw LLM baseline and Senso-augmented pipeline simultaneously.",
    },
    {
      icon: Database,
      title: "Context Retrieval",
      description: "Senso API retrieves relevant regulatory documents from vector embeddings.",
    },
    {
      icon: Shield,
      title: "Response Validation",
      description: "Both responses are evaluated for accuracy, hallucinations, and source citations.",
    },
    {
      icon: Zap,
      title: "Metrics Logging",
      description: "Performance metrics, latency, and accuracy scores are logged to the audit trail.",
    },
  ]

  return (
    <section className="py-16 px-6">
      <div className="max-w-5xl mx-auto">
        <h2 className="font-display text-2xl font-bold text-foreground mb-8 text-center">
          Data Flow
        </h2>
        
        <div className="relative">
          {/* Connection Line */}
          <div className="absolute left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-cyan via-emerald to-orange hidden md:block" />
          
          <div className="space-y-8">
            {steps.map((step, index) => (
              <div key={step.title} className={`flex items-center gap-8 ${
                index % 2 === 0 ? "md:flex-row" : "md:flex-row-reverse"
              }`}>
                <div className={`flex-1 ${index % 2 === 0 ? "md:text-right" : "md:text-left"}`}>
                  <div className="glass rounded-xl p-6 border border-border inline-block">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 rounded-lg bg-cyan/10">
                        <step.icon className="h-5 w-5 text-cyan" />
                      </div>
                      <h3 className="font-display text-lg font-semibold text-foreground">
                        {step.title}
                      </h3>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {step.description}
                    </p>
                  </div>
                </div>
                
                {/* Step Number */}
                <div className="hidden md:flex w-10 h-10 rounded-full bg-background border-2 border-cyan items-center justify-center z-10">
                  <span className="font-mono text-sm text-cyan font-semibold">{index + 1}</span>
                </div>
                
                <div className="flex-1 hidden md:block" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
