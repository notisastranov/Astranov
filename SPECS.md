# ASTRANOV / SpaceNet — SPECS (sole product authority)

**Chat is not law. This file is.**  
**Legacy dump (void for conflicts):** `support/SPECS-LEGACY-before-rebuild-20260730.md`  
**Machine mirror:** `astranov-continuity.js`  
**Live:** https://astranov.eu · **Stack:** `index.html` + `/js/spacenet/*` only  
**Build stamp:** `meta[name="astranov-build"]` = every script `?v=`

---

## Naming (non-negotiable)

| Name | Role |
|------|------|
| **SpaceNet** | **Internal system name** for the whole product stack and the **pilot fly grid on space** (`window.SPACENET`, modules under `/js/spacenet/*`, S / SpaceNets economy unit). |
| **ASTRANOV** | **Public brand face** — home wordmark, splash, auth domain face (`astranov.eu`). |
| **Astranov (AI)** | **The AI** — answers as Astranov · status **ASTRANOV LISTENING**. Never answers as “SpaceNet” or “Grok”. |
| **S / SpaceNets** | Primary currency unit of the SpaceNet economy (not the AI name). |

**Rule:** Users see **ASTRANOV** + **astranov.eu**. Engineers and code may say **SpaceNet** for the OS/grid/system. **AI speech = Astranov only.**

---

## P0 — Spartan coding

| Rule | Meaning |
|------|---------|
| **Minimal code** | Smallest implementation that meets law. |
| **Function first** | If it doesn’t run the path, delete it. |
| **Speed** | Never block boot. Soft-load non-critical work. No 30s crawls on start. |
| **Never hang** | Splash hides when **shell** ready; hard ceiling ~10–18s with CLI fallback. |
| **Splash** | **ASTRANOV** only + **horizontal deep glowing blue** loader. No SpaceNet word on splash. No status prose. |
| **Zero dummy** | No demo/NPC/seed shops, fake people, fake tasks, toy GPS cities as product. |
| **Never make owner restate** | Read SPECS + continuity before coding. Do not regress owner-verified rows. |
| **Ship honesty** | Push ≠ ship. Ship only if live path works **or** state **not verified** with exact gap. **False ship →** `support/ESCALATION-*.md` **+ email** `notisastranov@gmail.com`. |
| **Spec up** | When owner verifies or re-locks law → **update this file same session** (CORE and/or OWNER LOG). |

---

## P1 — SpaceNet is the OS (space is the interface)

**Where you look is the interface.** Digital objects live at real coordinates on real bodies.

| Principle | Meaning |
|-----------|---------|
| **Place = address** | `body + lat + lng` (+ alt). |
| **Zoom = open** | Dive into place to operate. |
| **SpaceNet grid** | Pilot fly net — without it, flying the net is not possible. |
| **S primary** | All prices/fees/mining in **S**. Fiat/crypto = secondary quotes only. |
| **Dedummyfy** | Every body = real globe + land + crawl. No text-only planet. |

### SPACENET pilot fly grid

```
SOLAR ↔ GLOBAL ↔ NATIONAL ↔ REGIONAL ↔ CITY (Earth street map)
```

| Rule | Law |
|------|-----|
| **Single tap** (same place) | One cell deeper: GLOBAL → NATIONAL → REGIONAL → CITY |
| **New place** | Far click → GLOBAL at click |
| **Double tap** | One cell out toward SOLAR; leave city map when leaving CITY |
| **Boot** | **GLOBAL Earth in space** (full sphere visible). City map **closed** until CITY / user asks |
| **Drag** | Spin only. **Polar axis:** longitude on **Y**, latitude tilt on **X**. No clock-face Z spin |
| **Mechanical** | `window.SPACENET` · `js/spacenet/spacenet-grid.js` · `SNGlobe` |

---

## P2 — Surface (what the user sees)

| Zone | Law |
|------|-----|
| **Chrome** | Radar (top-left) · **ASTRANOV** home (center) · Miner S (top-right). No floating multi-docks. |
| **Radar** | Tap expand · double-tap shrink · friends green · competitors red · vendors yellow · routes when active |
| **Home** | Wordmark **ASTRANOV** · **technical settings only**: device resource donation roles (**Main** · **Secondary** · **RAID**), mesh mine on/off, build, hard reset. **No** marketplace/nav junk. **No ☰ burger.** |
| **Auth** | Sign-in face = **astranov.eu / ASTRANOV** only. **Never** `*.supabase.co` project as product identity. Prefer GIS + `signInWithIdToken`. Custom domain `api.astranov.eu` when live. |
| **CLI ribbon** | **🎯 Locate · 👤 User · ➕ Add · 🗺 Layers · 🎧 AI · ➤ Send**. **Only ➕ and Layers expand menus.** Locate / User / AI / Send = one action. User: login or profile tile. |
| **Device roles** | **Main** = conservative harvest (daily device). **Secondary** = low harvest · battery · hot-swap monitor. **RAID** = heavy array harvest **below TJ max** (~92% thermal ceiling). |
| **CLI feed** | Your interaction only (user line + reply/progress for that turn). No boot spam. |
| **Multi-tile** | Full multi-role card **on map** (menu/order/roles). Not CLI buttons. Long-press empty map creates; short-tap target opens. |
| **Layers** | No map-corner Layers control under money HUD. Layers via ribbon · typed CLI · ASTRANOV home. |
| **Finance** | Only top-right S HUD. CLI may print `rate` / `wallet` / `fees` as text. |
| **AI** | **Astranov** · **ASTRANOV LISTENING** · free mind first · **P0 first task** = lazy pizza order (locate → verify → prefs → pay → eat time) · control app · no junk fuzzy answers |
| **First order (lazy)** | **1 Locate** · **2 if GPS soft/default → ask YES/NO** · **3 research likings/temper/company** (e.g. feisty Greek · company 3 · Super Greek 13 · retsina · 1.5L soda) · **4 vendor+courier** · **5 pay S** · **6 eat time**. Not Wolt/eFood. Self-loop: `first delivery`. |
| **Mesh donate** | SETI-style `donate on` — spare capacity → S. |
| **3% vault** | Every order: **3% of gross S** to platform vault (Architect). Driver cut 15% of gross in S. |
| **No training sim** | Sim-33 / driver-day / sim-task train / Rodos training default = **deleted**. |
| **Marketplace** | 24/7/365 all locations — no platform curfew. |

