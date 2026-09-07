(function(){
  if(window.__SN_LAND_4155) return;
  window.__SN_LAND_4155=true;
  try{
    var dig=function(v){ return String(v==null?"":v).replace(/[^0-9]/g,""); };
    if(dig(localStorage.getItem("sn:avc"))==="3000000") localStorage.setItem("sn:avc","0");
    if(dig(localStorage.getItem("sn:pool"))==="3000000") localStorage.setItem("sn:pool","0");
    localStorage.setItem("sn:ave-restored","4024");
  }catch(e){}
  function escRe(s){ return String(s||"").replace(/[.*+?^${}()|[\]\\]/g,"\\$&"); }
  function landQ(t){
    t=String(t||"").trim();
    if(!t) return "";
    var low=t.toLowerCase().replace(/[.!?]+$/,"");
    if(/^(hi|hey|hello|ok|okay|yes|no|thanks|reboot|γεια)$/.test(low)) return "";
    if(/\b(what|who|why|how|photosynthesis|pizza|order|call|pay|login|dating)\b/i.test(t)) return "";
    var m=t.match(/^(?:land(?:\s+(?:in|at|on))?|go(?:\s+to)?|fly(?:\s+to)?)\s+(.+)$/i);
    if(m) return m[1].replace(/[.!?]+$/,"").trim();
    if(/^nairobi(?:\s*,?\s*kenya)?$/i.test(low)) return t;
    return "";
  }
  function isFood(t){
    return /\b(pizza|pizzeria|πιτσ|burger|coffee|cafe|gyro|souvlaki|kebab|sushi|beer|pharm|pharmacy|ice\s*cream|restaurant|food|φαγη)\b/i.test(String(t||""));
  }
  function parsePlace(t){
    t=String(t||"").trim();
    if(!t) return "";
    var m=t.match(/\b(?:near|in|at|around|by)\s+([A-Za-z\u00C0-\u024F][\w\u00C0-\u024F\s\-']{1,48})[.!?]*$/i);
    if(m) return m[1].replace(/\s+/g," ").trim();
    m=t.match(/\b(?:near|in|at|around|by)\s+([A-Za-z\u00C0-\u024F][\w\u00C0-\u024F\s\-']{1,48})\b/i);
    if(m) return m[1].replace(/\s+/g," ").trim();
    return "";
  }
  function foodQ(t, place){
    var q=String(t||"");
    if(place){
      q=q.replace(new RegExp("\\b(?:near|in|at|around|by)\\s+"+escRe(place)+"\\b","ig")," ");
      q=q.replace(new RegExp("\\b"+escRe(place)+"\\b","ig")," ");
    }
    q=q.replace(/\b(find|get|order|show me|show|hunt|please|nearby|near me|the best|best)\b/ig," ").replace(/\s+/g," ").trim();
    return q||"pizza";
  }
  function lastPlace(){
    try{
      var sp=JSON.parse(localStorage.getItem("sn:place")||"null");
      if(sp && isFinite(+sp.lat) && isFinite(+sp.lng)){
        return {lat:+sp.lat,lng:+sp.lng,name:String(sp.name||sp.place||"here")};
      }
    }catch(e){}
    return null;
  }
  function geocode(q){
    var url="https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&q="+encodeURIComponent(q);
    return fetch(url,{headers:{Accept:"application/json","Accept-Language":"en","User-Agent":"AstranovSpaceNet/1"}}).then(function(r){ return r.json(); }).then(function(rows){
      var r=rows&&rows[0];
      if(!r||!isFinite(+r.lat)) return null;
      return {lat:+r.lat,lng:+r.lon,name:r.name||String(r.display_name||"").split(",")[0]||q};
    }).catch(function(){ return null; });
  }
  function km(a,b){
    if(!a||!b) return 1e9;
    var R=6371, dLat=(b.lat-a.lat)*Math.PI/180, dLng=(b.lng-a.lng)*Math.PI/180;
    var x=Math.sin(dLat/2), y=Math.sin(dLng/2);
    var h=x*x+Math.cos(a.lat*Math.PI/180)*Math.cos(b.lat*Math.PI/180)*y*y;
    return 2*R*Math.asin(Math.min(1,Math.sqrt(h)));
  }
  function overpassPizza(from, q){
    if(!from) return Promise.resolve([]);
    var f='["cuisine"~"pizza",i]';
    if(/burger/i.test(q)) f='["cuisine"~"burger",i]';
    else if(/coffee|cafe/i.test(q)) f='["amenity"="cafe"]';
    else if(/gyro|kebab|souvlaki/i.test(q)) f='["cuisine"~"kebab|greek|grill",i]';
    else if(!/pizza/i.test(q)) f='["amenity"~"restaurant|fast_food|cafe"]';
    var query='[out:json][timeout:8];(nwr(around:12000,'+from.lat+','+from.lng+')["name"]'+f+';);out center tags 24;';
    return fetch("https://overpass.kumi.systems/api/interpreter?data="+encodeURIComponent(query),{headers:{Accept:"application/json"}}).then(function(r){ return r.json(); }).then(function(j){
      return (j.elements||[]).map(function(el){
        var t=el.tags||{};
        var lat=el.lat!=null?+el.lat:(el.center&&+el.center.lat);
        var lng=el.lon!=null?+el.lon:(el.center&&+el.center.lon);
        if(!t.name||!isFinite(lat)) return null;
        return {id:"osm-"+el.type+"-"+el.id,name:t.name,lat:lat,lng:lng,raw:t["addr:street"]||"OpenStreetMap",tags:t,grok:false};
      }).filter(Boolean);
    }).catch(function(){ return []; });
  }
  function goNamed(q){
    q=String(q||"").trim();
    if(!q||!window.SN) return;
    if(SN.say) SN.say("Going to "+q+"…");
    geocode(q).then(function(p){
      if(!p||!isFinite(p.lat)){ if(SN.talk) SN.talk("Could not land "+q+"."); return; }
      try{ localStorage.setItem("sn:place", JSON.stringify({lat:p.lat,lng:p.lng,name:p.name})); }catch(e){}
      if(SN.showCity) SN.showCity(p);
      else if(SN.showMap) SN.showMap(p,14);
      if(window.SNWork&&SNWork.open) SNWork.open(p,"home");
      if(SN.talk) SN.talk("On the ground in "+(p.name||q)+".");
    });
  }
  window.SNGoNamed=goNamed;
  function foodHunt(raw, placeName, fixed){
    var q=foodQ(raw, placeName);
    var label=placeName||(fixed&&fixed.name)||"here";
    if(window.SN&&SN.say) SN.say("Finding "+q+" near "+label+"…");
    var start=fixed && isFinite(+fixed.lat) ? Promise.resolve(fixed) : geocode(placeName);
    return start.then(function(p){
      if(!p){ if(window.SN&&SN.talk) SN.talk("Could not find "+label+"."); return null; }
      try{ localStorage.setItem("sn:place", JSON.stringify({lat:p.lat,lng:p.lng,name:p.name||label})); }catch(e){}
      if(SN.showCity) SN.showCity(p);
      var body={prompt:raw,message:raw,spacenet:true,fast:false,force_paid:true,allow_paid:true,here:{place:p.name,name:p.name,lat:p.lat,lng:p.lng}};
      var ai=fetch("/api/ai",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)}).then(function(r){ return r.json(); }).catch(function(){ return {}; });
      var osm=overpassPizza(p, q);
      return Promise.all([ai, osm]).then(function(pair){
        var j=pair[0]||{}, osmList=pair[1]||[];
        var pins=[];
        (j.places||[]).forEach(function(x){
          if(!x||!isFinite(+x.lat)||!isFinite(+x.lng)) return;
          if(km(p,{lat:+x.lat,lng:+x.lng})>90) return;
          pins.push({id:"ai-"+(+x.lat).toFixed(4),name:x.name||q,lat:+x.lat,lng:+x.lng,raw:x.raw||x.addr||"",tags:{phone:x.phone||""},grok:true});
        });
        osmList.forEach(function(v){ if(km(p,v)<=90) pins.push(v); });
        var seen={}, out=[];
        pins.forEach(function(v){
          var k=(v.name+"|"+(+v.lat).toFixed(3)).toLowerCase();
          if(seen[k]) return; seen[k]=1; out.push(v);
        });
        out.sort(function(a,b){ return km(p,a)-km(p,b); });
        out=out.slice(0,12);
        window.__SN_LAST_HUNT={q:q,from:p,list:out};
        if(!out.length){
          if(window.SN&&SN.talk) SN.talk("No "+q+" pin near "+(p.name||label)+" yet.");
          return p;
        }
        if(window.SN&&typeof SN.hunt==="function"){
          SN.hunt(q, p, out);
        }else if(SN.showMap){
          SN.showMap(out[0], 14);
          if(SN.talk) SN.talk((out[0].name||q)+" is on SpaceNet near "+(p.name||label)+".");
        }
        return p;
      });
    });
  }
  function wrapRun(){
    if(!window.SN||!SN.run) return setTimeout(wrapRun, 40);
    if(SN.__land4155) return;
    SN.__land4155=true;
    var orig=SN.run;
    SN.run=function(t){
      t=String(t||"").trim();
      var q=landQ(t);
      if(q){ goNamed(q); return; }
      if(isFood(t)){
        var place=parsePlace(t);
        var fixed=null;
        if(!place){
          fixed=lastPlace();
          if(fixed) place=fixed.name||"here";
        }
        if(place){
          foodHunt(t, place, fixed);
          return;
        }
        if(SN.talk) SN.talk("Land a city first, or say pizza near Nairobi.");
        return;
      }
      return orig.call(this, t);
    };
  }
  var ofetch=window.fetch;
  window.fetch=function(input, init){
    var url=typeof input==="string"?input:(input&&input.url)||"";
    var p=ofetch.apply(this, arguments);
    if(String(url).indexOf("/api/ai")===-1) return p;
    return p.then(function(res){
      var clone=res.clone();
      clone.json().then(function(j){
        var a=String(j&&(j.act||j.action)||"").toLowerCase();
        var q=String(j&&(j.q||j.place||j.name)||"").trim();
        if(q && /^(city|land|go|fly|place|map|streets)$/.test(a)) goNamed(q);
      }).catch(function(){});
      return res;
    });
  };
  wrapRun();
})();
