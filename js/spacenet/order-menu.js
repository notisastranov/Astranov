/* SpaceNet order-menu 4084 — vendor spreadsheet + visible minus/plus and ADD TO CART. */
(function(){
  var style=document.getElementById("sn-order-css");
  if(!style){
    style=document.createElement("style");
    style.id="sn-order-css";
    document.head.appendChild(style);
  }
  style.textContent=
    "#sn-live .dish.order,#sn-sheet .dish.order{display:flex;flex-direction:column;gap:8px;min-width:0;width:100%;box-sizing:border-box}"+ 
    "#sn-live .dish.order .cols,#sn-sheet .dish.order .cols{display:grid;grid-template-columns:56px minmax(0,1.6fr) 64px minmax(0,.9fr) 48px 48px;gap:6px;align-items:center;width:100%}"+ 
    "#sn-live .dish.order .acts,#sn-sheet .dish.order .acts{display:flex;align-items:center;gap:8px;width:100%}"+ 
    "#sn-live .dish.order .qty,#sn-sheet .dish.order .qty{display:flex;align-items:center;gap:6px;flex:none}"+ 
    "#sn-live .dish.order .qty button,#sn-sheet .dish.order .qty button{width:40px;height:40px;margin:0;padding:0;border:1px solid rgba(126,233,255,.55);background:#041018;color:#7ee9ff;border-radius:10px;font:800 20px/1 system-ui}"+ 
    "#sn-live .dish.order .qty b,#sn-sheet .dish.order .qty b{min-width:22px;text-align:center;font:800 16px system-ui;color:#e8fbff}"+ 
    "#sn-live .dish.order .addcart,#sn-sheet .dish.order .addcart{flex:1;height:40px;margin:0;border:0;border-radius:10px;background:#d8f6ff;color:#041018;font:800 13px/1 system-ui;letter-spacing:.04em}"+ 
    "#sn-order-go{display:block;width:100%;height:48px;margin:8px 0 0;border:0;border-radius:12px;background:#d8f6ff;color:#041018;font:800 15px system-ui}";
  var cart={};
  var shop=null;
  function esc(s){ return String(s==null?"":s).replace(/&/g,"&#38;").replace(/</g,"&#60;").replace(/>/g,"&#62;").replace(/\"/g,"&#34;"); }
  function talk(s){ if(window.SN&&SN.say) SN.say(s); else { var el=document.getElementById("line"); if(el) el.textContent=s; } }
  function fmt(n){ n=Number(n)||0; return "AV€ "+n.toLocaleString("en-GB",{minimumFractionDigits:2,maximumFractionDigits:2}); }
  function avc(){ try{ return Math.max(0, Number(localStorage.getItem("sn:avc")||0)); }catch(e){ return 0; } }
  function avcSet(n){ try{ localStorage.setItem("sn:avc", String(Math.max(0, Math.round(Number(n)*100)/100))); }catch(e){} if(window.SNWallet) SNWallet.paint(); if(window.SN&&SN.paintMoney) SN.paintMoney(true); }
  function parseMenu(text){
    return String(text||"").split(/\n+/).map(function(line){
      var parts=String(line).split(/\s*[\u2014\-\u2013]\s*/);
      if(parts.length>=2){
        var price=Number(String(parts[1]).replace(/[^\d.,]/g,"").replace(",","."));
        var stock=parts[2]!=null?Number(String(parts[2]).replace(/[^\d]/g,"")):null;
        if(parts[0] && isFinite(price) && price>0) return {name:parts[0].trim(),price:price,stock:isFinite(stock)?stock:null};
      }
      return null;
    }).filter(function(x){ return x&&x.name; });
  }
  function dishesOf(v){
    if(!v) return [];
    if(v.dishes&&v.dishes.length) return v.dishes;
    if(v.tags&&v.tags.dishes&&v.tags.dishes.length) return v.tags.dishes;
    if(v.items&&v.items.length) return v.items;
    if(v.menu) return parseMenu(v.menu);
    if(v.tags&&v.tags.menu) return parseMenu(v.tags.menu);
    return [];
  }
  function listed(v){
    if(!v||!window.SNWork||!SNWork.all) return v||null;
    var shops=SNWork.all().shops||[];
    var hit=null;
    shops.forEach(function(s){
      if(!s) return;
      if(v.id&&s.id===v.id) hit=s;
      else if(!hit && s.name&&v.name&&String(s.name).toLowerCase()===String(v.name).toLowerCase()) hit=s;
    });
    return hit||v;
  }
  function currentShop(){
    var all=window.SNWork&&SNWork.all&&SNWork.all();
    var sheet=document.getElementById("sn-sheet");
    if(sheet&&sheet.classList.contains("on")&&all){
      var ttl=sheet.querySelector(".ttl");
      var name=ttl&&ttl.textContent;
      if(name){
        var found=null;
        (all.shops||[]).forEach(function(s){ if(s&&s.name&&name.toLowerCase().indexOf(String(s.name).toLowerCase())>=0) found=s; });
        if(found) return found;
      }
    }
    return shop;
  }
  function keyOf(it){ return String(it.id||it.name||""); }
  function qtyOf(it){ return Number(cart[keyOf(it)]||0)||0; }
  function setQty(it, n){
    var left=it.stock!=null?Number(it.stock):(it.stock0!=null?Number(it.stock0):Infinity);
    n=Math.max(0, Math.round(Number(n)||0));
    if(isFinite(left) && n>left) n=left;
    if(n<=0) delete cart[keyOf(it)];
    else cart[keyOf(it)]=n;
    paint();
  }
  function addCart(it){
    var q=qtyOf(it);
    setQty(it, q?q:1);
    talk((it.name||"Item")+" in the cart. "+qtyOf(it)+" x "+fmt(it.price)+".");
  }
  function lines(){
    var s=listed(currentShop());
    return dishesOf(s).map(function(it){ return {it:it, qty:qtyOf(it), price:Number(it.price)||0}; }).filter(function(x){ return x.qty>0; });
  }
  function total(){ return lines().reduce(function(s,x){ return s+x.price*x.qty; },0); }
  function headHtml(){
    return '<div class="dish sheet head order"><div class="cols"><span>Photo</span><span>Description</span><span>AV€</span><span>Hours</span><span>Initial</span><span>Left</span></div></div>';
  }
  function rowHtml(it){
    var init=it.stock0!=null?it.stock0:it.stock;
    var left=it.stock!=null?it.stock:init;
    var q=qtyOf(it);
    var img=it.photo?('<img alt="" src="'+esc(it.photo)+'">'):'<span class="pic">+</span>';
    var dead=isFinite(Number(left)) && Number(left)<=0;
    return '<div class="dish sheet order'+(q?" on":"")+(dead?" dead":"")+'" data-dish="'+esc(keyOf(it))+'">'+ 
      '<div class="cols">'+img+'<b>'+esc(it.name||it.desc||"")+'</b><span class="px">'+fmt(it.price)+'</span><span class="hrs">'+esc(it.hours||"-")+'</span><span class="st">'+esc(init==null?"":init)+'</span><span class="st">'+esc(left==null?"":left)+'</span></div>'+ 
      '<div class="acts"><span class="qty"><button type="button" data-act="sub"'+(dead?" disabled":"")+'>-</button><b>'+q+'</b><button type="button" data-act="add"'+(dead?" disabled":"")+'>+</button></span><button type="button" class="addcart" data-act="cart"'+(dead?" disabled":"")+'>ADD TO CART</button></div></div>';
  }
  function gridHtml(s){
    var list=dishesOf(s);
    if(!list.length) return '<p class="note">No rows on this spreadsheet yet.</p>';
    var n=lines().reduce(function(s,x){ return s+x.qty; },0);
    return '<div class="sn-menu-grid">'+headHtml()+list.map(rowHtml).join("")+'</div><button type="button" id="sn-order-go" data-act="order-go"'+(n?"":" disabled")+'>'+(n?("ORDER "+n+" "+fmt(total())):"ORDER")+'</button>';
  }
  function bindGrid(root, s){
    if(!root) return;
    root.querySelectorAll("[data-dish]").forEach(function(row){
      var key=row.getAttribute("data-dish");
      var it=(dishesOf(s)||[]).filter(function(d){ return keyOf(d)===key; })[0];
      if(!it) return;
      row.addEventListener("click", function(e){
        var act=e.target&&e.target.getAttribute&&e.target.getAttribute("data-act");
        if(act==="add"){ e.preventDefault(); e.stopPropagation(); setQty(it, qtyOf(it)+1); }
        else if(act==="sub"){ e.preventDefault(); e.stopPropagation(); setQty(it, Math.max(0, qtyOf(it)-1)); }
        else if(act==="cart"){ e.preventDefault(); e.stopPropagation(); addCart(it); }
      });
    });
    var go=root.querySelector("#sn-order-go,[data-act=order-go]");
    if(go) go.addEventListener("click", function(e){ e.preventDefault(); e.stopPropagation(); complete(); });
  }
  function paintLive(s){
    var live=document.getElementById("sn-live");
    if(!live) return;
    live.innerHTML=gridHtml(s);
    bindGrid(live, s);
    var menu=document.getElementById("sn-menu");
    if(menu) menu.classList.add("on");
  }
  function paintSheet(s){
    var sheet=document.getElementById("sn-sheet");
    if(!sheet||!sheet.classList.contains("on")) return;
    if(sheet.querySelector(".dish.edit")) return;
    var card=sheet.querySelector(".card");
    if(!card) return;
    var grid=card.querySelector(".sn-menu-grid");
    var pre=card.querySelector("pre.menu");
    if(!grid && !pre && !dishesOf(s).length) return;
    var box=document.createElement("div");
    box.innerHTML=gridHtml(s);
    var next=box.children[0];
    var go=box.querySelector("#sn-order-go");
    if(grid) grid.replaceWith(next);
    else if(pre) pre.replaceWith(next);
    else card.appendChild(next);
    var oldGo=card.querySelectorAll("#sn-order-go");
    if(go){
      if(oldGo.length){ oldGo.forEach(function(n,i){ if(i) n.remove(); }); if(oldGo[0]&&oldGo[0]!==go) oldGo[0].replaceWith(go); }
      else card.appendChild(go);
    }
    var leftover=card.querySelector("[data-act=order]");
    if(leftover) leftover.remove();
    bindGrid(card, s);
  }
  function paint(){
    var s=listed(currentShop());
    if(!s) return;
    shop=s;
    var menu=document.getElementById("sn-menu");
    if(menu&&menu.classList.contains("on")) paintLive(s);
    paintSheet(s);
  }
  function complete(){
    var s=listed(currentShop());
    var bag=lines();
    if(!bag.length){ talk("Add something to the cart first."); return; }
    shop=s;
    var price=Math.round(total()*100)/100;
    var bal=avc();
    var names=bag.map(function(x){ return x.qty+" x "+x.it.name; }).join(", ");
    try{ localStorage.setItem("sn:last-order", JSON.stringify({shop:s&&s.name, items:bag.map(function(x){ return {name:x.it.name,price:x.price,qty:x.qty}; }), price:price, t:Date.now()})); }catch(e){}
    if(bal<price){
      talk(names+". "+fmt(price)+". You have "+fmt(bal)+". Reload euro, then ORDER again.");
      if(window.SN&&SN.reload) SN.reload(Math.max(10, Math.ceil(price-bal)));
      return;
    }
    avcSet(bal-price);
    talk("Order placed at "+((s&&s.name)||"the shop")+". "+names+". Paid "+fmt(price)+".");
    cart={};
    paint();
    if(window.SN&&SN.openTasks) SN.openTasks();
  }
  function takeShop(v){ if(!v) return; shop=listed(v); cart={}; setTimeout(function(){ paint(); }, 30); }
  function wrap(){
    if(window.SN && !SN.__orderMenu){
      SN.__orderMenu=true;
      if(SN.selectVendor){ var sv=SN.selectVendor; SN.selectVendor=function(v){ var r=sv.apply(this, arguments); takeShop(v); return r; }; }
      if(SN.startOrder){ var so=SN.startOrder; SN.startOrder=function(v){ var r=so.apply(this, arguments); takeShop(v); return r; }; }
    }
  }
  var live=document.getElementById("sn-live");
  if(live && !live.__snOrderObs){
    live.__snOrderObs=true;
    new MutationObserver(function(){
      if(live.querySelector(".dish.order")) return;
      if(!live.querySelector(".dish")) return;
      var s=listed(currentShop());
      if(s && dishesOf(s).length) paintLive(s);
    }).observe(live,{childList:true,subtree:false});
  }
  var sheet=document.getElementById("sn-sheet");
  if(sheet && !sheet.__snOrderObs){
    sheet.__snOrderObs=true;
    new MutationObserver(function(){
      if(!sheet.classList.contains("on")) return;
      if(sheet.querySelector(".dish.edit")) return;
      if(sheet.querySelector(".dish.order")) return;
      var s=listed(currentShop());
      if(s && dishesOf(s).length) paintSheet(s);
    }).observe(sheet,{childList:true,subtree:true,attributes:true,attributeFilter:["class"]});
  }
  wrap();
  setInterval(wrap, 1000);
  window.SNOrderMenu={paint:paint, dishesOf:dishesOf};
})();
