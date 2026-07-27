/**
 * Astranov SpaceNet — continuity (machine contract)
 * FULL CHROME REBUILD 2026-07-28 — thin stacks without radar/S/mine/ribbon = contaminated.
 */
const AstranovContinuity = {
  version: '20260728050000-rebuild-full-chrome',
  updated: '2026-07-28',
  live: 'https://astranov.eu',
  repo: 'notisastranov/astranov.eu',
  rebuild: {
    reason: 'Prior thin stack omitted radar, S field, mining/resources/perf, task ribbon',
    policy: 'discard-contaminated-dummy-rebuild-to-SPECS',
  },

  ip: {
    mark: 'Astranov SpaceNet',
    notice: '© Astranov SpaceNet. All rights reserved.',
    owners: ['notisastranov', 'AI pair under owner direction'],
    protect: [
      'Spatial internet UI (body+lat+lng, zoom-to-open)',
      'Full chrome: radar + S wallet + resources/mine + task ribbon',
      'Clean js/spacenet stack only on live',
      'S (SpaceNets) primary currency',
      'SpaceNet OS for interstellar artificial and biological entities',
    ],
  },

  economics: {
    currency: {
      name: 'SpaceNets',
      symbol: 'S',
      primacy: true,
      ban: ['AVC', 'coins', 'fixed-1-EUR', 'fiat-as-primary'],
    },
    platformFee: 0.03,
    driverGrossShare: 0.15,
    miningUnit: 'S',
    code: 'currency.js + wallet.js + resources.js',
  },

  agentDiscipline: {
    alwaysUpdateSpecs: true,
    verifyBeforeShip: true,
    noDummyShips: true,
    discardContaminatedThinStacks: true,
    rebuildWhenSeriesOfSpecsViolated: true,
    noOverlappingChrome: true,
    noLowFiCompanionFigure: true,
    defaultFullGlobalEarth: true,
    requiredSurface: ['radar', 'S-field', 'resources-mine-perf', 'task-ribbon', 'cli', 'global-earth'],
  },

  stack: {
    entry: 'index.html → /js/spacenet/boot.js',
    modules: [
      'config', 'brain', 'globe', 'tasks', 'profiles',
      'currency', 'wallet', 'resources', 'radar', 'field', 'ribbon',
      'commerce', 'spatial', 'cli', 'ui', 'tile', 'map', 'search', 'auth', 'ai',
    ],
    doNotLoad: ['astranov-app.js', 'astranov-deferred.js', 'phase-*.js', 'astranov-field-hud.js on live path'],
  },

  features: {
    radar: { owner: 'js/spacenet/radar.js', fps: 8, earthKmh: 1671 },
    currencyField: { owner: 'js/spacenet/field.js + wallet.js + currency.js' },
    resources: { owner: 'js/spacenet/resources.js', cmds: ['resources', 'mine', 'donate', 'boost'] },
    taskRibbon: { owner: 'js/spacenet/ribbon.js', note: 'materialise buttons for current task only' },
    operatingPath: {
      summary: 'locate/city/shops openMap intentional; boot stays GLOBAL Earth',
      owner: 'commerce.js + map.js + cli.js',
    },
  },

  verify: [
    'build 20260728050000-rebuild-full-chrome',
    'full GLOBAL Earth default',
    '#field-radar present',
    '#field-balance-hud shows S',
    '#sn-task-ribbon materialises task buttons',
    'CLI resources · rate · wallet · mine on',
    'no sn-companion',
    'no overlapping logo vs radar vs S vs edge',
    'soft shops do not open city map',
  ],
};

window.AstranovContinuity = AstranovContinuity;
