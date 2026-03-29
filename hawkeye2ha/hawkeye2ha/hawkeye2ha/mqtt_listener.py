"""MQTT listener — subscribes to per-camera JSON and image topics."""
from __future__ import annotations

import asyncio
import json
import logging
from typing import Awaitable, Callable, Optional

try:
    import paho.mqtt.client as mqtt
    HAS_MQTT = True
except ImportError:
    HAS_MQTT = False

from .state import AppState, CameraState

logger = logging.getLogger(__name__)

OnJsonCallback = Callable[[str, list[str]], Awaitable[None]]
OnImageCallback = Callable[[str, bytes], Awaitable[None]]


class MqttListener:
    def __init__(
        self,
        state: AppState,
        on_json: OnJsonCallback,
        on_image: OnImageCallback,
        loop: asyncio.AbstractEventLoop,
    ) -> None:
        self._state = state
        self._on_json = on_json
        self._on_image = on_image
        self._loop = loop
        self._client: Optional[mqtt.Client] = None
        self._subscribed: set[str] = set()

    def start(self) -> None:
        if not HAS_MQTT:
            logger.warning("paho-mqtt not installed, MQTT disabled")
            return
        if not self._state.mqttBroker:
            logger.info("No MQTT broker configured — skipping MQTT connection")
            return

        self._client = mqtt.Client(mqtt.CallbackAPIVersion.VERSION2)
        if self._state.mqttUsername:
            self._client.username_pw_set(self._state.mqttUsername, self._state.mqttPassword)

        self._client.on_connect = self._on_connect
        self._client.on_disconnect = self._on_disconnect
        self._client.on_message = self._on_message

        try:
            self._client.connect(self._state.mqttBroker, self._state.mqttPort, keepalive=60)
            self._client.loop_start()
            logger.info("Connecting to MQTT %s:%d", self._state.mqttBroker, self._state.mqttPort)
        except Exception:
            logger.error("Failed to connect to MQTT broker", exc_info=True)

    def stop(self) -> None:
        if self._client:
            self._client.loop_stop()
            self._client.disconnect()
            self._client = None
            self._subscribed.clear()

    def reconnect(self) -> None:
        """Reconnect to broker — call after broker credentials change."""
        self.stop()
        self.start()

    def update_subscriptions(self) -> None:
        """Re-sync topic subscriptions with current state cameras."""
        if not self._client:
            self.start()
            return
        self._resubscribe()

    def _on_connect(self, _client: mqtt.Client, _ud: object, _flags: object, rc: int, _props: object = None) -> None:
        if rc == 0:
            logger.info("Connected to MQTT broker")
            self._resubscribe()
        else:
            logger.error("MQTT connection failed rc=%d", rc)

    def _on_disconnect(self, _client: mqtt.Client, _ud: object, _flags: object, rc: int, _props: object = None) -> None:
        if rc != 0:
            logger.warning("MQTT disconnected unexpectedly rc=%d", rc)

    def _resubscribe(self) -> None:
        if not self._client:
            return
        # Unsubscribe all then resubscribe from current state
        for topic in list(self._subscribed):
            self._client.unsubscribe(topic)
        self._subscribed.clear()

        for cam in self._state.cameras:
            self._subscribe_camera(cam)

    def _subscribe_camera(self, cam: CameraState) -> None:
        if not self._client:
            return
        for topic in (cam.topic, f"{cam.topic}/image"):
            if topic not in self._subscribed:
                self._client.subscribe(topic)
                self._subscribed.add(topic)
                logger.debug("Subscribed: %s", topic)

    def _on_message(self, _client: mqtt.Client, _ud: object, msg: mqtt.MQTTMessage) -> None:
        topic: str = msg.topic
        payload: bytes = msg.payload
        if not payload:
            return

        is_image = topic.endswith("/image")
        base_topic = topic[: -len("/image")] if is_image else topic

        cam = next((c for c in self._state.cameras if c.topic == base_topic), None)
        if cam is None:
            return

        if is_image:
            asyncio.run_coroutine_threadsafe(
                self._on_image(cam.id, payload),
                self._loop,
            )
        else:
            try:
                data = json.loads(payload.decode("utf-8"))
                objects: list[str] = data.get("objects", [])
            except Exception:
                objects = []
            asyncio.run_coroutine_threadsafe(
                self._on_json(cam.id, objects),
                self._loop,
            )
