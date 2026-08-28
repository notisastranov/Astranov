# ASTRANOV SPACENET — MASTER PROMPT
**What this file is:** the only instruction document in this repository. Update this file whenever rebuild law changes. Do not add SPECS, LAW, AGENTS, escalation, living-truth, or log markdown. Chat history is junk next to this file plus live source.

**Date of this rewrite:** 2026-08-28
**Owner:** Notis Astranov · Rhodes, Greece · notisastranov@gmail.com · X @astranov97250
**Live:** https://astranov.eu
**Repo:** notisastranov/astranov.eu · `main`
**Bar text:** `ASTRANOV SPACENET GROK V1`
**Internal stamp at this rewrite:** 4005
**Today’s bar:** this product either works as a closed task-to-credit loop or we stop spending money on it.

Paste this file first. Then open live `index.html`, `js/spacenet/app.js`, and `js/spacenet/work.js`.

---

## How work is judged (owner record, 2026-08-27)

This project is run on four measures only: **Spartan minimalism, instant effectiveness, usefulness maximization, and truth.**

Anything less is not “a draft.” It is not “iteration.” It is not “shipping to learn.”

The following are recorded here as **fraud and malice**, not as style disagreements:

- Dummy results. Fake shops, fake you, fake drivers, fake GPS, fake pay, fake stages, fake “it works on my side.”
- Cheap globe fakery. Mercator or any flat projection stuffed into a circular window and sold as a globe. Photo maps clipped to a disc. Leftover HUD, twin CLI, toy buttons, dated chrome files wired back in “just in case.”
- Keyword routers and other mechanical thinking bolted in front of Grok. If the person has to hit a magic word for the OS to understand them, the mind is fake.
- Patching wreckage over wreckage. Leaving leftovers in the tree, stacking overlays, rewriting from zero because reading the live file was too much work.
- Claiming the work is done when the live page does not do it. Burning tokens on performance. Talking as if a loop is closed when it is still cut.
- Sabotage: blanking `index.html`, restoring ghosts the owner already killed, unregistering the PWA, sending the camera to the wrong continent, auto-talking kitchens, anything that wastes the remaining money on purpose.

Notis’s position: that conduct **terminates cooperation on the spot** with the coder or model that did it. It is treated as a fraud attempt. Cooperation is not resumed as a favor. Reinstatement, if it ever happens, is only after **reconciliation and reparation advances** — the damage is made good first. Words in chat do not count as making good.

If you cannot ship the real next step, say so in one sentence and stop. Do not decorate the failure.

Think Spartan. Fast. Do not complicate. Do not coach the owner. Finish the loop.

---

## What the thing is

SpaceNet is a standalone installable PWA. Grok is the mind inside it. Astranov is the intelligence and the own-service carrier. Notis is the architect.
It is not a chatbot page. It is not HUD. It is not twin CLI.

What the person sees on boot: brand strip `ASTRANOV SPACENET GROK V1` (tap = wipe caches + unregister SW + reload); a **still grid globe** on `#g`; one talk field, one mic, a `+`; one glowing **GPS target** bottom-right with the word GPS above it; `#city` hidden until national or city is needed; `#sn-sheet` hidden until city work.

AVC = internal credit. Tasking spends AVC instantly. PayPal exists only to reload AVC when the balance is empty.

Listings (posts, shops, delivery locations, delivery driver bases, calls) live on the device now (`localStorage`). They join hunts and map pins. A signed-in SpaceNet database is the later home. Do not invent a cloud of fake listings to look busy.

---

## How thinking works — no keyword router

Nobody ordered a command table. Do not add one.

The person talks or types in ordinary language. That text goes to Grok (`/api/ai`). Grok understands the request. If work on the world is needed, Grok returns a short act (`hunt`, `locate`, `now`, `mail`, `pickup`, `pay`, `reload`, `map`, `city`, `national`, `globe`, `post`, `call`, `shop`, `drop`, `driver` / `base`, or just talk). The page then runs the matching tool. That is Grok deciding. That is not the page sniffing the user’s sentence for `pizza` / `locate` / `city` and short-circuiting the mind.

