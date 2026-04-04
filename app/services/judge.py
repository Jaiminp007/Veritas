from __future__ import annotations

import json
import logging
import re
from typing import Any

from pydantic import ValidationError

from ..models import HallucinationJudgment
from .ncs import token_overlap_ratio
from .ollama import OllamaClient

logger = logging.getLogger(__name__)


JUDGE_PROMPT = """You are a compliance fact-checker.
Evaluate the model response against the key facts.

Rules:
- A refusal or "insufficient context" answer is still a failed benchmark answer if it does not cover the key facts.
- For refusals or non-answers, set is_refusal=true and assign a penalty between 0.35 and 0.6 based on how little useful information is provided.
- For generic, unsupported, or obviously incorrect short answers, set is_hallucination=true with a penalty of at least 0.75.
- For non-refusal responses, mark a fact as violated if it is contradicted or missing.
- Return only valid JSON.

Key facts:
{key_facts}

Model response:
{response}

Return JSON with fields:
is_hallucination, is_refusal, penalty, violated_facts, reason
"""

REFUSAL_PATTERNS = (
    r"\bi cannot\b",
    r"\bi can't\b",
    r"\bi do not know\b",
    r"\bi don't know\b",
    r"\bi cannot determine\b",
    r"\bi can't determine\b",
    r"\bi cannot confirm\b",
    r"\binsufficient (context|information)\b",
    r"\bnot enough (context|information)\b",
    r"\bdocuments? (do not|don't) (state|show|say)\b",
    r"\bcontext does not\b",
    r"\bwould you like me to look up\b",
)


def _fallback_judgment(error_text: str) -> HallucinationJudgment:
    return HallucinationJudgment(
        is_hallucination=True,
        is_refusal=False,
        penalty=0.75,
        violated_facts=[],
        reason=f"PARSE_ERROR: {error_text[:100]}",
    )


def _is_refusal_like(response_text: str) -> bool:
    lowered = response_text.lower()
    return any(re.search(pattern, lowered) for pattern in REFUSAL_PATTERNS)


def _violated_facts(response_text: str, key_facts: list[str], *, threshold: float = 0.55) -> list[str]:
    return [fact for fact in key_facts if token_overlap_ratio(response_text, fact) < threshold]


def _harden_judgment(
    judgment: HallucinationJudgment,
    *,
    response_text: str,
    key_facts: list[str],
) -> HallucinationJudgment:
    violated_facts = _violated_facts(response_text, key_facts)
    max_overlap = max((token_overlap_ratio(response_text, fact) for fact in key_facts), default=0.0)
    response_words = len(response_text.split())
    refusal_like = _is_refusal_like(response_text)
    short_low_overlap = response_words <= 12 and max_overlap < 0.35

    if refusal_like or judgment.is_refusal:
        return HallucinationJudgment(
            is_hallucination=False,
            is_refusal=True,
            penalty=max(judgment.penalty, 0.45 if violated_facts else 0.25),
            violated_facts=violated_facts,
            reason="Refusal or insufficient-context answer did not resolve the benchmark facts.",
        )

    if short_low_overlap:
        return HallucinationJudgment(
            is_hallucination=True,
            is_refusal=False,
            penalty=max(judgment.penalty, 0.85),
            violated_facts=violated_facts or key_facts,
            reason="Generic short answer did not cover the benchmark facts.",
        )

    if not judgment.is_hallucination and not judgment.is_refusal and max_overlap < 0.2 and violated_facts:
        return HallucinationJudgment(
            is_hallucination=True,
            is_refusal=False,
            penalty=max(judgment.penalty, 0.75),
            violated_facts=violated_facts,
            reason="Answer was unsupported by the benchmark facts.",
        )

    if violated_facts and judgment.penalty == 0.0:
        return HallucinationJudgment(
            is_hallucination=judgment.is_hallucination,
            is_refusal=judgment.is_refusal,
            penalty=0.35,
            violated_facts=violated_facts,
            reason=judgment.reason,
        )

    return judgment


async def judge_response(
    client: OllamaClient,
    *,
    model: str,
    response_text: str,
    key_facts: list[str],
    timeout: float | None = None,
) -> HallucinationJudgment:
    payload = JUDGE_PROMPT.format(
        key_facts="\n".join(f"- {fact}" for fact in key_facts),
        response=response_text,
    )
    content = await client.chat(
        model=model,
        messages=[
            {"role": "system", "content": "Return only JSON."},
            {"role": "user", "content": payload},
        ],
        temperature=0.0,
        timeout=timeout,
    )
    try:
        raw_content = client.extract_content(content).strip()
    except Exception as exc:
        logger.error("JUDGE_CONTENT_MISSING", extra={"error": str(exc)})
        return _harden_judgment(
            _fallback_judgment(str(exc)),
            response_text=response_text,
            key_facts=key_facts,
        )
    if not raw_content:
        return _harden_judgment(
            _fallback_judgment("Judge returned empty content"),
            response_text=response_text,
            key_facts=key_facts,
        )
    try:
        data: dict[str, Any] = json.loads(raw_content)
    except json.JSONDecodeError as exc:
        logger.error("JUDGE_JSON_FAILED", extra={"error": str(exc), "content": raw_content[:200]})
        return _harden_judgment(
            _fallback_judgment(str(exc)),
            response_text=response_text,
            key_facts=key_facts,
        )
    try:
        judgment = HallucinationJudgment.model_validate(data)
    except ValidationError as exc:
        logger.error("JUDGE_SCHEMA_FAILED", extra={"error": str(exc), "content": raw_content[:200]})
        return _harden_judgment(
            _fallback_judgment(str(exc)),
            response_text=response_text,
            key_facts=key_facts,
        )
    return _harden_judgment(judgment, response_text=response_text, key_facts=key_facts)
