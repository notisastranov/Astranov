#!/usr/bin/env bash
# Prepare Greece OSM extract for OSRM (run on the VPS once)
set -euo pipefail
cd "$(dirname "$0")"
mkdir -p data
cd data

if [[ ! -f greece-latest.osm.pbf ]]; then
  echo "Downloading Geofabrik Greece extract…"
  curl -L --fail -o greece-latest.osm.pbf \
    https://download.geofabrik.de/europe/greece-latest.osm.pbf
fi

IMG=ghcr.io/project-osrm/osrm-backend:latest

echo "Extract…"
docker run --rm -t -v "$PWD:/data" "$IMG" \
  osrm-extract -p /opt/car.lua /data/greece-latest.osm.pbf

echo "Partition…"
docker run --rm -t -v "$PWD:/data" "$IMG" \
  osrm-partition /data/greece-latest.osrm

echo "Customize…"
docker run --rm -t -v "$PWD:/data" "$IMG" \
  osrm-customize /data/greece-latest.osrm

echo "Done. Start: docker compose up -d"
echo "Test: curl 'http://127.0.0.1:5000/route/v1/driving/28.2176,36.4341;28.22,36.44?overview=false'"
