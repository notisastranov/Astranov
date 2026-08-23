#!/usr/bin/env python3
"""Make exchange.astranov.eu and investors.astranov.eu the live hosts.

Orange-cloud through Cloudflare (TLS) and reverse-proxy to the globe origin
so the browser URL stays the subdomain — never a slash path.
"""
import json, os, urllib.request, urllib.error, pathlib, base64

ACCOUNT = "04faced90ecdb9aae7c15537751180da"
WORKER = r"""
addEventListener('fetch', event => {
  event.respondWith(route(event.request));
});

async function route(request) {
  const url = new URL(request.url);
  const host = (url.hostname || '').toLowerCase();
  let path = url.pathname || '/';
  let prefix = '';
  if (host === 'exchange.astranov.eu' || host.startsWith('exchange.')) prefix = '/exchange';
  else if (host === 'investors.astranov.eu' || host.startsWith('investors.')) prefix = '/investors';
  else return fetch(request);
  if (path === '/' || path === '/index.html') path = prefix + '/index.html';
  else if (!path.startsWith(prefix + '/') && path !== prefix) path = prefix + (path.startsWith('/') ? path : '/' + path);
  const dest = 'https://astranov.eu' + path + url.search;
  const headers = new Headers(request.headers);
  headers.delete('host');
  const init = { method: request.method, headers: headers, redirect: 'follow' };
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    init.body = request.body;
  }
  const res = await fetch(dest, init);
  const out = new Headers(res.headers);
  out.set('x-astranov-host', host);
  return new Response(res.body, { status: res.status, headers: out });
}
"""

SNIPPET = r"""
export default {
  async fetch(request) {
    const url = new URL(request.url);
    const host = url.hostname.toLowerCase();
    let path = url.pathname || '/';
    const prefix = host.startsWith('exchange.') ? '/exchange' : '/investors';
    if (path === '/' || path === '/index.html') path = prefix + '/index.html';
    else if (!path.startsWith(prefix)) path = prefix + path;
    const dest = 'https://astranov.eu' + path + url.search;
    const headers = new Headers(request.headers);
    headers.delete('host');
    return fetch(dest, { method: request.method, headers, redirect: 'follow' });
  }
}
"""


def http(method, url, body=None, headers=None, raw=None, content_type=None):
    hdrs = dict(headers or {})
    data = raw
    if body is not None:
        data = json.dumps(body).encode()
        hdrs.setdefault("Content-Type", "application/json")
    if content_type:
        hdrs["Content-Type"] = content_type
    req = urllib.request.Request(url, data=data, headers=hdrs, method=method)
    try:
        with urllib.request.urlopen(req, timeout=90) as r:
            txt = r.read().decode() or "{}"
            try:
                return r.status, json.loads(txt)
            except Exception:
                return r.status, {"raw": txt[:400]}
    except urllib.error.HTTPError as e:
        raw_txt = e.read().decode(errors="replace")
        try:
            j = json.loads(raw_txt)
        except Exception:
            j = {"raw": raw_txt[:800]}
        return e.code, j


