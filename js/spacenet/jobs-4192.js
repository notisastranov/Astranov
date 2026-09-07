/* SpaceNet 4192 — JOBS and radar count posted jobs only. No shop-pair fakes, no hunt pins. HUD unchanged. */
(function () {
  if (window.__SN_JOBS_4192) return;
  window.__SN_JOBS_4192 = true;

  function isLiveJob(t) {
    if (!t || typeof t !== "object") return false;
    if (t.demo || t.sample || t.fake || t.synthetic) return false;
    if (String(t.id || "").indexOf("off-") === 0) return false;
    var k = String(t.kind || "").toLowerCase();
    if (/find|hunt|shop|pin|place|vendor|post|call|social|tax/.test(k)) return false;
    var status = String(t.status || "").toLowerCase();
    if (status === "hunt" || status === "cart" || status === "chosen") return false;
    var src = String(t.src || "");
    if (t.grok || src === "photon" || src === "nominatim" || src === "overpass") return false;
    if (t.query && !t.phone && t.pay == null && t.ave == null) return false;
    if (/^(food|parcel|grocery|other)$/.test(k) && !t.phone && !t.thrown) return false;
    var hasFrom = !!(t.from || (isFinite(+t.fromLat) && isFinite(+t.fromLng)));
    var hasTo = !!(t.to || (isFinite(+t.toLat) && isFinite(+t.toLng)));
    var hasPin = isFinite(+t.lat) && isFinite(+t.lng);
    var paid = t.phone || t.pay != null || t.ave != null || t.ride != null || t.thrown || t.driver;
    var named = !!(t.note || t.what || t.title || t.items);
    if (k === "hourly" || k === "errand") return !!(named && paid);
    if (k === "delivery" || k === "job" || t.thrown) {
      if (!(hasFrom || hasPin)) return false;
      if (k === "delivery" && !hasTo && !hasPin) return false;
      return !!paid;
    }
    return false;
  }

  function read(k) {
    try { return JSON.parse(localStorage.getItem(k) || "[]"); } catch (e) { return []; }
  }
  function write(k, v) {
    try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {}
  }
  function scrubKey(k) {
    var raw = read(k);
    if (!Array.isArray(raw)) return [];
    var keep = raw.filter(isLiveJob);
    if (keep.length !== raw.length) write(k, keep.slice(0, 80));
    return keep;
  }
  function scrub() {
    scrubKey("sn:jobs");
    scrubKey("sn:tasks");
    scrubKey("sn:labor");
  }

  var origGet = Storage.prototype.getItem;
  Storage.prototype.getItem = function (k) {
    var v = origGet.apply(this, arguments);
    if (k !== "sn:jobs" && k !== "sn:tasks" && k !== "sn:labor") return v;
    try {
      var list = JSON.parse(v || "[]");
      if (!Array.isArray(list)) return v;
      return JSON.stringify(list.filter(isLiveJob));
    } catch (e) {
      return v;
    }
  };

  function wrapIngest() {
    if (!window.SN || !SN.ingestJobs || SN.ingestJobs.__r4192) return;
    var prev = SN.ingestJobs;
    SN.ingestJobs = function (list) {
      return prev.call(this, (list || []).filter(isLiveJob));
    };
    SN.ingestJobs.__r4192 = true;
  }
  function wrapStack() {
    if (!window.SNJobsStack || SNJobsStack.__r4192) return;
    if (typeof SNJobsStack.jobs === "function") {
      SNJobsStack.jobs = function () { return scrubKey("sn:tasks"); };
    }
    SNJobsStack.__r4192 = true;
  }

  function tick() {
    scrub();
    wrapIngest();
    wrapStack();
  }
  tick();
  setInterval(tick, 1200);
  window.__SN_IS_LIVE_JOB = isLiveJob;
})();
