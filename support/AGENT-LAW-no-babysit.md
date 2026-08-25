# AGENT LAW — the app lives by itself

**Owner 2026-08-25:** Run with no sticks on both. Do not need babysitting. The application has to live by itself. The AI from inside the application should defend it, keep it updated to user demands, and keep it fast.

## No sticks

- If Vercel production is frozen, Cloudflare worker `astranov-live` serves `index.html` + `/js/spacenet/*` from GitHub `main` (raw), `/api/*` still origin.
- Healer loads same-origin JS then jsDelivr `@main`.
- Inline globe+Grok fallback if OS dies.
- In-app Grok (`SN.patch`) applies ```js``` from replies. `defend()` every 12s + on tab focus: resize, wake if silent.

## Do not

- Wait for the owner to hard-refresh, delete cache, or tell us the host is stuck.
- Restore os-bootloader / dual-CLI.
- Print secret values.
