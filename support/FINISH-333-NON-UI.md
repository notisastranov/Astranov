# FINISH-333 — Non-UI backlog to complete Astranov

**UI freeze:** no scrolls/chrome/HUD work in this program.  
**Count:** 333 suggestions  
**Implemented this ship (core engine):** **159/333** marked `SHIPPED_CORE` in `FINISH-333-STATUS.json`  
**Remaining:** platform/VPS/Places keys/multi-device live mesh still need ops + more code passes  

**New modules:** `js/spacenet/order-engine.js` · `js/spacenet/greeklish.js`  
**Tests:** `npm run test:engine`  
**CLI:** `ready score` · `orders pause|resume` · `ledger` · `order events` · `route test`

---

| # | Domain | Suggestion |
|---|--------|------------|
| 1 | delivery | Formalize order state machine: draft→paid→seeking_driver→assigned→picked_up→en_route→delivered→settled→cancelled |
| 2 | delivery | Idempotent placeOrder with client_request_id to prevent double debit |
| 3 | delivery | Persist active orders to localStorage + Supabase orders table always |
| 4 | delivery | Hard fail live order if GPS accuracy > 150m without YES confirm |
| 5 | delivery | Unify market ETA with SNRouting OSRM durationS (single source of truth) |
| 6 | delivery | Include multi-stop OSRM duration not haversine-only etaWithStops |
| 7 | delivery | Pre-arrival notify at T-5 and T-1 minutes with idempotent flags |
| 8 | delivery | Cancel path: full refund seeking; net-of-vault en_route; block after delivered |
| 9 | delivery | Auto-expire seeking_driver after N minutes → refund or rebroadcast |
| 10 | delivery | Order event log append-only (status transitions + timestamps) |
| 11 | delivery | Cart line-items snapshot frozen at pay (immutable receipt) |
| 12 | delivery | Receipt object exportable JSON for CLI receipt <id> |
| 13 | delivery | Platform fee 3% minimum 0.01 AC already — document + test matrix |
| 14 | delivery | Driver cut 15% paid only on complete — never early |
| 15 | delivery | Vendor cut = total − vault − driver — settle atomic |
| 16 | delivery | Reject order if vendor closed (opening_hours now) |
| 17 | delivery | Reject order if vendor > MAX_SHOP_KM even after soft widen |
| 18 | delivery | Live mode forbid synthetic kitchen_* vendors |
| 19 | delivery | test mode flag isolated namespace sn:test-mode-v1 never leak live |
| 20 | delivery | first delivery coach steps return machine-readable step ids |
| 21 | delivery | parseFoodIntent: Greeklish pizza/pitogyra/mpyronia/souvlaki expansion |
| 22 | delivery | parseFoodIntent: quantity + party size company parsing |
| 23 | delivery | Lazy judge meal uses prefs + last orders not random |
| 24 | delivery | Menu ensureFoodMenu marks synthetic slots source=price_band |
| 25 | delivery | Prefer real menu items when Places/crawl filled |
| 26 | delivery | Rank vendors: open × rating × price × distance weighted SPECS |
| 27 | delivery | Suggest top-3 always with scores in CLI summary |
| 28 | delivery | Browse-only pizza must not auto-pay |
| 29 | delivery | autoOrder only on explicit order me / ORDER ME / first delivery |
| 30 | delivery | Soft home Rhodes only when softHome/test flags set |
| 31 | delivery | Never use globe camera lat/lng as delivery pin |
| 32 | delivery | After pay call SNMeshOrders.afterLocalOrder always |
| 33 | delivery | afterLocalOrder retry 3× exponential backoff |
| 34 | delivery | Store network order id on task when intake succeeds |
| 35 | delivery | Map route startDeliveryRoute only after paid+task |
| 36 | delivery | delivery DNA: picked_up status when driver confirms pickup CLI |
| 37 | delivery | deliver me requires claimed/in_progress by me or assigned driver |
| 38 | delivery | Partial refund support for missing items (ledger reason codes) |
| 39 | delivery | Order timeout watchdog interval 60s |
| 40 | delivery | Multi-item cart same vendor only validation |
| 41 | delivery | Cross-vendor cart reject with clear error |
| 42 | delivery | VAT/tax field stub 0 for GR future |
| 43 | delivery | Currency display always AC/S consistent format |
| 44 | delivery | Go-live checklist CLI: go live status all green/red |
| 45 | delivery | Smoke path script: locate→shops→order→assign→route→settle without UI |
| 46 | driver_mesh | pickBestDriver: weight distance*10 + cargo*28 configurable |
| 47 | driver_mesh | cargoLoad counts only open/claimed/in_progress deliveries |
| 48 | driver_mesh | Exclude offline drivers driverOnline false |
| 49 | driver_mesh | Exclude self as driver in live mode unless allowSelfCourier |
| 50 | driver_mesh | Driver online heartbeat TTL 5 min auto-offline |
| 51 | driver_mesh | Claim is optimistic-lock: only one claimer wins |
| 52 | driver_mesh | Re-claim same driver allowed; steal claim forbidden without force |
| 53 | driver_mesh | Mesh pullOpenOrders debounce 15s |
| 54 | driver_mesh | Mesh pull filter maxKm default 40 configurable |
| 55 | driver_mesh | Import network orders as net_* task ids stable |
| 56 | driver_mesh | Push local paid order to REST orders when schema present |
| 57 | driver_mesh | order-intake edge: validate vendor UUID + items + drop latlng |
| 58 | driver_mesh | order-intake returns seeking_driver status always |
| 59 | driver_mesh | Driver CLI: task list · claim <id> · deliver me |
| 60 | driver_mesh | Channel manager link Wolt/eFood/Bolt/Uber external ids |
| 61 | driver_mesh | orchestrate external job → SNTasks delivery |
| 62 | driver_mesh | Multi-platform job de-dupe by externalId |
| 63 | driver_mesh | Driver capacity maxCargo default 4 |
| 64 | driver_mesh | Lightest cargo prefers 0 open tasks |
| 65 | driver_mesh | Nearest driver haversine then OSRM duration optional |
| 66 | driver_mesh | Broadcast seeking via live-bridge cmds |
| 67 | driver_mesh | Driver accept sound hook non-UI (Web Audio flag) |
| 68 | driver_mesh | Mesh peers presence for nearby drivers |
| 69 | driver_mesh | Driver earnings report CLI: driver earnings |
| 70 | driver_mesh | Vendor earnings report CLI: vendor earnings |
| 71 | driver_mesh | Assignment audit log driverId+taskId+score |
| 72 | driver_mesh | Fail soft if no mesh network — local order remains valid |
| 73 | driver_mesh | Periodic pullOpenOrders when driverOnline |
| 74 | driver_mesh | Map task markers from mesh without chrome changes |
| 75 | driver_mesh | Status seeking_driver visible in task list title |
| 76 | driver_mesh | Auto-assign if only one online driver within 3km |
| 77 | driver_mesh | Batch assign N drivers for multi-drop (coord need drivers) |
| 78 | driver_mesh | tasks.parseCoordination multi-user plan → role slots |
| 79 | driver_mesh | assign 2 drivers nearest command path |
| 80 | driver_mesh | coord pizza for 3 at my location creates client+vendor+driver slots |
| 81 | shops | Overpass timeout 8s live / 3.5s test |
| 82 | shops | Overpass query food amenity restaurant/fast_food/cafe |
| 83 | shops | Cache Overpass sector 10 min by geohash |
| 84 | shops | fromCrawlPlace never marks demo/npc |
| 85 | shops | Google Places enrich when key set only |
| 86 | shops | Places details: phone hours website rating photos |
| 87 | shops | Price-band menu slots honest not fake dish names |
| 88 | shops | fill shops CLI forces sector ensure + Places |
| 89 | shops | google shops alias fill |
| 90 | shops | Vendor photo urls stored https only |
| 91 | shops | Opening hours parse OSM + Google formats |
| 92 | shops | isShopOpenNow timezone Europe/Athens default |
| 93 | shops | Closed shops demoted not deleted |
| 94 | shops | Shop rating null → neutral score not zero |
| 95 | shops | Dedupe vendors by name+50m proximity |
| 96 | shops | Vendor id stable hash of source+ref |
| 97 | shops | Menu items availability flag in_stock |
| 98 | shops | Menu photo optional per item |
| 99 | shops | Force-fill empty menus via menu-request edge |
| 100 | shops | vendor-crawler edge schedule sector jobs |
| 101 | shops | Commerce.ensureSector idempotent |
| 102 | shops | Sector grid 1km cells |
| 103 | shops | POI outside MAX_SHOP_KM hard drop |
| 104 | shops | USA continent reject if user in GR (bbox sanity) |
| 105 | shops | Language names el/en dual fields |
| 106 | shops | Phone normalize E.164 when possible |
| 107 | shops | Website normalize https |
| 108 | shops | Cuisine tags for ranking food match |
| 109 | shops | Search.nearby race with timeout promise |
| 110 | shops | Fallback restaurant search if pizza empty |
| 111 | shops | Shop density metric for readiness |
| 112 | shops | Blacklist ghost OSM nodes without name |
| 113 | shops | Prefer shops with phone+hours for orderable |
| 114 | shops | Vendor tile data model full even if UI later |
| 115 | shops | Export vendors JSON CLI: vendors export |
| 116 | shops | Import vendor CSV admin CLI |
| 117 | shops | Business profile claim flow data-only |
| 118 | shops | Verify vendor role on listShop |
| 119 | shops | list shop creates vendor role profile |
| 120 | shops | menu add price validation >0 |
| 121 | routing | Always prefer SNRouting chain for deliveries |
| 122 | routing | Cache routes 4 min memory + meta LS |
| 123 | routing | Multi-stop OSRM single request not N segments when possible |
| 124 | routing | Traffic hour curve Athens-aware |
| 125 | routing | Weather mult from mesh hint only if present |
| 126 | routing | Straight fallback mark engine=straight |
| 127 | routing | Expose engine in delivery summary line |
| 128 | routing | route test CLI already — add route ab latlng |
| 129 | routing | Self-host osrmBase health probe hourly |
| 130 | routing | Gateway deploy documented in FINISH list |
| 131 | routing | Greece graph prepare on VPS runbook |
| 132 | routing | Rhodes default graph for owner sector |
| 133 | routing | Max 25 waypoints clamp |
| 134 | routing | Abort 10s routing |
| 135 | routing | Route geometry simplify for storage |
| 136 | routing | Persist last route on task.route |
| 137 | routing | ETA clock local timezone |
| 138 | routing | Speed km/h from duration for courier |
| 139 | routing | Re-route if driver detour >20% |
| 140 | routing | Table API for multi-driver ETAs later |
| 141 | routing | Match API snap pin to road |
| 142 | routing | Ferry edges allowed for islands |
| 143 | routing | Avoid motorway option for scooters profile later |
| 144 | routing | Bicycle profile stub config |
| 145 | routing | Walking last-meter estimate +3 min |
| 146 | routing | Polygon area unused for delivery skip |
| 147 | routing | Topo elevation gain soft ETA + |
| 148 | routing | Log routing errors to usage |
| 149 | routing | Circuit breaker after 5 public OSRM fails |
| 150 | routing | Prefer gateway when osrmBase empty |
| 151 | currency | Append-only ledger lines in SNCurrency |
| 152 | currency | Balance recompute from ledger option verify |
| 153 | currency | Mine rate persist device role aware |
| 154 | currency | RAID harvest higher with thermal cap |
| 155 | currency | Main device conservative harvest |
| 156 | currency | Secondary hot-swap low harvest |
| 157 | currency | Vault balance separate from user wallet |
| 158 | currency | Architect vault report CLI vault |
| 159 | currency | No free welcome top-up live |
| 160 | currency | test ready credits isolated test wallet key |
| 161 | currency | Debit fails atomic no partial fee |
| 162 | currency | Credit reasons enum |
| 163 | currency | Transfer peer-to-peer S CLI |
| 164 | currency | Escrow hold for order until deliver |
| 165 | currency | Release escrow on settle |
| 166 | currency | Refund reasons codes |
| 167 | currency | Double-entry: user/vault/driver/vendor accounts |
| 168 | currency | Currency format 2 decimals always |
| 169 | currency | Min mine tick interval |
| 170 | currency | Persist sessionMined |
| 171 | currency | Export ledger CSV |
| 172 | currency | Import forbid negative crafted balances live |
| 173 | currency | Fee takePlatformFeeFrom after debit |
| 174 | currency | Idempotent fee by order id |
| 175 | currency | Wallet low balance warning non-UI event |
| 176 | currency | Currency migration v1→v2 schema |
| 177 | currency | AC rename complete no Strand residue in code strings |
| 178 | currency | grep Strand cleanup non-UI strings |
| 179 | currency | Mining worker yield to main thread |
| 180 | currency | Donate compute opt-in terms gate |
| 181 | auth | Google GIS only — ban supabase OAuth redirect code paths |
| 182 | auth | Auth session refresh silent |
| 183 | auth | Profile upsert on login |
| 184 | auth | User latlng from GPS on login optional |
| 185 | auth | api.astranov.eu probe cache 5 min |
| 186 | auth | preferCustomAuth when health green |
| 187 | auth | Store provider sub on profile |
| 188 | auth | Logout clears sensitive caches not full wipe |
| 189 | auth | RLS policies document for orders/tasks |
| 190 | auth | Anon key never elevated |
| 191 | auth | Service role only edge |
| 192 | auth | Edge CORS allow astranov.eu |
| 193 | auth | Edge rate limit order-intake |
| 194 | auth | JWT verify on protected edges |
| 195 | auth | Email auth optional later |
| 196 | auth | Phone OTP later stub |
| 197 | auth | Session expiry handle 401 |
| 198 | auth | Multi-device same user profiles merge |
| 199 | auth | Avatar URL from Google |
| 200 | auth | Display name sanitize |
| 201 | auth | Auth errors map to CLI lines not UI modals |
| 202 | auth | OAuth branding checklist in SPECS ops |
| 203 | auth | Supabase custom domain DNS runbook |
| 204 | auth | Auth probe script in CI |
| 205 | auth | hard ban project-ref host in user-visible strings |
| 206 | ai | AI activate reply exactly I'm here once |
| 207 | ai | No monologue on listen start |
| 208 | ai | parsePlaceIntent only explicit go/fly |
| 209 | ai | Food path never SNGlobe.flyNear |
| 210 | ai | Mind memory permanent SNAstranovMind |
| 211 | ai | mind wipe confirmation double |
| 212 | ai | Memory write on successful order prefs |
| 213 | ai | Memory: favorite vendors |
| 214 | ai | Memory: home pin |
| 215 | ai | Memory: diet prefs |
| 216 | ai | Greeklish normalizer shared module |
| 217 | ai | Ancient Greek food words map small |
| 218 | ai | English food synonyms |
| 219 | ai | Reject junk fuzzy answers (Grok climb class) |
| 220 | ai | Brain law inject into free-ai prompts |
| 221 | ai | Usage flag firstDeliveryDone |
| 222 | ai | Handoff packet midnight Athens job data |
| 223 | ai | AI control: only SPECS commands |
| 224 | ai | Suggest list setSuggestList after food search |
| 225 | ai | Voice STT result route to same CLI parser |
| 226 | ai | TTS optional off by default street |
| 227 | ai | Dialect arcangelo optional |
| 228 | ai | AI never claim shipped |
| 229 | ai | AI never invent shops |
| 230 | ai | Confidence score on intents |
| 231 | ai | Fallback help when unknown |
| 232 | ai | Agent bridge phrases early in cli |
| 233 | ai | Agent note dual-write owner-inbox |
| 234 | ai | poll-bridge.mjs always-on docs |
| 235 | ai | AI graphics engine non-UI canvas API keep |
| 236 | ai | Helper wake on order only not chrome |
| 237 | ai | free-ai timeout 8s |
| 238 | ai | Stream reply chunking non-UI |
| 239 | ai | Local-first answer before network brain |
| 240 | ai | Edge brain function optional |
| 241 | ai | Prompt size cap |
| 242 | ai | PII strip before edge AI |
| 243 | ai | Order confirm language match user |
| 244 | ai | Multilingual CLI replies detect |
| 245 | ai | Safety: no payment without explicit order intent |
| 246 | tasks | Task kinds enum freeze |
| 247 | tasks | Task geo required for delivery |
| 248 | tasks | Task list filter status |
| 249 | tasks | Task get by id short |
| 250 | tasks | Coordination plan object versioned |
| 251 | tasks | Role slots client vendor driver |
| 252 | tasks | Fill slot with nearest matching profile |
| 253 | tasks | Score compatibility SNTaskBoard |
| 254 | tasks | Expire open tasks 24h option |
| 255 | tasks | Always_on delivery tasks |
| 256 | tasks | Task board advise traffic best-effort |
| 257 | tasks | Serialize tasks localStorage sn:tasks-v1 |
| 258 | tasks | Conflict free merge network vs local |
| 259 | tasks | Delete done tasks older 7d |
| 260 | tasks | Task title length clamp |
| 261 | tasks | Notes field max 500 |
| 262 | tasks | Attach items[] to delivery tasks |
| 263 | tasks | Attach fee fields platform driver vendor |
| 264 | tasks | CLI task list pretty machine + human |
| 265 | tasks | CLI task claim <id> |
| 266 | tasks | CLI task done <id> |
| 267 | tasks | Multi-user assign map peek data only |
| 268 | tasks | Plan of tasks from coord phrase |
| 269 | tasks | Train mind after coord success |
| 270 | tasks | Reject empty title tasks |
| 271 | tasks | Default duration 45m delivery |
| 272 | tasks | Priority field |
| 273 | tasks | Tags array |
| 274 | tasks | Search tasks by vendor name |
| 275 | tasks | Export tasks JSON |
| 276 | bridge | live-bridge.json schema version |
| 277 | bridge | notes[] required shape {text,from,at} |
| 278 | bridge | cmds[] executed safely allowlist |
| 279 | bridge | bridge test roundtrip status |
| 280 | bridge | bridge publish fail soft log |
| 281 | bridge | owner-inbox.json durable |
| 282 | bridge | Agent poll every turn docs AGENTS |
| 283 | bridge | coders-bridge edge align |
| 284 | bridge | debug-write kind live_bridge |
| 285 | bridge | Seq monotonic |
| 286 | bridge | Reject huge payloads >50kb |
| 287 | bridge | Bridge auth optional secret later |
| 288 | bridge | CLI agent <text> always works logged-in |
| 289 | bridge | CLI fix <text> alias agent |
| 290 | bridge | Grok bridge status includes last poll age |
| 291 | bridge | Persist last bridge ok timestamp |
| 292 | bridge | Retry publish 3× |
| 293 | bridge | Mirror to sessionStorage backup |
| 294 | bridge | No UI dependency for bridge |
| 295 | bridge | Escalation auto on false ship rule already |
| 296 | integrity_ops | Zod-like runtime validate order payload |
| 297 | integrity_ops | Geohash helpers shared spatial.js |
| 298 | integrity_ops | Haversine single implementation shared |
| 299 | integrity_ops | Remove duplicate haversine copies gradually |
| 300 | integrity_ops | Boot WAVE soft-fail already — keep |
| 301 | integrity_ops | Defer heavy market-live until idle |
| 302 | integrity_ops | Index profiles by role in memory map |
| 303 | integrity_ops | Vendor spatial index simple grid |
| 304 | integrity_ops | Throttle search.nearby concurrent 2 |
| 305 | integrity_ops | AbortController all network |
| 306 | integrity_ops | Service worker cache js/spacenet hashed |
| 307 | integrity_ops | build stamp on all scripts |
| 308 | integrity_ops | Typecheck-free JSDoc on SNMarket public API |
| 309 | integrity_ops | Unit tests node for parseFoodIntent |
| 310 | integrity_ops | Unit tests placeOrder fee math |
| 311 | integrity_ops | Unit tests pickBestDriver ranking |
| 312 | integrity_ops | Unit tests routing pathFromWaypoints |
| 313 | integrity_ops | E2E headless delivery smoke script |
| 314 | integrity_ops | prod-verify includes route test |
| 315 | integrity_ops | CI workflow github actions node tests |
| 316 | integrity_ops | Security: sanitize CLI HTML in log (text only) |
| 317 | integrity_ops | Security: no eval |
| 318 | integrity_ops | Security: CSP document non-UI headers vercel.json |
| 319 | integrity_ops | vercel.json headers X-Content-Type-Options |
| 320 | integrity_ops | Rate limit client order attempts 5/min |
| 321 | integrity_ops | Secrets never in SPECS logs |
| 322 | integrity_ops | PII minimize in usage export |
| 323 | integrity_ops | Error boundaries console only non-UI |
| 324 | integrity_ops | Feature flags localStorage sn:flag-* |
| 325 | integrity_ops | Kill switch live orders sn:orders-paused |
| 326 | integrity_ops | Readiness score CLI ready score |
| 327 | integrity_ops | FINISH-333 checklist auto tick when tests pass |
| 328 | integrity_ops | SPECS sync when owner verifies |
| 329 | integrity_ops | Continuity.js mirror critical laws |
| 330 | integrity_ops | Nightly usage export packet |
| 331 | integrity_ops | Spartan: delete dead legacy imports from boot |
| 332 | integrity_ops | Document law: UI freeze while finish engine |
| 333 | integrity_ops | Ship honesty: list remaining platform gaps OAuth OSRM VPS Places key |
