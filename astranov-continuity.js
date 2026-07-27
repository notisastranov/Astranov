/** Astranov SpaceNet continuity — machine contract. SPECS.md is law. */
const AstranovContinuity = {
  version: '20260728100000-astranov-ai-presence',
  updated: '2026-07-28',
  live: 'https://astranov.eu',
  repo: 'notisastranov/astranov.eu',

  p0: 'spartan-coding',
  shipGate: 'node scripts/probe-spacenet-boot.mjs must PASS before ship',
  neverMakeOwnerRestateSpecs: true,
  keepImaging: {
    name: 'SNGlobe',
    file: 'js/spacenet/globe.js',
    textures: ['earth_atmos_2048', 'earth_specular_2048', 'earth_clouds_1024'],
    engine: 'Three.js TextureLoader sphere',
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
      'config', 'brain', 'globe', 'tasks', 'profiles',
      'currency', // S + wallet
      'field', // radar + S HUD + mine + ribbon + finance
      'commerce', 'spatial', 'cli', 'ui', 'tile', 'map', 'search', 'auth', 'ai',
    ],
    doNotLoad: ['astranov-app.js', 'astranov-deferred.js', 'phase-*.js', 'wallet.js', 'radar.js', 'resources.js', 'ribbon.js'],
  },

  surface: ['radar', 'S-field', 'resources-mine-perf', 'task-ribbon', 'cli', 'global-earth'],

  agentDiscipline: {
    alwaysUpdateSpecs: true,
    verifyBeforeShip: true,
    spartanFirst: true,
    noOverlappingChrome: true,
    noLowFiCompanion: true,
    defaultFullGlobalEarth: true,
  },

  verify: [
    'GLOBAL Earth default',
    '#field-radar · #field-balance-hud · #sn-task-ribbon',
    'CLI: rate · resources · shops · locate',
    'no companion · no overlap',
    'field.js + currency.js only for field economy',
  ],
};

window.AstranovContinuity = AstranovContinuity;
