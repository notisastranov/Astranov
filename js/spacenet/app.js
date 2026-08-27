(function(){
  var VER="3717";
  window.__SN_ALIVE=true;
  try{ if(navigator.vibrate) navigator.vibrate=function(){return false;}; }catch(e){}
  var canvas=document.getElementById("g");
  var cityEl=document.getElementById("city");
  var lineEl=document.getElementById("line");
  var inEl=document.getElementById("in");
  var form=document.getElementById("f");
  var liveEl=document.getElementById("sn-live");
  var yaw=0.55, dist=2.15, spin=0.0016, drag=null;
  var here=null, countryCode="", things={}, vendors=[], selected=null, job=null, currentOffers=[], huntSeq=0, offerSeq=0;
  var map=null, mapReady=null, hereMark=null, vendorMark=null, routeLine=null;
  var listening=false, speaking=false, wantEar=true, rec=null, permsTried=false;
  var earth=new Image(), earthReady=false;
  earth.crossOrigin="anonymous";
  earth.onload=function(){ earthReady=true; };
  earth.src="https://gibs.earthdata.nasa.gov/wms/epsg4326/best/wms.cgi?SERVICE=WMS&REQUEST=GetMap&VERSION=1.1.1&LAYERS=BlueMarble_NextGeneration&STYLES=&FORMAT=image/jpeg&SRS=EPSG:4326&BBOX=-180,-90,180,90&WIDTH=1024&HEIGHT=512";

  function say(t){ if(lineEl&&t!=null) lineEl.textContent=String(t); }
  function talk(t){ if(!t) return; say(t); speaking=true; try{ if(window.speechSynthesis){ speechSynthesis.cancel(); var u=new SpeechSynthesisUtterance(String(t)); u.onend=function(){ speaking=false; if(wantEar) setTimeout(listen,280); }; u.onerror=function(){ speaking=false; if(wantEar) setTimeout(listen,280); }; speechSynthesis.speak(u); return; } }catch(e){} speaking=false; if(wantEar) setTimeout(listen,280); }
  function clearNeed(){ things={}; currentOffers=[]; if(liveEl){ liveEl.innerHTML=""; liveEl.style.display="none"; } }
  function need(spec){ spec=spec||{}; var id=spec.id||("m"+Date.now()+Math.random().toString(36).slice(2,6)); things[id]=spec; if(!liveEl) return id; liveEl.style.display="flex"; var b=document.createElement("button"); b.type="button"; b.textContent=spec.label||id; b.onclick=function(){ try{ spec.run(); }catch(e){ talk("That step failed. Try again."); } }; liveEl.appendChild(b); return id; }
  function showGlobe(){ if(cityEl){ cityEl.classList.remove("on"); cityEl.style.pointerEvents="none"; } }
  function km(a,b){ if(!a||!b) return 0; var R=6371,dLat=((b.lat-a.lat)*Math.PI)/180,dLng=((b.lng-a.lng)*Math.PI)/180; var x=Math.sin(dLat/2)*Math.sin(dLat/2)+Math.cos((a.lat*Math.PI)/180)*Math.cos((b.lat*Math.PI)/180)*Math.sin(dLng/2)*Math.sin(dLng/2); return R*2*Math.atan2(Math.sqrt(x),Math.sqrt(1-x)); }
  function travelMin(a,b){ return Math.max(1, Math.round((km(a,b)/22)*60)); }
  function goodsOf(text){ var l=String(text||"").toLowerCase(); if(/ice|gelato|παγω/.test(l)) return {name:"ice cream",temp:"frozen",hold:12,strict:true}; if(/pizza|soup|πιτσ|σουπ/.test(l)) return {name:/soup|σουπ/.test(l)?"soup":"pizza",temp:"hot",hold:35,strict:true}; if(/coffee|καφ/.test(l)) return {name:"coffee",temp:"hot",hold:25,strict:true}; if(/sushi|salad|milk|γαλα/.test(l)) return {name:"cold food",temp:"cold",hold:25,strict:true}; if(/pharm|medicine|φαρμα/.test(l)) return {name:"pharmacy order",temp:"controlled",hold:90,strict:true}; return {name:/parcel|package|δεμα/.test(l)?"parcel":"order",temp:"ambient",hold:180,strict:false}; }
  function fetchJson(url,opt,ms){
    var ctl=window.AbortController?new AbortController():null, timer=ctl&&setTimeout(function(){ctl.abort();},ms||14000);
    opt=opt||{}; if(ctl) opt.signal=ctl.signal;
    return fetch(url,opt).then(function(r){ if(!r.ok) throw new Error("http_"+r.status); return r.json(); }).finally(function(){ if(timer) clearTimeout(timer); });
  }
  function cleanQuery(q){ return String(q||"").replace(/^\s*(i\s+)?(want|need|would like|am looking for|find|get|buy|order|show me)\s+(me\s+)?/i,"").trim()||String(q||"shop").trim(); }
  function escOverpass(s){ return String(s||"").replace(/[^a-z0-9\u0370-\u03ff _-]/gi," ").trim().slice(0,40); }
  function pointOf(r){ var c=r&&r.center||{}; return {lat:+(r&&r.lat!=null?r.lat:c.lat),lng:+(r&&r.lon!=null?r.lon:c.lon)}; }

  function overpassFilters(q){
    var l=q.toLowerCase();
    if(/pizza|πιτσ/.test(l)) return ['["cuisine"~"pizza",i]','["name"~"pizza|pizzeria|πιτσ",i]'];
    if(/coffee|cafe|καφ/.test(l)) return ['["amenity"="cafe"]'];
    if(/pharm|medicine|φαρμα/.test(l)) return ['["amenity"="pharmacy"]'];
    if(/ice|gelato|παγω/.test(l)) return ['["amenity"="ice_cream"]','["cuisine"~"ice_cream",i]','["shop"="confectionery"]'];
    if(/food|restaurant|eat|φαγη|soup|salad|sushi/.test(l)) return ['["amenity"~"restaurant|fast_food|cafe"]'];
    if(/supermarket|grocery|market/.test(l)) return ['["shop"~"supermarket|convenience"]'];
    if(/bakery|bread/.test(l)) return ['["shop"="bakery"]'];
    if(/shoe/.test(l)) return ['["shop"="shoes"]'];
    if(/flower|florist/.test(l)) return ['["shop"="florist"]'];
    if(/book/.test(l)) return ['["shop"="books"]'];
    if(/electronic|phone|computer/.test(l)) return ['["shop"~"electronics|mobile_phone|computer"]'];
    if(/shop|store/.test(l)) return ['["shop"]'];
    return ['["name"~"'+escOverpass(q)+'",i]'];
  }
  function overpassPlaces(q){
    var clauses=overpassFilters(q).map(function(f){ return 'nwr(around:12000,'+here.lat+','+here.lng+')["name"]'+f+';'; }).join("");
    var query='[out:json][timeout:14];('+clauses+');out center tags 30;';
    var urls=["https://overpass-api.de/api/interpreter?data=","https://overpass.kumi.systems/api/interpreter?data="];
    function attempt(i){ if(i>=urls.length) return Promise.resolve([]); return fetchJson(urls[i]+encodeURIComponent(query),{headers:{Accept:"application/json"}},17000).then(function(j){return j.elements||[];}).catch(function(){return attempt(i+1);}); }
    return attempt(0).then(function(rows){ return rows.map(function(r){ var p=pointOf(r),t=r.tags||{}; return {id:"osm-"+r.type+"-"+r.id,name:t.name,lat:p.lat,lng:p.lng,raw:t["addr:full"]||t["addr:street"]||"OpenStreetMap",tags:t}; }).filter(function(v){return v.name&&isFinite(v.lat)&&isFinite(v.lng);}); });
  }
  function nominatimPlaces(q){
    var dy=.14,dx=dy/Math.max(.25,Math.cos(here.lat*Math.PI/180));
    var box=[here.lng-dx,here.lat+dy,here.lng+dx,here.lat-dy].join(",");
    var url="https://nominatim.openstreetmap.org/search?format=jsonv2&addressdetails=1&limit=12&bounded=1&viewbox="+encodeURIComponent(box)+"&q="+encodeURIComponent(q);
    return fetchJson(url,{headers:{Accept:"application/json","Accept-Language":navigator.language||"en"}},13000).then(function(rows){
      return (rows||[]).filter(function(r){return /amenity|shop|office|craft|tourism|healthcare|leisure/.test(String(r.category||r.class||""));}).map(function(r){return {id:"osm-"+(r.osm_type||"")+"-"+r.osm_id,name:r.name||String(r.display_name||"").split(",")[0],lat:+r.lat,lng:+r.lon,raw:r.display_name,tags:r.extratags||{}};});
    }).catch(function(){return [];});
  }
  function hunt(query){
    var raw=String(query||"pizza").trim(),q=cleanQuery(raw);
    job={kind:"find",query:q,status:"hunt"}; selected=null;
    if(!here){ talk("Allow location first."); locate().then(function(){ if(here) hunt(raw); }); return; }
    say("Finding real named places for "+q+"…");
    var seq=++huntSeq;
    Promise.all([nominatimPlaces(q),overpassPlaces(q)]).then(function(groups){
      if(seq!==huntSeq) return;
      var seen={}; vendors=groups[0].concat(groups[1]).filter(function(v){ var k=(v.name+"|"+v.lat.toFixed(4)+"|"+v.lng.toFixed(4)).toLowerCase(); if(seen[k]) return false; seen[k]=1; return km(here,v)<=25; }).sort(function(a,b){return km(here,a)-km(here,b);});
      if(!vendors.length){ clearNeed(); talk("No real named place for "+q+" nearby. Try a different word."); return; }
      clearNeed();
      vendors.slice(0,6).forEach(function(v,i){ var d=km(here,v).toFixed(1); need({id:"v"+i,label:v.name.toUpperCase()+" · "+d+" km",run:function(){selectVendor(v);}}); });
      talk("Found "+vendors.length+" real named places. Pick one.");
    }).catch(function(){ if(seq!==huntSeq)return; clearNeed(); talk("Place search failed. Try again."); });
  }

  function loadMap(){
    if(window.L) return Promise.resolve(window.L);
    if(mapReady) return mapReady;
    mapReady=new Promise(function(resolve,reject){
      if(!document.querySelector('link[data-sn-map]')){ var css=document.createElement("link"); css.rel="stylesheet"; css.href="/js/vendor/leaflet.css?v="+VER; css.setAttribute("data-sn-map",""); document.head.appendChild(css); }
      var s=document.createElement("script"); s.src="/js/vendor/leaflet.js?v="+VER; s.onload=function(){resolve(window.L);}; s.onerror=reject; document.head.appendChild(s);
    });
    return mapReady;
  }
  function routeTo(v){
    if(!here||!v) return Promise.resolve(null);
    var url="https://router.project-osrm.org/route/v1/driving/"+here.lng+","+here.lat+";"+v.lng+","+v.lat+"?overview=full&geometries=geojson";
    return fetchJson(url,{headers:{Accept:"application/json"}},13000).then(function(j){ var r=j&&j.routes&&j.routes[0]; if(r&&selected===v&&job&&job.shop===v) job.routeMin=Math.max(1,Math.round(r.duration/60)); return r||null; }).catch(function(){return null;});
  }
  function showCity(v){
    if(!cityEl||!here||!v) return;
    loadMap().then(function(L){
      cityEl.classList.add("on"); cityEl.style.pointerEvents="auto";
      if(!map){
        map=L.map(cityEl,{zoomControl:false,attributionControl:true}).setView([v.lat,v.lng],14);
        L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",{subdomains:"abcd",maxZoom:19,attribution:"© OpenStreetMap · © CARTO"}).addTo(map);
        map.on("zoomend",function(){ if(map.getZoom()<=10) showGlobe(); });
      }
      if(hereMark) hereMark.remove(); if(vendorMark) vendorMark.remove(); if(routeLine) routeLine.remove();
      hereMark=L.circleMarker([here.lat,here.lng],{radius:6,color:"#4df0ff",fillColor:"#4df0ff",fillOpacity:.9}).addTo(map).bindTooltip("YOU");
      vendorMark=L.circleMarker([v.lat,v.lng],{radius:7,color:"#ffd85a",fillColor:"#ffd85a",fillOpacity:.9}).addTo(map).bindTooltip(v.name,{permanent:true,direction:"top"});
      map.fitBounds(L.latLngBounds([[here.lat,here.lng],[v.lat,v.lng]]).pad(.3),{maxZoom:15});
      setTimeout(function(){map.invalidateSize();},30);
      routeTo(v).then(function(r){ if(selected!==v||!r||!r.geometry||!cityEl.classList.contains("on")) return; routeLine=L.geoJSON(r.geometry,{style:{color:"#4df0ff",weight:4,opacity:.75}}).addTo(map); });
    }).catch(function(){ mapReady=null; showGlobe(); });
  }

  function selectVendor(v){
    selected=v;
    if(job){ job.shop=v; job.status="chosen"; }
    showCity(v);
    clearNeed();
    need({id:"now",label:"NOW",run:function(){ chooseHow("now"); }});
    need({id:"mail",label:"MAIL",run:function(){ chooseHow("mail"); }});
    need({id:"pickup",label:"PICK UP",run:function(){ chooseHow("pickup"); }});
    talk((v.name||"Shop")+". Instant delivery, mail it, or pick it up yourself.");
  }

  function partnerPlaces(how){
    if(!selected||how==="pickup") return Promise.resolve([]);
    var f=how==="mail"?'["amenity"="post_office"]':'["office"~"courier|logistics",i]';
    var q='[out:json][timeout:12];nwr(around:25000,'+selected.lat+','+selected.lng+')["name"]'+f+';out center tags 12;';
    return fetchJson("https://overpass-api.de/api/interpreter?data="+encodeURIComponent(q),{headers:{Accept:"application/json"}},15000).then(function(j){
      return (j.elements||[]).map(function(r){var p=pointOf(r),t=r.tags||{};return {id:"carrier-"+r.type+"-"+r.id,name:t.name,how:how,own:false,real:true,eta:how==="mail"?1440:Math.max(12,(job&&job.routeMin)||travelMin(here,selected)+10),note:how==="mail"?"Named postal service. Days; no temperature hold.":"Named local courier. Assignment must be confirmed.",phone:t.phone||t["contact:phone"]||"",website:t.website||t["contact:website"]||""};}).filter(function(o){return o.name;});
    }).catch(function(){return [];});
  }
  function portalOffers(how,mins){
    if(how!=="now"||!/^(us|ca)$/.test(countryCode)) return [];
    return [
      {id:"doordash",name:"DoorDash",how:how,own:false,portal:true,eta:mins+14,note:"Portal only; availability is confirmed there."},
      {id:"instacart",name:"Instacart",how:how,own:false,portal:true,eta:mins+18,note:"Portal only; availability is confirmed there."},
      {id:"walmart",name:"Walmart",how:how,own:false,portal:true,eta:mins+22,note:"Portal only; availability is confirmed there."}
    ];
  }
  function offerList(how,partners){
    var mins=here&&selected?Math.max(8,(job&&job.routeMin)||travelMin(here,selected)+6):18;
    var g=goodsOf(job&&job.query), own={id:"ours",name:"Astranov",how:how,own:true,eta:how==="mail"?Math.max(mins,90):mins,note:"Astranov request. Stages move only when a real associate confirms them."};
    if(how==="pickup") return [{id:"self",name:"You pick up",how:how,own:true,eta:mins,note:"Handoff at the named shop."}];
    if(how==="mail"&&g.strict&&g.temp!=="ambient") return [];
    var list=[own].concat(partners||[]).concat(portalOffers(how,mins));
    return list.filter(function(o){ return !(how==="now"&&g.strict&&o.eta>g.hold); });
  }

  function chooseHow(how){
    if(!selected){ talk("Pick a place first."); return; }
    if(job) job.how=how;
    var seq=++offerSeq;
    say("Checking real carriers…");
    partnerPlaces(how).then(function(p){ if(seq!==offerSeq||!job||job.how!==how)return; var list=offerList(how,p); if(!list.length){ clearNeed(); need({id:"pickup",label:"PICK UP",run:function(){chooseHow("pickup");}}); if(how!=="mail") need({id:"place",label:"OTHER PLACE",run:function(){hunt(job&&job.query);}}); talk("That route cannot keep "+goodsOf(job&&job.query).name+" within its safe time. Pick it up or choose a closer place."); return; } showOffers(list); });
  }

  function showOffers(list){
    clearNeed(); currentOffers=list;
    list.forEach(function(o){
      need({id:o.id, label:o.name.toUpperCase()+" · "+(o.eta>=1440?Math.round(o.eta/1440)+"d":o.eta+"m"), run:function(){ pickCarrier(o); }});
    });
    var f=list[0];
    if(f.own){
      talk("Astranov first. About "+f.eta+" minutes. Every stage stays still until a real associate confirms it.");
    } else {
      talk(f.name+" · "+f.eta+" min. "+f.note);
    }
  }

  function pickCarrier(o){
    if(job) job.carrier=o;
    clearNeed();
    var price=o.how==="pickup"?6:(o.how==="mail"?14:10);
    need({id:"pay",label:"PAY",run:function(){ payDeposit(price,o); }});
    if(o.id==="ours"||(o.own&&o.how!=="pickup")){
      talk("Astranov. Pay when ready. After PayPal confirms, stage watch begins at paid and waits for real updates.");
    } else if(o.id==="self"){
      talk("Pick up at "+(selected&&selected.name||"the shop")+". We confirm the handoff. Pay when ready.");
    } else {
      talk(o.name+" · about "+o.eta+" min. "+o.note+" Pay if you still want them.");
    }
  }

  function watchStages(avc){
    if(!job||!job.carrier||job.carrier.id!=="ours") return;
    job.status="paid";
    clearNeed();
    talk("PayPal verified "+Number(avc||0).toFixed(2)+" AVC. Stage: paid. Waiting for a real Astranov associate; no stage is being invented.");
  }

  function payDeposit(eur, carrier){
    say("PayPal…");
    try{sessionStorage.setItem("sn:paypal-job",JSON.stringify(job||{carrier:carrier}));}catch(e){}
    fetch("/api/paypal/create-order",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({amount:eur||10,origin:location.origin,reference:selected&&selected.name})}).then(function(r){return r.json().then(function(j){j.http=r.status;return j;});}).then(function(j){
      if(j&&j.ok&&j.approve){ location.href=j.approve; return; }
      clearNeed();
      need({id:"pay",label:"PAY",run:function(){ payDeposit(eur,carrier); }});
      talk(j&&j.error==="paypal_not_configured"?"PayPal is not connected to this host yet. You can retry after it is connected.":"PayPal could not create the payment. Try again.");
    }).catch(function(){ talk("PayPal could not be reached. The PAY control is still available."); });
  }

  function restorePayJob(){ try{ var saved=JSON.parse(sessionStorage.getItem("sn:paypal-job")||"null"); if(saved){ job=saved; selected=saved.shop||null; } }catch(e){} }
  function clearPayQuery(){
    try{ var u=new URL(location.href); ["paypal","token","PayerID"].forEach(function(k){u.searchParams.delete(k);}); history.replaceState({},"",u.pathname+(u.searchParams.toString()?"?"+u.searchParams.toString():"")); }catch(e){}
  }
  function handlePayPalReturn(){
    var p; try{p=new URLSearchParams(location.search);}catch(e){return Promise.resolve(false);}
    var state=p.get("paypal"), token=p.get("token");
    if(!state) return Promise.resolve(false);
    restorePayJob();
    if(state==="cancel"){ clearPayQuery(); if(job&&job.carrier) pickCarrier(job.carrier); else talk("Payment cancelled. You can choose again."); return Promise.resolve(true); }
    if(state!=="success"||!token){ clearPayQuery(); talk("PayPal returned without an order to verify."); return Promise.resolve(true); }
    say("Verifying PayPal…");
    return fetch("/api/paypal/capture-order",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({orderId:token})}).then(function(r){return r.json();}).then(function(j){
      clearPayQuery();
      if(j&&j.ok&&String(j.status).toUpperCase()==="COMPLETED"){ try{sessionStorage.removeItem("sn:paypal-job");}catch(e){} if(job&&job.carrier&&job.carrier.id==="ours") watchStages(j.avc); else talk("PayPal verified "+Number(j.avc||0).toFixed(2)+" AVC."); return true; }
      clearNeed(); need({id:"verify",label:"VERIFY PAYMENT",run:function(){location.href="/?paypal=success&token="+encodeURIComponent(token);}}); talk("Payment is not verified yet. No order stage moved."); return true;
    }).catch(function(){ clearNeed(); need({id:"verify",label:"VERIFY PAYMENT",run:function(){location.href="/?paypal=success&token="+encodeURIComponent(token);}}); talk("Payment verification failed. No order stage moved."); return true; });
  }
  function reverseHere(){
    if(!here) return;
    var url="https://nominatim.openstreetmap.org/reverse?format=jsonv2&zoom=5&lat="+here.lat+"&lon="+here.lng;
    fetchJson(url,{headers:{Accept:"application/json","Accept-Language":"en"}},10000).then(function(j){countryCode=String(j&&j.address&&j.address.country_code||"").toLowerCase();}).catch(function(){});
  }
  function locate(quiet){
    if(!navigator.geolocation){ talk("No GPS."); return Promise.resolve(); }
    if(!quiet) say("Location…");
    return new Promise(function(resolve){
      navigator.geolocation.getCurrentPosition(function(p){
        here={lat:p.coords.latitude,lng:p.coords.longitude};
        yaw=here.lng*Math.PI/180;
        reverseHere();
        showGlobe();
        if(!quiet) talk("Found you. Say what you want.");
        resolve();
      }, function(){ if(!quiet) talk("Allow location."); resolve(); }, {enableHighAccuracy:true,timeout:18000,maximumAge:0});
    });
  }

  function askMic(){
    if(!navigator.mediaDevices||!navigator.mediaDevices.getUserMedia) return Promise.resolve(false);
    var gum=navigator.mediaDevices.getUserMedia({audio:true}).then(function(s){
      try{s.getTracks().forEach(function(t){t.stop();});}catch(e){}
      return true;
    }).catch(function(){ return false; });
    return Promise.race([gum,new Promise(function(resolve){setTimeout(function(){resolve(false);},15000);})]);
  }

  function listen(){
    if(listening||speaking) return;
    var SR=window.SpeechRecognition||window.webkitSpeechRecognition;
    if(!SR) return;
    listening=true;
    rec=new SR();
    rec.continuous=false;
    rec.lang=navigator.language||"en-US";
    rec.onresult=function(ev){
      var i,tx="",fin=false;
      for(i=ev.resultIndex;i<ev.results.length;i++){ tx+=ev.results[i][0].transcript; if(ev.results[i].isFinal) fin=true; }
      if(inEl) inEl.value=tx;
      if(fin&&tx.trim()){ listening=false; try{rec.stop();}catch(e){} run(tx.trim()); }
    };
    rec.onend=function(){ listening=false; if(wantEar&&!speaking) setTimeout(listen,500); };
    rec.onerror=function(ev){ listening=false; if(ev&&ev.error==="not-allowed") wantEar=false; };
    try{ rec.start(); }catch(e){ listening=false; }
  }

  function grok(text){
    say("…");
    fetch("/api/ai",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({prompt:text})}).then(function(r){return r.json();}).then(function(j){
      talk((j&&(j.text||j.response||j.answer))||"AI is busy. You can still type a place or order.");
    }).catch(function(){ talk("AI busy."); });
  }

  function run(raw){
    var t=String(raw||"").trim();
    if(!t) return;
    var low=t.toLowerCase();
    var named;
    if(low==="reboot") return (window.SNReboot&&SNReboot());
    if(low==="locate"||low==="where am i") return locate();
    if(low==="globe"||low==="close") return showGlobe();
    named=vendors.find(function(v){var n=v.name.toLowerCase();return low===n||low.indexOf(n)>=0;});
    if(named&&!selected) return selectVendor(named);
    if(selected&&/mail|post/.test(low)) return chooseHow("mail");
    if(selected&&/pick\s*up|collect/.test(low)) return chooseHow("pickup");
    if(selected&&(/\bnow\b|instant|deliver/.test(low))) return chooseHow("now");
    named=currentOffers.find(function(o){var n=o.name.toLowerCase();return low===n||low.indexOf(n)>=0;});
    if(named) return pickCarrier(named);
    if(low.indexOf("pay")>=0&&job&&job.carrier) return payDeposit(job.carrier.how==="pickup"?6:(job.carrier.how==="mail"?14:10),job.carrier);
    if(/pizza|food|φαγη|πιτσ|coffee|pharm|shop|store|ice|gelato|\b(find|want|need|buy|get|order)\b/.test(low)) return hunt(t);
    return grok(t);
  }

  function size(){
    if(!canvas) return;
    var d=Math.min(2,devicePixelRatio||1);
    canvas.width=Math.max(1,Math.floor((innerWidth||320)*d));
    canvas.height=Math.max(1,Math.floor((innerHeight||480)*d));
  }
  function drawPin(ctx,p,label,color,cx,cy,r){
    if(!p||!isFinite(p.lat)||!isFinite(p.lng)) return;
    var lat=p.lat*Math.PI/180,rel=p.lng*Math.PI/180-yaw,z=Math.cos(lat)*Math.cos(rel);
    if(z<=0) return;
    var x=cx+r*Math.cos(lat)*Math.sin(rel),y=cy-r*Math.sin(lat),d=Math.min(2,devicePixelRatio||1);
    ctx.fillStyle=color; ctx.beginPath(); ctx.arc(x,y,4*d,0,Math.PI*2); ctx.fill();
    ctx.fillStyle="#e8fbff"; ctx.font=(9*d)+"px system-ui"; ctx.fillText(label,x+6*d,y-4*d);
  }
  function tick(){
    try{
      if(canvas){
        var ctx=canvas.getContext("2d");
        if(ctx){
          ctx.fillStyle="#02040a";
          ctx.fillRect(0,0,canvas.width,canvas.height);
          var w=canvas.width,h=canvas.height,cx=w*0.5,cy=h*0.46,r=Math.min(w,h)*0.42/dist;
          ctx.save(); ctx.beginPath(); ctx.arc(cx,cy,r,0,Math.PI*2); ctx.clip();
          if(earthReady){
            var sc=(r*2)/earth.height,iw=earth.width*sc,ih=earth.height*sc,turn=((yaw/(Math.PI*2))%1+1)%1,u=(turn+.5)*iw,base=cx-u,k;
            for(k=-1;k<=2;k++) ctx.drawImage(earth,base+k*iw,cy-r,iw,ih);
          }else{ var sea=ctx.createRadialGradient(cx-r*.25,cy-r*.2,0,cx,cy,r); sea.addColorStop(0,"#0a78a8"); sea.addColorStop(1,"#031225"); ctx.fillStyle=sea; ctx.fillRect(cx-r,cy-r,r*2,r*2); }
          var shade=ctx.createRadialGradient(cx-r*.3,cy-r*.25,r*.1,cx,cy,r); shade.addColorStop(0,"rgba(130,235,255,.05)"); shade.addColorStop(.72,"rgba(0,10,25,.06)"); shade.addColorStop(1,"rgba(0,2,10,.78)"); ctx.fillStyle=shade; ctx.fillRect(cx-r,cy-r,r*2,r*2); ctx.restore();
          ctx.strokeStyle="rgba(77,240,255,0.48)"; ctx.beginPath(); ctx.arc(cx,cy,r,0,Math.PI*2); ctx.stroke();
          drawPin(ctx,here,"YOU","#4df0ff",cx,cy,r); vendors.slice(0,12).forEach(function(v){drawPin(ctx,v,v.name,"#ffd85a",cx,cy,r);});
          if(!drag) yaw+=spin;
        }
      }
    }catch(e){}
    requestAnimationFrame(tick);
  }
  function boot(){
    if(permsTried) return;
    permsTried=true;
    var returning=/[?&]paypal=/.test(location.search||"");
    Promise.all([handlePayPalReturn(),askMic(),locate(returning)]).then(function(){setTimeout(listen,600);});
  }
  window.SN={ver:"V1",run:run,locate:locate,listen:listen,hunt:hunt,state:function(){return {here:here,vendors:vendors,selected:selected,job:job,offers:currentOffers};}};
  if(form) form.addEventListener("submit", function(e){ e.preventDefault(); var v=inEl&&inEl.value; if(inEl) inEl.value=""; run(v); });
  var go=document.getElementById("go");
  if(go) go.addEventListener("click", function(e){ e.preventDefault(); if(inEl&&inEl.value.trim()){ run(inEl.value.trim()); inEl.value=""; return; } wantEar=true; listen(); });
  var plus=document.getElementById("plus");
  if(plus) plus.addEventListener("click", function(){
    if(selected && job && !job.how) return selectVendor(selected);
    if(selected && job && job.how && !job.carrier) return chooseHow(job.how);
    talk("Say what you want. Then now, mail, or pick up.");
  });
  if(canvas){
    canvas.addEventListener("pointerdown",function(e){drag={x:e.clientX,yaw:yaw,last:e.clientX,t:Date.now()}; spin=0; try{canvas.setPointerCapture(e.pointerId);}catch(_){};});
    canvas.addEventListener("pointermove",function(e){if(!drag)return; var now=Date.now(),dx=e.clientX-drag.last; yaw=drag.yaw-(e.clientX-drag.x)/Math.max(180,canvas.clientWidth||innerWidth)*Math.PI*2; spin=-(dx/Math.max(180,canvas.clientWidth||innerWidth))*Math.PI*2/Math.max(1,now-drag.t)*16; drag.last=e.clientX; drag.t=now;});
    function release(){if(!drag)return;drag=null;if(Math.abs(spin)<.0005)spin=.0012;}
    canvas.addEventListener("pointerup",release); canvas.addEventListener("pointercancel",release);
  }
  document.addEventListener("pointerdown", function(){ if(!permsTried) boot(); }, {passive:true});
  window.addEventListener("resize", size);
  size(); tick(); setTimeout(boot,200);
})();
