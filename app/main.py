from __future__ import annotations

import logging
import os
from contextlib import asynccontextmanager

import structlog
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware
from slowapi import _rate_limit_exceeded_handler

from .config import load_config
from .pipeline import PipelineManager
from .rate_limit import limiter
from .runtime_config import RuntimeConfigStore
from .routers import audit, config, metrics, pipeline
from .services.convex import ConvexClient
from .services.ollama import OllamaClient
from .services.senso import SensoClient


def configure_logging() -> None:
    logging.basicConfig(level=logging.INFO)
    structlog.configure(
        processors=[
            structlog.contextvars.merge_contextvars,
            structlog.processors.add_log_level,
            structlog.processors.TimeStamper(fmt="iso"),
            structlog.processors.JSONRenderer(),
        ],
        logger_factory=structlog.stdlib.LoggerFactory(),
        wrapper_class=structlog.stdlib.BoundLogger,
        cache_logger_on_first_use=True,
    )


@asynccontextmanager
async def lifespan(app: FastAPI):
    settings = load_config()
    runtime_config = RuntimeConfigStore(settings)
    convex_client = ConvexClient(
        deployment_url=os.getenv("CONVEX_DEPLOYMENT"),
        deploy_key=os.getenv("CONVEX_DEPLOY_KEY"),
    )
    ollama_client = OllamaClient(
        base_url=settings.llm_providers.baseline.base_url,
        timeout=max(settings.pipeline.baseline_llm_timeout, settings.pipeline.judge_llm_timeout),
    )
    senso_client = SensoClient(
        api_url=settings.senso.api_url,
        api_key=os.getenv("SENSO_API_KEY", ""),
        timeout=settings.senso.timeout,
    )
    manager = PipelineManager(
        settings_path=None,
        convex_client=convex_client,
        ollama_client=ollama_client,
        senso_client=senso_client,
        runtime_config=runtime_config,
    )

    app.state.settings = settings
    app.state.runtime_config = runtime_config
    app.state.convex_client = convex_client
    app.state.pipeline_manager = manager
    app.state.limiter = limiter

    await manager.start()
    try:
        yield
    finally:
        await manager.stop()


configure_logging()

app = FastAPI(title="Senso Veritas", version="1.0.0", lifespan=lifespan)
app.state.limiter = limiter
app.add_middleware(SlowAPIMiddleware)
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(pipeline.router)
app.include_router(metrics.router)
app.include_router(audit.router)
app.include_router(config.router)


@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}

