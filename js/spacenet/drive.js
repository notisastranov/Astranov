/* SpaceNet 4095 — GPS toggles drone view vs driving view on the city map. */
(function(){
  if(window.__snDrive) return;
  window.__snDrive=true;
  var on=false, watch=null, last=null, heading=0, steps=[], geom=[], savedLayer="dark", navEl=null;
  function talk(s){ if(window.SN&&SN.talk) SN.talk(s); else { var el=document.getElementById("line"); if(el) el.textContent=s; } }
  function cityOn(){ var c=document.getElementById("city"); return !!(c&&c.classList.contains("on")); }
  function map(){ return window.__snMap||null; }
  function css(){
    if(document.getElementById("sn-drive-css")) return;
    var s=document.createElement("style");
    s.id="sn-drive-css";
    s.textContent=
      "#gps.drive .lbl{color:#ffd85a;text-shadow:0 0 8px #ffd85a}"+
      "#gps.drive .tgt{border-color:#ffd85a;box-shadow:0 0 14px #ffd85a}"+
      "#sn-nav{position:fixed;left:50%;top:max(56px,env(safe-area-inset-top));transform:translateX(-50%);z-index:49;display:none;max-width:min(420px,92vw);padding:10px 14px;border-radius:14px;border:1px solid rgba(255,216,90,.7);background:rgba(4,16,28,.94);color:#ffd85a;font:800 13px/1.25 system-ui;letter-spacing:.04em;text-align:center;pointer-events:none}"+
      "#sn-nav.on{display:block}"+
      "#sn-nav small{display:block;margin-top:4px;color:#e8fbff;font:650 11px/1.3 system-ui;letter-spacing:.08em}"+
      ".sn-you-bike.drive .emo{transform-origin:50% 70%}";
    document.head.appendChild(s);
  }
  function nav(){
    if(navEl) return navEl;
    navEl=document.createElement("div");
    navEl.id="sn-nav";
    document.body.appendChild(navEl);
    return navEl;
  }
  function gpsBtn(){ return document.getElementById("gps"); }
  function paintGps(){
    var g=gpsBtn(); if(!g) return;
    var lbl=g.querySelector(".lbl");
    g.classList.toggle("drive", on);
    if(lbl) lbl.textContent=on?"DRIVE":(cityOn()?"DRONE":"GPS");
  }
  function youFromMap(){
    var m=map(), found=null;
    if(m&&m.eachLayer){
      m.eachLayer(function(l){
        if(!l||!l.getLatLng) return;
        if(l._snBike) found=l.getLatLng();
        if(!found && l.options && l.options.zIndexOffset===2800) found=l.getLatLng();
      });
    }
    return found;
  }
  function destFromRoute(){
    var m=map(), end=null, best=0;
    if(m&&m.eachLayer){
      m.eachLayer(function(l){
        if(!l||!l.getLatLngs) return;
        var pts=l.getLatLngs();
        if(!pts||!pts.length) return;
        if(typeof pts[0].lat!=="number" && pts[0]&&pts[0].length) pts=pts[0];
        if(pts.length>best){ best=pts.length; end=pts[pts.length-1]; }
      });
    }
    return end;
  }
  function km(a,b){
    if(!a||!b) return 0;
    var x=(a.lat-b.lat)*111.32, y=(a.lng-b.lng)*111.32*Math.cos((a.lat||0)*Math.PI/180);
    return Math.sqrt(x*x+y*y);
  }
  function ahead(ll, deg, meters){
    var r=(deg||0)*Math.PI/180;
    var dlat=Math.cos(r)*meters/111320;
    var dlng=Math.sin(r)*meters/(111320*Math.max(0.2, Math.cos((ll.lat||0)*Math.PI/180)));
    return {lat:ll.lat+dlat, lng:ll.lng+dlng};
  }
  function fatLine(drive){
    var m=map(); if(!m) return;
    m.eachLayer(function(l){
      if(!l||!l.setStyle||!l.getLatLngs||l.getLatLng) return;
      try{
        var pts=l.getLatLngs(); if(!pts||pts.length<2) return;
        if(drive) l.setStyle({color:"#4df0ff",weight:8,opacity:0.95,dashArray:null,lineCap:"round"});
        else l.setStyle({color:"#7ee9ff",weight:2,opacity:0.85,dashArray:"6 10"});
      }catch(e){}
    });
  }
  function fetchRoute(from, to){
    if(!from||!to) return;
    var url="https://router.project-osrm.org/route/v1/driving/"+from.lng+","+from.lat+";"+to.lng+","+to.lat+"?overview=full&geometries=geojson&steps=true";
    fetch(url,{headers:{Accept:"application/json"}}).then(function(r){ return r.json(); }).then(function(j){
      var r=j&&j.routes&&j.routes[0]; if(!r) return;
      var c=r.geometry&&r.geometry.coordinates||[];
      geom=c.map(function(x){ return [x[1],x[0]]; });
      steps=[];
      (r.legs||[]).forEach(function(leg){
        (leg.steps||[]).forEach(function(st){ steps.push(st); });
      });
      var m=map();
      if(m&&window.L&&geom.length>1){
        if(window.__snDriveLine){ try{ m.removeLayer(window.__snDriveLine);}catch(e){} }
        window.__snDriveLine=window.L.polyline(geom,{color:"#4df0ff",weight:8,opacity:0.95,lineCap:"round",interactive:false}).addTo(m);
      }
      paintTurn(from);
    }).catch(function(){});
  }
  function stepText(st){
    if(!st) return "";
    var man=st.maneuver||{};
    var t=String(man.modifier||man.type||"").replace(/_/g," ");
    var road=st.name||"the road";
    var d=Math.max(0, Math.round(st.distance||0));
    if(!t||t==="depart") return "Stay on "+road;
    if(t.indexOf("left")>=0) return "Left onto "+road+" in "+d+" m";
    if(t.indexOf("right")>=0) return "Right onto "+road+" in "+d+" m";
    if(t.indexOf("uturn")>=0) return "U-turn in "+d+" m";
    if(t.indexOf("arrive")>=0) return "Arrive in "+d+" m";
    return t+" · "+road+" · "+d+" m";
  }
  function paintTurn(here){
    var el=nav();
    if(!on){ el.classList.remove("on"); return; }
    var next=null, i;
    for(i=0;i<steps.length;i++){
      var st=steps[i], man=st.maneuver||{}, loc=man.location;
      if(!loc) continue;
      var p={lat:loc[1],lng:loc[0]};
      var type=String(man.type||"");
      if(type==="depart") continue;
      if(here && km(here,p)>0.012 && type!=="arrive") { next=st; break; }
      if(!here){ next=st; break; }
    }
    var t=stepText(next)||"Follow the glowing line";
    el.innerHTML=t+'<small>DRIVING VIEW</small>';
    el.classList.add("on");
  }
  function follow(){
    if(!on) return;
    var m=map();
    var here=last||youFromMap();
    if(!m||!here) return;
    var look=ahead(here, heading, 38);
    try{ m.setView([look.lat, look.lng], Math.max(m.getZoom(), 18), {animate:true, duration:0.35}); }catch(e){}
    var emo=document.querySelector(".sn-you-bike .emo");
    if(emo){
      emo.style.transform="rotate("+heading+"deg)";
      emo.parentElement&&emo.parentElement.classList.add("drive");
    }
    fatLine(true);
    paintTurn(here);
  }
  function startWatch(){
    if(watch||!navigator.geolocation) return;
    watch=navigator.geolocation.watchPosition(function(p){
      var c=p&&p.coords; if(!c) return;
      last={lat:+c.latitude, lng:+c.longitude};
      if(isFinite(c.heading) && c.heading>=0) heading=c.heading;
      else if(window.__snDrivePrev){
        var dlat=last.lat-window.__snDrivePrev.lat, dlng=last.lng-window.__snDrivePrev.lng;
        if(Math.hypot(dlat,dlng)>0.00004) heading=(Math.atan2(dlng,dlat)*180/Math.PI+360)%360;
      }
      window.__snDrivePrev=last;
      if(on) follow();
    }, function(){}, {enableHighAccuracy:true,maximumAge:1000,timeout:8000});
  }
  function enter(){
    on=true;
    css();
    savedLayer=(document.querySelector("#sn-layers [data-layer].on")||{}).getAttribute&&null;
    try{
      var active=document.querySelector("#sn-layers button.on, #sn-layers [data-layer].on");
      savedLayer=active?active.getAttribute("data-layer"):"dark";
    }catch(e){ savedLayer="dark"; }
    if(window.SN&&SN.setLayer) SN.setLayer("streets");
    startWatch();
    var here=last||youFromMap();
    var dest=destFromRoute();
    if(here&&dest) fetchRoute(here, dest);
    follow();
    paintGps();
    talk("Driving view. Stay on the glowing line. I will call the turns.");
  }
  function leave(){
    on=false;
    if(navEl) navEl.classList.remove("on");
    fatLine(false);
    if(window.SN&&SN.setLayer) SN.setLayer(savedLayer||"dark");
    var emo=document.querySelector(".sn-you-bike .emo");
    if(emo){ emo.style.transform=""; }
    var m=map(), here=last||youFromMap();
    if(m&&here){ try{ m.setView([here.lat,here.lng], 16); }catch(e){} }
    paintGps();
    talk("Drone view.");
  }
  function toggle(){
    css();
    if(!cityOn()){
      if(window.SN&&SN.goHere) SN.goHere();
      return;
    }
    if(on) leave(); else enter();
  }
  function hook(){
    var g=gpsBtn();
    if(!g||g.__snDrive) return;
    g.__snDrive=true;
    g.addEventListener("click", function(e){
      if(g.dataset.skipClick==="1") return;
      if(!cityOn()) return;
      e.preventDefault();
      e.stopImmediatePropagation();
      toggle();
    }, true);
    paintGps();
  }
  var obs=new MutationObserver(function(){ paintGps(); if(!cityOn()&&on) leave(); });
  if(document.getElementById("city")) obs.observe(document.getElementById("city"),{attributes:true,attributeFilter:["class"]});
  if(document.readyState==="loading") document.addEventListener("DOMContentLoaded", hook);
  else hook();
  setInterval(hook, 1200);
  window.SNDrive={toggle:toggle,on:function(){ return on; }};
})();
