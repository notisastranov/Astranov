/* SNVillage — Astranov Kalithea Sustainable Village
 * Real HQ on Earth. Source: https://maps.app.goo.gl/4yiGNUgXtNNaEqkt9
 * 36.387557 N, 28.222533 E · Kalithea, Rhodes, GR
 */
(function (global) {
  'use strict';

  var HQ = {
    id: 'astranov-kalithea-village',
    name: 'Astranov Kalithea Sustainable Village',
    short: 'KALITHEA',
    lat: 36.387557,
    lng: 28.222533,
    maps: 'https://maps.app.goo.gl/4yiGNUgXtNNaEqkt9',
    kind: 'village',
    island: 'Rhodes',
    country: 'GR',
  };

  function log(msg, cls) {
    try {
      if (global.SNCli && SNCli.log) SNCli.log(msg, 'ok', true);
    } catch (_) {}
  }

  function fly(tier) {
    tier = tier || 'regional';
    try {
      if (global.SNGlobe && SNGlobe.goToPlace) {
        SNGlobe.goToPlace(HQ.lat, HQ.lng, {
          tier: tier,
          pulse: true,
          color: 0x14c3f3,
          label: HQ.short,
          ms: 24000,
          openMap: false,
          body: 'earth',
        });
      }
    } catch (_) {}
    try {
      if (global.SNStage && SNStage.scan) SNStage.scan(HQ.short);
      if (global.SNStage && SNStage.arc && global._snPhysPos) {
        SNStage.arc(
          { lat: global._snPhysPos.lat, lng: global._snPhysPos.lng, name: 'YOU' },
          { lat: HQ.lat, lng: HQ.lng, name: HQ.short },
          { kind: 'home' }
        );
      }
    } catch (_) {}
    log('ASTRANOV · Kalithea Sustainable Village · 36.387557°N 28.222533°E', 'ok');
    return true;
  }

  function pinQuiet() {
    try {
      if (global.SNGlobe && SNGlobe.pulse)
        SNGlobe.pulse(HQ.lat, HQ.lng, 0x14c3f3, HQ.short, 120000);
    } catch (_) {}
  }

  function isVillageQuery(raw) {
    var t = String(raw || '')
      .trim()
      .toLowerCase()
      .replace(/[.,]/g, ' ');
    if (!t) return false;
    if (/^(village|kalithea|kallithea|καλλιθεα|καλλιθέα)$/i.test(t)) return true;
    if (/astranov/.test(t) && /(village|kalithea|kallithea|sustainable|καλλιθ)/.test(t)) return true;
    if (/(kalithea|kallithea|καλλιθ)/.test(t) && /(village|sustainable|astranov)/.test(t)) return true;
    return false;
  }

  function handleLine(raw) {
    if (!isVillageQuery(raw)) return false;
    var t = String(raw || '').toLowerCase();
    fly(/street|zoom|city|map/.test(t) ? 'city' : 'regional');
    return true;
  }

  function hit() {
    return {
      lat: HQ.lat,
      lng: HQ.lng,
      name: HQ.name,
      label: HQ.short,
      source: 'hq',
      kind: 'village',
    };
  }

  function boot() {
    pinQuiet();
    try {
      if (global.SNGlobe && SNGlobe.goToPlace && !global._snPhysPos) {
        SNGlobe.goToPlace(HQ.lat, HQ.lng, {
          tier: 'national',
          pulse: true,
          color: 0x14c3f3,
          label: HQ.short,
          ms: 20000,
          openMap: false,
        });
      }
    } catch (_) {}
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () {
    setTimeout(boot, 1400);
  });
  else setTimeout(boot, 1400);

  global.SNVillage = {
    HQ: HQ,
    fly: fly,
    pin: pinQuiet,
    handleLine: handleLine,
    isVillageQuery: isVillageQuery,
    hit: hit,
    boot: boot,
  };
  global.ASTRANOV_VILLAGE = HQ;
})(typeof window !== 'undefined' ? window : globalThis);
