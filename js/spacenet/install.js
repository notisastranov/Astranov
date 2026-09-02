/* SpaceNet 4120 — boot extras: English voice + YOU phone SMS. */
(function(){
  function add(src){
    if(document.querySelector('script[src*="'+src.split("/").pop().split("?")[0]+'"]')) return;
    var s=document.createElement("script");
    s.src=src;
    document.head.appendChild(s);
  }
  add("/js/spacenet/speak-en.js?v=4120");
  add("/js/spacenet/phone-verify.js?v=4120");
  /* choir off — one voice */
})();
(function(){
  if(!window.__snOfferRead){
    window.__snOfferRead=true;
    function offerCss(){
      var s=document.getElementById("sn-offer-read-css");
      if(s) s.remove();
      s=document.createElement("style");
      s.id="sn-offer-read-css";
      s.textContent=
        "#island .k{display:none!important}"+
        "#sn-tasks .card{max-height:min(72vh,calc(100vh - 118px))!important;overflow:auto!important;-webkit-overflow-scrolling:touch}"+
        "#sn-tasks .ttl{font:800 14px/1.2 system-ui!important}"+
        "#sn-tasks .task b{font:650 17px/1.3 system-ui!important}"+
        "#sn-tasks .task span{font:500 14px/1.4 system-ui!important}"+
        "#sn-tasks .ladder i{font:800 11px/1.2 system-ui!important;padding:7px 8px!important}"+
        "#sn-tasks .cash-glow{display:block;max-width:100%;margin:0 0 8px!important;padding:6px 8px;font:800 20px/1.25 system-ui!important;letter-spacing:.03em;color:#7ee9ff;text-shadow:0 0 6px rgba(61,107,255,.5)!important;animation:none!important;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;box-sizing:border-box;position:relative;z-index:1}"+
        ".sn-arc-cash{font:800 13px/1.1 system-ui!important;text-shadow:0 0 6px #3d6bff!important}"+
        "#sn-throw .card{left:max(8px,env(safe-area-inset-left))!important;right:max(8px,env(safe-area-inset-right))!important;width:auto!important;max-width:min(340px,calc(100vw - 16px - env(safe-area-inset-left) - env(safe-area-inset-right)))!important;margin:0 auto!important;transform:none!important;box-sizing:border-box!important;max-height:min(62vh,calc(100dvh - 168px))!important;overflow:auto!important}"+
        "#sn-throw.hit .card{animation:none!important;opacity:1!important;transform:none!important}"+
        "#sn-throw .drip{width:96px!important;height:96px!important;top:max(54px,env(safe-area-inset-top) + 44px)!important}"+
        "#sn-throw .pay{font:800 18px/1.15 ui-monospace,system-ui!important;text-shadow:0 0 6px #4df0ff!important}"+
        "#sn-throw .strip{width:min(94vw,360px)!important;max-width:calc(100vw - 16px)!important;max-height:46vh!important;overflow:auto!important;font:600 15px/1.45 system-ui!important;padding:12px!important;z-index:5!important;left:max(8px,env(safe-area-inset-left))!important;right:max(8px,env(safe-area-inset-right))!important;box-sizing:border-box!important}"+
        "#sn-throw .strip .line{font:600 15px/1.45 system-ui!important;padding:4px 0!important}"+
        "#sn-throw .who .nm{font:800 11px/1.25 system-ui!important;width:auto!important;max-width:88px}"+
        "#sn-throw .acts button{height:44px!important;font:800 13px/1 system-ui!important}";
      document.head.appendChild(s);
    }
    function stripGrok(){
      var k=document.querySelector("#island b.k");
      if(k) k.parentNode.removeChild(k);
      if(/Grok/i.test(document.title||"")) document.title="Astranov SpaceNet";
      var inn=document.getElementById("in");
      if(inn && /Grok/i.test(inn.placeholder||"")) inn.placeholder="Talk to Astranov SpaceNet";
    }
    function bootOffer(){ offerCss(); stripGrok(); }
    if(document.readyState==="loading") document.addEventListener("DOMContentLoaded", bootOffer);
    else bootOffer();
    setInterval(bootOffer, 1200);
  }
})();
(function(){
  if(window.__snInstall) return;
  window.__snInstall=true;
  var KEY="sn:installed-ok";
  function standalone(){
    try{
      if(window.matchMedia && matchMedia("(display-mode: standalone)").matches) return true;
      if(window.matchMedia && matchMedia("(display-mode: fullscreen)").matches) return true;
      if(navigator.standalone) return true;
      if(window.__snInstalled) return true;
    }catch(e){}
    return false;
  }
  function ios(){ return /iPad|iPhone|iPod/.test(navigator.userAgent||""); }
  function css(){
    if(document.getElementById("sn-install-css")) return;
    var s=document.createElement("style");
    s.id="sn-install-css";
    s.textContent=
      "#sn-boot{position:fixed;inset:0;z-index:160;display:none;pointer-events:none}"+
      "#sn-boot.on{display:block;pointer-events:auto}"+
      "#sn-boot .bg{position:absolute;inset:0;background:rgba(0,0,0,.45)}"+
      "#sn-boot .card{position:absolute;left:50%;top:max(70px,env(safe-area-inset-top));transform:translateX(-50%);width:min(86vw,320px);padding:12px;background:#000;border:1.5px solid #4df0ff;border-radius:16px;color:#4df0ff;font:700 12px/1.35 system-ui}"+
      "#sn-boot .ttl{font:800 11px/1 system-ui;letter-spacing:.18em;margin:0 0 8px;color:#4df0ff}"+
      "#sn-boot .ttl.up{color:#ffe14a}"+
      "#sn-boot p{margin:0 0 10px;color:#c6f6ff;font:600 13px/1.4 system-ui}"+
      "#sn-boot .row{display:flex;gap:6px}"+
      "#sn-boot button{flex:1;height:42px;border-radius:10px;font:800 11px/1 system-ui;letter-spacing:.12em}"+
      "#sn-boot .go{background:#19e68c;border:0;color:#00140a}"+
      "#sn-boot .ov{background:#4df0ff;border:0;color:#001018}"+
      "#sn-boot .no{background:#000;border:1.5px solid #ff3b4e;color:#ff3b4e}";
    document.head.appendChild(s);
  }
  function box(){
    var el=document.getElementById("sn-boot");
    if(el) return el;
    el=document.createElement("div");
    el.id="sn-boot";
    el.innerHTML='<div class="bg" data-x="later"></div><div class="card" id="sn-boot-card"></div>';
    document.body.appendChild(el);
    el.addEventListener("click", function(e){
      var x=e.target && e.target.getAttribute && e.target.getAttribute("data-x");
      if(!x && e.target.closest){ var b=e.target.closest("[data-x]"); x=b&&b.getAttribute("data-x"); }
      if(x==="install"){ doInstall(); return; }
      if(x==="overlay"){ askOverlay(true); return; }
      if(x==="update"){ doUpdate(); return; }
      if(x==="later"){ el.classList.remove("on"); }
    });
    return el;
  }
  function show(kind){
    css();
    var el=box();
    var card=document.getElementById("sn-boot-card");
    if(kind==="install"){
      card.innerHTML='<div class="ttl">INSTALL SPACENET</div><p>Overlay on the home screen only works after SpaceNet is installed as an app. Install now, then allow overlay.</p>'+(ios()?"<p>Share → Add to Home Screen. Open it from the icon.</p>":"")+'<div class="row"><button type="button" class="go" data-x="install">INSTALL</button><button type="button" class="no" data-x="later">LATER</button></div>';
    } else if(kind==="overlay"){
      card.innerHTML='<div class="ttl">ALLOW OVERLAY</div><p>Allow notices so a task can land on top of other apps. This is the overlay.</p><div class="row"><button type="button" class="ov" data-x="overlay">ALLOW</button><button type="button" class="no" data-x="later">LATER</button></div>';
    } else {
      card.innerHTML='<div class="ttl up">UPDATE SPACENET</div><p>A new shell is ready. Update now so overlay and tasks match this version.</p><div class="row"><button type="button" class="go" data-x="update">UPDATE</button><button type="button" class="no" data-x="later">LATER</button></div>';
    }
    el.classList.add("on");
  }
  function doInstall(){
    var ev=window.__snDeferred;
    if(ev && ev.prompt){
      ev.prompt();
      Promise.resolve(ev.userChoice||Promise.resolve({outcome:"accepted"})).then(function(c){
        window.__snDeferred=null;
        if(!c || c.outcome!=="dismissed"){
          try{ localStorage.setItem(KEY,"1"); }catch(e){}
          document.getElementById("sn-boot").classList.remove("on");
          setTimeout(function(){ askOverlay(true); }, 400);
        }
      }).catch(function(){ manualInstall(); });
      return;
    }
    manualInstall();
  }
  function manualInstall(){
    var card=document.getElementById("sn-boot-card");
    if(!card) return;
    card.innerHTML='<div class="ttl">INSTALL SPACENET</div>'+(ios()?"<p>Tap Share, then Add to Home Screen. Open SpaceNet from the new icon, then allow overlay.</p>":"<p>Chrome menu → Install app. Open it from the icon, then allow overlay.</p>")+'<div class="row"><button type="button" class="ov" data-x="overlay">I INSTALLED IT</button><button type="button" class="no" data-x="later">LATER</button></div>';
  }
  function askOverlay(force){
    if(!force && !standalone()) return;
    if(!window.Notification){ show("overlay"); return; }
    if(Notification.permission==="granted"){
      var el=document.getElementById("sn-boot");
      if(el) el.classList.remove("on");
      try{ localStorage.setItem("sn:overlay-ok","1"); }catch(e){}
      return;
    }
    if(!force && Notification.permission==="denied") return;
    show("overlay");
    try{
      Notification.requestPermission().then(function(p){
        if(p==="granted"){
          try{ localStorage.setItem("sn:overlay-ok","1"); }catch(e){}
          var el=document.getElementById("sn-boot");
          if(el) el.classList.remove("on");
        }
      });
    }catch(e){}
  }
  function doUpdate(){
    window.__snSWReload=true;
    try{
      if(navigator.serviceWorker && navigator.serviceWorker.controller) navigator.serviceWorker.controller.postMessage("SKIP_WAITING");
      if(window.__snWaiting && window.__snWaiting.postMessage) window.__snWaiting.postMessage("SKIP_WAITING");
    }catch(e){}
    setTimeout(function(){ location.reload(); }, 180);
  }
  function watchSW(){
    if(!navigator.serviceWorker) return;
    function arm(reg){
      if(!reg) return;
      if(reg.waiting && navigator.serviceWorker.controller){ window.__snWaiting=reg.waiting; show("update"); }
      reg.addEventListener("updatefound", function(){
        var nw=reg.installing;
        if(!nw) return;
        nw.addEventListener("statechange", function(){
          if(nw.state==="installed" && navigator.serviceWorker.controller){ window.__snWaiting=reg.waiting||nw; show("update"); }
        });
      });
      try{ reg.update(); }catch(e){}
    }
    navigator.serviceWorker.getRegistration().then(arm).catch(function(){});
    navigator.serviceWorker.addEventListener("controllerchange", function(){ if(window.__snSWReload) location.reload(); });
  }
  function boot(){
    css(); watchSW();
    if(standalone()){ try{ localStorage.setItem(KEY,"1"); }catch(e){} setTimeout(function(){ askOverlay(true); }, 600); return; }
    setTimeout(function(){ show("install"); }, 400);
  }
  window.SNInstall={ installed:standalone, open:function(){ show("install"); }, overlay:function(){ askOverlay(true); }, update:function(){ show("update"); } };
  if(document.readyState==="loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
