/* SNGlobe — Earth imaging engine (KEEP)
 * Mechanical name: window.SNGlobe (js/spacenet/globe.js)
 * Three.js sphere + TextureLoader: earth_atmos_2048 · specular · clouds
 * Sacred: inertia velX/velY damp · zoom tiers · CLICK = go to that place (SpaceNet)
 */
(function (global) {
  'use strict';

  var TIERS = {
    solar: { z: 7.5, label: 'SOLAR' },
    global: { z: 2.75, label: 'GLOBAL' },
    national: { z: 1.95, label: 'NATIONAL' },
    city: { z: 1.52, label: 'CITY' },
  };

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
    velX: 0,
    velY: 0,
    damp: 0.94,
    /** Last place the user aimed (click / zoom target) — SpaceNet focus */
    focus: null,
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
    if (z >= 1.7) return 'national';
    return 'city';
  }

  function setTierLabel() {
    G.tier = tierFromZ(G.camera.position.z);
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
    var x = ((clientX - rect.left) / rect.width) * 2 - 1;
    var y = -((clientY - rect.top) / rect.height) * 2 + 1;
    if (!G.raycaster) G.raycaster = new THREE.Raycaster();
    G.raycaster.setFromCamera(new THREE.Vector2(x, y), G.camera);
    var hits = G.raycaster.intersectObject(G.earth, false);
    if (!hits || !hits.length) {
      // try clouds as slightly larger shell
      if (G.clouds) hits = G.raycaster.intersectObject(G.clouds, false);
    }
    if (!hits || !hits.length) return null;
    // Point in world space → earth local
    var local = G.earth.worldToLocal(hits[0].point.clone());
    return vecToLatLng(local);
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
      ptrId = null;

    function onDown(e) {
      if (e.pointerType === 'touch' && e.isPrimary === false) return;
      down = true;
      moved = false;
      G.dragging = true;
      G.velX = 0;
      G.velY = 0;
      G.lastAct = Date.now();
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
      var t = e.touches ? e.touches[0] : e;
      var now = performance.now();
      var dt = Math.max(8, now - lastT);
      lastT = now;
      var dx = t.clientX - lx;
      var dy = t.clientY - ly;
      lx = t.clientX;
      ly = t.clientY;
      if (Math.abs(t.clientX - downX) + Math.abs(t.clientY - downY) > 8) moved = true;
      G.pivot.rotation.y += dx * 0.005;
      G.pivot.rotation.x = Math.max(-1.35, Math.min(1.35, G.pivot.rotation.x + dy * 0.004));
      G.velX = dx * (16 / dt) * 0.005;
      G.velY = dy * (16 / dt) * 0.004;
      if (e.cancelable) e.preventDefault();
    }

    function onUp(e) {
      if (!down) return;
      down = false;
      G.dragging = false;
      G.lastAct = Date.now();
      G.velX = Math.max(-0.08, Math.min(0.08, G.velX));
      G.velY = Math.max(-0.05, Math.min(0.05, G.velY));
      try {
        if (ptrId != null) canvas.releasePointerCapture(ptrId);
      } catch (_) {}
      var t = e.changedTouches ? e.changedTouches[0] : e;
      // Short tap (not drag) → go to that place on CURRENT body + crawl
      if (!moved && t) {
        var ll = pickLatLng(t.clientX, t.clientY);
        if (ll) {
          goToPlace(ll.lat, ll.lng, {
            tier: 'national',
            openMap: false,
            body: G.bodyId || 'earth',
          });
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

    // Double-click / double-tap: dive into that place (national → city map at click)
    canvas.addEventListener('dblclick', function (e) {
      var ll = pickLatLng(e.clientX, e.clientY);
      if (!ll) return;
      if (G.camera.position.z > TIERS.national.z + 0.05) {
        goToPlace(ll.lat, ll.lng, { tier: 'national', openMap: false });
      } else {
        goToPlace(ll.lat, ll.lng, { tier: 'city', openMap: true });
      }
    });
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
   * SpaceNet: go to the place you clicked — rotate + zoom tier + crawl what is there.
   */
  function goToPlace(lat, lng, opts) {
    opts = opts || {};
    if (lat == null || lng == null) return false;
    setFocus(lat, lng);
    var tier = opts.tier || 'national';
    var bodyId = opts.body || G.bodyId || 'earth';
    flyNear(lat, lng, tier);
    pulse(lat, lng, opts.color != null ? opts.color : 0x3d9eff, opts.label || 'Here', opts.ms || 12000);
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
        SNCli.preview(bname + ' · ' + lat.toFixed(2) + ', ' + lng.toFixed(2));
      }
    } catch (_) {}
    // Earth city map only when on Earth
    if ((opts.openMap || tier === 'city') && (bodyId === 'earth' || G.bodyId === 'earth')) {
      try {
        if (global.SNMap && SNMap.open) void SNMap.open(lat, lng);
      } catch (_) {}
    }
    // Crawl what is at this address (unless caller already scanning)
    if (!opts.skipScan && global.SNCosmos && SNCosmos.scan) {
      void SNCosmos.scan(bodyId || G.bodyId || 'earth', lat, lng, {
        openMap: false,
      });
    }
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
    if (!G.dragging && !G.zoomAnim) {
      var skip = idle ? 3 : 1;
      if (G.frame % skip !== 0) return;
    }
    if (!G.dragging && (Math.abs(G.velX) > 0.00005 || Math.abs(G.velY) > 0.00005)) {
      G.pivot.rotation.y += G.velX;
      G.pivot.rotation.x = Math.max(-1.35, Math.min(1.35, G.pivot.rotation.x + G.velY));
      G.velX *= G.damp;
      G.velY *= G.damp;
      if (Math.abs(G.velX) < 0.00005) G.velX = 0;
      if (Math.abs(G.velY) < 0.00005) G.velY = 0;
      G.lastAct = Date.now();
    } else if (!G.dragging && idle && G.camera.position.z > 2.2) {
      G.pivot.rotation.y += 0.0009;
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
    if (name !== 'city') {
      try {
        if (global.SNMap && SNMap.close) SNMap.close();
      } catch (_) {}
    }
    animateZ(t.z, 700);
    setHud('Astranov SpaceNet · ' + t.label);
    try {
      if (global.SNCli && SNCli.preview) SNCli.preview(t.label + ' zoom');
    } catch (_) {}
    return t.label;
  }

  function pulse(lat, lng, color, label, ms) {
    if (!G.ready) return null;
    var c = color != null ? color : 0x44ffaa;
    var pos = latLngToVec(lat, lng, 1.03);
    var mesh = new THREE.Mesh(
      new THREE.SphereGeometry(0.022, 10, 10),
      new THREE.MeshBasicMaterial({ color: c })
    );
    mesh.position.copy(pos);
    G.pivot.add(mesh);
    var ring = new THREE.Mesh(
      new THREE.RingGeometry(0.03, 0.045, 24),
      new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: 0.65, side: THREE.DoubleSide })
    );
    ring.position.copy(pos);
    ring.lookAt(0, 0, 0);
    G.pivot.add(ring);
    G.markers.push({ mesh: mesh, ring: ring, born: Date.now(), ms: ms || 14000 });
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

  function flyNear(lat, lng, tierHint) {
    if (!G.ready) return;
    setFocus(lat, lng);
    var targetY = (-lng * Math.PI) / 180;
    var targetX = ((lat * Math.PI) / 180) * 0.55;
    var startY = G.pivot.rotation.y;
    var startX = G.pivot.rotation.x;
    // Shortest rotation path
    var dy = targetY - startY;
    while (dy > Math.PI) dy -= Math.PI * 2;
    while (dy < -Math.PI) dy += Math.PI * 2;
    var t0 = performance.now();
    var dur = 850;
    function step(t) {
      var k = Math.min(1, (t - t0) / dur);
      var e = k * (2 - k);
      G.pivot.rotation.y = startY + dy * e;
      G.pivot.rotation.x = startX + (targetX - startX) * e;
      G.lastAct = Date.now();
      if (k < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
    if (tierHint && TIERS[tierHint]) animateZ(TIERS[tierHint].z, 700);
    else if (G.camera.position.z > TIERS.national.z) animateZ(TIERS.national.z, 700);
  }

  function locate() {
    return new Promise(function (resolve) {
      function finish(lat, lng, demo) {
        setFocus(lat, lng);
        pulse(lat, lng, 0x3d9eff, demo ? 'You (demo)' : 'You', 22000);
        flyNear(lat, lng, 'national');
        resolve({ lat: lat, lng: lng, demo: !!demo });
      }
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
    locate: locate,
    flyNear: flyNear,
    goToTier: goToTier,
    goToPlace: goToPlace,
    setBody: setBody,
    pickLatLng: pickLatLng,
    setFocus: setFocus,
    focusPos: focusPos,
    setHud: setHud,
    getPhysics: getPhysics,
    TIERS: TIERS,
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
