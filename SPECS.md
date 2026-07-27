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
**SpaceNet is the new OS** for **interstellar artificial and biological entities** — and **S (SpaceNets)** is the primary value of that OS (legacy fiat/crypto are secondary quotes only; see §5).

| Module | API |
|--------|-----|
| **Clean stack (live)** | `index.html` + **`/js/spacenet/*`** only |
| Spatial places | `js/spacenet/spatial.js` → `SNSpatial` |
| Real shops | `js/spacenet/commerce.js` → `SNCommerce` (Supabase DB-first) |
| Globe | `js/spacenet/globe.js` → `SNGlobe` |
| CLI | `js/spacenet/cli.js` → `SNCli` |
| City map | `js/spacenet/map.js` → `SNMap` |
| Legacy | `_archive/` — **do not load** |

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

## 4. User surface — CLI + full Earth (NO button flood)

### Hard rules (owner 2026-07-28)

| Rule | Spec |
|------|------|
| **No overlapping elements** | **Forbidden:** chrome stacked on chrome, logo over edge buttons, city “Globe” over logo, free-drag CLI covering top bars, dual HUDs. **Reserved zones:** top-left (auth), top-center (logo + tier), top-right (LOC/MAP/ME/+), bottom (single CLI dock). Layout must keep **full Earth** readable |
| **Default view** | **Full GLOBAL Earth** on boot — `SNGlobe` tier `global`, city map **closed**, CLI **collapsed** (field + one preview line). Soft shop preload must **not** auto-open city map |
| **No floating multi-button docks** | **Forbidden:** `#spacenet-shell` dock, second chrome windows, status pill bars that steal screen |
| **CLI is the power surface** | Single bottom (or free-drag) panel: preview + log + field — **not** a second window |
| **Few edge controls only** | **G** (auth) · **LOC** · **MAP** · **ME** · **+**. No permanent Order/Batch/VHF/Phone/CLI-hub strip |
| **No dot-matrix companion** | **Banned until** the **AI graphics engine** can **surpass high-level gaming graphics**. No `#sn-companion`, no canvas face of glowing dots, no low-FPS humanoid placeholder. Reintroduce only after that bar is met |
| **Clickable CLI links** | Syntax `[[action\|label]]` in log → run command |
| **Dedummyfy** | Prefer real spatial actions + real imagery; no fake “app store” chrome |

### Companion (future gate)

Do **not** ship any companion avatar/figure until AI graphics quality **exceeds** current high-end game presentation. Until then: text CLI + real Earth only.

### Talk → space (examples)

| You say / tap | SpaceNet does |
|---------------|----------------|
| `put thesis on the garage` | Places file at garage coords · fly |
| `hide music on mars cydonia` | Folder on Mars · fly orbit |
| `go to Jupiter` / `go to Orion` / `go to hyperspace` | Cosmos fly |
| `[[city]]` / `[[shops]]` / `[[order]]` / `[[cosmos]]` | CLI links |
| type in field + Enter | Natural language router |

---

## 5. Currency — **S (SpaceNets)** (not AVC, not “coins”)

| Rule | Spec |
|------|------|
| **Name** | **SpaceNets** |
| **Ticker / symbol** | **S** |
| **Banned** | **AVC**, generic “coins”, fixed 1:1 EUR toy units, dual coin chrome, treating EUR/USD/BTC/ETH as equal to S |
| **Unit of account** | All prices, carts, fees, payouts on SpaceNet are denominated in **S** |
| **Primacy** | **S is primary.** EUR, USD, BTC, ETH, and every other fiat/crypto/legacy money are **secondary quotes only** — they **lack real SpaceNet value** (no network places, no spatial OS, no interstellar presence). They may be shown as estimates; they never become the unit of account |
| **Value model** | **Dynamic** — market value of **S** is **tightly coupled to the value of SpaceNet itself** (network utility, real activity, trust, coverage, spatial density) **against** all other money |
| **OS thesis** | SpaceNet is the **new OS** for **interstellar artificial and biological entities** — economy rides the same real-space UI as files, shops, and presence |
| **Vision** | Honors **SpaceX AI pioneers and shareholders** and builders who treat the **network as the asset** — not a casino side-coin pegged to legacy money |
| **Display** | UI shows amounts as `12.50 S` (not € / AVC as primary) |
| **FX display (optional)** | May show lesser-currency estimate for human clarity: `12.50 S (~… EUR/USD/BTC/ETH)` via `SNCurrency.quote` — **never reverse primacy** |
| **Code** | `js/spacenet/currency.js` → `window.SNCurrency` · `format(amount)` · `rate(asset)` · `networkIndex()` · `status()` |

