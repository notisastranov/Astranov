(function(){
  if(window.__SN_FILL_4189) return;
  window.__SN_FILL_4189=true;
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
  var filling={};

  function scrubSay(s){
    s=String(s==null?"":s).trim();
    if(!s) return "";
    if(/^\s*\{[\s\S]*"say"\s*:/.test(s)){
      try{
        var o=JSON.parse(s);
        if(o && o.say!=null) return String(o.say).trim();
      }catch(e){}
      var m=s.match(/"say"\s*:\s*"((?:\\.|[^"\\])*)"/);
      if(m){
        try{ return JSON.parse('"'+m[1]+'"'); }catch(e){ return m[1]; }
      }
    }
    // strip accidental nested say-blob inside longer text
    if(/\{[\s\S]*"say"\s*:/.test(s) && s.length>40){
      var m2=s.match(/\{[\s\S]*\}/);
      if(m2){
        try{
          var o2=JSON.parse(m2[0]);
          if(o2 && o2.say) return String(o2.say).trim();
        }catch(e){}
      }
    }
    return s;
  }


  function css(){
    if(document.getElementById("sn-fill-4189-css")) return;
    var s=document.createElement("style");
    s.id="sn-fill-4189-css";
    s.textContent=
      "#sn-paypath-4189,#sn-call-4189{display:flex!important}"+
      ".sn-menu-grid .dish.sheet.head .cols,#sn-live .dish.sheet.head .cols,#sn-sheet .dish.sheet.head .cols{"+COLS+"}"+
      ".sn-menu-grid .dish.sheet.head .cols > span,#sn-live .dish.sheet.head .cols > span,#sn-sheet .dish.sheet.head .cols > span{"+SPAN+"}"+
      "#sn-sheet .card .dish.sheet.head .cols,#sn-menu .card .dish.sheet.head .cols{"+COLS+"}";
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
      if(typeof it==="string"){
        var m=it.split(/\s*[—\-]\s*/);
        var nm=scrubSay(String(m[0]||"").trim());
        if(!nm) return null;
        return {name:nm,price:Number(m[1])||0,hours:hours||"",stock:20,stock0:20,photo:"",sample:false};
      }
      if(!it||!(it.name||it.desc)) return null;
      if(it.sample===true||it.sample===1||it.sample==="true") return null;
      return {
        name:scrubSay(String(it.name||it.desc).trim()),
        price:Number(it.price)||0,
        hours:it.hours||hours||"",
        stock:it.stock!=null?it.stock:20,
        stock0:it.stock0!=null?it.stock0:(it.stock!=null?it.stock:20),
        photo:it.photo||"",
        sample:false
      };
    }).filter(function(d){ return d&&d.name&&!/^\s*\{/.test(d.name)&&!("say"===d.name); });
  }
  function shopPhone(shop){
    var p=String((shop&&(shop.phone||(shop.tags&&shop.tags.phone)))||"").trim();
    if(/^CALL(\s+SHOP)?$/i.test(p)) return "";
    if(!p || !/\d/.test(p)) return "";
    return p;
  }
  function brandFill(shop){
    var key=brandKey(shop&&(shop.name||shop.place||shop.raw));
    if(!key||!BRAND[key]) return null;
    var b=BRAND[key];
    return {phone:b.phone||shopPhone(shop)||"",hours:b.hours||(shop&&shop.hours)||"",dishes:normDishes(b.dishes,b.hours)};
  }
  function localFill(shop){
    if(!shop) return null;
    var dishes=normDishes(shop.dishes||shop.items||(shop.tags&&shop.tags.dishes)||[], shop.hours||"");
    if(!dishes.length && shop.menu){
      dishes=normDishes(String(shop.menu).split(/\n+/), shop.hours||"");
    }
    var phone=shopPhone(shop);
    var hours=String(shop.hours||(shop.tags&&shop.tags.hours)||"").trim();
    if(!dishes.length && !phone && !hours) return null;
    return {phone:phone,hours:hours,dishes:dishes};
  }
  function hostEl(){
    return document.querySelector("#sn-sheet.on .card")
      || document.querySelector("#sn-menu.on .card")
      || document.getElementById("sn-live");
  }
  function spaceHeads(){
    document.querySelectorAll(".dish.sheet.head .cols, #sn-sheet .cols, #sn-live .cols").forEach(function(cols){
      if(!cols || !cols.children || cols.children.length<4) return;
      cols.setAttribute("style", COLS);
      Array.prototype.forEach.call(cols.children||[], function(ch){
        if(ch&&ch.tagName==="SPAN") ch.setAttribute("style", SPAN);
      });
    });
  }
  function scrubCallShop(host, phone){
    if(!host) return;
    host.querySelectorAll("a,button").forEach(function(el){
      if(el.id==="sn-call-4189" || el.id==="sn-call-4175" || el.id==="sn-call-4173") return;
      var t=String(el.textContent||"").replace(/\s+/g," ").trim();
      if(/^CALL(\s+SHOP)?$/i.test(t)){
        if(phone){
          el.textContent="CALL "+phone;
          if(el.tagName==="A") el.setAttribute("href","tel:"+phone.replace(/[^\d+]/g,""));
        }else{
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

    var call=document.getElementById("sn-call-4189");
    var old=document.getElementById("sn-call-4175")||document.getElementById("sn-call-4173");
    if(old && old.parentNode) old.parentNode.removeChild(old);

    if(phone){
      if(!call){
        call=document.createElement("a");
        call.id="sn-call-4189";
        call.style.cssText="display:flex!important;align-items:center;justify-content:center;margin:8px 0 4px;height:40px;border-radius:12px;border:1px solid rgba(77,240,255,.7);background:rgba(4,16,28,.95);color:#4df0ff;font:800 12px system-ui;text-decoration:none";
      }
      call.textContent="CALL "+phone;
      call.href="tel:"+phone.replace(/[^\d+]/g,"");
      if(call.parentNode!==host) host.appendChild(call);
    }else if(call && call.parentNode){
      call.parentNode.removeChild(call);
    }
    scrubCallShop(host, phone);

    var bar=document.getElementById("sn-paypath-4189")||document.getElementById("sn-paypath-4175")||document.getElementById("sn-paypath-4165");
    if(!bar){
      bar=document.createElement("div");
      bar.id="sn-paypath-4189";
      bar.style.cssText="display:flex!important;flex-wrap:wrap;gap:8px;margin:10px 0 4px;padding:0 2px";
      bar.innerHTML=
        '<button type="button" data-act="now" style="flex:1;min-width:88px;height:40px;border-radius:12px;border:1px solid rgba(77,240,255,.7);background:rgba(4,16,28,.95);color:#4df0ff;font:800 12px system-ui">NOW</button>'+
        '<button type="button" data-act="pay" style="flex:1;min-width:88px;height:40px;border-radius:12px;border:1px solid rgba(77,240,255,.7);background:rgba(4,16,28,.95);color:#4df0ff;font:800 12px system-ui">PAY</button>'+
        '<button type="button" data-act="reload" style="flex:1;min-width:88px;height:40px;border-radius:12px;border:1px solid rgba(77,240,255,.7);background:rgba(4,16,28,.95);color:#7ee9ff;font:800 12px system-ui">RELOAD</button>';
    }else{
      bar.id="sn-paypath-4189";
    }
    if(bar.parentNode!==host) host.appendChild(bar);
    spaceHeads();
    ensureHead(host);
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
  function ensureHead(host){
    host = host || hostEl();
    if(!host) return;
    css();
    var head = host.querySelector(".dish.sheet.head");
    if(!head){
      var wrap=document.createElement("div");
      wrap.innerHTML=headHtml();
      var note=host.querySelector("p.note");
      var first=note||host.firstChild;
      while(wrap.firstChild) host.insertBefore(wrap.firstChild, first);
      head=host.querySelector(".dish.sheet.head");
    }
    spaceHeads();
    // scrub JSON blobs in description cells / dish names
    host.querySelectorAll(".dish.sheet.order b, .dish.sheet .cols > b, .dish.sheet .cols > span").forEach(function(el){
      if(el.classList && (el.classList.contains("pic")||el.classList.contains("px")||el.classList.contains("hrs")||el.classList.contains("st"))) return;
      var t=String(el.textContent||"");
      if(/"say"\s*:/.test(t) || /^\s*\{/.test(t)){
        var clean=scrubSay(t);
        if(clean && clean!==t) el.textContent=clean;
        else if(/^\s*\{/.test(t)) el.textContent="—";
      }
    });
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
    var dishes=normDishes((fill&&fill.dishes)||(shop&&shop.dishes)||[], (fill&&fill.hours)||(shop&&shop.hours)||"");
    var hours=(fill&&fill.hours)||(shop&&shop.hours)||"";
    var html=headHtml();
    if(dishes.length){
      dishes.forEach(function(it){ html+=rowHtml(it, hours); });
    }else{
      html+=emptyHtml();
    }
    if(live){
      live.innerHTML=html;
      var menu=document.getElementById("sn-menu");
      if(menu) menu.classList.add("on");
    }
    // Also inject spaced head into sheet card if order-menu painted glued text
    if(host){
      var glued=host.querySelector(".dish.sheet.head .cols");
      if(!glued){
        var wrap=document.createElement("div");
        wrap.innerHTML=html;
        var first=host.firstChild;
        while(wrap.firstChild) host.insertBefore(wrap.firstChild, first);
      }else{
        spaceHeads();
      }
    }
    mountChrome(shop);
    spaceHeads();
    ensureHead(host);
    ensureHead(live);
  }
  function timed(promise, ms){
    return new Promise(function(resolve){
      var done=false;
      var t=setTimeout(function(){ if(done) return; done=true; resolve(null); }, ms||2200);
      Promise.resolve(promise).then(function(v){
        if(done) return; done=true; clearTimeout(t); resolve(v);
      }, function(){ if(done) return; done=true; clearTimeout(t); resolve(null); });
    });
  }
  function placeFill(shop){
    return fetch("/api/place",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({name:shop.name||"",place:shop.raw||shop.place||"",lat:shop.lat,lng:shop.lng})})
      .then(function(r){ return r.json(); })
      .then(function(j){
        if(!j||j.ok===false) return null;
        return {phone:j.phone||"",hours:j.hours||"",dishes:normDishes(j.items||j.dishes||[], j.hours||"")};
      });
  }
  function aiFill(shop){
    var name=String(shop.name||"shop");
    var body={
      prompt:"act=listing JSON only for THIS shop: "+name+". Fields: act=listing, phone, hours, dishes:[{name,price}]. Published menu only. Never act=hunt.",
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
  function seedAny(shop){
    if(!shop) return null;
    var brand=brandFill(shop);
    var local=localFill(shop);
    var fill=mergeFill(brand, local);
    if(fill.phone) shop.phone=fill.phone;
    if(fill.hours) shop.hours=fill.hours;
    if(fill.dishes&&fill.dishes.length){
      shop.dishes=fill.dishes; shop.items=fill.dishes;
      shop.menu=fill.dishes.map(function(d){ return d.name+" — "+d.price; }).join("\n");
    }
    if(!shop.tags||typeof shop.tags!=="object") shop.tags={};
    if(shop.phone) shop.tags.phone=shop.phone;
    if(shop.hours) shop.tags.hours=shop.hours;
    if(shop.dishes) shop.tags.dishes=shop.dishes;
    shop.sample=false;
    if(fill.phone||fill.hours||(fill.dishes&&fill.dishes.length)) writeShop(shop, fill);
    lastShop=shop;
    return fill;
  }
  function openShop(shop){
    if(!shop) return;
    lastShop=shop;
    var fill=seedAny(shop)||{phone:"",hours:"",dishes:[]};
    paintSheet(shop, fill);
    mountChrome(shop);
    var id=String(shop.id||shop.name||"")+":"+shop.lat+":"+shop.lng;
    if(filling[id]) return;
    filling[id]=true;
    timed(placeFill(shop), 2000).then(function(place){
      return timed(aiFill(shop), 2400).then(function(ai){ return {place:place,ai:ai}; });
    }).then(function(pair){
      var next=mergeFill(fill, pair&&pair.place, pair&&pair.ai);
      if(next.phone||next.hours||(next.dishes&&next.dishes.length)){
        writeShop(shop, next);
        paintSheet(shop, next);
      }else{
        paintSheet(shop, fill);
      }
      mountChrome(shop);
      filling[id]=false;
    }).catch(function(){
      paintSheet(shop, fill);
      mountChrome(shop);
      filling[id]=false;
    });
    [40,120,300,700,1400,2400].forEach(function(ms){
      setTimeout(function(){
        spaceHeads();
        ensureHead();
        mountChrome(shop);
        scrubCallShop(hostEl(), shopPhone(shop)||(fill&&fill.phone)||"");
      }, ms);
    });
  }
  function wrapFn(name){
    if(!window.SN||!SN[name]) return false;
    if(SN[name].__fill4189) return true;
    var orig=SN[name].bind(SN);
    SN[name]=function(v){
      try{ seedAny(v); }catch(e){}
      var r=orig(v);
      try{ openShop(v); }catch(e){}
      return r;
    };
    SN[name].__fill4189=true;
    return true;
  }
  function wrap(){
    wrapFn("selectVendor");
    wrapFn("startOrder");
  }
  function watch(){
    ["sn-live","sn-sheet","sn-menu"].forEach(function(id){
      var el=document.getElementById(id);
      if(!el||el.__snFill4189Obs) return;
      el.__snFill4189Obs=true;
      new MutationObserver(function(){
        spaceHeads();
        ensureHead();
        scrubCallShop(hostEl(), shopPhone(lastShop)||"");
        if(lastShop) mountChrome(lastShop);
      }).observe(el,{childList:true,subtree:true,attributes:true,attributeFilter:["class"]});
    });
  }
  css();
  wrap();
  watch();
  setInterval(function(){ wrap(); watch(); css(); ensureHead(); if(lastShop){ mountChrome(lastShop); spaceHeads(); ensureHead(); } else { var sheet=document.getElementById('sn-sheet'); if(sheet&&sheet.classList.contains('on')) ensureHead(); } }, 900);
})();
