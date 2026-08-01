# Grok Build → Astranov SpaceNet (mesh peers port)

**Date:** 2026-08-01  
**Source:** Grok Build React SpaceNet ops demo (peer mesh HUD)  
**Target:** `js/spacenet/mesh-peers.js` (additive only)

## What was taken

- Role-colored global **peer roster** (self / friend / competitor / vendor)
- Demo **mesh routes** between ops nodes
- Layer toggles: friends · competitors · vendors · routes
- CLI surface: `peers` · `peer <city>` · `layers` · `hide|show friends|…`

## What was deliberately NOT touched

Per `ASTRANOV_SPACENET_GUIDE.md` + `support/PRODUCT-RULES.md`:

- Globe inertia (`velX`/`velY` / damp)
- One-finger CLI drag / free dock / expand-retract
- Zoom tiers / SPACENET dive grid
- Field miner, AC currency, marketplace, crawlers, city maps
- No rewrite of `globe.js` / `cli.js` / `field.js`

## How it loads

- Soft module in `WAVE_APP` (`boot.js`) after juice modules
- Init only after idle app wave — never on critical shell path
- Visualization via public `SNGlobe.pulse` / `flyNear` only

## CLI

```
peers
peers list
peers paint
peer athens
layers
hide competitors
show vendors
```

## Rollback

Remove `/js/spacenet/mesh-peers.js` from `WAVE_APP` in `boot.js` and delete the file. No other modules depend on it.
