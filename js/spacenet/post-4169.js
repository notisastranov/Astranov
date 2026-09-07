/* SpaceNet 4169 — real + posting. Jobs, pin posts, area group call. Neutralizes dummy plus-first. */
(function () {
  if (window.__SN_POST_4169) return;
  window.__SN_POST_4169 = true;
  var HOUR = 33, FEE = 0.03, SUR = 3, ERRAND = 5;
  var step = "home";
  var at = null;
  var dest = null;
  var kind = "delivery";
  var waitingDest = false;
  var lastOpen = 0;
  var localStream = null;

  function line(s) {
    var el = document.getElementById("line");
    if (el) el.textContent = s || "";
    try { if (window.SN && SN.talk) SN.talk(s); } catch (e) {}
  }
  function read(k, d) { try { var v = localStorage.getItem(k); return v == null ? d : v; } catch (e) { return d; } }
  function write(k, v) { try { localStorage.setItem(k, typeof v === "string" ? v : JSON.stringify(v)); } catch (e) {} }
  function readJson(k, d) { try { var v = JSON.parse(read(k, "null")); return v == null ? d : v; } catch (e) { return d; } }
  function money(n) { return Math.round((Number(n) || 0) * 100) / 100; }
  function nightNow() { var h = new Date().getHours(); return h >= 21 || h < 9; }
  function esc(s) { return String(s || "").replace(/[&<>"]/g, function (c) { if (c === "&") return "&#38;"; if (c === "<") return "&#60;"; if (c === ">") return "&#62;"; return "&#34;"; }); }
  function km(a, b) {
    if (!a || !b) return 0;
    var R = 6371, dLat = ((b.lat - a.lat) * Math.PI) / 180, dLng = ((b.lng - a.lng) * Math.PI) / 180;
    var x = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
    return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
  }
  function nameOf(p) { return String((p && (p.name || p.label || p.address)) || "This place"); }
  function here() {
    if (at && isFinite(+at.lat)) return at;
    try { if (window.SN && SN.here) { var h = SN.here(); if (h && isFinite(h.lat)) return { lat: +h.lat, lng: +h.lng, name: h.name || "YOU" }; } } catch (e) {}
    try { var p = readJson("sn:place", null); if (p && isFinite(+p.lat)) return { lat: +p.lat, lng: +p.lng, name: p.name || "YOU" }; } catch (e) {}
    return { lat: 36.4348, lng: 28.2176, name: "Rhodes" };
  }
  function user() { try { return JSON.parse(read("sn:user", "null") || "null"); } catch (e) { return null; } }
  function email() { var u = user(); return String((u && (u.email || u.user_email)) || "").toLowerCase(); }
  function token() { return String(read("sn:access", "") || ""); }
  function headers() {
    var h = { "Content-Type": "application/json", Accept: "application/json" };
    var t = token();
    if (t.length > 20) h.Authorization = "Bearer " + t;
    return h;
  }
  function peerId() {
    try { if (window.SNWork && SNWork.peerId) return SNWork.peerId(); } catch (e) {}
    try {
      var id = localStorage.getItem("sn:peer");
      if (id && /^[a-z0-9]+$/i.test(id)) return id;
      id = "sn" + Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
      localStorage.setItem("sn:peer", id);
      return id;
    } catch (e) { return "sn" + Date.now().toString(36); }
  }
  function kindLabel(k) {
    if (k === "hourly") return "Hourly paid";
    if (k === "errand") return "Errand";
    return "Delivery";
  }

  function elPlus() {
    var el = document.getElementById("sn-plus3");
    if (!el) { el = document.createElement("div"); el.id = "sn-plus3"; document.body.appendChild(el); }
    return el;
  }
  function hide() {
    var el = document.getElementById("sn-plus3");
    if (el) el.classList.remove("on");
    step = "home";
  }
  function show() { elPlus().classList.add("on"); }

  function css() {
    if (document.getElementById("sn-post-4169-css")) return;
    var s = document.createElement("style");
    s.id = "sn-post-4169-css";
    s.textContent =
      "#sn-plus3{position:fixed;left:50%;bottom:calc(env(safe-area-inset-bottom) + 78px);transform:translateX(-50%);z-index:180;width:min(21.25rem,94vw);max-height:68vh;overflow:auto;display:none;padding:10px;border-radius:16px;border:1px solid rgba(80,220,255,.35);background:rgba(4,14,28,.96);box-sizing:border-box}" +
      "#sn-plus3.on{display:block}" +
      "#sn-plus3 button,#sn-plus3 .row{display:block;width:100%;margin:0 0 8px;padding:12px;border-radius:12px;border:1px solid rgba(80,220,255,.28);background:rgba(2,8,18,.9);color:#e8fbff;text-align:left}" +
      "#sn-plus3 button b{display:block;font:800 14px/1.2 system-ui}" +
      "#sn-plus3 button span,#sn-plus3 .hint{display:block;margin-top:4px;font:500 12px/1.3 system-ui;color:#7a93a3}" +
      "#sn-plus3 .x{position:absolute;right:8px;top:6px;width:28px;height:28px;padding:0;text-align:center;margin:0}" +
      "#sn-plus3 .k{font:800 10px/1 system-ui;letter-spacing:.14em;color:#4df0ff;margin:0 32px 8px 0}" +
      "#sn-plus3 .pin{font:500 12px ui-monospace,monospace;color:#7ee9ff;margin:0 0 8px}" +
      "#sn-plus3 textarea,#sn-plus3 input,#sn-plus3 select{width:100%;margin:0 0 8px;padding:10px;border-radius:12px;border:1px solid rgba(126,233,255,.45);background:rgba(4,16,28,.96);color:#e8fbff;font:500 16px system-ui;box-sizing:border-box}" +
      "#sn-plus3 textarea{min-height:88px}" +
      "#sn-plus3 .go{background:#19e68c;color:#00140a;font:800 14px system-ui;text-align:center}" +
      "#sn-plus3 .back{background:transparent;text-align:center;color:#7ee9ff}" +
      "#sn-plus3 .pay{font:900 22px/1 ui-monospace,monospace;color:#4df0ff;margin:0 0 8px}" +
      "#sn-area-ring{position:absolute;left:12px;right:12px;top:12px;z-index:2;padding:10px;border-radius:12px;background:rgba(4,14,28,.86);border:1px solid rgba(80,220,255,.35);color:#e8fbff;font:600 12px system-ui;pointer-events:none}" +
      "#sn-area-ring b{display:block;font:800 11px system-ui;letter-spacing:.14em;color:#4df0ff;margin:0 0 6px}" +
      "#sn-area-ring li{margin:2px 0;font:500 12px ui-monospace,monospace;color:#7ee9ff}";
    document.head.appendChild(s);
  }

  function payOf(k, hours, from, to) {
    hours = Math.max(1, Math.round(Number(hours) || 1));
    var one = Math.max(0.1, km(from || here(), to || from || here()));
    var base = 0;
    if (k === "hourly") base = money(HOUR * hours);
    else if (k === "errand") base = money(ERRAND + Math.max(0, Math.ceil(one - 1)));
    else base = one <= 3 ? 3 : 3 + Math.ceil(one - 3);
    var ride = money(base + (nightNow() ? SUR : 0));
    var fee = money(ride * FEE);
    return { oneWay: money(one), km: k === "delivery" ? money(2 * one) : money(one), ride: ride, fee: fee, pay: money(ride + fee), hours: hours };
  }

  function render() {
    css();
    var p = here();
    var el = elPlus();
    var where = nameOf(p);
    var html = '<button type="button" class="x" data-act="x">✕</button>';
    if (step === "home") {
      html += '<p class="pin">' + esc(where) + "</p>";
      html += '<button type="button" data-act="job"><b>Post a job</b><span>Delivery, hourly paid, or errand — describe it, then it goes to JOBS.</span></button>';
      html += '<button type="button" data-act="post"><b>Post something</b><span>Write it. It pins on this place.</span></button>';
      html += '<button type="button" data-act="call"><b>Area group call</b><span>Ring everyone available in this 800 m radar.</span></button>';
    } else if (step === "job") {
      html += '<p class="k">WHAT KIND OF JOB</p><p class="pin">' + esc(where) + "</p>";
      html += '<button type="button" data-act="kind-delivery"><b>Delivery job</b><span>From this pin. Fill the customer, or tap them on the map. AV€ 3 first 3 km.</span></button>';
      html += '<button type="button" data-act="kind-hourly"><b>Hourly paid job</b><span>AV€ 33 / hour at this pin.</span></button>';
      html += '<button type="button" data-act="kind-errand"><b>Errand job</b><span>Fetch / do at this pin. AV€ 5 start.</span></button>';
      html += '<button type="button" class="back" data-act="home">BACK</button>';
    } else if (step === "post") {
      var teams = readJson("sn:teams", []);
      var dsel = read("sn:dest", "social") || "social";
      html += '<p class="k">POST AT THIS PIN</p><p class="pin">' + esc(where) + "</p>";
      html += '<select id="sn-dest">';
      html += '<option value="social"' + (dsel === "social" ? " selected" : "") + ">Social (everyone)</option>";
      (Array.isArray(teams) ? teams : []).forEach(function (t) {
        if (!t || !t.id) return;
        html += '<option value="' + esc(t.id) + '"' + (dsel === t.id ? " selected" : "") + ">Team: " + esc(t.name || "Team") + "</option>";
      });
      html += "</select>";
      html += '<textarea id="sn-post-body" placeholder="What is happening here"></textarea>';
      html += '<button type="button" class="go" data-act="post-go">POST HERE</button>';
      html += '<button type="button" class="back" data-act="home">BACK</button>';
    } else if (step === "form") {
      var from = here();
      var to = dest || from;
      var q = payOf(kind, 1, from, to);
      html += '<p class="k">' + esc(kindLabel(kind).toUpperCase()) + " JOB</p>";
      html += '<p class="pay">AV€ ' + q.pay.toFixed(2) + "</p>";
      html += '<p class="pin">' + esc(nameOf(from)) + " → " + esc(nameOf(to)) + "</p>";
      html += '<textarea id="sn-job-note" placeholder="' + (kind === "hourly" ? "What work, how long, where" : kind === "errand" ? "What to fetch or do" : "Parcel / food / other") + '"></textarea>';
      if (kind === "hourly") html += '<input id="sn-job-hours" type="number" min="1" step="1" value="1" placeholder="Hours">';
      html += '<input id="sn-job-addr" value="' + esc(nameOf(to)) + '" placeholder="Customer address">';
      html += '<input id="sn-job-phone" type="tel" inputmode="tel" placeholder="Customer telephone +30">';
      if (kind === "delivery") html += '<input id="sn-job-mass" type="number" min="0" step="0.1" value="0" placeholder="Kg or litres">';
      html += '<p class="hint" id="sn-job-pay">AV€ ' + q.pay.toFixed(2) + " · driver Notis · 3% in</p>";
      if (kind === "delivery") html += '<button type="button" class="back" data-act="tap-dest">TAP CUSTOMER ON MAP</button>';
      html += '<button type="button" class="go" data-act="job-go">POST ' + esc(kindLabel(kind).toUpperCase()) + " TO NOTIS</button>";
      html += '<button type="button" class="back" data-act="job">BACK</button>';
    }
    el.innerHTML = html;
    show();
    bind();
  }

  function paintJobs() {
    try { if (window.SNJobsStack && SNJobsStack.paint) SNJobsStack.paint(); } catch (e) {}
    try { if (window.SNJobs && SNJobs.refresh) SNJobs.refresh(); } catch (e) {}
    try { if (window.SN && SN.repaint) SN.repaint(); } catch (e) {}
  }

  function publish(row) {
    if (!row) return;
    try {
      fetch("/api/space", { method: "POST", headers: headers(), body: JSON.stringify({ row: row }) }).catch(function () {});
    } catch (e) {}
    try { if (window.SNWork && SNWork.publish) SNWork.publish(row); } catch (e) {}
  }

  function saveTask(row) {
    var tasks = readJson("sn:tasks", []);
    if (!Array.isArray(tasks)) tasks = [];
    tasks.unshift(row);
    write("sn:tasks", JSON.stringify(tasks.slice(0, 80)));
    var jobs = readJson("sn:jobs", []);
    if (!Array.isArray(jobs)) jobs = [];
    jobs.unshift(row);
    write("sn:jobs", JSON.stringify(jobs.slice(0, 40)));
    try { if (window.SN && SN.ingestJobs) SN.ingestJobs([row]); } catch (e) {}
  }

  function commitJob() {
    var p = here();
    var to = dest || p;
    var note = String((document.getElementById("sn-job-note") || {}).value || "").trim();
    var addr = String((document.getElementById("sn-job-addr") || {}).value || "").trim() || nameOf(to);
    var phone = String((document.getElementById("sn-job-phone") || {}).value || "");
    var hours = Math.max(1, Number((document.getElementById("sn-job-hours") || {}).value || 1));
    var mass = Number((document.getElementById("sn-job-mass") || {}).value || 0);
    if (!note) { line("Describe the job."); return; }
    if (phone.replace(/\D/g, "").length < 8) { line("Customer telephone is required."); return; }
    to = { lat: +to.lat, lng: +to.lng, name: addr, address: addr };
    var q = payOf(kind, hours, p, to);
    var id = "j" + Date.now().toString(36);
    var row = {
      id: id,
      kind: "job",
      jobKind: kind,
      what: note,
      title: note,
      hours: kind === "hourly" ? hours : undefined,
      note: note,
      status: "offered",
      from: { lat: p.lat, lng: p.lng, name: nameOf(p) },
      to: { lat: to.lat, lng: to.lng, name: addr, address: addr },
      fromName: nameOf(p),
      toName: addr,
      fromLat: p.lat,
      fromLng: p.lng,
      lat: to.lat,
      lng: to.lng,
      where: addr,
      phone: phone,
      address: addr,
      km: q.km,
      oneWay: q.oneWay,
      trips: kind === "delivery" ? 1 : 1,
      ride: q.ride,
      fee: q.fee,
      pay: q.pay,
      ave: q.pay,
      mass: mass,
      night: nightNow(),
      driverEmail: "notisastranov@gmail.com",
      driver: { name: "Notis", email: "notisastranov@gmail.com" },
      payer: email(),
      email: email(),
      toOwner: "notisastranov@gmail.com",
      t: Date.now(),
      created: Date.now()
    };
    saveTask(row);
    publish(row);
    hide();
    dest = null;
    line(kindLabel(kind) + " posted to Notis. AV€ " + q.pay.toFixed(2) + ".");
    paintJobs();
    try {
      var btn = document.getElementById("sn-tasks-btn");
      if (btn && window.SNJobsStack && SNJobsStack.paint) SNJobsStack.paint();
    } catch (e) {}
  }

  function commitPost() {
    var p = here();
    var body = String((document.getElementById("sn-post-body") || {}).value || "").trim();
    var destId = String((document.getElementById("sn-dest") || {}).value || "social");
    if (!body) { line("Write the post."); return; }
    write("sn:dest", destId);
    var id = "p" + Date.now().toString(36);
    var row = {
      id: id,
      kind: "post",
      text: body,
      body: body,
      dest: destId,
      destName: destId === "social" ? "Social" : "Team",
      name: nameOf(p),
      where: nameOf(p),
      place: nameOf(p),
      lat: p.lat,
      lng: p.lng,
      peer: peerId(),
      email: email(),
      t: Date.now(),
      created: Date.now()
    };
    var posts = readJson("sn:posts", []);
    if (!Array.isArray(posts)) posts = [];
    posts.unshift(row);
    write("sn:posts", JSON.stringify(posts.slice(0, 80)));
    publish(row);
    hide();
    line("Posted at " + nameOf(p) + " · " + (row.destName) + ".");
    try { if (window.SN && SN.repaint) SN.repaint(); } catch (e) {}
    try { if (window.SNWork && SNWork.pull) SNWork.pull(p); } catch (e) {}
  }

  function peopleNear(p, list) {
    return (Array.isArray(list) ? list : []).filter(function (r) {
      return r && isFinite(+r.lat) && isFinite(+r.lng) && km(p, { lat: +r.lat, lng: +r.lng }) <= 0.8;
    }).sort(function (a, b) {
      return km(p, a) - km(p, b);
    });
  }

  function gatherPeople(j) {
    var people = [];
    function add(list) {
      (list || []).forEach(function (r) {
        if (!r || !isFinite(+r.lat)) return;
        if (r.visible === false) return;
        people.push({
          lat: +r.lat,
          lng: +r.lng,
          name: r.name || r.label || r.email || "Someone",
          peer: r.peer || "",
          email: r.email || "",
          kind: r.kind || "presence"
        });
      });
    }
    add(j && j.posts);
    add(j && j.drivers);
    add(j && j.shops);
    add(j && j.people);
    add(j && j.calls);
    add(readJson("sn:visible-people", []));
    return people;
  }

  function paintArea(near) {
    var v = document.getElementById("sn-video");
    if (!v) return;
    var box = document.getElementById("sn-area-ring");
    if (!box) {
      box = document.createElement("div");
      box.id = "sn-area-ring";
      v.appendChild(box);
    }
    var names = near.length
      ? near.map(function (r) { return "<li>" + esc(r.name) + "</li>"; }).join("")
      : "<li>Nobody live in this radar yet. Stay on — they join if they are here.</li>";
    box.innerHTML = "<b>AREA GROUP CALL · " + near.length + " IN 800 M</b><ul>" + names + "</ul>";
  }

  function openLocalCam() {
    var v = document.getElementById("sn-video");
    if (!v) return;
    v.classList.add("on");
    var local = document.getElementById("sn-local");
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        line("Camera blocked. Area call still ringing.");
        return;
      }
      navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" }, audio: true }).then(function (stream) {
        localStream = stream;
        if (local) { local.srcObject = stream; void local.play(); }
      }).catch(function () { line("Camera blocked. Area call still ringing."); });
    } catch (e) {}
    if (!v.__sn4169hang) {
      v.__sn4169hang = true;
      v.addEventListener("click", function (e) {
        var b = e.target.closest("[data-act]");
        if (!b || b.getAttribute("data-act") !== "hang") return;
        try { if (localStream) localStream.getTracks().forEach(function (t) { t.stop(); }); } catch (err) {}
        localStream = null;
        var box = document.getElementById("sn-area-ring");
        if (box && box.parentNode) box.parentNode.removeChild(box);
      });
    }
  }

  function areaCall() {
    var p = here();
    hide();
    openLocalCam();
    paintArea([]);
    line("Area call · looking for people in 800 m…");
    try { if (window.SNWork && SNWork.listenPeer) SNWork.listenPeer(); } catch (e) {}
    function ring(people) {
      var near = peopleNear(p, people);
      write("sn:visible-people", JSON.stringify(people.slice(0, 80)));
      paintArea(near);
      var row = {
        id: "c" + Date.now().toString(36),
        kind: "call",
        group: true,
        name: "Area call",
        lat: p.lat,
        lng: p.lng,
        place: nameOf(p),
        peer: peerId(),
        email: email(),
        peers: near.map(function (r) { return { name: r.name, lat: r.lat, lng: r.lng, peer: r.peer || "", email: r.email || "" }; }),
        t: Date.now()
      };
      var calls = readJson("sn:calls", []);
      if (!Array.isArray(calls)) calls = [];
      calls.unshift(row);
      write("sn:calls", JSON.stringify(calls.slice(0, 40)));
      publish(row);
      near.forEach(function (r) {
        if (!r.peer || r.peer === peerId()) return;
        publish({
          id: "c" + Date.now().toString(36) + Math.random().toString(36).slice(2, 5),
          kind: "call",
          group: true,
          name: "Area call",
          toPeer: r.peer,
          toName: r.name,
          lat: p.lat,
          lng: p.lng,
          peer: peerId(),
          t: Date.now()
        });
      });
      var withPeer = near.filter(function (r) { return r.peer && r.peer !== peerId(); });
      if (withPeer.length === 1 && window.SNWork && SNWork.startVideo) {
        try { SNWork.startVideo(withPeer[0].peer, "", { group: true, from: peerId() }); } catch (e) {}
      }
      line(near.length
        ? ("Area call · ringing " + near.length + " in 800 m. Local camera on — they join if they answer.")
        : "Area call open. Nobody visible in this radar yet — they join if they are live here.");
    }
    fetch("/api/space?lat=" + p.lat + "&lng=" + p.lng + "&peer=" + encodeURIComponent(peerId()), { headers: headers() })
      .then(function (r) { return r.json(); })
      .then(function (j) { ring(gatherPeople(j)); })
      .catch(function () { ring(readJson("sn:visible-people", [])); });
  }

  function reverse(p, then) {
    fetch("https://photon.komoot.io/reverse?lat=" + p.lat + "&lon=" + p.lng)
      .then(function (r) { return r.json(); })
      .then(function (j) {
        var pr = (j && j.features && j.features[0] && j.features[0].properties) || {};
        p.name = [pr.street, pr.housenumber, pr.name, pr.city || pr.locality].filter(Boolean).join(" ") || nameOf(p);
        p.address = p.name;
        then(p);
      })
      .catch(function () { then(p); });
  }

  function takeDest(p) {
    if (!p || !isFinite(+p.lat)) return false;
    waitingDest = false;
    var bar = document.getElementById("sn-pick");
    if (bar) bar.classList.remove("on");
    dest = { lat: +p.lat, lng: +p.lng, name: nameOf(p) };
    reverse(dest, function (named) {
      dest = named;
      kind = "delivery";
      step = "form";
      render();
      line("Customer: " + nameOf(dest) + ". Describe the delivery.");
    });
    return true;
  }

  function waitDest() {
    hide();
    waitingDest = true;
    var bar = document.getElementById("sn-pick");
    if (bar) {
      bar.classList.add("on");
      var msg = bar.querySelector(".msg");
      if (msg) msg.textContent = "Tap the customer";
    }
    line("Delivery from " + nameOf(here()) + ". Zoom and tap the customer.");
    function once(e) {
      if (!waitingDest) return;
      var ll = e && e.latlng;
      if (!ll) return;
      try { if (window.SN && SN.map) SN.map.off("click", once); } catch (err) {}
      takeDest({ lat: ll.lat, lng: ll.lng, name: "Customer" });
    }
    try { if (window.SN && SN.map) SN.map.on("click", once); } catch (err) {}
  }

  function onAct(act) {
    if (act === "x") { hide(); waitingDest = false; return; }
    if (act === "home") { step = "home"; render(); return; }
    if (act === "job") { step = "job"; render(); return; }
    if (act === "post") { step = "post"; render(); return; }
    if (act === "call") { areaCall(); return; }
    if (act === "kind-delivery") { kind = "delivery"; dest = dest || here(); step = "form"; render(); return; }
    if (act === "kind-hourly") { kind = "hourly"; dest = here(); step = "form"; render(); return; }
    if (act === "kind-errand") { kind = "errand"; dest = here(); step = "form"; render(); return; }
    if (act === "tap-dest") { waitDest(); return; }
    if (act === "post-go") { commitPost(); return; }
    if (act === "job-go") { commitJob(); return; }
  }

  function bind() {
    var el = elPlus();
    if (el.__sn4169) return;
    el.__sn4169 = true;
    el.addEventListener("click", function (e) {
      var b = e.target.closest("[data-act]");
      if (!b) return;
      e.preventDefault();
      e.stopPropagation();
      onAct(b.getAttribute("data-act"));
    });
    el.addEventListener("input", function (e) {
      if (!e.target || e.target.id !== "sn-job-hours") return;
      var hint = document.getElementById("sn-job-pay");
      if (hint) {
        var q = payOf("hourly", Number(e.target.value) || 1, here(), dest || here());
        hint.textContent = "AV€ " + q.pay.toFixed(2) + " · driver Notis · 3% in";
      }
    });
  }

  function showMenu(p) {
    at = p && isFinite(+p.lat) ? { lat: +p.lat, lng: +p.lng, name: p.name || p.label || "PIN" } : here();
    dest = null;
    waitingDest = false;
    step = "home";
    render();
  }

  function mutePlusFirstMap() {
    var m = window.SN && SN.map;
    if (!m || !m._events) return;
    var list = m._events.click;
    if (!list) return;
    if (!Array.isArray(list)) list = [list];
    var keep = [];
    for (var i = 0; i < list.length; i++) {
      var h = list[i];
      var ok = true;
      try {
        var src = Function.prototype.toString.call(h.fn || h);
        if (src.indexOf("onMap") !== -1 || (src.indexOf("Drop") !== -1 && src.indexOf("latlng") !== -1)) ok = false;
      } catch (e) {}
      if (ok) keep.push(h);
    }
    if (keep.length !== list.length) m._events.click = keep.length ? keep : [];
  }

  function stealPlus() {
    var plus = document.getElementById("plus");
    if (plus && !plus.__sn4169) {
      var fresh = plus.cloneNode(true);
      fresh.id = "plus";
      fresh.__sn4169 = true;
      fresh.__pf = true;
      fresh.__pj2 = true;
      fresh.__sn4167 = true;
      if (plus.parentNode) plus.parentNode.replaceChild(fresh, plus);
      plus = fresh;
      function open(e) {
        e.preventDefault();
        e.stopImmediatePropagation();
        var n = Date.now();
        if (n - lastOpen < 400) return;
        lastOpen = n;
        showMenu(here());
      }
      plus.addEventListener("pointerup", open, true);
      plus.addEventListener("click", open, true);
    }
    if (window.SNPlusJob) {
      SNPlusJob.showMenu = showMenu;
      SNPlusJob.showMenu.__sn4169 = true;
      SNPlusJob.start = function (k, p) {
        at = p && isFinite(+p.lat) ? p : here();
        if (k === "post") { step = "post"; render(); return; }
        if (k === "call") { areaCall(); return; }
        step = "job";
        render();
      };
      SNPlusJob.pick = function (p) {
        if (waitingDest) return takeDest(p);
        return false;
      };
      SNPlusJob.pick.__pf = true;
      SNPlusJob.pick.__pj2 = true;
    }
    if (window.SNPlusFirst) {
      SNPlusFirst.startJob = function (p) { showMenu(p); };
      SNPlusFirst.dest = function (p) { takeDest(p); };
    }
    if (window.SNWork && SNWork.open && !SNWork.open.__sn4169) {
      var openW = SNWork.open;
      SNWork.open = function (place, which) {
        if (!which || which === "home" || which === "list") { showMenu(place || here()); return; }
        if (which === "post") { at = place || here(); step = "post"; render(); return; }
        if (which === "call") { at = place || here(); areaCall(); return; }
        if (which === "job") { at = place || here(); step = "job"; render(); return; }
        return openW.apply(this, arguments);
      };
      SNWork.open.__sn4169 = true;
    }
    mutePlusFirstMap();
    bind();
  }

  stealPlus();
  setInterval(stealPlus, 1200);
  window.SNPost4169 = { showMenu: showMenu, takeDest: takeDest };
})();
