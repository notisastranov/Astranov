(function(){
  if(window.__SN_FILL_4175) return;
  window.__SN_FILL_4175=true;
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
  var COLS="display:grid!important;grid-template-columns:52px minmax(88px,1.5fr) 56px minmax(88px,1fr) 44px 40px!important;column-gap:12px!important;align-items:center!important;width:100%!important;box-sizing:border-box!important";
  var SPAN="display:block!important;padding:0 8px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font:800 10px/1.2 system-ui;color:#7ee9ff";
  var lastShop=null;

  function css(){
    if(document.getElementById("sn-fill-4175-css")) return;
    var s=document.createElement("style");
    s.id="sn-fill-4175-css";
    s.textContent=
      "#sn-paypath-4175,#sn-call-4175{display:flex!important}"+
      ".sn-menu-grid .dish.sheet.head .cols,#sn-live .dish.sheet.head .cols,#sn-sheet .dish.sheet.head .cols{"+COLS+"}"+
      ".sn-menu-grid .dish.sheet.head .cols > span,#sn-live .dish.sheet.head .cols > span,#sn-sheet .dish.sheet.head .cols > span{"+SPAN+"}";
    document.head.appendChild(s);
  }
  function brandKey(name){
    var n=String(name||"").toLowerCase().replace(/[^a-z0-9]+/g," ");
    if(/pizza\s*inn/.test(n) || /pizzainn/.test(n)) return "pizza inn";
    if(/domino/.test(n)) return "domino";
    if(/debonair/.test(n)) return "debonair";
    return "";
  }
  function normDishes(list, hours){
    return (list||[]).map(function(it){
      if(!it||!(it.name||it.desc)) return null;
      if(it.sample===true||it.sample===1||it.sample==="true") return null;
      return {
        name:String(it.name||it.desc).trim(),
        price:Number(it.price)||0,
        hours:it.hours||hours||"",
        stock:it.stock!=null?it.stock:20,
        stock0:it.stock0!=null?it.stock0:(it.stock!=null?it.stock:20),
        photo:it.photo||"",
        sample:false
      };
    }).filter(function(d){ return d&&d.name; });
  }
  function brandFill(shop){
    var key=brandKey(shop&&(shop.name||shop.place||shop.raw));
    if(!key||!BRAND[key]) return null;
    var b=BRAND[key];
    return {phone:b.phone||(shop&&shop.phone)||"",hours:b.hours||(shop&&shop.hours)||"",dishes:normDishes(b.dishes,b.hours)};
  }
  function hostEl(){
    return document.querySelector("#sn-sheet.on .card")
      || document.querySelector("#sn-menu.on .card")
      || document.getElementById("sn-live");
  }
  function spaceHeads(){
    document.querySelectorAll(".dish.sheet.head .cols").forEach(function(cols){
      cols.setAttribute("style", COLS);
      Array.prototype.forEach.call(cols.children||[], function(ch){
        if(ch&&ch.tagName==="SPAN") ch.setAttribute("style", SPAN);
      });
    });
  }
  function mountChrome(shop){
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
      shop.phone=row.phone||shop.phone;
      shop.hours=row.hours||shop.hours;
      shop.dishes=row.dishes; shop.items=row.dishes; shop.menu=row.menu; shop.tags=row;
      if(window.SNWork&&SNWork.applyFill){
        try{ SNWork.applyFill({name:row.name,phone:row.phone,hours:row.hours,dishes:row.dishes,items:row.dishes,sample:false}); }catch(e){}
      }
      return row;
    }catch(e){ return shop; }
  }
  function seedSync(shop){
    if(!shop) return null;
    var brand=brandFill(shop);
    if(!brand) return null;
    shop.phone=brand.phone||shop.phone||"";
    shop.hours=brand.hours||shop.hours||"";
    if(brand.dishes&&brand.dishes.length){
      shop.dishes=brand.dishes; shop.items=brand.dishes;
      shop.menu=brand.dishes.map(function(d){ return d.name+" — "+d.price; }).join("\n");
    }
    if(!shop.tags||typeof shop.tags!=="object") shop.tags={};
    shop.tags.phone=shop.phone; shop.tags.hours=shop.hours; shop.tags.dishes=shop.dishes; shop.tags.menu=shop.menu;
    shop.sample=false;
    writeShop(shop, brand);
    lastShop=shop;
    return brand;
  }
  function paintLive(shop, fill){
    css();
    var live=document.getElementById("sn-live");
    if(!live) return;
    var dishes=normDishes((fill&&fill.dishes)||(shop&&shop.dishes)||[], (fill&&fill.hours)||(shop&&shop.hours)||"");
    var hours=(fill&&fill.hours)||(shop&&shop.hours)||"";
    if(!dishes.length) return;
    var html=headHtml();
    dishes.forEach(function(it){ html+=rowHtml(it, hours); });
    live.innerHTML=html;
    var menu=document.getElementById("sn-menu");
    if(menu) menu.classList.add("on");
    mountChrome(shop);
  }
  function openShop(shop){
    if(!shop) return;
    lastShop=shop;
    var brand=seedSync(shop)||brandFill(shop);
    if(brand){
      writeShop(shop, brand);
      if(window.SNOrderMenu&&SNOrderMenu.paint){ try{ SNOrderMenu.paint(); }catch(e){} }
      paintLive(shop, brand);
      mountChrome(shop);
      [0,40,120,300,700,1400].forEach(function(ms){
        setTimeout(function(){
          if(brand) writeShop(shop, brand);
          if(window.SNOrderMenu&&SNOrderMenu.paint){ try{ SNOrderMenu.paint(); }catch(e){} }
          paintLive(shop, brand);
          mountChrome(shop);
          spaceHeads();
        }, ms);
      });
    }else{
      mountChrome(shop);
    }
  }
  function wrapFn(name){
    if(!window.SN||!SN[name]) return false;
    if(SN[name].__fill4175) return true;
    var orig=SN[name].bind(SN);
    SN[name]=function(v){
      try{ seedSync(v); }catch(e){}
      var r=orig(v);
      try{ openShop(v); }catch(e){}
      return r;
    };
    SN[name].__fill4175=true;
    return true;
  }
  function wrap(){
    wrapFn("selectVendor");
    wrapFn("startOrder");
  }
  function watch(){
    ["sn-live","sn-sheet","sn-menu"].forEach(function(id){
      var el=document.getElementById(id);
      if(!el||el.__snFill4175Obs) return;
      el.__snFill4175Obs=true;
      new MutationObserver(function(){
        spaceHeads();
        if(lastShop) mountChrome(lastShop);
      }).observe(el,{childList:true,subtree:true,attributes:true,attributeFilter:["class"]});
    });
  }
  css();
  wrap();
  watch();
  setInterval(function(){ wrap(); watch(); css(); if(lastShop) mountChrome(lastShop); }, 1500);
})();
