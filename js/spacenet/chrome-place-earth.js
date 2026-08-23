/* Astranov place-land · Build 20260824014000-place-land
 * PR #174 only. Do not merge. Does not edit #130 / #131.
 *
 * window.SNGlobe is the LIVE globe.js object (plain assign, never a stub,
 * never a getter). viewLatLng is a function returning the rendered camera
 * look-at {lat,lng}. After nairobi settle ~-1.3, 36.8. After kalithea
 * ~36.39, 28.22.
 *
 * Camera sits on +Z looking down -Z. globe.js flyNear / setGlobeLatLng
 * (tilt.x=-lat, spin.y=-lng) faces +X, so Nairobi reads ~4.73,-53.18 and
 * Kalithea ~-32.95,-61.78. This file snaps with the +Z inverse:
 *   spin.y = atan2(-Tx, Tz), tilt.x from camera-y look point.
 * Probe-sign loop refines. Never re-snap with the +X formula.
 *
 * Cap fly/zoom so Earth stays a PLACE. Last Nairobi rung = city altitude
 * with readable land (globe texture + satellite drape). Kalithea stays
 * island/village scale, not a sea smear. Leaflet covering the globe is
 * skipped — Earth stays on screen.
 */
(function (global) {
  "use strict";
  var BUILD = "20260824014000-place-land";
  if (global.__snPlaceLand20260824014000) return;
  global.__snPlaceLand20260824014000 = 1;

  var NAIROBI = { lat: -1.286, lng: 36.817 };
  var KALITHEA = { lat: 36.387557, lng: 28.222533 };
  var RHODES = { lat: 36.44, lng: 28.22 };
  var SETTLE_DEG = 0.15;
  var TILT_MAX = 1.05;
  var Z_NAIROBI = 1.52;
  var Z_KALITHEA = 1.42;
  var Z_FLOOR = 1.42;
  var lastLive = null;
  var lastFly = null;
  var lastProbe = { sLat: 0, sLng: 0 };
  var adopted = null;
  var drapeGroup = null;
  var drapeLoader = null;
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
    var latRad = (lat * Math.PI) / 180;
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

  function clearDrape() {
    try {
      if (drapeGroup && drapeGroup.parent) drapeGroup.parent.remove(drapeGroup);
    } catch (_) {}
    drapeGroup = null;
  }

  function makeTileGeom(T, x, y, z, toVec) {
    var north = tileNorth(y, z);
    var south = tileNorth(y + 1, z);
    var west = tileWest(x, z);
    var east = tileWest(x + 1, z);
    var segs = 4;
    var pos = [];
    var uv = [];
    var idx = [];
    var cols = segs + 1;
    for (var i = 0; i <= segs; i++) {
      var v = i / segs;
      var lat = north + (south - north) * v;
      for (var j = 0; j <= segs; j++) {
        var u = j / segs;
        var lng = west + (east - west) * u;
        var p = toVec(lat, lng, 1.006);
        pos.push(p.x, p.y, p.z);
        uv.push(u, 1 - v);
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

  function drapeReadable(lat, lng) {
    var g = liveGlobe();
    var T = threeNS();
    if (!g || !T || !T.TextureLoader) return;
    var earth = null;
    var spin = null;
    try {
      earth = g.getEarth();
      spin = typeof g.getSpin === "function" ? g.getSpin() : earth && earth.parent;
    } catch (_) {}
    var host = spin || earth;
    if (!host) return;
    var zoom = isKalitheaCoord(lat, lng) ? 14 : 12;
    var cx = tileX(lng, zoom);
    var cy = tileY(lat, zoom);
    var toVec =
      typeof g.latLngToVec === "function"
        ? function (la, ln, r) {
            return g.latLngToVec(la, ln, r);
          }
        : function (la, ln, r) {
            var phi = ((90 - la) * Math.PI) / 180;
            var theta = ((ln + 180) * Math.PI) / 180;
            return new T.Vector3(
              -r * Math.sin(phi) * Math.cos(theta),
              r * Math.cos(phi),
              r * Math.sin(phi) * Math.sin(theta)
            );
          };
    clearDrape();
    drapeGroup = new T.Group();
    drapeGroup.name = "sn-place-land-drape";
    try {
      host.add(drapeGroup);
    } catch (_) {
      return;
    }
    if (!drapeLoader) {
      drapeLoader = new T.TextureLoader();
      try {
        drapeLoader.setCrossOrigin("anonymous");
      } catch (_) {}
    }
    var span = 1;
    for (var dy = -span; dy <= span; dy++) {
      for (var dx = -span; dx <= span; dx++) {
        (function (tx, ty) {
          var url = drapeUrl(zoom, tx, ty);
          drapeLoader.load(
            url,
            function (tex) {
              try {
                tex.minFilter = T.LinearFilter;
                tex.magFilter = T.LinearFilter;
                tex.generateMipmaps = false;
                var geo = makeTileGeom(T, tx, ty, zoom, toVec);
                var mat = new T.MeshBasicMaterial({
                  map: tex,
                  depthWrite: false,
                  transparent: false,
                });
                var mesh = new T.Mesh(geo, mat);
                mesh.renderOrder = 2;
                if (drapeGroup) drapeGroup.add(mesh);
                paintGlobe(g);
              } catch (_) {}
            },
            undefined,
            function () {}
          );
        })(cx + dx, cy + dy);
      }
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
      capCameraZ(g, lat, lng);
      try {
        if (isNairobiCoord(lat, lng) || isKalitheaCoord(lat, lng)) drapeReadable(lat, lng);
      } catch (_) {}
      keepEarthVisible();
      return true;
    }
    lastFly = null;
    holdEuler = null;
    return false;
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
    if (!g || g.__snPlaceLandZCap) return;
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
      if (!M || typeof M.open !== "function" || M.__snPlaceLandOpen) return;
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
    return adopted;
  }

  function ensure() {
    injectCss();
    keepEarthVisible();
    watchHide();
    wrapMap();
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
    if (lastFly && Date.now() < capUntil) {
      holdLookFrame(liveGlobe());
      capCameraZ(liveGlobe(), lastFly.lat, lastFly.lng);
    }
  }, 700);

  global.SNPlaceEarth = {
    build: BUILD,
    ensure: ensure,
    flyGlobeTo: flyGlobeTo,
    viewLatLng: viewLatLngFromCamera,
    lastProbe: function () {
      return lastProbe;
    },
  };
  global.SNPlaceLand = global.SNPlaceEarth;
})(typeof window !== "undefined" ? window : globalThis);
