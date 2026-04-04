from __future__ import annotations

from fastapi import APIRouter, Request

router = APIRouter(prefix="/audit", tags=["audit"])


@router.get("/records")
async def get_records(request: Request):
    return await request.app.state.convex_client.query("queries:getAll", {})

