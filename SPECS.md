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
| **Zero dummy (absolute)** | **No dummy / demo / fake / seed-NPC crap anywhere.** No auto-seeded fake shops, fake people, fake tasks, demo drivers, demo GPS cities, or toy data as the product path. Live = DB + crawlers + real user tiles only. Last resort empty sector is **honest empty** + long-press create / fly elsewhere — never invent Aegean Bites NPCs. |
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

`SOLAR → GLOBAL → NATIONAL → REGIONAL → CITY → STREET`  
Default boot: **full GLOBAL Earth**. City map closed until user asks.  
Object appears by `minZ` + `visibilityKm`.

### Globe pointer law (non-negotiable)

| Input | Behavior |
|-------|----------|
| **Single click / single tap** on body | **Fly + zoom to that place.** First hit (or new place far from focus) → **NATIONAL**. Further singles on same area → **REGIONAL** then **CITY**. CITY opens Earth street map. |
| **Double click / double tap** | **Zoom out one ladder step** toward the globe: CITY → REGIONAL → NATIONAL → GLOBAL → SOLAR. Close street map when leaving CITY. |
| **Drag** | Spin globe only (no dive). |
| **Wheel** | Zoom camera; city Z opens street map at focus under cursor. |
| **No click markers** | Single/double tap **must not** drop huge blue dots / rings. Fly + zoom only. Tiny optional pins only for `locate` / explicit `pulse:true`. |

Mechanical: `SNGlobe.diveInAt` · `SNGlobe.zoomOutOne` · `goToPlace({ pulse: false })` default.

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
| **Click = that place on current body** | Raycast → progressive **dive** (national → regional → city) or **double = zoom out**. **Fly faces the click** (quaternion). **No blue rings on click.** Post-click crawl **must not re-fly**. Focus = last click — never force “my city only” |
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
┌── radar ──┐          ┌── Astranov SpaceNet ──┐          ┌── miner ──┐
│ speed km/h│          │ home → GLOBAL Earth   │          │ S balance │
└───────────┘          └───────────────────────┘          │ S/day     │
                                                          └───────────┘
