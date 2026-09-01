/* SpaceNet 4129 — zoom out through continent + country. Globe only after world. No wrap. */
(function(){
  var city=null;
  function cityEl(){ return city||(city=document.getElementById("city")); }
  function hideCity(){
    var el=cityEl();
    if(!el) return;
    el.classList.remove("on");
    el.style.pointerEvents="none";
  }
  function mapOf(){
    try{ return window.SN && SN.map; }catch(e){ return null; }
  }
  function leafletMap(){
    var el=cityEl();
    if(el && el._leaflet_id && window.L && L.DomUtil){
      try{ return el._leaflet; }catch(e){}
    }
    return mapOf();
  }
  function atWorld(m){
    try{ return m && m.getZoom && m.getZoom()<=(m.getMinZoom? m.getMinZoom():3); }catch(e){ return false; }
  }
  function bindMap(m){
    if(!m || m.__snLeaveBound) return m;
    m.__snLeaveBound=true;
    try{ if(m.setMinZoom) m.setMinZoom(3); }catch(e){}
    try{ if(m.setMaxBounds) m.setMaxBounds([[-85,-180],[85,180]]); }catch(e){}
    return m;
  }
  function wrap(){
    if(!window.L || !L.map || L.map.__snLeave) return !!window.L;
    var orig=L.map.bind(L);
    function mapped(target, opts){
      opts=opts||{};
      if(opts.minZoom==null || opts.minZoom>3) opts.minZoom=3;
      opts.worldCopyJump=false;
      if(!opts.maxBounds) opts.maxBounds=[[-85,-180],[85,180]];
      opts.maxBoundsViscosity=1;
      return bindMap(orig(target, opts));
    }
    mapped.__snLeave=true;
    L.map=mapped;
    return true;
  }
  function onWheel(e){
    var el=cityEl();
    if(!el || !el.classList.contains("on")) return;
    if(!(e && e.deltaY>0)) return;
    var m=null;
    try{ m=el._leaflet_id && window.L && L.Map && null; }catch(_){}
    try{
      var maps=window.SN && SN.map;
      if(maps && maps.getZoom) m=maps;
    }catch(_){}
    if(!m && window.SN && SN.getMap) m=SN.getMap();
    if(!m || !atWorld(m)) return;
    if(e.preventDefault){ e.preventDefault(); e.stopPropagation(); }
    hideCity();
  }
  function wireCity(){
    var el=cityEl();
    if(!el || el.__snLeaveWired) return;
    el.__snLeaveWired=true;
    el.addEventListener("wheel", onWheel, {passive:false, capture:true});
    var dist0=0, z0=99;
    el.addEventListener("touchstart", function(e){
      if(e.touches && e.touches.length===2){
        var a=e.touches[0], b=e.touches[1];
        dist0=Math.hypot(a.clientX-b.clientX, a.clientY-b.clientY);
        try{ var mm=window.SN&&SN.getMap&&SN.getMap(); z0=(mm&&mm.getZoom&&mm.getZoom())||99; }catch(_){ z0=99; }
      }
    }, {passive:true, capture:true});
    el.addEventListener("touchmove", function(e){
      if(!e.touches || e.touches.length!==2 || !dist0) return;
      var a=e.touches[0], b=e.touches[1];
      var d=Math.hypot(a.clientX-b.clientX, a.clientY-b.clientY);
      if(d < dist0-36 && z0<=3.5){
        if(e.preventDefault) e.preventDefault();
        hideCity();
        dist0=0;
      }
    }, {passive:false, capture:true});
  }
  wrap();
  wireCity();
  if(!window.L){
    var n=0, t=setInterval(function(){ wrap(); wireCity(); if(window.L||++n>80) clearInterval(t); }, 50);
  }
  setInterval(wireCity, 1500);
})();
