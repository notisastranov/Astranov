/* Astranov SpaceNet — ALMIGHTY crawler
 * Find anything: maps · POIs · web · wiki · wikidata · code · products · media · weather · nations
 * Results paint globe + city map + vendor profile tiles. No single source is the whole mind.
 */
(function (global) {
  'use strict';

  const UA = 'AstranovSpaceNet/2.0 (https://astranov.eu; almighty-crawl)';
  const CACHE = new Map();
  const CACHE_MS = 10 * 60 * 1000;

  function cacheGet(k) {
    const hit = CACHE.get(k);
    if (!hit) return null;
    if (Date.now() - hit.t > CACHE_MS) {
      CACHE.delete(k);
      return null;
    }
    return hit.v;
  }

  function cacheSet(k, v) {
    CACHE.set(k, { t: Date.now(), v });
    if (CACHE.size > 80) {
      const first = CACHE.keys().next().value;
      CACHE.delete(first);
    }
  }

  async function fetchJson(url, opts) {
    const r = await fetch(url, {
      ...opts,
      headers: {
        Accept: 'application/json',
        ...(opts?.headers || {}),
      },
    });
    if (!r.ok) throw new Error('HTTP ' + r.status);
    return r.json();
  }

  async function raceOk(promises, limit) {
    const out = [];
    const settled = await Promise.allSettled(promises);
    for (const s of settled) {
      if (s.status === 'fulfilled' && s.value != null) {
        if (Array.isArray(s.value)) out.push(...s.value);
        else out.push(s.value);
      }
      if (limit && out.length >= limit) break;
    }
    return out;
  }

  // ─── GEO ─────────────────────────────────────────────
  async function geocodeNominatim(q) {
    const url =
      'https://nominatim.openstreetmap.org/search?format=json&limit=8&addressdetails=1&q=' +
      encodeURIComponent(q);
    const data = await fetchJson(url, { headers: { 'Accept-Language': 'en,el' } });
    return (data || []).map((d) => ({
      name: d.display_name,
      lat: parseFloat(d.lat),
      lng: parseFloat(d.lon),
      type: d.type,
      kind: d.class || d.type || 'place',
      source: 'nominatim',
      importance: d.importance,
    }));
  }

  async function geocodePhoton(q) {
    const url = 'https://photon.komoot.io/api/?limit=8&q=' + encodeURIComponent(q);
    const data = await fetchJson(url);
    return (data.features || []).map((f) => {
      const p = f.properties || {};
      const c = f.geometry?.coordinates || [];
      return {
        name: [p.name, p.city, p.country].filter(Boolean).join(', ') || p.name || q,
        lat: c[1],
        lng: c[0],
        type: p.osm_value || p.type,
        kind: p.osm_key || 'place',
        source: 'photon',
      };
    }).filter((x) => x.lat != null);
  }

  async function geocode(q) {
    const ck = 'geo:' + q;
    const hit = cacheGet(ck);
    if (hit) return hit;
    const parts = await Promise.allSettled([geocodeNominatim(q), geocodePhoton(q)]);
    const seen = new Set();
    const out = [];
    for (const p of parts) {
      if (p.status !== 'fulfilled') continue;
      for (const row of p.value || []) {
        const key = (row.lat?.toFixed?.(3) || '') + ',' + (row.lng?.toFixed?.(3) || '') + row.name?.slice(0, 24);
        if (seen.has(key)) continue;
        seen.add(key);
        out.push(row);
      }
    }
    cacheSet(ck, out);
    return out;
  }

  async function reverse(lat, lng) {
    try {
      const url =
        'https://nominatim.openstreetmap.org/reverse?format=json&lat=' + lat + '&lon=' + lng;
      const d = await fetchJson(url, { headers: { 'Accept-Language': 'en,el' } });
      return d?.display_name || lat.toFixed(4) + ', ' + lng.toFixed(4);
    } catch (_) {
      return lat.toFixed(4) + ', ' + lng.toFixed(4);
    }
  }

  // ─── OVERPASS POIs (broad intent → filter) ───────────
  function overpassFilter(q) {
    const s = String(q || '').toLowerCase();
    // Pizza first (must not lose to generic "restaurant" only)
    if (/pizza|πίτσα|πιτσα|pizzeria/.test(s))
      return (
        'node["amenity"~"restaurant|fast_food|cafe"]["cuisine"~"pizza",i];' +
        'node["amenity"="fast_food"]["name"~"pizza|πίτσα|Pizza",i];' +
        'node["amenity"~"restaurant|fast_food|cafe"];' +
        'way["amenity"~"restaurant|fast_food"]["cuisine"~"pizza",i]'
      );
    if (/restaurant|food|eat|dining|φαγητ|εστιατ/.test(s))
      return 'node["amenity"~"restaurant|cafe|fast_food|bar|biergarten|food_court"]';
    if (/cafe|coffee|καφ/.test(s)) return 'node["amenity"~"cafe|bar"]';
    if (/hotel|stay|sleep|ξενοδοχ/.test(s)) return 'node["tourism"~"hotel|guest_house|hostel|apartment"]';
    if (/shop|store|market|mall|αγορ/.test(s)) return 'node["shop"]';
    if (/pharmacy|φαρμακ|hospital|doctor|clinic|health/.test(s))
      return 'node["amenity"~"hospital|pharmacy|clinic|doctors|dentist"]';
    if (/gas|fuel|petrol|βενζιν/.test(s)) return 'node["amenity"="fuel"]';
    if (/bank|atm|τράπεζ/.test(s)) return 'node["amenity"~"bank|atm"]';
    if (/park|nature|beach|παραλί/.test(s)) return 'node["leisure"~"park|beach_resort|nature_reserve"]';
    if (/gym|fitness|sport/.test(s)) return 'node["leisure"~"fitness_centre|sports_centre"]';
    if (/job|work|office|company/.test(s)) return 'node["office"]';
    if (/school|university|education/.test(s)) return 'node["amenity"~"school|university|college|library"]';
    if (/museum|culture|art|theatre|cinema/.test(s))
      return 'node["tourism"~"museum|gallery|attraction"];node["amenity"~"theatre|cinema"]';
    if (/church|temple|mosque|religion/.test(s)) return 'node["amenity"~"place_of_worship"]';
    if (/parking|park car/.test(s)) return 'node["amenity"="parking"]';
    // Almighty default: anything named near you
    return 'node["name"]["amenity"];node["name"]["shop"];node["name"]["tourism"]';
  }

  const OVERPASS_MIRRORS = [
    'https://overpass-api.de/api/interpreter',
    'https://overpass.kumi.systems/api/interpreter',
    'https://overpass.private.coffee/api/interpreter',
  ];

  function mapOverpassElements(data) {
    return (data.elements || [])
      .map((el) => {
        const tags = el.tags || {};
        return {
          name: tags.name || tags.brand || tags['name:en'] || tags.amenity || tags.shop || 'place',
          lat: el.lat || el.center?.lat,
          lng: el.lon || el.center?.lon,
          kind: tags.amenity || tags.shop || tags.tourism || tags.leisure || 'poi',
          source: 'overpass',
          cuisine: tags.cuisine || '',
          phone: tags.phone || tags['contact:phone'] || tags['contact:mobile'] || '',
          website: tags.website || tags['contact:website'] || tags.url || '',
          hours: tags.opening_hours || '',
          email: tags.email || tags['contact:email'] || '',
          address: [tags['addr:street'], tags['addr:housenumber'], tags['addr:city']]
            .filter(Boolean)
            .join(' '),
          image: tags.image || tags.wikimedia_commons || '',
        };
      })
      .filter((p) => p.lat != null && p.name);
  }

  function haversineKm(a, b) {
    const R = 6371;
    const dLat = ((b.lat - a.lat) * Math.PI) / 180;
    const dLng = ((b.lng - a.lng) * Math.PI) / 180;
    const s =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((a.lat * Math.PI) / 180) *
        Math.cos((b.lat * Math.PI) / 180) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    return 2 * R * Math.asin(Math.min(1, Math.sqrt(s)));
  }

  async function nearbyOverpass(lat, lng, radiusM, query) {
    const r = radiusM || 2200;
    const filter = overpassFilter(query);
    const body =
      '[out:json][timeout:18];(' +
      filter
        .split(';')
        .filter(Boolean)
        .map((f) => f + '(around:' + r + ',' + lat + ',' + lng + ');')
        .join('') +
      ');out center 40;';
    const tryOne = async (url) => {
      const ctrl = typeof AbortController !== 'undefined' ? new AbortController() : null;
      const t = setTimeout(() => {
        try {
          ctrl && ctrl.abort();
        } catch (_) {}
      }, 7000);
      try {
        const data = await fetchJson(url, {
          method: 'POST',
          body,
          headers: { 'Content-Type': 'text/plain' },
          signal: ctrl ? ctrl.signal : undefined,
        });
        const rows = mapOverpassElements(data);
        if (!rows.length) throw new Error('empty');
        return rows;
      } finally {
        clearTimeout(t);
      }
    };
    try {
      if (typeof Promise.any === 'function') {
        return await Promise.any(OVERPASS_MIRRORS.map(tryOne));
      }
    } catch (_) {}
    for (let i = 0; i < OVERPASS_MIRRORS.length; i++) {
      try {
        const rows = await tryOne(OVERPASS_MIRRORS[i]);
        if (rows && rows.length) return rows;
      } catch (_) {}
    }
    return [];
  }

  async function nearbyPhoton(lat, lng, radiusM, query) {
    const q = /pizza|πίτσα|πιτσα|pizzeria/i.test(String(query || ''))
      ? 'pizza'
      : String(query || 'restaurant').split(/\s+/)[0] || 'restaurant';
    const url =
      'https://photon.komoot.io/api/?limit=20&lat=' +
      lat +
      '&lon=' +
      lng +
      '&q=' +
      encodeURIComponent(q);
    const data = await fetchJson(url);
    const maxKm = (radiusM || 6000) / 1000;
    return (data.features || [])
      .map((f) => {
        const p = f.properties || {};
        const c = f.geometry?.coordinates || [];
        return {
          name: p.name || p.street || q,
          lat: c[1],
          lng: c[0],
          kind: p.osm_value || p.osm_key || 'place',
          source: 'photon',
          cuisine: p.cuisine || '',
          city: p.city || '',
        };
      })
      .filter((row) => row.lat != null && row.name && haversineKm({ lat, lng }, row) <= maxKm + 0.4);
  }

  async function nearbyNominatim(lat, lng, radiusM, query) {
    const q = /pizza|πίτσα|πιτσα|pizzeria/i.test(String(query || ''))
      ? 'pizza'
      : String(query || 'restaurant').split(/\s+/)[0] || 'restaurant';
    const dLat = ((radiusM || 6000) / 1000) / 111;
    const dLng = dLat / Math.max(0.3, Math.cos((lat * Math.PI) / 180));
    const viewbox = [lng - dLng, lat + dLat, lng + dLng, lat - dLat].join(',');
    const url =
      'https://nominatim.openstreetmap.org/search?format=json&limit=20&bounded=1&addressdetails=0&q=' +
      encodeURIComponent(q) +
      '&viewbox=' +
      encodeURIComponent(viewbox);
    const data = await fetchJson(url, { headers: { 'Accept-Language': 'en,el' } });
    const maxKm = (radiusM || 6000) / 1000;
    return (data || [])
      .map((d) => ({
        name: d.display_name ? String(d.display_name).split(',')[0] : q,
        lat: parseFloat(d.lat),
        lng: parseFloat(d.lon),
        kind: d.type || d.class || 'place',
        source: 'nominatim',
      }))
      .filter((row) => row.lat != null && row.name && haversineKm({ lat, lng }, row) <= maxKm + 0.4);
  }

  async function nearby(lat, lng, radiusM, query) {
    const ck = 'near:' + Number(lat).toFixed(3) + ',' + Number(lng).toFixed(3) + ':' + (query || '');
    const hit = cacheGet(ck);
    if (hit) return hit;
    const firstNonEmpty = (promises, capMs) =>
      new Promise((resolve) => {
        let left = promises.length;
        let done = false;
        const t = setTimeout(() => {
          if (!done) {
            done = true;
            resolve([]);
          }
        }, capMs);
        promises.forEach((p) => {
          Promise.resolve(p)
            .then((rows) => {
              if (!done && rows && rows.length) {
                done = true;
                clearTimeout(t);
                resolve(rows);
              } else if (--left === 0 && !done) {
                done = true;
                clearTimeout(t);
                resolve([]);
              }
            })
            .catch(() => {
              if (--left === 0 && !done) {
                done = true;
                clearTimeout(t);
                resolve([]);
              }
            });
        });
      });
    let rows = [];
    try {
      rows = await firstNonEmpty(
        [
          nearbyOverpass(lat, lng, radiusM, query),
          nearbyPhoton(lat, lng, radiusM, query),
        ],
        7500
      );
    } catch (_) {
      rows = [];
    }
    if (!rows.length) {
      try {
        rows = await nearbyNominatim(lat, lng, radiusM, query);
      } catch (_) {
        rows = [];
      }
    }
    cacheSet(ck, rows);
    return rows;
  }

  /** Edge vendor-crawler (Supabase) — bulk POIs when available */
  async function edgeVendors(lat, lng, radius) {
    try {
      const cfg = global.SN_CONFIG || {};
      const url = (cfg.sbUrl || global.SB_URL) + '/functions/v1/vendor-crawler';
      const r = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: cfg.sbKey || global.SB_KEY,
          Authorization: 'Bearer ' + (cfg.sbKey || global.SB_KEY),
        },
        body: JSON.stringify({ lat, lng, radius: radius || 2500 }),
      });
      const j = await r.json().catch(() => ({}));
      return { ok: !!j.ok, count: j.count || 0, error: j.error };
    } catch (e) {
      return { ok: false, error: String(e.message || e) };
    }
  }

  // ─── KNOWLEDGE ───────────────────────────────────────
  async function webSearch(q) {
    const url =
      'https://api.duckduckgo.com/?q=' +
      encodeURIComponent(q) +
      '&format=json&no_html=1&skip_disambig=1';
    try {
      const d = await fetchJson(url);
      const out = [];
      if (d.AbstractText) {
        out.push({
          title: d.Heading || q,
          text: d.AbstractText,
          url: d.AbstractURL || '',
          source: 'ddg',
        });
      }
      if (d.Answer) out.push({ title: 'Answer', text: String(d.Answer), url: '', source: 'ddg' });
      if (d.Definition)
        out.push({ title: 'Definition', text: String(d.Definition), url: d.DefinitionURL || '', source: 'ddg' });
      (d.RelatedTopics || []).slice(0, 10).forEach((t) => {
        if (t.Text)
          out.push({ title: (t.Text || '').slice(0, 90), text: t.Text, url: t.FirstURL || '', source: 'ddg' });
        if (t.Topics) {
          t.Topics.slice(0, 4).forEach((x) => {
            if (x.Text)
              out.push({
                title: x.Text.slice(0, 90),
                text: x.Text,
                url: x.FirstURL || '',
                source: 'ddg',
              });
          });
        }
      });
      return out.slice(0, 14);
    } catch (_) {
      return [];
    }
  }

  async function wiki(q) {
    try {
      const url =
        'https://en.wikipedia.org/api/rest_v1/page/summary/' +
        encodeURIComponent(q.replace(/\s+/g, '_'));
      const d = await fetchJson(url);
      if (d.extract) {
        return {
          title: d.title,
          text: d.extract,
          url: d.content_urls?.desktop?.page || '',
          lat: d.coordinates?.lat,
          lng: d.coordinates?.lon,
          thumb: d.thumbnail?.source || '',
          source: 'wikipedia',
        };
      }
    } catch (_) {}
    return null;
  }

  async function wikiSearch(q) {
    try {
      const url =
        'https://en.wikipedia.org/w/api.php?action=opensearch&limit=8&namespace=0&format=json&origin=*&search=' +
        encodeURIComponent(q);
      const d = await fetchJson(url);
      const titles = d[1] || [];
      const descs = d[2] || [];
      const urls = d[3] || [];
      return titles.map((t, i) => ({
        title: t,
        text: descs[i] || t,
        url: urls[i] || '',
        source: 'wiki-search',
      }));
    } catch (_) {
      return [];
    }
  }

  async function wikidata(q) {
    try {
      const url =
        'https://www.wikidata.org/w/api.php?action=wbsearchentities&search=' +
        encodeURIComponent(q) +
        '&language=en&limit=6&format=json&origin=*';
      const d = await fetchJson(url);
      return (d.search || []).map((s) => ({
        title: s.label,
        text: s.description || s.label,
        url: 'https://www.wikidata.org/wiki/' + s.id,
        id: s.id,
        source: 'wikidata',
      }));
    } catch (_) {
      return [];
    }
  }

  // ─── CODE (GitHub + npm — find anything code) ───────
  async function codeSearch(q) {
    const out = [];
    try {
      const gh =
        'https://api.github.com/search/repositories?q=' +
        encodeURIComponent(q) +
        '&per_page=6&sort=stars';
      const d = await fetchJson(gh, { headers: { Accept: 'application/vnd.github+json' } });
      (d.items || []).forEach((r) => {
        out.push({
          title: r.full_name,
          text: (r.description || '') + ' ★' + (r.stargazers_count || 0),
          url: r.html_url,
          source: 'github',
          kind: 'repo',
          lang: r.language,
        });
      });
    } catch (_) {}
    try {
      const npm =
        'https://registry.npmjs.org/-/v1/search?text=' + encodeURIComponent(q) + '&size=6';
      const d = await fetchJson(npm);
      (d.objects || []).forEach((o) => {
        const p = o.package || {};
        out.push({
          title: p.name + '@' + (p.version || ''),
          text: p.description || '',
          url: p.links?.npm || 'https://www.npmjs.com/package/' + p.name,
          source: 'npm',
          kind: 'package',
        });
      });
    } catch (_) {}
    return out;
  }

  // ─── PRODUCTS / MEDIA / NATIONS / BOOKS / WEATHER ────
  async function products(q) {
    try {
      const url =
        'https://world.openfoodfacts.org/cgi/search.pl?search_terms=' +
        encodeURIComponent(q) +
        '&search_simple=1&action=process&json=1&page_size=8';
      const d = await fetchJson(url);
      return (d.products || [])
        .filter((p) => p.product_name)
        .map((p) => ({
          title: p.product_name,
          text: [p.brands, p.categories_tags?.[0]].filter(Boolean).join(' · '),
          url: p.url || 'https://world.openfoodfacts.org/product/' + p.code,
          photo: p.image_small_url || p.image_url || '',
          source: 'openfoodfacts',
          kind: 'product',
        }));
    } catch (_) {
      return [];
    }
  }

  async function media(q) {
    try {
      const url = 'https://api.tvmaze.com/search/shows?q=' + encodeURIComponent(q);
      const d = await fetchJson(url);
      return (d || []).slice(0, 8).map((row) => {
        const s = row.show || {};
        return {
          title: s.name,
          text: (s.summary || '').replace(/<[^>]+>/g, '').slice(0, 160),
          url: s.url || '',
          photo: s.image?.medium || '',
          source: 'tvmaze',
          kind: 'show',
        };
      });
    } catch (_) {
      return [];
    }
  }

  async function books(q) {
    try {
      const url =
        'https://openlibrary.org/search.json?q=' + encodeURIComponent(q) + '&limit=6';
      const d = await fetchJson(url);
      return (d.docs || []).map((b) => ({
        title: b.title,
        text: (b.author_name || []).slice(0, 2).join(', ') + (b.first_publish_year ? ' · ' + b.first_publish_year : ''),
        url: b.key ? 'https://openlibrary.org' + b.key : '',
        source: 'openlibrary',
        kind: 'book',
      }));
    } catch (_) {
      return [];
    }
  }

  async function nations(q) {
    try {
      const url = 'https://restcountries.com/v3.1/name/' + encodeURIComponent(q) + '?fields=name,capital,latlng,population,region,flags,currencies';
      const d = await fetchJson(url);
      return (d || []).slice(0, 5).map((c) => ({
        name: c.name?.common || q,
        lat: c.latlng?.[0],
        lng: c.latlng?.[1],
        kind: 'country',
        source: 'restcountries',
        text:
          (c.capital?.[0] || '') +
          ' · ' +
          (c.region || '') +
          ' · pop ' +
          (c.population || '?'),
        flag: c.flags?.png || c.flags?.svg || '',
      }));
    } catch (_) {
      return [];
    }
  }

  async function weather(lat, lng) {
    try {
      const url =
        'https://api.open-meteo.com/v1/forecast?latitude=' +
        lat +
        '&longitude=' +
        lng +
        '&current=temperature_2m,weather_code,wind_speed_10m';
      const d = await fetchJson(url);
      const cur = d.current || {};
      return {
        temp: cur.temperature_2m,
        wind: cur.wind_speed_10m,
        code: cur.weather_code,
        text:
          (cur.temperature_2m != null ? cur.temperature_2m + '°C' : '?') +
          (cur.wind_speed_10m != null ? ' · wind ' + cur.wind_speed_10m + ' km/h' : ''),
        source: 'open-meteo',
      };
    } catch (_) {
      return null;
    }
  }

  function intentOf(q) {
    const s = String(q || '').toLowerCase();
    return {
      code: /\b(code|github|npm|library|sdk|repo|package|javascript|python|rust|typescript)\b/.test(
        s
      ),
      product: /\b(product|brand|barcode|nutrition|openfood)\b/.test(s),
      // NEVER bare "show" — matches "show all" and floods TVMaze (Nigerian films etc.)
      media: /\b(movie|film|series|netflix|tv\s*show|actor|actress|cinema)\b/.test(s),
      book: /\b(book|novel|author|isbn)\b/.test(s),
      country: /\b(country|nation|capital of|population of)\b/.test(s),
      weather: /\b(weather|temperature|forecast|rain|wind)\b/.test(s),
      map:
        /\b(near|nearby|map|restaurant|cafe|hotel|shop|pharmacy|around|city|street|pizza|food|vendor|delivery|polygon|route|kitchen|eat|hungry)\b/.test(
          s
        ) ||
        (s.length < 40 &&
          !/\b(code|github|npm|book|novel|movie|film|author|library|sdk|netflix)\b/.test(s)),
      knowledge: /\b(who is|what is|wiki|history|biography)\b/.test(s),
      placeName:
        !/\b(restaurant|cafe|shop|food|pizza|vendor|near|nearby|map|delivery|order)\b/.test(s) &&
        /^[a-zA-Zα-ωΑ-Ω\s\-'.]{2,40}$/u.test(String(q || '').trim()),
    };
  }

  /**
   * Crawl modes — map default is SILENT nearby POIs only.
   * Never dumps TV/books/npm/random geocode cities into CLI.
   */
  async function crawl(query, opts) {
    opts = opts || {};
    const q = String(query || '').trim();
    if (!q) {
      return emptyResult();
    }
    const pos = opts.pos || global._snLastPos || global.SNTasks?.pos || { lat: 36.43, lng: 28.22 };
    const intent = intentOf(q);
    // opts.mode wins. opts.all only if mode not set. Never infer media from "show".
    var mode = opts.mode;
    if (!mode) {
      if (opts.all === true) mode = 'full';
      else if (intent.code) mode = 'code';
      else if (intent.book) mode = 'books';
      else if (intent.media) mode = 'media';
      else if (intent.knowledge) mode = 'knowledge';
      else mode = 'map';
    }
    // Food/shop words always force map — never full/media side paths
    if (
      mode !== 'full' &&
      mode !== 'almighty' &&
      /\b(restaurant|cafe|shop|food|pizza|vendor|delivery|hungry|eat)\b/i.test(q)
    ) {
      mode = 'map';
    }
    const full = mode === 'full' || mode === 'almighty';
    const wantMap = full || mode === 'map' || intent.map;
    const wantKnowledge = full || mode === 'knowledge';
    const wantCode = full || mode === 'code';
    const wantBooks = full || mode === 'books';
    const wantMedia = full || mode === 'media';
    const wantProduct = full || (intent.product && mode !== 'map');
    const wantCountry = full || intent.country;
    const wantWeather = full || intent.weather;
    // Geocode only real place names — never "vendor" / "pizza" → Kingstown / Nigerian films path
    const wantGeocode =
      full ||
      mode === 'knowledge' ||
      (mode === 'map' && intent.placeName && !intent.map) ||
      (opts.geocode === true);

    if (opts.quiet !== true && opts.silent !== true) {
      if (mode === 'map') {
        global.SNCli?.preview?.('Shops near you…');
      } else {
        global.SNCli?.preview?.('Looking…');
      }
    }

    const results = emptyResult();
    results.query = q;
    results.intent = intent;
    results.mode = mode;
    results.pos = pos;

    const jobs = [];

    if (wantGeocode) {
      jobs.push(
        geocode(q)
          .then((p) => {
            results.places = p;
          })
          .catch(() => {})
      );
    }

    // Knowledge: wiki / web — NOT on map food scans
    if (wantKnowledge || full) {
      jobs.push(
        webSearch(q)
          .then((w) => {
            results.web = w;
          })
          .catch(() => {})
      );
      jobs.push(
        wiki(q)
          .then((w) => {
            results.wiki = w;
          })
          .catch(() => {})
      );
      jobs.push(
        wikiSearch(q)
          .then((w) => {
            results.wikiHits = w;
          })
          .catch(() => {})
      );
      jobs.push(
        wikidata(q)
          .then((w) => {
            results.wikidata = w;
          })
          .catch(() => {})
      );
    }

    // Maps / POIs
    if (wantMap) {
      jobs.push(
        nearby(pos.lat, pos.lng, opts.radiusM || 2500, q)
          .then((n) => {
            results.nearby = n;
          })
          .catch(() => {})
      );
      jobs.push(
        edgeVendors(pos.lat, pos.lng, opts.radiusM || 2500)
          .then((e) => {
            results.edge = e;
          })
          .catch(() => {})
      );
    }

    // Specialized — ONLY when mode/intent asks (never silent on map land)
    if (wantCode) {
      jobs.push(
        codeSearch(q)
          .then((c) => {
            results.code = c;
          })
          .catch(() => {})
      );
    }
    if (wantProduct) {
      jobs.push(
        products(q)
          .then((p) => {
            results.products = p;
          })
          .catch(() => {})
      );
    }
    if (wantMedia) {
      jobs.push(
        media(q)
          .then((m) => {
            results.media = m;
          })
          .catch(() => {})
      );
    }
    if (wantBooks) {
      jobs.push(
        books(q)
          .then((b) => {
            results.books = b;
          })
          .catch(() => {})
      );
    }
    if (wantCountry) {
      jobs.push(
        nations(q)
          .then((n) => {
            results.nations = n;
            n.forEach((c) => {
              if (c.lat != null) results.places.push(c);
            });
          })
          .catch(() => {})
      );
    }

    await Promise.all(jobs);

    // Weather at focus
    const focus = results.places[0] || (results.wiki?.lat != null ? results.wiki : null) || pos;
    if (wantWeather && focus && focus.lat != null) {
      results.weather = await weather(focus.lat, focus.lng).catch(() => null);
    }

    // Local task DNA
    try {
      results.localTasks = global.SNTasks?.search?.(q) || { tasks: [], roles: [] };
    } catch (_) {
      results.localTasks = { tasks: [], roles: [] };
    }

    // Map mode: only nearby POIs around user — never pulse random world geocode hits
    const nearOnly =
      mode === 'map'
        ? (results.nearby || []).filter(function (p) {
            if (p.lat == null) return false;
            var dLat = Math.abs(p.lat - pos.lat);
            var dLng = Math.abs(p.lng - pos.lng);
            return dLat < 0.12 && dLng < 0.15; // ~10–15 km
          })
        : results.nearby || [];
    results.nearby = nearOnly;

    if (mode !== 'map') {
      (results.places || []).slice(0, 3).forEach(function (p, i) {
        if (p.lat != null)
          global.SNGlobe?.pulse?.(p.lat, p.lng, 0xffffff, String(p.name).slice(0, 18), 12000 + i * 300);
      });
    }
    nearOnly.slice(0, 10).forEach(function (p) {
      global.SNGlobe?.pulse?.(p.lat, p.lng, 0xffaa44, String(p.name).slice(0, 14), 10000);
    });

    // Fly only when asked — never for silent map sector fills
    const doFly = opts.fly === true;
    if (doFly && mode !== 'map') {
      if (results.places[0]?.lat != null) {
        global.SNGlobe?.goToPlace?.(results.places[0].lat, results.places[0].lng, {
          tier: 'national',
          openMap: false,
          skipScan: true,
          label: String(results.places[0].name || 'Place').slice(0, 24),
        });
        try {
          global.SNTasks?.setPos?.(results.places[0].lat, results.places[0].lng);
        } catch (_) {}
      }
    } else if (opts.pos?.lat != null) {
      try {
        global.SNTasks?.setPos?.(opts.pos.lat, opts.pos.lng);
      } catch (_) {}
    }

    // City map: nearby POIs only (not world "The Vendor" geocode junk)
    const mapStuff = nearOnly.slice();
    if (mapStuff.length && opts.openMap !== false) {
      void global.SNMap?.open?.(pos.lat, pos.lng)?.then?.(function () {
        try {
          global.SNMap?.plotCrawl?.(mapStuff);
          global.SNMap?.showProfiles?.();
        } catch (_) {}
      });
    }

    results.sources = summarizeSources(results);
    results.score = scoreResult(results);
    // Strip junk sources from map results so nothing re-reports them
    if (mode === 'map') {
      results.web = [];
      results.wiki = null;
      results.wikiHits = [];
      results.wikidata = [];
      results.code = [];
      results.products = [];
      results.media = [];
      results.books = [];
      results.places = [];
    }
    return results;
  }

  function emptyResult() {
    return {
      places: [],
      nearby: [],
      web: [],
      wiki: null,
      wikiHits: [],
      wikidata: [],
      code: [],
      products: [],
      media: [],
      books: [],
      nations: [],
      weather: null,
      edge: null,
      localTasks: { tasks: [], roles: [] },
      sources: [],
      score: 0,
    };
  }

  function summarizeSources(r) {
    const s = [];
    if (r.places?.length) s.push('geo:' + r.places.length);
    if (r.nearby?.length) s.push('poi:' + r.nearby.length);
    if (r.web?.length) s.push('web:' + r.web.length);
    if (r.wiki) s.push('wiki');
    if (r.wikidata?.length) s.push('wd:' + r.wikidata.length);
    if (r.code?.length) s.push('code:' + r.code.length);
    if (r.products?.length) s.push('prod:' + r.products.length);
    if (r.media?.length) s.push('media:' + r.media.length);
    if (r.books?.length) s.push('books:' + r.books.length);
    if (r.weather) s.push('wx');
    if (r.edge?.ok) s.push('edge:' + (r.edge.count || 0));
    return s;
  }

  function scoreResult(r) {
    return (
      (r.places?.length || 0) * 3 +
      (r.nearby?.length || 0) * 2 +
      (r.web?.length || 0) +
      (r.wiki ? 4 : 0) +
      (r.code?.length || 0) * 2 +
      (r.products?.length || 0) +
      (r.media?.length || 0) +
      (r.books?.length || 0)
    );
  }

  /**
   * CLI report — QUIET by default.
   * Map: one line + up to 3 nearby names. Never TV/books/npm/world geocode spam.
   */
  function report(results, log, reportOpts) {
    const L = log || ((t, c) => global.SNCli?.log?.(t, c));
    if (!results) return;
    reportOpts = reportOpts || {};
    const mode = results.mode || 'map';
    if (reportOpts.silent || mode === 'map') {
      const n = (results.nearby || []).length;
      if (n) {
        L(n + ' places near you — pins on the map. Tap one.', 'ok');
        (results.nearby || []).slice(0, 3).forEach(function (p) {
          L('· ' + String(p.name || 'shop').slice(0, 40), 'dim');
        });
      } else if (reportOpts.silent) {
        /* quiet miss */
      } else {
        L('No shops right here — try locate, then shops again.', 'dim');
      }
      return;
    }
    if (mode === 'knowledge') {
      if (results.wiki?.text)
        L(results.wiki.title + ': ' + results.wiki.text.slice(0, 160), 'ok');
      else if ((results.web || []).length)
        L(String(results.web[0].title || results.web[0].text).slice(0, 100), 'ok');
      else L("Nothing solid on that.", 'dim');
      return;
    }
    // Explicit research / code / books only — still capped hard
    if (mode === 'code') {
      (results.code || []).slice(0, 3).forEach(function (c) {
        L(c.title, 'ok');
      });
      return;
    }
    if (mode === 'books') {
      (results.books || []).slice(0, 3).forEach(function (b) {
        L(b.title, 'ok');
      });
      return;
    }
    if (mode === 'media') {
      (results.media || []).slice(0, 3).forEach(function (m) {
        L(m.title, 'ok');
      });
      return;
    }
    if (mode === 'full' || mode === 'almighty') {
      L('Research notes (short):', 'dim');
      if (results.wiki?.title) L(results.wiki.title, 'ok');
      (results.nearby || []).slice(0, 2).forEach(function (p) {
        L('· ' + String(p.name).slice(0, 40), 'dim');
      });
      // NEVER dump media/books/npm lists into CLI even in full — user hated Nigerian films / Atari spam
      return;
    }
  }

  global.SNSearch = {
    geocode,
    reverse,
    nearby,
    webSearch,
    wiki,
    wikiSearch,
    wikidata,
    codeSearch,
    products,
    media,
    books,
    nations,
    weather,
    edgeVendors,
    crawl,
    report,
    intentOf,
  };
})(window);
