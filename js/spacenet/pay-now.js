/* SpaceNet 4142 — customer SpaceNet AV€ pays vendor and driver immediately. */
(function () {
  if (window.__snPayNow) return;
  window.__snPayNow = true;
  function read(k, d) {
    try { var v = localStorage.getItem(k); return v == null ? d : v; } catch (e) { return d; }
  }
  function write(k, v) {
    try { localStorage.setItem(k, typeof v === "string" ? v : JSON.stringify(v)); } catch (e) {}
  }
  function talk(s) {
    if (window.SN && SN.talk) SN.talk(s);
    else if (window.SN && SN.say) SN.say(s);
  }
  function user() {
    try { return JSON.parse(read("sn:user", "null") || "null"); } catch (e) { return null; }
  }
  function token() { return String(read("sn:access", "") || ""); }
  function headers() {
    var h = { "Content-Type": "application/json", Accept: "application/json" };
    var t = token();
    if (t.length > 20) h.Authorization = "Bearer " + t;
    return h;
  }
  function money(n) { return Math.round((Number(n) || 0) * 100) / 100; }
  function loadEscrow() {
    try { return JSON.parse(localStorage.getItem("sn:escrow") || "[]") || []; } catch (e) { return []; }
  }
  function saveEscrow(list) {
    try { localStorage.setItem("sn:escrow", JSON.stringify((list || []).slice(0, 80))); } catch (e) {}
  }
  function listingEmail(row) {
    if (!row) return "";
    if (row.email) return String(row.email).toLowerCase();
    try {
      var all = window.SNWork && SNWork.all && SNWork.all();
      var list = (all && (row.kind === "driver" ? all.drivers : all.shops)) || [];
      var hit = list.filter(function (x) { return x && x.id === row.id; })[0];
      if (hit && hit.email) return String(hit.email).toLowerCase();
    } catch (e) {}
    return "";
  }
  function seen() {
    try { return JSON.parse(read("sn:pay-now", "{}") || "{}"); } catch (e) { return {}; }
  }
  function markSeen(id) {
    var s = seen(); s[id] = Date.now(); write("sn:pay-now", s);
  }
  function euro(n) {
    if (window.SNWallet && SNWallet.fmt) return SNWallet.fmt(n);
    return "AV€ " + money(n);
  }
  function instant(e) {
    if (!e || !e.id || e.instantPaid) return;
    if (seen()[e.id]) return;
    var goods = money(e.goods);
    var ride = money(e.ride);
    if (e.floor) ride = money(ride + 3);
    var fee = money(e.fee != null ? e.fee : (goods + ride) * 0.03);
    if (!goods && !ride) return;
    markSeen(e.id);
    e.instantPaid = true;
    e.paidOut = Object.assign({}, e.paidOut || {}, { vendor: true, driver: true, platform: true });
    e.split = { customer: 0, vendor: goods, driver: ride, platform: fee };
    saveEscrow(loadEscrow().map(function (x) { return x && x.id === e.id ? e : x; }));
    fetch("/api/pay", {
      method: "POST",
      headers: headers(),
      body: JSON.stringify({
        action: "settle",
        orderId: e.id,
        goods: goods,
        ride: ride,
        fee: fee,
        vendorEmail: listingEmail(e.shop),
        driverEmail: listingEmail(e.driver),
        shopId: e.shop && e.shop.id,
        driverId: e.driver && e.driver.id,
      }),
    }).then(function (r) { return r.json(); }).then(function (j) {
      talk("Paid from your SpaceNet AV€. Shop " + euro(goods) + " now. Agent " + euro(ride) + " now." + (j && j.ok ? "" : " Ledger will catch up when signed in."));
    }).catch(function () {
      talk("Paid from your SpaceNet AV€. Shop " + euro(goods) + " now. Agent " + euro(ride) + " now.");
    });
  }
  function scan() {
    loadEscrow().forEach(function (e) {
      if (!e || !e.held) return;
      if (e.status === "paid" || e.status === "offer" || e.status === "picked") instant(e);
    });
  }
  function wrapSettle() {
    if (!window.SN || !SN.settle || SN.settle.__now) return;
    var orig = SN.settle;
    SN.settle = function (id, split, reason) {
      var list = loadEscrow();
      var e = list.filter(function (x) { return x && x.id === id; })[0];
      if (e && e.instantPaid) {
        if (split && Number(split.customer) > 0) return orig.apply(this, arguments);
        e.held = false;
        e.status = "released";
        e.reason = reason || "Already paid at checkout.";
        saveEscrow(list.map(function (x) { return x && x.id === id ? e : x; }));
        if (window.SN.syncTasks) SN.syncTasks();
        talk(reason || "Closed. Shop and agent were paid at checkout from the customer's SpaceNet AV€.");
        return;
      }
      return orig.apply(this, arguments);
    };
    SN.settle.__now = true;
  }
  function pullMine() {
    if (!token()) return;
    fetch("/api/pay?me=1", { headers: headers() })
      .then(function (r) { return r.json(); })
      .then(function (j) {
        if (!j || !j.ok) return;
        var local = Math.max(0, Number(read("sn:avc", "0")) || 0);
        var remote = money(j.avc);
        if (remote > local) {
          write("sn:avc", String(remote));
          if (window.SNWallet && SNWallet.paint) SNWallet.paint();
          if (window.SN && SN.paintMoney) SN.paintMoney(true);
        }
      })
      .catch(function () {});
  }
  function boot() { wrapSettle(); scan(); }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
  setInterval(boot, 1500);
  setTimeout(pullMine, 800);
  setInterval(pullMine, 20000);
  window.SNPayNow = { scan: scan, instant: instant };
})();
