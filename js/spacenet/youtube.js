/* SpaceNet YouTube — CLI / AI open a video tile and watch
 * Search via Piped mirrors · play via youtube-nocookie embed
 * Commands: youtube <q> · yt <q> · watch <url|id> · play 2 · yt close
 */
(function (global) {
  'use strict';

  const Y = {
    results: [],
    lastQuery: '',
    currentId: null,
    open: false,
  };

  const PIPED = [
    'https://pipedapi.kavin.rocks',
    'https://pipedapi.adminforge.de',
    'https://api.piped.projectsegfau.lt',
    'https://pipedapi.syncpundit.io',
    'https://pipedapi.leptons.xyz',
    'https://piapi.ggtyler.dev',
  ];

  function log(msg, kind) {
    try {
      if (global.SNCli && SNCli.log) SNCli.log(msg, kind || 'dim');
    } catch (_) {}
  }
  function preview(msg) {
    try {
      if (global.SNCli && SNCli.preview) SNCli.preview(msg);
    } catch (_) {}
  }
  function esc(s) {
    return String(s || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function parseId(input) {
    const s = String(input || '').trim();
    if (!s) return null;
    const m =
      s.match(/(?:v=|youtu\.be\/|embed\/|shorts\/)([A-Za-z0-9_-]{11})/i) ||
      s.match(/^([A-Za-z0-9_-]{11})$/);
    return m ? m[1] : null;
  }

  function ensureDom() {
    let root = document.getElementById('sn-yt-tile');
    if (root) return root;
    root = document.createElement('div');
    root.id = 'sn-yt-tile';
    root.setAttribute('aria-hidden', 'true');
    root.innerHTML =
      '<div class="sn-yt-card">' +
      '<div class="sn-yt-bar">' +
      '<span class="sn-yt-title" id="sn-yt-title">YouTube</span>' +
      '<div class="sn-yt-actions">' +
      '<button type="button" id="sn-yt-ext" title="Open on YouTube">↗</button>' +
      '<button type="button" id="sn-yt-close" title="Close">×</button>' +
      '</div></div>' +
      '<div class="sn-yt-player"><iframe id="sn-yt-frame" title="YouTube" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen referrerpolicy="strict-origin-when-cross-origin"></iframe></div>' +
      '<div class="sn-yt-results" id="sn-yt-results"></div>' +
      '<div class="sn-yt-hint" id="sn-yt-hint">youtube &lt;search&gt; · watch &lt;url&gt; · play 2 · yt close</div>' +
      '</div>';
    if (!document.getElementById('sn-yt-style')) {
      const st = document.createElement('style');
      st.id = 'sn-yt-style';
      st.textContent =
        '#sn-yt-tile{position:fixed;z-index:12050;left:50%;top:12%;transform:translateX(-50%);width:min(420px,94vw);max-height:78vh;display:none;pointer-events:none}' +
        '#sn-yt-tile.open{display:block;pointer-events:auto}' +
        '#sn-yt-tile .sn-yt-card{background:rgba(8,10,14,.94);border:1px solid rgba(255,255,255,.14);border-radius:14px;box-shadow:0 18px 48px rgba(0,0,0,.55);overflow:hidden;backdrop-filter:blur(10px);display:flex;flex-direction:column;max-height:78vh}' +
        '#sn-yt-tile .sn-yt-bar{display:flex;align-items:center;gap:8px;padding:10px 12px;border-bottom:1px solid rgba(255,255,255,.08);cursor:grab;touch-action:none}' +
        '#sn-yt-tile .sn-yt-title{flex:1;font:600 13px/1.2 Inter,system-ui,sans-serif;color:#f2f2f2;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}' +
        '#sn-yt-tile .sn-yt-actions{display:flex;gap:6px}' +
        '#sn-yt-tile .sn-yt-actions button{width:32px;height:28px;border-radius:8px;border:1px solid rgba(255,255,255,.12);background:rgba(255,255,255,.06);color:#eee;font-size:16px;line-height:1;cursor:pointer}' +
        '#sn-yt-tile .sn-yt-actions button:hover{background:rgba(255,255,255,.14)}' +
        '#sn-yt-tile .sn-yt-player{position:relative;width:100%;aspect-ratio:16/9;background:#000}' +
        '#sn-yt-tile .sn-yt-player iframe{position:absolute;inset:0;width:100%;height:100%;border:0}' +
        '#sn-yt-tile .sn-yt-results{max-height:28vh;overflow:auto;padding:6px 8px;display:flex;flex-direction:column;gap:4px}' +
        '#sn-yt-tile .sn-yt-row{display:flex;gap:8px;align-items:flex-start;text-align:left;padding:8px;border-radius:10px;border:0;background:transparent;color:#ddd;cursor:pointer;font:500 12px/1.35 Inter,system-ui,sans-serif}' +
        '#sn-yt-tile .sn-yt-row:hover,#sn-yt-tile .sn-yt-row.on{background:rgba(61,158,255,.14)}' +
        '#sn-yt-tile .sn-yt-n{min-width:18px;color:#3d9eff;font-weight:700}' +
        '#sn-yt-tile .sn-yt-meta b{display:block;color:#fff;font-weight:600}' +
        '#sn-yt-tile .sn-yt-meta small{color:#9aa;font-weight:400}' +
        '#sn-yt-tile .sn-yt-hint{padding:6px 12px 10px;font:500 11px/1.3 Inter,system-ui,sans-serif;color:#888}';
      document.head.appendChild(st);
    }
    document.body.appendChild(root);
    document.getElementById('sn-yt-close')?.addEventListener('click', () => close());
    document.getElementById('sn-yt-ext')?.addEventListener('click', () => {
      if (Y.currentId) {
        global.open('https://www.youtube.com/watch?v=' + Y.currentId, '_blank', 'noopener');
      }
    });
    bindDrag(root.querySelector('.sn-yt-bar'), root);
    return root;
  }

  function bindDrag(handle, root) {
    if (!handle || handle._snYtDrag) return;
    handle._snYtDrag = true;
    let ox = 0;
    let oy = 0;
    let startX = 0;
    let startY = 0;
    function onMove(e) {
      const pt = e.touches ? e.touches[0] : e;
      const nx = ox + (pt.clientX - startX);
      const ny = oy + (pt.clientY - startY);
      root.style.left = nx + 'px';
      root.style.top = ny + 'px';
      root.style.transform = 'none';
    }
    function onUp() {
      document.removeEventListener('pointermove', onMove);
      document.removeEventListener('pointerup', onUp);
      document.removeEventListener('touchmove', onMove);
      document.removeEventListener('touchend', onUp);
    }
    handle.addEventListener('pointerdown', (e) => {
      if (e.button != null && e.button !== 0) return;
      const r = root.getBoundingClientRect();
      ox = r.left;
      oy = r.top;
      startX = e.clientX;
      startY = e.clientY;
      document.addEventListener('pointermove', onMove);
      document.addEventListener('pointerup', onUp);
    });
  }

  function showPanel(title) {
    const root = ensureDom();
    root.classList.add('open');
    root.setAttribute('aria-hidden', 'false');
    Y.open = true;
    const t = document.getElementById('sn-yt-title');
    if (t) t.textContent = title || 'YouTube';
  }

  function close() {
    stop();
    const root = document.getElementById('sn-yt-tile');
    if (root) {
      root.classList.remove('open');
      root.setAttribute('aria-hidden', 'true');
    }
    Y.open = false;
    preview('YouTube closed');
  }

  function stop() {
    const frame = document.getElementById('sn-yt-frame');
    if (frame) frame.src = 'about:blank';
    Y.currentId = null;
  }

  function renderResults(items, query) {
    const list = document.getElementById('sn-yt-results');
    if (!list) return;
    list.innerHTML = '';
    items.forEach((v, i) => {
      const row = document.createElement('button');
      row.type = 'button';
      row.className = 'sn-yt-row';
      const mins = v.duration
        ? Math.floor(v.duration / 60) + ':' + String(v.duration % 60).padStart(2, '0')
        : '';
      row.innerHTML =
        '<span class="sn-yt-n">' +
        (i + 1) +
        '</span><span class="sn-yt-meta"><b>' +
        esc(v.title) +
        '</b><small>' +
        esc(v.channel) +
        (mins ? ' · ' + mins : '') +
        '</small></span>';
      row.onclick = () => play(v.id, v, Y.lastQuery);
      list.appendChild(row);
    });
    const hint = document.getElementById('sn-yt-hint');
    if (hint) {
      hint.textContent = items.length
        ? 'Tap a result or type: play 2 · ' + (query || '')
        : 'No results — try another search or paste a YouTube link';
    }
  }

  const INVIDIOUS = [
    'https://inv.nadeko.net',
    'https://invidious.nerdvpn.de',
    'https://iv.ggtyler.dev',
    'https://invidious.fdn.fr',
    'https://yewtu.be',
    'https://invidious.privacyredirect.com',
    'https://yt.artemislena.eu',
  ];
  const LAST_PIPED = 'sn:yt-piped-base-v1';

  function mapFromYoutubeHtml(html) {
    const seen = {};
    const out = [];
    const re = /"videoId":"([A-Za-z0-9_-]{11})".{0,400}?"text":"([^"\\]{2,120})"/g;
    let m;
    while ((m = re.exec(html)) && out.length < 8) {
      if (seen[m[1]]) continue;
      seen[m[1]] = 1;
      out.push({ id: m[1], title: m[2].replace(/\\u0026/g, '&'), channel: 'YouTube', duration: 0 });
    }
    if (!out.length) {
      const re2 = /\/watch\?v=([A-Za-z0-9_-]{11})/g;
      while ((m = re2.exec(html)) && out.length < 8) {
        if (seen[m[1]]) continue;
        seen[m[1]] = 1;
        out.push({ id: m[1], title: 'YouTube · ' + m[1], channel: '', duration: 0 });
      }
    }
    return out;
  }

  async function proxyYoutubeSearch(query) {
    const target = 'https://www.youtube.com/results?search_query=' + encodeURIComponent(query) + '&sp=EgIQAQ%3D%3D';
    const proxies = [
      'https://api.allorigins.win/raw?url=' + encodeURIComponent(target),
      'https://corsproxy.io/?' + encodeURIComponent(target),
    ];
    let lastErr = '';
    for (const url of proxies) {
      try {
        const html = await (async function () {
          const c = new AbortController();
          const t = setTimeout(function () {
            c.abort();
          }, 7000);
          try {
            const r = await fetch(url, { signal: c.signal });
            if (!r.ok) throw new Error(String(r.status));
            return await r.text();
          } finally {
            clearTimeout(t);
          }
        })();
        const mapped = mapFromYoutubeHtml(String(html || ''));
        if (mapped.length) return mapped;
        lastErr = 'empty html';
      } catch (e) {
        lastErr = String(e && e.message ? e.message : e);
      }
    }
    throw new Error(lastErr || 'youtube proxy failed');
  }

  async function fetchJson(url, ms) {
    const c = new AbortController();
    const t = setTimeout(() => c.abort(), ms || 4500);
    try {
      const r = await fetch(url, {
        signal: c.signal,
        headers: { Accept: 'application/json' },
      });
      if (!r.ok) throw new Error(r.status + ' ' + url);
      return await r.json();
    } finally {
      clearTimeout(t);
    }
  }

  function mapPipedItems(items) {
    return items
      .slice(0, 8)
      .map((it, i) => {
        const url = it.url || '';
        const id = it.id || parseId(url) || parseId('https://youtube.com' + url);
        return {
          id,
          title: it.title || 'Video ' + (i + 1),
          channel: it.uploaderName || it.uploader || '',
          duration: it.duration || 0,
          thumbnail: it.thumbnail,
        };
      })
      .filter((v) => v.id);
  }

  function mapInvidiousItems(items) {
    return (Array.isArray(items) ? items : [])
      .filter((it) => it && (it.type === 'video' || it.videoId || it.video_id))
      .slice(0, 8)
      .map((it, i) => ({
        id: it.videoId || it.video_id || parseId(it.videoId),
        title: it.title || 'Video ' + (i + 1),
        channel: it.author || it.uploaderName || '',
        duration: it.lengthSeconds || it.duration || 0,
        thumbnail: (it.videoThumbnails && it.videoThumbnails[0] && it.videoThumbnails[0].url) || it.thumbnail || '',
      }))
      .filter((v) => v.id);
  }

  async function pipedSearch(query) {
    const q = encodeURIComponent(query);
    let lastErr = '';
    let bases = PIPED.slice();
    try {
      const last = localStorage.getItem(LAST_PIPED);
      if (last && bases.indexOf(last) >= 0) {
        bases = [last].concat(bases.filter((b) => b !== last));
      }
    } catch (_) {}
    for (const base of bases) {
      try {
        const items = await fetchJson(base + '/search?q=' + q + '&filter=videos', 4500);
        if (!Array.isArray(items) || !items.length) {
          lastErr = 'empty ' + base;
          continue;
        }
        const mapped = mapPipedItems(items);
        if (!mapped.length) {
          lastErr = 'no ids ' + base;
          continue;
        }
        try {
          localStorage.setItem(LAST_PIPED, base);
        } catch (_) {}
        return mapped;
      } catch (e) {
        lastErr = String(e.message || e);
      }
    }
    // Invidious fallback
    for (const base of INVIDIOUS) {
      try {
        const items = await fetchJson(base + '/api/v1/search?q=' + q + '&type=video', 4500);
        const mapped = mapInvidiousItems(items);
        if (mapped.length) return mapped;
        lastErr = 'empty inv ' + base;
      } catch (e) {
        lastErr = String(e.message || e);
      }
    }
    throw new Error(lastErr || 'search failed');
  }

  async function sameOriginSearch(query) {
    const items = await fetchJson('/api/yt-search?q=' + encodeURIComponent(query), 8000);
    const list = (items && items.items) || items;
    if (!Array.isArray(list) || !list.length) throw new Error('empty api');
    return list
      .map(function (it, i) {
        return {
          id: it.id || parseId(it.url || it.videoId),
          title: it.title || 'Video ' + (i + 1),
          channel: it.channel || it.uploaderName || '',
          duration: it.duration || 0,
        };
      })
      .filter(function (v) {
        return v.id;
      });
  }

  async function searchYoutube(query) {
    try {
      return await sameOriginSearch(query);
    } catch (_) {}
    try {
      return await pipedSearch(query);
    } catch (e1) {
      try {
        return await proxyYoutubeSearch(query);
      } catch (e2) {
        throw new Error(
          String(e1 && e1.message ? e1.message : e1) +
            ' · ' +
            String(e2 && e2.message ? e2.message : e2)
        );
      }
    }
  }

  async function play(videoId, meta, searchQuery) {
    const id = parseId(videoId);
    if (!id) {
      log('Invalid video id', 'err');
      return { ok: false, error: 'invalid' };
    }
    Y.currentId = id;
    const title = (meta && meta.title) || id;
    showPanel(title.slice(0, 64));
    const frame = document.getElementById('sn-yt-frame');
    if (frame) {
      frame.src =
        'https://www.youtube-nocookie.com/embed/' +
        id +
        '?autoplay=1&rel=0&modestbranding=1&playsinline=1';
    }
    const list = document.getElementById('sn-yt-results');
    if (list) {
      Array.from(list.querySelectorAll('.sn-yt-row')).forEach((row, i) => {
        row.classList.toggle('on', Y.results[i] && Y.results[i].id === id);
      });
    }
    log('▶ ' + title.slice(0, 90), 'ok');
    preview('▶ ' + title.slice(0, 48));
    try {
      if (global.SNCli && SNCli.depict) SNCli.depict('video', { label: title.slice(0, 40) });
    } catch (_) {}
    try {
      if (global.SNGlobe && SNGlobe.pulse && global._snLastPos) {
        SNGlobe.pulse(_snLastPos.lat, _snLastPos.lng, 0xff4466, 'YT', 12000);
      }
    } catch (_) {}
    return { ok: true, id, title };
  }

  async function find(query) {
    const q = String(query || '').trim();
    Y.lastQuery = q;
    if (!q) {
      log('Usage: youtube <search> · watch <url> · play 2', 'dim');
      preview('youtube <search>');
      return { ok: false, error: 'empty' };
    }
    const direct = parseId(q);
    if (direct) {
      return play(direct, { title: q }, q);
    }
    showPanel('Searching…');
    log('YouTube · ' + q, 'cmd');
    preview('Searching YouTube…');
    try {
      const items = await searchYoutube(q);
      Y.results = items;
      renderResults(items, q);
      if (!items.length) {
        log('No videos found', 'err');
        return { ok: false, error: 'empty' };
      }
      items.forEach((v, i) => {
        log((i + 1) + '. ' + v.title.slice(0, 72) + (v.channel ? ' · ' + v.channel : ''), 'dim');
      });
      await play(items[0].id, items[0], q);
      return { ok: true, count: items.length };
    } catch (e) {
      const msg = String(e.message || e);
      showPanel(q.slice(0, 64));
      const frame = document.getElementById('sn-yt-frame');
      if (frame) {
        frame.src =
          'https://www.youtube-nocookie.com/embed?listType=search&list=' + encodeURIComponent(q);
      }
      const list = document.getElementById('sn-yt-results');
      if (list) {
        list.innerHTML =
          '<button type="button" class="sn-yt-row" id="sn-yt-open-search"><span class="sn-yt-n">↗</span><span class="sn-yt-meta"><b>Open this search on YouTube</b><small>' +
          esc(q) +
          '</small></span></button>';
        const btn = document.getElementById('sn-yt-open-search');
        if (btn)
          btn.onclick = function () {
            global.open(
              'https://www.youtube.com/results?search_query=' + encodeURIComponent(q),
              '_blank',
              'noopener'
            );
          };
      }
      log('YouTube · searching the site for · ' + q, 'ok');
      log('If the player is empty, tap the row to open YouTube.', 'dim');
      preview('YouTube · ' + q.slice(0, 40));
      return { ok: true, fallback: true, error: msg };
    }
  }

  async function playIndex(n) {
    const idx = parseInt(n, 10) - 1;
    const v = Y.results[idx];
    if (!v) {
      log('No result #' + n + ' · search first with youtube <query>', 'err');
      return { ok: false };
    }
    return play(v.id, v, Y.lastQuery);
  }

  function wantsYoutube(text) {
    const raw = String(text || '').trim();
    const low = raw.toLowerCase();
    if (!low) return false;
    if (parseId(raw)) return true;
    if (/youtube|youtu\.be|\byt\b/.test(low)) return true;
    if (/\b(clip|clips|βίντεο|βιντεο|trailer|lyrics?|\bmv\b|music\s+video|official\s+video|episode|music video)\b/.test(low))
      return true;
    if (/\b(watch|play|show)\b/.test(low) && /\b(video|clip|song|track|film|movie)\b/.test(low)) return true;
    if (/^(search|find|look\s+up|google)\b/.test(low) && /\b(video|clip|youtube|song|track|trailer)\b/.test(low))
      return true;
    return false;
  }

  function looksLikeClipTitle(text) {
    const t = String(text || '')
      .replace(/^(search|find|look\s+up|google|show\s+me)\s+/i, '')
      .trim();
    if (t.length < 6 || t.length > 90) return false;
    if (/[?]/.test(t)) return false;
    const words = t.split(/\s+/);
    if (words.length < 2 || words.length > 10) return false;
    if (/^(who|what|where|why|how|when|can|please|make|build|fix|order|locate|fly|go)\b/i.test(t)) return false;
    if (
      /\b(tokyo|paris|london|athens|rhodes|rodos|mars|earth|moon|vodi|facility|street|road|harbour|harbor|airport|island|city)\b/i.test(
        t
      )
    )
      return false;
    return true;
  }

  function queryFromText(text) {
    return String(text || '')
      .replace(/^(search|find|look\s+up|google|show\s+me)\s+/i, '')
      .replace(/\s+on\s+(youtube|yt)\s*$/i, '')
      .replace(/^(on\s+)?(youtube|yt)\s+/i, '')
      .replace(
        /^(youtube|yt|watch|clip|video\s+find|find\s+videos?\s+(about|on|for)?|find\s+me\s+a\s+video\s+(about|on|for)?|watch\s+videos?\s+(about|on|for)?|play\s+(me\s+)?(a\s+)?video\s+(about|on|for)?|show\s+me\s+(a\s+)?video\s+(about|on|for)?|βίντεο\s+(για|στο)?|δες\s+βίντεο\s+(για|στο)?|παρακολούθησε|άνοιξε\s+youtube|ανοιξε\s+youtube)\s*/i,
        ''
      )
      .replace(/\s+(clip|video|βίντεο|βιντεο)\s*$/i, '')
      .trim();
  }

  function init() {
    ensureDom();
  }

  global.SNYoutube = {
    init,
    find,
    play,
    playIndex,
    close,
    stop,
    showPanel,
    parseId,
    wantsYoutube,
    looksLikeClipTitle,
    queryFromText,
    get open() {
      return Y.open;
    },
    get currentId() {
      return Y.currentId;
    },
    get results() {
      return Y.results.slice();
    },
  };
})(window);