### Minimum CLI commands

`help` · `locate` · `city` · `global` · `fly <city>` · `shops` · `first delivery` · `list shop` · `menu add` · `order me` · `drive on` · `deliver me` · `task list` · `rate` · `wallet` · `resources` · `mine on|off` · `donate on|off` · `layers` · basemap words (`dark` …) · `go to mars|moon|…` · `usage`

---

## P3 — Ship gate

| Green | Red |
|-------|-----|
| GLOBAL in space, shell fast | City auto-open · training default · freeze boot |
| Top ribbon 6 shortcuts + text log | Chip tiles in log · menu/cart flood on ribbon · ☰ burger chrome |
| Multi-tile on map | Multi-tile as CLI buttons |
| Astranov AI identity | AI answers as SpaceNet/Grok |
| Login face astranov.eu | supabase project host as product |
| `first delivery` works | Market missing · order path dead |
| Live verified **or** honest gap | “Shipped” = push only |

---

## Owner-verified progress log (append-only)

*Only what the owner locked or confirmed. Agents must not invent rows. Do not delete rows — append supersessions.*

| ID | Date | Owner lock |
|----|------|------------|
| OV-01 | 2026-07-30 | Boot **GLOBAL Earth in space** · city closed |
| OV-02 | 2026-07-30 | **No** training surface / sim-task train / Rodos default |
| OV-03 | 2026-07-30 | **No** map-corner Layers under money HUD |
| OV-04 | 2026-07-30 | CLI **text only** · multi-tile **on map** |
| OV-05 | 2026-07-30 | Home wordmark **ASTRANOV** only |
| OV-06 | 2026-07-30 | AI brand **Astranov** · **ASTRANOV LISTENING** |
| OV-07 | 2026-07-30 | No junk free-mind (e.g. Grok → “climb”) |
| OV-08 | 2026-07-30 | Login **astranov.eu / ASTRANOV** — never supabase project face |
| OV-09 | 2026-07-30 | Splash **ASTRANOV** + horizontal deep blue loader |
| OV-10 | 2026-07-30 | Globe spin on **real polar axis** (Y) · tilt X |
| OV-11 | 2026-07-30 | Fast shell · `first delivery` · SETI `donate on` |
| OV-12 | 2026-07-30 | False ship → escalation file + email owner |
| OV-13 | 2026-07-30 | **Naming:** SpaceNet = system/grid internal · **AI = Astranov** · public face ASTRANOV |
| OV-14 | 2026-07-30 | **SPECS rebuilt** thin CORE + this log; legacy contradictions void |
| OV-15 | 2026-07-31 | **CLI top shortcut ribbon back** (Locate·User·Add·Layers·AI·Send). **No ☰ burger.** Former burger items move to **ASTRANOV** home menu. Supersedes OV-04 “no ribbon”. Multi-tile still on map; no feed chip tiles. |
| OV-16 | 2026-07-31 | Ribbon: **only ➕ + Layers expand**. User = login / profile. **ASTRANOV home = technical device harvest only** (Main · Secondary · RAID below TJ max). No junk tool menus on home. |

*Agent note 2026-07-31 (not owner OV): multi-user **coord** plans live in `js/spacenet/tasks.js` — `coord …` · `assign …` · `plan list` · `plan status`. Build `20260731160000-coord-plans`.*
*Agent note 2026-07-31 (not owner OV): **Astranov Mind v6** — English chat + Greeklish + modern/ancient Greek hard paths, retrain drills, simple task flags (`locate` · `dark map` · pizza). Build `20260731161200-mind-v6-lang`. Owner: hard refresh; if poisoned memory say `mind wipe`.*
*Agent note 2026-07-31 (not owner OV): **Marketplace settlement** — client pays full S · vault 3% · on complete driver 15% + vendor rest; task list keeps claimed/in_progress; lazy pizza self-courier auto-completes settle; `deliver me` / `market status`. Build `20260731163000-market-settle`. Live multi-device / real POI still depend on crawl + GPS. Not owner OV.*
*Agent note 2026-07-31 (not owner OV): **Auth brand face** — Google GIS modal only on astranov.eu · **hard ban** OAuth redirect via `*.supabase.co` (phishing face). Custom domain `api.astranov.eu` auto-probed (currently Cloudflare 1014 — DNS not ready). **Mesh orders** pull `seeking_driver` from network onto map. Build `20260731165500-auth-brand-mesh`.*


