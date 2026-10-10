#!/bin/sh
# Copy the playable game into the GitHub Pages folder.
set -e
cd "$(dirname "$0")"
DEST=../docs/kintsugi-daily
mkdir -p "$DEST"
rm -rf "$DEST/js"
cp -r js "$DEST/"
cp index.html icon.png "$DEST/"
echo "published to $DEST"
