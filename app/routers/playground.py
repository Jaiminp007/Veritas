from __future__ import annotations

import logging

from fastapi import APIRouter, HTTPException, Request

from ..models import PlaygroundRequest, PlaygroundResponse
from ..rate_limit import limiter

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/playground", tags=["playground"])


@router.post("/query", response_model=PlaygroundResponse)
@limiter.limit("5/minute")
async def playground_query(request: Request, body: PlaygroundRequest) -> PlaygroundResponse:
    manager = request.app.state.pipeline_manager
    try:
        result = await manager.run_playground_query(body.query)
    except Exception as exc:
        logger.exception("PLAYGROUND_QUERY_FAILED", extra={"error": str(exc)})
        raise HTTPException(status_code=500, detail="Query failed. Please try again.") from exc
    return PlaygroundResponse(query=body.query, **result)
