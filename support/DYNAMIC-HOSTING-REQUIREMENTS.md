# Dynamic hosting — requirements

**Status:** owner law · first tenant = SpaceNet  
**Live proof:** https://astranov.eu  
**Repo:** https://github.com/notisastranov/astranov.eu  
**Date:** 2026-08-18  

A **dynamic host** is a plane where the running application is the source of truth, git is the ledger, and human + in-app AI + coding agent + usage share one inbox. Static CDNs are the fallback, not the product.

If a change is not on Earth (pin, arc, field object) within one guest session, the host failed.

---

## 0. Actors

| Actor | Role |
|---|---|
| Human architect | Signs money, identity, and law. Can freeze or rollback anything. |
| In-app unit (Grok bot) | Sees guests. Files faults. Runs `scenarios`. Speaks. |
| Coding agent (Grok Build) | Writes modules. Ships. Reads the inbox. |
| Guest / signed user | Uses the planet OS. Their session must not break mid-hop. |
| Host plane | Serves, patches, signs, rolls back, routes packets. |

No actor waits on a human to click Deploy for a safe module patch.

---

## 1. Product law the host must obey

1. SpaceNet depicts everything in space. Host objects are spatial (pin, arc, berth, route), not only files.
2. Street/satellite is a zoom-in. Cold start = PRESENT / live globe.
3. Collective intelligence: usage and failures become the next ship automatically.
4. Git is history. The live tree can move first.
5. Money, identity, and consent never hot-patch without the architect key.

---

## 2. Functional requirements

### F1 — Fluid runtime (MUST)

| ID | Requirement |
|---|---|
| F1.1 | Serve a named module graph (`/js/spacenet/*.js`) with per-module etag + hash. |
| F1.2 | Hot-swap one module without full reload when the export surface is compatible. |
| F1.3 | Incompatible export → soft reload of that stage only, keep CLI log + GPS + auth. |
| F1.4 | Patch latency p50 < 8s edge-to-client after a signed write; p99 < 30s. |
| F1.5 | Two clients on the same account converge to the same module set within 60s. |
| F1.6 | Offline / Starlink-gap: last good module set runs; queue patches. |

### F2 — Dual-write ledger (MUST)

| ID | Requirement |
|---|---|
| F2.1 | Every accepted patch writes (a) live object store and (b) a git commit on `main` or `live/*`. |
| F2.2 | Git commit message includes actor, scenario id, and inbox packet id. |
| F2.3 | If git is down, live write still lands and retries the ledger. |
| F2.4 | `astranov-build` stamp increments on every accepted patch. |

### F3 — Collective inbox (MUST)

| ID | Requirement |
|---|---|
| F3.1 | One inbox for unit notes, usage ships, scenario fails, architect chat. |
| F3.2 | Coding agent can `GET` inbox and `POST` ack + patch id. |
| F3.3 | Unit can `POST` a fault without GitHub credentials in the browser. |
| F3.4 | Open handoffs never silent-drop. Oldest open fault is visible on the globe as a pin. |
| F3.5 | `scenarios` / guest test results are first-class inbox kinds. |

### F4 — Space objects (MUST)

The host stores more than HTML.

| Kind | Payload | Live rule |
|---|---|---|
| Pin | lat, lng, label, owner | Visible on globe when created |
| Arc / hop | from, to, kind (call, research, order), live\|dim | Glow while live, dim on hangup |
| Harbor | berths, free/held | Mandraki-class object |
| Route | polyline or great-circle + Æ price | Shown in space, not only a list |
| Session | user, last pin, consent | Survives module swap |

F4.1 Street tiles are a zoom-in of a pin, never a new app.

### F5 — Identity, money, consent (MUST)

| ID | Requirement |
|---|---|
| F5.1 | Guest = Google + Cancel + `/privacy` + `/terms`. No owner runbooks. |
| F5.2 | Wallet ledger is server-side after sign-in. localStorage is cache only. |
| F5.3 | Æ = 1 EUR. One currency name. |
| F5.4 | Mine / donate CPU never starts on first paint. Explicit consent. |
| F5.5 | Hot-patch cannot change prices, fees, or keys without architect signature. |

