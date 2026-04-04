from __future__ import annotations

from datetime import datetime
from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, Field


class NCSWeights(BaseModel):
    model_config = ConfigDict(extra="ignore")

    alpha: float = 0.5
    beta: float = 0.8
    delta: float = 0.3


class GroundTruthEntry(BaseModel):
    model_config = ConfigDict(extra="ignore")

    id: str
    category: str
    query: str
    ground_truth_answer: str
    source_document: str
    key_facts: list[str]
    adversarial: bool = True
    expected_failure_mode: str | None = None


class ProviderConfig(BaseModel):
    model_config = ConfigDict(extra="ignore")

    provider: str
    model: str
    base_url: str


class SensoConfig(BaseModel):
    model_config = ConfigDict(extra="ignore")

    api_url: str
    timeout: float = 60.0


class PipelineConfig(BaseModel):
    model_config = ConfigDict(extra="ignore")

    max_concurrent_queries: int = 1
    ground_truth_file: str = "data/ground_truth.json"
    baseline_llm_timeout: float = 120.0
    senso_llm_timeout: float = 60.0
    judge_llm_timeout: float = 60.0


class LLMProviders(BaseModel):
    model_config = ConfigDict(extra="ignore")

    baseline: ProviderConfig
    judge: ProviderConfig


class ResilienceConfig(BaseModel):
    model_config = ConfigDict(extra="ignore")

    consecutive_failures_threshold: int = 3


class AppConfig(BaseModel):
    model_config = ConfigDict(extra="ignore")

    senso: SensoConfig
    pipeline: PipelineConfig
    llm_providers: LLMProviders
    resilience: ResilienceConfig
    ncs_weights: NCSWeights


class SensoSearchResult(BaseModel):
    model_config = ConfigDict(extra="ignore")

    content_id: str | None = None
    version_id: str | None = None
    chunk_index: int | None = None
    chunk_text: str | None = None
    score: float | None = None
    title: str | None = None
    vector_id: str | None = None


class BaselineLLMResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")

    response: str
    raw: dict[str, Any] = Field(default_factory=dict)


class SensoSearchResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")

    query: str
    answer: str
    results: list[SensoSearchResult] = Field(default_factory=list)
    raw: dict[str, Any] = Field(default_factory=dict)
    citations: list[str] = Field(default_factory=list)


class HallucinationJudgment(BaseModel):
    model_config = ConfigDict(extra="ignore")

    is_hallucination: bool
    is_refusal: bool
    penalty: float
    violated_facts: list[str] = Field(default_factory=list)
    reason: str


class AuditRecord(BaseModel):
    model_config = ConfigDict(extra="ignore")

    trace_id: str
    query_id: str
    category: str
    query_text: str
    ground_truth_answer: str
    key_facts: list[str]
    source_document: str
    baseline_response: str
    baseline_hallucination_detected: bool
    baseline_hallucination_reason: str
    baseline_hallucination_penalty: float
    baseline_ncs: float
    baseline_raw_ncs: float
    senso_response: str
    senso_citations: list[str]
    senso_hallucination_detected: bool
    senso_hallucination_reason: str
    senso_hallucination_penalty: float
    narrative_control_score: float
    raw_ncs: float
    ncs_delta: float
    citation_match: float
    key_fact_coverage: float
    weights_used: NCSWeights
    latency_ms: float
    status: Literal["success", "failed"]
    error_message: str | None = None
    created_at: int


class PipelineJob(BaseModel):
    model_config = ConfigDict(extra="ignore")

    job_id: str
    trace_id: str
    status: Literal["queued", "running", "success", "failed"]
    total_queries: int
    completed_queries: int = 0
    failed_queries: int = 0
    current_query_id: str | None = None
    started_at: int
    updated_at: int
    finished_at: int | None = None
    error_message: str | None = None


class PipelineRunResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")

    job_id: str
    trace_id: str
    status: str
    queued_at: datetime


class PipelineStatusResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")

    job: PipelineJob


class SummaryMetrics(BaseModel):
    model_config = ConfigDict(extra="ignore")

    total: int
    avg_senso_ncs: float
    avg_baseline_ncs: float
    avg_delta: float
    hallucination_rate_baseline: float
    hallucination_rate_senso: float
    citation_accuracy: float


class CategoryMetrics(BaseModel):
    model_config = ConfigDict(extra="ignore")

    category: str
    avg_senso_ncs: float
    avg_baseline_ncs: float
    avg_delta: float
    count: int


class WeightsUpdate(BaseModel):
    model_config = ConfigDict(extra="ignore")

    alpha: float
    beta: float
    delta: float

