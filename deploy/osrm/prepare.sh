#!/usr/bin/env bash
# Astranov OSRM — optimized graph preparation
# Faster/smaller graphs via: region bbox · highway tags-filter · multi-thread extract · skip-if-fresh
#
# Usage:
#   ./prepare.sh                  # default REGION=rhodes (fast, delivery test)
#   REGION=greece ./prepare.sh    # full Greece
#   REGION=aegean ./prepare.sh    # South Aegean / Dodecanese
#   FORCE=1 ./prepare.sh          # rebuild even if graph exists
#   THREADS=8 ./prepare.sh
#
set -euo pipefail
ROOT="$(cd "$(dirname "$0")" && pwd)"
DATA="$ROOT/data"
mkdir -p "$DATA"
cd "$DATA"

REGION="${REGION:-rhodes}"
FORCE="${FORCE:-0}"
THREADS="${THREADS:-$(nproc 2>/dev/null || sysctl -n hw.ncpu 2>/dev/null || echo 4)}"
OSRM_IMG="${OSRM_IMG:-ghcr.io/project-osrm/osrm-backend:v5.27.1}"
OSMIUM_IMG="${OSMIUM_IMG:-iboates/osmium-tool:latest}"
GREECE_URL="${GREECE_URL:-https://download.geofabrik.de/europe/greece-latest.osm.pbf}"

# Bboxes: west,south,east,north (osmium -b)
# rhodes  — island + margin for coastal routing (owner sector Archangelos)
# aegean  — Dodecanese / South Aegean ops
# greece  — full nation (no cut)
case "$REGION" in
  rhodes|rodos)
    REGION=rhodes
    BBOX="27.60,35.75,28.50,36.55"
    LABEL="Rhodes + margin"
    ;;
  aegean|dodecanese)
    REGION=aegean
    BBOX="26.20,35.30,29.80,37.60"
    LABEL="South Aegean / Dodecanese"
    ;;
  greece|gr|full)
    REGION=greece
    BBOX=""
    LABEL="Full Greece"
    ;;
  custom)
    BBOX="${BBOX:?Set BBOX=west,south,east,north for REGION=custom}"
    LABEL="Custom bbox $BBOX"
    ;;
  *)
    echo "Unknown REGION=$REGION (rhodes|aegean|greece|custom)" >&2
    exit 1
    ;;
esac

GRAPH_STEM="${GRAPH_STEM:-astranov-${REGION}}"
PBF_RAW="greece-latest.osm.pbf"
PBF_CUT="${GRAPH_STEM}.cut.pbf"
PBF_FILT="${GRAPH_STEM}.highway.pbf"
OSRM_OUT="${GRAPH_STEM}.osrm"

log() { printf '· %s\n' "$*"; }
need_docker() {
  if ! command -v docker >/dev/null 2>&1; then
    echo "Docker required for extract" >&2
    exit 1
  fi
}

# Skip rebuild if final graph present and FORCE!=1
if [[ "$FORCE" != "1" && -f "${OSRM_OUT}" && -f "${OSRM_OUT}.cell_metrics" ]]; then
  log "Graph already built: $OSRM_OUT (FORCE=1 to rebuild)"
  ls -lh "${GRAPH_STEM}".osrm* 2>/dev/null || true
  echo "Start: GRAPH_STEM=$GRAPH_STEM docker compose -f $ROOT/docker-compose.yml up -d"
  exit 0
fi

need_docker

# 1) Source PBF (full Greece once — reused for all regions)
if [[ ! -f "$PBF_RAW" ]]; then
  log "Download Geofabrik Greece ($(basename "$GREECE_URL"))…"
  curl -L --fail --retry 3 --retry-delay 2 -o "${PBF_RAW}.part" "$GREECE_URL"
  mv "${PBF_RAW}.part" "$PBF_RAW"
else
  log "Reuse existing $PBF_RAW"
fi
ls -lh "$PBF_RAW"

# 2) Optional bbox cut (huge win vs full Greece extract)
if [[ -n "$BBOX" ]]; then
  if [[ "$FORCE" == "1" || ! -f "$PBF_CUT" ]]; then
    log "Cut bbox $BBOX ($LABEL)…"
    docker run --rm -v "$DATA:/data" "$OSMIUM_IMG" \
      osmium extract -b "$BBOX" --strategy=complete_ways \
      -o "/data/${PBF_CUT}" --overwrite "/data/${PBF_RAW}"
  else
    log "Reuse cut $PBF_CUT"
  fi
  SOURCE_PBF="$PBF_CUT"
else
  SOURCE_PBF="$PBF_RAW"
fi
ls -lh "$SOURCE_PBF"

# 3) Highway-only filter — drops buildings/POIs/landuse → much faster extract
if [[ "$FORCE" == "1" || ! -f "$PBF_FILT" ]]; then
  log "Filter highways + restrictions (tags-filter)…"
  # Keep only routing-relevant objects
  docker run --rm -v "$DATA:/data" "$OSMIUM_IMG" \
    osmium tags-filter "/data/$(basename "$SOURCE_PBF")" \
      w/highway \
      w/route=ferry \
      r/type=restriction \
      r/restriction \
      r/highway \
      n/highway \
      n/barrier \
      -o "/data/${PBF_FILT}" --overwrite
else
  log "Reuse filtered $PBF_FILT"
fi
ls -lh "$PBF_FILT"

# 4) OSRM extract + partition + customize in ONE container (no re-pull thrash)
log "OSRM extract -t $THREADS · $LABEL…"
docker run --rm -t \
  -v "$DATA:/data" \
  -e "OMP_NUM_THREADS=$THREADS" \
  "$OSRM_IMG" \
  bash -lc "
    set -e
    cd /data
    # rename for stable osrm stem
    ln -sfn '${PBF_FILT}' '${GRAPH_STEM}.osm.pbf'
    echo '== extract =='
    osrm-extract -p /opt/car.lua -t ${THREADS} '${GRAPH_STEM}.osm.pbf'
    echo '== partition (MLD) =='
    osrm-partition '${GRAPH_STEM}.osrm'
    echo '== customize =='
    osrm-customize '${GRAPH_STEM}.osrm'
    echo '== done =='
    ls -lh ${GRAPH_STEM}.osrm*
  "

# Marker for skip-if-fresh
touch "${OSRM_OUT}.cell_metrics" 2>/dev/null || true

# Write active region pointer for compose
echo "$GRAPH_STEM" > "$DATA/ACTIVE_GRAPH"
cat > "$DATA/graph.meta.json" <<META
{
  "region": "$REGION",
  "label": "$LABEL",
  "bbox": "$BBOX",
  "stem": "$GRAPH_STEM",
  "threads": $THREADS,
  "built_at": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "source": "$GREECE_URL",
  "filter": "highway+restriction+ferry",
  "algorithm": "mld"
}
META

log "Graph ready: $GRAPH_STEM"
ls -lh "${GRAPH_STEM}".osrm* 2>/dev/null | head -20
echo
echo "Sizes summary:"
du -sh "$PBF_RAW" "$SOURCE_PBF" "$PBF_FILT" "${GRAPH_STEM}.osrm" 2>/dev/null || true
echo
echo "Start server:"
echo "  cd $ROOT && docker compose up -d"
echo "Test Rhodes:"
echo "  curl -s 'http://127.0.0.1:5000/route/v1/driving/28.2176,36.4341;28.22,36.44?overview=false'"
