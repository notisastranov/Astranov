#!/usr/bin/env bash
# Re-download Greece PBF and rebuild active region (weekly cron friendly)
set -euo pipefail
ROOT="$(cd "$(dirname "$0")" && pwd)"
DATA="$ROOT/data"
mkdir -p "$DATA"
REGION="${REGION:-$(cat "$DATA/ACTIVE_GRAPH" 2>/dev/null | sed 's/astranov-//' || echo rhodes)}"
# ACTIVE_GRAPH is stem astranov-rhodes → strip prefix for REGION if needed
if [[ -f "$DATA/graph.meta.json" ]]; then
  REGION=$(python3 -c "import json;print(json.load(open('$DATA/graph.meta.json'))['region'])" 2>/dev/null || echo "$REGION")
fi
log() { printf '· %s\n' "$*"; }
log "Update region=$REGION"
rm -f "$DATA/greece-latest.osm.pbf"
# drop derived so prepare rebuilds filter/extract
rm -f "$DATA"/astranov-"$REGION".cut.pbf \
      "$DATA"/astranov-"$REGION".highway.pbf \
      "$DATA"/astranov-"$REGION".osrm*
FORCE=1 REGION="$REGION" "$ROOT/prepare.sh"
