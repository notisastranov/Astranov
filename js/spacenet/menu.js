/* SpaceNet 4080 — listed shop menu + community suggestions. Loads after app.js. */
(function(){
  function shops(){
    try{ return JSON.parse(localStorage.getItem("sn:shops")||"[]")||[]; }catch(e){ return []; }
  }
  function saveShops(list){
    try{ localStorage.setItem("sn:shops", JSON.stringify(list||[])); }catch(e){}
    if(window.SN&&SN.repaint) SN.repaint();
  }
  function allShops(){
    var net=((window.SNWork&&SNWork.all&&SNWork.all().shops)||[]);
    var seen={}, out=[];
    shops().concat(net).forEach(function(s){
      if(!s||!s.id||seen[s.id]) return;
      seen[s.id]=1; out.push(s);
    });
    return out;
  }
  function listedOf(p){
    if(!p) return null;
    if(p.kind==="shop"&&p.id) return p.tags||p;
    var hit=null;
    allShops().forEach(function(s){
      if(!s||!s.name||!isFinite(+s.lat)) return;
      if(p.id&&s.id===p.id) hit=s;
      else if(!hit && p.name && String(s.name).toLowerCase()===String(p.name).toLowerCase() && window.SN&&SN.km && SN.km(s,p)<0.12) hit=s;
    });
    return hit;
  }
  function writeShop(row){
    if(!row||!row.id) return;
    var list=shops(), i, found=false;
    for(i=0;i<list.length;i++) if(list[i]&&list[i].id===row.id){ list[i]=row; found=true; break; }
    if(!found) list.unshift(row);
    saveShops(list);
    if(window.SNWork&&SNWork.publish) SNWork.publish(row);
  }
  function isAdmin(){ try{ return localStorage.getItem("sn:admin")==="1"; }catch(e){ return false; } }
  function peerId(){
    try{ return localStorage.getItem("sn:peer")||""; }catch(e){ return ""; }
  }
  function canEdit(row){
    if(isAdmin()) return true;
    if(window.SNWork&&SNWork.canEdit) return SNWork.canEdit(row);
    row=row||{};
    if(row.peer && row.peer!=="spacenet" && row.peer===peerId()) return true;
    return shops().some(function(s){ return s&&s.id&&row.id&&s.id===row.id; });
  }
  function esc(s){ return String(s==null?"":s).replace(/[&<>"']/g,function(c){ return ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[c]; }); }
  function talk(t){ if(window.SN&&SN.talk) SN.talk(t); else if(window.SN&&SN.say) SN.say(t); }

  function sheetCard(){
    var sh=document.getElementById("sn-sheet");
    return sh&&sh.querySelector(".card");
  }
  var lastShop=null;
  function currentShop(){
    if(lastShop&&lastShop.id){
      var fresh=allShops().filter(function(s){ return s&&s.id===lastShop.id; })[0];
      if(fresh) lastShop=fresh;
      return lastShop;
    }
    return null;
  }

  function suggestForm(shop){
    var card=sheetCard();
    if(!card||!shop) return;
    card.innerHTML=
      '<button type="button" class="x" data-act="close">✕</button>'+
      '<div class="ttl">Suggest a row</div>'+
      '<div class="sub">'+esc(shop.name||"Shop")+' · the shop approves before clients see it</div>'+
      '<form data-sn-suggest="1">'+
      '<label>Description</label><textarea name="name" rows="2" placeholder="Margherita 30cm" required></textarea>'+
      '<label>AV€</label><input name="price" inputmode="decimal" placeholder="9.00">'+
      '<label>Hours</label><input name="hours" placeholder="10–22">'+
      '<label>Initial stock</label><input name="stock0" inputmode="numeric" placeholder="20">'+
      '<label>Stock left</label><input name="stock" inputmode="numeric" placeholder="20">'+
      '<button type="submit" class="go">SEND SUGGESTION</button>'+
      '<button type="button" class="opt" data-act="back-shop"><b>Back to menu</b></button>'+
      '</form>';
  }

  function paintSuggestBits(shop){
    var card=sheetCard();
    if(!card||!shop) return;
    if(card.querySelector("[data-act=suggest]")) return;
    var pending=(shop.suggestions||[]).filter(function(g){ return g&&g.status!=="rejected"; });
    var html='<button type="button" class="opt" data-act="suggest"><b>Suggest a row</b><span>Anyone can help list this menu. The shop approves.</span></button>';
    if(canEdit(shop)&&pending.length){
      html+='<label>Waiting for the shop</label>';
      pending.forEach(function(g){
        html+='<div class="dish sheet pending"><b>'+esc(g.name)+'</b><span class="px">'+(Number(g.price)||0).toFixed(2)+'</span></div>'+
          '<div class="sn-suggest-acts"><button type="button" class="go" data-act="approve-dish" data-sid="'+esc(g.id)+'">APPROVE</button>'+
          '<button type="button" class="opt" data-act="reject-dish" data-sid="'+esc(g.id)+'"><b>Reject</b></button></div>';
      });
    } else if(pending.length){
      html+='<p class="note">'+pending.length+' suggestion'+(pending.length===1?"":"s")+' waiting for the shop.</p>';
    }
    if(!card.querySelector("[data-act=edit-shop]") && canEdit(shop)){
      html='<button type="button" class="opt" data-act="edit-shop"><b>Edit this menu</b><span>Add rows. Same spreadsheet the client sees.</span></button>'+html;
    }
    var order=card.querySelector('[data-act="order"]');
    var wrap=document.createElement("div");
    wrap.setAttribute("data-sn-menu-extra","1");
    wrap.innerHTML=html;
    if(order&&order.parentNode) order.parentNode.insertBefore(wrap, order.nextSibling);
    else card.appendChild(wrap);
    if(!card.querySelector(".sn-menu-grid") && !(shop.dishes&&shop.dishes.length) && !card.querySelector("pre.menu")){
      var empty=document.createElement("p");
      empty.className="note";
      empty.setAttribute("data-sn-empty","1");
      empty.textContent="No rows yet. Owner or admin lists the menu. Anyone can suggest a row.";
      var extra=card.querySelector("[data-sn-menu-extra]");
      card.insertBefore(empty, extra||card.lastChild);
    }
  }

  function openListed(p){
    var live=listedOf(p);
    if(!live) return false;
    lastShop=live;
    if(window.SNWork&&SNWork.open) SNWork.open(live);
    setTimeout(function(){ paintSuggestBits(live); }, 40);
    return true;
  }

  function bindSheet(){
    var sh=document.getElementById("sn-sheet");
    if(!sh||sh.__snMenu) return;
    sh.__snMenu=true;
    sh.addEventListener("click", function(e){
      var b=e.target.closest("[data-act]");
      if(!b||!sh.contains(b)) return;
      var act=b.getAttribute("data-act");
      var shop=listedOf({id:b.getAttribute("data-shop")})||currentShop();
      if(act==="suggest"){
        shop=shop||currentShop();
        if(shop) suggestForm(shop);
        e.stopPropagation();
        return;
      }
      if(act==="back-shop"){
        if(shop&&window.SNWork) SNWork.open(shop);
        setTimeout(function(){ paintSuggestBits(shop); }, 40);
        e.stopPropagation();
        return;
      }
      if(act==="approve-dish"||act==="reject-dish"){
        if(!shop||!canEdit(shop)){ talk("Only the shop or a SpaceNet admin can approve."); return; }
        var sid=b.getAttribute("data-sid")||"";
        shop.suggestions=(shop.suggestions||[]).filter(function(g){
          if(!g||g.id!==sid) return true;
          if(act==="approve-dish"){
            shop.dishes=shop.dishes||[];
            shop.dishes.push({name:g.name,price:Number(g.price)||0,hours:g.hours||"",stock0:g.stock0,stock:g.stock,photo:g.photo||""});
            shop.menu=(shop.dishes||[]).map(function(d){ return d.name+" — "+d.price; }).join("\n");
            talk((g.name||"Row")+" is on the menu.");
          } else talk("Suggestion dropped.");
          return false;
        });
        writeShop(shop);
        if(window.SNWork) SNWork.open(shop);
        setTimeout(function(){ paintSuggestBits(shop); }, 40);
        e.stopPropagation();
      }
    }, true);
    sh.addEventListener("submit", function(e){
      var form=e.target;
      if(!form||!form.getAttribute("data-sn-suggest")) return;
      e.preventDefault();
      e.stopPropagation();
      var shop=currentShop();
      if(!shop){ talk("Open a listed shop first."); return; }
      var name=String((form.name&&form.name.value)||"").trim();
      var price=Number(String((form.price&&form.price.value)||"").replace(",","."));
      if(!name){ talk("Add a name on the row."); return; }
      shop.suggestions=shop.suggestions||[];
      shop.suggestions.unshift({
        id:"g"+Date.now().toString(36),
        name:name,
        price:price||0,
        hours:String((form.hours&&form.hours.value)||"").trim(),
        stock0:Number((form.stock0&&form.stock0.value)||0),
        stock:Number((form.stock&&form.stock.value)||0),
        by:peerId(),
        t:Date.now(),
        status:"pending"
      });
      writeShop(shop);
      talk("Suggested "+name+". The shop approves before clients see it.");
      if(window.SNWork) SNWork.open(shop);
      setTimeout(function(){ paintSuggestBits(shop); }, 40);
    }, true);
  }

  function hook(){
    if(!window.SN||!window.SNWork) return false;
    if(window.SN.__menu4080) return true;
    window.SN.__menu4080=true;
    bindSheet();
    var run=SN.run;
    SN.run=function(raw){
      var t=String(raw||"").trim();
      var low=t.toLowerCase();
      if(low==="astranov admin"){
        try{ localStorage.setItem("sn:admin","1"); }catch(e){}
        talk("This device is a SpaceNet admin. Tap a listed shop to edit or approve its menu.");
        return;
      }
      if(low==="astranov admin off"){
        try{ localStorage.removeItem("sn:admin"); }catch(e){}
        talk("Admin is off on this device.");
        return;
      }
      return run.apply(this, arguments);
    };
    var openPin=SN.openPinMenu;
    SN.openPinMenu=function(p){
      if(openListed(p)) return;
      return openPin.apply(this, arguments);
    };
    var sel=SN.selectVendor;
    if(sel){
      SN.selectVendor=function(v){
        var live=listedOf(v)||v;
        var out=sel.apply(this, arguments);
        if(live&&live.id&&window.SNWork) {
          SNWork.open(live);
          setTimeout(function(){ paintSuggestBits(live); }, 60);
        }
        return out;
      };
    }
    return true;
  }

  function boot(){
    if(hook()) return;
    var n=0;
    var t=setInterval(function(){
      n++;
      if(hook()||n>80) clearInterval(t);
    }, 50);
  }
  if(document.readyState==="loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
