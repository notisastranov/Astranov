/* SNGlobe — Earth imaging engine (KEEP)
 * Mechanical name: window.SNGlobe (js/spacenet/globe.js)
 * Three.js sphere + TextureLoader: earth_atmos_2048 · specular · clouds
 * Sacred: inertia damp · zoom tiers
 * SPECS click law:
 *   single tap  → fly + zoom deeper (NATIONAL → REGIONAL → CITY / street map)
 *   double tap  → zoom OUT one level toward globe
 *   never place huge blue rings on click
 */
(function (global) {
  'use strict';

  var TIERS = {
    solar: { z: 7.5, label: 'SOLAR' },
    global: { z: 2.75, label: 'GLOBAL' },
    national: { z: 1.95, label: 'NATIONAL' },
    regional: { z: 1.72, label: 'REGIONAL' },
    city: { z: 1.48, label: 'CITY' },
  };

  /** Zoom ladder (coarse → fine). Single-tap dives in; double-tap steps out. */
  var LADDER = ['solar', 'global', 'national', 'regional', 'city'];
  /** Single-tap dive starts at national (from solar/global) then deepens */
  var DIVE = ['national', 'regional', 'city'];

  var G = {
    ready: false,
    renderer: null,
    scene: null,
    camera: null,
    earth: null,
    clouds: null,
    pivot: null,
    raycaster: null,
    markers: [],
    dragging: false,
    lastAct: 0,
    frame: 0,
    tier: 'global',
    zoomAnim: null,
    flying: false,
    flyGen: 0,
    velX: 0,
    velY: 0,
    damp: 0.88,
    lastUserControl: 0,
    /** Last place the user aimed (click / zoom target) — SpaceNet focus */
    focus: null,
    diveTier: null,
    bodyId: 'earth',
    bodyMeta: null,
    earthMat: null,
    cloudMat: null,
  };

  function isTouch() {
    try {
      return matchMedia('(pointer:coarse)').matches || navigator.maxTouchPoints > 0;
    } catch (_) {
      return false;
    }
  }

  function latLngToVec(lat, lng, r) {
    r = r == null ? 1 : r;
    var phi = ((90 - lat) * Math.PI) / 180;
    var theta = ((lng + 180) * Math.PI) / 180;
    return new THREE.Vector3(
      -r * Math.sin(phi) * Math.cos(theta),
      r * Math.cos(phi),
      r * Math.sin(phi) * Math.sin(theta)
    );
  }

  /** Inverse of latLngToVec — local unit vector on sphere → lat/lng */
  function vecToLatLng(v) {
    var n = v.clone().normalize();
    var lat = 90 - (Math.acos(Math.max(-1, Math.min(1, n.y))) * 180) / Math.PI;
    var lng = (Math.atan2(n.z, -n.x) * 180) / Math.PI - 180;
    if (lng > 180) lng -= 360;
    if (lng < -180) lng += 360;
    return { lat: lat, lng: lng };
  }

  function tierFromZ(z) {
    if (z >= 5.5) return 'solar';
    if (z >= 2.35) return 'global';
    if (z >= 1.84) return 'national';
    if (z >= 1.6) return 'regional';
    return 'city';
  }

  function ladderIndex(name) {
    var i = LADDER.indexOf(name);
    return i >= 0 ? i : LADDER.indexOf('global');
  }

  function currentTier() {
    return G.diveTier || tierFromZ(G.camera ? G.camera.position.z : TIERS.global.z);
  }

  /** Degrees-ish distance between two lat/lng (rough, for same-place dive) */
  function farFromFocus(lat, lng) {
    var f = focusPos();
    if (!f || f.lat == null) return true;
    var dLat = Math.abs(f.lat - lat);
    var dLng = Math.abs(f.lng - lng);
    if (dLng > 180) dLng = 360 - dLng;
    return dLat > 6 || dLng > 6;
  }

  /**
   * Next deeper dive tier for a single tap.
   * From solar/global or new place → NATIONAL. Then REGIONAL → CITY.
   */
  function nextDiveTier(lat, lng) {
    var cur = currentTier();
    if (cur === 'solar' || cur === 'global' || farFromFocus(lat, lng) || DIVE.indexOf(cur) < 0) {
      return 'national';
    }
    var i = DIVE.indexOf(cur);
    if (i < 0) return 'national';
    if (i >= DIVE.length - 1) return 'city';
    return DIVE[i + 1];
  }

  /** One level coarser toward full globe */
  function prevZoomTier() {
    var cur = currentTier();
    var i = ladderIndex(cur);
    if (i <= 0) return 'solar';
    return LADDER[i - 1];
  }

  function setTierLabel() {
    G.tier = G.diveTier || tierFromZ(G.camera.position.z);
    var el = document.getElementById('tier-label');
    if (el) el.textContent = (TIERS[G.tier] && TIERS[G.tier].label) || G.tier;
    var zl = document.getElementById('zoom-label');
    if (zl) zl.textContent = 'Astranov SpaceNet · ' + ((TIERS[G.tier] && TIERS[G.tier].label) || G.tier);
  }

  function setFocus(lat, lng) {
    if (lat == null || lng == null || !isFinite(lat) || !isFinite(lng)) return;
    G.focus = { lat: lat, lng: lng };
    global._snGlobeFocus = G.focus;
    try {
      global._snLastPos = { lat: lat, lng: lng };
      if (global.SNTasks && SNTasks.setPos) SNTasks.setPos(lat, lng);
    } catch (_) {}
  }

  function focusPos() {
    return G.focus || global._snGlobeFocus || global._snLastPos || global.SNTasks?.pos || null;
  }

  /**
   * Raycast screen point → Earth lat/lng (SpaceNet address under finger).
   */
  function pickLatLng(clientX, clientY) {
    if (!G.ready || !G.earth || !G.camera || !G.renderer) return null;
    var rect = G.renderer.domElement.getBoundingClientRect();
    if (!rect.width || !rect.height) return null;
    var x = ((clientX - rect.left) / rect.width) * 2 - 1;
    var y = -((clientY - rect.top) / rect.height) * 2 + 1;
    if (!G.raycaster) G.raycaster = new THREE.Raycaster();
    try {
      G.earth.updateMatrixWorld(true);
      if (G.clouds) G.clouds.updateMatrixWorld(true);
    } catch (_) {}
    G.raycaster.setFromCamera(new THREE.Vector2(x, y), G.camera);
    // Prefer solid earth over cloud shell (clouds are larger and skew picks)
    var hits = G.raycaster.intersectObject(G.earth, false);
    if (!hits || !hits.length) return null;
    // Point in world space → earth local (same frame as latLngToVec / pulse)
    var local = G.earth.worldToLocal(hits[0].point.clone());
    return vecToLatLng(local);
  }

  /** Stop inertia / idle spin / in-flight camera so goToPlace is decisive */
  function stopMotion() {
    G.velX = 0;
    G.velY = 0;
    G.flyGen = (G.flyGen || 0) + 1;
    G.flying = false;
    G.lastAct = Date.now();
    G.lastUserControl = Date.now();
  }

  /** Bake quaternion → clean YXZ euler (kills gimbal shake from quat/euler fight) */
  function bakePivotEuler() {
    if (!G.pivot) return;
    try {
      var e = new THREE.Euler().setFromQuaternion(G.pivot.quaternion.clone().normalize(), 'YXZ');
      G.pivot.rotation.order = 'YXZ';
      var x = e.x;
      var y = e.y;
      // Clamp polar tilt so globe never flips / spins crazy
      if (x > 1.25) x = 1.25;
      if (x < -1.25) x = -1.25;
      G.pivot.rotation.set(x, y, 0);
      G.pivot.quaternion.setFromEuler(G.pivot.rotation);
    } catch (_) {}
  }

  function init() {
    if (G.ready || typeof THREE === 'undefined') return false;
    var el = document.getElementById('globe');
    if (!el) return false;

    var touch = isTouch();
    var w = el.clientWidth || window.innerWidth;
    var h = el.clientHeight || window.innerHeight;

    G.scene = new THREE.Scene();
    G.scene.background = new THREE.Color(0x000000);
    G.camera = new THREE.PerspectiveCamera(42, w / h, 0.05, 200);
    G.camera.position.set(0, 0.12, TIERS.global.z);
    G.tier = 'global';

    G.renderer = new THREE.WebGLRenderer({
      antialias: !touch,
      alpha: false,
      powerPreference: touch ? 'low-power' : 'default',
    });
    G.renderer.setSize(w, h, false);
    G.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, touch ? 1.0 : 1.5));
    el.innerHTML = '';
    el.appendChild(G.renderer.domElement);

    var amb = new THREE.AmbientLight(0x445566, 0.55);
    var sun = new THREE.DirectionalLight(0xfff5e6, 1.35);
    sun.position.set(5, 1.2, 2.5);
    G.scene.add(amb, sun);

    G.pivot = new THREE.Object3D();
    G.scene.add(G.pivot);

    var segs = touch ? 48 : 64;
    var loader = new THREE.TextureLoader();
    var earthUrl =
      'https://cdn.jsdelivr.net/gh/mrdoob/three.js@r128/examples/textures/planets/earth_atmos_2048.jpg';
    var specUrl =
      'https://cdn.jsdelivr.net/gh/mrdoob/three.js@r128/examples/textures/planets/earth_specular_2048.jpg';
    var cloudUrl =
      'https://cdn.jsdelivr.net/gh/mrdoob/three.js@r128/examples/textures/planets/earth_clouds_1024.png';

    var mat = new THREE.MeshPhongMaterial({
      color: 0x223344,
      specular: 0x333333,
      shininess: 12,
    });
    G.earthMat = mat;
    G.earth = new THREE.Mesh(new THREE.SphereGeometry(1, segs, segs), mat);
    G.pivot.add(G.earth);
    G._loader = loader;
    G.bodyId = 'earth';

    function applyEarthTextures() {
      loader.load(
        earthUrl,
        function (tex) {
          tex.anisotropy = Math.min(
            4,
            (G.renderer.capabilities.getMaxAnisotropy &&
              G.renderer.capabilities.getMaxAnisotropy()) ||
              1
          );
          mat.map = tex;
          mat.color.set(0xffffff);
          mat.needsUpdate = true;
        },
        undefined,
        function () {
          mat.color.set(0x1a4d7a);
          mat.emissive = new THREE.Color(0x041018);
        }
      );
      loader.load(specUrl, function (tex) {
        mat.specularMap = tex;
        mat.needsUpdate = true;
      });
    }
    applyEarthTextures();
    G._applyEarthTextures = applyEarthTextures;

    var cloudMat = new THREE.MeshLambertMaterial({
      transparent: true,
      opacity: 0.35,
      depthWrite: false,
    });
    G.cloudMat = cloudMat;
    G.clouds = new THREE.Mesh(new THREE.SphereGeometry(1.015, segs, segs), cloudMat);
    G.pivot.add(G.clouds);
    loader.load(cloudUrl, function (tex) {
      cloudMat.map = tex;
      cloudMat.needsUpdate = true;
    });

    G.pivot.add(
      new THREE.Mesh(
        new THREE.SphereGeometry(1.045, segs, segs),
        new THREE.MeshBasicMaterial({
          color: 0x4a9fff,
          transparent: true,
          opacity: 0.12,
          side: THREE.BackSide,
        })
      )
    );

    var starN = touch ? 400 : 900;
    var starPos = new Float32Array(starN * 3);
    for (var i = 0; i < starN; i++) {
      var r = 20 + Math.random() * 50;
      var th = Math.random() * Math.PI * 2;
      var ph = Math.acos(2 * Math.random() - 1);
      starPos[i * 3] = r * Math.sin(ph) * Math.cos(th);
      starPos[i * 3 + 1] = r * Math.sin(ph) * Math.sin(th);
      starPos[i * 3 + 2] = r * Math.cos(ph);
    }
    G.scene.add(
      new THREE.Points(
        new THREE.BufferGeometry().setAttribute('position', new THREE.BufferAttribute(starPos, 3)),
        new THREE.PointsMaterial({
          color: 0xffffff,
          size: 0.045,
          sizeAttenuation: true,
          opacity: 0.85,
          transparent: true,
        })
      )
    );

    bindInput();
    window.addEventListener('resize', onResize, { passive: true });
    G.ready = true;
    G.lastAct = Date.now();
    setTierLabel();
    loop();
    return true;
  }

  function bindInput() {
    var canvas = G.renderer.domElement;
    var lx = 0,
      ly = 0,
      down = false,
      lastT = 0,
      downX = 0,
      downY = 0,
      moved = false,
      ptrId = null,
      tapTimer = null,
      lastTapAt = 0,
      lastTapX = 0,
      lastTapY = 0;

    function onDown(e) {
      if (e.pointerType === 'touch' && e.isPrimary === false) return;
      down = true;
      moved = false;
      // User takes control — kill fly + inertia so sphere does not fight the hand
      stopMotion();
      bakePivotEuler();
      G.dragging = true;
      G.velX = 0;
      G.velY = 0;
      lastT = performance.now();
      var t = e.touches ? e.touches[0] : e;
      lx = t.clientX;
      ly = t.clientY;
      downX = t.clientX;
      downY = t.clientY;
      ptrId = e.pointerId;
      try {
        canvas.setPointerCapture(e.pointerId);
      } catch (_) {}
    }

    function onMove(e) {
      if (!down) return;
      G.lastAct = Date.now();
      G.lastUserControl = Date.now();
      var t = e.touches ? e.touches[0] : e;
      var now = performance.now();
      var dt = Math.max(12, now - lastT);
      lastT = now;
      var dx = t.clientX - lx;
      var dy = t.clientY - ly;
      lx = t.clientX;
      ly = t.clientY;
      if (Math.abs(t.clientX - downX) + Math.abs(t.clientY - downY) > 10) moved = true;
      // Euler-only drag (YXZ) — never setFromQuaternion mid-drag (that caused shake/spin)
      G.pivot.rotation.order = 'YXZ';
      G.pivot.rotation.y += dx * 0.0038;
      G.pivot.rotation.x = Math.max(
        -1.2,
        Math.min(1.2, G.pivot.rotation.x + dy * 0.0032)
      );
      G.pivot.rotation.z = 0;
      // Soft inertia only — hard cap so it cannot go crazy
      var sx = dx * (16 / dt) * 0.0028;
      var sy = dy * (16 / dt) * 0.0022;
      G.velX = Math.max(-0.035, Math.min(0.035, sx));
      G.velY = Math.max(-0.025, Math.min(0.025, sy));
      if (e.cancelable) e.preventDefault();
    }

    function onUp(e) {
      if (!down) return;
      down = false;
      G.dragging = false;
      G.lastAct = Date.now();
      G.lastUserControl = Date.now();
      // Strong clamp after release — light glide only
      G.velX = Math.max(-0.028, Math.min(0.028, G.velX * 0.55));
      G.velY = Math.max(-0.02, Math.min(0.02, G.velY * 0.55));
      if (Math.abs(G.velX) < 0.002) G.velX = 0;
      if (Math.abs(G.velY) < 0.002) G.velY = 0;
      bakePivotEuler();
      try {
        if (ptrId != null) canvas.releasePointerCapture(ptrId);
      } catch (_) {}
      var t = e.changedTouches ? e.changedTouches[0] : e;
      // Short tap (not drag): single = dive in · double = zoom out one level
      if (!moved && t) {
        var now = performance.now();
        var gap = now - lastTapAt;
        var dist = Math.hypot(t.clientX - lastTapX, t.clientY - lastTapY);
        if (gap < 340 && dist < 36 && lastTapAt > 0) {
          // Double-tap / double-click → zoom OUT (toward globe)
          if (tapTimer) {
            clearTimeout(tapTimer);
            tapTimer = null;
          }
          lastTapAt = 0;
          zoomOutOne();
        } else {
          lastTapAt = now;
          lastTapX = t.clientX;
          lastTapY = t.clientY;
          if (tapTimer) clearTimeout(tapTimer);
          var cx = t.clientX;
          var cy = t.clientY;
          // Wait so a real double-tap can cancel the dive
          tapTimer = setTimeout(function () {
            tapTimer = null;
            var ll = pickLatLng(cx, cy);
            if (ll) diveInAt(ll.lat, ll.lng);
          }, 300);
        }
      }
      ptrId = null;
    }

    canvas.addEventListener('pointerdown', onDown);
    canvas.addEventListener('pointermove', onMove, { passive: false });
    canvas.addEventListener('pointerup', onUp);
    canvas.addEventListener('pointercancel', onUp);
    window.addEventListener('pointerup', onUp);

    canvas.addEventListener(
      'wheel',
      function (e) {
        G.lastAct = Date.now();
        // Zoom toward cursor: update focus from point under wheel
        var under = pickLatLng(e.clientX, e.clientY);
        if (under) setFocus(under.lat, under.lng);

        var next = Math.max(1.42, Math.min(9, G.camera.position.z + e.deltaY * 0.0022));
        G.camera.position.z = next;
        G.diveTier = tierFromZ(next);
        setTierLabel();

        // Enter city tier → street map at FOCUS (clicked/zoomed place), never forced home city
        if (next <= TIERS.city.z + 0.02 && !global.SNMap?.active) {
          var p = focusPos() || under || { lat: 36.43, lng: 28.22 };
          if (under) p = under;
          setFocus(p.lat, p.lng);
          void global.SNMap?.open?.(p.lat, p.lng);
          try {
            global.SNCli?.log?.(
              'City map · ' + p.lat.toFixed(3) + ', ' + p.lng.toFixed(3) + ' (zoom target)',
              'ok'
            );
          } catch (_) {}
        }
        e.preventDefault();
      },
      { passive: false }
    );

    // Desktop dblclick also zooms out (pointer path already handles most cases)
    canvas.addEventListener('dblclick', function (e) {
      e.preventDefault();
      if (tapTimer) {
        clearTimeout(tapTimer);
        tapTimer = null;
      }
      lastTapAt = 0;
      zoomOutOne();
    });
  }

  /**
   * Single tap/click: fly to point + zoom deeper (NATIONAL → REGIONAL → CITY).
   * No blue rings — fly and zoom only.
   */
  function diveInAt(lat, lng) {
    if (lat == null || lng == null) return false;
    var tier = nextDiveTier(lat, lng);
    var openMap =
      tier === 'city' && (G.bodyId === 'earth' || !G.bodyId);
    return goToPlace(lat, lng, {
      tier: tier,
      openMap: openMap,
      pulse: false,
      body: G.bodyId || 'earth',
    });
  }

  /**
   * Double tap/click: zoom OUT one ladder step (city→regional→national→global→solar).
   */
  function zoomOutOne() {
    var prev = prevZoomTier();
    G.diveTier = prev;
    G.velX = 0;
    G.velY = 0;
    if (prev === 'city' || prev === 'regional' || prev === 'national') {
      try {
        if (global.SNMap && SNMap.close) SNMap.close();
      } catch (_) {}
      var f = focusPos();
      if (f && f.lat != null) {
        flyNear(f.lat, f.lng, prev);
      } else {
        animateZ(TIERS[prev].z, 700);
      }
    } else {
      try {
        if (global.SNMap && SNMap.close) SNMap.close();
      } catch (_) {}
      animateZ(TIERS[prev].z, 700);
      if (prev === 'global' || prev === 'solar') G.diveTier = prev;
    }
    setTierLabel();
    var label = (TIERS[prev] && TIERS[prev].label) || prev;
    setHud('Astranov SpaceNet · ' + label);
    try {
      if (global.SNCli && SNCli.log) SNCli.log('Zoom out · ' + label, 'dim');
      if (global.SNCli && SNCli.preview) SNCli.preview(label);
    } catch (_) {}
    return prev;
  }

  /**
   * Switch planetary / body globe (Earth, Mars, Moon, …). Dedummyfy multi-world.
   */
  function setBody(bodyId, meta) {
    if (!G.ready || !G.earthMat) return false;
    var id = String(bodyId || 'earth').toLowerCase();
    G.bodyId = id;
    G.bodyMeta = meta || null;
    var mat = G.earthMat;
    var loader = G._loader || new THREE.TextureLoader();

    // Reset maps
    mat.map = null;
    mat.specularMap = null;
    mat.emissive = new THREE.Color(0x000000);
    mat.emissiveIntensity = 0;

    if (id === 'earth') {
      mat.color.set(0x223344);
      if (G._applyEarthTextures) G._applyEarthTextures();
      if (G.clouds) G.clouds.visible = true;
      setHud('Earth · GLOBAL');
      return true;
    }

    if (G.clouds) G.clouds.visible = false;
    var col = (meta && meta.color) || 0x888888;
    mat.color.set(col);
    mat.needsUpdate = true;

    if (meta && meta.map) {
      loader.load(
        meta.map,
        function (tex) {
          mat.map = tex;
          mat.color.set(0xffffff);
          mat.needsUpdate = true;
        },
        undefined,
        function () {
          mat.color.set(col);
          mat.needsUpdate = true;
        }
      );
    }
    setHud((meta && meta.name) || id);
    try {
      if (global.SNCli && SNCli.log)
        SNCli.log('Globe body · ' + ((meta && meta.name) || id), 'ok');
    } catch (_) {}
    return true;
  }

  /**
   * SpaceNet: fly to lat/lng + zoom tier + optional crawl.
   * Default: NO pulse markers (SPECS — click is fly/zoom only).
   * Pass pulse:true only for explicit pin highlights (locate / optional UI).
   */
  function goToPlace(lat, lng, opts) {
    opts = opts || {};
    if (lat == null || lng == null || !isFinite(lat) || !isFinite(lng)) return false;
    setFocus(lat, lng);
    var tier = opts.tier || 'national';
    if (!TIERS[tier]) tier = 'national';
    G.diveTier = tier;
    var bodyId = opts.body || G.bodyId || 'earth';
    // Fly + zoom only — no decorative rings unless explicitly requested
    flyNear(lat, lng, tier);
    if (opts.pulse === true) {
      pulse(lat, lng, opts.color != null ? opts.color : 0x3d9eff, opts.label || '', opts.ms || 8000);
    }
    try {
      var label = (TIERS[tier] && TIERS[tier].label) || tier;
      var bname =
        (global.SNCosmos && SNCosmos.body && SNCosmos.body.name) ||
        bodyId ||
        'Earth';
      setHud(bname + ' · ' + label + ' · ' + lat.toFixed(2) + '°, ' + lng.toFixed(2) + '°');
      if (global.SNCli && SNCli.log) {
        SNCli.log(
          'SpaceNet · ' +
            bname +
            ' · ' +
            label +
            ' · ' +
            lat.toFixed(3) +
            ', ' +
            lng.toFixed(3),
          'ok'
        );
        SNCli.preview(bname + ' · ' + label);
      }
    } catch (_) {}
    // Earth street map only at CITY (or openMap:true) — not at national/regional
    if (
      (opts.openMap === true || (opts.openMap !== false && tier === 'city')) &&
      (bodyId === 'earth' || G.bodyId === 'earth')
    ) {
      try {
        if (global.SNMap && SNMap.open) void SNMap.open(lat, lng);
      } catch (_) {}
    } else if (tier !== 'city') {
      try {
        if (global.SNMap && SNMap.close && global.SNMap.active) SNMap.close();
      } catch (_) {}
    }
    // Crawl POIs at this address — never re-fly
    if (!opts.skipScan && global.SNCosmos && SNCosmos.scan) {
      void SNCosmos.scan(bodyId || G.bodyId || 'earth', lat, lng, {
        openMap: false,
        fly: false,
      });
    }
    setTierLabel();
    return true;
  }

  function onResize() {
    if (!G.renderer) return;
    var el = document.getElementById('globe');
    var w = el.clientWidth || window.innerWidth;
    var h = el.clientHeight || window.innerHeight;
    G.camera.aspect = w / h;
    G.camera.updateProjectionMatrix();
    G.renderer.setSize(w, h, false);
  }

  function loop() {
    requestAnimationFrame(loop);
    if (!G.ready || document.hidden) return;
    if (global.SNMap?.active) {
      if (++G.frame % 40 === 0) {
        try {
          G.renderer.render(G.scene, G.camera);
        } catch (_) {}
      }
      return;
    }
    G.frame++;
    var idle = Date.now() - G.lastAct > 2800;
    if (!G.dragging && !G.zoomAnim && !G.flying) {
      var skip = idle ? 3 : 1;
      if (G.frame % skip !== 0) return;
    }
    var userCool = Date.now() - (G.lastUserControl || 0) < 450;
    if (
      !G.dragging &&
      !G.flying &&
      !userCool &&
      (Math.abs(G.velX) > 0.00008 || Math.abs(G.velY) > 0.00008)
    ) {
      G.pivot.rotation.order = 'YXZ';
      G.pivot.rotation.y += G.velX;
      G.pivot.rotation.x = Math.max(-1.2, Math.min(1.2, G.pivot.rotation.x + G.velY));
      G.pivot.rotation.z = 0;
      G.velX *= G.damp;
      G.velY *= G.damp;
      if (Math.abs(G.velX) < 0.00008) G.velX = 0;
      if (Math.abs(G.velY) < 0.00008) G.velY = 0;
    } else if (
      !G.dragging &&
      !G.flying &&
      !userCool &&
      idle &&
      G.camera.position.z > 2.35
    ) {
      // Very gentle idle only at GLOBAL/SOLAR — never fight user control
      G.pivot.rotation.y += 0.00045;
    }
    if (G.clouds) G.clouds.rotation.y += 0.00035;
    try {
      G.renderer.render(G.scene, G.camera);
    } catch (_) {}
  }

  function animateZ(toZ, ms) {
    var from = G.camera.position.z;
    var t0 = performance.now();
    var dur = ms || 650;
    G.zoomAnim = true;
    function step(t) {
      var k = Math.min(1, (t - t0) / dur);
      var e = k < 0.5 ? 2 * k * k : -1 + (4 - 2 * k) * k;
      G.camera.position.z = from + (toZ - from) * e;
      setTierLabel();
      G.lastAct = Date.now();
      if (k < 1) requestAnimationFrame(step);
      else G.zoomAnim = false;
    }
    requestAnimationFrame(step);
  }

  function goToTier(name) {
    var t = TIERS[name] || TIERS.global;
    G.diveTier = name in TIERS ? name : 'global';
    if (name !== 'city') {
      try {
        if (global.SNMap && SNMap.close) SNMap.close();
      } catch (_) {}
    }
    animateZ(t.z, 700);
    setTierLabel();
    setHud('Astranov SpaceNet · ' + t.label);
    try {
      if (global.SNCli && SNCli.preview) SNCli.preview(t.label + ' zoom');
    } catch (_) {}
    return t.label;
  }

  function clearMarkers() {
    G.markers.forEach(function (m) {
      try {
        G.pivot.remove(m.mesh);
        if (m.ring) G.pivot.remove(m.ring);
      } catch (_) {}
    });
    G.markers = [];
  }

  /** Tiny pin for locate/shops only — never used on click dive (SPECS) */
  function pulse(lat, lng, color, label, ms) {
    if (!G.ready) return null;
    var c = color != null ? color : 0x44ffaa;
    var pos = latLngToVec(lat, lng, 1.012);
    var mesh = new THREE.Mesh(
      new THREE.SphereGeometry(0.008, 8, 8),
      new THREE.MeshBasicMaterial({ color: c })
    );
    mesh.position.copy(pos);
    G.pivot.add(mesh);
    G.markers.push({ mesh: mesh, ring: null, born: Date.now(), ms: ms || 10000 });
    var now = Date.now();
    G.markers = G.markers.filter(function (m) {
      if (now - m.born > m.ms) {
        try {
          G.pivot.remove(m.mesh);
          if (m.ring) G.pivot.remove(m.ring);
        } catch (_) {}
        return false;
      }
      return true;
    });
    G.lastAct = Date.now();
    return mesh;
  }

  /**
   * Rotate pivot so lat/lng faces the camera — same frame as pulse/latLngToVec.
   * Old formula (-lng, lat*0.55) did NOT match the sphere mapping → marker OK, view wrong.
   */
  function flyNear(lat, lng, tierHint) {
    if (!G.ready || !G.pivot || !G.camera) return;
    if (lat == null || lng == null || !isFinite(lat) || !isFinite(lng)) return;
    setFocus(lat, lng);
    G.velX = 0;
    G.velY = 0;
    G.flyGen = (G.flyGen || 0) + 1;
    var gen = G.flyGen;
    G.flying = true;
    G.lastAct = Date.now();

    // Local surface point (identical math to pulse markers)
    var local = latLngToVec(lat, lng, 1).normalize();
    // Face that point toward the camera (not crude euler guess)
    var camDir = G.camera.position.clone().normalize();
    if (camDir.lengthSq() < 1e-8) camDir.set(0, 0, 1);
    var qEnd = new THREE.Quaternion().setFromUnitVectors(local, camDir);
    var qStart = G.pivot.quaternion.clone();

    var t0 = performance.now();
    var dur = 780;
    function step(t) {
      if (gen !== G.flyGen) return;
      // User grabbed mid-fly — abort (stopMotion bumps flyGen)
      if (G.dragging) {
        G.flying = false;
        bakePivotEuler();
        return;
      }
      var k = Math.min(1, (t - t0) / dur);
      var e = k * (2 - k);
      G.pivot.quaternion.slerpQuaternions(qStart, qEnd, e);
      G.lastAct = Date.now();
      if (k < 1) {
        requestAnimationFrame(step);
      } else {
        G.pivot.quaternion.copy(qEnd);
        bakePivotEuler();
        G.velX = 0;
        G.velY = 0;
        G.flying = false;
        G.lastAct = Date.now();
      }
    }
    requestAnimationFrame(step);
    if (tierHint && TIERS[tierHint]) animateZ(TIERS[tierHint].z, 650);
    else if (G.camera.position.z > TIERS.national.z) animateZ(TIERS.national.z, 650);
  }

  function locate() {
    return new Promise(function (resolve) {
      function finish(lat, lng, fallback) {
        goToPlace(lat, lng, {
          tier: 'national',
          pulse: true,
          color: 0x3d9eff,
          label: fallback ? 'You (GPS default)' : 'You',
          skipScan: false,
        });
        resolve({ lat: lat, lng: lng, fallback: !!fallback, demo: false });
      }
      // Default Rhodes only when GPS unavailable — real coords, not a "demo city"
      if (!navigator.geolocation) return finish(36.4341, 28.2176, true);
      navigator.geolocation.getCurrentPosition(
        function (pos) {
          finish(pos.coords.latitude, pos.coords.longitude, false);
        },
        function () {
          finish(36.4341, 28.2176, true);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 }
      );
    });
  }

  function setHud(text) {
    var el = document.getElementById('hud-line');
    if (el) el.textContent = text || '';
  }

  function getPhysics() {
    return {
      velX: G.velX,
      velY: G.velY,
      damp: G.damp,
      inertia: true,
      dragging: G.dragging,
      tier: G.tier,
      z: G.camera ? G.camera.position.z : null,
      focus: focusPos(),
    };
  }

  global.SNGlobe = {
    init: init,
    pulse: pulse,
    clearMarkers: clearMarkers,
    locate: locate,
    flyNear: flyNear,
    goToTier: goToTier,
    goToPlace: goToPlace,
    diveInAt: diveInAt,
    zoomOutOne: zoomOutOne,
    setBody: setBody,
    pickLatLng: pickLatLng,
    setFocus: setFocus,
    focusPos: focusPos,
    setHud: setHud,
    getPhysics: getPhysics,
    TIERS: TIERS,
    LADDER: LADDER,
    DIVE: DIVE,
    get tier() {
      return G.tier;
    },
    get bodyId() {
      return G.bodyId || 'earth';
    },
    get ready() {
      return G.ready;
    },
    get lastPos() {
      return focusPos();
    },
  };
})(typeof window !== 'undefined' ? window : globalThis);
