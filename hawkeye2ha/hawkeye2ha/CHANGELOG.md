# Changelog

## 0.1.0

- Initial release
- Discover cameras from HawkEye2 via `api/ha/info`
- Configure per-camera MQTT topics via `api/ha/setup-mqtt`
- Dashboard showing last received image per camera
- `binary_sensor` entity per camera (detected / idle)
- Configurable idle timeout (global + per-camera override)
- Reconfigure flow with cleanup for removed cameras
