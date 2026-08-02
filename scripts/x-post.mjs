#!/usr/bin/env node
/**
 * Secure X post as @astranov97250 — OAuth 1.0a user context.
 * Keys from .env.x only (gitignored). Never hardcode secrets.
 *
 * Usage:
 *   node scripts/x-post.mjs --dry-run
 *   node scripts/x-post.mjs "text of post"
 *   node scripts/x-post.mjs --file support/SOCIAL-LAUNCH-PACK.md
 */
import { readFileSync, existsSync } from 'node:fs';
import { createHmac, randomBytes } from 'node:crypto';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const ENV_PATH = resolve(ROOT, '.env.x');

function loadEnv(path) {
  if (!existsSync(path)) return {};
  const out = {};
  for (const line of readFileSync(path, 'utf8').split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const i = t.indexOf('=');
    if (i < 0) continue;
    const k = t.slice(0, i).trim();
    let v = t.slice(i + 1).trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'")))
      v = v.slice(1, -1);
    out[k] = v;
  }
  return out;
}

function pct(s) {
  return encodeURIComponent(s).replace(/[!'()*]/g, (c) =>
    '%' + c.charCodeAt(0).toString(16).toUpperCase()
  );
}

function oauthHeader(method, url, query, bodyParams, keys) {
  const oauth = {
    oauth_consumer_key: keys.apiKey,
    oauth_nonce: randomBytes(16).toString('hex'),
    oauth_signature_method: 'HMAC-SHA1',
    oauth_timestamp: String(Math.floor(Date.now() / 1000)),
    oauth_token: keys.accessToken,
    oauth_version: '1.0',
  };
  const all = { ...query, ...bodyParams, ...oauth };
  const paramStr = Object.keys(all)
    .sort()
    .map((k) => pct(k) + '=' + pct(String(all[k])))
    .join('&');
  const base = [method.toUpperCase(), pct(url), pct(paramStr)].join('&');
  const signingKey = pct(keys.apiSecret) + '&' + pct(keys.accessSecret);
  oauth.oauth_signature = createHmac('sha1', signingKey).update(base).digest('base64');
  const header =
    'OAuth ' +
    Object.keys(oauth)
      .sort()
      .map((k) => pct(k) + '="' + pct(oauth[k]) + '"')
      .join(', ');
  return header;
}

async function postTweet(text, keys) {
  // X API v2 create tweet
  const url = 'https://api.x.com/2/tweets';
  const body = JSON.stringify({ text });
  const auth = oauthHeader('POST', url, {}, {}, keys);
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: auth,
      'Content-Type': 'application/json',
      'User-Agent': 'AstranovXPost/1.0',
    },
    body,
  });
  const raw = await res.text();
  let data;
  try {
    data = JSON.parse(raw);
  } catch {
    data = { raw };
  }
  if (!res.ok) {
    const err = new Error('X post failed HTTP ' + res.status);
    err.detail = data;
    throw err;
  }
  return data;
}

async function verifyCreds(keys) {
  const url = 'https://api.x.com/1.1/account/verify_credentials.json';
  const auth = oauthHeader('GET', url, { skip_status: 'true' }, {}, keys);
  const res = await fetch(url + '?skip_status=true', {
    headers: { Authorization: auth, 'User-Agent': 'AstranovXPost/1.0' },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error('verify failed HTTP ' + res.status);
    err.detail = data;
    throw err;
  }
  return data;
}

const env = { ...process.env, ...loadEnv(ENV_PATH) };
const keys = {
  apiKey: env.X_API_KEY || env.TWITTER_API_KEY || '',
  apiSecret: env.X_API_SECRET || env.TWITTER_API_SECRET || '',
  accessToken: env.X_ACCESS_TOKEN || env.TWITTER_ACCESS_TOKEN || '',
  accessSecret: env.X_ACCESS_TOKEN_SECRET || env.TWITTER_ACCESS_TOKEN_SECRET || '',
};
const handle = env.X_HANDLE || 'astranov97250';

const args = process.argv.slice(2);
const dry = args.includes('--dry-run');
const fileIdx = args.indexOf('--file');
let text = '';
if (fileIdx >= 0) {
  text = readFileSync(resolve(ROOT, args[fileIdx + 1]), 'utf8').slice(0, 280);
} else {
  text = args.filter((a) => a !== '--dry-run' && a !== '--file').join(' ').trim();
}

const missing = Object.entries(keys)
  .filter(([, v]) => !v)
  .map(([k]) => k);
if (missing.length) {
  console.error('Missing keys in .env.x:', missing.join(', '));
  console.error('Copy .env.x.example → .env.x and fill (never commit). See secrets/README.md');
  process.exit(2);
}

if (dry) {
  console.log('dry-run OK · keys present · handle target', handle);
  try {
    const me = await verifyCreds(keys);
    console.log('verified @' + (me.screen_name || me.username || '?'), 'id', me.id_str || me.id);
  } catch (e) {
    console.error('verify failed', e.message, e.detail || '');
    process.exit(1);
  }
  process.exit(0);
}

if (!text) {
  console.error('Usage: node scripts/x-post.mjs "your post"');
  process.exit(2);
}
if (text.length > 280) {
  console.error('Text too long', text.length);
  process.exit(2);
}

try {
  const me = await verifyCreds(keys);
  const sn = me.screen_name || '';
  if (sn && sn.toLowerCase() !== handle.toLowerCase()) {
    console.warn('WARN token user @' + sn + ' ≠ expected @' + handle);
  }
  const out = await postTweet(text, keys);
  const id = out?.data?.id;
  console.log('POSTED', id ? 'https://x.com/' + (sn || handle) + '/status/' + id : JSON.stringify(out));
} catch (e) {
  console.error('FAIL', e.message);
  if (e.detail) console.error(JSON.stringify(e.detail, null, 2));
  process.exit(1);
}
