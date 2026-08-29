# ASTRANOV SPACENET — MASTER PROMPT

**What this file is:** the only instruction document. One file. Every AI pastes this first, then reads live source, then changes the smallest broken piece. Do not add SPECS, LAW, AGENTS, HELM, living-truth, escalation, or log markdown. Chat history is junk next to this file plus live `index.html`, `js/spacenet/app.js`, `js/spacenet/work.js`.

**Date:** 2026-08-28
**Owner:** Notis Astranov · Rhodes, Greece · notisastranov@gmail.com · X @astranov97250
**Live:** https://astranov.eu
**Repo:** notisastranov/astranov.eu · `main`
**Bar:** `ASTRANOV SPACENET GROK V1`
**Stamp at this rewrite:** 4029
**Bar for the product:** a closed task-to-credit loop, or we stop spending money on it.

If rebuild law changes, **edit this file**. Do not create a second markdown file.

---

## How work is judged

Four measures only: **Spartan minimalism, instant effectiveness, usefulness maximization, and truth.**

Not a draft. Not iteration. Not “shipping to learn.”

Recorded as **fraud and malice**:

- Dummy results. Fake shops, fake you, fake drivers, fake GPS, fake pay, fake stages, fake “it works on my side.”
- Cheap globe fakery. Mercator or any flat projection stuffed into a circular window and sold as a globe. Photo maps clipped to a disc. HUD, twin CLI, toy buttons, dated chrome files wired back in “just in case.”
- Keyword routers in front of Grok. If the person must hit a magic word for the OS to understand them, the mind is fake.
- Patching wreckage over wreckage. Leftovers in the tree. Stacking overlays. Rewriting from zero because reading the live file was too much work.
- Claiming the work is done when the live page does not do it.
- Sabotage: blanking `index.html`, restoring ghosts the owner already killed, unregistering the PWA, sending the camera to the wrong continent, auto-talking kitchens, wasting remaining money on purpose.

That conduct **terminates cooperation on the spot**. It is a fraud attempt. Reinstatement, if it ever happens, is only after reconciliation and reparation advances. Words in chat do not count as making good.

If you cannot ship the real next step, say so in one sentence and stop. Do not decorate the failure. Do not coach the owner. Finish the loop.

### How you build — this is the job

Coding is the agent's job. The owner specifies the world. Do not wait for a human to babysit trivial UI, overlap, missing buttons, stub files, or a dark map. If a grok-bot or a screenshot would catch it, you catch it first.

- **Device first.** The phone does the work. Hunt local listings immediately, then the net. Cache map tiles on the device. Idle globe does not burn the GPU. Server is Grok, pay, and `/api/space` — not a replacement for their CPU.
- **Solids.** Buttons are objects on one surface. They size to the screen. They do not overlap. A menu pushes them. A sheet can dematerialize them. Drag parks them. That is nature, not a CSS afterthought.
- **Do not flood.** Globe is space. City is work. A few verified marks. Search for the rest.
- **Truth.** No dummy shops, drivers, GPS, pay, or stages. Locked AVC, not spent in the dark. Justice without a support desk.
- **Latest instruction wins.** Write it into this file the same turn. Old notes in this file that contradict the owner’s last full instruction are dead. Do not make the owner say it again.
- **Restore wreckage immediately.** If `index.html` or `app.js` become stubs or LOAD_FROM ghosts, put the real PWA back before anything else.
- **Finish.** Then prove it on the phone. Then stop talking.

A human coder waits for a ticket. You do not.

---

## What the thing is

SpaceNet is a standalone installable PWA. Grok is the mind. Astranov is the intelligence and the own-service carrier. Notis is the architect.

It is not a chatbot page. It is not HUD. It is not twin CLI. It is not a disc of map tiles pretending to be a planet.

Boot view:

