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
      "#sn-throw .card{position:fixed;left:50%;top:max(56px,env(safe-area-inset-top) + 46px);transform:translateX(-50%) scale(.92);opacity:0;width:min(88vw,340px);box-sizing:border-box;padding:12px 12px 10px;background:#000;border:2px solid #4df0ff;border-radius:22px;box-shadow:0 0 22px #4df0ff,0 0 48px rgba(77,240,255,.28);pointer-events:auto;color:#4df0ff;font:700 13px/1.4 system-ui}"+
      "#sn-throw.hit .card{animation:snPop .4s cubic-bezier(.12,1.4,.2,1) forwards}"+
      "#sn-throw .pay{display:block;text-align:center;font:900 28px/1.1 ui-monospace,system-ui;color:#4df0ff;text-shadow:0 0 10px #4df0ff;padding:2px 0 10px;margin:0}"+
      "#sn-throw .pay small{display:block;font:800 9px/1 system-ui;letter-spacing:.2em;margin:0 0 6px;color:#4df0ff}"+
      "#sn-throw .who{display:grid;grid-template-columns:76px 1fr 76px;align-items:start;column-gap:8px;margin:0 0 8px}"+
      "#sn-throw .col{display:flex;flex-direction:column;align-items:center;min-width:0}"+
      "#sn-throw .face{width:48px;height:48px;border-radius:999px;border:2px solid #4df0ff;overflow:hidden;background:#000;flex:none;display:flex;align-items:center;justify-content:center;font:800 14px system-ui;color:#4df0ff}"+
      "#sn-throw .who img{width:100%;height:100%;object-fit:cover;display:block}"+
      "#sn-throw .nm{margin-top:4px;width:76px;font:800 10px/1.25 system-ui;letter-spacing:.04em;text-align:center;white-space:normal;overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;word-break:break-word}"+
      "#sn-throw .link{height:2px;align-self:center;margin-top:23px;background:linear-gradient(90deg,#4df0ff,#b44dff,#ff7ae6);box-shadow:0 0 8px #b44dff;position:relative}"+
      "#sn-throw .link:after{content:\"\";position:absolute;right:-1px;top:-3px;width:8px;height:8px;border-radius:99px;background:#ff7ae6;box-shadow:0 0 6px #ff7ae6}"+
      "#sn-throw .col:last-child .face{border-color:#ff7ae6}"+
      "#sn-throw .col:last-child .nm{color:#ff7ae6}"+
      "#sn-throw .line{display:block;padding:7px 0;margin:0;border-top:1px solid rgba(77,240,255,.28);white-space:normal;overflow:visible;word-break:break-word;line-height:1.4}"+
      "#sn-throw .line.what{color:#4df0ff}"+
      "#sn-throw .line.ready{color:#ffe14a}"+
      "#sn-throw .line.km{color:#7ee9ff}"+
      "#sn-throw .acts{display:flex;gap:8px;margin:10px 0 0;padding-top:8px;border-top:1px solid rgba(77,240,255,.28)}"+
      "#sn-throw .acts button{flex:1;height:42px;border-radius:12px;font:800 12px/1 system-ui;letter-spacing:.14em}"+
      "#sn-throw .acts .yes{background:#19e68c;border:0;color:#00140a}"+
      "#sn-throw .acts .no{background:#000;border:1.5px solid #ff3b4e;color:#ff3b4e}"+
      "@keyframes snPop{from{opacity:0;transform:translateX(-50%) scale(.86)}to{opacity:1;transform:translateX(-50%) scale(1)}}"+
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
    var T=13.6;
    var A=432;
    var master=c.createGain();
    window.__snMaster=master;
    master.gain.setValueAtTime(0.0001, t0);
    master.gain.exponentialRampToValueAtTime(0.88, t0+0.4);
    master.gain.setValueAtTime(0.88, t0+12.6);
    master.gain.exponentialRampToValueAtTime(0.0001, t0+T);
    master.connect(c.destination);

    function glide(type, f0, f1, at, dur, lvl){
      var o=c.createOscillator(), g=c.createGain();
      o.type=type||"sine";
      o.frequency.setValueAtTime(Math.max(20,f0), at);
      o.frequency.exponentialRampToValueAtTime(Math.max(20,f1), at+dur);
      g.gain.setValueAtTime(0.0001, at);
      g.gain.exponentialRampToValueAtTime(lvl, at+Math.min(0.35, dur*0.18));
      g.gain.setValueAtTime(lvl, at+dur*0.7);
      g.gain.exponentialRampToValueAtTime(0.0001, at+dur);
      o.connect(g); g.connect(master);
      o.start(at); o.stop(at+dur+0.03);
    }
    function hold(type, f, at, dur, lvl){
      glide(type, f, f, at, dur, lvl);
    }
    /* 432 family: 27 54 108 216 432 648 864 1728 3456 6912 13824 */
    hold("sine", A/16, t0, T-0.2, 0.28);
    hold("sine", A/8, t0, T-0.2, 0.32);
    hold("triangle", A/4, t0, T-0.3, 0.18);
    hold("sine", A, t0+0.6, T-1.0, 0.2);
    hold("sine", A*1.5, t0+1.2, T-1.6, 0.1);

    /* whale song — long moans */
    glide("sine", A/4, A, t0+0.3, 3.4, 0.42);
    glide("sine", A, A/8, t0+2.4, 4.2, 0.38);
    glide("triangle", A/8, A/2, t0+5.8, 3.6, 0.3);
    glide("sine", A/2, A/16, t0+8.8, 4.2, 0.34);

    /* dolphin space song — long whistles, never ticks */
    glide("sine", A*4, A*8, t0+1.1, 2.6, 0.28);
    glide("sine", A*8, A*2, t0+3.4, 2.8, 0.26);
    glide("sine", A*16, A*4, t0+6.0, 2.4, 0.22);
    glide("sine", A*8, A*32, t0+8.2, 2.2, 0.18);
    glide("sine", A*32, A*4, t0+10.2, 2.8, 0.2);

    /* space overtones resolving to 432 */
    glide("sine", A*2, A, t0+9.6, 3.6, 0.22);
    glide("sine", A*3, A, t0+10.4, 2.8, 0.12);
  }
  function muteThrow(){
    try{
      var c=actx||window.__snActx, m=window.__snMaster;
      if(c&&m) m.gain.exponentialRampToValueAtTime(0.0001, c.currentTime+0.12);
    }catch(e){}
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
    var route=document.getElementById("sn-throw-card")||document.getElementById("sn-throw-route");
    if(!route||!job) return;
    var ready=job.ready?"Ready now":("Ready in "+(job.readyMin||13)+" minutes");
    var traf=job.trafficMin||30;
    var vName=job.vendor||"Vendor";
    var cName=job.client||"YOU";
    var vPic=job.vendorPhoto||"";
    var cPic=job.clientPhoto||userPhoto();
    var card=document.getElementById("sn-throw-card")||route;
    card.innerHTML=
      '<div class="pay"><small>TASK</small>'+esc(euro(job.price||0,false))+"</div>"+
      '<div class="who">'+
        '<div class="col">'+face(vPic,vName)+'<div class="nm">'+esc(vName)+"</div></div>"+
        '<div class="link"></div>'+
        '<div class="col">'+face(cPic,cName)+'<div class="nm">'+esc(cName)+"</div></div>"+
      "</div>"+
      '<div class="line what"><b>'+esc((job.what||"Pizza delivery").toUpperCase())+"</b></div>"+
      '<div class="line ready">'+ready+"</div>"+
      '<div class="line">From '+esc(job.from||vName)+" → "+esc(job.to||"Your pin")+"</div>"+
      '<div class="line">'+esc(vName)+" to "+esc(cName)+"</div>"+
      '<div class="line km">'+km(job.km||3.2)+" · "+traf+" min in heavy traffic</div>"+
      '<div class="acts"><button type="button" class="yes" data-x="yes">ACCEPT</button><button type="button" class="no" data-x="no">DECLINE</button></div>';
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
      el.__job=job;
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
    ctx();
    if(job && !job.__delayed){
      job.__delayed=true;
      try{ if(window.SN&&SN.talk) SN.talk("Three seconds. Home screen."); }catch(e){}
      var btn=document.getElementById("sn-tasks-btn");
      var left=3;
      if(btn) btn.textContent="3";
      var iv=setInterval(function(){
        left--;
        if(btn) btn.textContent=left>0?String(left):"TASKS";
        if(left<=0) clearInterval(iv);
      }, 1000);
      setTimeout(function(){ throwSplash(job); }, 3200);
      return;
    }
    var el=document.getElementById("sn-throw");
    if(!el){
      el=document.createElement("div");
      el.id="sn-throw";
      el.innerHTML='<div class="card" id="sn-throw-card"></div>';
      document.body.appendChild(el);
      el.addEventListener("click", function(e){
        var x=e.target && (e.target.getAttribute("data-x")|| (e.target.closest && e.target.closest("[data-x]") && e.target.closest("[data-x]").getAttribute("data-x")));
        if(x==="list"){
          el.classList.remove("on");
          if(window.SN && SN.openTasks) SN.openTasks();
          return;
        }
        if(x==="yes" || x==="take"){
          muteThrow();
          el.classList.remove("on");
          try{ if(window.SN&&SN.talk) SN.talk("Accepted."); }catch(err){}
          return;
        }
        if(x==="no"){
          muteThrow();
          el.classList.remove("on");
          try{
            var id=el.__job&&el.__job.id;
            var list=JSON.parse(localStorage.getItem("sn:tasks")||"[]");
            localStorage.setItem("sn:tasks", JSON.stringify(list.filter(function(t){ return t.id!==id; })));
          }catch(err){}
          try{ if(window.SN&&SN.talk) SN.talk("Declined."); }catch(err){}
          return;
        }
        if(x==="1"){ el.classList.remove("on"); }
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
