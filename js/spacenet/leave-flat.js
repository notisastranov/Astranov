/* SpaceNet 4126 — pinch/zoom out of city returns to the globe. Never a repeating flat world. */
(function(){
  var city=null;
  function cityEl(){ return city||(city=document.getElementById("city")); }
  function hideCity(){
    var el=cityEl();
    if(!el) return;
    el.classList.remove("on");
    el.style.pointerEvents="none";
  }
  function leaveCity(map){
    try{
      if(!map || !map.getZoom) return;
      if(map.getZoom()<=9) hideCity();
    }catch(e){}
  }
  function bindMap(m){
    if(!m || m.__snLeaveBound) return m;
    m.__snLeaveBound=true;
    try{ if(m.setMinZoom) m.setMinZoom(8); }catch(e){}
    try{ if(m.setMaxBounds) m.setMaxBounds([[-85,-180],[85,180]]); }catch(e){}
    m.on("zoom zoomend", function(){ leaveCity(m); });
    return m;
  }
  function wrap(){
    if(!window.L || !L.map || L.map.__snLeave) return !!window.L;
    var orig=L.map.bind(L);
    function mapped(target, opts){
      opts=opts||{};
      if(opts.minZoom==null) opts.minZoom=8;
      opts.worldCopyJump=false;
      if(!opts.maxBounds) opts.maxBounds=[[-85,-180],[85,180]];
      return bindMap(orig(target, opts));
    }
    mapped.__snLeave=true;
    L.map=mapped;
    return true;
  }
  function onPinchOut(e){
    var el=cityEl();
    if(!el || !el.classList.contains("on")) return;
    if(e && e.deltaY>0){
      if(e.preventDefault){ e.preventDefault(); e.stopPropagation(); }
      hideCity();
    }
  }
  function wireCity(){
    var el=cityEl();
    if(!el || el.__snLeaveWired) return;
    el.__snLeaveWired=true;
    el.addEventListener("wheel", onPinchOut, {passive:false, capture:true});
    var dist0=0;
    el.addEventListener("touchstart", function(e){
      if(e.touches && e.touches.length===2){
        var a=e.touches[0], b=e.touches[1];
        dist0=Math.hypot(a.clientX-b.clientX, a.clientY-b.clientY);
      }
    }, {passive:true, capture:true});
    el.addEventListener("touchmove", function(e){
      if(!e.touches || e.touches.length!==2 || !dist0) return;
      var a=e.touches[0], b=e.touches[1];
      var d=Math.hypot(a.clientX-b.clientX, a.clientY-b.clientY);
      if(d < dist0-28){
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
  setInterval(wireCity, 1200);
})();
