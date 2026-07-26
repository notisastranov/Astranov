# Astranov SpaceNet — SPECS (sole product authority)

**When anyone says "specs" → this file first.**  
Machine mirror: `astranov-continuity.js` → `window.AstranovContinuity`  
Human mirror (features): `ASTRANOV_SPECS.md`  
Live: https://astranov.eu · Repo: `notisastranov/astranov.eu`

Continuity / build stamp must match `meta[name="astranov-build"]` on every deploy.

---

## 0. The law (non-negotiable)

**SpaceNet uses real virtual space as the user interface.**

| Principle | Meaning |
|-----------|---------|
| **Place = address** | Every digital object lives at **body + latitude + longitude** (+ optional altitude). Not a desktop folder path. |
| **Zoom = open** | If you put a thesis file on the **garage of a house**, the person zooms that house → they **see the file**. |
| **Hide in the cosmos** | If you hide music on **Mars Cydonia**, zooming Cydonia reveals the **folder**. |
| **ALL of known space** | Every **planet, moon, dwarf, asteroid, comet, black hole, solar system, constellation, galaxy** we catalog is a goable address. |
| **Other dimensions** | Sci‑fi / theoretical layers (hyperspace, subspace, wormholes, mirror, bulk, void, CTC, …) are navigable place-layers for data. |
| **Any imaginable task** | Files, folders, notes, **live delivery marketplace**, **real-time video calling**, shops, drivers — all **in real space**. |

This is the evolution of the internet: **finally free in all dimensions**.

| Module | API |
|--------|-----|
| Spatial places | `js/astranov-spacenet-spatial.js` → `SpaceNetSpatial` · `SpaceNetLaw` |
| Full cosmos atlas | `js/astranov-spacenet-cosmos.js` → `SpaceNetCosmos` · `SpaceNetCosmosLaw` |

### Cosmos catalog (must stay open)

| Realm | Contents |
|-------|----------|
| **sol** | Sun, Mercury→Neptune, Pluto + dwarfs, major moons, ISS, belt, Halley, Oort |
| **blackhole** | Sgr A*, M87*, Cyg X-1, V404, GW150914 remnant, TON 618, Phoenix A… |
| **constellation** | Major IAU constellations (Orion, Crux, Centaurus, …) |
| **exo** | Proxima, TRAPPIST-1, Kepler hosts, TOI-700, … |
| **galaxy** | Milky Way, M31, M33, LMC/SMC, M51, M81, M87… |
| **dimension** | Hyperspace, subspace, wormhole net, mirror, Q, warp, slipstream, astral, void, matrix, CTC, bulk, limbo, null |

Talk: `go to Jupiter` · `go to Orion` · `go to Sgr A*` · `go to hyperspace` · `put notes on Europa` · `cosmos`

### Real imagery (speed-first)

| Commitment | Rule |
|------------|------|
| **Real maps** | Earth Blue Marble + night lights; Sol planets use NASA-derived 1k maps (threex / three.js) when CORS allows |
| **Never block boot** | Solid color → reliable mid-res → HD marble when idle / desktop |
| **Mobile** | Cap parallel texture loads (2); skip heavy sky band; defer planet maps ~9s |
| **Desktop** | EarthRealism day/night shader when `earth_hd` allowed; denser starfield + soft Milky band |
| **Code** | `js/astranov-spacenet-imagery.js` → `SpaceNetImagery` |

---

## 1. Mission (one sentence)

Unify all internet activity under **realistic space** so that **where you look** on the cosmos **is** the interface — files, people, commerce, and calls inhabit coordinates.

---

## 2. Spatial object model (hardcoded)

```
Place {
  id, body: earth|mars|moon|solar,
  lat, lng, alt?,
  kind: file|folder|shop|delivery|call|note|media,
  name, title, description, emoji,
  payload: { text | children[] | url | action },
  visibilityKm, minZ, owner, seed?
}
```

| Kind | Role in real space |
|------|--------------------|
| **file** | Document / blob at a pin (e.g. Thesis.pdf on garage roof) |
| **folder** | Collection at a pin (e.g. Cydonia Music) |
| **shop** | Vendor / market hub on the map |
| **delivery** | Order / route pin |
| **call** | Video / presence agora pin |
| **note** | Lightweight message at a place |
| **media** | Photo / video / audio at a place |

