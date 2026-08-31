/* SpaceNet 4119 — boot + load phone verify on YOU. */
(function(){
  if(!document.querySelector('script[src*="phone-verify.js"]')){
    var s=document.createElement("script");
    s.src="/js/spacenet/phone-verify.js?v=4119";
    document.head.appendChild(s);
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
      card.innerHTML=
        '<div class="ttl">INSTALL SPACENET</div>'+
        "<p>Overlay on the home screen only works after SpaceNet is installed as an app. Install now, then allow overlay.</p>"+
        (ios()?"<p>Share → Add to Home Screen. Open it from the icon.</p>":"")+
        '<div class="row"><button type="button" class="go" data-x="install">INSTALL</button><button type="button" class="no" data-x="later">LATER</button></div>';
    } else if(kind==="overlay"){
      card.innerHTML=
        '<div class="ttl">ALLOW OVERLAY</div>'+
        "<p>Allow notices so a task can land on top of other apps. This is the overlay.</p>"+
        '<div class="row"><button type="button" class="ov" data-x="overlay">ALLOW</button><button type="button" class="no" data-x="later">LATER</button></div>';
    } else {
      card.innerHTML=
        '<div class="ttl up">UPDATE SPACENET</div>'+
        "<p>A new shell is ready. Update now so overlay and tasks match this version.</p>"+
        '<div class="row"><button type="button" class="go" data-x="update">UPDATE</button><button type="button" class="no" data-x="later">LATER</button></div>';
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
    card.innerHTML=
      '<div class="ttl">INSTALL SPACENET</div>'+
      (ios()
        ?"<p>Tap Share, then Add to Home Screen. Open SpaceNet from the new icon, then allow overlay.</p>"
        :"<p>Chrome menu (⋮) → Install app / Add to Home screen. Open it from the icon, then allow overlay.</p>")+
      '<div class="row"><button type="button" class="ov" data-x="overlay">I INSTALLED IT</button><button type="button" class="no" data-x="later">LATER</button></div>';
  }
  function askOverlay(force){
    if(!force && !standalone()) return;
    if(!window.Notification){
      show("overlay");
      return;
    }
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
          try{
            if(navigator.serviceWorker && navigator.serviceWorker.ready){
              navigator.serviceWorker.ready.then(function(reg){
                if(reg.showNotification) reg.showNotification("SpaceNet overlay on", {body:"Tasks can land on the home screen.", tag:"sn-overlay-ok", silent:true});
              });
            }
          }catch(e){}
        }
      });
    }catch(e){}
  }
  function doUpdate(){
    window.__snSWReload=true;
    try{
      if(navigator.serviceWorker && navigator.serviceWorker.controller){
        navigator.serviceWorker.controller.postMessage("SKIP_WAITING");
      }
      if(window.__snWaiting && window.__snWaiting.postMessage) window.__snWaiting.postMessage("SKIP_WAITING");
    }catch(e){}
    setTimeout(function(){ location.reload(); }, 180);
  }
  function watchSW(){
    if(!navigator.serviceWorker) return;
    function arm(reg){
      if(!reg) return;
      if(reg.waiting && navigator.serviceWorker.controller){
        window.__snWaiting=reg.waiting;
        show("update");
      }
      reg.addEventListener("updatefound", function(){
        var nw=reg.installing;
        if(!nw) return;
        nw.addEventListener("statechange", function(){
          if(nw.state==="installed" && navigator.serviceWorker.controller){
            window.__snWaiting=reg.waiting||nw;
            show("update");
          }
        });
      });
      try{ reg.update(); }catch(e){}
    }
    navigator.serviceWorker.getRegistration().then(arm).catch(function(){});
    navigator.serviceWorker.addEventListener("controllerchange", function(){
      if(window.__snSWReload) location.reload();
    });
  }
  function boot(){
    css();
    watchSW();
    if(standalone()){
      try{ localStorage.setItem(KEY,"1"); }catch(e){}
      setTimeout(function(){ askOverlay(true); }, 600);
      return;
    }
    setTimeout(function(){ show("install"); }, 400);
  }
  window.SNInstall={
    installed:standalone,
    open:function(){ show("install"); },
    overlay:function(){ askOverlay(true); },
    update:function(){ show("update"); }
  };
  if(document.readyState==="loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