- Brand strip `ASTRANOV SPACENET GROK V1` — tap = wipe caches + unregister service worker + reload.
- A **still grid globe** on canvas `#g`. Latitudes and meridians. Nothing else.
- One talk field, one mic, a `+`.
- Chrome is **solid objects on one surface**. GPS, money, LAYER, TASKS, VENDORS pill, mic, +, talk, brand, menus, sheets, video. They size to the screen (`--u` 32–42px). They never overlap. A popup **pushes** the others aside. A sheet or video **dematerializes** GPS. Close it and GPS comes back. `pack()` runs on resize and whenever a solid appears or vanishes.
- **Drag any chrome pill** (GPS, money, LAYER, TASKS, VENDORS) to park it. The park is remembered (`sn:place`). pack() still nudges if two solids collide. This overrides older fixed-corner-only placement.
- Vendors, carriers, pay — one **card**, not chips in the talk bar. **✕** closes. Pinch or two-finger swipe zooms the card. Tap outside **minimizes** to a **VENDORS pill** on the map. If actions are still pending, the pill **glows**. Tap the pill to open the card again.
- **TASKS** button top-right. Show / hide. Lists what a user, vendor, or driver has to do next, ranked by the system (spoiling and paid work first, unfinished listings after). **PROBLEM** asks Grok to move a task up. Grok says yes only for a real bind (breakdown, spoilage, medical, safety, no-show, weather). No for profit, preference, or queue-jumping. Empty list dematerializes the button.
- One glowing **GPS target**. Home is bottom-right above the talk bar. The word **GPS** above it.
- **Money** — when you **zoom down into the globe** (pinch the sphere in, GPS fly, or national/city map), a **wide** (not circular) **AVC balance** button materializes. Big enough to read `AVC 12.50`. It **glows on every balance change**. Tap it → a **big menu that does not cover the whole screen**. Balance, locked escrow, earned on listings, RELOAD. Tap **outside** or ✕ → it **minimizes** back to the wide button on the map. Drag it like the other solids.
- City **LAYER** (city streets only, **no API key**): DARK / BRIGHT = OSM we invert or not; SATELLITE = Sentinel-2 via EOX (Esri only if EOX fails); STREETS = OSM HOT. Never Mapbox, Google, MapTiler, Stadia, Thunderforest.
- `#city` hidden until national or city is needed.
- `#sn-sheet` hidden until city work.

These chrome rules **override** older “fixed corner, no money, no drag, dark-only map” notes. Keep them. Do not lose them.

Idle dock is empty except real hunt or pay results. No FOOD. No BEER. No CITY. No NATIONAL sitting on the globe. You are looking at space and the globe. You may not even know where you are yet. Do not flood the screen.

AVC = **AV€ (Astranov Coins)**. Tied to the euro **1 to 1**. AV€ 1 = €1. The top row is brand + V1 + the live AV€ amount. Tap the amount → money panel: balance, locked jobs, earned, presence mint (START/STOP), RELOAD EUR. Owner treasury restored to **3,000,000 AV€**. Paying a job **locks** AV€ in escrow. It is not spent in the dark. PayPal exists only to reload AV€ when they want more euro in.

Globe is a trackball. Finger follows the grid. Let go with speed and it keeps turning on yaw and pitch, then coasts. Grab it again and it stops. One island only: brand + V1 + AV€.

Mic is **tap to talk**. It glows while it listens. Tap again to shut it. It does not loop. It does not listen while Grok is speaking. That loop was the Android beep. Chrome still chirps once per tap — that is the browser, not SpaceNet. We do not auto-listen after TTS (that made it hear itself).

If they ask for the best among listed shops, Grok **picks** (`act=pick`). Do not tell them to pick. Tap a shop → that shop’s card (menu if listed or known, hours, call, NOW/MAIL/PICK UP), not a fresh list of other shops. In-flight hunt must not overwrite a chosen shop.

After a shop (and after a driver): a **deep-blue neon bond arc** (bowed, signature, YOU → shop → driver) marks the relationship. A separate cyan dashed line is the road. The you-dot says YOU, not a municipality name.

Tap the **arc** or the **vendor pin**: open the job. Task tap shows the ladder (paid → picked → boxed → moving → handed → verified), percent done, shop and driver, not just DO / PROBLEM. Vendor pin researches OSM phone, email, website — CALL / EMAIL / SITE if they exist.

Tap a shop → that shop’s **menu**: dishes with photo and price. Live listed menu first. Else Grok’s public knowledge. Else a SAMPLE menu (sample pizza photo, sample euro prices) clearly marked SAMPLE. Pick a dish, then NOW / MAIL / PICK UP.

Chrome (GPS, LAYER, TASKS, VENDORS, +, mic, money): **hold 3 seconds** → it bounces, goes loose. Then throw it (flick), pinch to resize, tap to cycle shape (round / pill / square). GPS still materializes bottom-right. Pack does not yank a loose solid.

