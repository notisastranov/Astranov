/* SpaceNet 4116 — readable task offer; no GROK in the header. */
(function(){
  if(window.__snOfferRead) return;
  window.__snOfferRead=true;
  function css(){
    var s=document.getElementById("sn-offer-read-css");
    if(s) s.remove();
    s=document.createElement("style");
    s.id="sn-offer-read-css";
    s.textContent=
      "#island .k{display:none!important}"+
      "#sn-tasks .card{max-height:min(72vh,calc(100vh - 118px))!important;overflow:auto!important;-webkit-overflow-scrolling:touch}"+
      "#sn-tasks .ttl{font:800 13px/1.2 system-ui!important;letter-spacing:.12em}"+
      "#sn-tasks .task{padding:12px!important;overflow:hidden}"+
      "#sn-tasks .task b{font:650 16px/1.3 system-ui!important}"+
      "#sn-tasks .task span{font:500 13px/1.4 system-ui!important;color:#8ec8d8}"+
      "#sn-tasks .who,#sn-tasks .pct{font:600 13px/1.4 system-ui!important;margin-top:6px}"+
      "#sn-tasks .ladder{gap:6px!important;margin-top:8px}"+
      "#sn-tasks .ladder i{font:800 10px/1.2 system-ui!important;padding:6px 8px!important}"+
      "#sn-tasks .cash-glow{display:block;max-width:100%;margin:0 0 8px!important;padding:6px 8px;font:800 18px/1.2 system-ui!important;letter-spacing:.03em;color:#7ee9ff;text-shadow:0 0 6px rgba(61,107,255,.7)!important;animation:none!important;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;box-sizing:border-box;position:relative;z-index:1}"+
      ".sn-arc-cash{font:800 13px/1.1 system-ui!important;text-shadow:0 0 6px #3d6bff!important}"+
      "#sn-throw .drip{width:92px!important;height:92px!important;top:max(54px,env(safe-area-inset-top) + 42px)!important}"+
      "#sn-throw .pay{font:800 15px/1.15 ui-monospace,system-ui!important;text-shadow:0 0 6px #4df0ff!important}"+
      "#sn-throw .pay small{font:800 9px/1 system-ui!important;margin-bottom:3px!important}"+
      "#sn-throw .strip{width:min(94vw,360px)!important;max-height:44vh!important;overflow:auto!important;-webkit-overflow-scrolling:touch;font:600 13px/1.45 system-ui!important;padding:10px!important;z-index:5!important}"+
      "#sn-throw .strip .line{font:600 13px/1.45 system-ui!important;padding:3px 0!important}"+
      "#sn-throw .who .nm{font:800 11px/1.25 system-ui!important;width:auto!important;max-width:72px}"+
      "#sn-throw .acts button{height:42px!important;font:800 12px/1 system-ui!important}";
    document.head.appendChild(s);
  }
  function stripGrok(){
    var k=document.querySelector("#island b.k");
    if(k) k.parentNode.removeChild(k);
    if(/Grok/i.test(document.title||"")) document.title="Astranov SpaceNet";
    var inn=document.getElementById("in");
    if(inn && /Grok/i.test(inn.placeholder||"")) inn.placeholder="Talk to Astranov SpaceNet";
  }
  function boot(){ css(); stripGrok(); }
  if(document.readyState==="loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
  setInterval(boot, 1200);
})();
