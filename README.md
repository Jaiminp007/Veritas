# Senso Veritas

An adversarial benchmarking platform that proves the Senso Context Layer eliminates hallucinations in financial compliance LLMs. 50 trick questions, side-by-side scoring, and a live playground where anyone can test it themselves.

**Live:** [veritas-senso.vercel.app](https://veritas-senso.vercel.app)

<img width="1435" height="832" alt="Screenshot 2026-04-06 at 11 42 46 AM" src="https://github.com/user-attachments/assets/48849336-d110-4752-ac29-7e93e8aabb13" />

## Results

| Metric | Baseline LLM | Senso API |
|--------|-------------|-----------|
| Hallucination Rate | 38% | 6% |
| Avg NCS Score | 0.301 | 0.467 |
| Performance Lift | — | +16.6% |
| Citations | None | 3 per query |

## How It Works

1. **50 adversarial queries** target common failure modes — rate traps, program myths, eligibility tricks, outdated SOP references
2. **Dual execution** — each query runs through a raw baseline LLM (GPT-4o-mini) and the Senso API in parallel
3. **Independent judge** evaluates both responses against ground truth key facts with negation-aware overlap detection
4. **NCS scoring** — `NCS = α·citation_match - β·hallucination_penalty + δ·key_fact_coverage` (α=0.5, β=0.8, δ=0.3)
5. **Live Playground** — type any compliance question and watch the diff in real time

## Architecture

```
User Query
    │
    ▼
┌─────────────────────┐
│   Veritas Pipeline  │
│  (FastAPI + Render) │
└──────┬──────────┬───┘
       │          │
       ▼          ▼
  ┌────────┐ ┌───────────┐
  │Raw LLM │ │ Senso API │
  │(GPT-4o)│ │(Context   │
  │  mini  │ │  Layer)   │
  └────┬───┘ └────┬──────┘
       │          │
       ▼          ▼
┌─────────────────────┐
│   Judge + NCS       │
│   Scoring Engine    │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│   Convex DB         │
│   (Results Store)   │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Next.js Dashboard  │
│   (Vercel)          │
└─────────────────────┘
```

## Tech Stack

- **Frontend:** Next.js 16, React 19, Tailwind CSS, TypeScript
- **Backend:** FastAPI, Python 3.12
- **LLM Baseline:** GitHub Models API (GPT-4o-mini)
- **Grounded Search:** Senso API
- **Database:** Convex
- **Hosting:** Vercel (frontend) + Render (backend API)

## Source Documents

The benchmark evaluates against 5 real financial compliance documents:

- SOP 50 10 8 — SBA 7(a) & 504 lending rules (effective June 2025)
- Truth in Lending Act (TILA) & Regulation Z
- First National Credit Union — Internal Rate Sheet Q1 2025
- Federal Funds Effective Rate (FEDFUNDS) — FRED
- SBA 504 Loan Program Guide

## Local Setup

### Backend

```bash
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt

# Set env vars
cp .env.example .env
# Edit .env with: SENSO_API_KEY, GITHUB_TOKEN, CONVEX_DEPLOYMENT

# Start the API
source .env && uvicorn app.main:app --reload --port 8000
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Set `VITE_CONVEX_URL` in `frontend/.env.local` to your Convex deployment URL.

### Run the Benchmark

```bash
curl -X POST http://localhost:8000/pipeline/run
```

### Test the Playground

```bash
curl -X POST http://localhost:8000/playground/query \
  -H "Content-Type: application/json" \
  -d '{"query": "Is the SBA 7(a) guarantee fee waived for all small businesses in 2025?"}'
```

## Production Deployment

### Render (Backend)

The repo includes `render.yaml` for one-click deploy. Set these env vars:

| Key | Value |
|-----|-------|
| `CONFIG_PATH` | `app/config.prod.yaml` |
| `GITHUB_TOKEN` | Your GitHub PAT |
| `SENSO_API_KEY` | Your Senso API key |

### Vercel (Frontend)

Set `FASTAPI_URL` to your Render service URL.

## Project Structure

```
app/                    # FastAPI backend
├── main.py             # App entrypoint, lifespan, middleware
├── pipeline.py         # Benchmark orchestration + playground
├── config.yaml         # Local config (Ollama)
├── config.prod.yaml    # Production config (GitHub Models)
├── services/
│   ├── judge.py        # Hallucination detection + hardening
│   ├── ncs.py          # Narrative Control Score computation
│   ├── senso.py        # Senso API client
│   └── ollama.py       # OpenAI-compatible LLM client
└── routers/
    ├── pipeline.py     # /pipeline/run, /pipeline/status
    ├── playground.py   # /playground/query
    ├── metrics.py      # /metrics/summary, /metrics/by-category
    └── audit.py        # /audit/records

frontend/               # Next.js 16 dashboard
├── app/                # App router pages
├── components/veritas/ # Custom UI components
└── lib/convex-data.ts  # Convex query layer

data/ground_truth.json  # 50 adversarial benchmark queries
docs/                   # Source PDFs for knowledge base
tests/                  # Judge, NCS, pipeline tests
```

## License

MIT

---

Built by [Jaimin Patel](https://github.com/Jaiminp007) for [Senso.ai](https://senso.ai)
