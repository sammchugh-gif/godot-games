#!/bin/sh
# Headless self-test: solves every puzzle with its known solution, checks
# none of them solve themselves, and plays two Stampede rounds.
G=${GODOT:-godot}
cd "$(dirname "$0")/.." || exit 1
"$G" --headless --path . --import > /dev/null 2>&1
"$G" --headless --path . -- --selftest > /tmp/lizard_selftest.log 2>&1
code=$?
grep -v "Godot Engine v" /tmp/lizard_selftest.log | grep -v "^$"
echo "exit $code"
exit $code
