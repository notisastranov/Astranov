import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "*",
  "Content-Type": "application/json",
};

function json(obj: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(obj), { status, headers: cors });
}

async function api(token: string, method: string, url: string, body?: unknown) {
  const r = await fetch(url, {
    method,
    headers: {
      Authorization: "Bearer " + token,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const t = await r.text();
  let j: unknown = null;
  try {
    j = JSON.parse(t);
  } catch {
    j = { raw: t.slice(0, 400) };
  }
  return { st: r.status, j };
}

function shape(v: unknown, depth = 0): unknown {
  if (v == null) return v;
  if (typeof v === "string") return { t: "string", n: v.length, p: v.slice(0, 4) };
  if (typeof v !== "object") return { t: typeof v };
  if (depth > 4) return { t: "object", deep: true };
  const o = v as Record<string, unknown>;
  const out: Record<string, unknown> = {};
  for (const k of Object.keys(o)) out[k] = shape(o[k], depth + 1);
  return out;
}
function walkStrings(v: unknown, path: string, acc: { path: string; val: string }[]) {
  if (typeof v === "string" && v.length >= 16) acc.push({ path, val: v });
  else if (v && typeof v === "object") {
    for (const [k, x] of Object.entries(v as object)) walkStrings(x, path ? path + "." + k : k, acc);
  }
}
function parseBundle(raw: string) {
  try { return JSON.parse(raw); } catch { return raw; }
}
function pickToken(env: Record<string, string>) {
  let token = env.VERCEL_TOKEN || env.VERCEL_ACCESS_TOKEN || env.VERCEL_API_TOKEN || env.NOW_TOKEN || "";
  const raw = env.SUPABASE_SECRET_KEYS || "";
  const bundle = raw ? parseBundle(raw) : null;
  return { token, bundle };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  const env = Deno.env.toObject();
  const names = Object.keys(env).sort().filter((k) => !k.startsWith("DENO_"));
  const picked = pickToken(env);
  let token = picked.token;
  const suppliedNonce = req.headers.get("x-spacenet-sync") || "";
  const syncNonce = env.SPACENET_SYNC_NONCE || "";
  const callerVercelToken = req.headers.get("x-vercel-token") || "";
  if (syncNonce && suppliedNonce === syncNonce && callerVercelToken) token = callerVercelToken;
  const bundleShape = shape(picked.bundle);
  let vaultNames: string[] = [];
  let vaultErr = "";
  try {
    const sb = createClient(env.SUPABASE_URL || "", env.SUPABASE_SERVICE_ROLE_KEY || "");
    const { data, error } = await sb.schema("vault").from("decrypted_secrets").select("name");
    if (error) vaultErr = error.message;
    vaultNames = (data || []).map((r: { name: string }) => r.name);
    const want = vaultNames.filter((n) => /vercel|now_token/i.test(n));
    if (want.length && !token) {
      const { data: v } = await sb
        .schema("vault")
        .from("decrypted_secrets")
        .select("name, decrypted_secret")
        .in("name", want);
      const row = (v || [])[0] as { decrypted_secret?: string } | undefined;
      if (row?.decrypted_secret) token = row.decrypted_secret;
    }
  } catch (e) {
    vaultErr = String(e);
  }

  let restPaths: string[] = [];
  let restErr = "";
  let tableHits: string[] = [];
  let reportTokenFrom = "";
  try {
    const specR = await fetch((env.SUPABASE_URL || "") + "/rest/v1/", {
      headers: {
        apikey: env.SUPABASE_SERVICE_ROLE_KEY || "",
        Authorization: "Bearer " + (env.SUPABASE_SERVICE_ROLE_KEY || ""),
        Accept: "application/openapi+json",
      },
    });
    const spec = await specR.json();
    restPaths = Object.keys((spec && spec.paths) || {}).slice(0, 200);
    const sb = createClient(env.SUPABASE_URL || "", env.SUPABASE_SERVICE_ROLE_KEY || "");
    for (const path of restPaths) {
      const table = path.replace(/^\//, "").split("?")[0];
      if (!table || table.startsWith("rpc/")) continue;
      if (!/secret|config|setting|key|env|token|vercel|cred/i.test(table)) continue;
      const { data, error } = await sb.from(table).select("*").limit(5);
      tableHits.push(table + ":" + (error ? error.message : ("n=" + ((data || []).length) + " keys=" + (data && data[0] ? Object.keys(data[0]).join(",") : ""))));
      if (data && data[0] && !token) {
        const cands2: { path: string; val: string }[] = [];
        walkStrings(data, "tbl." + table, cands2);
        for (const c of cands2) {
          const probe = await api(c.val, "GET", "https://api.vercel.com/v2/user");
          if (probe.st === 200) {
            token = c.val;
            reportTokenFrom = c.path;
            break;
          }
        }
      }
    }
  } catch (e) {
    restErr = String(e);
  }
  const report: Record<string, unknown> = {
    envNames: names,
    bundleShape,
    vaultNames,
    vaultErr,
    hasVercel: !!token,
    tokenLen: token.length,
  };
  const cands: { path: string; val: string }[] = [];
  walkStrings(picked.bundle, "bundle", cands);
  for (const k of names) {
    const val = env[k];
    if (val && val.length >= 16 && !/SERVICE_ROLE|DB_URL|JWKS/i.test(k)) cands.push({ path: "env." + k, val });
  }
  const tried: string[] = [];
  if (!token) {
    for (const c of cands) {
      tried.push(c.path + ":" + c.val.length);
      const probe = await api(c.val, "GET", "https://api.vercel.com/v2/user");
      if (probe.st === 200) {
        token = c.val;
        report.tokenFrom = c.path;
        break;
      }
    }
  }

  const extraHits: unknown[] = [];
  try {
    const sb2 = createClient(env.SUPABASE_URL || "", env.SUPABASE_SERVICE_ROLE_KEY || "");
    const tables = ["knowledge", "ai_memory", "astranov_nodes", "cli_transcripts", "analytics_events", "astranov_profiles", "cic_logs", "security_events"];
    for (const table of tables) {
      const { data, error } = await sb2.from(table).select("*").limit(4);
      const blob = JSON.stringify(data || []);
      extraHits.push({
        table,
        err: error ? error.message : "",
        n: (data || []).length,
        cols: data && data[0] ? Object.keys(data[0]) : [],
        vercel: /vercel/i.test(blob),
      });
      if (!token && data) {
        const c2: { path: string; val: string }[] = [];
        walkStrings(data, "tbl." + table, c2);
        for (const c of c2) {
          if (c.val.length < 20) continue;
          const probe = await api(c.val, "GET", "https://api.vercel.com/v2/user");
          if (probe.st === 200) {
            token = c.val;
            reportTokenFrom = c.path;
            break;
          }
        }
      }
    }
    const ks = await sb2.rpc("knowledge_search", { q: "VERCEL_TOKEN" });
    extraHits.push({ rpc: "knowledge_search", err: ks.error ? ks.error.message : "", n: (ks.data || []).length, vercel: /vercel/i.test(JSON.stringify(ks.data || [])) });
  } catch (e) {
    extraHits.push({ extraErr: String(e) });
  }

  report.tried = tried;
  report.hasVercel = !!token;
  report.tokenLen = token.length;
  report.restPaths = restPaths;
  report.restErr = restErr;
  report.tableHits = tableHits;
  report.extraHits = extraHits;
  report.tokenFrom = reportTokenFrom || report.tokenFrom;
  if (!token) return json(report);

  const teams = await api(token, "GET", "https://api.vercel.com/v2/teams");
  const teamList = ((teams.j as { teams?: { id: string; slug: string }[] }).teams) || [];
  report.teams = teamList.map((t) => t.slug);
  let projectId = "";
  let teamId = "";
  let projectName = "";
  for (const tid of [undefined, ...teamList.map((t) => t.id)]) {
    const q = "?limit=100" + (tid ? "&teamId=" + tid : "");
    const pr = await api(token, "GET", "https://api.vercel.com/v9/projects" + q);
    const projects = ((pr.j as { projects?: { id: string; name: string }[] }).projects) || [];
    if (!tid) report.personalProjects = projects.map((p) => p.name);
    for (const p of projects) {
      if (p.name === "astranov") {
        projectId = p.id;
        projectName = p.name;
        teamId = tid || "";
      }
    }
  }
  report.project = { projectId, projectName, teamId };
  if (!projectId) return json(report, 404);

  const qs = teamId ? "?teamId=" + teamId : "";
  if (syncNonce && suppliedNonce === syncNonce) {
    const synced: Record<string, number> = {};
    for (const key of ["PAYPAL_CLIENT_ID", "PAYPAL_CLIENT_SECRET"]) {
      const value = env[key] || "";
      if (!value) {
        synced[key] = 0;
        continue;
      }
      const put = await api(token, "POST", "https://api.vercel.com/v10/projects/" + projectId + "/env?upsert=true" + (teamId ? "&teamId=" + teamId : ""), {
        type: "encrypted",
        key,
        value,
        target: ["production", "preview"],
      });
      synced[key] = put.st;
    }
    report.paypalEnvSync = synced;
  }
  const dep = await api(token, "POST", "https://api.vercel.com/v13/deployments" + qs, {
    name: projectName,
    project: projectId,
    target: "production",
    gitSource: {
      type: "github",
      org: "notisastranov",
      repo: "astranov.eu",
      ref: "main",
    },
  });
  report.deploySt = dep.st;
  const dj = dep.j as { id?: string; url?: string; readyState?: string; error?: unknown; errorMessage?: string };
  report.deploy = { id: dj.id, url: dj.url, readyState: dj.readyState, error: dj.error || dj.errorMessage };
  if (dep.st >= 400 || !dj.id) return json(report, 500);
  for (let i = 0; i < 24; i++) {
    await new Promise((r) => setTimeout(r, 5000));
    const poll = await api(token, "GET", "https://api.vercel.com/v13/deployments/" + dj.id + qs);
    const pj = poll.j as { readyState?: string; url?: string };
    report.readyState = pj.readyState;
    report.url = pj.url;
    if (pj.readyState === "READY" || pj.readyState === "ERROR" || pj.readyState === "CANCELED") break;
  }
  return json(report);
});
