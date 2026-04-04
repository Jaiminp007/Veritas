from __future__ import annotations

import asyncio
import json
import logging
import time
import uuid
from pathlib import Path
from typing import Any

from .config import load_config
from .models import AuditRecord, GroundTruthEntry, NCSWeights, PipelineJob
from .runtime_config import RuntimeConfigStore
from .services.convex import ConvexClient
from .services.judge import judge_response
from .services.ncs import compute_ncs
from .services.ollama import OllamaClient
from .services.senso import SensoClient

logger = logging.getLogger(__name__)


class PipelineManager:
    def __init__(
        self,
        *,
        settings_path: str | Path | None = None,
        convex_client: ConvexClient,
        ollama_client: OllamaClient,
        senso_client: SensoClient,
        runtime_config: RuntimeConfigStore,
    ) -> None:
        self.settings = load_config(settings_path)
        self.convex_client = convex_client
        self.ollama_client = ollama_client
        self.senso_client = senso_client
        self.runtime_config = runtime_config
        self.queue: asyncio.Queue[str] = asyncio.Queue()
        self.jobs: dict[str, PipelineJob] = {}
        self._worker_task: asyncio.Task[None] | None = None
        self._worker_ready = asyncio.Event()

    async def start(self) -> None:
        if self._worker_task is None:
            self._worker_task = asyncio.create_task(self._worker(), name="senso-veritas-pipeline-worker")
            self._worker_ready.set()

    async def stop(self) -> None:
        if self._worker_task:
            self._worker_task.cancel()
            try:
                await self._worker_task
            except asyncio.CancelledError:
                pass
            self._worker_task = None
        await asyncio.gather(
            self.ollama_client.aclose(),
            self.senso_client.aclose(),
            self.convex_client.aclose(),
            return_exceptions=True,
        )

    async def submit_run(self) -> PipelineJob:
        await self._worker_ready.wait()
        trace_id = uuid.uuid4().hex
        job_id = uuid.uuid4().hex
        now = int(time.time() * 1000)
        entries = self._load_ground_truth()
        job = PipelineJob(
            job_id=job_id,
            trace_id=trace_id,
            status="queued",
            total_queries=len(entries),
            started_at=now,
            updated_at=now,
        )
        self.jobs[job_id] = job
        await self.convex_client.mutation(
            "pipeline:createJob",
            {"job": job.model_dump(exclude_none=True)},
        )
        await self.queue.put(job_id)
        return job

    async def get_job(self, job_id: str) -> PipelineJob | None:
        if job_id in self.jobs:
            return self.jobs[job_id]
        try:
            payload = await self.convex_client.query("pipeline:getJob", {"job_id": job_id})
        except Exception:
            return None
        if not payload:
            return None
        job = PipelineJob.model_validate(payload)
        self.jobs[job_id] = job
        return job

    async def _worker(self) -> None:
        while True:
            job_id = await self.queue.get()
            try:
                await self._execute(job_id)
            except asyncio.CancelledError:
                raise
            except Exception as exc:  # pragma: no cover - worker safety net
                logger.exception("PIPELINE_WORKER_FAILED", extra={"job_id": job_id, "error": str(exc)})
                await self._mark_job_failed(job_id, str(exc))
            finally:
                self.queue.task_done()

    async def _execute(self, job_id: str) -> None:
        job = self.jobs[job_id]
        entries = self._load_ground_truth()
        await self._set_job_status(job_id, status="running")
        concurrency = max(1, self.settings.pipeline.max_concurrent_queries)
        semaphore = asyncio.Semaphore(concurrency)
        completed = 0
        failed = 0
        consecutive_failures = 0

        for entry in entries:
            async with semaphore:
                record = await self._process_single_query(job.trace_id, entry)
                await self.convex_client.mutation(
                    "audit:writeRecord",
                    {"record": record.model_dump(exclude_none=True)},
                )
                completed += 1
                if record.status == "failed":
                    failed += 1
                    consecutive_failures += 1
                else:
                    consecutive_failures = 0
                await self._update_job_progress(
                    job_id,
                    current_query_id=entry.id,
                    completed_queries=completed,
                    failed_queries=failed,
                )
                if consecutive_failures >= self.settings.resilience.consecutive_failures_threshold:
                    await self._mark_job_failed(
                        job_id,
                        f"Aborted after {consecutive_failures} consecutive failures",
                    )
                    return

        await self._set_job_status(job_id, status="success", finished=True)

    async def _process_single_query(self, trace_id: str, entry: GroundTruthEntry) -> AuditRecord:
        started = time.perf_counter()
        weights = self.runtime_config.get_weights()
        baseline_response_text = ""
        senso_response_text = ""
        senso_citations: list[str] = []
        baseline_judgment = None
        senso_judgment = None
        status = "success"
        error_message: str | None = None

        try:
            baseline_task = self.ollama_client.chat(
                model=self.settings.llm_providers.baseline.model,
                messages=[
                    {
                        "role": "system",
                        "content": "Answer the financial compliance question directly and concisely from your own knowledge.",
                    },
                    {"role": "user", "content": entry.query},
                ],
                temperature=0.0,
                timeout=self.settings.pipeline.baseline_llm_timeout,
            )
            senso_task = self.senso_client.search(entry.query, max_results=3)
            baseline_payload, senso_payload = await asyncio.gather(baseline_task, senso_task)
            baseline_response_text = self.ollama_client.extract_content(baseline_payload)
            senso_response_text = senso_payload.answer
            senso_citations = senso_payload.citations

            baseline_judgment, senso_judgment = await asyncio.gather(
                judge_response(
                    self.ollama_client,
                    model=self.settings.llm_providers.judge.model,
                    response_text=baseline_response_text,
                    key_facts=entry.key_facts,
                    timeout=self.settings.pipeline.judge_llm_timeout,
                ),
                judge_response(
                    self.ollama_client,
                    model=self.settings.llm_providers.judge.model,
                    response_text=senso_response_text,
                    key_facts=entry.key_facts,
                    timeout=self.settings.pipeline.judge_llm_timeout,
                ),
            )
        except Exception as exc:
            status = "failed"
            error_message = str(exc)
            logger.exception("QUERY_PROCESSING_FAILED", extra={"query_id": entry.id, "error": error_message})
            baseline_judgment = baseline_judgment or self._failed_judgment(error_message)
            senso_judgment = senso_judgment or self._failed_judgment(error_message)

        baseline_breakdown = compute_ncs(
            baseline_response_text,
            [],
            entry.key_facts,
            baseline_judgment.penalty if baseline_judgment else 0.0,
            weights,
            citation_boost=False,
        )
        senso_breakdown = compute_ncs(
            senso_response_text,
            senso_citations,
            entry.key_facts,
            senso_judgment.penalty if senso_judgment else 0.0,
            weights,
            citation_boost=True,
        )
        latency_ms = (time.perf_counter() - started) * 1000.0

        return AuditRecord(
            trace_id=trace_id,
            query_id=entry.id,
            category=entry.category,
            query_text=entry.query,
            ground_truth_answer=entry.ground_truth_answer,
            key_facts=entry.key_facts,
            source_document=entry.source_document,
            baseline_response=baseline_response_text,
            baseline_hallucination_detected=baseline_judgment.is_hallucination if baseline_judgment else False,
            baseline_hallucination_reason=baseline_judgment.reason if baseline_judgment else "",
            baseline_hallucination_penalty=baseline_judgment.penalty if baseline_judgment else 0.0,
            baseline_ncs=baseline_breakdown.normalized_ncs,
            baseline_raw_ncs=baseline_breakdown.raw_ncs,
            senso_response=senso_response_text,
            senso_citations=senso_citations,
            senso_hallucination_detected=senso_judgment.is_hallucination if senso_judgment else False,
            senso_hallucination_reason=senso_judgment.reason if senso_judgment else "",
            senso_hallucination_penalty=senso_judgment.penalty if senso_judgment else 0.0,
            narrative_control_score=senso_breakdown.normalized_ncs,
            raw_ncs=senso_breakdown.raw_ncs,
            ncs_delta=senso_breakdown.normalized_ncs - baseline_breakdown.normalized_ncs,
            citation_match=senso_breakdown.citation_match,
            key_fact_coverage=senso_breakdown.key_fact_coverage,
            weights_used=weights,
            latency_ms=latency_ms,
            status=status,
            error_message=error_message,
            created_at=int(time.time() * 1000),
        )

    def _failed_judgment(self, reason: str):
        from .models import HallucinationJudgment

        return HallucinationJudgment(
            is_hallucination=False,
            is_refusal=False,
            penalty=0.0,
            violated_facts=[],
            reason=reason[:100],
        )

    async def _set_job_status(self, job_id: str, *, status: str, finished: bool = False) -> None:
        job = self.jobs[job_id]
        now = int(time.time() * 1000)
        job.status = status  # type: ignore[assignment]
        job.updated_at = now
        if finished:
            job.finished_at = now
        self.jobs[job_id] = job
        await self.convex_client.mutation(
            "pipeline:updateJob",
            {"job_id": job_id, "patch": job.model_dump(exclude_none=True)},
        )

    async def _update_job_progress(
        self,
        job_id: str,
        *,
        current_query_id: str | None = None,
        completed_queries: int | None = None,
        failed_queries: int | None = None,
    ) -> None:
        job = self.jobs[job_id]
        if current_query_id is not None:
            job.current_query_id = current_query_id
        if completed_queries is not None:
            job.completed_queries = completed_queries
        if failed_queries is not None:
            job.failed_queries = failed_queries
        job.updated_at = int(time.time() * 1000)
        self.jobs[job_id] = job
        await self.convex_client.mutation(
            "pipeline:updateJob",
            {"job_id": job_id, "patch": job.model_dump(exclude_none=True)},
        )

    async def _mark_job_failed(self, job_id: str, message: str) -> None:
        job = self.jobs[job_id]
        job.status = "failed"
        job.error_message = message
        job.updated_at = int(time.time() * 1000)
        job.finished_at = job.updated_at
        self.jobs[job_id] = job
        await self.convex_client.mutation(
            "pipeline:updateJob",
            {"job_id": job_id, "patch": job.model_dump(exclude_none=True)},
        )

    def _load_ground_truth(self) -> list[GroundTruthEntry]:
        path = Path(self.settings.pipeline.ground_truth_file)
        if not path.is_absolute():
            path = Path(__file__).resolve().parents[1] / path
        data: list[dict[str, Any]] = json.loads(path.read_text())
        return [GroundTruthEntry.model_validate(item) for item in data]
