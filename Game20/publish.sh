#!/bin/sh
# Copy the playable game into the GitHub Pages folder.
set -e
cd "$(dirname "$0")"
DEST=../docs/agent-rory-zero-gravity
mkdir -p "$DEST"
rm -rf "$DEST/js" "$DEST/css" "$DEST/models"
cp -r js css models "$DEST/"
cp index.html "$DEST/"
[ -f icon.png ] && cp icon.png "$DEST/"
echo "published to $DEST"
