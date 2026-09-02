/* SpaceNet 4135 — power is red off or neon-blue on. Nothing else. */
(function(){
  if(window.__snPowerFix) return;
  window.__snPowerFix=true;
  var s=document.createElement("style");
  s.id="sn-power-css";
  s.textContent=
    "#sn-power,#sn-power.off,#sn-power.idle{animation:none!important;color:#ff3b4e!important;border-color:#e23a48!important;background:rgba(48,8,12,.95)!important;box-shadow:none!important}"+
    "#sn-power.on{animation:powerglow 1.4s ease-in-out infinite!important;color:#4df0ff!important;border-color:#4df0ff!important;background:rgba(4,16,28,.94)!important;box-shadow:0 0 18px rgba(77,240,255,.95)!important}";
  document.head.appendChild(s);
  function paint(){
    var el=document.getElementById("sn-power");
    if(!el) return;
    var on=false;
    try{ on=localStorage.getItem("sn:power")==="on"; }catch(e){}
    el.classList.remove("idle");
    el.classList.toggle("on", on);
    el.classList.toggle("off", !on);
    el.setAttribute("aria-pressed", on?"true":"false");
    el.setAttribute("aria-label", on?"Offerings on":"Offerings off");
  }
  try{ if(localStorage.getItem("sn:power")!=="on") localStorage.setItem("sn:power","off"); }catch(e){}
  paint();
  var el=document.getElementById("sn-power");
  if(el){
    new MutationObserver(function(){
      if(el.classList.contains("idle")){ el.classList.remove("idle"); el.classList.add("off"); }
      if(el.classList.contains("on") && el.classList.contains("off")) el.classList.remove("off");
    }).observe(el,{attributes:true,attributeFilter:["class"]});
  }
  setTimeout(paint, 0);
  setTimeout(paint, 400);
})();
