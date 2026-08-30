/* SpaceNet power 4090 — boot steady red (off). Tap once: glow blue (offerings on). */
(function(){
  if(window.__snPowerFix) return;
  window.__snPowerFix=true;
  var s=document.createElement("style");
  s.textContent=
    "#sn-power,#sn-power.idle,#sn-power.off{animation:none!important;color:#ff3b4e;border-color:#e23a48;background:rgba(48,8,12,.9);box-shadow:none}"+
    "#sn-power.on{animation:powerglow 1.4s ease-in-out infinite!important;color:#4df0ff;border-color:#4df0ff;background:rgba(4,16,28,.94);box-shadow:0 0 18px rgba(77,240,255,.9)}";
  document.head.appendChild(s);
  function paintOff(){
    try{ localStorage.setItem("sn:power","off"); }catch(e){}
    var el=document.getElementById("sn-power");
    if(!el) return;
    el.classList.remove("on","idle");
    el.classList.add("off");
    el.setAttribute("aria-pressed","false");
    el.setAttribute("aria-label","Offerings off");
    if(window.SNWork&&SNWork.setOffer) SNWork.setOffer(false);
  }
  paintOff();
  var el=document.getElementById("sn-power");
  if(el){
    new MutationObserver(function(){
      if(el.classList.contains("idle")){
        el.classList.remove("idle");
        el.classList.add("off");
      }
      el.setAttribute("aria-label", el.classList.contains("on")?"Offerings on":"Offerings off");
    }).observe(el,{attributes:true,attributeFilter:["class"]});
  }
})();
