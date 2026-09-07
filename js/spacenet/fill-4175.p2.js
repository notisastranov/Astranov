to:1,t:Date.now()};
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