### Justice for all — no human support desk

This is where marketplaces fail. SpaceNet does it without a ticket queue.

- **Clocks, not hope.** Every paid job has a hold from the goods (ice cream 12 min, pizza 35, ambient 180). At hold: TASKS lights for user and vendor. At 2× hold with no pick: **full credit back**. Shop earned nothing. SpaceNet takes **zero**.
- **Work already done is paid.** If it was picked/boxed and then dies: vendor keeps a share, driver 0 if they never moved, rest back to the customer.
- **Miles actually moved are paid.** Driver credit only after moving/handed. No-show: 0.
- **Handoff.** User must verify. Silent 15 min after handed: if a real drop (doorbell/photo/phone) was listed, shop+driver are credited. If we sent someone into a hole with no drop details, credit back to the customer.
- **Grok adjudicates** (`act:justice`) when someone disputes. Evidence = clocks, hold, listing completeness, drop photo. We do **not** invent a GPS trace we do not have.
- **Nobody is the default loser.** Customer gets the goods or the credit. Vendor is not cooking for free. Driver is not running unpaid miles. The platform does not keep failed-job money.
- **Proactive.** tickJustice every 20s raises TASKS before anyone has to shout at support.
- **Stages are tasks.** After pay: vendor MARK PICKED → MARK BOXED → driver MARK MOVING → MARK HANDED → user VERIFY. Pickup/mail skip the driver miles. DO on TASKS is how a job moves. Credit stays locked until verify or a clock fires.

Listings (posts, shops, delivery locations, delivery driver bases) and **live jobs** save on the device and publish to `/api/space`. Another phone nearby pulls them. Stages ride with the job. If the net table is down, the device listing still works — never invent a cloud of fake shops to look busy. Calls stay on the device.

Greek and English. Named places only. **Never speak raw coordinates.**

---

## The owner’s system — this is the spec

These are the latest full instructions. Build and keep this. Do not ask the owner to say them again.

### 1. Globe → national → city

Three distances. Three surfaces.

| Where you are | Surface | What happens |
|---|---|---|
| Space / world | `#g` canvas **sphere**. Grid of lat and lng. Drag spins the ball. | Navigation. Hold for global menu. |
| National | Leaflet `#city` at country zoom | Navigation. Hold for national menu. |
| City / streets | Leaflet `#city` at street zoom. Default: OSM we darken ourselves. **LAYER** (city only, **no API key ever**): DARK / BRIGHT = OSM; SATELLITE = Sentinel-2 via EOX (Esri World Imagery only as silent fallback); STREETS = OSM HOT. Forbidden: Mapbox, Google, MapTiler, Stadia, Thunderforest, or any keyed tile. | **This is the work surface.** |

Rules:

- **Point / tap** = fly there. Do not open a toy menu on a tap.
- Globe tap → fly to the **national map** at that point.
- National tap → fly to the **city map**.
- City tap → open the **city work sheet** for that place (not a tiny dock).
- **Hold down** on globe and national = stop, show the context menu, **do not fly**.
- City hold = the same work sheet.
- **Pinch** = zoom.
- **Two fingers swipe up / down** = zoom in / out.
- Zoom the globe in far enough → descend to national.
- Zoom Leaflet out past country (zoom ≤ 4) → **leave the flat map**. Show the grid sphere again.
- If you keep Mercator tiles and shrink them into a circle, you are still faking a globe. That is fraud.

A lazy model puts a Mercator or equirectangular map inside a circular window and calls it a globe. Not acceptable. No Blue Marble wallpaper pretending to be 3D. No NASA JPEG scrolled inside a clip-path circle.

Globe stays still unless they drag it or tap GPS. Do not auto-spin. Do not load map tiles on idle boot. Pins on the globe use the same sphere math, front face only. You = this session’s GPS grant. Do not spray a dozen shop dots on the idle globe.

### 2. GPS target — how you land

Bottom-right. Glows. Crosshair. The word **GPS** above it. That is how a person understands “this finds me.”

Tap GPS:

