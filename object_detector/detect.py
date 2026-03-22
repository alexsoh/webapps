#!/usr/bin/env python3
"""YOLO Object Detection CLI — detect objects in images using YOLO11/12/26 models."""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

import cv2
from ultralytics import YOLO

AVAILABLE_MODELS = {
    "yolo11n": "yolo11n.pt", "yolo11s": "yolo11s.pt", "yolo11m": "yolo11m.pt",
    "yolo11l": "yolo11l.pt", "yolo11x": "yolo11x.pt",
    "yolo12n": "yolo12n.pt", "yolo12s": "yolo12s.pt", "yolo12m": "yolo12m.pt",
    "yolo12l": "yolo12l.pt", "yolo12x": "yolo12x.pt",
    "yolo26n": "yolo26n.pt", "yolo26s": "yolo26s.pt", "yolo26m": "yolo26m.pt",
    "yolo26l": "yolo26l.pt", "yolo26x": "yolo26x.pt",
}

DEFAULT_MODEL = "yolo26n"
DEFAULT_CONFIDENCE = 0.25


def resolve_model(name: str) -> str:
    return AVAILABLE_MODELS.get(name, name)


def detect_objects(
    image_path: str,
    model_name: str = DEFAULT_MODEL,
    confidence: float = DEFAULT_CONFIDENCE,
    filter_classes: list[str] | None = None,
    device: str | None = None,
) -> tuple[list[dict], list]:
    """Run YOLO detection and return (detections_list, raw_results)."""
    model = YOLO(resolve_model(model_name))
    results = model(image_path, conf=confidence, device=device, verbose=False)

    allowed = {c.lower() for c in filter_classes} if filter_classes else None
    detections: list[dict] = []

    for result in results:
        for box in result.boxes:
            cls_name = result.names[int(box.cls)]
            if allowed and cls_name.lower() not in allowed:
                continue
            detections.append({
                "class": cls_name,
                "confidence": round(float(box.conf), 4),
                "bbox": [round(v, 1) for v in box.xyxy[0].tolist()],
            })

    return detections, results


def print_table(detections: list[dict]) -> None:
    if not detections:
        print("No objects detected.")
        return
    for i, d in enumerate(detections, 1):
        bbox = ", ".join(f"{v:.1f}" for v in d["bbox"])
        print(f"{i}. {d['class']}  ({d['confidence']:.4f})  [{bbox}]")


def save_annotated_image(results: list, output_path: str) -> None:
    annotated = results[0].plot()
    cv2.imwrite(output_path, annotated)
    print(f"Annotated image saved to {output_path}")


def list_model_classes(model_name: str) -> None:
    model = YOLO(resolve_model(model_name))
    names = model.names
    print(f"Classes for {model_name} ({len(names)} total):\n")
    for idx, name in sorted(names.items()):
        print(f"  {idx:3d}: {name}")


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="Detect objects in an image using YOLO models (YOLO11, YOLO12, YOLO26).",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=(
            "examples:\n"
            "  python detect.py photo.jpg\n"
            "  python detect.py photo.jpg --model yolo11m --confidence 0.5\n"
            "  python detect.py photo.jpg --filter person,car --json\n"
            "  python detect.py photo.jpg --save-image result.jpg\n"
            "  python detect.py --list-models\n"
            "  python detect.py --list-classes"
        ),
    )
    parser.add_argument("image_path", nargs="?", help="Path to the input image file.")
    parser.add_argument(
        "--model", default=DEFAULT_MODEL,
        help=f"Model name (short name or .pt path). Default: {DEFAULT_MODEL}",
    )
    parser.add_argument(
        "--confidence", type=float, default=DEFAULT_CONFIDENCE,
        help=f"Minimum confidence threshold (0-1). Default: {DEFAULT_CONFIDENCE}",
    )
    parser.add_argument(
        "--device", default=None,
        help="Device for inference: auto (default), cpu, 0/1/.. (CUDA GPU), mps (Apple Silicon).",
    )
    parser.add_argument(
        "--filter",
        help="Comma-separated class names to keep (e.g. person,car,dog). Case-insensitive.",
    )
    parser.add_argument(
        "--save-image", metavar="PATH",
        help="Save annotated image with bounding boxes to the given path.",
    )
    parser.add_argument(
        "--json", action="store_true", dest="output_json",
        help="Output detections as JSON.",
    )
    parser.add_argument(
        "--list-models", action="store_true",
        help="Print available model short names and exit.",
    )
    parser.add_argument(
        "--list-classes", action="store_true",
        help="Load the model and print all detectable class names, then exit.",
    )
    return parser


def main() -> None:
    parser = build_parser()
    args = parser.parse_args()

    if args.list_models:
        print("Available models:\n")
        for name in sorted(AVAILABLE_MODELS):
            print(f"  {name}")
        sys.exit(0)

    if args.list_classes:
        list_model_classes(args.model)
        sys.exit(0)

    if not args.image_path:
        parser.error("image_path is required (unless using --list-models or --list-classes)")

    image = Path(args.image_path)
    if not image.exists():
        print(f"Error: image not found: {image}", file=sys.stderr)
        sys.exit(1)

    filter_classes = [c.strip() for c in args.filter.split(",")] if args.filter else None

    detections, results = detect_objects(
        image_path=str(image),
        model_name=args.model,
        confidence=args.confidence,
        filter_classes=filter_classes,
        device=args.device,
    )

    if args.output_json:
        print(json.dumps(detections, indent=2))
    else:
        print_table(detections)

    if args.save_image:
        save_annotated_image(results, args.save_image)


if __name__ == "__main__":
    main()
