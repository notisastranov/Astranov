/* Astranov place-earth · Build 20260824011000-place-earth
 * PR #174 only. Do not merge. Does not edit #130/#131.
 *
 * SNGlobe / flyGlobeTo MUST exist before nairobi-rungs and kalithea-geo load.
 * If globe.js has not assigned SNGlobe yet, watch the assignment.
 * If SNGlobe is missing after the live Three.js globe exists, install a thin
 * adapter that drives the same camera as the #127 pizza fly and writes
 * SNGlobe.viewLatLng from the rendered look-at after settle.
 *
 * Earth stays on screen. Streets Leaflet only at the last Nairobi rung and
 * only if look-at is genuinely Nairobi. If Leaflet would hide Earth (the
 * path that made SNGlobe/viewLatLng unverifiable), skip Leaflet entirely.
 */
(function (global) {
  'use strict';
  var BUILD = '20260824011000-place-earth';
  if (global.__snPlaceEarth20260824011000) return;
  global.__snPlaceEarth20260824011000 = 1;

  var NAIROBI = { lat: -1.286, lng: 36.817 };
  var SETTLE_DEG = 0.15;
  var lastLive = null;
  var lastProbe = { sLat: 0, sLng: 0 };
  var heldGlobe = undefined;
  var watching = false;

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
    return Math.abs(lat - NAIROBI.lat) < 0.35 && Math.abs(unwrapDeg(lng - NAIROBI.lng)) < 0.35;
  }

  function threeNS() {
    try {
      if (global.THREE) return global.THREE;
    } catch (_) {}
    return null;
  }

  function globeApi() {
    try {
      if (heldGlobe) return heldGlobe;
    } catch (_) {}
    try {
      if (global.SNGlobe) return global.SNGlobe;
    } catch (_) {}
    return null;
  }

  function getEarth(G) {
    G = G || globeApi();
    try {
      if (G && typeof G.getEarth === 'function') {
        var e = G.getEarth();
        if (e) return e;
      }
    } catch (_) {}
    return null;
  }

  function getCamera(G) {
    G = G || globeApi();
    try {
      if (G && typeof G.getCamera === 'function') return G.getCamera();
    } catch (_) {}
    return null;
  }

  function getRenderer(G) {
    G = G || globeApi();
    try {
      if (G && typeof G.getRenderer === 'function') return G.getRenderer();
    } catch (_) {}
    return null;
  }

  function keepEarthVisible() {
    try {
      var globe = document.getElementById('globe');
      if (globe) {
        globe.classList.remove('city-hidden');
        globe.style.visibility = 'visible';
        globe.style.opacity = '1';
        globe.style.pointerEvents = 'auto';
      }
    } catch (_) {}
    try {
      document.body.classList.remove('city-map-on');
    } catch (_) {}
  }

  function hideCoveringTiles() {
    try {
      var live = readLiveLookAt();
      var nairobiStreets = !!(live && isNairobiCoord(live.lat, live.lng) && global.__snNairobiStreetsOk);
      if (nairobiStreets) return;
    } catch (_) {}
    try {
      var map = document.getElementById('city-map');
      if (map) {
        map.classList.remove('active');
        map.setAttribute('aria-hidden', 'true');
        map.style.opacity = '0';
        map.style.pointerEvents = 'none';
        map.style.zIndex = '0';
      }
    } catch (_) {}
    try {
      if (global.SNMap) {
        try {
          SNMap.active = false;
        } catch (_) {}
      }
    } catch (_) {}
    keepEarthVisible();
  }

  function injectCss() {
    if (document.getElementById('sn-place-earth-css')) return;
    try {
      var s = document.createElement('style');
      s.id = 'sn-place-earth-css';
      s.textContent =
        'html body[data-sn-place-earth] #globe,' +
        'html body[data-sn-place-earth] #globe.city-hidden{' +
        'visibility:visible!important;opacity:1!important;pointer-events:auto!important;}' +
        'html body[data-sn-place-earth]:not(.sn-nairobi-streets) #city-map,' +
        'html body[data-sn-place-earth]:not(.sn-nairobi-streets) #city-map.active{' +
        'opacity:0!important;pointer-events:none!important;z-index:0!important;visibility:hidden!important;}';
      (document.head || document.documentElement).appendChild(s);
    } catch (_) {}
    try {
      document.body.setAttribute('data-sn-place-earth', BUILD);
    } catch (_) {}
  }

  function watchGlobeHide() {
    try {
      var globe = document.getElementById('globe');
      if (!globe || globe.__snPlaceEarthMo) return;
      var mo = new MutationObserver(function () {
        try {
          if (!globe.classList.contains('city-hidden')) return;
          var live = readLiveLookAt();
          if (live && isNairobiCoord(live.lat, live.lng) && global.__snNairobiStreetsOk) {
            globe.classList.remove('city-hidden');
            return;
          }
          globe.classList.remove('city-hidden');
          hideCoveringTiles();
        } catch (_) {}
      });
      mo.observe(globe, { attributes: true, attributeFilter: ['class', 'style'] });
      globe.__snPlaceEarthMo = mo;
    } catch (_) {}
  }

  function nodeIsSceneOrCam(n) {
    if (!n) return true;
    try {
      if (n.isScene || n.type === 'Scene') return true;
      if (n.isCamera || (n.type && String(n.type).indexOf('Camera') >= 0)) return true;
    } catch (_) {}
    return false;
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

  function paintGlobe(G) {
    G = G || globeApi();
    try {
      if (G && typeof G.paint === 'function') G.paint();
    } catch (_) {}
  }

  function walkEarthChain(G) {
    var out = { nodes: [], names: [] };
    try {
      var n = getEarth(G);
      var hops = 0;
      while (n && hops < 14) {
        out.nodes.push(n);
        var nm = 'obj';
        try {
          if (n.name) nm = String(n.name);
          else if (n.type) nm = String(n.type);
          else if (n.isMesh) nm = 'Mesh';
          else if (n.isScene) nm = 'Scene';
          else if (n.isCamera) nm = 'Camera';
          else nm = 'Object3D';
        } catch (_) {}
        out.names.push(String(nm).slice(0, 28));
        try {
          n = n.parent;
        } catch (_) {
          n = null;
        }
        hops++;
      }
    } catch (_) {}
    return out;
  }

  function tiltSpinNodes(G) {
    var out = { earth: null, spin: null, tilt: null };
    G = G || globeApi();
    try {
      var earth = getEarth(G);
      out.earth = earth;
      if (!earth) return out;
      var spin = earth.parent;
      var tilt = spin ? spin.parent : null;
      if (spin && !nodeIsSceneOrCam(spin)) out.spin = spin;
      if (tilt && !nodeIsSceneOrCam(tilt)) out.tilt = tilt;
      if (!out.tilt && G && typeof G.getTilt === 'function') out.tilt = G.getTilt();
      if (!out.spin && G && typeof G.getSpin === 'function') out.spin = G.getSpin();
    } catch (_) {}
    return out;
  }

  function paintTiltSpin(nodes, G) {
    G = G || globeApi();
    nodes = nodes || tiltSpinNodes(G);
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
      var cam = getCamera(G);
      if (cam && cam.updateMatrixWorld) cam.updateMatrixWorld(true);
    } catch (_) {}
    paintGlobe(G);
  }

  function vecToLatLngLocal(v) {
    if (!v) return null;
    try {
      var G = globeApi();
      if (G && typeof G.vecToLatLng === 'function') {
        var ll = G.vecToLatLng(v);
        if (ll && isFinite(ll.lat)) return { lat: +ll.lat, lng: +ll.lng };
      }
    } catch (_) {}
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

  function raycastLookAt(G) {
    G = G || globeApi();
    try {
      var earth = getEarth(G);
      var camera = getCamera(G);
      var renderer = getRenderer(G);
      var T = threeNS();
      if (!earth || !camera || !T || !T.Raycaster) return null;
      var canvas =
        (renderer && renderer.domElement) ||
        document.querySelector('#globe canvas') ||
        document.querySelector('canvas');
      if (!canvas || !canvas.getBoundingClientRect) return null;
      var rect = canvas.getBoundingClientRect();
      if (!rect.width || !rect.height) return null;
      try {
        if (earth.updateMatrixWorld) earth.updateMatrixWorld(true);
        if (camera.updateMatrixWorld) camera.updateMatrixWorld(true);
      } catch (_) {}
      var ray = new T.Raycaster();
      ray.setFromCamera(new T.Vector2(0, 0), camera);
      var hits = ray.intersectObject(earth, false);
      if (!hits || !hits.length) return null;
      var local = earth.worldToLocal(hits[0].point.clone());
      return vecToLatLngLocal(local);
    } catch (_) {
      return null;
    }
  }

  function readLiveLookAt() {
    var G = globeApi();
    var live = raycastLookAt(G);
    if (live && isFinite(live.lat) && isFinite(live.lng)) {
      lastLive = { lat: +live.lat, lng: +live.lng };
      return lastLive;
    }
    try {
      if (G && typeof G.viewLatLng === 'function' && !G.__snPlaceEarthView) {
        var v = G.viewLatLng();
        if (v && isFinite(v.lat) && isFinite(v.lng)) return { lat: +v.lat, lng: +v.lng };
      }
    } catch (_) {}
    return lastLive;
  }

  function callStopMotion(G) {
    G = G || globeApi();
    try {
      if (G && typeof G.stopMotion === 'function') G.stopMotion();
    } catch (_) {}
  }

  function callZeroInertia(G) {
    G = G || globeApi();
    try {
      if (G && typeof G.zeroInertia === 'function') G.zeroInertia();
    } catch (_) {}
    try {
      var p = G && typeof G.getPhysics === 'function' ? G.getPhysics() : null;
      if (p) {
        p.vTilt = 0;
        p.vSpin = 0;
        p.vZ = 0;
        p.vX = 0;
        p.vY = 0;
      }
    } catch (_) {}
  }

  function dispatchCanvasPointerCancel(G) {
    var canvas = null;
    try {
      var ren = getRenderer(G);
      if (ren && ren.domElement) canvas = ren.domElement;
    } catch (_) {}
    try {
      if (!canvas) canvas = document.querySelector('#globe canvas');
    } catch (_) {}
    if (!canvas) return;
    try {
      var opts = { bubbles: true, cancelable: true, pointerId: 1, isPrimary: true };
      try {
        canvas.dispatchEvent(new PointerEvent('pointercancel', opts));
      } catch (_) {
        canvas.dispatchEvent(new Event('pointercancel', { bubbles: true, cancelable: true }));
      }
    } catch (_) {}
  }

  function probeNodeAxis(node, axis, kind, nodes, earth, G) {
    if (!node || node === earth || !node.rotation) return 0;
    var v0 = readLiveLookAt();
    if (!v0) return 0;
    var old = readRot(node, axis);
    addRot(node, axis, 0.04);
    callZeroInertia(G);
    paintTiltSpin(nodes, G);
    var v1 = readLiveLookAt();
    writeRot(node, axis, old);
    callZeroInertia(G);
    paintTiltSpin(nodes, G);
    if (!v1) return 0;
    var d = 0;
    if (kind === 'lat') d = v1.lat - v0.lat;
    else d = unwrapDeg(v1.lng - v0.lng);
    return axisSign(d);
  }

  /**
   * Honest flyGlobeTo — same algorithm as #127 pizza hunt / locked #130/#131.
   * (1) stopMotion + zeroInertia + pointercancel first
   * (2) tilt = earth.parent.parent (lat, x), spin = earth.parent (lng, y); NEVER Mesh
   * (3) probe signs once per fly (0.04 rad, revert). If 0, try the other node.
   * (4) loop gain=0.35, max 16, LIVE viewLatLng each step
   * (5) never x += -dLat blindly; never both parents on both axes
   */
  async function flyGlobeToPizza(lat, lng, label) {
    if (label && typeof label === 'object' && label.label) label = label.label;
    lat = +lat;
    lng = +lng;
    if (!isFinite(lat) || !isFinite(lng)) return false;
    var G = globeApi();
    hideCoveringTiles();
    keepEarthVisible();
    try {
      if (global.SNMap) {
        try {
          SNMap.active = false;
        } catch (_) {}
      }
    } catch (_) {}

    callStopMotion(G);
    callZeroInertia(G);
    dispatchCanvasPointerCancel(G);
    lastProbe = { sLat: 0, sLng: 0 };

    var nodes = tiltSpinNodes(G);
    var tilt = nodes.tilt;
    var spin = nodes.spin;
    var earth = nodes.earth;
    if (!earth) return false;
    var GAIN = 0.35;
    var maxSteps = 16;
    var latCtrl = { node: tilt, axis: 'x' };
    var lngCtrl = { node: spin, axis: 'y' };

    var sLat = probeNodeAxis(tilt, 'x', 'lat', nodes, earth, G);
    if (sLat === 0) {
      sLat = probeNodeAxis(spin, 'x', 'lat', nodes, earth, G);
      if (sLat !== 0) latCtrl = { node: spin, axis: 'x' };
    }
    var sLng = probeNodeAxis(spin, 'y', 'lng', nodes, earth, G);
    if (sLng === 0) {
      sLng = probeNodeAxis(tilt, 'y', 'lng', nodes, earth, G);
      if (sLng !== 0) lngCtrl = { node: tilt, axis: 'y' };
    }
    lastProbe = { sLat: sLat, sLng: sLng };

    function settled(v) {
      if (!v) return false;
      return Math.abs(v.lat - lat) < SETTLE_DEG && Math.abs(unwrapDeg(v.lng - lng)) < SETTLE_DEG;
    }
    function markSuccess() {
      callZeroInertia(G);
      var live = readLiveLookAt() || { lat: lat, lng: lng };
      lastLive = { lat: +live.lat, lng: +live.lng };
      try {
        global._snGlobeFocus = {
          lat: lastLive.lat,
          lng: lastLive.lng,
          label: label || '',
          t: Date.now(),
        };
        if (G && typeof G.setFocus === 'function') G.setFocus(lastLive.lat, lastLive.lng);
      } catch (_) {}
      return true;
    }
    function nudgeSigned(dLat, dLng) {
      if (latCtrl.node && latCtrl.node !== earth && sLat) {
        addRot(latCtrl.node, latCtrl.axis, sLat * dLat * (Math.PI / 180) * GAIN);
      }
      if (lngCtrl.node && lngCtrl.node !== earth && sLng) {
        addRot(lngCtrl.node, lngCtrl.axis, sLng * dLng * (Math.PI / 180) * GAIN);
      }
    }

    var step = 0;
    while (step < maxSteps) {
      var v = readLiveLookAt();
      if (settled(v)) return markSuccess();
      if (v) {
        nudgeSigned(lat - v.lat, unwrapDeg(lng - v.lng));
        callZeroInertia(G);
        paintTiltSpin(nodes, G);
      } else {
        callZeroInertia(G);
        paintTiltSpin(nodes, G);
      }
      step++;
    }
    callZeroInertia(G);
    paintTiltSpin(nodes, G);
    var vEnd = readLiveLookAt();
    if (settled(vEnd)) return markSuccess();
    return false;
  }

  function wrapViewLatLng(G) {
    if (!G || G.__snPlaceEarthView) return;
    var orig = typeof G.viewLatLng === 'function' ? G.viewLatLng.bind(G) : null;
    G.viewLatLng = function () {
      var live = raycastLookAt(G);
      if (live && isFinite(live.lat) && isFinite(live.lng)) {
        lastLive = { lat: +live.lat, lng: +live.lng };
        try {
          if (typeof G.setFocus === 'function') G.setFocus(lastLive.lat, lastLive.lng);
        } catch (_) {}
        return lastLive;
      }
      if (orig) {
        try {
          var v = orig();
          if (v && isFinite(v.lat) && isFinite(v.lng)) return { lat: +v.lat, lng: +v.lng };
        } catch (_) {}
      }
      return lastLive;
    };
    G.__snPlaceEarthView = 1;
  }

  function attachMotionHelpers(G) {
    if (!G) return;
    if (typeof G.stopMotion !== 'function') {
      G.stopMotion = function () {
        callZeroInertia(G);
      };
    }
    if (typeof G.zeroInertia !== 'function') {
      G.zeroInertia = function () {
        callZeroInertia(G);
      };
    }
  }

  function attachFly(G) {
    if (!G || typeof G !== 'object') return;
    attachMotionHelpers(G);
    wrapViewLatLng(G);
    if (typeof G.flyGlobeTo !== 'function') {
      G.flyGlobeTo = flyGlobeToPizza;
    }
  }

  function isRealGlobe(G) {
    if (!G || typeof G !== 'object') return false;
    if (G.__snPlaceEarthThin) return false;
    try {
      if (G.ready === true) return true;
    } catch (_) {}
    try {
      if (typeof G.getEarth === 'function' && G.getEarth()) return true;
    } catch (_) {}
    try {
      if (typeof G.getCamera === 'function' && G.getCamera()) return true;
    } catch (_) {}
    try {
      if (typeof G.viewLatLng === 'function' && typeof G.pulse === 'function') return true;
    } catch (_) {}
    return false;
  }

  function makeThinAdapter() {
    if (global.SNGlobe && isRealGlobe(global.SNGlobe)) return global.SNGlobe;
    var canvas = null;
    try {
      canvas = document.querySelector('#globe canvas');
    } catch (_) {}
    var adapter = {
      ready: false,
      flyGlobeTo: flyGlobeToPizza,
      viewLatLng: function () {
        return readLiveLookAt();
      },
      getEarth: function () {
        return getEarth(heldGlobe);
      },
      getCamera: function () {
        return getCamera(heldGlobe);
      },
      getRenderer: function () {
        return getRenderer(heldGlobe);
      },
      getTilt: function () {
        try {
          if (heldGlobe && typeof heldGlobe.getTilt === 'function') return heldGlobe.getTilt();
        } catch (_) {}
        return tiltSpinNodes(heldGlobe).tilt;
      },
      getSpin: function () {
        try {
          if (heldGlobe && typeof heldGlobe.getSpin === 'function') return heldGlobe.getSpin();
        } catch (_) {}
        return tiltSpinNodes(heldGlobe).spin;
      },
      getScene: function () {
        try {
          if (heldGlobe && typeof heldGlobe.getScene === 'function') return heldGlobe.getScene();
        } catch (_) {}
        return null;
      },
      setFocus: function (lat, lng) {
        try {
          if (heldGlobe && typeof heldGlobe.setFocus === 'function') return heldGlobe.setFocus(lat, lng);
        } catch (_) {}
        global._snGlobeFocus = { lat: +lat, lng: +lng, t: Date.now() };
      },
      paint: function () {
        paintGlobe(heldGlobe);
      },
      stopMotion: function () {
        callStopMotion(heldGlobe);
      },
      zeroInertia: function () {
        callZeroInertia(heldGlobe);
      },
    };
    adapter.__snPlaceEarthThin = 1;
    adapter.__snPlaceEarthCanvas = canvas;
    wrapViewLatLng(adapter);
    return adapter;
  }

  function onGlobeAssigned(v) {
    if (!v || typeof v !== 'object') return v;
    heldGlobe = v;
    attachFly(v);
    return v;
  }

  function installWatch() {
    if (watching) return;
    watching = true;
    var current = undefined;
    try {
      current = global.SNGlobe;
    } catch (_) {}
    try {
      delete global.SNGlobe;
    } catch (_) {}
    heldGlobe = current;
    try {
      Object.defineProperty(global, 'SNGlobe', {
        configurable: true,
        enumerable: true,
        get: function () {
          return heldGlobe;
        },
        set: function (v) {
          onGlobeAssigned(v);
        },
      });
    } catch (_) {
      if (current) global.SNGlobe = current;
    }
    if (heldGlobe) attachFly(heldGlobe);
  }

  function ensureGlobe() {
    injectCss();
    keepEarthVisible();
    watchGlobeHide();
    installWatch();
    var G = globeApi();
    if (G && isRealGlobe(G)) {
      attachFly(G);
      return G;
    }
    if (!G) {
      var canvas = null;
      try {
        canvas = document.querySelector('#globe canvas');
      } catch (_) {}
      if (canvas && threeNS()) {
        var thin = makeThinAdapter();
        heldGlobe = thin;
        return thin;
      }
      return null;
    }
    attachFly(G);
    return G;
  }

  function wrapMapKeepEarth() {
    try {
      var M = global.SNMap;
      if (!M || typeof M.open !== 'function' || M.__snPlaceEarthOpen) return;
      var prev = M.open.bind(M);
      M.open = function (lat, lng, opts) {
        opts = opts ? Object.assign({}, opts) : {};
        opts.keepGlobe = true;
        var live = readLiveLookAt();
        var nairobi =
          isNairobiCoord(lat, lng) && live && isNairobiCoord(live.lat, live.lng);
        if (nairobi) {
          global.__snNairobiStreetsOk = 1;
          try {
            document.body.classList.add('sn-nairobi-streets');
          } catch (_) {}
          opts.split = true;
        } else {
          try {
            document.body.classList.remove('sn-nairobi-streets');
          } catch (_) {}
          global.__snNairobiStreetsOk = 0;
        }
        var ret = prev(lat, lng, opts);
        keepEarthVisible();
        if (!nairobi) hideCoveringTiles();
        return ret;
      };
      M.__snPlaceEarthOpen = 1;
    } catch (_) {}
  }

  function boot() {
    ensureGlobe();
    wrapMapKeepEarth();
    keepEarthVisible();
  }

  boot();
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  }
  setTimeout(boot, 0);
  setTimeout(boot, 400);
  setTimeout(boot, 1200);
  setTimeout(boot, 2800);
  setInterval(function () {
    ensureGlobe();
    wrapMapKeepEarth();
    watchGlobeHide();
    keepEarthVisible();
  }, 2000);

  global.SNPlaceEarth = {
    build: BUILD,
    ensure: ensureGlobe,
    flyGlobeTo: flyGlobeToPizza,
    viewLatLng: readLiveLookAt,
    lastProbe: function () {
      return lastProbe;
    },
  };
})(typeof window !== 'undefined' ? window : globalThis);
