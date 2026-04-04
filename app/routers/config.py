from __future__ import annotations

from fastapi import APIRouter, Request

from ..models import NCSWeights, WeightsUpdate

router = APIRouter(prefix="/config", tags=["config"])


@router.get("/weights", response_model=NCSWeights)
async def get_weights(request: Request) -> NCSWeights:
    return request.app.state.runtime_config.get_weights()


@router.put("/weights", response_model=NCSWeights)
async def update_weights(request: Request, payload: WeightsUpdate) -> NCSWeights:
    weights = NCSWeights.model_validate(payload.model_dump())
    request.app.state.runtime_config.set_weights(weights)
    return weights

