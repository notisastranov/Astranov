/* SpaceNet 4092 — YOU on the map is a glowing blue delivery motorcycle. */
(function(){
  if(window.__snYouBike) return;
  window.__snYouBike=true;
  var css=document.createElement("style");
  css.textContent=
    ".sn-you-bike{background:transparent!important;border:none!important}"+
    ".sn-you-bike .halo{position:absolute;left:50%;bottom:8px;width:28px;height:10px;margin-left:-14px;border-radius:99px;background:rgba(77,240,255,.35);box-shadow:0 0 14px #4df0ff,0 0 28px rgba(77,240,255,.8);animation:snbikehalo 1.3s ease-in-out infinite}"+
    ".sn-you-bike svg{position:relative;display:block;width:44px;height:44px;filter:drop-shadow(0 0 6px #4df0ff) drop-shadow(0 0 16px #3d6bff);animation:snbike 1.3s ease-in-out infinite}"+
    "@keyframes snbike{0%,100%{transform:translateY(0)}50%{transform:translateY(-2px)}}"+
    "@keyframes snbikehalo{0%,100%{opacity:.55;transform:scale(1)}50%{opacity:1;transform:scale(1.15)}}";
  document.head.appendChild(css);
  function ico(){
    var html=
      '<span class="halo"></span>'+
      '<svg viewBox="0 0 64 64" aria-hidden="true">'+
        '<circle cx="18" cy="48" r="8" fill="none" stroke="#4df0ff" stroke-width="3"/>'+
        '<circle cx="18" cy="48" r="2.6" fill="#4df0ff"/>'+
        '<circle cx="46" cy="48" r="8" fill="none" stroke="#4df0ff" stroke-width="3"/>'+
        '<circle cx="46" cy="48" r="2.6" fill="#4df0ff"/>'+
        '<rect x="8" y="22" width="16" height="12" rx="2" fill="#4df0ff"/>'+
        '<path d="M24 28h6l6-8 8 1" fill="none" stroke="#4df0ff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>'+
        '<path d="M18 48 L26 34 H42 L46 46" fill="none" stroke="#4df0ff" stroke-width="3" stroke-linejoin="round"/>'+
        '<path d="M42 34 L48 22" fill="none" stroke="#4df0ff" stroke-width="3" stroke-linecap="round"/>'+
        '<circle cx="48" cy="20" r="2.2" fill="#4df0ff"/>'+
      "</svg>";
    return window.L.divIcon({className:"sn-you-bike", html:html, iconSize:[44,44], iconAnchor:[22,40]});
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
    var bike=window.L.marker(layer.getLatLng(), {icon:ico(), interactive:true, keyboard:false, zIndexOffset:2800});
    bike.addTo(map);
    layer._snBike=bike;
    layer.on("move", function(){ try{ bike.setLatLng(layer.getLatLng()); }catch(e){} });
    layer.on("remove", function(){ try{ map.removeLayer(bike); }catch(e){} layer._snBike=null; });
    bike.on("click", function(e){
      try{ window.L.DomEvent.stopPropagation(e); }catch(_){}
      try{ layer.fire("click"); }catch(_){}
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
    var el=document.getElementById("city");
    if(el && el._leaflet_id && window.__snMap) scan(window.__snMap);
  }
  boot();
  setInterval(boot, 900);
})();
