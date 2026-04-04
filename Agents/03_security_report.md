# Senso Veritas — Security Report
**Author:** Jaimin Patel | **Version:** 1.0 | **Date:** April 2026
**Classification:** Internal — Hackathon Project

---

## 1. Security Summary

| Area | Risk Level | Status |
|---|---|---|
| API key exposure | HIGH | Requires immediate action |
| Convex data access | MEDIUM | Needs auth rules before demo |
| Ollama network exposure | MEDIUM | Needs firewall rule |
| Input validation | LOW | Pydantic covers most cases |
| Vercel frontend | LOW | No secrets, safe by design |
| Ground truth data | LOW | Public documents only |

---

## 2. Critical: API Keys

### What you have

- `SENSO_API_KEY` — access to your Senso workspace and all ingested documents
- `CONVEX_DEPLOY_KEY` — can delete your entire Convex database
- `CONVEX_DEPLOYMENT` URL — public but should not be in git history

### Rules — non-negotiable

```bash
# These three files must NEVER be committed
.env.local
.env
*.env

# Verify your .gitignore has these lines
echo ".env*" >> .gitignore
echo "!.env.example" >> .gitignore
```

Run this before every commit:

```bash
git diff --staged | grep -i "sk-\|api_key\|deploy_key\|SENSO\|CONVEX_DEPLOY_KEY"
```

If anything prints, stop and remove the secret before committing.

### If you accidentally commit a key

```bash
# Immediately rotate the key — assume it is compromised
# 1. Go to Senso dashboard → regenerate API key
# 2. Go to Convex dashboard → regenerate deploy key
# 3. Remove from git history
git filter-branch --force --index-filter \
  'git rm --cached --ignore-unmatch .env.local' \
  --prune-empty --tag-name-filter cat -- --all
git push origin --force --all
```

---

## 3. Convex Database Security

### Current state: open reads

By default, Convex queries are publicly accessible if someone knows your deployment URL. For a hackathon demo that is acceptable. For anything beyond that, add auth.

### What to add before sharing the Vercel URL publicly

```typescript
// convex/auth.config.ts
export default {
  providers: []  // Add Clerk or Auth0 here if needed
};

// convex/queries.ts — add identity check
export const getSummary = query(async ({ db, auth }) => {
  // For hackathon: skip auth check, data is read-only and non-sensitive
  // For production: uncomment below
  // const identity = await auth.getUserIdentity();
  // if (!identity) throw new Error("Not authenticated");

  const records = await db.query("auditRecords").collect();
  // ...
});
```

### What is stored in Convex

- Query text (from your ground_truth.json — not user input)
- LLM responses (from Ollama and Senso)
- NCS scores and hallucination flags
- Source document references

**There is no PII in Convex.** This is benchmark data only. Risk is low.

---

## 4. Ollama Network Exposure

Ollama by default binds to `127.0.0.1:11434` — only accessible from localhost. This is correct and safe.

**Do not change this.** If you see Ollama on `0.0.0.0:11434`, fix it:

```bash
# In ~/.ollama/config or via environment variable
OLLAMA_HOST=127.0.0.1 ollama serve
```

If you are on a shared network (university, hackathon venue WiFi), confirm:

```bash
curl http://127.0.0.1:11434/api/tags   # Should work
curl http://your-local-ip:11434/api/tags  # Should fail
```

If the second command works, Ollama is exposed on the network. Stop it and restart with the env var above.

---

## 5. FastAPI Local Server

Your FastAPI backend runs on `localhost:8000`. It is not deployed. It never touches the internet except to:
- Call `apiv2.senso.ai` (outbound only)
- Write to Convex (outbound only)

There is no authentication on the local FastAPI endpoints. This is fine — it is local only. Do not expose port 8000 with ngrok or similar during the hackathon unless you add auth first.

### Rate limiting on local API

Add this to prevent accidental pipeline double-runs during demo:

