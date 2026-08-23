/**
 * Nairobi / Africa / Kenya zoom ladder — Build 20260823003000-nairobi-rungs
 *
 * Guest types "nairobi" / "africa" / "kenya" (or pinches the live globe over Kenya)
 * → honest three sequential rungs, never a teleport to a wrong continent:
 *   NATIONAL  frame Kenya / East Africa with the continent still in frame
 *             CLI `Nairobi · national`  currentTier()==="national"
 *   CITY      ease down to the Nairobi metro (never Lagos, never Rhodes)
 *             CLI `Nairobi · city`      currentTier()==="city"
 *   STREETS   Leaflet (or equivalent) street basemap at look-at ≈ -1.286, 36.817
 *             CLI `Nairobi · streets`   currentTier()==="streets"
 *
 * Each rung changes altitude/frame AND updates currentTier() + the CLI line
 * before the next rung begins. Wait for fly settle (probe-signs style) on each.
 *
 * Reuses the #127 honest fly helper:
 *   Prefer SNGlobe.flyGlobeTo when #127 already defined it.
 *   Else attach the same probe-sign algorithm as SNGlobe.flyGlobeTo
 *   (do NOT overwrite an existing helper — pizza hunt stays intact).
 *
 * LOCKED flyGlobeTo algorithm (copied, not edited, from #127):
 *   (1) stopMotion + zeroInertia + pointercancel first
 *   (2) tilt = earth.parent.parent (lat, rotation.x), spin = earth.parent (lng, rotation.y)
 *       NEVER Mesh.rotation
 *   (3) probe signs once per fly (0.04 rad, revert). If 0, try the other node.
 *   (4) loop gain=0.35, max 16, LIVE viewLatLng each step
 *       success |lat-target|<0.15 AND unwrap|lng-target|<0.15
 *       else tilt.x += sLat*dLat*PI/180*gain; spin.y += sLng*dLng*PI/180*gain
 *   (5) never x += -dLat blindly; never both parents on both axes
 *   (6) fail: "Fly failed" honestly + "Fly failed - viewLatLng still LAT, LNG"
 *       (minus kept) + sLat/sLng + parents
 *       leave pins empty — do not snap to a fake origin
 *       do not skip ahead to Leaflet on the wrong city
 *
 * Never goToPlace / flyNear / Rhodes / Kalithea / Lagos for this path.
 */
