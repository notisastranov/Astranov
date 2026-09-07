(function(){
  if(window.__SN_PIN_4165) return;
  window.__SN_PIN_4165=true;
  var RHODES_PHONE="302241601878";
  function digPhone(p){ return String(p==null?"":p).replace(/\D/g,""); }
  function lastPlace(){
    try{
      var sp=JSON.parse(localStorage.getItem("sn:place")||"null");
      if(sp && isFinite(+sp.lat) && isFinite(+sp.lng))
        return {lat:+sp.lat,lng:+sp.lng,name:String(sp.name||sp.place||"here")};
    }catch(e){}
    return null;
  }
  function km(a,b){
    if(!a||!b) return 1e9;
    var R=6371, dLat=(b.lat-a.lat)*Math.PI/180, dLng=(b.lng-a.lng)*Math.PI/180;
    var x=Math.sin(dLat/2), y=Math.sin(dLng/2);
    var h=x*x+Math.cos(a.lat*Math.PI/180)*Math.cos(b.lat*Math.PI/180)*y*y;
    return 2*R*Math.asin(Math.min(1,Math.sqrt(h)));
  }
  function isRhodesPin(v){
    if(!v||!isFinite(+v.lat)||!isFinite(+v.lng)) return false;
    var lat=+v.lat, lng=+v.lng;
    return lat>35.7 && lat<37.2 && lng>27.3 && lng<28.9;
  }
  function placeIsRhodes(p){
    if(!p) return false;
    if(/rhodes|ρόδος|rodos|analipsi|ανάληψ/i.test(String(p.name||""))) return true;
    return isRhodesPin(p);
  }
  function keepNear(list, p){
    return (list||[]).filter(function(v){
      if(!v||!isFinite(+v.lat)) return false;
      if(p && km(p,v)>90) return false;
      if(p && !placeIsRhodes(p) && isRhodesPin(v)) return false;
      return true;
    });
  }
  function setLastHunt(q, from, list){
    var row={q:q||"pizza",from:from||null,list:(list||[]).slice(),at:Date.now()};
    window.__SN_LAST_HUNT=row;
    try{ if(window.SN) SN.lastHunt=row; }catch(e){}
    try{ sessionStorage.setItem("sn:last-hunt", JSON.stringify({q:row.q,from:row.from,list:(row.list||[]).map(function(v){ return {name:v.name,lat:v.lat,lng:v.lng,raw:v.raw||""}; }),at:row.at})); }catch(e){}
    return row;
  }
  function pinTalk(list, from, q){
    var names=(list||[]).slice(0,5).map(function(v){ return v.name; }).filter(Boolean);
    if(!names.length) return "No "+(q||"pizza")+" pin near "+((from&&from.name)||"here")+" yet.";
    return names[0]+(list.length>1?" + "+(list.length-1)+" more":"")+" near "+((from&&from.name)||"here")+". Pins on the map.";
  }
  function toPins(places, q){
    return (places||[]).map(function(x){
      if(!x||!isFinite(+x.lat)||!isFinite(+x.lng)) return null;
      return {id:"ai-"+(+x.lat).toFixed(4)+"-"+(+x.lng).toFixed(4),name:x.name||q||"shop",lat:+x.lat,lng:+x.lng,raw:x.raw||x.addr||"",tags:{phone:x.phone||""},phone:x.phone||"",grok:true,kind:"shop"};
    }).filter(Boolean);
  }
  function paintFromAi(places, q, from){
    var p=from||lastPlace();
    var list=keepNear(toPins(places, q), p);
    var seen={}, out=[];
    list.forEach(function(v){
      var k=(v.name+"|"+(+v.lat).toFixed(3)).toLowerCase();
      if(seen[k]) return; seen[k]=1; out.push(v);
    });
    out.sort(function(a,b){ return p?km(p,a)-km(p,b):0; });
    out=out.slice(0,12);
    setLastHunt(q||"pizza", p, out);
    if(!out.length) return out;
    try{
      if(window.SNWork&&SNWork.autoList){
        out=out.map(function(v){
          var row=SNWork.autoList(v, false);
          if(!row) return v;
          v.id=row.id; v.kind="shop"; v.sn=true; v.tags=row; v.phone=row.phone||v.phone;
          return v;
        });
        setLastHunt(q||"pizza", p, out);
      }
    }catch(e){}
    try{ if(SN.showCity&&p) SN.showCity(p); }catch(e){}
    try{ if(SN.showMap) SN.showMap(out[0], 14); }catch(e){}
    try{ if(SN.talk) SN.talk(pinTalk(out, p, q||"pizza")); else if(SN.say) SN.say(pinTalk(out, p, q||"pizza")); }catch(e){}
    try{
      if(SN.selectVendor) SN.selectVendor(out[0]);
      else if(SNWork&&SNWork.open) SNWork.open(out[0],"shop");
    }catch(e){}
    try{ if(SN.grokListing) SN.grokListing(out[0]); }catch(e){}
    return out;
  }
  function scrubDishes(dishes){
    return (dishes||[]).map(function(it){
      if(!it||!(it.name||it.desc)) return null;
      return {
        name:String(it.name||it.desc||"").trim(),
        price:Number(it.price)||0,
        hours:it.hours||"",
        stock:it.stock||20,
        stock0:it.stock0||it.stock||20,
        photo:it.photo||"",
        sample:false
      };
    }).filter(function(r){ return r&&r.name; });
  }
  function isRhodesBleed(phone, shop){
    var d=digPhone(phone);
    if(!d) return false;
    if(d===RHODES_PHONE || d.slice(-10)==="2241601878"){
      var n=String((shop&&(shop.name||shop.place))||"").toLowerCase();
      if(/pizzarium/.test(n) && /analipsi|αναλυψ|ανάλυψ/.test(n)) return false;
      return true;
    }
    return false;
  }
  function scrubFill(s, shop){
    if(!s||typeof s!=="object") return s;
    var out={};
    for(var k in s){ if(Object.prototype.hasOwnProperty.call(s,k)) out[k]=s[k]; }
    if(out.phone && isRhodesBleed(out.phone, shop||out)) delete out.phone;
    var dishes=scrubDishes(out.dishes||out.items);
    out.dishes=dishes;
    out.items=dishes;
    delete out.sample;
    return out;
  }
  function bindListing(){
    if(!window.SN) return setTimeout(bindListing, 40);
    SN.grokListing=function(p){
      if(!p) return;
      var name=String(p.name||p.place||"shop").trim();
      var raw=String(p.raw||p.place||"").trim();
      var prompt="LISTING FILL act=listing for ONLY this shop: "+name+" at "+raw+" lat "+p.lat+" lng "+p.lng+
        ". Return official phone, opening hours, and published menu dishes with real prices for THIS shop alone from public listings / Google Business / the shop site."+
        " Do NOT use Rhodes Pizzarium Analipsi or +302241601878 or any other shop."+
        " Do NOT set sample=true. Prefer published prices; if a price is an estimate still include the dish with sample=false and a note.";
      if(typeof SN.grok==="function") SN.grok(prompt);
    };
    if(window.SNWork&&SNWork.applyFill && !SNWork.__pin4165Fill){
      SNWork.__pin4165Fill=true;
      var orig=SNWork.applyFill.bind(SNWork);
      SNWork.applyFill=function(s){
        var hint=s||{};
        try{
          var all=(SNWork.all&&SNWork.all().shops)||[];
          if(s&&s.name){
            for(var i=0;i<all.length;i++){
              if(all[i]&&String(all[i].name).toLowerCase()===String(s.name).toLowerCase()){ hint=all[i]; break; }
            }
          }
        }catch(e){}
        var clean=scrubFill(s, hint);
        var r=orig(clean);
        try{ mountPayPath(hint); }catch(e){}
        return r;
      };
    }
  }
  function forcePlaceFill(shop){
    if(!shop||!isFinite(+shop.lat)) return;
    var payload={name:shop.name||"",place:shop.raw||shop.place||"",lat:+shop.lat,lng:+shop.lng,website:""};
    fetch("/api/place",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)})
      .then(function(r){ return r.json(); })
      .then(function(j){
        if(!j) return;
        if(window.SNWork&&SNWork.applyFill) SNWork.applyFill(scrubFill(j, shop));
      }).catch(function(){});
    try{ if(SN.grokListing) SN.grokListing(shop); }catch(e){}
  }
  function mountPayPath(shop){
    var host=document.querySelector("#sn-sheet.on .card")||document.querySelector("#sn-menu.on .card")||document.querySelector("#sn-live");
    if(!host) return;
    var bar=document.getElementById("sn-paypath-4165");
    if(!bar){
      bar=document.createElement("div");
      bar.id="sn-paypath-4165";
      bar.style.cssText="display:flex;flex-wrap:wrap;gap:8px;margin:10px 0 4px;padding:0 2px";
      bar.innerHTML=
        '<button type="button" data-act="now" style="flex:1;min-width:88px;height:40px;border-radius:12px;border:1px solid rgba(77,240,255,.7);background:rgba(4,16,28,.95);color:#4df0ff;font:800 12px system-ui">NOW</button>'+
        '<button type="button" data-act="pay" style="flex:1;min-width:88px;height:40px;border-radius:12px;border:1px solid rgba(77,240,255,.7);background:rgba(4,16,28,.95);color:#4df0ff;font:800 12px system-ui">PAY</button>'+
        '<button type="button" data-act="reload" style="flex:1;min-width:88px;height:40px;border-radius:12px;border:1px solid rgba(77,240,255,.7);background:rgba(4,16,28,.95);color:#7ee9ff;font:800 12px system-ui">RELOAD</button>';
      bar.addEventListener("click", function(e){
        var btn=e.target&&e.target.closest&&e.target.closest("[data-act]");
        if(!btn) return;
        var act=btn.getAttribute("data-act");
        var go=document.getElementById("sn-order-go");
        if(act==="now"){
          if(go&&!go.disabled) go.click();
          else if(window.SN&&SN.talk) SN.talk("Add dishes to cart, then ORDER. NOW starts delivery after PAY.");
          else if(window.SN&&SN.say) SN.say("Add dishes, ORDER, then NOW.");
          return;
        }
        if(act==="pay"){
          if(go&&!go.disabled) go.click();
          else if(window.SN&&SN.talk) SN.talk("Add a dish and ORDER first. PAY takes AV€ 1:1 after the cart.");
          return;
        }
        if(act==="reload"){
          try{
            if(window.SN&&typeof SN.openCash==="function") SN.openCash();
            else if(window.SN&&SN.talk) SN.talk("RELOAD EUR → AV€ is on the wallet. Guest mine stays AV€ 0 — do not pay.");
          }catch(err){}
        }
      });
    }
    if(!bar.parentNode){
      var live=host.querySelector("#sn-live")||host;
      live.appendChild(bar);
    }
  }
  function wrapSelect(){
    if(!window.SN||!SN.selectVendor||SN.selectVendor.__pin4165) return setTimeout(wrapSelect, 40);
    var orig=SN.selectVendor.bind(SN);
    SN.selectVendor=function(v){
      var r=orig(v);
      try{
        if(v&&isFinite(+v.lat)){
          forcePlaceFill(v);
          setTimeout(function(){ mountPayPath(v); }, 80);
          setTimeout(function(){ mountPayPath(v); }, 600);
          setTimeout(function(){ mountPayPath(v); }, 1800);
        }
      }catch(e){}
      return r;
    };
    SN.selectVendor.__pin4165=true;
  }
  var ofetch=window.fetch;
  window.fetch=function(input, init){
    var url=typeof input==="string"?input:(input&&input.url)||"";
    var u=String(url);
    var p=ofetch.apply(this, arguments);
    if(u.indexOf("/api/ai")===-1) return p;
    return p.then(function(res){
      var clone=res.clone();
      return clone.json().then(function(j){
        try{
          var a=String(j&&(j.act||j.action)||"").toLowerCase();
          var places=j&&j.places;
          var fixed=lastPlace();
          var foodish=/pizza|burger|coffee|food|pizzeria|restaurant/i.test(String((j&&(j.q||j.say||j.prompt))||"")+" "+a);
          if((a==="hunt"||a==="find"||a==="order"||foodish) && Array.isArray(places) && places.length && fixed && !placeIsRhodes(fixed)){
            var q=String(j.q||"pizza");
            var out=paintFromAi(places, q, fixed);
            var say=pinTalk(out, fixed, q);
            j=Object.assign({}, j, {act:"talk",action:"talk",say:say,places:[],lat:null,lng:null});
            return new Response(JSON.stringify(j),{status:res.status,headers:{"Content-Type":"application/json"}});
          }
          if(a==="listing" || (j&&(j.dishes||j.items||j.phone)&&(j.name||a==="listing"))){
            j=scrubFill(j, {name:j.name,lat:j.lat,lng:j.lng,place:j.place||j.raw});
            return new Response(JSON.stringify(j),{status:res.status,headers:{"Content-Type":"application/json"}});
          }
        }catch(e){}
        return res;
      }).catch(function(){ return res; });
    });
  };
  try{
    if(!window.__SN_LAST_HUNT){
      var raw=sessionStorage.getItem("sn:last-hunt");
      if(raw) window.__SN_LAST_HUNT=JSON.parse(raw);
    }
  }catch(e){}
  bindListing();
  wrapSelect();
  setInterval(function(){
    bindListing();
    wrapSelect();
    try{
      if(window.__SN_LAST_HUNT&&window.__SN_LAST_HUNT.list&&window.__SN_LAST_HUNT.list.length){
        sessionStorage.setItem("sn:last-hunt", JSON.stringify({
          q:window.__SN_LAST_HUNT.q,
          from:window.__SN_LAST_HUNT.from,
          list:(window.__SN_LAST_HUNT.list||[]).map(function(v){ return {name:v.name,lat:v.lat,lng:v.lng,raw:v.raw||""}; }),
          at:window.__SN_LAST_HUNT.at
        }));
      }
    }catch(e){}
    var sheet=document.querySelector("#sn-sheet.on, #sn-menu.on");
    if(sheet) mountPayPath();
  }, 1600);
})();