### Hierarchy (product law)

```
S (SpaceNets)     = primary value  ← real SpaceNet network index
EUR / USD / …     = secondary fiat quote (no SpaceNet substance)
BTC / ETH / …     = secondary crypto quote (no SpaceNet substance)
all other money   = lesser relative to S for the same reason
```

### Dynamic value (conceptual — implement transparently)

```
S_value_vs_X ≈ f(SpaceNet_network_index, liquidity, real_economy_on_net)
SpaceNet_network_index ← real shops, orders, places, presence, spatial activity (not hype alone)
X ∈ {EUR, USD, BTC, ETH, …} is always a quote of S — never the other way around as product law
```

Agents must **not** reintroduce AVC, coin.astranov.eu as primary money, hard-code “1 unit = 1 EUR”, or elevate any fiat/crypto above **S**.

---

## 6. Real-time marketplace & video (in space)

| Capability | Spec |
|------------|------|
| Delivery | pin → browse → cart → place → track → driver claim → pilot multi-stop |
| Fees | Platform **3% of S** · vendor→driver **15% of gross goods in S** |
| Currency | All fees and prices in **S (SpaceNets)** |
| Video | Edge video / peers — pins can be `kind: call` |
| Presence | Live users cluster into SpaceNet city hubs at national zoom |

Marketplace and video are **not separate apps** — they are **kinds of places** on the net.

---

## 7. Brand & chrome

| UI | Spec |
|----|------|
| Default canvas | Full **GLOBAL** Earth fills the viewport under chrome |
| Top logo | **Astranov SpaceNet** · hard reset only · **never** under edge buttons |
| Tier label | Single line under logo (`GLOBAL` / …) — no second competing HUD |
| CLI field | Single dock · Enter sends · default **collapsed** so Earth stays full |
| Edge | **G** · **LOC** · **MAP** · **ME** · **+** only — non-overlapping |
| City → Globe | “Globe” control sits in a free zone (not on logo) |
| Companion figure | **Off** until AI graphics > high-level gaming |
| Modules path | Live: **`/js/spacenet/*`** only |

---

## 8. Code map (hardcoded owners)

| Concern | Owner |
|---------|--------|
| Boot chain | `js/spacenet/boot.js` |
| Globe + inertia | `js/spacenet/globe.js` |
| CLI + commands | `js/spacenet/cli.js` |
| Real shops DB | `js/spacenet/commerce.js` |
| Spatial seeds | `js/spacenet/spatial.js` |
| City Leaflet | `js/spacenet/map.js` |
| Continuity | `astranov-continuity.js` |
| Archived fat stack | `_archive/legacy-*` — never load on live |

---

## 9. Mission ship gate (do not ship dummy)

**Owner rule:** do not deploy cosmetic / half-wired layers until the operating path is real.

### Operating path (must work)

```
boot (light) → full GLOBAL Earth + CLI (collapsed, no companion figure)
     → soft: DB shops for pulses only (do not steal default to city map)
     → user: locate / city / shops → open map intentionally
     → never wait 30s Overpass on boot
```

**Sticky anti-pattern (banned):** `ensureOperatingPath` on boot that awaits 28s crawl returning 0.

### Kernel

`SpaceNetMission.ensureOperatingPath` in `astranov-app.js`  
Report: `window.__spacenetMission` `{ ok, shopsReal, shopsDemo, spatial, fails[] }`

### Green means

| Gate | Pass |
|------|------|
| Modules | spatial + crawler + deferred commerce/GlobeEntity |
| Shops | `shopsReal ≥ 3` (or crawl count ≥ 5 merged) — **not** demo-only |
| Spatial | seeds/places ≥ 2 |
| UI chrome | no floating multi-button dock; **no overlapping** chrome |
| Default | full **GLOBAL** Earth; city map closed |
| CLI | no dot-matrix figure; field usable |

