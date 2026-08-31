/* SpaceNet 4097 — full-width header. Power and support sit under it. Login is YOU only. */
(function(){
  if(window.__snChrome) return;
  window.__snChrome=true;
  function fmtFull(n){
    n=Number(n)||0;
    return "AV€ "+n.toLocaleString("en-GB",{minimumFractionDigits:2,maximumFractionDigits:2});
  }
  function fmtCompact(n){
    n=Number(n)||0;
    if(n>=1000000) return "AV€ "+(n/1000000).toFixed(n%1000000?2:0)+"M";
    return "AV€ "+n.toLocaleString("en-GB",{minimumFractionDigits:n>=1000?0:2,maximumFractionDigits:2});
  }
  function fitMoney(){
    var btn=document.getElementById("sn-money");
    var isl=document.getElementById("island");
    if(!btn||!isl) return;
    if(btn.classList.contains("loose")||btn.classList.contains("drag")) return;
    if(window.SNWallet&&SNWallet.fmt){ btn.textContent=SNWallet.fmt(Number(localStorage.getItem("sn:avc")||0)); return; }
    var n=0; try{ n=Number(localStorage.getItem("sn:avc")||0);}catch(e){}
    btn.style.flex="1 1 auto";
    btn.style.justifyContent="center";
    btn.style.textAlign="center";
    btn.style.whiteSpace="nowrap";
    btn.style.overflow="visible";
    btn.style.font="800 13px/1 system-ui";
    btn.textContent=fmtFull(n);
  }
  function hookMoney(){
    if(window.SN&&SN.paintMoney&&!SN.paintMoney.__fit){
      var orig=SN.paintMoney;
      SN.paintMoney=function(){
        orig.apply(this, arguments);
        fitMoney();
      };
      SN.paintMoney.__fit=true;
    }
    fitMoney();
  }
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
    fitMoney();
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
    hookMoney();
  }
  if(document.readyState==="loading") document.addEventListener("DOMContentLoaded", hook);
  else hook();
  window.addEventListener("resize", place);
  setInterval(hook, 800);
  setInterval(fitMoney, 1200);
})();
