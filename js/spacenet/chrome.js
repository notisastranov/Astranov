/* SpaceNet 4097 — full-width header. Power and support sit under it. Login is YOU only. */
(function(){
  if(window.__snChrome) return;
  window.__snChrome=true;
  function place(){
    var isl=document.getElementById("island");
    var pwr=document.getElementById("sn-power");
    var sup=document.getElementById("sn-support");
    if(!isl) return;
    var r=isl.getBoundingClientRect();
    var y=Math.round(r.bottom+8);
    if(y<24) y=Math.round((window.visualViewport&&visualViewport.offsetTop||0)+8+44);
    function park(el, side){
      if(!el) return;
      if(el.classList.contains("loose")||el.classList.contains("drag")) return;
      el.style.top=y+"px";
      el.style.bottom="auto";
      if(side==="left"){
        el.style.left="max(8px, env(safe-area-inset-left))";
        el.style.right="auto";
      } else {
        el.style.right="max(8px, env(safe-area-inset-right))";
        el.style.left="auto";
      }
    }
    park(pwr,"left");
    park(sup,"right");
  }
  function hook(){
    if(window.SN&&SN.pack&&!SN.pack.__chrome){
      var orig=SN.pack;
      SN.pack=function(){
        orig.apply(this, arguments);
        place();
      };
      SN.pack.__chrome=true;
    }
    place();
  }
  if(document.readyState==="loading") document.addEventListener("DOMContentLoaded", hook);
  else hook();
  window.addEventListener("resize", place);
  setInterval(hook, 800);
})();
