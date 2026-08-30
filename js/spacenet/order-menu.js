/* SpaceNet order-menu 4083 — client sees the vendor spreadsheet + qty + ORDER. */
(function(){
  var style=document.getElementById("sn-order-css");
  if(!style){
    style=document.createElement("style");
    style.id="sn-order-css";
    style.textContent=
      "#sn-live .dish.order,#sn-sheet .dish.order{grid-template-columns:56px minmax(72px,1.4fr) 58px minmax(56px,.8fr) 44px 44px 96px;min-width:520px}"+ 
      "#sn-live .sn-menu-grid,#sn-sheet .sn-menu-grid,#sn-live{overflow-x:auto;-webkit-overflow-scrolling:touch}"+ 
      "#sn-live .dish.order .qty,#sn-sheet .dish.order .qty{display:flex;align-items:center;justify-content:flex-end;gap:4px}"+ 
      "#sn-live .dish.order .qty button,#sn-sheet .dish.order .qty button{width:28px;height:28px;margin:0;padding:0;border:1px solid rgba(126,233,255,.45);background:rgba(4,16,28,.95);color:#7ee9ff;border-radius:8px;font:800 14px system-ui}"+ 
      "#sn-live .dish.order .qty b,#sn-sheet .dish.order .qty b{min-width:16px;text-align:center;font:800 13px system-ui;color:#e8fbff}"+ 
      "#sn-order-go{display:block;width:100%;height:48px;margin:8px 0 0;border:0;border-radius:12px;background:#d8f6ff;color:#041018;font:800 15px system-ui;letter-spacing:.04em}"+ 
      "#sn-order-go[disabled]{opacity:.4}";
    document.head.appendChild(style);
  }
  var cart={};
  var shop=null;
  function esc(s){ return String(s==null?"":s).replace(/&/g,"&").replace(/</g,"<").replace(/>/g,">").replace(/"/g,"""); }
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
  function qtyOf(it){ return Number(cart[keyOf(it)]||0)||0; }
  function keyOf(it){ return String(it.id||it.name||""); }
  function setQty(it, n){
    var left=it.stock!=null?Number(it.stock):(it.stock0!=null?Number(it.stock0):Infinity);
    n=Math.max(0, Math.round(Number(n)||0));
    if(isFinite(left) && n>left) n=left;
    if(n<=0) delete cart[keyOf(it)];
    else cart[keyOf(it)]=n;
    paint();
  }
  function lines(){
    var s=listed(currentShop());
    return dishesOf(s).map(function(it){ return {it:it, qty:qtyOf(it), price:Number(it.price)||0}; }).filter(function(x){ return x.qty>0; });
  }
  function total(){ return lines().reduce(function(s,x){ return s+x.price*x.qty; },0); }
  function headHtml(){ return '<div class="dish sheet head order"><span>Photo</span><span>Description</span><span>AV€</span><span>Hours</span><span>Initial</span><span>Left</span><span>Qty</span></div>'; }
  function rowHtml(it){
    var init=it.stock0!=null?it.stock0:it.stock;
    var left=it.stock!=null?it.stock:init;
    var q=qtyOf(it);
    var img=it.photo?('<img alt="" src="'+esc(it.photo)+'">'):'<span class="pic">+</span>';
    var dead=isFinite(Number(left)) && Number(left)<=0;
    return '<div class="dish sheet order'+(q?" on":"")+(dead?" dead":"")+'" data-dish="'+esc(keyOf(it))+'">'+img+'<b>'+esc(it.name||it.desc||"")+'</b><span class="px">'+fmt(it.price)+'</span><span class="hrs">'+esc(it.hours||"—")+'</span><span class="st">'+esc(init==null?"":init)+'</span><span class="st">'+esc(left==null?"":left)+'</span><span class="qty"><button type="button" data-act="sub" '+(dead?"disabled":"")+'>−</button><b>'+q+'</b><button type="button" data-act="add" '+(dead?"disabled":"")+'>+</button></span></div>';
  }
  function gridHtml(s){
    var list=dishesOf(s);
    if(!list.length) return '<p class="note">No rows on this spreadsheet yet.</p>';
    return '<div class="sn-menu-grid">'+headHtml()+list.map(rowHtml).join("")+'</div><button type="button" id="sn-order-go" data-act="order-go"'+(total()?" ":" disabled")+'>ORDER · '+fmt(total())+'</button>';
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
        else if(act==="sub"){ e.preventDefault(); e.stopPropagation(); setQty(it, qtyOf(it)-1); }
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
    if(!bag.length){ talk("Set a quantity on a row first."); return; }
    shop=s;
    var price=Math.round(total()*100)/100;
    var bal=avc();
    var names=bag.map(function(x){ return x.qty+"× "+x.it.name; }).join(", ");
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
