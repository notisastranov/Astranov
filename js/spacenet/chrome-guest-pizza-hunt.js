/**
 * Guest pizza hunt — Build 20260822140000-pulse-ready
 * PATCH #127 only · keep PASS · fix pulse readiness + face Rhodes cluster.
 *
 * PASS (do not regress):
 *   pizza over South America → Origin · camera · -32.946, -61.777
 *   / No delivery shops near view · type Locate once
 *   No Kalithea 36.388 list. No Google wall.
 *
 * FIX this build:
 *   After listing shops, WAIT until SNGlobe is actually ready (ready / earth / pulse).
 *   Poll ~2s and retry pulse. Never treat "list only (globe not ready)" as happy path
 *   when SNGlobe exists — call init + wait + retry.
 *   show rhodes AND Rhodes-camera pizza MUST face pin cluster (goToPlace 36.44,28.22).
 *   Pulse each vendor via SNGlobe.pulse (long-lived) · consumeClick → Shop · name · km · ⭐
 *
 * FAIL guards (keep):
 *   never SNMap.open / showLiveSat / Leaflet during the hunt — WebGL globe only.
 *   YOU only from explicit GPS grant this session; else camera.
 *   no plaza/POI crawler dump; no grey glyphs on empty SA; Google only at pay.
 *
 * Product law: if it is not on the globe it is not shipped.
 */
(function (G) {
  'use strict';
  G.__snGuestPizzaHunt0822 = 1;
  var BUILD = '20260822140000-pulse-ready';
