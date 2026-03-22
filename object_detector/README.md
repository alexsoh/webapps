# YOLO Object Detector

A Python CLI tool that detects objects in images using YOLO models (YOLO11, YOLO12, YOLO26) via the [Ultralytics](https://docs.ultralytics.com/) SDK.

## Setup

```bash
cd project/object_detector
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

## Usage

```bash
# Basic detection (uses YOLO26n by default)
python detect.py photo.jpg

# Choose a different model
python detect.py photo.jpg --model yolo11m

# Set confidence threshold
python detect.py photo.jpg --confidence 0.5

# Filter for specific objects only
python detect.py photo.jpg --filter person,car,dog

# JSON output
python detect.py photo.jpg --json

# Save annotated image with bounding boxes
python detect.py photo.jpg --save-image result.jpg

# Combine flags
python detect.py photo.jpg --model yolo26s --filter person --confidence 0.4 --json --save-image output.png

# Force CPU inference
python detect.py photo.jpg --device cpu

# Use Apple Silicon GPU
python detect.py photo.jpg --device mps

# List available models
python detect.py --list-models

# List detectable class names (useful for --filter)
python detect.py --list-classes
python detect.py --list-classes --model yolo11n
```

## CLI Flags

| Flag | Description | Default |
|------|-------------|---------|
| `image_path` | Path to input image (required unless using `--list-*`) | — |
| `--model` | Model short name or `.pt` file path | `yolo26n` |
| `--confidence` | Minimum confidence threshold (0–1) | `0.25` |
| `--device` | Inference device: `cpu`, `0`/`1` (CUDA), `mps` (Apple Silicon) | auto |
| `--filter` | Comma-separated class names to keep | all |
| `--save-image` | Path to save annotated image with bounding boxes | — |
| `--json` | Output detections as JSON | table |
| `--list-models` | Print available model short names and exit | — |
| `--list-classes` | Print all class names the model can detect and exit | — |

## Models

Pretrained weights are **auto-downloaded** on first use to `~/.config/Ultralytics/`. No manual download needed.

Available model families (each in n/s/m/l/x sizes):

- **YOLO26** — latest, NMS-free end-to-end inference, up to 43% faster on CPU
- **YOLO12** — attention-based architecture
- **YOLO11** — widely used general-purpose detector

To use a custom or fine-tuned model, pass the full `.pt` file path:

```bash
python detect.py photo.jpg --model /path/to/custom_weights.pt
```

## Output

**Table (default):**
```
1. person  (0.9234)  [112.5, 45.2, 340.8, 510.3]
2. car     (0.8701)  [400.1, 200.0, 620.5, 380.7]
```

**JSON (`--json`):**
```json
[
  {"class": "person", "confidence": 0.9234, "bbox": [112.5, 45.2, 340.8, 510.3]},
  {"class": "car", "confidence": 0.8701, "bbox": [400.1, 200.0, 620.5, 380.7]}
]
```

**Annotated image (`--save-image`):** saves a copy of the input with bounding boxes, labels, and confidence scores drawn on detected objects.
