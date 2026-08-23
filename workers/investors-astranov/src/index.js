/**
 * investors.astranov.eu — SpaceNet investor host.
 * Cloudflare terminates TLS. Origin is the live globe, rewritten to /investors.
 */
const ORIGIN = 'https://astranov.eu';

function mapPath(path) {
  if (!path || path === '/' || path === '/index.html') return '/investors/index.html';
  if (path === '/app.js') return '/investors/app.js';
  if (path === '/budget.json') return '/investors/budget.json';
  if (path.startsWith('/investors')) return path;
  if (
    path.startsWith('/media/') ||
    path.startsWith('/icon') ||
    path.startsWith('/favicon') ||
    path.startsWith('/js/')
  ) {
    return path;
  }
  return '/investors' + (path.startsWith('/') ? path : '/' + path);
}

export default {
  async fetch(request) {
    const url = new URL(request.url);
    if (url.pathname === '/__edge_health') {
      return new Response(JSON.stringify({ ok: true, host: 'investors.astranov.eu' }), {
        headers: { 'content-type': 'application/json' }
      });
    }
    const dest = ORIGIN + mapPath(url.pathname) + url.search;
    const init = {
      method: request.method,
      headers: new Headers(request.headers),
      redirect: 'follow'
    };
    init.headers.delete('host');
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      init.body = request.body;
      init.duplex = 'half';
    }
    const res = await fetch(dest, init);
    const out = new Headers(res.headers);
    out.set('x-astranov-host', 'investors.astranov.eu');
    return new Response(res.body, { status: res.status, headers: out });
  }
};
