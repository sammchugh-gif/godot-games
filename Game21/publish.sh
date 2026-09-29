#!/bin/sh
# Copy the playable game, with its recorded voices, into the GitHub Pages folder.
set -e
cd "$(dirname "$0")"
DEST=../docs/agent-rory-deep-red
mkdir -p "$DEST"
rm -rf "$DEST/js" "$DEST/css" "$DEST/models" "$DEST/voice"
cp -r js css models voice "$DEST/"
cp index.html icon.png "$DEST/"
echo "published to $DEST"
