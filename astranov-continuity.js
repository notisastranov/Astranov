/**
 * =============================================================================
 * ASTRANOV AI CONTINUITY MANIFEST — single source of truth for features
 * =============================================================================
 *
 * PURPOSE
 *   Machine- and human-readable contract for what the live app MUST keep doing.
 *   New AI tools: read this file FIRST → window.AstranovContinuity
 *   Human mirror: ASTRANOV_SPECS.md (same content, markdown)
 *   Do not rip out patches listed under `doNotRemove`.
 *
 * LIVE
 *   Site: https://astranov.eu
 *   Repo: github.com/notisastranov/astranov.eu
 *   Local path: C:\Users\N\Documents\GitHub\Astranov
 *   Build stamp: meta[name="astranov-build"] in index.html (must match ?v= on scripts)
 *
 * DEPLOY (owner machine — run yourself, never ask user to run)
 *   1. node scripts/guard-base.mjs
 *   2. node scripts/owner-push.mjs <files> --message=...
 *   Node (Windows): Codex node.exe if `node` not on PATH
 *
 * SCRIPT LOAD ORDER (index.html — order matters)
 *   three.js (cdnjs + onerror jsdelivr) → supabase →
 *   astranov-app.js → astranov-perf-lazy.js → astranov-continuity.js →
 *   galactic-sky.js → field-hud.js → mpp-tile.js
 *
 * BUNDLE SPLIT
 *   astranov-app.js      Globe, SuperCli, LazyModules, MarketplaceDeliveryEngine, boot
 *   astranov-deferred.js Commerce, MapComms, CodersHub, CityMap, BrainNeurons, DeliveryPricing full
 *   astranov-perf-lazy.js Defer 574KB pack until idle / user tap; brain dedup; mobile DPR
 *   astranov-field-hud.js Top-right field, radar, speed, miner rig (field tap)
 *   astranov-mpp-tile.js  Multi-tile menu (+), locate, video, marketplace, pilot
 *   astranov-galactic-sky.js Sky layer
 *
 * PROGRESS LOCKED IN THIS FILE (do not lose in chat compaction)
 *   20260711 — MPP social tile, locate pin, video left of +, marketplace, field-miner
 *   20260711 — perf-lazy, field-tap miner (no CLI ⛏ strip), continuity replaces old handoffs
 *   20260712 — boot-rescue (THREE guard), perf-turbo (adaptive FPS), delivery-finish
 *   20260712 — spacenet-multi: brand, multi-rail, pilot multi-stop, 3%+15%, party confirms
 *   20260712 — launch-audit: SpaceNetCities national hubs; CLI bridge; ASTRANOV_LAUNCH_AUDIT.md
 *
 * =============================================================================
 */
