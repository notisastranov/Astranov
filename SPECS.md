# Astranov SpaceNet — SPECS (sole product authority)

**Chat is not law. This file is.**  
Mirrors: `astranov-continuity.js` · `ASTRANOV_SPECS.md` (features)  
Live: https://astranov.eu · Stack: `index.html` + **`/js/spacenet/*` only**  
Build stamp = `meta[name="astranov-build"]` = every script `?v=`

---

## P0 — Spartan coding (priority number one)

| Rule | Meaning |
|------|---------|
| **Minimal code** | Smallest implementation that fully meets the law. No frameworks of frameworks. No “enterprise” layers. |
| **Function first** | If it doesn’t run the operating path, delete it. |
| **Effectiveness** | One clear owner per concern. No dual systems (no AVC *and* S, no dual CLI, no legacy + live). |
| **Speed** | Never block boot. Soft-load non-critical work. Adaptive FPS. No 30s crawls on start. |
| **Never hang** | Boot must hide within ~18s even on partial failure (CLI-only fallback). No infinite “Loading…”. |
| **Fail closed on ship** | **Forbidden to ship** if `node scripts/probe-spacenet-boot.mjs` is not PASS (real JS, not SPA HTML). |
| **Few files** | Prefer one small module over four “clean” micro-files that re-import each other. |
| **No patch theatre** | If a series of specs is missing, **rebuild** the surface — do not stack micro-patches on a dummy. |
| **No fat** | No companion figure until AI graphics > high-end games. No floating multi-docks. No demo-as-primary. |

**Agent test:** before adding code, ask *can this be ½ the lines and still pass verify?* If yes, cut.  
**Ship test:** probe live critical modules → PASS → then push. Never “hope it works”.

---

## P1 — The law (space is the OS)

**Where you look is the interface.** Digital objects live at real coordinates.

| Principle | Meaning |
|-----------|---------|
| **Place = address** | `body + lat + lng` (+ alt). Not desktop folders. |
| **Zoom = open** | Thesis on garage roof → zoom garage → see file. |
| **Hide in cosmos** | Music on Mars Cydonia → zoom Cydonia → see folder. |
| **All catalogued space** | Planets, moons, dwarfs, belts, black holes, constellations, galaxies, sci-fi dimensions = goable addresses. |
| **Any task in space** | Files, shops, delivery, video, jobs — kinds of **places**, not separate apps. |
| **SpaceNet OS** | OS for interstellar **artificial and biological** entities. |
| **S is primary value** | **SpaceNets (S)** = unit of account. EUR/USD/BTC/ETH/all other money = **secondary quotes only** (no SpaceNet substance). Not AVC. Not “coins”. |

### Place model

```
Place { id, body, lat, lng, alt?, kind, name, payload, visibilityKm, minZ, owner? }
kind ∈ file | folder | shop | delivery | call | note | media
```

**Seeds (always):** thesis garage (Earth) · Cydonia music (Mars) · market hub · video agora.  
Storage: `astranov:spacenet-places-v1`.

### Zoom = filesystem

`SOLAR → GLOBAL → NATIONAL → CITY → STREET`  
Default boot: **full GLOBAL Earth**. City map closed until user asks.  
Object appears by `minZ` + `visibilityKm`.

Talk examples: `put thesis on the garage` · `go to mars` · `go to Jupiter` · `shops` · `locate`

---

## P2 — Full picture (one surface)

```
┌──────── radar ────────┐     ┌── logo + GLOBAL ──┐     ┌── S field ──┐
│ sweep · 1671 km/h     │     │ Astranov SpaceNet │     │ balance S   │
│ blips shops/places    │     │                   │     │ mine · FPS  │
└───────────────────────┘     └───────────────────┘     └─────────────┘
        G (auth)                    task ribbon                 LOC MAP ME +
                              (buttons for THIS task only)
┌─────────────────────────────────────────────────────────────────────┐
│                         FULL GLOBAL EARTH                             │
└─────────────────────────────────────────────────────────────────────┘
                              CLI (collapsed default)
```

| Zone | What | Rule |
|------|------|------|
| **Radar** | Top-left · ~8fps · 1671 km/h on global | Required |
| **Logo** | Center · hard reset | Never under edge/S |
| **S field** | Top-right · S balance · secondary EUR/USD · mine · FPS/spare · tap → finance | Required · **S primary** |
| **Task ribbon** | Under logo · **materialises** buttons for **current task only** | Not a permanent dock flood |
| **Edge** | Right under S: **LOC MAP ME +** only | Few permanent controls |
| **G** | Under radar | Auth |
| **CLI** | Bottom · field + log · Enter sends | Power surface |
| **Earth** | Full viewport behind chrome | Default GLOBAL |
| **No overlap** | Zones must not stack | Hard ban |
| **No companion figure** | Until AI graphics > high-end games | Hard ban |

