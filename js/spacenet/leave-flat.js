(function(){
  function leaveCity(map){
    try{
      if(!map || map.getZoom()>=6) return;
      var city=document.getElementById("city");
      if(!city || !city.classList.contains("on")) return;
      city.classList.remove("on");
      city.style.pointerEvents="none";
    }catch(e){}
  }
  function wrap(){
    if(!window.L || !L.map || L.map.__snLeave) return !!window.L;
    var orig=L.map.bind(L);
    function mapped(target, opts){
      opts=opts||{};
      if(opts.minZoom==null) opts.minZoom=5;
      if(opts.worldCopyJump==null) opts.worldCopyJump=false;
      var m=orig(target, opts);
      m.on("zoom zoomend", function(){ leaveCity(m); });
      var el=typeof target==="string"?document.getElementById(target):target;
      if(el){
        el.addEventListener("wheel", function(e){
          if(e.deltaY>0 && m.getZoom()<=6){
            e.preventDefault();
            e.stopPropagation();
            var city=document.getElementById("city");
            if(city){ city.classList.remove("on"); city.style.pointerEvents="none"; }
          }
        }, {passive:false, capture:true});
      }
      return m;
    }
    mapped.__snLeave=true;
    L.map=mapped;
    return true;
  }
  if(!wrap()){
    var n=0, t=setInterval(function(){ if(wrap()||++n>80) clearInterval(t); }, 50);
  }
})();
