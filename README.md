# Senso Veritas

Independent benchmark pipeline for comparing a raw LLM baseline against a Senso-grounded response path on adversarial financial compliance questions.

## What it does

- Runs 25 adversarial benchmark queries locally through:
  - baseline `llama3.1:8b` on Ollama
  - grounded Senso search API
  - `qwen2.5:7b` judge on Ollama
- Scores both responses with canonical NCS math.
- Persists benchmark records to Convex.
- Serves a static React dashboard that reads benchmark results from Convex.

## Layout

- `app/` FastAPI pipeline, services, and routers
- `data/ground_truth.json` runtime benchmark source
- `frontend/` React + Convex dashboard
- `docs/` source material copied from the project brief

## Local setup

1. Install backend dependencies:

```bash
pip install -r requirements.txt
```

2. Configure env:

```bash
cp .env.example .env.local
```

3. Start Ollama and pull models:

```bash
ollama serve
ollama pull llama3.1:8b
ollama pull qwen2.5:7b
```

4. Run the FastAPI app:

```bash
uvicorn app.main:app --reload --port 8000
```

5. Trigger a benchmark run:

```bash
curl -X POST http://localhost:8000/pipeline/run
```

## Frontend

```bash
cd frontend
npm install
npm run dev
```

Set `VITE_CONVEX_URL` in the frontend environment to a public Convex deployment URL.

