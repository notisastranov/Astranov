(function(){
  if(window.__SN_FILL_4171) return;
  window.__SN_FILL_4171=true;
  var KES_EUR=140;
  var BRAND={
    "pizza inn":{phone:"+254 700 323 323",hours:"Mon–Sun 8:00–23:00",dishes:[
      {name:"Regina (Medium)",price:7.0},{name:"Hawaiian (Medium)",price:7.0},
      {name:"Peri-Peri Chicken (Medium)",price:7.0},{name:"Chicken Tikka (Medium)",price:7.0},
      {name:"Boerewors (Medium)",price:7.0},{name:"Veg Feast (Medium)",price:7.5},
      {name:"Cheese Burger (Medium)",price:7.5},{name:"Chicken Hawaiian (Medium)",price:7.5},
      {name:"Nyama Feast (Medium)",price:8.0},{name:"Chicken Feast (Medium)",price:8.0},
      {name:"Meat Deluxe (Medium)",price:8.0},{name:"6 BBQ Wings",price:4.0}
    ]},
    "domino":{phone:"",hours:"",dishes:[
      {name:"Margherita (Regular)",price:6.5},{name:"Pepperoni (Regular)",price:8.0},
      {name:"Farm House (Regular)",price:8.5},{name:"Chicken Dominator (Regular)",price:9.5},
      {name:"Veggie Paradise (Regular)",price:8.0},{name:"Garlic Breadsticks",price:3.5}
    ]},
    "debonair":{phone:"",hours:"",dishes:[
      {name:"Margherita",price:6.0},{name:"BBQ Chicken",price:7.5},{name:"Pepperoni",price:7.0},
      {name:"Chicken & Mushroom",price:7.5},{name:"Veggie Delight",price:6.5}
    ]}
  };
  function css(){
    if(document.getElementById("sn-fill-4171-css")) return;
    var s=document.createElement("style");
    s.id="sn-fill-4171-css";
    s.textContent=
      "#sn-live .dish.sheet.head .cols,#sn-sheet .dish.sheet.head .cols,"+
      "#sn-live .dish.order .cols,#sn-sheet .dish.order .cols{"+
        "display:grid!important;grid-template-columns:56px minmax(72px,1.6fr) 64px minmax(72px,.9fr) 48px 48px!important;"+
        "gap:8px!important;align-items:center!important;width:100%!important;box-sizing:border-box!important}"+
      "#sn-live .dish.sheet.head .cols > span,#sn-sheet .dish.sheet.head .cols > span{"+
        "display:block!important;min-width:0;padding:0 4px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;"+
        "font:800 10px/1.2 system-ui;letter-spacing:.04em;color:#7ee9ff}"+
      "#sn-live .dish.sheet.head,#sn-sheet .dish.sheet.head{display:block!important;width:100%;padding:6px 4px}"+
      "#sn-paypath-4165{display:flex!important}";
    document.head.appendChild(s);
  }
  function brandKey(name){
    var n=String(name||"").toLowerCase();
    if(/pizza\s*inn/.test(n)) return "pizza inn";
    if(/domino/.test(n)) return "domino";
    if(/debonair/.test(n)) return "debonair";
    return "";
  }
  function normDishes(list, hours){
    return (list||[]).map(function(it){
      if(!it||!(it.name||it.desc)) return null;
      return {
        name:String(it.name||it.desc).trim(),
        price:Number(it.price)||0,
        hours:it.hours||hours||"",
        stock:it.stock||20,
        stock0:it.stock0||it.stock||20,
        photo:it.photo||"",
        sample:false
      };
    }).filter(function(d){ return d&&d.name; });
  }
  function brandFill(shop){
    var key=brandKey(shop&&shop.name);
    if(!key||!BRAND[key]) return null;
    var b=BRAND[key];
    return {
      phone:b.phone||(shop&&shop.phone)||"",
      hours:b.hours||(shop&&shop.hours)||"",
      dishes:normDishes(b.dishes, b.hours)
    };
  }
  function headHtml(){
    return '<div class="dish sheet head order"><div class="cols">'+
      '<span>Photo</span><span>Description</span><span>AV€</span><span>Hours</span><span>Initial</span><span>Left</span>'+
      '</div></div>';
  }
  function rowHtml(it, hours){
    var n=String(it.name||"").replace(/"/g,"&quot;").replace(/</g,"&lt;");
    var hrs=String(it.hours||hours||"-").replace(/</g,"&lt;");
    return '<button type="button" class="dish sheet order" data-name="'+n+'">'+
      '<div class="cols">'+
      '<img alt="" src="" style="width:48px;height:48px;background:#041018;border-radius:8px">'+
      '<b>'+n+'</b>'+
      '<span class="px">AV€ '+(Number(it.price)||0).toFixed(2)+'</span>'+
      '<span class="hrs">'+hrs+'</span>'+
      '<span class="st">20</span><span class="st">20</span>'+
      '</div></button>';
  }
  function liveEl(){
    return document.getElementById("sn-live");
  }
  function mountPay(live){
    if(!live) return;
    var bar=document.getElementById("sn-paypath-4165");
    if(!bar){
      bar=document.createElement("div");
      bar.id="sn-paypath-4165";
      bar.style.cssText="display:flex;flex-wrap:wrap;gap:8px;margin:10px 0 4px";
      bar.innerHTML=
        '<button type="button" data-act="now" style="flex:1;min-width:88px;height:40px;border-radius:12px;border:1px solid rgba(77,240,255,.7);background:rgba(4,16,28,.95);color:#4df0ff;font:800 12px system-ui">NOW</button>'+
        '<button type="button" data-act="pay" style="flex:1;min-width:88px;height:40px;border-radius:12px;border:1px solid rgba(77,240,255,.7);background:rgba(4,16,28,.95);color:#4df0ff;font:800 12px system-ui">PAY</button>'+
        '<button type="button" data-act="reload" style="flex:1;min-width:88px;height:40px;border-radius:12px;border:1px solid rgba(77,240,255,.7);background:rgba(4,16,28,.95);color:#7ee9ff;font:800 12px system-ui">RELOAD</button>';
    }
    if(!bar.parentNode) live.appendChild(bar);
  }
  function paintRows(shop, fill){
    css();
    var live=liveEl();
    if(!live) return;
    var dishes=normDishes((fill&&fill.dishes)||(shop&&shop.dishes)||[], (fill&&fill.hours)||(shop&&shop.hours)||"");
    var hours=(fill&&fill.hours)||(shop&&shop.hours)||"";
    var html=headHtml();
    if(!dishes.length){
      html+='<p class="note">Loading public menu…</p>';
      live.innerHTML=html;
      mountPay(live);
      return;
    }
    dishes.forEach(function(it){ html+=rowHtml(it, hours); });
    live.innerHTML=html;
    var menu=document.getElementById("sn-menu");
    if(menu) menu.classList.add("on");
    mountPay(live);
    if(window.SN&&SN.talk) SN.talk((shop&&shop.name||"Shop")+". "+dishes.length+" dishes on the sheet.");
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
        if(list[i]&&shop.name&&String(list[i].name).toLowerCase()===String(shop.name).toLowerCase() && Math.abs(+list[i].lat-+shop.lat)<0.02){ hit=i; break; }
      }
      var row=hit>=0?list[hit]:{id:shop.id||("s"+Date.now()),kind:"shop",name:shop.name,lat:+shop.lat,lng:+shop.lng,raw:shop.raw||"",peer:"spacenet",auto:1,t:Date.now()};
      if(fill.phone) row.phone=fill.phone;
      if(fill.hours) row.hours=fill.hours;
      if(fill.dishes&&fill.dishes.length){
        row.dishes=fill.dishes;
        row.items=fill.dishes;
        row.menu=fill.dishes.map(function(d){ return d.name+" — "+d.price; }).join("\n");
      }
      row.sample=false;
      if(hit>=0) list[hit]=row; else list.unshift(row);
      localStorage.setItem("sn:shops", JSON.stringify(list));
      shop.phone=row.phone||shop.phone;
      shop.hours=row.hours||shop.hours;
      shop.dishes=row.dishes;
      shop.items=row.dishes;
      shop.menu=row.menu;
      shop.tags=row;
      if(window.SNWork&&SNWork.applyFill){
        try{
          SNWork.applyFill({
            name:row.name,phone:row.phone,hours:row.hours,
            dishes:row.dishes,items:row.dishes,sample:false
          });
        }catch(e){}
      }
      return row;
    }catch(e){ return shop; }
  }
  function timed(promise, ms){
    return new Promise(function(resolve){
      var done=false;
      var t=setTimeout(function(){
        if(done) return;
        done=true;
        resolve({phone:"",hours:"",dishes:[]});
      }, ms||2200);
      Promise.resolve(promise).then(function(v){
        if(done) return;
        done=true;
        clearTimeout(t);
        resolve(v||{phone:"",hours:"",dishes:[]});
      }, function(){
        if(done) return;
        done=true;
        clearTimeout(t);
        resolve({phone:"",hours:"",dishes:[]});
      });
    });
  }
  function placeFill(shop){
    return fetch("/api/place",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({name:shop.name||"",place:shop.raw||"",lat:shop.lat,lng:shop.lng})})
      .then(function(r){ return r.json(); })
      .then(function(j){
        if(!j||j.ok===false) return {phone:"",hours:"",dishes:[]};
        return {phone:j.phone||"",hours:j.hours||"",dishes:normDishes(j.items||j.dishes||[], j.hours||"")};
      });
  }
  function aiFill(shop){
    var name=String(shop.name||"shop");
    var body={
      prompt:"act=listing JSON only for THIS shop: "+name+". Fields: act=listing, phone, hours, dishes:[{name,price}]. Published menu only. Never act=hunt. No Rhodes.",
      message:"LISTING FILL act=listing "+name,
      spacenet:true,fast:true,force_paid:true,allow_paid:true,
      here:{place:name,name:name,lat:shop.lat,lng:shop.lng}
    };
    return fetch("/api/ai",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)})
      .then(function(r){ return r.json(); })
      .then(function(j){
        return {phone:j.phone||"",hours:j.hours||"",dishes:normDishes(j.dishes||j.items||[], j.hours||"")};
      });
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
  var filling=false;
  var lastId="";
  function fillShop(shop){
    if(!shop||!isFinite(+shop.lat)) return;
    css();
    var id=String(shop.id||shop.name||"")+":"+shop.lat+":"+shop.lng;
    var brand=brandFill(shop);
    // SYNC: paint brand seed immediately so sheet never stays empty
    if(brand&&brand.dishes&&brand.dishes.length){
      var early=writeShop(shop, brand);
      paintRows(early||shop, brand);
    }else{
      paintRows(shop, null);
    }
    if(filling&&lastId===id) return;
    filling=true;
    lastId=id;
    timed(placeFill(shop), 2000).then(function(place){
      return timed(aiFill(shop), 2200).then(function(ai){
        return {place:place,ai:ai};
      });
    }).then(function(pair){
      var tagged={
        phone:shop.phone||"",
        hours:shop.hours||"",
        dishes:normDishes(shop.dishes||[], shop.hours||"")
      };
      var fill=mergeFill(brand, tagged, pair.place, pair.ai);
      if((!fill.dishes||!fill.dishes.length)&&brand) fill=mergeFill(fill, brand);
      if(brand){
        if(!fill.phone&&brand.phone) fill.phone=brand.phone;
        if(!fill.hours&&brand.hours) fill.hours=brand.hours;
      }
      var row=writeShop(shop, fill);
      paintRows(row||shop, fill);
      // re-paint again shortly in case order-menu wiped rows
      setTimeout(function(){
        var live=liveEl();
        var hasRow=live&&live.querySelector&&live.querySelector(".dish.order:not(.head)");
        if(!hasRow&&fill&&fill.dishes&&fill.dishes.length){
          writeShop(shop, fill);
          paintRows(shop, fill);
        }else{
          css();
          mountPay(liveEl());
        }
      }, 400);
      setTimeout(function(){
        var live=liveEl();
        var hasRow=live&&live.querySelector&&live.querySelector(".dish.order:not(.head)");
        if(!hasRow&&brand&&brand.dishes&&brand.dishes.length){
          writeShop(shop, brand);
          paintRows(shop, brand);
        }
        mountPay(liveEl());
      }, 1200);
      filling=false;
    }).catch(function(){
      if(brand){ writeShop(shop, brand); paintRows(shop, brand); }
      filling=false;
    });
  }
  function wrapSelect(){
    if(!window.SN||!SN.selectVendor) return setTimeout(wrapSelect, 40);
    if(SN.selectVendor.__fill4171) return;
    var orig=SN.selectVendor.bind(SN);
    SN.selectVendor=function(v){
      var r=orig(v);
      try{
        setTimeout(function(){ fillShop(v); }, 30);
        setTimeout(function(){ fillShop(v); }, 500);
        setTimeout(function(){ fillShop(v); }, 1400);
      }catch(e){}
      return r;
    };
    SN.selectVendor.__fill4171=true;
  }
  css();
  wrapSelect();
  setInterval(function(){ wrapSelect(); css(); }, 2000);
})();
