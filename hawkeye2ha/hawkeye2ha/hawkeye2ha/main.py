"""Main entry point — wires together config, state, MQTT, watchdog, and web server."""
from __future__ import annotations

import asyncio
import logging
import signal
import sys
import time
from datetime import datetime, timezone

import uvicorn

from .config import load_config
from .const import IMAGES_DIR, INGRESS_PORT
from .state import load_state
from . import ha_states
from .mqtt_listener import MqttListener
from .web.app import create_app

logger = logging.getLogger("hawkeye2ha")


# ---------------------------------------------------------------------------
# MQTT event callbacks
# ---------------------------------------------------------------------------

_state = None
_listener = None
_last_save_ts: float = 0.0
_SAVE_DEBOUNCE_SECS = 2.0


async def _on_json_received(camera_id: str, objects: list[str]) -> None:
    if _state is None:
        return
    cam = _state.get_camera(camera_id)
    if cam is None:
        return
    cam.detectedObjects = objects
    cam.state = "detected"
    cam.lastEventTs = time.time()
    ts = datetime.now(timezone.utc).isoformat()
    await ha_states.set_detected(cam.id, cam.friendlyName, objects, ts)


async def _on_image_received(camera_id: str, image_bytes: bytes) -> None:
    if _state is None:
        return
    cam = _state.get_camera(camera_id)
    if cam is None:
        return
    img_path = IMAGES_DIR / f"{camera_id}.jpg"
    try:
        # Offload blocking file write to a thread so the event loop stays responsive
        await asyncio.to_thread(img_path.write_bytes, image_bytes)
    except Exception:
        logger.error("Failed to write image for %s", camera_id, exc_info=True)
        return
    global _last_save_ts
    ts = datetime.now(timezone.utc).isoformat()
    cam.lastImageTs = ts
    cam.lastEventTs = time.time()
    cam.state = "detected"
    now = time.time()
    if (now - _last_save_ts) >= _SAVE_DEBOUNCE_SECS:
        with _state._lock:
            _state.save()
        _last_save_ts = now


# ---------------------------------------------------------------------------
# Idle watchdog
# ---------------------------------------------------------------------------

async def _idle_watchdog() -> None:
    while True:
        await asyncio.sleep(5)
        if _state is None:
            continue
        now = time.time()
        any_transitioned = False
        for cam in list(_state.cameras):
            if cam.state != "detected":
                continue
            if cam.lastEventTs is None:
                continue
            timeout = _state.effective_timeout(cam)
            if (now - cam.lastEventTs) > timeout:
                cam.state = "idle"
                any_transitioned = True
                logger.debug("Camera %s → idle", cam.friendlyName)
                await ha_states.set_idle(cam.id, cam.friendlyName)
        if any_transitioned:
            with _state._lock:
                _state.save()


# ---------------------------------------------------------------------------
# Startup
# ---------------------------------------------------------------------------

async def _run() -> None:
    global _state, _listener

    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
        stream=sys.stdout,
    )
    logger.info("hawkeye2ha starting")

    config = load_config()
    _state = load_state()

    logger.info(
        "HawkEye2: %s  |  MQTT: %s:%d  |  cameras: %d",
        config.hawkeye2_base,
        _state.mqttBroker or "(none)",
        _state.mqttPort,
        len(_state.cameras),
    )

    # Initialise all known cameras to "off" in HA on startup
    for cam in _state.cameras:
        await ha_states.set_idle(cam.id, cam.friendlyName)

    loop = asyncio.get_running_loop()
    _listener = MqttListener(_state, _on_json_received, _on_image_received, loop)
    _listener.start()

    app = create_app(config, _state, _listener)
    app.state.last_discover = None

    server_config = uvicorn.Config(
        app,
        host="0.0.0.0",
        port=INGRESS_PORT,
        log_level="warning",
        access_log=False,
    )
    server = uvicorn.Server(server_config)

    shutdown_event = asyncio.Event()

    def _handle_signal() -> None:
        logger.info("Shutdown signal received")
        shutdown_event.set()

    for sig in (signal.SIGTERM, signal.SIGINT):
        loop.add_signal_handler(sig, _handle_signal)

    watchdog_task = asyncio.create_task(_idle_watchdog())
    server_task = asyncio.create_task(server.serve())

    await shutdown_event.wait()

    logger.info("Shutting down...")
    watchdog_task.cancel()
    server.should_exit = True
    await server_task

    _listener.stop()
    logger.info("hawkeye2ha stopped")


def main() -> None:
    try:
        asyncio.run(_run())
    except KeyboardInterrupt:
        pass


if __name__ == "__main__":
    main()