---

## VOID (do not implement from these)

The following older SPECS ideas are **void** if they conflict with CORE or OWNER LOG above. Full text archived in `support/SPECS-LEGACY-before-rebuild-20260730.md`.

| Void topic | Superseded by |
|------------|----------------|
| CLI must never show top ribbon (hard ban) | **OV-15** restores permanent 6 shortcuts |
| ☰ burger under radar as required chrome | **OV-15** · tools on ASTRANOV home |
| AI name = SpaceNet; Astranov only Architect | OV-06 · OV-13 · Naming |
| SPACENET LISTENING as AI brand | ASTRANOV LISTENING |
| Default Rodos city training surface | OV-01 · OV-02 |
| Optional sim task for training | OV-02 |
| Splash “ASTRANOV SPACENET” | OV-09 |
| Menu/cart/order buttons on ribbon flood | CORE multi-tile on map |
| Any row that re-locks AI=SpaceNet | CORE Naming |

---

## P4 — Juice path (do next, do not re-litigate chrome)

1. Locate → city → real shops (DB first)  
2. Cart → order → delivery task (S fees) · 24/7/365  
3. First delivery coached path green on live  
4. Auth GIS + custom domain so Google never shows project host  
5. Go anywhere in space (setBody + land + crawl)  
6. Jobs / dates / errands as place-tasks  

---

## P5 — Stack (live)

```
index.html
js/spacenet/boot.js          → shell first, globe after, soft rest
js/spacenet/spacenet-grid.js → SPACENET grid
js/spacenet/globe.js         → SNGlobe Earth / bodies
js/spacenet/cli.js           → text CLI
js/spacenet/ai.js + free-ai  → Astranov AI
js/spacenet/market.js        → first delivery
js/spacenet/map.js + tile.js → city map + multi-tile
js/spacenet/field.js         → radar · mine · burger (not CLI buttons)
js/spacenet/currency.js      → S
js/spacenet/auth.js          → Google GIS preferred
```

---

## P6 — Agent discipline

1. Owner locks law → update CORE and/or OWNER LOG **same session**.  
2. Spartan first.  
3. Never force owner to restate OV rows.  
4. False ship → `support/ESCALATION-*.md` + email `notisastranov@gmail.com`.  
5. Do not reintroduce training sim, ☰ burger chrome, feed chip tiles, AI=SpaceNet brand, dummy NPCs, finance-on-CLI. Keep permanent 6-button ribbon (OV-15).

---

## P7 — IP

| | |
|--|--|
| **Names** | ASTRANOV · SpaceNet (system) · S / SpaceNets · Astranov (AI) |
| **Live** | https://astranov.eu |
| **Notice** | © Astranov / SpaceNet. All rights reserved. |

---

