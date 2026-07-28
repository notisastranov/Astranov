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
| **Never make owner restate law** | **Forbidden** to force the owner to re-explain the same SPECS. Agents must read SPECS + continuity **before** coding, remember owner decisions from this file, and not regress fixed surface (globe return, multi-tile, CLI send/hands-free/AI, emoji edge, SNGlobe imaging). |
| **Ship only if it works** | If boot/map/CLI/AI path is red, **keep working** — do not declare done. Live probe + manual path green required. |

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
| **All catalogued space** | Planets, moons, dwarfs, belts, black holes, constellations, galaxies, sci-fi dimensions = **goable addresses**. |
| **Any task in space** | Files, shops, delivery, video, jobs — kinds of **places**, not separate apps. |
| **SpaceNet OS** | OS for interstellar **artificial and biological** entities. Internet advanced to SpaceNet. |
| **S is primary value** | **SpaceNets (S)** = unit of account. EUR/USD/BTC/ETH/all other money = **secondary quotes only**. Not AVC. Not “coins”. |
| **Dedummyfy space** | Every body has a **real globe**. Going anywhere **lands** there and **crawls** what is there. No fake “solar label only”. |

### Place model

```
Place { id, body, lat, lng, alt?, kind, name, payload, visibilityKm, minZ, owner? }
body ∈ earth | moon | mars | … (see P1-C)
kind ∈ file | folder | shop | delivery | call | note | media
```

**Seeds (always):** thesis garage (Earth) · Cydonia music (Mars) · market hub · video agora.  
Storage: `astranov:spacenet-places-v1` / `sn:places-v1`.

### Zoom = filesystem (on current body)

`SOLAR → GLOBAL → NATIONAL → CITY → STREET`  
Default boot: **full GLOBAL Earth**. City map closed until user asks.  
Object appears by `minZ` + `visibilityKm`.

Talk examples: `put thesis on the garage` · `go to mars` · `go to Jupiter` · `go to moon` · `shops` · `locate` · `cosmos`

---

## P1-C — Cosmos / multi-body (dedummyfy every globe)

**This is the advancement of the internet to SpaceNet:** you do not browse a flat list of planets — you **go** into space. Every destination is a **body + coordinates**. Landing **must** run crawlers for what exists there.

### Law (non-negotiable)

| Rule | Spec |
|------|------|
| **Go anywhere = three steps** | **(1) `setBody`** real sphere for that world · **(2) land** at lat/lng · **(3) `scan` / crawl** what is there |
| **Every body is a globe** | Not a text label. `SNGlobe.setBody(id, meta)` swaps texture and/or body color on the Three.js sphere |
| **Earth imaging KEEP** | Earth stays **`SNGlobe`** + `earth_atmos_2048` / specular / clouds. Do not strip |
| **Click = that place on current body** | Raycast → lat/lng → `goToPlace` NATIONAL + crawl. Focus = last click/zoom — **never** always force “my city only” |
| **City map is Earth street only** | Leaflet opens only when **body === earth**. Leaving Earth **closes** city map |
| **Dummy banned** | “go to mars” that only prints a line or jumps solar tier **without** body switch + land + crawl = **contaminated** |
| **Crawl on arrival** | Always after land (unless caller already scanning) |

### Mechanical owners

| API | File | Does |
|-----|------|------|
| **`SNGlobe`** | `js/spacenet/globe.js` | Sphere, imaging, inertia, `pickLatLng`, `goToPlace`, `setBody`, `flyNear`, tiers |
| **`SNCosmos`** | `js/spacenet/cosmos.js` | Body catalog, `go(name)`, `scan(body,lat,lng)`, `resolve`, `parseGo` |
| **`SNSearch`** | `js/spacenet/search.js` | Almighty crawl (geocode, reverse, POI, wiki, web, …) |
| **`SNSpatial`** | `js/spacenet/spatial.js` | Places at body+lat+lng; open → `SNCosmos.go` |
| **`SNCommerce`** | `js/spacenet/commerce.js` | Earth shops bbox (crawl feed on Earth land) |

### Go pipeline (implement exactly)

```
user "go to mars" | "go to jupiter" | SNCosmos.go(target, lat?, lng?)
  → resolve body from catalog
  → SNGlobe.setBody(body.id, body)     // real globe for that world
  → if body !== earth: SNMap.close()
  → SNGlobe.goToPlace(lat, lng, { tier, body, skipScan: true })
  → SNCosmos.scan(body, lat, lng)      // crawlers: what is there
```

```
short-tap on current globe
  → pickLatLng(x,y)
  → goToPlace(lat, lng, { tier: national, body: current })
  → scan(current body, lat, lng)
```

### Bodies (minimum catalog — extend, do not shrink)

| id | Notes |
|----|--------|
| **earth** | Full textures + clouds; city map + shops + reverse geocode |
| **moon** | Texture when available; default Sea of Tranquility |
| **mars** | Texture or color fallback; default **Cydonia** |
| **mercury · venus · jupiter · saturn · uranus · neptune · pluto** | Color (and map if available); named defaults where set |
| **europa · titan** | Moons as bodies (parent noted in meta) |
| **cydonia** | Alias → mars + Cydonia lat/lng |

