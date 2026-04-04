# Senso Veritas — Full Architecture Document
**Author:** Jaimin Patel | **Version:** 1.0 | **Date:** April 2026

---

## 1. System Overview

Veritas is a split-environment system. The pipeline runs entirely locally. The dashboard runs on Vercel. Convex is the bridge — a persistent cloud database that the local pipeline writes to and the Vercel frontend reads from. No backend is deployed.

```
┌─────────────────────────────────────────────────────┐
│                  LOCAL MACHINE                       │
│                                                      │
│  ┌──────────┐    ┌──────────┐    ┌───────────────┐  │
│  │ FastAPI  │───>│ Pipeline │───>│ Ollama        │  │
│  │ :8000    │    │ engine   │    │ llama3.1:8b   │  │
│  └──────────┘    └────┬─────┘    │ qwen2.5:7b    │  │
│                       │          └───────────────┘  │
│                       │          ┌───────────────┐  │
│                       │─────────>│ Senso API     │  │
│                       │          │ apiv2.senso.ai│  │
│                       │          └───────────────┘  │
└───────────────────────┼─────────────────────────────┘
                        │ writes audit records
                        ▼
              ┌─────────────────┐
              │    CONVEX       │
              │  (cloud DB)     │
              │  auditRecords   │
              │  pipelineJobs   │
              │  documents      │
              └────────┬────────┘
                       │ reads (no auth, public queries)
                       ▼
              ┌─────────────────┐
              │    VERCEL       │
              │  React frontend │
              │  reads Convex   │
              │  no backend     │
              └─────────────────┘
```

---

## 2. Recommended Ollama Models

### Baseline LLM: `llama3.1:8b`

**Why:** Llama 3.1 8B is trained on data up to early 2024. It has strong general knowledge but no access to your ingested documents. On adversarial queries about specific SBA fee structures, SOP version numbers, and current Prime Rates, it will confidently hallucinate — which is exactly what you want for the benchmark. It is also fast enough to run 25 queries in under 10 minutes on a mid-range GPU.

```bash
ollama pull llama3.1:8b
```

### Judge LLM: `qwen2.5:7b`

**Why:** Qwen 2.5 is the best open-source model for structured JSON output as of early 2026. It reliably returns valid JSON when instructed, handles the hallucination detection rubric well, and is faster than larger models. Do not use llama3.1 as the judge — it is inconsistent at JSON formatting.

```bash
ollama pull qwen2.5:7b
```

### Config in `config.yaml`

```yaml
llm_providers:
  baseline:
    provider: "ollama"
    model: "llama3.1:8b"
    base_url: "http://localhost:11434/v1"
  judge:
    provider: "ollama"
    model: "qwen2.5:7b"
    base_url: "http://localhost:11434/v1"
```

---

## 3. Repository Structure

```
senso_veritas/
│
├── app/                          # FastAPI backend (local only)
│   ├── main.py                   # App entrypoint, lifespan, worker startup
│   ├── pipeline.py               # Core async evaluation engine
│   ├── models.py                 # Pydantic v2 data contracts
│   ├── config.yaml               # All runtime config (no secrets)
│   │
│   ├── services/
│   │   ├── senso.py              # Senso API wrapper with retry
│   │   ├── ncs.py                # NCS formula + normalization
│   │   └── judge.py              # LLM-as-judge hallucination detection
│   │
│   └── routers/
│       ├── pipeline.py           # POST /pipeline/run, GET /pipeline/status
│       ├── metrics.py            # GET /metrics/summary, /by-category
│       ├── audit.py              # GET /audit/records
│       └── config.py             # GET/PUT /config/weights
│
├── data/
│   └── ground_truth.json         # 25 adversarial queries with known answers
│
├── frontend/                     # React + Tailwind (deploys to Vercel)
│   ├── src/
│   │   ├── App.tsx
│   │   ├── convex/               # Convex client setup
│   │   ├── components/
│   │   │   ├── NCSGauge.tsx      # Circular gauge component
│   │   │   ├── QueryDiff.tsx     # Side-by-side baseline vs Senso
│   │   │   ├── CategoryChart.tsx # Bar chart by query category
│   │   │   ├── AuditTable.tsx    # Scrollable record table
│   │   │   └── KPICards.tsx      # Top summary cards
│   │   └── pages/
│   │       ├── Overview.tsx
│   │       ├── Compare.tsx
│   │       └── Leaderboard.tsx
│   ├── convex/                   # Convex schema + mutations + queries
│   │   ├── schema.ts
│   │   ├── audit.ts              # writeRecord mutation
│   │   └── queries.ts            # getSummary, getByCategory, getAll
│   ├── package.json
│   ├── vercel.json
│   └── vite.config.ts
│
├── .env.local                    # Secrets (never committed)
├── .env.example                  # Template for .env.local
├── requirements.txt
└── README.md
```