┌─────────────────────────────────────────────────────────────────────┐
│              FULL GLOBAL EARTH — SNGlobe imaging (KEEP)               │
└─────────────────────────────────────────────────────────────────────┘
┌─ CLI ───────────────────────────────────────────────────────────────┐
│  task ribbon: **current task only** (hidden when idle)                │
│  field · 🎙 hands-free · ➤ Send · expand                              │
└─────────────────────────────────────────────────────────────────────┘
```

| Zone | What | Rule |
|------|------|------|
| **Earth imaging KEEP** | **`SNGlobe`** — Three.js + `earth_atmos_2048` / specular / clouds | **Never strip** |
| **Cosmos (P1-C)** | **`SNCosmos` + `setBody` + land + crawl** — every body a real globe; internet → SpaceNet | Required |
| **Globe click = go there** | Raycast → progressive dive · double zoom out | SpaceNet law |
| **Zoom out of city** | Flat map → **3D body GLOBAL** (Earth: SNGlobe Earth) | Hard ban: stuck on Leaflet as “world” |
| **Map long-press** | **Long-press** empty map → multi-tile. **Short-tap never creates.** Short-tap pin → open tile | Required |
| **On-screen chrome only** | **Radar** · **Astranov SpaceNet** (home/GLOBAL) · **Miner** (S balance + **S/day** only) | No floating multi-docks |
| **Radar** | Top-left · speed km/h · **single tap = big view** · **double tap = small** | Required |
| **Radar blips** | **Green** friends · **red** competitors · **yellow** vendors & clients | Required |
| **Radar routes** | Full **route polygons** (corridor + centerline) for active deliveries · OSRM road path when available · green start · red end · shown small & big radar | Required (`SNField.refreshRoutes` / `showRoute`) |
| **Home** | Center label **Astranov SpaceNet** opens **home menu** (not a bare jump) | Required |
| **Home menu** | Version · local + Athens date/time · user info · sign in/out · **Back to Earth GLOBAL** · reload · hard reset · role toggles: **vendor** · **delivery driver** · **ambassador** | Required (`SNHome` / `home.js`) |
| **Ambassador** | Experienced users support others (`support help` / `support claim`) · **mines SpaceNets (S)** (not “coins”) · mesh rate boost while role on | Authorized product path |
| **Miner** | Top-right · **S balance** + **mining rate S/day** only (tap → finance detail) | Required · **S primary** |
| **Task ribbon** | On CLI top · **materialised for current task only** · **hidden when idle** | **Not permanent button flood** |
| **CLI fixed controls** | Field + **➤ Send** + **🎙 hands-free** (+ size expand) | Required on form, not ribbon |
| **CLI grab** | One finger anywhere on panel: expand/retract / move | Sacred (`SNUi`) |
| **CLI max height** | Default expand = **1/3 of screen** (button, no drag). **User drag may override** taller (up to ~72vh). | Required |
| **Globe control** | Drag must cancel fly + zero inertia; euler YXZ only (no quat/euler fight); soft damp; no wild spin | Required |
| **AI** | `SNAi` greets + freeform acts (locate/shops/fly/go + marketplace) | Required |
| **No overlap / no companion** | Zones; no low-fi figure until AI graphics > games | Hard ban |

### CLI ribbon law (non-negotiable)

| Allowed on ribbon | Forbidden without **owner authorize** |
|-------------------|----------------------------------------|
| Buttons for the **active task context only** (e.g. shops → cart/order/menu; delivery → claim) | Permanent locate · city · shops · me · help · login · first delivery · wallet strip |
| Empty / hidden when task = idle | Floating edge 🎯 🗺 👤 ➕ docks (use CLI text / AI / home / miner instead) |

`locate` · `city` · `shops` · `help` · `login` · `me` remain **CLI commands / AI speech**, not permanent ribbon keys.

**Contaminated (discard):** missing radar **or** miner S **or** Astranov SpaceNet home **or** GLOBAL default **or** permanent multi-button ribbon flood.

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

### First vendor + first delivery (painful path — coached)

**Goal:** owner/user lists a **real** shop + menu, places an order, assigns a **real** driver (same human can wear vendor+client+driver hats), delivers to client — **no NPCs**.

| Step | Chat / CLI | Mechanical |
|------|------------|------------|
| 1 List shop | `list shop Rhodes Grill` or AI coach | `SNMarket.listShop` → me.vendor + pin at focus |
| 2 Menu in S | `menu add Souvlaki 4.5` | `SNMarket.addMenuItem` |
| 3 Order as client | `order me` | cart my menu → `placeOrder` (S fees) |
| 4 Driver online | `drive on` | me.driver + online |
| 5 Deliver | `deliver me` | `claim` + `complete` open delivery |
| Auto | `first delivery` | `SNMarket.runFirstLoop` full path |

**Astranov AI** greets with this path until `SNUsage` flag `firstDeliveryDone`. Pain reports → `SNUsage.handoff` for coding agent.

### Usage data + midnight Greek ship (P4-U)

| Rule | Spec |
|------|------|
| **Track** | `SNUsage.track` on list/order/claim/AI/handoff (localStorage) |
| **Export** | CLI `usage` · `usage export` (ship packet markdown + clipboard) |
| **Handoff bridge** | Chat pain → handoff queue; coding agent reads packet |
| **Cadence** | **One fix per Athens midnight** (`Europe/Athens`) from usage top + open handoffs |
| **Ship** | Workflow `.grok/workflows/midnight-greek-ship.rhai` + `scripts/schedule-midnight-athens.ps1` |
| **Scope** | Single coherent fix in `js/spacenet/*` · probe · push `main` |

### Multi-tile + marketplace must be usable (dedummyfy)

| Step | Spec |
|------|------|
| **Open tile** | Short-tap map pin → full `#sn-tile` panel (CSS + roles + tabs) |
| **Vendor menu** | DB/crawl items or generated menu from real POI name in **S**; **+** adds to cart |
| **Cart** | Cart tab shows lines + total **S** |
| **Order** | Order + deliver → debit **S** · fees 3%/15% · delivery **task** open · map pulses |
| **Claim** | Real user enables Driver on ME · Go online · Claim (no NPC drivers) |
| **Sector fill** | `SNCommerce.ensureSector`: **DB → edge crawler → Overpass → crawl** — never `seedCity` fake people |
| **Empty sector** | Honest empty + long-press multi-tile / `fly` other city — **no** invented NPCs |
| **Media** | Offline-safe SVG photos — no broken external image hosts required |

---

## P0-D — Zero dummy (system-wide ban)

**No dummy crap is allowed anywhere in the live SpaceNet stack.**

| Banned | Allowed |
|--------|---------|
| Auto `seedCity` fake vendors/dates/drivers | Live **DB vendors**, **Overpass/edge crawl** POIs |
| `seedDemo` auto tasks | User-posted **job / date / deliver** only |
| `demo-*` vendor rows | Filter out; never surface as shops |
| Invented default menus (Margherita/Espresso) | Real vendor `items` only — empty until listed |
| Random jitter fake lat/lng for shops/tasks | Real coords only — skip row if missing |
| Auto spatial `seed-*` demo files | User-`put` places at real body+lat+lng |
| “Demo map” / fake GPS city as product | Real GPS **or** honest **default coords** (labeled fallback) |
| Fake friend GPS jitter | Offline presence stays offline |
| Placeholder external broken images as primary | SVG data URIs or real user media |
| Toy 1:1 EUR coins / AVC | **S** only |
| Dummy planet go (text only) | **setBody + land + crawl** (P1-C) |
| Marketplace closed hours | **24/7/365** (P4-M) |

**Code law:** `seedCity` / `seedDemo` must not invent content. `ensureSector` is the only sector fill. Tile **Scan live shops** → `ensureSector`. Agents reintroducing NPC seeds = SPECS violation.

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
- **Any dummy / demo / NPC seed path** on live (violates **P0-D**)  
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
