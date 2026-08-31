/* SpaceNet 4105 — TASKS always visible. Tap throws a neon test job. */
(function(){
  if(window.__snTaskThrow) return;
  window.__snTaskThrow=true;

  function esc(s){ return String(s||"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;"); }
  function euro(n, dec){
    n=Number(n)||0;
    var sign=n<0?"−":"";
    n=Math.abs(n);
    var whole=Math.round(n);
    var cents=Math.round((n-Math.floor(n+1e-9))*100);
    if(dec) whole=Math.floor(n+1e-9);
    else whole=Math.round(n);
    var s=String(whole), bits=[];
    while(s.length>3){ bits.unshift(s.slice(-3)); s=s.slice(0,-3); }
    if(s) bits.unshift(s);
    var out=sign+"AV€ "+bits.join(".");
    if(dec && cents) out+=","+(cents<10?"0":"")+cents;
    return out;
  }
  function km(n){
    n=Number(n)||0;
    var s=n.toFixed(1).replace(".",",");
    if(/,0$/.test(s)) s=s.slice(0,-2);
    return s+" km";
  }
  function who(){
    try{
      var u=JSON.parse(localStorage.getItem("sn:user")||"null");
      if(u&& (u.name||u.email)) return String(u.name||u.email).split("@")[0];
    }catch(e){}
    return "YOU";
  }
  function css(){
    var s=document.getElementById("sn-throw-css");
    if(s) s.remove();
    s=document.createElement("style");
    s.id="sn-throw-css";
    s.textContent=
      "#sn-tasks-btn{display:flex!important;align-items:center;justify-content:center;z-index:50;pointer-events:auto;touch-action:manipulation}"+
      "#sn-tasks-btn.on{display:flex!important}"+
      "#sn-throw{position:fixed;inset:0;z-index:90;display:none;pointer-events:none}"+
      "#sn-throw.on{display:block}"+
      "#sn-throw .drip{position:fixed;left:50%;top:max(62px,env(safe-area-inset-top) + 52px);width:156px;height:156px;transform:translateX(-50%);pointer-events:auto;z-index:2}"+
      "#sn-throw .goo{position:absolute;inset:0;border-radius:47% 53% 45% 55%/52% 40% 60% 48%;background:#000;border:2.5px solid #4df0ff;box-shadow:0 0 16px #4df0ff,0 0 36px rgba(77,240,255,.55),inset 0 0 10px rgba(77,240,255,.15);opacity:0;transform:scale(.15)}"+
      "#sn-throw.hit .goo{animation:snPop .38s cubic-bezier(.1,1.6,.2,1) forwards, snGoo 2.2s .38s ease-in-out infinite}"+
      "#sn-throw .drop{position:absolute;width:12px;height:16px;border-radius:70% 70% 55% 55%;background:#000;border:2px solid #4df0ff;box-shadow:0 0 8px #4df0ff;opacity:0}"+
      "#sn-throw.hit .drop{animation:snDrop .7s ease-out forwards}"+
      "#sn-throw .drop.d1{left:8%;top:18%;animation-delay:.05s}"+
      "#sn-throw .drop.d2{right:6%;top:28%;animation-delay:.1s}"+
      "#sn-throw .drop.d3{left:18%;bottom:8%;animation-delay:.14s}"+
      "#sn-throw .drop.d4{right:14%;bottom:12%;animation-delay:.18s}"+
      "#sn-throw .ring{position:absolute;left:50%;top:50%;width:24px;height:24px;border-radius:999px;border:2px solid rgba(77,240,255,.9);transform:translate(-50%,-50%) scale(.2);opacity:0;pointer-events:none}"+
      "#sn-throw.hit .ring{animation:snThrowRing .9s cubic-bezier(.12,.8,.2,1) forwards}"+
      "#sn-throw.hit .ring.r2{animation-delay:.08s}"+
      "#sn-throw .pay{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;flex-direction:column;font:900 26px/1 ui-monospace,system-ui;color:#4df0ff;text-shadow:0 0 8px #4df0ff,0 0 18px #4df0ff;text-align:center;pointer-events:none;opacity:0}"+
      "#sn-throw.hit .pay{animation:snFade .25s .2s forwards}"+
      "#sn-throw .pay small{display:block;font:800 8px/1 system-ui;letter-spacing:.2em;color:#4df0ff;margin-bottom:4px}"+
      "#sn-throw .strip{position:fixed;left:50%;bottom:calc(env(safe-area-inset-bottom) + 72px);transform:translateX(-50%);width:min(86vw,320px);pointer-events:auto;padding:8px 8px 8px;border-radius:14px;background:#000;border:1.5px solid #4df0ff;color:#4df0ff;font:700 11px/1.25 system-ui;text-align:left;z-index:3;box-shadow:0 0 14px rgba(77,240,255,.35)}"+
      "#sn-throw .who{display:flex;align-items:center;gap:6px;margin:0 0 6px}"+
      "#sn-throw .who .face{width:44px;height:44px;border-radius:999px;border:1.5px solid #4df0ff;overflow:hidden;background:#000;flex:none;display:flex;align-items:center;justify-content:center;font:800 13px system-ui;color:#4df0ff}"+
      "#sn-throw .who img{width:100%;height:100%;object-fit:cover;display:block}"+
      "#sn-throw .who .nm{font:800 9px/1.2 system-ui;letter-spacing:.08em;text-align:center;margin-top:3px;width:44px}"+
      "#sn-throw .col{display:flex;flex-direction:column;align-items:center;flex:none}"+
      "#sn-throw .link{flex:1;height:2px;background:#4df0ff;box-shadow:0 0 8px #4df0ff;position:relative;min-width:28px;margin:0 2px 14px}"+
      "#sn-throw .link:after{content:\"\";position:absolute;right:-1px;top:-3px;width:8px;height:8px;border-radius:99px;background:#4df0ff;box-shadow:0 0 6px #4df0ff}"+
      "#sn-throw .strip .line{margin:0;padding:2px 0;border-top:1px solid rgba(77,240,255,.22);color:#4df0ff}"+
      "#sn-throw .strip .line:first-of-type{border-top:0;padding-top:0}"+
      "#sn-throw .strip b{color:#4df0ff;letter-spacing:.08em}"+
      "#sn-perm{position:fixed;left:50%;bottom:calc(env(safe-area-inset-bottom) + 86px);transform:translateX(-50%);z-index:141;width:min(360px,92vw);padding:12px;border-radius:16px;background:rgba(4,14,28,.96);border:1px solid rgba(126,233,255,.45);color:#c6f6ff;font:600 13px/1.35 system-ui;display:none;pointer-events:auto}"+
      "#sn-perm.on{display:block}"+
      "#sn-perm b{display:block;color:#7ee9ff;font:800 11px/1 system-ui;letter-spacing:.16em;margin:0 0 6px}"+
      "#sn-perm .acts{display:flex;gap:8px;margin-top:10px}"+
      "#sn-perm button{flex:1;height:40px;border-radius:12px;border:1px solid rgba(77,240,255,.7);background:rgba(4,20,36,.9);color:#7ee9ff;font:800 10px/1 system-ui;letter-spacing:.12em}"+
      "@keyframes snPop{from{opacity:0;transform:scale(.12)}70%{opacity:1;transform:scale(1.08)}to{opacity:1;transform:scale(1)}}"+
      "@keyframes snGoo{0%,100%{border-radius:47% 53% 45% 55%/52% 40% 60% 48%}50%{border-radius:58% 42% 56% 44%/40% 62% 38% 60%}}"+
      "@keyframes snDrop{0%{opacity:1;transform:translate(0,0) scale(1)}100%{opacity:0;transform:translate(var(--dx,12px),var(--dy,28px)) scale(.3)}}"+
      "@keyframes snThrowRing{0%{transform:translate(-50%,-50%) scale(.2);opacity:.9}100%{transform:translate(-50%,-50%) scale(7);opacity:0}}"+
      "@keyframes snFade{to{opacity:1}}";
    document.head.appendChild(s);
  }

  var actx=null;
  function ctx(){
    var AC=window.AudioContext||window.webkitAudioContext;
    if(!AC) return null;
    if(!actx) actx=new AC();
    if(actx.state==="suspended") actx.resume();
    return actx;
  }
  function flyover(){
    var c=ctx();
    if(!c) return;
    window.__snActx=c;
    var t0=c.currentTime;
    var T=13.5;
    var master=c.createGain();
    master.gain.setValueAtTime(0.0001, t0);
    master.gain.exponentialRampToValueAtTime(0.95, t0+0.08);
    master.gain.setValueAtTime(0.95, t0+12.6);
    master.gain.exponentialRampToValueAtTime(0.0001, t0+T);
    var comp=c.createDynamicsCompressor();
    comp.threshold.setValueAtTime(-18, t0);
    comp.knee.setValueAtTime(12, t0);
    comp.ratio.setValueAtTime(6, t0);
    comp.attack.setValueAtTime(0.003, t0);
    comp.release.setValueAtTime(0.18, t0);
    master.connect(comp); comp.connect(c.destination);

    var nLen=Math.floor(c.sampleRate*1.2);
    var nbuf=c.createBuffer(1,nLen,c.sampleRate), nd=nbuf.getChannelData(0), i;
    for(i=0;i<nLen;i++) nd[i]=Math.random()*2-1;
    function noiseTo(filter, lvl){
      var src=c.createBufferSource();
      src.buffer=nbuf; src.loop=true;
      var g=c.createGain(); g.gain.value=lvl;
      src.connect(filter); filter.connect(g); g.connect(master);
      src.start(t0); src.stop(t0+T);
    }
    function band(type, freq, q, lvl){
      var f=c.createBiquadFilter();
      f.type=type; f.frequency.value=freq; f.Q.value=q;
      noiseTo(f, lvl);
    }
    /* full audible floor: 20Hz–16kHz, stays loud the whole 13s */
    band("lowpass", 90, 0.5, 0.34);
    band("bandpass", 180, 0.6, 0.22);
    band("bandpass", 450, 0.7, 0.2);
    band("bandpass", 1000, 0.8, 0.22);
    band("bandpass", 2500, 0.8, 0.26);
    band("bandpass", 5000, 0.7, 0.28);
    band("bandpass", 8000, 0.7, 0.24);
    band("highpass", 11000, 0.6, 0.2);
    band("highpass", 15000, 0.5, 0.16);

    function osc(type, f0, f1, lvl){
      var o=c.createOscillator(), g=c.createGain();
      o.type=type;
      o.frequency.setValueAtTime(f0, t0);
      o.frequency.exponentialRampToValueAtTime(Math.max(40,f1), t0+T-0.4);
      g.gain.value=lvl;
      o.connect(g); g.connect(master);
      o.start(t0); o.stop(t0+T);
    }
    osc("sawtooth", 9200, 220, 0.22);
    osc("sawtooth", 5400, 110, 0.16);
    osc("sine", 2800, 2800, 0.14); /* presence stays put so it never goes quiet */
    osc("sine", 4200, 4200, 0.1);
    osc("triangle", 160, 40, 0.2);
    osc("sine", 70, 28, 0.24);

    function splash(at, lvl){
      var hit=c.createBufferSource(); hit.buffer=nbuf;
      var hp=c.createBiquadFilter(); hp.type="highpass"; hp.frequency.value=600;
      var lp=c.createBiquadFilter(); lp.type="lowpass"; lp.frequency.value=12000;
      var g=c.createGain();
      g.gain.setValueAtTime(0.0001, at);
      g.gain.exponentialRampToValueAtTime(lvl, at+0.02);
      g.gain.exponentialRampToValueAtTime(lvl*0.35, at+0.45);
      g.gain.exponentialRampToValueAtTime(0.0001, at+2.2);
      hit.connect(hp); hp.connect(lp); lp.connect(g); g.connect(master);
      hit.start(at); hit.stop(at+2.3);
      var thud=c.createOscillator(), tg=c.createGain();
      thud.type="sine";
      thud.frequency.setValueAtTime(120, at);
      thud.frequency.exponentialRampToValueAtTime(32, at+1.4);
      tg.gain.setValueAtTime(lvl, at);
      tg.gain.exponentialRampToValueAtTime(0.0001, at+1.6);
      thud.connect(tg); tg.connect(master);
      thud.start(at); thud.stop(at+1.65);
    }
    splash(t0+1.7, 0.85);
    splash(t0+5.8, 0.55);
    splash(t0+9.6, 0.4);
  }
  function overlayNote(job){
    var title="TASK  "+euro(job.price,false);
    var body=km(job.km)+" · "+job.vendor+" → "+job.client;
    function show(reg){
      try{
        var opts={body:body, tag:"sn-task-throw", silent:true, requireInteraction:true, vibrate:[90,40,90], data:job};
        if(reg&&reg.showNotification) reg.showNotification(title, opts);
        else if(window.Notification&&Notification.permission==="granted") new Notification(title, opts);
      }catch(e){}
    }
    if(navigator.serviceWorker&&navigator.serviceWorker.ready){
      navigator.serviceWorker.ready.then(show).catch(function(){ show(null); });
    } else show(null);
  }

  function askPerms(done){
    var needN=!("Notification" in window) ? false : Notification.permission==="default";
    var needA=!actx || actx.state==="suspended";
    ctx();
    function finish(){ if(done) done(); }
    if(!needN && !needA){ finish(); return; }
    var box=document.getElementById("sn-perm");
    if(!box){
      box=document.createElement("div");
      box.id="sn-perm";
      box.innerHTML='<b>OVERLAY + SOUND</b>SpaceNet throws tasks over whatever is on screen. Allow notifications (overlay) and sound.'+
        '<div class="acts"><button type="button" data-k="go">ALLOW</button><button type="button" data-k="skip">NOT NOW</button></div>';
      document.body.appendChild(box);
      box.addEventListener("click", function(e){
        var k=e.target && e.target.getAttribute("data-k");
        if(!k) return;
        box.classList.remove("on");
        if(k==="go"){
          ctx();
          if(window.Notification && Notification.permission==="default"){
            Notification.requestPermission().then(function(){ finish(); }).catch(finish);
            return;
          }
        }
        finish();
      });
    }
    if(needN){
      box.classList.add("on");
      return;
    }
    finish();
  }

  function jobOf(){
    var you=pin();
    var shop=away(you, 3.4, 38);
    return {
      id:"test-"+Date.now(),
      price:24,
      km:3.4,
      what:"Pizza delivery",
      vendor:"Kalithea Oven",
      client:who(),
      from:"Kalithea Oven",
      to:you.name||"Your pin",
      fromLat:shop.lat, fromLng:shop.lng,
      toLat:you.lat, toLng:you.lng,
      lat:shop.lat, lng:shop.lng,
      ready:false,
      readyMin:13,
      trafficMin:30,
      pay:"card",
      vendorPhoto:"",
      clientPhoto:userPhoto()
    };
  }


  function pin(){
    try{
      var p=JSON.parse(localStorage.getItem("sn:place")||"null");
      if(p&&isFinite(Number(p.lat))) return {lat:Number(p.lat),lng:Number(p.lng),name:p.name||"YOU"};
    }catch(e){}
    return {lat:36.382, lng:28.250, name:"Kalithea"};
  }
  function away(p, kmN, deg){
    var r=Math.max(3.2, Number(kmN)||3.4), a=(Number(deg)||42)*Math.PI/180;
    var dlat=(r/111.32)*Math.cos(a);
    var dlng=(r/(111.32*Math.max(0.2, Math.cos(p.lat*Math.PI/180))))*Math.sin(a);
    return {lat:p.lat+dlat, lng:p.lng+dlng, name:"Drop"};
  }
  function haversine(a,b){
    var R=6371, f1=a.lat*Math.PI/180, f2=b.lat*Math.PI/180;
    var df=(b.lat-a.lat)*Math.PI/180, dl=(b.lng-a.lng)*Math.PI/180;
    var x=Math.sin(df/2)*Math.sin(df/2)+Math.cos(f1)*Math.cos(f2)*Math.sin(dl/2)*Math.sin(dl/2);
    return 2*R*Math.asin(Math.min(1, Math.sqrt(x)));
  }
  function hookMap(){
    if(!window.L||!L.Map||L.Map.prototype.setView.__snCap) return;
    function cap(){ window.__snLeaflet=this; var el=this.getContainer&&this.getContainer(); if(el) el.__snMap=this; }
    ["setView","fitBounds","invalidateSize"].forEach(function(n){
      var orig=L.Map.prototype[n];
      if(!orig) return;
      L.Map.prototype[n]=function(){ cap.call(this); return orig.apply(this, arguments); };
    });
    L.Map.prototype.setView.__snCap=true;
  }
  function drawLine(pts){
    hookMap();
    var map=window.__snLeaflet;
    if(!map||!window.L||!pts||pts.length<2) return;
    if(window.__snThrowLayer){ try{ map.removeLayer(window.__snThrowLayer); }catch(e){} }
    var layer=L.layerGroup();
    var line=L.polyline(pts,{color:"#4df0ff",weight:5,opacity:1});
    layer.addLayer(line);
    layer.addLayer(L.circleMarker(pts[0],{radius:8,color:"#4df0ff",fillColor:"#000",fillOpacity:1,weight:2}));
    layer.addLayer(L.circleMarker(pts[pts.length-1],{radius:8,color:"#4df0ff",fillColor:"#4df0ff",fillOpacity:1,weight:2}));
    layer.addTo(map);
    window.__snThrowLayer=layer;
    try{ map.fitBounds(line.getBounds(),{padding:[52,96],maxZoom:14}); }catch(e){}
  }
  function osrm(from, to){
    var url="https://router.project-osrm.org/route/v1/driving/"+from.lng+","+from.lat+";"+to.lng+","+to.lat+"?overview=full&geometries=geojson";
    return fetch(url).then(function(r){ return r.json(); }).then(function(j){
      var r=j&&j.routes&&j.routes[0];
      if(!r) throw new Error("no");
      var c=(r.geometry&&r.geometry.coordinates||[]).map(function(x){ return [x[1],x[0]]; });
      return {pts:c, km:r.distance/1000, min:Math.max(1, Math.round(r.duration/60))};
    });
  }
  function userPhoto(){
    try{
      var u=JSON.parse(localStorage.getItem("sn:user")||"null");
      if(u&&u.photo) return String(u.photo);
    }catch(e){}
    return "";
  }
  function face(src, letter){
    if(src) return '<div class="face"><img alt="" src="'+esc(src)+'"></div>';
    return '<div class="face">'+esc((letter||"?").slice(0,1).toUpperCase())+"</div>";
  }
  function paintInfo(job){
    var route=document.getElementById("sn-throw-route");
    if(!route||!job) return;
    var ready=job.ready?"Ready now":("Ready in "+(job.readyMin||13)+" minutes");
    var pay=(job.pay==="cash"||job.cash)?"CASH ORDER":"PAID BY CARD";
    var traf=job.trafficMin||30;
    var vName=job.vendor||"Vendor";
    var cName=job.client||"YOU";
    var vPic=job.vendorPhoto||"";
    var cPic=job.clientPhoto||userPhoto();
    route.innerHTML=
      '<div class="who">'+
        '<div class="col">'+face(vPic,vName)+'<div class="nm">'+esc(vName)+"</div></div>"+
        '<div class="link"></div>'+
        '<div class="col">'+face(cPic,cName)+'<div class="nm">'+esc(cName)+"</div></div>"+
      "</div>"+
      '<div class="line"><b>'+esc((job.what||"Pizza delivery").toUpperCase())+"</b></div>"+
      '<div class="line">'+ready+"</div>"+
      '<div class="line">From '+esc(job.from||vName)+" → "+esc(job.to||"Your pin")+"</div>"+
      '<div class="line">'+esc(vName)+" to "+esc(cName)+"</div>"+
      '<div class="line">'+km(job.km||3.2)+" · "+traf+" min in heavy traffic</div>"+
      '<div class="line"><b>'+pay+"</b></div>"+
      '<div class="line">'+esc(euro(job.price||0,false))+"</div>";
  }
  function flyJob(job){
    hookMap();
    var you=pin();
    var shop={lat:Number(job&&job.fromLat), lng:Number(job&&job.fromLng), name:(job&&job.vendor)||"Kalithea Oven"};
    if(!isFinite(shop.lat)) shop=away(you, 3.4, 38);
    var drop={lat:Number(job&&job.toLat), lng:Number(job&&job.toLng), name:(job&&job.to)||you.name||"YOU"};
    if(!isFinite(drop.lat)) drop=you;
    if(haversine(shop, drop)<3){
      drop=away(shop, 3.5, 52);
      drop.name=(job&&job.to)||"YOU";
    }
    if(window.SN&&SN.showCall) SN.showCall(shop, drop);
    else if(window.SN&&SN.showCity) SN.showCity(shop);
    osrm(shop, drop).then(function(r){
      job.km=Math.max(3, r.km);
      job.freeMin=r.min;
      job.trafficMin=Math.max(30, Math.round(r.min*2.4));
      paintInfo(job);
      setTimeout(function(){ hookMap(); drawLine(r.pts.length>2?r.pts:[[shop.lat,shop.lng],[drop.lat,drop.lng]]); }, 650);
    }).catch(function(){
      job.km=Math.max(3.2, haversine(shop, drop));
      job.trafficMin=30;
      paintInfo(job);
      setTimeout(function(){ drawLine([[shop.lat,shop.lng],[drop.lat,drop.lng]]); }, 650);
    });
  }

  function throwSplash(job){
    css();
    var el=document.getElementById("sn-throw");
    if(!el){
      el=document.createElement("div");
      el.id="sn-throw";
      el.innerHTML='<div class="drip" data-x="take">'+
        '<div class="goo"></div><div class="ring"></div><div class="ring r2"></div>'+
        '<i class="drop d1"></i><i class="drop d2"></i><i class="drop d3"></i><i class="drop d4"></i>'+
        '<div class="pay" id="sn-throw-pay"></div></div>'+
        '<div class="strip" id="sn-throw-route"></div>';
      document.body.appendChild(el);
      el.addEventListener("click", function(e){
        var x=e.target && (e.target.getAttribute("data-x")|| (e.target.closest && e.target.closest("[data-x]") && e.target.closest("[data-x]").getAttribute("data-x")));
        if(x==="list"){
          el.classList.remove("on");
          if(window.SN && SN.openTasks) SN.openTasks();
          return;
        }
        if(x==="take" || x==="1"){
          el.classList.remove("on");
        }
      });
    }
    var pay=document.getElementById("sn-throw-pay");
    var route=document.getElementById("sn-throw-route");
    if(pay) pay.innerHTML="<small>TASK</small>"+esc(euro(job.price, false));
    paintInfo(job);
    el.classList.remove("on","hit");
    void el.offsetWidth;
    el.classList.add("on");
    flyover();
    flyJob(job);
    overlayNote(job);
    clearTimeout(el.__hit);
    el.__hit=setTimeout(function(){ el.classList.add("hit"); }, 1750);
    try{ if(window.SN&&SN.say) SN.say("Task. "+euro(job.price,false)+". "+job.vendor+" to "+job.client+"."); }catch(e){}
    clearTimeout(el.__t);
    el.__t=setTimeout(function(){ el.classList.remove("on"); }, 13500);
  }

  function park(){
    var btn=document.getElementById("sn-tasks-btn");
    if(!btn) return;
    if(btn.classList.contains("loose")||btn.classList.contains("drag")) return;
    btn.classList.add("on");
    btn.style.display="flex";
    btn.style.zIndex="50";
    var pwr=document.getElementById("sn-power");
    var r=pwr&&pwr.getBoundingClientRect();
    var y, x;
    if(r && r.height>8 && r.top>8){
      y=Math.round(r.top);
      x=Math.round(r.right+8);
    } else {
      var isl=document.getElementById("island");
      var ir=isl&&isl.getBoundingClientRect();
      y=ir?Math.round(ir.bottom+8):Math.round((window.visualViewport&&visualViewport.offsetTop||0)+58);
      x=60;
    }
    var sup=document.getElementById("sn-support");
    var sr=sup&&sup.getBoundingClientRect();
    var tw=btn.offsetWidth||86;
    if(sr && x+tw>sr.left-8) x=Math.max(8, Math.round(sr.left-8-tw));
    btn.style.top=y+"px";
    btn.style.left=x+"px";
    btn.style.right="auto";
    btn.style.bottom="auto";
    if(!String(btn.textContent||"").replace(/\s/g,"")) btn.textContent="TASKS";
  }

  function bind(){
    css();
    var btn=document.getElementById("sn-tasks-btn");
    if(!btn) return;
    if(!btn.__snThrow){
      btn.__snThrow=true;
      btn.addEventListener("click", function(e){
        e.preventDefault();
        e.stopPropagation();
        if(e.stopImmediatePropagation) e.stopImmediatePropagation();
        if(btn.dataset.skipClick==="1"){ btn.dataset.skipClick=""; return; }
        ctx();
        if(window.Notification && Notification.permission==="default"){
          try{ Notification.requestPermission(); }catch(err){}
          var box=document.getElementById("sn-perm");
          if(!box){
            askPerms(function(){});
          }
        }
        throwSplash(jobOf());
      }, true);
    }
    park();
  }

  function hook(){
    bind();
    if(window.SN && SN.pack && !SN.pack.__throw){
      var orig=SN.pack;
      SN.pack=function(){ orig.apply(this, arguments); park(); };
      SN.pack.__throw=true;
    }
  }
  window.SNThrow={throw:function(job){ throwSplash(job||jobOf()); }, park:park, euro:euro, splash:throwSplash};
  if(document.readyState==="loading") document.addEventListener("DOMContentLoaded", hook);
  else hook();
  window.addEventListener("resize", park);
  setInterval(hook, 900);
})();
