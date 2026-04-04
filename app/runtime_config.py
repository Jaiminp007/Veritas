from __future__ import annotations

from dataclasses import dataclass, field
from threading import Lock

from .models import AppConfig, NCSWeights


@dataclass
class RuntimeConfigStore:
    settings: AppConfig
    _weights: NCSWeights = field(init=False)
    _lock: Lock = field(default_factory=Lock, init=False)

    def __post_init__(self) -> None:
        self._weights = self.settings.ncs_weights

    def get_weights(self) -> NCSWeights:
        with self._lock:
            return self._weights

    def set_weights(self, weights: NCSWeights) -> NCSWeights:
        with self._lock:
            self._weights = weights
            return self._weights

