/* chrome-ai-listen FULL · Build 20260823203000-ai-listen-hit2 · combine */
(function(){
  if (window.__snAiListenBoot) return; window.__snAiListenBoot = 1;
  var BUILD = '20260823210000-combine';
  var n = 3;
  var loaded = 0;
  function tryRun(){
    if (loaded < n) return;
    var parts = window.__snAiListenParts || [];
    var code = '';
    for (var i = 0; i < n; i++) code += (parts[i] || '');
    if (!code || code.length < 1000) { console.warn('[ai-listen] incomplete', code.length); return; }
    var s = document.createElement('script');
    s.textContent = code;
    s.setAttribute('data-sn-ai-listen','1');
    (document.head || document.documentElement).appendChild(s);
  }
  function loadOne(i){
    var s = document.createElement('script');
    s.src = '/js/spacenet/.chunks/chrome-ai-listen.' + i + '.js?v=' + BUILD;
    s.onload = function(){ loaded++; tryRun(); };
    s.onerror = function(){ console.warn('[ai-listen] chunk', i); loaded++; tryRun(); };
    (document.head || document.documentElement).appendChild(s);
  }
  for (var i = 0; i < n; i++) loadOne(i);
})();
