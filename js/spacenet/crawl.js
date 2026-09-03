/* SpaceNet crawl 4139 — fill listed shops from OSM/web or a leaflet photo. */
(function () {
  function talk(s) {
    if (window.SN && SN.talk) SN.talk(s);
    else if (window.SN && SN.say) SN.say(s);
  }
  function take(shops) {
    if (!shops || !shops.length || !window.SNWork || !SNWork.applyFill) return 0;
    var n = 0;
    shops.forEach(function (s) {
      if (!s || !s.name) return;
      if (SNWork.autoList) SNWork.autoList(s, false);
      SNWork.applyFill(s);
      n++;
    });
    if (window.SNWork.pull) SNWork.pull();
    return n;
  }
  function around(from, q) {
    from = from || (window.SN && SN.here) || null;
    if (!from || !isFinite(from.lat)) {
      talk("Tap GPS first. Then I can fill shops around you.");
      return Promise.resolve(null);
    }
    talk("Filling shops from the public map…");
    return fetch("/api/crawl", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lat: from.lat, lng: from.lng, q: q || "" }),
    })
      .then(function (r) { return r.json(); })
      .then(function (j) {
        var n = take(j && j.shops);
        talk(n ? n + " shops listed on SpaceNet." : "No public shops published there yet.");
        return j;
      })
      .catch(function () {
        talk("Crawler missed. Try again.");
        return null;
      });
  }
  window.SNCrawl = { around: around, take: take };
})();
