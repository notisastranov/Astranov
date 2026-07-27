/**
 * Astranov SpaceNet — continuity (machine contract)
 * Clean stack 2026-07-28: js/spacenet/* only. Legacy archived under _archive/.
 */
const AstranovContinuity = {
  version: '20260728030000-spacenets-primacy',
  updated: '2026-07-28',
  live: 'https://astranov.eu',
  repo: 'notisastranov/astranov.eu',

  ip: {
    mark: 'Astranov SpaceNet',
    notice: '© Astranov SpaceNet. All rights reserved.',
    owners: ['notisastranov', 'AI pair under owner direction'],
    protect: [
      'Spatial internet UI (body+lat+lng, zoom-to-open)',
      'Clean js/spacenet stack',
      'DB-first real shops',
      'Sci-fi CLI companion',
      'S (SpaceNets) primary currency — fiat/crypto secondary; not AVC',
      'SpaceNet as interstellar OS for artificial and biological entities',
    ],
  },

  economics: {
    currency: {
      name: 'SpaceNets',
      symbol: 'S',
      primacy: true,
      ban: ['AVC', 'coins', 'fixed-1-EUR', 'fiat-as-primary', 'crypto-as-primary'],
    },
    platformFee: 0.03,
    driverGrossShare: 0.15,
    valueModel: 'S-primary-dynamic-network; EUR/USD/BTC/ETH/others secondary quotes only',
    lesserCurrencies: ['EUR', 'USD', 'BTC', 'ETH', 'all-other-fiat-crypto'],
    osThesis: 'SpaceNet is the new OS for interstellar artificial and biological entities',
    code: 'js/spacenet/currency.js SNCurrency',
  },

  agentDiscipline: {
    alwaysUpdateSpecs: true,
    verifyBeforeShip: true,
    noDummyShips: true,
    noDeploySpam: false,
    failClosedOnRedProbe: true,
    noFloatingButtonDocks: true,
    cliIsPrimaryUi: true,
  },

  stack: {
    entry: 'index.html → /js/spacenet/boot.js',
    modules: [
      'config', 'brain', 'globe', 'tasks', 'profiles', 'currency', 'commerce', 'spatial',
      'cli', 'ui', 'tile', 'map', 'search', 'auth', 'ai',
    ],
    archived: '_archive/legacy-20260727 + _archive/legacy-js-phase',
    doNotLoad: ['astranov-app.js', 'astranov-deferred.js', 'phase-*.js'],
  },

  features: {
    operatingPath: {
      summary: 'locate/city/shops → SNCommerce.populateMap (Supabase bbox) → map pins',
      owner: 'js/spacenet/commerce.js + map.js + cli.js',
    },
    spatial: {
      summary: 'Thesis garage + Cydonia seeds; vault',
      owner: 'js/spacenet/spatial.js',
    },
    globe: {
      summary: 'Three.js Earth real texture, inertia, zoom tiers',
      owner: 'js/spacenet/globe.js',
    },
    cli: {
      summary: 'Sci-fi CLI + companion dots; no floating multi-docks',
      owner: 'js/spacenet/cli.js + index companion',
    },
  },

  verify: [
    'Hard refresh astranov.eu — globe paints, boot hides',
    'CLI accepts locate · city · shops · rate',
    'shops loads real Supabase vendors when DB has data',
    'No request for astranov-app.js / deferred',
    'thesis · vault · go to mars work',
    'CLI rate shows S SpaceNets primacy (not AVC/coins)',
    'currency.js loads; prices show N.NN S',
    'rate status: fiat/crypto are secondary quotes, not unit of account',
  ],
};

window.AstranovContinuity = AstranovContinuity;
