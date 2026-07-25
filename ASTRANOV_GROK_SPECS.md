# DEPRECATED — do not use for implementation

**Superseded:** `2026-07-14` by:

1. **`astranov-continuity.js`** → `window.AstranovContinuity` (machine contract)
2. **`ASTRANOV_SPECS.md`** (human-readable full product specs + progress history)

This file previously held recycled chat specs that conflicted with the live app.

## Read instead

| File | Role |
|------|------|
| `astranov-continuity.js` | Features, economics, `doNotRemove`, `verify`, `buildHistory` |
| `ASTRANOV_SPECS.md` | Same content in markdown |
| `CLAUDE.md` | Agent entry + deploy |
| `ASTRANOV_SPACENET_MISSION.md` | Vision only |

## Current product snapshot (see SPECS for detail)

- Brand: **Astranov SpaceNet**
- Multi-tile + menu (Data / Social / Vendors / Order / Pilot)
- + and Send on input row
- Delivery: 3% platform · 15% vendor→driver gross · all-party confirms
- Pilot multi-stop by state · distance · priority
- Miner: field HUD only
- Perf: adaptive FPS + deferred pack

## Do not resurrect from old specs

- Single-file index only / no modules  
- globe-super-add as sole + target  
- CLI `#aci-miner` strip  
- Boot `LazyModules.ensure()` at 400ms  