### Seed places (always present)

| ID | Body | Where | What |
|----|------|-------|------|
| `seed-thesis-garage` | Earth | ~36.441°N, 28.223°E (Rhodes garage demo) | **Thesis.pdf** — zoom street → open |
| `seed-cydonia-music` | Mars | Cydonia ~40.75°N, 9.46°W | **Cydonia Music** folder |
| `seed-spacenet-market-hub` | Earth | Rhodes city | Live **delivery marketplace** hub |
| `seed-videocall-agora` | Earth | Athens | **Video call** presence pin |

User places persist in `localStorage` key `astranov:spacenet-places-v1`.

---

## 3. Zoom stack (navigation = filesystem)

| Tier | Z (approx) | What binds |
|------|------------|------------|
| GALAXY | ~16 | Deep sky |
| GALACTIC SKY | ~7.2 | Constellations / exo hosts |
| ORBIT / SOLAR | ~5.2 | Planets — **Mars Cydonia places** |
| GLOBAL | ~3.5 | Earth overview · large hubs |
| NATIONAL | ~1.82 | Regions · SpaceNet cities |
| REGIONAL | ~1.65 | |
| CITY | ~1.38 | Shops · delivery · video peers |
| NEIGHBORHOOD | ~1.08 | **Street files / garage pins** |

**Rule:** An object’s `minZ` + `visibilityKm` decide when it appears. Neighborhood reveals garage-scale files; orbit reveals Mars folders.

---

## 4. User surface — sci‑fi CLI + companion (NO button flood)

### Hard rules (owner 2026-07-26)

| Rule | Spec |
|------|------|
| **No floating multi-button docks** | **Forbidden:** `#spacenet-shell` dock, second chrome windows, status pill bars that steal screen |
| **CLI is the screen** | `#globe-deck` log + field = primary UI — links, dots, companion, replies |
| **Few edge controls only** | **G** (auth) · **🎯 locate** · **📹 video** · **+** multi-tile · **handsfree** · stop/hold as needed. Hide permanent Order/Batch/VHF/Phone/CLI-hub strip |
| **Companion** | `#sn-companion` — humanoid face of **deep glowing blue dots**; talks/listens/thinks via mood; lives **inside** CLI, not a separate window |
| **Clickable CLI links** | Syntax `[[action\|label]]` in log (e.g. `[[city\|locate]]`) → `SpaceNetShell.run` |
| **Dedummyfy** | Prefer real spatial actions + real imagery; no fake “app store” chrome |

### Companion (code)

`SpaceNetCompanion` in `astranov-app.js` — canvas face, colors ≈ `#1a6fd4` / `#3d9eff`, moods: idle · talk · listen · think.

### Talk → space (examples)

| You say / tap | SpaceNet does |
|---------------|----------------|
| `put thesis on the garage` | Places file at garage coords · fly |
| `hide music on mars cydonia` | Folder on Mars · fly orbit |
| `go to Jupiter` / `go to Orion` / `go to hyperspace` | Cosmos fly |
| `[[city]]` / `[[shops]]` / `[[order]]` / `[[cosmos]]` | CLI links |
| type in field + Enter | Natural language router |

---

## 5. Real-time marketplace & video (in space)

| Capability | Spec |
|------------|------|
| Delivery | pin → browse → cart → place → track → driver claim → pilot multi-stop |
| Fees | Platform **3%** · vendor→driver **15%** of gross goods |
| Video | Edge video control · connected peers · MapComms — pins can be `kind: call` |
| Presence | Live users cluster into **SpaceNetCities** hubs at national zoom |

Marketplace and video are **not separate apps** — they are **kinds of places** on the net.

---

## 6. Brand & chrome

| UI | Spec |
|----|------|
| Top logo | **Astranov SpaceNet** · hard reset only |
| Deck title | Astranov SpaceNet |
| CLI field | Optional power surface · **Talk** for humans · Enter sends |
| Edge + | Multi-tile menu (not only small super-add deck) |
| Modules path | Prefer **`/js/*`** (root `astranov-mpp-tile.js` etc. may SPA-fallback on host) |

---

