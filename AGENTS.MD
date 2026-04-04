# AGENTS.md — Senso Veritas
> Read this entire file before touching any code. This is the canonical source of truth for this project.

---

## What This Project Is

Senso Veritas is an independent benchmark that runs 25 adversarial financial compliance queries through two LLMs in parallel — a raw baseline (llama3.1:8b via Ollama) and a Senso-grounded LLM — then scores both using an external judge and computes a Narrative Control Score (NCS) for each. The delta between baseline NCS and Senso NCS is the headline metric that proves Senso's ground-truth layer reduces hallucinations.

**This is NOT a chatbot. It is a benchmark pipeline.**

The pipeline runs locally. Results are persisted to Convex. The dashboard is a static React app deployed to Vercel that reads from Convex. No backend is deployed.

---

## Stack

| Layer | Technology |
|---|---|
| Backend (local only) | Python 3.11+, FastAPI, asyncio |
| LLM — Baseline | Ollama — llama3.1:8b |
| LLM — Judge | Ollama — qwen2.5:7b |
| LLM — Grounded | Senso API (apiv2.senso.ai) |
| Database | Convex (cloud, persists across runs) |
| Frontend | React 18, TypeScript, Tailwind CSS |
| Deployment | Vercel (frontend only) |
| Validation | Pydantic v2 throughout |
| HTTP | httpx (async) |
| Retry logic | tenacity |
| Logging | structlog (JSON format) |

---

## Repository Structure

```
senso_veritas/
├── app/
│   ├── main.py                  # FastAPI app, lifespan, queue worker startup
│   ├── pipeline.py              # Core async evaluation engine — MAIN FILE
│   ├── models.py                # Pydantic v2 data contracts — ALL schemas here
│   ├── config.yaml              # Runtime config — no secrets
│   ├── services/
│   │   ├── ncs.py               # NCS formula + normalization
│   │   ├── senso.py             # Senso API wrapper
│   │   └── judge.py             # LLM-as-judge hallucination detection
│   └── routers/
│       ├── pipeline.py          # POST /pipeline/run, GET /pipeline/status/{id}
│       ├── metrics.py           # GET /metrics/summary, /by-category
│       ├── audit.py             # GET /audit/records
│       └── config.py            # GET/PUT /config/weights
├── data/
│   └── ground_truth.json        # 25 adversarial queries — DO NOT EDIT DURING RUN
├── frontend/
│   ├── src/
│   │   ├── App.tsx
│   │   ├── components/
│   │   └── pages/
│   └── convex/
│       ├── schema.ts            # Convex table definitions
│       ├── audit.ts             # writeRecord mutation
│       └── queries.ts           # getSummary, getByCategory, getAll
├── .env.local                   # NEVER COMMIT — secrets live here
├── .env.example                 # Commit this — empty template
└── requirements.txt
```

---

## IMPORTANT
Look at 01_project_idea.md, 02_architecture.md and 03_security_report.md for details abotu this project and the vision i am trying to make.
Also, Always remeber if you in a confusion, always always ask for help, never try to guess or assume anything.

## NCS Formula — Canonical

```
raw_NCS  = (α × CitationMatch) − (β × HallucinationPenalty) + (δ × KeyFactCoverage)
norm_NCS = (raw_NCS + β) / (α + β + δ)    →  clamped to [0.0, 1.0]

Default weights:  α=0.5  β=0.8  δ=0.3
Range proof:
  Best  raw =  0.5(1) − 0.8(0) + 0.3(1) =  0.8  →  norm = 1.0
  Worst raw =  0.5(0) − 0.8(1) + 0.3(0) = −0.8  →  norm = 0.0
```

**Compute for BOTH baseline and Senso. Delta = senso_norm - baseline_norm.**

Baseline citation_match is always 0.0 (no documents). Baseline key_fact_coverage uses the same function.

---

## Data Model Flow

```
GroundTruthEntry (ground_truth.json)
    ↓
process_single_query()
    ↓
BaselineLLMResponse + SensoSearchResponse  (parallel calls)
    ↓
HallucinationJudgment × 2  (judge called once per response)
    ↓
NCSResult × 2  (compute_ncs called once per response)
    ↓
AuditRecord  (written to Convex)
    ↓
Convex queries  (read by React frontend)
```

---

## Environment Variables

### .env.local (local machine, never committed)
```
SENSO_API_KEY=your_key_here
CONVEX_DEPLOYMENT=https://your-deployment.convex.cloud
CONVEX_DEPLOY_KEY=your_deploy_key_here
```

### Vercel dashboard only
```
VITE_CONVEX_URL=https://your-deployment.convex.cloud
```

