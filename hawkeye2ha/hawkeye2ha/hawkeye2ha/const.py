"""Runtime constants."""
from pathlib import Path

INGRESS_PORT = 8099
DATA_DIR = Path("/data")
IMAGES_DIR = DATA_DIR / "images"
OPTIONS_FILE = DATA_DIR / "options.json"
STATE_FILE = DATA_DIR / "state.json"
STATIC_DIR = Path("/opt/hawkeye2ha/static")
