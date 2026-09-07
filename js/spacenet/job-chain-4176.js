/* SpaceNet 4176 — Post a job completes: streets open, second tap quotes, THROW posts to Notis. */
(function () {
  if (window.__snJobChain4176) return;
  window.__snJobChain4176 = true;
  function line(t) {
    var el = document.getElementById("line");
    if (el) el.textContent = t || "";
  }
  function email() {
    try {
      var u = JSON.parse(localStorage.getItem("sn:user") || "null");
      return (u && (u.email || u.mail)) || "";
    } catch (e) { return ""; }
  }
  function here() {
    try {
      if (window.SN && SN.here) {
        var h = SN.here();
        if (h && isFinite(+h.lat)) return { lat: +h.lat, lng: +h.lng, name: h.name || "YOU" };
      }
    } catch (e) {}
    try {
      var p = JSON.parse(localStorage.getItem("sn:place") || "null");
      if (p && isFinite(+p.lat)) return { lat: +p.lat, lng: +p.lng, name: p.name || "YOU" };
    } catch (e) {}
    return { lat: 36.4348, lng: 28.2176, name: "Rhodes" };
  }
  function openStreets(p) {
    p = p || here();
    try {
      if (window.SN && SN.showCity) SN.showCity(p);
      else if (window.SN && SN.showMap) SN.showMap(p, 15);
    } catch (e) {}
    var city = document.getElementById("city");
    if (city) city.classList.add("on");
  }
  function mapObj() {
    try { if (window.SN && SN.getMap) return SN.getMap(); } catch (e) {}
    try { if (window.SN && SN.map) return SN.map; } catch (e) {}
    return null;
  }
  function feed(p) {
    if (!p || !isFinite(+p.lat)) return;
    if (window.SNPlusFirst && SNPlusFirst.dest) SNPlusFirst.dest(p);
    else if (window.SNPlusJob && SNPlusJob.pick) SNPlusJob.pick(p);
  }
  function bindCity() {
    var m = mapObj();
    if (m && m.on && !m.__jc4176) {
      m.__jc4176 = true;
      m.on("click", function (e) {
        if (!e || !e.latlng) return;
        feed({ lat: +e.latlng.lat, lng: +e.latlng.lng, name: "Drop" });
      });
    }
  }
  function wrapPlus() {
    var plus = document.getElementById("plus");
    if (!plus || plus.__jc4176) return;
    plus.__jc4176 = true;
    plus.addEventListener("click", function () {
      setTimeout(function () {
        openStreets(here());
        bindCity();
        line("Job from here. Tap the customer on the street map.");
      }, 80);
    }, false);
  }
  function val(id) {
    var el = document.getElementById(id);
    return el ? String(el.value || "").trim() : "";
  }
  function throwNow(e) {
    var b = e.target && e.target.closest && e.target.closest("#sn-jobq [data-act=pay]");
    if (!b) return;
    e.preventDefault();
    e.stopImmediatePropagation();
    var addr = val("sn-job-addr") || "Pin on map";
    var phone = val("sn-job-phone");
    var payEl = document.querySelector("#sn-jobq .pay");
    var pay = payEl ? Number(String(payEl.textContent).replace(/[^\d.]/g, "")) : 3;
    var fromP = here();
    var id = "j" + Date.now().toString(36);
    var row = {
      id: id, kind: "job", what: "Delivery", status: "offered",
      from: { lat: fromP.lat, lng: fromP.lng, name: fromP.name },
      to: { name: addr, address: addr }, phone: phone || "", address: addr, pay: pay || 3,
      driverEmail: "notisastranov@gmail.com",
      driver: { name: "Notis", email: "notisastranov@gmail.com" },
      payer: email(), email: email(), toOwner: "notisastranov@gmail.com", t: Date.now()
    };
    try {
      var tasks = JSON.parse(localStorage.getItem("sn:tasks") || "[]");
      tasks.unshift(row);
      localStorage.setItem("sn:tasks", JSON.stringify(tasks.slice(0, 80)));
    } catch (err) {}
    try { fetch("/api/space", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ row: row }) }).catch(function () {}); } catch (err) {}
    var q = document.getElementById("sn-jobq");
    if (q) q.classList.remove("on");
    line("Job posted to Notis" + (phone ? "" : " · add the customer phone when you have it") + ". AV€ " + (pay || 3).toFixed(2) + ".");
  }
  function boot() {
    wrapPlus();
    bindCity();
    if (!document.__jcPay) {
      document.__jcPay = true;
      document.addEventListener("click", throwNow, true);
    }
  }
  boot();
  setInterval(boot, 1200);
})();
