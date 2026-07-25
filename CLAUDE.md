# Astranov SpaceNet — AI agent entry (2026-07-14)

**Stop. Read the specs before editing anything.**

## Single source of truth

1. **`astranov-continuity.js`** → live `window.AstranovContinuity` (machine contract)
2. **`ASTRANOV_SPECS.md`** — human-readable mirror of the same contract
3. **`index.html`** meta `astranov-build` + `astranov-continuity` (must match script `?v=`)

Chat history, Grok/Cursor session summaries, and **`ASTRANOV_GROK_SPECS.md`** are **not authoritative**.

## Deploy (mandatory — you run it)

```bash
node scripts/guard-base.mjs
node scripts/owner-push.mjs index.html astranov-continuity.js ASTRANOV_SPECS.md <other-files> --message=deploy-...
```

- **Live:** https://astranov.eu  
- **Repo:** `notisastranov/astranov.eu` · path `C:\Users\N\Documents\GitHub\Astranov`  
- Owner granted autonomous push — deploy yourself.  
- When features change: update **continuity + ASTRANOV_SPECS.md** in the same deploy.

## Current product (locked progress)

| Area | Spec |
|------|------|
| Brand | Top-center **Astranov SpaceNet** (hard reset only) |
| + menu | Multi-tile rail: Data · Social · Vendors · Order · Pilot + glowing multi-tiles |
| Input row | **+** and **Send** required (`#globe-deck-plus`, `#globe-deck-send`) |
| Delivery | browse → cart → pay → track → driver claim → pilot multi-stop |
| Fees | **3%** platform · vendor pays driver **15%** of gross goods |
| Confirms | Client · vendor · driver realtime on delivery HUD |
| Miner | Tap **#field-balance-hud** only (no CLI ⛏ strip) |
| Perf | Adaptive FPS, deferred pack, no ensure@400ms |

Full detail: `ASTRANOV_SPECS.md` and `astranov-continuity.js` `features` / `economics` / `buildHistory`.

## Architecture

| File | Role |
|------|------|
| `index.html` | Shell, logo, multi-rail, pilot DOM, +/send, delivery HUD |
| `astranov-app.js` | Globe, boot, SuperCli, MarketplaceDeliveryEngine, pricing stub |
| `astranov-deferred.js` | Commerce, DeliveryPricing full, OrderTracking, Brain |
| `astranov-perf-lazy.js` | Defer 574KB pack / brain dedup |
| `astranov-field-hud.js` | Field miner, radar, speed |
| `astranov-mpp-tile.js` | Multi-tile +, locate, video, market, pilot |

## Mission (vision only)

SpaceNet: unify services on a zoomable cosmos (solar → global → national → city → street).  
`ASTRANOV_SPACENET_MISSION.md` — vision only. **Features:** continuity + SPECS.

## Superseded — do not implement from these

- `ASTRANOV_GROK_SPECS.md` (stub only)
- Deleted full handover MDs
- GitHub #97 / #99 old checklists
- “index.html only, no new files”
- “+ opens globe-super-add only”
- CLI miner strip `#aci-miner`
