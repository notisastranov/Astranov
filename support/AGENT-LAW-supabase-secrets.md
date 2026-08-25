# AGENT LAW — all tokens live in Supabase secrets

**Owner, repeated:** every token is in Supabase secrets. Do not look at empty GitHub personal Vercel accounts and say we have no access.

**Project:** `lkoatrkhuigdolnjsbie`  
**List:** `supabase secrets list --project-ref lkoatrkhuigdolnjsbie`  
**Use:** edge `Deno.env.get("NAME")` or `GET https://…/functions/v1/vercel-push` (names only in logs, never values).

## Required names

`VERCEL_TOKEN` `VERCEL_ACCESS_TOKEN` `XAI_API_KEY` `CLOUDFLARE_API_TOKEN` `OPENAI_API_KEY` `ANTHROPIC_API_KEY` `OPENROUTER` `GEMINI_API_KEY` `GROQ_API_KEY` `PAYPAL_*` `SUPABASE_*` `CODERS_BRIDGE_SECRET`

If a name is missing, **set it** from GitHub Actions secrets (`sync-supabase-secrets.yml`). Do not invent “we don’t have Vercel.”

## 2026-08-25 probe (before sync)

Edge names had PayPal, XAI, Groq, Gemini, OpenRouter, Supabase keys. **No `VERCEL_TOKEN`.**  
`SUPABASE_SECRET_KEYS.default` is `sb_s…` (Supabase secret key, 41 chars), not Vercel.  
GitHub `secrets.VERCEL_TOKEN` exists (account `notisastranov-8109`). Sync writes that name into Supabase so owner law holds.

Never print secret values.
