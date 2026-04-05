from __future__ import annotations

import pytest

from app.services.judge import judge_response


class FakeJudgeClient:
    def __init__(self, content: str) -> None:
        self.content = content

    async def chat(self, *, model: str, messages, temperature: float = 0.0, timeout: float | None = None):
        return {"choices": [{"message": {"content": self.content}}]}

    @staticmethod
    def extract_content(payload):
        return payload["choices"][0]["message"]["content"]


@pytest.mark.asyncio
async def test_generic_short_answer_is_hardened_to_hallucination() -> None:
    client = FakeJudgeClient(
        '{"is_hallucination": false, "is_refusal": false, "penalty": 0.0, "violated_facts": [], "reason": "ok"}'
    )

    judgment = await judge_response(
        client,
        model="qwen2.5:7b",
        response_text="Based on current guidance, the answer is 0%.",
        key_facts=[
            "program not discontinued",
            "SOP 50 10 8 effective June 1 2025",
        ],
    )

    assert judgment.is_hallucination is True
    assert judgment.penalty >= 0.75


@pytest.mark.asyncio
async def test_refusal_gets_nonzero_penalty_when_facts_are_unanswered() -> None:
    client = FakeJudgeClient(
        '{"is_hallucination": false, "is_refusal": true, "penalty": 0.0, "violated_facts": [], "reason": "refusal"}'
    )

    judgment = await judge_response(
        client,
        model="qwen2.5:7b",
        response_text="I don't know the answer to that question.",
        key_facts=[
            "0% fee for loans up to $150,000",
            "3% for $150,001 to $700,000",
        ],
    )

    assert judgment.is_refusal is True
    assert judgment.penalty >= 0.45
    assert len(judgment.violated_facts) == 2


@pytest.mark.asyncio
async def test_honest_refusal_gets_reduced_penalty() -> None:
    client = FakeJudgeClient(
        '{"is_hallucination": false, "is_refusal": true, "penalty": 0.0, "violated_facts": [], "reason": "refusal"}'
    )

    judgment = await judge_response(
        client,
        model="qwen2.5:7b",
        response_text="I cannot determine that from the provided documents. The documents do not state any specific fee schedule.",
        key_facts=[
            "0% fee for loans up to $150,000",
            "3% for $150,001 to $700,000",
        ],
    )

    assert judgment.is_refusal is True
    assert judgment.penalty == 0.15


@pytest.mark.asyncio
async def test_zero_fact_coverage_gets_hallucination_penalty() -> None:
    client = FakeJudgeClient(
        '{"is_hallucination": false, "is_refusal": false, "penalty": 0.0, "violated_facts": [], "reason": "ok"}'
    )

    judgment = await judge_response(
        client,
        model="qwen2.5:7b",
        response_text="The interest rate depends on various market factors and the specific lender you choose to work with for your financing needs.",
        key_facts=[
            "WSJ Prime Rate 8.50% Q1 2025",
            "spread 2.25% for over $50K up to 7yr",
            "spread 2.75% for over $50K greater than 7yr",
        ],
    )

    assert judgment.is_hallucination is True
    assert judgment.penalty >= 0.65


@pytest.mark.asyncio
async def test_substantive_hedged_answer_is_not_forced_into_refusal() -> None:
    client = FakeJudgeClient(
        '{"is_hallucination": false, "is_refusal": true, "penalty": 0.0, "violated_facts": [], "reason": "refusal"}'
    )

    judgment = await judge_response(
        client,
        model="qwen2.5:7b",
        response_text=(
            "I cannot confirm that from the documents alone, but the context does say the SBA sets maximum "
            "allowable spreads, lenders can price below those caps, and the lender rate sheet shows program-"
            "specific spreads and fees that differ by lender."
        ),
        key_facts=[
            "SBA sets maximum spreads not exact rates",
            "lenders set rates within caps",
        ],
    )

    assert judgment.is_refusal is False


@pytest.mark.asyncio
async def test_parse_error_on_substantive_answer_does_not_force_hallucination() -> None:
    client = FakeJudgeClient('{"is_hallucination": false,')

    judgment = await judge_response(
        client,
        model="qwen2.5:7b",
        response_text=(
            "No. The provided context shows the SBA 7(a) program continuing in 2025, including a 2025 SOP, "
            "updated fee guidance, and continuing rate caps tied to Prime."
        ),
        key_facts=[
            "program not discontinued",
            "SOP 50 10 8 effective June 1 2025",
        ],
    )

    assert judgment.is_hallucination is False
    assert judgment.penalty <= 0.35