**Contaminated (discard):** any build missing radar **or** S field **or** mine/resources/perf **or** task ribbon **or** GLOBAL default — thin “globe+CLI only” is fake.

### CLI (minimum commands)

`help` · `locate` · `city` · `shops` · `rate` · `wallet` · `resources` · `mine on|off` · `donate on|off` · `finance` · `thesis` · `vault` · `go to mars` · `global` · `task list`

---

## P3 — Economy (S)

| | |
|--|--|
| **Name / symbol** | SpaceNets / **S** |
| **Primary** | All prices, fees, mining, payouts in **S** |
| **Secondary** | EUR USD BTC ETH … = quotes only via `SNCurrency.quote` |
| **Value** | Dynamic · tight to SpaceNet network index (shops, orders, places, presence) |
| **Fees** | Platform **3% of S** · vendor→driver **15% of gross in S** |
| **Mining** | Spare CPU/RAM/storage/net → earn **S** (users serve users) |
| **Banned** | AVC · dual coins · 1 unit = 1 EUR as product law · elevating fiat/crypto above S |

Display: `12.50 S` optional `(~… EUR)`.

---

## P4 — Juice (why it exists)

Progress these — do not re-litigate globe chrome forever.

1. **Locate → city → real shops** (Supabase DB-first; no boot Overpass freeze)  
2. **Cart → order → delivery task** (fees in S)  
3. **Jobs / dates / errands** as place-tasks  
4. **Spatial seeds** (thesis, Cydonia)  
5. **Video / presence** as place kinds (later, same model)

Marketplace path: pin → browse → cart → place → track → claim → pilot multi-stop.

---

## P5 — Stack (minimal owners)

Live load **only** `/js/spacenet/*`. Root `astranov-*.js` and `_archive/` are **dead on live**.

| Concern | File → API |
|---------|------------|
| Boot | `boot.js` |
| Globe inertia + tiers | `globe.js` → `SNGlobe` |
| CLI | `cli.js` → `SNCli` |
| CLI drag/size | `ui.js` → `SNUi` |
| Field chrome (radar+S+mine+ribbon+finance) | `field.js` → `SNField` |
| S quotes + wallet | `currency.js` → `SNCurrency` |
| Shops DB | `commerce.js` → `SNCommerce` |
| Map | `map.js` → `SNMap` |
| Profiles / cart / order | `profiles.js` · `tile.js` |
| Places | `spatial.js` → `SNSpatial` |
| Tasks | `tasks.js` → `SNTasks` |
| Search / crawl | `search.js` |
| Auth / AI | `auth.js` · `ai.js` (lazy) |
| Brain / law in code | `brain.js` → `SNBrain` |
| Continuity | `astranov-continuity.js` |

**Spartan file rule:** field surface is **one** `field.js` (not four). Currency+wallet is **one** `currency.js`.

### Operating path (boot)

```
GLOBAL Earth + field chrome + CLI collapsed
  → soft DB shops for pulses only (no city map steal)
  → user locate|city|shops|mine|rate → intentional
  → never 30s Overpass on boot
```

### Ship gate

| Green | Red |
|-------|-----|
| GLOBAL Earth, no multi-sec freeze | Demo-only shops as “ready” |
| Radar + S field + ribbon present | SPA HTML served as JS |
| `resources` · `rate` · `shops` work | Missing required surface |
| Soft shops ≠ auto city map | Overlapping chrome / companion figure |
| Verify before push; one coherent ship | Deploy spam / dummy ships |

```text
node scripts/owner-push.mjs <files> --message=...
```

---

## P6 — Agent discipline

1. Owner changes intent → **update this SPECS** (+ continuity if owners/selectors change).  
2. **Spartan first** — cut before you add.  
3. Implement; don’t babysit.  
4. Never ship unverified; fail closed on red probe.  
5. Do not reintroduce AVC, dual docks, CLI miner strip, thin contaminated stacks.

---

## P7 — IP

| | |
|--|--|
| **Name** | Astranov · Astranov SpaceNet · SpaceNet · **S / SpaceNets** |
| **Authors** | Owner (notisastranov) + AI pair under direction |
| **Notice** | © Astranov SpaceNet. All rights reserved. |
| **Machine** | `AstranovContinuity.ip` · meta `astranov-ip` |

Do not strip IP or rebrand without owner request.

---

## P8 — Do not

- Write fat / clever / multi-layer code when a short path works (**violates P0**)  
- Overlap chrome · permanent multi-button docks · dual CLI bars  
- Ship without radar + S + resources/mine + task ribbon  
- Boot into city map · block boot with crawl  
- AVC / coins / 1:1 EUR as product money  
- Low-fi companion figure before AI graphics > high-end games  
- Micro-patch over a broken series of specs — **rebuild**  
- Load legacy monoliths on live  

---

*Spartan code. Full Earth. Real places. S is the value. Zoom is open.*
