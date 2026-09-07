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
    [40,120,300,700,1400].forEach(function(ms){
      setTimeout(function(){
        spaceHeads();
        mountChrome(shop);
        scrubCallShop(hostEl(), shopPhone(shop)||(fill&&fill.phone)||"");
      }, ms);
    });
  }
  function wrapFn(name){
    if(!window.SN||!SN[name]) return false;
    if(SN[name].__fill4188) return true;
    var orig=SN[name].bind(SN);
    SN[name]=function(v){
      try{ seedAny(v); }catch(e){}
      var r=orig(v);
      try{ openShop(v); }catch(e){}
      return r;
    };
    SN[name].__fill4188=true;
    return true;
  }
  function wrap(){
    wrapFn("selectVendor");
    wrapFn("startOrder");
  }
  function watch(){
    ["sn-live","sn-sheet","sn-menu"].forEach(function(id){
      var el=document.getElementById(id);
      if(!el||el.__snFill4188Obs) return;
      el.__snFill4188Obs=true;
      new MutationObserver(function(){
        spaceHeads();
        scrubCallShop(hostEl(), shopPhone(lastShop)||"");
        if(lastShop) mountChrome(lastShop);
      }).observe(el,{childList:true,subtree:true,attributes:true,attributeFilter:["class"]});
    });
  }
  css();
  wrap();
  watch();
  setInterval(function(){ wrap(); watch(); css(); if(lastShop){ mountChrome(lastShop); spaceHeads(); } }, 1500);
})();
