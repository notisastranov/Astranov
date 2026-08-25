/**
 * Astranov live edge — multi-origin, never die on github 403
 * Prefer Vercel → jsDelivr → GitHub raw. Build 20260825151500-edge-alive
 */
addEventListener("fetch", function (event) {
  event.respondWith(handle(event.request));
});

var VERCEL = "https://astranov-astranov.vercel.app";
var JSD = "https://cdn.jsdelivr.net/gh/notisastranov/astranov.eu@main";
var RAW = "https://raw.githubusercontent.com/notisastranov/astranov.eu/main";

function isGhostHtml(text) {
  return /Command the HUD|id="cli-in"|id="stc-cmd-in"|hud-law-restore|sn-topchrome-drag/i.test(text || "");
}

function candidates(path) {
  var p = path === "/" || path === "" ? "/index.html" : path;
  var bare = p.replace(/^\//, "");
  /* LAW: GitHub Grid OS is latest. Vercel is often a frozen ghost. */
  return [
    { url: RAW + p + "?t=" + Date.now(), tag: "github-raw" },
    { url: JSD + "/" + bare, tag: "jsdelivr" },
    { url: VERCEL + p, tag: "vercel" }
  ];
}

function handle(request) {
  var url = new URL(request.url);
  var path = url.pathname || "/";
  if (path === "/") path = "/index.html";
  var live = path === "/index.html" || path.indexOf("/js/spacenet/") === 0 || path.indexOf("/js/") === 0;
  if (!live) return fetch(request);

  var list = candidates(path);
  var fails = [];

  function tryNext(i) {
    if (i >= list.length) {
      var msg = "Astranov edge error: " + (fails.join(" · ") || "all origins down");
      return new Response(msg, {
        status: 502,
        headers: { "content-type": "text/plain; charset=utf-8", "x-astranov-proxy": "fail" }
      });
    }
    var c = list[i];
    return fetch(c.url, { headers: { "User-Agent": "AstranovLive/2" } }).then(function (r) {
      if (!r || r.status === 403 || r.status === 429 || r.status >= 500) {
        fails.push(c.tag + ":" + (r ? r.status : "net"));
        return tryNext(i + 1);
      }
      if (!r.ok && !(r.status >= 300 && r.status < 400)) {
        fails.push(c.tag + ":" + r.status);
        return tryNext(i + 1);
      }
      return r.arrayBuffer().then(function (buf) {
        var type = path.indexOf(".js") > 0 ? "application/javascript; charset=utf-8" : "text/html; charset=utf-8";
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