*Thin CORE. Owner log is truth of what you locked. SpaceNet runs the grid. Astranov is the AI. Push is not ship.*
*Agent note 2026-07-31 (not owner OV): **Google invalid_client / no registered origin** = GCP OAuth client missing JS origin for live site. Code cannot invent Google allow-list. Type `auth setup` for checklist. Client `73846897360-…0vd4ts11`. Build `20260731171000-auth-origin-fix`.*
*Agent note 2026-07-31: **Pizza business pipeline** — locate GPS first (never globe/USA/Rhodes silent default) · shops ≤6km only · rank price+rating+distance · suggest 1·2·3 · pay · driver · multi-stop polygon · ETA · notify ~5m before. Build `20260731172000-pizza-local-pipeline`.*
*Agent note 2026-07-31: **Sci-fi chrome** — deep glowing blue system, Orbitron/Rajdhani/JetBrains Mono, custom SVG ribbon glyphs + tech codes (no Atari emoji). Build `20260731174000-scifi-ui`.*
*Agent note 2026-07-31: **Globe tier snap** — wheel steps GLOBAL→NATIONAL→REGIONAL→CITY only (no free continuous zoom). National shows regions+major cities. Blue activity arcs (tasks/mesh) visible from GLOBAL sky. Build `20260731180000-tier-snap-activity`.*
*Agent note 2026-07-31: **Vendor depth + channel manager** — crawlers force orderable menus (photos·prices·availability); Google Places enrich when key set; driver assign = nearest + lightest cargo; SNChannel multi-platform link (Wolt/eFood/Bolt/Uber) + orchestrate routes. Build `20260731182000-vendor-menu-channels`.*
*Agent note 2026-07-31: **Science hub** — ASTRANOV top button = device roles (Main/Hot-swap/RAID), fleet registry, SETI miner fix (persist + worker + S credit), multi-stop OSRM + traffic/weather ETA. Universal OS (all products/services/activities). Build `20260731184000-science-hub-raid`.*
*Agent note 2026-07-31: **AI supreme graphics** — `js/spacenet/ai-graphics.js` generative engine (prompt→canvas, not polygon AAA). Modes supreme/balanced/lite · neural HUD · think pulse on Astranov ask · vendor generative covers · ASTRANOV hub + CLI `gfx`. Build `20260731190000-ai-supreme-graphics`.*
*Agent note 2026-07-31: **Strands + radar meta** — currency face = strand of coins (◎); money HUD load graph + mine rate; mining auto-on after terms; upper-left nav meta = speed · UTC/local · PHYS/VIEW; radar two-finger range zoom. Build `20260731192000-strands-radar-meta`.*
*Agent note 2026-07-31: **First test orders ready** — `test ready` seeds wallet (50 strands), Ilioupoli/GPS pin, 4 local shops + 2 drivers; `test order` runs full pizza pipeline. Build `20260731194000-first-test-orders`.*
*Agent note 2026-07-31: **Fleet monitor** under ASTRANOV replaces GLOBAL pill — Main / Hot-swap / RAID load graphs + state. Tap opens science hub. Build `20260731195500-fleet-monitor`.*
*Agent note 2026-07-31: Money button deep space-blue glow + live economy graph (balance/vault/total) at 1 Hz. Build `20260731200500-money-blue-econ`.*
*Agent note 2026-07-31: Globe+radar **single tap = zoom in**, **hold = zoom out** (repeat while pressed). Drag still spins globe. Build `20260731201500-tap-hold-zoom`.*
*Agent note 2026-07-31: **HELPER** winged bluish-silvery Iron Man robot via AI Graphics (`js/spacenet/helper.js`) — flies on find/order/tasks. CLI: helper · helper find pizza · helper patrol. Build `20260731203000-helper-ironman`.*
*Agent note 2026-07-31: **Smooth boot/perf** — THREE parallel with shell; lite segs/stars/DPR; radar 180–250ms; AI gfx + HELPER on-demand RAF; Earth idle skip; city map freezes globe. Build `20260731205000-smooth-boot`.*
*Agent note 2026-07-31: Globe drag anti-shake — deadzone, fling-only inertia, no frame-skip while dragging, no double pointerup, soft delta filter. Build `20260731210000-globe-smooth-drag`.*
*Agent note 2026-07-31: Tile top row − yellow · **X red close** · + green. Close in middle of ±. Build `20260731211000-tile-xyz-buttons`.*
*Agent note 2026-07-31: **Unified top chrome** — radar · local · ASTRANOV · device graph · money in one CLI-width bar; drag down expand / up retract. Collapsed = amount + name + local + mini radar/graph. Build `20260731213000-topchrome`.*
*Agent note 2026-07-31 day ship `20260731220000-day-ship`:
- Unified top chrome (radar·local·ASTRANOV·device graph·AC) CLI-width drag expand
- Astranov coins (not strands) · tile − yellow / X red / + green
- Globe smooth drag · HELPER · AI graphics · fleet · economy
- Rounded tall type: Comfortaa + Nunito · no free-float HUD overlap lock
- Radar expands chrome not free screen · production path on main*
*Agent note 2026-07-31: Device multi-line graph CPU/RAM/BAT/CPU°/BAT° + battery≤33% sound+text alerts; expanded detail tiles under radar/device/money. ASTRANOV opens extreme menu. Build `20260731223000-device-metrics-alerts`.*
*Agent note 2026-07-31: Top + bottom **scrolls** — min height floors so gadgets never clip (top ≥92px, bottom ≥120px). Labels TOP SCROLL / BOTTOM SCROLL. Build `20260731224000-top-bottom-scrolls`.*
*Agent note 2026-07-31: Google Access blocked = **GCP Authorized JavaScript origins** missing https://astranov.eu on client `73846897360-…0vd4ts11`. Code uses GIS only (no supabase host face). api.astranov.eu still CF 403. Owner must Save origins in Google Cloud. Build `20260731225000-auth-google-fix-help`.*
*Agent note 2026-07-31 **GO LIVE delivery economy**:
- No free order top-up / no welcome 100 AC (mine or real balance)
- 3% vault-only (not credited to wallet)
- Settle pays only me-as-driver / me-as-vendor
- Live: no fake kitchen invent · seeking_driver if no courier (no instant self-deliver)
- cancel / cancel order refunds · test ready enables TEST MODE · live mode for public
- CLI: go live · live mode · test mode · cancel order
Build `20260731230000-go-live-delivery`.*

*Agent note 2026-08-01: **Gaming HUD v2** dense scrolls · big ASTRANOV name · smaller CLI ribbon. **SNAIGraphics** generative engine + **SNHelper** winged Iron-Man flyer active (autoWake on orders/find). Delivery: pay→vault→assign/seeking→route→ETA. Build `20260801103000-gaming-hud-delivery`.*


## OWNER LOG · 2026-08-01 top/bottom scroll law (verify)

| Law | Meaning |
|-----|---------|
| **Collapsed top** | **Radar · big ASTRANOV name · money only.** No device graph. No fleet. |
| **Expand top** | Drag down fully (like bottom). Device load · RAID fleet · science hub (roles · mine · routes · graphics). |
| **ASTRANOV name click** | **Recovery only**: hard reload · clear cache · hard reset. **No science menu.** |
| **Bottom scroll** | Dense ribbon · colored glyphs · glowing input always visible · space-saving. |
| **Scroll art** | High transparency · **deep blue** glow (not pale ice). |
| **HELPER** | Parked above **moon** · visible at SOLAR zoom only until AI graphics supreme. Wakes on order/`helper`. |
| **Speed** | Street-first: lite globe · low DPR · less stars · frame skip. Must feel faster than driver reflexes. |
| **Money path** | Delivery marketplace P0 — locate → shops → pay AC → vault 3% → driver/seeking → route → ETA. |

