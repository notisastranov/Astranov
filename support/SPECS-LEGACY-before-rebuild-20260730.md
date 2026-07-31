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
| **Splash screen** | **Only** wordmark **ASTRANOV** (no SpaceNet text) + **horizontal** deep **glowing blue** loader bar. **Forbidden:** “SPACENET” on splash · status prose · version spam · agent notes. Fail: same brand + optional Retry — details in console only. |
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

### SPACENET — pilot fly grid net (non-negotiable)

**Name:** **SPACENET** (the pilot fly grid). Without SPACENET, **flying on the net is not possible**.

```
SOLAR
  ↕
GLOBAL      whole-body overview
  ↕
NATIONAL    country-scale · borders · major cities · day/night · local time
  ↕
REGIONAL    metro / province scale
  ↕
CITY        operational street map + vendor / worker / driver / dating tiles
  ↕
STREET      same path as CITY map (Earth Leaflet)
```

| Rule | Law |
|------|-----|
| **Grid cells** | **GLOBAL → NATIONAL → REGIONAL → CITY** (single-tap same place advances one cell) |
| **New place** | Far click re-enters at **GLOBAL** facing that lat/lng (anchor reset) |
| **Double tap** | Step **out** one cell: CITY → REGIONAL → NATIONAL → GLOBAL → SOLAR |
| **Anchor** | Same-place radius is tier-aware (wide at GLOBAL, tighter at CITY) so taps do not falsely reset |
| **Altitude is truth** | Next cell uses camera **z** + `diveTier`, not a fragile counter alone |
| **Mechanical** | `window.SPACENET` · `js/spacenet/spacenet-grid.js` · `SNGlobe.diveInAt` · `zoomOutOne` · `goToPlace` |
| **CLI speech** | Log lines say **SPACENET · GLOBAL|NATIONAL|REGIONAL|CITY** |

Default boot: **full GLOBAL Earth in space** (whole sphere visible · stars · ISS/LEO when ready).  
**Not** a cropped hemisphere · **not** city map · **not** Rodos/training surface.  
City map closed until CITY cell (user dive / `city` / `fly` / `locate` path).  
Object appears by `minZ` + `visibilityKm`.

### Globe pointer law (non-negotiable)

| Input | Behavior |
|-------|----------|
| **Single click / single tap** on body | **SPACENET dive** one cell deeper on **same place**: GLOBAL → NATIONAL → REGIONAL → CITY. New place → GLOBAL at click. |
| **City map short-click empty** | Close street map → **NATIONAL** (or SPACENET step out) at that lat/lng | Required |
| **Double click / double tap** | **SPACENET out** one cell: CITY → REGIONAL → NATIONAL → GLOBAL → SOLAR. Close street map when leaving CITY. |
| **Drag** | Spin globe only (no dive). **Polar axis law:** longitude spin around **true Y (north–south)**; latitude tilt around **X** only. **Forbidden:** clock-face spin (Z / gimbal) · flip over poles. |
| **Wheel** | Zoom camera; city Z opens street map at focus under cursor. |
| **No click markers** | Single/double tap **must not** drop huge blue dots / rings. Fly + zoom only. Tiny optional **targets** only for `locate` / explicit `pulse:true`. |

Mechanical: `SNGlobe.diveInAt` (SPACENET) · `SNGlobe.zoomOutOne` · `goToPlace({ pulse: false })` default.

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
| **Click = that place on current body** | Raycast → **SPACENET** dive (global → national → regional → city) or **double = zoom out**. **Fly faces the click** (quaternion). **No blue rings on click.** Post-click crawl **must not re-fly**. Focus = last click — never force “my city only” |
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
short-tap on current globe (SPACENET)
  → pickLatLng(x,y)
  → SPACENET.nextDive({ anchor, z, tier, lat, lng })
  → goToPlace(lat, lng, { tier: global|national|regional|city, body: current })
  → at CITY: open street map + ensureSector tiles
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