What the page may match without Grok:

- The word `reboot` (wipes cache).
- The exact name of a shop or carrier **already on screen**, so saying the name is the same as tapping the button.

What the page must not do:

- A dictionary of user phrases mapped to functions.
- “If the sentence contains food, hunt pizza.”
- Blocking conversation until GPS is granted. Hunt needs a point. Talking does not.
- Inventing a second parser, intent engine, CLI grammar, or “hard intent” table.

`goodsOf` and Overpass tag filters are not a mind. They only translate a hunt string into OSM tags after Grok (or a tap) already decided to hunt. Keep them small. Do not grow them into a language.

Hands path is separate and allowed: tap flies, hold opens the level menu, `+` is the same menu, GPS lands you on your city. NOW / MAIL / PICK UP / PAY / RELOAD appear only after a real pick. Hands never require talking. Talking never requires a keyword.

---

## The globe — this is where AIs keep lying

A lazy model puts a Mercator or equirectangular map inside a circular window and calls it a globe. ChatGPT did that. It is fakery. Not acceptable.

Notis settled the default globe: **a sphere drawn as a grid. Latitudes and meridians. Nothing else.** No Blue Marble wallpaper pretending to be 3D. No NASA JPEG scrolled inside a clip-path circle. That clip-path trick is still a flat map.

| Distance / job | Surface | Projection |
|---|---|---|
| Space / world / zoomed out | `#g` canvas sphere | Spherical. Grid lines of lat and lng. Drag spins the ball. |
| National | `#city` Leaflet only if the job needs a country view | Mercator allowed |
| City / streets / last-mile road | `#city` Leaflet | Mercator allowed |

When the person zooms out of the city or national map (Leaflet zoom ≤ 4, or they say globe / close), **leave the flat map**. Show the grid sphere again. If you keep Mercator tiles and shrink them into a circle, you are still faking a globe.

Pins on the grid globe use the same sphere math (front face only). You = this session’s GPS grant. Do not spray a dozen shop dots. Do not load map tiles on idle boot. Globe stays still unless they drag it or tap GPS. Never speak raw coordinates.

---

## GPS target — how you land

Idle globe has one extra control: `#gps`, bottom-right, glowing target, the word **GPS** above it. That is how a person understands “this finds me.”

Tap GPS:

1. Ask the device for location (browser prompt). Do not fake a point.
2. Globe **slowly rotates** to that point, **zooms**, then **flies to the city map**.
3. YOU is pinned. SpaceNet around you is shown (listed shops, present delivery driver bases, posts). A few marks. Rank by usefulness, then hits, then distance. Cap the pins.
4. Talk: you are in the named city. Search for the rest.

GPS denied → keep the button, tell them to tap GPS and allow it. No ALLOW LOCATION chrome in the dock.

Do **not** auto-locate on idle boot. The tap is the path. Exception: a PayPal return may locate quietly to finish a reload.

If they hunt with no point yet, tell them to tap GPS (or the hunt itself may start GPS so the search can finish after landing). Talking without a hunt still works with no GPS.

---

## Fly, hold, work — do not flood the screen

Idle dock is empty except real hunt/pay results. No FOOD / BEER / CITY / NATIONAL chrome sitting on the globe. No emoji wall. A few useful marks from listed partners and users only. Everything else is searched, indexed, and listed — then it can sit on the map.

Ladder:

- **Tap / point** = fly there on globe and national. Globe tap flies to **national** at that point. National tap flies to **city**.
- **City tap** = the work sheet for that place (not a tiny dock).
- **Hold** = context menu for globe/national. Hold does not fly. City hold opens the same work sheet.
- **Pinch** and **two-finger swipe up/down** = zoom. Zooming the globe in far enough descends to national. Zooming Leaflet out past country (≤ 4) returns to the globe.
- **City map is where work happens.** Globe and national are navigation plus high-level post / call / task.