CLI: `cosmos` lists bodies · `go to <body>` · `go to earth` · `fly <city>` (Earth geocode + land + crawl).

### Crawl matrix (what “search through crawlers” means)

| Body | On land / scan must attempt |
|------|------------------------------|
| **earth** | Reverse geocode · `SNSearch.crawl` (places/POI/wiki) · `SNCommerce.loadNear` shops · spatial seeds on earth |
| **other** | Wikipedia summary (body / region) · spatial places on that body · CLI report lines |
| **always** | List matching `SNSpatial` seeds/places near lat/lng on that body |

Results print to CLI: `◎ Body · lat, lng` then wiki/POI/shop/spatial lines. Not silent.

### Zoom tiers (per current body)

| Tier | Meaning |
|------|---------|
| SOLAR | Far context (camera z high) |
| GLOBAL | Whole-body overview |
| NATIONAL | Regional / large feature (click target) |
| CITY | Street map **only if body = earth** |
| STREET | Same path via map zoom |

### CLI (cosmos minimum)

`cosmos` · `go to mars` · `go to moon` · `go to jupiter` · `go to europa` · `go to earth` · `fly athens` · `thesis` · `vault` · (any `go to <catalog id>`)

### Red / dummy (do not ship)

- go to planet = text only, no `setBody`  
- Zoom always opens **GPS/home city** regardless of click focus  
- Off-Earth still opens Earth Leaflet as if it were that world  
- Land with **no** crawl/scan attempt  
- Strip multi-body catalog back to Earth-only without owner order  

---

## P2 — Full picture (one surface)

```
┌──────── radar ────────┐     ┌── logo + GLOBAL ──┐     ┌── S field ──┐
│ sweep · 1671 km/h     │     │ Astranov SpaceNet │     │ balance S   │
│ blips shops/places    │     │                   │     │ mine · FPS  │
└───────────────────────┘     └───────────────────┘     └─────────────┘
     🔐 auth                 task ribbon (this task)      🎯 🗺 👤 ➕
┌─────────────────────────────────────────────────────────────────────┐
│              FULL GLOBAL EARTH — SNGlobe imaging (KEEP)               │
└─────────────────────────────────────────────────────────────────────┘
                    CLI: field · 🎙 hands-free · ➤ Send
```

| Zone | What | Rule |
|------|------|------|
| **Earth imaging KEEP** | **`SNGlobe`** — Three.js + `earth_atmos_2048` / specular / clouds | **Never strip** |
| **Cosmos (P1-C)** | **`SNCosmos` + `setBody` + land + crawl** — every body a real globe; internet → SpaceNet | Required |
| **Globe click = go there** | Raycast → NATIONAL on **current body** + scan | SpaceNet law |
| **Zoom out of city** | Flat map → **3D body GLOBAL** (Earth: SNGlobe Earth) | Hard ban: stuck on Leaflet as “world” |
| **Map long-press** | **Long-press** empty map (~580ms) → `SNTile.createAt` multi-tile. **Short-tap never creates.** Short-tap pin → open full tile | Required |
| **Radar** | Top-left · ~8fps · center = speed km/h · **caption below** names the mode | Required |
| **Radar speed meaning** | **Solar:** Earth through space (orbit ~107208 km/h). **Global/national:** Earth rotation at equator (~1671 km/h). **City map:** walking (~5 km/h). **City tier:** driving urban (~50 km/h). Text under radar explains which | Required |
| **Logo** | Center · hard reset | Never under edge/S |
| **S field** | Top-right · S balance · mine · FPS · finance | Required · **S primary** |
| **Task ribbon** | Materialised buttons for **current task only** | Not permanent dock flood |
| **Edge** | 🎯 🗺 👤 ➕ (emoji) + 🌍 Globe | Not letter-only LOC/MAP |
| **Auth** | 🔐 under radar | |
| **CLI** | Field + **➤ Send** + **🎙 hands-free** → `SNAi` | Required |
| **CLI grab** | **One finger from anywhere** on the CLI panel: vertical = smooth expand/retract · free = move · snap collapsed/mid/expanded | Sacred (`SNUi` / `ui.js`) |
| **AI** | **`SNAi` must greet, talk, and run tasks** on boot (`bootPresence` / `greet`). Freeform CLI → `SNAi.ask` (acts: locate/shops/job/date/deliver + edge chat). Not a silent optional module. | Required |
| **No overlap / no companion** | Zones; no low-fi figure until AI graphics > games | Hard ban |

**Contaminated (discard):** any build missing radar **or** S field **or** mine/resources/perf **or** task ribbon **or** GLOBAL default — thin “globe+CLI only” is fake.

### CLI (minimum commands)

