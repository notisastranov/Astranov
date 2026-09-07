/* SpaceNet 4199 — fix app.js head (spans, no .cols) + honest empty + keep chrome */
(function(){
  if(window.__SN_FILL_4199) return;
  window.__SN_FILL_4199=true;
  var COLS="display:grid!important;grid-template-columns:52px minmax(88px,1.5fr) 56px minmax(88px,1fr) 44px 40px!important;column-gap:12px!important;row-gap:0!important;align-items:center!important;width:100%!important;box-sizing:border-box!important";
  var SPAN="display:block!important;padding:0 8px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font:800 10px/1.2 system-ui;color:#7ee9ff;min-width:0";
  var HEAD_HTML='<span style="'+SPAN+'">Photo</span><span style="'+SPAN+'">Description</span><span style="'+SPAN+'">AV€</span><span style="'+SPAN+'">Hours</span><span style="'+SPAN+'">Initial</span><span style="'+SPAN+'">Left</span>';
  var lastShop=null;

  function shopKey(shop){
    if(!shop) return "";
    return String(shop.id||"")+"|"+String(shop.name||"").toLowerCase()+"|"+(+shop.lat||0).toFixed(4)+"|"+(+shop.lng||0).toFixed(4);
  }
  function css(){
    if(document.getElementById("sn-fill-4199-css")) return;
    var s=document.createElement("style");
    s.id="sn-fill-4199-css";
    s.textContent=
      "#sn-live > .dish.sheet.head,#sn-sheet .dish.sheet.head,#sn-menu .dish.sheet.head,"+
      "#sn-live .dish.sheet.head,#sn-sheet .card .dish.sheet.head{"+COLS+"}"+ 
      "#sn-live > .dish.sheet.head > span,#sn-sheet .dish.sheet.head > span,#sn-menu .dish.sheet.head > span,"+
      "#sn-live .dish.sheet.head > span{"+SPAN+"}"+ 
      "#sn-sheet .dish.sheet.head .cols,#sn-menu .dish.sheet.head .cols,#sn-live .dish.sheet.head .cols,"+
      "#sn-sheet .dish.order .cols,#sn-menu .dish.order .cols,#sn-live .dish.order .cols,"+
      ".sn-menu-grid .dish.sheet.head .cols,.sn-menu-grid .dish.order .cols{"+COLS+"}"+ 
      "#sn-sheet .dish.sheet.head .cols > span,#sn-menu .dish.sheet.head .cols > span,#sn-live .dish.sheet.head .cols > span,"+
      ".sn-menu-grid .dish.sheet.head .cols > span{"+SPAN+"}"+ 
      "#sn-paypath-4199,#sn-call-4199{display:flex!important}";
    document.head.appendChild(s);
  }
  function styleHeadEl(head){
    if(!head) return;
    head.setAttribute("style", COLS);
    var cols=head.querySelector(":scope > .cols");
    if(cols){
      cols.setAttribute("style", COLS);
      Array.prototype.forEach.call(cols.children||[], function(ch){
        if(ch&&ch.tagName==="SPAN") ch.setAttribute("style", SPAN);
      });
      return;
    }
    var spans=head.querySelectorAll(":scope > span");
    if(spans.length>=4){
      Array.prototype.forEach.call(spans, function(ch){ ch.setAttribute("style", SPAN); });
      return;
    }
    var raw=String(head.textContent||"").replace(/\s+/g,"");
    if(/PhotoDescription/i.test(raw) || /Photo.*AV/i.test(raw) || spans.length){
      head.innerHTML=HEAD_HTML;
      head.setAttribute("style", COLS);
      head.className="dish sheet head";
    }
  }
  function spaceHeads(){
    document.querySelectorAll(".dish.sheet.head, .dish.head").forEach(styleHeadEl);
    document.querySelectorAll(".dish.sheet.head .cols, .sn-menu-grid .cols, #sn-live .cols, #sn-sheet .cols").forEach(function(cols){
      if(!cols) return;
      cols.setAttribute("style", COLS);
      var spans=cols.querySelectorAll(":scope > span");
      if(!spans.length){
        var raw=String(cols.textContent||"").replace(/\s+/g,"");
        if(/PhotoDescription/i.test(raw)){
          cols.innerHTML=HEAD_HTML;
        }
      }else{
        Array.prototype.forEach.call(spans, function(ch){ ch.setAttribute("style", SPAN); });
      }
    });
  }
  function hostEl(){
    return document.querySelector("#sn-sheet.on .card")
      || document.querySelector("#sn-menu.on .card")
      || document.getElementById("sn-live");
  }
  function ensureHonestEmpty(){
    var live=document.getElementById("sn-live");
    var host=hostEl();
    var roots=[live, host].filter(Boolean);
    roots.forEach(function(root){
      var dishes=root.querySelectorAll(".dish.sheet:not(.head), .dish.sheet.order:not(.head), button.dish.sheet");
      var note=root.querySelector("p.note, .sn-honest-empty");
      var head=root.querySelector(".dish.sheet.head");
      if(!head){
        var h=document.createElement("div");
        h.className="dish sheet head";
        h.setAttribute("style", COLS);
        h.innerHTML=HEAD_HTML;
        root.insertBefore(h, root.firstChild);
        head=h;
      }else{
        styleHeadEl(head);
      }
      if(!dishes.length){
        if(!note){
          note=document.createElement("p");
          note.className="note sn-honest-empty";
          note.style.cssText="margin:10px 4px;font:600 12px/1.4 system-ui;color:#7ee9ff";
          note.textContent="No public menu listed yet for this shop.";
          if(head.nextSibling) root.insertBefore(note, head.nextSibling);
          else root.appendChild(note);
        }
      }else if(note && note.classList.contains("sn-honest-empty")){
        note.parentNode&&note.parentNode.removeChild(note);
      }
    });
  }
  function scrubCallShop(host, phone){
    if(!host) return;
    host.querySelectorAll("a,button").forEach(function(el){
      if(el.id==="sn-call-4199"||el.id==="sn-call-4188"||el.id==="sn-call-4175") return;
      var t=String(el.textContent||"").replace(/\s+/g," ").trim();
      if(/^CALL(\s+SHOP)?$/i.test(t)){
        if(phone){
          el.textContent="CALL "+phone;
          if(el.tagName==="A") el.setAttribute("href","tel:"+String(phone).replace(/[^\d+]/g,""));
        }else if(el.parentNode) el.parentNode.removeChild(el);
      }
    });
  }
  function shopPhone(shop){
    var p=String((shop&&(shop.phone||(shop.tags&&shop.tags.phone)))||"").trim();
    if(/^CALL(\s+SHOP)?$/i.test(p) || !p || !/\d/.test(p)) return "";
    return p;
  }
  function mountChrome(shop){
    css();
    var host=hostEl();
    if(!host) return;
    var phone=shopPhone(shop||lastShop);
    var call=document.getElementById("sn-call-4199");
    ["sn-call-4175","sn-call-4173","sn-call-4188","sn-call-4189"].forEach(function(id){
      var old=document.getElementById(id); if(old&&old.parentNode) old.parentNode.removeChild(old);
    });
    if(phone){
      if(!call){
        call=document.createElement("a");
        call.id="sn-call-4199";
        call.style.cssText="display:flex!important;align-items:center;justify-content:center;margin:8px 0 4px;height:40px;border-radius:12px;border:1px solid rgba(77,240,255,.7);background:rgba(4,16,28,.95);color:#4df0ff;font:800 12px system-ui;text-decoration:none";
      }
      call.textContent="CALL "+phone;
      call.href="tel:"+phone.replace(/[^\d+]/g,"");
      if(call.parentNode!==host) host.appendChild(call);
    }else if(call&&call.parentNode) call.parentNode.removeChild(call);
    scrubCallShop(host, phone);
    var bar=document.getElementById("sn-paypath-4199")||document.getElementById("sn-paypath-4188")||document.getElementById("sn-paypath-4175");
    if(!bar){
      bar=document.createElement("div");
      bar.id="sn-paypath-4199";
      bar.style.cssText="display:flex!important;flex-wrap:wrap;gap:8px;margin:10px 0 4px;padding:0 2px";
      bar.innerHTML=
        '<button type="button" data-act="now" style="flex:1;min-width:88px;height:40px;border-radius:12px;border:1px solid rgba(77,240,255,.7);background:rgba(4,16,28,.95);color:#4df0ff;font:800 12px system-ui">NOW</button>'+
        '<button type="button" data-act="pay" style="flex:1;min-width:88px;height:40px;border-radius:12px;border:1px solid rgba(77,240,255,.7);background:rgba(4,16,28,.95);color:#4df0ff;font:800 12px system-ui">PAY</button>'+
        '<button type="button" data-act="reload" style="flex:1;min-width:88px;height:40px;border-radius:12px;border:1px solid rgba(77,240,255,.7);background:rgba(4,16,28,.95);color:#7ee9ff;font:800 12px system-ui">RELOAD</button>';
    }else bar.id="sn-paypath-4199";
    if(bar.parentNode!==host) host.appendChild(bar);
    spaceHeads();
    ensureHonestEmpty();
  }
  function holdPaint(){
    var until=Date.now()+2800;
    (function tick(){
      css(); spaceHeads(); ensureHonestEmpty();
      if(lastShop) mountChrome(lastShop);
      if(Date.now()<until) requestAnimationFrame(tick);
    })();
  }
  function onOpen(shop){
    if(!shop) return;
    try{
      var k=shopKey(shop);
      if(lastShop && shopKey(lastShop)!==k){
        if(shop.dishes && shop.__snFillKey && shop.__snFillKey!==k){ shop.dishes=[]; shop.items=[]; }
      }
      shop.__snFillKey=k;
    }catch(e){}
    lastShop=shop;
    css();
    spaceHeads();
    ensureHonestEmpty();
    mountChrome(shop);
    holdPaint();
    [0,16,32,48,80,120,200,400,800,1600,2400].forEach(function(ms){
      setTimeout(function(){
        css(); spaceHeads(); ensureHonestEmpty(); mountChrome(shop);
      }, ms);
    });
  }
  function wrapFn(name){
    if(!window.SN||!SN[name]) return false;
    if(SN[name].__fill4199) return true;
    var orig=SN[name].bind(SN);
    SN[name]=function(v){
      var r=orig(v);
      try{ onOpen(v); }catch(e){}
      return r;
    };
    SN[name].__fill4199=true;
    return true;
  }
  function wrap(){ wrapFn("selectVendor"); wrapFn("startOrder"); }
  function watch(){
    ["sn-live","sn-sheet","sn-menu"].forEach(function(id){
      var el=document.getElementById(id);
      if(!el||el.__snFill4199Obs) return;
      el.__snFill4199Obs=true;
      new MutationObserver(function(){
        css(); spaceHeads(); ensureHonestEmpty();
        if(lastShop) mountChrome(lastShop);
      }).observe(el,{childList:true,subtree:true,attributes:true,attributeFilter:["class","style"]});
    });
  }
  css(); wrap(); watch();
  setInterval(function(){ wrap(); watch(); css(); spaceHeads(); ensureHonestEmpty(); if(lastShop) mountChrome(lastShop); }, 700);
})();