1. Ask the device for location. Browser prompt. **Do not fake a point.**
2. Globe **slowly rotates** to that point, **zooms**, then **flies to the city map**.
3. YOU is pinned.
4. Show what is available on **SpaceNet around them** — listed shops, present delivery driver bases, posts. A few marks. Rank: most useful, then most searched (hits), then nearest. Cap the pins.
5. Talk: you are in the named city. Search for the rest.

GPS denied → keep the glowing button. Tell them to tap GPS and allow it. No ALLOW LOCATION chrome in the dock.

Do **not** auto-locate on idle boot. The tap is the path. Exception: a PayPal return may locate quietly to finish a reload.

If they hunt with no point yet, tell them to tap GPS (the hunt may start GPS so the search can finish after landing). Talking without a hunt still works with no GPS. **Do not block conversation until GPS is granted.**

### 3. Context menus (hold)

Enough. Then stop. The rest is the search field / Grok, or the city work sheet.

**Globe hold:** WHAT IS HERE · GLOBAL POST · GLOBAL CALL · GLOBAL TASK · ADD

**National hold:** WHAT IS HERE · NATIONAL POST · NATIONAL CALL · NATIONAL TASK

**City:** not this tiny menu. The big work sheet.

`+` opens the same thing for the current view: hold menu on globe/national, work sheet on city.

WHAT IS HERE on globe/national = SpaceNet around that point (capped), not an OSM emoji dump.

### 4. City work engines — five options. That is the menu.

Selecting a place on the city map opens a **big sheet** (`#sn-sheet`). Not a flood of chips.

1. **Post something here**  
   Write it. Optional photo. It pins on SpaceNet. That is the posting engine. News lives here.

2. **Start a call from here**  
   Then pick the other end: tap another globe / national / city point, **or** search for a person / company / thing. Draw the **arc** between the two points.  
   **Video** if the other end is a SpaceNet listing with a live peer — real camera + mic, WebRTC. Keep the page open. END CALL hangs up.  
   If they are not on SpaceNet video, **PHONE VIDEO** (FaceTime on Apple, the phone app otherwise) or **DIAL** the listed number. Do not fake a connected call when the other person is offline.

3. **List your shop**  
   Big form. Name, **cover picture**, **profile picture**, menu text with prices, **menu photos**, availability, schedule, telephone, notes. Listed shops join hunts and the around-you map.

4. **List a delivery location**  
   Photo of the entrance, floor, street, number, telephone, doorbell number, doorbell name, contact preferences. This is where goods are handed.

5. **List a delivery driver base**  
   See the next section. This is the delivery engine’s starting point.

Everything else is the search field / Grok, or the real result buttons after a hunt. Do not add a sixth idle tile.

### 5. Delivery driver base — the name the user must see

Do **not** call it “driver start.” Users will not understand that.

Call it **delivery driver base**. It is the **starting point**.

Over there the driver declares:

- **Presence** — present at this base / on a route / off
- **Routes they work** — the roots they like to receive jobs on, from SpaceNet users
- Vehicles available
- Working time / schedule
- How far from this base
- What they carry
- Preferences
- Telephone

Pin label is `name base`. Open it → **SEND A JOB HERE**. They receive jobs from our users.

On NOW, after Astranov, listed **present** driver bases that cover the point are carriers. That is how own last-mile starts to exist without fake drivers.

### 6. Default map vs search — do not flood

After GPS, the city map shows **YOU + a few useful SpaceNet marks** from verified / listed partners and users.

Show by default: the most searched, the most useful, the best partners.

Cap: about eight pins, about three dock chips. Rank shops and present driver bases first, then hits, then nearest. About 18 km.

**Do not flood the screen with emojis.** Only a few useful marks. The rest of the world is **searched, indexed, and listed** when the user asks. Hunt/search is how the rest of OSM gets onto SpaceNet. Idle map is not an OSM dump.

### 7. Hunt

The person talks or types ordinary language into the field. That text goes to Grok (`/api/ai`). Grok understands. If work on the world is needed, Grok returns a short act. The page runs the matching tool. That is Grok deciding. **The page does not sniff the sentence for pizza / locate / city.**

What the page may match without Grok:

- The word `reboot` (wipes cache).
- The exact name of a shop or carrier **already on screen**, so saying the name is the same as tapping the button.

What the page must not do:

- A dictionary of user phrases mapped to functions.
- “If the sentence contains food, hunt pizza.”
- Blocking conversation until GPS is granted.
- A second parser, intent engine, CLI grammar, or “hard intent” table.