```python
# app/main.py
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# In pipeline router
@router.post("/run")
@limiter.limit("2/minute")  # Prevent accidental double-runs
async def run_pipeline_endpoint(request: Request, ...):
    ...
```

---

## 6. Input Validation

### What is validated

- All Senso API responses → `SensoSearchResponse` Pydantic model
- All Ollama responses → `BaselineLLMResponse` Pydantic model
- All judge responses → `HallucinationJudgment` Pydantic model
- All ground truth entries → `GroundTruthEntry` Pydantic model
- All Convex writes → `AuditRecord` Pydantic model

### What is not validated — fix these

**Judge JSON parsing can still fail silently:**

```python
# Current fallback in judge.py is correct but log it clearly
except json.JSONDecodeError as je:
    logger.error("JUDGE_JSON_FAILED", content=content[:200], error=str(je))
    # This returns penalty=0.0 which means no hallucination detected
    # That is a false negative — log it so you can spot it in results
    judgment_data = {
        "is_hallucination": False,
        "is_refusal": False,
        "penalty": 0.0,
        "violated_facts": [],
        "reason": f"PARSE_ERROR: {str(je)[:100]}"
    }
```

**Senso response field `answer` can be missing:**

```python
# In senso.py, before SensoSearchResponse(**data)
if "answer" not in data or not data["answer"]:
    raise ValueError(f"Senso returned no answer field. Keys: {list(data.keys())}")
```

---

## 7. Dependency Security

Run this before the hackathon to check for known vulnerabilities:

```bash
pip install pip-audit
pip-audit -r requirements.txt
```

Known packages to keep updated:
- `httpx` — used for all external calls, keep at latest stable
- `pydantic` — v2 required, do not downgrade to v1
- `fastapi` — keep at 0.110+ for the lifespan API
- `tenacity` — retry logic, stable

```bash
# Freeze exact versions after everything works
pip freeze > requirements.txt
```

---

## 8. What Goes in the Public GitHub Repo

### Safe to commit

```
app/
data/ground_truth.json
frontend/src/
frontend/convex/
requirements.txt
.env.example          ← template only, no values
README.md
config.yaml           ← no secrets in here
```

### Never commit

```
.env.local
.env
any file containing SENSO_API_KEY
any file containing CONVEX_DEPLOY_KEY
__pycache__/
node_modules/
*.pyc
audit.db             ← if you have a local SQLite fallback
```

### Final .gitignore

```gitignore
# Secrets
.env
.env.local
.env.*.local

# Python
__pycache__/
*.py[cod]
*.egg-info/
.venv/
venv/

# Node
node_modules/
frontend/dist/
frontend/.vercel/

# Local data
*.db
*.sqlite

# OS
.DS_Store
Thumbs.db
```

---

## 9. Vercel Frontend Security

The React frontend has no backend and no secrets. The only value it receives at build time is:

```bash
VITE_CONVEX_URL=https://your-deployment.convex.cloud
```

This is a public URL by design — Convex is meant to be called from the browser. It does not expose admin access.

**Do not add these to Vercel:**
- `SENSO_API_KEY` — not needed on frontend
- `CONVEX_DEPLOY_KEY` — never on frontend, this is admin access

---

## 10. Demo Day Checklist

Run through this before presenting:

```
□ .env.local is NOT in git history (git log --all --full-history -- .env.local)
□ Ollama is bound to 127.0.0.1 only
□ FastAPI is running locally, not exposed publicly
□ Convex has 25 records loaded and correct
□ Vercel dashboard loads and shows correct numbers
□ No API keys visible in browser network tab (open DevTools → Network → check XHR calls)
□ GitHub repo has .env.example with empty values, not real values
□ README does not contain any API keys inline
```

---

## 11. Post-Hackathon Rotation

Once the hackathon is over, rotate all keys regardless of whether you think they were exposed:

- Senso API key → Senso dashboard → regenerate
- Convex deploy key → Convex dashboard → regenerate
- Delete the Vercel project if you are not continuing development

This is standard practice. Keys used during a hackathon should be considered potentially compromised.

---

*End of Security Report*
