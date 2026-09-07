/* SpaceNet 4181 — JOBS lists posted jobs only. Hunt pins stay off the queue. */
(function () {
  if (window.__snJobsReal4181) return;
  window.__snJobsReal4181 = true;
  function read(k, d) { try { var v = localStorage.getItem(k); return v == null ? d : v; } catch (e) { return d; } }
  function write(k, v) { try { localStorage.setItem(k, typeof v === "string" ? v : JSON.stringify(v)); } catch (e) {} }
  function isReal(t) {
    if (!t || typeof t !== "object") return false;
    var k = String(t.kind || "").toLowerCase();
    if (/find|hunt|shop|pin|place|vendor|post|call/.test(k)) return false;
    if (t.grok || t.src === "photon" || t.src === "nominatim") return false;
    if (t.status === "hunt") return false;
    if (t.query && !t.from) return false;
    if (k === "job") return true;
    if (t.thrown || t.driver || t.driverEmail || t.toOwner) return true;
    if (t.status && /assign|accept|offer|post|throw|verif|declin|queue|open/.test(String(t.status))) return true;
    if (t.from && (t.to || t.address) && (t.pay != null || t.ride != null || t.phone)) return true;
    return false;
  }
  function scrub() {
    var raw;
    try { raw = JSON.parse(read("sn:tasks", "[]") || "[]"); } catch (e) { raw = []; }
    if (!Array.isArray(raw)) return [];
    var keep = raw.filter(isReal);
    if (keep.length !== raw.length) write("sn:tasks", JSON.stringify(keep.slice(0, 80)));
    return keep;
  }
  function wrap() {
    if (!window.SNJobsStack) return;
    SNJobsStack.jobs = function () { return scrub(); };
    var paint = SNJobsStack.paint;
    if (paint && !paint.__r4181) {
      SNJobsStack.paint = function () { scrub(); return paint.apply(this, arguments); };
      SNJobsStack.paint.__r4181 = true;
    }
  }
  scrub();
  wrap();
  setInterval(wrap, 1500);
})();
