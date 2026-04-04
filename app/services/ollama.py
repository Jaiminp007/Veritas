from __future__ import annotations

from collections.abc import Sequence
from typing import Any

import httpx
from tenacity import retry, retry_if_exception_type, stop_after_attempt, wait_exponential


class OllamaClient:
    def __init__(self, base_url: str, timeout: float) -> None:
        self.base_url = base_url.rstrip("/")
        self.timeout = timeout
        self._client = httpx.AsyncClient(base_url=self.base_url, timeout=timeout)

    async def aclose(self) -> None:
        await self._client.aclose()

    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=0.5, min=0.5, max=3.0),
        retry=retry_if_exception_type((httpx.HTTPError, TimeoutError)),
        reraise=True,
    )
    async def chat(
        self,
        *,
        model: str,
        messages: Sequence[dict[str, str]],
        temperature: float = 0.0,
        timeout: float | None = None,
    ) -> dict[str, Any]:
        response = await self._client.post(
            "/chat/completions",
            json={
                "model": model,
                "messages": list(messages),
                "temperature": temperature,
            },
            timeout=timeout,
        )
        response.raise_for_status()
        return response.json()

    @staticmethod
    def extract_content(payload: dict[str, Any]) -> str:
        choices = payload.get("choices") or []
        if not choices:
            raise ValueError(f"Ollama response missing choices: {payload}")
        message = choices[0].get("message") or {}
        content = message.get("content")
        if not content:
            raise ValueError(f"Ollama response missing message content: {payload}")
        return content
