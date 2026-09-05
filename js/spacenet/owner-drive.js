/* SpaceNet 4147 — architect is an approved live driver. */
(function () {
  var OWNER = "notisastranov@gmail.com";
  function read(k, d) { try { var v = localStorage.getItem(k); return v == null ? d : v; } catch (e) { return d; } }
  function write(k, v) { try { localStorage.setItem(k, typeof v === "string" ? v : JSON.stringify(v)); } catch (e) {} }
  function user() { try { return JSON.parse(read("sn:user", "null") || "null"); } catch (e) { return null; } }
  function email() { var u = user(); return String((u && (u.email || u.user_email)) || "").toLowerCase(); }
  function token() { return String(read("sn:access", "") || ""); }
  function peer() { try { var id = localStorage.getItem("sn:peer"); if (id && /^[a-z0-9]+$/i.test(id)) return id; } catch (e) {} return "owner"; }
  function headers() { var h = { "Content-Type": "application/json", Accept: "application/json" }; var t = token(); if (t.length > 20) h.Authorization = "Bearer " + t; return h; }
  function here() {
    try { var p = JSON.parse(read("sn:place", "null") || "null"); if (p && isFinite(Number(p.lat))) return p; } catch (e) {}
    return { lat: 36.4348, lng: 28.2176, name: "Rhodes" };
  }
  function arm() {
    if (email() !== OWNER && read("sn:admin") !== "1") return;
    write("sn:driver-ok", "1");
    write("sn:labor-ok", "1");
    write("sn:vendor-ok", "1");
    write("sn:visible", "1");
    var p = here();
    var row = {
      id: "drv-notis",
      kind: "driver",
      name: "Notis",
      email: OWNER,
      phone: String(read("sn:phone", "") || ""),
      lat: +p.lat, lng: +p.lng,
      approved: true,
      presence: "present",
      flag: "driver-ok",
      peer: peer(),
      vehicles: "SpaceNet fleet",
      routes: "Rhodes · islands · wherever the job is",
      t: Date.now()
    };
    fetch("/api/space", { method: "POST", headers: headers(), body: JSON.stringify({ row: row }) }).catch(function () {});
    try {
      var list = JSON.parse(read("sn:drivers", "[]") || "[]");
      list = (list || []).filter(function (d) { return d && d.id !== "drv-notis"; });
      list.unshift(row);
      write("sn:drivers", list.slice(0, 40));
    } catch (e) {}
    var line = document.getElementById("line");
    if (line && !window.__snOwnerDriveSaid) {
      window.__snOwnerDriveSaid = true;
      line.textContent = "Driver ON · Notis · approved · jobs visible";
    }
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", arm);
  else arm();
  setInterval(arm, 20000);
  window.SNOwnerDrive = { arm: arm };
})();
