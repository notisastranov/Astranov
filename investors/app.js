/* investors.astranov.eu · 20260823190000-investors */
(function () {
  'use strict';
  var OWNER = 'notisastranov@gmail.com';
  var SB_URL = 'https://lkoatrkhuigdolnjsbie.supabase.co';
  var SB_KEY =
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxrb2F0cmtodWlnZG9sbmpzYmllIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg4ODIwOTIsImV4cCI6MjA5NDQ1ODA5Mn0.qf6Kg93YLJ0coTdVQa4baU0ppOdFY5WkmVzMvEV6ejI';
  var deck = { packages: [], model: { ops: 40, owner: 30, village: 30 }, disclaimer: '' };
  var tab = 'phase1';
  var owner = false;
  var sb = null;
  var session = null;

  function eur(k) {
    k = Number(k) || 0;
    if (Math.abs(k) >= 1000) return '€' + (k / 1000).toFixed(2).replace(/\.00$/, '') + 'M';
    return '€' + Math.round(k) + 'k';
  }
  function vat(k) {
    return Math.round((Number(k) || 0) * 0.24);
  }
  function rowsFor() {
    return (deck.packages || []).filter(function (p) {
      if (tab === 'phase1') return p.phase === 1;
      if (tab === 'later') return p.phase === 2;
      if (tab === 'restore') return /restore|eco-stays/.test(p.id + p.name);
      return true;
    });
  }
  function sum(list) {
    return list.reduce(function (a, p) {
      return a + (Number(p.capex) || 0);
    }, 0);
  }

  function renderModel() {
    document.getElementById('disclaimer').textContent = deck.disclaimer || '';
    var m = deck.model || {};
    document.getElementById('model').innerHTML =
      '<div class="pill"><b>' + (m.ops || 40) + '%</b>Operations · local wages</div>' +
      '<div class="pill"><b>' + (m.owner || 30) + '%</b>Owner yield · title stays</div>' +
      '<div class="pill"><b>' + (m.village || 30) + '%</b>Village company · next house</div>';
  }

  function renderTabs() {
    var host = document.getElementById('tabs');
    host.innerHTML = '';
    ;[
      ['phase1', 'Phase 1'],
      ['restore', 'Village restore'],
      ['all', 'All lines'],
      ['later', 'Not in Phase 1']
    ].forEach(function (it) {
      var b = document.createElement('button');
      b.type = 'button';
      b.textContent = it[1];
      if (tab === it[0]) b.className = 'on';
      b.onclick = function () {
        tab = it[0];
        render();
      };
      host.appendChild(b);
    });
  }

  function td(text, cls) {
    var c = document.createElement('td');
    if (cls) c.className = cls;
    c.textContent = text == null ? '' : String(text);
    return c;
  }

  function renderTable() {
    var table = document.getElementById('deck');
    table.classList.toggle('edit', owner);
    table.querySelector('thead').innerHTML =
      '<tr><th></th><th>Project</th><th>Place</th><th>What</th><th>CAPEX</th><th>Note</th>' +
      (owner ? '<th></th>' : '') +
      '</tr>';
    var tb = table.querySelector('tbody');
    tb.innerHTML = '';
    var list = rowsFor();
    list.forEach(function (p) {
      var tr = document.createElement('tr');
      tr.dataset.id = p.id;
      tr.dataset.phase = String(p.phase || 1);
      var imgTd = document.createElement('td');
      var img = document.createElement('img');
      img.className = 'thumb';
      img.src = p.photo || '/icon.png';
      img.alt = p.name;
      img.onclick = function () {
        var lb = document.getElementById('lightbox');
        lb.querySelector('img').src = p.photo;
        lb.classList.add('open');
      };
      imgTd.appendChild(img);
      tr.appendChild(imgTd);
      var name = td(p.name);
      var place = td(p.place);
      var unit = td(p.unit);
      var cap = td(eur(p.capex), 'n');
      cap.dataset.raw = String(p.capex);
      var note = td(p.note || '');
      note.className = 'note';
      if (owner) {
        ;[name, place, unit, note].forEach(function (c) {
          c.contentEditable = 'true';
        });
        cap.contentEditable = 'true';
        cap.textContent = String(p.capex);
      }
      tr.appendChild(name);
      tr.appendChild(place);
      tr.appendChild(unit);
      tr.appendChild(cap);
      tr.appendChild(note);
      if (owner) {
        var del = document.createElement('td');
        var b = document.createElement('button');
        b.type = 'button';
        b.textContent = '×';
        b.onclick = function () {
          deck.packages = deck.packages.filter(function (x) {
            return x.id !== p.id;
          });
          render();
        };
        del.appendChild(b);
        tr.appendChild(del);
      }
      tb.appendChild(tr);
    });
    var net = sum(list);
    var ft = table.querySelector('tfoot');
    var span = owner ? 6 : 5;
    ft.innerHTML =
      '<tr><td colspan="' + span + '">Subtotal net</td><td class="n">' + eur(net) + '</td></tr>' +
      '<tr><td colspan="' + span + '">VAT 24%</td><td class="n">' + eur(vat(net)) + '</td></tr>' +
      '<tr><td colspan="' + span + '">Total if VAT applies in full</td><td class="n">' + eur(net + vat(net)) + '</td></tr>';
    if (tab === 'all' || tab === 'phase1') {
      var p1 = sum((deck.packages || []).filter(function (p) { return p.phase === 1; }));
      var p2 = sum((deck.packages || []).filter(function (p) { return p.phase === 2; }));
      ft.innerHTML +=
        '<tr><td colspan="' + span + '">Phase 1 grand net</td><td class="n">' + eur(p1) + '</td></tr>' +
        '<tr><td colspan="' + span + '">Held out (lake + pontoon)</td><td class="n">' + eur(p2) + '</td></tr>' +
        '<tr><td colspan="' + span + '">All lines net</td><td class="n">' + eur(p1 + p2) + '</td></tr>';
    }
  }

  function harvest() {
    var rows = document.querySelectorAll('#deck tbody tr');
    rows.forEach(function (tr) {
      var id = tr.dataset.id;
      var p = (deck.packages || []).filter(function (x) { return x.id === id; })[0];
      if (!p) return;
      var cells = tr.querySelectorAll('td');
      p.name = cells[1].textContent.trim();
      p.place = cells[2].textContent.trim();
      p.unit = cells[3].textContent.trim();
      var cap = parseFloat(String(cells[4].textContent).replace(/[^\d.]/g, ''));
      if (!isNaN(cap)) p.capex = cap;
      p.note = cells[5].textContent.trim();
    });
  }

  function render() {
    renderModel();
    renderTabs();
    renderTable();
    document.getElementById('owner-bar').classList.toggle('hidden', !owner);
  }

  function setWho() {
    var el = document.getElementById('who');
    var btn = document.getElementById('auth-btn');
    if (owner) {
      el.textContent = 'Owner · editing on';
      btn.textContent = 'Sign out';
    } else if (session && session.user) {
      el.textContent = session.user.email + ' · view only';
      btn.textContent = 'Sign out';
    } else {
      el.textContent = 'Public view';
      btn.textContent = 'Owner login';
    }
  }

  async function bootAuth() {
    sb = window.supabase.createClient(SB_URL, SB_KEY, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, storageKey: 'astranov_auth_v2' }
    });
    var got = await sb.auth.getSession();
    session = got.data.session || null;
    owner = !!(session && String(session.user.email || '').toLowerCase() === OWNER);
    sb.auth.onAuthStateChange(function (_e, s) {
      session = s;
      owner = !!(s && String(s.user.email || '').toLowerCase() === OWNER);
      setWho();
      render();
    });
    setWho();
  }

  async function loadDeck() {
    var seed = await fetch('/investors/budget.json?v=20260823190000-investors').then(function (r) { return r.json(); });
    deck = seed;
    try {
      var remote = await fetch(SB_URL + '/functions/v1/investor-budget', {
        headers: { apikey: SB_KEY, Authorization: 'Bearer ' + SB_KEY }
      }).then(function (r) { return r.json(); });
      if (remote && remote.payload && remote.payload.packages) deck = remote.payload;
      else {
        var row = await sb.from('investor_budget').select('payload').eq('id', 'deck-v1').maybeSingle();
        if (row.data && row.data.payload && row.data.payload.packages) deck = row.data.payload;
      }
    } catch (_) {}
    render();
  }

  async function save() {
    if (!owner) return;
    harvest();
    var st = document.getElementById('save-status');
    st.textContent = 'Saving…';
    try {
      var token = session && session.access_token;
      var r = await fetch(SB_URL + '/functions/v1/investor-budget', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: SB_KEY,
          Authorization: 'Bearer ' + token
        },
        body: JSON.stringify({ payload: deck })
      });
      var j = await r.json().catch(function () { return {}; });
      if (!r.ok) {
        var rpc = await sb.rpc('investor_budget_save', { p_payload: deck });
        if (rpc.error) throw new Error(rpc.error.message || j.error || 'save failed');
      }
      st.textContent = 'Saved';
      render();
    } catch (e) {
      st.textContent = 'Save failed · ' + (e.message || 'login as owner');
    }
  }

  async function login() {
    if (session) {
      await sb.auth.signOut();
      return;
    }
    var redirect = location.origin + location.pathname.replace(/\/$/, '') + '/';
    await sb.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: redirect }
    });
  }

  document.getElementById('auth-btn').onclick = login;
  document.getElementById('save').onclick = save;
  document.getElementById('add-row').onclick = function () {
    if (!owner) return;
    harvest();
    deck.packages.push({
      id: 'new-' + Date.now(),
      name: 'New line',
      place: '',
      phase: tab === 'later' ? 2 : 1,
      capex: 0,
      unit: '',
      photo: '/icon.png',
      note: ''
    });
    render();
  };
  document.getElementById('lightbox').onclick = function () {
    this.classList.remove('open');
  };

  bootAuth().then(loadDeck);
})();
