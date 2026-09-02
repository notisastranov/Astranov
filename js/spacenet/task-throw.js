/* SpaceNet 4131 — map offers, waypoints, en-route gap fill, surge to 1 AV€/km floor. */
(function(){
  if(window.__snTaskThrow) return;
  window.__snTaskThrow=true;

  var COLORS=["#4df0ff","#ff8ad4","#ffd85a","#19e68c","#b44dff"];
  var offers=[];
  var layers=[];
  var selected=null;
  var skipped={};
  var AVKM=1;

  function esc(s){ return String(s||"").replace(/[&<>"']/g,function(c){return "&#"+c.charCodeAt(0)+";";}); }
  function euro(n){
    n=Math.round(Math.abs(Number(n)||0));
    var s=String(n), bits=[];
    while(s.length>3){ bits.unshift(s.slice(-3)); s=s.slice(0,-3); }
    if(s) bits.unshift(s);
    return "AV€ "+bits.join(".");
  }
  function kmTxt(n){
    n=Number(n)||0;
    var s=n.toFixed(1).replace(".",",");
    if(/,0$/.test(s)) s=s.slice(0,-2);
    return s+" km";
  }
  function read(k,d){ try{ var v=localStorage.getItem(k); return v==null?d:v; }catch(e){ return d; } }
  function write(k,v){ try{ localStorage.setItem(k, typeof v==="string"?v:JSON.stringify(v)); }catch(e){} }
  function who(){
    try{ var u=JSON.parse(read("sn:user","null")||"null"); if(u&&(u.name||u.email)) return String(u.name||u.email).split("@")[0]; }catch(e){}
    return "YOU";
  }
  function userPhoto(){
    try{ var u=JSON.parse(read("sn:user","null")||"null"); if(u&&u.photo) return String(u.photo); }catch(e){}
    return "";
  }
  function prefs(){
    try{ return JSON.parse(read("sn:drive","null")||"null")||{food:1,parcel:1,grocery:1,other:1,maxKm:25,maxKg:30,vol:"box"}; }catch(e){ return {food:1,parcel:1,grocery:1,other:1,maxKm:25,maxKg:30,vol:"box"}; }
  }
  function savePrefs(p){ write("sn:drive", p); }
  function chain(){
    try{ return JSON.parse(read("sn:chain","[]")||"[]"); }catch(e){ return []; }
  }
  function saveChain(c){ write("sn:chain", c); }

  function css(){
    var s=document.getElementById("sn-throw-css");
    if(s) s.remove();
    s=document.createElement("style");
    s.id="sn-throw-css";
    s.textContent=
      "#sn-tasks-btn{display:flex!important;align-items:center;justify-content:center;z-index:50;pointer-events:auto;touch-action:manipulation}"+
      "#sn-throw{display:none!important}"+
      ".sn-off-end{position:relative;width:56px;height:72px;pointer-events:auto}"+
      ".sn-off-face{width:44px;height:44px;margin:14px auto 0;border-radius:99px;overflow:hidden;border:2px solid var(--c,#4df0ff);background:#000;box-shadow:0 0 12px var(--c,#4df0ff);display:flex;align-items:center;justify-content:center;font:800 16px system-ui;color:#4df0ff}"+
      ".sn-off-face img{width:100%;height:100%;object-fit:cover;display:block}"+
      ".sn-off-badge{position:absolute;left:50%;top:0;transform:translate(-50%,-2px);white-space:nowrap;font:800 10px/1.1 system-ui;letter-spacing:.06em;color:#fff;background:rgba(0,8,16,.82);border:1px solid var(--c,#4df0ff);border-radius:8px;padding:3px 6px;text-shadow:0 0 6px var(--c,#4df0ff);z-index:2}"+
      ".sn-off-badge.pri{color:#02040a;background:#ffd85a;border-color:#ffd85a;text-shadow:none}"+
      ".sn-off-nm{position:absolute;left:50%;top:60px;transform:translateX(-50%);white-space:nowrap;font:800 9px/1 system-ui;letter-spacing:.04em;color:#c6f6ff;text-shadow:0 0 6px #02040a}"+
      ".sn-off-mid{text-align:center;pointer-events:auto;transform:translate(-50%,-70%)}"+
      ".sn-off-pay{font:900 20px/1 ui-monospace,system-ui;color:#4df0ff;text-shadow:0 0 8px #3d6bff,0 0 18px #4df0ff;white-space:nowrap}"+
      ".sn-off-km{margin-top:22px;font:800 11px/1 system-ui;color:#7ee9ff;text-shadow:0 0 6px #02040a;letter-spacing:.08em}"+
      ".sn-off-acts{display:flex;justify-content:center;gap:8px;margin-top:4px}"+
      ".sn-off-acts b,.sn-off-acts i{display:flex;width:28px;height:28px;align-items:center;justify-content:center;border-radius:99px;font:800 14px/1 system-ui;font-style:normal;cursor:pointer}"+
      ".sn-off-acts b{background:#19e68c;color:#00140a;box-shadow:0 0 10px #19e68c}"+
      ".sn-off-acts i{background:#000;color:#ff3b4e;border:1.5px solid #ff3b4e;box-shadow:0 0 8px #ff3b4e}"+
      ".sn-off-sel .sn-off-pay{color:#fff;text-shadow:0 0 10px #ffd85a}"+
      ".sn-off-way{position:absolute;left:-4px;bottom:12px;width:18px;height:18px;border-radius:99px;background:#02040a;border:1.5px solid var(--c,#4df0ff);color:#7ee9ff;font:800 10px/16px system-ui;text-align:center;z-index:3}"+
      ".sn-off-loy{font:800 9px/1 system-ui;letter-spacing:.12em;color:#ffd85a;text-shadow:0 0 8px #ffd85a;margin:0 0 3px}"+
      ".sn-off-fit{font:800 9px/1 system-ui;letter-spacing:.12em;color:#19e68c;text-shadow:0 0 8px #19e68c;margin:0 0 4px}"+
      ".sn-off-adv{font:700 9px/1.2 system-ui;color:#ffe14a;margin-top:4px;letter-spacing:.04em}"+
      "#sn-drive{position:fixed;left:50%;bottom:calc(env(safe-area-inset-bottom) + 58px);transform:translateX(-50%);z-index:70;width:min(360px,94vw);padding:10px;border-radius:14px;background:rgba(4,14,28,.94);border:1px solid rgba(126,233,255,.45);color:#c6f6ff;font:600 12px/1.3 system-ui;display:none;pointer-events:auto}"+
      "#sn-drive.on{display:block}"+
      "#sn-drive b{display:block;color:#7ee9ff;font:800 10px/1 system-ui;letter-spacing:.16em;margin:0 0 8px}"+
      "#sn-drive .row{display:flex;flex-wrap:wrap;gap:6px;margin:0 0 8px}"+
      "#sn-drive button{height:32px;padding:0 10px;border-radius:9px;border:1px solid rgba(126,233,255,.35);background:rgba(4,16,28,.9);color:#7ee9ff;font:800 10px/1 system-ui;letter-spacing:.06em}"+
      "#sn-drive button.on{border-color:#4df0ff;background:rgba(20,60,80,.7);box-shadow:0 0 10px rgba(77,240,255,.45)}";
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
  function ping(){
    var c=ctx(); if(!c) return;
    var t0=c.currentTime, g=c.createGain(), o=c.createOscillator(), o2=c.createOscillator();
    g.gain.setValueAtTime(0.0001,t0);
    g.gain.exponentialRampToValueAtTime(0.4,t0+0.05);
    g.gain.exponentialRampToValueAtTime(0.0001,t0+1.2);
    o.type="sine"; o.frequency.setValueAtTime(432,t0); o.frequency.exponentialRampToValueAtTime(108,t0+1.1);
    o2.type="sine"; o2.frequency.setValueAtTime(1728,t0); o2.frequency.exponentialRampToValueAtTime(432,t0+0.9);
    o.connect(g); o2.connect(g); g.connect(c.destination);
    o.start(t0); o.stop(t0+1.25); o2.start(t0); o2.stop(t0+1.25);
  }

  function pin(){
    try{
      var p=JSON.parse(read("sn:place","null")||"null");
      if(p&&isFinite(Number(p.lat))) return {lat:Number(p.lat),lng:Number(p.lng),name:p.name||"YOU"};
    }catch(e){}
    try{ if(window.SN&&SN.getMap){ var m=SN.getMap(); if(m&&m.getCenter){ var c=m.getCenter(); return {lat:c.lat,lng:c.lng,name:"YOU"}; } } }catch(e){}
    return {lat:36.382, lng:28.250, name:"Kalithea"};
  }
  function away(p, kmN, deg){
    var r=Math.max(1.2, Number(kmN)||3.4), a=(Number(deg)||42)*Math.PI/180;
    var dlat=(r/111.32)*Math.cos(a);
    var dlng=(r/(111.32*Math.max(0.2, Math.cos(p.lat*Math.PI/180))))*Math.sin(a);
    return {lat:p.lat+dlat, lng:p.lng+dlng};
  }
  function haversine(a,b){
    var R=6371, f1=a.lat*Math.PI/180, f2=b.lat*Math.PI/180;
    var df=(b.lat-a.lat)*Math.PI/180, dl=(b.lng-a.lng)*Math.PI/180;
    var x=Math.sin(df/2)*Math.sin(df/2)+Math.cos(f1)*Math.cos(f2)*Math.sin(dl/2)*Math.sin(dl/2);
    return 2*R*Math.asin(Math.min(1, Math.sqrt(x)));
  }
  function travelMin(a,b){ return Math.max(2, Math.round(haversine(a,b)*2.4)); }
  function floorPrice(km){ return Math.max(1, Math.ceil((Number(km)||0)*AVKM)); }
  function floorTime(km){ return Math.max(6, Math.round((Number(km)||0)*2.4)+3); }
  function applyLaw(j){
    if(!j||!j.from||!j.to) return j;
    j.km=+haversine(j.from,j.to).toFixed(1);
    var floor=floorPrice(j.km), need=floorTime(j.km);
    if(j.basePrice==null) j.basePrice=Math.max(Number(j.price)||0, floor);
    j.price=Math.max(j.basePrice, floor);
    j.tight=(j.deliverMin||0)<need;
    j.needMin=Math.max(j.deliverMin||need, need);
    if(!j.t0) j.t0=Date.now();
    j.loyalty=j.loyalty||0;
    j.flexMin=j.flexMin||0;
    return j;
  }
  function surgeTick(){
    var now=Date.now(), dirty=false;
    offers.forEach(function(j){
      var steps=Math.floor((now-(j.t0||now))/18000);
      var loy=Math.min(30, steps);
      var bump=Math.min(20, steps);
      var np=Math.max(floorPrice(j.km), (j.basePrice||j.price)+bump);
      var flex=steps>=8?5:0;
      if(loy!==j.loyalty || np!==j.price || flex!==(j.flexMin||0)){
        j.loyalty=loy; j.price=np; j.flexMin=flex; dirty=true;
      }
    });
    if(dirty) paint();
  }
  function timelineOk(jobs, you){
    var t=0, here=you, i, j, due;
    for(i=0;i<jobs.length;i++){
      j=jobs[i];
      if(j.priority && i>0) return false;
      t+=travelMin(here, j.from);
      t=Math.max(t, j.readyMin||0);
      t+=travelMin(j.from, j.to);
      due=(j.deliverMin||30)+(j.flexMin||0);
      if(j.tight) due=Math.max(due, j.needMin||due);
      if(t>due+2) return false;
      here=j.to;
    }
    return true;
  }
  function extraKm(ch, i, job, you){
    var prev=i===0?you:ch[i-1].to;
    var nxt=i<ch.length?ch[i].from:null;
    var add=haversine(prev, job.from)+haversine(job.from, job.to);
    if(nxt) add+=haversine(job.to, nxt)-haversine(prev, nxt);
    return add;
  }
  function bestInsert(job, ch, you){
    if(!job) return null;
    if(job.priority && ch.length) return null;
    if(ch.some(function(x){ return x.priority; })) return null;
    var best=null, i, next, extra;
    for(i=0;i<=ch.length;i++){
      next=ch.slice(0,i).concat([job], ch.slice(i));
      if(!timelineOk(next, you)) continue;
      extra=extraKm(ch, i, job, you);
      if(!best || extra<best.extra) best={at:i, extra:extra};
    }
    return best;
  }
  function arcPts(a,b){
    var lat1=a.lat, lng1=a.lng, lat2=b.lat, lng2=b.lng;
    var dlat=lat2-lat1, dlng=lng2-lng1;
    var ox=-dlng, oy=dlat, n=Math.hypot(ox,oy)||1;
    var lift=Math.max(0.012, Math.hypot(dlat,dlng)*0.42);
    var cx=(lat1+lat2)/2+ox/n*lift, cy=(lng1+lng2)/2+oy/n*lift;
    var pts=[], i, t, u;
    for(i=0;i<=24;i++){
      t=i/24; u=1-t;
      pts.push([u*u*lat1+2*u*t*cx+t*t*lat2, u*u*lng1+2*u*t*cy+t*t*lng2]);
    }
    return pts;
  }
  function midPt(pts){ return pts[Math.floor(pts.length/2)]; }

  function getMap(){
    try{ if(window.SN&&SN.getMap){ var m=SN.getMap(); if(m) return m; } }catch(e){}
    return window.__snLeaflet||null;
  }
  function hookMap(){
    if(!window.L||!L.Map||L.Map.prototype.setView.__snCap) return;
    function cap(){ window.__snLeaflet=this; }
    ["setView","fitBounds","invalidateSize"].forEach(function(n){
      var orig=L.Map.prototype[n];
      if(!orig) return;
      L.Map.prototype[n]=function(){ cap.call(this); return orig.apply(this, arguments); };
    });
    L.Map.prototype.setView.__snCap=true;
  }
  function ensureMap(then){
    hookMap();
    var m=getMap();
    var el=document.getElementById("city");
    if(el&&el.classList.contains("on")&&m){ then(m); return; }
    var you=pin();
    if(window.SN&&SN.showMap) SN.showMap(you, 14);
    var n=0, t=setInterval(function(){
      m=getMap();
      if(m||++n>40){ clearInterval(t); if(m) then(m); }
    }, 80);
  }

  function samples(){
    var you=pin();
    var a=away(you, 3.4, 38);
    var b=away(you, 1.8, 210);
    var c=away(you, 6.1, 120);
    var d=away(you, 4.2, 300);
    var t=Date.now();
    return [
      {id:"off-"+t+"-a", price:24, what:"Pizza delivery", kind:"food", kg:2, vol:"bag", vendor:"Kalithea Oven", client:who(), from:a, to:{lat:you.lat,lng:you.lng}, readyMin:13, deliverMin:30, priority:false, vendorPhoto:"", clientPhoto:userPhoto()},
      {id:"off-"+t+"-b", price:18, what:"Pharmacy run", kind:"parcel", kg:1, vol:"bag", vendor:"Night Pharmacy", client:who(), from:b, to:{lat:you.lat,lng:you.lng}, readyMin:5, deliverMin:12, priority:true, vendorPhoto:"", clientPhoto:userPhoto()},
      {id:"off-"+t+"-c", price:33, what:"Grocery haul", kind:"grocery", kg:12, vol:"box", vendor:"Lidl Rhodes", client:who(), from:c, to:away(you,0.6,80), readyMin:20, deliverMin:45, priority:false, vendorPhoto:"", clientPhoto:userPhoto()},
      {id:"off-"+t+"-d", price:28, what:"Documents", kind:"parcel", kg:0.4, vol:"bag", vendor:"Notary", client:"Port desk", from:d, to:away(you,2.1,15), readyMin:8, deliverMin:22, priority:false, vendorPhoto:"", clientPhoto:""}
    ].map(function(j){
      j.to.name=j.client; j.from.name=j.vendor;
      return applyLaw(j);
    });
  }

  function allowed(j){
    var p=prefs();
    if(j.kind==="food"&&!p.food) return false;
    if(j.kind==="parcel"&&!p.parcel) return false;
    if(j.kind==="grocery"&&!p.grocery) return false;
    if(j.kind==="other"&&!p.other) return false;
    if(p.maxKm && j.km>p.maxKm) return false;
    if(p.maxKg && j.kg>p.maxKg) return false;
    var vol={bag:1,box:2,van:3};
    if((vol[j.vol]||1)>(vol[p.vol]||2)) return false;
    return true;
  }

  function fitsChain(job, ch){
    return !!bestInsert(job, ch||[], pin());
  }

  function faceHtml(src, letter, color){
    var img=src?'<img alt="" src="'+esc(src)+'">':esc((letter||"?").slice(0,1).toUpperCase());
    return '<div class="sn-off-face" style="--c:'+color+'">'+img+"</div>";
  }
  function endIcon(job, which, color, way){
    var shop=which==="v";
    var name=shop?job.vendor:job.client;
    var pic=shop?job.vendorPhoto:job.clientPhoto;
    var badge=shop?("Ready "+(job.readyMin||13)+" min"):(job.priority?"PRIORITY":("Due "+(job.deliverMin||30)+" min"));
    var cls=(!shop&&job.priority)?"sn-off-badge pri":"sn-off-badge";
    var wayHtml=way?('<div class="sn-off-way">'+esc(String(way))+"</div>"):"";
    var html='<div class="sn-off-end" style="--c:'+color+'"><div class="'+cls+'">'+esc(badge)+"</div>"+faceHtml(pic,name,color)+wayHtml+'<div class="sn-off-nm">'+esc(String(name||"").slice(0,16))+"</div></div>";
    return window.L.divIcon({className:"", html:html, iconSize:[56,72], iconAnchor:[28,36]});
  }
  function midIcon(job, color, on){
    var loy=job.loyalty?('<div class="sn-off-loy">+'+job.loyalty+"% LOYAL</div>"):"";
    var fit=job.fit?('<div class="sn-off-fit">FITS YOUR RUN</div>'):"";
    var adv=[];
    if(job.price<=floorPrice(job.km)) adv.push("FLOOR 1/km");
    if(job.tight) adv.push("NEED "+job.needMin+" MIN");
    if(job.flexMin) adv.push("+"+job.flexMin+" MIN?");
    var advHtml=adv.length?('<div class="sn-off-adv">'+esc(adv.join(" · "))+"</div>"):"";
    var html='<div class="sn-off-mid'+(on?" sn-off-sel":"")+'" data-id="'+esc(job.id)+'">'+loy+fit+
      '<div class="sn-off-pay" style="color:'+color+'">'+esc(euro(job.price))+"</div>"+
      '<div class="sn-off-acts"><b data-x="yes" data-id="'+esc(job.id)+'">+</b><i data-x="no" data-id="'+esc(job.id)+'">×</i></div>'+
      '<div class="sn-off-km">'+esc(kmTxt(job.km))+"</div>"+advHtml+"</div>";
    return window.L.divIcon({className:"", html:html, iconSize:[170,110], iconAnchor:[85,48]});
  }
  function clearLayers(){
    layers.forEach(function(g){ try{ var m=getMap(); if(m) m.removeLayer(g); }catch(e){} });
    layers=[];
  }

  function paint(){
    hookMap();
    var map=getMap();
    if(!map||!window.L) return;
    clearLayers();
    var you=pin();
    var ch=chain();
    var bounds=[[you.lat,you.lng]];
    var n=1;
    function addLine(pts, color, w, dash, click){
      var g=L.layerGroup();
      var opt={color:color,weight:w,opacity:0.9,className:"sn-arc-fill"};
      if(dash) opt.dashArray=dash;
      var line=L.polyline(pts, opt);
      if(click) line.on("click", click);
      g.addLayer(line);
      g.addTo(map); layers.push(g);
      return g;
    }
    ch.forEach(function(job, i){
      applyLaw(job);
      var color="#4df0ff";
      var prev=i===0?you:ch[i-1].to;
      addLine(arcPts(prev, job.from), "#19e68c", 3, "4 8");
      addLine(arcPts(job.from, job.to), color, 5);
      var g=L.layerGroup();
      g.addLayer(L.marker([job.from.lat,job.from.lng],{icon:endIcon(job,"v",color,n++),keyboard:false,zIndexOffset:1900}));
      g.addLayer(L.marker([job.to.lat,job.to.lng],{icon:endIcon(job,"c",color,n++),keyboard:false,zIndexOffset:1900}));
      var mid=midPt(arcPts(job.from, job.to));
      g.addLayer(L.marker(mid,{icon:window.L.divIcon({className:"",html:'<div class="sn-off-pay">'+esc(euro(job.price))+"</div>",iconSize:[120,24],iconAnchor:[60,12]}),interactive:false,zIndexOffset:2100}));
      g.addTo(map); layers.push(g);
      bounds.push([job.from.lat,job.from.lng],[job.to.lat,job.to.lng]);
    });
    offers.forEach(function(job, i){
      if(skipped[job.id]) return;
      applyLaw(job);
      var ins=bestInsert(job, ch, you);
      job.fit=!!ins;
      if(ch.length && !ins) return;
      var color=COLORS[i%COLORS.length];
      var pts=arcPts(job.from, job.to);
      var g=L.layerGroup();
      var line=L.polyline(pts,{color:color,weight:job.id===selected?7:4,opacity:0.9,className:"sn-arc-fill"});
      line.on("click", function(e){ try{ L.DomEvent.stopPropagation(e);}catch(_){} selected=job.id; paint(); talkOne(job); });
      g.addLayer(line);
      var wayV=null, wayC=null;
      if(ins){ wayV=n+ins.at*2; wayC=wayV+1; }
      g.addLayer(L.marker([job.from.lat,job.from.lng],{icon:endIcon(job,"v",color,wayV),keyboard:false,zIndexOffset:1800}));
      g.addLayer(L.marker([job.to.lat,job.to.lng],{icon:endIcon(job,"c",color,wayC),keyboard:false,zIndexOffset:1800}));
      var mk=L.marker(midPt(pts),{icon:midIcon(job,color,job.id===selected),keyboard:false,zIndexOffset:2200});
      mk.on("click", function(e){
        try{ L.DomEvent.stopPropagation(e);}catch(_){}
        var tg=e.originalEvent&&e.originalEvent.target;
        var x=tg&&tg.getAttribute&&tg.getAttribute("data-x");
        var id=tg&&tg.getAttribute&&tg.getAttribute("data-id")||job.id;
        if(x==="yes"){ accept(id); return; }
        if(x==="no"){ decline(id); return; }
        selected=job.id; paint(); talkOne(job);
      });
      g.addLayer(mk);
      g.addTo(map); layers.push(g);
      if(ins && ch.length){
        var prev=ins.at===0?you:ch[ins.at-1].to;
        addLine(arcPts(prev, job.from), "#19e68c", 2, "6 8");
        if(ins.at<ch.length) addLine(arcPts(job.to, ch[ins.at].from), "#19e68c", 2, "6 8");
      }
      bounds.push([job.from.lat,job.from.lng],[job.to.lat,job.to.lng]);
    });
    if(bounds.length>=2){
      try{ map.fitBounds(bounds,{padding:[72,96],maxZoom:15,animate:true}); }catch(e){}
    }
  }
  function talkOne(job){
    var bits=[job.what, euro(job.price), kmTxt(job.km)];
    if(job.fit) bits.push("Fits your run.");
    bits.push(job.priority?"Priority. No stops.":("Due in "+(job.deliverMin||30)+" minutes."));
    bits.push("Ready in "+job.readyMin+".");
    bits.push("Floor one AVE per kilometer.");
    if(job.loyalty) bits.push("Plus "+job.loyalty+" percent loyalty.");
    try{ if(window.SN&&SN.talk) SN.talk(bits.join(" ")); }catch(e){}
  }

  function accept(id){
    var job=offers.filter(function(x){ return x.id===id; })[0];
    if(!job) return;
    applyLaw(job);
    var you=pin();
    var ch=chain();
    var ins=bestInsert(job, ch, you);
    if(ch.length && !ins){
      try{ if(window.SN&&SN.talk) SN.talk("Does not fit your time. Ignore it or wait."); }catch(e){}
      return;
    }
    var at=ins?ins.at:ch.length;
    job.etaMin=(job.readyMin||0)+(job.deliverMin||20);
    ch=ch.slice(0,at).concat([job], ch.slice(at));
    saveChain(ch);
    offers=offers.filter(function(x){ return x.id!==id; });
    selected=null;
    paint();
    try{
      if(window.SN&&SN.talk) SN.talk(ch.length>1?("Stacked. Waypoint "+(at*2+1)+". "+ch.length+" jobs. First come first served."):("Accepted. "+euro(job.price)+". One AVE per kilometer."));
    }catch(e){}
    ping();
  }
  function decline(id){
    skipped[id]=1;
    if(selected===id) selected=null;
    paint();
    try{ if(window.SN&&SN.talk) SN.talk("Ignored. It will climb until someone takes it."); }catch(e){}
  }

  function throwOffers(list){
    css();
    ctx();
    ping();
    offers=(list&&list.length?list:samples()).filter(allowed);
    if(!offers.length){
      try{ if(window.SN&&SN.talk) SN.talk("No offers match your preferences."); }catch(e){}
      openPrefs();
      return;
    }
    selected=offers[0]&&offers[0].id;
    ensureMap(function(){
      paint();
      var ch=chain();
      var fit=offers.filter(function(j){ return !ch.length || bestInsert(j,ch,pin()); }).length;
      try{ if(window.SN&&SN.talk) SN.talk((ch.length?fit+" gap fills on your run. ":"")+offers.length+" offers. First come first served. Floor one AVE per kilometer."); }catch(e){}
    });
  }

  function openPrefs(){
    css();
    var box=document.getElementById("sn-drive");
    if(!box){
      box=document.createElement("div");
      box.id="sn-drive";
      document.body.appendChild(box);
      box.addEventListener("click", function(e){
        var k=e.target&&e.target.getAttribute("data-k");
        if(!k) return;
        var p=prefs();
        if(k==="x"){ box.classList.remove("on"); return; }
        if(k==="food"||k==="parcel"||k==="grocery"||k==="other"){ p[k]=p[k]?0:1; }
        if(k==="km5") p.maxKm=5; if(k==="km12") p.maxKm=12; if(k==="km25") p.maxKm=25; if(k==="km99") p.maxKm=99;
        if(k==="kg5") p.maxKg=5; if(k==="kg15") p.maxKg=15; if(k==="kg30") p.maxKg=30;
        if(k==="bag"||k==="box"||k==="van") p.vol=k;
        savePrefs(p); drawPrefs(); throwOffers(samples());
      });
    }
    function drawPrefs(){
      var p=prefs();
      function on(v){ return v?" on":""; }
      box.innerHTML='<b>DRIVER PREFS</b>'+
        '<div class="row"><button data-k="food" class="'+on(p.food)+'">FOOD</button><button data-k="parcel" class="'+on(p.parcel)+'">PARCEL</button><button data-k="grocery" class="'+on(p.grocery)+'">GROCERY</button><button data-k="other" class="'+on(p.other)+'">OTHER</button></div>'+
        '<div class="row"><button data-k="km5" class="'+on(p.maxKm===5)+'">5 KM</button><button data-k="km12" class="'+on(p.maxKm===12)+'">12 KM</button><button data-k="km25" class="'+on(p.maxKm===25)+'">25 KM</button><button data-k="km99" class="'+on(p.maxKm>=99)+'">ANY</button></div>'+
        '<div class="row"><button data-k="kg5" class="'+on(p.maxKg===5)+'">5 KG</button><button data-k="kg15" class="'+on(p.maxKg===15)+'">15 KG</button><button data-k="kg30" class="'+on(p.maxKg===30)+'">30 KG</button></div>'+
        '<div class="row"><button data-k="bag" class="'+on(p.vol==="bag")+'">BAG</button><button data-k="box" class="'+on(p.vol==="box")+'">BOX</button><button data-k="van" class="'+on(p.vol==="van")+'">VAN</button><button data-k="x">DONE</button></div>';
    }
    drawPrefs();
    box.classList.add("on");
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
      var holdT=null, held=false;
      btn.addEventListener("pointerdown", function(){
        held=false;
        holdT=setTimeout(function(){ held=true; openPrefs(); }, 520);
      });
      btn.addEventListener("pointerup", function(){ if(holdT) clearTimeout(holdT); });
      btn.addEventListener("pointerleave", function(){ if(holdT) clearTimeout(holdT); });
      btn.addEventListener("click", function(e){
        e.preventDefault();
        e.stopPropagation();
        if(e.stopImmediatePropagation) e.stopImmediatePropagation();
        if(held){ held=false; return; }
        if(btn.dataset.skipClick==="1"){ btn.dataset.skipClick=""; return; }
        ctx();
        throwOffers();
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
  window.SNThrow={throw:function(job){ throwOffers(job?[job]:null); }, park:park, euro:euro, splash:function(job){ throwOffers(job?[job]:null); }, prefs:openPrefs, accept:accept};
  if(document.readyState==="loading") document.addEventListener("DOMContentLoaded", hook);
  else hook();
  window.addEventListener("resize", park);
  setInterval(hook, 900);
  setInterval(surgeTick, 4000);
})();
