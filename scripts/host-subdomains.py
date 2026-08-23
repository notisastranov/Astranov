#!/usr/bin/env python3
"""Deploy investors + exchange to Vercel and point Cloudflare CNAMEs."""
import json, os, urllib.request, urllib.error, pathlib, base64

def http(method, url, body=None, headers=None):
    hdrs = dict(headers or {})
    data = None
    if body is not None:
        data = json.dumps(body).encode()
        hdrs.setdefault("Content-Type", "application/json")
    req = urllib.request.Request(url, data=data, headers=hdrs, method=method)
    try:
        with urllib.request.urlopen(req, timeout=90) as r:
            return r.status, json.loads(r.read().decode() or "{}")
    except urllib.error.HTTPError as e:
        raw = e.read().decode(errors="replace")
        try:
            j = json.loads(raw)
        except Exception:
            j = {"raw": raw[:800]}
        return e.code, j

def collect(dir_):
    files = []
    root = pathlib.Path(dir_)
    for p in root.rglob("*"):
        if not p.is_file():
            continue
        rel = "/" + str(p.relative_to(root)).replace("\\", "/")
        raw = p.read_bytes()
        if p.suffix.lower() in {".png", ".jpg", ".jpeg", ".webp", ".gif", ".ico"}:
            files.append({"file": rel, "data": base64.b64encode(raw).decode(), "encoding": "base64"})
        else:
            files.append({"file": rel, "data": raw.decode("utf-8", "replace")})
    return files

def deploy(vh, name, directory, domain):
    files = collect(directory)
    print("files", name, len(files), [f["file"] for f in files])
    body = {
        "name": name,
        "files": files,
        "projectSettings": {"framework": None},
        "target": "production",
    }
    st, d = http("POST", "https://api.vercel.com/v13/deployments", body, vh)
    print("deploy", name, st, d.get("url") or d.get("id") or d.get("error") or str(d)[:400])
    pid = ((d.get("project") or {}) if isinstance(d.get("project"), dict) else {}).get("id") or name
    st2, add = http("POST", f"https://api.vercel.com/v10/projects/{pid}/domains", {"name": domain}, vh)
    print("domain", domain, st2, add.get("name") or add.get("error") or str(add)[:300])
    return d.get("url")

def main():
    tok = (os.environ.get("VERCEL_TOKEN") or os.environ.get("VERCEL_TOKEN2") or "").strip()
    vh = {"Authorization": "Bearer " + tok} if tok else {}
    print("vercel token len", len(tok))
    st, user = http("GET", "https://api.vercel.com/v2/user", headers=vh)
    print("vercel user", st, (user.get("user") or {}).get("username"), user.get("error"))
    if tok:
        deploy(vh, "astranov-investors", "investors", "investors.astranov.eu")
        deploy(vh, "astranov-exchange", "exchange", "exchange.astranov.eu")
    else:
        print("no vercel token")

    cf = (os.environ.get("CLOUDFLARE_API_TOKEN") or "").strip()
    if not cf:
        print("no cloudflare token")
        return
    ch = {"Authorization": "Bearer " + cf, "Content-Type": "application/json"}
    st, zones = http("GET", "https://api.cloudflare.com/client/v4/zones?name=astranov.eu", headers=ch)
    zone = (zones.get("result") or [{}])[0]
    zid = zone.get("id")
    print("zone", zid, zones.get("success"), zones.get("errors"))
    if not zid:
        return

    def upsert_cname(name, content, proxied=False):
        fqdn = name + ".astranov.eu"
        st, dns = http("GET", f"https://api.cloudflare.com/client/v4/zones/{zid}/dns_records?name={fqdn}", headers=ch)
        recs = dns.get("result") or []
        payload = {"type": "CNAME", "name": name, "content": content, "proxied": proxied, "ttl": 1 if proxied else 120}
        if recs:
            st, j = http("PUT", f"https://api.cloudflare.com/client/v4/zones/{zid}/dns_records/{recs[0]['id']}", payload, ch)
        else:
            st, j = http("POST", f"https://api.cloudflare.com/client/v4/zones/{zid}/dns_records", payload, ch)
        print("dns", name, "->", content, "proxied", proxied, st, j.get("success"), j.get("errors"))

    upsert_cname("investors", "cname.vercel-dns.com", False)
    upsert_cname("exchange", "cname.vercel-dns.com", False)
    st, w = http("GET", "https://api.cloudflare.com/client/v4/accounts/04faced90ecdb9aae7c15537751180da/workers/scripts", headers=ch)
    print("workers", st, w.get("success"), w.get("errors") or [s.get("id") for s in (w.get("result") or [])][:12])

if __name__ == "__main__":
    main()
