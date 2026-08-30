(function(){
  var city=null;
  function cityEl(){ return city||(city=document.getElementById("city")); }
  function hideCity(){
    var el=cityEl();
    if(!el || !el.classList.contains("on")) return;
    el.classList.remove("on");
    el.style.pointerEvents="none";
  }
  function tileZoom(){
    var el=cityEl(); if(!el) return null;
    var img=el.querySelector("img.leaflet-tile");
    var src=img&&img.src||"";
    var m=src.match(/\/(\d+)\/\d+\/\d+\.(?:png|jpg|jpeg)/i);
    if(m) return +m[1];
    return null;
  }
  function leaveCity(map){
    try{
      if(map && map.getZoom && map.getZoom()>=6) return;
      if(!map){
        var z=tileZoom();
        if(z!=null && z>=6) return;
        if(z==null) return;
      }
      hideCity();
    }catch(e){}
  }
  function bindMap(m){
    if(!m || m.__snLeaveBound) return m;
    m.__snLeaveBound=true;
    try{ if(m.setMinZoom) m.setMinZoom(5); }catch(e){}
    m.on("zoom zoomend", function(){ leaveCity(m); });
    return m;
  }
  function wrap(){
    if(!window.L || !L.map || L.map.__snLeave) return !!window.L;
    var orig=L.map.bind(L);
    function mapped(target, opts){
      opts=opts||{};
      if(opts.minZoom==null) opts.minZoom=5;
      if(opts.worldCopyJump==null) opts.worldCopyJump=false;
      return bindMap(orig(target, opts));
    }
    mapped.__snLeave=true;
    L.map=mapped;
    return true;
  }
  function onOut(e){
    var el=cityEl();
    if(!el || !el.classList.contains("on")) return;
    var z=tileZoom();
    if(z!=null && z<=6){
      if(e && e.preventDefault){ e.preventDefault(); e.stopPropagation(); }
      hideCity();
    }
  }
  function wireCity(){
    var el=cityEl();
    if(!el || el.__snLeaveWired) return;
    el.__snLeaveWired=true;
    el.addEventListener("wheel", function(e){
      if(e.deltaY>0) onOut(e);
    }, {passive:false, capture:true});
  }
  wrap();
  wireCity();
  if(!window.L){
    var n=0, t=setInterval(function(){ wrap(); wireCity(); if(window.L||++n>80) clearInterval(t); }, 50);
  }
})();
