/**
 * Astranov origin — SpaceXAI era
 * Prefer CF Pages; fallback jsDelivr GitHub raw (avoids raw.githubusercontent rate limit 429/403).
 */
const PAGES = 'https://astranov.pages.dev';
const GH_OWNER = 'notisastranov';
const GH_REPO = 'astranov.eu';
const GH_BRANCH = 'main';

function jsdelivr(path) {
  const p = path === '/' || path === '' ? 'index.html' : path.replace(/^\//, '');
  return `https://cdn.jsdelivr.net/gh/${GH_OWNER}/${GH_REPO}@${GH_BRANCH}/${p}`;
}

function githubRaw(path) {
  const p = path === '/' || path === '' ? 'index.html' : path.replace(/^\//, '');
  return `https://raw.githubusercontent.com/${GH_OWNER}/${GH_REPO}/${GH_BRANCH}/${p}`;
}

async function tryFetch(url, init) {
  try {
    const res = await fetch(url, init);
    if (res.ok) return res;
    return res;
  } catch (e) {
    return null;
  }
}

export default {
  async fetch(request, env) {
    const pagesOrigin = (env.ORIGIN || PAGES).replace(/\/$/, '');
    const url = new URL(request.url);
    const path = url.pathname;

    const init = {
      method: request.method === 'HEAD' ? 'GET' : request.method,
      headers: new Headers(request.headers),
      redirect: 'follow',
      cf: { cacheTtl: path.endsWith('.js') || path.endsWith('.css') ? 300 : 60 },
    };
    init.headers.delete('host');
    init.headers.delete('cookie');
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      init.body = request.body;
      init.duplex = 'half';
    }

    const candidates = [
      { url: new URL(path + url.search, pagesOrigin + '/').toString(), tag: 'pages' },
      { url: jsdelivr(path) + url.search, tag: 'jsdelivr' },
      { url: githubRaw(path) + url.search, tag: 'github-raw' },
    ];

    let last = null;
    for (const c of candidates) {
      const res = await tryFetch(c.url, init);
      if (!res) continue;
      last = res;
      // treat rate limit / forbidden as fail-over
      if (res.status === 429 || res.status === 403) continue;
      if (res.status >= 500) continue;
      if (res.ok || (res.status >= 300 && res.status < 400)) {
        const out = new Headers(res.headers);
        out.set('x-astranov-proxy', c.tag);
        out.set('x-astranov-origin', c.url.split('?')[0]);
        out.set('access-control-allow-origin', '*');
        if (path === '/' || path.endsWith('.html')) {
          out.set('cache-control', 'no-store, max-age=0, must-revalidate');
        } else if (path.includes('/js/')) {
          out.set('cache-control', 'public, max-age=120, must-revalidate');
        }
        // Ensure JS MIME
        if (path.endsWith('.js') && !out.get('content-type')?.includes('javascript')) {
          out.set('content-type', 'application/javascript; charset=utf-8');
        }
        return new Response(res.body, { status: res.status, statusText: res.statusText, headers: out });
      }
    }

    const msg =
      'Astranov edge error: all origins failed' +
      (last ? ' last=' + last.status : '');
    return new Response(msg, {
      status: 502,
      headers: { 'content-type': 'text/plain; charset=utf-8', 'x-astranov-proxy': 'fail' },
    });
  },
};
