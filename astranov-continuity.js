/**
 * Astranov SpaceNet — continuity (machine contract)
 * Clean stack 2026-07-28: js/spacenet/* only. Legacy archived under _archive/.
 */
const AstranovContinuity = {
  version: '20260728040000-ui-global-no-overlap',
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
      'Full GLOBAL Earth default; no overlapping chrome',
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
    noOverlappingChrome: true,
    noLowFiCompanionFigure: true,
    defaultFullGlobalEarth: true,
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
      summary: 'locate/city/shops → SNCommerce.populateMap (openMap when user asks) → map pins',
      owner: 'js/spacenet/commerce.js + map.js + cli.js',
    },
    spatial: {
      summary: 'Thesis garage + Cydonia seeds; vault',
      owner: 'js/spacenet/spatial.js',
    },
    globe: {
      summary: 'Three.js Earth; default tier global; full Earth view',
      owner: 'js/spacenet/globe.js',
    },
    cli: {
      summary: 'Single CLI dock; no companion figure until AI graphics > high-level gaming',
      owner: 'js/spacenet/cli.js + index',
    },
    chrome: {
      summary: 'No overlapping zones: left auth · center logo · right edge · bottom CLI',
      owner: 'index.html + ui.js',
    },
  },

  verify: [
    'Hard refresh — full GLOBAL Earth, city map closed',
    'No #sn-companion / no dot-matrix face canvas',
    'No overlapping logo vs edge vs Globe vs CLI',
    'CLI collapsed by default',
    'Soft shop load does not open city map',
    'CLI accepts locate · city · shops · rate',
    'shops with openMap paints real Supabase vendors when DB has data',
    'No request for astranov-app.js / deferred',
  ],
};

window.AstranovContinuity = AstranovContinuity;
