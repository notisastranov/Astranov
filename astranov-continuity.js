/** Astranov SpaceNet continuity — machine contract. SPECS.md is law. */
const AstranovContinuity = {
  version: '20260728130000-cosmos-dedummy',
  updated: '2026-07-28',
  live: 'https://astranov.eu',
  repo: 'notisastranov/astranov.eu',

  p0: 'spartan-coding',
  shipGate: 'node scripts/probe-spacenet-boot.mjs must PASS before ship',
  neverMakeOwnerRestateSpecs: true,

  /** P1-C: internet → SpaceNet multi-body (dedummyfy every globe) */
  cosmos: {
    name: 'SNCosmos',
    file: 'js/spacenet/cosmos.js',
    api: ['go', 'scan', 'resolve', 'list', 'parseGo'],
    pipeline: 'setBody → land goToPlace → scan/crawl',
    rule: 'go anywhere = real body globe + land + crawl; no dummy solar-only',
    bodiesMin: [
      'earth',
      'moon',
      'mars',
      'mercury',
      'venus',
      'jupiter',
      'saturn',
      'uranus',
      'neptune',
      'pluto',
      'europa',
      'titan',
    ],
    earthOnlyCityMap: true,
    crawl: {
      earth: ['reverse', 'SNSearch.crawl', 'SNCommerce.loadNear', 'SNSpatial'],
      other: ['wikipedia', 'SNSpatial'],
    },
  },

  keepImaging: {
    name: 'SNGlobe',
    file: 'js/spacenet/globe.js',
    textures: ['earth_atmos_2048', 'earth_specular_2048', 'earth_clouds_1024'],
    engine: 'Three.js TextureLoader sphere',
    api: ['setBody', 'goToPlace', 'pickLatLng', 'flyNear', 'goToTier'],
    clickGoesThere: true,
    cityZoomUsesFocusNotHomeOnly: true,
  },

  ip: {
    mark: 'Astranov SpaceNet',
    notice: '© Astranov SpaceNet. All rights reserved.',
    owners: ['notisastranov', 'AI pair under owner direction'],
  },

  economics: {
    currency: { name: 'SpaceNets', symbol: 'S', primacy: true },
    ban: ['AVC', 'coins', 'fixed-1-EUR'],
    platformFee: 0.03,
    driverGrossShare: 0.15,
    code: 'js/spacenet/currency.js',
  },

  stack: {
    entry: 'index.html → boot.js',
    modules: [
      'config',
      'brain',
      'globe',
      'cosmos',
      'tasks',
      'profiles',
      'currency',
      'field',
      'commerce',
      'spatial',
      'cli',
      'ai',
      'ui',
      'tile',
      'map',
      'search',
      'auth',
    ],
    doNotLoad: [
      'astranov-app.js',
      'astranov-deferred.js',
      'phase-*.js',
      'wallet.js',
      'radar.js',
      'resources.js',
      'ribbon.js',
    ],
  },

  surface: [
    'radar',
    'S-field',
    'resources-mine-perf',
    'task-ribbon',
    'cli',
    'global-earth',
    'multi-body-cosmos',
    'astranov-ai-presence',
  ],

  agentDiscipline: {
    alwaysUpdateSpecs: true,
    verifyBeforeShip: true,
    spartanFirst: true,
    noOverlappingChrome: true,
    noLowFiCompanion: true,
    defaultFullGlobalEarth: true,
    dedummyfyEveryGlobe: true,
  },

  verify: [
    'GLOBAL Earth default',
    'short-tap Earth → NATIONAL + scan (not always my city)',
    'go to mars → setBody mars + land + crawl',
    'go to moon / jupiter work',
    'cosmos lists bodies',
    'off-Earth does not open Earth Leaflet as that world',
    '#field-radar · #field-balance-hud · #sn-task-ribbon',
    'CLI: rate · resources · shops · locate · cosmos',
    'SNAi greets on boot',
    'long-press map create · short-tap pin open tile',
    'no companion · no overlap',
  ],
};

window.AstranovContinuity = AstranovContinuity;