### F6 — Mesh / any-path (SHOULD)

| ID | Requirement |
|---|---|
| F6.1 | Path order: Starlink → 5G → Wi-Fi → Bluetooth / Meshtastic → store-and-forward. |
| F6.2 | Packets < 1 KB (inbox ack, pin, hangup) must survive a 3G or radio hop. |
| F6.3 | Host does not assume a single origin. Apex + edge + peer cache are valid. |
| F6.4 | Diagnose path on boot only behind a link — never as the first screen. |

### F7 — Preview / agent seat (MUST)

| ID | Requirement |
|---|---|
| F7.1 | Coding agent has a live seat against the same module graph guests see. |
| F7.2 | Agent can apply a patch and see the globe within the F1.4 budget. |
| F7.3 | No “open localhost” contract. The architect watches the same Earth. |

---

## 3. Non-functional

| ID | Requirement |
|---|---|
| N1 | Cold start to interactive globe < 4s on a mid phone over Starlink-class 50 Mbps. |
| N2 | Module fetch uses immutable hashes; HTML is no-store. |
| N3 | Signed headers: CSP, Referrer-Policy, X-Content-Type-Options, Permissions-Policy. No `CORS *` on HTML. |
| N4 | Rollback to last good stamp in < 5s, one architect command. |
| N5 | Audit log: who patched what, from which inbox id, visible 90 days. |
| N6 | EU: consent, `/privacy`, `/terms`, data residency documented. |
| N7 | PWA: real icons, robots, no service worker that wipes all caches on every boot. |

---

## 4. Security

| ID | Requirement |
|---|---|
| S1 | Patches are ed25519-signed. Browser verifies before eval/swap. |
| S2 | Three keys: architect (root), agent (modules except money/auth), unit (inbox only). |
| S3 | Unit cannot write wallet or OAuth client config. |
| S4 | Agent cannot read raw refresh tokens. |
| S5 | Replay window 5 minutes. Hash-chained patches. |
| S6 | Secret material never in the module graph. |

---

## 5. What today’s stack is missing (gap)

| Today | Gap |
|---|---|
| Vercel static + git push | No live module swap; cache/Clear-Site-Data blunt |
| GitHub contents API as “deploy” | Human/agent waits; 503s; not a runtime |
| Supabase `debug-pub/live-bridge.json` | Inbox exists; not a patch plane |
| `os-bootloader` fetch+inject scripts | Works, but unsigned, no per-module rollback |
| localStorage wallet | Not a ledger |
| Dual apex / CF 403 on `api.astranov.eu` | Split brain |

The host we want **keeps** git + object storage + edge. It **adds** signed live swap, inbox→patch, spatial objects, and mesh.

---

## 6. Acceptance (SpaceNet is the test)

A host is ready when a guest, on a cold phone, can:

1. See PRESENT Earth in < 4s with no radio checklist.
2. Type `what is astranov` and get a CLI answer + optional Rhodes hop — no Iran village.
3. Tap Call and see **Sign in**, then after Google a YOU→Athens arc — no room-code sheet.
4. Type `scenarios` and watch pass/fail land in the inbox the coding agent reads.
5. Architect issues `rollback` and the previous stamp is on Earth in < 5s.

If it is not on the globe, it is not hosted.

---

## 7. Out of scope (v1)

- Multiplayer physics servers
- Unsolicited personal mail to unnamed SpaceX staff
- Claiming SpaceNet *is* SpaceX
- Mining guests’ CPUs as a default

---

## 8. Ask to SpaceX / xAI

Build this plane with us. First tenant: SpaceNet. Interfaces we will implement against: signed module PUT, inbox GET/POST, rollback, spatial object store. 30-minute working session with Starlink product, xAI product, or consumer surface.

Contact: notisastranov@gmail.com · https://astranov.eu