| SPACENET cell | Meaning |
|---------------|---------|
| SOLAR | Far context (camera z high) — above the grid |
| GLOBAL | Whole-body overview — SPACENET entry |
| NATIONAL | Country-scale: **boundary lines** (glowing blue) · **major cities** · **local time** · **day/night** |
| REGIONAL | Metro / province — same national layer, closer |
| CITY | Street map **only if body = earth** · vendors · workers · drivers · dating · tasks |
| STREET | Same path via map zoom |

### Surface map engine (near surface / CITY)

Lightweight **Leaflet** (lazy-loaded only at CITY). **Layers** button (top-right) opens multi-provider panel.

**Basemap (pick one):**

| Layer | Engine | Cost |
|-------|--------|------|
| **Bright** | Carto Voyager | Free |
| **Dark** | Carto Dark | Free |
| **Satellite** | Esri World Imagery | Free |
| **Google-style** | OSM HOT stand-in | Free |
| **G-Sat / G-Hyb / G-Topo / G-Road** | **Google Maps JS** satellite · hybrid · terrain · roadmap (+ Street View) | **Needs `googleMapsKey`** |
| **Traffic** | OSM DE roads basemap | Free |

**Google Earth imaging (official):** set `SN_CONFIG.layers.googleMapsKey` with **Maps JavaScript API** + **Elevation API** enabled (billing). Mechanical: `SNGoogleEarth` · `js/spacenet/google-earth.js`. Topo: geodesic area/distance · elevation samples · 3D path length (`measure topo`). Without key: free Esri sat + open-elevation.

**Overlays (multi on):**

| Overlay | Source | Notes |
|---------|--------|--------|
| **Windy** | Windy embed iframe | Weather · wind |
| **w3w** | what3words API or SN fallback words | Key optional |
| **ISS** | wheretheiss.at | Live station |
| **Sats** | ISS + sample LEO marks | Expand with TLE later |
| **Planes** | OpenSky Network | Live aircraft in view |
| **Ships** | OpenSeaMap seamarks | Chart marks free |
| **Roads** | HOT roads tile overlay | Emphasis |

CLI: `layers` · `map dark|bright|satellite|google|traffic` · `windy` · `iss` · `planes` · `ships` · `w3w`.  
Prefs: `sn:map-layer-v1` · `sn:map-overlays-v1`.

Mechanical: `window.SPACENET` + `SNGlobe` webbing (`syncNationalLayer`) — Earth only; **visible only below GLOBAL** (NATIONAL · REGIONAL · CITY globe). **Grid is transparent and faded only** (low opacity, no bright pulse). Hidden at SOLAR/GLOBAL overview and when street map is open.  
City tasks: `pizza` → `SNMarket.fulfillFoodIntent` · `job barman` → `fulfillWorkIntent` · `date` → `fulfillDatingIntent` (real tiles only, zero NPC).

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
| **Map long-press** | **Long-press** empty map → multi-tile. **Short-tap never creates.** Short-tap **target** → open tile | Required |
| **On-screen chrome only** | **Radar** · **ASTRANOV** home (center) · **Miner** (S balance + **S/day** only) | No floating multi-docks |
| **Radar** | Top-left · speed km/h · **single tap = big view** · **double tap = small** | Required |
| **Radar blips** | **Green** friends · **red** competitors · **yellow** vendor workers & clients | Required |
| **Radar routes** | Full **route polygons** (corridor + centerline) for active deliveries · OSRM road path when available · green start · red end · shown small & big radar | Required (`SNField.refreshRoutes` / `showRoute`) |
| **Home** | Center label **ASTRANOV** only (no SpaceNet word) · opens **home menu** | Required · owner-verified 2026-07-30 |
| **Home menu** | Version · local + Athens date/time · user info · sign in/out · **Back to Earth GLOBAL** · reload · hard reset · role toggles: **vendor worker** · **delivery driver** · **ambassador** | Required (`SNHome` / `home.js`) |
| **Auth branding** | Users must know they sign in to **ASTRANOV / astranov.eu** only — **never** Supabase project ref / `*.supabase.co` as product identity | Required · **ship-red** if Google shows project host |

### Auth branding (login must show astranov.eu / ASTRANOV — not supabase project crap)

**Law (owner-verified):** On the Google login screen users must see they are signing into **astranov.eu / ASTRANOV** — **never** a random `xxxx.supabase.co` project id.