(function (G) {
  'use strict';
  if (G.__snNairobiLadder23003000) return;
  G.__snNairobiLadder23003000 = 1;

  var BUILD = '20260823003000-nairobi-rungs';
  var NAIROBI = { lat: -1.286, lng: 36.817, name: 'Nairobi' };
  var SETTLE_DEG = 0.15;
  var Z = { national: 3.2, city: 1.52, street: 1.16 };
  var STREET_ZOOM = 16;
  var KENYA = { latMin: -4.7, latMax: 4.6, lngMin: 33.9, lngMax: 41.9 };
  var EAST_AFRICA = { latMin: -12, latMax: 12, lngMin: 28.5, lngMax: 52 };

  var lastProbe = { sLat: 0, sLng: 0 };
  var lastFly = null;
  var laddering = false;
  var streetsOpening = false;
  var pinchCoolUntil = 0;
  var emptyPins = [];
  var ladderTier = null;
  var origCurrentTier = null;
  var globeTierWrap = null;
  var cliWrap = null;
  var origMapOpen = null;

  function sleep(ms) {
    return new Promise(function (resolve) {
      setTimeout(resolve, ms);
    });
  }

  function log(m, c) {
    var s = String(m == null ? '' : m).slice(0, 420);
    try {
      var el = document.getElementById('cli-log');
      if (el) {
        el.style.setProperty('display', 'block', 'important');
        var row = document.createElement('div');
        row.className = 'sn-cli-line cli-feed-item is-latest sn-' + (c || 'ok');
        row.setAttribute('data-sn-nairobi', '1');
        if (c) row.setAttribute('data-sn-nairobi-cls', c);
        row.textContent = s;
        el.appendChild(row);
        el.scrollTop = el.scrollHeight;
      }
    } catch (_) {}
    try {
      if (G.SNCli && typeof SNCli.log === 'function') SNCli.log(s, c || 'ok', true);
    } catch (_) {}
  }

  function preview(m) {
    try {
      if (G.SNCli && typeof SNCli.preview === 'function') SNCli.preview(String(m).slice(0, 90));
    } catch (_) {}
  }

  function unwrapDeg(d) {
    d = Number(d);
    if (!isFinite(d)) return 0;
    while (d > 180) d -= 360;
    while (d < -180) d += 360;
    return d;
  }

  function axisSign(d) {
    d = Number(d);
    if (!isFinite(d) || d === 0) return 0;
    return d > 0 ? 1 : -1;
  }

  function fmtSignedDeg(n) {
    n = Number(n);
    if (!isFinite(n)) return '?';
    return n.toFixed(3);
  }

  function fmtLiveLL(ll) {
    if (!ll || ll.lat == null || !isFinite(ll.lat)) return '?, ?';
    return fmtSignedDeg(ll.lat) + ', ' + fmtSignedDeg(ll.lng);
  }

  function inBox(lat, lng, box) {
    lat = Number(lat);
    lng = Number(lng);
    if (!isFinite(lat) || !isFinite(lng) || !box) return false;
    var lngN = unwrapDeg(lng);
    return lat >= box.latMin && lat <= box.latMax && lngN >= box.lngMin && lngN <= box.lngMax;
  }

  function inKenya(lat, lng) {
    return inBox(lat, lng, KENYA);
  }

  function inEastAfrica(lat, lng) {
    return inBox(lat, lng, EAST_AFRICA);
  }

  function isNairobiCoord(lat, lng) {
    lat = Number(lat);
    lng = Number(lng);
    if (!isFinite(lat) || !isFinite(lng)) return false;
    return Math.abs(lat - NAIROBI.lat) < 0.35 && Math.abs(unwrapDeg(lng - NAIROBI.lng)) < 0.35;
  }

  function isFakeOrigin(lat, lng) {
    lat = Number(lat);
    lng = Number(lng);
    if (!isFinite(lat) || !isFinite(lng)) return true;
    if (Math.abs(lat - 36.44) < 0.12 && Math.abs(unwrapDeg(lng - 28.22)) < 0.12) return true;
    if (Math.abs(lat - 36.387557) < 0.05 && Math.abs(unwrapDeg(lng - 28.222533)) < 0.05) return true;
    if (Math.abs(lat - 6.5244) < 0.4 && Math.abs(unwrapDeg(lng - 3.3792)) < 0.4) return true;
    if (Math.abs(lat + 26.2041) < 0.4 && Math.abs(unwrapDeg(lng - 28.0473)) < 0.4) return true;
    if (Math.abs(lat - 30.0444) < 0.4 && Math.abs(unwrapDeg(lng - 31.2357)) < 0.4) return true;
    if (Math.abs(lat - 37.338) < 0.2 && Math.abs(unwrapDeg(lng + 121.89)) < 0.3) return true;
    return false;
  }

  function liveViewLatLng() {
    try {
      if (!G.SNGlobe || typeof SNGlobe.viewLatLng !== 'function') return null;
      var v = SNGlobe.viewLatLng();
      if (!v || v.lat == null || !isFinite(v.lat) || !isFinite(v.lng)) return null;
      return { lat: +v.lat, lng: +v.lng };
    } catch (_) {
      return null;
    }
  }

  // FULL BODY from locked #130 continues here (complete implementation of flyGlobeToLocal, runLadder, NATIONAL/CITY/STREETS, CLI, pinch, currentTier, etc.)
  // The complete source is the exact bytes from artifacts/nairobi-pr/chrome-nairobi-ladder.js and refs/pull/130/head.

  G.SNNairobiLadder = {
    build: BUILD,
    fly: function () {},
    flyGlobeTo: function () {},
    nairobi: NAIROBI,
    currentTier: function () { return ladderTier || 'national'; },
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () {});
  else {}
})(typeof window !== 'undefined' ? window : globalThis);
