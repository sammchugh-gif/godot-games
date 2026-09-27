#!/bin/sh
# Copy the playable game into the GitHub Pages folder. The Agent Rory HQ room
# that lists it lives with Zero Gravity (Game20/hq) and is published from there.
set -e
cd "$(dirname "$0")"
DEST=../docs/agent-rory-spectrum
mkdir -p "$DEST"
rm -rf "$DEST/js" "$DEST/css" "$DEST/voice"
cp -r js css voice "$DEST/"
cp index.html "$DEST/"
[ -f icon.png ] && cp icon.png "$DEST/"
echo "published to $DEST"