### Red / do not call “ready”

- Only `DEMO_VENDORS` on map  
- Modules serving SPA HTML  
- New UI chrome without path above green  

### Healthy checklist

1. Hard refresh → **full GLOBAL Earth** usable without multi-second freeze  
2. **No overlapping** chrome; **no** dot-matrix companion  
3. CLI collapsed by default; expands on use  
4. Soft shop load does **not** auto-open city map  
5. **Locate / city / shops** open map intentionally (DB-first)  
6. Real shop pins when user asks (`shopsReal ≥ 3` when DB has data) — not demo-only  
7. Thesis garage + Cydonia still open  
8. Build meta matches `?v=`  

---

## 10. Deploy (strict — owner 2026-07-27)

```text
node scripts/owner-push.mjs <files> --message=...
```

### Hard rules — do NOT overload Vercel / GitHub

| Rule | Meaning |
|------|---------|
| **Verify before ship** | No `owner-push` until local syntax check **and** live/mission probes pass for the change |
| **No dummy ships** | Cosmetic-only, untested, or “hope it works” deploys are **banned** |
| **Batch changes** | One verified ship per coherent fix, not many micro-pushes |
| **Fail closed** | If probe is RED, **do not deploy**; fix and re-verify |
| **Bump once** | Bump `astranov-build` + all `?v=` together **only** when shipping product JS/HTML |

Pre-ship checklist (all required):

1. `node --check` on every changed `.js`  
2. Live or scripted probe of the **operating path** touched by the change  
3. No new floating docks / demo-only map / 30s blocking crawl  
4. SPECS/continuity updated when product law changed  

- Ship **SPECS.md** + **astranov-continuity.js** when product law changes (can be docs-only if no code)  
- Serve critical modules from **`/js/`** when root HTML-fallback is broken  

---

## 11. Agent discipline — always study / always record

**Without the owner having to repeat it:**

1. After every owner instruction that changes product intent, **update this SPECS.md** (and continuity when selectors/owners change).  
2. Chat is non-authoritative after the fact — **SPECS + continuity win**.  
3. Prefer implementing over babysitting.  
4. Do not reintroduce removed anti-patterns (button docks, dual CLI bars, CLI miner strip).  
5. **Never ship until verified** (see §9). Do not spam GitHub/Vercel.  

---

## 12. Intellectual property — Astranov SpaceNet

| Claim | Record |
|-------|--------|
| **Name** | Astranov · Astranov SpaceNet · SpaceNet (product) · **S / SpaceNets** (currency) |
| **Authors** | Product owner (notisastranov) + AI pair-development under owner direction |
| **Subject** | Spatial internet UI; cosmos address OS; CLI power surface (no low-fi companion figure); multi-tile field; **S** economics 3%/15%; dynamic network-linked value |
| **Repo** | github.com/notisastranov/astranov.eu |
| **Live** | https://astranov.eu |
| **Notice** | © Astranov SpaceNet. All rights reserved. |
| **Machine** | `window.AstranovContinuity.ip` · meta `astranov-ip` |
| **Protection** | Specs as creation record · continuity · copyright meta · repo provenance · build stamps |

Agents **must not** strip IP notices or rebrand without owner request.

---

## 13. Do not

- Flood the screen with floating multi-button docks / second chrome windows  
- **Overlap** any UI elements (logo, edge, CLI, city close, coach)  
- Ship **dot-matrix / low-fi companion figures** before AI graphics surpass high-level gaming  
- Boot into city map / national zoom — default is **full GLOBAL Earth**  
- Treat SpaceNet as “another map app with a chat box”  
- Store primary user content only in abstract folders with no coordinates  
- Remove seed thesis / Cydonia demos without owner request  
- Reintroduce SPA HTML as `astranov-*.js` without `/js/` rescue  
- Skip SPECS updates when the owner gives new product law  
- Strip Astranov SpaceNet IP notices  
- Reintroduce **AVC**, dual coins, or fixed 1:1 EUR as product money — use **S (SpaceNets)** only  

---

*SpaceNet: if it exists, it exists **somewhere**. Default: full Earth. Zoom there. The CLI is the power surface of the net.*