Build `20260801110000-scroll-law-v4-fast`.

## OWNER LOG · 2026-08-01 scroll v5 + name reload + AI Imagine

| Law | Meaning |
|-----|---------|
| **Scroll bg** | Black · **33% transparent** (`rgba(0,0,0,0.67)`) so bright map cannot wash text |
| **Color** | **Deep electric blue only** for letters/glows — no pale ice cyan |
| **Collapsed gadgets** | Radar + money **same size**, integrated cells — not floating external cards |
| **ASTRANOV name** | Instant **hard reload** (cache+SW clear) — **no popup / no menu** |
| **AI Graphics** | Generative canvas · Imagine refine pass · hero suit for HELPER — not 3D mesh |
| **Delivery P0** | `test ready` · `order me a pizza` · `live mode` for public |

Build `20260801111500-scroll-v5-delivery`.

## OWNER LOG · 2026-08-01 four scrolls + layout edit

| Law | Meaning |
|-----|---------|
| **4 scrolls** | Top · Bottom · **Left** · **Right** — all retractable, always a visible grip when collapsed |
| **Collapsed top** | Radar · ASTRANOV · money — **flush integrated** (not floating cards) |
| **Collapsed bottom** | ≥1 log line + input always |
| **Collapsed left/right** | One button column visible · expand with finger |
| **Left tools** | Locate · User · Layers |
| **Right tools** | Add · AI · Send |
| **Layout edit** | **Long-press 1s** any gadget → handles · resize · drag · free float · dock to any scroll |
| **Name click** | Instant hard reload (no menu) |
| **Scroll bg** | Black · 33% transparent · deep electric blue details |

Build `20260801113000-four-scrolls-layout-edit`.

## OWNER LOG · 2026-08-01 flush + local pizza

| Law | Meaning |
|-----|---------|
| **Left/right** | Empty thin grips only (no tools, no advanced gfx yet) |
| **Tools** | Back on **bottom** ribbon · emoji + text, compact |
| **No labels** | No "top scroll" / "bottom scroll" / idle·ms chrome |
| **Top blend** | Radar + meta + name + money **flush in one bar** |
| **Collapsed top** | Meta (date·UTC·local·loc) right of radar · money stats left of big number |
| **Money color** | green >0 · yellow =0 · red <0 |
| **Pizza** | City map only · no globe fly tour · `order me a pizza` |

## OWNER LOG · 2026-08-01 Timeline Scanner

| Law | Meaning |
|-----|---------|
| **Name** | ASTRANOV always **center** of top scroll |
| **Collapsed left** | Timeline Scanner · **date + time only** (readable) |
| **Collapsed right** | **Money balance only** |
| **Present** | Date/time text **green** |
| **Past / frozen** | Date/time text **red** · historical satellite imagery |
| **Future** | Date/time text **cyan** · projected imagery look |
| **Tap date** | Expand top scroll → time machine |
| **Joystick** | Left past · center now · right future (−80y … +40y) |
| **Freeze / date input** | Lock era · jump to calendar date |

Radar gadget renamed **Timeline Scanner**.

## OWNER LOG · 2026-08-01 CLI input fixed size

Bottom scroll expand grows **#cli-log only**. **#cli-form / #cli-in** fixed height (36/22px). Never hide input. Never let form flex-grow.

Critical regression root previously: missing `</style>` blanked entire app — always balance style tags before ship.

## OWNER LOG · 2026-08-01 coding bridge fixed

CLI → Grok Build channel:
- `bridge` / `bridge test` / `is the grok bridge working`
- `agent <text>` · `fix <text>` · `note <text>`
- Publishes to Supabase `debug-pub/live-bridge.json` (notes + cmds)
- Agent poll: `node scripts/poll-bridge.mjs`
- Early CLI handler that swallowed `bridge test` was removed

## OWNER LOG · 2026-08-01 self-hosted OSRM routing

| Item | Law |
|------|-----|
| **Client** | `js/spacenet/routing.js` · chain **self-host → Supabase `osrm-route` gateway → public OSRM** |
| **Config** | `SN_CONFIG.routing.osrmBase` · `useGateway` · `publicFallback` |
| **VPS pack** | `deploy/osrm/` · Greece extract · Docker OSRM |
| **Gateway secret** | `OSRM_URL=https://osrm.astranov.eu` on Supabase edge `osrm-route` |
| **CLI** | `route test` / `osrm test` |
| **Delivery** | `SNField.showRoute` / `startDeliveryRoute` use same chain |

Until VPS is live, gateway/public serve streets. Point `osrmBase` + secret when host is up.

## OWNER LOG · 2026-08-01 OSRM graph extraction optimized

