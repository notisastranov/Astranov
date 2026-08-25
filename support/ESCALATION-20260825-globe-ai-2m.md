# ESCALATION — globe dead · AI silent · 2,000,000 AVC shows 200 · 2026-08-25T01:58Z

**Trigger:** Owner intervention (AGENT LAW).  
**Owner words:** “Still the globe doesn't start the AI doesn't start and my 2 million coins are simply not there only 200 is there”  
**Live at diagnose:** `20260825045500-law`  
**SHA at diagnose:** `e2ef4b3`  
**Product:** https://astranov.eu  

## Probe

| Check | Result |
|---|---|
| GET / | 200, `astranov-build=20260825045500-law`, Cache-Control no-store, **no** Clear-Site-Data, age 74, Vercel |
| GET /api/ai | keyed=true, **keyWhere=supabase-aicycle** (not vercel-env), model grok-4-1-fast-non-reasoning |
| POST /api/ai `ping` | 200 `Pong.` via xai-paid-fallback, ~seconds |
| GET /api/fail | 200 n=0 last=null (owner phone dump never arrived) |
| GET /js/spacenet/grid-os.js | 200 27978 bytes |
| sw.js | kill-switch, unregister only |
| SNHeal server | no client POST |

## Root causes (code, this agent)

1. **Globe** — custom WebGL path (`lookAt`/`persp`/`shader`) on Android. No Three.js. If `getContext('webgl')` fails or matrices are wrong, black canvas. IIFE throws → **wake() never runs**.  
2. **AI** — `/api/ai` works from curl. App boot is behind the globe constructor. Owner sees silence. First token still on Supabase hop.  
3. **2,000,000 AVC** — genesis is on `accounts.notis`. Island painted **`accounts.client` default 200**. Owner law was genesis **2,000,000 on Notis**. Agent put a fake 200 guest float on the chip.

## What was already tried (and failed the owner)

Grid landing, live OS, on-demand chrome, Three CDN (404), Clear-Site-Data, boot wipe, native WebGL, marketplace loop, healer. Owner still: no globe, no Grok, 200 coins.

## Fix in this turn (must ship)

- 2D canvas lat/lng **grid** (no WebGL) so the globe starts on Android  
- `wake()` in its own try/catch, first  
- Ledger: floor/show **`notis` = 2,000,000 AVC**; debit `notis` on orders; format with thousands separators  
- File + mail this report  

## Empowerment still required

1. Vercel `XAI_API_KEY` (stop supabase-aicycle 6s)  
2. Production lock — no chrome-law restore  
3. Android Chrome/Opera session this agent can drive  
4. One TLS name for apex+www  
5. Ban SW on product (healer already blocks register; other agents can undo)

Do not call the app finished until the owner sees the grid, hears Grok, and sees **2,000,000 AVC**.
