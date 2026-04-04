# Senso Veritas — Project Idea Document
**Author:** Jaimin Patel | **Version:** 1.0 | **Date:** April 2026

---

## 1. The One-Line Pitch

An independent benchmark that stress-tests Senso's ground-truth layer against a vanilla LLM on real financial compliance queries — scoring, logging, and visualising every result so the delta between grounded and ungrounded AI is undeniable.

---

## 2. The Problem Being Solved

Large language models deployed in financial services hallucinate. They invent interest rates, misquote SBA rules, cite outdated policy versions, and do so confidently. The industry knows this. What it does not have is a **quantified, reproducible proof** of how much a ground-truth constraint layer actually reduces that risk.

Senso's thesis is that deterministic document grounding is the answer. Veritas tests that thesis against live adversarial queries and publishes the score.

---

## 3. The Core Thesis

> A baseline LLM given no context will hallucinate on adversarial financial compliance queries. A Senso-grounded LLM given the same queries against the same documents will hallucinate significantly less. The delta between the two, measured by NCS, is Senso's proof of value.

This is not a chatbot. This is not a demo. This is an **independent audit tool** that happens to also be a demo.

---

## 4. Why This Matters to Saroop, Thomas, and Andy

| Executive | What they care about | What Veritas proves |
|---|---|---|
| Saroop (CEO) | Regulatory risk in lending, borrower safety | Senso prevents hallucinated rate quotes and outdated SBA rules reaching borrowers |
| Thomas (CTO) | Clean architecture, real API usage, no fake pipelines | Async pipeline, Pydantic contracts, circuit breakers, structured logging, real Ollama calls |
| Andy (Product) | Demo-ability, metric clarity, roadmap alignment | Single NCS gauge, side-by-side diff, category breakdown — all live from Convex |

---

## 5. What the System Actually Does

### Step-by-step flow

1. **Ground truth is defined offline.** 25 adversarial financial queries are written with known correct answers, key facts, and source document references. This is the benchmark anchor.

2. **Pipeline runs locally.** For each query, two LLM calls happen in parallel:
   - Baseline (llama3.1:8b via Ollama) — no context, raw knowledge only
   - Senso — same query, grounded against ingested SBA/NCUA/TILA PDFs

3. **Both responses are judged independently.** An LLM judge (qwen2.5:7b via Ollama) evaluates each response against the ground truth key facts and returns a structured hallucination verdict.

4. **NCS is computed for both.** Baseline gets an NCS. Senso gets an NCS. The delta is the headline metric.

5. **Results are written to Convex.** Every audit record — query, both responses, both NCS scores, citations, hallucination flags — is persisted.

6. **Dashboard reads from Convex.** The React frontend deployed on Vercel has no backend. It reads directly from Convex and renders the live benchmark results.

---

## 6. The 25 Queries — Category Breakdown

| Category | Count | What it tests |
|---|---|---|
| Adversarial rate traps | 5 | False premises about interest rates (e.g. "since the Fed cut to zero...") |
| Adversarial policy confusion | 5 | Mixing up programs (PPP vs 7(a), EIDL vs 504) |
| Adversarial eligibility traps | 5 | Edge cases baseline confidently gets wrong (credit score, size standards) |
| Adversarial compliance rules | 5 | Specific regulatory numbers (guarantee fees, prepayment penalties) |
| Adversarial SOP versioning | 5 | Outdated procedure references that trap stale LLM knowledge |

All 25 are adversarial by design. This is not cherry-picking — it is stress-testing.

---

## 7. The Narrative Control Score (NCS)

NCS quantifies how well a response is grounded in verified documents.

```
raw_NCS = (α × CitationMatch) − (β × HallucinationPenalty) + (δ × KeyFactCoverage)

α = 0.5   (citation accuracy weight)
β = 0.8   (hallucination penalty weight)
δ = 0.3   (key fact coverage weight)

normalized_NCS = (raw_NCS + 0.8) / 1.6   → range [0, 1]
```

**NCS is computed for both baseline and Senso independently.** The dashboard shows both scores and the delta. That delta is the story.

---

## 8. What Success Looks Like

A successful run will show:

- Baseline NCS: 20–35% (confident hallucinations on adversarial queries)
- Senso NCS: 45–65% (grounded answers, fewer violations)
- Delta: +20–30 percentage points in Senso's favour
- Hallucination rate: Baseline ~70–80%, Senso ~30–45%

These numbers are not guaranteed — they are the expected outcome if Senso's grounding layer is working. If they come out differently, that finding is equally valuable and equally presentable.

---

## 9. The Demo Story (60 seconds)

> "I built an independent benchmark that runs the same 25 adversarial financial compliance questions through a raw LLM and through Senso. The judge evaluates both against verified ground truth. This is the result."

*Show dashboard. Point at NCS gauge. Point at delta. Click one adversarial query. Show side-by-side diff where baseline hallucinated a rate and Senso cited the document.*

> "The baseline confidently invented a Prime Rate of 7.25%. Senso cited the rate sheet and returned 8.50%. That is a real compliance breach in a real lending workflow. Veritas catches it, scores it, and logs it."

---

## 10. What This Is Not

- Not a chatbot
- Not a Senso showcase built with fake data
- Not a demo that only works with the happy path
- Not a project that depends on Senso's own evaluation endpoint to score Senso

Veritas is an adversarial benchmark. The whole point is to find where Senso fails and where it wins. That intellectual honesty is the project's biggest strength.

---

## 11. Source Documents

All publicly available:

| Document | URL |
|---|---|
| SOP 50 10 8 Technical Updates (June 2025) | https://www.sba.gov |
| SBA 504 Loan Program Guide | https://www.sba.gov |
| Truth in Lending Act / Regulation Z Guide | https://www.ncua.gov |
| FRED Federal Funds Rate Data | https://fred.stlouisfed.org |
| First National Credit Union Rate Sheet Q1 2025 | Mock — generated from FRED + Fed multipliers |

---

*End of Project Idea Document*