const AstranovContinuity = {
  version: '20260712070000-launch-audit',
  updated: '2026-07-14',
  live: 'https://astranov.eu',
  repo: 'notisastranov/astranov.eu',

  /**
   * Markdown / issues / sessions that MUST NOT drive implementation alone.
   */
  supersededDocs: {
    authoritative: [
      'astranov-continuity.js (this file — window.AstranovContinuity)',
      'ASTRANOV_SPECS.md (human-readable mirror of this file)',
      'CLAUDE.md (agent entry + deploy)',
      'ASTRANOV_SPACENET_MISSION.md (vision only — no feature checklist)',
    ],
    deprecatedStubs: ['ASTRANOV_GROK_SPECS.md'],
    deleted: ['ASTRANOV_GROK_FULL_HANDOVER.md', 'index.restored.html'],
    notAuthoritative: [
      'Grok/Cursor/Claude session transcripts and compaction summaries',
      'GitHub issues #97 #99 old P0 handoff checklists',
      'scripts/patch-trackball-cli.mjs build pins (historical)',
      'Chat-recycled “triangle of truth” (MISSION + GROK_SPECS + CLAUDE)',
    ],
    outdatedRules: [
      'index.html only — no new files',
      'astranov-grok.html as primary source',
      'miner-cli-strip / #aci-miner above CLI',
      '+ opens globe-super-add only',
      'LazyModules.ensure() at 400ms on boot',
      'Top-center button is bare “Astranov” or a CLI control',
      'Platform fee freeform — must stay 3%; vendor→driver gross 15%',
    ],
  },

  deploy: {
    guard: 'scripts/guard-base.mjs',
    push: 'scripts/owner-push.mjs',
    rules: [
      'Bump meta astranov-build and every script ?v= together on each deploy',
      'Bump astranov-continuity version + ASTRANOV_SPECS.md when features change',
      'Run guard-base before every push',
      'index.html must stay >80KB (guard rejects bootstrap stubs)',
      'Do not reintroduce astranov-gl.js split boot or simulateACI',
      'sw.js cache version bump when shipping shell/script changes',
    ],
  },

  /**
   * Product economics — locked business rules
   */
  economics: {
    platformCommission: {
      rate: 0.03,
      label: '3% on all transactions (goods + delivery)',
      code: 'DeliveryPricing.PLATFORM_RATE',
      files: ['astranov-deferred.js', 'astranov-app.js (stub)'],
    },
    vendorToDriver: {
      rate: 0.15,
      label: 'Vendor pays driver 15% of gross goods instantly',
      code: 'DeliveryPricing.DRIVER_GROSS_RATE → driver_from_vendor_eur',
      note: 'driver_payout_eur may also include portion of delivery fee; gross share is 15% of subtotal_eur',
    },
    confirms: {
      parties: ['client', 'vendor', 'driver'],
      ui: '#drh-confirms',
      storage: 'localStorage astranov:delivery-confirm:<missionId>',
      method: 'MarketplaceDeliveryEngine.confirmParty',
    },
  },

  /**
   * Features the product owner demanded — all must keep working.
   */
  features: {
    spacenetBrand: {
      summary: 'Top-center button = Astranov SpaceNet (hard reset only — NOT a CLI button)',
      owner: 'index.html #astranov-logo + SuperCli ACL_TITLE + GlobeDeck title',
      selectors: ['#astranov-logo', '.astranov-logo-label', '#globe-deck-title'],
      behavior: [
        'Label text: Astranov SpaceNet',
        'Click: AstranovLogo.hardReset (cache clear + reload) — not open CLI',
        'ACL_TITLE / SuperCli.title / deck title: Astranov SpaceNet',
        'Mic/AI waveform overlay on logo still works (red=mic, green=AI)',
      ],
      doNotRemove: ['#astranov-logo', 'AstranovLogo.init', 'ACL_TITLE'],
    },

    superAddPlus: {
      summary: 'Edge + opens multi-tile SpaceNet menu (MenuProfilePostTile), NOT small globe-super-add deck',
      owner: 'astranov-mpp-tile.js',
      selectors: ['#super-add-fab', '#menu-profile-post-tile', '#mpp-multi-rail'],
      behavior: [
        'capture-phase click on #super-add-fab with stopImmediatePropagation',
        'Edge + only — NO + or send buttons beside the CLI text field',
        'Multi rail hub tiles: Data · Social · Vendors · Order · Pilot',
        'Created multi-tiles: deep-blue glowing round rich-media previews (#mpp-multi-created)',
        'localStorage astranov:multi-tiles',
        'SuperAdd.open/showPanel patched → MenuProfilePostTile unless opts.camera/media',
        'SuperCli.run(add|post|superadd) → openPlusField',
        'globe-super-add deck closed via _closeSuperAddDeck before open',
      ],
      doNotRemove: [
        '_bindPlusFab', '_bindMultiRail', '_patchSuperAdd',
        'MenuProfilePostTile.openPlusField', 'createMultiTile', 'renderMultiCreated',
      ],
    },

    cliInputFieldOnly: {
      summary: 'CLI input row is one seamless field — no buttons beside the textarea',
      owner: 'index.html #globe-deck-input-row + SuperCli + AciCli',
      selectors: ['#aci-cli-in', '#aci-cli-form', '#globe-deck-input-row'],
      behavior: [
        'NO #globe-deck-plus or #globe-deck-send next to input (hidden if residual DOM)',
        'Send via Enter / form submit → AciCli.submitFromInput',
        'Input spans full width; borderless seamless into deck (one with CLI)',
        'SuperCli.INPUT_BTNS is empty array',
        'Multi-tile + stays on edge bar #super-add-fab only',
      ],
      doNotRemove: ['#aci-cli-in', 'AciCli submitFromInput / Enter key handlers'],
      doNotAdd: ['buttons next to #aci-cli-in', 'visible globe-deck-send beside field'],
    },

    menuProfilePostTile: {
      summary: 'Multi-tile SpaceNet field: cover, avatar, roles, social video, vendors, pilot, market',
      owner: 'astranov-mpp-tile.js',
      selectors: [
        '#menu-profile-post-tile', '#mpp-roles', '#mpp-section-market',
        '#mpp-section-pilot', '#mpp-multi-rail', '#mpp-multi-created',
      ],
      roles: ['client', 'vendor', 'driver', 'pilot', 'user', 'social'],
      sections: {
        multiRail: '#mpp-multi-rail — round deep-blue glowing hub + created multi-tiles',
        market: '#mpp-section-market — client OR vendor OR pilot',
        vendor: '#mpp-section-vendor — nearby shops, list shop',
        pilot: '#mpp-section-pilot — multi-stop schedule · start routing · save multi-tile',
        driver: '#mpp-section-driver — online, schedule, base, open jobs',
        user: '#mpp-section-user — profile site, delivery address',
        social: '#mpp-section-social — caption, photo/video, post now',
        connected: '#mpp-connected — tap user → MapComms.contactUser video',
      },
      actions: {
        browse_shops: 'Commerce.showPicker',
        place_cart: 'set delivery pin → Commerce.placeCart (sign-in)',
        track_delivery: 'loadMyActive + showHud',
        set_delivery: 'MapPins.setClientDelivery',
        post_lust: 'FieldBrain pulse + globe marker',
        pilot_build: 'MarketplaceDeliveryEngine.pilotBuildSchedule',
        pilot_start: 'MarketplaceDeliveryEngine.pilotStartRouting + createMultiTile',
        create_multi_tile: 'MenuProfilePostTile.createMultiTile (glowing preview)',
        driver_jobs: 'FieldBrain.listOpenJobs',
        claim_job: 'FieldBrain.claimDelivery',
      },
      mapPick: 'GlobeNavigate.handlePlaceClick patched — consumeMapPick when pin-pick active',
    },

    locateMe: {
      summary: 'Locate me must GPS → city map (CityLife.locateAndDropIn)',
      owner: 'astranov-mpp-tile.js (_patchLocate) + index.html CSS',
      selectors: ['#aci-locate', '#app-shortcut-row'],
      behavior: [
        '#aci-locate pinned into #app-shortcut-row with class app-shortcut-btn',
        'CSS: #super-cli-bar #aci-locate.app-shortcut-btn { display:inline-flex !important }',
        'CSS: hide bar buttons EXCEPT login, video-call, +, handsfree, avc, .app-shortcut-btn',
        'Click: CityLife.locateAndDropIn(); fallback enterCityView(36.44, 28.22) Rhodes demo',
        'GlobeControl.engageFollow(locate) on success path',
      ],
      doNotRemove: ['_patchLocate', 'AppShortcuts._pinInsideButtons wrap in mpp-tile'],
    },

    videoCall: {
      summary: 'Video call button left of + in CLI edge bar',
      owner: 'astranov-mpp-tile.js',
      selectors: ['#aci-video-call', '#super-cli-edge-right', '#super-add-fab'],
      behavior: [
        '_patchCliBar: SuperCli.ensureBarLayout inserts #aci-video-call BEFORE #super-add-fab',
        'CSS forces #aci-video-call display:inline-flex !important',
        'Click: open MPP tile, refreshConnected; if 1 peer → MapComms.contactUser(uid, video)',
        'Else scroll #mpp-connected and prompt tap-to-call',
      ],
      doNotRemove: ['_patchVideoCall', '_patchCliBar', '_openVideoCall'],
    },

    deliveryMarketplace: {
      summary: 'browse → cart → pay AVC → track → driver claim → pilot multi-stop · 3% + 15%',
      owner: 'astranov-mpp-tile.js + astranov-deferred.js (Commerce) + app MarketplaceDeliveryEngine',
      selectors: [
        '#mpp-section-market', '#mpp-market-summary', '#mpp-driver-jobs', '#mpp-section-pilot',
        '#delivery-route-hud', '#drh-fees', '#drh-confirms', '#vendor-menu',
      ],
      flow: [
        'set_delivery / pin → MapPins.setClientDelivery → window._clientDelivery',
        'browse_shops → Commerce.showPicker → open vendor → cart items',
        'place_cart → Commerce.placeCart (uses _clientDelivery) → order-intake',
        'onOrderPlaced → MarketplaceDeliveryEngine triangle + OrderTracking',
        'track_delivery → loadMyActive + showHud #delivery-route-hud',
        'driver_jobs → FieldBrain.listOpenJobs → claim_job → FieldBrain.claimDelivery',
        'driver HUD: accept → pickup → en_route → delivered via order-intake status_update',
        'pilot_build → pilotBuildSchedule (state · distance · priority)',
        'pilot_start → pilotStartRouting multi-stop polygon + HUD',
        'All parties confirm on #drh-confirms before settlement messaging',
      ],
      behavior: [
        'refreshMarketplace: pin, shop, cart, quote total AVC, active order status',
        'Client foot: Place order when cart has items else Set delivery',
        'place_cart after success: loadMyActive + showHud',
        'track_delivery loads customer/driver open orders from Supabase',
        'Commerce.placeCart passes deliveryLat/Lng from _clientDelivery',
        'MarketplaceDeliveryEngine.loadMyActive fetches customer_id + driver_id open orders',
        'Platform commission 3% (DeliveryPricing.PLATFORM_RATE)',
        'Vendor pays driver 15% of gross goods instantly (DRIVER_GROSS_RATE)',
        'HUD #drh-fees shows platform + driver-from-vendor amounts',
        'Realtime all-party confirms: client · vendor · driver',
        'Pilot schedule scoring: stateW + priority*15 - dist*2; sorted high score first',
      ],
      doNotRemove: [
        'refreshMarketplace', 'place_cart', 'track_delivery', 'driver_jobs', 'claim_job',
        'pilot_build', 'pilot_start', 'create_multi_tile',
        'MarketplaceDeliveryEngine.loadMyActive', 'pilotBuildSchedule', 'pilotStartRouting',
        'confirmParty', '_renderConfirms',
        'Commerce.placeCart', 'DeliveryPricing.PLATFORM_RATE', 'DeliveryPricing.DRIVER_GROSS_RATE',
      ],
    },

    pilotMultiStop: {
      summary: 'Pilot owns multi-stop delivery routing schedule',
      owner: 'astranov-app.js MarketplaceDeliveryEngine + mpp-tile pilot section',
      selectors: ['#mpp-section-pilot', '#mpp-pilot-schedule', 'role pilot'],
      behavior: [
        'Role chip pilot toggles #mpp-section-pilot',
        'pilotBuildSchedule: load open missions, score by status weight + priority - distance',
        'pilotStartRouting: single multi-stop mission polygon, renderMission + showHud',
        'create_multi_tile saves glowing deep-blue round preview of pilot route',
        'TelemachosPilot may still escort drones; commercial multi-stop is MarketplaceDeliveryEngine',
      ],
      doNotRemove: ['pilotBuildSchedule', 'pilotStartRouting', 'pilot_build', 'pilot_start'],
    },

    minerRig: {
      summary: 'SpaceNet miner — NO separate CLI miner button; tap top-right field',
      owner: 'astranov-field-hud.js',
      selectors: ['#field-balance-hud', '#miner-rig-panel', '#fbh-mine-rate'],
      removed: ['#miner-cli-strip', '#aci-miner', '#aci-miner-rate — DO NOT ADD BACK'],
      behavior: [
        '#field-balance-hud top-right: AVC, fiat, peers, CPU/RAM/SSD/NET, mine rate',
        'Click or Enter/Space on field → openMinerPanel (#miner-rig-panel)',
        'Toggles: cpu, ram, storage, bandwidth, sleep — localStorage astranov:miner-rig-prefs',
        'SpaceNetMiner.computeRate + canAcceptWork respect prefs',
        'class mining-active on field when terms ok and rate > 0.003',
        'bindFieldMiner (not bindMinerCli / aci-miner)',
      ],
      doNotRemove: ['bindFieldMiner', 'openMinerPanel', 'SpaceNetMiner in field-hud.js'],
    },

    fieldHudRadar: {
      summary: 'Left radar scan + center speed (earth 1671 km/h, drive, city)',
      owner: 'astranov-field-hud.js',
      selectors: ['#field-radar', '#field-radar-canvas', '#field-radar-speed', '#fsh-mode'],
      behavior: [
        'Radar via setInterval 125ms (~8fps draw) — no requestAnimationFrame loop for field',
        'Earth spin: EarthRealism.tick in animate(); speed HUD shows EARTH_ROTATION_KMH 1671',
        'FieldHud.boot on DOMContentLoaded; ensureBrain delayed 2.8s',
        'drawRadar: no shadowBlur, 8 trail steps; pauses when hidden or city map',
      ],
    },

    perfLazyBoot: {
      summary: 'App must feel fast — adaptive render + defer 574KB pack',
      owner: 'astranov-perf-lazy.js + astranov-app.js boot/animate',
      behavior: [
        'NO setTimeout(LazyModules.ensure, 400) on boot',
        'Boot: single LazyModules.whenReady batch; heavy inits requestIdleCallback',
        'Scenario runner only if ?boottest=1',
        'perf-lazy: ensure delayed until SlumberManager.deferredDelay OR _lazyUserReady',
        'First user tap sets _lazyUserReady → immediate ensure',
        'LazyModules.schedule waits for tap or long timeout (mobile 5s+)',
        'BrainNeurons.boot deduped; ensureBrain 2.8s after FieldHud.boot',
        'CRITICAL: never force window._globePerfLite=false after mobile detect',
        'animate: adaptive targetFps (~10–45); skip idle frames; no subsystem work when not due',
        'WebGL: antialias off, alpha off, low-power, no ACES tone mapping, earth 12x12, 36 stars',
        'Mobile tier forced conserve/slumber; DPR ≤0.7 touch / ≤1 desktop',
        'Radar setInterval 250ms; pause when idle 45s; logo RAF stops when voice idle',
        'THREE/WebGL guarded — CLI boots if globe fails; host gate first',
        'three.js: cdnjs + onerror jsdelivr fallback',
        'sw.js network-first for all /astranov-*.js',
        'mpp-tile: no loadHudModules duplicate script injection',
      ],
      doNotRemove: ['astranov-perf-lazy.js before field-hud', 'whenReady', 'scheduleBrain', '_globeTargetFps'],
    },

    aiBrain: {
      summary: 'AI brain must stay alive — BrainNeurons + FieldBrain',
      owner: 'astranov-field-hud.js (ensureBrain) + astranov-deferred.js',
      behavior: [
        'FieldHud.ensureBrain → scheduleBrain → EarthRealism.init + BrainNeurons.boot',
        'LazyModules loads deferred pack; DeferredBoot.run inits commerce, presence, etc.',
        'Do not stub BrainNeurons permanently in production app.js (stub only until deferred loads)',
      ],
    },

    cliBar: {
      summary: 'SuperCli edge bar — minimal; input row field-only; video left of edge +',
      owner: 'index.html CSS + SuperCli + mpp-tile _patchCliBar',
      visible: ['#aci-login', '#aci-video-call', '#super-add-fab', '#aci-handsfree', '.app-shortcut-btn'],
      inputRow: ['#aci-cli-in only — no adjacent buttons'],
      pinnedShortcuts: ['#aci-avc', '#aci-locate in #app-shortcut-row'],
      note: 'Top-center #astranov-logo is brand SpaceNet, not a CLI button',
    },

    globePhysics: {
      summary: 'Locked — do not change without explicit owner request',
      meta: 'astranov-globe-physics locked-v20260710241000-never-change',
      constants: ['GlobeNavigate.GLOBAL_Z 3.5', 'Earth rotation display 1671 km/h', 'syncGlobePivotQuaternion'],
    },

    nationalSpaceNetCities: {
      summary: 'National zoom shows active SpaceNet cities with live users + shops',
      owner: 'astranov-app.js SpaceNetCities + GlobeNavigate',
      selectors: ['#map-nav-chip', '#city-pick-chips', 'GlobeEntity type city_hub'],
      behavior: [
        'SpaceNetCities clusters window.others + vendors into cells (~0.55°)',
        'At national zoom: #map-nav-chip visible with city/user counts',
        'City chips: glowing sn-city buttons (users) + shop buttons',
        'GlobeEntity city_hub markers; tap → _enterCitySlow',
        'Presence _applyOthers calls SpaceNetCities.refresh when national',
      ],
      doNotRemove: ['SpaceNetCities', '_showCityChips sn-city', 'map-nav-chip.visible'],
    },

    cliDevBridge: {
      summary: 'Continue development with AI from in-app CLI',
      owner: 'astranov-app.js SpaceNetDevBridge + CodersHub + AciCoders',
      commands: ['bridge', 'devbridge', 'handoff', 'coders bridge', 'coders composer <task>'],
      storage: ['astranov:dev-bridge', 'astranov:job-continuation'],
      behavior: [
        'bridge saves continuity version + build + CLI tail + CodersHub job',
        'Prefills aci-cli-in with composer handoff line',
        'Coders Hub Save / Summon Composer for lab handoff',
        'Always read continuity + ASTRANOV_SPECS before edits',
      ],
      doNotRemove: ['SpaceNetDevBridge.open', 'CodersHub.saveJob', 'CONTINUATION_KEY'],
    },
  },

  /**
   * Build history (progress memory for new AIs — chat is not enough)
   */
  buildHistory: [
    { id: '20260711120000-social-profile', note: 'MPP tile, + hijack, social profile' },
    { id: '20260711140000-cli-market-miner', note: 'Locate, video, marketplace, miner CLI strip (later removed)' },
    { id: '20260711160000-perf-lazy', note: 'astranov-perf-lazy.js, deferred delay, radar throttle' },
    { id: '20260711180000-field-miner', note: 'Remove CLI miner; tap #field-balance-hud → miner panel' },
    { id: '20260711210000-spec-cleanup', note: 'astranov-continuity.js; stub old MD; close #99' },
    { id: '20260711220000-perf-rescue', note: 'Unified field RAF attempt (superseded by later turbo)' },
    { id: '20260711230000-load-hotfix', note: 'Immediate FieldHud boot after over-defer broke load' },
    { id: '20260712000000-boot-rescue', note: 'THREE/host guard; CLI survives WebGL fail; SW v41' },
    { id: '20260712010000-perf-turbo', note: 'Adaptive FPS, mobile conserve, lean globe, deferred boot chunks' },
    { id: '20260712020000-delivery-finish', note: 'loadMyActive, track sync, driver jobs, placeCart pin quote' },
    { id: '20260712030000-spacenet-multi', note: 'SpaceNet brand, multi-rail, pilot multi-stop, 3%+15%, confirms, +/send input row' },
    { id: '20260712040000-spec-lock', note: 'Full progress written into continuity + ASTRANOV_SPECS.md' },
    { id: '20260712050000-cli-field-only', note: 'CLI input seamless — no +/send beside field; Enter sends; + edge only' },
    { id: '20260712060000-perf-sticky-fix', note: 'Fix _globePerfLite wipe; no AA/tone map; lower FPS/DPR; radar 4fps; logo RAF idle stop' },
    { id: '20260712070000-launch-audit', note: 'SpaceNetCities national hubs; CLI bridge; full launch audit report' },
  ],

  /**
   * Regression checks after edits
   */
  verify: [
    'Hard refresh https://astranov.eu — meta astranov-build matches deploy',
    'Top-center button reads Astranov SpaceNet; click hard-resets (not CLI)',
    'CLI input is field-only (no buttons beside it); Enter sends',
    'Edge + opens multi-tile rail (Data/Social/Vendors/Order/Pilot); NOT globe-super-add only',
    '🎯 locate → city map or Rhodes fallback',
    '📹 left of edge + → connected users / video call',
    'Top-right field tap → miner rig (no ⛏ CLI strip)',
    'Marketplace: browse → cart → place_cart → track_delivery when signed in',
    'Delivery HUD shows platform 3% + driver 15% gross; party confirm buttons work',
    'Pilot role: build schedule + start multi-stop routing; multi-tile glow previews appear',
    'Globe renders; radar sweeps; earth speed ~1671 km/h on global view',
    'First load feels usable; deferred pack after idle/tap',
    'National zoom: map chip shows SpaceNet cities/users; city chips include sn-city hubs',
    'CLI: bridge saves job pack; coders composer continues from app',
  ],

  /**
   * Common mistakes that destroyed prior sessions
   */
  antiPatterns: [
    'Reverting + to SuperAdd.showPanel / globe-super-add only',
    'Putting + or send buttons beside the CLI textarea (breaks seamless CLI feel)',
    'Renaming top logo away from Astranov SpaceNet without owner request',
    'Hiding #aci-locate without app-shortcut-btn pin',
    'Adding #miner-cli-strip or #aci-miner back above CLI',
    'LazyModules.ensure() at 400ms or on every FieldHud tick',
    'Pushing index.html stub <80KB',
    'Editing astranov-globe-physics or trackball without owner sign-off',
    'Removing stopImmediatePropagation on + fab (small deck wins race)',
    'CodersHub _pingLabs on init (6 HEAD requests slow boot)',
    'Removing PLATFORM_RATE 0.03 or DRIVER_GROSS_RATE 0.15 without owner request',
    'Deleting pilot multi-stop or multi-tile rail as “cleanup”',
    'Implementing from ASTRANOV_GROK_SPECS.md or session transcripts instead of this file',
  ],

  /** Quick file → responsibility map */
  modules: {
    'index.html': 'Shell, Astranov SpaceNet logo, multi-rail DOM, pilot section, +/send input, delivery HUD confirms/fees, CLI CSS',
    'astranov-app.js': 'Globe, boot, SuperCli, SlumberManager, MarketplaceDeliveryEngine (pilot/loadMyActive/confirms), DeliveryPricing stub',
    'astranov-deferred.js': 'Commerce, DeliveryPricing full, MapComms, CodersHub, CityMap, BrainNeurons, DeferredBoot, OrderTracking',
    'astranov-perf-lazy.js': 'Defer pack, schedule gate, brain dedup, mobile DPR',
    'astranov-field-hud.js': 'field-balance-hud miner, radar setInterval, speed 1671, ensureBrain',
    'astranov-mpp-tile.js': 'Multi-tile menu, roles, pilot actions, marketplace, locate, video, + hijack',
    'astranov-continuity.js': 'THIS contract — AI must follow',
    'ASTRANOV_SPECS.md': 'Human-readable mirror of this contract',
    'CLAUDE.md': 'Agent entry + deploy',
    'ASTRANOV_SPACENET_MISSION.md': 'Vision only',
    'sw.js': 'Service worker network-first core assets',
    'scripts/guard-base.mjs': 'Pre-deploy gate',
    'scripts/owner-push.mjs': 'Silent owner git push',
  },
};

window.AstranovContinuity = AstranovContinuity;

if (typeof console !== 'undefined' && console.info) {
  console.info(
    '[AstranovContinuity]',
    AstranovContinuity.version,
    '— read window.AstranovContinuity + ASTRANOV_SPECS.md; features:',
    Object.keys(AstranovContinuity.features).join(', ')
  );
}
