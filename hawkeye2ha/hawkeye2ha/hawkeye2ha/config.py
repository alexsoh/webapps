"""Load add-on options from /data/options.json."""
from __future__ import annotations

import json
import logging
from dataclasses import dataclass

from .const import OPTIONS_FILE

logger = logging.getLogger(__name__)


@dataclass
class Config:
    hawkeye2_url: str
    hawkeye2_port: int

    @property
    def hawkeye2_base(self) -> str:
        return f"{self.hawkeye2_url.rstrip('/')}:{self.hawkeye2_port}"


def load_config() -> Config:
    if not OPTIONS_FILE.exists():
        logger.warning("options.json not found, using defaults")
        return Config(hawkeye2_url="http://localhost", hawkeye2_port=8000)

    try:
        opts = json.loads(OPTIONS_FILE.read_text())
    except Exception:
        logger.error("Failed to parse options.json, using defaults", exc_info=True)
        return Config(hawkeye2_url="http://localhost", hawkeye2_port=8000)

    return Config(
        hawkeye2_url=opts.get("hawkeye2_url", "http://localhost").rstrip("/"),
        hawkeye2_port=int(opts.get("hawkeye2_port", 8000)),
    )
