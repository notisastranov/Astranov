/* SpaceNet 4141 — driver applications to Notis only. Tasks hidden until he approves. */
(function () {
  var OWNER = "notisastranov@gmail.com";
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
  function email() {
    var u = user();
    return String((u && u.email) || "").toLowerCase();
  }
  function token() {
    return String(read("sn:access", "") || read("sn:sb-token", "") || "");
  }
  function owner() {
    var e = email();
    if (e === OWNER) return true;
    try {
      var extra = JSON.parse(read("sn:architect", "[]") || "[]");
      if (extra.indexOf(e) >= 0) return true;
    } catch (x) {}
    return read("sn:admin", "") === "1";
  }
  function approved() {
    if (owner()) return true;
    return read("sn:driver-ok", "") === "1";
  }
  function peer() {
    try {
      var id = localStorage.getItem("sn:peer");
      if (id && /^[a-z0-9]+$/i.test(id)) return id;
    } catch (e) {}
    return "";
  }
  function authHeaders() {
    var h = { "Content-Type": "application/json", Accept: "application/json" };
    var t = token();
    if (t && t.length > 20) h.Authorization = "Bearer " + t;
    return h;
  }
  function apply(row) {
    if (!row || row.kind !== "driver") return;
    row.approved = false;
    row.presence = "pending";
    row.flag = "driver-apply";
    row.email = row.email || email();
    row.peer = row.peer || peer();
    if (!email()) {
      talk("Sign in with Google first. Notis needs your contact to sign the contract.");
      return;
    }
    if (!row.phone) {
      talk("Add a telephone. Notis calls you on that number.");
      return;
    }
    fetch("/api/driver", { method: "POST", headers: authHeaders(), body: JSON.stringify({ row: row }) })
      .then(function (r) { return r.json(); })
      .then(function (j) {
        if (j && j.need === "login") talk("Sign in with Google first.");
        else talk("Application sent to Notis with your name, phone, and email. You work after he signs the contract.");
      })
      .catch(function () {
        talk("Application saved on this device. Sign in so it reaches Notis.");
      });
  }
  function wrapFetch() {
    if (window.__snSpaceFetch) return;
    window.__snSpaceFetch = true;
    var rawFetch = window.fetch;
    window.fetch = function (url, opt) {
      opt = opt || {};
      if (typeof url === "string" && url.indexOf("/api/space") === 0) {
        var h = Object.assign({}, opt.headers || {}, authHeaders());
        opt = Object.assign({}, opt, { headers: h });
        arguments[1] = opt;
      }
      return rawFetch.apply(this, arguments);
    };
  }
  function wrapPublish() {
    if (!window.SNWork || !SNWork.publish || SNWork.publish.__gate) return;
    var pub = SNWork.publish;
    SNWork.publish = function (row) {
      if (row && row.kind === "driver" && !owner() && row.approved !== true && row.flag !== "driver-ok") {
        row.approved = false;
        row.presence = "pending";
        apply(row);
        return;
      }
      return pub.apply(this, arguments);
    };
    SNWork.publish.__gate = true;
  }
  function wrapAll() {
    if (!window.SNWork || !SNWork.all || SNWork.all.__gate) return;
    var orig = SNWork.all;
    SNWork.all = function () {
      var a = orig.apply(this, arguments) || {};
      var mine = peer();
      a.drivers = (a.drivers || []).filter(function (d) {
        if (!d) return false;
        if (owner()) return true;
        if (d.peer && d.peer === mine) return true;
        if (d.email && String(d.email).toLowerCase() === email()) return true;
        if (d.approved === true || d.approved === 1 || d.flag === "driver-ok") return d.presence !== "off" && d.presence !== "pending";
        return false;
      });
      return a;
    };
    SNWork.all.__gate = true;
  }
  function canSeeBoard() { return owner() || approved(); }
  function ownTask(t) {
    if (!t) return false;
    var me = peer();
    var e = email();
    if (t.peer && me && t.peer === me) return true;
    if (t.customerPeer && me && t.customerPeer === me) return true;
    if (t.driver && t.driver.peer && me && t.driver.peer === me) return true;
    if (t.email && e && String(t.email).toLowerCase() === e) return true;
    return false;
  }
  function hideForeignTasks() {
    if (canSeeBoard()) return;
    var box = document.getElementById("sn-tasks-list") || document.querySelector("#sn-tasks .card");
    if (!box) return;
    box.querySelectorAll(".task,[data-id],.labor").forEach(function (n) {
      var id = n.getAttribute("data-id") || n.getAttribute("data-ask") || "";
      if (n.getAttribute("data-ask")) return;
      var mine = false;
      try {
        var list = JSON.parse(read("sn:tasks", "[]") || "[]");
        list.forEach(function (t) {
          if (t && t.id === id && ownTask(t)) mine = true;
        });
      } catch (e) {}
      if (!mine) n.style.display = "none";
    });
  }
  function wrapSync() {
    if (!window.SN || !SN.syncTasks || SN.syncTasks.__gate) return;
    var orig = SN.syncTasks;
    SN.syncTasks = function () {
      orig.apply(this, arguments);
      if (canSeeBoard()) return;
      try {
        var list = JSON.parse(localStorage.getItem("sn:tasks") || "[]");
        list = list.filter(function (t) { return ownTask(t); });
        localStorage.setItem("sn:tasks", JSON.stringify(list.slice(0, 80)));
      } catch (e) {}
    };
    SN.syncTasks.__gate = true;
  }
  function wrapIngest() {
    if (!window.SN || !SN.ingestJobs || SN.ingestJobs.__gate) return;
    var orig = SN.ingestJobs;
    SN.ingestJobs = function (jobs) {
      if (!canSeeBoard()) jobs = (jobs || []).filter(function (j) { return ownTask(j); });
      return orig.call(this, jobs);
    };
    SN.ingestJobs.__gate = true;
  }
  function status() {
    fetch("/api/driver?me=1&peer=" + encodeURIComponent(peer()), { headers: authHeaders() })
      .then(function (r) { return r.json(); })
      .then(function (j) {
        if (!j || !j.ok) return;
        write("sn:driver-ok", (j.owner || j.approved) ? "1" : "0");
        if (j.owner) pullOwner();
      })
      .catch(function () {});
  }
  function pullOwner() {
    if (!owner()) return;
    fetch("/api/driver", { headers: authHeaders() })
      .then(function (r) { return r.json(); })
      .then(function (j) {
        (j && j.apps || []).forEach(function (a) {
          if (a.approved) return;
          if (window.SNAsk && SNAsk.ask) {
            SNAsk.ask({
              id: "drv-" + a.id,
              title: "Driver application · " + (a.name || "base"),
              body: [a.name, a.phone, a.email, a.vehicles, a.hours, a.routes, a.place].filter(Boolean).join(" · "),
            });
          }
        });
      })
      .catch(function () {});
  }
  function hookAsk() {
    var list = document.getElementById("sn-tasks");
    if (!list || list.__drvGate) return;
    list.__drvGate = true;
    list.addEventListener("click", function (e) {
      var b = e.target.closest && e.target.closest("[data-act]");
      if (!b || !owner()) return;
      var card = b.closest("[data-ask]");
      if (!card) return;
      var id = String(card.getAttribute("data-ask") || "");
      if (id.indexOf("drv-") !== 0) return;
      var real = id.replace(/^drv-/, "");
      var yes = b.getAttribute("data-act") === "yes";
      fetch("/api/driver", {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ decide: 1, id: real, yes: yes }),
      }).then(function (r) { return r.json(); }).then(function () {
        talk(yes ? "Approved. Contact them and sign the contract." : "Declined. They cannot see tasks.");
      }).catch(function () {});
    }, true);
  }
  function boot() {
    wrapFetch(); wrapPublish(); wrapAll(); wrapSync(); wrapIngest(); hookAsk(); hideForeignTasks();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
  setInterval(boot, 1500);
  setInterval(status, 20000);
  setTimeout(status, 1200);
  window.SNDriverGate = { owner: owner, approved: approved, canSeeBoard: canSeeBoard, apply: apply };
})();
