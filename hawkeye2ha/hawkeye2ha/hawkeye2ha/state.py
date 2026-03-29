"""Persistent state: configured cameras, MQTT broker info, and settings."""
from __future__ import annotations

import json
import logging
import threading
from dataclasses import dataclass, field
from typing import Optional

from .const import IMAGES_DIR, STATE_FILE

logger = logging.getLogger(__name__)


@dataclass
class CameraState:
    id: str
    friendlyName: str
    topic: str
    idleTimeoutSeconds: Optional[int] = None
    lastImageTs: Optional[str] = None
    # In-memory only — not persisted to state.json
    state: str = field(default="idle", compare=False)
    detectedObjects: list[str] = field(default_factory=list, compare=False)
    lastEventTs: Optional[float] = field(default=None, compare=False)


@dataclass
class AppState:
    topicPrefix: str = "hawkeye2ha"
    idleTimeoutSeconds: int = 30
    mqttBroker: str = ""
    mqttPort: int = 1883
    mqttUsername: str = ""
    mqttPassword: str = ""
    cameras: list[CameraState] = field(default_factory=list)
    _lock: threading.Lock = field(default_factory=threading.Lock, repr=False, compare=False)

    def get_camera(self, camera_id: str) -> Optional[CameraState]:
        for cam in self.cameras:
            if cam.id == camera_id:
                return cam
        return None

    def effective_timeout(self, camera: CameraState) -> int:
        return camera.idleTimeoutSeconds if camera.idleTimeoutSeconds is not None else self.idleTimeoutSeconds

    def save(self) -> None:
        IMAGES_DIR.mkdir(parents=True, exist_ok=True)
        data = {
            "topicPrefix": self.topicPrefix,
            "idleTimeoutSeconds": self.idleTimeoutSeconds,
            "mqttBroker": self.mqttBroker,
            "mqttPort": self.mqttPort,
            "mqttUsername": self.mqttUsername,
            "mqttPassword": self.mqttPassword,
            "cameras": [
                {
                    "id": c.id,
                    "friendlyName": c.friendlyName,
                    "topic": c.topic,
                    "idleTimeoutSeconds": c.idleTimeoutSeconds,
                    "lastImageTs": c.lastImageTs,
                }
                for c in self.cameras
            ],
        }
        tmp = STATE_FILE.with_suffix(".tmp")
        tmp.write_text(json.dumps(data, indent=2))
        tmp.replace(STATE_FILE)
        logger.debug("State saved (%d camera(s))", len(self.cameras))


def load_state() -> AppState:
    IMAGES_DIR.mkdir(parents=True, exist_ok=True)

    if not STATE_FILE.exists():
        return AppState()

    try:
        data = json.loads(STATE_FILE.read_text())
    except Exception:
        logger.error("Failed to parse state.json, starting fresh", exc_info=True)
        return AppState()

    cameras = []
    for c in data.get("cameras", []):
        cid = c.get("id")
        if not cid:
            logger.warning("Skipping camera entry with missing id")
            continue
        cameras.append(
            CameraState(
                id=cid,
                friendlyName=c.get("friendlyName", ""),
                topic=c.get("topic", ""),
                idleTimeoutSeconds=c.get("idleTimeoutSeconds"),
                lastImageTs=c.get("lastImageTs"),
            )
        )

    return AppState(
        topicPrefix=data.get("topicPrefix", "hawkeye2ha"),
        idleTimeoutSeconds=data.get("idleTimeoutSeconds", 30),
        mqttBroker=data.get("mqttBroker", ""),
        mqttPort=data.get("mqttPort", 1883),
        mqttUsername=data.get("mqttUsername", ""),
        mqttPassword=data.get("mqttPassword", ""),
        cameras=cameras,
    )
