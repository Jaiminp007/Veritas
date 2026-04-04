from __future__ import annotations

from fastapi import APIRouter, Request

from ..models import CategoryMetrics, SummaryMetrics

router = APIRouter(prefix="/metrics", tags=["metrics"])


@router.get("/summary", response_model=SummaryMetrics | None)
async def get_summary(request: Request):
    return await request.app.state.convex_client.query("queries:getSummary", {})


@router.get("/by-category", response_model=list[CategoryMetrics])
async def get_by_category(request: Request):
    return await request.app.state.convex_client.query("queries:getByCategory", {})


@router.get("/all")
async def get_all(request: Request):
    return await request.app.state.convex_client.query("queries:getAll", {})