| Layer | Required action |
|-------|-----------------|
| **Google Cloud → Branding** | App name **ASTRANOV** (or Astranov) · support email owner · home **https://astranov.eu** · privacy/terms on astranov.eu · authorized domain **astranov.eu** · logo · **Publish app** |
| **Google Cloud → OAuth Client (Web)** | Origins: `https://astranov.eu` · redirect URIs for auth host (custom domain preferred) |
| **Supabase → Auth → URL config** | Site URL `https://astranov.eu` · Redirect URLs `https://astranov.eu/**` |
| **Supabase → Custom Domain** | **`api.astranov.eu`** (or `auth.astranov.eu`) live · DNS **DNS-only** (grey cloud) · then `SN_CONFIG.sbUrl` = that host · Google callback on that host |
| **Preferred sign-in path** | **Google Identity Services** (`gsi/client`) + Supabase `signInWithIdToken` so users never open an authorize URL whose `redirect_uri` is `*.supabase.co` |
| **App UI** | **Sign in with Google · astranov.eu** · scrub any supabase host from user-visible errors |

**Without Custom Domain + branded GIS path:** Google showing `xxxx.supabase.co` = **contaminated / not ship-acceptable**.
| **Ambassador** | Experienced users support others (`support help` / `support claim`) · **mines SpaceNets (S)** (not “coins”) · mesh rate boost while role on | Authorized product path |
| **Miner** | Top-right · **S balance** + **mining rate S/day** only (tap → finance detail) | Required · **S primary** |
| **Finance entry** | **Only** top-right money HUD (`#field-balance-hud`). **Forbidden:** finance / rate / wallet **buttons on CLI ribbon** without owner authorization. CLI may print text (`rate` · `wallet` · `fees`) only. | Required |
| **Burger menu** | **Top-left under radar** (`#sn-burger-btn` / `#sn-burger-panel`). Place for **extensive secondary menus** (navigate · market · mesh/tools). **Not** CLI ribbon. **Not** finance (S HUD). | Required |
| **One CLI surface** | Sim / super / TX / fleet dump **only into main CLI log** (`#cli-log`). **Forbidden:** floating “LIVE” panels, super decks, or extra CLI-like menus flooding the globe. | Required |
| **No auto chrome steal** | **Forbidden** to auto-expand radar, auto-open multi-tiles, or auto-blow CLI panel on sim/AI/order. User opens tiles by **tap on map**; radar expand by **tap radar**. | Required |
| **CLI = text CLI** | **Log + typed input only.** **Forbidden:** emoji button ribbon inside CLI dock · feed “chip/button tiles” · menu/cart/order ribbon keys. Tools: **☰ burger** · **typed commands** · **AI by typing**. Enter sends. | Owner-verified 2026-07-30 · hard ban on CLI buttons |
| **CLI history** | Scroll log for history · type `/` or `?` + words to search history | Required |
| **Multi-tile** | Full multi-role tile **on map** (overlay card · menu/order/roles). **Not** fake buttons inside CLI. | Required |
| **Map Layers control** | **No** map-corner Layers button (overlaps money HUD). Layers via **typed CLI** / burger · panel may open from commands. | Required |
| **CLI grab** | One finger on panel drag handle / panel: expand/retract / move | Sacred (`SNUi`) |
| **CLI max height** | Default expand ≈ **1/3 screen**. User drag may override taller. | Required |
| **Globe control** | Drag cancels fly + zero inertia; **polar Y spin + X tilt only**; soft damp; no clock/Z spin | Required |
| **AI name** | The AI is **Astranov**. Answers as **Astranov** · status **ASTRANOV LISTENING**. Currency unit remains **S (SpaceNets)**. | Owner-verified 2026-07-30 |
| **AI priority** | **LISTEN → ANALYZE → RESPOND** brief · reply on **globe HUD** · **control the app** (basemap, layers, first delivery, etc.) | Required |
| **AI free mind** | `SNFreeMind` free-first · no paid Grok/xAI required for chat · **no junk fuzzy answers** (e.g. “climb” to “is Grok there”) · hard intents for identity | Required |
| **AI grow** | `teach Q => A` · `free export` | Required |
| **No demo / no training sim** | **Deleted** Sim-33 · driver-day · **`sim task` train** · Rodos “training surface” default. Real CLI use only. | Hard ban · owner-verified |
| **Task multi-tile** | Glowing **deep blue price (S)** · vendor name+address · client name+address · map routes · route compatibility ranking | Required |
| **First order path** | `first delivery` / `first order` must complete: list shop → menu → order S → driver online → claim/deliver. Market module **on shell boot**. | Required · owner P0 |
| **Mesh donate (SETI-style)** | `donate on` · spare CPU/worker · RAM/storage/bandwidth idle → **S** rewards · global users power the net | Required |
| **No overlap / no companion** | Zones; no low-fi figure until AI graphics > games | Hard ban |