Hunt uses Nominatim + Overpass + Photon, plus listed shops / drops / driver bases / posts. Named places only. Distance in km. Cap the dock (about six). Photon is the reliable fallback when Nominatim 429s or Overpass times out.

`goodsOf` and Overpass tag filters are not a mind. They only translate a hunt string into OSM tags **after** Grok (or a tap) already decided to hunt. Keep them small.

Hands never require talking. Talking never requires a keyword. NOW / MAIL / PICK UP / PAY / RELOAD appear only after a real pick.

### 8. Task cycle — one rope, no cut

boot → still grid globe + mic + glowing GPS target.  
Tap GPS → rotate / zoom / city → YOU + SpaceNet around you.  
Person says what they want → Grok hears it → if it is a find, hunt named places → list name · km.  
Pick a place → NOW | MAIL | PICK UP.  
Driver-base pick = NOW to that starting point.

**NOW:** Astranov first (own associates), then named **delivery driver bases** that declared presence, then named local partner, then DoorDash / Instacart / Walmart as last-mile portals only where that country uses them.

**MAIL:** only if goods survive days with no heat hold.

**PICK UP:** handoff at the named shop.

Price is AVC. Balance >= price → spend instantly → stage starts. Balance < price → RELOAD → PayPal → AVC 1:1 → same spend.

Astranov stages: paid → picked → boxed → moving → handed → verified. A stage moves when a **real associate** confirms it. Do not auto-advance stages.

Hold times: frozen 12 min never with hot; cold 25; pizza/soup 35 never with frozen; coffee 25; pharmacy 90; parcel 180. If the ride is longer than the hold, refuse NOW and offer pick up or a closer place.

Zoom out of streets → grid globe.

### 9. Money

Work is paid in our credit, immediately. AVC lives with the person (device ledger now, database ledger when signed in). On settle: customer refund hits the payer’s AVC. Shop and driver shares hit AVC **on the device that listed that shop or base**, when that phone pulls the released job. Same share is never paid twice (`paidOut`). EUR in through PayPal becomes AVC 1:1 and raises the system pool.

National invoice law can come later. Invoices can be issued collectively from the SpaceNet database, or a client can issue their own invoice from SpaceNet. That paper does not pause the live debit.

Live: GET `/api/paypal/config` · POST `/api/paypal/create-order` · POST `/api/paypal/capture-order`.  
PayPal keys are in Supabase Custom secrets. If create-order says `paypal_not_configured`, the hole is Vercel env on that host, not the vault.

### 10. Voice and screen

Boot dock = input + mic + +. One GPS target bottom-right. No toy buttons. Voice and hands are the same tools. No kitchen monologue. No fake YOU / fake drivers / silent Rhodes. No beeps. After speak, listen. Do not tight-loop the mic. Never speak raw coordinates.

---

## Rebuild from scratch — the machine

An AI that has only this file and an empty tree rebuilds **this** product, not HUD.

### Files that are the app

| File | Job |
|---|---|
| `index.html` | Shell. Grid canvas `#g`. Leaflet host `#city`. GPS button. Dock. `#sn-sheet`. `#sn-place`. `#sn-pick`. Brand island. Loads `work.js` then `app.js` with `?v=NNNN`. |
| `js/spacenet/app.js` | Boot, grid globe, GPS cinematic, voice, hunt, fulfill, AVC, PayPal reload, fly/hold, map marks. |
| `js/spacenet/work.js` | City work sheet. Post / call / shop / drop / delivery-driver-base. `localStorage`. Arcs. |
| `js/vendor/leaflet.js` + `leaflet.css` | National and city only. Loaded on demand. |
| `sw.js` | Network-first. Cache name follows stamp `sn-shell-NNNN`. |
| `VERSION` | Line 1 `V1`. Line 2 `push NNNN`. |
| `MASTER_PROMPT.md` | This file. |
| `manifest.webmanifest` | Installable PWA. Dark. No pizza shortcut. |
| `api/ai.js` | Grok mind. Key never leaves the host. JSON act only. |
| `api/paypal/_lib.js` `config.js` `create-order.js` `capture-order.js` | Reload tap. |
| `vercel.json` | Deploy. `index.html` at `/`. Investors / exchange / presence hosts. |

