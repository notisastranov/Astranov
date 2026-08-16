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
          description: d.description || '',
          type: d.type || '',
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
        /\b(near|nearby|map|restaurant|cafe|hotel|shop|pharmacy|around|street|pizza|food|vendor|delivery|polygon|route|kitchen|eat|hungry)\b/.test(
          s
        ),
      knowledge: /\b(who is|what is|wiki|history|biography)\b/.test(s),
      placeName:
        !/\b(restaurant|cafe|shop|food|pizza|vendor|near|nearby|map|delivery|order)\b/.test(s) &&
        /^[a-zA-Zα-ωΑ-Ω\s\-'.]{2,40}$/u.test(String(q || '').trim()),
    };
  }

  function isExactDummyPin(lat, lng) {
    if (lat == null || lng == null) return false;
    var la = Number(lat);
    var lo = Number(lng);
    return (
      (Math.abs(la - 36.4341) < 0.0008 && Math.abs(lo - 28.2176) < 0.0008) ||
      (Math.abs(la - 37.9838) < 0.0008 && Math.abs(lo - 23.7275) < 0.0008)
    );
  }

  function realFocus(opts) {
    opts = opts || {};
    function ok(p, allowDummyIfGps) {
      if (!p || p.lat == null || p.lng == null || !isFinite(p.lat) || !isFinite(p.lng)) return null;
      var src = String(p.source || '');
      var gps = !!(p.real || src === 'gps' || src === 'phys' || src === 'locate' || src === 'real');
      if (isExactDummyPin(p.lat, p.lng) && !(allowDummyIfGps && gps)) return null;
      return { lat: Number(p.lat), lng: Number(p.lng), source: src || 'given' };
    }
    if (opts.pos) {
      var given = ok(opts.pos, true);
      if (given) return given;
    }
    var phys = ok(global._snPhysPos, true);
    if (phys) return phys;
    var last = global._snLastPos;
    if (last && (last.real || last.source === 'gps' || last.source === 'phys' || last.source === 'locate')) {
      var kept = ok(last, true);
      if (kept) return kept;
    }
    return null;
  }

  function parseSearch(q) {
    var raw = String(q || '').trim();
    var s = raw
      .replace(
        /^(search|find|google|maps|crawl|almighty|where\s+is|look\s+up|show\s+me|zoom\s+to|visualize|look\s+at|take\s+me\s+to)\s+/i,
        ''
      )
      .trim();
    var low = s.toLowerCase();
    var body = null;
    var bm = low.match(/\b(mars|moon|luna|jupiter|saturn|venus|mercury|neptune|uranus|pluto|europa|titan|cydonia)\b/);
    if (bm) body = bm[1] === 'luna' ? 'moon' : bm[1];
    var nearMe = /\b(near me|nearby|around me|\bhere\b)\b/i.test(s);
    var place = '';
    var thing = s;
    var m = s.match(/^(.*?)\s+(?:in|at|near|around|on)\s+(.+)$/i);
    if (m && m[2] && !/^(me|here)$/i.test(m[2].trim())) {
      thing = m[1].trim();
      place = m[2].replace(/\b(earth|the earth|the world)\b/i, '').trim();
    }
    if (body) {
      thing = s
        .replace(new RegExp('\\b' + body + '\\b', 'ig'), '')
        .replace(/\s+/g, ' ')
        .trim();
      place = '';
    }
    return { raw: raw, q: s, body: body, place: place, thing: thing, nearMe: nearMe };
  }

  function looksVisual(q) {
    var p = parseSearch(q);
    if (!p || !p.q) return false;
    if (p.body || p.place) return true;
    if (p.nearMe) return false;
    if (
      /^(search|find|show\s+me|zoom\s+to|visualize|look\s+at|take\s+me\s+to|where\s+is|look\s+up|crawl)\b/i.test(
        String(q || '')
      )
    ) {
      if (/\b(youtube|youtu\.be|clip|video|βίντεο|song|trailer|lyrics)\b/i.test(String(q || ''))) return false;
      return true;
    }
    if (
      /\b(tower|island|cape|bridge|airport|harbor|harbour|temple|plaza|square|mountain|cathedral|statue)\b/i.test(
        p.q
      )
    )
      return true;
    return false;
  }

  function looksLikePlaceHit(p) {
    if (!p || p.lat == null) return false;
    var k = String(p.kind || p.type || '').toLowerCase();
    if (/amenity|shop|cuisine|fast_food/.test(k)) return false;
    return true;
  }

  /**
   * Paint crawler hits on globe + city map. The world is the result page.
   */
  function visualize(results, opts) {
    opts = opts || {};
    results = results || {};
    var hits = [];
    function add(p, color) {
      if (!p || p.lat == null || p.lng == null || !isFinite(p.lat) || !isFinite(p.lng)) return;
      hits.push({
        lat: Number(p.lat),
        lng: Number(p.lng),
        name: String(p.name || p.title || 'hit').slice(0, 40),
        color: color || 0xffaa44,
        kind: p.kind || 'place',
      });
    }
    (results.places || []).slice(0, 8).forEach(function (p) {
      add(p, 0xffffff);
    });
    if (results.wiki && results.wiki.lat != null) {
      add(
        { lat: results.wiki.lat, lng: results.wiki.lng, name: results.wiki.title, kind: 'wiki' },
        0x7ec8ff
      );
    }
    (results.nearby || []).slice(0, 24).forEach(function (p) {
      add(p, 0xffaa44);
    });
    (results.nations || []).slice(0, 4).forEach(function (p) {
      add(p, 0x44ffaa);
    });
    results.hits = hits;
    results.focus = hits[0] || null;

    if (results.body && results.body !== 'earth') {
      try {
        if (global.SNCosmos && SNCosmos.go) void SNCosmos.go(results.body);
        else if (global.SNGlobe && SNGlobe.setBody) SNGlobe.setBody(results.body);
      } catch (_) {}
      try {
        global.SNCli && SNCli.preview && SNCli.preview((results.body || 'space') + ' · crawlers');
      } catch (_) {}
      return hits;
    }

    if (!hits.length) return hits;

    var focus = hits[0];
    var street = (results.nearby || []).length >= 1;
    var tier = street ? 'city' : hits.length > 5 ? 'regional' : 'national';

    try {
      if (global.SNGlobe && SNGlobe.clearMarkers) SNGlobe.clearMarkers();
    } catch (_) {}

    try {
      if (global.SNGlobe && SNGlobe.goToPlace) {
        SNGlobe.goToPlace(focus.lat, focus.lng, {
          tier: tier,
          body: 'earth',
          pulse: false,
          label: focus.name,
          openMap: false,
          skipScan: true,
        });
      }
    } catch (_) {}

    hits.forEach(function (h, i) {
      try {
        if (global.SNGlobe && SNGlobe.pulse)
          SNGlobe.pulse(h.lat, h.lng, h.color, String(h.name).slice(0, 16), 14000 + i * 180);
      } catch (_) {}
    });

    try {
      if (global.SNGlobe && SNGlobe.setHud) SNGlobe.setHud(focus.name);
    } catch (_) {}

    try {
      global._snLastPos = {
        lat: focus.lat,
        lng: focus.lng,
        source: 'search',
        real: true,
        label: focus.name,
      };
      if (global.SNTasks && SNTasks.setPos) SNTasks.setPos(focus.lat, focus.lng);
    } catch (_) {}

    if (street && opts.openMap !== false) {
      try {
        var opener = global.SNMap && SNMap.open && SNMap.open(focus.lat, focus.lng, { force: true });
        if (opener && opener.then) {
          opener.then(function () {
            try {
              if (results.nearby && results.nearby.length) global.SNMap.plotCrawl(results.nearby);
              if (results.places && results.places.length)
                global.SNMap.plotCrawl(results.places.slice(0, 6));
              if (global.SNMap.markYou) global.SNMap.markYou(focus.lat, focus.lng, focus.name);
            } catch (_) {}
          });
        }
      } catch (_) {}
    }

    return hits;
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
    const parsed = parseSearch(q);
    const gps = realFocus(opts);
    const intent = intentOf(parsed.q || q);
    // opts.mode wins. opts.all only if mode not set. Never infer media from "show".
    var mode = opts.mode;
    if (!mode) {
      if (opts.all === true) mode = 'full';
      else if (parsed.body) mode = 'space';
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
      mode !== 'space' &&
      /\b(restaurant|cafe|shop|food|pizza|vendor|delivery|hungry|eat)\b/i.test(parsed.q || q)
    ) {
      mode = 'map';
    }
    const full = mode === 'full' || mode === 'almighty';
    const wantMap = full || mode === 'map' || intent.map;
    const wantKnowledge = full || mode === 'knowledge' || mode === 'space';
    const wantCode = full || mode === 'code';
    const wantBooks = full || mode === 'books';
    const wantMedia = full || mode === 'media';
    const wantProduct = full || (intent.product && mode !== 'map');
    const wantCountry = full || intent.country;
    const wantWeather = full || intent.weather;
    const doViz =
      opts.visualize === true || (opts.fly === true && opts.quiet !== true && opts.silent !== true);

    // Geocode a destination — never "shops near me" / bare pizza as a city
    const wantGeocode =
      opts.geocode === true ||
      !!parsed.place ||
      !!parsed.body ||
      (doViz && !parsed.nearMe && !/^(shops?|vendors?|pizza|food|restaurants?)$/i.test(parsed.q)) ||
      (mode === 'knowledge' && intent.placeName) ||
      (mode === 'map' && intent.placeName && !intent.map && !gps);

    if (opts.quiet !== true && opts.silent !== true) {
      if (parsed.body) {
        global.SNCli?.preview?.('Going · ' + parsed.body);
      } else if (mode === 'map' && !doViz) {
        global.SNCli?.preview?.('Shops near you…');
      } else {
        global.SNCli?.preview?.('Looking on Earth…');
      }
    }

    const results = emptyResult();
    results.query = parsed.q || q;
    results.intent = intent;
    results.mode = mode;
    results.parsed = parsed;
    if (parsed.body) results.body = parsed.body;

    // Space first — switch globe, then wiki that world
    if (parsed.body && parsed.body !== 'earth') {
      if (doViz || opts.fly === true) {
        try {
          if (global.SNCosmos && SNCosmos.go) await SNCosmos.go(parsed.body);
          else if (global.SNGlobe && SNGlobe.setBody) SNGlobe.setBody(parsed.body);
        } catch (_) {}
      }
      try {
        var wSpace = await wiki(parsed.thing ? parsed.thing + ' ' + parsed.body : parsed.body);
        if (wSpace) results.wiki = wSpace;
      } catch (_) {}
      results.pos = gps;
      results.sources = summarizeSources(results);
      results.score = scoreResult(results);
      if (doViz) visualize(results, { openMap: false });
      return results;
    }

    var dest = null;
    if (wantGeocode) {
      var geoQ = parsed.place || parsed.q || q;
      try {
        var places = await geocode(geoQ);
        results.places = places || [];
        if (places && places[0] && looksLikePlaceHit(places[0])) dest = places[0];
      } catch (_) {
        results.places = [];
      }
      if (!dest && !parsed.place) {
        var words = String(parsed.q || q).split(/\s+/);
        if (words.length >= 2) {
          try {
            var tail = words.slice(-2).join(' ');
            var p2 = await geocode(tail);
            if (p2 && p2[0] && looksLikePlaceHit(p2[0])) {
              dest = p2[0];
              results.places = (results.places || []).concat(p2);
            }
          } catch (_) {}
        }
      }
    }

    const pos = dest || gps;
    results.pos = pos || null;
    results.focusPlace = dest || null;

    const jobs = [];

    // Knowledge: wiki / web — NOT on silent map food scans
    if (wantKnowledge || full || doViz) {
      var kq = dest ? parsed.thing || dest.name : parsed.q || q;
      if (kq && (doViz || wantKnowledge || full)) {
        jobs.push(
          webSearch(parsed.q || q)
            .then((w) => {
              results.web = w;
            })
            .catch(() => {})
        );
        jobs.push(
          wiki(parsed.q || q)
            .then((w) => {
              results.wiki = w;
            })
            .catch(() => {})
        );
      }
    }

    // Maps / POIs around destination or real GPS — never dummy Rhodes
    var nearbyQ = parsed.thing || parsed.q || q;
    if (
      dest &&
      nearbyQ &&
      dest.name &&
      String(dest.name)
        .toLowerCase()
        .indexOf(String(nearbyQ).toLowerCase().slice(0, 18)) >= 0
    ) {
      nearbyQ = '';
    }
    if (wantMap && pos && pos.lat != null) {
      if (nearbyQ && !/^(the|a|an)$/i.test(nearbyQ)) {
        jobs.push(
          nearby(pos.lat, pos.lng, opts.radiusM || (dest ? 4000 : 2500), nearbyQ)
            .then((n) => {
              results.nearby = n;
            })
            .catch(() => {})
        );
      }
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

    // Wiki coordinates become a place if we still have none
    if (!dest && results.wiki && results.wiki.lat != null) {
      dest = {
        name: results.wiki.title,
        lat: results.wiki.lat,
        lng: results.wiki.lng,
        kind: 'wiki',
        source: 'wikipedia',
      };
      results.places = [dest].concat(results.places || []);
      results.pos = dest;
    }

    // Weather at focus
    const focus = dest || (results.wiki && results.wiki.lat != null ? results.wiki : null) || pos;
    if (wantWeather && focus && focus.lat != null) {
      results.weather = await weather(focus.lat, focus.lng).catch(() => null);
    }

    // Local task DNA
    try {
      results.localTasks = global.SNTasks?.search?.(q) || { tasks: [], roles: [] };
    } catch (_) {
      results.localTasks = { tasks: [], roles: [] };
    }

    // Map mode: only nearby POIs around the chosen focus — never pulse random world geocode hits
    var focusLat = (dest || pos || {}).lat;
    var focusLng = (dest || pos || {}).lng;
    const nearOnly =
      mode === 'map' && focusLat != null
        ? (results.nearby || []).filter(function (p) {
            if (p.lat == null) return false;
            var dLat = Math.abs(p.lat - focusLat);
            var dLng = Math.abs(p.lng - focusLng);
            return dLat < 0.12 && dLng < 0.15;
          })
        : results.nearby || [];
    results.nearby = nearOnly;

    if (!doViz) {
      if (mode !== 'map') {
        (results.places || []).slice(0, 3).forEach(function (p, i) {
          if (p.lat != null)
            global.SNGlobe?.pulse?.(p.lat, p.lng, 0xffffff, String(p.name).slice(0, 18), 12000 + i * 300);
        });
      }
      nearOnly.slice(0, 10).forEach(function (p) {
        global.SNGlobe?.pulse?.(p.lat, p.lng, 0xffaa44, String(p.name).slice(0, 14), 10000);
      });
    }

    // Fly only when asked — never for silent map sector fills
    const doFly = opts.fly === true;
    if (doFly && !doViz && mode !== 'map') {
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
    } else if (opts.pos?.lat != null && !doViz) {
      try {
        global.SNTasks?.setPos?.(opts.pos.lat, opts.pos.lng);
      } catch (_) {}
    }

    // City map: nearby POIs only (not world "The Vendor" geocode junk)
    if (!doViz) {
      const mapStuff = nearOnly.slice();
      if (mapStuff.length && opts.openMap !== false) {
        void global.SNMap?.open?.(pos ? pos.lat : gps && gps.lat, pos ? pos.lng : gps && gps.lng)?.then?.(
          function () {
            try {
              global.SNMap?.plotCrawl?.(mapStuff);
              global.SNMap?.showProfiles?.();
            } catch (_) {}
          }
        );
      }
    }

    results.sources = summarizeSources(results);
    results.score = scoreResult(results);
    // Strip junk sources from silent map fills so nothing re-reports them
    if (mode === 'map' && !doViz) {
      results.web = [];
      results.wiki = null;
      results.wikiHits = [];
      results.wikidata = [];
      results.code = [];
      results.products = [];
      results.media = [];
      results.books = [];
      if (!dest) results.places = [];
    }

    if (doViz) {
      visualize(results, { openMap: opts.openMap !== false });
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
    if (reportOpts.silent || (mode === 'map' && !results.focus && !results.hits)) {
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
    if (results.body && results.body !== 'earth') {
      L('On ' + results.body + (results.wiki?.title ? ' · ' + results.wiki.title : '') + '.', 'ok');
      if (results.wiki?.text) L(results.wiki.text.slice(0, 140), 'dim');
      return;
    }
    if (results.focus || (results.places && results.places[0])) {
      var f = results.focus || results.places[0];
      var n2 = (results.nearby || []).length;
      L(
        String(f.name || 'Place').slice(0, 48) +
          (n2 ? ' · ' + n2 + ' pins on the map. Tap one.' : ' · on Earth. Crawlers marked it.'),
        'ok'
      );
      (results.nearby || []).slice(0, 3).forEach(function (p) {
        L('· ' + String(p.name || 'place').slice(0, 40), 'dim');
      });
      if (results.wiki?.text && n2 < 1)
        L(results.wiki.text.slice(0, 140), 'dim');
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

  /**
   * Research first. Do not assume place or action.
   * Sense from evidence (wiki, web, media, geocode), then act.
   * Only ask the user if nothing reads clearly.
   */
  async function sense(query, opts) {
    opts = opts || {};
    var q = String(query || '').trim();
    var out = {
      query: q,
      kind: 'unknown',
      confidence: 0,
      why: '',
      wiki: null,
      wikiHits: [],
      web: [],
      places: [],
    };
    if (!q) return out;
    var low = q.toLowerCase();

    try {
      if (global.SNYoutube) {
        if (SNYoutube.wantsYoutube && SNYoutube.wantsYoutube(q)) {
          out.kind = 'video';
          out.confidence = 0.9;
          out.why = 'media words / clip';
        } else if (SNYoutube.looksLikeClipTitle && SNYoutube.looksLikeClipTitle(q)) {
          out.kind = 'video';
          out.confidence = 0.72;
          out.why = 'reads like a clip title';
        }
      }
    } catch (_) {}

    if (/\b(drum\s*cam|concert|setlist|lyrics|official\s+video|live\s+at)\b/.test(low)) {
      out.kind = 'video';
      out.confidence = Math.max(out.confidence, 0.88);
      out.why = 'live / cam / setlist';
    }

    var jobs = [
      wiki(q)
        .then(function (w) {
          out.wiki = w;
        })
        .catch(function () {}),
      wikiSearch(q)
        .then(function (w) {
          out.wikiHits = w || [];
        })
        .catch(function () {}),
      webSearch(q)
        .then(function (w) {
          out.web = w || [];
        })
        .catch(function () {}),
    ];

    var explicitPlace = /^(fly|go|zoom|take me|show me the place|where is|locate)\b/.test(low);
    var shopWord = /\b(bodega|shop|store|market|vendor|kitchen|cafe|bar|tavern|supermarket|pharmacy|kiosk)\b/.test(
      low
    );
    var shortPlace =
      q.split(/\s+/).length <= 4 &&
      !/\d{5,}/.test(q) &&
      !/\b(cam|clip|video|song|lyrics|feat|drum|concert)\b/i.test(low);
    var knownCity = false;
    if (/^(tokyo|paris|london|athens|rhodes|rodos|rome|eiffel|mars|moon|earth|vodi)$/i.test(low))
      knownCity = true;
    if (opts && opts.forcePlace) explicitPlace = true;
    if (explicitPlace || knownCity || shopWord || (shortPlace && !/\s/.test(q))) {
      jobs.push(
        geocode(q)
          .then(function (p) {
            out.places = p || [];
          })
          .catch(function () {})
      );
    }

    await Promise.all(jobs);

    var blob =
      ((out.wiki && (out.wiki.description || '') + ' ' + (out.wiki.text || '')) || '') +
      ' ' +
      (out.web[0] && out.web[0].text ? out.web[0].text : '') +
      ' ' +
      ((out.wikiHits[0] && (out.wikiHits[0].desc || out.wikiHits[0].title)) || '');

    if (/song|single \(song\)|album|band|musician|singer|film|movie|television|youtuber|music video|concert|drummer|discography/i.test(blob)) {
      if (out.kind !== 'video' || out.confidence < 0.8) {
        out.kind = 'video';
        out.confidence = Math.max(out.confidence, 0.8);
        out.why = 'wiki/web says media';
      }
    } else if (/human|person|politician|scientist|footballer|actor|actress|writer|philosopher/i.test(blob)) {
      if (out.kind === 'unknown' || out.confidence < 0.7) {
        out.kind = 'person';
        out.confidence = 0.8;
        out.why = 'wiki says a person';
      }
    }

    var hit = out.places && out.places[0];
    if (hit && looksLikePlaceHit(hit) && out.kind !== 'video') {
      var k = String(hit.kind || hit.type || '').toLowerCase();
      var citylike = /city|town|village|country|island|capital|suburb|administrative|hamlet|state/.test(k);
      if (explicitPlace || citylike || (shortPlace && (hit.importance == null || hit.importance > 0.35))) {
        out.kind = 'place';
        out.confidence = explicitPlace ? 0.92 : 0.74;
        out.why = 'geocode is a real place';
      }
    }

    if (out.kind === 'unknown' && out.wiki && out.wiki.text) {
      out.kind = 'thing';
      out.confidence = 0.66;
      out.why = 'wiki extract';
    }
    if (out.kind === 'unknown' && out.web && out.web[0] && out.web[0].text) {
      out.kind = 'thing';
      out.confidence = 0.55;
      out.why = 'web extract';
    }
    return out;
  }

  var NET = { last: null, rows: [], open: false };

  function escHtml(s) {
    return String(s || '')
      .replace(/&/g, '&')
      .replace(/</g, '<')
      .replace(/>/g, '>')
      .replace(/"/g, '"');
  }

  function ensureNetDom() {
    var root = document.getElementById('sn-net-tile');
    if (root) return root;
    root = document.createElement('div');
    root.id = 'sn-net-tile';
    root.innerHTML =
      '<div class="sn-net-card">' +
      '<div class="sn-net-bar"><span id="sn-net-kind">SPACENET</span><b id="sn-net-q">Research</b>' +
      '<button type="button" id="sn-net-x">×</button></div>' +
      '<p id="sn-net-brief"></p>' +
      '<div id="sn-net-rows"></div>' +
      '<div class="sn-net-hint">open 1 · fly 1 · watch 1 · net close</div></div>';
    if (!document.getElementById('sn-net-style')) {
      var st = document.createElement('style');
      st.id = 'sn-net-style';
      st.textContent =
        '#sn-net-tile{position:fixed;z-index:12040;left:50%;top:9%;transform:translateX(-50%);width:min(460px,94vw);display:none;pointer-events:none}' +
        '#sn-net-tile.open{display:block;pointer-events:auto}' +
        '#sn-net-tile .sn-net-card{background:linear-gradient(180deg,rgba(4,10,22,.88),rgba(2,6,14,.86));border:1px solid rgba(90,180,255,.38);border-radius:6px;box-shadow:0 12px 36px rgba(0,0,0,.5);overflow:hidden;backdrop-filter:blur(16px);max-height:28vh;display:flex;flex-direction:column}' +
        '#sn-net-tile #sn-net-rows{overflow:auto;padding:4px 8px 8px;display:flex;flex-direction:column;gap:4px;max-height:14vh}' +
        '#sn-net-tile .sn-net-bar{display:flex;align-items:center;gap:10px;padding:10px 12px;border-bottom:1px solid rgba(80,160,255,.18);cursor:grab}' +
        '#sn-net-tile #sn-net-kind{font:700 9px/1 JetBrains Mono,ui-monospace,monospace;letter-spacing:.2em;color:#7ec8ff}' +
        '#sn-net-tile #sn-net-q{flex:1;font:600 13px/1.2 Inter,system-ui,sans-serif;color:#f4f8ff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}' +
        '#sn-net-tile #sn-net-x{width:32px;height:28px;border:0;background:transparent;color:#cfe6ff;font-size:18px;cursor:pointer}' +
        '#sn-net-tile #sn-net-brief{margin:0;padding:10px 14px 6px;font:500 13px/1.45 Inter,system-ui,sans-serif;color:#d5e6ff}' +
        '#sn-net-tile #sn-net-rows{overflow:auto;padding:4px 8px 8px;display:flex;flex-direction:column;gap:4px;max-height:42vh}' +
        '#sn-net-tile .sn-net-row{display:flex;gap:8px;text-align:left;padding:8px 10px;border:0;border-radius:4px;background:transparent;color:#c8d8ee;cursor:pointer;font:500 12px/1.35 Inter,system-ui,sans-serif}' +
        '#sn-net-tile .sn-net-row:hover{background:rgba(61,158,255,.14)}' +
        '#sn-net-tile .sn-net-n{min-width:16px;color:#3d9eff;font:700 11px JetBrains Mono,monospace}' +
        '#sn-net-tile .sn-net-row b{display:block;color:#fff;font-weight:600}' +
        '#sn-net-tile .sn-net-row small{color:#8aa0b8}' +
        '#sn-net-tile .sn-net-hint{padding:6px 12px 10px;font:500 10px/1.3 JetBrains Mono,ui-monospace,monospace;letter-spacing:.06em;color:#6a829c}';
      document.head.appendChild(st);
    }
    document.body.appendChild(root);
    document.getElementById('sn-net-x').onclick = function () {
      closeNet();
    };
    return root;
  }

  function closeNet() {
    var root = document.getElementById('sn-net-tile');
    if (root) root.classList.remove('open');
    NET.open = false;
  }

  function showNet(senseOut) {
    senseOut = senseOut || NET.last;
    if (!senseOut) return;
    NET.last = senseOut;
    var root = ensureNetDom();
    var kindEl = document.getElementById('sn-net-kind');
    var qEl = document.getElementById('sn-net-q');
    var briefEl = document.getElementById('sn-net-brief');
    var rowsEl = document.getElementById('sn-net-rows');
    if (kindEl) kindEl.textContent = (senseOut.body || senseOut.kind || 'NET').toUpperCase();
    if (qEl) qEl.textContent = String(senseOut.query || 'Research').slice(0, 72);
    var brief =
      (senseOut.wiki && senseOut.wiki.text) ||
      (senseOut.web && senseOut.web[0] && senseOut.web[0].text) ||
      senseOut.ask ||
      '';
    if (briefEl) briefEl.textContent = String(brief).slice(0, 280);
    var rows = [];
    if (senseOut.wiki && senseOut.wiki.title) {
      rows.push({
        kind: 'wiki',
        title: senseOut.wiki.title,
        sub: (senseOut.wiki.description || 'Wikipedia').slice(0, 80),
        url: senseOut.wiki.url,
        lat: senseOut.wiki.lat,
        lng: senseOut.wiki.lng,
      });
    }
    (senseOut.places || []).slice(0, 3).forEach(function (p) {
      if (!p || p.lat == null) return;
      rows.push({
        kind: 'place',
        title: p.name || senseOut.query,
        sub: (p.kind || p.type || 'place') + ' · fly',
        lat: p.lat,
        lng: p.lng,
      });
    });
    (senseOut.web || []).slice(0, 2).forEach(function (w) {
      if (!w || !w.title) return;
      if (senseOut.wiki && w.title === senseOut.wiki.title) return;
      rows.push({ kind: 'web', title: w.title, sub: String(w.text || w.url || '').slice(0, 90), url: w.url });
    });
    (senseOut.wikiHits || []).slice(0, 3).forEach(function (h) {
      var title = h.title || h;
      if (senseOut.wiki && title === senseOut.wiki.title) return;
      rows.push({ kind: 'wiki', title: title, sub: h.desc || 'Wikipedia', url: h.url });
    });
    if (senseOut.kind === 'video') {
      rows.unshift({
        kind: 'video',
        title: 'Open clip · ' + String(senseOut.query).slice(0, 48),
        sub: 'YouTube',
        video: senseOut.query,
      });
    }
    NET.rows = rows.slice(0, 4);
    if (rowsEl) {
      rowsEl.innerHTML = NET.rows
        .map(function (r, i) {
          return (
            '<button type="button" class="sn-net-row" data-i="' +
            i +
            '"><span class="sn-net-n">' +
            (i + 1) +
            '</span><span><b>' +
            escHtml(r.title).slice(0, 72) +
            '</b><small>' +
            escHtml(r.sub || r.kind).slice(0, 90) +
            '</small></span></button>'
          );
        })
        .join('');
      Array.prototype.forEach.call(rowsEl.querySelectorAll('.sn-net-row'), function (btn) {
        btn.onclick = function () {
          openNetIndex(parseInt(btn.getAttribute('data-i'), 10) + 1);
        };
      });
    }
    root.classList.add('open');
    NET.open = true;
  }

  async function openNetIndex(n) {
    var r = NET.rows[parseInt(n, 10) - 1];
    if (!r) return { ok: false };
    if (r.kind === 'video' && global.SNYoutube && SNYoutube.find) {
      await SNYoutube.find(r.video || NET.last.query);
      return { ok: true };
    }
    if (r.kind === 'place' && r.lat != null && global.SNGlobe && SNGlobe.goToPlace) {
      SNGlobe.goToPlace(r.lat, r.lng, {
        tier: 'city',
        label: String(r.title).slice(0, 28),
        body: 'earth',
        pulse: true,
      });
      return { ok: true };
    }
    if (r.url) {
      try {
        global.open(r.url, '_blank', 'noopener');
      } catch (_) {}
      return { ok: true };
    }
    return { ok: false };
  }

  async function flyNetIndex(n) {
    var r = NET.rows[parseInt(n, 10) - 1];
    if (!r) r = NET.last && NET.last.places && NET.last.places[0];
    if (!r || r.lat == null) return { ok: false };
    if (global.SNGlobe && SNGlobe.goToPlace) {
      SNGlobe.goToPlace(r.lat, r.lng, {
        tier: 'city',
        label: String(r.title || r.name || '').slice(0, 28),
        body: 'earth',
        pulse: true,
      });
      return { ok: true };
    }
    return { ok: false };
  }

  function sleep(ms) {
    return new Promise(function (r) {
      setTimeout(r, ms);
    });
  }

  async function arriveVisual(pin, q, L, previewFn) {
    var name = String((pin && (pin.name || pin.title)) || q || 'there').slice(0, 40);
    var lat = Number(pin.lat);
    var lng = Number(pin.lng);
    if (!isFinite(lat) || !isFinite(lng)) return false;
    previewFn('Zoom · ' + name);
    try {
      if (global.SNGlobe && SNGlobe.goToPlace) {
        SNGlobe.goToPlace(lat, lng, {
          tier: 'national',
          label: name,
          body: 'earth',
          pulse: true,
        });
      }
    } catch (_) {}
    await sleep(380);
    try {
      if (global.SNGlobe && SNGlobe.goToPlace) {
        SNGlobe.goToPlace(lat, lng, {
          tier: 'city',
          label: name,
          body: 'earth',
          pulse: true,
          openMap: true,
        });
      }
    } catch (_) {}
    try {
      if (global.SNMap && SNMap.showLiveSat) {
        await SNMap.showLiveSat(lat, lng, {
          zoom: 15,
          pollution: /pollut|waste|vodi|sewage|chloro/i.test(String(q || '')),
          trueColor: true,
          plume: false,
          label: name,
        });
      } else if (global.SNMap && SNMap.open) {
        await SNMap.open(lat, lng, { force: true, zoom: 15, basemap: 'satellite' });
      }
    } catch (_) {}
    if (L) L('ARRIVED · ' + name + ' · live imagery', 'ok');
    previewFn(name);
    return true;
  }

  async function researchFirst(query, opts) {
    opts = opts || {};
    var q = String(query || '').trim();
    var L = opts.log || function () {};
    var previewFn = opts.preview || function () {};
    previewFn('Research…');
    L('Search · ' + q, 'cmd');

    var s = await sense(q, opts);
    s.acted = [];
    s.ask = null;

    var bodyHit = String(q || '').match(
      /\b(earth|mars|moon|luna|jupiter|saturn|venus|mercury|neptune|uranus|europa|titan|io|ganymede|callisto|pluto|sun)\b/i
    );
    if (bodyHit && !/\b(clip|video|song|lyrics)\b/i.test(q)) {
      var bid = bodyHit[1].toLowerCase();
      if (bid === 'luna') bid = 'moon';
      try {
        if (global.SNCosmos && SNCosmos.go) await SNCosmos.go(bid);
        else if (global.SNGlobe && SNGlobe.setBody) SNGlobe.setBody(bid);
      } catch (_) {}
      s.kind = 'place';
      s.body = bid;
      s.acted.push('cosmos');
      L('ARRIVED · ' + bid.toUpperCase() + ' · orbital view', 'ok');
      previewFn(bid);
      showNet(s);
      return s;
    }

    if (opts.forcePlace || /\b(bodega|shop|store|vendor|kitchen)\b/i.test(q)) {
      if (!s.places || !s.places.length) {
        try {
          var extra = await geocode(q);
          if (extra && extra.length) s.places = extra;
        } catch (_) {}
      }
      if ((!s.places || !s.places.length) && global._snLastPos && global._snLastPos.lat != null) {
        try {
          var nearHits = await nearby(global._snLastPos.lat, global._snLastPos.lng, 9000, q);
          if (nearHits && nearHits.length) {
            s.places = nearHits.slice(0, 6);
            s.why = 'near you';
          }
        } catch (_) {}
      }
    }

    var pin = null;
    if (s.places && s.places[0] && s.places[0].lat != null) pin = s.places[0];
    if (!pin && s.wiki && s.wiki.lat != null)
      pin = { name: s.wiki.title, lat: s.wiki.lat, lng: s.wiki.lng, kind: 'wiki' };
    if (!pin && s.kind !== 'video') {
      try {
        var g2 = await geocode(q);
        if (g2 && g2[0] && looksLikePlaceHit(g2[0])) {
          s.places = g2;
          pin = g2[0];
        }
      } catch (_) {}
    }
    if (pin) {
      s.kind = 'place';
      await arriveVisual(pin, q, L, previewFn);
      s.acted.push('arrive');
      showNet(s);
      return s;
    }

    showNet(s);

    if (s.kind === 'video') {
      try {
        if (global.SNLoader && SNLoader.ensure) await SNLoader.ensure('youtube');
      } catch (_) {}
      if (global.SNYoutube && SNYoutube.find) {
        await SNYoutube.find(q);
        s.acted.push('youtube');
        L('Sensed a clip · opening YouTube', 'ok');
        previewFn('YouTube · ' + q.slice(0, 36));
        return s;
      }
    }

    if (s.kind === 'person' || s.kind === 'thing') {
      if (s.wiki && s.wiki.title) {
        L(s.wiki.title + (s.wiki.description ? ' · ' + s.wiki.description : ''), 'ok');
        if (s.wiki.text) L(s.wiki.text.slice(0, 220), 'dim');
        s.acted.push('wiki');
      } else if (s.web && s.web[0]) {
        L((s.web[0].title || q).slice(0, 72), 'ok');
        if (s.web[0].text) L(String(s.web[0].text).slice(0, 220), 'dim');
        s.acted.push('web');
      }
      if (s.wiki && s.wiki.lat != null && opts.allowPulse !== false) {
        try {
          if (global.SNGlobe && SNGlobe.pulse)
            SNGlobe.pulse(s.wiki.lat, s.wiki.lng, 0x7ec8ff, String(s.wiki.title).slice(0, 16), 8000);
        } catch (_) {}
      }
      previewFn((s.wiki && s.wiki.title) || q.slice(0, 40));
      try {
        await consultBrain(q, s, L, previewFn);
      } catch (_) {}
      return s;
    }

    var mind = await consultBrain(q, s, L, previewFn);
    if (mind) {
      s.acted.push('mind');
      return s;
    }

    s.ask = 'I looked. I still do not have a clean read. Say it another way — place, clip, shop, or question.';
    L(s.ask, 'dim');
    previewFn('Need a hint');
    return s;
  }

  async function consultBrain(q, s, L, previewFn) {
    var ctx = '';
    if (s && s.wiki && s.wiki.text)
      ctx += 'Wiki: ' + s.wiki.title + ' — ' + String(s.wiki.text).slice(0, 240) + '\n';
    if (s && s.web && s.web[0])
      ctx += 'Web: ' + s.web[0].title + ' — ' + String(s.web[0].text || '').slice(0, 160) + '\n';
    if (s && s.places && s.places[0] && s.places[0].name)
      ctx += 'Place: ' + s.places[0].name + '\n';
    var prompt =
      'You are Astranov, SpaceNet brain. Understand ANY user input. Reply in 2 short sentences. ' +
      'If it is a place say FLY:name. If a video say WATCH:title. If food/shop say ORDER:item.\n' +
      'User: ' +
      q +
      '\nEvidence:\n' +
      (ctx || '(none yet)');
    var tip = null;
    try {
      if (global.SNSubscription && typeof SNSubscription.askPowerful === 'function') {
        tip = await SNSubscription.askPowerful(prompt, { mode: 'chat' });
      }
    } catch (_) {}
    if (!tip) {
      try {
        var mind = global.SNAstranovMind || global.SNFreeMind;
        if (mind && mind.answer) {
          var quick = mind.answer(q, { mode: 'chat' });
          if (quick && quick.text) tip = quick.text;
        }
      } catch (_) {}
    }
    if (!tip) return null;
    tip = String(tip).replace(/\s+/g, ' ').trim();
    if (!tip) return null;
    L(tip.slice(0, 360), 'ok');
    if (previewFn) previewFn(tip.slice(0, 72));
    try {
      if (global.SNAstranovMind && SNAstranovMind.teach)
        SNAstranovMind.teach(q, tip.slice(0, 220), ['understand', (s && s.kind) || 'any']);
    } catch (_) {}
    if (/^FLY:/i.test(tip) && global.SNGlobe && SNGlobe.goToPlace === false) {
      /* parsed below */
    }
    var fly = tip.match(/FLY:\s*([^\n.]+)/i);
    if (fly && fly[1] && global.SNSpaceXai && SNSpaceXai.fly) {
      try {
        await SNSpaceXai.fly(String(fly[1]).trim());
      } catch (_) {}
    }
    var watch = tip.match(/WATCH:\s*([^\n.]+)/i);
    if (watch && watch[1] && global.SNYoutube && SNYoutube.find) {
      try {
        await SNYoutube.find(String(watch[1]).trim());
      } catch (_) {}
    }
    return tip;
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
    parseSearch,
    looksVisual,
    visualize,
    realFocus,
    researchFirst,
    sense,
    consultBrain,
    showResults: showNet,
    closeResults: closeNet,
    openResult: openNetIndex,
    flyResult: flyNetIndex,
  };
})(window);
