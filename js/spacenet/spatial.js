/* SpaceNet Spatial — objects live at body+lat+lng (SPECS law) */
(function (global) {
  'use strict';

  const KEY = 'sn:places-v1';
  const SEEDS = [
    {
      id: 'seed-thesis-garage',
      body: 'earth',
      lat: 36.44125,
      lng: 28.22255,
      kind: 'file',
      emoji: '📄',
      name: 'Thesis.pdf',
      title: 'Thesis on the garage',
      text:
        'ASTRANOV SPACENET\n\nThis file lives at real coordinates (garage, Rhodes).\nZoom the city map here to open it.\n',
    },
    {
      id: 'seed-cydonia-music',
      body: 'mars',
      lat: 40.75,
      lng: -9.46,
      kind: 'folder',
      emoji: '🎵',
      name: 'Cydonia Music',
      title: 'Music on Mars Cydonia',
      text: 'Folder: Face_of_Mars.mp3 · Red_Dust.wav · Playlist.md\nGo: go to mars',
    },
  ];

  const S = { places: [] };

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      S.places = raw ? JSON.parse(raw) : [];
      if (!Array.isArray(S.places)) S.places = [];
    } catch (_) {
      S.places = [];
    }
    SEEDS.forEach((seed) => {
      if (!S.places.some((p) => p.id === seed.id)) S.places.push({ ...seed });
    });
  }

  function save() {
    try {
      localStorage.setItem(KEY, JSON.stringify(S.places.filter((p) => !String(p.id).startsWith('seed-')).slice(-100)));
    } catch (_) {}
  }

  function get(id) {
    return S.places.find((p) => p.id === id) || null;
  }

  function put(place) {
    const row = {
      id: place.id || 'p_' + Date.now().toString(36),
      body: place.body || 'earth',
      lat: Number(place.lat),
      lng: Number(place.lng),
      kind: place.kind || 'file',
      emoji: place.emoji || '📌',
      name: String(place.name || 'Place').slice(0, 80),
      title: String(place.title || place.name || 'Place').slice(0, 100),
      text: place.text || '',
    };
    const i = S.places.findIndex((p) => p.id === row.id);
    if (i >= 0) S.places[i] = row;
    else S.places.unshift(row);
    save();
    return row;
  }

  function open(id) {
    const p = get(id);
    if (!p) {
      global.SNCli?.log?.('place not found', 'err');
      return null;
    }
    global.SNCli?.log?.((p.emoji || '📌') + ' ' + (p.title || p.name) + ' @ ' + (p.body || 'earth'), 'ok');
    if (p.text) {
      String(p.text)
        .split('\n')
        .forEach((ln) => global.SNCli?.log?.(ln, 'dim'));
    }
    if (p.body === 'earth' && p.lat != null) {
      global.SNGlobe?.pulse?.(p.lat, p.lng, 0x66ccff, p.name, 20000);
      global.SNGlobe?.flyNear?.(p.lat, p.lng, 'national');
      void global.SNMap?.open?.(p.lat, p.lng);
    } else if (p.body === 'mars') {
      global.SNGlobe?.goToTier?.('solar');
      global.SNCli?.log?.('Mars tier · Cydonia folder (coords ' + p.lat + ',' + p.lng + ')', 'ok');
    }
    global.SNCli?.preview?.(p.title || p.name);
    return p;
  }

  function list() {
    return S.places.slice();
  }

  function init() {
    load();
  }

  global.SNSpatial = { init, put, get, open, list, SEEDS };
})(window);