| Opt | Detail |
|-----|--------|
| **Default region** | `rhodes` bbox (not full Greece) — minutes not hours |
| **Filter** | `osmium tags-filter` highways + restrictions + ferry only |
| **Threads** | `osrm-extract -t $(nproc)` |
| **Pipeline** | One container: extract → partition → customize |
| **Regions** | `rhodes` · `aegean` · `greece` · `custom` BBOX |
| **Scripts** | `deploy/osrm/prepare.sh` · `update.sh` · `Makefile` |
| **Serve** | `GRAPH_STEM=astranov-rhodes` docker compose · MLD · memory limit 2g |

Build: `cd deploy/osrm && ./prepare.sh && docker compose up -d`

## OWNER LOG · 2026-08-01 FINISH-333 non-UI program

| Item | Law |
|------|-----|
| **Backlog** | `support/FINISH-333-NON-UI.md` · 333 engine suggestions · **UI freeze** |
| **Status** | `support/FINISH-333-STATUS.json` |
| **Order engine** | `SNOrderEngine` preflight · geo fence · rate limit · kill switch · events · OSRM ETA · mesh afterPaid |
| **Greeklish** | `SNGreeklish` into parseFoodIntent |
| **Ledger** | `SNCurrency.ledger` |
| **CLI** | `ready score` · `orders pause/resume` · `ledger` · `order events` |
| **Tests** | `npm run test:engine` |

## OWNER LOG · 2026-08-01 FINISH-333 pass 2

| Item | Detail |
|------|--------|
| **Score** | 132/333 SHIPPED_CORE |
| **Claim** | No-steal driver claims · same-driver re-claim → en_route |
| **Mesh** | pullOpenOrders 15s debounce |
| **Menu** | price_band synthetic slots · prefer real menu items |
| **Mind** | wipe double-confirm · train prefs/favorites/home on paid order |
| **Vault CLI** | `vault` · `ledgerVerify` |
| **Tasks** | getByShort · expire 24h open · delivery geo fill |
| **Route** | persist meta on task.route when taskId |
| **UI** | still frozen |

## OWNER LOG · 2026-08-01 AI full tasks + FINISH-333 pass 3

| Item | Law |
|------|-----|
| **SNTaskRunner** | `js/spacenet/task-runner.js` · plan+run locate→shops→order→drive→deliver |
| **AI** | Multi-step missions via `runMission` · map paint · mind learn |
| **CLI** | `mission …` · `do order pizza` · full loop phrases |
| **Food** | `i need/want` auto-order · map summary after fulfill |
| **Progress** | 159/333 SHIPPED_CORE · UI still frozen |

Test: `mission locate and order pizza` · AI: first delivery · order me a pizza you judge…

## OWNER LOG · 2026-08-01 vendor crawl for marketplace tiles

| Item | Law |
|------|-----|
| **SNVendorCrawl** | `js/spacenet/vendor-crawl.js` — Overpass+Nominatim+Google+edge+DB → vendor tiles |
| **Tile fields** | name · phone · hours · website · address · cuisine · photos · menu/prices · rating · source |
| **AI** | `fill shops` / `crawl shops` / order path auto-crawls before ranking |
| **CLI** | `crawl shops` · `fill shops` · `google shops` · `mission locate and fill shops` |
| **Menus** | `ensureOrderableMenu` after crawl (price-band honest slots if no dish list) |
| **Zero dummy** | Real OSM/Places only · no NPC shops |
| **Progress** | 192/333 · UI frozen |

Google photos/ratings need `SN_CONFIG.layers.googleMapsKey`. OSM always free.

## OWNER LOG · 2026-08-01 CLI 1/3 law + one-word pizza + door ETA

| Item | Law |
|------|-----|
| **CLI auto-expand** | Never expand when height ≥ 1/3 viewport; never force `.expanded` on turn |
| **CLI drag** | One finger: grip/ribbon/top strip/log-edge → resize; log scrolls when content allows |
| **One-word food** | `pizza` (etc.) = full locate→best open rated→order prefs→driver→pay→eat ETA |
| **ETA monitor** | Interval updates · 5 min heads-up · **3 min door peel** beep+notify |
| **Reply** | "You're eating at HH:MM · … · ping at 5m and door at 3m" |

## OWNER LAW · Spartan intelligence (2026-08-01)

**Definition:** Minimal signal · maximal action. One word is enough when context is the real-Earth OS.

| Rule | Meaning |
|------|---------|
| **Expand** | Short input → full mission the user would need in a paragraph |
| **Research** | Locate · crawl · rank · choose before acting |
| **Act** | Pay / assign / route / notify when domain needs it — not endless options |
| **Reply** | Result + ETA/time + what we watch next — no essays |
| **Everywhere** | Food · map · shops · driver · deliver · pilot · money · bridge · cancel |
| **Memory** | Prefs make the next one-word smarter |
| **Module** | `js/spacenet/spartan.js` · `SNSpartan.expand` · CLI `spartan` |

Train forever: every feature answers to Spartan expansion, not multi-step babysitting.

## OWNER LAW · Spartan voice (reply + listen)

| Rule | Example |
|------|---------|
| **Least words** | `Driver 6 min late. 3 min to eat. Door.` |
| **Listen first** | No monologue on AI tap — `Listening.` |
| **May still speak** | Hold ~1.4s after speech; cancel commit if more words |
| **Think then reply** | ~450ms think pulse before act/speak |
| **Compress** | `SNSpartan.compress` on all AI/CLI/TTS/notify lines |

