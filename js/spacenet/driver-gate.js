/* SpaceNet 4147 — driver applications to Notis. He is always approved. */
(function () {
  var OWNER = "notisastranov@gmail.com";
  function read(k, d) { try { var v = localStorage.getItem(k); return v == null ? d : v; } catch (e) { return d; } }
  function write(k, v) { try { localStorage.setItem(k, typeof v === "string" ? v : JSON.stringify(v)); } catch (e) {} }
  function email() {
    try { var u = JSON.parse(read("sn:user", "null") || "null"); return String((u && (u.email || u.user_email)) || "").toLowerCase(); } catch (e) { return ""; }
  }
  function owner() { return email() === OWNER || read("sn:admin") === "1"; }
  function approved() { return owner() || read("sn:driver-ok") === "1"; }
  function peer() { try { var id = localStorage.getItem("sn:peer"); if (id && /^[a-z0-9]+$/i.test(id)) return id; } catch (e) {} return ""; }
  function boot() {
    if (owner()) { write("sn:driver-ok", "1"); write("sn:labor-ok", "1"); }
    if (!window.SNWork || !SNWork.all || SNWork.all.__gate) return;
    var orig = SNWork.all;
    SNWork.all = function () {
      var a = orig.apply(this, arguments) || {};
      var mine = peer(); var e = email();
      a.drivers = (a.drivers || []).filter(function (d) {
        if (!d) return false;
        if (owner()) return true;
        if (d.peer && d.peer === mine) return true;
        if (d.email && String(d.email).toLowerCase() === e) return true;
        if (d.approved === true || d.flag === "driver-ok") return d.presence !== "off" && d.presence !== "pending";
        return false;
      });
      return a;
    };
    SNWork.all.__gate = true;
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot); else boot();
  setInterval(boot, 1500);
  window.SNDriverGate = { owner: owner, approved: approved, canSeeBoard: function () { return owner() || approved(); } };
})();
