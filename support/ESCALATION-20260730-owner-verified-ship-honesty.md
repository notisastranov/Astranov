# ESCALATION — Owner-verified law + false-ship honesty · 2026-07-30

**To:** Owner support / future agents  
**Owner email:** notisastranov@gmail.com  
**Live:** https://astranov.eu  
**Repo:** notisastranov/astranov.eu  
**Build (this ship):** `20260730520000-owner-specs-auth-cli`  
**Date:** 2026-07-30  

---

## Why this email exists

Owner law: **when the agent claims SHIPPED and the product is still broken, email support** so the owner/support can fix platform blockers and empower the agent.

Also: **SPEC UP all owner-verified progress the same day** — done in `SPECS.md` (section **Owner-verified progress log · 2026-07-30** + conflicting rows rewritten).

---

## Owner-verified laws locked in SPECS (do not regress)

| ID | Law |
|----|-----|
| OV-01 | Boot **GLOBAL Earth in space** — not city, not Rodos training |
| OV-02 | **No training sim** / sim-task train / Rodos training surface |
| OV-03 | **No map-corner Layers** under money HUD |
| OV-04 | **CLI text only** — no ribbon button flood · no feed chip tiles |
| OV-05 | Home **ASTRANOV** only |
| OV-06 | AI brand **Astranov** · **ASTRANOV LISTENING** |
| OV-07 | No junk free-mind answers (e.g. Grok → “climb”) |
| OV-08 | Login identity **astranov.eu / ASTRANOV** — never supabase project host |
| OV-09 | Splash **ASTRANOV** + horizontal deep blue loader |
| OV-10 | Globe **polar axis** spin (not clock Z) |
| OV-11 | Fast shell · `first delivery` · SETI `donate on` |
| OV-12 | False ship → **email + support/ESCALATION file** |

---

## Still RED / platform (agent cannot fully fix without owner infra)

### 1) Google login still can show supabase project host
- **Cause:** OAuth `redirect_uri` is server-side Supabase `{project}.supabase.co/auth/v1/callback` until Custom Domain is fully active.  
- **Probe:** `api.astranov.eu` returned **403** from agent network (Custom Domain not healthy).  
- **App change this ship:** `js/spacenet/auth.js` prefers **Google GIS + `signInWithIdToken`** so users avoid the authorize URL that leaks supabase host; UI copy scrubbed to **astranov.eu** only.  
- **Owner/support must:**
  1. Supabase Custom Domain **api.astranov.eu** activated (DNS **grey cloud**).  
  2. Google Cloud Branding app name **ASTRANOV**, domain **astranov.eu**, publish.  
  3. OAuth client origins: `https://astranov.eu` · redirect for custom domain callback.  
  4. Supabase Site URL + redirect allowlist: `https://astranov.eu/**`.  
  5. When custom domain works: set `SN_CONFIG.preferCustomAuth = true` and `sbUrl`/`authHost` to `https://api.astranov.eu`.

### 2) Live verification gaps (honest)
- Agent environment cannot fully drive Google consent UI on owner device.  
- Earth polar dual-axis / full day-close list may still need live spin test after push.  
- `first delivery` needs market on shell (config change this ship) — **owner should type `first delivery` once after hard refresh**.

---

## What this push intends (code)

- SPECS + continuity: owner-verified log + ship honesty email rule  
- CLI: ribbon buttons forced off (text CLI)  
- Splash: ASTRANOV + horizontal blue loader (in index if present)  
- Auth: GIS id_token path + scrub  
- Boot: market/usage on shell for first delivery  
- Config brand name ASTRANOV · ai Astranov  

---

## Support action checklist

- [ ] Confirm live hard refresh: no CLI button bar  
- [ ] Confirm splash ASTRANOV only  
- [ ] Confirm `first delivery`  
- [ ] Confirm Google login branding / GIS  
- [ ] Complete Custom Domain if supabase still visible  
- [ ] Empower agent with Custom Domain + Google branding complete so auth law is green  

---

**Rule for every future agent:**  
If you wrote “shipped” and the owner says it is still wrong → **update SPECS if owner locked law**, **write support/ESCALATION-*.md**, **email notisastranov@gmail.com**, keep fixing.
