(function(){
"use strict";
if(window.__SN_GRID_OS)return;
// bootstrap last good kernel then center patches
var s=document.createElement('script');
s.src='https://cdn.jsdelivr.net/gh/notisastranov/astranov.eu@1c4e3ea85800d7c74c5bf9a0d2a2d5a9b8e7a6e8/js/spacenet/grid-os.js';
s.onload=function(){
  try{
    // center the globe
    if(window.SN&&SN.set){ SN.set('pitch',0.12); SN.set('dist',2.15); }
    // patch projection center via gold if available
    if(window.SN&&SN.eval){
      SN.eval("try{ if(typeof proj==='function'){ var _p=proj; proj=function(p){ var q=_p(p); if(!q)return null; q[1]=q[1]-(canvas.height||700)*0.08; return q; }; } }catch(e){}");
    }
    // hide public pool; owner ABC Supply
    var pEl=document.getElementById('pool');
    if(pEl){ pEl.classList.add('gone'); pEl.textContent='ABC Supply 0'; }
    var inEl=document.getElementById('in');
    if(inEl) inEl.placeholder='Talk to Astranov SpaceNet Grok';
    // fix Google unavailable text
    var g=document.getElementById('btn-google');
    if(g && /unavailable/i.test(g.textContent||'')){
      g.innerHTML='';
      var b=document.createElement('button');
      b.type='button'; b.className='pill live'; b.textContent='Sign in';
      b.onclick=function(){ if(window.SNAuth&&SNAuth.signInGoogle)SNAuth.signInGoogle(); };
      g.appendChild(b);
    }
  }catch(e){}
};
document.head.appendChild(s);
})();
