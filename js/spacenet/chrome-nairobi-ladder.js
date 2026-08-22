/**
 * Nairobi / Africa / Kenya zoom ladder — Build 20260823001000-nairobi-ladder
 *
 * Guest types "nairobi" or "africa" (or pinches the live globe over Kenya)
 * → honest three-step zoom, never a teleport to a wrong continent:
 *   NATIONAL  frame Kenya / East Africa at country-scale z=2.05, Nairobi in view
 *   CITY      ease into Nairobi metro (never Lagos, never Rhodes, never a false country)
 *   STREETS   ease to city/street altitude over Nairobi ≈ lat -1.286, lon 36.817
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
 *   (6) fail: "Fly failed - viewLatLng still LAT, LNG" (minus kept) + sLat/sLng + parents
 *       leave pins empty — do not snap to a fake origin
 *
 * Never goToPlace / flyNear / openMap / Rhodes / Kalithea for this path.
 */
(function (G) {
  'use strict';
  if (G.__snNairobiLadder23001000) return;
  G.__snNairobiLadder23001000 = 1;

  var BUILD = '20260823001000-nairobi-ladder';
  var NAIROBI = { lat: -1.286, lng: 36.817, name: 'Nairobi' };
  var SETTLE_DEG = 0.15;
  var Z = { national: 2.05, city: 1.16, street: 1.08 };
  // Kenya bbox — pinch-in here starts the ladder. Nairobi stays inside.
  var KENYA = { latMin: -4.7, latMax: 4.6, lngMin: 33.9, lngMax: 41.9 };
  // East Africa envelope used to detect a wrong-continent yank.
  var EAST_AFRICA = { latMin: -12, latMax: 12, lngMin: 28.5, lngMax: 52 };

  var lastProbe = { sLat: 0, sLng: 0 };
  var lastFly = null;
  var laddering = false;
  var pinchCoolUntil = 0;
  var emptyPins = [];

  function sleep(ms) {
    return new Promise(function (resolve) {
      setTimeout(resolve, ms);
    });
  }

  function log(m, c) {
    var s = String(m == null ? '' : m).slice(0, 420);
    try {
      if (G.SNCli && typeof SNCli.log === 'function') SNCli.log(s, c || 'ok', true);
    } catch (_) {}
    try {
      var el = document.getElementById('cli-log');
      if (!el) return;
      el.style.setProperty('display', 'block', 'important');
      var row = document.createElement('div');
      row.className = 'sn-cli-line sn-' + (c || 'ok');
      row.setAttribute('data-sn-nairobi', '1');
      row.textContent = s;
      el.appendChild(row);
      el.scrollTop = el.scrollHeight;
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
    // Rhodes / Kalithea
    if (Math.abs(lat - 36.44) < 0.12 && Math.abs(unwrapDeg(lng - 28.22)) < 0.12) return true;
    if (Math.abs(lat - 36.387557) < 0.05 && Math.abs(unwrapDeg(lng - 28.222533)) < 0.05) return true;
    // Lagos / Johannesburg / Cairo / San Jose IP — random Africa / HQ leaks
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

  function viewNear(lat, lng, tol) {
    tol = tol != null ? tol : SETTLE_DEG;
    var v = liveViewLatLng();
    if (!v) return false;
    return Math.abs(v.lat - lat) < tol && Math.abs(unwrapDeg(v.lng - lng)) < tol;
  }

  function isGlobeReady() {
    try {
      if (G.SNGlobe && G.SNGlobe.ready === true) return true;
      if (G.SNGlobe && typeof SNGlobe.getEarth === 'function' && SNGlobe.getEarth()) return true;
    } catch (_) {}
    return false;
  }

  async function waitGlobeReady(ms) {
    var t0 = Date.now();
    var limit = typeof ms === 'number' && ms > 0 ? ms : 2400;
    try {
      if (G.SNGlobe && typeof SNGlobe.init === 'function') SNGlobe.init();
    } catch (_) {}
    while (Date.now() - t0 < limit) {
      if (isGlobeReady()) return true;
      await sleep(90);
    }
    return isGlobeReady();
  }

  function stayGlobe() {
    try {
      if (G.SNMap && typeof SNMap.close === 'function') SNMap.close();
    } catch (_) {}
    try {
      if (G.SNMap) SNMap.active = false;
    } catch (_) {}
    try {
      var map = document.getElementById('city-map');
      if (map) {
        map.classList.remove('active');
        map.setAttribute('aria-hidden', 'true');
      }
    } catch (_) {}
    try {
      var globe = document.getElementById('globe');
      if (globe) globe.classList.remove('city-hidden');
    } catch (_) {}
  }

  function globeCanvas() {
    try {
      var ren = G.SNGlobe && typeof SNGlobe.getRenderer === 'function' ? SNGlobe.getRenderer() : null;
      if (ren && ren.domElement) return ren.domElement;
    } catch (_) {}
    try {
      return document.querySelector('#globe canvas') || document.querySelector('#globe');
    } catch (_) {}
    return null;
  }

  function dispatchCanvasPointerCancel() {
    function release(el) {
      if (!el) return;
      try {
        var opts = { bubbles: true, cancelable: true, pointerId: 1, isPrimary: true };
        try {
          el.dispatchEvent(new PointerEvent('pointercancel', opts));
        } catch (_) {
          try {
            el.dispatchEvent(new Event('pointercancel', { bubbles: true, cancelable: true }));
          } catch (__) {}
        }
      } catch (_) {}
    }
    try {
      release(globeCanvas());
    } catch (_) {}
  }

  function callStopMotion() {
    try {
      if (G.SNGlobe && typeof SNGlobe.stopMotion === 'function') SNGlobe.stopMotion();
    } catch (_) {}
  }

  function callZeroInertia() {
    try {
      if (G.SNGlobe && typeof SNGlobe.zeroInertia === 'function') SNGlobe.zeroInertia();
    } catch (_) {}
    try {
      var p = G.SNGlobe && typeof SNGlobe.getPhysics === 'function' ? SNGlobe.getPhysics() : null;
      if (p) {
        p.vTilt = 0;
        p.vSpin = 0;
        p.vZ = 0;
        p.vX = 0;
        p.vY = 0;
      }
    } catch (_) {}
  }

  function unfreezeGlobe() {
    stayGlobe();
    dispatchCanvasPointerCancel();
    callStopMotion();
    callZeroInertia();
  }

  function paintGlobe() {
    try {
      if (G.SNGlobe && typeof SNGlobe.paint === 'function') SNGlobe.paint();
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

  function walkEarthChain() {
    var out = { nodes: [], names: [] };
    try {
      if (!G.SNGlobe || typeof SNGlobe.getEarth !== 'function') return out;
      var n = SNGlobe.getEarth();
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

  /**
   * Parent chain is Mesh > Object3D(spin) > Object3D(tilt) > Scene.
   * tilt = earth.parent.parent (lat, rotation.x)
   * spin = earth.parent       (lng, rotation.y)
   */
  function tiltSpinNodes() {
    var out = { earth: null, spin: null, tilt: null };
    try {
      if (!G.SNGlobe || typeof SNGlobe.getEarth !== 'function') return out;
      var earth = SNGlobe.getEarth();
      out.earth = earth;
      if (!earth) return out;
      var spin = earth.parent;
      var tilt = spin ? spin.parent : null;
      if (spin && !nodeIsSceneOrCam(spin)) out.spin = spin;
      if (tilt && !nodeIsSceneOrCam(tilt)) out.tilt = tilt;
      if (!out.tilt && typeof SNGlobe.getTilt === 'function') out.tilt = SNGlobe.getTilt();
      if (!out.spin && typeof SNGlobe.getSpin === 'function') out.spin = SNGlobe.getSpin();
    } catch (_) {}
    return out;
  }

  function paintTiltSpin(nodes) {
    nodes = nodes || tiltSpinNodes();
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
      var cam = typeof SNGlobe.getCamera === 'function' ? SNGlobe.getCamera() : null;
      if (cam && cam.updateMatrixWorld) cam.updateMatrixWorld(true);
    } catch (_) {}
    paintGlobe();
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

  /**
   * Probe one node/axis. Nudge +0.04, paint, read LIVE view, revert.
   * kind 'lat' → sign(v1.lat - v0.lat); kind 'lng' → sign(unwrap(v1.lng - v0.lng)).
   * Returns 0 if unchanged. NEVER writes Mesh.rotation.
   */
  function probeNodeAxis(node, axis, kind, nodes, earth) {
    if (!node || node === earth || !node.rotation) return 0;
    var v0 = liveViewLatLng();
    if (!v0) return 0;
    var old = readRot(node, axis);
    addRot(node, axis, 0.04);
    callZeroInertia();
    paintTiltSpin(nodes);
    var v1 = liveViewLatLng();
    writeRot(node, axis, old);
    callZeroInertia();
    paintTiltSpin(nodes);
    if (!v1) return 0;
    var d = 0;
    if (kind === 'lat') d = v1.lat - v0.lat;
    else d = unwrapDeg(v1.lng - v0.lng);
    return axisSign(d);
  }

  /**
   * Honest flyGlobeTo — same algorithm as #127 pizza hunt.
   * Attached as SNGlobe.flyGlobeTo only if that helper is not already defined.
   */
  async function flyGlobeToLocal(lat, lng, label) {
    lat = +lat;
    lng = +lng;
    if (!isFinite(lat) || !isFinite(lng)) return false;

    try {
      if (G.SNMap) {
        try {
          SNMap.active = false;
        } catch (_) {}
      }
    } catch (_) {}

    // (1) BEFORE any nudge
    unfreezeGlobe();
    callStopMotion();
    callZeroInertia();
    dispatchCanvasPointerCancel();

    lastProbe = { sLat: 0, sLng: 0 };

    var nodes = tiltSpinNodes();
    var tilt = nodes.tilt;
    var spin = nodes.spin;
    var earth = nodes.earth;
    var GAIN = 0.35;
    var maxSteps = 16;

    // (2) tilt = earth.parent.parent, spin = earth.parent. NEVER Mesh.
    var latCtrl = { node: tilt, axis: 'x' };
    var lngCtrl = { node: spin, axis: 'y' };

    // (3) PROBE SIGNS once per fly
    var sLat = probeNodeAxis(tilt, 'x', 'lat', nodes, earth);
    if (sLat === 0) {
      sLat = probeNodeAxis(spin, 'x', 'lat', nodes, earth);
      if (sLat !== 0) latCtrl = { node: spin, axis: 'x' };
    }
    var sLng = probeNodeAxis(spin, 'y', 'lng', nodes, earth);
    if (sLng === 0) {
      sLng = probeNodeAxis(tilt, 'y', 'lng', nodes, earth);
      if (sLng !== 0) lngCtrl = { node: tilt, axis: 'y' };
    }
    lastProbe = { sLat: sLat, sLng: sLng };

    function settled(v) {
      if (!v) return false;
      return Math.abs(v.lat - lat) < SETTLE_DEG && Math.abs(unwrapDeg(v.lng - lng)) < SETTLE_DEG;
    }
    function markSuccess() {
      callZeroInertia();
      lastFly = { lat: lat, lng: lng, ts: Date.now(), label: label || '' };
      try {
        G._snGlobeFocus = { lat: lat, lng: lng, label: label || '', t: Date.now() };
        if (G.SNGlobe && typeof SNGlobe.setFocus === 'function') SNGlobe.setFocus(lat, lng);
      } catch (_) {}
      return true;
    }
    function nudgeSigned(dLat, dLng) {
      // NEVER Mesh. NEVER both parents on both axes. NEVER x += -dLat blindly.
      if (latCtrl.node && latCtrl.node !== earth && sLat) {
        addRot(latCtrl.node, latCtrl.axis, sLat * dLat * (Math.PI / 180) * GAIN);
      }
      if (lngCtrl.node && lngCtrl.node !== earth && sLng) {
        addRot(lngCtrl.node, lngCtrl.axis, sLng * dLng * (Math.PI / 180) * GAIN);
      }
    }

    // (4) LOOP gain=0.35, max 16 steps
    var step = 0;
    while (step < maxSteps) {
      var v = liveViewLatLng();
      if (settled(v)) return markSuccess();
      if (v) {
        var dLat = lat - v.lat;
        var dLng = unwrapDeg(lng - v.lng);
        nudgeSigned(dLat, dLng);
        callZeroInertia();
        paintTiltSpin(nodes);
      } else {
        callZeroInertia();
        paintTiltSpin(nodes);
      }
      step++;
    }

    callZeroInertia();
    paintTiltSpin(nodes);
    var vEnd = liveViewLatLng();
    if (settled(vEnd)) return markSuccess();
    lastFly = null;
    return false;
  }

  function attachFlyHelper() {
    try {
      if (!G.SNGlobe) return;
      if (typeof SNGlobe.flyGlobeTo === 'function') return;
      SNGlobe.flyGlobeTo = flyGlobeToLocal;
    } catch (_) {}
  }

  function getFly() {
    try {
      if (G.SNGlobe && typeof SNGlobe.flyGlobeTo === 'function') return SNGlobe.flyGlobeTo.bind(SNGlobe);
    } catch (_) {}
    return flyGlobeToLocal;
  }

  function cameraZ() {
    try {
      var cam = G.SNGlobe && typeof SNGlobe.getCamera === 'function' ? SNGlobe.getCamera() : null;
      if (cam && cam.position) return +cam.position.z;
    } catch (_) {}
    return 5.4;
  }

  function easeZ(toZ, ms) {
    return new Promise(function (resolve) {
      var cam = null;
      try {
        cam = G.SNGlobe && typeof SNGlobe.getCamera === 'function' ? SNGlobe.getCamera() : null;
      } catch (_) {}
      if (!cam || !cam.position) {
        resolve();
        return;
      }
      var z0 = +cam.position.z;
      toZ = +toZ;
      if (!isFinite(toZ)) {
        resolve();
        return;
      }
      if (!isFinite(z0) || Math.abs(z0 - toZ) < 0.008) {
        try {
          cam.position.z = toZ;
          var phys = typeof SNGlobe.getPhysics === 'function' ? SNGlobe.getPhysics() : null;
          if (phys) {
            phys.tZ = toZ;
            phys.vZ = 0;
          }
          paintGlobe();
        } catch (_) {}
        resolve();
        return;
      }
      var t0 = Date.now();
      ms = ms || 720;
      function step() {
        var t = Math.min(1, (Date.now() - t0) / ms);
        var e = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
        try {
          cam.position.z = z0 + (toZ - z0) * e;
          var phys = typeof SNGlobe.getPhysics === 'function' ? SNGlobe.getPhysics() : null;
          if (phys) {
            phys.tZ = cam.position.z;
            phys.vZ = 0;
          }
          paintGlobe();
        } catch (_) {}
        if (t < 1) requestAnimationFrame(step);
        else resolve();
      }
      requestAnimationFrame(step);
    });
  }

  function flyFailDiag() {
    callZeroInertia();
    try {
      paintTiltSpin();
    } catch (_) {}
    var names = '?';
    var viewS = '?, ?';
    var sLat = lastProbe && lastProbe.sLat != null ? lastProbe.sLat : 0;
    var sLng = lastProbe && lastProbe.sLng != null ? lastProbe.sLng : 0;
    try {
      var walk = walkEarthChain();
      if (walk.names && walk.names.length) names = walk.names.join('>');
    } catch (_) {}
    try {
      viewS = fmtLiveLL(liveViewLatLng());
    } catch (_) {}
    return (
      'Fly failed - viewLatLng still ' +
      viewS +
      ' · sLat=' +
      sLat +
      ' sLng=' +
      sLng +
      ' · parents=' +
      names
    );
  }

  function leavePinsEmpty() {
    emptyPins = [];
    try {
      var el = document.getElementById('sn-nairobi-pins');
      if (el) {
        el.innerHTML = '';
        el.style.display = 'none';
      }
    } catch (_) {}
  }

  function failLadder() {
    leavePinsEmpty();
    lastFly = null;
    log(flyFailDiag(), 'dim');
    preview('Fly failed');
    stayGlobe();
  }

  function stillHonest() {
    var v = liveViewLatLng();
    if (!v) return false;
    if (isFakeOrigin(v.lat, v.lng)) return false;
    if (!inEastAfrica(v.lat, v.lng)) return false;
    return true;
  }

  async function runLadder(reason) {
    if (laddering) return true;
    laddering = true;
    leavePinsEmpty();
    stayGlobe();
    attachFlyHelper();
    try {
      var a = document.getElementById('cli-in');
      if (a) a.value = '';
      var b = document.getElementById('stc-cmd-in');
      if (b) b.value = '';
    } catch (_) {}

    log(String(reason || 'nairobi').slice(0, 80), 'cmd');

    var ready = await waitGlobeReady(2200);
    if (!ready) {
      failLadder();
      laddering = false;
      return true;
    }

    var fly = getFly();
    var ok;

    // (1) NATIONAL — Kenya / East Africa, Nairobi in view
    log('Kenya · national', 'ok');
    preview('Kenya · national');
    ok = await fly(NAIROBI.lat, NAIROBI.lng, 'Nairobi');
    await easeZ(Z.national, 780);
    await sleep(180);
    if (!ok && !viewNear(NAIROBI.lat, NAIROBI.lng, 1.2)) {
      failLadder();
      laddering = false;
      return true;
    }
    if (!stillHonest()) {
      failLadder();
      laddering = false;
      return true;
    }

    // (2) CITY — Nairobi metro
    log('Nairobi · city', 'ok');
    preview('Nairobi · city');
    ok = await fly(NAIROBI.lat, NAIROBI.lng, 'Nairobi');
    await easeZ(Z.city, 720);
    await sleep(160);
    if (!ok && !viewNear(NAIROBI.lat, NAIROBI.lng, 0.4)) {
      failLadder();
      laddering = false;
      return true;
    }
    var cityLive = liveViewLatLng();
    if (!cityLive || !stillHonest() || !inKenya(cityLive.lat, cityLive.lng)) {
      failLadder();
      laddering = false;
      return true;
    }

    // (3) STREETS — city/street altitude over Nairobi
    log('Nairobi · streets', 'ok');
    preview('Nairobi · streets');
    ok = await fly(NAIROBI.lat, NAIROBI.lng, 'Nairobi');
    await easeZ(Z.street, 640);
    await sleep(80);

    var live = liveViewLatLng();
    if (!ok && !viewNear(NAIROBI.lat, NAIROBI.lng, SETTLE_DEG)) {
      failLadder();
      laddering = false;
      return true;
    }
    if (!live || !stillHonest() || isFakeOrigin(live.lat, live.lng)) {
      failLadder();
      laddering = false;
      return true;
    }

    lastFly = { lat: NAIROBI.lat, lng: NAIROBI.lng, ts: Date.now(), label: 'Nairobi' };
    leavePinsEmpty();
    stayGlobe();
    laddering = false;
    return true;
  }

  function isNairobiAfricaLine(raw) {
    var t = String(raw || '')
      .trim()
      .toLowerCase()
      .replace(/\s+/g, ' ');
    if (!t) return false;
    if (/pizza|rhodes|rodos|ρόδο|call\b|hangup|webrtc/.test(t)) return false;
    if (/south africa|cape town|johannesburg|lagos|cairo|accra|addis/.test(t)) return false;
    if (/^(nairobi|nairobu|nrb|kenya|kenia|africa|east africa)\b/.test(t)) return true;
    if (
      /^(show|fly|go(?: to)?|zoom(?: to)?|take me to|look at|open|dive)\s+(the\s+)?((city|country|continent) of\s+)?(nairobi|nairobu|nrb|kenya|kenia|africa|east africa)\b/.test(
        t
      )
    )
      return true;
    if (/\b(nairobi|kenya)\b/.test(t) && /^(show|fly|go|zoom|take|look|open|dive)\b/.test(t)) return true;
    return false;
  }

  function patchCliRun() {
    try {
      if (!G.SNCli || typeof SNCli.run !== 'function') return;
      if (SNCli.__snNairobiLadderRun) return;
      SNCli.__snNairobiLadderRun = 1;
      var prev = SNCli.run.bind(SNCli);
      SNCli.run = function (raw) {
        try {
          if (isNairobiAfricaLine(raw)) {
            void runLadder(raw);
            return Promise.resolve(true);
          }
        } catch (_) {}
        return prev(raw);
      };
    } catch (_) {}
  }

  function bindInputs() {
    function capture(ev, el) {
      var v = String((el && el.value) || '').trim();
      if (!v || !isNairobiAfricaLine(v)) return false;
      try {
        ev.preventDefault();
        ev.stopPropagation();
        if (ev.stopImmediatePropagation) ev.stopImmediatePropagation();
      } catch (_) {}
      if (el) el.value = '';
      void runLadder(v);
      return true;
    }
    try {
      var form = document.getElementById('cli-form');
      var input = document.getElementById('cli-in');
      if (form && input && !input._snNairobiLadder) {
        input._snNairobiLadder = 1;
        form.addEventListener(
          'submit',
          function (ev) {
            capture(ev, input);
          },
          true
        );
        input.addEventListener(
          'keydown',
          function (ev) {
            if (ev.key === 'Enter') capture(ev, input);
          },
          true
        );
      }
      var topIn = document.getElementById('stc-cmd-in');
      if (topIn && !topIn._snNairobiLadder) {
        topIn._snNairobiLadder = 1;
        topIn.addEventListener(
          'keydown',
          function (ev) {
            if (ev.key === 'Enter') capture(ev, topIn);
          },
          true
        );
      }
    } catch (_) {}
  }

  function kenyaFromEvent(ev) {
    var lat = null;
    var lng = null;
    try {
      if (G.SNGlobe && typeof SNGlobe.pickLatLng === 'function' && ev) {
        var p = SNGlobe.pickLatLng(ev.clientX, ev.clientY);
        if (p && p.lat != null) {
          lat = +p.lat;
          lng = +p.lng;
        }
      }
    } catch (_) {}
    if (lat == null) {
      var v = liveViewLatLng();
      if (v) {
        lat = v.lat;
        lng = v.lng;
      }
    }
    if (lat == null) return false;
    return inKenya(lat, lng);
  }

  function bindPinch() {
    try {
      if (G.__snNairobiPinchBound) return;
      var canvas = globeCanvas();
      if (!canvas) return;
      G.__snNairobiPinchBound = 1;
      var pts = {};
      var startDist = 0;

      function dist() {
        var keys = Object.keys(pts);
        if (keys.length < 2) return 0;
        var a = pts[keys[0]];
        var b = pts[keys[1]];
        return Math.hypot(a.x - b.x, a.y - b.y) || 1;
      }

      function maybeLadder(ev, inward) {
        if (!inward) return;
        if (Date.now() < pinchCoolUntil) return;
        if (laddering) return;
        if (!kenyaFromEvent(ev) && !inKenya((liveViewLatLng() || {}).lat, (liveViewLatLng() || {}).lng))
          return;
        pinchCoolUntil = Date.now() + 2400;
        try {
          ev.preventDefault();
          ev.stopPropagation();
          if (ev.stopImmediatePropagation) ev.stopImmediatePropagation();
        } catch (_) {}
        void runLadder('pinch kenya');
      }

      canvas.addEventListener(
        'pointerdown',
        function (ev) {
          pts[ev.pointerId != null ? ev.pointerId : 'm'] = { x: ev.clientX, y: ev.clientY };
          if (Object.keys(pts).length >= 2) startDist = dist();
        },
        true
      );
      canvas.addEventListener(
        'pointermove',
        function (ev) {
          var id = ev.pointerId != null ? ev.pointerId : 'm';
          if (!pts[id]) return;
          pts[id] = { x: ev.clientX, y: ev.clientY };
          if (Object.keys(pts).length < 2 || !startDist) return;
          var d = dist();
          var ratio = d / startDist;
          if (ratio < 0.92) maybeLadder(ev, true);
          startDist = d;
        },
        true
      );
      function up(ev) {
        try {
          delete pts[ev.pointerId != null ? ev.pointerId : 'm'];
        } catch (_) {}
        if (Object.keys(pts).length < 2) startDist = 0;
      }
      canvas.addEventListener('pointerup', up, true);
      canvas.addEventListener('pointercancel', up, true);
      canvas.addEventListener(
        'wheel',
        function (ev) {
          // dy < 0 typically zoom-in; globe zoomByDelta(positive) zooms out
          var inward = ev.deltaY < 0;
          if (!inward) return;
          maybeLadder(ev, true);
        },
        { capture: true, passive: false }
      );
    } catch (_) {}
  }

  function patchGlobeDishonestFly() {
    try {
      if (!G.SNGlobe || SNGlobe.__snNairobiLadderWrap) return;
      SNGlobe.__snNairobiLadderWrap = 1;
      attachFlyHelper();

      function hijack(lat, lng) {
        if (laddering) return true;
        if (isNairobiCoord(lat, lng) || inKenya(lat, lng)) {
          void runLadder('nairobi');
          return true;
        }
        return false;
      }

      var prevGo = SNGlobe.goToPlace;
      if (typeof prevGo === 'function') {
        SNGlobe.goToPlace = function (lat, lng, opts) {
          if (hijack(lat, lng)) return true;
          return prevGo.apply(this, arguments);
        };
      }
      var prevFly = SNGlobe.flyNear;
      if (typeof prevFly === 'function') {
        SNGlobe.flyNear = function (lat, lng, tier) {
          if (hijack(lat, lng)) return;
          return prevFly.apply(this, arguments);
        };
      }
      var prevDive = SNGlobe.diveInAt;
      if (typeof prevDive === 'function') {
        SNGlobe.diveInAt = function (lat, lng) {
          if (hijack(lat, lng)) return true;
          var v = liveViewLatLng();
          if (v && inKenya(v.lat, v.lng) && Date.now() > pinchCoolUntil) {
            pinchCoolUntil = Date.now() + 2400;
            void runLadder('pinch kenya');
            return true;
          }
          return prevDive.apply(this, arguments);
        };
      }
    } catch (_) {}
  }

  function patchMapOpen() {
    try {
      if (!G.SNMap || typeof SNMap.open !== 'function' || SNMap.__snNairobiLadder) return;
      SNMap.__snNairobiLadder = 1;
      var prev = SNMap.open.bind(SNMap);
      SNMap.open = function (lat, lng, opts) {
        if (laddering) {
          stayGlobe();
          return Promise.resolve(null);
        }
        if (isNairobiCoord(lat, lng) || inKenya(lat, lng)) {
          stayGlobe();
          if (!laddering) void runLadder('nairobi');
          return Promise.resolve(null);
        }
        return prev(lat, lng, opts);
      };
    } catch (_) {}
  }

  function tick() {
    attachFlyHelper();
    patchCliRun();
    bindInputs();
    bindPinch();
    patchGlobeDishonestFly();
    patchMapOpen();
  }

  function init() {
    tick();
    setTimeout(tick, 0);
    setTimeout(tick, 400);
    setTimeout(tick, 1200);
    setTimeout(tick, 2800);
    setInterval(tick, 5000);
  }

  G.SNNairobiLadder = {
    build: BUILD,
    fly: runLadder,
    flyGlobeTo: flyGlobeToLocal,
    nairobi: NAIROBI,
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})(typeof window !== 'undefined' ? window : globalThis);
