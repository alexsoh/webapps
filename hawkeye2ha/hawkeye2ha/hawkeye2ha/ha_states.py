"""Push binary_sensor states into Home Assistant via the Core REST API."""
from __future__ import annotations

import logging
import os
import re

import httpx

logger = logging.getLogger(__name__)

_HA_API = "http://supervisor/core/api"
_SLUG_RE = re.compile(r"[^a-z0-9_]")
_client: httpx.AsyncClient | None = None


def _get_client() -> httpx.AsyncClient:
    global _client
    if _client is None or _client.is_closed:
        token = os.environ.get("SUPERVISOR_TOKEN", "")
        _client = httpx.AsyncClient(
            base_url=_HA_API,
            headers={"Authorization": f"Bearer {token}"} if token else {},
            timeout=5,
        )
    return _client


def _entity_id(camera_id: str) -> str:
    slug = _SLUG_RE.sub("_", camera_id.lower())
    return f"binary_sensor.hawkeye2ha_{slug}"


async def set_detected(
    camera_id: str,
    friendly_name: str,
    objects: list[str],
    last_image_ts: str,
) -> None:
    client = _get_client()
    if not client.headers.get("authorization"):
        return
    entity_id = _entity_id(camera_id)
    body = {
        "state": "on",
        "attributes": {
            "friendly_name": friendly_name,
            "device_class": "motion",
            "last_image": last_image_ts,
            "detected_objects": objects,
        },
    }
    try:
        await client.post(f"/states/{entity_id}", json=body)
    except Exception:
        logger.warning("Failed to set HA state on for %s", entity_id, exc_info=True)


async def set_idle(camera_id: str, friendly_name: str) -> None:
    client = _get_client()
    if not client.headers.get("authorization"):
        return
    entity_id = _entity_id(camera_id)
    body = {
        "state": "off",
        "attributes": {
            "friendly_name": friendly_name,
            "device_class": "motion",
        },
    }
    try:
        await client.post(f"/states/{entity_id}", json=body)
    except Exception:
        logger.warning("Failed to set HA state off for %s", entity_id, exc_info=True)
