from __future__ import annotations

from typing import Any

import httpx


class ConvexClient:
    def __init__(self, deployment_url: str | None, deploy_key: str | None = None) -> None:
        self.deployment_url = (deployment_url or "").rstrip("/")
        self.deploy_key = deploy_key or ""
        self._client = httpx.AsyncClient(timeout=30.0)

    def _url(self, kind: str) -> str:
        if not self.deployment_url:
            raise RuntimeError("CONVEX_DEPLOYMENT is not configured")
        return f"{self.deployment_url}/api/{kind}"

    async def aclose(self) -> None:
        await self._client.aclose()

    async def query(self, path: str, args: dict[str, Any] | None = None) -> Any:
        response = await self._client.post(
            self._url("query"),
            json={"path": path, "args": args or {}, "format": "json"},
        )
        response.raise_for_status()
        payload = response.json()
        if payload.get("status") != "success":
            raise RuntimeError(f"Convex query failed: {payload}")
        return payload.get("value")

    async def mutation(self, path: str, args: dict[str, Any] | None = None) -> Any:
        response = await self._client.post(
            self._url("mutation"),
            json={"path": path, "args": args or {}, "format": "json"},
        )
        response.raise_for_status()
        payload = response.json()
        if payload.get("status") != "success":
            raise RuntimeError(f"Convex mutation failed: {payload}")
        return payload.get("value")