### CLI surface law (owner-verified — text, not buttons)

| Rule | Spec |
|------|------|
| **What CLI is** | Terminal: **#cli-log** scroll stream + **#cli-in** type line. |
| **What CLI is not** | Permanent Locate/User/Add/Layers/AI/Send **button bar** · tile chip strip · feed button cards. |
| **Secondary tools** | **☰ under radar** (extensive) · home menu · money HUD finance · map multi-tile. |
| **AI activation** | Type to Astranov / `ai` / hands-free command paths — not a fat ribbon key required. |
| **Contaminated** | CLI dock full of buttons · “shipped” while ribbon still floods · multi-tile as CLI buttons |

**Resize:** drag panel. **Input:** seamless with log — Enter sends.

**Contaminated (discard):** missing radar **or** miner S **or** **ASTRANOV** home **or** GLOBAL-in-space default **or** CLI button flood **or** supabase project on Google login.

### CLI (minimum commands)

`help` · `locate` · `city` · `shops` · `rate` · `wallet` · `resources` · `mine on|off` · `donate on|off` · `finance` · `thesis` · `vault` · **`cosmos`** · **`go to mars|moon|jupiter|…`** · **`go to earth`** · `fly <city>` · `global` · `first delivery` · `task list` · `layers` · `dark` / basemap words

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

Marketplace path: target → browse → cart → place → track → claim → pilot multi-stop.

### First vendor + first delivery (painful path — coached)

**Goal:** owner/user lists a **real** shop + menu, places an order, assigns a **real** driver (same human can wear vendor+client+driver hats), delivers to client — **no NPCs**.

| Step | Chat / CLI | Mechanical |
|------|------------|------------|
| 1 List shop | `list shop Rhodes Grill` or AI coach | `SNMarket.listShop` → me.vendor + target at focus |
| 2 Menu in S | `menu add Souvlaki 4.5` | `SNMarket.addMenuItem` |
| 3 Order as client | `order me` | cart my menu → `placeOrder` (S fees) |
| 4 Driver online | `drive on` | me.driver + online |
| 5 Deliver | `deliver me` | `claim` + `complete` open delivery |
| Auto | `first delivery` | `SNMarket.runFirstLoop` full path |
| **Food juice** | `pizza` / `order sushi` / food words | `SNMarket.fulfillFoodIntent`: locate → find → tiles/menus/prices S → judge → order → assign driver |

**SpaceNet AI** greets with this path until `SNUsage` flag `firstDeliveryDone`. Pain reports → `SNUsage.handoff`. **Astranov = Architect of SpaceNet.**

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
| **Open tile** | Short-tap map **target** → full `#sn-tile` panel (CSS + roles + tabs) |
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
| **Code** | `commerce.js` · `profiles.js` · `tile.js` · `tasks.js` (delivery kind) · map **targets** — no time-window gate on place order |

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

### Splash (first paint)

```
#boot  →  black full-screen
          ASTRANOV
          [horizontal deep glowing blue loader bar]
```

No SpaceNet word. No other copy. `#boot` hides when shell ready. Agents must not reintroduce status lines on splash.

### Operating path (boot)

```
Fast shell (CLI + field + market first delivery path) → hide splash
  → then THREE + GLOBAL Earth in space
  → soft map/commerce after
  → never city map auto-open · never 30s Overpass on boot
  → user intentional: locate|city|shops|first delivery|donate on
```

### Ship gate

