/**
 * Astranov origin proxy — multi-origin failover
 * Order: Vercel stable → jsDelivr → CF Pages → GitHub raw (last)
 * Never single-point github-sha (429/403 kills domain).
 */
const VERCEL = 'https://astranov-astranov.vercel.app';
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
    return await fetch(url, init);
  } catch {
    return null;
  }
}

export default {
  async fetch(request, env) {
    const vercelOrigin = (env.VERCEL_ORIGIN || VERCEL).replace(/\/$/, '');
    const pagesOrigin = (env.ORIGIN || PAGES).replace(/\/$/, '');
    const url = new URL(request.url);
    const path = url.pathname;

    // Health for ops — does not depend on origins
    if (path === '/__edge_health') {
      return new Response(JSON.stringify({ ok: true, worker: 'astranov-origin-proxy', v: 3 }), {
        headers: { 'content-type': 'application/json', 'access-control-allow-origin': '*' },
      });
    }

    const init = {
      method: request.method === 'HEAD' ? 'GET' : request.method,
      headers: new Headers(request.headers),
      redirect: 'follow',
      cf: { cacheTtl: path.endsWith('.js') || path.endsWith('.css') ? 120 : 30 },
    };
    init.headers.delete('host');
    init.headers.delete('cookie');
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      init.body = request.body;
      init.duplex = 'half';
    }

    // Prefer hosts that do not rate-limit GitHub raw
    const candidates = [
      { url: new URL(path + url.search, vercelOrigin + '/').toString(), tag: 'vercel' },
      { url: jsdelivr(path) + (url.search || ''), tag: 'jsdelivr' },
      { url: new URL(path + url.search, pagesOrigin + '/').toString(), tag: 'pages' },
      { url: githubRaw(path) + (url.search || ''), tag: 'github-raw' },
    ];

    let last = null;
    const fails = [];
    for (const c of candidates) {
      const res = await tryFetch(c.url, init);
      if (!res) {
        fails.push(c.tag + ':network');
        continue;
      }
      last = res;
      if (res.status === 429 || res.status === 403) {
        fails.push(c.tag + ':' + res.status);
        continue;
      }
      if (res.status >= 500) {
        fails.push(c.tag + ':' + res.status);
        continue;
      }
      if (res.ok || (res.status >= 300 && res.status < 400)) {
        const out = new Headers(res.headers);
        out.set('x-astranov-proxy', c.tag);
        out.set('x-astranov-origin', c.url.split('?')[0]);
        out.set('access-control-allow-origin', '*');
        if (path === '/' || path.endsWith('.html')) {
          out.set('cache-control', 'no-store, max-age=0, must-revalidate');
        } else if (path.includes('/js/')) {
          out.set('cache-control', 'public, max-age=60, must-revalidate');
        }
        if (path.endsWith('.js') && !out.get('content-type')?.includes('javascript')) {
          out.set('content-type', 'application/javascript; charset=utf-8');
        }
        return new Response(res.body, { status: res.status, statusText: res.statusText, headers: out });
      }
      fails.push(c.tag + ':' + res.status);
    }

    const msg = 'Astranov edge error: ' + (fails.join(' · ') || 'all origins down');
    return new Response(msg, {
      status: 502,
      headers: {
        'content-type': 'text/plain; charset=utf-8',
        'x-astranov-proxy': 'fail',
        'access-control-allow-origin': '*',
      },
    });
  },
};
