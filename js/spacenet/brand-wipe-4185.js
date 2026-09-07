/* SpaceNet 4185 — island / home tap wipes SW+caches and leaves frozen 4174. */
(function(){
  if(window.__snWipe4185) return;
  window.__snWipe4185=true;
  var FALLBACK="4185";
  var going=false;
  function line(t){ var el=document.getElementById("line"); if(el) el.textContent=t; }
  function dest(v){
    var n=String(v||FALLBACK).replace(/[^\d]/g,"")||FALLBACK;
    return "/boot?v="+n+"&t="+Date.now()+"&wipe=1";
  }
  function go(v){ if(going) return; going=true; location.replace(dest(v)); }
  function wipe(e){
    if(e){
      if(e.target&&e.target.closest&&e.target.closest("#sn-money")) return;
      if(e.type==="click"||e.type==="pointerup"){
        if(!e.target||!e.target.closest||!e.target.closest("#island")) return;
        e.preventDefault();
        if(e.stopImmediatePropagation) e.stopImmediatePropagation();
      }
    }
    line("Wiping caches · loading latest…");
    var tasks=[];
    try{ if(window.caches) tasks.push(caches.keys().then(function(ks){ return Promise.all(ks.map(function(k){ return caches.delete(k); })); })); }catch(err){}
    try{ if(navigator.serviceWorker) tasks.push(navigator.serviceWorker.getRegistrations().then(function(rs){ return Promise.all(rs.map(function(r){ return r.unregister(); })); })); }catch(err){}
    Promise.all(tasks).then(function(){
      return fetch("/VERSION?t="+Date.now(),{cache:"no-store"}).then(function(r){ return r.text(); }).then(function(t){
        var m=String(t||"").match(/(\d{4,})/); go(m?m[1]:FALLBACK);
      }).catch(function(){ go(FALLBACK); });
    }).catch(function(){ go(FALLBACK); });
    setTimeout(function(){ go(FALLBACK); }, 1800);
  }
  window.SNReboot=wipe;
  document.addEventListener("click", wipe, true);
  document.addEventListener("pointerup", wipe, true);
  try{
    var meta=document.querySelector('meta[name="astranov-build"]');
    var docV=meta?parseInt(meta.getAttribute("content"),10):0;
    var q=location.search||"";
    var onBoot=/\/boot(?:\.html)?(?:[?#]|$)/.test(location.pathname||"");
    if(docV && docV<4185 && q.indexOf("wipe=1")===-1 && !onBoot && !sessionStorage.getItem("snWipe4185")){
      sessionStorage.setItem("snWipe4185","1");
      fetch("/VERSION?t="+Date.now(),{cache:"no-store"}).then(function(r){ return r.text(); }).then(function(t){
        var m=String(t||"").match(/(\d{4,})/);
        var live=m?parseInt(m[1],10):4185;
        if(!live || live>=4185 || live>docV) wipe();
        else wipe();
      }).catch(function(){ wipe(); });
    }
  }catch(err){}
})();

