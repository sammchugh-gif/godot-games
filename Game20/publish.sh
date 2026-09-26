#!/bin/sh
# Copy the playable game, and the 3D Agent Rory HQ room that runs on its
# engine, into the GitHub Pages folder.
set -e
cd "$(dirname "$0")"
DEST=../docs/agent-rory-zero-gravity
mkdir -p "$DEST"
rm -rf "$DEST/js" "$DEST/css" "$DEST/models"
cp -r js css models "$DEST/"
cp index.html "$DEST/"
[ -f icon.png ] && cp icon.png "$DEST/"
HQ=../docs/agent-rory-hq
mkdir -p "$HQ"
cp hq/index.html hq/room.js hq/list.html hq/icon.png hq/agents.jpg "$HQ/"
echo "published to $DEST and $HQ"
