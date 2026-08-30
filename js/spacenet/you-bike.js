/* SpaceNet 4093 — YOU on the map: pick a glowing vehicle or emoji. Default 🛵. */
(function(){
  if(window.__snYouBike && window.SNYou) return;
  window.__snYouBike=true;
  var DEF="🛵";
  function read(){ try{ return localStorage.getItem("sn:you-icon")||DEF; }catch(e){ return DEF; } }
  function write(v){ try{ localStorage.setItem("sn:you-icon", v); }catch(e){} }
  var css=document.createElement("style");
  css.textContent=
    ".sn-you-bike{background:transparent!important;border:none!important}"+
    ".sn-you-bike .halo{position:absolute;left:50%;bottom:6px;width:30px;height:10px;margin-left:-15px;border-radius:99px;background:rgba(77,240,255,.4);box-shadow:0 0 14px #4df0ff,0 0 28px rgba(77,240,255,.85);animation:snbikehalo 1.3s ease-in-out infinite}"+
    ".sn-you-bike .emo{position:relative;display:flex;align-items:center;justify-content:center;width:44px;height:44px;font-size:28px;line-height:1;filter:drop-shadow(0 0 6px #4df0ff) drop-shadow(0 0 14px #3d6bff);animation:snbike 1.3s ease-in-out infinite}"+
    "@keyframes snbike{0%,100%{transform:translateY(0)}50%{transform:translateY(-2px)}}"+
    "@keyframes snbikehalo{0%,100%{opacity:.55;transform:scale(1)}50%{opacity:1;transform:scale(1.18)}}";
  document.head.appendChild(css);
  function ico(ch){
    ch=ch||read();
    var html='<span class="halo"></span><span class="emo">'+ch+"</span>";
    return window.L.divIcon({className:"sn-you-bike", html:html, iconSize:[44,44], iconAnchor:[22,40]});
  }
  function paintExisting(){
    var ch=read();
    document.querySelectorAll(".sn-you-bike .emo").forEach(function(el){ el.textContent=ch; });
  }
  function dress(map, layer){
    if(!map||!layer||layer._snBike) return;
    if(!layer.getLatLng) return;
    var you=false;
    try{
      var tip=layer.getTooltip&&layer.getTooltip();
      var c=tip&&tip.getContent&&String(tip.getContent()||"");
      if(/YOU/.test(c)) you=true;
    }catch(e){}
    var opt=layer.options||{};
    if(!you && !(opt.fillColor==="#4df0ff" && opt.radius===7)) return;
    try{ layer.setStyle({opacity:0,fillOpacity:0,weight:0,radius:16}); }catch(e){}
    try{ if(layer.unbindTooltip) layer.unbindTooltip(); }catch(e){}
    var bike=window.L.marker(layer.getLatLng(), {icon:ico(read()), interactive:true, keyboard:false, zIndexOffset:2800});
    bike.addTo(map);
    layer._snBike=bike;
    layer.on("move", function(){ try{ bike.setLatLng(layer.getLatLng()); }catch(e){} });
    layer.on("remove", function(){ try{ map.removeLayer(bike); }catch(e){} layer._snBike=null; });
    bike.on("click", function(e){
      try{ window.L.DomEvent.stopPropagation(e); }catch(_){}
      if(window.SNAuth&&SNAuth.open) SNAuth.open();
      else try{ layer.fire("click"); }catch(_){}
    });
  }
  function scan(map){
    if(!map||!map.eachLayer) return;
    map.eachLayer(function(layer){ dress(map, layer); });
  }
  function hook(){
    if(!window.L||!L.Map) return false;
    if(L.Map.prototype.__snBike) return true;
    L.Map.prototype.__snBike=true;
    L.Map.addInitHook(function(){ window.__snMap=this; });
    var add=L.Map.prototype.addLayer;
    L.Map.prototype.addLayer=function(layer){
      var r=add.apply(this, arguments);
      window.__snMap=this;
      try{ dress(this, layer); }catch(e){}
      return r;
    };
    return true;
  }
  function boot(){
    hook();
    if(window.__snMap) scan(window.__snMap);
  }
  function setIcon(ch){
    if(!ch) return read();
    write(ch);
    paintExisting();
    boot();
    return ch;
  }
  window.SNYou={get:read,set:setIcon,list:function(){ return ICONS; }};
  var ICONS=["🛵","🏍️","🚲","🚴","🛴","🚗","🚕","🚙","🚐","🛻","🚚","🚛","🚌","🚜","🚁","✈️","🚀","🚢","⛵","🚤","🚂","🚶","🏃","🧍","😊","😎","🧑","👨","👩","🧔","🦸","🥷","👷","👨‍🚀","👩‍🚀","🧑‍✈️"];
  window.SNYou.list=function(){ return ICONS.slice(); };
  boot();
  setInterval(boot, 900);
})();
