# Connect X API keys securely (Astranov)

## Rule
**Never paste API secrets into this chat.**  
Live keys live only in **`.env.x`** (gitignored) on the build machine.

## Status (2026-08-02)

| Path | Status |
|------|--------|
| Grok **X Ads** connector | Connected, but **no ads account** returned |
| Organic post API | Needs Developer Portal keys in `.env.x` |
| Script | `node scripts/x-post.mjs` |
| Template | `.env.x.example` |

## Steps (owner · 5 min)

1. Browser: [developer.x.com](https://developer.x.com) as **@astranov97250**
2. Project → App → **User authentication** / permissions → **Read and write**
3. **Keys and tokens** → copy:
   - API Key
   - API Key Secret
   - Access Token
   - Access Token Secret  
   (Access token must say *Created with Read and Write*)
4. In sandbox / repo root only:
   ```bash
   cp .env.x.example .env.x
   nano .env.x   # paste four values, save
   node scripts/x-post.mjs --dry-run
   ```
5. When dry-run prints `verified @astranov97250`:
   ```bash
   node scripts/x-post.mjs "The internet as you know it is the old stack. Astranov SpaceNet = Real-Earth OS. https://astranov.eu"
   ```

## Optional: Ads path (Grok tools)

1. [ads.x.com](https://ads.x.com) → create ads account for @astranov97250  
2. Grok → reconnect **X Ads**  
3. Then agent can use `x_ads_*` tools (promoted posts; spend careful)

## Agent promise
- Will not print full secrets in logs or commits  
- Will not ask you to paste secrets in chat  
- Will only post when you ask (or after you confirm launch)
