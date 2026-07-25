# Astranov SpaceNet — Product Specs (2026-07-14)

**Authoritative machine contract:** `astranov-continuity.js` → `window.AstranovContinuity`  
**This file** is the human-readable mirror. When they disagree, **continuity.js wins** after deploy.  
**Do not implement from** `ASTRANOV_GROK_SPECS.md` (deprecated stub) or chat transcripts alone.

| | |
|--|--|
| **Live** | https://astranov.eu |
| **Repo** | github.com/notisastranov/astranov.eu |
| **Local** | `C:\Users\N\Documents\GitHub\Astranov` |
| **Build** | `meta[name="astranov-build"]` must match all script `?v=` |
| **Current build** | `20260712040000-spec-lock` |

---

## Deploy

```bash
node scripts/guard-base.mjs
node scripts/owner-push.mjs <files> --message=deploy-...
```

- Bump build stamp + continuity version + this SPECS file when features change.
- Owner machine: run deploy yourself (never ask the user to run).

---

## Script load order

`three.js` (cdnjs + jsdelivr fallback) → `supabase` →  
`astranov-app.js` → `astranov-perf-lazy.js` → `astranov-continuity.js` →  
`galactic-sky.js` → `field-hud.js` → `mpp-tile.js`

---

## Brand & shell

| UI | Spec |
|----|------|
| Top-center `#astranov-logo` | Label **Astranov SpaceNet**. Hard reset on click. **Not** a CLI button. |
| Deck title / SuperCli | **Astranov SpaceNet** (`ACL_TITLE`) |
| Input row | **+** (`#globe-deck-plus`) + **Send** (`#globe-deck-send`) required |
| Edge bar | G, video, edge +, handsfree, shortcuts (locate pinned) |

---

## Multi-tile menu (+)

**Opens:** `MenuProfilePostTile` via `#super-add-fab` **or** `#globe-deck-plus`  
**Not:** small `globe-super-add` deck alone.

### Hub tiles (`#mpp-multi-rail`) — deep blue glowing rounds

| Tile | Purpose |
|------|---------|
| **Data** | Field data list / pin data |
| **Social** | Caption, photo, video post |
| **Vendors** | Shops with menus |
| **Order** | Delivery marketplace |
| **Pilot** | Multi-stop routing schedule |

### Created multi-tiles

- Deep-blue glowing round **rich-media** previews (`#mpp-multi-created`)
- Stored: `localStorage` key `astranov:multi-tiles`
- Create via **Save as glowing multi-tile** or after pilot start

### Roles

`client` · `vendor` · `driver` · **`pilot`** · `user` · `social`

---

## Delivery marketplace (full flow)

```
pin (set_delivery) → browse shops → cart items → place_cart (order-intake)
  → MarketplaceDeliveryEngine + OrderTracking
  → track_delivery / #delivery-route-hud
  → driver: jobs → claim → accept → pickup → en_route → delivered
  → pilot: build schedule (state · distance · priority) → start multi-stop
  → all parties confirm (client · vendor · driver)
```

### Economics (locked)

| Rule | Rate | Code |
|------|------|------|
| Platform commission on all transactions | **3%** | `DeliveryPricing.PLATFORM_RATE` |
| Vendor pays driver from gross goods | **15%** instantly | `DeliveryPricing.DRIVER_GROSS_RATE` → `driver_from_vendor_eur` |

Shown on HUD `#drh-fees`.

### Realtime confirms

- UI: `#drh-confirms` — Client / Vendor / Driver confirm
- Method: `MarketplaceDeliveryEngine.confirmParty`
- Storage: `astranov:delivery-confirm:<missionId>`

### Pilot multi-stop

- Score ≈ `stateWeight + priority×15 − distanceKm×2`
- State weights: en_route 100 → picked_up 90 → active 80 → assigned 60 → seeking 40 → pending 20
- Methods: `pilotBuildSchedule`, `pilotStartRouting`
- MPP actions: `pilot_build`, `pilot_start`, `create_multi_tile`

---

## Locate & video

| Control | Behavior |
|---------|----------|
| 🎯 locate | Pinned as `.app-shortcut-btn`; GPS → city; Rhodes fallback |
| 📹 video | Left of edge +; connected users / MapComms video |

---

## Miner (SpaceNet field)

- **Tap top-right** `#field-balance-hud` → `#miner-rig-panel`
- **Do not** restore `#miner-cli-strip` / `#aci-miner`
- Prefs: `astranov:miner-rig-prefs` (cpu, ram, storage, bandwidth, sleep)

---

## Field HUD / radar

- Radar: `setInterval` ~125ms (~8fps draw), no second RAF storm
- Earth speed display: **1671 km/h** on global earth view
- `ensureBrain` delayed ~2.8s after FieldHud boot

---

## Performance (must keep)

- No `LazyModules.ensure()` at 400ms on boot
- Deferred pack after idle / first user tap (mobile longer)
- Adaptive globe FPS: 12–20 idle, 60 only when dragging
- Mobile: conserve tier default, low DPR, no antialias, lean mesh
- THREE/WebGL guarded — CLI still boots if globe fails
- SW: network-first for `/astranov-*.js`

---

## Modules

| File | Owns |
|------|------|
| `index.html` | Shell, logo, multi-rail, pilot DOM, +/send, delivery HUD |
| `astranov-app.js` | Globe, boot, SuperCli, MDE pilot/confirms, pricing stub |
| `astranov-deferred.js` | Commerce, full DeliveryPricing, OrderTracking, Brain |
| `astranov-perf-lazy.js` | Defer pack, brain dedup |
| `astranov-field-hud.js` | Miner field, radar, speed |
| `astranov-mpp-tile.js` | Multi-tile +, locate, video, market, pilot actions |
| `astranov-continuity.js` | Machine contract |
| `ASTRANOV_SPECS.md` | This mirror |
| `CLAUDE.md` | Agent entry |

---

## Build history (progress memory)

| Build | What shipped |
|-------|----------------|
| `…-social-profile` | MPP tile, + hijack |
| `…-cli-market-miner` | Locate, video, market, miner strip (later removed) |
| `…-perf-lazy` | Lazy deferred pack |
| `…-field-miner` | Field-tap miner only |
| `…-spec-cleanup` | Continuity; kill old handoffs |
| `…-boot-rescue` | THREE/host guard |
| `…-perf-turbo` | Adaptive FPS, lean boot |
| `…-delivery-finish` | Track/jobs/placeCart pin |
| `…-spacenet-multi` | SpaceNet, multi-rail, pilot, 3%+15%, confirms, +/send row |
| `…-spec-lock` | **All progress written into specs** |

---

## Verify checklist

1. Logo = **Astranov SpaceNet**; click reloads hard  
2. Input **+** and **Send** present; + opens multi-rail  
3. Hub tiles open Data / Social / Vendors / Order / Pilot  
4. Locate + video still work  
5. Field miner (top-right), no CLI ⛏ strip  
6. Order path + HUD fees 3% / 15%  
7. Party confirms toggle green  
8. Pilot builds multi-stop and can save glowing multi-tile  
9. Globe + radar alive  

---

## Anti-patterns (do not)

- Revert + to `globe-super-add` only  
- Drop input-row + or send  
- Restore CLI miner strip  
- Boot `ensure()` at 400ms  
- Change fees 3% / 15% without owner  
- Implement from Grok stub or chat alone  

---

*Keep this file in sync with `astranov-continuity.js` on every product deploy.*
