# ESCALATION — marketplace coded, Vercel production frozen · 2026-08-25T02:12Z

**Owner words:** name what I want, find a real vendor, send the order to the vendor app, confirm payment, find me as driver, accept delivery, route to the client, play all roles, erase gold pool to 3 million, happen now.

**Live https://astranov.eu :** still `20260825045800-fix` (x-vercel-cache HIT). Last Production GitHub deployment: `85ae2ae` at 02:00:49Z. Later main SHAs (`c104ed8`, `ab97a32`, `2d31a69`) did **not** create Production deploys.

## What is on GitHub `main` (not on the domain)

- Name a thing (`pizza`) → OSM Overpass real vendors
- Order → **Pay** (client) → **Confirm** (vendor hat) → **Accept** (driver = you) → OSRM route → **Delivered** settle
- Gold pool **reset to 3,000,000 AVC** on `notis`
- Plus / mic→send still in that HTML

Build id: `20260825050800-loop`

## Probe

- GET / : 200 `20260825045800-fix`, age 400+, Vercel HIT, no Clear-Site-Data
- GET /api/ai : keyed, supabase-aicycle
- Production deploys stopped at 85ae2ae
- `secrets.VERCEL_TOKEN` authenticates as **`notisastranov-8109`**: teams=[], projects=0, deployments=0
- Workflow `vercel-prod.yml` run failed: `no astranov project`
- gh-pages files written; `https://notisastranov.github.io/astranov.eu/` = **404** (Pages not enabled)

## Root cause

The Vercel account that **serves astranov.eu** is not the account behind `VERCEL_TOKEN`. Auto production deploys stopped. This agent can merge GitHub. It cannot move the domain.

## Empowerment (do this)

1. Put the **real** `VERCEL_TOKEN` / `VERCEL_ORG_ID` / `VERCEL_PROJECT_ID` for the project whose domains are `astranov.eu` + `www`.
2. Trigger one production deploy of `main` (SHA with `20260825050800-loop`).
3. Keep Git integration deploying Production on every `main` push.
4. Ban restoring os-bootloader/dual-CLI.

Until that token is the real project, **no amount of GitHub merges will change what the owner sees on the phone.**