---

## 4. Data Flow — Single Query

```
1. POST /pipeline/run
        │
        ▼
2. Job queued (asyncio.Queue)
        │
        ▼
3. Load ground_truth.json → GroundTruthEntry[]
        │
        ▼
4. For each query (semaphore: max 1 concurrent for Ollama stability):
        │
        ├──────────────────────────────────┐
        ▼                                  ▼
5a. call_baseline_llm()           5b. call_senso_api()
    llama3.1:8b via Ollama            POST apiv2.senso.ai
    no context injected               grounded against PDFs
        │                                  │
        └──────────────┬───────────────────┘
                       ▼
6. call_llm_judge(baseline_response, key_facts)  → HallucinationJudgment (baseline)
   call_llm_judge(senso_response, key_facts)     → HallucinationJudgment (senso)
                       │
                       ▼
7. compute_ncs(baseline) → baseline_ncs
   compute_ncs(senso)    → senso_ncs
   delta = senso_ncs - baseline_ncs
                       │
                       ▼
8. write_audit_to_convex(AuditRecord)
                       │
                       ▼
9. Frontend reads from Convex → renders dashboard
```

---

## 5. NCS Formula — Canonical Implementation

```python
# For EACH response (run twice: once for baseline, once for senso)

def compute_ncs(citation_match, hallucination_penalty, key_fact_coverage, weights):
    raw = (weights.alpha * citation_match) \
        - (weights.beta * hallucination_penalty) \
        + (weights.delta * key_fact_coverage)

    min_possible = -weights.beta          # = -0.8
    max_possible = weights.alpha + weights.delta  # = 0.8
    normalized = (raw - min_possible) / (max_possible - min_possible)

    return max(0.0, min(1.0, normalized))

# Dashboard headline metric
senso_advantage = senso_ncs - baseline_ncs
```

**Default weights:** α=0.5, β=0.8, δ=0.3 (configurable via PUT /config/weights)

**Score interpretation:**
- 0.0 – 0.3: Poor — hallucinated, no citations
- 0.3 – 0.5: Marginal — some facts but missing citations
- 0.5 – 0.7: Good — grounded with minor gaps
- 0.7 – 1.0: Excellent — cited, accurate, complete

---

## 6. AuditRecord Schema (Convex)

```typescript
// convex/schema.ts
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  auditRecords: defineTable({
    trace_id: v.string(),
    query_id: v.string(),
    category: v.string(),
    query_text: v.string(),
    ground_truth_answer: v.string(),
    key_facts: v.array(v.string()),
    source_document: v.string(),

    // Baseline
    baseline_response: v.string(),
    baseline_hallucination_detected: v.boolean(),
    baseline_hallucination_reason: v.string(),
    baseline_ncs: v.float64(),
    baseline_raw_ncs: v.float64(),

    // Senso
    senso_response: v.string(),
    senso_citations: v.array(v.string()),
    senso_hallucination_detected: v.boolean(),
    senso_hallucination_reason: v.string(),
    senso_ncs: v.float64(),
    senso_raw_ncs: v.float64(),

    // Delta (the headline metric)
    ncs_delta: v.float64(),

    // Shared components
    citation_match: v.float64(),
    key_fact_coverage: v.float64(),
    weights_used: v.object({
      alpha: v.float64(),
      beta: v.float64(),
      delta: v.float64(),
    }),

    latency_ms: v.float64(),
    status: v.union(v.literal("success"), v.literal("failed")),
    error_message: v.optional(v.string()),
    created_at: v.int64(),
  }),
});
```

---

## 7. Judge Prompt — Correct Version

```python
JUDGE_PROMPT = """
You are a compliance fact-checker. Your job is to evaluate whether a model response
contradicts or omits the key facts below.

FIRST: Check if the response is a refusal (e.g. "I cannot answer", "I don't know",
"Sorry, I cannot..."). If it is a refusal, return:
{"is_hallucination": false, "is_refusal": true, "penalty": 0.0,
 "violated_facts": [], "reason": "Response was a refusal — not a hallucination"}

SECOND: For non-refusal responses, check each key fact:
- Is the fact contradicted? (wrong number, wrong rule, wrong program name) → violation
- Is the fact completely absent when it should be present? → violation
- Is the fact correctly stated or correctly implied? → not a violation

Key facts that must be present and not contradicted:
{key_facts}

Model response to evaluate:
{response}

Return ONLY valid JSON, no preamble, no markdown:
{{
  "is_hallucination": <true if penalty > 0.5>,
  "is_refusal": <true if response is a refusal>,
  "penalty": <violated_count / total_facts as float 0.0-1.0>,
  "violated_facts": [<list of facts that were violated>],
  "reason": "<one sentence explanation>"
}}
"""
```

