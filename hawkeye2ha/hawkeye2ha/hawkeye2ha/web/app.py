"""FastAPI web application — API endpoints and static SPA serving."""
from __future__ import annotations

import logging
from typing import List, Optional

from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import FileResponse, HTMLResponse, Response
from pydantic import BaseModel

from ..config import Config
from ..state import AppState, CameraState
from ..const import IMAGES_DIR, STATIC_DIR
from .. import hawk_client, ha_states

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Request / Response models
# ---------------------------------------------------------------------------

class InstallRequest(BaseModel):
    topicPrefix: str
    selected: List[str]
    deselected: List[str]


class ConfigUpdateRequest(BaseModel):
    topicPrefix: Optional[str] = None
    idleTimeoutSeconds: Optional[int] = None


class CameraUpdateRequest(BaseModel):
    idleTimeoutSeconds: Optional[int] = None


def _unique(items: List[str]) -> List[str]:
    seen: set[str] = set()
    out: List[str] = []
    for item in items:
        if item not in seen:
            seen.add(item)
            out.append(item)
    return out


# ---------------------------------------------------------------------------
# App factory
# ---------------------------------------------------------------------------

def create_app(config: Config, state: AppState, mqtt_listener) -> FastAPI:
    app = FastAPI(title="hawkeye2ha", docs_url=None, redoc_url=None)
    app.state.config = config
    app.state.app_state = state
    app.state.mqtt_listener = mqtt_listener

    # ------------------------------------------------------------------
    # Health
    # ------------------------------------------------------------------

    @app.get("/health")
    async def health() -> dict:
        return {"status": "ok"}

    # ------------------------------------------------------------------
    # Config
    # ------------------------------------------------------------------

    @app.get("/api/config")
    async def get_config(request: Request) -> dict:
        cfg: Config = request.app.state.config
        s: AppState = request.app.state.app_state
        return {
            "hawkeye2Url": cfg.hawkeye2_url,
            "hawkeye2Port": cfg.hawkeye2_port,
            "topicPrefix": s.topicPrefix,
            "idleTimeoutSeconds": s.idleTimeoutSeconds,
        }

    @app.put("/api/config")
    async def update_config(body: ConfigUpdateRequest, request: Request) -> dict:
        s: AppState = request.app.state.app_state
        with s._lock:
            if body.topicPrefix is not None:
                s.topicPrefix = body.topicPrefix.strip()
            if body.idleTimeoutSeconds is not None:
                s.idleTimeoutSeconds = max(5, body.idleTimeoutSeconds)
            s.save()
        return {"status": "ok"}

    # ------------------------------------------------------------------
    # Discover
    # ------------------------------------------------------------------

    @app.get("/api/discover")
    async def discover(request: Request) -> dict:
        cfg: Config = request.app.state.config
        try:
            info = await hawk_client.get_info(cfg.hawkeye2_base)
        except Exception as exc:
            raise HTTPException(status_code=502, detail=f"HawkEye2 unreachable: {exc}") from exc
        # Cache last discover on app state for use in install
        request.app.state.last_discover = info
        return info

    # ------------------------------------------------------------------
    # Install
    # ------------------------------------------------------------------

    @app.post("/api/install")
    async def install(body: InstallRequest, request: Request) -> dict:
        cfg: Config = request.app.state.config
        s: AppState = request.app.state.app_state
        listener = request.app.state.mqtt_listener

        selected_ids = _unique(body.selected)
        deselected_ids = _unique(body.deselected)
        conflicting_ids = sorted(set(selected_ids) & set(deselected_ids))
        if conflicting_ids:
            raise HTTPException(
                status_code=400,
                detail=f"camera id(s) cannot be both selected and deselected: {', '.join(conflicting_ids)}",
            )

        # Fetch fresh info to get authoritative broker details + friendly names
        try:
            info = await hawk_client.get_info(cfg.hawkeye2_base)
        except Exception as exc:
            raise HTTPException(status_code=502, detail=f"HawkEye2 unreachable: {exc}") from exc

        mqtt_info = info.get("mqtt", {})
        broker = mqtt_info.get("broker", "")
        raw_port = mqtt_info.get("port", 1883)
        try:
            mqtt_port = int(raw_port)
        except (TypeError, ValueError):
            raise HTTPException(status_code=502, detail=f"Invalid MQTT port from HawkEye2: {raw_port!r}")

        if not broker:
            raise HTTPException(status_code=400, detail="HawkEye2 has no MQTT broker configured")

        name_by_id: dict[str, str] = {}
        for camera in info.get("cameras", []):
            cid = camera.get("id")
            if not cid:
                logger.warning("Skipping camera entry from HawkEye2 with missing id")
                continue
            name_by_id[cid] = camera.get("friendlyName", cid)

        unknown_selected = [cid for cid in selected_ids if cid not in name_by_id]
        if unknown_selected:
            raise HTTPException(
                status_code=400,
                detail=f"Unknown selected camera id(s): {', '.join(unknown_selected)}",
            )
        prefix = body.topicPrefix.strip() or "hawkeye2ha"

        # Setup selected cameras
        setup_errors: list[dict] = []
        if selected_ids:
            cam_entries = [
                {"cameraId": cid, "topic": f"{prefix}/{cid}"}
                for cid in selected_ids
            ]
            try:
                setup_result = await hawk_client.setup_mqtt(cfg.hawkeye2_base, broker, mqtt_port, cam_entries)
                setup_errors = setup_result.get("errors", [])
            except Exception as exc:
                raise HTTPException(status_code=502, detail=f"setup-mqtt failed: {exc}") from exc

        # Cleanup deselected cameras
        cleanup_errors: list[dict] = []
        if deselected_ids:
            try:
                cleanup_result = await hawk_client.cleanup(cfg.hawkeye2_base, deselected_ids)
                cleanup_errors = cleanup_result.get("errors", [])
            except Exception as exc:
                logger.warning("cleanup call failed: %s", exc)

        # Update state — capture old broker info before overwriting
        broker_changed = (broker != s.mqttBroker or mqtt_port != s.mqttPort)

        with s._lock:
            s.topicPrefix = prefix
            s.mqttBroker = broker
            s.mqttPort = mqtt_port
            s.mqttUsername = mqtt_info.get("username", "")
            s.mqttPassword = mqtt_info.get("password", "")

            existing_ids = {c.id for c in s.cameras}
            deselected_set = set(deselected_ids)
            newly_added: list[str] = []

            for cid in selected_ids:
                if cid not in existing_ids:
                    s.cameras.append(
                        CameraState(
                            id=cid,
                            friendlyName=name_by_id.get(cid, cid),
                            topic=f"{prefix}/{cid}",
                        )
                    )
                    newly_added.append(cid)
                else:
                    cam = s.get_camera(cid)
                    if cam:
                        cam.topic = f"{prefix}/{cid}"

            s.cameras = [c for c in s.cameras if c.id not in deselected_set]
            s.save()

        if broker_changed:
            listener.reconnect()
        else:
            listener.update_subscriptions()

        for cid in newly_added:
            cam = s.get_camera(cid)
            if cam:
                await ha_states.set_idle(cam.id, cam.friendlyName)

        # Clear HA states for removed cameras
        for cid in deselected_ids:
            friendly = name_by_id.get(cid, cid)
            await ha_states.set_idle(cid, friendly)

        return {
            "status": "ok",
            "setupErrors": setup_errors,
            "cleanupErrors": cleanup_errors,
        }

    # ------------------------------------------------------------------
    # Cameras
    # ------------------------------------------------------------------

    @app.get("/api/cameras")
    async def get_cameras(request: Request) -> List[dict]:
        s: AppState = request.app.state.app_state
        return [
            {
                "id": c.id,
                "friendlyName": c.friendlyName,
                "topic": c.topic,
                "state": c.state,
                "detectedObjects": c.detectedObjects,
                "lastImageTs": c.lastImageTs,
                "idleTimeoutSeconds": c.idleTimeoutSeconds,
                "effectiveTimeout": s.effective_timeout(c),
            }
            for c in s.cameras
        ]

    @app.get("/api/cameras/{camera_id}/image")
    async def get_camera_image(camera_id: str, request: Request) -> Response:
        s: AppState = request.app.state.app_state
        if not s.get_camera(camera_id):
            raise HTTPException(status_code=404, detail="Camera not found")
        img_path = IMAGES_DIR / f"{camera_id}.jpg"
        if not img_path.exists():
            raise HTTPException(status_code=404, detail="No image received yet")
        return FileResponse(str(img_path), media_type="image/jpeg")

    @app.put("/api/cameras/{camera_id}")
    async def update_camera(camera_id: str, body: CameraUpdateRequest, request: Request) -> dict:
        s: AppState = request.app.state.app_state
        cam = s.get_camera(camera_id)
        if cam is None:
            raise HTTPException(status_code=404, detail="Camera not found")
        if body.idleTimeoutSeconds is not None:
            if body.idleTimeoutSeconds < 5 or body.idleTimeoutSeconds > 3600:
                raise HTTPException(status_code=400, detail="idleTimeoutSeconds must be between 5 and 3600")
        with s._lock:
            cam.idleTimeoutSeconds = body.idleTimeoutSeconds
            s.save()
        return {"status": "ok"}

    @app.delete("/api/cameras/{camera_id}")
    async def delete_camera(camera_id: str, request: Request) -> dict:
        cfg: Config = request.app.state.config
        s: AppState = request.app.state.app_state
        listener = request.app.state.mqtt_listener

        cam = s.get_camera(camera_id)
        if cam is None:
            raise HTTPException(status_code=404, detail="Camera not found")

        friendly = cam.friendlyName

        # Tell HawkEye2 to remove this camera's HA notification
        try:
            await hawk_client.cleanup(cfg.hawkeye2_base, [camera_id])
        except Exception:
            logger.warning("cleanup call failed for %s", camera_id, exc_info=True)

        # Remove from state
        with s._lock:
            s.cameras = [c for c in s.cameras if c.id != camera_id]
            s.save()

        listener.update_subscriptions()

        # Delete cached image
        img = IMAGES_DIR / f"{camera_id}.jpg"
        if img.exists():
            img.unlink(missing_ok=True)

        # Clear HA entity state
        await ha_states.set_idle(camera_id, friendly)

        return {"status": "ok"}

    # ------------------------------------------------------------------
    # SPA fallback — serve static files, index.html for unknown routes
    # ------------------------------------------------------------------

    @app.get("/{full_path:path}")
    async def spa_fallback(full_path: str) -> Response:
        if full_path:
            candidate = (STATIC_DIR / full_path).resolve()
            # Guard against path traversal outside the static directory
            if candidate.is_file() and candidate.is_relative_to(STATIC_DIR.resolve()):
                return FileResponse(str(candidate))
        index = STATIC_DIR / "index.html"
        if index.exists():
            return FileResponse(str(index))
        return HTMLResponse(
            "<h1>UI not built</h1><p>Run <code>cd frontend && npm install && npm run build</code></p>",
            status_code=503,
        )

    return app
