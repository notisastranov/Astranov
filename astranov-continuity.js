/** Astranov / SpaceNet continuity — machine contract. SPECS.md is sole law. */
const AstranovContinuity = {
  version: '20260731010000-grok-cli-look',
  updated: '2026-07-31',
  live: 'https://astranov.eu',
  repo: 'notisastranov/astranov.eu',
  ownerEmail: 'notisastranov@gmail.com',
  specs: 'SPECS.md',
  legacySpecs: 'support/SPECS-LEGACY-before-rebuild-20260730.md',

  /** Naming: SpaceNet = system/grid; Astranov = AI + public face ASTRANOV */
  naming: {
    system: 'SpaceNet',
    systemRole: 'internal OS + pilot fly grid + module path /js/spacenet/* + currency S/SpaceNets',
    grid: 'SPACENET (window.SPACENET)',
    publicBrand: 'ASTRANOV',
    domain: 'astranov.eu',
    ai: 'Astranov',
    aiListen: 'ASTRANOV LISTENING',
    currency: 'S / SpaceNets',
    forbiddenAiNames: ['SpaceNet', 'Grok', 'ChatGPT'],
  },

  p0: 'spartan-coding',
  p0d: 'zero-dummy-absolute',
  shipGate: 'live path green OR honest not-verified; push alone is not ship',
  neverMakeOwnerRestateSpecs: true,
  emailSupportOnFalseShip: true,

  ownerVerified: {
    '2026-07-30': [
      'OV-01 GLOBAL Earth in space boot',
      'OV-02 no training sim / Rodos default',
      'OV-03 no map-corner Layers under money HUD',
      'OV-04 CLI text only · multi-tile on map',
      'OV-05 home ASTRANOV only',
      'OV-06 AI = Astranov',
      'OV-07 no junk free-mind',
      'OV-08 auth astranov.eu not supabase project face',
      'OV-09 splash ASTRANOV + horizontal blue loader',
      'OV-10 polar axis spin',
      'OV-11 first delivery · donate on',
      'OV-12 false ship → email + escalation',
      'OV-13 naming SpaceNet system / Astranov AI',
      'OV-14 SPECS thin rebuild',
    ],
  },

  spacenet: {
    name: 'SPACENET',
    role: 'pilot fly grid net (internal SpaceNet system)',
    file: 'js/spacenet/spacenet-grid.js',
    global: 'window.SPACENET',
    path: 'GLOBAL → NATIONAL → REGIONAL → CITY',
    boot: 'GLOBAL Earth in space · city closed',
    singleTap: 'deeper same place; new place → GLOBAL',
    doubleTap: 'out toward SOLAR',
    drag: 'Y polar spin · X tilt · no Z clock',
  },

  surface: {
    chrome: ['radar', 'ASTRANOV home', 'miner S HUD'],
    cli: 'text log + input only',
    cliForbidden: ['ribbon button bar', 'feed chip tiles'],
    tools: 'burger · home · money HUD · map multi-tile · typed CLI',
    multiTile: 'map overlay only',
    finance: 'money HUD only',
  },

  ai: {
    name: 'Astranov',
    listen: 'ASTRANOV LISTENING',
    freeFirst: true,
    controlApp: true,
    noJunkFuzzy: true,
  },

  auth: {
    face: 'astranov.eu / ASTRANOV',
    ban: '*.supabase.co as product identity',
    preferred: 'Google GIS + signInWithIdToken',
    customDomain: 'api.astranov.eu when live',
  },

  economy: {
    primary: 'S / SpaceNets',
    platformFee: '3% gross every order → vault',
    driverCut: '15% gross',
    meshDonate: 'SETI-style donate on → spare capacity → S',
  },

  firstLoop: {
    auto: 'first delivery',
    path: 'list shop → menu add → order me → drive on → deliver me',
    module: 'js/spacenet/market.js',
    onShellBoot: true,
  },

  ban: [
    'training-sim',
    'sim-task-train',
    'rodos-training-default',
    'cli-ribbon-button-flood',
    'cli-feed-chip-tiles',
    'ai-brand-spacenet',
    'dummy-npc-seeds',
    'marketplace-curfew',
  ],

  zeroDummy: {
    sectorFill: 'SNCommerce.ensureSector (db → edge → overpass → crawl)',
    emptySector: 'honest empty + long-press create or fly',
  },

  verify: [
    'Naming: SpaceNet=system/grid · AI=Astranov · face=ASTRANOV',
    'Boot GLOBAL Earth in space · city closed',
    'Splash ASTRANOV + horizontal blue loader',
    'CLI text-only',
    'Multi-tile on map only',
    'ASTRANOV LISTENING',
    'Auth face astranov.eu not supabase project',
    'first delivery works',
    'donate on mesh',
    'false ship → email + ESCALATION',
  ],
};

window.AstranovContinuity = AstranovContinuity;
