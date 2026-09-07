(shop){
    css();
    var host=hostEl();
    if(!host) return;
    var brand=brandFill(shop||lastShop);
    var phone=String((shop&&shop.phone)||(brand&&brand.phone)||(lastShop&&lastShop.phone)||"").trim();
    // CALL
    var call=document.getElementById("sn-call-4175");
    if(phone){
      if(!call){
        call=document.createElement("a");
        call.id="sn-call-4175";
        call.style.cssText="display:flex!important;align-items:center;justify-content:center;margin:8px 0 4px;height:40px;border-radius:12px;border:1px solid rgba(77,240,255,.7);background:rgba(4,16,28,.95);color:#4df0ff;font:800 12px system-ui;text-decoration:none";
      }
      call.textContent="CALL "+phone;
      call.href="tel:"+phone.replace(/[^\d+]/g,"");
      if(call.parentNode!==host) host.appendChild(call);
    }
    // Also rewrite any CALL SHOP labels in host
    if(phone){
      host.querySelectorAll("a,button").forEach(function(el){
        if(el.id==="sn-call-4175") return;
        var t=String(el.textContent||"").replace(/\s+/g," ").trim();
        if(/^CALL(\s+SHOP)?$/i.test(t)){
          el.textContent="CALL "+phone;
          if(el.tagName==="A") el.setAttribute("href","tel:"+phone.replace(/[^\d+]/g,""));
        }
      });
    }
    // NOW / PAY / RELOAD
    var bar=document.getElementById("sn-paypath-4175");
    if(!bar){
      bar=document.createElement("div");
      bar.id="sn-paypath-4175";
      bar.style.cssText="display:flex!important;flex-wrap:wrap;gap:8px;margin:10px 0 4px;padding:0 2px";
      bar.innerHTML=
        '<button type="button" data-act="now" style="flex:1;min-width:88px;height:40px;border-radius:12px;border:1px solid rgba(77,240,255,.7);background:rgba(4,16,28,.95);color:#4df0ff;font:800 12px system-ui">NOW</button>'+
        '<button type="button" data-act="pay" style="flex:1;min-width:88px;height:40px;border-radius:12px;border:1px solid rgba(77,240,255,.7);background:rgba(4,16,28,.95);color:#4df0ff;font:800 12px system-ui">PAY</button>'+
        '<button type="button" data-act="reload" style="flex:1;min-width:88px;height:40px;border-radius:12px;border:1px solid rgba(77,240,255,.7);background:rgba(4,16,28,.95);color:#7ee9ff;font:800 12px system-ui">RELOAD</button>';
    }
    if(bar.parentNode!==host) host.appendChild(bar);
    spaceHeads();
  }
  function headHtml(){
    return '<div class="dish sheet head order"><div class="cols" style="'+COLS+'">'+
      '<span style="'+SPAN+'">Photo</span><span style="'+SPAN+'">Description</span><span style="'+SPAN+'">AV€</span>'+
      '<span style="'+SPAN+'">Hours</span><span style="'+SPAN+'">Initial</span><span style="'+SPAN+'">Left</span></div></div>';
  }
  function rowHtml(it, hours){
    var n=String(it.name||"").replace(/"/g,"&quot;").replace(/</g,"&lt;");
    var hrs=String(it.hours||hours||"-").replace(/</g,"&lt;");
    return '<div class="dish sheet order" data-dish="'+n+'"><div class="cols" style="'+COLS+'">'+
      '<span class="pic">+</span><b>'+n+'</b><span class="px">AV€ '+(Number(it.price)||0).toFixed(2)+'</span>'+
      '<span class="hrs">'+hrs+'</span><span class="st">20</span><span class="st">20</span></div></div>';
  }
  function writeShop(shop, fill){
    if(!shop||!fill) return shop;
    try{
      var raw=localStorage.getItem("sn:shops");
      var list=raw?JSON.parse(raw):[];
      if(!Array.isArray(list)) list=[];
      var id=shop.id, hit=-1, i;
      for(i=0;i<list.length;i++){
        if(list[i]&&id&&list[i].id===id){ hit=i; break; }
        if(list[i]&&shop.name&&String(list[i].name).toLowerCase()===String(shop.name).toLowerCase() && Math.abs(+list[i].lat-+shop.lat)<0.05){ hit=i; break; }
      }
      var row=hit>=0?list[hit]:{id:shop.id||("s"+Date.now()),kind:"shop",name:shop.name,lat:+shop.lat,lng:+shop.lng,raw:shop.raw||"",peer:"spacenet",au