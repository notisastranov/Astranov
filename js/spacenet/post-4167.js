/* SpaceNet 4167 — real post menus: job kinds, pin post, area group call. */
(function () {
  if (window.__SN_POST_4167) return;
  window.__SN_POST_4167 = true;
  var HOUR = 33, FEE = 0.03, SUR = 3, ERRAND = 5;
  var step = "home";
  var at = null;
  var kind = "delivery";

  function line(s) { var el = document.getElementById("line"); if (el) el.textContent = s || ""; }
  function read(k, d) { try { var v = localStorage.getItem(k); return v == null ? d : v; } catch (e) { return d; } }
  function write(k, v) { try { localStorage.setItem(k, typeof v === "string" ? v : JSON.stringify(v)); } catch (e) {} }
  function readJson(k, d) { try { var v = JSON.parse(read(k, "null")); return v == null ? d : v; } catch (e) { return d; } }
  function money(n) { return Math.round((Number(n) || 0) * 100) / 100; }
  function nightNow() { var h = new Date().getHours(); return h >= 21 || h < 9; }
  function km(a, b) {
    if (!a || !b) return 0;
    var R = 6371, dLat = ((b.lat - a.lat) * Math.PI) / 180, dLng = ((b.lng - a.lng) * Math.PI) / 180;
    var x = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
    return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
  }
  function nameOf(p) { return String((p && (p.name || p.label || p.address)) || "This place"); }
  function here() {
    if (at && isFinite(+at.lat)) return at;
    try { var p = readJson("sn:place", null); if (p && isFinite(+p.lat)) return { lat: +p.lat, lng: +p.lng, name: p.name || "YOU" }; } catch (e) {}
    return { lat: 36.4348, lng: 28.2176, name: "Rhodes" };
  }
  function elPlus() {
    var el = document.getElementById("sn-plus3");
    if (!el) { el = document.createElement("div"); el.id = "sn-plus3"; document.body.appendChild(el); }
    return el;
  }
  function hide() { var el = document.getElementById("sn-plus3"); if (el) el.classList.remove("on"); step = "home"; }
  function show() { elPlus().classList.add("on"); }

  function css() {
    if (document.getElementById("sn-post-4167-css")) return;
    var s = document.createElement("style");
    s.id = "sn-post-4167-css";
    s.textContent =
      "#sn-plus3{position:fixed;left:50%;bottom:calc(env(safe-area-inset-bottom) + 78px);transform:translateX(-50%);z-index:70;width:min(20rem,92vw);display:none;padding:10px;border-radius:16px;border:1px solid rgba(80,220,255,.35);background:rgba(4,14,28,.96);box-sizing:border-box}" +
      "#sn-plus3.on{display:block}" +
      "#sn-plus3 button,#sn-plus3 .row{display:block;width:100%;margin:0 0 8px;padding:12px;border-radius:12px;border:1px solid rgba(80,220,255,.28);background:rgba(2,8,18,.9);color:#e8fbff;text-align:left}" +
      "#sn-plus3 button b{display:block;font:800 14px/1.2 system-ui}" +
      "#sn-plus3 button span,#sn-plus3 .hint{display:block;margin-top:4px;font:500 12px/1.3 system-ui;color:#7a93a3}" +
      "#sn-plus3 .x{position:absolute;right:8px;top:6px;width:28px;height:28px;padding:0;text-align:center;margin:0}" +
      "#sn-plus3 .k{font:800 10px/1 system-ui;letter-spacing:.14em;color:#4df0ff;margin:0 32px 8px 0}" +
      "#sn-plus3 .pin{font:500 12px ui-monospace,monospace;color:#7ee9ff;margin:0 0 8px}" +
      "#sn-plus3 textarea,#sn-plus3 input,#sn-plus3 select{width:100%;margin:0 0 8px;padding:10px;border-radius:12px;border:1px solid rgba(126,233,255,.45);background:rgba(4,16,28,.96);color:#e8fbff;font:500 16px system-ui;box-sizing:border-box}" +
      "#sn-plus3 textarea{min-height:96px}" +
      "#sn-plus3 .go{background:#19e68c;color:#00140a;font:800 14px system-ui;text-align:center}" +
      "#sn-plus3 .back{background:transparent;text-align:center;color:#7ee9ff}";
    document.head.appendChild(s);
  }

  function render() {
    css();
    var p = here();
    var el = elPlus();
    var where = nameOf(p);
    var html = '<button type="button" class="x" data-act="x">✕</button>';
    if (step === "home") {
      html += '<p class="pin">' + where + "</p>";
      html += '<button type="button" data-act="job"><b>Post a job</b><span>Delivery, hourly paid, or errand.</span></button>';
      html += '<button type="button" data-act="post"><b>Post something</b><span>Write it for this pin.</span></button>';
      html += '<button type="button" data-act="call"><b>Area group call</b><span>Ring everyone available in this radar.</span></button>';
    } else if (step === "job") {
      html += '<p class="k">WHAT KIND OF JOB</p><p class="pin">' + where + "</p>";
      html += '<button type="button" data-act="kind-delivery"><b>Delivery job</b><span>Tap the customer on the map. AV€ 3 first 3 km.</span></button>';
      html += '<button type="button" data-act="kind-hourly"><b>Hourly paid job</b><span>AV€ 33 / hour at this pin.</span></button>';
      html += '<button type="button" data-act="kind-errand"><b>Errand job</b><span>Fetch / do at this pin. AV€ 5 start.</span></button>';
      html += '<button type="button" class="back" data-act="home">BACK</button>';
    } else if (step === "post") {
      var teams = readJson("sn:teams", []);
      var dest = read("sn:dest", "social") || "social";
      html += '<p class="k">POST AT THIS PIN</p><p class="pin">' + where + "</p>";
      html += '<select id="sn-dest">';
      html += '<option value="social"' + (dest === "social" ? " selected" : "") + ">Social (everyone)</option>";
      (Array.isArray(teams) ? teams : []).forEach(function (t) {
        if (!t || !t.id) return;
        html += '<option value="' + String(t.id).replace(/"/g, "") + '"' + (dest === t.id ? " selected" : "") + ">Team: " + String(t.name || "Team") + "</option>";
      });
      html += "</select>";
      html += '<textarea id="sn-post-body" placeholder="What is happening here"></textarea>';
      html += '<button type="button" class="go" data-act="post-go">POST HERE</button>';
      html += '<button type="button" class="back" data-act="home">BACK</button>';
    } else if (step === "hourly" || step === "errand") {
      html += '<p class="k">' + (step === "hourly" ? "HOURLY PAID JOB" : "ERRAND JOB") + "</p>";
      html += '<p class="pin">' + where + "</p>";
      html += '<textarea id="sn-job-note" placeholder="' + (step === "hourly" ? "What work, how long, where" : "What to fetch or do") + '"></textarea>';
      if (step === "hourly") html += '<input id="sn-job-hours" type="number" min="1" step="1" value="1" placeholder="Hours">';
      html += '<input id="sn-job-addr" value="' + where.replace(/"/g, "") + '" placeholder="Address">';
      html += '<input id="sn-job-phone" type="tel" inputmode="tel" placeholder="Customer telephone +30">';
      html += '<p class="hint" id="sn-job-pay">' + payHint(step, 1) + "</p>";
      html += '<button type="button" class="go" data-act="job-go">POST TO NOTIS</button>';
      html += '<button type="button" class="back" data-act="job">BACK</button>';
    }
    el.innerHTML = html;
    show();
  }

  function payHint(k, hours) {
    var base = k === "hourly" ? HOUR * Math.max(1, hours || 1) : ERRAND;
    var ride = base + (nightNow() ? SUR : 0);
    var pay = money(ride * (1 + FEE));
    return "AV€ " + pay.toFixed(2) + " · driver Notis · 3% in";
  }

  function saveJob(job) {
    var jobs = readJson("sn:jobs", []);
    if (!Array.isArray(jobs)) jobs = [];
    jobs.unshift(job);
    write("sn:jobs", JSON.stringify(jobs.slice(0, 40)));
    var tasks = readJson("sn:tasks", []);
    if (!Array.isArray(tasks)) tasks = [];
    tasks.unshift({
      id: job.id, kind: job.kind || "job", what: job.note || job.title, status: job.status,
      from: { lat: job.fromLat, lng: job.fromLng, name: job.fromName },
      to: { lat: job.lat, lng: job.lng, name: job.toName, address: job.address },
      phone: job.phone, address: job.address, km: job.km, pay: job.pay, hours: job.hours, t: job.created,
      driver: { name: "Notis", email: "notisastranov@gmail.com" }
    });
    write("sn:tasks", JSON.stringify(tasks.slice(0, 80)));
  }

  function commitLocal() {
    var p = here();
    var note = (document.getElementById("sn-job-note") || {}).value || "";
    var addr = (document.getElementById("sn-job-addr") || {}).value || nameOf(p);
    var phone = String((document.getElementById("sn-job-phone") || {}).value || "");
    var hours = Math.max(1, Number((document.getElementById("sn-job-hours") || {}).value || 1));
    if (!String(note).trim()) { line("Describe the job."); return; }
    if (phone.replace(/\D/g, "").length < 8) { line("Customer telephone is required."); return; }
    var base = kind === "hourly" ? HOUR * hours : ERRAND;
    var ride = money(base + (nightNow() ? SUR : 0));
    var fee = money(ride * FEE);
    var job = {
      id: "j" + Date.now().toString(36),
      title: String(note).trim(),
      kind: kind,
      hours: kind === "hourly" ? hours : undefined,
      note: String(note).trim(),
      where: addr, lat: p.lat, lng: p.lng, created: Date.now(), status: "offered",
      fromName: nameOf(p), toName: addr, fromLat: p.lat, fromLng: p.lng,
      address: addr, phone: phone, pay: money(ride + fee), ave: money(ride + fee), fee: fee, ride: ride,
      night: nightNow(), driver: "Notis"
    };
    saveJob(job);
    hide();
    line((kind === "hourly" ? "Hourly paid" : "Errand") + " posted to Notis. AV€ " + job.pay.toFixed(2) + ".");
    try { if (window.SNJobs && SNJobs.refresh) SNJobs.refresh(); } catch (e) {}
  }

  function commitPost() {
    var p = here();
    var body = String((document.getElementById("sn-post-body") || {}).value || "").trim();
    var dest = String((document.getElementById("sn-dest") || {}).value || "social");
    if (!body) { line("Write the post."); return; }
    write("sn:dest", dest);
    var posts = readJson("sn:posts", []);
    if (!Array.isArray(posts)) posts = [];
    posts.unshift({
      id: "p-" + Date.now(), kind: dest === "social" ? "social" : "team", body: body, dest: dest,
      destName: dest === "social" ? "Social" : "Team", where: nameOf(p), lat: p.lat, lng: p.lng, created: Date.now()
    });
    write("sn:posts", JSON.stringify(posts.slice(0, 60)));
    hide();
    line("Posted at " + nameOf(p) + ".");
    try { if (window.SNWork && SNWork.refresh) SNWork.refresh(); } catch (e) {}
  }

  function areaCall() {
    var p = here();
    hide();
    var people = readJson("sn:visible-people", []);
    var near = (Array.isArray(people) ? people : []).filter(function (r) {
      return r && isFinite(+r.lat) && km(p, { lat: +r.lat, lng: +r.lng }) <= 0.8;
    });
    var v = document.getElementById("sn-video");
    if (v) {
      v.classList.add("on");
      var local = document.getElementById("sn-local");
      try {
        navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" }, audio: true }).then(function (stream) {
          if (local) { local.srcObject = stream; local.play(); }
        }).catch(function () { line("Camera blocked. Area call still ringing."); });
      } catch (e) {}
    }
    line(near.length ? ("Area call · ringing " + near.length + " in 800 m.") : "Area call open. Nobody visible in this radar yet.");
    try {
      fetch("/api/space", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ row: { kind: "call", group: true, name: "Area call", lat: p.lat, lng: p.lng, t: Date.now() } })
      }).catch(function () {});
    } catch (e) {}
  }

  function onAct(act) {
    if (act === "x") { hide(); return; }
    if (act === "home") { step = "home"; render(); return; }
    if (act === "job") { step = "job"; render(); return; }
    if (act === "post") { step = "post"; render(); return; }
    if (act === "call") { areaCall(); return; }
    if (act === "kind-delivery") {
      hide();
      kind = "delivery";
      try { if (window.SNPlusJob && SNPlusJob.start) SNPlusJob.start("job", here()); } catch (e) {}
      line("Delivery from " + nameOf(here()) + ". Zoom and tap the customer.");
      return;
    }
    if (act === "kind-hourly") { kind = "hourly"; step = "hourly"; render(); return; }
    if (act === "kind-errand") { kind = "errand"; step = "errand"; render(); return; }
    if (act === "post-go") { commitPost(); return; }
    if (act === "job-go") { commitLocal(); return; }
  }

  function bind() {
    var el = elPlus();
    if (el.__sn4167) return;
    el.__sn4167 = true;
    el.addEventListener("click", function (e) {
      var b = e.target.closest("[data-act]");
      if (!b) return;
      e.preventDefault();
      e.stopPropagation();
      onAct(b.getAttribute("data-act"));
    });
    el.addEventListener("input", function (e) {
      if (e.target && e.target.id === "sn-job-hours") {
        var hint = document.getElementById("sn-job-pay");
        if (hint) hint.textContent = payHint("hourly", Number(e.target.value) || 1);
      }
    });
  }

  function showMenu(p) {
    at = p || here();
    step = "home";
    render();
    bind();
  }

  function wrap() {
    bind();
    if (window.SNPlusJob && SNPlusJob.showMenu && !SNPlusJob.showMenu.__sn4167) {
      SNPlusJob.showMenu = function (p) { showMenu(p); };
      SNPlusJob.showMenu.__sn4167 = true;
    }
    var plus = document.getElementById("plus");
    if (plus && !plus.__sn4167) {
      plus.__sn4167 = true;
      plus.addEventListener("click", function (e) {
        e.preventDefault();
        e.stopPropagation();
        showMenu(here());
      }, true);
    }
  }

  wrap();
  setInterval(wrap, 1500);
  window.SNPost4167 = { showMenu: showMenu };
})();