`help` · `locate` · `city` · `shops` · `rate` · `wallet` · `resources` · `mine on|off` · `donate on|off` · `finance` · `thesis` · `vault` · **`cosmos`** · **`go to mars|moon|jupiter|…`** · **`go to earth`** · `fly <city>` · `global` · `task list`

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
2. **Cart → order → delivery task** (fees in S) — **24/7/365 all locations** (P4-M)  
3. **Jobs / dates / errands** as place-tasks  
4. **Go anywhere in space** (P1-C): body globe + land + crawl  
5. **Spatial seeds** (thesis Earth, Cydonia Mars)  
6. **Video / presence** as place kinds (later, same model)

Marketplace path: pin → browse → cart → place → track → claim → pilot multi-stop.

---

## P4-M — Delivery marketplace: always on (24 / 7 / 365)

**SpaceNet allows continuous delivery marketplace operation — 24 hours a day, 365 days a year, in all locations.**

This is product law, not a nice-to-have. The net does not “close for the night” or “close on Sundays” as a platform.

| Rule | Spec |
|------|------|
| **Always open** | Platform marketplace accepts browse · cart · order · claim · track · pilot **at any hour, any day of year** |
| **All locations** | Any Earth city/sector SpaceNet can address (locate / fly / crawl / DB shops) — no region hard-off by product default |
| **No platform curfew** | Agents must **not** add artificial “marketplace closed 22:00–08:00”, weekend-only, or geo-kill switches without owner order |
| **Vendor hours ≠ platform hours** | A shop’s OSM/local `opening_hours` may be **shown** for honesty; they **do not** shut SpaceNet or block the delivery pipeline product-wide. Drivers/vendors may still be offline as **people** — the **marketplace** stays operable |
| **Fees still apply** | 3% platform · 15% driver gross — in **S** — whenever a transaction runs |
| **Currency** | All marketplace amounts in **S (SpaceNets)** |
| **Code** | `commerce.js` · `profiles.js` · `tile.js` · `tasks.js` (delivery kind) · map pins — no time-window gate on place order |

### Operating truth

```
any UTC instant · any addressed lat/lng on Earth
  → user may open shops · add cart · place order (S)
  → delivery task may open · driver may claim when available
  → no SPECS-level “closed calendar”
```

### Red (do not ship)

- Hard-coded marketplace closed hours / closed days  
- “Only open in country X business hours” as product default  
- Blocking order placement solely because local wall-clock is night  

---

## P5 — Stack (minimal owners)

Live load **only** `/js/spacenet/*`. Root `astranov-*.js` and `_archive/` are **dead on live**.

| Concern | File → API |
|---------|------------|
| Boot | `boot.js` (loads `cosmos.js` after `globe.js`) |
| **Earth / multi-body imaging** | `globe.js` → **`SNGlobe`** · `setBody` · `goToPlace` · `pickLatLng` |
| **Cosmos go + crawl** | `cosmos.js` → **`SNCosmos`** · `go` · `scan` · body catalog |
| CLI + send + hands-free | `cli.js` → `SNCli` (`go to …` · `cosmos` · `fly`) |
| AI | `ai.js` → `SNAi` (greet + act including go to body) |
| Multi-tile | `tile.js` → `SNTile` (long-press create / short-tap open) |
| CLI drag/size | `ui.js` → `SNUi` |
| Field chrome | `field.js` → `SNField` |
| S quotes + wallet | `currency.js` → `SNCurrency` |
| Shops DB | `commerce.js` → `SNCommerce` |
| City map (Earth only) | `map.js` → `SNMap` |
| Profiles / cart / order | `profiles.js` · `tile.js` |
| Places | `spatial.js` → `SNSpatial` (open → `SNCosmos.go`) |
| Tasks | `tasks.js` → `SNTasks` |
| Almighty crawl | `search.js` → `SNSearch` |
| Auth | `auth.js` |
| Brain | `brain.js` → `SNBrain` |
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
| Tap Earth lands + scans; `go to mars` setBody+land+scan | Dummy planet (text / solar only) |
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
- Make the **owner restate SPECS** the agent already has  
- Ship red boot / dead CLI / no AI / zoom-out stuck on flat map  
- Strip **SNGlobe** Earth imaging (atmos / specular / clouds)  
- **Dummy cosmos**: go to planet without `setBody` + land + crawl  
- Always zoom city map to **home GPS only** (ignore click focus)  
- Open Earth Leaflet as stand-in for Mars/Moon/etc.  
- Letter-only edge buttons when emoji icons are required  
- CLI without **Send** + **hands-free**  
- Overlap chrome · permanent multi-button docks · dual CLI bars  
- Ship without radar + S + resources/mine + task ribbon  
- Boot into city map · block boot with crawl  
- Impose **marketplace curfew** or closed calendar (violates **P4-M** 24/7/365 all locations)  
- AVC / coins / 1:1 EUR as product money  
- Low-fi companion figure before AI graphics > high-end games  
- Micro-patch over a broken series of specs — **rebuild**  
- Load legacy monoliths on live  
- Make owner restate P1-C multi-body law  

---

*Spartan code. Go anywhere = real body globe + land + crawl. SNGlobe · SNCosmos. S is the value.*
