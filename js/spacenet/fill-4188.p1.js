          if(el.parentNode) el.parentNode.removeChild(el);
        }
      }
    });
  }
  function mountChrome(shop){
    css();
    var host=hostEl();
    if(!host) return;
    var fill=brandFill(shop||lastShop)||localFill(shop||lastShop)||{};
    var phone=shopPhone(shop||lastShop)||String(fill.phone||"").trim();
    if(phone && !/\d/.test(phone)) phone="";

    var call=document.getElementById("sn-call-4188");
    var old=document.getElementById("sn-call-4175")||document.getElementById("sn-call-4173");
    if(old && old.parentNode) old.parentNode.removeChild(old);

    if(phone){
      if(!call){
        call=document.createElement("a");
        call.id="sn-call-4188";
        call.style.cssText="display:flex!important;align-items:center;justify-content:center;margin:8px 0 4px;height:40px;border-radius:12px;border:1px solid rgba(77,240,255,.7);background:rgba(4,16,28,.95);color:#4df0ff;font:800 12px system-ui;text-decoration:none";
      }
      call.textContent="CALL "+phone;
      call.href="tel:"+phone.replace(/[^\d+]/g,"");
      if(call.parentNode!==host) host.appendChild(call);
    }else if(call && call.parentNode){
      call.parentNode.removeChild(call);
    }
    scrubCallShop(host, phone);

    var bar=document.getElementById("sn-paypath-4188")||document.getElementById("sn-paypath-4175")||document.getElementById("sn-paypath-4165");
    if(!bar){
      bar=document.createElement("div");
      bar.id="sn-paypath-4188";
      bar.style.cssText="display:flex!important;flex-wrap:wrap;gap:8px;margin:10px 0 4px;padding:0 2px";
      bar.innerHTML=
        '<button type="button" data-act="now" style="flex:1;min-width:88px;height:40px;border-radius:12px;border:1px solid rgba(77,240,255,.7);background:rgba(4,16,28,.95);color:#4df0ff;font:800 12px system-ui">NOW</button>'+
        '<button type="button" data-act="pay" style="flex:1;min-width:88px;height:40px;border-radius:12px;border:1px solid rgba(77,240,255,.7);background:rgba(4,16,28,.95);color:#4df0ff;font:800 12px system-ui">PAY</button>'+
        '<button type="button" data-act="reload" style="flex:1;min-width:88px;height:40px;border-radius:12px;border:1px solid rgba(77,240,255,.7);background:rgba(4,16,28,.95);color:#7ee9ff;font:800 12px system-ui">RELOAD</button>';
    }else{
      bar.id="sn-paypath-4188";
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
  function emptyHtml(){
    return '<p class="note" style="margin:10px 4px;font:600 12px/1.4 system-ui;color:#7ee9ff">No public menu listed yet for this shop.</p>';
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
      var row=hit>=0?list[hit]:{id:shop.id||("s"+Date.now()),kind:"shop",name:shop.name,lat:+shop.lat,lng:+shop.lng,raw:shop.raw||"",peer:"spacenet",auto:1,t:Date.now()};
      if(fill.phone) row.phone=fill.phone;
      if(fill.hours) row.hours=fill.hours;
      if(fill.dishes&&fill.dishes.length){
        row.dishes=fill.dishes; row.items=fill.dishes;
        row.menu=fill.dishes.map(function(d){ return d.name+" — "+d.price; }).join("\n");
      }
      row.sample=false;
      if(hit>=0) list[hit]=row; else list.unshift(row);
      localStorage.setItem("sn:shops", JSON.stringify(list));
      if(fill.phone) shop.phone=fill.phone;
      if(fill.hours) shop.hours=fill.hours;
      if(fill.dishes&&fill.dishes.length){ shop.dishes=fill.dishes; shop.items=fill.dishes; shop.menu=row.menu; }
      shop.tags=row;
      if(window.SNWork&&SNWork.applyFill){
        try{ SNWork.applyFill({name:row.name,phone:row.phone,hours:row.hours,dishes:row.dishes,items:row.dishes,sample:false}); }catch(e){}
      }
      return row;
    }catch(e){ return shop; }
  }
  function mergeFill(){
    var out={phone:"",hours:"",dishes:[]};
    for(var i=0;i<arguments.length;i++){
      var x=arguments[i];
      if(!x) continue;
      if(x.phone&&!out.phone) out.phone=x.phone;
      if(x.hours&&!out.hours) out.hours=x.hours;
      if(x.dishes&&x.dishes.length>(out.dishes?out.dishes.length:0)) out.dishes=x.dishes;
    }
    return out;
  }
  function paintSheet(shop, fill){
    css();
    var live=document.getElementById("sn-live");
    var host=hostEl();
