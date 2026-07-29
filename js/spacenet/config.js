/* SpaceNet public config — anon key is designed for client use */
(function (g) {
  'use strict';
  /**
   * Auth branding law: users sign in to Astranov SpaceNet / astranov.eu —
   * never present raw project-ref.supabase.co as the product name.
   * Google consent screen is configured in Google Cloud (app name + domain).
   * For the OAuth host itself to be astranov.eu, enable Supabase Custom Domain
   * and set sbUrl below to that host (e.g. https://api.astranov.eu).
   */
  g.SN_CONFIG = {
    build: (document.querySelector('meta[name="astranov-build"]') || {}).content || '0',
    sbUrl: 'https://lkoatrkhuigdolnjsbie.supabase.co',
    sbKey:
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxrb2F0cmtodWlnZG9sbmpzYmllIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg4ODIwOTIsImV4cCI6MjA5NDQ1ODA5Mn0.qf6Kg93YLJ0coTdVQa4baU0ppOdFY5WkmVzMvEV6ejI',
    live: 'https://astranov.eu',
    brand: {
      name: 'Astranov SpaceNet',
      domain: 'astranov.eu',
      site: 'https://astranov.eu',
      privacy: 'https://astranov.eu/privacy.html',
      terms: 'https://astranov.eu/terms.html',
      architect: 'Astranov',
      ai: 'SpaceNet',
      // When Supabase Custom Domain is live, set sbUrl to e.g. https://api.astranov.eu
      // so Google OAuth shows your host, not xxxx.supabase.co
    },
    /** Optional map layer keys — free layers work without these */
    layers: {
      // googleTiles: 'https://… licensed Google/Map Tiles API template with {x}{y}{z}',
      // w3wKey: 'your-what3words-api-key',
    },
  };
  g.SB_URL = g.SN_CONFIG.sbUrl;
  g.SB_KEY = g.SN_CONFIG.sbKey;
})(window);
