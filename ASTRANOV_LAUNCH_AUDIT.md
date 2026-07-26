# Astranov SpaceNet — Launch Audit Report

**Date:** 2026-07-14  
**Live build audited:** `20260712060000-perf-sticky-fix`  
**Audit + fix ship:** `20260712070000-launch-audit`  
**Specs source:** `astranov-continuity.js` + `ASTRANOV_SPECS.md`

---

## Executive scorecard

| Area | Score | Status |
|------|------:|--------|
| Specs locked & readable | **95%** | Continuity + SPECS + CLAUDE on live |
| Brand / CLI shell UX | **90%** | SpaceNet logo; field-only input; edge + |
| Delivery marketplace path | **80%** | Place/track/jobs/HUD/fees/confirms in code |
| Pilot multi-stop routing | **75%** | Build/start/score; needs live order volume |
| Economics 3% / 15% | **90%** | In DeliveryPricing; edge payouts server-side |
| Speed / stickiness | **70%** | Lite path fixed; still heavy JS parse (~1MB+) |
| Map users (city) | **75%** | Presence → GlobeEntity friends |
| National cities with users | **40%→85%** | **Fixed this audit** — SpaceNetCities hubs |
| Dev bridge CLI ↔ AI | **50%→90%** | **Fixed** — `bridge` / `coders composer` |
| Full launch readiness | **~78%** | Launch-capable core; infra/edge gaps remain |

**Verdict:** Core SpaceNet product is **launch-ready for alpha/beta** (sign-in users, shops, delivery, pilot, multi-tile). Not yet “zero-ops global launch” until order-intake edge, presence volume, and OAuth polish (#98) are solid in production.

---

## 1. Specs compliance

| Spec feature | Code owner | Meet? |
|--------------|------------|:-----:|
| Astranov SpaceNet top brand | `#astranov-logo` | ✅ |
| Multi-tile + (not globe-super-add only) | `mpp-tile` | ✅ |
| CLI field-only (no side buttons) | input row CSS | ✅ |
| Locate me pin | `_patchLocate` | ✅ |
| Video left of + | `_patchVideoCall` | ✅ |
| Field miner (no CLI strip) | `field-hud` | ✅ |
| Delivery browse → cart → track | Commerce + MDE | ✅ |
| Platform 3% | `PLATFORM_RATE` | ✅ |
| Driver 15% gross | `DRIVER_GROSS_RATE` | ✅ |
| Party confirms | `#drh-confirms` | ✅ |
| Pilot multi-stop | `pilotBuildSchedule` | ✅ |
| Perf lite / no ensure@400 | perf-lazy | ✅ |
| National cities with SpaceNet users | was weak | ✅ fixed |
| CLI bridge to continue AI from app | was weak | ✅ fixed |

---

## 2. Delivery / routing / tiles

### Working path
```
pin → browse → cart → placeCart(order-intake)
  → onOrderPlaced / loadMyActive → HUD
  → driver_jobs → claim → accept → pickup → en_route → delivered
  → pilot_build (state·distance·priority) → pilot_start multi-stop
  → client/vendor/driver confirm
```

### Gaps remaining (server / ops)
| Gap | Impact | Owner |
|-----|--------|-------|
| Edge `order-intake` payouts must honor 15% gross + 3% | Economics truth | Supabase function |
| Live driver density | Empty job list if no online drivers | Product growth |
| Menu-empty vendors | place_cart forces menu request | Vendor UX |
| Multi-tile media upload durability | localStorage previews only | Profile storage |

---

## 3. Map: users, national cities

### Before audit
- City level: friends via `AstranovPresence` + `GlobeEntity.syncFriends` ✅  
- National: `map-nav-chip` **forced hidden**; city chips only shops ❌  

### Fixed this ship
- `SpaceNetCities` clusters live users + shops into hubs  
- National zoom shows chip: active cities + user counts  
- City chips: glowing SpaceNet city buttons + shops  
- Globe entities `city_hub` at national (tap → enter city)  
- Presence `_applyOthers` refreshes hubs  

---

## 4. Speed / stickiness

| Item | State |
|------|--------|
| `_globePerfLite` no longer wiped | ✅ |
| No AA / low DPR / adaptive FPS | ✅ |
| Radar throttled / logo RAF idle stop | ✅ |
| Residual: ~1MB JS parse on cold load | ⚠ structural |
| Residual: HD earth texture CDN | ⚠ network |

---

## 5. CLI bridge (you ↔ AI from the app)

### Commands (after hard refresh)
| Command | What it does |
|---------|----------------|
| `bridge` | Saves continuity pack + Coders job; pre-fills CLI for Composer |
| `bridge fix national cities` | Same + task text |
| `coders composer <task>` | Routes to AciCoders / Composer queue |
| `coders bridge` | Alias via coders prefix |
| Coders Hub UI | Save job · Summon Composer |

### How to keep developing with AI from the app
1. Hard refresh https://astranov.eu  
2. Sign in (G)  
3. Type in CLI:  
   `bridge continue launch from ASTRANOV_SPECS`  
4. Or:  
   `coders composer Fix remaining delivery edge payouts`  
5. Open **Coders Hub** → **Save job** / **Summon Composer** so lab handoff persists  

Bridge pack is stored at `localStorage` `astranov:dev-bridge` and job at `astranov:job-continuation`.

---

## 6. Launch checklist (go / no-go)

| Gate | Go? |
|------|:---:|
| Specs in repo + live continuity version | ✅ |
| Sign-in + CLI + multi-tile + | ✅ |
| Place/track delivery for signed-in user | ✅ code path |
| National cities with users visible | ✅ after this deploy |
| Perf usable on mid phone | ✅ improved |
| Edge order-intake production verified | ⚠ manual smoke needed |
| Google OAuth reliability (#98) | ⚠ open infra |
| Dense live users worldwide | ⚠ growth |

**Recommendation:** Soft launch (invite / city pilot) now; hard global marketing after edge payout smoke + OAuth.

---

## 7. Files touched in audit fix

- `astranov-app.js` — `SpaceNetCities`, national chip, city hubs, `SpaceNetDevBridge`, CLI `bridge`
- `astranov-deferred.js` — presence refreshes cities  
- `index.html` — map-nav-chip visible CSS, city chip styles  
- `astranov-continuity.js` / `ASTRANOV_SPECS.md` / this report  

---

*This report is part of the product record. Prefer continuity for machine enforcement.*
