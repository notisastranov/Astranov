/* SpaceNet 4098 — buttons speak: bounce + glow. Blue medium, green good, yellow bad, red critical. */
(function(){
  if(window.__snPulse) return;
  window.__snPulse=true;
  var css=document.createElement("style");
  css.textContent=
    "@keyframes snbounce{0%,100%{transform:translateY(0) scale(1)}50%{transform:translateY(-5px) scale(1.07)}}"+
    ".pulse-blue,.pulse-green,.pulse-yellow,.pulse-red{animation:snbounce 1.05s ease-in-out infinite}"+
    ".pulse-blue .tgt,.pulse-blue.tgt,#gps.pulse-blue .tgt,#sn-power.pulse-blue,#sn-support.pulse-blue,#sn-money.pulse-blue,#sn-tasks-btn.pulse-blue,#sn-pill.pulse-blue{border-color:#4df0ff!important;box-shadow:0 0 10px #4df0ff,0 0 24px rgba(61,107,255,.9)!important}"+
    ".pulse-green .tgt,#gps.pulse-green .tgt,#sn-power.pulse-green,#sn-support.pulse-green,#sn-money.pulse-green,#sn-tasks-btn.pulse-green,#sn-pill.pulse-green{border-color:#3dff8a!important;box-shadow:0 0 10px #3dff8a,0 0 24px rgba(61,255,138,.9)!important;color:#3dff8a}"+
    ".pulse-yellow .tgt,#gps.pulse-yellow .tgt,#sn-power.pulse-yellow,#sn-support.pulse-yellow,#sn-money.pulse-yellow,#sn-tasks-btn.pulse-yellow,#sn-pill.pulse-yellow{border-color:#ffd85a!important;box-shadow:0 0 10px #ffd85a,0 0 24px rgba(255,216,90,.95)!important;color:#ffd85a}"+
    ".pulse-red .tgt,#gps.pulse-red .tgt,#sn-power.pulse-red,#sn-support.pulse-red,#sn-money.pulse-red,#sn-tasks-btn.pulse-red,#sn-pill.pulse-red{border-color:#ff3b4e!important;box-shadow:0 0 12px #ff3b4e,0 0 28px rgba(255,59,78,.95)!important;color:#ff3b4e}"+
    "#sn-me.out.pulse-blue .lbl{color:#4df0ff;text-shadow:0 0 8px #4df0ff}"+
    "#sn-me .lbl{font:800 10px/1 system-ui}";
  document.head.appendChild(css);
  var COLORS=["blue","green","yellow","red"];
  function clear(el){
    if(!el) return;
    COLORS.forEach(function(c){ el.classList.remove("pulse-"+c); });
  }
  function set(el, color){
    if(!el) return;
    var cur=COLORS.filter(function(c){ return el.classList.contains("pulse-"+c); })[0];
    if(cur===color) return;
    clear(el);
    if(color && COLORS.indexOf(color)>=0) el.classList.add("pulse-"+color);
  }
  function logged(){
    try{
      var u=window.SNAuth&&SNAuth.user&&SNAuth.user();
      return !!(u&&u.email);
    }catch(e){ return false; }
  }
  function note(){
    try{ return localStorage.getItem("sn:pulse")||""; }catch(e){ return ""; }
  }
  function tick(){
    var me=document.getElementById("sn-me");
    var gps=document.getElementById("gps");
    var pwr=document.getElementById("sn-power");
    var sup=document.getElementById("sn-support");
    var money=document.getElementById("sn-money");
    var tasks=document.getElementById("sn-tasks-btn");
    var vend=document.getElementById("sn-pill");
    var fix=document.getElementById("sn-fix");
    var n=note();
    if(me){
      if(!logged()) set(me,"blue");
      else if(n==="red") set(me,"red");
      else if(n==="yellow" || (fix&&fix.classList.contains("on"))) set(me,"yellow");
      else if(n==="green") set(me,"green");
      else clear(me);
    }
    if(gps){
      if(fix&&fix.classList.contains("on")) set(gps,"yellow");
      else if(gps.classList.contains("on")) set(gps,"green");
      else if(document.getElementById("city")&&document.getElementById("city").classList.contains("on")) set(gps,"blue");
      else clear(gps);
    }
    if(pwr){
      if(pwr.classList.contains("off")) clear(pwr);
      else if(pwr.classList.contains("on")) set(pwr,"green");
      else set(pwr,"blue");
    }
    if(sup){
      var paid=false;
      try{ paid=localStorage.getItem("sn:paypal-paid")==="1"; }catch(e){}
      if(logged()&&paid) set(sup,"blue");
      else clear(sup);
    }
    if(money){
      if(n==="green") set(money,"green");
      else if(n==="red") set(money,"red");
      else clear(money);
    }
    if(tasks){
      var list=document.getElementById("sn-tasks-list");
      var nOpen=list?list.children.length:0;
      if(tasks.classList.contains("on")||nOpen>0) set(tasks, nOpen>3?"yellow":"blue");
      else clear(tasks);
    }
    if(vend){
      if(vend.classList.contains("on")||vend.classList.contains("glow")) set(vend,"green");
      else clear(vend);
    }
  }
  function notify(color, msg){
    if(COLORS.indexOf(color)<0) color="blue";
    try{ localStorage.setItem("sn:pulse", color); }catch(e){}
    if(msg && window.SN&&SN.talk) SN.talk(msg);
    tick();
    if(color==="green") setTimeout(function(){ try{ if(localStorage.getItem("sn:pulse")==="green") localStorage.removeItem("sn:pulse"); }catch(e){} tick(); }, 8000);
  }
  window.SNPulse={set:set,clear:clear,notify:notify,tick:tick};
  if(document.readyState==="loading") document.addEventListener("DOMContentLoaded", tick);
  else tick();
  setInterval(tick, 900);
})();
