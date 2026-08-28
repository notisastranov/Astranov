(function(){
  if(window.__SN_ALIVE && window.SN && window.SN.run) return;
  var VER="4012";
  window.__SN_ALIVE=true;
  try{ if(navigator.vibrate) navigator.vibrate=function(){return false;}; }catch(e){}
  var canvas=document.getElementById("g");
  var cityEl=document.getElementById("city");
  var lineEl=document.getElementById("line");
  var inEl=document.getElementById("in");
  var form=document.getElementById("f");
  var liveEl=document.getElementById("sn-live");
  var menuEl=document.getElementById("sn-menu");
  var pillEl=document.getElementById("sn-pill");
  var menuScale=1;
  var yaw=0.49, pitch=0.63, dist=1.85, spin=0, drag=null, pinch=null, pointers={}, fly=null;
  var here=null, hereName="", hereAt=0, countryCode="", things={}, vendors=[], selected=null, job=null, currentOffers=[], huntSeq=0, offerSeq=0, locating=null, pendingHunt=null, aim=null, tapScreen=null, placeEl=null, awaiting=null, mapBound=false, mapHeld=false;
  var map=null, mapReady=null, hereMark=null, vendorMark=null, routeLine=null, aimMark=null, callLine=null;
  var listening=false, speaking=false, wantEar=true, rec=null, permsTried=false, mindHist=[];
  function say(t){ if(lineEl&&t!=null) lineEl.textContent=String(t); packSoon(); }
  function noCoords(t){ return String(t||"").replace(/\b-?\d+\.\d+\s*[NS],?\s*-?\d+\.\d+\s*[EW]\b/gi,"").replace(/\b-?\d{1,3}\.\d+\s*,\s*-?\d{1,3}\.\d+\b/g,"").replace(/\s{2,}/g," ").trim(); }
  function talk(t){ t=noCoords(t); if(!t) return; say(t); speaking=true; try{ if(window.speechSynthesis){ speechSynthesis.cancel(); var u=new SpeechSynthesisUtterance(String(t)); u.onend=function(){ speaking=false; if(wantEar) setTimeout(listen,280); }; u.onerror=function(){ speaking=false; if(wantEar) setTimeout(listen,280); }; speechSynthesis.speak(u); return; } }catch(e){} speaking=false; if(wantEar) setTimeout(listen,280); }
  function menuTitle(){
    if(things.pay||things.reload||things.verify) return "PAY";
    if(currentOffers.length) return "CARRIERS";
    if(selected) return String(selected.name||"PLACE").toUpperCase().slice(0,16);
    if(vendors.length) return "VENDORS";
    return "SPACENET";
  }
  function pending(){ return Object.keys(things).length>0 || (liveEl && liveEl.children.length>0); }
  function openMenu(){
    if(!menuEl) return;
    var ttl=menuEl.querySelector(".ttl");
    if(ttl) ttl.textContent=menuTitle();
    menuEl.classList.add("on");
    if(pillEl) pillEl.classList.remove("on","glow");
    packSoon();
  }
  function minMenu(){
    if(menuEl) menuEl.classList.remove("on");
    if(pillEl){
      if(pending()){
        pillEl.textContent=menuTitle();
        pillEl.classList.add("on","glow");
      } else {
        pillEl.classList.remove("on","glow");
      }
    }
    packSoon();
  }
  function clearNeed(){ things={}; if(liveEl) liveEl.innerHTML=""; if(menuEl) menuEl.classList.remove("on"); if(pillEl) pillEl.classList.remove("on","glow"); packSoon(); }
  function need(spec){ spec=spec||{}; var id=spec.id||("m"+Date.now()+Math.random().toString(36).slice(2,6)); things[id]=spec; if(!liveEl) return id; var b=document.createElement("button"); b.type="button"; b.textContent=spec.label||id; b.onclick=function(){ try{ spec.run(); }catch(e){ talk("That step failed. Try again."); } }; liveEl.appendChild(b); openMenu(); return id; }
  var tasksBtn=document.getElementById("sn-tasks-btn");
  var tasksEl=document.getElementById("sn-tasks");
  var tasksList=document.getElementById("sn-tasks-list");
  function loadTasks(){ try{ return JSON.parse(localStorage.getItem("sn:tasks")||"[]"); }catch(e){ return []; } }
  function saveTasks(list){ try{ localStorage.setItem("sn:tasks", JSON.stringify((list||[]).slice(0,80))); }catch(e){} }
  function jobNext(j){
    if(!j) return "";
    if(j.status==="paid") return "Wait for a real associate. Picked → boxed → moving → handed → verified.";
    if(j.carrier && j.price) return "Pay "+j.price+" AVC.";
    if(j.how) return "Pick a carrier.";
    if(j.shop) return "Instant, mail, or pick up.";
    if(j.query) return "Pick the place.";
    return "Finish this.";
  }
  function derivedTasks(){
    var out=[], perish=job?goodsOf(job.query):null;
    if(job && job.status && job.status!=="done"){
      out.push({id:"job-live", role:"user", title:job.query||"Order", next:jobNext(job), status:"open", perish:perish&&perish.strict, hold:perish&&perish.hold, t:job.t||Date.now(), auto:1});
    }
    if(!window.SNWork) return out;
    var all=SNWork.all();
    (all.shops||[]).forEach(function(s){
      if(!s||!s.id) return;
      if(s.hours && (s.menu || (s.menuPhotos&&s.menuPhotos.length))) return;
      out.push({id:"list-shop-"+s.id, role:"vendor", title:s.name||"Shop", next:"Finish hours and menu.", status:"open", listing:s, t:s.t||Date.now(), auto:1});
    });
    (all.drivers||[]).forEach(function(d){
      if(!d||!d.id) return;
      if(d.hours && d.vehicles) return;
      out.push({id:"list-driver-"+d.id, role:"driver", title:d.name||"Driver base", next:"Finish vehicles and working time.", status:"open", listing:d, t:d.t||Date.now(), auto:1});
    });
    (all.drops||[]).forEach(function(d){
      if(!d||!d.id) return;
      if(d.phone || d.doorbell) return;
      out.push({id:"list-drop-"+d.id, role:"user", title:d.label||"Drop", next:"Add phone or doorbell.", status:"open", listing:d, t:d.t||Date.now(), auto:1});
    });
    return out;
  }
  function rankTasks(list){
    list.forEach(function(t){
      var p=50;
      if(t.status==="done") p=90;
      if(t.role==="user" && /Pay |Wait for a real/.test(t.next||"")) p=12;
      if(t.perish) p=6;
      if(t.hold && t.hold<=25) p=4;
      if(t.role==="vendor") p=Math.min(p,28);
      if(t.role==="driver") p=Math.min(p,30);
      if(t.boost!=null) p=Math.min(p, Number(t.boost));
      t.pri=p;
    });
    list.sort(function(a,b){ return (a.pri-b.pri) || ((a.t||0)-(b.t||0)); });
  }
  function paintTasksBtn(){
    if(!tasksBtn) return;
    var n=loadTasks().filter(function(t){ return t.status!=="done"; }).length;
    var open=tasksEl&&tasksEl.classList.contains("on");
    if(!n || open){ tasksBtn.classList.remove("on","glow"); packSoon(); return; }
    tasksBtn.classList.add("on","glow");
    tasksBtn.textContent=n>1?("TASKS "+n):"TASKS";
    packSoon();
  }
  function renderTaskList(){
    if(!tasksList) return;
    var list=loadTasks().filter(function(t){ return t.status!=="done"; });
    if(!list.length){ tasksList.innerHTML='<p class="note">Nothing on you.</p>'; return; }
    tasksList.innerHTML=list.map(function(t){
      var ask=t.ask&&t.ask.state==="wait"?" · waiting on Grok":(t.boost!=null?" · moved":"");
      return '<div class="task" data-id="'+t.id+'"><b>'+String(t.title||"Task").replace(/[<>]/g,"")+'</b><span>'+String(t.role||"").toUpperCase()+" · "+String(t.next||"")+" "+ask+'</span><div class="row"><button type="button" data-act="go">DO</button><button type="button" data-act="problem">PROBLEM</button></div></div>';
    }).join("");
  }
  function openTasks(){ if(!tasksEl) return; syncTasks(); tasksEl.classList.add("on"); renderTaskList(); paintTasksBtn(); setTimeout(pack,40); }
  function hideTasks(){ if(tasksEl) tasksEl.classList.remove("on"); paintTasksBtn(); packSoon(); }
  function toggleTasks(){ if(tasksEl&&tasksEl.classList.contains("on")) hideTasks(); else openTasks(); }
  function goTask(id){
    var t=loadTasks().filter(function(x){ return x.id===id; })[0];
    if(!t) return;
    hideTasks();
    if(t.id==="job-live"){
      if(job&&job.price && job.status!=="paid") return offerPay(job.price);
      if(job&&job.shop && !job.how) return selectVendor(job.shop);
      if(job&&job.query && !job.shop) return hunt(job.query);
      talk(t.next||"This order is waiting on a real associate.");
      return;
    }
    if(t.listing && window.SNWork) return SNWork.open(t.listing);
    talk(t.next||t.title);
  }
  function askProblem(id){
    var t=loadTasks().filter(function(x){ return x.id===id; })[0];
    if(!t) return;
    awaiting={kind:"priority", id:id};
    if(inEl){ inEl.value=""; inEl.placeholder="What's the real difficulty?"; try{ inEl.focus(); }catch(e){} }
    talk("Say the real bind. I'll move it only if it's an emergency — not a preference.");
  }
  function bumpTask(id, ok, say){
    var list=loadTasks(), t=null, i;
    for(i=0;i<list.length;i++) if(list[i].id===id) t=list[i];
    if(!t){ talk(say||"That task is gone."); return; }
    t.ask={reason:"", t:Date.now(), state: ok?"ok":"no"};
    if(ok){ t.boost=1; talk(say||("Moved up: "+t.title+". Only because the bind is real.")); }
    else { t.boost=null; talk(say||"No. That would be jumping the queue for you. I won't."); }
    rankTasks(list); saveTasks(list); renderTaskList(); paintTasksBtn();
  }
  function syncTasks(){
    var old=loadTasks(), by={};
    old.forEach(function(t){ by[t.id]=t; });
    var next=derivedTasks().map(function(t){
      var prev=by[t.id];
      if(prev){ if(prev.boost!=null) t.boost=prev.boost; if(prev.ask) t.ask=prev.ask; }
      return t;
    });
    rankTasks(next); saveTasks(next); paintTasksBtn();
    if(tasksEl&&tasksEl.classList.contains("on")) renderTaskList();
  }
  function lookAt(p){ if(!p||!isFinite(p.lat)||!isFinite(p.lng)) return; yaw=p.lng*Math.PI/180; pitch=Math.max(-1.15, Math.min(1.15, p.lat*Math.PI/180)); spin=0; }
  function facingPoint(){ var lat=pitch*180/Math.PI, lng=yaw*180/Math.PI; while(lng>180) lng-=360; while(lng<-180) lng+=360; return {lat:lat,lng:lng}; }
  function viewLevel(){ if(cityEl&&cityEl.classList.contains("on")&&map){ return map.getZoom()>=10?"city":"national"; } return "globe"; }
  function showGlobe(){ if(cityEl){ cityEl.classList.remove("on"); cityEl.style.pointerEvents="none"; } hidePlace(); if(window.SNWork) SNWork.close(); }
  function km(a,b){ if(!a||!b) return 0; var R=6371,dLat=((b.lat-a.lat)*Math.PI)/180,dLng=((b.lng-a.lng)*Math.PI)/180; var x=Math.sin(dLat/2)*Math.sin(dLat/2)+Math.cos((a.lat*Math.PI)/180)*Math.cos((b.lat*Math.PI)/180)*Math.sin(dLng/2)*Math.sin(dLng/2); return R*2*Math.atan2(Math.sqrt(x),Math.sqrt(1-x)); }
  function travelMin(a,b){ return Math.max(1, Math.round((km(a,b)/22)*60)); }
  function goodsOf(text){ var l=String(text||"").toLowerCase(); if(/ice|gelato|παγω/.test(l)) return {name:"ice cream",temp:"frozen",hold:12,strict:true}; if(/pizza|soup|πιτσ|σουπ/.test(l)) return {name:/soup|σουπ/.test(l)?"soup":"pizza",temp:"hot",hold:35,strict:true}; if(/beer|μπύρα|μπυρα|ale|lager/.test(l)) return {name:"beer",temp:"cold",hold:90,strict:false}; if(/burger|hamburger|cheeseburger|μπέργκερ|μπουργκερ/.test(l)) return {name:"burger",temp:"hot",hold:25,strict:true}; if(/gyro|gyros|souvlaki|kebab|shawarma|γυρο|σουβλ/.test(l)) return {name:"gyro",temp:"hot",hold:25,strict:true}; if(/coffee|καφ/.test(l)) return {name:"coffee",temp:"hot",hold:25,strict:true}; if(/sushi|salad|milk|γαλα/.test(l)) return {name:"cold food",temp:"cold",hold:25,strict:true}; if(/pharm|medicine|φαρμα/.test(l)) return {name:"pharmacy order",temp:"controlled",hold:90,strict:true}; return {name:/parcel|package|δεμα/.test(l)?"parcel":"order",temp:"ambient",hold:180,strict:false}; }
  function fetchJson(url,opt,ms){ var ctl=window.AbortController?new AbortController():null, timer=ctl&&setTimeout(function(){ctl.abort();},ms||14000); opt=opt||{}; if(ctl) opt.signal=ctl.signal; return fetch(url,opt).then(function(r){ if(!r.ok) throw new Error("http_"+r.status); return r.json(); }).finally(function(){ if(timer) clearTimeout(timer); }); }
  function cleanQuery(q){ return String(q||"").replace(/^\s*(i\s+)?(want|need|would like|am looking for|find|get|buy|order|show me)\s+(me\s+)?/i,"").trim()||String(q||"shop").trim(); }
  function escOverpass(s){ return String(s||"").replace(/[^a-z0-9\u0370-\u03ff _-]/gi," ").trim().slice(0,40); }
  function pointOf(r){ var c=r&&r.center||{}; return {lat:+(r&&r.lat!=null?r.lat:c.lat),lng:+(r&&r.lon!=null?r.lon:c.lon)}; }
  function askLocation(){ talk("Tap GPS. The globe flies you to your city."); var g=document.getElementById("gps"); if(g) g.classList.remove("on","busy"); }
  function avcGet(){ try{ return Math.max(0, Number(localStorage.getItem("sn:avc")||0)); }catch(e){ return 0; } }
  function avcSet(n){ try{ localStorage.setItem("sn:avc", String(Math.max(0, Math.round(Number(n)*100)/100))); }catch(e){} }
  function avcAdd(n){ avcSet(avcGet()+Number(n||0)); }
  function humanName(j){ if(!j) return ""; var a=j.address||j.properties||{}; var blob=String((j.name||"")+" "+(j.display_name||"")+" "+(a.name||"")+" "+(a.water||"")).toLowerCase(); var n=j.name||a.amenity||a.shop||a.road||a.street||a.neighbourhood||a.suburb||a.village||a.town||a.city||a.locality||a.municipality||a.county||""; if(/ocean|sea|gulf|strait|bay of/.test(blob) && !a.road && !a.street && !a.amenity && !a.shop) return ""; n=String(n||"").trim(); if(/^-?\d+\.\d+/.test(n)) return ""; return n; }
  function overpassFilters(q){ var l=q.toLowerCase(); if(/beer|μπύρα|μπυρα|ale|lager|pub/.test(l)) return ['["amenity"~"pub|bar|biergarten",i]','["shop"~"alcohol|beverages",i]','["name"~"beer|pub|bar|μπύρα",i]']; if(/pizza|πιτσ/.test(l)) return ['["cuisine"~"pizza",i]','["name"~"pizza|pizzeria|πιτσ",i]']; if(/burger|hamburger|cheeseburger|μπέργκερ|μπουργκερ/.test(l)) return ['["cuisine"~"burger",i]','["name"~"burger|hamburger|goody|mcdonald|burger king",i]','["amenity"="fast_food"]']; if(/gyro|gyros|souvlaki|kebab|shawarma|γυρο|σουβλ/.test(l)) return ['["cuisine"~"kebab|greek|grill",i]','["name"~"gyro|gyros|souvlaki|kebab|γυρο|σουβλ",i]','["amenity"="fast_food"]']; if(/coffee|cafe|καφ/.test(l)) return ['["amenity"="cafe"]']; if(/pharm|medicine|φαρμα/.test(l)) return ['["amenity"="pharmacy"]']; if(/ice|gelato|παγω/.test(l)) return ['["amenity"="ice_cream"]','["cuisine"~"ice_cream",i]']; if(/food|restaurant|eat|φαγη|soup|salad|sushi/.test(l)) return ['["amenity"~"restaurant|fast_food|cafe"]']; if(/supermarket|grocery|market/.test(l)) return ['["shop"~"supermarket|convenience"]']; if(/shop|store/.test(l)) return ['["shop"]']; var e=escOverpass(q); return ['["name"~"'+e+'",i]','["cuisine"~"'+e+'",i]','["amenity"~"'+e+'",i]','["shop"~"'+e+'",i]']; }
  function photonQuery(q){ var l=String(q||"").toLowerCase(); if(/beer|μπύρα|μπυρα|ale|lager|pub/.test(l)) return "pub"; if(/pizza|πιτσ/.test(l)) return "pizza"; if(/food|eat|φαγη|restaurant/.test(l)) return "restaurant"; if(/shop|store/.test(l)) return "shop"; if(/coffee|cafe|καφ/.test(l)) return "cafe"; if(/pharm|φαρμα/.test(l)) return "pharmacy"; return q; }
  function overpassPlaces(q,from){ from=from||here; if(!from) return Promise.resolve([]); var clauses=overpassFilters(q).map(function(f){ return 'nwr(around:12000,'+from.lat+','+from.lng+')["name"]'+f+';'; }).join(""); var query='[out:json][timeout:14];('+clauses+');out center tags 30;'; var urls=["https://overpass-api.de/api/interpreter?data=","https://overpass.kumi.systems/api/interpreter?data="]; function attempt(i){ if(i>=urls.length) return Promise.resolve([]); return fetchJson(urls[i]+encodeURIComponent(query),{headers:{Accept:"application/json"}},17000).then(function(j){return j.elements||[];}).catch(function(){return attempt(i+1);}); } return attempt(0).then(function(rows){ return rows.map(function(r){ var p=pointOf(r),t=r.tags||{}; return {id:"osm-"+r.type+"-"+r.id,name:t.name,lat:p.lat,lng:p.lng,raw:t["addr:street"]||"OpenStreetMap",tags:t}; }).filter(function(v){return v.name&&isFinite(v.lat)&&isFinite(v.lng);}); }); }
  function nominatimPlaces(q,from){ from=from||here; if(!from) return Promise.resolve([]); var dy=.14,dx=dy/Math.max(.25,Math.cos(from.lat*Math.PI/180)); var box=[from.lng-dx,from.lat+dy,from.lng+dx,from.lat-dy].join(","); var url="https://nominatim.openstreetmap.org/search?format=jsonv2&addressdetails=1&limit=12&bounded=1&viewbox="+encodeURIComponent(box)+"&q="+encodeURIComponent(q); return fetchJson(url,{headers:{Accept:"application/json","Accept-Language":navigator.language||"en"}},13000).then(function(rows){ return (rows||[]).filter(function(r){return /amenity|shop|office|craft|tourism|healthcare|leisure/.test(String(r.category||r.class||""));}).map(function(r){return {id:"osm-"+(r.osm_type||"")+"-"+r.osm_id,name:r.name||String(r.display_name||"").split(",")[0],lat:+r.lat,lng:+r.lon,raw:r.display_name,tags:r.extratags||{}};}); }).catch(function(){return [];}); }
  function photonPlaces(q,from){ from=from||here; if(!from) return Promise.resolve([]); var url="https://photon.komoot.io/api/?q="+encodeURIComponent(photonQuery(q))+"&lat="+from.lat+"&lon="+from.lng+"&limit=16"; return fetchJson(url,{headers:{Accept:"application/json"}},12000).then(function(j){ return (j.features||[]).map(function(f){ var c=f.geometry&&f.geometry.coordinates, pr=f.properties||{}; if(!c||!pr.name) return null; return {id:"osm-"+(pr.osm_type||"n")+"-"+(pr.osm_id||""), name:pr.name, lat:+c[1], lng:+c[0], raw:[pr.street,pr.city||pr.locality].filter(Boolean).join(", ")||"OpenStreetMap", tags:pr}; }).filter(Boolean); }).catch(function(){return [];}); }
  function hunt(query,at){ var raw=String(query||"").trim(),q=cleanQuery(raw); var from=at||aim||here; job={kind:"find",query:q,status:"hunt",at:from||null}; selected=null; if(!from){ pendingHunt=raw; talk("Need you on the map. Tap GPS."); goHere(); return; } say("Finding "+q+"…"); var seq=++huntSeq; Promise.all([nominatimPlaces(q,from),overpassPlaces(q,from),photonPlaces(q,from)]).then(function(groups){ if(seq!==huntSeq) return; var seen={}; var extra=[]; if(window.SNWork){ extra=SNWork.match(q, from)||[]; } vendors=groups[0].concat(groups[1]).concat(groups[2]).concat(extra).filter(function(v){ var k=(v.name+"|"+v.lat.toFixed(4)+"|"+v.lng.toFixed(4)).toLowerCase(); if(seen[k]) return false; seen[k]=1; return km(from,v)<=25; }).sort(function(a,b){return km(from,a)-km(from,b);}); if(!vendors.length){ clearNeed(); talk("No named place for "+q+" nearby. Say it another way."); return; } clearNeed(); vendors.slice(0,6).forEach(function(v,i){ var d=km(from,v).toFixed(1); need({id:"v"+i,label:(v.kind==="driver"?((v.name||"Driver").toUpperCase()+" BASE"):v.name.toUpperCase())+" · "+d+" km",run:function(){selectVendor(v);}}); }); talk("Found "+vendors.length+". Pick one."); }).catch(function(){ if(seq!==huntSeq)return; clearNeed(); talk("Search failed. Try again."); }); }
  function loadMap(){ if(window.L) return Promise.resolve(window.L); if(mapReady) return mapReady; mapReady=new Promise(function(resolve,reject){ if(!document.querySelector('link[data-sn-map]')){ var css=document.createElement("link"); css.rel="stylesheet"; css.href="/js/vendor/leaflet.css?v="+VER; css.setAttribute("data-sn-map",""); document.head.appendChild(css); } var s=document.createElement("script"); s.src="/js/vendor/leaflet.js?v="+VER; s.onload=function(){resolve(window.L);}; s.onerror=reject; document.head.appendChild(s); }); return mapReady; }
  function routeTo(v){ if(!here||!v) return Promise.resolve(null); var url="https://router.project-osrm.org/route/v1/driving/"+here.lng+","+here.lat+";"+v.lng+","+v.lat+"?overview=full&geometries=geojson"; return fetchJson(url,{headers:{Accept:"application/json"}},13000).then(function(j){ var r=j&&j.routes&&j.routes[0]; if(r&&selected===v&&job&&job.shop===v) job.routeMin=Math.max(1,Math.round(r.duration/60)); return r||null; }).catch(function(){return null;}); }
  var listMarks=[];
  function spaceAround(from){
    if(!window.SNWork) return [];
    var all=SNWork.all(), rows=[];
    function add(list, kind, w){
      (list||[]).forEach(function(r){
        if(!r||!isFinite(r.lat)) return;
        if(kind==="driver" && String(r.presence||"present")==="off") return;
        var d=from?km(from,r):0;
        if(from && d>18) return;
        rows.push({row:r, kind:kind, d:d, hits:Number(r.hits)||0, w:w});
      });
    }
    add(all.shops,"shop",3);
    add(all.drivers,"driver",3);
    add(all.posts,"post",1);
    add(all.drops,"drop",1);
    rows.sort(function(a,b){ if(b.w!==a.w) return b.w-a.w; if(b.hits!==a.hits) return b.hits-a.hits; return a.d-b.d; });
    return rows.slice(0,8);
  }
  function showAround(from){
    var rows=spaceAround(from||here);
    var n=hereName||(from&&from.name)||"your city";
    clearNeed();
    if(!rows.length){ talk("You're in "+n+". Search for the rest."); return; }
    rows.slice(0,3).forEach(function(x,i){
      var lab=x.kind==="driver"?((x.row.name||"Driver")+" BASE"):(x.row.name||x.row.label||x.kind);
      need({id:"a"+i,label:lab.toUpperCase()+" · "+x.d.toFixed(1)+" km",run:function(){ selectVendor({id:x.row.id,name:x.row.name||x.row.label||lab,lat:x.row.lat,lng:x.row.lng,raw:"SpaceNet",tags:x.row,kind:x.kind,sn:true,phone:x.row.phone||""}); }});
    });
    talk("You're in "+n+". SpaceNet around you. Search for the rest.");
    if(window.SNWork&&SNWork.pull) SNWork.pull(from||here);
  }
  function paintMapMarks(L, v){ if(hereMark) hereMark.remove(); if(vendorMark) vendorMark.remove(); if(aimMark) aimMark.remove(); if(routeLine) routeLine.remove(); if(callLine) callLine.remove(); listMarks.forEach(function(m){ try{m.remove();}catch(e){} }); listMarks=[]; if(here) hereMark=L.circleMarker([here.lat,here.lng],{radius:6,color:"#4df0ff",fillColor:"#4df0ff",fillOpacity:.9}).addTo(map).bindTooltip(hereName||"YOU",{permanent:true,direction:"top"}); if(aim && (!here || km(here,aim)>0.05)) aimMark=L.circleMarker([aim.lat,aim.lng],{radius:6,color:"#ff8ad4",fillColor:"#ff8ad4",fillOpacity:.9}).addTo(map); if(v) vendorMark=L.circleMarker([v.lat,v.lng],{radius:7,color:"#ffd85a",fillColor:"#ffd85a",fillOpacity:.9}).addTo(map).bindTooltip(v.name||"Place",{permanent:true,direction:"top"});
    if(window.SNWork && map){
      var colors={shop:"#ffd85a",driver:"#4df0ff",drop:"#ff8ad4",post:"#9dffb0"};
      function pin(row,color,label){ if(!row||!isFinite(row.lat)) return; var m=L.circleMarker([row.lat,row.lng],{radius:7,color:color,fillColor:color,fillOpacity:.9}).addTo(map).bindTooltip(label,{permanent:false,direction:"top"}); m.on("click", function(e){ try{ L.DomEvent.stopPropagation(e); }catch(_){} mapHeld=true; if(window.SNWork) SNWork.open(row); }); listMarks.push(m); }
      spaceAround(here||aim||v).forEach(function(x){
        var r=x.row;
        var lab=x.kind==="driver"?(r.name?r.name+" base":"Driver base"):x.kind==="drop"?(r.label||"Drop"):x.kind==="post"?"Post":(r.name||"Shop");
        pin(r, colors[x.kind]||"#ffd85a", lab);
      });
      var call=SNWork.activeCall&&SNWork.activeCall();
      if(call&&call.from&&call.to&&isFinite(call.from.lat)&&isFinite(call.to.lat)){
        var pts=(SNWork.arcPts&&SNWork.arcPts(call.from,call.to))||[[call.from.lat,call.from.lng],[call.to.lat,call.to.lng]];
        callLine=L.polyline(pts,{color:"#4df0ff",weight:3,opacity:.9}).addTo(map);
      }
    } }
  function cityWork(p){ if(!p) return; aim=p; hidePlace(); if(window.SNWork&&SNWork.takePoint&&SNWork.takePoint(p)) return; if(window.SNWork) SNWork.open(p); nameAim(p).then(function(n){ aim=n; if(window.SNWork&&SNWork.rename) SNWork.rename(n); else if(!window.SNWork) say(n.water?"No named place on that water.":(n.name||"This place")); }); }
  function bindMap(L){ if(mapBound||!map||!cityEl) return; mapBound=true; try{ map.attributionControl.setPosition("topleft"); }catch(e){} var lp=null; cityEl.addEventListener("pointerdown", function(e){ if(!cityEl.classList.contains("on")) return; if(e.target && e.target.closest && e.target.closest(".leaflet-control")) return; if(e.isPrimary===false) return; lp={x:e.clientX,y:e.clientY,id:e.pointerId,held:false}; lp.t=setTimeout(function(){ if(!lp) return; lp.held=true; mapHeld=true; var ll=map.mouseEventToLatLng({clientX:lp.x,clientY:lp.y}); var p={lat:ll.lat,lng:ll.lng}; if(viewLevel()==="city") cityWork(p); else openLevelMenu(p,{x:lp.x,y:lp.y}, "national"); },420); }, true); cityEl.addEventListener("pointermove", function(e){ if(!lp||lp.held) return; if(Math.hypot(e.clientX-lp.x,e.clientY-lp.y)>16){ clearTimeout(lp.t); lp=null; } }, true); function endLp(){ if(!lp) return; clearTimeout(lp.t); lp=null; } cityEl.addEventListener("pointerup", endLp, true); cityEl.addEventListener("pointercancel", endLp, true); map.on("click", function(e){ if(mapHeld){ mapHeld=false; return; } var p={lat:e.latlng.lat,lng:e.latlng.lng}; if(window.SNWork&&SNWork.takePoint&&SNWork.takePoint(p)) return; if(map.getZoom()>=10){ cityWork(p); } else { flyTap(p); } }); map.on("zoomend", function(){ if(!map) return; if(map.getZoom()<=4) showGlobe(); }); map.on("contextmenu", function(e){ try{ L.DomEvent.preventDefault(e); }catch(_){} mapHeld=true; var p={lat:e.latlng.lat,lng:e.latlng.lng}; if(viewLevel()==="city") cityWork(p); else openLevelMenu(p, null, "national"); }); }
  function showMap(p, z){ if(!cityEl||!p||!isFinite(p.lat)) return; loadMap().then(function(L){ cityEl.classList.add("on"); cityEl.style.pointerEvents="auto"; if(!map){ map=L.map(cityEl,{zoomControl:false,attributionControl:true,tap:true}).setView([p.lat,p.lng], z); L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",{subdomains:"abc",maxZoom:19,attribution:"© OpenStreetMap"}).addTo(map); bindMap(L); } else if(map.flyTo) map.flyTo([p.lat,p.lng], z, {duration:0.7}); else map.setView([p.lat,p.lng], z); paintMapMarks(L, selected); setTimeout(function(){ try{ map.invalidateSize(); }catch(e){} packSoon(); },40); }).catch(function(){ mapReady=null; showGlobe(); talk("Map failed to load."); }); }
  function showCity(v){ var p=v||selected||aim||here; if(!p){ talk("Point at a place first."); return; } aim=p; showMap(p, 14); }
  function showNational(p){ p=p||aim||here||facingPoint(); aim=p; showMap(p, 6); }
  function showCall(from, dest){ if(!from||!dest) return; var mid={lat:(from.lat+dest.lat)/2,lng:(from.lng+dest.lng)/2}; var d=km(from,dest); var z=d>80?6:d>8?10:14; showMap(mid, z); setTimeout(function(){ if(!map) return; try{ map.fitBounds([[from.lat,from.lng],[dest.lat,dest.lng]],{padding:[48,48],maxZoom:14}); }catch(e){} },500); }
  function startFly(p, then, ms, toDist){ if(!p) return; spin=0; var toYaw=p.lng*Math.PI/180, toPitch=Math.max(-1.15, Math.min(1.15, p.lat*Math.PI/180)); fly={fromYaw:yaw, fromPitch:pitch, toYaw:toYaw, toPitch:toPitch, fromDist:dist, toDist:toDist!=null?toDist:dist, t0:Date.now(), ms:ms||520, then:then||null}; }
  function flyTap(p){ if(!p) return; if(window.SNWork&&SNWork.takePoint&&SNWork.takePoint(p)) return; aim=p; hidePlace(); var lvl=viewLevel(); nameAim(p).then(function(n){ if(aim&&Math.abs(aim.lat-p.lat)<0.3) aim=n; }); if(lvl==="globe"){ startFly(p, function(){ showNational(p); }); } else if(lvl==="national"){ showMap(p, 14); } else { cityWork(p); } }
  function selectVendor(v){ selected=v; if(job){ job.shop=v; job.status="chosen"; } if(v&&v.id&&window.SNWork&&SNWork.hit) SNWork.hit(v.id); routeTo(v); if(viewLevel()==="globe") showGlobe(); clearNeed(); syncTasks(); if(v&&v.kind==="driver"){ need({id:"now",label:"NOW",run:function(){ chooseHow("now"); }}); talk((v.name||"Driver base")+". Starting point. Send a job to this base."); return; } need({id:"now",label:"NOW",run:function(){ chooseHow("now"); }}); need({id:"mail",label:"MAIL",run:function(){ chooseHow("mail"); }}); need({id:"pickup",label:"PICK UP",run:function(){ chooseHow("pickup"); }}); talk((v.name||"Shop")+". Instant, mail, or pick up."); }
  function partnerPlaces(how){ if(!selected||how==="pickup") return Promise.resolve([]); var f=how==="mail"?'["amenity"="post_office"]':'["office"~"courier|logistics",i]'; var q='[out:json][timeout:12];nwr(around:25000,'+selected.lat+','+selected.lng+')["name"]'+f+';out center tags 12;'; return fetchJson("https://overpass-api.de/api/interpreter?data="+encodeURIComponent(q),{headers:{Accept:"application/json"}},15000).then(function(j){ return (j.elements||[]).map(function(r){var p=pointOf(r),t=r.tags||{};return {id:"carrier-"+r.type+"-"+r.id,name:t.name,how:how,own:false,real:true,eta:how==="mail"?1440:Math.max(12,(job&&job.routeMin)||travelMin(here,selected)+10),note:how==="mail"?"Named post. Days. No heat hold.":"Named local courier."};}).filter(function(o){return o.name;}); }).catch(function(){return [];}); }
  function portalOffers(){ return []; }
  function listedDriverBases(how){ if(how!=="now"||!window.SNWork) return []; var all=SNWork.all(), from=here||selected; var rows=(all.drivers||[]).filter(function(d){ if(!d||!isFinite(d.lat)) return false; if(String(d.presence||"present")==="off") return false; var range=Number(d.range)||25; return !from || km(from,d)<=range; }).map(function(d){ var eta=Math.max(8, (here?travelMin(d,here):10)+(selected&&selected.kind!=="driver"&&selected!==d?travelMin(d,selected):0)); return {id:d.id,name:(d.name||"Driver")+" base",how:"now",own:false,driver:true,eta:eta,note:"Driver base. Starting point. "+(d.routes?("Routes: "+d.routes+". "):"")+"Receives jobs from SpaceNet users."}; }); if(selected&&selected.kind==="driver") rows.sort(function(a,b){ return a.id===selected.id?-1:b.id===selected.id?1:0; }); return rows; }
  function offerList(how,partners){ var mins=here&&selected?Math.max(8,(job&&job.routeMin)||travelMin(here,selected)+6):18; var g=goodsOf(job&&job.query), own={id:"ours",name:"Astranov",how:how,own:true,eta:how==="mail"?Math.max(mins,90):mins,note:"Own associates. Paid, picked, boxed, moving, handed, verified."}; if(how==="pickup") return [{id:"self",name:"You pick up",how:how,own:true,eta:mins,note:"Handoff at the shop."}]; if(how==="mail"&&g.strict&&g.temp!=="ambient") return []; var list=[own].concat(listedDriverBases(how)).concat(partners||[]).concat(portalOffers(how,mins)); return list.filter(function(o){ return !(how==="now"&&g.strict&&o.eta>g.hold); }); }
  function chooseHow(how){ if(!selected){ talk("Pick a place first."); return; } if(job) job.how=how; var seq=++offerSeq; say("Checking carriers…"); partnerPlaces(how).then(function(p){ if(seq!==offerSeq||!job||job.how!==how)return; var list=offerList(how,p); if(!list.length){ clearNeed(); need({id:"pickup",label:"PICK UP",run:function(){chooseHow("pickup");}}); need({id:"place",label:"OTHER PLACE",run:function(){hunt(job&&job.query);}}); talk("That ride cannot keep "+goodsOf(job&&job.query).name+" alive. Pick it up or choose closer."); return; } showOffers(list); }); }
  function showOffers(list){ clearNeed(); currentOffers=list; list.forEach(function(o){ need({id:o.id, label:o.name.toUpperCase()+" · "+(o.eta>=1440?Math.round(o.eta/1440)+"d":o.eta+"m"), run:function(){ pickCarrier(o); }}); }); var f=list[0]; if(f.own) talk("Astranov first. About "+f.eta+" min. Own associates. Every stage checked."); else talk(f.name+" · "+f.eta+" min. "+f.note); }
  function priceOf(o){ return o&&o.how==="pickup"?6:(o&&o.how==="mail"?14:10); }
  function pickCarrier(o){ if(job) job.carrier=o; offerPay(priceOf(o)); if(o.id==="ours"||(o.own&&o.how!=="pickup")) talk("Astranov. Tasks spend AVC now. Reload through PayPal only if credit is empty."); else if(o.id==="self") talk("Pick up at "+(selected&&selected.name||"the shop")+"."); else if(o.driver) talk((o.name||"Driver base")+". Starting point. Job goes to this base. About "+o.eta+" min."); else talk(o.name+" · about "+o.eta+" min. Portals see one slice."); }
  function offerPay(price){ clearNeed(); var bal=avcGet(); if(job) job.price=price; need({id:"pay",label:"PAY "+price+" AVC",run:function(){ spendAvc(price); }}); if(bal<price) need({id:"reload",label:"RELOAD",run:function(){ reloadPaypal(Math.max(10, Math.ceil(price-bal))); }}); talk((bal>=price)?("Pay "+price+" AVC. You have "+bal.toFixed(2)+"."):("Need "+price+" AVC. You have "+bal.toFixed(2)+". Reload through PayPal.")); }
  function spendAvc(price){ price=Number(price||(job&&job.price)||10); var bal=avcGet(); if(bal<price){ offerPay(price); return; } avcSet(bal-price); if(job){ job.status="paid"; job.paidAvc=price; } clearNeed(); syncTasks(); talk("Paid "+price+" AVC. Remaining "+avcGet().toFixed(2)+". Stage: paid."); if(job&&job.carrier&&job.carrier.id==="ours") watchStages(price); }
  function watchStages(avc){ if(!job) return; job.status="paid"; talk("Stage paid · "+Number(avc||job.paidAvc||0).toFixed(2)+" AVC moved. Waiting on a real associate for picked → boxed → moving → handed → verified."); }
  function reloadPaypal(eur){ say("PayPal reload…"); try{ sessionStorage.setItem("sn:paypal-job", JSON.stringify(job||{})); sessionStorage.setItem("sn:paypal-reload", String(eur||10)); }catch(e){} fetch("/api/paypal/create-order",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({amount:eur||10,origin:location.origin,reference:"avc-reload"})}).then(function(r){return r.json().then(function(j){j.http=r.status;return j;});}).then(function(j){ if(j&&j.ok&&j.approve){ location.href=j.approve; return; } clearNeed(); need({id:"reload",label:"RELOAD",run:function(){ reloadPaypal(eur); }}); talk(j&&j.error==="paypal_not_configured"?"PayPal is not on this host yet.":"PayPal could not start. RELOAD is still here."); }).catch(function(){ clearNeed(); need({id:"reload",label:"RELOAD",run:function(){ reloadPaypal(eur); }}); talk("PayPal could not be reached."); }); }
  function restorePayJob(){ try{ var saved=JSON.parse(sessionStorage.getItem("sn:paypal-job")||"null"); if(saved){ job=saved; selected=saved.shop||null; } }catch(e){} }
  function clearPayQuery(){ try{ var u=new URL(location.href); ["paypal","token","PayerID"].forEach(function(k){u.searchParams.delete(k);}); history.replaceState({},"",u.pathname+(u.searchParams.toString()?"?"+u.searchParams.toString():"")); }catch(e){} }
  function handlePayPalReturn(){ var p; try{p=new URLSearchParams(location.search);}catch(e){return Promise.resolve(false);} var state=p.get("paypal"), token=p.get("token"); if(!state) return Promise.resolve(false); restorePayJob(); if(state==="cancel"){ clearPayQuery(); if(job&&job.carrier) pickCarrier(job.carrier); else talk("Reload cancelled."); return Promise.resolve(true); } if(state!=="success"||!token){ clearPayQuery(); talk("PayPal returned without an order."); return Promise.resolve(true); } say("Verifying PayPal…"); return fetch("/api/paypal/capture-order",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({orderId:token})}).then(function(r){return r.json();}).then(function(j){ clearPayQuery(); if(j&&j.ok&&String(j.status).toUpperCase()==="COMPLETED"){ var credited=Number(j.avc!=null?j.avc:(sessionStorage.getItem("sn:paypal-reload")||0)); avcAdd(credited); try{ sessionStorage.removeItem("sn:paypal-job"); sessionStorage.removeItem("sn:paypal-reload"); }catch(e){} talk("Reloaded "+credited.toFixed(2)+" AVC. Balance "+avcGet().toFixed(2)+"."); if(job&&job.carrier&&job.price) spendAvc(job.price); return true; } clearNeed(); need({id:"verify",label:"VERIFY PAYMENT",run:function(){location.href="/?paypal=success&token="+encodeURIComponent(token);}}); talk("Payment not verified yet. AVC not moved."); return true; }).catch(function(){ clearNeed(); need({id:"verify",label:"VERIFY PAYMENT",run:function(){location.href="/?paypal=success&token="+encodeURIComponent(token);}}); talk("Payment verification failed. AVC not moved."); return true; }); }
  function reverseHere(){ if(!here) return Promise.resolve(""); var url="https://photon.komoot.io/reverse?lat="+here.lat+"&lon="+here.lng; return fetchJson(url,{headers:{Accept:"application/json"}},8000).then(function(j){ var f=j&&j.features&&j.features[0], pr=f&&f.properties||{}; countryCode=String(pr.countrycode||pr.country||"").slice(0,2).toLowerCase(); hereName=pr.city||pr.locality||pr.district||pr.town||pr.name||pr.county||pr.state||pr.country||""; here.name=hereName; return hereName; }).catch(function(){ var nurl="https://nominatim.openstreetmap.org/reverse?format=jsonv2&zoom=10&lat="+here.lat+"&lon="+here.lng; return fetchJson(nurl,{headers:{Accept:"application/json","Accept-Language":"en"}},8000).then(function(j){ countryCode=String(j&&j.address&&j.address.country_code||"").toLowerCase(); hereName=humanName(j)|| (j&&j.address&&(j.address.city||j.address.town||j.address.village||j.address.country))||""; here.name=hereName; return hereName; }).catch(function(){ return ""; }); }); }
  function locate(quiet, snap){ if(!navigator.geolocation){ talk("No GPS on this device."); return Promise.resolve(); } if(locating) return locating; if(!quiet) say("GPS…"); locating=new Promise(function(resolve){ navigator.geolocation.getCurrentPosition(function(p){ here={lat:p.coords.latitude,lng:p.coords.longitude}; hereAt=Date.now(); if(snap!==false){ lookAt(here); dist=1.65; if(viewLevel()==="globe") showGlobe(); } locating=null; var g=document.getElementById("gps"); if(g){ g.classList.remove("busy"); g.classList.add("on"); } reverseHere().then(function(name){ if(snap!==false){ clearNeed(); if(!quiet) talk(name?("You're in "+name+"."):"Position locked."); else if(name) say("You're in "+name+"."); } resolve(here); }); }, function(){ locating=null; var g=document.getElementById("gps"); if(g) g.classList.remove("busy","on"); if(!here){ if(!quiet) talk("Location denied. Tap GPS and allow it."); } resolve(here||undefined); }, {enableHighAccuracy:true,timeout:18000,maximumAge:0}); }); return locating; }
  function goHere(){
    var g=document.getElementById("gps");
    if(g){ g.classList.remove("on"); g.classList.add("busy"); }
    say("GPS…");
    var fresh=here && hereAt && (Date.now()-hereAt<120000);
    var jobp=fresh?Promise.resolve(here):locate(true, false);
    jobp.then(function(p){
      if(!p){ if(g) g.classList.remove("busy"); talk("Allow GPS. Tap GPS."); return; }
      if(g){ g.classList.remove("busy"); g.classList.add("on"); }
      aim=p;
      reverseHere().then(function(){
        startFly(p, function(){ showCity(p); var w=pendingHunt; pendingHunt=null; if(w) hunt(w, p); else showAround(p); }, 1600, 1.16);
      });
    });
  }
  function askMic(){ if(!navigator.mediaDevices||!navigator.mediaDevices.getUserMedia) return Promise.resolve(false); var gum=navigator.mediaDevices.getUserMedia({audio:true}).then(function(s){ try{s.getTracks().forEach(function(t){t.stop();});}catch(e){} return true; }).catch(function(){ return false; }); return Promise.race([gum,new Promise(function(resolve){setTimeout(function(){resolve(false);},15000);})]); }
  function listen(){ if(listening||speaking) return; var SR=window.SpeechRecognition||window.webkitSpeechRecognition; if(!SR) return; listening=true; rec=new SR(); rec.continuous=false; rec.lang=navigator.language||"en-US"; rec.onresult=function(ev){ var i,tx="",fin=false; for(i=ev.resultIndex;i<ev.results.length;i++){ tx+=ev.results[i][0].transcript; if(ev.results[i].isFinal) fin=true; } if(inEl) inEl.value=tx; if(fin&&tx.trim()){ listening=false; try{rec.stop();}catch(e){} run(tx.trim()); } }; rec.onend=function(){ listening=false; if(wantEar&&!speaking) setTimeout(listen,500); }; rec.onerror=function(ev){ listening=false; if(ev&&ev.error==="not-allowed") wantEar=false; }; try{ rec.start(); }catch(e){ listening=false; } }
  function parseMind(j, raw){ var text=String((j&&(j.text||j.response||j.answer||j.say))||""); var act=String((j&&j.act)||"").toLowerCase(), q=(j&&j.q)||"", s=(j&&j.say)||"", ok=j&&j.priority_ok, id=(j&&(j.task_id||j.id))||""; var m=text.match(/\{[\s\S]*\}/); if(m){ try{ var o=JSON.parse(m[0]); if(o){ if(o.act) act=String(o.act).toLowerCase(); if(o.q) q=String(o.q); if(o.say) s=String(o.say); if(!s && o.text) s=String(o.text); if(o.ok!=null) ok=o.ok; if(o.id) id=String(o.id); } }catch(e){} } if(!s) s=text.replace(/\{[\s\S]*\}/,"").trim(); return {act:act||"talk", q:q||raw, say:s||"", ok:ok, id:id}; }
  function applyMind(m, raw){ if(!m) return; var a=String(m.act||"talk").toLowerCase(); if(m.say && a!=="hunt" && a!=="order" && a!=="find" && a!=="priority") talk(m.say); else if(m.say && a!=="priority") say(m.say); if(a==="talk"||!a) return; if(a==="priority"){ var ok=m.ok===true||m.ok==="true"||m.ok===1; bumpTask(m.id||(awaiting&&awaiting.id), ok, m.say); awaiting=null; return; } if(a==="locate") return goHere(); if(a==="globe"){ showGlobe(); return; } if(a==="national") return showNational(aim||here||facingPoint()); if(a==="map"||a==="city"||a==="streets") return showCity(selected||aim||here); if(a==="now") return chooseHow("now"); if(a==="mail") return chooseHow("mail"); if(a==="pickup"||a==="pick up") return chooseHow("pickup"); if(a==="pay") return spendAvc(priceOf(job&&job.carrier)); if(a==="reload") return reloadPaypal(10); if(a==="post"||a==="call"||a==="shop"||a==="drop"||a==="driver"||a==="base"){ if(window.SNWork) return SNWork.open(aim||here, a==="base"?"driver":a); return; } if(a==="hunt"||a==="order"||a==="find") return hunt(m.q||raw, aim||here); }
  function grok(text){ var raw=String(text||"").trim(); if(!raw) return; say("Grok…"); var origin=aim||here; var ctx={ place:(aim&&aim.name)||hereName||"", avc:avcGet(), shop:selected&&selected.name||"", query:job&&job.query||"", level:viewLevel(), vendors:(vendors||[]).slice(0,6).map(function(v){return v.name+(origin?" "+km(origin,v).toFixed(1)+"km":"");}), tasks:loadTasks().filter(function(t){return t.status!=="done";}).slice(0,8).map(function(t){return {id:t.id,title:t.title,pri:t.pri,role:t.role,next:t.next};}) }; if(awaiting&&awaiting.kind==="priority") ctx.priority_request={id:awaiting.id, reason:raw}; fetch("/api/ai",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({prompt:raw, message:raw, here:ctx, history:mindHist, spacenet:true, fast:true, force_paid:true, allow_paid:true})}).then(function(r){return r.json().then(function(j){ j.http=r.status; return j; });}).then(function(j){ var m=parseMind(j, raw); mindHist.push({role:"user",content:raw}); mindHist.push({role:"assistant",content:m.say||m.act||""}); if(mindHist.length>16) mindHist=mindHist.slice(-16); applyMind(m, raw); }).catch(function(){ talk("Grok did not answer. Say it again."); }); }
  function savePost(a, text){ var row={level:a.level, lat:a.at&&a.at.lat, lng:a.at&&a.at.lng, name:(a.at&&a.at.name)||"", text:String(text||"").trim(), t:Date.now(), kind:"post", id:"p"+Date.now().toString(36)}; try{ var list=JSON.parse(localStorage.getItem("sn:posts")||"[]"); list.unshift(row); localStorage.setItem("sn:posts", JSON.stringify(list.slice(0,80))); }catch(e){} talk("Saved on this device at "+(row.name||a.level)+"."); if(window.SN&&SN.repaint) SN.repaint(); }
  function startAwait(kind, level, p){ awaiting={kind:kind, level:level, at:p}; if(inEl){ inEl.value=""; inEl.placeholder= kind==="post"?"Post at this place": kind==="add"?"Name what you add":"Task at this place"; try{ inEl.focus(); }catch(e){} } var n=(p&&p.name)||level; if(kind==="post") talk("Post at "+n+". Write it."); else if(kind==="add") talk("Add at "+n+". Name it."); else talk("Task at "+n+". Say what you want."); }
  function doCall(p){ if(window.SNWork){ SNWork.open(p,"call"); return; } nameAim(p).then(function(n){ var t=n.tags||{}; var phone=t.phone||t["contact:phone"]||t.tel||""; if(phone){ talk("Calling "+(n.name||"place")+"."); location.href="tel:"+String(phone).replace(/[^\d+]/g,""); } else talk("No phone listed for "+(n.name||"this place")+"."); }); }
  function whatIsHere(p, level){ say("Looking…"); nameAim(p).then(function(n){ aim=n; var line=n.water?"No named place on that water.":(n.name||"This place"); if(level==="city"){ showAround(n); return; } talk(line); }); }
  function run(raw){ var t=String(raw||"").trim(); if(!t) return; var low=t.toLowerCase(); if(low==="reboot") return (window.SNReboot&&SNReboot()); if(window.SNWork&&SNWork.picking&&SNWork.picking()){ SNWork.searchDest(t); return; } if(awaiting){ var a=awaiting; awaiting=null; if(inEl) inEl.placeholder="Talk to Astranov SpaceNet Grok"; if(a.kind==="priority") return grok("PRIORITY REQUEST id="+a.id+" reason: "+t); if(a.kind==="post"||a.kind==="add"){ savePost(a,t); return; } if(a.kind==="task"||a.kind==="find"){ aim=a.at||aim; return grok(t); } } var named=vendors.find(function(v){var n=(v.name||"").toLowerCase(); return n && (low===n || low.indexOf(n)>=0);}); if(named) return selectVendor(named); named=currentOffers.find(function(o){var n=(o.name||"").toLowerCase(); return n && (low===n || low.indexOf(n)>=0);}); if(named) return pickCarrier(named); return grok(t); }
  function globeHit(clientX, clientY){ if(!canvas) return null; var w=canvas.width,h=canvas.height,cx=w*0.5,cy=h*0.46,R=Math.min(w,h)*0.42/dist; var rect=canvas.getBoundingClientRect(); var px=(clientX-rect.left)*(w/Math.max(1,rect.width)); var py=(clientY-rect.top)*(h/Math.max(1,rect.height)); var x=(px-cx)/R, y2=(cy-py)/R, rr=x*x+y2*y2; if(rr>1) return null; var z2=Math.sqrt(Math.max(0,1-rr)); var cp=Math.cos(pitch), sp=Math.sin(pitch); var y=y2*cp+z2*sp; var z=-y2*sp+z2*cp; var lat=Math.asin(Math.max(-1,Math.min(1,y)))*180/Math.PI; var lng=Math.atan2(x,z)*180/Math.PI + yaw*180/Math.PI; while(lng>180) lng-=360; while(lng<-180) lng+=360; return {lat:lat,lng:lng}; }
  function nameAim(p){ if(!p) return Promise.resolve(p); var url="https://photon.komoot.io/reverse?lat="+p.lat+"&lon="+p.lng; return fetchJson(url,{headers:{Accept:"application/json"}},8000).then(function(j){ var f=j&&j.features&&j.features[0], pr=f&&f.properties||{}; var n=pr.name||pr.street||pr.city||pr.locality||pr.district||""; p.name=n||pr.county||pr.country||""; p.raw=[pr.street,pr.city||pr.locality,pr.country].filter(Boolean).join(", "); p.tags=pr; p.water=!p.name; if(!p.name) p.name="This place"; return p; }).catch(function(){ var nurl="https://nominatim.openstreetmap.org/reverse?format=jsonv2&zoom=16&lat="+p.lat+"&lon="+p.lng; return fetchJson(nurl,{headers:{Accept:"application/json","Accept-Language":navigator.language||"en"}},8000).then(function(j){ p.name=humanName(j)||"This place"; p.raw=j&&j.display_name||p.name; p.tags=(j&&j.extratags)||{}; p.water=p.name==="This place"; return p; }).catch(function(){ p.name="This place"; p.water=true; p.tags={}; return p; }); }); }
  function hidePlace(){ if(placeEl){ placeEl.classList.remove("on"); placeEl.innerHTML=""; } packSoon(); }
  function placeMenuAt(sx,sy){ if(!placeEl) return; var w=Math.min(220, innerWidth-16), h=Math.min(320, innerHeight*0.5); var x=Math.max(8, Math.min(innerWidth-w-8, (sx||innerWidth/2)-w/2)); var y=Math.max(8, Math.min(innerHeight-h-8, (sy||innerHeight/2)-20)); placeEl.style.left=x+"px"; placeEl.style.top=y+"px"; packSoon(); }
  function addPlaceBtn(label,fn){ if(!placeEl) return; var b=document.createElement("button"); b.type="button"; b.textContent=label; b.onclick=function(ev){ ev.preventDefault(); ev.stopPropagation(); hidePlace(); try{ fn(); }catch(e){ talk("That step failed."); } }; placeEl.appendChild(b); }
  function openLevelMenu(p, screen, level){ if(!p) return; level=level||viewLevel(); aim=p; if(screen) tapScreen=screen; if(level==="city"){ cityWork(p); return; } hidePlace(); if(!placeEl) placeEl=document.getElementById("sn-place"); if(!placeEl){ placeEl=document.createElement("div"); placeEl.id="sn-place"; document.body.appendChild(placeEl); } placeEl.classList.add("on"); placeMenuAt((tapScreen&&tapScreen.x)||(innerWidth/2), (tapScreen&&tapScreen.y)||(innerHeight*0.38)); var ttl=document.createElement("div"); ttl.className="ttl"; ttl.textContent=p.name&&p.name!=="This place"?p.name:(level==="globe"?"Global":"National"); placeEl.appendChild(ttl); addPlaceBtn("WHAT IS HERE", function(){ whatIsHere(p, level); }); if(level==="globe"){ addPlaceBtn("GLOBAL POST", function(){ startAwait("post","globe",p); }); addPlaceBtn("GLOBAL CALL", function(){ doCall(p); }); addPlaceBtn("GLOBAL TASK", function(){ startAwait("task","globe",p); }); addPlaceBtn("ADD", function(){ startAwait("add","globe",p); }); } else { addPlaceBtn("NATIONAL POST", function(){ startAwait("post","national",p); }); addPlaceBtn("NATIONAL CALL", function(){ doCall(p); }); addPlaceBtn("NATIONAL TASK", function(){ startAwait("task","national",p); }); } addPlaceBtn("CANCEL", function(){}); nameAim(p).then(function(n){ if(!placeEl||!placeEl.classList.contains("on")) return; if(aim&&Math.abs(aim.lat-p.lat)<0.3){ aim=n; var el=placeEl.querySelector(".ttl"); if(el && n.name) el.textContent=n.water?"No named place":n.name; } }); }
  function openPlace(p,screen){ openLevelMenu(p, screen, viewLevel()); }
  function hands(){ hidePlace(); var p=aim||here|| (map&&map.getCenter()?{lat:map.getCenter().lat,lng:map.getCenter().lng}:facingPoint()); var screen={x:innerWidth/2,y:innerHeight*0.4}; if(!here && viewLevel()==="globe"){ talk("Tap GPS to land on your city."); } if(viewLevel()==="city"){ cityWork(p); return; } openLevelMenu(p, screen, viewLevel()); }
  function placeGps(){ pack(); }
  function shownRect(el){
    if(!el) return null;
    var s=getComputedStyle(el);
    if(s.display==="none"||s.visibility==="hidden"||Number(s.opacity)===0) return null;
    var r=el.getBoundingClientRect();
    if(r.width<8||r.height<8) return null;
    return {x:r.left,y:r.top,w:r.width,h:r.height};
  }
  function hits(a,b,g){ g=g||10; return a.x<b.x+b.w+g && a.x+a.w+g>b.x && a.y<b.y+b.h+g && a.y+a.h+g>b.y; }
  function nudge(box, walls, W, H, pad){
    var i,j;
    for(i=0;i<18;i++){
      var hit=null;
      for(j=0;j<walls.length;j++) if(hits(box,walls[j],10)){ hit=walls[j]; break; }
      if(!hit) break;
      var left=box.x+box.w-hit.x, right=hit.x+hit.w-box.x, up=box.y+box.h-hit.y, down=hit.y+hit.h-box.y;
      var opts=[
        {x:box.x-left-12,y:box.y,d:left,side:1},
        {x:box.x+right+12,y:box.y,d:right,side:1},
        {x:box.x,y:box.y-up-12,d:up,side:0},
        {x:box.x,y:box.y+down+12,d:down,side:0}
      ];
      opts.sort(function(a,b){ return (b.side-a.side)|| (a.d-b.d); });
      var pick=null;
      for(j=0;j<opts.length;j++){
        var o=opts[j];
        if(o.x>=pad && o.y>=pad && o.x+box.w<=W-pad && o.y+box.h<=H-pad){ pick=o; break; }
      }
      if(!pick) pick=opts[0];
      box.x=Math.max(pad, Math.min(W-pad-box.w, pick.x));
      box.y=Math.max(pad, Math.min(H-pad-box.h, pick.y));
    }
    box.ok=true;
    for(j=0;j<walls.length;j++) if(hits(box,walls[j],6)) box.ok=false;
    return box;
  }
  var packT=0;
  function packSoon(){ if(packT) return; packT=requestAnimationFrame(function(){ packT=0; pack(); }); }
  function pack(){
    var W=innerWidth||320, H=innerHeight||480, pad=10;
    var u=Math.round(Math.max(32, Math.min(42, Math.min(W,H)*0.055)));
    document.documentElement.style.setProperty("--u", u+"px");
    var g=document.getElementById("gps"), f=document.getElementById("f");
    if(!g||!f) return;
    var video=document.getElementById("sn-video"), sheet=document.getElementById("sn-sheet");
    if((video&&video.classList.contains("on"))||(sheet&&sheet.classList.contains("on"))){
      g.classList.add("ghost");
      if(menuEl) menuEl.classList.remove("on");
      if(tasksEl) tasksEl.classList.remove("on");
      return;
    }
    g.classList.remove("ghost");
    var fr=f.getBoundingClientRect();
    var gw=g.offsetWidth||u, gh=g.offsetHeight||(u+14);
    var walls=[], add=function(el){ var r=shownRect(el); if(r) walls.push(r); };
    add(document.getElementById("island"));
    add(f);
    add(document.getElementById("sn-place"));
    add(document.getElementById("sn-pick"));
    add(menuEl&&menuEl.querySelector(".card"));
    add(pillEl&&pillEl.classList.contains("on")?pillEl:null);
    add(tasksBtn&&tasksBtn.classList.contains("on")?tasksBtn:null);
    add(tasksEl&&tasksEl.querySelector(".card"));
    add(sheet&&sheet.querySelector(".card"));
    add(document.querySelector(".leaflet-control-zoom"));
    add(document.querySelector(".leaflet-control-attribution"));
    function free(c){
      var ww=c.w||gw, hh=c.h||gh;
      c.x=Math.max(pad, Math.min(W-pad-ww, c.x));
      c.y=Math.max(pad, Math.min(H-pad-hh, c.y));
      c.w=ww; c.h=hh; c.ok=true;
      for(var j=0;j<walls.length;j++) if(hits(c,walls[j],10)) c.ok=false;
      return c;
    }
    var isl=shownRect(document.getElementById("island"));
    var topY=isl?Math.round(isl.y+isl.h+12):pad+52;
    var home=free({x:W-pad-gw, y:fr.top-12-gh});
    var box=home.ok?home:null;
    if(!box){
    var pockets=[
      {x:home.x-Math.min(140,W*0.36), y:home.y},
      {x:W-pad-gw, y:topY},
      {x:pad, y:home.y},
      {x:pad, y:topY},
      {x:Math.round((W-gw)/2), y:home.y}
    ];
      for(var i=0;i<pockets.length;i++){
        var c=free(pockets[i]);
        if(c.ok){ box=c; break; }
      }
    }
    if(!box) box=nudge(home, walls, W, H, pad);
    g.style.left=Math.round(box.x)+"px";
    g.style.top=Math.round(box.y)+"px";
    g.style.right="auto";
    g.style.bottom="auto";
    if(!box.ok) g.classList.add("ghost");
    else walls.push({x:box.x,y:box.y,w:box.w,h:box.h});
    var line=document.getElementById("line"), live=document.getElementById("sn-live"), panel=document.getElementById("panel");
    var extra=0;
    if(panel && !g.classList.contains("ghost")){
      var p=panel.getBoundingClientRect();
      if(box.x<p.right-4 && box.x+box.w>p.left) extra=Math.max(0, Math.ceil(p.right-box.x+8));
    }
    if(line) line.style.paddingRight=extra?extra+"px":"";
    if(live) live.style.paddingRight=extra?extra+"px":"";
    if(pillEl&&pillEl.classList.contains("on")&&f){
      var pw=pillEl.offsetWidth||88, ph=pillEl.offsetHeight||36;
      var pb=free({x:pad, y:fr.top-12-ph, w:pw, h:ph});
      if(!pb.ok){
        pb=free({x:pad, y:topY, w:pw, h:ph});
      }
      pillEl.style.left=Math.round(pb.x)+"px";
      pillEl.style.top=Math.round(pb.y)+"px";
      pillEl.style.right="auto";
      pillEl.style.bottom="auto";
    }
    if(tasksBtn&&tasksBtn.classList.contains("on")){
      var tw=tasksBtn.offsetWidth||72, th=tasksBtn.offsetHeight||36;
      var tb=free({x:W-pad-tw, y:topY, w:tw, h:th});
      if(!tb.ok) tb=free({x:pad, y:topY, w:tw, h:th});
      tasksBtn.style.left=Math.round(tb.x)+"px";
      tasksBtn.style.top=Math.round(tb.y)+"px";
      tasksBtn.style.right="auto";
      tasksBtn.style.bottom="auto";
    }
  }
  function size(){ if(!canvas) return; var d=Math.min(2,devicePixelRatio||1); canvas.width=Math.max(1,Math.floor((innerWidth||320)*d)); canvas.height=Math.max(1,Math.floor((innerHeight||480)*d)); pack(); }
  function sph(latDeg,lngDeg,cx,cy,R){ var la=latDeg*Math.PI/180, ln=lngDeg*Math.PI/180-yaw; var x=Math.cos(la)*Math.sin(ln); var y=Math.sin(la); var z=Math.cos(la)*Math.cos(ln); var y2=y*Math.cos(pitch)-z*Math.sin(pitch); var z2=y*Math.sin(pitch)+z*Math.cos(pitch); if(z2<=0.02) return null; return {x:cx+R*x, y:cy-R*y2, z:z2}; }
  function drawGrid(ctx,cx,cy,R){ var lat,lng,a,b,step=15; ctx.lineWidth=Math.max(1, (devicePixelRatio||1)*0.7); ctx.strokeStyle="rgba(77,240,255,0.22)"; for(lat=-75; lat<=75; lat+=step){ ctx.beginPath(); a=null; for(lng=-180; lng<=180; lng+=6){ b=sph(lat,lng,cx,cy,R); if(b&&a){ ctx.moveTo(a.x,a.y); ctx.lineTo(b.x,b.y); } a=b; } ctx.stroke(); } ctx.strokeStyle="rgba(77,240,255,0.28)"; for(lng=-180; lng<180; lng+=step){ ctx.beginPath(); a=null; for(lat=-90; lat<=90; lat+=4){ b=sph(lat,lng,cx,cy,R); if(b&&a){ ctx.moveTo(a.x,a.y); ctx.lineTo(b.x,b.y); } a=b; } ctx.stroke(); } ctx.strokeStyle="rgba(126,233,255,0.55)"; ctx.beginPath(); ctx.arc(cx,cy,R,0,Math.PI*2); ctx.stroke(); }
  function pinLabel(p, fallback){ var n=String((p&&p.name)||fallback||""); if(!n || /^-?\d+\.\d+/.test(n) || /\d+\.\d+[NS]/.test(n)) return fallback||"PIN"; return n.slice(0,18); }
  function drawPin(ctx,p,label,color,cx,cy,R){ if(!p||!isFinite(p.lat)||!isFinite(p.lng)) return; var q=sph(p.lat,p.lng,cx,cy,R); if(!q) return; var d=Math.min(2,devicePixelRatio||1); ctx.fillStyle=color; ctx.beginPath(); ctx.arc(q.x,q.y,4*d,0,Math.PI*2); ctx.fill(); ctx.fillStyle="#e8fbff"; ctx.font=(9*d)+"px system-ui"; ctx.fillText(pinLabel(p,label),q.x+6*d,q.y-4*d); }
  function tickFly(){ if(!fly) return; var u=(Date.now()-fly.t0)/fly.ms; if(u>=1){ yaw=fly.toYaw; pitch=fly.toPitch; if(fly.toDist!=null) dist=fly.toDist; var fn=fly.then; fly=null; if(fn) fn(); return; } u=u*u*(3-2*u); var dy=fly.toYaw-fly.fromYaw; while(dy>Math.PI) dy-=Math.PI*2; while(dy<-Math.PI) dy+=Math.PI*2; yaw=fly.fromYaw+dy*u; pitch=fly.fromPitch+(fly.toPitch-fly.fromPitch)*u; if(fly.toDist!=null) dist=fly.fromDist+(fly.toDist-fly.fromDist)*u; }
  function tick(){ try{ tickFly(); if(canvas){ var ctx=canvas.getContext("2d"); if(ctx){ ctx.fillStyle="#02040a"; ctx.fillRect(0,0,canvas.width,canvas.height); var w=canvas.width,h=canvas.height,cx=w*0.5,cy=h*0.46,R=Math.min(w,h)*0.42/dist; drawGrid(ctx,cx,cy,R); drawPin(ctx,here,hereName||"YOU","#4df0ff",cx,cy,R); if(aim) drawPin(ctx,aim,aim.name||"PIN","#ff8ad4",cx,cy,R); if(selected) drawPin(ctx,selected,selected.name,"#ffd85a",cx,cy,R); if(!drag && !pinch && !fly){ yaw+=spin; spin*=0.96; if(Math.abs(spin)<0.00025) spin=0; } } } }catch(e){} requestAnimationFrame(tick); }
  function boot(){ if(permsTried) return; permsTried=true; var returning=/[?&]paypal=/.test(location.search||""); handlePayPalReturn().then(function(){ if(returning) return locate(true); }); askMic(); setTimeout(listen,600); if(window.SNWork&&SNWork.listenPeer) setTimeout(function(){ SNWork.listenPeer(); },800); }
  function repaint(){ if(map&&window.L) paintMapMarks(window.L, selected); }
  window.SN={ver:"V1",run:run,locate:locate,goHere:goHere,listen:listen,hunt:hunt,avc:avcGet,openPlace:openPlace,hands:hands,showCity:showCity,showNational:showNational,showMap:showMap,showCall:showCall,repaint:repaint,talk:talk,say:say,nameAim:nameAim,km:km,selectVendor:selectVendor,pack:pack,openMenu:openMenu,minMenu:minMenu,syncTasks:syncTasks,toggleTasks:toggleTasks,openTasks:openTasks};
  if(form) form.addEventListener("submit", function(e){ e.preventDefault(); var v=inEl&&inEl.value; if(inEl) inEl.value=""; run(v); });
  var go=document.getElementById("go"); if(go) go.addEventListener("click", function(e){ e.preventDefault(); if(inEl&&inEl.value.trim()){ run(inEl.value.trim()); inEl.value=""; return; } wantEar=true; listen(); });
  var plus=document.getElementById("plus"); if(plus) plus.addEventListener("click", function(){ hands(); });
  var gpsBtn=document.getElementById("gps"); if(gpsBtn) gpsBtn.addEventListener("click", function(e){ e.preventDefault(); goHere(); });
  if(pillEl) pillEl.addEventListener("click", function(e){ e.preventDefault(); openMenu(); });
  if(tasksBtn) tasksBtn.addEventListener("click", function(e){ e.preventDefault(); toggleTasks(); });
  if(tasksEl){
    var tBg=tasksEl.querySelector(".bg"), tX=tasksEl.querySelector(".x");
    if(tBg) tBg.addEventListener("click", hideTasks);
    if(tX) tX.addEventListener("click", function(e){ e.preventDefault(); hideTasks(); });
    if(tasksList) tasksList.addEventListener("click", function(e){
      var btn=e.target.closest("button"), row=e.target.closest(".task");
      if(!row) return;
      var id=row.getAttribute("data-id"), act=btn&&btn.getAttribute("data-act");
      if(act==="problem") askProblem(id);
      else if(act==="go"||!btn) goTask(id);
    });
  }
  if(menuEl){
    var mCard=menuEl.querySelector(".card"), mBg=menuEl.querySelector(".bg"), mX=menuEl.querySelector(".x");
    if(mBg) mBg.addEventListener("click", function(){ minMenu(); });
    if(mX) mX.addEventListener("click", function(e){ e.preventDefault(); minMenu(); });
    if(mCard){
      var mpts={}, mpinch=null;
      mCard.addEventListener("pointerdown", function(e){ mpts[e.pointerId]={x:e.clientX,y:e.clientY}; if(Object.keys(mpts).length>=2){ var ids=Object.keys(mpts), a=mpts[ids[0]], b=mpts[ids[1]]; mpinch={d:Math.hypot(a.x-b.x,a.y-b.y), s:menuScale, midY:(a.y+b.y)/2}; } });
      mCard.addEventListener("pointermove", function(e){ if(mpts[e.pointerId]) mpts[e.pointerId]={x:e.clientX,y:e.clientY}; if(!mpinch||Object.keys(mpts).length<2) return; var ids=Object.keys(mpts), a=mpts[ids[0]], b=mpts[ids[1]]; var d=Math.hypot(a.x-b.x,a.y-b.y), midY=(a.y+b.y)/2; var next=Math.abs(d-mpinch.d)>Math.abs(midY-mpinch.midY)?mpinch.s*(d/Math.max(24,mpinch.d)):mpinch.s+(mpinch.midY-midY)*0.008; menuScale=Math.max(0.72, Math.min(1.38, next)); mCard.style.setProperty("--ms", String(menuScale)); });
      function mup(e){ delete mpts[e.pointerId]; if(Object.keys(mpts).length<2) mpinch=null; }
      mCard.addEventListener("pointerup", mup);
      mCard.addEventListener("pointercancel", mup);
      mCard.addEventListener("wheel", function(e){ e.preventDefault(); menuScale=Math.max(0.72, Math.min(1.38, menuScale+(e.deltaY>0?-0.06:0.06))); mCard.style.setProperty("--ms", String(menuScale)); }, {passive:false});
    }
  }
  if(canvas){ var holdT=null; function lastXY(e,fallback){ var x=(e&&e.clientX)||(drag&&drag.lastX)||(fallback&&fallback.x)||0; var y=(e&&e.clientY)||(drag&&drag.lastY)||(fallback&&fallback.y)||0; return {x:x,y:y}; } function ptrCount(){ return Object.keys(pointers).length; } function applyGlobeZoom(next){ dist=Math.max(1.15, Math.min(3.2, next)); if(dist<=1.18 && pinch && !pinch.descended){ pinch.descended=true; flyTap(facingPoint()); } } canvas.addEventListener("pointerdown",function(e){ hidePlace(); pointers[e.pointerId]={x:e.clientX,y:e.clientY}; if(ptrCount()>=2){ var ids=Object.keys(pointers); var a=pointers[ids[0]], b=pointers[ids[1]]; pinch={d0:Math.hypot(a.x-b.x,a.y-b.y), dist0:dist, midY:(a.y+b.y)/2, gap:Math.hypot(a.x-b.x,a.y-b.y), descended:false}; if(holdT){ clearTimeout(holdT); holdT=null; } drag=null; spin=0; return; } drag={x:e.clientX,y:e.clientY,lastX:e.clientX,lastY:e.clientY,yaw:yaw,pitch:pitch,t:Date.now(),t0:Date.now(),held:false}; spin=0; try{canvas.setPointerCapture(e.pointerId);}catch(_){} if(holdT) clearTimeout(holdT); holdT=setTimeout(function(){ holdT=null; if(!drag||pinch) return; var moved=Math.hypot(drag.lastX-drag.x, drag.lastY-drag.y); if(moved>28) return; drag.held=true; var pt=lastXY({clientX:drag.lastX,clientY:drag.lastY}); tapScreen=pt; var hit=globeHit(pt.x,pt.y); if(!hit){ say("Hold on the globe itself."); return; } if(window.SNWork&&SNWork.takePoint&&SNWork.takePoint(hit)) return; openLevelMenu(hit, pt, "globe"); },420);}); canvas.addEventListener("pointermove",function(e){ if(pointers[e.pointerId]) pointers[e.pointerId]={x:e.clientX,y:e.clientY}; if(pinch && ptrCount()>=2){ var ids=Object.keys(pointers); var a=pointers[ids[0]], b=pointers[ids[1]]; var gap=Math.hypot(a.x-b.x,a.y-b.y); var midY=(a.y+b.y)/2; var dGap=gap-(pinch.gap||pinch.d0); var dY=midY-(pinch.midY||midY); if(Math.abs(dGap)>Math.abs(dY)+4) applyGlobeZoom(pinch.dist0*(pinch.d0/Math.max(12,gap))); else if(Math.abs(dY)>6) applyGlobeZoom(dist + dY*0.01); pinch.midY=midY; pinch.gap=gap; return; } if(!drag) return; var now=Date.now(),dx=e.clientX-drag.lastX,w=Math.max(180,canvas.clientWidth||innerWidth); drag.lastX=e.clientX; drag.lastY=e.clientY; if(drag.held) return; var moved=Math.hypot(e.clientX-drag.x,e.clientY-drag.y); if(moved<10) return; yaw=drag.yaw-(e.clientX-drag.x)/w*Math.PI*2; pitch=Math.max(-1.15,Math.min(1.15, drag.pitch+(e.clientY-drag.y)/Math.max(180,canvas.clientHeight||innerHeight)*Math.PI)); spin=-(dx/w)*Math.PI*2/Math.max(1,now-drag.t)*16; drag.t=now;}); function release(e){ delete pointers[e.pointerId]; if(ptrCount()<2) pinch=null; if(holdT){ clearTimeout(holdT); holdT=null; } if(!drag)return; var pt=lastXY(e, {x:drag.lastX,y:drag.lastY}); var moved=Math.hypot(pt.x-drag.x, pt.y-drag.y); var held=drag.held; drag=null; if(Math.abs(spin)<0.0005) spin=0; if(held) return; if(moved<28){ var hit=globeHit(pt.x,pt.y); if(!hit){ say("Tap the globe itself."); return; } tapScreen=pt; flyTap(hit); } } canvas.addEventListener("pointerup",release); canvas.addEventListener("pointercancel",release); canvas.addEventListener("contextmenu",function(e){ e.preventDefault(); var hit=globeHit(e.clientX,e.clientY); if(hit) openLevelMenu(hit,{x:e.clientX,y:e.clientY},"globe"); }); canvas.addEventListener("wheel",function(e){ e.preventDefault(); applyGlobeZoom(dist+(e.deltaY>0?0.08:-0.08)); }, {passive:false}); }
  document.addEventListener("pointerdown", function(e){ if(!placeEl||!placeEl.classList.contains("on")) return; if(placeEl.contains(e.target)) return; if(e.target===canvas) return; hidePlace(); }, true);
  document.addEventListener("pointerdown", function(){ if(!permsTried) boot(); }, {passive:true});
  window.addEventListener("resize", size);
  if(window.visualViewport) visualViewport.addEventListener("resize", packSoon);
  ["sn-sheet","sn-place","sn-pick","sn-video","sn-live","sn-menu","sn-pill","sn-tasks","sn-tasks-btn","line","island","dock"].forEach(function(id){
    var el=document.getElementById(id);
    if(!el) return;
    new MutationObserver(packSoon).observe(el,{attributes:true,childList:true,subtree:true,characterData:true});
  });
  size(); tick(); setTimeout(boot,200); setTimeout(syncTasks,500); setInterval(function(){ if(!permsTried) boot(); },4000);
})();
