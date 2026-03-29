# HawkEye2HA

Connects Home Assistant to a [HawkEye2](https://github.com/alexsoh/hawkeye2) instance.

## Configuration

| Option | Description | Default |
|--------|-------------|---------|
| `hawkeye2_url` | Base URL of your HawkEye2 service | `http://192.168.1.100` |
| `hawkeye2_port` | Port HawkEye2 is running on | `8000` |

## Setup

1. Configure `hawkeye2_url` and `hawkeye2_port` in the add-on options
2. Start the add-on
3. Open the ingress UI (click **Open Web UI**)
4. Go to the **Setup** page
5. Enter your desired topic prefix (e.g. `hawkeye2ha`)
6. Set the global idle timeout (seconds before a camera reverts from Detected to Idle)
7. Click **Discover** — HawkEye2 cameras will appear with checkboxes
8. Select the cameras you want to monitor; optionally expand **Advanced** per camera to set a custom idle timeout
9. Click **Install**

## Reconfigure

To add/remove cameras or change the topic prefix, go to the **Setup** page and click **Reconfigure**. This re-discovers cameras, applies setup-mqtt for selected cameras, and calls cleanup for deselected ones.

## Home Assistant Entities

Each configured camera creates a `binary_sensor.hawkeye2ha_{camera_id}` entity with:
- `device_class: motion`
- `state: on` — image received within the idle timeout window
- `state: off` — idle (no recent image)
- Attributes: `friendly_name`, `last_image` (ISO timestamp), `detected_objects` (list)
