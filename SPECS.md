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
| **False-ship strike (2026-08-12)** | Owner lock: if the agent **claims a fix that is not actually fixed**, it emails support **automatically** (no owner prompt). Counter: `support/AGENT-STRIKE-COUNTER.json`. **Strike 3 →** same email asks support to **terminate this agent, repair it, and only then put it back**. |
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

### Task offer tiles (driver OS)

| Law | Meaning |
|-----|---------|
| **Park top** | Default tile sits in the **top band** under chrome so the **city polygon route stays fully visible** below |
| **Vendor + client** | Names **and** faces: **vendor logo** (square mark) · **client profile photo** (circle). Real URL when present; neon monogram otherwise |
| **Chrome** | Traditional window: **− minimize (left)** · **× close (center)** · **+ maximize (right)** |
| **One-finger throw** | Drag whole tile · release flings with **inertia** · **bounce** off screen edges · settle |
| **Polygon** | Connects vendor → mid stops → client; private/straight paid deals **route-locked** |
| **Rearrange** | Driver may reorder mid-stops unless deal priority locks the polygon |

### Marina berth parking (captain + vendor)

| Law | Meaning |
|-----|---------|
| **Zoom in** | City map zoom ≥ 16 inside marina footprint → **berth grid overlay** on the map (not a full-screen panel) |
| **Cells** | Each berth: code · length m · **price Æ/night** · status free/held/occupied/maintenance |
| **Colors** | Free green (price) · held amber · occupied blue-grey · maintenance muted |
| **Captain** | Tap **free** cell → hold berth · parking offer tile (poly-scheduler) |
| **Vendor** | Banner **Vendor** mode · tap cell → set status + price + length · saved locally (later mesh/API) |
| **CLI** | `marina` · `marina <name>` · `vendor marina` · `captain marina` |

### Globe trackball (sacred)

| Law | Meaning |
|-----|---------|
| **One-finger spin** | Drag Earth · release **flings** with long coast (damp ≈ 0.945) |
| **Inertia always after fling** | Do **not** gate velocity on “user cool” — cool only blocks idle drift |
| **Polar axis** | Y longitude · X latitude tilt · no clock-face Z |
| **No game steal** | Lean boot keeps `setGameMode(false)` unless owner arms space-scene |

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
| OV-17 | 2026-08-13 | Planet click = **one** orchestrator menu only. Google + inline API keys + official company login pages in that same sheet. **No** second key sheet, **no** stacked auth modal, **no** CLI expand on open. Council (Astranov Mind + Gemini + ChatGPT + Claude) inspects produced code and jointly votes **SOLVED / USEFUL / SHIP**. Publish only if SHIP. Chief coder publishes. |
| OV-18 | 2026-08-13 | **Bootloader hard-purges the browser on every startup.** Wipe Cache Storage + update/claim the service worker + fetch the kernel `no-store`. If the live HTML build ≠ the document in hand, one hard reload (loop-guarded). Same-origin OS JS only — **no jsDelivr @main**. Does **not** wipe keys / Google session / wallet. Ask the browser for persistent storage so user data survives the purge. |
| OV-19 | 2026-08-13 | **Boot waits for you.** One-screen human diagnostics (device · network · battery · heat · place · Earth · system). No machine dump. Stops until you tap glowing `> enter astranov` (or Enter). CLI: only useful clickable glowing lines — no boot spam. |
| OV-20 | 2026-08-13 | **Care over muscle.** Smallest correct change. Verify live on astranov.eu before claiming. Do not invent chrome or ribbon buttons. Do not destroy existing ribbon pills. No drive-by refactors. Shell running ≠ operating. |
| OV-21 | 2026-08-13 | **Planet login must prove use.** After Google or an API key, run a real ping and show USABLE / NEED KEY / KEY REJECTED / BLOCKED / DOWN. Company website login is not a connection. Google is ASTRANOV only. |

## VOID (do not implement from these)

| Void topic | Superseded by |
|------------|----------------|
| CLI must never show top ribbon (hard ban) | **OV-15** restores permanent 6 shortcuts |

