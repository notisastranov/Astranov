# OSRM profiles

Default pipeline uses the image’s stock **`/opt/car.lua`** (car/driving).

Graph size is reduced **before** extract via `osmium tags-filter` (highways + turn restrictions only).
Mount a custom profile only if you know OSRM lua well:

```bash
osrm-extract -p /data/profiles/your.lua /data/graph.osm.pbf
```
