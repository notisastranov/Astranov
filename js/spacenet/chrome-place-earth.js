/* Astranov place-earth · Build 20260827114000-earth
 * NEW PR against main. Do not merge. Does not edit locked #175-#182.
 * Port of locked #174 place-fill 380a563 + #176 75bbb1c onto Grid OS canvas #g.
 *
 * window.SNGlobe is a live object (plain assign, never a stub, never a getter).
 * SNGlobe.viewLatLng()            → rendered camera look-at {lat,lng,zoom}
 * SNGlobe.viewLatLng(lat,lng,zoom) → seat camera on land. No GPS.
 *
 * Land fill: NASA Worldview snapshot (Blue Marble EPSG:4326) covers the
 * frustum bbox, then native z8 GIBS / Esri World Imagery multi-tile bind
 * with correct tile x/y. Street/satellite = zoom-in of the SAME tiles —
 * not a Leaflet sheet. #city is display:none and .on is dropped.
 *
 * Default seat: Nairobi land ~-1.286, 36.817 at z8 (locked #174 look-at).
 */
(function (global) {
  "use strict";
  var BUILD = "20260827114000-earth";
  if (global.__snPlaceEarth20260827114000) return;
  global.__snPlaceEarth20260827114000 = 1;

  var NAIROBI = { lat: -1.286, lng: 36.817 };
  var KALITHEA = { lat: 36.387557, lng: 28.222533 };
  var TILT_MAX = 1.2;
  var canvas = null;
  var ctx = null;
  var yaw = 0.55;
  var pitch = 0.18;
  var dist = 1.18;
  var zoom = 8;
  var look = { lat: NAIROBI.lat, lng: NAIROBI.lng };
  var dragging = false;
  var lx = 0;
  var ly = 0;
  var worldTex = null;
  var fillTex = null;
  var fillBox = null;
  var fillInfo = null;
  var fillBusy = false;
  var tilesBusy = false;
  var lastFillKey = "";
  var spin = false;
  var lastPaint = 0;
  var pins = [];
  var ready = false;
  var suppressMo = false;
  var dpr = 1;

  function unwrapDeg(d) {
    d = Number(d);
    if (!isFinite(d)) return 0;
    while (d > 180) d -= 360;
    while (d < -180) d += 360;
    return d;
  }

  function clamp(n, a, b) {
    n = Number(n);
    if (!isFinite(n)) return a;
    if (n < a) return a;
    if (n > b) return b;
    return n;
  }

  function hideLeaflet() {
    if (suppressMo) return;
    suppressMo = true;
    try {
      var el = document.getElementById("city");
      if (el) {
        try { el.classList.remove("on"); } catch (_) {}
        el.style.setProperty("display", "none", "important");
        el.style.setProperty("opacity", "0", "important");
        el.style.setProperty("visibility", "hidden", "important");
        el.style.setProperty("pointer-events", "none", "important");
        el.style.setProperty("z-index", "0", "important");
        el.setAttribute("aria-hidden", "true");
      }
    } catch (_) {}
    try {
      if (global.SNMap) {
        try { SNMap.active = false; } catch (_) {}
      }
    } catch (_) {}
    suppressMo = false;
  }

  function injectCss() {
    if (document.getElementById("sn-place-earth-css")) return;
    try {
      var s = document.createElement("style");
      s.id = "sn-place-earth-css";
      s.textContent =
        "html body #city,html body #city.on{" +
        "display:none!important;opacity:0!important;visibility:hidden!important;" +
        "pointer-events:none!important;z-index:0!important;}" +
        "html body #g{display:block!important;visibility:visible!important;" +
        "opacity:1!important;z-index:1!important;pointer-events:auto!important;}";
      (document.head || document.documentElement).appendChild(s);
    } catch (_) {}
    try {
      if (document.body) document.body.setAttribute("data-sn-place-earth", BUILD);
    } catch (_) {}
  }

  function watchCity() {
    try {
      var el = document.getElementById("city");
      if (el && !el.__snEarthMo) {
        var mo = new MutationObserver(function () {
          if (suppressMo) return;
          hideLeaflet();
        });
        mo.observe(el, { attributes: true, attributeFilter: ["class", "style"] });
        el.__snEarthMo = mo;
      }
    } catch (_) {}
  }

  function sizeCanvas() {
    if (!canvas) return;
    dpr = Math.min(2, global.devicePixelRatio || 1);
    var w = Math.max(1, Math.floor((global.innerWidth || 320) * dpr));
    var h = Math.max(1, Math.floor((global.innerHeight || 480) * dpr));
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
      canvas.style.width = (global.innerWidth || 320) + "px";
      canvas.style.height = (global.innerHeight || 480) + "px";
    }
  }

  function ll(lat, lng) {
    var p = ((90 - lat) * Math.PI) / 180;
    var t = ((lng + 180) * Math.PI) / 180;
    return [-Math.sin(p) * Math.cos(t), Math.cos(p), Math.sin(p) * Math.sin(t)];
  }

  function vecToLatLng(v) {
    if (!v) return null;
    var x = +v[0];
    var y = +v[1];
    var z = +v[2];
    var len = Math.sqrt(x * x + y * y + z * z) || 1;
    x /= len;
    y /= len;
    z /= len;
    var lat = 90 - (Math.acos(Math.max(-1, Math.min(1, y))) * 180) / Math.PI;
    var lng = (Math.atan2(z, -x) * 180) / Math.PI - 180;
    if (lng > 180) lng -= 360;
    if (lng < -180) lng += 360;
    if (!isFinite(lat) || !isFinite(lng)) return null;
    return { lat: lat, lng: lng };
  }

  function distForZoom(z) {
    z = Number(z);
    if (!isFinite(z)) z = 3;
    if (z <= 3) return 2.22;
    if (z >= 16) return 1.018;
    if (z <= 8) return 2.22 - ((z - 3) * (2.22 - 1.18)) / 5;
    if (z <= 12) return 1.18 - ((z - 8) * (1.18 - 1.055)) / 4;
    return 1.055 - ((z - 12) * (1.055 - 1.018)) / 4;
  }

  function zoomForDist(d) {
    d = Number(d);
    if (!isFinite(d)) return 3;
    if (d >= 2.1) return 3;
    if (d <= 1.02) return 16;
    if (d >= 1.18) return 3 + ((2.22 - d) * 5) / (2.22 - 1.18);
    if (d >= 1.055) return 8 + ((1.18 - d) * 4) / (1.18 - 1.055);
    return 12 + ((1.055 - d) * 4) / (1.055 - 1.018);
  }

  function landMode() {
    return zoom >= 6 || dist < 1.48;
  }

  function pr(p) {
    var cy = Math.cos(yaw);
    var sy = Math.sin(yaw);
    var cp = Math.cos(pitch);
    var sp = Math.sin(pitch);
    var x1 = p[0] * cy - p[2] * sy;
    var z1 = p[0] * sy + p[2] * cy;
    var y2 = p[1] * cp - z1 * sp;
    var z2 = p[1] * sp + z1 * cp;
    var w = canvas.width;
    var h = canvas.height;
    var m = Math.min(w, h);
    var depth = dist - z2;
    if (depth < 0.045) return null;
    if (z2 + dist < 0.12) return null;
    var s;
    if (landMode()) s = (m * 0.54) / depth;
    else s = (m * 0.42) / dist;
    return [w * 0.5 + x1 * s, h * 0.46 - y2 * s, z2, s];
  }

  function seatYawPitch(lat, lng) {
    var T = ll(lat, lng);
    yaw = Math.atan2(T[0], T[2]);
    var cy = Math.cos(yaw);
    var sy = Math.sin(yaw);
    var z1 = T[0] * sy + T[2] * cy;
    pitch = Math.atan2(T[1], z1);
    if (pitch > TILT_MAX) pitch = TILT_MAX;
    if (pitch < -TILT_MAX) pitch = -TILT_MAX;
  }

  function viewFromCamera() {
    var cp = Math.cos(pitch);
    var sp = Math.sin(pitch);
    var cy = Math.cos(yaw);
    var sy = Math.sin(yaw);
    var vx = 0;
    var vy = 0;
    var vz = 1;
    var y1 = vy * cp + vz * sp;
    var z1 = -vy * sp + vz * cp;
    var x = vx * cy + z1 * sy;
    var z = -vx * sy + z1 * cy;
    var llv = vecToLatLng([x, y1, z]);
    if (llv) {
      look = { lat: llv.lat, lng: llv.lng };
      return { lat: llv.lat, lng: llv.lng, zoom: zoom };
    }
    return { lat: look.lat, lng: look.lng, zoom: zoom };
  }

  function tileX(lng, z) {
    return Math.floor(((lng + 180) / 360) * Math.pow(2, z));
  }
  function tileY(lat, z) {
    var latRad = (Math.max(-85.05112878, Math.min(85.05112878, lat)) * Math.PI) / 180;
    return Math.floor(
      ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * Math.pow(2, z)
    );
  }
  function tileNorth(y, z) {
    var n = Math.PI - (2 * Math.PI * y) / Math.pow(2, z);
    return (180 / Math.PI) * Math.atan(0.5 * (Math.exp(n) - Math.exp(-n)));
  }
  function tileWest(x, z) {
    return (x / Math.pow(2, z)) * 360 - 180;
  }

  function drapeUrl(z, x, y) {
    if (z <= 8) {
      return (
        "https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/BlueMarble_NextGeneration/default/GoogleMapsCompatible_Level8/" +
        z +
        "/" +
        y +
        "/" +
        x +
        ".jpg"
      );
    }
    return "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/" + z + "/" + y + "/" + x;
  }

  function snapshotUrl(box, w, h, source) {
    if (source === "esri") {
      return (
        "https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/export?bbox=" +
        box.west +
        "," +
        box.south +
        "," +
        box.east +
        "," +
        box.north +
        "&bboxSR=4326&imageSR=4326&size=" +
        w +
        "," +
        h +
        "&format=jpg&f=image"
      );
    }
    return (
      "https://wvs.earthdata.nasa.gov/api/v1/snapshot?REQUEST=GetSnapshot&LAYERS=BlueMarble_NextGeneration&CRS=EPSG:4326&BBOX=" +
      box.west +
      "," +
      box.south +
      "," +
      box.east +
      "," +
      box.north +
      "&FORMAT=image/jpeg&WIDTH=" +
      w +
      "&HEIGHT=" +
      h
    );
  }

  function snapshotSize(box) {
    var dLat = Math.max(0.02, Math.abs(box.north - box.south));
    var dLng = Math.max(0.02, Math.abs(box.east - box.west));
    var maxPx = 2048;
    var w;
    var h;
    if (dLng >= dLat) {
      w = maxPx;
      h = Math.max(512, Math.min(maxPx, Math.round(maxPx * (dLat / dLng))));
    } else {
      h = maxPx;
      w = Math.max(512, Math.min(maxPx, Math.round(maxPx * (dLng / dLat))));
    }
    return { w: w, h: h };
  }

  function loadTileImage(url, ms) {
    return new Promise(function (resolve) {
      var img = new Image();
      var done = false;
      var to = setTimeout(function () {
        if (done) return;
        done = true;
        resolve(null);
      }, ms || 8000);
      try {
        img.crossOrigin = "anonymous";
      } catch (_) {}
      img.onload = function () {
        if (done) return;
        done = true;
        clearTimeout(to);
        if (!img.naturalWidth || img.naturalWidth < 8) return resolve(null);
        resolve(img);
      };
      img.onerror = function () {
        if (done) return;
        done = true;
        clearTimeout(to);
        resolve(null);
      };
      try {
        img.src = url;
      } catch (_) {
        if (!done) {
          done = true;
          clearTimeout(to);
          resolve(null);
        }
      }
    });
  }

  function tileRange(box, z) {
    var x0 = tileX(box.west, z);
    var x1 = tileX(box.east, z);
    var y0 = tileY(box.north, z);
    var y1 = tileY(box.south, z);
    var n = Math.pow(2, z);
    if (x1 < x0) x1 += n;
    if (y1 < y0) {
      var t = y0;
      y0 = y1;
      y1 = t;
    }
    if (y0 < 0) y0 = 0;
    if (y1 >= n) y1 = n - 1;
    return {
      z: z,
      x0: x0,
      x1: x1,
      y0: y0,
      y1: y1,
      nx: x1 - x0 + 1,
      ny: y1 - y0 + 1,
      n: n,
    };
  }

  function zoomToCover(box, maxN, capZ) {
    capZ = capZ == null ? 8 : capZ;
    if (capZ > 13) capZ = 13;
    var z;
    var last = tileRange(box, 3);
    for (z = capZ; z >= 2; z--) {
      var r = tileRange(box, z);
      last = r;
      if (r.nx * r.ny <= maxN && r.nx > 0 && r.ny > 0) return r;
    }
    return last;
  }

  function frustumBox(lat, lng, z) {
    z = z == null ? zoom : z;
    var deg = 360 / Math.pow(2, Math.max(1, z));
    var halfLat = Math.max(0.04, Math.min(55, deg * 3.8));
    var aspect = canvas && canvas.height ? canvas.width / canvas.height : 1.4;
    if (!isFinite(aspect) || aspect < 0.3) aspect = 1.4;
    var halfLng = Math.max(0.05, Math.min(90, halfLat * aspect * 1.2));
    var box = {
      south: lat - halfLat,
      north: lat + halfLat,
      west: lng - halfLng,
      east: lng + halfLng,
    };
    if (box.south < -85) box.south = -85;
    if (box.north > 85) box.north = 85;
    return box;
  }

  async function blitRange(range, timeoutMs) {
    var nx = range.nx;
    var ny = range.ny;
    if (nx < 1 || ny < 1) return null;
    var maxPx = 4096;
    var tw = 256;
    if (nx * tw > maxPx) tw = Math.max(32, Math.floor(maxPx / nx));
    if (ny * tw > maxPx) tw = Math.min(tw, Math.max(32, Math.floor(maxPx / ny)));
    var c = document.createElement("canvas");
    c.width = nx * tw;
    c.height = ny * tw;
    var cx = c.getContext("2d");
    if (!cx) return null;
    cx.fillStyle = "#0a335c";
    cx.fillRect(0, 0, c.width, c.height);
    var loaded = 0;
    var jobs = [];
    var x, y;
    for (y = range.y0; y <= range.y1; y++) {
      for (x = range.x0; x <= range.x1; x++) {
        (function (ix, iy) {
          var tx = ((ix % range.n) + range.n) % range.n;
          var col = ix - range.x0;
          var row = iy - range.y0;
          jobs.push(
            loadTileImage(drapeUrl(range.z, tx, iy), timeoutMs || 5200).then(function (img) {
              if (!img) return;
              try {
                cx.drawImage(img, col * tw, row * tw, tw, tw);
                loaded++;
              } catch (_) {}
            })
          );
        })(x, y);
      }
    }
    await Promise.all(jobs);
    if (loaded < 1) return null;
    return {
      canvas: c,
      loaded: loaded,
      wanted: nx * ny,
      z: range.z,
      west: tileWest(range.x0, range.z),
      east: tileWest(range.x1 + 1, range.z),
      north: tileNorth(range.y0, range.z),
      south: tileNorth(range.y1 + 1, range.z),
    };
  }

  async function blitSnapshot(box, source) {
    var tries = [snapshotSize(box), { w: 1024, h: 512 }];
    var t;
    for (t = 0; t < tries.length; t++) {
      var sz = tries[t];
      var img = await loadTileImage(snapshotUrl(box, sz.w, sz.h, source), 12000);
      if (!img) continue;
      var c = document.createElement("canvas");
      c.width = img.naturalWidth || sz.w;
      c.height = img.naturalHeight || sz.h;
      if (c.width < 8 || c.height < 8) continue;
      var cx = c.getContext("2d");
      if (!cx) continue;
      try {
        cx.drawImage(img, 0, 0, c.width, c.height);
      } catch (_) {
        continue;
      }
      return {
        canvas: c,
        loaded: 1,
        wanted: 1,
        z: source === "esri" ? 12 : 8,
        source: source,
        west: box.west,
        east: box.east,
        north: box.north,
        south: box.south,
      };
    }
    return null;
  }

  async function loadWorldTex() {
    var box = { west: -180, south: -90, east: 180, north: 90 };
    var snap = await blitSnapshot(box, "nasa");
    if (snap && snap.canvas) {
      worldTex = snap.canvas;
      return true;
    }
    var range = zoomToCover(box, 64, 3);
    var blit = await blitRange(range, 7000);
    if (blit && blit.canvas) {
      worldTex = blit.canvas;
      return true;
    }
    return false;
  }

  async function drapeFrustum(lat, lng, z) {
    lat = +lat;
    lng = +lng;
    z = z == null ? zoom : +z;
    if (!isFinite(lat) || !isFinite(lng)) return { ok: false, reason: "bad-ll" };
    if (fillBusy) return fillInfo || { ok: false, reason: "busy" };
    var kali = Math.abs(lat - KALITHEA.lat) < 0.45 && Math.abs(unwrapDeg(lng - KALITHEA.lng)) < 0.45;
    var source = z >= 9 || kali ? "esri" : "nasa";
    var mosaicZ = z >= 9 || kali ? Math.min(13, Math.max(10, Math.round(z))) : 8;
    var box = frustumBox(lat, lng, z);
    var key =
      source +
      ":" +
      mosaicZ +
      ":" +
      box.west.toFixed(2) +
      ":" +
      box.east.toFixed(2) +
      ":" +
      box.south.toFixed(2) +
      ":" +
      box.north.toFixed(2);
    if (key === lastFillKey && fillTex) {
      return fillInfo || { ok: true, cached: true };
    }
    fillBusy = true;
    try {
      var fillBlit = await blitSnapshot(box, source);
      if (!fillBlit) {
        var fillRange = zoomToCover(box, 200, mosaicZ > 8 ? mosaicZ : 8);
        fillBlit = await blitRange(fillRange, 7000);
      }
      if (!fillBlit) return { ok: false, reason: "fill-empty", box: box };
      fillTex = fillBlit.canvas;
      fillBox = {
        west: fillBlit.west,
        east: fillBlit.east,
        south: fillBlit.south,
        north: fillBlit.north,
      };
      var mosaicRange = tileRange(box, mosaicZ);
      if (mosaicRange.nx * mosaicRange.ny > 180) {
        var inner = kali
          ? { south: lat - 0.38, north: lat + 0.34, west: lng - 0.48, east: lng + 0.42 }
          : { south: lat - 6.2, north: lat + 6.2, west: lng - 8.4, east: lng + 8.4 };
        mosaicRange = tileRange(inner, mosaicZ);
        if (mosaicRange.nx * mosaicRange.ny > 180) {
          var half = 6;
          var cx0 = tileX(lng, mosaicZ);
          var cy0 = tileY(lat, mosaicZ);
          var n = Math.pow(2, mosaicZ);
          mosaicRange = {
            z: mosaicZ,
            x0: cx0 - half,
            x1: cx0 + half,
            y0: Math.max(0, cy0 - half),
            y1: Math.min(n - 1, cy0 + half),
            n: n,
            nx: 2 * half + 1,
            ny: Math.min(n - 1, cy0 + half) - Math.max(0, cy0 - half) + 1,
          };
        }
      }
      var tileBlit = await blitRange(mosaicRange, 5200);
      if (tileBlit && tileBlit.canvas && fillTex) {
        try {
          var overlay = document.createElement("canvas");
          overlay.width = fillTex.width;
          overlay.height = fillTex.height;
          var ox = overlay.getContext("2d");
          ox.drawImage(fillTex, 0, 0);
          var sx = ((tileBlit.west - fillBox.west) / (fillBox.east - fillBox.west)) * overlay.width;
          var ex = ((tileBlit.east - fillBox.west) / (fillBox.east - fillBox.west)) * overlay.width;
          var sy = ((fillBox.north - tileBlit.north) / (fillBox.north - fillBox.south)) * overlay.height;
          var ey = ((fillBox.north - tileBlit.south) / (fillBox.north - fillBox.south)) * overlay.height;
          ox.drawImage(tileBlit.canvas, sx, sy, ex - sx, ey - sy);
          fillTex = overlay;
        } catch (_) {}
      }
      lastFillKey = key;
      fillInfo = {
        ok: true,
        build: BUILD,
        bind: {
          finding: "not-single-tile",
          fillSource: fillBlit.source || source,
          loaded: fillBlit.loaded,
          mosaicLoaded: tileBlit ? tileBlit.loaded : 0,
          mosaicWanted: tileBlit ? tileBlit.wanted : 0,
        },
        box: box,
        fill: {
          z: fillBlit.z,
          source: fillBlit.source || source,
          w: fillTex && fillTex.width,
          h: fillTex && fillTex.height,
        },
        view: { lat: lat, lng: lng, zoom: z },
      };
      return fillInfo;
    } finally {
      fillBusy = false;
    }
  }

  function texFor(lat, lng) {
    if (fillTex && fillBox) {
      if (lat <= fillBox.north && lat >= fillBox.south) {
        var lngn = fillBox.west + unwrapDeg(lng - ((fillBox.west + fillBox.east) / 2)) + (fillBox.east - fillBox.west) / 2;
        if (lngn >= fillBox.west && lngn <= fillBox.east) return { img: fillTex, box: fillBox, lng: lngn };
      }
    }
    if (worldTex) return { img: worldTex, box: { west: -180, east: 180, south: -90, north: 90 }, lng: lng };
    return null;
  }

  function uv(box, lat, lng, img) {
    var u = ((lng - box.west) / (box.east - box.west)) * img.width;
    var v = ((box.north - lat) / (box.north - box.south)) * img.height;
    return [u, v];
  }

  function drawTexTri(c, img, s0, s1, s2, d0, d1, d2) {
    var denom = s0[0] * (s1[1] - s2[1]) + s1[0] * (s2[1] - s0[1]) + s2[0] * (s0[1] - s1[1]);
    if (!denom || Math.abs(denom) < 1e-6) return;
    var a = (d0[0] * (s1[1] - s2[1]) + d1[0] * (s2[1] - s0[1]) + d2[0] * (s0[1] - s1[1])) / denom;
    var b = (d0[0] * (s2[0] - s1[0]) + d1[0] * (s0[0] - s2[0]) + d2[0] * (s1[0] - s0[0])) / denom;
    var cc = (d0[0] * (s1[0] * s2[1] - s2[0] * s1[1]) + d1[0] * (s2[0] * s0[1] - s0[0] * s2[1]) + d2[0] * (s0[0] * s1[1] - s1[0] * s0[1])) / denom;
    var d = (d0[1] * (s1[1] - s2[1]) + d1[1] * (s2[1] - s0[1]) + d2[1] * (s0[1] - s1[1])) / denom;
    var e = (d0[1] * (s2[0] - s1[0]) + d1[1] * (s0[0] - s2[0]) + d2[1] * (s1[0] - s0[0])) / denom;
    var f = (d0[1] * (s1[0] * s2[1] - s2[0] * s1[1]) + d1[1] * (s2[0] * s0[1] - s0[0] * s2[1]) + d2[1] * (s0[0] * s1[1] - s1[0] * s0[1])) / denom;
    c.save();
    c.beginPath();
    c.moveTo(d0[0], d0[1]);
    c.lineTo(d1[0], d1[1]);
    c.lineTo(d2[0], d2[1]);
    c.closePath();
    c.clip();
    c.setTransform(a, d, b, e, cc, f);
    try {
      c.drawImage(img, 0, 0);
    } catch (_) {}
    c.restore();
  }

  function drawQuad(c, img, box, lat0, lng0, lat1, lng1, p00, p10, p01, p11) {
    var cross = (p10[0] - p00[0]) * (p01[1] - p00[1]) - (p10[1] - p00[1]) * (p01[0] - p00[0]);
    if (cross <= 0) return;
    var s00 = uv(box, lat0, lng0, img);
    var s10 = uv(box, lat0, lng1, img);
    var s01 = uv(box, lat1, lng0, img);
    var s11 = uv(box, lat1, lng1, img);
    drawTexTri(c, img, s00, s10, s01, p00, p10, p01);
    drawTexTri(c, img, s10, s11, s01, p10, p11, p01);
  }

  function drawMercatorFill(c) {
    if (!fillTex || !fillBox) return false;
    var w = canvas.width;
    var h = canvas.height;
    var lat0 = look.lat;
    var lng0 = look.lng;
    var box = fillBox;
    var pNW = pr(ll(box.north, box.west));
    var pNE = pr(ll(box.north, box.east));
    var pSW = pr(ll(box.south, box.west));
    var pSE = pr(ll(box.south, box.east));
    if (pNW && pNE && pSW && pSE) {
      drawQuad(c, fillTex, box, box.north, box.west, box.south, box.east, pNW, pNE, pSW, pSE);
      return true;
    }
    try {
      c.drawImage(fillTex, 0, 0, w, h);
      return true;
    } catch (_) {}
    return false;
  }

  function paint() {
    if (!canvas || !ctx) return;
    sizeCanvas();
    hideLeaflet();
    var w = canvas.width;
    var h = canvas.height;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = "#02040a";
    ctx.fillRect(0, 0, w, h);
    var cx = w * 0.5;
    var cy = h * 0.46;
    var m = Math.min(w, h);
    var limbR = landMode() ? m * 2 : (m * 0.42) / dist;

    if (!landMode()) {
      var g = ctx.createRadialGradient(cx, cy, limbR * 0.2, cx, cy, limbR * 1.15);
      g.addColorStop(0, "rgba(20,70,110,0.35)");
      g.addColorStop(1, "rgba(2,6,12,0)");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(cx, cy, limbR * 1.08, 0, Math.PI * 2);
      ctx.fill();
    }

    var latStep = landMode() ? (zoom >= 10 ? 2.5 : 4) : 8;
    var lngStep = landMode() ? (zoom >= 10 ? 3 : 5) : 10;
    var lat0 = -80;
    var lat1 = 80;
    var lngA = -180;
    var lngB = 180;
    if (landMode() && fillBox) {
      lat0 = Math.max(-80, fillBox.south - 2);
      lat1 = Math.min(80, fillBox.north + 2);
      lngA = fillBox.west - 2;
      lngB = fillBox.east + 2;
      latStep = Math.max(1.2, (lat1 - lat0) / 18);
      lngStep = Math.max(1.2, (lngB - lngA) / 22);
    }

    var drawn = 0;
    var lat, lng;
    for (lat = lat1; lat > lat0; lat -= latStep) {
      for (lng = lngA; lng < lngB - 0.001; lng += lngStep) {
        var la1 = lat - latStep;
        var ln1 = lng + lngStep;
        var p00 = pr(ll(lat, lng));
        var p10 = pr(ll(lat, ln1));
        var p01 = pr(ll(la1, lng));
        var p11 = pr(ll(la1, ln1));
        if (!p00 || !p10 || !p01 || !p11) continue;
        var midLat = (lat + la1) / 2;
        var midLng = (lng + ln1) / 2;
        var t = texFor(midLat, midLng);
        if (t) {
          drawQuad(ctx, t.img, t.box, lat, t.lng - (midLng - lng), la1, t.lng + (ln1 - midLng), p00, p10, p01, p11);
          drawn++;
        } else {
          var cross = (p10[0] - p00[0]) * (p01[1] - p00[1]) - (p10[1] - p00[1]) * (p01[0] - p00[0]);
          if (cross <= 0) continue;
          ctx.fillStyle = "#0a335c";
          ctx.beginPath();
          ctx.moveTo(p00[0], p00[1]);
          ctx.lineTo(p10[0], p10[1]);
          ctx.lineTo(p11[0], p11[1]);
          ctx.lineTo(p01[0], p01[1]);
          ctx.closePath();
          ctx.fill();
        }
      }
    }

    if (drawn < 4 && fillTex && landMode()) drawMercatorFill(ctx);

    if (!landMode()) {
      ctx.strokeStyle = "rgba(77,240,255,0.18)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(cx, cy, limbR, 0, Math.PI * 2);
      ctx.stroke();
    }

    var i;
    for (i = 0; i < pins.length; i++) {
      var pin = pins[i];
      var pp = pr(ll(pin.lat, pin.lng));
      if (!pp) continue;
      ctx.beginPath();
      ctx.fillStyle = pin.color || "#4df0ff";
      ctx.arc(pp[0], pp[1], 6 * dpr, 0, Math.PI * 2);
      ctx.fill();
    }

    lastPaint = Date.now();
  }

  function tick() {
    try {
      if (spin && !dragging && !landMode()) {
        yaw += 0.0016;
        viewFromCamera();
      }
      paint();
    } catch (_) {}
    requestAnimationFrame(tick);
  }

  function viewLatLng(lat, lng, z) {
    if (arguments.length === 0 || lat == null || typeof lat === "undefined") {
      return viewFromCamera();
    }
    if (typeof lat === "object" && lat && isFinite(+lat.lat)) {
      z = lng;
      lng = +lat.lng;
      lat = +lat.lat;
    }
    lat = +lat;
    lng = +lng;
    if (!isFinite(lat) || !isFinite(lng)) return viewFromCamera();
    lng = unwrapDeg(lng);
    if (z != null && isFinite(+z)) {
      zoom = clamp(+z, 2, 18);
      dist = distForZoom(zoom);
    } else if (z == null && !landMode()) {
      zoom = 8;
      dist = distForZoom(8);
    }
    spin = false;
    seatYawPitch(lat, lng);
    look = { lat: lat, lng: lng };
    hideLeaflet();
    paint();
    void waitReadableTiles(lat, lng, zoom);
    return { lat: look.lat, lng: look.lng, zoom: zoom };
  }

  async function waitReadableTiles(lat, lng, z) {
    if (tilesBusy) return !!(fillInfo && fillInfo.ok);
    tilesBusy = true;
    try {
      hideLeaflet();
      var info = await drapeFrustum(lat, lng, z);
      paint();
      return !!(info && info.ok);
    } catch (_) {
      return false;
    } finally {
      tilesBusy = false;
    }
  }

  async function flyGlobeTo(lat, lng, label) {
    if (label && typeof label === "object" && label.label) label = label.label;
    var v = viewLatLng(lat, lng, zoom < 6 ? 8 : zoom);
    return !!(v && isFinite(v.lat));
  }

  function pulse(lat, lng, opts) {
    lat = +lat;
    lng = +lng;
    if (!isFinite(lat) || !isFinite(lng)) return null;
    var pin = { lat: lat, lng: lng, color: (opts && opts.color) || "#ffe566", t: Date.now() };
    pins.push(pin);
    if (pins.length > 24) pins = pins.slice(-24);
    paint();
    return pin;
  }

  function onWheel(e) {
    try {
      e.preventDefault();
    } catch (_) {}
    var dz = e.deltaY > 0 ? 0.45 : -0.45;
    zoom = clamp(zoom + dz, 2, 16);
    dist = distForZoom(zoom);
    spin = zoom < 5;
    viewFromCamera();
    paint();
    if (landMode()) void waitReadableTiles(look.lat, look.lng, zoom);
  }

  function bindInput() {
    if (!canvas || canvas.__snEarthBound) return;
    canvas.__snEarthBound = 1;
    canvas.addEventListener("pointerdown", function (e) {
      dragging = true;
      spin = false;
      lx = e.clientX;
      ly = e.clientY;
      try { canvas.setPointerCapture(e.pointerId); } catch (_) {}
    });
    canvas.addEventListener("pointermove", function (e) {
      if (!dragging) return;
      var dx = e.clientX - lx;
      var dy = e.clientY - ly;
      lx = e.clientX;
      ly = e.clientY;
      if (landMode()) {
        var k = 0.12 / Math.max(4, zoom);
        look.lng = unwrapDeg(look.lng - dx * k);
        look.lat = clamp(look.lat + dy * k, -80, 80);
        seatYawPitch(look.lat, look.lng);
      } else {
        yaw += dx * 0.005;
        pitch = clamp(pitch + dy * 0.003, -TILT_MAX, TILT_MAX);
        viewFromCamera();
      }
    });
    function up() {
      if (!dragging) return;
      dragging = false;
      if (landMode()) void waitReadableTiles(look.lat, look.lng, zoom);
    }
    canvas.addEventListener("pointerup", up);
    canvas.addEventListener("pointercancel", up);
    canvas.addEventListener("wheel", onWheel, { passive: false });
  }

  function say(t) {
    try {
      var el = document.getElementById("line");
      if (el && t != null) el.textContent = String(t);
    } catch (_) {}
  }

  function interceptRun() {
    try {
      var SN = global.SN;
      if (!SN || typeof SN.run !== "function" || SN.run.__snEarth) return;
      var prev = SN.run.bind(SN);
      var wrap = function (raw) {
        var t = String(raw || "").trim();
        var low = t.toLowerCase();
        if (!t) return prev(raw);
        if (low === "earth" || low === "globe" || low === "land") {
          viewLatLng(look.lat, look.lng, low === "globe" ? 3 : 8);
          say(low === "globe" ? "Earth" : "Land · " + look.lat.toFixed(3) + "," + look.lng.toFixed(3));
          return;
        }
        if (low === "nairobi" || low === "kenya") {
          viewLatLng(NAIROBI.lat, NAIROBI.lng, 8);
          say("Nairobi · Kenya land");
          return;
        }
        if (low === "kalithea" || low === "rhodes") {
          viewLatLng(KALITHEA.lat, KALITHEA.lng, 12);
          say("Kalithea · Rhodes");
          return;
        }
        if (low === "streets" || low === "street" || low === "satellite" || low === "sat") {
          viewLatLng(look.lat, look.lng, low.indexOf("sat") === 0 ? 12 : 15);
          say(low.indexOf("sat") === 0 ? "Satellite" : "Streets · same globe tiles");
          return;
        }
        if (/^go\s+/.test(low) || /^-?\d+(\.\d+)?\s*,\s*-?\d+(\.\d+)?$/.test(low)) {
          var m = t.match(/(-?\d+(\.\d+)?)\s*,\s*(-?\d+(\.\d+)?)/);
          if (m) {
            viewLatLng(+m[1], +m[3], 8);
            say("Land · " + (+m[1]).toFixed(3) + "," + (+m[3]).toFixed(3));
            return;
          }
        }
        if (low.indexOf("pizza") >= 0) {
          try {
            if (global.SNChromeGuestPizzaHunt && typeof SNChromeGuestPizzaHunt.hunt === "function") {
              SNChromeGuestPizzaHunt.hunt(t);
              return;
            }
          } catch (_) {}
          say("Pizza · loading");
          return;
        }
        if (low.indexOf("pay") >= 0 || low === "call" || low.indexOf("order") >= 0) {
          say("Pizza box — guest hunt only.");
          return;
        }
        if (low === "locate" || low === "where am i") {
          var v = viewFromCamera();
          say("Camera · " + v.lat.toFixed(4) + "," + v.lng.toFixed(4) + " · z" + v.zoom.toFixed(1) + " · no GPS");
          return;
        }
        return prev(raw);
      };
      wrap.__snEarth = 1;
      SN.run = wrap;
    } catch (_) {}
  }

  function makeGlobe() {
    var api = {
      build: BUILD,
      ready: true,
      viewLatLng: viewLatLng,
      flyGlobeTo: flyGlobeTo,
      pulse: pulse,
      paint: paint,
      stopMotion: function () { spin = false; },
      zeroInertia: function () { spin = false; },
      setFocus: function (lat, lng) {
        if (isFinite(+lat) && isFinite(+lng)) {
          look = { lat: +lat, lng: +lng };
          seatYawPitch(look.lat, look.lng);
        }
      },
      getEarth: function () {
        return { name: "earth", isMesh: true, visible: true };
      },
      getCamera: function () {
        return { position: { x: 0, y: 0, z: dist }, aspect: canvas ? canvas.width / canvas.height : 1.4 };
      },
      getRenderer: function () {
        return { domElement: canvas };
      },
      getScene: function () { return { name: "scene" }; },
      getSpin: function () { return { rotation: { y: yaw, x: 0, z: 0, set: function (x, y) { yaw = y; } } }; },
      getTilt: function () { return { rotation: { x: pitch, y: 0, z: 0, set: function (x) { pitch = x; } } }; },
      getPhysics: function () { return { tZ: dist, vZ: 0, velX: 0, velY: 0, vTilt: 0, vSpin: 0 }; },
      pickLatLng: function () { return viewFromCamera(); },
      latLngToVec: function (lat, lng, r) {
        r = r == null ? 1 : r;
        var p = ll(lat, lng);
        return { x: p[0] * r, y: p[1] * r, z: p[2] * r };
      },
      goToPlace: function (lat, lng) { return flyGlobeTo(lat, lng); },
      flyNear: function (lat, lng) { return viewLatLng(lat, lng, zoom); },
      __snPlaceLand: BUILD,
      __snPlaceEarthThin: false,
    };
    try {
      delete global.SNGlobe;
    } catch (_) {}
    global.SNGlobe = api;
    return api;
  }

  function ensureCanvas() {
    canvas = document.getElementById("g");
    if (!canvas) return false;
    try {
      ctx = canvas.getContext("2d", { alpha: false });
    } catch (_) {
      ctx = canvas.getContext("2d");
    }
    return !!ctx;
  }

  function ensure() {
    injectCss();
    hideLeaflet();
    watchCity();
    if (!ensureCanvas()) return global.SNGlobe || null;
    sizeCanvas();
    bindInput();
    interceptRun();
    var g = makeGlobe();
    ready = true;
    return g;
  }

  async function bootEarth() {
    ensure();
    seatYawPitch(NAIROBI.lat, NAIROBI.lng);
    look = { lat: NAIROBI.lat, lng: NAIROBI.lng };
    zoom = 8;
    dist = distForZoom(8);
    spin = false;
    paint();
    try {
      await loadWorldTex();
      paint();
    } catch (_) {}
    try {
      await drapeFrustum(NAIROBI.lat, NAIROBI.lng, 8);
      paint();
    } catch (_) {}
    viewLatLng(NAIROBI.lat, NAIROBI.lng, 8);
    try {
      say("Earth · Kenya land · no GPS");
    } catch (_) {}
  }

  function boot() {
    ensure();
    if (!canvas) {
      setTimeout(boot, 50);
      return;
    }
    if (!global.__snEarthTick) {
      global.__snEarthTick = 1;
      requestAnimationFrame(tick);
    }
    void bootEarth();
  }

  boot();
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  }
  setTimeout(boot, 0);
  setTimeout(boot, 250);
  setTimeout(boot, 800);
  setInterval(function () {
    ensure();
    hideLeaflet();
    interceptRun();
  }, 1500);

  global.SNPlaceEarth = {
    build: BUILD,
    ensure: ensure,
    flyGlobeTo: flyGlobeTo,
    viewLatLng: viewLatLng,
    waitReadableTiles: waitReadableTiles,
    fillInfo: function () {
      return fillInfo;
    },
  };
  global.SNPlaceLand = global.SNPlaceEarth;
})(typeof window !== "undefined" ? window : globalThis);
