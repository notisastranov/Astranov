(function(){
  if(window.__SN_FILL_4194) return;
  window.__SN_FILL_4194=true;
  var COLS="display:grid!important;grid-template-columns:52px minmax(88px,1.5fr) 56px minmax(88px,1fr) 44px 40px!important;column-gap:12px!important;align-items:center!important;width:100%!important;box-sizing:border-box!important";
  var SPAN="display:block!important;padding:0 8px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font:800 10px/1.2 system-ui;color:#7ee9ff";
  var lastShop=null;
  function shopKey(shop){
    if(!shop) return "";
    return String(shop.id||"")+"|"+String(shop.name||"").toLowerCase()+"|"+(+shop.lat||0).toFixed(4)+"|"+(+shop.lng||0).toFixed(4);
  }
  function css(){
    if(document.getElementById("sn-fill-4194-css")) return;
    var s=document.createElement("style");
    s.id="sn-fill-4194-css";
    s.textContent=
      "#sn-sheet .dish.sheet.head .cols,#sn-menu .dish.sheet.head .cols,#sn-live .dish.sheet.head .cols,"+
      "#sn-sheet .dish.order .cols,#sn-menu .dish.order .cols,#sn-live .dish.order .cols,"+
      ".sn-menu-grid .dish.sheet.head .cols,.sn-menu-grid .dish.order .cols{"+COLS+"}"+
      "#sn-sheet .dish.sheet.head .cols > span,#sn-menu .dish.sheet.head .cols > span,#sn-live .dish.sheet.head .cols > span,"+
      "#sn-sheet .dish.order.head .cols > span,#sn-menu .dish.order.head .cols > span,"+
      ".sn-menu-grid .dish.sheet.head .cols > span{"+SPAN+"}"+
      "#sn-sheet .card .dish.sheet.head .cols,#sn-menu .card .dish.sheet.head .cols{"+COLS+"}";
    document.head.appendChild(s);
  }
  function spaceHeads(){
    document.querySelectorAll(".dish.sheet.head .cols, .dish.head .cols, #sn-sheet .cols, #sn-live .cols, #sn-menu .cols, .sn-menu-grid .cols").forEach(function(cols){
      if(!cols) return;
      cols.setAttribute("style", COLS);
      var spans=cols.querySelectorAll(":scope > span");
      if(!spans.length){
        var raw=String(cols.textContent||"").replace(/\s+/g,"");
        if(/PhotoDescription/i.test(raw) || /Photo.*Description.*AV/i.test(raw)){
          cols.innerHTML=
            '<span style="'+SPAN+'">Photo</span><span style="'+SPAN+'">Description</span><span style="'+SPAN+'">AV€</span>'+
            '<span style="'+SPAN+'">Hours</span><span style="'+SPAN+'">Initial</span><span style="'+SPAN+'">Left</span>';
          return;
        }
      }
      Array.prototype.forEach.call(cols.children||[], function(ch){
        if(ch&&ch.tagName==="SPAN") ch.setAttribute("style", SPAN);
      });
    });
  }
  function clearSheetFor(shop){
    var host=document.querySelector("#sn-sheet.on .card")||document.querySelector("#sn-menu.on .card")||document.getElementById("sn-live");
    var live=document.getElementById("sn-live");
    [host, live].forEach(function(el){
      if(!el) return;
      el.querySelectorAll(".sn-menu-grid,.dish.sheet.order:not(.head),#sn-order-go,pre.menu").forEach(function(n){
        if(n && n.parentNode) n.parentNode.removeChild(n);
      });
      el.querySelectorAll(".dish.sheet.order").forEach(function(n){
        if(n.classList.contains("head")) return;
        if(n.parentNode) n.parentNode.removeChild(n);
      });
    });
    try{
      if(shop){
        var mine=shopKey(shop);
        if(shop.dishes && shop.__snFillKey && shop.__snFillKey!==mine){ shop.dishes=[]; shop.items=[]; shop.menu=""; }
        shop.__snFillKey=mine;
      }
    }catch(e){}
  }
  function holdPaint(){
    var holdUntil=Date.now()+2200;
    (function hold(){
      css(); spaceHeads();
      if(Date.now()<holdUntil) requestAnimationFrame(hold);
    })();
  }
  function onOpen(shop){
    if(!shop) return;
    lastShop=shop;
    css();
    clearSheetFor(shop);
    shop.__snFillKey=shopKey(shop);
    holdPaint();
    [40,120,300,700,1400,2400].forEach(function(ms){
      setTimeout(function(){ css(); spaceHeads(); }, ms);
    });
  }
  function wrapFn(name){
    if(!window.SN||!SN[name]) return false;
    if(SN[name].__fill4194ov) return true;
    var orig=SN[name].bind(SN);
    SN[name]=function(v){
      var r=orig(v);
      try{ onOpen(v); }catch(e){}
      return r;
    };
    SN[name].__fill4194ov=true;
    return true;
  }
  function wrap(){ wrapFn("selectVendor"); wrapFn("startOrder"); }
  function watch(){
    ["sn-live","sn-sheet","sn-menu"].forEach(function(id){
      var el=document.getElementById(id);
      if(!el||el.__snFill4194Obs) return;
      el.__snFill4194Obs=true;
      new MutationObserver(function(){ css(); spaceHeads(); }).observe(el,{childList:true,subtree:true,attributes:true,attributeFilter:["class"]});
    });
  }
  css(); wrap(); watch();
  setInterval(function(){ wrap(); watch(); css(); spaceHeads(); }, 900);
})();
