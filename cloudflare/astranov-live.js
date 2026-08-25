/**
 * Astranov live edge — never die on github 403/429
 * Prefer Vercel → jsDelivr → GitHub raw. Build 20260825181000-edge-alive
 * Ghost HUD (twin CLI / Command the HUD / sn-topchrome-drag) is rejected.
 */
addEventListener("fetch", function (event) {
  event.respondWith(handle(event.request));
});

var VERCEL = "https://astranov-astranov.vercel.app";
var JSD = "https://cdn.jsdelivr.net/gh/notisastranov/astranov.eu@main";
var RAW = "https://raw.githubusercontent.com/notisastranov/astranov.eu/main";
var PAGES = "https://astranov.pages.dev";

function isGhostHtml(text) {
  return /Command the HUD|id=["']cli-in["']|id=["']stc-cmd-in["']|hud-law-restore|sn-topchrome-drag|#cli-drag|chrome-fix-body/i.test(text || "");
}

function candidates(path) {
  var p = path === "/" || path === "" ? "/index.html" : path;
  var bare = p.replace(/^\//, "");
  /* LAW: Grid OS on GitHub/Vercel is latest. Never single-point github-sha. */
  return [
    { url: VERCEL + p, tag: "vercel" },
    { url: JSD + "/" + bare, tag: "jsdelivr" },
    { url: RAW + p + "?t=" + Date.now(), tag: "github-raw" },
    { url: PAGES + p, tag: "pages" }
  ];
}

function handle(request) {
  var url = new URL(request.url);
  var path = url.pathname || "/";
  if (path === "/") path = "/index.html";

  if (path === "/__edge_health") {
    return new Response(JSON.stringify({ ok: true, worker: "astranov-live", v: "20260825181000-edge-alive" }), {
      headers: { "content-type": "application/json", "access-control-allow-origin": "*", "cache-control": "no-store" }
    });
  }

  var live = path === "/index.html" || path.indexOf("/js/spacenet/") === 0 || path.indexOf("/js/") === 0 || path.indexOf("/api/") === 0;
  if (!live) {
    /* fall through to origin for non-app paths */
    return fetch(request);
  }

  var list = candidates(path);
  var fails = [];

  function tryNext(i) {
    if (i >= list.length) {
      var msg = "Astranov edge error: " + (fails.join(" · ") || "all origins down");
      return new Response(msg, {
        status: 502,
        headers: { "content-type": "text/plain; charset=utf-8", "x-astranov-proxy": "fail", "access-control-allow-origin": "*" }
      });
    }
    var c = list[i];
    return fetch(c.url, {
      method: "GET",
      headers: {
        "User-Agent": "AstranovLive/20260825181000",
        "Accept": path.indexOf(".js") > 0 ? "application/javascript,*/*" : "text/html,*/*"
      },
      cf: { cacheTtl: 0 }
    }).then(function (r) {
      if (!r) {
        fails.push(c.tag + ":net");
        return tryNext(i + 1);
      }
      if (r.status === 403 || r.status === 429 || r.status >= 500) {
        fails.push(c.tag + ":" + r.status);
        return tryNext(i + 1);
      }
      if (!r.ok && !(r.status >= 300 && r.status < 400)) {
        fails.push(c.tag + ":" + r.status);
        return tryNext(i + 1);
      }
      return r.arrayBuffer().then(function (buf) {
        var type = path.indexOf(".js") > 0 ? "application/javascript; charset=utf-8" : "text/html; charset=utf-8";
        if (path.indexOf("/api/") === 0) {
          type = r.headers.get("content-type") || "application/json; charset=utf-8";
        }
        if (type.indexOf("text/html") === 0) {
          var text = "";
          try { text = new TextDecoder("utf-8").decode(buf); } catch (e) {}
          if (isGhostHtml(text)) {
            fails.push(c.tag + ":ghost-hud");
            return tryNext(i + 1);
          }
        }
        return new Response(buf, {
          status: 200,
          headers: {
            "content-type": type,
            "cache-control": "no-store, no-cache, must-revalidate",
            "x-astranov-via": c.tag,
            "x-astranov-proxy": c.tag,
            "x-astranov-build": "20260825181000-edge-alive",
            "access-control-allow-origin": "*"
          }
        });
      });
    }).catch(function () {
      fails.push(c.tag + ":net");
      return tryNext(i + 1);
    });
  }

  return tryNext(0);
}
