#!/bin/sh
set -eu
cd /workspace
if curl -sf -o /dev/null --max-time 2 http://127.0.0.1:8080/; then
  exit 0
fi
# Prefer astranov static server
if [ -f /workspace/scripts/serve-astranov.mjs ]; then
  node /workspace/scripts/serve-astranov.mjs >>/tmp/app-startup.log 2>&1 &
elif [ -f /workspace/astranov/serve-astranov.mjs ]; then
  node /workspace/astranov/serve-astranov.mjs >>/tmp/app-startup.log 2>&1 &
elif [ -f /workspace/package.json ]; then
  npm run dev >>/tmp/app-startup.log 2>&1 &
fi
