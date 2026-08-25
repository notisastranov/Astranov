addEventListener("fetch", function (event) {
  event.respondWith(handle(event.request));
});

var RAW = "https://raw.githubusercontent.com/notisastranov/astranov.eu/main";

function handle(request) {
  var url = new URL(request.url);
  var path = url.pathname || "/";
  if (path === "/") path = "/index.html";
  var live = path === "/index.html" || path.indexOf("/js/spacenet/") === 0;
  if (!live) return fetch(request);
  var src = RAW + path + "?t=" + Date.now();
  return fetch(src, { headers: { "User-Agent": "AstranovLive/1" } }).then(function (r) {
    if (!r.ok) return fetch(request);
    return r.arrayBuffer().then(function (buf) {
      var type = path.indexOf(".js") > 0 ? "application/javascript; charset=utf-8" : "text/html; charset=utf-8";
      return new Response(buf, {
        status: 200,
        headers: {
          "content-type": type,
          "cache-control": "no-store, no-cache, must-revalidate",
          "x-astranov-via": "github-main",
        },
      });
    });
  }).catch(function () {
    return fetch(request);
  });
}
