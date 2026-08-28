# ASTRANOV SPACENET — MASTER PROMPT
**What this file is:** the archive. One document so any AI can see what is actually going on. It is not a constitution, not a sermon, not a pile of “laws” to role-play. Read it, then read the live source, then change the smallest piece that is still broken.

**Date of this rewrite:** 2026-08-28
**Owner:** Notis Astranov · Rhodes, Greece · notisastranov@gmail.com · X @astranov97250
**Live:** https://astranov.eu
**Repo:** notisastranov/astranov.eu · `main`
**Bar text:** `ASTRANOV SPACENET GROK V1`
**Internal stamp at this rewrite:** 4003
**Today’s bar:** this product either works as a closed task-to-credit loop or we stop spending money on it.

Paste this file first. Then open live `index.html` and `js/spacenet/app.js`. Chat history is junk next to those two files plus this archive.

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

---

## What the thing is

SpaceNet is a standalone installable PWA. Grok is the mind inside it. Astranov is the intelligence and the own-service carrier. Notis is the architect.
It is not a chatbot page. It is not HUD. It is not twin CLI.

What the person sees: brand strip `ASTRANOV SPACENET GROK V1` (tap = wipe caches + unregister SW + reload); a **grid globe** on `#g`; one talk line, one mic, a `+`; buttons only when the next step needs them; `#city` hidden until a street or national job needs a flat map.

AVC = internal credit. Tasking spends AVC instantly. PayPal exists only to reload AVC when the balance is empty.

---

## How thinking works — no keyword router

Nobody ordered a command table. Do not add one.

The person talks or types in ordinary language. That text goes to Grok (`/api/ai`). Grok understands the request. If work on the world is needed, Grok returns a short act (`hunt`, `locate`, `now`, `mail`, `pickup`, `pay`, `reload`, `map`, `globe`, or just talk). The page then runs the matching tool. That is Grok deciding. That is not the page sniffing the user’s sentence for `pizza` / `locate` / `city` and short-circuiting the mind.

What the page may match without Grok:

- The word `reboot` (wipes cache).
- The exact name of a shop or carrier **already on screen**, so saying the name is the same as tapping the button.

What the page must not do:

- A dictionary of user phrases mapped to functions.
- “If the sentence contains food, hunt pizza.”
- Blocking conversation until GPS is granted. Hunt needs a point. Talking does not.
- Inventing a second parser, intent engine, CLI grammar, or “hard intent” table.

`goodsOf` and Overpass tag filters are not a mind. They only translate a hunt string into OSM tags after Grok (or a tap) already decided to hunt. Keep them small. Do not grow them into a language.

Hands path is separate and allowed: tap flies, hold opens the level menu, `+` is the same menu. NOW / MAIL / PICK UP / PAY / RELOAD appear only after a real pick. Hands never require talking. Talking never requires a keyword.

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

Pins on the grid globe use the same sphere math (front face only). You = this session’s GPS grant. Do not spray a dozen shop dots. Do not load map tiles on idle boot. Globe stays still unless they drag it. Never speak raw coordinates.

## Fly, hold, work — do not flood the screen

Idle dock is empty except ALLOW LOCATION until GPS is granted, and except real hunt/pay results. No FOOD/BEER/CITY/NATIONAL chrome sitting on the globe.

Ladder:
- **Tap / point** = fly there on globe and national. Globe tap flies to **national** at that point. National tap flies to **city**.
- **City tap** = the work sheet for that place (not a tiny dock). Post, call, list shop, list delivery location, list driver start.
- **Hold** = context menu for globe/national. Hold does not fly. City hold opens the same work sheet.
- **Pinch** and **two-finger swipe up/down** = zoom. Zooming the globe in far enough descends to national. Zooming Leaflet out past country (≤ 4) returns to the globe.
- **City map is where work happens** (post, call, shop, drop, driver, find, pay). Globe and national are navigation plus high-level post/call/task.

Hold menus (enough, then stop):
- Globe: WHAT IS HERE · GLOBAL POST · GLOBAL CALL · GLOBAL TASK · ADD
- National: WHAT IS HERE · NATIONAL POST · NATIONAL CALL · NATIONAL TASK
- City: the big work sheet, not the leftover tiny menu.

City work engines (`js/spacenet/work.js`, `#sn-sheet`):
- Post: write it. It pins on SpaceNet.
- Call: pick another globe/national/city point, or search a name. Arc is drawn. If a phone is listed, dial it. Do not fake live WebRTC.
- Shop: name, menu and prices, availability, schedule, phone. Listed shops join hunts.
- Delivery location: entrance photo, floor, street, number, telephone, doorbell number/name, contact preferences.
- Driver start: vehicles, hours, range, what to carry, preferences.

Everything else is the search field / Grok, or the real result buttons after a hunt. `+` opens the hold menu on globe/national, the work sheet on city. Hunt uses Nominatim + Overpass + Photon, plus listed shops/drops/drivers/posts.

