/* SpaceNet Presence client shell · 20260823200000-presence */
(function () {
  'use strict';
  var site = null;
  var frame = document.getElementById('sn-back');

  function hostId() {
    var h = (location.hostname || '').toLowerCase();
    var q = new URLSearchParams(location.search).get('site');
    if (q) return q;
    if (h.indexOf('investors.') === 0) return 'investors';
    var sub = h.split('.')[0];
    if (sub && sub !== 'www' && sub !== 'astranov') return sub;
    return 'investors';
  }

  function tell(msg) {
    try {
      frame.contentWindow.postMessage(Object.assign({ sn: 'presence' }, msg), 'https://astranov.eu');
    } catch (_) {}
  }

  function render() {
    if (!site) return;
    document.title = site.name + ' · SpaceNet';
    document.getElementById('name').textContent = (site.profile && site.profile.name) || site.name;
    document.getElementById('blurb').textContent = (site.profile && site.profile.blurb) || '';
    document.getElementById('pic').src = (site.profile && site.profile.picture) || 'https://astranov.eu/icon.png';
    var host = document.getElementById('cards');
    host.innerHTML = '';
    (site.projects || []).forEach(function (p) {
      var el = document.createElement('button');
      el.type = 'button';
      el.className = 'card';
      el.innerHTML =
        '<img src="' + (p.photo || 'https://astranov.eu/icon.png') + '" alt="">' +
        '<div class="p"><b>' + p.name + '</b><span>' + (p.place || '') + '</span><em>' + (p.preview || '') + '</em></div>';
      el.onclick = function () {
        host.querySelectorAll('.card').forEach(function (c) { c.classList.remove('on'); });
        el.classList.add('on');
        tell({ op: 'fly', lat: p.lat, lng: p.lng, label: p.name, tier: 'city' });
        tell({ op: 'open', id: p.id });
      };
      host.appendChild(el);
    });
    document.getElementById('planet').onclick = function () {
      tell({ op: 'planet' });
      tell({ op: 'glow', pins: site.projects });
    };
  }

  function bootFrame() {
    var mode = (site && site.mode) || 'planet';
    frame.src = 'https://astranov.eu/?embed=presence&site=' + encodeURIComponent(site.id) + '&mode=' + mode;
  }

  window.addEventListener('message', function (e) {
    if (e.origin !== 'https://astranov.eu') return;
    var d = e.data || {};
    if (d.sn === 'presence' && d.op === 'ready' && site) {
      if (site.mode === 'planet') tell({ op: 'planet' });
      else if (site.projects && site.projects[0])
        tell({ op: 'fly', lat: site.projects[0].lat, lng: site.projects[0].lng, label: site.projects[0].name });
      tell({ op: 'glow', pins: site.projects });
    }
  });

  fetch('sites.json?v=20260823200000-presence')
    .then(function (r) { return r.json(); })
    .then(function (j) {
      var id = hostId();
      var list = (j && j.sites) || [];
      site = list.filter(function (s) { return s.id === id || s.host === location.hostname; })[0] || list[0];
      render();
      bootFrame();
    })
    .catch(function () {
      site = { id: 'investors', mode: 'planet', name: 'Astranov', profile: { name: 'Astranov', picture: 'https://astranov.eu/icon.png', blurb: 'SpaceNet presence' }, projects: [] };
      render();
      bootFrame();
    });
})();
