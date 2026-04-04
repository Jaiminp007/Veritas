from __future__ import annotations

from typing import Any

import httpx
from tenacity import retry, retry_if_exception_type, stop_after_attempt, wait_exponential

from ..models import SensoSearchResponse, SensoSearchResult


class SensoClient:
    def __init__(self, api_url: str, api_key: str, timeout: float) -> None:
        self.api_url = api_url.rstrip("/")
        self.timeout = timeout
        self._client = httpx.AsyncClient(
            base_url=self.api_url.rsplit("/org/search", 1)[0],
            timeout=timeout,
            headers={
                "X-API-Key": api_key,
                "Content-Type": "application/json",
                "Accept": "application/json",
            },
        )

    async def aclose(self) -> None:
        await self._client.aclose()

    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=0.5, min=0.5, max=3.0),
        retry=retry_if_exception_type((httpx.HTTPError, TimeoutError)),
        reraise=True,
    )
    async def search(self, query: str, *, max_results: int = 3) -> SensoSearchResponse:
        response = await self._client.post(
            "/org/search",
            json={"query": query, "max_results": max_results},
        )
        response.raise_for_status()
        data: dict[str, Any] = response.json()
        if not data.get("answer"):
            raise ValueError(f"Senso returned no answer field. Keys: {sorted(data.keys())}")

        results = [
            SensoSearchResult.model_validate(item)
            for item in data.get("results", [])
            if isinstance(item, dict)
        ]
        citations = [
            self._format_citation(result)
            for result in results
            if result.chunk_text or result.title
        ]
        return SensoSearchResponse(
            query=str(data.get("query", query)),
            answer=str(data["answer"]),
            results=results,
            raw=data,
            citations=citations,
        )

    @staticmethod
    def _format_citation(result: SensoSearchResult) -> str:
        parts: list[str] = []
        if result.title:
            parts.append(result.title)
        if result.chunk_index is not None:
            parts.append(f"chunk {result.chunk_index}")
        if result.score is not None:
            parts.append(f"score {result.score:.3f}")
        if result.chunk_text:
            parts.append(result.chunk_text[:400].strip())
        return " | ".join(parts)