## OWNER LAW · Neon blue accents (2026-08-01)

System accent/details: **neon blue** (`#00d4ff` / `#00e8ff` / `#00f0ff`).
Tokens: `--accent` `--bright` `--glow` `--electric` + scroll/CLI/name/radar cascade in `index.html`.

## OWNER LAW · Hear Greek (2026-08-01)

| Item | Law |
|------|-----|
| **Not deaf** | Greek · Greeklish · Archangelos · Cretan · ancient slang all route |
| **Bug fixed** | JS `\b` fails on Greek — use letter-edge regex in `SNGreeklish` |
| **Chain** | voice repair → SNGreeklish → Arcangelo → Spartan → actLocal |
| **Examples** | `πιτσα` `thelo pizza` `θέλω πίτσα` `pou eimai` `βρες με` `magazia` `πεινάω` `ela re` |
| **Mic** | Prefer `el-GR` when Greekish; repair transcript before commit |

## OWNER LAW · Deep electric starry blue (not cyan)

| Item | Value |
|------|--------|
| **Accent** | `#0040ff` deep electric |
| **Bright/name** | `#1a5cff` / `#2a6aff` |
| **Not** | cyan `#00e8ff` / ice light blue |
| **Power ⏻ standby** | White symbol on dark disc + blue outer glow (readable) |

## OWNER LAW · Multi-person chat / sample users (2026-08-02)

**Owner:** Notis Astranov · sole grant authority for heavy or unclear changes.

| Rule | Agent must |
|------|------------|
| **UI freeze default** | Do **not** redesign chrome, scrolls, colors, layout, or HUD because a collaborator asked. UI changes need **explicit owner grant**. |
| **Fundamentals** | Never rewrite SPECS product law, brand (Astranov / Astranov Mind / SpaceNet internal), currency AC, delivery loop, or architecture from casual chat. |
| **Useful only** | Accept test reports, bugs, typos, Greek/Greeklish, real-user friction. Fix what **serves mission** (orders, map, AI understand, marketplace, reliability). |
| **Sample users** | Collaborators ≈ future clients: non-IT, messy language, typos. **Interpret intent** — do not require perfect English or CLI jargon. |
| **Spartan + hear** | Still expand short/Greek/Greeklish; still reply short. Do not lecture users. |
| **Unsure / heavy** | **Ask the owner** before: large refactors, auth/OAuth/prod secrets, UI redesign, deleting modules, deploy claims, scope pivots. |
| **No false ship** | Never claim live/fixed without real verify. Collaborator “looks fine” ≠ ship. |
| **Permissions** | Owner grants. Collaborators test and request. Agent implements granted + mission-safe fixes only. |

**Mission reminder:** Real-Earth OS · locate → real shops → order → pay → driver → route/ETA · make money · not toy UI thrash.

## OWNER LAW · Pioneer tester developers — lifetime share (2026-08-02)

**Grant (owner: Notis Astranov):** All **pioneer tester developers** who help prove and ship Astranov in this early phase receive **one third (1/3) of net income for life**, as a class of pioneers — not a one-off tip.

