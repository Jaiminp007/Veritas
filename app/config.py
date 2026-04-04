from __future__ import annotations

from functools import lru_cache
from pathlib import Path

import yaml

from .models import AppConfig


@lru_cache(maxsize=1)
def load_config(config_path: str | Path | None = None) -> AppConfig:
    path = Path(config_path or Path(__file__).with_name("config.yaml"))
    data = yaml.safe_load(path.read_text())
    return AppConfig.model_validate(data)