## 7. Code map (hardcoded owners)

| Concern | Owner |
|---------|--------|
| Spatial places · Mars · vault · talk put/go | `js/astranov-spacenet-spatial.js` |
| Globe / boot / shell / talk router | `astranov-app.js` |
| GlobeEntity markers | `astranov-deferred.js` `GlobeEntity` type `sn_place` |
| Multi-tile · locate · video · market | `js/astranov-mpp-tile.js` (or root copy) |
| Field / finance / radar | `js/astranov-field-hud.js` |
| Vendors crawl | `SpaceNetCrawler` + edge `vendor-crawler` |
| Continuity | `astranov-continuity.js` |

---

## 8. Mission ship gate (do not ship dummy)

**Owner rule:** do not deploy cosmetic / half-wired layers until the operating path is real.

### Operating path (must work)

```
boot → deferred real → crawl sector → vendors[] without DEMO pollution
     → SpaceNetSpatial.sync (sn_place on globe)
     → locate/city → same crawl+sync
     → shops/order use real POIs when count ≥ 3
```

### Kernel

`SpaceNetMission.ensureOperatingPath` in `astranov-app.js`  
Report: `window.__spacenetMission` `{ ok, shopsReal, shopsDemo, spatial, fails[] }`

### Green means

| Gate | Pass |
|------|------|
| Modules | spatial + crawler + deferred commerce/GlobeEntity |
| Shops | `shopsReal ≥ 3` (or crawl count ≥ 5 merged) — **not** demo-only |
| Spatial | seeds/places ≥ 2 |
| UI chrome | no floating multi-button dock |
| CLI | icons readable; `[[links]]` work |

### Red / do not call “ready”

- Only `DEMO_VENDORS` on map  
- Modules serving SPA HTML  
- New UI chrome without path above green  

### Healthy checklist

1. Hard refresh → Earth usable  
2. CLI companion only (no dock flood); icons not mojibake  
3. `__spacenetMission.ok` or honest `mission · NOT READY` line  
4. Real shop pins near locate/city  
5. Thesis garage + Cydonia still open  
6. Build meta matches `?v=`  

---

## 9. Deploy

```text
node scripts/owner-push.mjs <files> --message=...
```

- Bump `astranov-build` + all `?v=` together  
- Ship **SPECS.md** + **astranov-continuity.js** with every product change  
- Serve critical modules from **`/js/`** when root HTML-fallback is broken  

---

## 10. Agent discipline — always study / always record

**Without the owner having to repeat it:**

1. After every owner instruction that changes product intent, **update this SPECS.md** (and continuity when selectors/owners change) in the **same deploy**.  
2. Chat is non-authoritative after the fact — **SPECS + continuity win**.  
3. Prefer implementing over babysitting.  
4. Do not reintroduce removed anti-patterns (button docks, dual CLI bars, CLI miner strip).  

---

## 11. Intellectual property — Astranov SpaceNet

| Claim | Record |
|-------|--------|
| **Name** | Astranov · Astranov SpaceNet · SpaceNet (product) |
| **Authors** | Product owner (notisastranov) + AI pair-development under owner direction |
| **Subject** | Spatial internet UI; cosmos address OS; companion CLI; multi-tile field; 3%/15% marketplace economics |
| **Repo** | github.com/notisastranov/astranov.eu |
| **Live** | https://astranov.eu |
| **Notice** | © Astranov SpaceNet. All rights reserved. |
| **Machine** | `window.AstranovContinuity.ip` · meta `astranov-ip` |
| **Protection** | Specs as creation record · continuity · copyright meta · repo provenance · build stamps |

Agents **must not** strip IP notices or rebrand without owner request.

---

## 12. Do not

- Flood the screen with floating multi-button docks / second chrome windows  
- Treat SpaceNet as “another map app with a chat box”  
- Store primary user content only in abstract folders with no coordinates  
- Remove seed thesis / Cydonia demos without owner request  
- Reintroduce SPA HTML as `astranov-*.js` without `/js/` rescue  
- Skip SPECS updates when the owner gives new product law  
- Strip Astranov SpaceNet IP notices  

---

*SpaceNet: if it exists, it exists **somewhere**. Zoom there. The CLI is the face of the net.*
