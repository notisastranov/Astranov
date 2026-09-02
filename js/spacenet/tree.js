/* SpaceNet 4137 — small nested 3-option menus. Map stays open. */
(function(){
  if(window.__snTree) return;
  window.__snTree=true;
  var at=null, page="root";
  var TREE={
    root:[
      {k:"post", t:"POST SOMETHING", s:"Message, vendor, driver"},
      {k:"call", t:"CALL SOMEBODY", s:"Voice, video, find"},
      {k:"upload", t:"UPLOAD", s:"Photo, file, cover"}
    ],
    post:[
      {k:"social", t:"SOCIAL POST", s:"A message on this pin"},
      {k:"vendor", t:"LIST VENDOR", s:"Shop, menu, prices"},
      {k:"driver", t:"LIST AS DRIVER", s:"Your delivery base"}
    ],
    call:[
      {k:"callhere", t:"CALL HERE", s:"Dial from this pin"},
      {k:"video", t:"VIDEO CALL", s:"If they are on SpaceNet"},
      {k:"find", t:"FIND SOMEONE", s:"Name, then call"}
    ],
    upload:[
      {k:"photo", t:"PHOTO", s:"Post a picture here"},
      {k:"file", t:"FILE", s:"Attach to a post"},
      {k:"cover", t:"COVER", s:"Shop or profile cover"}
    ]
  };
  function talk(t){ try{ if(window.SN&&SN.talk) SN.talk(t); }catch(e){} }
  function css(){
    if(document.getElementById("sn-tree-css")) return;
    var s=document.createElement("style");
    s.id="sn-tree-css";
    s.textContent=
      "#sn-tree{position:fixed;z-index:140;display:none;pointer-events:none}"+
      "#sn-tree.on{display:block;pointer-events:auto}"+
      "#sn-tree .card{position:relative;width:min(232px,72vw);max-height:36vh;overflow:auto;padding:8px;background:rgba(4,14,28,.94);border:1px solid rgba(126,233,255,.55);border-radius:14px;box-shadow:0 10px 28px rgba(0,0,0,.45)}"+
      "#sn-tree .ttl{display:flex;align-items:center;gap:6px;margin:0 0 6px}"+
      "#sn-tree .ttl b{flex:1;font:800 10px/1 system-ui;letter-spacing:.16em;color:#7ee9ff}"+
      "#sn-tree .ttl button{width:32px;height:32px;border-radius:9px;border:1px solid rgba(126,233,255,.35);background:rgba(4,16,28,.9);color:#e8fbff;font:700 14px system-ui}"+
      "#sn-tree .opt{display:block;width:100%;text-align:left;margin:0 0 5px;padding:8px 10px;min-height:44px;border:1px solid rgba(126,233,255,.32);background:rgba(6,20,34,.92);color:#e8fbff;border-radius:11px}"+
      "#sn-tree .opt b{display:block;font:800 11px/1.2 system-ui;letter-spacing:.08em;color:#f4fdff}"+
      "#sn-tree .opt span{display:block;margin-top:3px;font:500 11px/1.25 system-ui;color:#8ec8d8}"+
      "#sn-sheet .bg,#sn-labor .bg,#sn-plus-pick .bg,#sn-cash .bg,#sn-tasks .bg,#sn-menu .bg,#sn-cart .bg{background:transparent!important;pointer-events:none!important}"+
      "#sn-sheet .card{left:8px!important;right:auto!important;bottom:calc(env(safe-area-inset-bottom) + 72px)!important;width:min(280px,76vw)!important;max-height:38vh!important;border-radius:16px!important;border:1px solid rgba(126,233,255,.5)!important}"+
      "#sn-labor .card{left:8px!important;right:auto!important;top:auto!important;bottom:calc(env(safe-area-inset-bottom) + 72px)!important;transform:none!important;width:min(280px,76vw)!important;max-height:38vh!important}"+
      "#sn-plus-pick{pointer-events:none!important}"+
      "#sn-plus-pick.on{display:none!important}"+
      "#sn-cash .card,#sn-tasks .card,#sn-menu .card,#sn-cart .card{max-height:40vh!important;width:min(300px,78vw)!important}";
    document.head.appendChild(s);
  }
  function pin(){
    if(at&&isFinite(Number(at.lat))) return at;
    try{
      var m=window.SN&&SN.getMap&&SN.getMap();
      if(m&&m.getCenter){ var c=m.getCenter(); if(c&&isFinite(c.lat)) return {lat:c.lat,lng:c.lng,name:"This place"}; }
    }catch(e){}
    try{
      var p=JSON.parse(localStorage.getItem("sn:place")||"null");
      if(p&&isFinite(Number(p.lat))) return p;
    }catch(e){}
    return null;
  }
  function place(){
    var p=pin();
    if(p) return p;
    talk("Set your place first. GPS or tap the map.");
    try{ if(window.SN&&SN.correctHere) SN.correctHere(); }catch(e){}
    return null;
  }
  function fit(el, screen){
    var W=innerWidth||360, H=innerHeight||640;
    var maxW=Math.min(232, Math.round(W*0.72));
    var maxH=Math.min(220, Math.round(H*0.36));
    var card=el.querySelector(".card");
    if(card){ card.style.width=maxW+"px"; card.style.maxHeight=maxH+"px"; }
    var dock=document.getElementById("dock");
    var dr=dock&&dock.getBoundingClientRect();
    var bottom=(dr?Math.max(8, H-dr.top+8):78);
    var left=10, top=null;
    if(screen&&isFinite(screen.x)){
      left=Math.max(8, Math.min(W-maxW-8, screen.x-maxW/2));
      var y=screen.y+16;
      if(y+maxH>H-bottom-8) y=Math.max(8, screen.y-maxH-12);
      top=y;
    }
    el.style.width=maxW+"px";
    if(top!=null){ el.style.left=left+"px"; el.style.top=top+"px"; el.style.bottom="auto"; }
    else { el.style.left="10px"; el.style.top="auto"; el.style.bottom=bottom+"px"; }
  }
  function work(which){
    var p=place();
    if(!p) return;
    try{ if(window.SNWork&&SNWork.open) SNWork.open(p, which); }catch(e){ talk("That step failed."); }
  }
  function go(k){
    if(k==="post"||k==="call"||k==="upload"){ show(k); return; }
    hide();
    if(k==="social") work("post");
    else if(k==="vendor") work("shop");
    else if(k==="driver") work("driver");
    else if(k==="callhere") work("call");
    else if(k==="video") work("call");
    else if(k==="find"){ work("call"); talk("Type a name in the field."); }
    else if(k==="photo"||k==="file"){ work("post"); talk("Add the photo or file in the post."); }
    else if(k==="cover"){ work("shop"); talk("Add the cover on the vendor."); }
    else if(k==="labor"){ try{ if(window.SNLabor&&SNLabor.open) SNLabor.open(); }catch(e){} }
  }
  function html(){
    var rows=TREE[page]||TREE.root;
    var ttl=page==="root"?"DO":page.toUpperCase();
    return '<div class="card"><div class="ttl">'+(page!=="root"?'<button type="button" data-k="back">‹</button>':'')+'<b>'+ttl+"</b>"+'<button type="button" data-k="x">✕</button></div>'+
      rows.map(function(r){ return '<button type="button" class="opt" data-k="'+r.k+'"><b>'+r.t+"</b><span>"+r.s+"</span></button>"; }).join("")+
      "</div>";
  }
  function box(){
    var el=document.getElementById("sn-tree");
    if(el) return el;
    el=document.createElement("div");
    el.id="sn-tree";
    document.body.appendChild(el);
    el.addEventListener("click", function(e){
      var b=e.target.closest&&e.target.closest("[data-k]");
      var k=b&&b.getAttribute("data-k");
      if(!k) return;
      e.preventDefault(); e.stopPropagation();
      if(k==="x"){ hide(); return; }
      if(k==="back"){ show("root"); return; }
      go(k);
    });
    return el;
  }
  function show(which, screen){
    css();
    page=TREE[which]?which:"root";
    var el=box();
    el.innerHTML=html();
    el.classList.add("on");
    fit(el, screen);
  }
  function hide(){
    var el=document.getElementById("sn-tree");
    if(el) el.classList.remove("on");
  }
  function open(which, place, screen){
    at=place||at||null;
    show(which||"root", screen);
  }
  function bindPlus(){
    var plus=document.getElementById("plus");
    if(!plus||plus.__snTree) return;
    plus.__snTree=true;
    plus.addEventListener("click", function(e){
      e.preventDefault();
      e.stopPropagation();
      if(e.stopImmediatePropagation) e.stopImmediatePropagation();
      if(plus.dataset.skipClick==="1"){ plus.dataset.skipClick=""; return; }
      var r=plus.getBoundingClientRect();
      open("root", pin(), {x:r.left+r.width/2, y:r.top});
    }, true);
  }
  function wrapWork(){
    if(!window.SNWork||!SNWork.open||SNWork.open.__tree) return;
    var orig=SNWork.open;
    SNWork.open=function(place, which){
      if(!which || which==="home" || which==="list"){
        open("root", place);
        return;
      }
      orig.apply(this, arguments);
    };
    SNWork.open.__tree=true;
  }
  function hook(){ css(); bindPlus(); wrapWork(); }
  window.SNTree={open:open, hide:hide};
  if(document.readyState==="loading") document.addEventListener("DOMContentLoaded", hook);
  else hook();
  setInterval(hook, 1200);
  window.addEventListener("resize", function(){ var el=document.getElementById("sn-tree"); if(el&&el.classList.contains("on")) fit(el); });
})();
