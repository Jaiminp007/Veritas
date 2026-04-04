from __future__ import annotations

from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException, Request

from ..models import PipelineRunResponse, PipelineStatusResponse
from ..rate_limit import limiter

router = APIRouter(prefix="/pipeline", tags=["pipeline"])


@router.post("/run", response_model=PipelineRunResponse)
@limiter.limit("2/minute")
async def run_pipeline(request: Request) -> PipelineRunResponse:
    manager = request.app.state.pipeline_manager
    job = await manager.submit_run()
    return PipelineRunResponse(
        job_id=job.job_id,
        trace_id=job.trace_id,
        status=job.status,
        queued_at=datetime.fromtimestamp(job.started_at / 1000, tz=timezone.utc),
    )


@router.get("/status/{job_id}", response_model=PipelineStatusResponse)
async def get_pipeline_status(job_id: str, request: Request) -> PipelineStatusResponse:
    manager = request.app.state.pipeline_manager
    job = await manager.get_job(job_id)
    if job is None:
        raise HTTPException(status_code=404, detail=f"Job not found: {job_id}")
    return PipelineStatusResponse(job=job)
