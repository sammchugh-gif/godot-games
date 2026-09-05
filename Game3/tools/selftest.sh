#!/bin/sh
# Headless self-test: builds every circuit, checks geometry, simulates a race.
G=${GODOT:-/tmp/claude-0/-home-user-godot-games/70ed77ab-b617-5fe6-aecb-1167f0a12c22/scratchpad/tools/Godot_v4.7.2-stable_linux.x86_64}
LOG=${LOG:-/tmp/claude-0/-home-user-godot-games/70ed77ab-b617-5fe6-aecb-1167f0a12c22/scratchpad/selftest.log}
cd "$(dirname "$0")/.." || exit 1
"$G" --headless --path . --import > /dev/null 2>&1
timeout ${T:-120} "$G" --headless --path . --quit-after ${FRAMES:-3000} -- --selftest "$@" > "$LOG" 2>&1
code=$?
grep -v -E "^$" "$LOG" | grep -v "Godot Engine v" | head -${LINES:-80}
echo "exit $code"
