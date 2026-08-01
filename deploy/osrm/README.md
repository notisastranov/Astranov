# Astranov self-hosted OSRM

Gives Astranov **real street routing** under your control (no public demo rate limits).

## 1. VPS

- Ubuntu 22.04+ · Docker · 4–8 GB RAM · 20+ GB disk  
- Open port **5000** (or put Nginx TLS in front as `https://osrm.astranov.eu`)

## 2. Build graph (once)

```bash
cd deploy/osrm
./prepare.sh          # downloads Greece · extract · partition · customize
docker compose up -d
```

Expand later: replace PBF with `europe-latest` or a custom bbox.

## 3. Point Astranov at it

### A) Frontend config (`js/spacenet/config.js`)

```js
routing: {
  osrmBase: 'https://osrm.astranov.eu', // your host — no /route suffix
  useGateway: true,
}
```

### B) Supabase secret (gateway — preferred)

```bash
supabase secrets set OSRM_URL=https://osrm.astranov.eu
supabase functions deploy osrm-route
```

Clients call `…/functions/v1/osrm-route` first; gateway uses your OSRM and falls back to public if down.

## 4. Nginx TLS sketch

```nginx
server {
  server_name osrm.astranov.eu;
  location / {
    proxy_pass http://127.0.0.1:5000;
    proxy_set_header Host $host;
  }
}
```

## 5. Health

```bash
curl -s 'https://osrm.astranov.eu/route/v1/driving/28.2176,36.4341;28.22,36.44?overview=false'
# CLI in app: route test
```
