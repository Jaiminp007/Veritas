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
        response_text="I cannot determine that from the provided documents.",
        key_facts=[
            "0% fee for loans up to $150,000",
            "3% for $150,001 to $700,000",
        ],
    )

    assert judgment.is_refusal is True
    assert judgment.penalty >= 0.45
    assert len(judgment.violated_facts) == 2
