(function(){
  if(window.__SN_HUNT_4157) return;
  window.__SN_HUNT_4157=true;
  function dig(v){ return String(v==null?"":v).replace(/[^0-9]/g,""); }
  try{
    if(dig(localStorage.getItem("sn:avc"))==="3000000") localStorage.setItem("sn:avc","0");
    if(dig(localStorage.getItem("sn:pool"))==="3000000") localStorage.setItem("sn:pool","0");
    localStorage.setItem("sn:ave-restored","4024");
  }catch(e){}
  function escRe(s){ return String(s||"").replace(/[.*+?^${}()|[\]\\]/g,"\\$&"); }
  function isFood(t){
    return /\b(pizza|pizzeria|πιτσ|burger|coffee|cafe|gyro|souvlaki|kebab|sushi|beer|pharm|pharmacy|ice\s*cream|restaurant|food|φαγη)\b/i.test(String(t||""));
  }
  function parsePlace(t){
    t=String(t||"").trim();
    if(!t) return "";
    var m=t.match(/\b(?:near|in|at|around|by)\s+([A-Za-z\u00C0-\u024F][\w\u00C0-\u024F\s\-']{1,48})$/i);
    if(m) return m[1].replace(/\s+/g," ").trim();
    m=t.match(/\b(?:near|in|at|around|by)\s+([A-Za-z\u00C0-\u024F][\w\u00C0-\u024F\s\-']{1,48})\b/i);
    if(m) return m[1].replace(/\s+/g," ").trim();
    m=t.match(/^(?:find|get|order|show(?:\s+me)?|hunt)\s+(?:me\s+)?(.+?)\s+(?:near|in|at|around)\s+([A-Za-z\u00C0-\u024F].+)$/i);
    if(m) return m[2].replace(/\s+/g," ").trim();
    m=t.match(/^(pizza|pizzeria|burger|coffee|cafe|gyro|souvlaki|sushi|beer|pharmacy|food)\s+([A-Za-z\u00C0-\u024F][\w\u00C0-\u024F\s\-']{2,40})$/i);
    if(m) return m[2].replace(/\s+/g," ").trim();
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
        return {id:"osm-"+el.type+"-"+el.id,name:t.name,lat:lat,lng:lng,raw:t["addr:street"]||"OpenStreetMap",tags:t};
      }).filter(Boolean);
    }).catch(function(){ return []; });
  }
  function paintPins(list, from, q){
    if(!list||!list.length||!window.SN) return;
    list=list.slice().sort(function(a,b){ return km(from,a)-km(from,b); });
    var near=list.filter(function(v){ return km(from,v)<=90; });
    if(near.length) list=near;
    list=list.slice(0,12);
    window.__SN_LAST_HUNT={q:q,from:from,list:list};
    if(SN.showCity) SN.showCity(from);
    try{
      if(window.SNWork&&SNWork.autoList){
        list=list.map(function(v,i){
          var row=SNWork.autoList(v, i===0);
          if(!row) return v;
          v.id=row.id; v.kind="shop"; v.sn=true; v.tags=row; v.phone=row.phone||v.phone;
          return v;
        });
      }
    }catch(e){}
    if(SN.showMap) SN.showMap(list[0], 14);
    if(SN.talk) SN.talk((list[0].name||q)+" is on SpaceNet near "+(from.name||"here")+". Order from the pin.");
    try{
      if(SN.selectVendor) SN.selectVendor(list[0]);
      else if(window.SNWork&&SNWork.open) SNWork.open(list[0],"shop");
    }catch(e){}
  }
  function huntAt(raw, placeName){
    var q=foodQ(raw, placeName);
    if(window.SN&&SN.say) SN.say("Finding "+q+" near "+placeName+"…");
    return geocode(placeName).then(function(p){
      if(!p){ if(window.SN&&SN.talk) SN.talk("Could not find "+placeName+"."); return null; }
      var body={prompt:raw,message:raw,spacenet:true,fast:false,force_paid:true,allow_paid:true,here:{place:p.name,name:p.name,lat:p.lat,lng:p.lng}};
      var ai=fetch("/api/ai",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)}).then(function(r){ return r.json(); }).catch(function(){ return {}; });
      var osm=overpassPizza(p, q);
      return Promise.all([ai, osm]).then(function(pair){
        var j=pair[0]||{}, osmList=pair[1]||[];
        var pins=[];
        (j.places||[]).forEach(function(x){
          if(!x||!isFinite(+x.lat)) return;
          pins.push({id:"ai-"+(+x.lat).toFixed(4),name:x.name||q,lat:+x.lat,lng:+x.lng,raw:x.raw||x.addr||"",tags:{phone:x.phone||""},grok:true});
        });
        pins=pins.filter(function(v){ return km(p,v)<=90; }).concat(osmList.filter(function(v){ return km(p,v)<=90; }));
        var seen={}, out=[];
        pins.forEach(function(v){
          var k=(v.name+"|"+(+v.lat).toFixed(3)).toLowerCase();
          if(seen[k]) return; seen[k]=1; out.push(v);
        });
        if(!out.length){ if(window.SN&&SN.talk) SN.talk("No "+q+" pin near "+(p.name||placeName)+" yet."); return p; }
        paintPins(out, p, q);
        return p;
      });
    });
  }
  function wrapRun(){
    if(!window.SN||!SN.run) return setTimeout(wrapRun, 40);
    if(SN.__hunt4157) return;
    SN.__hunt4157=true;
    var orig=SN.run;
    SN.run=function(t){
      var place=parsePlace(t);
      if(place && isFood(t)){
        huntAt(t, place);
        return;
      }
      return orig.apply(this, arguments);
    };
  }
  var ofetch=window.fetch;
  window.fetch=function(input, init){
    var url=typeof input==="string"?input:(input&&input.url)||"";
    if(String(url).indexOf("/api/ai")===-1 || !init || !init.body) return ofetch.apply(this, arguments);
    try{
      var body=typeof init.body==="string"?JSON.parse(init.body):init.body;
      var text=String((body&&(body.prompt||body.message||body.text))||"");
      var place=parsePlace(text);
      if(place && isFood(text)){
        return geocode(place).then(function(p){
          if(p){
            body.here=Object.assign({}, body.here||{}, {place:p.name,name:p.name,lat:p.lat,lng:p.lng});
            init=Object.assign({}, init, {body:JSON.stringify(body)});
          }
          return ofetch.call(this, input, init).then(function(res){
            var clone=res.clone();
            return clone.json().then(function(j){
              if(p && j && Array.isArray(j.places)){
                var kept=j.places.filter(function(x){ return x&&isFinite(+x.lat)&&km(p,{lat:+x.lat,lng:+x.lng})<=90; });
                if(kept.length) j.places=kept;
              }
              return new Response(JSON.stringify(j), {status:res.status, headers:{"Content-Type":"application/json"}});
            }).catch(function(){ return res; });
          });
        }.bind(this));
      }
    }catch(e){}
    return ofetch.apply(this, arguments);
  };
  wrapRun();
})();