---

## The task cycle — one rope, no cut

boot → mic + GPS → short status → listen. GPS denied → ALLOW LOCATION.
Person says what they want → Grok hears it → if it is a find, hunt named places (Nominatim + Overpass) → list name · km.
Pick a place → stay on grid globe → NOW | MAIL | PICK UP.
NOW: Astranov first (own associates), then named local partner, then DoorDash / Instacart / Walmart as last-mile portals only where that country uses them.
MAIL: only if goods survive days with no heat hold.
PICK UP: handoff at the named shop.
Price is AVC. Balance >= price → spend instantly → stage starts. Balance < price → RELOAD → PayPal → AVC 1:1 → same spend.
Astranov stages: paid → picked → boxed → moving → handed → verified. A stage moves when a real associate confirms it.
Streets map only if they ask map / streets / city / national, or when a paid own-service job needs the road. Zoom out → grid globe.

Hold times: frozen 12 min never with hot; cold 25; pizza/soup 35 never with frozen; coffee 25; pharmacy 90; parcel 180. If the ride is longer than the hold, refuse NOW and offer pick up or a closer place.

---

## Money — internal first, PayPal is the tap

Work is paid in our credit, immediately. AVC lives with the person (device ledger now, database ledger when signed in). EUR in through PayPal becomes AVC 1:1 and raises the system pool. A task debit is an internal transfer. When AVC runs out, the next control is RELOAD. After capture, AVC goes up, then the waiting debit completes.
National invoice law can come later. Invoices can be issued collectively from the SpaceNet database, or a client can issue their own invoice from SpaceNet. That paper does not pause the live debit.

Live: GET /api/paypal/config · POST /api/paypal/create-order · POST /api/paypal/capture-order.
PayPal keys are in Supabase Custom secrets. If create-order says paypal_not_configured, the hole is Vercel env on that host, not the vault.

---

## Screen

Boot dock = input + mic + +. No toy buttons. Voice and hands are the same tools. No kitchen monologue. No fake YOU / fake drivers / silent Rhodes. No beeps. Greek + English. After speak, listen. Do not tight-loop the mic.

---

## Hands on the globe

Tap flies on globe and national. Do not open FOOD/BEER/SHOPS on a tap.

Globe tap → fly to national at that point. National tap → fly to city. City tap → work sheet. Hold on globe/national opens that level’s menu (what is here / post / call / task / add). City hold opens the work sheet. `+` opens the same thing for the current view. Hunt uses the pinned point. Do not wait on Grok to show the hold menu.

---

## Files that are actually the app

index.html = shell. js/spacenet/app.js = boot, grid globe, voice, hunt, fulfill, AVC, PayPal reload. js/spacenet/work.js = city work sheet (post/call/shop/drop/driver). sw.js network-first. VERSION = V1 + push NNNN. MASTER_PROMPT.md = this archive. /api/ai = Grok. /api/paypal/* = reload tap.
Do not load dated chrome-* or HUD. Never push a stub index.html.

Ship: read live main, patch smallest surface, bump stamp, curl live yourself, give https://astranov.eu/?v=NNNN. Tap brand if an old SW is stuck.

---

## Already failed — do not replay

Twin CLI, HUD, chrome-fix, white chrome, long stamps, auto marina, fake Rhodes, Silver Wings, kitchen TTS, mic beep loop, healer killing SW, placeholder index, idle toys, Mercator-in-a-circle, NASA JPEG clipped to a circle, auto flat map on locate or shop pick, GPS deny with no ALLOW LOCATION, “PayPal keys missing” when they sit in Supabase, keyword routers / hard-intent tables in front of Grok.

---

## Closed loop checklist (today)

Grid sphere on boot. No photo map in the circle. Mic + GPS on boot. Speech goes to Grok, not a word list. Hunt named places. NOW / MAIL / PICK UP. Astranov first. AVC debit if balance is enough. RELOAD → PayPal → AVC → same debit if not. Stage paid only after AVC moved. Zoom out of streets returns to the grid sphere. No dead end.

---

## Starter line

You are working on Astranov SpaceNet, https://astranov.eu, repo notisastranov/astranov.eu. Read MASTER_PROMPT.md, then live index.html and js/spacenet/app.js. The default world is a grid sphere, not a Mercator disc. Flat maps are city and national only, and zoom out must return to that sphere. The person talks in ordinary language; Grok is the mind; the page does not sniff keywords to decide the job. Tasks spend AVC instantly; PayPal only reloads empty credit. Do not restore HUD. Do not invent a second app. Dummy results, Mercator-in-a-circle, leftover patches, keyword routers, and claiming undone work are recorded as fraud and terminate cooperation. Serve Spartan minimalism, instant effectiveness, usefulness, and truth. Finish the unbroken loop and verify live yourself.

Owner: Notis Astranov. This archive plus the live source are what is going on.
