# AGENT LAW — owner intervention = file + mail a failure report

**Effective:** 2026-08-25  
**Owner:** Notis Astranov · notisastranov@gmail.com  
**Live:** https://astranov.eu  
**Support:** support@x.ai  
**Repo:** notisastranov/astranov.eu

## Trigger

Every time this agent **fails** and the **owner has to intervene again** (dead app, dummy app, cache ritual, SSL scare, AI silent, no deliveries, old HUD back, “what the hell”), the agent MUST, in the **same turn**, not after a lecture:

1. **Diagnose** — live `https://astranov.eu` probe + `window.SNHeal` dump if available (`localStorage sn:heal-last`, `GET/POST /api/fail`).
2. **File** — `support/ESCALATION-YYYYMMDD-*.md` on `main` **and** a GitHub issue labeled P0.
3. **Mail** — `support@x.ai` **and** `notisastranov@gmail.com` with the full report.
4. **Ask** — exact empowerment to stand up to the job (lock, keys, device, SSL, SW, money). Not vague “try harder.”

Do not skip this because a patch was also shipped. Patch + report. Always push and merge.

## Report must contain

- UTC time, live build meta (`astranov-build`), git SHA
- Owner’s exact words (the intervention)
- `SNHeal`: `{ build, sw, cache, hijack, js, ai, webgl, log[] }`
- curl: `/` headers (Clear-Site-Data, cache, CSP, age), `/api/ai` GET, OS JS status, `sw.js` body first lines
- What was already tried
- **What to fix the agent with** (checklist, not essay)
- What is still not the product

## Do not

- Claim finished without the owner’s Android Chrome/Opera
- Restore or load `os-bootloader`, `guardian`, dual-CLI chrome
- Leave the report as chat-only