def main():
    tok = (os.environ.get("VERCEL_TOKEN") or os.environ.get("VERCEL_TOKEN2") or "").strip()
    vh = {"Authorization": "Bearer " + tok} if tok else {}
    print("vercel token len", len(tok))
    st, user = http("GET", "https://api.vercel.com/v2/user", headers=vh)
    u = user.get("user") or {}
    print("vercel user", st, u.get("username"), u.get("id"), user.get("error"))
    st, teams = http("GET", "https://api.vercel.com/v2/teams", headers=vh)
    team_list = teams.get("teams") or []
    print("teams", st, [(t.get("id"), t.get("slug")) for t in team_list], teams.get("error"))
    st, tslug = http("GET", "https://api.vercel.com/v2/teams?slug=astranov", headers=vh)
    print("team slug astranov", st, tslug.get("id") or tslug.get("error") or tslug)

    team_ids = [None] + [t.get("id") for t in team_list if t.get("id")]
    if isinstance(tslug, dict) and tslug.get("id"):
        team_ids.append(tslug["id"])
    hit = None
    team = None
    for tid in team_ids:
        q = "?limit=100" + (("&teamId=" + tid) if tid else "")
        st, proj = http("GET", "https://api.vercel.com/v9/projects" + q, headers=vh)
        projects = proj.get("projects") or []
        print("projects", tid, st, [p.get("name") for p in projects[:20]], (proj.get("error") or {}).get("code"))
        for p in projects:
            name = (p.get("name") or "").lower()
            if "astranov" in name:
                hit, team = p, tid
                break
        if hit:
            break
        for guess in ("astranov", "astranov-eu", "astranov.eu", "astranov-astranov"):
            q2 = (("?teamId=" + tid) if tid else "")
            st, p = http("GET", f"https://api.vercel.com/v9/projects/{guess}" + q2, headers=vh)
            if st == 200 and p.get("id"):
                hit, team = p, tid
                print("guessed project", guess, p.get("id"))
                break
        if hit:
            break

    if hit and tok:
        pid = hit.get("id") or hit.get("name")
        qs = ("?teamId=" + team) if team else ""
        for domain in ("exchange.astranov.eu", "investors.astranov.eu"):
            st, add = http("POST", f"https://api.vercel.com/v10/projects/{pid}/domains" + qs, {"name": domain}, vh)
            print("add domain", domain, "to", pid, st, add.get("name") or add.get("error") or str(add)[:240])
    else:
        print("no vercel project to attach domains")

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

    def upsert_cname(name, content, proxied):
        fqdn = name + ".astranov.eu"
        st, dns = http("GET", f"https://api.cloudflare.com/client/v4/zones/{zid}/dns_records?name={fqdn}", headers=ch)
        recs = dns.get("result") or []
        payload = {"type": "CNAME", "name": name, "content": content, "proxied": proxied, "ttl": 1 if proxied else 120}
        if recs:
            st, j = http("PUT", f"https://api.cloudflare.com/client/v4/zones/{zid}/dns_records/{recs[0]['id']}", payload, ch)
        else:
            st, j = http("POST", f"https://api.cloudflare.com/client/v4/zones/{zid}/dns_records", payload, ch)
        print("dns", name, "->", content, "proxied", proxied, st, j.get("success"), j.get("errors"))

    # Orange-cloud so Cloudflare Universal SSL covers *.astranov.eu.
    # Grey CNAME to vercel-dns with no Vercel domain = dead TLS (handshake abort).
    # Worker fetches https://astranov.eu/investors|exchange so origin Host is the live apex.
    upsert_cname("exchange", "www.astranov.eu", True)
    upsert_cname("investors", "www.astranov.eu", True)

    # 1) Zone-level worker (legacy, zone permission)
    st, j = http(
        "PUT",
        f"https://api.cloudflare.com/client/v4/zones/{zid}/workers/script",
        raw=WORKER.encode(),
        headers={"Authorization": "Bearer " + cf},
        content_type="application/javascript",
    )
    print("zone worker script", st, j.get("success"), j.get("errors") or j.get("raw", "")[:240])

    # 2) Account worker
    boundary = "----astranovHost9"
    meta = json.dumps({"main_module": "index.js", "compatibility_date": "2026-07-01"}).encode()
    script = SNIPPET.encode()
    parts = []
    def part(name, filename, content, ctype):
        parts.append(f"--{boundary}\r\n".encode())
        disp = f'Content-Disposition: form-data; name="{name}"'
        if filename:
            disp += f'; filename="{filename}"'
        parts.append((disp + "\r\n").encode())
        parts.append(f"Content-Type: {ctype}\r\n\r\n".encode())
        parts.append(content)
        parts.append(b"\r\n")
    part("metadata", None, meta, "application/json")
    part("index.js", "index.js", script, "application/javascript+module")
    parts.append(f"--{boundary}--\r\n".encode())
    st, j = http(
        "PUT",
        f"https://api.cloudflare.com/client/v4/accounts/{ACCOUNT}/workers/scripts/spacenet-hosts",
        raw=b"".join(parts),
        headers={"Authorization": "Bearer " + cf, "Content-Type": f"multipart/form-data; boundary={boundary}"},
    )
    print("account worker", st, j.get("success"), j.get("errors") or j.get("raw", "")[:240])
    if j.get("success"):
        for pattern in ("exchange.astranov.eu/*", "investors.astranov.eu/*"):
            st, routes = http("GET", f"https://api.cloudflare.com/client/v4/zones/{zid}/workers/routes", headers=ch)
            hitr = next((r for r in (routes.get("result") or []) if r.get("pattern") == pattern), None)
            body = {"pattern": pattern, "script": "spacenet-hosts"}
            if hitr:
                st, j2 = http("PUT", f"https://api.cloudflare.com/client/v4/zones/{zid}/workers/routes/{hitr['id']}", body, ch)
            else:
                st, j2 = http("POST", f"https://api.cloudflare.com/client/v4/zones/{zid}/workers/routes", body, ch)
            print("route", pattern, st, j2.get("success"), j2.get("errors"))

    # 3) Snippets
    st, j = http(
        "PUT",
        f"https://api.cloudflare.com/client/v4/zones/{zid}/snippets/spacenet_hosts",
        {"files": [{"name": "snippet.js", "content": SNIPPET}]},
        ch,
    )
    print("snippet", st, j.get("success"), j.get("errors") or j.get("raw", "")[:240])

    # 4) Pages project (direct upload attempt)
    st, j = http(
        "POST",
        f"https://api.cloudflare.com/client/v4/accounts/{ACCOUNT}/pages/projects",
        {"name": "astranov-exchange", "production_branch": "main"},
        ch,
    )
    print("pages project", st, j.get("success"), j.get("errors") or j.get("raw", "")[:240])

    # 5) SSL flexible on these hosts (525 fix) + origin host header + path prefix
    for phase, payload in [
        (
            "http_config_settings",
            {
                "rules": [
                    {
                        "expression": '(http.host eq "exchange.astranov.eu") or (http.host eq "investors.astranov.eu")',
                        "description": "SpaceNet subdomain SSL flexible",
                        "action": "set_config",
                        "action_parameters": {"ssl": "flexible"},
                    }
                ]
            },
        ),
        (
            "http_request_origin",
            {
                "rules": [
                    {
                        "expression": '(http.host eq "exchange.astranov.eu") or (http.host eq "investors.astranov.eu")',
                        "description": "SpaceNet origin host astranov.eu",
                        "action": "route",
                        "action_parameters": {"host_header": "astranov.eu"},
                    }
                ]
            },
        ),
        (
            "http_request_transform",
            {
                "rules": [
                    {
                        "expression": '(http.host eq "exchange.astranov.eu")',
                        "description": "exchange.astranov.eu → /exchange",
                        "action": "rewrite",
                        "action_parameters": {"uri": {"path": {"expression": 'concat("/exchange", http.request.uri.path)'}}},
                    },
                    {
                        "expression": '(http.host eq "investors.astranov.eu")',
                        "description": "investors.astranov.eu → /investors",
                        "action": "rewrite",
                        "action_parameters": {"uri": {"path": {"expression": 'concat("/investors", http.request.uri.path)'}}},
                    },
                ]
            },
        ),
    ]:
        url = f"https://api.cloudflare.com/client/v4/zones/{zid}/rulesets/phases/{phase}/entrypoint"
        st, cur = http("GET", url, headers=ch)
        print("ruleset get", phase, st, cur.get("success"), cur.get("errors"))
        rules = payload["rules"]
        if cur.get("success") and (cur.get("result") or {}).get("id"):
            rid = cur["result"]["id"]
            existing = list(cur["result"].get("rules") or [])
            existing = [r for r in existing if "astranov.eu" not in (r.get("description") or "") and "SpaceNet" not in (r.get("description") or "")]
            st, j = http("PUT", url, {"rules": existing + rules}, ch)
        else:
            st, j = http("PUT", url, payload, ch)
        print("ruleset put", phase, st, j.get("success"), j.get("errors") or str(j)[:240])

    st, j = http(
        "POST",
        f"https://api.cloudflare.com/client/v4/zones/{zid}/pagerules",
        {
            "targets": [{"target": "url", "constraint": {"operator": "matches", "value": "exchange.astranov.eu/*"}}],
            "actions": [
                {"id": "host_header_override", "value": "astranov.eu"},
                {"id": "ssl", "value": "flexible"},
            ],
            "status": "active",
            "priority": 1,
        },
        ch,
    )
    print("pagerule exchange", st, j.get("success"), j.get("errors") or str(j)[:240])
    st, j = http(
        "POST",
        f"https://api.cloudflare.com/client/v4/zones/{zid}/pagerules",
        {
            "targets": [{"target": "url", "constraint": {"operator": "matches", "value": "investors.astranov.eu/*"}}],
            "actions": [
                {"id": "host_header_override", "value": "astranov.eu"},
                {"id": "ssl", "value": "flexible"},
            ],
            "status": "active",
            "priority": 2,
        },
        ch,
    )
    print("pagerule investors", st, j.get("success"), j.get("errors") or str(j)[:240])


if __name__ == "__main__":
    main()