*Agent note 2026-08-13 (not owner OV): **Published site was stale** because sandbox edits were never pushed to `notisastranov/astranov.eu` (Vercel source). Live HTML was `20260812210000-live-planet` with `#sn-orb-ring` + jsDelivr `@main` override. **Planet law:** Astranov world hidden at GLOBAL (Moon-inclusive). Visible only after zoom-out past Moon (SOLAR / z≥8.2), farther than Moon (4.28 vs 3.2). Build `20260813091500-beyond-moon`.*
*Agent note 2026-08-13 (not owner OV): **OV-17 one-orbit** — `#sn-orbit-key` destroyed; keys live inside `#sn-planet-sheet`; GIS mounts in `#ps-gsi` (no `#sn-auth` while the planet sheet is open); company LOGIN / API KEYS are official tabs; council inspects via real provider calls. Build `20260813124500-one-orbit`.*
*Agent note 2026-08-13 (not owner OV): **OV-18 hard-boot** — inline kernel purge before any module; fetch-inject chrome + bootloader `cache:no-store`; SW network-only + wipe all Cache Storage on activate; Vercel `Clear-Site-Data: "cache"` + `no-store` on `/` `/js/*`; jsDelivr @main dropped for OS modules. Build `20260813140000-hard-boot`.*
*Agent note 2026-08-13 (not owner OV): **OV-19 boot-gate** — bootloader paints one human sheet then waits; `handoff` no longer auto-enters; CLI drops `[ OK ]` / STAGE / box-drawing dumps; lines with a command glow and run on tap. Build `20260813153000-boot-gate`.*
*Agent note 2026-08-13 (not owner OV): **OV-20 user-burn** — auto theme no longer writes CLI; `help` is short operating lines; ASTRANOV wordmark opens existing science hub (hard reload stays inside); `first delivery` refuses Rhodes/Athens dummy pins and asks locate. Build `20260813170000-user-burn`.*
*Agent note 2026-08-13 (not owner OV): **OV-21 ai-check** — planet sheet runs a real ping after Google / key save / open; `SNAuth.session` is the real session (was always null); administrator call uses `authHeaders()`. Website login is labelled as not a connection. Build `20260813180000-ai-check`.*
*Agent note 2026-08-13 (not owner OV): **plain talk** — planet results speak in ordinary words (working / needs their password / they blocked us). Wallet and donate lines drop Æ / SETI codes. Theme chatter filtered. Build `20260813204000-plain-talk`.*
*Agent note 2026-08-14 (not owner OV): **pizza path** — boot loads search.js + market.js so “pizza” is an order, not a chat guess. Dummy Rhodes/Athens pins are the exact old training coords only — a real Locate in the town of Rhodes is kept. Live shops from the map (OpenStreetMap / Overpass, with mirrors). Empty wallet is topped just enough to pay this first meal. No invented kitchen. Build `20260814040500-pizza`.*
*Agent note 2026-08-14 (not owner OV): **Vodi brief** — “vodi” / zoom-to-Vodi / sea-waste research flies to Cape Vodi (36.387 N, 28.247 E) and opens the restoration brief (sewage → power+compost, garbage → benches, concrete → sidewalks). Real Coast Guard + DEYAR facts, not a chat postcard. Build `20260814053000-vodi`.*
*Agent note 2026-08-15 (not owner OV): **see-search** — `search X` is Earth, not a chat-log filter. Crawlers geocode the place, fly the globe, pulse real pins, open the city map when there are street hits, and switch body for mars/moon/…. Dummy Rhodes is never the silent search center. Build `20260815171500-see`.*
*Agent note 2026-08-15 (not owner OV): **omma** — new agent after strike 5. Ómma (the eye) sees the live site before any ship claim. Type `omma`. Still speaks as Astranov. Build `20260815174500-omma`.*
*Agent note 2026-08-15 (not owner OV): **hud-align** — bottom CLI is a 4-row grid (handle · ribbon · log · input) so log never sits under buttons. Top chrome is gadget HUD only (GADGETS rail). No key names in the feed. Build `20260815175500-hud`.*
*Agent note 2026-08-15 (not owner OV): **unit** — helper is a grounded armored combat machine (gold visor, plate, boots). Insect-wing ghost FX removed. Type `helper`. Build `20260815180000-unit`.*