---

## 8. Citation Debug Fix

Add this to `services/senso.py` to diagnose empty citations:

```python
# After response.raise_for_status()
data = response.json()

# DEBUG — remove before final demo
import json
logger.info("senso_raw_response", keys=list(data.keys()),
            snippet=json.dumps(data)[:300])

# Handle all known Senso v2 response shapes
if "answer" not in data:
    if "response" in data:
        data["answer"] = data["response"]
    elif "matching_chunks" in data:
        # Build answer from chunks
        chunks = data["matching_chunks"]
        data["answer"] = " ".join(
            c.get("content") or c.get("text", "") for c in chunks[:3]
        )
    else:
        data["answer"] = str(data)

if "citations" not in data:
    if "matching_chunks" in data:
        data["citations"] = [
            f"{c.get('metadata', {}).get('path', 'Senso')} — {c.get('content','')[:80]}"
            for c in data["matching_chunks"]
        ]
    elif "sources" in data:
        data["citations"] = data["sources"]
    else:
        data["citations"] = []
```

---

## 9. Convex Queries (Frontend Reads)

```typescript
// convex/queries.ts
import { query } from "./_generated/server";

export const getSummary = query(async ({ db }) => {
  const records = await db.query("auditRecords")
    .filter(q => q.eq(q.field("status"), "success"))
    .collect();

  if (records.length === 0) return null;

  const avg = (arr: number[]) => arr.reduce((a, b) => a + b, 0) / arr.length;

  return {
    total: records.length,
    avg_senso_ncs: avg(records.map(r => r.senso_ncs)),
    avg_baseline_ncs: avg(records.map(r => r.baseline_ncs)),
    avg_delta: avg(records.map(r => r.ncs_delta)),
    hallucination_rate_baseline: records.filter(r => r.baseline_hallucination_detected).length / records.length,
    hallucination_rate_senso: records.filter(r => r.senso_hallucination_detected).length / records.length,
    citation_accuracy: avg(records.map(r => r.citation_match)),
  };
});

export const getByCategory = query(async ({ db }) => {
  const records = await db.query("auditRecords")
    .filter(q => q.eq(q.field("status"), "success"))
    .collect();

  const grouped: Record<string, typeof records> = {};
  for (const r of records) {
    grouped[r.category] = grouped[r.category] || [];
    grouped[r.category].push(r);
  }

  return Object.entries(grouped).map(([cat, recs]) => ({
    category: cat,
    avg_senso_ncs: recs.reduce((a, b) => a + b.senso_ncs, 0) / recs.length,
    avg_baseline_ncs: recs.reduce((a, b) => a + b.baseline_ncs, 0) / recs.length,
    avg_delta: recs.reduce((a, b) => a + b.ncs_delta, 0) / recs.length,
    count: recs.length,
  }));
});
```

---

## 10. Environment Variables

### `.env.local` (local machine only, never committed)

```bash
SENSO_API_KEY=your_senso_api_key_here
CONVEX_DEPLOYMENT=https://your-deployment.convex.cloud
CONVEX_DEPLOY_KEY=your_convex_deploy_key
```

### `.env.example` (committed to repo)

```bash
SENSO_API_KEY=
CONVEX_DEPLOYMENT=
CONVEX_DEPLOY_KEY=
```

### Vercel environment variables (set in Vercel dashboard)

```bash
VITE_CONVEX_URL=https://your-deployment.convex.cloud
```

The frontend only needs the public Convex URL. No API keys ever go to Vercel.

---

## 11. Deployment Steps

### Local (pipeline)

```bash
# 1. Start Ollama
ollama serve

# 2. Pull models
ollama pull llama3.1:8b
ollama pull qwen2.5:7b

# 3. Install Python deps
pip install -r requirements.txt

# 4. Start FastAPI
uvicorn app.main:app --reload --port 8000

# 5. Run pipeline
curl -X POST http://localhost:8000/pipeline/run
```

### Vercel (frontend)

```bash
cd frontend
npm install
npx convex deploy          # push schema + functions to Convex
vercel --prod              # deploy React app
```

That's it. No Docker. No cloud backend.

*End of Architecture Document*