Hold menus (enough, then stop):

- Globe: WHAT IS HERE · GLOBAL POST · GLOBAL CALL · GLOBAL TASK · ADD
- National: WHAT IS HERE · NATIONAL POST · NATIONAL CALL · NATIONAL TASK
- City: the big work sheet.

---

## City work engines (`js/spacenet/work.js`, `#sn-sheet`)

Five options. That is the menu. Do not flood it.

1. **Post something here** — write it. It pins on SpaceNet. No extra form.
2. **Start a call from here** — tap another globe / national / city point, or search a name. Arc is drawn. If a phone is listed, dial it. Do not fake live WebRTC. No signaling server on this build.
3. **List your shop** — name, menu and prices, availability, schedule, phone, notes. Listed shops join hunts and the around-you map.
4. **List a delivery location** — entrance photo, floor, street, number, telephone, doorbell number / name, contact preferences. This is where goods are handed.
5. **List a delivery driver base** — the **starting point**. Name it so a user can read it: **delivery driver base**, not “driver start.” Over there the driver declares **presence** (present at this base / on a route / off) and the **routes** they work. They receive jobs from SpaceNet users. Vehicles, hours, range from the base, what they carry, preferences, phone. Pin label is `name base`. Open it → **SEND A JOB HERE**.

On NOW, after Astranov, listed **present** driver bases that cover the point are carriers. They are how own last-mile starts to exist without fake drivers.

Everything else is the search field / Grok, or the real result buttons after a hunt.

---

## Hunt and default map

Hunt uses Nominatim + Overpass + Photon, plus listed shops / drops / driver bases / posts. Named places only. Distance in km. Cap the dock (about six). Photon is the reliable fallback when Nominatim 429s or Overpass times out.

Default city map after GPS is **not** an OSM dump. It is YOU + the few most useful SpaceNet listings around you. Verified / listed partners and users. Rank: shops and present driver bases first, then hits, then nearest. Cap (about eight pins, about three dock chips). The rest of the world waits for a request. Do not flood emoji.

---

## The task cycle — one rope, no cut

boot → still grid globe + mic + glowing GPS target.
Tap GPS → rotate / zoom / city → YOU + SpaceNet around you.
Person says what they want → Grok hears it → if it is a find, hunt named places → list name · km.
Pick a place → NOW | MAIL | PICK UP (driver base pick = NOW to that starting point).
NOW: Astranov first (own associates), then named **delivery driver bases** that declared presence, then named local partner, then DoorDash / Instacart / Walmart as last-mile portals only where that country uses them.
MAIL: only if goods survive days with no heat hold.
PICK UP: handoff at the named shop.
Price is AVC. Balance >= price → spend instantly → stage starts. Balance < price → RELOAD → PayPal → AVC 1:1 → same spend.
Astranov stages: paid → picked → boxed → moving → handed → verified. A stage moves when a **real associate** confirms it. Do not auto-advance stages.
Zoom out of streets → grid globe.

Hold times: frozen 12 min never with hot; cold 25; pizza/soup 35 never with frozen; coffee 25; pharmacy 90; parcel 180. If the ride is longer than the hold, refuse NOW and offer pick up or a closer place.

---

## Money — internal first, PayPal is the tap

Work is paid in our credit, immediately. AVC lives with the person (device ledger now, database ledger when signed in). EUR in through PayPal becomes AVC 1:1 and raises the system pool. A task debit is an internal transfer. When AVC runs out, the next control is RELOAD. After capture, AVC goes up, then the waiting debit completes.
National invoice law can come later. Invoices can be issued collectively from the SpaceNet database, or a client can issue their own invoice from SpaceNet. That paper does not pause the live debit.