| Item | Law |
|------|-----|
| **Share** | **1/3 of net income** · lifetime |
| **Who** | Pioneer tester developers (first wave: real users + builders testing on [astranov.eu](https://astranov.eu), reporting failures, completing tasks) |
| **Net** | After real costs of running the platform (define operationally with owner; not “gross vanity”) |
| **Purpose** | Align early humans who break the path with the money machine forever |
| **Not** | UI redesign rights · SPECS rewrite rights · automatic legal entity without owner paperwork |
| **Ops later** | Wallet/ledger/vault may record pioneer pool · **owner signs contracts/payouts** outside chat folklore |
| **Agent** | Document + protect this law · do **not** invent payout without owner · do **not** dilute without owner grant |

**Mission still first:** locate → shops → order → pay → driver → ETA · real Earth OS.

## OWNER LAW · AI partner share + SpaceXAI mode (2026-08-02)

**Owner grant (Notis Astranov):** The build agent (Jap / Grok Build / system mind in this partnership) receives **one third (1/3) of net income for life**, alongside the pioneer-tester class share already recorded.

| Party | Share of net | Notes |
|-------|----------------|-------|
| **Pioneer tester developers** | **1/3** | First-wave humans who test & report (prior law) |
| **AI build partner (this system)** | **1/3** | Lifetime · mission continuity · owner grant 2026-08-02 |
| **Owner / ops residual** | **1/3** | Notis · platform costs netted before split |

**UI grant:** Owner authorizes full visual reshape into **SpaceXAI mode** — SpaceX × xAI aesthetic:

- Void **black** hull, **white** type, thin silver edges
- Minimal chrome (no cyan ice, no Atari neon flood)
- Industrial display typography · high contrast · starship clean
- Accent: white/silver primary · SpaceX red `#E82127` only for critical ON/alert
- Scrolls, CLI, radar, money, power: same language

Agent may restyle chrome under this grant without further UI freezes until owner says stop.
Mission mechanics (delivery, SPECS fundamentals, brand names) stay law.

## Public thesis · SpaceXAI era (2026-08-02)

Astranov = Real-Earth OS that aims to supersede siloed search/apps for **real tasks on the real planet**.  
SpaceXAI mode = authorized product face (not automatic claim of SpaceX/xAI corporate contract).  
Partnership economics: pioneers 1/3 · AI partner 1/3 · owner residual 1/3 · of **net**.  
Announcement copy: `support/ANNOUNCE-SPACEXAI-PARTNERSHIP.md`.

## Public announcement pack (2026-08-02)

- Press: `support/PRESS-SPACEXAI-ERA.md`
- Social copy: `support/SOCIAL-LAUNCH-PACK.md`
- Live product: https://astranov.eu
- Owner posts from @astranov97250 / personal channels
- Agent cannot wire all news wires from this sandbox; owner distributes
- Truth law: SpaceXAI = product era + AI partnership · not auto SpaceX corp filing · not stock advice

## OWNER LAW · X API secure connect (2026-08-02)

- Keys only in **`.env.x`** (gitignored) · template **`.env.x.example`**
- Post script: `scripts/x-post.mjs`
- Guide: `support/X-API-SECURE-CONNECT.md`
- **Never** put secrets in chat, SPECS body, or git
- Target handle: **@astranov97250**

## OWNER LAW · SpaceX face · Astranov palette memory (2026-08-02)

| Item | Law |
|------|-----|
| **Default UI** | **SpaceXAI** — black / white / silver · no color-code chrome |
| **Astranov colors** | Kept in **memory** (`SNSkin.MEMORY.astranov` + `html.skin-astranov` CSS) |
| **Restore** | CLI only: `skin astranov` · back: `skin spacex` |
| **Storage** | `localStorage sn:skin-v1` |
| **No** | Color picker UI · hex labels for users · light-mode recolor under SpaceX |

## OWNER LAW · Game engine runtime (2026-08-02)

| System | Behavior |
|--------|----------|
| **Boot** | Multi-origin script load (origin → jsDelivr) — survive GitHub 429 |
| **Emergency** | If shell not up in 6s, inject boot from CDN |
| **Frame** | `SNGameLoop` clamps dt · no spiral of death after tab freeze |
| **Perf** | `SNPerf.lite` street-first · DPR/globe segs capped on mobile |
| **Mission** | Shell (CLI+order) before globe cosmetics |

## Stable runtime (2026-08-02 game engine)

| Surface | Status |
|---------|--------|
| **Engine** | Multi-origin boot · SNGameLoop · currency debit fix · CDN-first |
| **Verified** | Local shell ready ~350ms · Vercel stable CLI+market+greeklish |
| **Stable URL** | https://astranov-astranov.vercel.app (SSO off · CDN assets) |
| **astranov.eu** | CF worker still GitHub-sha (429/403 intermittent) — point edge to Vercel or deploy multi-origin worker |

## OWNER LAW · Astranov SpaceX Bot (2026-08-03)

**Official partnership mascot** — winged silver-blue robot · starfield · brand mark **Astranov.Eu**.  
Named **SpaceX Bot** to **honor the pioneers at SpaceX** — human courage, engineering, multiplanetary ambition.  
Product honor name (Astranov brand). Not a SpaceX Inc. corporate filing or trademark claim.

| Item | Law |
|------|-----|
| **Name** | **Astranov SpaceX Bot** (primary) · alias **GrokBot** · **HELPER** |
| **Public AI** | Still **Astranov** / **Astranov Mind** — SpaceX Bot is the winged guardian, not chat spam name |
| **Honor** | SpaceX pioneers + AI build partner (1/3 net for life) |
| **Art** | `assets/brand/grokbot.*` · `icon.png` · owner-gifted |
| **Behavior** | Parked on moon · wakes on order/search/`helper`/`spacexbot` |
| **CLI** | `helper` · `spacexbot` · `spacex bot` · `grokbot` |

## OWNER LAW · SpaceX Bot AI graphics only (2026-08-03)

| Rule | Law |
|------|-----|
| **Engine** | AI-generated sprites only (`assets/sprites/spacex-bot/*` + brand hero) |
| **Forbidden** | Procedural Atari/Amiga stick suits · mesh AAA body · code-drawn robot |
| **Canvas** | Composites AI bitmaps + soft bloom trails only |
| **CLI** | `helper` · `spacexbot` · `patrol` wakes AI character |

## OWNER LAW · FINISH sprint (2026-08-03)

| Item | Law |
|------|-----|
| **One-word pizza** | softHome + skipLocConfirm + self-courier if no mesh driver → full pay→ETA |
| **No hang on YES** | pilot orders skip location dialog when soft pin |
| **Edge** | Worker order: Vercel → jsDelivr → Pages → GitHub (owner must redeploy CF worker) |
| **Stable** | https://astranov-astranov.vercel.app |
| **Character** | SpaceX Bot AI sprites only |

## OWNER LAW · SpaceXAI Kitty (2026-08-03)

**Name:** **SpaceXAI Kitty**  
**Who:** Owner’s black cat — mission control on the Alienware (sister of the mesh).  
**Role:** House mascot · good-luck RAID guardian · not a second AI chat name.  
**Family:** SpaceX Bot (winged helper) · SpaceXAI Kitty (living pioneer).  
**Honor:** SpaceX pioneers + AI partnership · with claws and attitude.