No backend secrets ever go to Vercel.

---

## Config — app/config.yaml

```yaml
senso:
  api_url: "https://apiv2.senso.ai/api/v1/org/search"
  timeout: 60.0

pipeline:
  max_concurrent_queries: 1      # Keep at 1 for Ollama stability
  ground_truth_file: "data/ground_truth.json"
  baseline_llm_timeout: 120.0
  senso_llm_timeout: 60.0
  judge_llm_timeout: 60.0        # qwen2.5:7b can be slow — keep at 60

llm_providers:
  baseline:
    provider: "ollama"
    model: "llama3.1:8b"
    base_url: "http://localhost:11434/v1"
  judge:
    provider: "ollama"
    model: "qwen2.5:7b"
    base_url: "http://localhost:11434/v1"

resilience:
  consecutive_failures_threshold: 3   # Was 50 — changed to 3

ncs_weights:
  alpha: 0.5
  beta: 0.8
  delta: 0.3
```

---

## How to Run

### Prerequisites
```bash
# 1. Start Ollama with correct models
ollama serve
ollama pull llama3.1:8b
ollama pull qwen2.5:7b

# 2. Verify Ollama is working
curl http://localhost:11434/api/tags

# 3. Install Python deps
pip install -r requirements.txt

# 4. Set up env
cp .env.example .env.local
# Fill in SENSO_API_KEY and CONVEX_DEPLOYMENT
```

### Run pipeline
```bash
# Start FastAPI
uvicorn app.main:app --reload --port 8000

# In another terminal — trigger pipeline
curl -X POST http://localhost:8000/pipeline/run

# Check status
curl http://localhost:8000/pipeline/status/{job_id}

# Check metrics
curl http://localhost:8000/metrics/summary
```

### Deploy frontend
```bash
cd frontend
npm install
npx convex deploy    # Push schema changes to Convex first
vercel --prod        # Deploy React to Vercel
```

---

## Do Not Touch

- `data/ground_truth.json` — do not edit while a pipeline run is in progress
- `frontend/node_modules/` — do not commit
- `__pycache__/` — do not commit
- `.env.local` — do not commit, do not print values in logs

---

## What Success Looks Like

After all bugs are fixed and a full 25-query run completes:

| Metric | Expected Range |
|---|---|
| Baseline avg NCS | 15% – 35% |
| Senso avg NCS | 40% – 65% |
| NCS Delta (Senso advantage) | +15% – +30% |
| Baseline hallucination rate | 65% – 80% |
| Senso hallucination rate | 25% – 45% |
| Senso refusal rate | 10% – 25% (not hallucinations) |

If Senso NCS < Baseline NCS after fixes, that is a valid and interesting finding — present it honestly.

---

## Frontend KPI Cards — Target Layout

```
┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│ Senso NCS   │  │Baseline NCS │  │  NCS Delta  │  │Hallu. Rate  │
│   54.2%     │  │   23.1%     │  │   +31.1%    │  │ Base: 74%   │
│             │  │             │  │  ↑ Senso     │  │ Senso: 31%  │
│             │  │             │  │  advantage  │  │             │
└─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘
```

The delta card is the money shot. Make it green and large.

---

## Convex Mutation — writeRecord

```typescript
// convex/audit.ts
import { mutation } from "./_generated/server";
import { v } from "convex/values";

export const writeRecord = mutation({
  args: {
    trace_id: v.string(),
    query_id: v.string(),
    category: v.string(),
    query_text: v.string(),
    ground_truth_answer: v.string(),
    key_facts: v.array(v.string()),
    source_document: v.string(),
    baseline_response: v.string(),
    baseline_hallucination_detected: v.boolean(),
    baseline_hallucination_reason: v.string(),
    baseline_hallucination_penalty: v.float64(),
    baseline_ncs: v.float64(),
    baseline_raw_ncs: v.float64(),
    senso_response: v.string(),
    senso_citations: v.array(v.string()),
    senso_hallucination_detected: v.boolean(),
    senso_hallucination_reason: v.string(),
    senso_hallucination_penalty: v.float64(),
    narrative_control_score: v.float64(),
    raw_ncs: v.float64(),
    ncs_delta: v.float64(),
    citation_match: v.float64(),
    key_fact_coverage: v.float64(),
    weights_used: v.object({ alpha: v.float64(), beta: v.float64(), delta: v.float64() }),
    latency_ms: v.float64(),
    status: v.union(v.literal("success"), v.literal("failed")),
    error_message: v.optional(v.string()),
    created_at: v.int64(),
  },
  handler: async ({ db }, args) => {
    return await db.insert("auditRecords", args);
  },
});
```