| Green | Red |
|-------|-----|
| GLOBAL Earth **in space** (full sphere), no multi-sec freeze | Demo shops / training Rodos default / city auto-open |
| Radar + S field + **text CLI** | SPA HTML as JS · CLI button flood |
| `first delivery` works after shell boot | Market missing · order path red |
| Google login shows **astranov.eu / ASTRANOV** | `*.supabase.co` project host on consent |
| Soft shops ≠ auto city map | Overlapping chrome / companion figure |
| Tap Earth lands + scans; `go to mars` setBody+land+scan | Dummy planet (text / solar only) |
| Live path verified **or** honest “not verified” | Claim “shipped” on push alone |

### Ship honesty + support email (owner-locked)

| Rule | Law |
|------|-----|
| **Push ≠ shipped** | Commit/push alone is **not** a ship claim. |
| **Ship claim** | Only after owner path works **or** agent states **not verified live** with exact gap. |
| **If claimed shipped and still broken** | Agent **must** write `support/ESCALATION-YYYYMMDD-*.md` **and email owner support** (`notisastranov@gmail.com`) with: what was claimed, what failed, build stamp, files, next fix. |
| **Spec up owner progress** | When owner verifies or re-locks law, **update this SPECS** same day (this section + conflicting rows). |

```text
node scripts/owner-push.mjs <files> --message=...
```

---

## P6 — Agent discipline

1. Owner changes intent / verifies progress → **update this SPECS same session** (+ continuity).  
2. **Spartan first** — cut before you add.  
3. Implement; don’t babysit.  
4. Never ship unverified; fail closed on red probe.  
5. Do not reintroduce AVC, dual docks, CLI button bar, training sim, thin contaminated stacks.  
6. **Email support on false ship** — see Ship honesty above.  
7. **Do not force owner to restate** locked rows in this file.

---

## Owner-verified progress log · 2026-07-30

*Entries below are **owner-locked** from live session feedback. Agents must not regress them.*

| ID | Owner verification | Law |
|----|-------------------|-----|
| OV-01 | Default view wrong when city/Rodos | Boot **GLOBAL Earth in space** · city closed |
| OV-02 | Training surface / sim task banned | **No** Rodos training default · **no** sim-task train stack |
| OV-03 | Layers button under money HUD | **No** map-corner Layers button |
| OV-04 | CLI polluted with buttons / tile chips | CLI **text only** · multi-tile **on map** |
| OV-05 | Home said SpaceNet | Home wordmark **ASTRANOV** only |
| OV-06 | AI answered as SpaceNet | AI brand **Astranov** · **ASTRANOV LISTENING** |
| OV-07 | “Is Grok there?” → junk (“climb”) | Hard identity intents · no garbage fuzzy |
| OV-08 | Login shows supabase project | Login identity **astranov.eu** only (GIS + custom domain) |
| OV-09 | Splash SpaceNet + wrong loader | Splash **ASTRANOV** + horizontal blue glow bar |
| OV-10 | Globe spins like a clock | Spin on **real polar axis** (Y) · tilt X only |
| OV-11 | Speed / first order / mesh | Fast shell boot · `first delivery` · SETI-style `donate on` |
| OV-12 | Ship claims false | **Email support** + escalation file when claim ≠ live |

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
- Ship without radar + S + resources/mine + **text CLI**  
- Boot into city map · Rodos training default · block boot with crawl  
- Put **button tiles** or **ribbon button flood** inside CLI  
- AI brand as SpaceNet / Grok when owner locked **Astranov**  
- Google login showing **supabase project host** as the product  
- Claim “shipped” without live path or support email on failure  
- Impose **marketplace curfew** or closed calendar (violates **P4-M** 24/7/365 all locations)  
- AVC / coins / 1:1 EUR as product money  
- Low-fi companion figure before AI graphics > high-end games  
- Micro-patch over a broken series of specs — **rebuild**  
- Load legacy monoliths on live  
- Make owner restate P1-C multi-body law  

---

*Spartan code. Go anywhere = real body globe + land + crawl. SNGlobe · SNCosmos. S is the value. Brand: ASTRANOV. CLI is text. Push is not ship.*
