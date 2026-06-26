#!/usr/bin/env bash
# Build a Chrome Web Store upload zip containing only the runtime files.
set -euo pipefail
cd "$(dirname "$0")"

VER=$(node -p "require('./manifest.json').version")
OUT="dist/design-token-finder-${VER}.zip"

rm -rf dist
mkdir -p dist

# Only the files the extension actually runs. No test/, README, .git, dotfiles.
zip -r "$OUT" \
  manifest.json \
  background.js \
  popup.html popup.css popup.js \
  icons \
  -x "*.DS_Store" >/dev/null

echo "Built $OUT"
unzip -l "$OUT"
