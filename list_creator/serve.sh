#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "=== CSV List Converter ==="
echo ""

if [ ! -d "node_modules" ]; then
  echo "[1/3] Installing dependencies..."
  npm install --silent
else
  echo "[1/3] Dependencies already installed, skipping."
fi

echo "[2/3] Building production bundle..."
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

echo "[3/3] Starting local server..."
echo "  Press Ctrl+C to stop."
echo ""

npx --yes serve "$DIST"
