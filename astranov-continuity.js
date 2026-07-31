/** Astranov continuity — machine contract. SPECS.md is law. */
const AstranovContinuity = {
  version: '20260730510000-owner-verified-specs',
  updated: '2026-07-30',
  live: 'https://astranov.eu',
  repo: 'notisastranov/astranov.eu',
  ownerEmail: 'notisastranov@gmail.com',

  p0: 'spartan-coding',
  p0d: 'zero-dummy-absolute',
  shipGate: 'live path green OR honest not-verified; push alone is not ship',
  neverMakeOwnerRestateSpecs: true,
  emailSupportOnFalseShip: true,

  ownerVerified20260730: {
    splash: 'ASTRANOV only + horizontal deep blue glow loader',
    home: 'ASTRANOV wordmark only',
    boot: 'GLOBAL Earth in space · no city auto · no Rodos training',
    cli: 'text log + input only · no ribbon button flood · no feed chip tiles',
    multiTile: 'full card on map only',
    layers: 'no map-corner Layers under money HUD',
    ai: 'Astranov brand · ASTRANOV LISTENING · no junk free-mind',
    auth: 'astranov.eu only · never supabase project host',
    firstOrder: 'first delivery on shell boot path',
    mesh: 'donate on SETI-style spare capacity → S',
    globeDrag: 'polar Y spin · X tilt · no clock Z',
  },

  zeroDummy: {
    ban: [
      'seedCity-NPC',
      'seedDemo-tasks',
      'demo-vendors',
      'fake-drivers',
      'fake-dating-npcs',
      'demo-gps-city-as-product',
      'dummy-planet-text-only',
      'platform-marketplace-curfew',
      'invented-default-menus',
      'random-jitter-coords',
      'spatial-seed-demo-files',
    ],
    sectorFill: 'SNCommerce.ensureSector (db → edge → overpass → crawl)',
    emptySector: 'honest empty + long-press create or fly elsewhere',
    menu: 'real vendor items only — empty until listed',
  },

  cosmos: {
    name: 'SNCosmos',
    file: 'js/spacenet/cosmos.js',
    api: ['go', 'scan', 'resolve', 'list', 'parseGo'],
    pipeline: 'setBody → land goToPlace → scan/crawl',
    rule: 'go anywhere = real body globe + land + crawl; no dummy solar-only',
    bodiesMin: [
      'earth', 'moon', 'mars', 'mercury', 'venus', 'jupiter',
      'saturn', 'uranus', 'neptune', 'pluto', 'europa', 'titan',
    ],
    earthOnlyCityMap: true,
    crawl: {
      earth: ['reverse', 'SNSearch.crawl', 'SNCommerce.loadNear', 'SNSpatial'],
      other: ['wikipedia', 'SNSpatial'],
    },
  },

  /** SPACENET = pilot fly grid net — without it, flying on the net is not possible */
  spacenet: {
    name: 'SPACENET',
    law: 'Pilot fly grid net',
    file: 'js/spacenet/spacenet-grid.js',
    global: 'window.SPACENET',
    path: 'GLOBAL → NATIONAL → REGIONAL → CITY',
    ladder: ['solar', 'global', 'national', 'regional', 'city'],
    singleTap: 'one cell deeper (same place); new place → GLOBAL',
    doubleTap: 'one cell out toward SOLAR',
    owner: 'SNGlobe.diveInAt / zoomOutOne / goToPlace',
  },

  keepImaging: {
    name: 'SNGlobe',
    file: 'js/spacenet/globe.js',
    textures: ['earth_atmos_2048', 'earth_clouds_1024', 'earth-night'],
    engine: 'Three.js TextureLoader sphere + day/night shader',
    api: ['setBody', 'goToPlace', 'diveInAt', 'zoomOutOne', 'pickLatLng', 'flyNear', 'goToTier'],
    clickGoesThere: true,
    singleTapDive: 'SPACENET global→national→regional→city',
    doubleTapZoomOut: true,
    noClickPulseRings: true,
    cityZoomUsesFocusNotHomeOnly: true,
    cityTasks: ['pizza/food→driver', 'job/barman→work offer', 'date→dating request'],
    surfaceMap: {
      engine: 'Leaflet (lazy)',
      layers: ['bright:carto-voyager', 'dark:carto-dark', 'satellite:esri-world-imagery'],
      control: '#sn-map-layers',
      cli: 'map dark|bright|satellite',
      file: 'js/spacenet/map.js',
    },
    cliSurface: {
      law: 'CLI is text log + typed input only (owner 2026-07-30)',
      forbidden: ['ribbon button bar in dock', 'feed chip tiles', 'menu/cart/order ribbon keys'],
      tools: 'burger under radar · home menu · money HUD · map multi-tile · typed commands',
      history: 'scroll + / or ? search',
    },
    aiLaw: {
      name: 'Astranov',
      listen: 'ASTRANOV LISTENING',
      freeMind: 'SNFreeMind free-first · hard intents · no junk fuzzy',
      controlApp: true,
    },
    sim33: 'DELETED',
    trainingSurface: 'DELETED',
    taskBoard: 'SNTaskBoard · blue price · map routes · no sim/train',
    platformFee: '3% every order gross in S → vault',
    burgerUnderRadar: 'sn-burger-btn under #field-radar · secondary menus · not finance',
    placeTool: {
      via: 'burger / typed CLI · topo.js',
      menu: ['pin', 'targets', 'video', 'vendor', 'social', 'emergency'],
    },




    nationalLayer: {
      borders: 'glowing blue LineSegments (NE 110m)',
      cities: 'major city additive Points',
      dayNight: 'subsolar shader + night lights',
      localTime: '#sn-national-hud',
    },
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

  marketplace: {
    alwaysOn: true,
    hours: '24/7',
    days: 365,
    allLocations: true,
    noPlatformCurfew: true,
    vendorHoursInformationalOnly: true,
    feesInS: true,
    path: 'target → browse → cart → place → track → claim → pilot',
    code: ['commerce.js', 'profiles.js', 'tile.js', 'tasks.js', 'map.js'],
    sectorFill: 'ensureSector',
  },

  stack: {
    entry: 'index.html → boot.js',
    modules: [
      'config', 'brain', 'globe', 'cosmos', 'tasks', 'profiles', 'currency',
      'field', 'commerce', 'spatial', 'usage', 'market', 'cli', 'ai', 'ui', 'tile', 'map', 'search', 'auth',
    ],
    doNotLoad: [
      'astranov-app.js', 'astranov-deferred.js', 'phase-*.js',
      'wallet.js', 'radar.js', 'resources.js', 'ribbon.js',
    ],
  },

  surface: [
    'radar', 'home-button', 'miner-S-and-S-per-day', 'cli-top-ribbon-buttons',
    'cli', 'global-earth', 'multi-body-cosmos', 'astranov-ai-presence', 'zero-dummy',
  ],
  chromeLaw: {
    onScreenOnly: ['radar', 'home-Astranov-SpaceNet', 'miner'],
    minerShows: ['S balance', 'S/day mining rate'],
    homeMenu: {
      file: 'js/spacenet/home.js',
      items: [
        'version', 'local-time', 'athens-time', 'user-info', 'login',
        'earth-global', 'reload', 'hard-reset',
        'role-vendor', 'role-driver', 'role-ambassador',
      ],
    },
    ambassador: { supportEarnsS: true, meshBoost: true, unit: 'S' },
    cliRibbonPermanent: ['locate', 'user', 'add', 'handsfree-SpaceNet', 'send'],
    cliRibbonAlwaysVisible: true,
    cliFormFixed: ['input', 'expand'],
    noFloatingEdge: true,
  },

  agentDiscipline: {
    alwaysUpdateSpecs: true,
    verifyBeforeShip: true,
    spartanFirst: true,
    noOverlappingChrome: true,
    noLowFiCompanion: true,
    defaultFullGlobalEarth: true,
    dedummyfyEveryGlobe: true,
    zeroDummyAbsolute: true,
  },

  radarSpeed: {
    solar: { kmh: 107208, label: 'Earth through space (orbit)' },
    globalNational: { kmh: 1671, label: 'Earth surface rotation equator' },
    cityMap: { kmh: 5, label: 'Walking on Earth surface' },
    cityTier: { kmh: 50, label: 'Driving urban Earth surface' },
    captionEl: '#field-radar-caption #fsh-explain',
  },

  firstLoop: {
    coach: 'SNMarket + SNAi',
    path: 'list shop → menu add → order me → drive on → deliver me',
    auto: 'first delivery',
    zeroNpc: true,
  },

  usageShip: {
    module: 'js/spacenet/usage.js',
    timezone: 'Europe/Athens',
    cadence: 'one fix per midnight',
    cli: ['usage', 'usage export', 'handoff'],
    workflow: '.grok/workflows/midnight-greek-ship.rhai',
    schedule: 'scripts/schedule-midnight-athens.ps1',
  },

  verify: [
    'GLOBAL Earth in space (full sphere) · city closed',
    'splash ASTRANOV + horizontal blue loader',
    'home ASTRANOV only',
    'CLI text-only · no ribbon/chip buttons',
    'multi-tile on map only',
    'AI = Astranov · ASTRANOV LISTENING',
    'Google login astranov.eu not supabase project host',
    'first delivery on shell',
    'donate on mesh SETI-style',
    'zero dummy · no training sim',
    'false ship → email owner + ESCALATION file',
  ],
};

window.AstranovContinuity = AstranovContinuity;
