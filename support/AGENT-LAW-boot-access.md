# AGENT LAW — full access check on every boot

**Owner 2026-08-25:** Always check you have full access to everything on boot.

## Agent boot (every session, before product work)

1. `GET https://astranov.eu/` → build meta live  
2. `GET https://astranov.eu/api/ai` → keyed  
3. `POST https://lkoatrkhuigdolnjsbie.supabase.co/functions/v1/access-boot` → secret **names** present (`VERCEL_TOKEN`, `XAI_API_KEY`, `CLOUDFLARE_API_TOKEN`, PayPal, Groq, Gemini, OpenRouter). Never print values.  
4. If a required name is missing: **set it** from GitHub into Supabase (`sync-supabase-secrets.yml`). Do not say “no access.”  
5. Tokens live in **Supabase secrets**. That is the store.

## App boot (phone)

Healer already wipes SW/cache. It must also call `access-boot` and `/api/ai`. Dot green only if JS + AI + secrets probe are ok.

## Do not

- Skip this because the last session “already knew.”  
- Log secret values.  
- Treat GitHub personal Vercel (0 projects) as the product host without checking `access-boot.vercel`.
