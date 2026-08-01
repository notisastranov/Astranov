#!/usr/bin/env node
/**
 * Poll Astranov coding bridge (owner notes from CLI → agent).
 * Usage: node scripts/poll-bridge.mjs
 */
const SB =
  process.env.SB_URL ||
  process.env.SUPABASE_URL ||
  'https://lkoatrkhuigdolnjsbie.supabase.co';

const urls = [
  SB.replace(/\/$/, '') + '/storage/v1/object/public/debug-pub/owner-inbox.json',
  SB.replace(/\/$/, '') + '/storage/v1/object/public/debug-pub/live-bridge.json',
];

async function main() {
  const out = { at: new Date().toISOString(), notes: [] };
  for (const url of urls) {
    try {
      const r = await fetch(url + '?t=' + Date.now(), { cache: 'no-store' });
      if (!r.ok) {
        out[url] = 'HTTP ' + r.status;
        continue;
      }
      const j = await r.json();
      out[url.split('/').pop()] = {
        seq: j.seq,
        from: j.from,
        received_at: j.received_at,
        note: j.note || '',
        notes: j.notes || [],
        cmds: j.cmds || [],
      };
      const bag = Array.isArray(j.notes) ? j.notes : [];
      if (j.note) bag.unshift({ text: j.note, from: j.from, at: j.received_at });
      for (const n of bag) {
        const text = (n && (n.text || n.note || n.msg)) || '';
        if (text) out.notes.push({ text, from: n.from || j.from, at: n.at || j.received_at, source: url.split('/').pop() });
      }
      // cmds with owner_note
      for (const c of j.cmds || []) {
        if (c && (c.op === 'owner_note' || c.op === 'note' || c.op === 'fix') && c.text) {
          out.notes.push({ text: c.text, from: c.from || j.from, at: j.received_at, source: 'cmd' });
        }
      }
    } catch (e) {
      out[url] = String(e.message || e);
    }
  }
  // dedupe by text
  const seen = new Set();
  out.notes = out.notes.filter((n) => {
    const k = n.text.slice(0, 200);
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
  console.log(JSON.stringify(out, null, 2));
  if (out.notes.length) {
    console.error('\n--- Owner notes for agent (' + out.notes.length + ') ---');
    out.notes.slice(0, 15).forEach((n, i) => {
      console.error(i + 1 + '. [' + (n.from || '?') + '] ' + n.text.slice(0, 200));
    });
  } else {
    console.error('\n(no owner notes yet — user: agent <text> or bridge test)');
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
