/* SpaceNet 4198 — mutual verify. Vendor+driver at pickup, driver+customer at drop. Goods dispute: they settle it themselves or the job stays blocked. No auto Grok split. No leave until drop is mutually verified. Big flash button if the screen is gone. */
(function () {
  if (window.__SN_VERIFY_4198) return;
  window.__SN_VERIFY_4198 = true;

  var css = document.createElement("style");
  css.id = "sn-4198-css";
  css.textContent =
    "@keyframes snVerifyFlash{0%,100%{box-shadow:0 0 12px #4df0ff,0 0 0 0 #4df0ff88}50%{box-shadow:0 0 28px #4df0ff,0 0 0 12px #4df0ff00}}" +
    "#sn-verify{position:fixed;left:50%;bottom:calc(env(safe-area-inset-bottom) + 86px);transform:translateX(-50%);z-index:190;min-width:min(22rem,92vw);height:56px;padding:0 18px;border:0;border-radius:16px;background:#19e68c;color:#00140a;font:800 15px/1 system-ui;letter-spacing:.12em;animation:snVerifyFlash 1.1s ease-in-out infinite;pointer-events:auto;display:none}" +
    "#sn-verify.on{display:block}" +
    "#sn-verify-no{position:fixed;left:50%;bottom:calc(env(safe-area-inset-bottom) + 28px);transform:translateX(-50%);z-index:190;min-width:min(16rem,80vw);height:36px;padding:0 12px;border:1px solid #ff3b4e;border-radius:12px;background:#000;color:#ff3b4e;font:800 11px/1 system-ui;letter-spacing:.12em;display:none;pointer-events:auto}" +
    "#sn-verify-no.on{display:block}";
  (document.head || document.documentElement).appendChild(css);

  function read(k, d) {
    try {
      var v = localStorage.getItem(k);
      return v == null ? d : v;
    } catch (e) {
      return d;
    }
  }
  function write(k, v) {
    try {
      localStorage.setItem(k, typeof v === "string" ? v : JSON.stringify(v));
    } catch (e) {}
  }
  function email() {
    try {
      var u = JSON.parse(read("sn:user", "null") || "null");
      return String((u && (u.email || u.user_email)) || "").toLowerCase();
    } catch (e) {
      return "";
    }
  }
  function peer() {
    try {
      return (window.SNWork && SNWork.peerId && SNWork.peerId()) || "";
    } catch (e) {
      return "";
    }
  }
  function listings() {
    try {
      if (window.SNWork && SNWork.all) return SNWork.all();
    } catch (e) {}
    return { shops: [], drivers: [] };
  }
  function loadEscrow() {
    try {
      return JSON.parse(read("sn:escrow", "[]") || "[]") || [];
    } catch (e) {
      return [];
    }
  }
  function saveEscrow(list) {
    write("sn:escrow", JSON.stringify((list || []).slice(0, 80)));
  }
  function loadJobs() {
    try {
      var a = JSON.parse(read("sn:jobs", "[]") || "[]") || [];
      var b = JSON.parse(read("sn:tasks", "[]") || "[]") || [];
      return a.concat(b);
    } catch (e) {
      return [];
    }
  }
  function putJob(row) {
    function bump(k) {
      try {
        var list = JSON.parse(read(k, "[]") || "[]") || [];
        var i, hit = false;
        for (i = 0; i < list.length; i++) if (list[i] && list[i].id === row.id) { list[i] = Object.assign({}, list[i], row); hit = true; }
        if (!hit) list.unshift(row);
        write(k, JSON.stringify(list.slice(0, 80)));
      } catch (e) {}
    }
    bump("sn:jobs");
    bump("sn:tasks");
  }
  function escrowOf(id) {
    var list = loadEscrow(), i;
    for (i = 0; i < list.length; i++) if (list[i] && list[i].id === id) return list[i];
    var jobs = loadJobs();
    for (i = 0; i < jobs.length; i++) if (jobs[i] && jobs[i].id === id) {
      var j = jobs[i];
      return {
        id: j.id,
        held: j.status !== "settled" && j.status !== "declined",
        status: j.status || "paid",
        avc: j.pay || j.ave || 0,
        goods: j.goods || 0,
        ride: j.ride || 0,
        fee: j.fee || 0,
        shop: j.shop || (j.fromName ? { name: j.fromName, lat: j.fromLat, lng: j.fromLng } : null),
        drop: j.drop || { name: j.toName || j.address, lat: j.lat, lng: j.lng },
        driver: j.driver && typeof j.driver === "object" ? j.driver : { name: j.driver || "Notis", email: j.driverEmail || "" },
        payer: j.payer || j.email || "",
        customerPeer: j.peer || "",
        evidence: j.verify || j.evidence || {},
        at: j.t || j.created || Date.now(),
      };
    }
    return null;
  }
  function putEscrow(e) {
    if (!e || !e.id) return;
    var list = loadEscrow(), i, hit = false;
    for (i = 0; i < list.length; i++) if (list[i] && list[i].id === e.id) { list[i] = e; hit = true; }
    if (!hit) list.unshift(e);
    saveEscrow(list);
    putJob({
      id: e.id,
      status: e.status,
      verify: e.evidence,
      evidence: e.evidence,
    });
  }
  function ev(e) {
    e.evidence = e.evidence || {};
    return e.evidence;
  }
  function hasVendor(e) {
    return !!(e && e.shop && (e.shop.id || e.shop.name));
  }
  function pickupOk(e) {
    var v = ev(e);
    if (v.dispute) return false;
    if (hasVendor(e)) return !!(v.vendorHand && v.driverGot);
    return !!v.driverGot;
  }
  function dropOk(e) {
    var v = ev(e);
    if (v.dispute) return false;
    return !!(v.driverDrop && v.customerGot);
  }
  function disputeClear(e) {
    var v = ev(e);
    if (!v.dispute) return true;
    if (!v.settleDriver || !v.settleCustomer) return false;
    if (hasVendor(e) && !v.settleVendor) return false;
    return true;
  }
  function myRole(e) {
    if (!e) return "customer";
    var mail = email();
    var p = peer();
    var all = listings();
    var i, s, d;
    if (e.shop && e.shop.id && all.shops) {
      for (i = 0; i < all.shops.length; i++) {
        s = all.shops[i];
        if (s && s.id === e.shop.id && (s.peer === p || (s.email && String(s.email).toLowerCase() === mail))) return "vendor";
      }
    }
    if (e.driver) {
      var did = e.driver.id || e.driver.email || "";
      if (all.drivers) {
        for (i = 0; i < all.drivers.length; i++) {
          d = all.drivers[i];
          if (d && (d.id === did || d.peer === p || (d.email && String(d.email).toLowerCase() === mail))) return "driver";
        }
      }
      if (mail === "notisastranov@gmail.com" || /notis/i.test(String(e.driver.name || e.driver.email || ""))) {
        if (mail === "notisastranov@gmail.com" || (e.driver.email && String(e.driver.email).toLowerCase() === mail)) return "driver";
      }
    }
    if (e.payer && String(e.payer).toLowerCase() === mail) return "customer";
    if (e.customerPeer && p && e.customerPeer === p) return "customer";
    return "customer";
  }
  function talk(s) {
    try {
      if (window.SN && SN.talk) SN.talk(s);
      else {
        var el = document.getElementById("line");
        if (el) el.textContent = s;
      }
    } catch (e) {}
  }
  function jobId(raw) {
    var s = String(raw || "");
    if (escrowOf(s)) return s;
    var m = s.match(/^(?:stg|just)-(.+)-(ready|got|way|door|waitdoor|end|have|wait|offer|user)$/);
    return m ? m[1] : s;
  }
  function liveJob() {
    var list = loadEscrow(), i;
    for (i = 0; i < list.length; i++) if (list[i] && list[i].held && list[i].status !== "released") return list[i];
    var jobs = loadJobs();
    for (i = 0; i < jobs.length; i++) {
      var j = jobs[i];
      if (j && j.id && !/settled|declined|done|released/.test(String(j.status || "paid"))) return escrowOf(j.id);
    }
    return null;
  }
  function needOf(e) {
    if (!e) return null;
    if (/settled|released|done|declined/.test(String(e.status || ""))) return null;
    if (e.held === false && e.status === "released") return null;
    var role = myRole(e);
    var v = ev(e);
    if (v.dispute) {
      if (role === "vendor" && !v.settleVendor) return { act: "settle", label: "WE SETTLED" };
      if (role === "driver" && !v.settleDriver) return { act: "settle", label: "WE SETTLED" };
      if (role === "customer" && !v.settleCustomer) return { act: "settle", label: "WE SETTLED" };
      return { act: "wait", label: "WAITING THE OTHERS TO SETTLE" };
    }
    if (!pickupOk(e)) {
      if (hasVendor(e) && role === "vendor" && !v.vendorHand) return { act: "vendor-hand", label: "HANDED TO DRIVER" };
      if (role === "driver" && !v.driverGot) return { act: "driver-got", label: "I PICKED IT UP" };
      if (hasVendor(e) && role === "vendor") return { act: "wait", label: "WAIT · DRIVER MUST TAP PICKUP" };
      if (role === "driver") return { act: "wait", label: "WAIT · VENDOR MUST TAP HANDED" };
      return null;
    }
    if (!dropOk(e)) {
      if (role === "driver" && !v.driverDrop) return { act: "driver-drop", label: "I DELIVERED" };
      if (role === "customer" && !v.customerGot) return { act: "customer-got", label: "I ACCEPTED" };
      if (role === "driver") return { act: "wait", label: "WAIT · CUSTOMER MUST TAP ACCEPTED" };
      if (role === "customer") return { act: "wait", label: "WAIT · DRIVER MUST TAP DELIVERED" };
      return null;
    }
    return null;
  }
  function flash() {
    var el = document.getElementById("sn-verify");
    if (!el) {
      el = document.createElement("button");
      el.id = "sn-verify";
      el.type = "button";
      document.body.appendChild(el);
      el.addEventListener("click", function (ev) {
        ev.preventDefault();
        ev.stopPropagation();
        var e = liveJob();
        var n = needOf(e);
        if (!e || !n || n.act === "wait") return;
        act(e.id, n.act);
      });
    }
    var no = document.getElementById("sn-verify-no");
    if (!no) {
      no = document.createElement("button");
      no.id = "sn-verify-no";
      no.type = "button";
      no.textContent = "DISPUTE GOODS";
      document.body.appendChild(no);
      no.addEventListener("click", function (ev) {
        ev.preventDefault();
        var e2 = liveJob();
        if (!e2) return;
        act(e2.id, "dispute");
      });
    }
    var e = liveJob();
    var n = e ? needOf(e) : null;
    if (!n) {
      el.classList.remove("on");
      no.classList.remove("on");
      return;
    }
    el.textContent = n.label;
    el.classList.add("on");
    el.style.background = n.act === "wait" ? "#4df0ff" : "#19e68c";
    if (ev(e).dispute) no.classList.remove("on");
    else no.classList.add("on");
  }
  function freeze(e, now) {
    e.evidence = e.evidence || {};
    if (e.evidence.dispute) {
      e.holdMin = 99999;
      e.evidence.handedAt = now;
      e.evidence.movingAt = now;
      e.evidence.boxedAt = now;
      e.evidence.pickedAt = now;
      e.evidence.doorAt = now;
      e.flag = "dispute";
    } else if (/door|handed/.test(String(e.status || "")) && !dropOk(e)) {
      e.evidence.doorAt = now;
      e.flag = "wait-verify";
    }
  }
  function act(id, kind) {
    var e = escrowOf(id);
    if (!e) return;
    e.held = e.held !== false;
    var v = ev(e);
    var now = Date.now();
    var role = myRole(e);
    if (v.dispute && kind !== "settle" && kind !== "dispute") {
      talk("Dispute on the goods. Vendor, driver and customer settle it themselves. Chain stays blocked.");
      freeze(e, now);
      putEscrow(e);
      flash();
      return;
    }
    if (kind === "vendor-hand") v.vendorHand = now;
    if (kind === "driver-got") v.driverGot = now;
    if (kind === "driver-drop") v.driverDrop = now;
    if (kind === "customer-got") v.customerGot = now;
    if (kind === "dispute") {
      v.dispute = true;
      v.disputeBy = role;
      v.settleVendor = v.settleDriver = v.settleCustomer = 0;
      e.flag = "dispute";
      talk("Dispute on the goods. They settle it themselves or this job stays blocked. No auto split.");
    }
    if (kind === "settle") {
      if (role === "vendor") v.settleVendor = now;
      else if (role === "driver") v.settleDriver = now;
      else v.settleCustomer = now;
      if (disputeClear(e)) {
        v.dispute = false;
        e.flag = "";
        talk("Dispute cleared by the three of you. Continue the hop.");
      } else talk("You settled. Waiting the others. Chain still blocked.");
    }
    if (pickupOk(e) && /paid|picked|boxed|offer|offered|accepted|queued/.test(String(e.status || "paid"))) {
      e.status = "with_agent";
      v.with_agentAt = now;
      talk("Pickup verified. Both clicked. Drive.");
    }
    if (dropOk(e) && !v.dispute) {
      e.status = "verified";
      v.verifiedAt = now;
      talk("Drop verified. Both clicked. Driver may leave.");
      if (window.SN && SN.settle) {
        var goods = Number(e.goods) || 0;
        var ride = Number(e.ride) || 0;
        var fee = Number(e.fee) || 0;
        try { SN.settle(e.id, { customer: 0, vendor: goods, driver: ride, platform: fee }, "Mutual verify. Shop goods, agent ride, SpaceNet 3%."); } catch (err) {}
      }
    }
    freeze(e, now);
    putEscrow(e);
    try { if (window.SN && SN.syncTasks) SN.syncTasks(); } catch (err2) {}
    flash();
  }

  function wrap() {
    if (!window.SN || SN.__sn4198) return;
    SN.__sn4198 = true;
    if (SN.markStage) {
      var orig = SN.markStage.bind(SN);
      SN.markStage = function (id, status) {
        var e = escrowOf(id);
        if (!e) return orig(id, status);
        if (ev(e).dispute) {
          talk("Dispute. They settle it themselves or it stays blocked.");
          freeze(e, Date.now());
          putEscrow(e);
          flash();
          return;
        }
        if (status === "with_agent" || status === "got") {
          act(id, "driver-got");
          return;
        }
        if (status === "verified" || status === "handed") {
          act(id, "customer-got");
          return;
        }
        if (status === "door") {
          var r = orig(id, status);
          var e2 = escrowOf(id);
          if (e2 && !dropOk(e2)) {
            freeze(e2, Date.now());
            putEscrow(e2);
            talk("At the door. Driver taps I DELIVERED. Customer taps I ACCEPTED. Nobody leaves until both click.");
            flash();
          }
          return r;
        }
        return orig(id, status);
      };
    }
    if (SN.tickJustice) {
      var tj = SN.tickJustice.bind(SN);
      SN.tickJustice = function () {
        var list = loadEscrow(), i, e, now = Date.now();
        for (i = 0; i < list.length; i++) {
          e = list[i];
          if (!e || !e.held) continue;
          freeze(e, now);
        }
        saveEscrow(list);
        return tj();
      };
    }
    if (SN.settle) {
      var st = SN.settle.bind(SN);
      SN.settle = function (id, split, reason) {
        var e = escrowOf(id);
        if (e && ev(e).dispute) {
          talk("Dispute. No payout until vendor, driver and customer settle it themselves.");
          freeze(e, Date.now());
          putEscrow(e);
          flash();
          return;
        }
        if (e && e.held && !dropOk(e) && String(reason || "").indexOf("Mutual verify") === -1) {
          talk("Drop is not mutually verified. Driver and customer both have to click. Driver does not leave.");
          flash();
          return;
        }
        return st(id, split, reason);
      };
    }
  }

  document.addEventListener(
    "click",
    function (e) {
      var b = e.target && e.target.closest && e.target.closest("[data-act]");
      if (!b) return;
      var a = b.getAttribute("data-act");
      var row = b.closest("[data-id]") || b;
      var id = jobId(row.getAttribute("data-id") || (liveJob() && liveJob().id));
      if (!id) return;
      if (a === "got") {
        e.preventDefault();
        e.stopPropagation();
        if (e.stopImmediatePropagation) e.stopImmediatePropagation();
        act(id, "driver-got");
      } else if (a === "have") {
        e.preventDefault();
        e.stopPropagation();
        if (e.stopImmediatePropagation) e.stopImmediatePropagation();
        act(id, "customer-got");
      } else if (a === "leave" || a === "end") {
        var esc = escrowOf(id);
        if (esc && (!dropOk(esc) || ev(esc).dispute)) {
          e.preventDefault();
          e.stopPropagation();
          if (e.stopImmediatePropagation) e.stopImmediatePropagation();
          talk(ev(esc).dispute ? "Dispute. Stay. Settle it yourselves." : "Customer has not accepted. You do not leave.");
          flash();
        }
      } else if (a === "dispute") {
        e.preventDefault();
        e.stopPropagation();
        if (e.stopImmediatePropagation) e.stopImmediatePropagation();
        act(id, "dispute");
      }
    },
    true,
  );

  wrap();
  flash();
  setInterval(function () {
    wrap();
    flash();
  }, 700);
})();