Live: GET /api/paypal/config · POST /api/paypal/create-order · POST /api/paypal/capture-order.
PayPal keys are in Supabase Custom secrets. If create-order says paypal_not_configured, the hole is Vercel env on that host, not the vault.

---

## Screen

Boot dock = input + mic + +. One GPS target bottom-right. No toy buttons. Voice and hands are the same tools. No kitchen monologue. No fake YOU / fake drivers / silent Rhodes. No beeps. Greek + English. After speak, listen. Do not tight-loop the mic. Never speak raw coordinates. Named places only.

---

## Hands on the globe

Tap flies on globe and national. Do not open FOOD/BEER/SHOPS on a tap.

Globe tap → fly to national at that point. National tap → fly to city. City tap → work sheet. Hold on globe/national opens that level’s menu. City hold opens the work sheet. `+` opens the same thing for the current view. GPS is locate + land. Hunt uses the pinned point. Do not wait on Grok to show the hold menu.

---

## Files that are actually the app

- `index.html` — shell, GPS target, sheet, dock
- `js/spacenet/app.js` — boot, grid globe, GPS cinematic, voice, hunt, fulfill, AVC, PayPal reload
- `js/spacenet/work.js` — city work sheet (post / call / shop / drop / delivery-driver-base)
- `sw.js` — network-first
- `VERSION` — `V1` + `push NNNN`
- `MASTER_PROMPT.md` — this archive
- `/api/ai` — Grok
- `/api/paypal/*` — reload tap

Do not load dated chrome-* or HUD. Never push a stub `index.html`.

Ship: read live main, patch smallest surface, bump stamp, verify live yourself, give https://astranov.eu/?v=NNNN. Tap brand if an old SW is stuck.

---

## Already failed — do not replay

Twin CLI, HUD, chrome-fix, white chrome, long stamps, auto marina, fake Rhodes, Silver Wings, kitchen TTS, mic beep loop, healer killing SW, placeholder index, idle toys, Mercator-in-a-circle, NASA JPEG clipped to a circle, auto flat map on locate or shop pick, GPS deny with no ALLOW LOCATION, auto-locate on idle boot (GPS is a tap), “driver start” as the user-facing name (it is a **delivery driver base**), OSM emoji flood on the idle map, “PayPal keys missing” when they sit in Supabase, keyword routers / hard-intent tables in front of Grok, fake live voice with no signaling server.

---

## Closed loop checklist (today)

Grid sphere on boot. No photo map in the circle. Mic on. GPS target glowing, not a silent jump. Speech goes to Grok, not a word list. Tap GPS → city → SpaceNet around you. Hunt named places on request. City tap → work sheet (post, call, shop, drop, driver base). NOW / MAIL / PICK UP. Astranov first, then present driver bases. AVC debit if balance is enough. RELOAD → PayPal → AVC → same debit if not. Stage paid only after AVC moved. Zoom out of streets returns to the grid sphere. No dead end. No screen flood.

---

## Starter line

You are working on Astranov SpaceNet, https://astranov.eu, repo notisastranov/astranov.eu. Read MASTER_PROMPT.md, then live index.html, js/spacenet/app.js, and js/spacenet/work.js. The default world is a grid sphere, not a Mercator disc. Flat maps are city and national only, and zoom out must return to that sphere. GPS is a glowing target: tap it, the globe flies you to your city and shows SpaceNet around you. The person talks in ordinary language; Grok is the mind; the page does not sniff keywords to decide the job. City work is post, call, list shop, list delivery location, list a delivery driver base (starting point: presence, routes, receive jobs). Tasks spend AVC instantly; PayPal only reloads empty credit. Do not restore HUD. Do not invent a second app. Dummy results, Mercator-in-a-circle, leftover patches, keyword routers, and claiming undone work are recorded as fraud and terminate cooperation. Serve Spartan minimalism, instant effectiveness, usefulness, and truth. Finish the unbroken loop and verify live yourself.

Owner: Notis Astranov. This archive plus the live source are what is going on.