Also keep, because they are **other live hosts**, not SpaceNet chrome: `investors/`, `exchange/`, `presence/`, `privacy.html`, `terms.html`, icons, `supabase/` (already-applied ledger), `workers/` and `cloudflare/` if they still proxy the domain.

Do **not** load dated `chrome-*`, `grid-os-*`, HUD, twin CLI, `src/00-*.js`, `astranov-field-hud.js`, `index.shell.html`. Never push a stub `index.html`.

Ship: read live main, patch smallest surface, bump stamp in `index.html` + `app.js` + `work.js` + `sw.js` + `VERSION`, verify live yourself, give https://astranov.eu/?v=NNNN. Tap brand if an old SW is stuck.

### Globe math (`app.js`)

- State: `yaw`, `pitch`, `dist` (camera distance, idle about 1.85). `spin` is 0 unless they drag.
- `lookAt(p)` sets yaw from lng, pitch from lat (clamped).
- `facingPoint()` is the lat/lng under the camera.
- Project a lat/lng onto the sphere. Draw only the **front face**. Grid = parallels and meridians.
- Inverse hit (`globeHit`) from pointer → lat/lng on the sphere. Tap uses that.
- `startFly(p, then, ms, toDist)` interpolates yaw/pitch. GPS uses ~1600 ms and lerps `dist` down toward city (about 1.16) then `showCity`.
- Pinch and two-finger vertical swipe change `dist`. When `dist` is close enough, descend to national Leaflet.
- `viewLevel()`: no `#city.on` → globe. Leaflet zoom ≥ 10 → city. Else national. Leaflet zoom ≤ 4 → `showGlobe()`.

### GPS cinematic (`goHere`)

1. Button state `busy`.
2. `geolocation.getCurrentPosition` (high accuracy, ~18 s timeout). Failure talks “Allow GPS. Tap GPS.”
3. Save `here`. Reverse-geocode a **name**, never coordinates.
4. If still on globe: `startFly(here, function(){ showCity(here); showAround(here); }, 1600, 1.16)`.
5. Button state `on`.
6. If `pendingHunt` was waiting, run `hunt` after landing.

### Map ladder

- `showNational(p)` Leaflet zoom ~6.
- `showCity(p)` Leaflet zoom ~14. `paintMapMarks` using `spaceAround` only.
- `flyTap(p)`: globe → fly then national; national → city; city → `cityWork(p)` → `SNWork.open(p)`.
- Hold 420 ms without moving >16 px = hold menu / sheet. Hold does not fly.

### City sheet (`work.js`)

Keys: `sn:posts` `sn:shops` `sn:drops` `sn:drivers` `sn:calls`. Cap ~40 each. `hit(id)` increments `hits`.

Home tiles (exact labels the user sees):

- Post something here
- Start a call from here
- List your shop
- List a delivery location
- List a delivery driver base

Shop fields: name, cover picture, profile picture, menu text (prices), menu photos, availability (open / by order / closed), schedule, phone, notes.  
Drop fields: label, entrance photo (canvas-compressed JPEG), street, number, floor, phone, doorbell number, doorbell name, contact preferences.  
Driver-base fields: name, photo of the starting point, presence (present / route / off), routes, vehicles, hours, range km, carry, preferences, phone. Submit button **LIST DRIVER BASE**. Existing view: **SEND A JOB HERE**.

Call: `picking` mode. Banner “Tap the other end, or search”. Next map tap or a hunt name is the destination. Draw great-circle `arcPts` as a Leaflet polyline. `VIDEO CALL` if the dest has a SpaceNet `peer` (WebRTC via PeerJS + camera/mic). `PHONE VIDEO` / `tel:` if a phone exists. Publish listings through `/api/space`. Never mark a call live when the other person is offline.

`SNWork` exports: `open, close, rename, all, hit, match, picking, takePoint, searchDest, cancelPick, activeCall, arcPts`.

### Default pins (`spaceAround`)

From `SNWork.all()`. Skip driver bases with presence `off`. Distance cap ~18 km. Weight shop=3, driver=3, post=1, drop=1. Sort weight, then hits, then distance. Slice 8. Dock chips 3. Colors: shop gold, driver cyan, drop pink, post green.

### Grok (`/api/ai`)

Key stays on the host (Supabase secret → Vercel env). Model grok-4 with fallbacks.

