# hawkeye2ha

Home Assistant AddOn that connects to a [HawkEye2](https://github.com/alexsoh/hawkeye2) instance, sets up per-camera MQTT image notifications, and displays a live camera dashboard inside Home Assistant.

## Features

- Discovers cameras from HawkEye2 via its HA integration API
- Configures MQTT image delivery per camera via HawkEye2
- Displays last received image per camera in an ingress dashboard
- Creates a `binary_sensor` entity per camera in HA (state: detected / idle)
- Configurable idle timeout (global + per-camera override)
- No dependency on HA's Mosquitto broker — uses HawkEye2's own MQTT broker

## Installation

1. Add this repository to your HA Add-on store
2. Install **hawkeye2ha**
3. Set `hawkeye2_url` and `hawkeye2_port` in the add-on configuration
4. Start the add-on and open the ingress UI
5. Enter a topic prefix, click **Discover**, select cameras, click **Install**
