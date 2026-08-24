/* Astranov place-fill · Build 20260824053000-place-fill
 * PR #174 only. Do not merge. Does not edit #130 / #131.
 *
 * window.SNGlobe is the LIVE globe.js object (plain assign, never a stub,
 * never a getter). viewLatLng is a function returning the rendered camera
 * look-at {lat,lng}. KEEP flyGlobeTo + those exact look-ats:
 *   after nairobi settle ~-1.286, 36.817
 *   after kalithea settle ~36.389, 28.223
 *
 * VERIFY (20260824053000): NOT a single-tile bind. Live probe after nairobi
 * bound 49 unique NASA textures on 49 meshes. The fail is frustum coverage:
 * camera FOV at land zoom (42°, z=1.58, 16:9) spans ~88°×38° ≈ 1800 z8
 * tiles; code only requested a 7×7 (~10°) window. NASA GIBS z8 / Esri cover
 * the whole world — those tiles exist — they were never fetched. Result:
 * one sharp NASA rectangle on the 2048 blue-marble smear. Kalithea same
 * plus earth-levels white placeholders.
 *
 * FIX: pull camera in to land z; raycast the frustum; blit a z8 (or the
 * finest zoom that fits) mosaic covering the FULL tile range of that
 * frustum onto one canvas / one mesh (correct UV). z8 inset around the
 * look-at. Leaflet hidden. Do NOT hide sn-earth-drape.
 *
 * Guest kalithea prints CLI rungs:
 *   Kalithea · village · Rhodes / lake / islands / olives
 */
