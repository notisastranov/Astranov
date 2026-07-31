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
