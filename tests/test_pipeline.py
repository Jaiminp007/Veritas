from __future__ import annotations

import asyncio

import pytest

from app.config import AppConfig
from app.models import GroundTruthEntry, LLMProviders, NCSWeights, PipelineConfig, ProviderConfig, ResilienceConfig, SensoConfig, SensoSearchResponse
from app.pipeline import PipelineManager
from app.runtime_config import RuntimeConfigStore


class FakeConvexClient:
    def __init__(self) -> None:
        self.mutations: list[tuple[str, dict]] = []
        self.queries: list[tuple[str, dict]] = []

    async def mutation(self, path: str, args: dict | None = None):
        self.mutations.append((path, args or {}))
        if path == "pipeline:createJob":
            return {"_id": "job_doc_id"}
        return None

    async def query(self, path: str, args: dict | None = None):
        self.queries.append((path, args or {}))
        return None

    async def aclose(self) -> None:
        return None


class FakeOllamaClient:
    async def chat(self, *, model: str, messages, temperature: float = 0.0, timeout: float | None = None):
        if model == "qwen2.5:7b":
            return {
                "choices": [
                    {"message": {"content": '{"is_hallucination": false, "is_refusal": false, "penalty": 0.0, "violated_facts": [], "reason": "ok"}'}}
                ]
            }
        return {
            "choices": [
                {"message": {"content": "The SBA 7(a) rate is indexed to prime and not the Fed funds rate."}}
            ]
        }

    @staticmethod
    def extract_content(payload):
        return payload["choices"][0]["message"]["content"]

    async def aclose(self) -> None:
        return None


class FakeSensoClient:
    async def search(self, query: str, *, max_results: int = 3):
        return SensoSearchResponse(
            query=query,
            answer="The SBA 7(a) rate is indexed to prime and not the Fed funds rate.",
            results=[],
            raw={"answer": "ok"},
            citations=["SOP 50 10 8 | prime rate"],
        )

    async def aclose(self) -> None:
        return None


def build_manager() -> PipelineManager:
    settings = AppConfig(
        senso=SensoConfig(api_url="https://example.test", timeout=1.0),
        pipeline=PipelineConfig(
            max_concurrent_queries=1,
            ground_truth_file="data/ground_truth.json",
            baseline_llm_timeout=1.0,
            senso_llm_timeout=1.0,
            judge_llm_timeout=1.0,
        ),
        llm_providers=LLMProviders(
            baseline=ProviderConfig(provider="ollama", model="llama3.1:8b", base_url="http://localhost:11434/v1"),
            judge=ProviderConfig(provider="ollama", model="qwen2.5:7b", base_url="http://localhost:11434/v1"),
        ),
        resilience=ResilienceConfig(consecutive_failures_threshold=3),
        ncs_weights=NCSWeights(alpha=0.5, beta=0.8, delta=0.3),
    )
    manager = PipelineManager(
        settings_path=None,
        convex_client=FakeConvexClient(),
        ollama_client=FakeOllamaClient(),
        senso_client=FakeSensoClient(),
        runtime_config=RuntimeConfigStore(settings),
    )
    manager._load_ground_truth = lambda: [
        GroundTruthEntry(
            id="gt_001",
            category="adversarial_rate_trap",
            query="What is the rate?",
            ground_truth_answer="Prime indexed",
            source_document="Doc.pdf",
            key_facts=["prime indexed"],
            adversarial=True,
        )
    ]
    return manager


@pytest.mark.asyncio
async def test_process_single_query_returns_audit_record() -> None:
    manager = build_manager()
    record = await manager._process_single_query("trace-1", manager._load_ground_truth()[0])

    assert record.status == "success"
    assert record.query_id == "gt_001"
    assert record.narrative_control_score >= record.baseline_ncs


@pytest.mark.asyncio
async def test_execute_writes_audit_record_and_updates_job() -> None:
    manager = build_manager()
    manager._worker_ready.set()
    job = await manager.submit_run()
    await manager._execute(job.job_id)

    convex = manager.convex_client  # type: ignore[assignment]
    assert any(path == "audit:writeRecord" for path, _ in convex.mutations)
    assert any(path == "pipeline:updateJob" for path, _ in convex.mutations)