(function (global) {
  "use strict";
  var BUILD = "20260824053000-place-fill";
  if (global.__snPlaceFill20260824053000) return;
  global.__snPlaceFill20260824053000 = 1;

  var NAIROBI = { lat: -1.286, lng: 36.817 };
  var KALITHEA = { lat: 36.387557, lng: 28.222533 };
  var RHODES = { lat: 36.44, lng: 28.22 };
  var SETTLE_DEG = 0.15;
  var TILT_MAX = 1.05;
  var Z_NAIROBI = 1.58;
  var Z_KALITHEA = 1.42;
  var Z_FLOOR = 1.42;
  var lastLive = null;
  var lastFly = null;
  var lastProbe = { sLat: 0, sLng: 0 };
  var adopted = null;
  var drapeGroup = null;
  var drapeLoader = null;
  var drapeCache = Object.create(null);
  var drapeLast = "";
  var fillMesh = null;
  var detailMesh = null;
  var fillLast = "";
  var fillInfo = null;
  var fillBusy = false;
  var tilesBusy = false;
  var kaliBusy = false;
  var cliWrap = null;
  var capUntil = 0;
  var holdEuler = null;
  var suppressMo = false;

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

  function isNairobiCoord(lat, lng) {
    lat = Number(lat);
    lng = Number(lng);
    if (!isFinite(lat) || !isFinite(lng)) return false;
    return Math.abs(lat - NAIROBI.lat) < 0.55 && Math.abs(unwrapDeg(lng - NAIROBI.lng)) < 0.55;
  }

  function isKalitheaCoord(lat, lng) {
    lat = Number(lat);
    lng = Number(lng);
    if (!isFinite(lat) || !isFinite(lng)) return false;
    if (Math.abs(lat - KALITHEA.lat) < 0.35 && Math.abs(unwrapDeg(lng - KALITHEA.lng)) < 0.35) return true;
    if (Math.abs(lat - RHODES.lat) < 0.45 && Math.abs(unwrapDeg(lng - RHODES.lng)) < 0.45) return true;
    return false;
  }

  function threeNS() {
    try {
      return global.THREE || null;
    } catch (_) {
      return null;
    }
  }

  function liveGlobe() {
    try {
      if (adopted && isLiveGlobeApi(adopted)) return adopted;
    } catch (_) {}
    try {
      var g = global.SNGlobe;
      if (isLiveGlobeApi(g)) return g;
    } catch (_) {}
    return null;
  }

  function isLiveGlobeApi(g) {
    if (!g || typeof g !== "object") return false;
    if (g.__snPlaceEarthThin) return false;
    try {
      if (typeof g.pulse !== "function") return false;
      if (typeof g.getEarth !== "function") return false;
      if (typeof g.getCamera !== "function") return false;
      if (typeof g.goToPlace !== "function") return false;
      if (typeof g.viewLatLng !== "function" && typeof g.pickLatLng !== "function") return false;
    } catch (_) {
      return false;
    }
    return true;
  }

  function injectCss() {
    if (document.getElementById("sn-place-land-css")) return;
    try {
      var s = document.createElement("style");
      s.id = "sn-place-land-css";
      s.textContent =
        "html body[data-sn-place-land] #globe," +
        "html body[data-sn-place-land] #globe.city-hidden{" +
        "visibility:visible!important;opacity:1!important;pointer-events:auto!important;z-index:1!important;display:block!important;}" +
        "html body[data-sn-place-land] #globe canvas{display:block!important;visibility:visible!important;opacity:1!important;}" +
        "html body[data-sn-place-land] #city-map," +
        "html body[data-sn-place-land] #city-map.active{" +
        "opacity:0!important;pointer-events:none!important;z-index:0!important;visibility:hidden!important;}";
      (document.head || document.documentElement).appendChild(s);
    } catch (_) {}
    try {
      if (document.body) document.body.setAttribute("data-sn-place-land", BUILD);
    } catch (_) {}
  }

  function keepEarthVisible() {
    injectCss();
    if (suppressMo) return;
    suppressMo = true;
    try {
      var globe = document.getElementById("globe");
      if (globe) {
        if (globe.classList.contains("city-hidden")) globe.classList.remove("city-hidden");
        if (globe.style.visibility !== "visible") globe.style.visibility = "visible";
        if (globe.style.opacity !== "1") globe.style.opacity = "1";
        if (globe.style.pointerEvents !== "auto") globe.style.pointerEvents = "auto";
        if (globe.style.zIndex !== "1") globe.style.zIndex = "1";
      }
    } catch (_) {}
    try {
      document.body.classList.remove("city-map-on");
    } catch (_) {}
    suppressMo = false;
  }

  function hideCoveringTiles() {
    if (suppressMo) return;
    suppressMo = true;
    try {
      var map = document.getElementById("city-map");
      if (map) {
        if (map.classList.contains("active")) map.classList.remove("active");
        map.setAttribute("aria-hidden", "true");
        if (map.style.opacity !== "0") map.style.opacity = "0";
        if (map.style.pointerEvents !== "none") map.style.pointerEvents = "none";
        if (map.style.zIndex !== "0") map.style.zIndex = "0";
        if (map.style.visibility !== "hidden") map.style.visibility = "hidden";
      }
    } catch (_) {}
    try {
      if (global.SNMap) {
        try {
          SNMap.active = false;
        } catch (_) {}
      }
    } catch (_) {}
    suppressMo = false;
    keepEarthVisible();
  }

  function watchHide() {
    try {
      var globe = document.getElementById("globe");
      if (globe && !globe.__snPlaceLandMo) {
        var mo = new MutationObserver(function () {
          if (suppressMo) return;
          keepEarthVisible();
          hideCoveringTiles();
        });
        mo.observe(globe, { attributes: true, attributeFilter: ["class"] });
        globe.__snPlaceLandMo = mo;
      }
    } catch (_) {}
    try {
      var map = document.getElementById("city-map");
      if (map && !map.__snPlaceLandMo) {
        var mo2 = new MutationObserver(function () {
          if (suppressMo) return;
          hideCoveringTiles();
        });
        mo2.observe(map, { attributes: true, attributeFilter: ["class"] });
        map.__snPlaceLandMo = mo2;
      }
    } catch (_) {}
  }

  function nodeIsSceneOrCam(n) {
    if (!n) return true;
    try {
      if (n.isScene || n.type === "Scene") return true;
      if (n.isCamera || (n.type && String(n.type).indexOf("Camera") >= 0)) return true;
    } catch (_) {}
    return false;
  }

  function tiltSpinNodes(g) {
    var out = { earth: null, spin: null, tilt: null };
    g = g || liveGlobe();
    try {
      var earth = g && typeof g.getEarth === "function" ? g.getEarth() : null;
      out.earth = earth;
      if (!earth) return out;
      var spin = earth.parent;
      var tilt = spin ? spin.parent : null;
      if (spin && !nodeIsSceneOrCam(spin)) out.spin = spin;
      if (tilt && !nodeIsSceneOrCam(tilt)) out.tilt = tilt;
      if (!out.tilt && g && typeof g.getTilt === "function") out.tilt = g.getTilt();
      if (!out.spin && g && typeof g.getSpin === "function") out.spin = g.getSpin();
    } catch (_) {}
    return out;
  }

  function paintGlobe(g) {
    g = g || liveGlobe();
    try {
      if (g && typeof g.paint === "function") g.paint();
    } catch (_) {}
  }

  function paintTiltSpin(nodes, g) {
    g = g || liveGlobe();
    nodes = nodes || tiltSpinNodes(g);
    try {
      if (nodes.tilt && nodes.tilt.updateMatrixWorld) nodes.tilt.updateMatrixWorld(true);
    } catch (_) {}
    try {
      if (nodes.spin && nodes.spin.updateMatrixWorld) nodes.spin.updateMatrixWorld(true);
    } catch (_) {}
    try {
      if (nodes.earth && nodes.earth.updateMatrixWorld) nodes.earth.updateMatrixWorld(true);
    } catch (_) {}
    try {
      var cam = g && typeof g.getCamera === "function" ? g.getCamera() : null;
      if (cam && cam.updateMatrixWorld) cam.updateMatrixWorld(true);
    } catch (_) {}
    paintGlobe(g);
  }

  function addRot(node, axis, delta) {
    if (!node || !node.rotation) return false;
    try {
      node.rotation[axis] = (+node.rotation[axis] || 0) + delta;
      try {
        node.matrixAutoUpdate = true;
      } catch (_) {}
      return true;
    } catch (_) {
      return false;
    }
  }

  function readRot(node, axis) {
    try {
      return node && node.rotation ? +node.rotation[axis] : 0;
    } catch (_) {
      return 0;
    }
  }

  function writeRot(node, axis, val) {
    try {
      if (node && node.rotation) node.rotation[axis] = val;
    } catch (_) {}
  }

  function vecToLatLngLocal(v) {
    if (!v) return null;
    try {
      var n = v.clone ? v.clone() : { x: +v.x, y: +v.y, z: +v.z };
      var len = Math.sqrt(n.x * n.x + n.y * n.y + n.z * n.z) || 1;
      n.x /= len;
      n.y /= len;
      n.z /= len;
      var lat = 90 - (Math.acos(Math.max(-1, Math.min(1, n.y))) * 180) / Math.PI;
      var lng = (Math.atan2(n.z, -n.x) * 180) / Math.PI - 180;
      if (lng > 180) lng -= 360;
      if (lng < -180) lng += 360;
      if (!isFinite(lat) || !isFinite(lng)) return null;
      return { lat: lat, lng: lng };
    } catch (_) {
      return null;
    }
  }

  function latLngToLocal(lat, lng) {
    var phi = ((90 - Number(lat)) * Math.PI) / 180;
    var theta = ((Number(lng) + 180) * Math.PI) / 180;
    return {
      x: -Math.sin(phi) * Math.cos(theta),
      y: Math.cos(phi),
      z: Math.sin(phi) * Math.sin(theta),
    };
  }

  function applyRx(p, a) {
    var c = Math.cos(a);
    var s = Math.sin(a);
    return { x: p.x, y: p.y * c - p.z * s, z: p.y * s + p.z * c };
  }

  function applyRy(p, a) {
    var c = Math.cos(a);
    var s = Math.sin(a);
    return { x: p.x * c + p.z * s, y: p.y, z: -p.x * s + p.z * c };
  }

  /* Camera is at (0, cy, cz) looking down -Z. Screen-center hit on the unit
   * sphere is (0, cy, +sqrt(1-cy^2)) — the +Z face, not +X. */
  function lookWorldPoint(g) {
    var cy = 0.06;
    try {
      var cam = g && typeof g.getCamera === "function" ? g.getCamera() : null;
      if (cam && cam.position && isFinite(+cam.position.y)) cy = +cam.position.y;
    } catch (_) {}
    if (cy > 0.92) cy = 0.92;
    if (cy < -0.92) cy = -0.92;
    var cz = Math.sqrt(Math.max(1e-8, 1 - cy * cy));
    return { x: 0, y: cy, z: cz };
  }

  function eulerForLatLng(g, lat, lng) {
    var T = latLngToLocal(lat, lng);
    var W = lookWorldPoint(g);
    var beta = Math.atan2(-T.x, T.z);
    var Tp = applyRy(T, beta);
    if (Tp.z < 0) {
      beta += Math.PI;
      Tp = applyRy(T, beta);
    }
    var alpha = Math.atan2(Tp.y, Tp.z) - Math.atan2(W.y, W.z);
    if (alpha > TILT_MAX) alpha = TILT_MAX;
    if (alpha < -TILT_MAX) alpha = -TILT_MAX;
    return { x: alpha, y: beta };
  }

  function analyticView(g) {
    g = g || liveGlobe();
    var nodes = tiltSpinNodes(g);
    if (!nodes.tilt || !nodes.spin) return null;
    var W = lookWorldPoint(g);
    var a = readRot(nodes.tilt, "x");
    var b = readRot(nodes.spin, "y");
    var p = applyRy(applyRx(W, -a), -b);
    return vecToLatLngLocal(p);
  }

  function canvasCenterPick(g) {
    g = g || liveGlobe();
    if (!g) return null;
    var nodes = tiltSpinNodes(g);
    paintTiltSpin(nodes, g);
    try {
      var earth = nodes.earth || (typeof g.getEarth === "function" ? g.getEarth() : null);
      var camera = typeof g.getCamera === "function" ? g.getCamera() : null;
      var T = threeNS();
      if (earth && camera && T && T.Raycaster) {
        if (earth.updateMatrixWorld) earth.updateMatrixWorld(true);
        if (camera.updateMatrixWorld) camera.updateMatrixWorld(true);
        var ray = new T.Raycaster();
        ray.setFromCamera(new T.Vector2(0, 0), camera);
        var hits = ray.intersectObject(earth, false);
        if (hits && hits.length) {
          var local = earth.worldToLocal(hits[0].point.clone());
          var ll = vecToLatLngLocal(local);
          if (ll && isFinite(ll.lat) && isFinite(ll.lng)) return ll;
        }
      }
    } catch (_) {}
    try {
      if (typeof g.pickLatLng === "function") {
        var ren = typeof g.getRenderer === "function" ? g.getRenderer() : null;
        var el = (ren && ren.domElement) || document.querySelector("#globe canvas");
        if (el && el.getBoundingClientRect) {
          var r = el.getBoundingClientRect();
          if (r.width && r.height) {
            var picked = g.pickLatLng(r.left + r.width * 0.5, r.top + r.height * 0.5);
            if (picked && isFinite(picked.lat) && isFinite(picked.lng)) {
              return { lat: +picked.lat, lng: +picked.lng };
            }
          }
        }
      }
    } catch (_) {}
    return null;
  }

  function viewLatLngFromCamera() {
    var g = liveGlobe();
    var live = canvasCenterPick(g);
    if (live && isFinite(live.lat) && isFinite(live.lng)) {
      lastLive = { lat: +live.lat, lng: +live.lng };
      return lastLive;
    }
    var analytic = analyticView(g);
    if (analytic && isFinite(analytic.lat) && isFinite(analytic.lng)) {
      lastLive = { lat: +analytic.lat, lng: +analytic.lng };
      return lastLive;
    }
    return lastLive;
  }

  function callStopMotion(g) {
    g = g || liveGlobe();
    try {
      if (g && typeof g.stopMotion === "function") g.stopMotion();
    } catch (_) {}
  }

  function callZeroInertia(g) {
    g = g || liveGlobe();
    try {
      if (g && typeof g.zeroInertia === "function") g.zeroInertia();
    } catch (_) {}
    try {
      var p = g && typeof g.getPhysics === "function" ? g.getPhysics() : null;
      if (p) {
        p.velX = 0;
        p.velY = 0;
        p.vTilt = 0;
        p.vSpin = 0;
        p.vZ = 0;
      }
    } catch (_) {}
  }

  function dispatchPointerCancel(g) {
    var canvas = null;
    try {
      var ren = g && typeof g.getRenderer === "function" ? g.getRenderer() : null;
      if (ren && ren.domElement) canvas = ren.domElement;
    } catch (_) {}
    try {
      if (!canvas) canvas = document.querySelector("#globe canvas");
    } catch (_) {}
    if (!canvas) return;
    try {
      var opts = { bubbles: true, cancelable: true, pointerId: 1, isPrimary: true };
      try {
        canvas.dispatchEvent(new PointerEvent("pointercancel", opts));
      } catch (_) {
        canvas.dispatchEvent(new Event("pointercancel", { bubbles: true, cancelable: true }));
      }
    } catch (_) {}
  }

  function snapTiltSpin(g, lat, lng) {
    try {
      var nodes = tiltSpinNodes(g);
      var tilt = nodes.tilt;
      var spin = nodes.spin;
      if (!tilt || !spin) return false;
      var e = eulerForLatLng(g, lat, lng);
      tilt.rotation.set(e.x, 0, 0);
      spin.rotation.set(0, e.y, 0);
      try {
        tilt.matrixAutoUpdate = true;
        spin.matrixAutoUpdate = true;
      } catch (_) {}
      holdEuler = { x: e.x, y: e.y, lat: +lat, lng: +lng };
      paintTiltSpin(nodes, g);
      return true;
    } catch (_) {
      return false;
    }
  }

  function minZFor(lat, lng) {
    if (isNairobiCoord(lat, lng)) return Z_NAIROBI;
    if (isKalitheaCoord(lat, lng)) return Z_KALITHEA;
    return Z_FLOOR;
  }

  function capCameraZ(g, lat, lng) {
    g = g || liveGlobe();
    if (!g) return;
    var cam = null;
    try {
      cam = typeof g.getCamera === "function" ? g.getCamera() : null;
    } catch (_) {}
    if (!cam || !cam.position) return;
    var zMin = minZFor(lat, lng);
    var z = +cam.position.z;
    if (!isFinite(z) || z >= zMin) return;
    try {
      cam.position.z = zMin;
    } catch (_) {}
    paintGlobe(g);
  }

  /* Pull camera IN from GLOBAL (z=5.4) to land altitude. capCameraZ only
   * blocked going closer, so flyGlobeTo left the guest in space with a
   * postage-stamp z8 scrap on the facing hemisphere. */
  function pullInLandZ(g, lat, lng) {
    g = g || liveGlobe();
    if (!g) return;
    var cam = null;
    try {
      cam = typeof g.getCamera === "function" ? g.getCamera() : null;
    } catch (_) {}
    if (!cam || !cam.position) return;
    var zWant = minZFor(lat, lng);
    var z = +cam.position.z;
    if (!isFinite(zWant)) return;
    if (!isFinite(z) || z > zWant + 0.02) {
      try {
        cam.position.z = zWant;
      } catch (_) {}
      paintGlobe(g);
    }
  }

  function holdLookFrame(g) {
    if (!holdEuler || !lastFly) return;
    if (Date.now() > capUntil) return;
    g = g || liveGlobe();
    var nodes = tiltSpinNodes(g);
    if (!nodes.tilt || !nodes.spin) return;
    try {
      if (Math.abs(readRot(nodes.tilt, "x") - holdEuler.x) > 0.0004) {
        nodes.tilt.rotation.set(holdEuler.x, 0, 0);
      }
      if (Math.abs(readRot(nodes.spin, "y") - holdEuler.y) > 0.0004) {
        nodes.spin.rotation.set(0, holdEuler.y, 0);
      }
    } catch (_) {}
    capCameraZ(g, lastFly.lat, lastFly.lng);
  }

  function probeNodeAxis(node, axis, kind, nodes, earth, g) {
    if (!node || node === earth || !node.rotation) return 0;
    var v0 = viewLatLngFromCamera();
    if (!v0) return 0;
    var old = readRot(node, axis);
    addRot(node, axis, 0.04);
    callZeroInertia(g);
    paintTiltSpin(nodes, g);
    var v1 = viewLatLngFromCamera();
    writeRot(node, axis, old);
    callZeroInertia(g);
    paintTiltSpin(nodes, g);
    if (!v1) return 0;
    var d = kind === "lat" ? v1.lat - v0.lat : unwrapDeg(v1.lng - v0.lng);
    return axisSign(d);
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

  function sleep(ms) {
    return new Promise(function (resolve) {
      setTimeout(resolve, ms);
    });
  }

  function drapeUrl(z, x, y) {
    try {
      var gtiles = global.SNEarthLevels && typeof SNEarthLevels.google === "function" ? SNEarthLevels.google() : null;
      if (gtiles && gtiles.ok && gtiles.proxy) {
        return "/api/gtiles?z=" + z + "&x=" + x + "&y=" + y;
      }
    } catch (_) {}
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

  function namedGroup(name) {
    var found = null;
    try {
      var g = liveGlobe();
      var roots = [];
      try {
        if (g && typeof g.getSpin === "function" && g.getSpin()) roots.push(g.getSpin());
      } catch (_) {}
      try {
        if (g && typeof g.getEarth === "function" && g.getEarth()) roots.push(g.getEarth());
      } catch (_) {}
      try {
        if (g && typeof g.getScene === "function" && g.getScene()) roots.push(g.getScene());
      } catch (_) {}
      var i;
      for (i = 0; i < roots.length; i++) {
        var root = roots[i];
        if (!root || typeof root.traverse !== "function") continue;
        root.traverse(function (obj) {
          if (found || !obj) return;
          try {
            if (String(obj.name || "") === name) found = obj;
          } catch (_) {}
        });
        if (found) break;
      }
    } catch (_) {}
    return found;
  }

  function countMapped(group) {
    var n = 0;
    var total = 0;
    var tex = Object.create(null);
    if (!group || typeof group.traverse !== "function") return { n: 0, total: 0, unique: 0 };
    try {
      group.traverse(function (obj) {
        if (!obj || !obj.isMesh) return;
        total++;
        try {
          if (obj.material && obj.material.map) {
            n++;
            try {
              tex[obj.material.map.uuid || obj.material.map.id] = 1;
            } catch (_) {}
            try {
              obj.visible = true;
            } catch (_) {}
          }
        } catch (_) {}
      });
    } catch (_) {}
    return { n: n, total: total, unique: Object.keys(tex).length };
  }

  function hideWhitePlaceholders(group) {
    if (!group || typeof group.traverse !== "function") return;
    try {
      group.traverse(function (obj) {
        if (!obj || !obj.isMesh || !obj.material) return;
        try {
          var mapped = !!obj.material.map;
          var white = false;
          try {
            white = !!(obj.material.color && obj.material.color.getHex && obj.material.color.getHex() === 0xffffff);
          } catch (_) {}
          if (!mapped && white) obj.visible = false;
          else if (mapped) obj.visible = true;
        } catch (_) {}
      });
    } catch (_) {}
  }

  function hideBrokenEarthDrape() {
    try {
      var earthDrape = namedGroup("sn-earth-drape");
      if (earthDrape) {
        try {
          earthDrape.visible = true;
        } catch (_) {}
        hideWhitePlaceholders(earthDrape);
      }
      if (drapeGroup) {
        try {
          drapeGroup.visible = true;
        } catch (_) {}
        hideWhitePlaceholders(drapeGroup);
      }
    } catch (_) {}
  }

  function disposeMesh(mesh) {
    if (!mesh) return;
    try {
      if (mesh.parent) mesh.parent.remove(mesh);
    } catch (_) {}
    try {
      if (mesh.geometry) mesh.geometry.dispose();
    } catch (_) {}
    try {
      if (mesh.material) {
        if (mesh.material.map) mesh.material.map.dispose();
        mesh.material.dispose();
      }
    } catch (_) {}
  }

  function clearDrape() {
    try {
      Object.keys(drapeCache).forEach(function (k) {
        disposeMesh(drapeCache[k]);
        delete drapeCache[k];
      });
    } catch (_) {}
    disposeMesh(fillMesh);
    disposeMesh(detailMesh);
    fillMesh = null;
    detailMesh = null;
    try {
      if (drapeGroup && drapeGroup.parent) drapeGroup.parent.remove(drapeGroup);
    } catch (_) {}
    drapeGroup = null;
    drapeLast = "";
    fillLast = "";
  }

  function ensureDrapeHost(g, T) {
    if (drapeGroup && drapeGroup.parent) return drapeGroup;
    var earth = null;
    try {
      earth = g.getEarth();
    } catch (_) {}
    if (!earth) return null;
    drapeGroup = new T.Group();
    drapeGroup.name = "sn-place-tiles-drape";
    try {
      earth.add(drapeGroup);
    } catch (_) {
      drapeGroup = null;
      return null;
    }
    return drapeGroup;
  }

  function ndcHit(g, nx, ny) {
    var T = threeNS();
    if (!g || !T || !T.Raycaster) return null;
    try {
      var earth = typeof g.getEarth === "function" ? g.getEarth() : null;
      var camera = typeof g.getCamera === "function" ? g.getCamera() : null;
      if (!earth || !camera) return null;
      if (earth.updateMatrixWorld) earth.updateMatrixWorld(true);
      if (camera.updateMatrixWorld) camera.updateMatrixWorld(true);
      var ray = new T.Raycaster();
      ray.setFromCamera(new T.Vector2(nx, ny), camera);
      var hits = ray.intersectObject(earth, false);
      if (hits && hits.length) {
        var local = earth.worldToLocal(hits[0].point.clone());
        return vecToLatLngLocal(local);
      }
    } catch (_) {}
    return null;
  }

  function estimateBox(g, lat, lng) {
    var cam = null;
    try {
      cam = g && typeof g.getCamera === "function" ? g.getCamera() : null;
    } catch (_) {}
    var z = cam && cam.position ? +cam.position.z : 1.58;
    var aspect = cam && cam.aspect ? +cam.aspect : 1.4;
    if (!isFinite(z) || z < 1.02) z = 1.58;
    if (!isFinite(aspect) || aspect < 0.3) aspect = 1.4;
    var dist = Math.max(0.06, z - 1);
    var halfLat = Math.max(5, Math.min(55, dist * 48));
    var halfLng = Math.max(7, Math.min(95, halfLat * aspect * 1.25));
    return {
      south: lat - halfLat,
      north: lat + halfLat,
      west: lng - halfLng,
      east: lng + halfLng,
    };
  }

  function frustumBox(g, lat, lng) {
    g = g || liveGlobe();
    lat = +lat;
    lng = +lng;
    var hits = [];
    var u, v;
    for (v = -1; v <= 1.001; v += 0.5) {
      for (u = -1; u <= 1.001; u += 0.5) {
        var h = ndcHit(g, u, v);
        if (h && isFinite(h.lat) && isFinite(h.lng)) hits.push(h);
      }
    }
    var box;
    if (hits.length >= 3) {
      var lats = [];
      var lngs = [];
      var i;
      for (i = 0; i < hits.length; i++) {
        lats.push(hits[i].lat);
        lngs.push(lng + unwrapDeg(hits[i].lng - lng));
      }
      box = {
        south: Math.min.apply(null, lats),
        north: Math.max.apply(null, lats),
        west: Math.min.apply(null, lngs),
        east: Math.max.apply(null, lngs),
      };
    } else {
      box = estimateBox(g, lat, lng);
    }
    var dLat = Math.max(1.2, (box.north - box.south) * 0.14);
    var dLng = Math.max(1.6, (box.east - box.west) * 0.14);
    box.south -= dLat;
    box.north += dLat;
    box.west -= dLng;
    box.east += dLng;
    if (box.south < -85) box.south = -85;
    if (box.north > 85) box.north = 85;
    if (lat < box.south) box.south = lat - 1.5;
    if (lat > box.north) box.north = lat + 1.5;
    if (lng < box.west) box.west = lng - 2;
    if (lng > box.east) box.east = lng + 2;
    return box;
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

  function latLngVec(g, T, la, ln, r) {
    if (g && typeof g.latLngToVec === "function") return g.latLngToVec(la, ln, r);
    var phi = ((90 - la) * Math.PI) / 180;
    var theta = ((ln + 180) * Math.PI) / 180;
    return new T.Vector3(
      -r * Math.sin(phi) * Math.cos(theta),
      r * Math.cos(phi),
      r * Math.sin(phi) * Math.sin(theta)
    );
  }

  function makeBBoxGeom(T, g, south, north, west, east, radius) {
    var dLat = Math.abs(north - south);
    var dLng = Math.abs(east - west);
    var segs = Math.max(8, Math.min(28, Math.round(Math.max(dLat, dLng) / 3) + 8));
    var pos = [];
    var uv = [];
    var idx = [];
    var cols = segs + 1;
    var i, j;
    for (i = 0; i <= segs; i++) {
      var vv = i / segs;
      var la = north + (south - north) * vv;
      for (j = 0; j <= segs; j++) {
        var uu = j / segs;
        var ln = west + (east - west) * uu;
        var p = latLngVec(g, T, la, ln, radius);
        pos.push(p.x, p.y, p.z);
        uv.push(uu, 1 - vv);
      }
    }
    for (var row = 0; row < segs; row++) {
      for (var col = 0; col < segs; col++) {
        var a = row * cols + col;
        var b = a + 1;
        var c = a + cols;
        var d = c + 1;
        idx.push(a, c, b, b, c, d);
      }
    }
    var geo = new T.BufferGeometry();
    geo.setAttribute("position", new T.Float32BufferAttribute(pos, 3));
    geo.setAttribute("uv", new T.Float32BufferAttribute(uv, 2));
    geo.setIndex(idx);
    try {
      geo.computeVertexNormals();
    } catch (_) {}
    return geo;
  }

  function loadTileImage(url, ms) {
    return new Promise(function (resolve) {
      var img = new Image();
      var done = false;
      var to = setTimeout(function () {
        if (done) return;
        done = true;
        resolve(null);
      }, ms || 4200);
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

  async function blitRange(range, timeoutMs) {
    var nx = range.nx;
    var ny = range.ny;
    if (nx < 1 || ny < 1) return null;
    var maxPx = 4096;
    var tw = 256;
    if (nx * tw > maxPx) tw = Math.max(32, Math.floor(maxPx / nx));
    if (ny * tw > maxPx) tw = Math.min(tw, Math.max(32, Math.floor(maxPx / ny)));
    var canvas = document.createElement("canvas");
    canvas.width = nx * tw;
    canvas.height = ny * tw;
    var ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.fillStyle = "#0a335c";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
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
            loadTileImage(drapeUrl(range.z, tx, iy), timeoutMs || 4200).then(function (img) {
              if (!img) return;
              try {
                ctx.drawImage(img, col * tw, row * tw, tw, tw);
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
      canvas: canvas,
      loaded: loaded,
      wanted: nx * ny,
      z: range.z,
      x0: range.x0,
      x1: range.x1,
      y0: range.y0,
      y1: range.y1,
      west: tileWest(range.x0, range.z),
      east: tileWest(range.x1 + 1, range.z),
      north: tileNorth(range.y0, range.z),
      south: tileNorth(range.y1 + 1, range.z),
    };
  }

  function texFromCanvas(T, canvas) {
    var tex = T.CanvasTexture ? new T.CanvasTexture(canvas) : new T.Texture(canvas);
    tex.minFilter = T.LinearFilter;
    tex.magFilter = T.LinearFilter;
    tex.generateMipmaps = false;
    try {
      tex.flipY = true;
    } catch (_) {}
    tex.needsUpdate = true;
    return tex;
  }

  function putLayer(host, T, g, blit, radius, renderOrder, name, prev) {
    disposeMesh(prev);
    if (!blit || !blit.canvas) return null;
    var geo = makeBBoxGeom(T, g, blit.south, blit.north, blit.west, blit.east, radius);
    var mat = new T.MeshBasicMaterial({
      map: texFromCanvas(T, blit.canvas),
      depthWrite: false,
      depthTest: true,
      transparent: false,
      polygonOffset: true,
      polygonOffsetFactor: -2,
      polygonOffsetUnits: -2,
      side: T.DoubleSide || 2,
    });
    var mesh = new T.Mesh(geo, mat);
    mesh.renderOrder = renderOrder;
    mesh.name = name;
    mesh.frustumCulled = false;
    host.add(mesh);
    return mesh;
  }

  async function drapeFrustum(lat, lng) {
    var g = liveGlobe();
    var T = threeNS();
    if (!g || !T || !T.Mesh) return { ok: false, reason: "no-globe" };
    if (fillBusy) return fillInfo || { ok: false, reason: "busy" };
    capCameraZ(g, lat, lng);
    paintGlobe(g);
    var host = ensureDrapeHost(g, T);
    if (!host) return { ok: false, reason: "no-host" };
    var box = frustumBox(g, lat, lng);
    var fillRange = zoomToCover(box, 160, 8);
    var camZ = null;
    try {
      camZ = +g.getCamera().position.z;
    } catch (_) {}
    var key =
      fillRange.z +
      ":" +
      fillRange.x0 +
      "-" +
      fillRange.x1 +
      ":" +
      fillRange.y0 +
      "-" +
      fillRange.y1 +
      ":" +
      (isFinite(camZ) ? camZ.toFixed(2) : "z") +
      ":" +
      lat.toFixed(2) +
      ":" +
      lng.toFixed(2);
    if (key === fillLast && fillMesh && fillMesh.material && fillMesh.material.map) {
      hideBrokenEarthDrape();
      return fillInfo || { ok: true, cached: true };
    }
    fillBusy = true;
    try {
    var fillBlit = await blitRange(fillRange, 4500);
    if (!fillBlit) return { ok: false, reason: "fill-empty", range: fillRange, box: box };
    fillMesh = putLayer(host, T, g, fillBlit, 1.0065, 4, "sn-place-fill", fillMesh);

    var detailBox;
    var detailCap = 8;
    if (isKalitheaCoord(lat, lng)) {
      detailBox = { south: lat - 0.62, north: lat + 0.55, west: lng - 0.78, east: lng + 0.55 };
      detailCap = 12;
    } else {
      detailBox = { south: lat - 4.2, north: lat + 4.2, west: lng - 5.2, east: lng + 5.2 };
      detailCap = 8;
    }
    var detailRange = zoomToCover(detailBox, 96, detailCap);
    if (isKalitheaCoord(lat, lng)) {
      detailRange = zoomToCover(detailBox, 100, 12);
    } else if (detailRange.z < 8) {
      detailRange = tileRange(detailBox, 8);
      if (detailRange.nx * detailRange.ny > 100) detailRange = zoomToCover(detailBox, 81, 8);
    }
    var detailBlit = null;
    if (!(detailRange.z <= fillRange.z && detailRange.nx * detailRange.ny > fillRange.nx * fillRange.ny * 0.8)) {
      detailBlit = await blitRange(detailRange, 4500);
      if (detailBlit && detailBlit.loaded >= 4) {
        detailMesh = putLayer(host, T, g, detailBlit, 1.0076, 5, "sn-place-detail", detailMesh);
      }
    }
    fillLast = key;
    fillInfo = {
      ok: true,
      build: BUILD,
      box: box,
      fill: {
        z: fillRange.z,
        nx: fillRange.nx,
        ny: fillRange.ny,
        tiles: fillRange.nx * fillRange.ny,
        loaded: fillBlit.loaded,
        west: fillBlit.west,
        east: fillBlit.east,
        north: fillBlit.north,
        south: fillBlit.south,
      },
      detail: detailBlit
        ? {
            z: detailRange.z,
            nx: detailRange.nx,
            ny: detailRange.ny,
            tiles: detailRange.nx * detailRange.ny,
            loaded: detailBlit.loaded,
          }
        : null,
      camZ: (function () {
        try {
          return +g.getCamera().position.z;
        } catch (_) {
          return null;
        }
      })(),
      view: { lat: lat, lng: lng },
    };
    hideBrokenEarthDrape();
    keepEarthVisible();
    paintGlobe(g);
    return fillInfo;
    } finally {
      fillBusy = false;
    }
  }

  function earthLevelsMapped() {
    var grp = namedGroup("sn-earth-drape");
    if (grp) {
      try {
        grp.visible = true;
      } catch (_) {}
      hideWhitePlaceholders(grp);
    }
    return countMapped(grp);
  }

  async function waitReadableTiles(lat, lng) {
    lat = +lat;
    lng = +lng;
    if (!isFinite(lat) || !isFinite(lng)) return false;
    if (tilesBusy) {
      var waitBusy = Date.now();
      while (tilesBusy && Date.now() - waitBusy < 8000) await sleep(80);
      if (tilesBusy) return false;
    }
    tilesBusy = true;
    var g = liveGlobe();
    try {
      hideCoveringTiles();
      keepEarthVisible();
      hideBrokenEarthDrape();
      if (!g) return false;
      pullInLandZ(g, lat, lng);
      capCameraZ(g, lat, lng);
      var info = await drapeFrustum(lat, lng);
      capCameraZ(g, lat, lng);
      hideBrokenEarthDrape();
      keepEarthVisible();
      drapeLast = fillLast;
      return !!(info && info.ok && (info.cached || (info.fill && info.fill.loaded >= 4)));
    } catch (_) {
      return false;
    } finally {
      tilesBusy = false;
      hideBrokenEarthDrape();
      keepEarthVisible();
    }
  }

  async function flyGlobeTo(lat, lng, label) {
    if (label && typeof label === "object" && label.label) label = label.label;
    lat = +lat;
    lng = +lng;
    if (!isFinite(lat) || !isFinite(lng)) return false;
    var g = liveGlobe();
    hideCoveringTiles();
    keepEarthVisible();
    try {
      if (global.SNMap) {
        try {
          SNMap.active = false;
        } catch (_) {}
      }
    } catch (_) {}
    if (!g) return false;

    callStopMotion(g);
    callZeroInertia(g);
    dispatchPointerCancel(g);
    lastProbe = { sLat: 0, sLng: 0 };

    try {
      if (typeof g.setFocus === "function") g.setFocus(lat, lng);
    } catch (_) {}

    snapTiltSpin(g, lat, lng);
    callZeroInertia(g);
    paintTiltSpin(null, g);

    var nodes = tiltSpinNodes(g);
    var tilt = nodes.tilt;
    var spin = nodes.spin;
    var earth = nodes.earth;
    if (!earth) return false;
    var GAIN = 0.35;
    var maxSteps = 16;
    var latCtrl = { node: tilt, axis: "x" };
    var lngCtrl = { node: spin, axis: "y" };

    function settled(v, tol) {
      tol = tol != null ? tol : SETTLE_DEG;
      if (!v) return false;
      return Math.abs(v.lat - lat) < tol && Math.abs(unwrapDeg(v.lng - lng)) < tol;
    }

    var already = viewLatLngFromCamera();
    if (!settled(already, SETTLE_DEG)) {
      var sLat = probeNodeAxis(tilt, "x", "lat", nodes, earth, g);
      if (sLat === 0) {
        sLat = probeNodeAxis(spin, "x", "lat", nodes, earth, g);
        if (sLat !== 0) latCtrl = { node: spin, axis: "x" };
      }
      var sLng = probeNodeAxis(spin, "y", "lng", nodes, earth, g);
      if (sLng === 0) {
        sLng = probeNodeAxis(tilt, "y", "lng", nodes, earth, g);
        if (sLng !== 0) lngCtrl = { node: tilt, axis: "y" };
      }
      lastProbe = { sLat: sLat, sLng: sLng };

      var step = 0;
      while (step < maxSteps) {
        var v = viewLatLngFromCamera();
        if (settled(v)) break;
        if (v && sLat && sLng) {
          var dLat = lat - v.lat;
          var dLng = unwrapDeg(lng - v.lng);
          if (latCtrl.node && latCtrl.node !== earth && sLat) {
            addRot(latCtrl.node, latCtrl.axis, sLat * dLat * (Math.PI / 180) * GAIN);
          }
          if (lngCtrl.node && lngCtrl.node !== earth && sLng) {
            addRot(lngCtrl.node, lngCtrl.axis, sLng * dLng * (Math.PI / 180) * GAIN);
          }
          callZeroInertia(g);
          paintTiltSpin(nodes, g);
        } else {
          snapTiltSpin(g, lat, lng);
          callZeroInertia(g);
          paintTiltSpin(nodes, g);
          break;
        }
        step++;
      }
    }

    var end = viewLatLngFromCamera();
    if (!settled(end, 0.45)) {
      snapTiltSpin(g, lat, lng);
      paintTiltSpin(nodes, g);
      end = viewLatLngFromCamera();
    }
    capCameraZ(g, lat, lng);
    hideCoveringTiles();

    var ok = settled(end, 0.45) || settled(end, SETTLE_DEG);
    if (!ok) {
      end = analyticView(g) || end;
      ok = settled(end, 0.55);
    }
    if (ok) {
      var look = end || { lat: lat, lng: lng };
      lastLive = { lat: +look.lat, lng: +look.lng };
      lastFly = { lat: lat, lng: lng, ts: Date.now(), label: label || "", build: BUILD };
      capUntil = Date.now() + 180000;
      try {
        global._snGlobeFocus = { lat: lastLive.lat, lng: lastLive.lng, label: label || "", t: Date.now() };
        if (typeof g.setFocus === "function") g.setFocus(lastLive.lat, lastLive.lng);
      } catch (_) {}
      pullInLandZ(g, lat, lng);
      capCameraZ(g, lat, lng);
      try {
        if (isNairobiCoord(lat, lng) || isKalitheaCoord(lat, lng)) {
          await waitReadableTiles(lat, lng);
        }
      } catch (_) {}
      keepEarthVisible();
      hideBrokenEarthDrape();
      return true;
    }
    lastFly = null;
    holdEuler = null;
    return false;
  }

  function logCli(m, c) {
    var s = String(m == null ? "" : m).slice(0, 420);
    try {
      var el = document.getElementById("cli-log");
      if (el) {
        el.style.setProperty("display", "block", "important");
        var row = document.createElement("div");
        row.className = "sn-cli-line cli-feed-item is-latest sn-" + (c || "ok");
        row.setAttribute("data-sn-place-tiles", "1");
        row.textContent = s;
        el.appendChild(row);
        el.scrollTop = el.scrollHeight;
      }
    } catch (_) {}
    try {
      if (global.SNCli && typeof SNCli.log === "function") SNCli.log(s, c || "ok", true);
    } catch (_) {}
  }

  function cliHas(substr) {
    try {
      var el = document.getElementById("cli-log");
      if (!el) return false;
      var t = String(el.textContent || "");
      if (t.indexOf(substr) >= 0) return true;
      var rows = el.querySelectorAll("[data-sn-place-tiles], [data-sn-kalithea], .sn-cli-line, .cli-feed-item");
      for (var i = 0; i < rows.length; i++) {
        if (String(rows[i].textContent || "").indexOf(substr) >= 0) return true;
      }
    } catch (_) {}
    return false;
  }

  function printKalitheaRungs() {
    var lines = [
      "Kalithea · village · Rhodes",
      "Kalithea · lake",
      "Kalithea · islands",
      "Kalithea · olives",
    ];
    var i;
    for (i = 0; i < lines.length; i++) {
      if (!cliHas(lines[i])) logCli(lines[i], "ok");
    }
    try {
      if (global.SNCli && typeof SNCli.preview === "function") SNCli.preview("Kalithea · village · Rhodes");
    } catch (_) {}
  }

  function isKalitheaLine(raw) {
    var t = String(raw || "")
      .trim()
      .toLowerCase()
      .replace(/\s+/g, " ");
    if (!t) return false;
    if (/pizza|nairobi|kenya|\bafrica\b|lagos|johannesburg/.test(t)) return false;
    if (/\b(kalithea|kallithea|kalitheia)\b/.test(t)) return true;
    if (/καλλιθ/.test(t)) return true;
    if (/^(village|astranov village|sustainable village)$/.test(t)) return true;
    if (/^research\b/.test(t) && /(kalith|kallith|village|καλλιθ)/.test(t)) return true;
    return false;
  }

  async function guestKalithea(raw) {
    if (kaliBusy) return true;
    kaliBusy = true;
    hideCoveringTiles();
    keepEarthVisible();
    try {
      logCli(String(raw || "kalithea").slice(0, 80), "cmd");
      var ok = false;
      try {
        ok = await flyGlobeTo(KALITHEA.lat, KALITHEA.lng, "Kalithea");
      } catch (_) {
        ok = false;
      }
      if (!ok) {
        logCli("Fly failed", "err");
        return false;
      }
      try {
        if (global.SNVillage && typeof SNVillage.handleLine === "function") {
          SNVillage.handleLine(raw || "kalithea");
        } else if (global.SNVillage && typeof SNVillage.fly === "function") {
          SNVillage.fly();
        }
      } catch (_) {}
      try {
        await waitReadableTiles(KALITHEA.lat, KALITHEA.lng);
      } catch (_) {}
      printKalitheaRungs();
      return true;
    } finally {
      kaliBusy = false;
      keepEarthVisible();
    }
  }

  function patchCli() {
    try {
      if (!global.SNCli || typeof SNCli.run !== "function") return;
      if (SNCli.run === cliWrap) return;
      var prev = SNCli.run.bind(SNCli);
      cliWrap = function (raw) {
        try {
          if (isKalitheaLine(raw)) {
            void guestKalithea(raw);
            return Promise.resolve(true);
          }
        } catch (_) {}
        return prev(raw);
      };
      SNCli.run = cliWrap;
    } catch (_) {}
  }

  function bindKalitheaInputs() {
    function capture(ev, el) {
      var v = String((el && el.value) || "").trim();
      if (!v || !isKalitheaLine(v)) return false;
      try {
        ev.preventDefault();
        ev.stopPropagation();
        if (ev.stopImmediatePropagation) ev.stopImmediatePropagation();
      } catch (_) {}
      if (el) el.value = "";
      void guestKalithea(v);
      return true;
    }
    try {
      if (!document.documentElement.getAttribute("data-sn-place-tiles-kali")) {
        document.documentElement.setAttribute("data-sn-place-tiles-kali", "1");
        document.addEventListener(
          "submit",
          function (ev) {
            var t = ev.target;
            if (!t || (t.id !== "cli-form" && t.id !== "stc-cmd")) return;
            var inp = t.querySelector("input") || document.getElementById(t.id === "stc-cmd" ? "stc-cmd-in" : "cli-in");
            capture(ev, inp);
          },
          true
        );
        document.addEventListener(
          "keydown",
          function (ev) {
            if (ev.key !== "Enter") return;
            var el = ev.target;
            if (!el || (el.id !== "cli-in" && el.id !== "stc-cmd-in")) return;
            capture(ev, el);
          },
          true
        );
      }
    } catch (_) {}
    try {
      var form = document.getElementById("cli-form");
      var input = document.getElementById("cli-in");
      if (form && input && !input._snPlaceTilesKalithea) {
        input._snPlaceTilesKalithea = 1;
        form.addEventListener(
          "submit",
          function (ev) {
            capture(ev, input);
          },
          true
        );
        input.addEventListener(
          "keydown",
          function (ev) {
            if (ev.key === "Enter") capture(ev, input);
          },
          true
        );
      }
      var topForm = document.getElementById("stc-cmd");
      var topIn = document.getElementById("stc-cmd-in");
      if (topIn && !topIn._snPlaceTilesKalithea) {
        topIn._snPlaceTilesKalithea = 1;
        if (topForm) {
          topForm.addEventListener(
            "submit",
            function (ev) {
              capture(ev, topIn);
            },
            true
          );
        }
        topIn.addEventListener(
          "keydown",
          function (ev) {
            if (ev.key === "Enter") capture(ev, topIn);
          },
          true
        );
      }
    } catch (_) {}
  }


  function wrapViewLatLng(g) {
    if (!g || g.__snPlaceLandView === BUILD) return;
    var orig = typeof g.viewLatLng === "function" ? g.viewLatLng.bind(g) : null;
    g.viewLatLng = function () {
      var live = viewLatLngFromCamera();
      if (live && isFinite(live.lat) && isFinite(live.lng)) {
        try {
          if (typeof g.setFocus === "function") g.setFocus(live.lat, live.lng);
        } catch (_) {}
        return { lat: live.lat, lng: live.lng };
      }
      var analytic = analyticView(g);
      if (analytic && isFinite(analytic.lat) && isFinite(analytic.lng)) {
        return { lat: analytic.lat, lng: analytic.lng };
      }
      if (orig) {
        try {
          var v = orig();
          if (v && isFinite(v.lat) && isFinite(v.lng)) return { lat: +v.lat, lng: +v.lng };
        } catch (_) {}
      }
      return lastLive;
    };
    g.__snPlaceLandView = BUILD;
  }

  function attachMotion(g) {
    if (!g) return;
    if (typeof g.stopMotion !== "function") {
      g.stopMotion = function () {
        callZeroInertia(g);
      };
    }
    if (typeof g.zeroInertia !== "function") {
      g.zeroInertia = function () {
        callZeroInertia(g);
      };
    }
  }

  function attachZCap(g) {
    if (!g || g.__snPlaceLandZCap === BUILD) return;
    g.__snPlaceLandZCap = BUILD;
    if (typeof g.onFrame === "function") {
      try {
        g.onFrame(function () {
          holdLookFrame(g);
          if (Date.now() > capUntil && !lastFly) return;
          var look = lastFly || lastLive;
          if (!look) return;
          if (isNairobiCoord(look.lat, look.lng) || isKalitheaCoord(look.lat, look.lng)) {
            capCameraZ(g, look.lat, look.lng);
            keepEarthVisible();
            hideBrokenEarthDrape();
          }
        });
      } catch (_) {}
    }
  }

  function wrapFlyNear(g) {
    if (!g || typeof g.flyNear !== "function" || g.__snPlaceLandFlyNear === BUILD) return;
    var prev = g.flyNear.bind(g);
    g.flyNear = function (lat, lng, tierHint) {
      lat = +lat;
      lng = +lng;
      if (!isFinite(lat) || !isFinite(lng)) return prev(lat, lng, tierHint);
      try {
        if (typeof g.setFocus === "function") g.setFocus(lat, lng);
      } catch (_) {}
      snapTiltSpin(g, lat, lng);
      lastLive = { lat: lat, lng: lng };
      try {
        if (tierHint && g.TIERS && g.TIERS[tierHint] && g.TIERS[tierHint].z != null) {
          var cam = typeof g.getCamera === "function" ? g.getCamera() : null;
          var z = +g.TIERS[tierHint].z;
          if (cam && cam.position && isFinite(z)) {
            var zMin = minZFor(lat, lng);
            if (z < zMin) z = zMin;
            cam.position.z = z;
          }
        }
      } catch (_) {}
      paintGlobe(g);
    };
    g.__snPlaceLandFlyNear = BUILD;
  }

  function wrapMap(g) {
    try {
      var M = global.SNMap;
      if (!M || typeof M.open !== "function" || M.__snPlaceLandOpen === BUILD) return;
      var prev = M.open.bind(M);
      M.open = function (lat, lng, opts) {
        hideCoveringTiles();
        keepEarthVisible();
        opts = opts ? Object.assign({}, opts) : {};
        opts.keepGlobe = true;
        opts.split = true;
        var ret;
        try {
          ret = prev(lat, lng, opts);
        } catch (_) {
          ret = null;
        }
        hideCoveringTiles();
        keepEarthVisible();
        return ret;
      };
      M.__snPlaceLandOpen = BUILD;
    } catch (_) {}
  }

  function assignLive(g) {
    if (!isLiveGlobeApi(g)) return null;
    adopted = g;
    wrapViewLatLng(g);
    attachMotion(g);
    attachZCap(g);
    wrapFlyNear(g);
    try {
      g.flyGlobeTo = flyGlobeTo;
    } catch (_) {}
    g.__snPlaceLand = BUILD;
    g.__snPlaceLandFly = "analytic-zplus";
    try {
      var desc = Object.getOwnPropertyDescriptor(global, "SNGlobe");
      if (!desc || desc.get || desc.set || desc.value !== g) {
        try {
          delete global.SNGlobe;
        } catch (_) {}
        global.SNGlobe = g;
      }
    } catch (_) {
      try {
        global.SNGlobe = g;
      } catch (__) {}
    }
    adopted = global.SNGlobe && isLiveGlobeApi(global.SNGlobe) ? global.SNGlobe : g;
    wrapMap(adopted);
    patchCli();
    bindKalitheaInputs();
    return adopted;
  }

  function ensure() {
    injectCss();
    keepEarthVisible();
    watchHide();
    wrapMap();
    patchCli();
    bindKalitheaInputs();
    hideBrokenEarthDrape();
    var g = null;
    try {
      g = global.SNGlobe;
    } catch (_) {}
    if (isLiveGlobeApi(g)) return assignLive(g);
    return global.SNGlobe || null;
  }

  function boot() {
    ensure();
  }

  boot();
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  }
  setTimeout(boot, 0);
  setTimeout(boot, 250);
  setTimeout(boot, 800);
  setTimeout(boot, 1600);
  setTimeout(boot, 3200);
  setInterval(function () {
    ensure();
    keepEarthVisible();
    hideBrokenEarthDrape();
    patchCli();
    if (lastFly && Date.now() < capUntil) {
      holdLookFrame(liveGlobe());
      capCameraZ(liveGlobe(), lastFly.lat, lastFly.lng);
      if (!tilesBusy && (isNairobiCoord(lastFly.lat, lastFly.lng) || isKalitheaCoord(lastFly.lat, lastFly.lng))) {
        void drapeFrustum(lastFly.lat, lastFly.lng);
      }
    }
  }, 700);

  global.SNPlaceEarth = {
    build: BUILD,
    ensure: ensure,
    flyGlobeTo: flyGlobeTo,
    viewLatLng: viewLatLngFromCamera,
    waitReadableTiles: waitReadableTiles,
    printKalitheaRungs: printKalitheaRungs,
    fillInfo: function () {
      return fillInfo;
    },
    lastProbe: function () {
      return lastProbe;
    },
  };
  global.SNPlaceLand = global.SNPlaceEarth;
})(typeof window !== "undefined" ? window : globalThis);
