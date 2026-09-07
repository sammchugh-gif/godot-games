#!/bin/sh
# Copy the playable game into the GitHub Pages folder.
set -e
cd "$(dirname "$0")"
DEST=../docs/agent-rory
mkdir -p "$DEST"
rm -rf "$DEST/js" "$DEST/tex"
cp -r js tex "$DEST/"
cp index.html icon.png "$DEST/" 2>/dev/null || cp index.html "$DEST/"
echo "published to $DEST"
