#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "=== Log Viewer ==="
echo ""

if [ ! -d "node_modules" ]; then
  echo "[1/2] Installing dependencies..."
  npm install --silent
else
  echo "[1/2] Dependencies already installed, skipping."
fi

echo "[2/2] Building production bundle..."
npm run build --silent

DIST="$SCRIPT_DIR/dist"
FILE_COUNT=$(find "$DIST" -type f | wc -l | tr -d ' ')
TOTAL_SIZE=$(du -sh "$DIST" | cut -f1)

echo ""
echo "Build complete:"
echo "  Output:  $DIST"
echo "  Files:   $FILE_COUNT"
echo "  Size:    $TOTAL_SIZE"
echo ""

echo "Starting preview server..."
npx vite preview
