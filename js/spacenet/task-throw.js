/* SpaceNet 4111 — TASKS throw: ACCEPT/DECLINE, fly bank, splash after fly. */
(function(){
  if(window.__snTaskThrow) window.__snTaskThrow=false;

  function esc(s){ return String(s||"").replace(/&/g,"&").replace(/</g,"<").replace(/>/g,">"); }
  function euro(n, dec){
    n=Number(n)||0;
    var sign=n<0?"\u2212":"";
    n=Math.abs(n);
    var whole=Math.round(n);
    var cents=Math.round((n-Math.floor(n+1e-9))*100);
    if(dec) whole=Math.floor(n+1e-9);
    else whole=Math.round(n);
    var s=String(whole), bits=[];
    while(s.length>3){ bits.unshift(s.slice(-3)); s=s.slice(0,-3); }
    if(s) bits.unshift(s);
    var out=sign+"AV\u20ac "+bits.join(".");
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
      "#sn-throw .drip{position:fixed;left:50%;top:max(62px,env(safe-area-inset-top) + 52px);width:156px;height:156px;transform:translateX(-50%);pointer-events:none;z-index:2}"+ 
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
      "#sn-throw .strip{position:fixed;left:50%;bottom:calc(env(safe-area-inset-bottom) + 76px);transform:translateX(-50%);width:min(94vw,400px);max-height:220px;overflow:auto;pointer-events:auto;padding:10px 12px 12px;border-radius:14px;background:rgba(0,0,0,.88);border:1px solid #4df0ff;color:#4df0ff;font:700 11px/1.4 system-ui;text-align:left;z-index:3}"+ 
      "#sn-throw .strip .line{margin:2px 0;color:#4df0ff}"+ 
      "#sn-throw .strip b{color:#4df0ff;letter-spacing:.1em;margin-right:6px}"+ 
      "#sn-throw .acts{display:flex;gap:8px;margin-top:10px}"+ 
      "#sn-throw .acts button{flex:1;height:44px;border-radius:12px;border:1px solid #4df0ff;background:#04141f;color:#4df0ff;font:800 12px/1 system-ui;letter-spacing:.14em;pointer-events:auto}"+ 
      "#sn-throw .acts button[data-x='yes']{background:#4df0ff;color:#04141f;box-shadow:0 0 14px rgba(77,240,255,.55)}"+ 
      "#sn-throw .acts button[data-x='no']{background:transparent;color:#ff6b8a;border-color:#ff6b8a}"+ 
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

  var actx=null, master=null, lastPick={fly:-1,splash:-1};
  function ctx(){
    var AC=window.AudioContext||window.webkitAudioContext;
    if(!AC) return null;
    if(!actx) actx=new AC();
    if(actx.state==="suspended") actx.resume();
    if(!master || master.context!==actx){
      master=actx.createGain();
      master.gain.value=1;
      master.connect(actx.destination);
    }
    return actx;
  }
  function cutSound(){
    if(!actx||!master) return;
    try{
      var t=actx.currentTime;
      master.gain.cancelScheduledValues(t);
      master.gain.setValueAtTime(master.gain.value, t);
      master.gain.linearRampToValueAtTime(0.0001, t+0.08);
      setTimeout(function(){
        try{
          master.disconnect();
          master=actx.createGain();
          master.gain.value=1;
          master.connect(actx.destination);
        }catch(e){}
      }, 120);
    }catch(e){}
  }
  function pick(n, lastKey){
    var i=Math.floor(Math.random()*n);
    if(n>1 && i===lastPick[lastKey]) i=(i+1)%n;
    lastPick[lastKey]=i;
    return i;
  }

  function env(g, t, a, hold, rel, lvl){
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(lvl, t+a);
    g.gain.setValueAtTime(lvl, t+a+hold);
    g.gain.exponentialRampToValueAtTime(0.0001, t+a+hold+rel);
  }
  function osc(c, type, f0, f1, t, dur, lvl){
    var o=c.createOscillator(), g=c.createGain(), f=c.createBiquadFilter();
    o.type=type;
    f.type="lowpass";
    f.Q.value=0.7;
    o.frequency.setValueAtTime(f0, t);
    o.frequency.exponentialRampToValueAtTime(Math.max(20,f1), t+dur);
    f.frequency.setValueAtTime(Math.min(18000, Math.max(f0,f1)*2), t);
    f.frequency.exponentialRampToValueAtTime(Math.max(80, Math.min(f0,f1)*1.4), t+dur);
    env(g, t, 0.1, Math.max(0.05, dur-0.7), 0.55, lvl);
    o.connect(f); f.connect(g); g.connect(master||c.destination);
    o.start(t); o.stop(t+dur+0.05);
  }
  function noiseBand(c, t, dur, freq, q, lvl, type){
    var n=Math.floor(c.sampleRate*dur), buf=c.createBuffer(1,n,c.sampleRate), d=buf.getChannelData(0), i;
    for(i=0;i<n;i++) d[i]=Math.random()*2-1;
    var src=c.createBufferSource(); src.buffer=buf;
    var bp=c.createBiquadFilter(); bp.type=type||"bandpass"; bp.frequency.value=freq; bp.Q.value=q;
    var g=c.createGain();
    env(g, t, 0.03, dur*0.32, dur*0.55, lvl);
    src.connect(bp); bp.connect(g); g.connect(master||c.destination);
    src.start(t); src.stop(t+dur+0.02);
  }

  var FLY=[
    function jet(c,t0){
      var T=3.2;
      osc(c,"sawtooth",9800,220,t0,T,0.16);
      osc(c,"sawtooth",6400,110,t0+0.08,T-0.15,0.12);
      osc(c,"sine",4200,70,t0+0.1,T-0.2,0.1);
      osc(c,"triangle",1800,48,t0+0.12,T-0.25,0.09);
      osc(c,"sine",220,32,t0+0.2,T-0.3,0.14);
      noiseBand(c,t0,T,2500,0.8,0.1,"bandpass");
      noiseBand(c,t0+0.05,T-0.1,8000,0.7,0.09,"highpass");
      return T;
    },
    function rumble(c,t0){
      var T=3.8;
      osc(c,"sine",90,28,t0,T,0.2);
      osc(c,"sawtooth",240,40,t0,T,0.1);
      osc(c,"triangle",1400,80,t0+0.2,T-0.4,0.08);
      noiseBand(c,t0,T,80,0.4,0.14,"lowpass");
      noiseBand(c,t0,T,400,0.6,0.08,"bandpass");
      noiseBand(c,t0+0.2,T-0.4,1800,0.7,0.07,"bandpass");
      return T;
    },
    function whistle(c,t0){
      var T=2.6;
      osc(c,"sine",3200,420,t0,T,0.14);
      osc(c,"triangle",5100,280,t0+0.05,T-0.1,0.1);
      osc(c,"sine",180,40,t0+0.1,T-0.2,0.08);
      noiseBand(c,t0,T,6000,1.1,0.08,"bandpass");
      noiseBand(c,t0,T,12000,0.6,0.06,"highpass");
      return T;
    },
    function twin(c,t0){
      var T=3.5;
      osc(c,"sawtooth",2200,160,t0,T,0.11);
      osc(c,"sawtooth",2650,190,t0+0.12,T-0.1,0.1);
      osc(c,"sine",110,30,t0,T,0.16);
      osc(c,"triangle",780,55,t0+0.15,T-0.2,0.08);
      noiseBand(c,t0,T,900,0.7,0.09,"bandpass");
      noiseBand(c,t0,T,4500,0.8,0.08,"bandpass");
      return T;
    },
    function dive(c,t0){
      var T=2.9;
      osc(c,"sawtooth",7600,90,t0,T,0.15);
      osc(c,"sine",2400,36,t0+0.08,T-0.1,0.12);
      osc(c,"triangle",480,24,t0+0.2,T-0.2,0.1);
      noiseBand(c,t0,T,10000,0.6,0.1,"highpass");
      noiseBand(c,t0+0.1,T-0.2,300,0.5,0.08,"bandpass");
      return T;
    }
  ];

  var SPLASH=[
    function wet(c,at,lvl){
      noiseBand(c,at,1.8,70,0.35,lvl*0.95,"lowpass");
      noiseBand(c,at,1.4,420,0.55,lvl*0.8,"bandpass");
      noiseBand(c,at,1.15,2200,0.65,lvl,"bandpass");
      noiseBand(c,at,0.95,7000,0.6,lvl*0.85,"highpass");
      osc(c,"sine",160,36,at,2.1,lvl*0.85);
      osc(c,"triangle",90,22,at,2.4,lvl*0.65);
    },
    function thud(c,at,lvl){
      osc(c,"sine",70,22,at,2.6,lvl);
      osc(c,"triangle",48,18,at,2.8,lvl*0.8);
      noiseBand(c,at,1.6,55,0.3,lvl*0.9,"lowpass");
      noiseBand(c,at,0.9,280,0.5,lvl*0.5,"bandpass");
      noiseBand(c,at,0.55,1800,0.7,lvl*0.35,"bandpass");
    },
    function crack(c,at,lvl){
      noiseBand(c,at,0.35,9000,0.7,lvl,"highpass");
      noiseBand(c,at,0.55,3500,0.8,lvl*0.9,"bandpass");
      noiseBand(c,at,1.1,500,0.5,lvl*0.55,"bandpass");
      osc(c,"sawtooth",2800,90,at,0.7,lvl*0.28);
      osc(c,"sine",140,30,at,1.6,lvl*0.7);
    },
    function metal(c,at,lvl){
      osc(c,"sine",880,220,at,1.8,lvl*0.45);
      osc(c,"triangle",1320,180,at,1.5,lvl*0.35);
      osc(c,"sine",70,24,at,2.2,lvl*0.75);
      noiseBand(c,at,0.8,4200,1.1,lvl*0.55,"bandpass");
      noiseBand(c,at,1.2,180,0.4,lvl*0.5,"lowpass");
    },
    function boom(c,at,lvl){
      osc(c,"sine",55,18,at,3.0,lvl);
      osc(c,"sawtooth",180,28,at,1.4,lvl*0.22);
      noiseBand(c,at,2.2,40,0.25,lvl*0.95,"lowpass");
      noiseBand(c,at,1.3,900,0.55,lvl*0.55,"bandpass");
      noiseBand(c,at,0.9,6000,0.6,lvl*0.5,"highpass");
    }
  ];

  function playPass(){
    var c=ctx();
    if(!c) return {fly:3, splash:3, total:6, landMs:3000};
    try{ master.gain.cancelScheduledValues(c.currentTime); master.gain.setValueAtTime(1, c.currentTime); }catch(e){}
    var t0=c.currentTime;
    var fi=pick(FLY.length,"fly");
    var si=pick(SPLASH.length,"splash");
    var flyDur=FLY[fi](c,t0);
    var land=t0+flyDur;
    SPLASH[si](c, land, 0.32);
    var s2=pick(SPLASH.length,"splash");
    SPLASH[s2](c, land+0.18, 0.22);
    var s3=pick(SPLASH.length,"splash");
    SPLASH[s3](c, land+0.55, 0.14);
    return {fly:flyDur, splash:3.1, total:flyDur+3.1, landMs:Math.round(flyDur*1000)};
  }

  function overlayNote(job){
    var title="TASK  "+euro(job.price,false);
    var body=km(job.km)+" \u00b7 "+job.vendor+" \u2192 "+job.client;
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
    ctx();
    function finish(){ if(done) done(); }
    if(!needN){ finish(); return; }
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
      trafficMin:30
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
  function paintInfo(job){
    var route=document.getElementById("sn-throw-route");
    if(!route||!job) return;
    var ready=job.ready?"Ready now":("Not ready \u00b7 "+(job.readyMin||13)+" min");
    var traf=job.trafficMin||30;
    route.innerHTML=
      '<div class="line"><b>'+esc((job.what||"Pizza delivery").toUpperCase())+"</b>"+ready+"</div>"+
      '<div class="line">From '+esc(job.from||job.vendor||"Vendor")+" \u2192 "+esc(job.to||"Your pin")+"</div>"+
      '<div class="line">'+esc(job.vendor||"Vendor")+" to "+esc(job.client||"YOU")+"</div>"+
      '<div class="line">'+km(job.km||3.2)+" \u00b7 "+traf+" min in heavy traffic</div>"+
      '<div class="acts">'+
        '<button type="button" data-x="yes">ACCEPT</button>'+
        '<button type="button" data-x="no">DECLINE</button>'+
      "</div>";
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

  function hideThrow(el){
    if(!el) el=document.getElementById("sn-throw");
    if(el){
      el.classList.remove("on","hit");
      clearTimeout(el.__hit);
      clearTimeout(el.__t);
    }
  }

  function acceptJob(job){
    hideThrow();
    try{
      if(window.SN && SN.takeTask) SN.takeTask(job);
      else if(window.SN && SN.claimJob) SN.claimJob(job);
      else if(window.SN && SN.acceptTask) SN.acceptTask(job);
      else if(window.SN && SN.openTasks) SN.openTasks();
    }catch(e){}
    try{ if(window.SN&&SN.say) SN.say("Accepted. "+euro(job.price,false)+". "+(job.vendor||"")+" to "+(job.client||"YOU")+"."); }catch(err){}
  }
  function declineJob(job){
    cutSound();
    hideThrow();
    try{ if(window.SN&&SN.say) SN.say("Declined."); }catch(e){}
  }

  function throwSplash(job){
    css();
    var el=document.getElementById("sn-throw");
    if(!el){
      el=document.createElement("div");
      el.id="sn-throw";
      el.innerHTML='<div class="drip">'+
        '<div class="goo"></div><div class="ring"></div><div class="ring r2"></div>'+
        '<i class="drop d1"></i><i class="drop d2"></i><i class="drop d3"></i><i class="drop d4"></i>'+
        '<div class="pay" id="sn-throw-pay"></div></div>'+
        '<div class="strip" id="sn-throw-route"></div>';
      document.body.appendChild(el);
      el.addEventListener("click", function(e){
        var node=e.target && e.target.closest && e.target.closest("[data-x]");
        var x=node && node.getAttribute("data-x");
        if(!x) return;
        e.preventDefault();
        e.stopPropagation();
        var j=el.__job||jobOf();
        if(x==="yes") acceptJob(j);
        else if(x==="no") declineJob(j);
      });
    }
    el.__job=job;
    var pay=document.getElementById("sn-throw-pay");
    if(pay) pay.innerHTML="<small>TASK</small>"+esc(euro(job.price, false));
    paintInfo(job);
    el.classList.remove("on","hit");
    void el.offsetWidth;
    el.classList.add("on");
    var timing=playPass();
    flyJob(job);
    overlayNote(job);
    clearTimeout(el.__hit);
    el.__hit=setTimeout(function(){ el.classList.add("hit"); }, timing.landMs||2800);
    try{ if(window.SN&&SN.say) SN.say("Task. "+euro(job.price,false)+". "+job.vendor+" to "+job.client+". Accept or decline."); }catch(e){}
    clearTimeout(el.__t);
    el.__t=setTimeout(function(){}, timing.total*1000+4000);
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
          if(!document.getElementById("sn-perm")) askPerms(function(){});
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
  window.SNThrow={throw:function(job){ throwSplash(job||jobOf()); }, park:park, euro:euro, splash:throwSplash, cut:cutSound};
  window.__snTaskThrow=true;
  if(document.readyState==="loading") document.addEventListener("DOMContentLoaded", hook);
  else hook();
  window.addEventListener("resize", park);
  setInterval(hook, 900);
})();
