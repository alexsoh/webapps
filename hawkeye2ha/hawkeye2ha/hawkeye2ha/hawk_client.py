"""Async HTTP client for HawkEye2 api/ha/* endpoints."""
from __future__ import annotations

import logging

import httpx

logger = logging.getLogger(__name__)

_client: httpx.AsyncClient | None = None


def _get_client(base_url: str) -> httpx.AsyncClient:
    global _client
    if _client is None or _client.is_closed or str(_client.base_url).rstrip("/") != base_url.rstrip("/"):
        if _client and not _client.is_closed:
            # base_url changed — close old client
            pass  # let GC handle; creating new below
        _client = httpx.AsyncClient(base_url=base_url, timeout=15)
    return _client


async def get_info(base_url: str) -> dict:
    """GET {base_url}/api/ha/info — returns mqtt info and camera list."""
    client = _get_client(base_url)
    r = await client.get("/api/ha/info")
    r.raise_for_status()
    return r.json()


async def setup_mqtt(
    base_url: str,
    broker: str,
    mqtt_port: int,
    cameras: list[dict],
) -> dict:
    """POST {base_url}/api/ha/setup-mqtt — creates/updates HA MQTT notifications."""
    body = {
        "mqttBroker": broker,
        "mqttPort": mqtt_port,
        "cameras": cameras,
    }
    client = _get_client(base_url)
    r = await client.post("/api/ha/setup-mqtt", json=body)
    r.raise_for_status()
    return r.json()


async def cleanup(base_url: str, camera_ids: list[str] | str) -> dict:
    """POST {base_url}/api/ha/cleanup — removes HA MQTT notifications."""
    body = {"cameraIds": camera_ids}
    client = _get_client(base_url)
    r = await client.post("/api/ha/cleanup", json=body)
    r.raise_for_status()
    return r.json()
