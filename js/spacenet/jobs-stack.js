/* SpaceNet 4152 — TASKS button is JOBS. Click opens the job queue. */
(function () {
  if (window.__snJobsStack) return;
  window.__snJobsStack = true;
  function read(k, d) { try { var v = localStorage.getItem(k); return v == null ? d : v; } catch (e) { return d; } }
  function write(k, v) { try { localStorage.setItem(k, typeof v === "string" ? v : JSON.stringify(v)); } catch (e) {} }
  function email() {
    try { var u = JSON.parse(read("sn:user", "null") || "null"); return String((u && (u.email || u.user_email)) || "").toLowerCase(); } catch (e) { return ""; }
  }
  function owner() { return email() === "notisastranov@gmail.com" || read("sn:admin") === "1"; }
  function token() { return String(read("sn:access", "") || ""); }
  function headers() { var h = { "Content-Type": "application/json", Accept: "application/json" }; var t = token(); if (t.length > 20) h.Authorization = "Bearer " + t; return h; }
  function jobs() {
    var list = [];
    try { list = JSON.parse(read("sn:tasks", "[]") || "[]"); } catch (e) { list = []; }
    return (list || []).filter(function (t) { return t && (t.kind === "job" || t.what || t.from); });
  }
  function nameOf(p) { return String((p && (p.name || p.label || p.address)) || ""); }
  function css() {
    if (document.getElementById("sn-jobs-css")) return;
    var s = document.createElement("style"); s.id = "sn-jobs-css";
    s.textContent = "#sn-jobs-stack{position:fixed;left:50%;bottom:calc(env(safe-area-inset-bottom)+78px);transform:translateX(-50%);z-index:170;width:min(360px,94vw);max-height:68vh;overflow:auto;display:none;padding:12px;border-radius:16px;background:rgba(4,12,22,.96);border:1px solid rgba(126,233,255,.45);color:#c6f6ff}#sn-jobs-stack.on{display:block}#sn-jobs-stack h3{margin:0 0 8px;font:800 13px system-ui;letter-spacing:.08em}#sn-jobs-stack .j{margin:0 0 10px;padding:10px;border-radius:12px;border:1px solid rgba(126,233,255,.25)}#sn-jobs-stack .j b{display:block;font:800 13px system-ui}#sn-jobs-stack .j span{display:block;margin-top:4px;font:600 11px ui-monospace;color:#9ad}#sn-jobs-stack .yes,#sn-jobs-stack .no,#sn-jobs-stack .x{width:100%;height:36px;margin-top:6px;border-radius:10px;font:800 12px system-ui}#sn-jobs-stack .yes{border:0;background:#19e68c;color:#00140a}#sn-jobs-stack .no{border:1px solid #ff3b4e;background:#000;color:#ff3b4e}#sn-jobs-stack .x{border:1px solid rgba(126,233,255,.35);background:#041018;color:#c6f6ff}";
    document.head.appendChild(s);
  }
  function rename() {
    var b = document.getElementById("sn-tasks-btn");
    if (b) {
      var n = jobs().filter(function (t) { return t.status === "offered" || !t.status || t.status === "accepted"; }).length;
      b.textContent = n ? ("JOBS " + n) : "JOBS";
      b.title = "Jobs in the queue";
    }
    document.querySelectorAll(".ttl").forEach(function (el) {
      if (String(el.textContent || "").trim() === "TASKS") el.textContent = "JOBS";
    });
  }
  function paint() {
    css(); rename();
    var el = document.getElementById("sn-jobs-stack");
    if (!el) {
      el = document.createElement("div"); el.id = "sn-jobs-stack"; document.body.appendChild(el);
      el.addEventListener("click", function (e) {
        var b = e.target.closest("[data-act]"); if (!b) return;
        var act = b.getAttribute("data-act"), id = b.getAttribute("data-id");
        if (act === "x") { el.classList.remove("on"); return; }
        if (act === "yes" || act === "no") decide(id, act === "yes");
      });
    }
    var list = jobs();
    if (!list.length) {
      el.innerHTML = "<h3>JOBS</h3><div class=\"j\"><b>Queue empty</b><span>Post a job with + or the map.</span></div><button type=\"button\" class=\"x\" data-act=\"x\">CLOSE</button>";
      el.classList.add("on"); return;
    }
    el.innerHTML = "<h3>JOBS · " + list.length + "</h3>" + list.map(function (t) {
      var st = String(t.status || "queued");
      return '<div class="j"><b>' + nameOf(t.from) + " → " + (t.address || nameOf(t.to)) + "</b><span>AV€ " + Number(t.pay || t.ride || 0).toFixed(2) + " · " + (t.phone || "") + " · " + st + (t.trips > 1 ? " · " + t.trips + " runs" : "") + "</span>" +
        (owner() && st === "offered" ? '<button type="button" class="yes" data-act="yes" data-id="' + t.id + '">ACCEPT</button><button type="button" class="no" data-act="no" data-id="' + t.id + '">DECLINE</button>' : "") +
        "</div>";
    }).join("") + '<button type="button" class="x" data-act="x">CLOSE</button>';
    el.classList.add("on");
  }
  function decide(id, yes) {
    var list = jobs(), i, row;
    for (i = 0; i < list.length; i++) if (list[i] && list[i].id === id) row = list[i];
    if (!row) return;
    row.status = yes ? "accepted" : "declined";
    if (yes) row.driver = { name: "Notis", email: "notisastranov@gmail.com" };
    write("sn:tasks", list.slice(0, 80));
    fetch("/api/space", { method: "POST", headers: headers(), body: JSON.stringify({ row: row }) }).catch(function () {});
    var line = document.getElementById("line");
    if (line) line.textContent = yes ? ("Accepted · " + (row.phone || row.address || "")) : "Declined.";
    paint();
  }
  function hook() {
    var b = document.getElementById("sn-tasks-btn");
    if (!b || b.__jobs) return;
    b.__jobs = true;
    b.addEventListener("click", function (e) { e.preventDefault(); e.stopPropagation(); paint(); }, true);
    rename();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", hook); else hook();
  setInterval(hook, 1500);
  setInterval(rename, 4000);
  window.SNJobsStack = { paint: paint, jobs: jobs };
})();