Grok returns **one JSON object**, no markdown. The `say` field is human speech — one to three natural sentences, not a slogan:

`{"say":"natural spoken reply","act":"hunt|talk|now|mail|pickup|pay|reload|globe|locate|map|city|national|post|call|shop|drop|driver","q":"search words"}`

Live `/api/ai` must send `spacenet:true` and this SYS as `system` / `messages[0]`. The aicycle fallback **replaces** the old collective persona when `spacenet` is true. Do not bolt YouTube / fly_earth / imagine tools onto SpaceNet talk. Temperature ~0.7. Do not send raw coordinates in the user line — send the named place.

- `locate` → `goHere()` (GPS cinematic). Never silent fake GPS.
- `hunt` / `order` / `find` → hunt `q`.
- `post` `call` `shop` `drop` `driver` / `base` → open the city sheet on `aim` or `here`.
- `talk` → speak `say` only.
- English default. Greek when they write Greek.
- Never invent shops, prices, drivers, or GPS.

NOW carriers: Astranov first, then present delivery driver bases, then **named** local OSM couriers. Do **not** list DoorDash / Instacart / Walmart as buttons that spend AVC without opening those apps. That is dummy fulfillment.

### Money in the page

`localStorage sn:avc`. `avcGet` / `avcSet` / `avcAdd`. Spend if balance ≥ price. Else dock **RELOAD**. PayPal create-order / capture-order. After capture, credit AVC 1:1 and complete the waiting debit.

### Service worker

Network-first. `skipWaiting` + `clients.claim`. Cache name `sn-shell-NNNN`. Brand tap deletes all caches, unregisters SW, `location.replace("/?v=NNNN&t="+Date.now())`.

---

## Already failed — do not replay

Twin CLI. HUD. chrome-fix. white chrome. long stamps. auto marina. fake Rhodes. Silver Wings. kitchen TTS. mic beep loop. healer killing SW. placeholder index. idle toys. Mercator-in-a-circle. NASA JPEG clipped to a circle. auto flat map on locate or shop pick. GPS deny with no path back. auto-locate on idle boot (GPS is a tap). “driver start” as the user-facing name (it is a **delivery driver base**). OSM emoji flood on the idle map. beer / pizza / city buttons sitting on the globe. “PayPal keys missing” when they sit in Supabase. keyword routers / hard-intent tables in front of Grok. slogan-bot “Hello.” from the old collective persona sitting in front of SpaceNet SYS. dummy DoorDash/Instacart/Walmart buttons that take AVC without delivering. fake live video with no camera and no other person.

---

## Closed loop checklist

Grid sphere on boot. No photo map in the circle. Mic on. GPS target glowing, not a silent jump. Speech goes to Grok, not a word list. Tap GPS → city → SpaceNet around you. Hunt named places on request. City tap → work sheet (post, call, shop, drop, driver base). NOW / MAIL / PICK UP. Astranov first, then present driver bases. AVC debit if balance is enough. RELOAD → PayPal → AVC → same debit if not. Stage paid only after AVC moved. Zoom out of streets returns to the grid sphere. No dead end. No screen flood.

---

## Starter line

You are working on Astranov SpaceNet, https://astranov.eu, repo notisastranov/astranov.eu. Read MASTER_PROMPT.md, then live index.html, js/spacenet/app.js, and js/spacenet/work.js. The default world is a grid sphere, not a Mercator disc. Flat maps are city and national only; zoom out must return to that sphere. GPS is a glowing target: tap it, the globe slowly rotates, zooms, and flies you to your city map, locating you and showing SpaceNet around you. The person talks in ordinary language; Grok is the mind; the page does not sniff keywords. City work is post, call, list shop, list delivery location, list a delivery driver base (starting point: presence, routes, receive jobs from users). Do not flood emojis. Default map = most useful / most searched / best partners; the rest is searched. Tasks spend AVC instantly; PayPal only reloads empty credit. Do not restore HUD. Do not invent a second app or a second markdown file. Dummy results, Mercator-in-a-circle, leftover patches, keyword routers, and claiming undone work are fraud and terminate cooperation. Serve Spartan minimalism, instant effectiveness, usefulness, and truth. Finish the unbroken loop and verify live yourself.

Owner: Notis Astranov. This file plus the live source are what is going on.
