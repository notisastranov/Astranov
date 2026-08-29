(function(){
  if(window.__SN_ALIVE && window.SN && window.SN.run) return;
  var VER="4066";
  window.__SN_ALIVE=true;
  try{ if(navigator.vibrate) navigator.vibrate=function(){return false;}; }catch(e){}
  var canvas=document.getElementById("g");
  var cityEl=document.getElementById("city");
  var lineEl=document.getElementById("line");
  var inEl=document.getElementById("in");
  var form=document.getElementById("f");
  var liveEl=document.getElementById("sn-live");
  var menuEl=document.getElementById("sn-menu");
  var pillEl=document.getElementById("sn-pill");
  var menuScale=1;
  var yaw=0.49, pitch=0.63, dist=1.85, spin=0, pitchSpin=0, drag=null, pinch=null, pointers={}, fly=null, drawSig="", tickOn=false;
  var here=null, hereName="", hereAt=0, countryCode="", things={}, vendors=[], selected=null, job=null, currentOffers=[], huntSeq=0, offerSeq=0, locating=null, pendingHunt=null, correctingHere=false, aim=null, tapScreen=null, placeEl=null, awaiting=null, mapBound=false, mapHeld=false;
  var map=null, mapReady=null, hereMark=null, vendorMark=null, listingMark=null, routeLine=null, routeGlow=null, bondGroup=null, aimMark=null, callLine=null, tileLayer=null, mapLayer="dark", lastRoute=null;
  var listening=false, speaking=false, wantEar=false, rec=null, permsTried=false, mindHist=[], paying=false;
  function say(t){ if(lineEl&&t!=null) lineEl.textContent=String(t); packSoon(); }
  function noCoords(t){ return String(t||"").replace(/\b-?\d+\.\d+\s*[NS],?\s*-?\d+\.\d+\s*[EW]\b/gi,"").replace(/\b-?\d{1,3}\.\d+\s*,\s*-?\d{1,3}\.\d+\b/g,"").replace(/\s{2,}/g," ").trim(); }
  function talk(t){ t=noCoords(t); if(!t) return; say(t); stopListen(); speaking=true; try{ if(window.speechSynthesis){ speechSynthesis.cancel(); var u=new SpeechSynthesisUtterance(String(t)); var v=pickVoice(t); if(v) u.voice=v; u.lang=(v&&v.lang)||(/[\u0370-\u03FF]/.test(t)?"el-GR":"en-GB"); u.pitch=0.72; u.rate=0.86; u.volume=1; u.onend=function(){ speaking=false; }; u.onerror=function(){ speaking=false; }; speechSynthesis.speak(u); return; } }catch(e){} speaking=false; }
  var voicePick=null, voiceEl=null;
  function scoreVoice(v, greek){
    var n=((v&&v.name)||"")+" "+((v&&v.lang)||"");
    var s=0;
    if(/male/i.test(n) && !/female/i.test(n)) return -10;
    if(greek){ if(/^el/i.test(v.lang)) s+=8; } else { if(/^en-GB/i.test(v.lang)) s+=6; else if(/^en/i.test(v.lang)) s+=4; }
    if(/uk english female|google uk.*female|samantha|moira|fiona|karen|tessa|zira|hazel|susan|serena|victoria/i.test(n)) s+=10;
    if(/female|woman/i.test(n)) s+=6;
    if(/google/i.test(n)) s+=2;
    if(/natural|neural|premium/i.test(n)) s+=2;
    return s;
  }
  function pickVoice(text){
    var greek=/[\u0370-\u03FF]/.test(text||"");
    try{
      var list=speechSynthesis.getVoices()||[], i, best=null, bestS=-1;
      for(i=0;i<list.length;i++){
        var s=scoreVoice(list[i], greek);
        if(s>bestS){ bestS=s; best=list[i]; }
      }
      if(best && bestS>=0){ if(greek) voiceEl=best; else voicePick=best; return best; }
    }catch(e){}
    return greek?voiceEl:voicePick;
  }
  try{ if(window.speechSynthesis){ speechSynthesis.getVoices(); speechSynthesis.addEventListener("voiceschanged", function(){ voicePick=null; voiceEl=null; pickVoice(""); }); } }catch(e){}
  function menuTitle(){
    if(things.pay||things.reload||things.verify) return "PAY";
    if(currentOffers.length) return "CARRIERS";
    if(selected) return String(selected.name||"PLACE").toUpperCase().slice(0,16);
    if(vendors.length) return "VENDORS";
    return "SPACENET";
  }
  function pending(){ return Object.keys(things).length>0 || (liveEl && liveEl.children.length>0); }
  function openMenu(){
    if(!menuEl) return;
    var ttl=menuEl.querySelector(".ttl");
    if(ttl) ttl.textContent=menuTitle();
    menuEl.classList.add("on");
    if(pillEl) pillEl.classList.remove("on","glow");
    packSoon();
  }
  function minMenu(){
    if(menuEl) menuEl.classList.remove("on");
    if(pillEl){
      if(pending()){
        pillEl.textContent=menuTitle();
        pillEl.classList.add("on","glow");
      } else {
        pillEl.classList.remove("on","glow");
      }
    }
    packSoon();
  }
  function clearNeed(){ things={}; if(liveEl) liveEl.innerHTML=""; if(menuEl) menuEl.classList.remove("on"); if(pillEl) pillEl.classList.remove("on","glow"); packSoon(); }
  function need(spec){
    spec=spec||{};
    var id=spec.id||("m"+Date.now()+Math.random().toString(36).slice(2,6));
    things[id]=spec;
    if(!liveEl) return id;
    var old=liveEl.querySelector('[data-need="'+id+'"]');
    var b=old||document.createElement("button");
    b.type="button";
    b.setAttribute("data-need", id);
    b.textContent=spec.label||id;
    b.onclick=function(){ try{ spec.run(); }catch(e){ talk("That step failed. Try again."); } };
    if(!old) liveEl.appendChild(b);
    openMenu();
    return id;
  }
  var tasksBtn=document.getElementById("sn-tasks-btn");
  var tasksEl=document.getElementById("sn-tasks");
  var tasksList=document.getElementById("sn-tasks-list");
  var cartBtn=document.getElementById("sn-cart-btn");
  var cartEl=document.getElementById("sn-cart");
  var cartList=document.getElementById("sn-cart-list");
  function snFee(n){ return Math.round(Math.max(0, Number(n)||0)*0.03*100)/100; }
  function withSnFee(n){ n=Number(n)||0; return Math.round((n+snFee(n))*100)/100; }
  function bankPlatform(n){
    n=Number(n)||0; if(!n) return;
    try{ localStorage.setItem("sn:platform", String(Math.round((Number(localStorage.getItem("sn:platform")||0)+n)*100)/100)); }catch(e){}
  }
  function platformGet(){ try{ return Math.max(0, Number(localStorage.getItem("sn:platform")||0)); }catch(e){ return 0; } }
  function cartQty(){ if(!job||!job.cart) return 0; return job.cart.reduce(function(s,x){ return s+(Number(x.qty)||1); },0); }
  function goodsSum(){ if(!job||!job.cart) return 0; return job.cart.reduce(function(s,x){ return s+(Number(x.price)||0)*(Number(x.qty)||1); },0); }
  function taskCash(e){
    e=e||liveEscrow();
    if(!e){
      if(job&&Number(job.price)>0) return Number(job.price);
      return cartSum()||0;
    }
    var mine=myListingIds();
    if(e.driver&&mine[e.driver.id]==="driver"){
      var ride=Number(e.ride); if(ride>0) return ride+(e.floor?3:0);
    }
    return Number(e.avc)||0;
  }
  function destPoint(){ return (job&&job.drop)||myDrop()||here; }
  function dropLine(d){ if(!d) return "the client"; return [d.name||d.label||"Client", d.street, d.number, d.floor].filter(Boolean).join(" · ") || ("pin "+Number(d.lat).toFixed(4)); }
  function clientPin(){
    var d=(job&&job.drop)||myDrop();
    if(d&&isFinite(d.lat)) return d;
    if(here&&isFinite(here.lat)) return {id:"you",kind:"drop",secret:true,lat:here.lat,lng:here.lng,name:hereName||"Client",label:"Client"};
    return null;
  }
  function rideKm(){ var a=(job&&job.shop)||selected, b=destPoint(); if(!a||!b||!isFinite(a.lat)||!isFinite(b.lat)) return 1; return Math.max(0.5, km(a,b)); }
  function rideFee(){ return Math.max(1, Math.round(rideKm())); }
  function cartNet(){ var n=goodsSum()+rideFee(); if(job&&job.floor) n+=3; return Math.round(n*100)/100; }
  function cartSum(){ return withSnFee(cartNet()); }
  function paintCartBtn(){
    if(!cartBtn) return;
    var n=cartQty();
    if(!n || (job&&job.status==="paid")){ cartBtn.classList.remove("on","glow"); packSoon(); return; }
    cartBtn.classList.add("on","glow");
    cartBtn.textContent=n>1?("CART "+n):"CART";
    packSoon();
  }
  function hideCart(){ if(cartEl) cartEl.classList.remove("on"); paintCartBtn(); packSoon(); }
  function openCart(){
    if(!cartEl||!cartList) return;
    var rows=job&&job.cart||[];
    if(!rows.length){ hideCart(); return; }
    cartList.innerHTML=rows.map(function(it,i){
      return '<div class="row" data-i="'+i+'"><b>'+String(it.name||"").replace(/[<>]/g,"")+' · '+fmtAve(it.price)+'</b><button type="button" data-act="sub">−</button><span>'+(it.qty||1)+'</span><button type="button" data-act="add">+</button></div>';
    }).join("")+'<label class="floor"><input type="checkbox" id="sn-floor"'+(job.floor?" checked":"")+'> Floor / room service + AV€ 3.00</label><div class="sum">Ride '+rideKm().toFixed(1)+' km · '+fmtAve(rideFee())+' · SpaceNet 3% '+fmtAve(snFee(cartNet()))+' · pay '+fmtAve(cartSum())+'</div><button type="button" class="go" data-act="out">CHECKOUT</button>';
    cartEl.classList.add("on");
    paintCartBtn();
    packSoon();
  }
  function pickDish(it, el){
    var live=listedShopOf(selected);
    if(!live){ talk("Only a listed SpaceNet shop pin can take an order. List it with +."); if(window.SNWork) SNWork.open(selected||aim,"shop"); return; }
    selected=live;
    var left=it.stock!=null?Number(it.stock):Number(it.stock0);
    if(isFinite(left) && left<=0){ talk("None left."); return; }
    if(!job) job={kind:"find",query:(selected&&selected.name)||"order",status:"cart",shop:selected,t:Date.now()};
    job.shop=selected;
    job.drop=myDrop()||job.drop;
    job.cart=job.cart||[];
    var hit=null;
    job.cart.forEach(function(x){ if(x.name===it.name) hit=x; });
    var next=(hit?Number(hit.qty)||1:0)+1;
    if(isFinite(left) && next>left){ talk("Only "+left+" left."); return; }
    if(hit) hit.qty=next;
    else job.cart.push({name:it.name,price:Number(it.price)||0,sample:!!it.sample,qty:1});
    job.price=cartSum();
    job.status="cart";
    if(el) el.classList.add("on");
    openCart();
    talk(it.name+" in the cart. "+fmtAve(job.price)+". "+(isFinite(left)?(left-next)+" left. ":"")+"Checkout when you are ready.");
  }
  function loadTasks(){ try{ return JSON.parse(localStorage.getItem("sn:tasks")||"[]"); }catch(e){ return []; } }
  function saveTasks(list){ try{ localStorage.setItem("sn:tasks", JSON.stringify((list||[]).slice(0,80))); }catch(e){} }
  function jobNext(j){
    if(!j) return "";
    if(j.status==="paid") return "Call the shop and the Astranov agent.";
    if(j.carrier && j.price) return "Pay "+fmtAve(j.price)+".";
    if(j.shop) return "Pick an Astranov Delivery Agent.";
    if(j.query) return "Pick the place.";
    return "Finish this.";
  }
  function derivedTasks(){
    var out=[], perish=job?goodsOf(job.query):null, mine=myListingIds();
    if(window.SNWork){
    var all=SNWork.all();
    (all.shops||[]).forEach(function(s){
      if(!s||!s.id) return;
      if(s.hours && (s.menu || (s.menuPhotos&&s.menuPhotos.length))) return;
      out.push({id:"list-shop-"+s.id, role:"vendor", title:s.name||"Shop", next:"Finish hours and menu.", status:"open", listing:s, t:s.t||Date.now(), auto:1});
    });
    (all.drivers||[]).forEach(function(d){
      if(!d||!d.id) return;
      if(isFinite(d.lat) && d.hours && (d.vehicles||d.phone)) return;
      out.push({id:"list-driver-"+d.id, role:"driver", title:d.name||"Agent base", next:"Finish starting location, vehicles, working time.", status:"open", listing:d, t:d.t||Date.now(), auto:1});
    });
    (all.drops||[]).forEach(function(d){
      if(!d||!d.id) return;
      if(d.phone || d.doorbell || d.bell || d.photo || d.shot) return;
      out.push({id:"list-drop-"+d.id, role:"user", title:d.label||"Drop", next:"Add phone or doorbell.", status:"open", listing:d, t:d.t||Date.now(), auto:1});
    });
    }
    loadEscrow().forEach(function(e){
      if(!e||!e.held) return;
      var age=Math.max(0, Math.round((Date.now()-e.at)/60000));
      var title=e.query||"Order";
      var shop=(e.shop&&e.shop.name)||"Shop";
      var base=(e.driver&&e.driver.name)||"Astranov agent";
      var ownShop=e.shop&&e.shop.id&&mine[e.shop.id]==="shop";
      var ownAgent=e.driver&&e.driver.id&&mine[e.driver.id]==="driver";
      var st=stateLabel(e), eta=etaMin(e);
      var userNext=st+(eta?(" · about "+eta+" min"):"");
      if(e.flag==="hold" && e.status==="paid"){
        out.push({id:"just-"+e.id+"-user", role:"user", title:title, next:"Hold is up. Take the credit back or wait.", status:"open", escrowId:e.id, perish:!!e.strict, t:e.at, auto:1});
      }
      if(e.status==="paid"||e.status==="picked"||e.status==="offer"){
        if(ownShop) out.push({id:"stg-"+e.id+"-ready", role:"vendor", title:shop, next:"READY — food is made.", status:"open", escrowId:e.id, perish:!!e.strict, t:e.at, auto:1});
        if(ownAgent) out.push({id:"stg-"+e.id+"-offer", role:"driver", title:base, next:"OFFER — client on your map. "+dropLine(e.drop)+".", status:"open", escrowId:e.id, perish:!!e.strict, t:e.at, auto:1});
        out.push({id:"stg-"+e.id+"-wait", role:"user", title:title, next:userNext, status:"open", escrowId:e.id, perish:!!e.strict, hold:e.holdMin, t:e.at, auto:1, eta:eta, state:st});
      } else if(e.status==="boxed"){
        if(ownAgent) out.push({id:"stg-"+e.id+"-got", role:"driver", title:base, next:"GOT IT — take from the shop.", status:"open", escrowId:e.id, t:e.at, auto:1});
        out.push({id:"stg-"+e.id+"-wait", role:"user", title:title, next:userNext, status:"open", escrowId:e.id, t:e.at, auto:1, eta:eta, state:st});
      } else if(e.status==="with_agent"){
        if(ownAgent) out.push({id:"stg-"+e.id+"-way", role:"driver", title:base, next:"ON THE WAY.", status:"open", escrowId:e.id, t:e.at, auto:1});
        out.push({id:"stg-"+e.id+"-wait", role:"user", title:title, next:userNext, status:"open", escrowId:e.id, t:e.at, auto:1, eta:eta, state:st});
      } else if(e.status==="moving"){
        if(ownAgent) out.push({id:"stg-"+e.id+"-door", role:"driver", title:base, next:"AT THE DOOR.", status:"open", escrowId:e.id, t:e.at, auto:1});
        out.push({id:"stg-"+e.id+"-wait", role:"user", title:title, next:userNext, status:"open", escrowId:e.id, t:e.at, auto:1, eta:eta, state:st});
      } else if(e.status==="door" || e.status==="handed" || e.flag==="handed"){
        var left=doorLeft(e);
        if(ownAgent && left<=0) out.push({id:"stg-"+e.id+"-waitdoor", role:"driver", title:base, next:"NEXT ORDER — missed goods return to vendor at end of route.", status:"open", escrowId:e.id, t:e.at, auto:1});
        out.push({id:"stg-"+e.id+"-have", role:"user", title:title, next:userNext+(left>0?(" · "+Math.ceil(left)+" min to pick up"):" · Agent is leaving"), status:"open", escrowId:e.id, t:e.at, auto:1, eta:eta, state:st});
      } else if(e.status==="carry_back"){
        if(ownAgent) out.push({id:"stg-"+e.id+"-end", role:"driver", title:base, next:"END ROUTE — return missed goods to the vendor.", status:"open", escrowId:e.id, t:e.at, auto:1});
        out.push({id:"stg-"+e.id+"-wait", role:"user", title:title, next:st, status:"open", escrowId:e.id, t:e.at, auto:1, state:st});
      }
    });
    return out;
  }
  function rankTasks(list){
    list.forEach(function(t){
      var p=50;
      if(t.status==="done") p=90;
      if(t.role==="user" && /Pay |Wait for a real/.test(t.next||"")) p=12;
      if(t.perish) p=6;
      if(t.id&&t.id.indexOf("just-")===0) p=2;
      if(t.role==="vendor") p=Math.min(p,28);
      if(t.role==="driver") p=Math.min(p,30);
      if(t.boost!=null) p=Math.min(p, Number(t.boost));
      t.pri=p;
    });
    list.sort(function(a,b){ return (a.pri-b.pri) || ((a.t||0)-(b.t||0)); });
  }
  function paintTasksBtn(){
    if(!tasksBtn) return;
    var n=loadTasks().filter(function(t){ return t.status!=="done"; }).length;
    var open=tasksEl&&tasksEl.classList.contains("on");
    if(!n || open){ tasksBtn.classList.remove("on","glow"); packSoon(); return; }
    tasksBtn.classList.add("on","glow");
    tasksBtn.textContent=n>1?("TASKS "+n):"TASKS";
    packSoon();
  }
  function liveEscrow(){
    if(job&&job.escrowId){ var e=escrowOf(job.escrowId); if(e) return e; }
    var list=loadEscrow(), i;
    for(i=0;i<list.length;i++) if(list[i]&&list[i].held) return list[i];
    return null;
  }
  function stageList(){ return ["paid","boxed","with_agent","moving","door","verified"]; }
  function stageOf(e){ if(!e) return "none"; if(!e.held && (e.status==="released"||e.status==="done")) return "verified"; if(e.status==="picked") return "paid"; if(e.status==="handed") return "door"; return e.status||"paid"; }
  function stagePct(e){ var s=stageList(), cur=stageOf(e), i=s.indexOf(cur); if(i<0) i=0; return Math.round(((i+1)/s.length)*100); }
  function stateLabel(e){
    var s=stageOf(e);
    if(s==="paid"||s==="picked") return "On the making by vendor";
    if(s==="boxed") return "Waiting delivery agent";
    if(s==="with_agent") return "Delivered to agent";
    if(s==="moving") return "On the way";
    if(s==="door"||s==="handed") return (e&&e.floor)?"Room service · waiting at your door":"Waiting at your doorstep";
    if(s==="carry_back") return "Agent left for the next order. Goods return to the vendor at the end of the route";
    if(s==="back_vendor"||s==="returned") return "Missed goods back at the shop";
    if(s==="verified") return "Delivered";
    return s||"";
  }
  function etaMin(e){
    var ride=Number((e&&e.eta)||(job&&job.carrier&&job.carrier.eta)||18);
    var s=stageOf(e);
    if(s==="paid"||s==="picked") return 12+ride;
    if(s==="boxed"||s==="with_agent") return ride;
    if(s==="moving") return Math.max(4, Math.round(ride*0.45));
    if(s==="door"||s==="handed") return 1;
    return 0;
  }
  function ladderHtml(e){
    var s=["Making","Agent","With agent","On the way","Door","Done"], keys=stageList(), cur=stageOf(e), ix=keys.indexOf(cur);
    return '<div class="ladder">'+s.map(function(st,i){ var cls=i<ix?"done":(i===ix?"now":""); return '<i class="'+cls+'">'+st+'</i>'; }).join("")+'</div><div class="eta">'+(etaMin(e)?("About "+etaMin(e)+" min"):"")+' · '+stateLabel(e)+'</div>';
  }
  function contactOf(t){
    t=t||{};
    return {
      phone: t.phone||t["contact:phone"]||t.mobile||t["contact:mobile"]||"",
      email: t.email||t["contact:email"]||"",
      web: t.website||t["contact:website"]||t.url||""
    };
  }
  var moveSpeed=0, moveAt=0, moveWatch=0;
  function watchMove(){
    if(!navigator.geolocation || moveWatch) return;
    try{
      moveWatch=navigator.geolocation.watchPosition(function(p){
        moveSpeed=Number(p.coords.speed); if(!isFinite(moveSpeed)) moveSpeed=0;
        moveAt=Date.now();
      }, function(){}, {enableHighAccuracy:true, maximumAge:2500, timeout:20000});
    }catch(e){}
  }
  function isMoving(){
    if(moveAt && Date.now()-moveAt<20000 && moveSpeed>=2) return true;
    var e=liveEscrow();
    if(e && e.status==="moving" && !(moveAt && moveSpeed<0.8)) return true;
    return false;
  }
  function shopPeerOf(){
    var s=(job&&job.shop)||(liveEscrow()&&liveEscrow().shop);
    if(s&&s.peer) return s.peer;
    if(!s||!window.SNWork) return "";
    var hit="";
    (SNWork.all().shops||[]).forEach(function(r){ if(r&&((s.id&&r.id===s.id)||(s.name&&r.name===s.name))) hit=r.peer||hit; });
    return hit;
  }
  function agentPeerOf(){
    var e=liveEscrow(), o=job&&job.carrier, d=o&&driverRow(o.id);
    if(d&&d.peer) return d.peer;
    if(e&&e.driver&&e.driver.peer) return e.driver.peer;
    if(o&&o.peer) return o.peer;
    if(!window.SNWork||!e||!e.driver) return "";
    var hit="";
    (SNWork.all().drivers||[]).forEach(function(r){ if(r&&e.driver&&r.id===e.driver.id) hit=r.peer||""; });
    return hit;
  }
  function offerJobVideo(){
    if(!window.SNWork||!SNWork.startVideo) return;
    var me=SNWork.peerId(), e=liveEscrow(), mine=myListingIds();
    var shopP=shopPeerOf(), agentP=agentPeerOf(), clientP=(job&&job.customerPeer)||(e&&e.customerPeer)||"";
    var asDriver=!!(e&&e.driver&&mine[e.driver.id]==="driver");
    var asVendor=!!(e&&e.shop&&mine[e.shop.id]==="shop");
    if(asDriver){
      if(isMoving()) return;
      if(clientP && clientP!==me) need({id:"vidc",label:"VIDEO CLIENT",run:function(){ SNWork.startVideo(clientP,"",{role:"agent",job:e&&e.id}); }});
      return;
    }
    if(asVendor){
      if(clientP && clientP!==me) need({id:"vidc",label:"VIDEO CLIENT",run:function(){ SNWork.startVideo(clientP,"",{role:"vendor",job:e&&e.id}); }});
      if(agentP && agentP!==me) need({id:"vida",label:"VIDEO AGENT",run:function(){ SNWork.startVideo(agentP,"",{role:"vendor",job:e&&e.id}); }});
      return;
    }
    if(shopP && shopP!==me) need({id:"vidshop",label:"VIDEO SHOP",run:function(){ SNWork.startVideo(shopP,"",{role:"client",job:e&&e.id}); }});
    if(agentP && agentP!==me) need({id:"vidagent",label:"VIDEO AGENT",run:function(){ SNWork.startVideo(agentP,"",{role:"client",job:e&&e.id}); }});
  }
  function officialTel(v){
    if(!v) return "";
    var t=v.tags||v;
    var raw=String(t.phone||t["contact:phone"]||t.mobile||t["contact:mobile"]||t.tel||v.phone||"").split(/[;,]/)[0].trim();
    var d=raw.replace(/[^\d]/g,"");
    if(d.length<10) return "";
    return raw;
  }
  function addContactBtns(v){
    var tel=officialTel(v);
    if(tel) need({id:"tel",label:"CALL "+tel.replace(/[^\d+ ]/g,"").slice(0,18),run:function(){ location.href="tel:"+tel.replace(/[^\d+]/g,""); }});
    return {phone:tel,email:"",web:""};
  }
  function fetchContacts(v){
    if(!v||!isFinite(v.lat)) return Promise.resolve(v&&v.tags||{});
    var got=Object.assign({}, v.tags||{});
    function take(t){ if(!t) return; Object.keys(t).forEach(function(k){ if(/phone|mobile|email|website|url|opening_hours|cuisine|facebook|instagram/i.test(k) && t[k] && !got[k]) got[k]=t[k]; }); }
    take(v.tags);
    var jobs=[];
    jobs.push(fetchJson("https://nominatim.openstreetmap.org/reverse?format=jsonv2&extratags=1&namedetails=1&zoom=18&lat="+v.lat+"&lon="+v.lng,{headers:{Accept:"application/json","Accept-Language":"en"}},7000).then(function(j){ take(j&&j.extratags); take(j&&j.address); }).catch(function(){}));
    var name=escOverpass(v.name||"");
    if(name){
      var q='[out:json][timeout:6];nwr(around:90,'+v.lat+','+v.lng+')["name"~"'+name+'",i];out tags center 8;';
      jobs.push(fetchJson("https://overpass.kumi.systems/api/interpreter?data="+encodeURIComponent(q),{headers:{Accept:"application/json"}},5000).then(function(j){ (j.elements||[]).forEach(function(el){ take(el.tags); }); }).catch(function(){}));
    }
    var oid=got.osm_id||got.osmid, ot=String(got.osm_type||got.osmtype||"N")[0].toUpperCase();
    if(oid){ if(ot!=="N"&&ot!=="W"&&ot!=="R") ot="N"; jobs.push(fetchJson("https://nominatim.openstreetmap.org/details.php?osmtype="+ot+"&osmid="+oid+"&format=json",{headers:{Accept:"application/json"}},7000).then(function(j){ take(j&&j.extratags); take(j&&j.namedetails); }).catch(function(){})); }
    return Promise.all(jobs).then(function(){ v.tags=got; return enrichPlace(v); });
  }
  function crawlKey(v){ return "sn:crawl:"+String((v&&v.id)||(v&&v.name)||""); }
  function loadCrawl(v){ try{ return JSON.parse(localStorage.getItem(crawlKey(v))||"null"); }catch(e){ return null; } }
  function saveCrawl(v, row){ try{ localStorage.setItem(crawlKey(v), JSON.stringify(row)); }catch(e){} }
  function applyCrawl(v, row){
    if(!v||!row) return;
    v.tags=v.tags||{};
    if(row.phone && !v.tags.phone) v.tags.phone=row.phone;
    if(row.email && !v.tags.email) v.tags.email=row.email;
    if(row.web && !v.tags.website && !v.tags["contact:website"]) v.tags.website=row.web;
    v.crawlItems=row.items||[];
  }
  function enrichPlace(v){
    if(!v) return Promise.resolve({});
    var cached=loadCrawl(v);
    if(cached && Date.now()-(cached.t||0)<86400000){ applyCrawl(v, cached); return Promise.resolve(v.tags); }
    var c=contactOf(v.tags);
    var ctl=window.AbortController?new AbortController():null;
    var to=ctl&&setTimeout(function(){ try{ctl.abort();}catch(e){} }, 12000);
    return fetch("/api/place",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({name:v.name||"",place:hereName||"",website:c.web||v.tags.website||v.tags["contact:website"]||""}),signal:ctl&&ctl.signal}).then(function(r){ return r.json(); }).then(function(j){
      if(to) clearTimeout(to);
      if(!j||!j.ok) return v.tags;
      var row={t:Date.now(),phone:j.phone||"",email:j.email||"",web:j.web||"",items:j.items||[],via:j.via||""};
      saveCrawl(v, row); applyCrawl(v, row); return v.tags;
    }).catch(function(){ if(to) clearTimeout(to); return v.tags; });
  }
  function openTaskDetail(id){
    openTaskId=id||openTaskId;
    var t=loadTasks().filter(function(x){ return x.id===openTaskId; })[0];
    var e=t&&t.escrowId?escrowOf(t.escrowId):liveEscrow();
    openTasks();
    renderTaskList();
    if(e&&e.shop){
      var v=selected&&selected.id===e.shop.id?selected:e.shop;
      selected=v;
      fetchContacts(v).then(function(){
        clearNeed();
        if(menuEl){ var ttl=menuEl.querySelector(".ttl"); if(ttl) ttl.textContent=String(v.name||"JOB").toUpperCase().slice(0,22); }
        var c=addContactBtns(v);
        offerCalls();
        offerJobVideo();
        if(e){
          var cur=stageOf(e);
          need({id:"next",label:(cur==="verified"?"DONE":("NEXT · "+cur.toUpperCase())),run:function(){ if(t) goTask(t.id); }});
        }
        if(!c.phone) talk((v.name||"Shop")+". No official phone published.");
        else talk((v.name||"Shop")+". "+stagePct(e)+"% · "+stageOf(e)+(c.phone?". Tap CALL.":"."));
      });
    }
  }
  function openJobFromMap(){
    var e=liveEscrow();
    var list=loadTasks().filter(function(t){ return e && t.escrowId===e.id; });
    openTaskId=list[0]?list[0].id:(e?"stg-"+e.id+"-box":"");
    openTaskDetail(openTaskId);
  }
  function renderTaskList(){
    if(!tasksList) return;
    var list=loadTasks().filter(function(t){ return t.status!=="done"; });
    if(!list.length){ tasksList.innerHTML='<p class="note">Nothing on you.</p>'; return; }
    tasksList.innerHTML=list.map(function(t){
      var e=t.escrowId?escrowOf(t.escrowId):null;
      var open=t.id===openTaskId;
      var extra=open&&e?ladderHtml(e):"";
      var cash=e?taskCash(e):0;
      var money=cash?('<div class="cash-glow">'+fmtAve(cash,true)+'</div>'):"";
      var btns="";
      if(t.role==="vendor" && /-ready$/.test(t.id)) btns='<div class="row"><button type="button" data-act="ready">READY</button></div>';
      else if(t.role==="driver" && /-got$/.test(t.id)) btns='<div class="row"><button type="button" data-act="got">GOT IT</button></div>';
      else if(t.role==="driver" && /-way$/.test(t.id)) btns='<div class="row"><button type="button" data-act="way">ON THE WAY</button></div>';
      else if(t.role==="driver" && /-door$/.test(t.id)) btns='<div class="row"><button type="button" data-act="door">AT THE DOOR</button></div>';
      else if(t.role==="driver" && /-waitdoor$/.test(t.id)) btns='<div class="row"><button type="button" data-act="leave">NEXT ORDER</button></div>';
      else if(t.role==="driver" && /-end$/.test(t.id)) btns='<div class="row"><button type="button" data-act="end">END ROUTE</button></div>';
      else if(/-have$/.test(t.id)) btns='<div class="row"><button type="button" data-act="have">I HAVE IT</button></div>';
      else if(t.listing) btns='<div class="row"><button type="button" data-act="go">OPEN</button></div>';
      return '<div class="task'+(open?" open":"")+'" data-id="'+t.id+'">'+money+'<b>'+String(t.title||"Task").replace(/[<>]/g,"")+'</b><span>'+String(t.next||"")+'</span>'+(t.eta?('<div class="eta">About '+t.eta+' min</div>'):"")+extra+btns+'</div>';
    }).join("");
  }
  function openTasks(){ if(!tasksEl) return; syncTasks(); tasksEl.classList.add("on"); renderTaskList(); paintTasksBtn(); setTimeout(pack,40); }
  function hideTasks(){ if(tasksEl) tasksEl.classList.remove("on"); paintTasksBtn(); packSoon(); }
  function toggleTasks(){ if(tasksEl&&tasksEl.classList.contains("on")) hideTasks(); else openTasks(); }
  function goTask(id){
    var t=loadTasks().filter(function(x){ return x.id===id; })[0];
    if(!t) return;
    hideTasks();
    if(t.id==="job-live"){
      if(job&&job.price && job.status!=="paid") return offerPay(job.price);
      if(job&&job.shop && !job.how) return selectVendor(job.shop);
      if(job&&job.query && !job.shop) return hunt(job.query);
      talk(t.next||"This order is waiting on a real associate.");
      return;
    }
    if(t.listing && window.SNWork) return SNWork.open(t.listing);
    if(t.escrowId){
      if(/-pick$/.test(t.id) || /-vendor$/.test(t.id)) return markStage(t.escrowId, "picked");
      if(/-box$/.test(t.id)) return markStage(t.escrowId, "boxed");
      if(/-move$/.test(t.id)) return markStage(t.escrowId, "moving");
      if(/-hand$/.test(t.id)) return markHanded(t.escrowId);
      if(/-verify$/.test(t.id)) return settleVerify(t.escrowId);
      if(/-user$/.test(t.id)) return settleRefund(t.escrowId, "You asked for the credit back. Shop had not picked.");
      if(/-wait$/.test(t.id)){ talk(t.next); return; }
      talk(t.next||t.title);
      return;
    }
    talk(t.next||t.title);
  }
  function askDispute(id){
    var t=loadTasks().filter(function(x){ return x.id===id; })[0];
    if(!t||!t.escrowId) return;
    hideTasks();
    awaiting={kind:"justice", id:t.escrowId};
    if(inEl){ inEl.value=""; inEl.placeholder="What went wrong?"; try{ inEl.focus(); }catch(e){} }
    talk("Say what went wrong. I settle from clocks and the listing. I will not invent a GPS trace.");
  }
  function askProblem(id){
    var t=loadTasks().filter(function(x){ return x.id===id; })[0];
    if(!t) return;
    awaiting={kind:"priority", id:id};
    if(inEl){ inEl.value=""; inEl.placeholder="What's the real difficulty?"; try{ inEl.focus(); }catch(e){} }
    talk("Say the real bind. I'll move it only if it's an emergency — not a preference.");
  }
  function bumpTask(id, ok, say){
    var list=loadTasks(), t=null, i;
    for(i=0;i<list.length;i++) if(list[i].id===id) t=list[i];
    if(!t){ talk(say||"That task is gone."); return; }
    t.ask={reason:"", t:Date.now(), state: ok?"ok":"no"};
    if(ok){ t.boost=1; talk(say||("Moved up: "+t.title+". Only because the bind is real.")); }
    else { t.boost=null; talk(say||"No. That would be jumping the queue for you. I won't."); }
    rankTasks(list); saveTasks(list); renderTaskList(); paintTasksBtn();
  }
  function syncTasks(){
    var old=loadTasks(), by={};
    old.forEach(function(t){ by[t.id]=t; });
    var next=derivedTasks().map(function(t){
      var prev=by[t.id];
      if(prev){ if(prev.boost!=null) t.boost=prev.boost; if(prev.ask) t.ask=prev.ask; }
      return t;
    });
    rankTasks(next); saveTasks(next); paintTasksBtn();
    if(tasksEl&&tasksEl.classList.contains("on")) renderTaskList();
    if(map&&window.L){ drawBonds(); paintMapMarks(window.L, selected); }
    if(window.SNWork&&SNWork.pull && myListingIds() && Object.keys(myListingIds()).some(function(id){ return myListingIds()[id]==="driver"; })) SNWork.pull(here||aim);
  }
  function loadEscrow(){ try{ return JSON.parse(localStorage.getItem("sn:escrow")||"[]"); }catch(e){ return []; } }
  function saveEscrow(list){ try{ localStorage.setItem("sn:escrow", JSON.stringify((list||[]).slice(0,40))); }catch(e){} }
  function escrowOf(id){ var list=loadEscrow(), i; for(i=0;i<list.length;i++) if(list[i].id===id) return list[i]; return null; }
  function putEscrow(row, silent){ var list=loadEscrow(), i, found=false; for(i=0;i<list.length;i++) if(list[i].id===row.id){ list[i]=row; found=true; break; } if(!found) list.unshift(row); saveEscrow(list); if(!silent) publishJob(row); }
  function publishJob(e){
    if(!e||!e.id) return;
    var row={id:e.id,kind:"job",lat:Number(e.lat)||(e.shop&&e.shop.lat)||(here&&here.lat)||0,lng:Number(e.lng)||(e.shop&&e.shop.lng)||(here&&here.lng)||0,name:e.query||"job",query:e.query,avc:e.avc,held:e.held,status:e.status,how:e.how,shop:e.shop,driver:e.driver,holdMin:e.holdMin,flag:e.flag,strict:e.strict,t:e.at};
    fetch("/api/space",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({row:row})}).catch(function(){});
  }
  function myListingIds(){
    var ids={}, all=window.SNWork&&SNWork.all&&SNWork.all();
    if(!all) return ids;
    (all.shops||[]).forEach(function(s){ if(s&&s.id) ids[s.id]="shop"; });
    (all.drivers||[]).forEach(function(d){ if(d&&d.id) ids[d.id]="driver"; });
    (all.drops||[]).forEach(function(d){ if(d&&d.id) ids[d.id]="drop"; });
    return ids;
  }
  function payRole(e, role, n){
    if(!e||!n) return;
    e.paidOut=e.paidOut||{};
    if(e.paidOut[role]) return;
    e.paidOut[role]=true;
    avcAdd(n);
    creditEarned(role==="vendor"?(e.shop&&e.shop.id)||"vendor":(e.driver&&e.driver.id)||"driver", n);
  }
  function takeAvc(n){ n=Math.max(0, Number(n)||0); if(!n) return 0; var fee=snFee(n), total=n+fee, bal=avcGet(), take=Math.min(bal, total); if(take){ avcSet(bal-take); if(fee) bankPlatform(Math.min(fee, take)); } return take; }
  function routeFee(e){ return Math.max(3, Math.round(Number(e&&e.eta)||12)); }
  function doorLeft(e){
    if(!e) return 0;
    var t0=(e.evidence&&(e.evidence.doorAt||e.evidence.handedAt))||0;
    if(!t0) return 3;
    return Math.max(0, 3-(Date.now()-t0)/60000);
  }
  function agentJobs(agentId, except){
    if(!agentId) return [];
    return loadEscrow().filter(function(x){
      return x&&x.held&&x.id!==except&&x.driver&&x.driver.id===agentId&&/boxed|with_agent|moving|door/.test(x.status||"");
    });
  }
  function goodsBack(id){
    var e=escrowOf(id); if(!e||!e.held) return;
    var route=routeFee(e);
    var got=takeAvc(route);
    e.returnAvc=(Number(e.returnAvc)||0)+got;
    e.returnOwed=(Number(e.returnOwed)||0)+(route-got);
    e.status="back_vendor";
    var fee=Number(e.fee)||snFee(e.avc);
    var rest=Math.max(0, e.avc-fee);
    var half=Math.round(rest*0.5*100)/100;
    settle(id, {customer:0, vendor:half, driver:Math.max(0,rest-half), platform:fee}, "Missed goods back at the shop. Return trip "+fmtAve(route)+". No refund. SpaceNet 3% stands.");
  }
  function flushCarry(agentId, except){
    if(!agentId) return;
    if(agentJobs(agentId, except).length) return;
    loadEscrow().forEach(function(x){
      if(x&&x.held&&x.status==="carry_back"&&x.driver&&x.driver.id===agentId) goodsBack(x.id);
    });
  }
  function agentLeave(id){
    var e=escrowOf(id); if(!e||!e.held) return;
    if(!(Number(e.delayAvc)>0)){ var got=takeAvc(3); e.delayAvc=got; e.delayOwed=3-got; }
    var more=agentJobs(e.driver&&e.driver.id, e.id);
    if(more.length){
      e.status="carry_back";
      putEscrow(e); syncTasks(); needTick();
      talk("3 minutes is up. Agent goes to the next order. Missed goods return to the vendor at the end of the route. No refund.");
    } else goodsBack(e.id);
  }
  function payoutIfMine(e){
    if(!e||!e.split) return;
    var ids=myListingIds();
    if(e.shop&&e.shop.id&&ids[e.shop.id]==="shop") payRole(e,"vendor", Number(e.split.vendor)||0);
    if(e.driver&&e.driver.id&&ids[e.driver.id]==="driver"){
      payRole(e,"driver", Number(e.split.driver)||0);
      var extra=(Number(e.delayAvc)||0)+(Number(e.returnAvc)||0);
      e.paidOut=e.paidOut||{};
      if(extra && !e.paidOut.extra){ e.paidOut.extra=true; avcAdd(extra); }
    }
  }
  function ingestJobs(list){
    var dirty=false;
    var order={paid:0,picked:1,boxed:2,with_agent:3,moving:4,door:5,handed:5,carry_back:6,back_vendor:7,returned:7,released:8,done:8};
    (list||[]).forEach(function(j){
      if(!j||!j.id) return;
      if(j.drop){
        var peer=window.SNWork&&SNWork.peerId&&SNWork.peerId();
        var mine=(j.customerPeer&&j.customerPeer===peer)||(j.driver&&j.driver.peer===peer)||(j.driver&&(SNWork.all().drivers||[]).some(function(d){ return d&&d.id===j.driver.id; }));
        if(!mine) delete j.drop;
      }
      var cur=escrowOf(j.id);
      if(!cur){
        putEscrow(j, true); dirty=true; cur=j;
        var mine=myListingIds();
        if(j.driver&&mine[j.driver.id]==="driver"&&j.drop&&isFinite(j.drop.lat)){
          talk("Offer. "+fmtAve(Number(j.ride)||Number(j.avc)||0,true)+" on your map. Client: "+dropLine(j.drop)+".");
          openTasks();
          if(viewLevel()!=="city") showCity(j.drop);
          else if(map&&map.flyTo) map.flyTo([j.drop.lat,j.drop.lng], 16, {duration:0.8});
        }
      }
      else if((order[j.status]||0)>(order[cur.status]||0)){ cur=Object.assign({}, cur, j); putEscrow(cur, true); dirty=true; }
      if(cur && (cur.status==="released"||cur.status==="done") && cur.split){ payoutIfMine(cur); putEscrow(cur, true); }
    });
    if(dirty) syncTasks();
  }
  function creditEarned(who, n){ if(!who||!n) return; try{ var e=JSON.parse(localStorage.getItem("sn:earned")||"{}"); e[who]=(Number(e[who])||0)+Number(n); localStorage.setItem("sn:earned", JSON.stringify(e)); }catch(x){} }
  function holdMinOf(j){ var g=goodsOf(j&&j.query); return Math.max(8, Number(g&&g.hold)||40); }
  function openEscrow(price){
    var g=goodsOf(job&&job.query);
    var ride=rideFee(), goods=Math.round(goodsSum()*100)/100, net=cartNet(), fee=snFee(net);
    var row={id:"e"+(Date.now().toString(36)), kind:"job", avc:Number(price||0), fee:fee, held:true, status:"paid", at:Date.now(), holdMin:holdMinOf(job), strict:!!(g&&g.strict), query:(job&&job.query)||"", how:"now", floor:!!(job&&job.floor), eta:Number(job&&job.carrier&&job.carrier.eta)||Math.max(8, Math.round(rideKm()*3)), cart:job&&job.cart||[], ride:ride, goods:goods, km:rideKm(), customerPeer:window.SNWork&&SNWork.peerId?SNWork.peerId():"", drop:job&&job.drop?{id:job.drop.id,name:job.drop.label||job.drop.name,lat:job.drop.lat,lng:job.drop.lng,phone:job.drop.phone||"",photo:job.drop.photo||""}:null, shop:job&&job.shop?{id:job.shop.id,name:job.shop.name,lat:job.shop.lat,lng:job.shop.lng,phone:job.shop.phone||telOf(job.shop),peer:job.shop.peer||shopPeerOf()}:null, driver:job&&job.carrier&&(job.carrier.agent||job.carrier.driver)?{id:job.carrier.id,name:job.carrier.name,phone:job.carrier.phone||"",peer:job.carrier.peer||agentPeerOf()}:null, flag:"", evidence:{paidAt:Date.now()}, lat:(job&&job.shop&&job.shop.lat)||(here&&here.lat)||0, lng:(job&&job.shop&&job.shop.lng)||(here&&here.lng)||0, name:(job&&job.query)||"job"};
    putEscrow(row); if(job) job.escrowId=row.id; return row;
  }
  function settle(id, split, reason){
    var e=escrowOf(id); if(!e||!e.held) return;
    split=split||{}; var c=Math.max(0, Number(split.customer)||0), v=Math.max(0, Number(split.vendor)||0), d=Math.max(0, Number(split.driver)||0), plat=Math.max(0, Number(split.platform)||0);
    var sum=c+v+d+plat;
    if(sum<e.avc){
      if(c>0 && v===0 && d===0) c+=(e.avc-sum);
      else plat+=(e.avc-sum);
    }
    if(c) avcAdd(c);
    if(plat) bankPlatform(plat);
    e.held=false; e.status="released"; e.split={customer:c,vendor:v,driver:d,platform:plat}; e.reason=reason||""; e.flag="";
    payoutIfMine(e);
    putEscrow(e);
    if(job&&job.escrowId===id) job.status="done";
    syncTasks();
    talk(reason||("Settled. You "+c.toFixed(2)+", shop "+v.toFixed(2)+", driver "+d.toFixed(2)+", SpaceNet "+plat.toFixed(2)+"."));
    flushCarry(e.driver&&e.driver.id, e.id);
  }
  function settleRefund(id, reason){ var e=escrowOf(id); if(!e) return; settle(id, {customer:e.avc, vendor:0, driver:0, platform:0}, reason||"Full credit back. SpaceNet takes none of a failed job."); }
  function settleVerify(id){
    var e=escrowOf(id); if(!e) return;
    var goods=Number(e.goods); if(!goods) goods=Math.round(e.avc*0.5*100)/100;
    var ride=Number(e.ride); if(!ride) ride=Math.max(0, Math.round((e.avc-goods)*100)/100);
    if(e.floor) ride+=3;
    var fee=Number(e.fee); if(!fee) fee=snFee(goods+ride);
    settle(id, {customer:0, vendor:goods, driver:ride, platform:fee}, "Verified. Shop got the goods. Agent got the ride. SpaceNet 3% "+fmtAve(fee)+".");
  }
  function markStage(id, status){
    var e=escrowOf(id); if(!e||!e.held) return;
    e.status=status; e.evidence=e.evidence||{}; e.evidence[status+"At"]=Date.now();
    if(status==="door"){ e.flag="handed"; e.evidence.doorAt=e.evidence.doorAt||Date.now(); e.evidence.handedAt=e.evidence.handedAt||Date.now(); e.delayAvc=e.delayAvc||0; }
    else if(e.flag!=="hold") e.flag="";
    putEscrow(e); syncTasks(); needTick();
    if(status==="picked") talk("Picked. Still making.");
    else if(status==="boxed") talk("Ready. Waiting for the Astranov agent.");
    else if(status==="with_agent") talk("With the agent.");
    else if(status==="moving") talk("On the way.");
    else if(status==="door") talk((e.floor?"Room service. ":"")+"Waiting at your doorstep. Up to 3 minutes. Then the agent goes to the next order. Missed goods return to the vendor at the end of the route.");
    else if(status==="handed") talk("At your door.");
    else talk("Stage "+status+".");
  }
  function markPicked(id){ markStage(id, "picked"); }
  function markHanded(id){
    var e=escrowOf(id); if(!e||!e.held) return;
    e.status="handed"; e.flag="handed"; e.evidence=e.evidence||{}; e.evidence.handedAt=Date.now(); putEscrow(e);
    syncTasks(); talk("Handed. Confirm you have it. If you stay silent, we settle on the evidence we actually have.");
  }
  function applyJustice(m){
    var id=(m&&m.id)||(awaiting&&awaiting.id); var e=escrowOf(id); if(!e){ talk((m&&m.say)||"That hold is gone."); return; }
    var split=m.split||{};
    if(m.ok===false){ talk(m.say||"No. That split would cheat someone."); return; }
    settle(id, {customer:split.customer, vendor:split.vendor, driver:split.driver, platform:split.platform}, m.say||"Grok settled it.");
  }
  function tickJustice(){
    var now=Date.now(), list=loadEscrow(), dirty=false;
    function lastAt(e){ var ev=e.evidence||{}; return ev.handedAt||ev.movingAt||ev.boxedAt||ev.pickedAt||e.at; }
    list.forEach(function(e){
      if(!e||!e.held) return;
      var age=(now-e.at)/60000, hold=Number(e.holdMin)||40, stageAge=(now-lastAt(e))/60000;
      if(e.status==="paid" && age>=hold*2){ settle(e.id, {customer:e.avc, vendor:0, driver:0}, "Shop did not pick in twice the hold. Full credit back. SpaceNet takes nothing."); dirty=true; return; }
      if(e.status==="paid" && age>=hold && e.flag!=="hold"){ e.flag="hold"; putEscrow(e); dirty=true; talk("Hold time is up on "+(e.query||"this order")+". Credit is still locked. Shop must pick or we give it back."); }
      if((e.status==="picked"||e.status==="boxed") && stageAge>=hold*2){
        var v=Math.round(e.avc*0.35*100)/100;
        settle(e.id, {customer:Math.max(0,e.avc-v), vendor:v, driver:0}, "Went silent after making. Shop kept a share. Rest back. Agent 0. SpaceNet takes nothing.");
        dirty=true; return;
      }
      if((e.status==="with_agent"||e.status==="moving") && stageAge>=hold*2){
        var sv=Math.round(e.avc*0.4*100)/100, sd=Math.round(e.avc*0.2*100)/100;
        settle(e.id, {customer:Math.max(0,e.avc-sv-sd), vendor:sv, driver:sd}, "Went silent while moving. Shop and driver kept a share for work marked. Rest back. We do not invent a GPS trace.");
        dirty=true; return;
      }
      if(e.status==="door" || e.status==="handed"){
        if(doorLeft(e)<=0){ agentLeave(e.id); dirty=true; return; }
      }
    });
    if(dirty) syncTasks(); else paintTasksBtn();
    if(window.SNWork&&SNWork.pull) SNWork.pull(here||aim);
  }
  function lookAt(p){ if(!p||!isFinite(p.lat)||!isFinite(p.lng)) return; yaw=p.lng*Math.PI/180; pitch=Math.max(-1.15, Math.min(1.15, p.lat*Math.PI/180)); spin=0; }
  function facingPoint(){ var lat=pitch*180/Math.PI, lng=yaw*180/Math.PI; while(lng>180) lng-=360; while(lng<-180) lng+=360; return {lat:lat,lng:lng}; }
  function viewLevel(){ if(cityEl&&cityEl.classList.contains("on")&&map){ return map.getZoom()>=10?"city":"national"; } return "globe"; }
  function showGlobe(){ if(cityEl){ cityEl.classList.remove("on"); cityEl.style.pointerEvents="none"; } hidePlace(); hideLayerMenu(); hideCash(); paintLayerBtn(); paintMoney(false); if(window.SNWork) SNWork.close(); }
  var LAYER={
    dark:{url:"https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", sub:"abc", attr:"© OpenStreetMap"},
    bright:{url:"https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", sub:"abc", attr:"© OpenStreetMap"},
    sat:{url:"https://tiles.maps.eox.at/wmts/1.0.0/s2cloudless-2024_3857/default/GoogleMapsCompatible/{z}/{y}/{x}.jpg", attr:"© Sentinel-2 / EOX", fallback:"https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"},
    streets:{url:"https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png", sub:"abc", attr:"© OpenStreetMap"}
  };
  try{ var savedL=localStorage.getItem("sn:layer"); if(savedL&&LAYER[savedL]) mapLayer=savedL; }catch(e){}
  var layerBtn=document.getElementById("sn-layer"), layerBox=document.getElementById("sn-layers");
  function hideLayerMenu(){ if(layerBox) layerBox.classList.remove("on"); packSoon(); }
  function paintLayerBtn(){
    if(!layerBtn) return;
    var city=cityEl&&cityEl.classList.contains("on")&&map&&map.getZoom()>=10;
    var want=!!city;
    if(layerBtn.classList.contains("on")===want){ if(!city) hideLayerMenu(); return; }
    layerBtn.classList.toggle("on", want);
    if(!city) hideLayerMenu();
    packSoon();
  }
  function openLayerMenu(){
    if(!layerBox||!layerBtn) return;
    var r=layerBtn.getBoundingClientRect();
    layerBox.style.left=Math.round(r.left)+"px";
    layerBox.style.top=Math.round(r.bottom+8)+"px";
    layerBox.classList.add("on");
    Array.prototype.forEach.call(layerBox.querySelectorAll("button"), function(b){ b.classList.toggle("on", b.getAttribute("data-layer")===mapLayer); });
    packSoon();
  }
  function setLayer(name){
    if(!LAYER[name]) name="dark";
    mapLayer=name;
    try{ localStorage.setItem("sn:layer", name); }catch(e){}
    if(cityEl){ cityEl.classList.remove("dark","bright","sat","streets"); cityEl.classList.add(name); }
    if(map&&window.L){
      var spec=LAYER[name], opt={maxZoom:19, attribution:spec.attr, keepBuffer:2, updateWhenIdle:true};
      if(spec.sub) opt.subdomains=spec.sub;
      if(tileLayer) try{ map.removeLayer(tileLayer); }catch(e){}
      tileLayer=window.L.tileLayer(spec.url, opt);
      if(spec.fallback){
        tileLayer.on("tileerror", function(){
          if(spec._fell) return;
          spec._fell=true;
          try{ map.removeLayer(tileLayer); }catch(e){}
          tileLayer=window.L.tileLayer(spec.fallback, {maxZoom:19, attribution:spec.attr, keepBuffer:2, updateWhenIdle:true}).addTo(map);
        });
      }
      tileLayer.addTo(map);
    }
    hideLayerMenu();
  }
  var moneyBtn=document.getElementById("sn-money"), cashEl=document.getElementById("sn-cash"), cashBody=document.getElementById("sn-cash-body"), moneyGlowT=0;
  function moneyWanted(){ return true; }
  function fmtAve(n, compact){
    n=Number(n)||0;
    if(compact && n>=1000000) return "AV€ "+(n/1000000).toFixed(n%1000000?2:0)+"M";
    if(compact && n>=10000) return "AV€ "+Math.round(n).toLocaleString("en-GB");
    return "AV€ "+n.toLocaleString("en-GB",{minimumFractionDigits:n>=1000?0:2,maximumFractionDigits:2});
  }
  function paintMoney(flash){
    if(!moneyBtn) return;
    var n=avcGet();
    moneyBtn.textContent=fmtAve(n, true);
    moneyBtn.classList.add("on");
    if(flash){
      moneyBtn.classList.remove("glow");
      void moneyBtn.offsetWidth;
      moneyBtn.classList.add("glow");
      clearTimeout(moneyGlowT);
      moneyGlowT=setTimeout(function(){ moneyBtn.classList.remove("glow"); }, 2000);
    }
    if(cashEl&&cashEl.classList.contains("on")) renderCash();
  }
  function heldAvc(){ var s=0; loadEscrow().forEach(function(e){ if(e&&e.held) s+=Number(e.avc)||0; }); return s; }
  function earnedSum(){ try{ var e=JSON.parse(localStorage.getItem("sn:earned")||"{}"), k, n=0; for(k in e) if(Object.prototype.hasOwnProperty.call(e,k)) n+=Number(e[k])||0; return n; }catch(x){ return 0; } }
  function mineState(){ try{ return JSON.parse(localStorage.getItem("sn:mine")||"{}"); }catch(e){ return {}; } }
  function mineSave(s){ try{ localStorage.setItem("sn:mine", JSON.stringify(s)); }catch(e){} }
  function listingsLive(){
    if(!window.SNWork||!SNWork.all) return 0;
    var a=SNWork.all(), n=0;
    (a.shops||[]).forEach(function(){ n++; });
    (a.drivers||[]).forEach(function(d){ if(String(d.presence||"present")!=="off") n++; });
    return n;
  }
  function mineTick(){
    var s=mineState();
    if(!s.on) return;
    if(typeof document!=="undefined" && document.hidden) return;
    var live=listingsLive();
    if(!live){ s.note="List a shop or a driver base to mint."; mineSave(s); if(cashEl&&cashEl.classList.contains("on")) renderCash(); return; }
    var now=Date.now(), last=Number(s.last)||now;
    var min=Math.max(0,(now-last)/60000);
    if(min<0.3) return;
    var gain=Math.round(live*0.08*min*100)/100;
    if(gain>0){ avcAdd(gain); s.minted=(Number(s.minted)||0)+gain; }
    s.last=now; mineSave(s);
  }
  function renderCash(){
    if(!cashBody) return;
    var n=avcGet(), held=heldAvc(), earned=earnedSum(), s=mineState(), live=listingsLive();
    var rows=loadEscrow().filter(function(e){ return e&&e.held; }).map(function(e){ return '<p>'+String(e.query||"Hold").replace(/[<>]/g,"")+' · '+fmtAve(Number(e.avc)||0)+' locked</p>'; }).join("");
    cashBody.innerHTML='<div class="bal">'+fmtAve(n)+'</div>'+
      '<p>Astranov Coins. Tied to the euro 1 to 1. AV€ 1 = €1.</p>'+
      '<p>Locked in jobs: '+fmtAve(held)+'</p>'+
      '<p>SpaceNet 3% on every task and top-up. Filed: '+fmtAve(platformGet())+'</p>'+
      '<p>Presence mint: '+(s.on?"ON":"OFF")+' · listed '+live+' · minted '+fmtAve(Number(s.minted)||0)+'</p>'+
      (s.note?'<p>'+String(s.note).replace(/[<>]/g,"")+'</p>':'')+
      (rows||'')+
      '<button type="button" class="act" data-act="mine">'+(s.on?"STOP MINT":"START MINT")+'</button>'+
      '<button type="button" class="act" data-act="reload">RELOAD EUR → AV€</button>';
  }
  function openCash(){ if(!cashEl) return; paintMoney(false); cashEl.classList.add("on"); renderCash(); packSoon(); }
  function hideCash(){ if(cashEl) cashEl.classList.remove("on"); packSoon(); }
  function loadPlace(){ try{ return JSON.parse(localStorage.getItem("sn:place")||"{}"); }catch(e){ return {}; } }
  function savePlace(id,x,y,extra){ var p=loadPlace(); p[id]=Object.assign(p[id]||{}, {x:Math.round(x),y:Math.round(y)}, extra||{}); try{ localStorage.setItem("sn:place", JSON.stringify(p)); }catch(e){} }
  var chromeFly=[], chromeShapes=["round","pill","square"];
  function applySkin(el,id){
    if(!el) return;
    var p=loadPlace()[id]||{};
    if(p.shape) el.setAttribute("data-shape", p.shape);
    if(p.sc) el.style.setProperty("--sc", String(p.sc));
  }
  function cycleShape(el,id){
    var cur=el.getAttribute("data-shape")||"pill", i=chromeShapes.indexOf(cur);
    var next=chromeShapes[(i+1)%chromeShapes.length];
    el.setAttribute("data-shape", next);
    var p=loadPlace()[id]||{}; p.shape=next; savePlace(id, el.offsetLeft, el.offsetTop, p);
  }
  function throwEl(el,id,vx,vy){
    chromeFly=chromeFly.filter(function(f){ return f.el!==el; });
    chromeFly.push({el:el,id:id,vx:vx,vy:vy});
    needChromeFly();
  }
  var chromeFlyOn=false;
  function needChromeFly(){
    if(chromeFlyOn) return;
    chromeFlyOn=true;
    requestAnimationFrame(stepChrome);
  }
  function stepChrome(){
    chromeFlyOn=false;
    if(!chromeFly.length) return;
    var W=innerWidth||320, H=innerHeight||480, next=[];
    chromeFly.forEach(function(f){
      var el=f.el; if(!el) return;
      var r=el.getBoundingClientRect();
      var x=r.left+f.vx, y=r.top+f.vy, w=r.width, h=r.height;
      if(x<8){ x=8; f.vx=Math.abs(f.vx)*0.7; }
      if(y<8){ y=8; f.vy=Math.abs(f.vy)*0.7; }
      if(x+w>W-8){ x=W-8-w; f.vx=-Math.abs(f.vx)*0.7; }
      if(y+h>H-8){ y=H-8-h; f.vy=-Math.abs(f.vy)*0.7; }
      f.vx*=0.96; f.vy*=0.96;
      el.style.left=Math.round(x)+"px"; el.style.top=Math.round(y)+"px"; el.style.right="auto"; el.style.bottom="auto";
      if(Math.hypot(f.vx,f.vy)>0.8) next.push(f);
      else { savePlace(f.id, x, y); el.classList.remove("loose"); }
    });
    chromeFly=next;
    if(chromeFly.length) needChromeFly();
  }
  function bindDrag(el, id){
    if(!el||el.dataset.dragBound) return;
    el.dataset.dragBound="1";
    applySkin(el,id);
    var st=null, holdT=null, pts={};
    function armHold(){
      clearTimeout(holdT);
      holdT=setTimeout(function(){
        if(!st||st.moved) return;
        st.loose=true;
        el.classList.add("loose");
        el.style.position="fixed";
        var r=el.getBoundingClientRect();
        el.style.left=r.left+"px"; el.style.top=r.top+"px"; el.style.right="auto"; el.style.bottom="auto";
        talk("Loose. Throw it. Pinch to size. Tap to change shape.");
      }, 3000);
    }
    el.addEventListener("pointerdown", function(e){
      if(e.button&&e.button!==0) return;
      pts[e.pointerId]={x:e.clientX,y:e.clientY};
      var n=Object.keys(pts).length;
      if(n>=2){
        var ids=Object.keys(pts), a=pts[ids[0]], b=pts[ids[1]];
        st={pinch:true,d0:Math.hypot(a.x-b.x,a.y-b.y),s0:Number((el.style.getPropertyValue("--sc")||el.style.getPropertyValue("--sc"))||getComputedStyle(el).getPropertyValue("--sc")||1)||1};
        clearTimeout(holdT); return;
      }
      st={x:e.clientX,y:e.clientY,l:el.getBoundingClientRect().left,t:el.getBoundingClientRect().top,moved:false,loose:el.classList.contains("loose"),t0:Date.now(),lx:e.clientX,ly:e.clientY,vx:0,vy:0};
      try{ el.setPointerCapture(e.pointerId); }catch(x){}
      if(!st.loose) armHold();
    });
    el.addEventListener("pointermove", function(e){
      if(pts[e.pointerId]) pts[e.pointerId]={x:e.clientX,y:e.clientY};
      if(st&&st.pinch){
        var ids=Object.keys(pts); if(ids.length<2) return;
        var a=pts[ids[0]], b=pts[ids[1]], d=Math.hypot(a.x-b.x,a.y-b.y);
        var sc=Math.max(0.7, Math.min(2.2, st.s0*(d/Math.max(16,st.d0))));
        el.style.setProperty("--sc", String(sc.toFixed(2)));
        el.dataset.skipClick="1";
        return;
      }
      if(!st) return;
      var dx=e.clientX-st.x, dy=e.clientY-st.y;
      var dt=Math.max(8, Date.now()-(st.lt||st.t0));
      st.vx=(e.clientX-st.lx)/dt*16; st.vy=(e.clientY-st.ly)/dt*16; st.lx=e.clientX; st.ly=e.clientY; st.lt=Date.now();
      if(!st.moved && Math.hypot(dx,dy)<12) return;
      st.moved=true; clearTimeout(holdT); el.classList.add("drag");
      el.style.position="fixed";
      var x=Math.max(8, Math.min((innerWidth||320)-el.offsetWidth-8, st.l+dx));
      var y=Math.max(8, Math.min((innerHeight||480)-el.offsetHeight-8, st.t+dy));
      el.style.left=x+"px"; el.style.top=y+"px"; el.style.right="auto"; el.style.bottom="auto";
    });
    function end(e){
      delete pts[e.pointerId];
      clearTimeout(holdT);
      if(!st) return;
      if(st.pinch){
        var sc=Number(el.style.getPropertyValue("--sc")||1);
        savePlace(id, el.offsetLeft, el.offsetTop, {sc:sc});
        el.dataset.skipClick="1"; st=null; el.classList.remove("drag"); return;
      }
      if(st.loose && st.moved && Math.hypot(st.vx,st.vy)>4){
        throwEl(el,id,st.vx*8,st.vy*8); el.dataset.skipClick="1";
      } else if(st.moved){
        savePlace(id, el.offsetLeft, el.offsetTop); el.classList.remove("loose"); el.dataset.skipClick="1"; packSoon();
      } else if(st.loose){
        cycleShape(el,id); el.dataset.skipClick="1";
      }
      st=null; el.classList.remove("drag");
    }
    el.addEventListener("pointerup", end);
    el.addEventListener("pointercancel", end);
    el.addEventListener("click", function(e){ if(el.dataset.skipClick==="1"){ e.preventDefault(); e.stopPropagation(); el.dataset.skipClick=""; } }, true);
  }
  function km(a,b){ if(!a||!b) return 0; var R=6371,dLat=((b.lat-a.lat)*Math.PI)/180,dLng=((b.lng-a.lng)*Math.PI)/180; var x=Math.sin(dLat/2)*Math.sin(dLat/2)+Math.cos((a.lat*Math.PI)/180)*Math.cos((b.lat*Math.PI)/180)*Math.sin(dLng/2)*Math.sin(dLng/2); return R*2*Math.atan2(Math.sqrt(x),Math.sqrt(1-x)); }
  function travelMin(a,b){ return Math.max(1, Math.round((km(a,b)/22)*60)); }
  function goodsOf(text){ var l=String(text||"").toLowerCase(); if(/ice|gelato|παγω/.test(l)) return {name:"ice cream",temp:"frozen",hold:12,strict:true}; if(/pizza|soup|πιτσ|σουπ/.test(l)) return {name:/soup|σουπ/.test(l)?"soup":"pizza",temp:"hot",hold:35,strict:true}; if(/beer|μπύρα|μπυρα|ale|lager/.test(l)) return {name:"beer",temp:"cold",hold:90,strict:false}; if(/burger|hamburger|cheeseburger|μπέργκερ|μπουργκερ/.test(l)) return {name:"burger",temp:"hot",hold:25,strict:true}; if(/gyro|gyros|souvlaki|kebab|shawarma|γυρο|σουβλ/.test(l)) return {name:"gyro",temp:"hot",hold:25,strict:true}; if(/coffee|καφ/.test(l)) return {name:"coffee",temp:"hot",hold:25,strict:true}; if(/sushi|salad|milk|γαλα/.test(l)) return {name:"cold food",temp:"cold",hold:25,strict:true}; if(/pharm|medicine|φαρμα/.test(l)) return {name:"pharmacy order",temp:"controlled",hold:90,strict:true}; return {name:/parcel|package|δεμα/.test(l)?"parcel":"order",temp:"ambient",hold:180,strict:false}; }
  function fetchJson(url,opt,ms){ function once(){ var ctl=window.AbortController?new AbortController():null, timer=ctl&&setTimeout(function(){ctl.abort();},ms||14000); var o={}; opt=opt||{}; Object.keys(opt).forEach(function(k){ o[k]=opt[k]; }); if(ctl) o.signal=ctl.signal; return fetch(url,o).then(function(r){ if(!r.ok) throw new Error("http_"+r.status); return r.json(); }).finally(function(){ if(timer) clearTimeout(timer); }); } return once().catch(function(err){ if(String(err&&err.message||"").indexOf("http_")===0) throw err; return once(); }); }
  function cleanQuery(q){ return String(q||"").replace(/^\s*(i\s+)?(want|need|would like|am looking for|find|get|buy|order|show me|ψάχνω|θέλω)\s+(me\s+)?/i,"").replace(/\b(please|nearby|near me|the best|best|around here|για μένα)\b/ig," ").replace(/\s+/g," ").trim()||String(q||"shop").trim(); }
  function escOverpass(s){ return String(s||"").replace(/[^a-z0-9\u0370-\u03ff _-]/gi," ").trim().slice(0,40); }
  function pointOf(r){ var c=r&&r.center||{}; return {lat:+(r&&r.lat!=null?r.lat:c.lat),lng:+(r&&r.lon!=null?r.lon:c.lon)}; }
  function askLocation(){ talk("Tap GPS. The globe flies you to your city."); var g=document.getElementById("gps"); if(g) g.classList.remove("on","busy"); }
  function avcGet(){ try{ if(localStorage.getItem("sn:ave-restored")!=="4024"){ localStorage.setItem("sn:avc","3000000"); localStorage.setItem("sn:ave-restored","4024"); } return Math.max(0, Number(localStorage.getItem("sn:avc")||0)); }catch(e){ return 0; } }
  function avcSet(n){ try{ localStorage.setItem("sn:avc", String(Math.max(0, Math.round(Number(n)*100)/100))); }catch(e){} paintMoney(true); }
  function avcAdd(n){ avcSet(avcGet()+Number(n||0)); }
  function humanName(j){ if(!j) return ""; var a=j.address||j.properties||{}; var blob=String((j.name||"")+" "+(j.display_name||"")+" "+(a.name||"")+" "+(a.water||"")).toLowerCase(); var n=j.name||a.amenity||a.shop||a.road||a.street||a.neighbourhood||a.suburb||a.village||a.town||a.city||a.locality||a.municipality||a.county||""; if(/ocean|sea|gulf|strait|bay of/.test(blob) && !a.road && !a.street && !a.amenity && !a.shop) return ""; n=String(n||"").trim(); if(/^-?\d+\.\d+/.test(n)) return ""; return n; }
  function overpassFilters(q){ var l=q.toLowerCase(); if(/beer|μπύρα|μπυρα|ale|lager|pub/.test(l)) return ['["amenity"~"pub|bar|biergarten",i]','["shop"~"alcohol|beverages",i]','["name"~"beer|pub|bar|μπύρα",i]']; if(/pizza|πιτσ/.test(l)) return ['["cuisine"~"pizza",i]','["name"~"pizza|pizzeria|πιτσ",i]']; if(/burger|hamburger|cheeseburger|μπέργκερ|μπουργκερ/.test(l)) return ['["cuisine"~"burger",i]','["name"~"burger|hamburger|goody|mcdonald|burger king",i]','["amenity"="fast_food"]']; if(/gyro|gyros|souvlaki|kebab|shawarma|γυρο|σουβλ/.test(l)) return ['["cuisine"~"kebab|greek|grill",i]','["name"~"gyro|gyros|souvlaki|kebab|γυρο|σουβλ",i]','["amenity"="fast_food"]']; if(/coffee|cafe|καφ/.test(l)) return ['["amenity"="cafe"]']; if(/pharm|medicine|φαρμα/.test(l)) return ['["amenity"="pharmacy"]']; if(/ice|gelato|παγω/.test(l)) return ['["amenity"="ice_cream"]','["cuisine"~"ice_cream",i]']; if(/food|restaurant|eat|φαγη|soup|salad|sushi/.test(l)) return ['["amenity"~"restaurant|fast_food|cafe"]']; if(/supermarket|grocery|market/.test(l)) return ['["shop"~"supermarket|convenience"]']; if(/shop|store/.test(l)) return ['["shop"]']; var e=escOverpass(q); return ['["name"~"'+e+'",i]','["cuisine"~"'+e+'",i]','["amenity"~"'+e+'",i]','["shop"~"'+e+'",i]']; }
  function isBrand(q){ var l=String(q||"").trim(); if(!l) return false; if(/^(pizza|pizzeria|burger|beer|coffee|cafe|gyro|souvlaki|food|restaurant|shop|pharmacy|ice cream|φαγητό|πιτσα|πιτσαρία)$/i.test(l)) return false; return l.length>=5; }
  function nameHit(v,q){ var n=String((v&&v.name)||"").toLowerCase().replace(/[^a-z0-9\u0370-\u03ff]+/g,""); var qq=String(q||"").toLowerCase().replace(/[^a-z0-9\u0370-\u03ff]+/g,""); if(!qq||qq.length<3) return true; return n.indexOf(qq)>=0; }
  function photonQuery(q){ if(isBrand(q)) return q; var l=String(q||"").toLowerCase(); if(/beer|μπύρα|μπυρα|ale|lager|pub/.test(l)) return "pub"; if(/pizza|πιτσ/.test(l)) return "pizza"; if(/food|eat|φαγη|restaurant/.test(l)) return "restaurant"; if(/shop|store/.test(l)) return "shop"; if(/coffee|cafe|καφ/.test(l)) return "cafe"; if(/pharm|φαρμα/.test(l)) return "pharmacy"; return q; }
  function overpassPlaces(q,from){ from=from||here; if(!from) return Promise.resolve([]); var clauses; if(isBrand(q)) clauses='nwr(around:80000,'+from.lat+','+from.lng+')["name"~"'+escOverpass(q)+'",i];'; else clauses=overpassFilters(q).map(function(f){ return 'nwr(around:12000,'+from.lat+','+from.lng+')["name"]'+f+';'; }).join(""); var query='[out:json][timeout:6];('+clauses+');out center tags 20;'; return fetchJson("https://overpass.kumi.systems/api/interpreter?data="+encodeURIComponent(query),{headers:{Accept:"application/json"}},5000).then(function(j){return j.elements||[];}).catch(function(){return [];}).then(function(rows){ return rows.map(function(r){ var p=pointOf(r),t=r.tags||{}; return {id:"osm-"+r.type+"-"+r.id,name:t.name,lat:p.lat,lng:p.lng,raw:t["addr:street"]||"OpenStreetMap",tags:t}; }).filter(function(v){return v.name&&isFinite(v.lat)&&isFinite(v.lng);}); }); }
  function photonPlaces(q,from){ var brand=isBrand(q); var terms=[], raw=String(q||"").trim(); if(raw) terms.push(raw); if(brand){ terms.push(raw+" Rhodes"); terms.push(raw+" Ρόδος"); terms.push(raw+" Ανάληψη"); } if(!brand && hereName) terms.push(raw+" "+hereName); if(!brand){ var simp=photonQuery(raw); if(simp && simp!==raw) terms.push(simp); } function one(term){ var url="https://photon.komoot.io/api/?q="+encodeURIComponent(term)+"&limit=20"; if(from && !brand) url+="&lat="+from.lat+"&lon="+from.lng; return fetchJson(url,{headers:{Accept:"application/json"}},8000).then(function(j){ return (j.features||[]).map(function(f){ var c=f.geometry&&f.geometry.coordinates, pr=f.properties||{}; if(!c||!pr.name) return null; return {id:"osm-"+(pr.osm_type||"n")+"-"+(pr.osm_id||""), name:pr.name, lat:+c[1], lng:+c[0], raw:[pr.street,pr.city||pr.locality||pr.district].filter(Boolean).join(", ")||"OpenStreetMap", tags:pr}; }).filter(Boolean); }).catch(function(){return [];}); } return Promise.all(terms.map(one)).then(function(g){ var out=[]; g.forEach(function(list){ out=out.concat(list||[]); }); return out; }); }
  function nominatimPlaces(q,from){ var brand=isBrand(q); var terms=[q]; if(hereName && !brand) terms.push(q+" "+hereName); function one(term){ var url="https://nominatim.openstreetmap.org/search?format=jsonv2&limit=12&q="+encodeURIComponent(term); return fetchJson(url,{headers:{Accept:"application/json","Accept-Language":navigator.language||"en","User-Agent":"AstranovSpaceNet/1"}},6000).then(function(rows){ return (rows||[]).map(function(r){return {id:"osm-"+(r.osm_type||"")+"-"+r.osm_id,name:r.name||String(r.display_name||"").split(",")[0],lat:+r.lat,lng:+r.lon,raw:r.display_name,tags:r.extratags||{}};}).filter(function(v){return v.name&&isFinite(v.lat);}); }).catch(function(){return [];}); } return Promise.all(terms.map(one)).then(function(g){ var out=[]; g.forEach(function(list){ out=out.concat(list||[]); }); return out; }); }
  function webFind(q,from){ return fetch("/api/find",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({q:q,city:hereName||"",lat:from&&from.lat,lng:from&&from.lng})}).then(function(r){ return r.json(); }).then(function(j){ return (j&&j.places||[]).map(function(p){ return {id:"web-"+(+p.lat).toFixed(4)+"-"+(+p.lng).toFixed(4),name:p.name||q,lat:+p.lat,lng:+p.lng,raw:p.raw||"web",tags:{phone:p.phone||""}}; }).filter(function(v){ return isFinite(v.lat)&&nameHit(v,q); }); }).catch(function(){ return []; }); }
  var huntMergeFn=null;
  function hunt(query,at,extra){ var raw=String(query||"").trim(),q=cleanQuery(raw); var from=at||here||aim; job={kind:"find",query:q,status:"hunt",at:from||null}; selected=null; if(!from && !isBrand(q)){ pendingHunt=raw; talk("Need you on the map. Tap GPS."); goHere(); return; } say("Finding "+q+"…"); var seq=++huntSeq, acc=[], spoken=false;
    function near(list){
      var seen={}, out=[];
      (list||[]).forEach(function(v){
        if(!v||!v.name||!isFinite(v.lat)) return;
        if(isBrand(q) && !nameHit(v,q) && !v.grok) return;
        var k=(v.name+"|"+(+v.lat).toFixed(4)+"|"+(+v.lng).toFixed(4)).toLowerCase();
        if(seen[k]) return; seen[k]=1; out.push(v);
      });
      if(from) out.sort(function(a,b){ return km(from,a)-km(from,b); });
      var close=from?out.filter(function(v){ return v.grok || km(from,v)<=40; }):out;
      if(isBrand(q)) return close.length?close:out.slice(0,6);
      return close.length?close:out.slice(0,8);
    }
    function showList(list){ if(seq!==huntSeq) return; if(selected && job && job.status==="chosen") return; vendors=list; paintHuntPins(list, from||list[0]); if(spoken||!list.length) return; spoken=true; var ours=list.filter(function(v){ return v.sn || listedShopOf(v) || v.kind==="driver" || v.kind==="drop"; }); if(ours.length) talk("On SpaceNet: "+ours.slice(0,3).map(function(v){return v.name;}).join(", ")+". Listed pins."); else talk((list[0].name||q)+" — "+(list[0].raw||"on the map")+". Not listed on SpaceNet. Hold to list it."); }
    function merge(list){ if(seq!==huntSeq) return; if(selected && job && job.status==="chosen") return; acc=near(acc.concat(list||[])); if(acc.length) showList(acc); }
    huntMergeFn=merge;
    merge(near(window.SNWork&&SNWork.match?SNWork.match(q, from):[]));
    if(extra&&extra.length) merge(extra);
    photonPlaces(q,from).then(function(list){ merge(list); });
    nominatimPlaces(q,from).then(function(list){ merge(list); });
    if(from) overpassPlaces(q,from).then(function(list){ merge(list); });
    setTimeout(function(){ if(seq!==huntSeq) return; if(selected && job && job.status==="chosen") return; if(!acc.length) talk("Grok has no pin for "+q+" on SpaceNet. I will not invent one in another city. Type the district, or list it."); }, 7000);
  }
  function loadMap(){
    if(window.L && window.L.map) return Promise.resolve(window.L);
    if(mapReady) return mapReady;
    mapReady=new Promise(function(resolve,reject){
      function ok(){
        var L=window.L||window.leaflet;
        if(L&&L.map){ window.L=L; resolve(L); return true; }
        return false;
      }
      if(ok()) return;
      if(!document.querySelector('link[data-sn-map]')){
        var css=document.createElement("link"); css.rel="stylesheet"; css.href="/js/vendor/leaflet.css?v="+VER; css.setAttribute("data-sn-map",""); document.head.appendChild(css);
      }
      function tag(src, next){
        var s=document.createElement("script");
        s.src=src;
        s.onload=function(){ if(!ok() && next) next(); else if(!ok()) reject(new Error("no L")); };
        s.onerror=function(){ if(next) next(); else reject(new Error("leaflet")); };
        document.head.appendChild(s);
      }
      tag("/js/vendor/leaflet.js?v="+VER, function(){ tag("https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"); });
    });
    return mapReady;
  }
  function routeTo(v){ return paintJobArc(); }
  function driverRow(id){
    if(!id||!window.SNWork) return null;
    var list=(SNWork.all().drivers||[]), i;
    for(i=0;i<list.length;i++) if(list[i]&&list[i].id===id) return list[i];
    return null;
  }
  function osrmLine(stops){
    if(!stops||stops.length<2) return Promise.resolve((stops||[]).map(function(p){ return [p.lat,p.lng]; }));
    var path=stops.filter(function(p){ return p&&isFinite(p.lat); }).map(function(p){ return p.lng+","+p.lat; }).join(";");
    if(path.split(";").length<2) return Promise.resolve(stops.map(function(p){ return [p.lat,p.lng]; }));
    var url="https://router.project-osrm.org/route/v1/driving/"+path+"?overview=full&geometries=geojson";
    return fetchJson(url,{headers:{Accept:"application/json"}},13000).then(function(j){
      var r=j&&j.routes&&j.routes[0], c=r&&r.geometry&&r.geometry.coordinates;
      if(r&&job) job.routeMin=Math.max(1,Math.round(r.duration/60));
      if(!c||!c.length) throw new Error("no_geom");
      return c.map(function(x){ return [x[1],x[0]]; });
    }).catch(function(){ return stops.map(function(p){ return [p.lat,p.lng]; }); });
  }
  function drawGlowLine(latlngs){
    lastRoute=latlngs||null;
    if(!map||!window.L||!latlngs||latlngs.length<2) return;
    try{ if(routeGlow) map.removeLayer(routeGlow); }catch(e){}
    try{ if(routeLine) map.removeLayer(routeLine); }catch(e){}
    routeGlow=window.L.polyline(latlngs,{color:"#4df0ff",weight:10,opacity:0.16,lineCap:"round",interactive:false}).addTo(map);
    routeLine=window.L.polyline(latlngs,{color:"#7ee9ff",weight:2,opacity:0.85,lineCap:"round",interactive:true,dashArray:"6 10"}).addTo(map); routeLine.on("click", function(e){ try{ window.L.DomEvent.stopPropagation(e);}catch(_){} mapHeld=true; openJobFromMap(); });
  }
  function bondPts(a,b){
    if(!a||!b||!isFinite(a.lat)||!isFinite(b.lat)) return [];
    var lat1=a.lat, lng1=a.lng, lat2=b.lat, lng2=b.lng;
    var dlat=lat2-lat1, dlng=lng2-lng1;
    var ox=-dlng, oy=dlat, n=Math.hypot(ox,oy)||1;
    var lift=Math.max(0.028, Math.hypot(dlat,dlng)*0.48);
    var cx=(lat1+lat2)/2+ox/n*lift, cy=(lng1+lng2)/2+oy/n*lift;
    var pts=[], i;
    for(i=0;i<=28;i++){
      var t=i/28, u=1-t;
      pts.push([u*u*lat1+2*u*t*cx+t*t*lat2, u*u*lng1+2*u*t*cy+t*t*lng2]);
    }
    return pts;
  }
  function jobFill(){
    var e=liveEscrow();
    if(e && (e.status==="verified"||e.status==="released"||e.status==="done"||!e.held)) return 1;
    if(e&&e.held) return Math.max(0.08, stagePct(e)/100);
    if(job&&job.status==="paid") return 0.2;
    if(job&&job.shop) return 0.08;
    return 0;
  }
  function fillPts(pts, pct){
    if(!pts||pts.length<2) return [];
    pct=Math.max(0, Math.min(1, Number(pct)||0));
    if(pct<=0) return [];
    if(pct>=1) return pts;
    var n=Math.max(2, Math.round((pts.length-1)*pct)+1);
    return pts.slice(0, n);
  }
  function drawBonds(){
    if(!map||!window.L) return;
    try{ if(bondGroup) map.removeLayer(bondGroup); }catch(e){}
    bondGroup=window.L.layerGroup().addTo(map);
    var segs=[], fill=jobFill(), done=fill>=0.99, drop=destPoint(), shop=selected, drv=null;
    if(job&&job.carrier&&(job.carrier.driver||job.carrier.agent)) drv=driverRow(job.carrier.id);
    if(shop&&drv) segs.push(bondPts(shop, drv));
    if(drv&&drop) segs.push(bondPts(drv, drop));
    else if(shop&&drop) segs.push(bondPts(shop, drop));
    segs.forEach(function(pts){
      if(pts.length<2) return;
      window.L.polyline(pts,{color:"#0a2cff",weight:16,opacity:0.2,lineCap:"round",interactive:false,className:"sn-arc-track"}).addTo(bondGroup);
    });
    var all=[];
    segs.forEach(function(pts,i){ all=all.concat(i?pts.slice(1):pts); });
    var lit=fillPts(all, fill);
    if(lit.length>=2){
      var col=done?"#ffd85a":"#7ee9ff", glow=done?"#ffd85a":"#3d6bff", cls=done?"sn-arc-done":"sn-arc-fill";
      window.L.polyline(lit,{color:glow,weight:22,opacity:done?0.45:0.32,lineCap:"round",interactive:false,className:cls}).addTo(bondGroup);
      window.L.polyline(lit,{color:col,weight:5,opacity:1,lineCap:"round",interactive:false,className:cls}).addTo(bondGroup);
      var last=lit[lit.length-1];
      window.L.circleMarker(last,{radius:done?9:7,color:col,weight:2,fillColor:col,fillOpacity:1,className:cls}).addTo(bondGroup);
      var cash=taskCash();
      if(cash>0){
        var mid=lit[Math.max(0, Math.floor(lit.length/2))];
        window.L.marker(mid,{icon:window.L.divIcon({className:"sn-arc-cash", html:fmtAve(cash,true), iconSize:[140,32], iconAnchor:[70,16]}), interactive:false, keyboard:false, zIndexOffset:2500}).addTo(bondGroup);
      }
    }
    if(all.length>=2){
      var hit=window.L.polyline(all,{color:"#3d6bff",weight:28,opacity:0.001,lineCap:"round",interactive:true}).addTo(bondGroup);
      hit.on("click", function(e){ try{ window.L.DomEvent.stopPropagation(e); }catch(_){} mapHeld=true; openJobFromMap(); });
    }
  }
  function paintJobArc(){
    var stops=[], d, drop=destPoint();
    if(selected) stops.push(selected);
    if(job&&job.carrier&&(job.carrier.driver||job.carrier.agent)){ d=driverRow(job.carrier.id); if(d&&isFinite(d.lat)) stops.push(d); }
    if(drop) stops.push(drop);
    drawBonds();
    if(stops.length<2) return Promise.resolve(null);
    return osrmLine(stops).then(function(line){
      drawGlowLine(line);
      drawBonds();
      try{
        var b=window.L.latLngBounds(stops.map(function(p){ return [p.lat,p.lng]; }));
        map.fitBounds(b.pad(0.35),{padding:[48,48],maxZoom:15});
      }catch(e){}
      return line;
    });
  }
  var listMarks=[], globeMarks=[], huntMarks=[];
  function flagOf(code){ return (window.SNWork&&SNWork.flagOf&&SNWork.flagOf(code))||""; }
  function pillSrc(row, kind){
    row=row||{};
    if(kind==="driver") return row.face||row.photo||row.vehicle||"";
    return row.profile||row.cover||row.photo||"";
  }
  function pillHtml(row, kind){
    row=row||{};
    if(kind==="tax") return "<b>ΔΟΥ</b>";
    var src=pillSrc(row, kind);
    var img=src?'<img class="face" alt="" src="'+src+'">':'<i></i>';
    var veh=(kind==="driver"&&row.vehicle)?'<img class="veh" alt="" src="'+row.vehicle+'">':"";
    var flags=kind==="driver"?'<span class="fl">'+flagOf(row.langMain)+flagOf(row.langAlt)+"</span>":"";
    return img+veh+flags;
  }
  function glowIcon(kind, on, row){
    return window.L.divIcon({className:"sn-pillpin "+(kind||"shop")+(on?" on":""), html:pillHtml(row,kind), iconSize:[44,44], iconAnchor:[22,22]});
  }
  function clearHuntPins(){
    huntMarks.forEach(function(m){ try{ if(map) map.removeLayer(m); }catch(e){} });
    huntMarks=[];
  }
  function goThere(p, z, then){
    if(!p||!isFinite(p.lat)) return;
    aim=p;
    z=z==null?17:z;
    function land(){
      showMap(p, z);
      if(typeof then==="function") setTimeout(then, 280);
    }
    if(!cityEl || !cityEl.classList.contains("on")) startFly(p, land, 1200, 1.12);
    else land();
  }
  function paintHuntPins(list, from){
    list=list||vendors||[];
    function go(){
      if(!map||!window.L) return;
      clearHuntPins();
      var brand=job&&isBrand(job.query);
      var pts=(!brand && here)?[[here.lat,here.lng]]:[];
      var pin=window.SNWork&&SNWork.listingAt&&SNWork.listingAt();
      list.slice(0,8).forEach(function(v){
        if(!v||!isFinite(v.lat)) return;
        if(pin && Math.abs(v.lat-pin.lat)<0.0004 && Math.abs(v.lng-pin.lng)<0.0004) return;
        var on=selected&&selected.id&&v.id===selected.id;
        var m=window.L.marker([v.lat,v.lng],{icon:glowIcon(v.kind||"shop", on, v), keyboard:false, riseOnHover:true, draggable:true, autoPan:true});
        m.bindTooltip(v.name||"Place",{direction:"top", className:"sn-tip", opacity:1});
        m.on("click", function(e){ try{ window.L.DomEvent.stopPropagation(e); }catch(_){} mapHeld=true; openPinMenu(v); });
        m.on("dragstart", function(){ mapHeld=true; });
        m.on("dragend", function(e){
          mapHeld=true;
          var ll=e.target.getLatLng();
          v.lat=ll.lat; v.lng=ll.lng;
          aim=v;
          if(window.SNWork&&SNWork.setPin) SNWork.setPin({lat:ll.lat,lng:ll.lng,name:v.name,raw:v.raw});
        });
        m.addTo(map);
        huntMarks.push(m);
        pts.push([v.lat,v.lng]);
      });
      if(pts.length===1){ try{ map.setView(pts[0], 17); }catch(e){} }
      else if(pts.length>=2){ try{ map.fitBounds(pts,{padding:[40,72],maxZoom:17}); }catch(e){} }
    }
    var target=list[0]||from;
    if(!cityEl || !cityEl.classList.contains("on") || !map) goThere(target, 17, go);
    else { go(); if(target&&map) try{ map.setView([target.lat,target.lng], 17); }catch(e){} }
  }
  function spaceAround(from){
    if(!window.SNWork) return [];
    var all=SNWork.all(), rows=[];
    function add(list, kind, w){
      (list||[]).forEach(function(r){
        if(!r||!isFinite(r.lat)) return;
        if(kind==="drop") return;
        if(kind!=="post" && kind!=="tax" && !pinLive(r, kind)) return;
        var d=from?km(from,r):0;
        if(from && d>18) return;
        rows.push({row:r, kind:kind, d:d, hits:Number(r.hits)||0, w:w});
      });
    }
    add(all.shops,"shop",3);
    add(all.drivers,"driver",3);
    add(all.posts,"post",1);
    var tax=window.SNWork&&SNWork.taxOffice&&SNWork.taxOffice();
    if(tax&&isFinite(tax.lat)&&( !from || km(from,tax)<80)) rows.push({row:tax, kind:"tax", d:from?km(from,tax):0, hits:99, w:4});
    rows.sort(function(a,b){ if(b.w!==a.w) return b.w-a.w; if(b.hits!==a.hits) return b.hits-a.hits; return a.d-b.d; });
    return rows.slice(0,8);
  }
  function showAround(from){
    var rows=spaceAround(from||here);
    globeMarks=rows;
    drawSig="";
    needTick();
    var n=(from&&from.name&&from.name!=="This place")?from.name:(hereName||"this place");
    if(!rows.length){ talk((from&&from.name?"This is "+n+".":"You're in "+n+".")+" Search for the rest."); return; }
    talk("You're in "+n+". Marks on the map. Search for the rest.");
    if(window.SNWork&&SNWork.pull) SNWork.pull(from||here);
  }
  function paintMapMarks(L, v){ if(hereMark) hereMark.remove(); if(vendorMark) vendorMark.remove(); if(listingMark) try{listingMark.remove();}catch(e){} listingMark=null; if(aimMark) aimMark.remove(); if(routeLine) try{map.removeLayer(routeLine);}catch(e){} if(routeGlow) try{map.removeLayer(routeGlow);}catch(e){} if(bondGroup) try{map.removeLayer(bondGroup);}catch(e){} if(callLine) callLine.remove(); listMarks.forEach(function(m){ try{m.remove();}catch(e){} }); listMarks=[]; if(here){ hereMark=L.circleMarker([here.lat,here.lng],{radius:7,color:"#4df0ff",fillColor:"#4df0ff",fillOpacity:.95}).addTo(map).bindTooltip("YOU",{permanent:true,direction:"top",className:"sn-tip",opacity:1}); hereMark.on("click", function(e){ try{ L.DomEvent.stopPropagation(e); }catch(_){} mapHeld=true; cityWork(here, true); }); } var pinAt=window.SNWork&&SNWork.listingAt&&SNWork.listingAt(); if(pinAt&&isFinite(pinAt.lat)&&map){ listingMark=L.marker([pinAt.lat,pinAt.lng],{icon:glowIcon(pinAt.kind||"shop",true,pinAt),draggable:true,keyboard:false,zIndexOffset:1400}).addTo(map); listingMark.bindTooltip("PIN",{permanent:true,direction:"top",className:"sn-tip"}); listingMark.on("dragend",function(e){ var ll=e.target.getLatLng(); mapHeld=true; if(window.SNWork&&SNWork.setPin) SNWork.setPin({lat:ll.lat,lng:ll.lng}); }); listingMark.on("click",function(e){ try{ L.DomEvent.stopPropagation(e);}catch(_){} mapHeld=true; if(window.SNWork) SNWork.open(pinAt); }); } var mine=myListingIds(); var seenDrop={}; function showDrop(d, lab){ if(!d||!isFinite(d.lat)) return; var k=(+d.lat).toFixed(5)+"|"+(+d.lng).toFixed(5); if(seenDrop[k]) return; seenDrop[k]=1; var dm=L.marker([d.lat,d.lng],{icon:glowIcon("drop",true,d),keyboard:false,zIndexOffset:1300}).addTo(map); dm.bindTooltip(lab||"CLIENT",{permanent:true,direction:"top",className:"sn-tip"}); listMarks.push(dm); } if(job&&job.drop&&job.carrier&&(mine[job.carrier.id]==="driver"||(job.drop.id&&mine[job.drop.id]==="drop"))) showDrop(job.drop,"CLIENT"); loadEscrow().forEach(function(e){ if(!e||!e.held||!e.drop) return; if(e.driver&&mine[e.driver.id]==="driver") showDrop(e.drop,"CLIENT"); });  if(aim && (!here || km(here,aim)>0.05)) aimMark=L.circleMarker([aim.lat,aim.lng],{radius:6,color:"#ff8ad4",fillColor:"#ff8ad4",fillOpacity:.9}).addTo(map); if(v){ vendorMark=L.circleMarker([v.lat,v.lng],{radius:9,color:"#ffd85a",fillColor:"#ffd85a",fillOpacity:.95}).addTo(map).bindTooltip(v.name||"Place",{permanent:false,direction:"top",className:"sn-tip"}); vendorMark.on("click", function(e){ try{ L.DomEvent.stopPropagation(e); }catch(_){} mapHeld=true; vendorTapped(v); }); }
    if(window.SNWork && map){
      function pin(row,kind,label){
        if(!row||!isFinite(row.lat)) return;
        var m=L.marker([row.lat,row.lng],{icon:glowIcon(kind, false, row), keyboard:false, riseOnHover:true}).addTo(map);
        m.bindTooltip(label,{permanent:false,direction:"top",className:"sn-tip"});
        m.on("click", function(e){ try{ L.DomEvent.stopPropagation(e); }catch(_){} mapHeld=true; if(kind==="tax"){ if(window.SNWork) SNWork.open(row,"tax"); } else if(window.SNWork) SNWork.open(row); });
        listMarks.push(m);
      }
      spaceAround(here||aim||v).forEach(function(x){
        var r=x.row;
        var lab=x.kind==="driver"?(r.name?r.name+" base":"Driver base"):x.kind==="drop"?(r.label||"Drop"):x.kind==="tax"?"ΔΟΥ Ρόδου":x.kind==="post"?"Post":(r.name||"Shop");
        pin(r, x.kind, lab);
      });
      var call=SNWork.activeCall&&SNWork.activeCall();
      if(call&&call.from&&call.to&&isFinite(call.from.lat)&&isFinite(call.to.lat)){
        var pts=(SNWork.arcPts&&SNWork.arcPts(call.from,call.to))||[[call.from.lat,call.from.lng],[call.to.lat,call.to.lng]];
        callLine=L.polyline(pts,{color:"#4df0ff",weight:3,opacity:.9}).addTo(map);
      }
    }
    if(lastRoute&&lastRoute.length>=2) drawGlowLine(lastRoute);
    drawBonds();
    if(vendors&&vendors.length) paintHuntPins(vendors, here);
  }
  function openPinMenu(p){
    if(!p||!isFinite(p.lat)) return;
    aim=p;
    goThere(p, 17);
    var live=listedShopOf(p);
    if(live){
      if(window.SNWork&&SNWork.canEdit&&SNWork.canEdit(live)){ SNWork.open(live); return; }
      selectVendor(live); return;
    }
    if(p.kind==="driver" && pinLive(p,"driver")){ selectVendor(p); return; }
    if(window.SNWork) SNWork.open({lat:p.lat,lng:p.lng,name:p.name||p.label||job&&job.query||"This place",raw:p.raw||"",kind:p.kind||"",id:p.id||"",tags:p.tags||p}, "home");
    talk((p.name||"This pin")+". Pick: my location, vendor, driver base, secret drop, post, or report.");
  }
  function cityWork(p, held){ if(!p) return; aim=p; hidePlace(); if(window.SNWork&&SNWork.setPin&&SNWork.setPin(p)) return; if(window.SNWork&&SNWork.takePoint&&SNWork.takePoint(p)) return; if(!held){ nameAim(p).then(function(n){ aim=n; if(window.SNWork&&SNWork.rename) SNWork.rename(n); }); return; } if(job&&job.query) p.name=p.name||job.query; openPinMenu(p); nameAim(p).then(function(n){ aim=n; if(window.SNWork&&SNWork.rename) SNWork.rename(n); }); }
  function bindMap(L){ if(mapBound||!map||!cityEl) return; mapBound=true; try{ map.attributionControl.setPrefix(false); map.attributionControl.setPosition("bottomleft"); }catch(e){} var lp=null; cityEl.addEventListener("pointerdown", function(e){ if(!cityEl.classList.contains("on")) return; if(e.target && e.target.closest && (e.target.closest(".leaflet-control")||e.target.closest(".leaflet-marker-icon")||e.target.closest(".leaflet-marker-shadow")||e.target.closest(".leaflet-interactive"))) return; if(e.isPrimary===false) return; if(correctingHere) return; lp={x:e.clientX,y:e.clientY,id:e.pointerId,held:false}; lp.t=setTimeout(function(){ if(!lp) return; lp.held=true; mapHeld=true; var ll=map.mouseEventToLatLng({clientX:lp.x,clientY:lp.y}); var p={lat:ll.lat,lng:ll.lng}; if(viewLevel()==="city") cityWork(p,true); else openLevelMenu(p,{x:lp.x,y:lp.y}, "national"); },1000); }, true); cityEl.addEventListener("pointermove", function(e){ if(!lp||lp.held) return; if(Math.hypot(e.clientX-lp.x,e.clientY-lp.y)>16){ clearTimeout(lp.t); lp=null; } }, true); function endLp(){ if(!lp) return; clearTimeout(lp.t); lp=null; } cityEl.addEventListener("pointerup", endLp, true); cityEl.addEventListener("pointercancel", endLp, true); map.on("click", function(e){ if(mapHeld){ mapHeld=false; return; } var p={lat:e.latlng.lat,lng:e.latlng.lng}; if(correctingHere){ applyHere(p); return; } if(window.SNWork&&SNWork.takePoint&&SNWork.takePoint(p)) return; if(window.SNWork&&SNWork.setPin&&SNWork.setPin(p)) return; if(job && job.kind==="find" && job.query && (job.status==="hunt"||job.status==="chosen") && isBrand(job.query)){ p.name=job.query; openPinMenu(p); return; } if(map.getZoom()>=10){ cityWork(p,false); } else { flyTap(p); } }); map.on("zoomend", function(){ if(!map||mapLanding) return; if(map.getZoom()<=4) showGlobe(); paintLayerBtn(); packSoon(); }); map.on("contextmenu", function(e){ try{ L.DomEvent.preventDefault(e); }catch(_){} mapHeld=true; var p={lat:e.latlng.lat,lng:e.latlng.lng}; if(correctingHere){ applyHere(p); return; } if(viewLevel()==="city") cityWork(p,true); else openLevelMenu(p, null, "national"); }); }
  var mapLanding=false;
  function resetCityEl(){
    if(!cityEl) return;
    try{ if(map){ map.remove(); } }catch(e){}
    map=null; mapBound=false; tileLayer=null;
    try{ cityEl._leaflet_id=null; cityEl.innerHTML=""; }catch(e){}
  }
  function showMap(p, z){
    if(!cityEl||!p||!isFinite(p.lat)) return;
    z=z==null?17:z;
    mapLanding=true;
    function build(L){
      if(!L||!L.map) throw new Error("no L");
      cityEl.classList.add("on");
      cityEl.style.pointerEvents="auto";
      if(cityEl._leaflet_id && !map) resetCityEl();
      if(!map){
        map=L.map(cityEl,{zoomControl:false,attributionControl:true}).setView([p.lat,p.lng], z);
        setLayer(mapLayer||"dark");
        bindMap(L);
      } else if(map.setView) map.setView([p.lat,p.lng], z);
      paintMapMarks(L, selected);
      setTimeout(function(){ try{ map.invalidateSize(); }catch(e){} paintLayerBtn(); paintMoney(false); packSoon(); mapLanding=false; },80);
    }
    loadMap().then(build).catch(function(){
      mapReady=null;
      resetCityEl();
      loadMap().then(build).catch(function(){
        mapLanding=false;
        talk("City streets did not load. Listing this pin on the globe.");
        if(window.SNWork) SNWork.open({lat:p.lat,lng:p.lng,name:p.name||(job&&job.query)||"This place",raw:p.raw||""},"home");
      });
    });
  }
  function showCity(v){ var p=v||selected||aim||here; if(!p){ talk("Point at a place first."); return; } aim=p; showMap(p, 14); }
  function showNational(p){ p=p||aim||here||facingPoint(); aim=p; showMap(p, 6); }
  function showCall(from, dest){ if(!from||!dest) return; var mid={lat:(from.lat+dest.lat)/2,lng:(from.lng+dest.lng)/2}; var d=km(from,dest); var z=d>80?6:d>8?10:14; showMap(mid, z); setTimeout(function(){ if(!map) return; try{ map.fitBounds([[from.lat,from.lng],[dest.lat,dest.lng]],{padding:[48,48],maxZoom:14}); }catch(e){} },500); }
  function startFly(p, then, ms, toDist){ if(!p) return; spin=0; var toYaw=p.lng*Math.PI/180, toPitch=Math.max(-1.15, Math.min(1.15, p.lat*Math.PI/180)); fly={fromYaw:yaw, fromPitch:pitch, toYaw:toYaw, toPitch:toPitch, fromDist:dist, toDist:toDist!=null?toDist:dist, t0:Date.now(), ms:ms||520, then:then||null}; needTick(); }
  function flyTap(p){ if(!p) return; if(window.SNWork&&SNWork.setPin&&SNWork.setPin(p)) return; if(window.SNWork&&SNWork.takePoint&&SNWork.takePoint(p)) return; aim=p; hidePlace(); var lvl=viewLevel(); nameAim(p).then(function(n){ if(aim&&Math.abs(aim.lat-p.lat)<0.3) aim=n; }); if(lvl==="globe"){ startFly(p, function(){ showNational(p); }); } else if(lvl==="national"){ showMap(p, 14); } else { cityWork(p,false); } }
  function startOrder(v){ if(!v) return; var live=listedShopOf(v)||v; job={kind:"find", query:live.name||"order", status:"chosen", shop:live, drop:myDrop()||null, t:Date.now()}; selectVendor(live); }
  function vendorTapped(v){
    if(!v) return;
    selected=v;
    fetchContacts(v).then(function(){
      if(liveEscrow()) openJobFromMap();
      else showShopCard(v);
    });
  }
  function selectVendor(v){
    if(!v) return;
    huntSeq++;
    selected=v;
    if(job){ job.shop=v; job.status="chosen"; }
    if(v&&v.id&&window.SNWork&&SNWork.hit) SNWork.hit(v.id);
    if(viewLevel()==="globe") showGlobe(); else if(window.L) paintMapMarks(window.L, v);
    clearNeed();
    syncTasks();
    paintJobArc();
    fetchContacts(v).then(function(){ showShopCard(v); });
  }
  function shopBits(v){
    var t=(v&&(v.tags||v))||{}, listed=null;
    if(window.SNWork&&SNWork.all){
      (SNWork.all().shops||[]).forEach(function(s){
        if(!s) return;
        if(v.id&&s.id===v.id) listed=s;
        else if(s.name&&v.name&&String(s.name).toLowerCase()===String(v.name).toLowerCase() && isFinite(s.lat) && km(s,v)<0.08) listed=s;
      });
    }
    return {
      listed:listed,
      menu:(listed&&listed.menu)||"",
      hours:t.opening_hours||(listed&&listed.hours)||"",
      phone:t.phone||t["contact:phone"]||t.tel||(listed&&listed.phone)||"",
      web:t.website||t["contact:website"]||"",
      cuisine:t.cuisine||""
    };
  }
  function showShopCard(v){
    var b=shopBits(v), n=v.name||"Shop";
    if(menuEl){ var ttl=menuEl.querySelector(".ttl"); if(ttl) ttl.textContent=String(n).toUpperCase().slice(0,22); }
    if(v.kind==="driver"){
      need({id:"now",label:"SEND JOB HERE",run:function(){ selected=v; startDeliver(); }});
      if(telOf(v)) need({id:"callbase",label:"CALL AGENT",run:function(){ dial(telOf(v),"the agent"); }});
      talk((n||"Astranov Delivery Agent")+". Starting base. Send a job here.");
      return;
    }
    var live=listedShopOf(v);
    if(!live){
      openPinMenu(v);
      return;
    }
    selected=live;
    if(job) job.shop=live;
    loadShopMenu(live, shopBits(live)).then(function(items){
      if(selected!==live) return;
      clearNeed();
      renderMenu(items);
      addContactBtns(live);
      talk(n+". Listed pin. "+(items&&items.length?items.length+" on the spreadsheet. ":"No rows yet. Owner adds them.")+"Tap a row to cart.");
    });
  }
  var SAMPLE_PIC={
    pizza:"https://upload.wikimedia.org/wikipedia/commons/thumb/a/a3/Eq_it-na_pizza-margherita_sep2005_s.jpg/320px-Eq_it-na_pizza-margherita_sep2005_s.jpg",
    beer:"https://upload.wikimedia.org/wikipedia/commons/thumb/3/3e/Weizenbier.jpg/320px-Weizenbier.jpg",
    burger:"https://upload.wikimedia.org/wikipedia/commons/thumb/0/0b/RedDot_Burger.jpg/320px-RedDot_Burger.jpg",
    gyro:"https://upload.wikimedia.org/wikipedia/commons/thumb/5/57/Gyros.jpg/320px-Gyros.jpg",
    food:"https://upload.wikimedia.org/wikipedia/commons/thumb/6/6d/Good_Food_Display_-_NCI_Visuals_Online.jpg/320px-Good_Food_Display_-_NCI_Visuals_Online.jpg"
  };
  function samplePic(name){
    var l=String(name||"").toLowerCase();
    if(/beer|lager|ale|pint/.test(l)) return SAMPLE_PIC.beer;
    if(/burger/.test(l)) return SAMPLE_PIC.burger;
    if(/gyro|souvlaki|kebab/.test(l)) return SAMPLE_PIC.gyro;
    if(/pizza|πιτσ/.test(l)) return SAMPLE_PIC.pizza;
    return SAMPLE_PIC.food;
  }
  function sampleMenu(v){
    var g=goodsOf((job&&job.query)||(v&&v.name)||"pizza");
    if(g.name==="beer") return [{name:"Lager 330ml",price:4,sample:true},{name:"Pint",price:5.5,sample:true},{name:"Local draft",price:4.5,sample:true}];
    if(g.name==="burger") return [{name:"Classic burger",price:8.5,sample:true},{name:"Cheeseburger",price:9.5,sample:true},{name:"Menu burger",price:12,sample:true}];
    if(g.name==="gyro") return [{name:"Pita gyro",price:7,sample:true},{name:"Portion gyro",price:9,sample:true}];
    return [{name:"Margherita",price:9,sample:true},{name:"Special",price:12,sample:true},{name:"Pepperoni",price:11,sample:true}];
  }
  function parseListedMenu(text){
    return String(text||"").split(/\n+/).map(function(line){
      var m=String(line).match(/^\s*(.+?)\s*[—\-–:]\s*(?:AV€|€|AVE)?\s*(\d+[.,]?\d*)\s*(?:[x×]\s*(\d+))?/i);
      if(!m) return null;
      return {name:m[1].trim(), price:Number(String(m[2]).replace(",",".")), stock:m[3]?Number(m[3]):null, sample:false};
    }).filter(function(x){ return x&&x.name&&x.price>0; });
  }
  function listedDishes(v){
    var s=(v&&v.tags)||v||{};
    if(s.dishes&&s.dishes.length) return s.dishes;
    if(s.menu) return parseListedMenu(s.menu);
    return [];
  }
  function wikiPic(q){
    var url="https://en.wikipedia.org/api/rest_v1/page/summary/"+encodeURIComponent(String(q||"Pizza").replace(/\s+/g,"_"));
    return fetchJson(url,{headers:{Accept:"application/json"}},7000).then(function(j){ return (j&&j.thumbnail&&j.thumbnail.source)||""; }).catch(function(){ return ""; });
  }
  function withPhotos(items){
    return Promise.all((items||[]).map(function(it){
      if(it.photo) return it;
      return wikiPic(it.name).then(function(u){
        it.photo=u||samplePic(it.name);
        if(!u) it.sample=true;
        return it;
      });
    }));
  }
  function loadShopMenu(v, b){
    var own=listedDishes(v);
    if(own.length) return Promise.resolve(own);
    if(listedShopOf(v)||(v&&v.kind==="shop"&&v.id)) return Promise.resolve([]);
    return Promise.resolve([]);
  }
  function htmlEsc(s){ return String(s==null?"":s).replace(/&/g,"&#38;").replace(/</g,"&#60;").replace(/>/g,"&#62;").replace(/\"/g,"&#34;").replace(/'/g,"&#39;"); }
  function renderMenu(items){
    if(!liveEl) return;
    liveEl.innerHTML='<div class="dish sheet head"><span>Photo</span><span>Description</span><span>AV€</span><span>Hours</span><span>Initial</span><span>Left</span></div>';
    (items||[]).forEach(function(it){
      var b=document.createElement("button");
      b.type="button";
      b.className="dish sheet";
      var init=it.stock0!=null?it.stock0:it.stock;
      var left=it.stock!=null?it.stock:init;
      b.innerHTML='<img alt="" src="'+htmlEsc(it.photo||samplePic(it.name))+'"><b>'+htmlEsc(it.name||it.desc||"")+(it.sample?' <i class="sample">SAMPLE</i>':'')+'</b><span class="px">'+fmtAve(Number(it.price)||0)+'</span><span class="hrs">'+htmlEsc(it.hours||"—")+'</span><span class="st">'+htmlEsc(init==null?"":init)+'</span><span class="st">'+htmlEsc(left==null?"":left)+'</span>';
      if(isFinite(Number(left)) && Number(left)<=0) b.disabled=true;
      b.onclick=function(){ pickDish(it, b); };
      liveEl.appendChild(b);
    });
    openMenu();
  }
  function partnerPlaces(){ return Promise.resolve([]); }
  function portalOffers(){ return []; }
  function telOf(v){ return officialTel(v); }
  function dial(tel, label){ tel=String(tel||"").replace(/[^\d+]/g,""); if(tel.replace(/\D/g,"").length<10){ talk("No official phone published for "+(label||"them")+"."); return; } location.href="tel:"+tel; }
  function callShop(){ dial(officialTel(selected)||officialTel(job&&job.shop), "the shop"); }
  function callAgent(){ var o=job&&job.carrier, d=o&&driverRow(o.id); dial(officialTel(d)||(o&&o.phone), "the Astranov agent"); }
  function offerCalls(){
    var shop=officialTel(selected)||officialTel(job&&job.shop);
    var o=job&&job.carrier, d=o&&driverRow(o.id), agent=officialTel(d)||(o&&o.phone&&String(o.phone).replace(/\D/g,"").length>=10?o.phone:"");
    if(shop) need({id:"callshop",label:"CALL "+String(shop).replace(/[^\d+ ]/g,"").slice(0,16),run:callShop});
    if(agent) need({id:"callagent",label:"CALL AGENT",run:callAgent});
    offerJobVideo();
  }
  function pinLive(row, kind){
    kind=kind||(row&&row.kind)||"shop";
    if(!row||!isFinite(+row.lat)||!isFinite(+row.lng)) return false;
    if(kind==="shop") return !!(row.name && isFinite(+row.lat) && isFinite(+row.lng));
    if(kind==="driver") return String(row.presence||"present")!=="off" && !!(row.vehicles||row.hours||row.routes||row.face||row.phone||row.range);
    if(kind==="drop") return !!(row.street||row.number||row.phone||row.photo||row.bell||row.floor);
    return true;
  }
  function listedShopOf(v){
    if(!v||!window.SNWork||!SNWork.all) return null;
    if(v.kind==="shop" && v.id && pinLive(v,"shop")) return v;
    var hit=null, shops=SNWork.all().shops||[];
    shops.forEach(function(s){
      if(!pinLive(s,"shop")) return;
      if(v.id&&s.id===v.id) hit=s;
      else if(!hit && s.name&&v.name&&String(s.name).toLowerCase()===String(v.name).toLowerCase() && km(s,v)<0.12) hit=s;
    });
    return hit;
  }
  function myDrop(){
    if(!window.SNWork||!SNWork.all) return null;
    var drops=(SNWork.all().drops||[]).filter(function(d){ return pinLive(d,"drop"); });
    if(!drops.length) return null;
    var from=here||aim;
    if(!from) return drops[0];
    drops.sort(function(a,b){ return km(from,a)-km(from,b); });
    return drops[0];
  }
  function bindTaskPins(){
    var shop=listedShopOf((job&&job.shop)||selected);
    if(shop){ selected=shop; if(job) job.shop=shop; }
    var drop=myDrop();
    if(drop&&job) job.drop=drop;
    return {shop:shop, drop:drop||here, agents:listedAgents()};
  }
  function listedAgents(){
    if(!window.SNWork) return [];
    var from=here||selected;
    return (SNWork.all().drivers||[]).filter(function(d){
      if(!pinLive(d,"driver")) return false;
      var range=Number(d.range)||25;
      return !from || km(from,d)<=range;
    }).map(function(d){
      var eta=Math.max(8,(here?travelMin(d,here):10)+(selected?travelMin(d,selected):0));
      return {id:d.id,name:(d.name||"Agent")+" · Astranov",how:"now",agent:true,driver:true,phone:d.phone||"",peer:d.peer||"",eta:eta,lat:d.lat,lng:d.lng,note:"Astranov Delivery Agent. Base listed."};
    }).sort(function(a,b){ return a.eta-b.eta; });
  }
  function listedDriverBases(){ return listedAgents(); }
  function offerList(){ return listedAgents(); }
  function cancelUnpaid(why){
    if(job && job.status==="paid") return false;
    job=null;
    currentOffers=[];
    hideCart();
    paintCartBtn();
    clearNeed();
    if(selected) addContactBtns(selected);
    talk(why||"No Astranov Delivery Agent in this area. Order cancelled. You were not charged.");
    return true;
  }
  function startDeliver(){
    if(!selected){ talk("Pick a listed shop pin first."); return; }
    var pins=bindTaskPins();
    if(!pins.shop){ talk("Only a verified SpaceNet shop pin can start a task. List it with +."); if(window.SNWork) SNWork.open(selected,"shop"); return; }
    if(job){ job.how="now"; job.shop=pins.shop; job.drop=pins.drop; }
    selected=pins.shop;
    function go(){
      var list=listedAgents();
      if(!list.length){
        cancelUnpaid("No listed Astranov Delivery Agent pin in this area. Order cancelled before checkout. You were not charged.");
        return;
      }
      if(!myDrop()) talk("No listed drop pin. Using YOU. List a delivery location with + for entrance details.");
      showOffers(list);
    }
    if(!here){
      talk("Checking for an Astranov agent near you…");
      locate(true).then(go);
      return;
    }
    go();
  }
  function chooseHow(how){ if(how!=="now"){ talk("Only Astranov Delivery Agents for now."); return startDeliver(); } startDeliver(); }
  function showOffers(list){ clearNeed(); currentOffers=list; list.forEach(function(o){ need({id:o.id, label:o.name.toUpperCase()+" · "+o.eta+"m", run:function(){ pickCarrier(o); }}); }); var f=list[0]; talk((f.name||"Astranov agent")+" · "+f.eta+" min. Registered base. Call to verify."); }
  function priceOf(){ var n=cartSum(); return n>0?n:withSnFee(10); }
  function pickCarrier(o){
    if(!listedAgents().length){ cancelUnpaid("No Astranov Delivery Agent in this area. Order cancelled before charge. You were not charged."); return; }
    var drop=clientPin();
    if(job){ job.carrier=o; job.how="now"; job.drop=drop; job.status=job.status==="paid"?job.status:"offer"; }
    publishOffer(o, drop);
    offerPay(priceOf(o)); offerCalls(); paintJobArc();
    if(map&&window.L) paintMapMarks(window.L, selected);
    talk((o.name||"Astranov agent")+" is chosen. Client pin is on their map. "+dropLine(drop)+". Call to verify, then pay.");
  }
  function publishOffer(o, drop){
    drop=drop||clientPin();
    if(!o||!drop||!isFinite(drop.lat)||!window.SNWork||!SNWork.publish) return;
    var shop=job&&job.shop||selected;
    SNWork.publish({
      id:"job"+(Date.now().toString(36)),
      kind:"job",
      status:"offer",
      lat:+drop.lat, lng:+drop.lng,
      query:(job&&job.query)||(shop&&shop.name)||"order",
      avc:Number(job&&job.price)||cartSum()||0,
      ride:rideFee(),
      customerPeer:SNWork.peerId?SNWork.peerId():"",
      shop:shop?{id:shop.id,name:shop.name,lat:shop.lat,lng:shop.lng,peer:shop.peer||"",phone:shop.phone||""}:null,
      driver:{id:o.id,name:o.name,peer:o.peer||"",lat:o.lat,lng:o.lng,phone:o.phone||""},
      drop:{id:drop.id,lat:+drop.lat,lng:+drop.lng,name:drop.name||drop.label||"Client",street:drop.street||"",number:drop.number||"",floor:drop.floor||"",bell:drop.bell||"",bellName:drop.bellName||"",photo:drop.photo||"",phone:drop.phone||"",secret:true}
    });
  }
  function offerPay(price){
    if(!listedAgents().length){ cancelUnpaid("No Astranov Delivery Agent in this area. Order cancelled before charge. You were not charged."); return; }
    var bal=avcGet(); if(job) job.price=price;
    need({id:"pay",label:"PAY "+fmtAve(price),run:function(){ spendAvc(price); }});
    if(bal<price) need({id:"reload",label:"RELOAD",run:function(){ reloadPaypal(Math.max(10, Math.ceil(price-bal))); }});
    talk((bal>=price)?("Pay "+fmtAve(price)+". You have "+fmtAve(bal)+"."):("Need "+fmtAve(price)+". You have "+fmtAve(bal)+". Reload euro through PayPal, 1 to 1."));
  }
  function spendAvc(price){
    if(!listedAgents().length){ cancelUnpaid("No Astranov Delivery Agent in this area. Not charged."); return; }
    if(paying) return;
    price=Number(price||(job&&job.price)||10); var bal=avcGet(); if(bal<price){ offerPay(price); return; } paying=true; avcSet(bal-price); if(job){ job.status="paid"; job.paidAvc=price; if(job.shop&&job.shop.id&&window.SNWork&&SNWork.takeStock) SNWork.takeStock(job.shop.id, job.cart); } openEscrow(price); clearNeed(); hideCart(); paintCartBtn(); syncTasks(); watchStages(price); offerCalls(); openTasks(); setTimeout(function(){ paying=false; },1200);
  }
  function watchStages(avc){ if(!job) return; job.status="paid"; talk("Paid. Ride at 1 AV€/km. SpaceNet 3% "+fmtAve(snFee(cartNet()))+" locked. An Astranov agent with a listed base runs this."); }
  function reloadPaypal(eur){ say("PayPal reload…"); try{ sessionStorage.setItem("sn:paypal-job", JSON.stringify(job||{})); sessionStorage.setItem("sn:paypal-reload", String(eur||10)); }catch(e){} fetch("/api/paypal/create-order",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({amount:eur||10,origin:location.origin,reference:"avc-reload"})}).then(function(r){return r.json().then(function(j){j.http=r.status;return j;});}).then(function(j){ if(j&&j.ok&&j.approve){ location.href=j.approve; return; } clearNeed(); need({id:"reload",label:"RELOAD",run:function(){ reloadPaypal(eur); }}); talk(j&&j.error==="paypal_not_configured"?"PayPal is not on this host yet.":"PayPal could not start. RELOAD is still here."); }).catch(function(){ clearNeed(); need({id:"reload",label:"RELOAD",run:function(){ reloadPaypal(eur); }}); talk("PayPal could not be reached."); }); }
  function restorePayJob(){ try{ var saved=JSON.parse(sessionStorage.getItem("sn:paypal-job")||"null"); if(saved){ job=saved; selected=saved.shop||null; } }catch(e){} }
  function clearPayQuery(){ try{ var u=new URL(location.href); ["paypal","token","PayerID"].forEach(function(k){u.searchParams.delete(k);}); history.replaceState({},"",u.pathname+(u.searchParams.toString()?"?"+u.searchParams.toString():"")); }catch(e){} }
  function handlePayPalReturn(){ var p; try{p=new URLSearchParams(location.search);}catch(e){return Promise.resolve(false);} var state=p.get("paypal"), token=p.get("token"); if(!state) return Promise.resolve(false); restorePayJob(); if(state==="cancel"){ clearPayQuery(); if(job&&job.carrier) pickCarrier(job.carrier); else talk("Reload cancelled."); return Promise.resolve(true); } if(state!=="success"||!token){ clearPayQuery(); talk("PayPal returned without an order."); return Promise.resolve(true); } say("Verifying PayPal…"); return fetch("/api/paypal/capture-order",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({orderId:token})}).then(function(r){return r.json();}).then(function(j){ clearPayQuery(); if(j&&j.ok&&String(j.status).toUpperCase()==="COMPLETED"){ var credited=Number(j.avc!=null?j.avc:(sessionStorage.getItem("sn:paypal-reload")||0)); var fee=snFee(credited), net=Math.round((credited-fee)*100)/100; avcAdd(net); bankPlatform(fee); try{ sessionStorage.removeItem("sn:paypal-job"); sessionStorage.removeItem("sn:paypal-reload"); }catch(e){} talk("Reloaded "+fmtAve(net)+". SpaceNet 3% "+fmtAve(fee)+". Balance "+fmtAve(avcGet())+"."); if(job&&job.carrier&&job.price) spendAvc(job.price); return true; } clearNeed(); need({id:"verify",label:"VERIFY PAYMENT",run:function(){location.href="/?paypal=success&token="+encodeURIComponent(token);}}); talk("Payment not verified yet. AV€ not moved."); return true; }).catch(function(){ clearNeed(); need({id:"verify",label:"VERIFY PAYMENT",run:function(){location.href="/?paypal=success&token="+encodeURIComponent(token);}}); talk("Payment verification failed. AV€ not moved."); return true; }); }
  function geoPos(opts){
    return new Promise(function(resolve, reject){
      if(!navigator.geolocation){ reject(new Error("no_geo")); return; }
      navigator.geolocation.getCurrentPosition(resolve, reject, opts);
    });
  }
  function ipLocate(){
    function take(j){
      if(!j||j.error) return null;
      var lat=Number(j.latitude!=null?j.latitude:j.lat), lng=Number(j.longitude!=null?j.longitude:(j.lon!=null?j.lon:j.lng));
      if(!isFinite(lat)||!isFinite(lng)) return null;
      return {lat:lat,lng:lng,ip:true,hint:j.city||j.region||j.country_name||j.country||""};
    }
    return fetchJson("https://ipapi.co/json/",{headers:{Accept:"application/json"}},6000).then(take).catch(function(){
      return fetchJson("https://ipwho.is/",{headers:{Accept:"application/json"}},6000).then(take);
    }).catch(function(){ return null; });
  }
  function paintFixBtn(){
    var el=document.getElementById("sn-fix");
    if(!el) return;
    el.textContent="CLICK MAP TO SET LOCATION MANUALLY";
    el.classList.toggle("on", !!correctingHere);
    el.classList.toggle("glow", !!correctingHere);
    if(cityEl) cityEl.classList.toggle("set-here", !!correctingHere);
    packSoon();
  }
  function offerFixHere(name, quiet){
    paintFixBtn();
    if(quiet){ if(name) say("You're in "+name+"."); return; }
    talk((name?("You're in "+name+"."):"Position locked.")+" Wrong place? Click the map to set location manually. The order stays.");
  }
  function correctHere(){
    correctingHere=true;
    paintFixBtn();
    if(menuEl) menuEl.classList.remove("on");
    talk("Tap the map where you are. Or type your city. The order stays.");
    if(inEl){ inEl.placeholder="Your city or street"; try{ inEl.focus(); }catch(e){} }
    var p=here||aim||facingPoint();
    if(viewLevel()==="globe") showNational(p);
    else if(map) showCity(p);
  }
  function applyHere(p, why){
    if(!p||!isFinite(p.lat)) return;
    correctingHere=false;
    paintFixBtn();
    if(inEl) inEl.placeholder="Talk to Astranov SpaceNet Grok";
    lockHere(p, true, true).then(function(){
      if(window.L) showCity(here);
      var w=pendingHunt; pendingHunt=null;
      if(w) hunt(w, here);
      else if(job && job.query && job.status==="hunt") hunt(job.query, here);
      else showAround(here);
      talk(why||("You're in "+(hereName||"this place")+". Order still here."));
    });
  }
  function findPlaceName(q){
    return Promise.all([nominatimPlaces(q, here||aim), photonPlaces(q, here||aim)]).then(function(g){
      var list=(g[0]||[]).concat(g[1]||[]).filter(function(v){ return v&&isFinite(v.lat); });
      list.sort(function(a,b){ if(!here) return 0; return km(here,a)-km(here,b); });
      return list[0]||null;
    });
  }
  function lockHere(p, snap, quiet){
    if(!p||!isFinite(p.lat)) return Promise.resolve(null);
    here={lat:+p.lat,lng:+p.lng}; hereAt=Date.now(); watchMove();
    var g=document.getElementById("gps");
    if(g){ g.classList.remove("busy"); g.classList.add("on"); }
    if(snap!==false){ lookAt(here); dist=1.65; }
    return reverseHere().then(function(name){
      if(p.hint && !name){ hereName=p.hint; here.name=hereName; name=p.hint; }
      offerFixHere(name, quiet);
      return here;
    });
  }
  function reverseHere(){ if(!here) return Promise.resolve(""); var url="https://photon.komoot.io/reverse?lat="+here.lat+"&lon="+here.lng; return fetchJson(url,{headers:{Accept:"application/json"}},8000).then(function(j){ var f=j&&j.features&&j.features[0], pr=f&&f.properties||{}; countryCode=String(pr.countrycode||pr.country||"").slice(0,2).toLowerCase(); hereName=pr.city||pr.locality||pr.district||pr.town||pr.name||pr.county||pr.state||pr.country||""; here.name=hereName; return hereName; }).catch(function(){ var nurl="https://nominatim.openstreetmap.org/reverse?format=jsonv2&zoom=10&lat="+here.lat+"&lon="+here.lng; return fetchJson(nurl,{headers:{Accept:"application/json","Accept-Language":"en"}},8000).then(function(j){ countryCode=String(j&&j.address&&j.address.country_code||"").toLowerCase(); hereName=humanName(j)|| (j&&j.address&&(j.address.city||j.address.town||j.address.village||j.address.country))||""; here.name=hereName; return hereName; }).catch(function(){ return ""; }); }); }
  function locate(quiet, snap){
    if(locating) return locating;
    if(!quiet) say("Finding you…");
    var g=document.getElementById("gps"); if(g) g.classList.add("busy");
    locating=geoPos({enableHighAccuracy:true,timeout:8000,maximumAge:30000}).catch(function(){
      return geoPos({enableHighAccuracy:false,timeout:14000,maximumAge:600000});
    }).then(function(pos){
      locating=null;
      return lockHere({lat:pos.coords.latitude,lng:pos.coords.longitude}, snap, quiet);
    }).catch(function(){
      locating=null;
      return ipLocate().then(function(p){
        if(!p){
          if(g) g.classList.remove("busy","on");
          if(!quiet) talk("No GPS lock on this device. Click the map to set location. The order stays.");
          correctHere();
          return here||undefined;
        }
        if(!quiet) say("Network location…");
        return lockHere(p, snap, quiet);
      });
    });
    return locating;
  }
  function goHere(){
    var g=document.getElementById("gps");
    if(g){ g.classList.remove("on"); g.classList.add("busy"); }
    say("GPS…");
    var fresh=here && hereAt && (Date.now()-hereAt<120000);
    var jobp=fresh?Promise.resolve(here):locate(true, false);
    jobp.then(function(p){
      if(!p){ if(g) g.classList.remove("busy"); talk("No GPS lock. Click the map to set location. The order stays."); correctHere(); return; }
      if(g){ g.classList.remove("busy"); g.classList.add("on"); }
      aim=p;
      reverseHere().then(function(){
        startFly(p, function(){ showCity(p); var w=pendingHunt; pendingHunt=null; if(w) hunt(w, p); else showAround(p); }, 1600, 1.16);
      });
    });
  }
  function askMic(){ if(!navigator.mediaDevices||!navigator.mediaDevices.getUserMedia) return Promise.resolve(false); var gum=navigator.mediaDevices.getUserMedia({audio:true}).then(function(s){ try{s.getTracks().forEach(function(t){t.stop();});}catch(e){} return true; }).catch(function(){ return false; }); return Promise.race([gum,new Promise(function(resolve){setTimeout(function(){resolve(false);},15000);})]); }
  function paintEar(){ var go=document.getElementById("go"); if(go) go.classList.toggle("ear", !!listening); }
  function stopListen(){
    wantEar=false; listening=false;
    try{ if(rec) rec.stop(); }catch(e){}
    rec=null; paintEar();
  }
  function listen(){
    if(speaking) return;
    var SR=window.SpeechRecognition||window.webkitSpeechRecognition;
    if(!SR){ talk("This browser has no voice. Type it."); return; }
    if(listening){ stopListen(); return; }
    wantEar=true;
    try{ if(rec) rec.stop(); }catch(e){}
    rec=new SR();
    rec.continuous=false;
    rec.interimResults=true;
    rec.lang=navigator.language||"en-US";
    rec.onresult=function(ev){
      var i,tx="",fin=false;
      for(i=ev.resultIndex;i<ev.results.length;i++){ tx+=ev.results[i][0].transcript; if(ev.results[i].isFinal) fin=true; }
      if(inEl) inEl.value=tx;
      if(fin&&tx.trim()){ var said=tx.trim(); stopListen(); run(said); }
    };
    rec.onend=function(){ listening=false; rec=null; paintEar(); };
    rec.onerror=function(ev){ listening=false; rec=null; paintEar(); if(ev&&ev.error==="not-allowed") wantEar=false; };
    try{ rec.start(); listening=true; paintEar(); }catch(e){ listening=false; paintEar(); }
  }
  function parseMind(j, raw){ var text=String((j&&(j.text||j.response||j.answer||j.say))||""); var act=String((j&&j.act)||"").toLowerCase(), q=(j&&j.q)||"", s=(j&&j.say)||"", ok=j&&j.priority_ok, id=(j&&(j.task_id||j.id))||"", split=j&&j.split, items=j&&j.items, places=j&&j.places, lat=j&&j.lat, lng=j&&j.lng; var m=text.match(/\{[\s\S]*\}/); if(m){ try{ var o=JSON.parse(m[0]); if(o){ if(o.act) act=String(o.act).toLowerCase(); if(o.q) q=String(o.q); if(o.say) s=String(o.say); if(!s && o.text) s=String(o.text); if(o.ok!=null) ok=o.ok; if(o.id) id=String(o.id); if(o.split) split=o.split; if(o.items) items=o.items; if(o.places) places=o.places; if(o.lat!=null) lat=o.lat; if(o.lng!=null) lng=o.lng; if(o.name) raw=o.name; } }catch(e){} } if(!s) s=text.replace(/\{[\s\S]*\}/,"").trim(); return {act:act||"talk", q:q||raw, say:s||"", ok:ok, id:id, split:split, items:items||[], places:places||[], lat:lat, lng:lng}; }
  function applyMind(m, raw){ if(!m) return; var a=String(m.act||"talk").toLowerCase(); if(m.say && a!=="hunt" && a!=="order" && a!=="find" && a!=="priority") talk(m.say); else if(m.say && a!=="priority") say(m.say); if(a==="talk"||!a) return; if(a==="priority"){ var ok=m.ok===true||m.ok==="true"||m.ok===1; bumpTask(m.id||(awaiting&&awaiting.id), ok, m.say); awaiting=null; return; } if(a==="justice"){ applyJustice(m); awaiting=null; return; } if(a==="pick"){ var q=String(m.q||m.id||"").toLowerCase(); var v=(vendors||[]).find(function(x){ var n=String(x.name||"").toLowerCase(); return n && q && (n===q || n.indexOf(q)>=0 || q.indexOf(n)>=0); }); if(v) return selectVendor(v); return; } if(a==="menu"){ var items=(m.items||[]).filter(function(it){ return it&&it.name; }).map(function(it){ return {name:String(it.name), price:Number(it.price)||0, sample:it.sample!==false, photo:it.photo||""}; }); if(window.__snMenuCb) window.__snMenuCb(items); return; } if(a==="locate") return goHere(); if(a==="globe"){ showGlobe(); return; } if(a==="national") return showNational(aim||here||facingPoint()); if(a==="map"||a==="city"||a==="streets") return showCity(selected||aim||here); if(a==="now") return startDeliver(); if(a==="mail"||a==="pickup"||a==="pick up") return startDeliver(); if(a==="pay") return spendAvc(priceOf(job&&job.carrier)); if(a==="reload") return reloadPaypal(10); if(a==="post"||a==="call"||a==="shop"||a==="drop"||a==="driver"||a==="base"){ if(window.SNWork) return SNWork.open(aim||here, a==="base"?"driver":a); return; } if(a==="hunt"||a==="order"||a==="find"){ var pins=[]; (m.places||[]).forEach(function(p){ if(!p||!isFinite(+p.lat)||!isFinite(+p.lng)) return; pins.push({id:"grok-"+(+p.lat).toFixed(5)+"-"+(+p.lng).toFixed(5),name:p.name||m.q||raw,lat:+p.lat,lng:+p.lng,raw:p.raw||p.addr||"",tags:{phone:p.phone||""},grok:true}); }); if(isFinite(+m.lat)&&isFinite(+m.lng)) pins.push({id:"grok-one",name:m.q||raw,lat:+m.lat,lng:+m.lng,raw:"",grok:true}); if(typeof huntMergeFn==="function" && pins.length) huntMergeFn(pins); else hunt(m.q||raw, here||aim, pins); return; } }
  function grok(text){ var raw=String(text||"").trim(); if(!raw) return; say("Grok…"); var origin=aim||here; var ctx={ place:(aim&&aim.name)||hereName||"", avc:avcGet(), shop:selected&&selected.name||"", query:job&&job.query||"", level:viewLevel(), vendors:(vendors||[]).slice(0,6).map(function(v){ var b=shopBits(v); return {id:v.id,name:v.name,km:origin?Math.round(km(origin,v)*10)/10:null,cuisine:b.cuisine,hours:b.hours,phone:!!b.phone,listed:!!b.menu}; }), tasks:loadTasks().filter(function(t){return t.status!=="done";}).slice(0,8).map(function(t){return {id:t.id,title:t.title,pri:t.pri,role:t.role,next:t.next};}), escrow:loadEscrow().filter(function(e){return e&&e.held;}).slice(0,4) }; if(awaiting&&awaiting.kind==="priority") ctx.priority_request={id:awaiting.id, reason:raw}; if(awaiting&&awaiting.kind==="justice") ctx.justice_request={id:awaiting.id, reason:raw}; var ctl=window.AbortController?new AbortController():null; var to=ctl&&setTimeout(function(){try{ctl.abort();}catch(e){}},8000); fetch("/api/ai",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({prompt:raw, message:raw, here:ctx, history:mindHist, spacenet:true, fast:true, force_paid:true, allow_paid:true}),signal:ctl&&ctl.signal}).then(function(r){return r.json().then(function(j){ j.http=r.status; return j; });}).then(function(j){ if(to) clearTimeout(to); var m=parseMind(j, raw); mindHist.push({role:"user",content:raw}); mindHist.push({role:"assistant",content:m.say||m.act||""}); if(mindHist.length>16) mindHist=mindHist.slice(-16); applyMind(m, raw); }).catch(function(){ if(to) clearTimeout(to); if(!vendors.length) talk("Grok is slow. Searching the map."); }); }
  function savePost(a, text){ var row={level:a.level, lat:a.at&&a.at.lat, lng:a.at&&a.at.lng, name:(a.at&&a.at.name)||"", text:String(text||"").trim(), t:Date.now(), kind:"post", id:"p"+Date.now().toString(36)}; try{ var list=JSON.parse(localStorage.getItem("sn:posts")||"[]"); list.unshift(row); localStorage.setItem("sn:posts", JSON.stringify(list.slice(0,80))); }catch(e){} if(window.SNWork&&SNWork.publish) SNWork.publish(row); talk("Posted at "+(row.name||a.level)+"."); if(window.SN&&SN.repaint) SN.repaint(); }
  function startAwait(kind, level, p){ awaiting={kind:kind, level:level, at:p}; if(inEl){ inEl.value=""; inEl.placeholder= kind==="post"?"Post at this place": kind==="add"?"Name what you add":"Task at this place"; try{ inEl.focus(); }catch(e){} } var n=(p&&p.name)||level; if(kind==="post") talk("Post at "+n+". Write it."); else if(kind==="add") talk("Add at "+n+". Name it."); else talk("Task at "+n+". Say what you want."); }
  function doCall(p){ if(window.SNWork){ SNWork.open(p,"call"); return; } nameAim(p).then(function(n){ var t=n.tags||{}; var phone=t.phone||t["contact:phone"]||t.tel||""; if(phone){ talk("Calling "+(n.name||"place")+"."); location.href="tel:"+String(phone).replace(/[^\d+]/g,""); } else talk("No phone listed for "+(n.name||"this place")+"."); }); }
  function whatIsHere(p, level){ say("Looking…"); nameAim(p).then(function(n){ aim=n; showAround(n); if(level!=="city" && n.water) talk("No named place on that water."); }); }
  function run(raw){ var t=String(raw||"").trim(); if(!t) return; var low=t.toLowerCase(); if(low==="reboot") return (window.SNReboot&&SNReboot()); if(low==="astranov admin"){ try{ localStorage.setItem("sn:admin","1"); }catch(e){} talk("This device is a SpaceNet admin."); return; } if(correctingHere){ findPlaceName(t).then(function(p){ if(p) applyHere(p); else talk("No place for "+t+". Try the city name."); }); return; } if(window.SNWork&&SNWork.picking&&SNWork.picking()){ SNWork.searchDest(t); return; } if(awaiting){ var a=awaiting; awaiting=null; if(inEl) inEl.placeholder="Talk to Astranov SpaceNet Grok"; if(a.kind==="priority") return grok("PRIORITY REQUEST id="+a.id+" reason: "+t); if(a.kind==="justice") return grok("JUSTICE DISPUTE escrow="+a.id+" reason: "+t); if(a.kind==="post"||a.kind==="add"){ if(window.SNWork) return SNWork.open(a.at, a.kind==="add"?"":"post"); savePost(a,t); return; } if(a.kind==="task"||a.kind==="find"){ aim=a.at||aim; return grok(t); } } var named=vendors.find(function(v){var n=(v.name||"").toLowerCase(); return n && (low===n || low.indexOf(n)>=0);}); if(named) return selectVendor(named); named=currentOffers.find(function(o){var n=(o.name||"").toLowerCase(); return n && (low===n || low.indexOf(n)>=0);}); if(named) return pickCarrier(named); if((here||aim) && !/^(hi|hey|hello|ok|okay|yes|no|thanks|γεια)\.?$/i.test(low)) hunt(t); return grok(t); }
  function globeHit(clientX, clientY){ if(!canvas) return null; var w=canvas.width,h=canvas.height,cx=w*0.5,cy=h*0.46,R=Math.min(w,h)*0.42/dist; var rect=canvas.getBoundingClientRect(); var px=(clientX-rect.left)*(w/Math.max(1,rect.width)); var py=(clientY-rect.top)*(h/Math.max(1,rect.height)); var x=(px-cx)/R, y2=(cy-py)/R, rr=x*x+y2*y2; if(rr>1) return null; var z2=Math.sqrt(Math.max(0,1-rr)); var cp=Math.cos(pitch), sp=Math.sin(pitch); var y=y2*cp+z2*sp; var z=-y2*sp+z2*cp; var lat=Math.asin(Math.max(-1,Math.min(1,y)))*180/Math.PI; var lng=Math.atan2(x,z)*180/Math.PI + yaw*180/Math.PI; while(lng>180) lng-=360; while(lng<-180) lng+=360; return {lat:lat,lng:lng}; }
  function pinOnGlobe(clientX, clientY){
    if(!canvas) return null;
    var w=canvas.width,h=canvas.height,cx=w*0.5,cy=h*0.46,R=Math.min(w,h)*0.42/dist;
    var rect=canvas.getBoundingClientRect();
    var px=(clientX-rect.left)*(w/Math.max(1,rect.width));
    var py=(clientY-rect.top)*(h/Math.max(1,rect.height));
    var best=null, bestD=22*(Math.min(2,devicePixelRatio||1));
    function consider(p, name){
      if(!p||!isFinite(p.lat)) return;
      var q=sph(p.lat,p.lng,cx,cy,R);
      if(!q) return;
      var d=Math.hypot(q.x-px,q.y-py);
      if(d<bestD){ bestD=d; best=p; if(name) best={lat:p.lat,lng:p.lng,name:name,raw:p.raw||""}; }
    }
    (vendors||[]).forEach(function(v){ consider(v, v.name); });
    consider(aim, aim&&aim.name);
    consider(selected, selected&&selected.name);
    return best;
  }
  function nameAim(p){ if(!p) return Promise.resolve(p); var url="https://photon.komoot.io/reverse?lat="+p.lat+"&lon="+p.lng; return fetchJson(url,{headers:{Accept:"application/json"}},8000).then(function(j){ var f=j&&j.features&&j.features[0], pr=f&&f.properties||{}; var n=pr.name||pr.street||pr.city||pr.locality||pr.district||""; p.name=n||pr.county||pr.country||""; p.raw=[pr.street,pr.city||pr.locality,pr.country].filter(Boolean).join(", "); p.tags=pr; p.water=!p.name; if(!p.name) p.name="This place"; return p; }).catch(function(){ var nurl="https://nominatim.openstreetmap.org/reverse?format=jsonv2&zoom=16&lat="+p.lat+"&lon="+p.lng; return fetchJson(nurl,{headers:{Accept:"application/json","Accept-Language":navigator.language||"en"}},8000).then(function(j){ p.name=humanName(j)||"This place"; p.raw=j&&j.display_name||p.name; p.tags=(j&&j.extratags)||{}; p.water=p.name==="This place"; return p; }).catch(function(){ p.name="This place"; p.water=true; p.tags={}; return p; }); }); }
  function hidePlace(){ if(placeEl){ placeEl.classList.remove("on"); placeEl.innerHTML=""; } packSoon(); }
  function placeMenuAt(sx,sy){ if(!placeEl) return; var w=Math.min(220, innerWidth-16), h=Math.min(320, innerHeight*0.5); var x=Math.max(8, Math.min(innerWidth-w-8, (sx||innerWidth/2)-w/2)); var y=Math.max(8, Math.min(innerHeight-h-8, (sy||innerHeight/2)-20)); placeEl.style.left=x+"px"; placeEl.style.top=y+"px"; packSoon(); }
  function addPlaceBtn(label,fn){ if(!placeEl) return; var b=document.createElement("button"); b.type="button"; b.textContent=label; b.onclick=function(ev){ ev.preventDefault(); ev.stopPropagation(); hidePlace(); try{ fn(); }catch(e){ talk("That step failed."); } }; placeEl.appendChild(b); }
  function openLevelMenu(p, screen, level){ if(!p) return; level=level||viewLevel(); aim=p; if(screen) tapScreen=screen; if(level==="city"){ cityWork(p,true); return; } hidePlace(); if(!placeEl) placeEl=document.getElementById("sn-place"); if(!placeEl){ placeEl=document.createElement("div"); placeEl.id="sn-place"; document.body.appendChild(placeEl); } placeEl.classList.add("on"); placeMenuAt((tapScreen&&tapScreen.x)||(innerWidth/2), (tapScreen&&tapScreen.y)||(innerHeight*0.38)); var ttl=document.createElement("div"); ttl.className="ttl"; ttl.textContent=p.name&&p.name!=="This place"?p.name:(level==="globe"?"Global":"National"); placeEl.appendChild(ttl); addPlaceBtn("WHAT IS HERE", function(){ whatIsHere(p, level); }); if(level==="globe"){ addPlaceBtn("GLOBAL POST", function(){ if(window.SNWork) SNWork.open(p,"post"); else startAwait("post","globe",p); }); addPlaceBtn("GLOBAL CALL", function(){ doCall(p); }); addPlaceBtn("GLOBAL TASK", function(){ startAwait("task","globe",p); }); addPlaceBtn("ADD", function(){ if(window.SNWork) SNWork.open(p); else startAwait("add","globe",p); }); } else { addPlaceBtn("NATIONAL POST", function(){ if(window.SNWork) SNWork.open(p,"post"); else startAwait("post","national",p); }); addPlaceBtn("NATIONAL CALL", function(){ doCall(p); }); addPlaceBtn("NATIONAL TASK", function(){ startAwait("task","national",p); }); } addPlaceBtn("CANCEL", function(){}); nameAim(p).then(function(n){ if(!placeEl||!placeEl.classList.contains("on")) return; if(aim&&Math.abs(aim.lat-p.lat)<0.3){ aim=n; var el=placeEl.querySelector(".ttl"); if(el && n.name) el.textContent=n.water?"No named place":n.name; } }); }
  function openPlace(p,screen){ openLevelMenu(p, screen, viewLevel()); }
  function listHere(){
    var p=here||aim;
    if(map&&map.getCenter){ try{ var c=map.getCenter(); if(c&&isFinite(c.lat)) p={lat:c.lat,lng:c.lng,name:(aim&&aim.name)||(here&&here.name)||"This place"}; }catch(e){} }
    if(!p||!isFinite(p.lat)){ talk("Set your place first. GPS or click the map."); if(typeof correctHere==="function") correctHere(); return; }
    aim=p;
    function go(){ openPinMenu(p); }
    if(viewLevel()!=="city"){ showCity(p); setTimeout(go, 280); } else go();
  }
  function hands(){ hidePlace(); var p=aim||here|| (map&&map.getCenter()?{lat:map.getCenter().lat,lng:map.getCenter().lng}:facingPoint()); var screen={x:innerWidth/2,y:innerHeight*0.4}; if(!here && viewLevel()==="globe"){ talk("Tap GPS to land on your city."); } if(viewLevel()==="city"){ cityWork(p,true); return; } openLevelMenu(p, screen, viewLevel()); }
  function placeGps(){ pack(); }
  function shownRect(el){
    if(!el) return null;
    var s=getComputedStyle(el);
    if(s.display==="none"||s.visibility==="hidden"||Number(s.opacity)===0) return null;
    var r=el.getBoundingClientRect();
    if(r.width<8||r.height<8) return null;
    return {x:r.left,y:r.top,w:r.width,h:r.height};
  }
  function hits(a,b,g){ g=g||10; return a.x<b.x+b.w+g && a.x+a.w+g>b.x && a.y<b.y+b.h+g && a.y+a.h+g>b.y; }
  function nudge(box, walls, W, H, pad){
    var i,j;
    for(i=0;i<18;i++){
      var hit=null;
      for(j=0;j<walls.length;j++) if(hits(box,walls[j],10)){ hit=walls[j]; break; }
      if(!hit) break;
      var left=box.x+box.w-hit.x, right=hit.x+hit.w-box.x, up=box.y+box.h-hit.y, down=hit.y+hit.h-box.y;
      var opts=[
        {x:box.x-left-12,y:box.y,d:left,side:1},
        {x:box.x+right+12,y:box.y,d:right,side:1},
        {x:box.x,y:box.y-up-12,d:up,side:0},
        {x:box.x,y:box.y+down+12,d:down,side:0}
      ];
      opts.sort(function(a,b){ return (b.side-a.side)|| (a.d-b.d); });
      var pick=null;
      for(j=0;j<opts.length;j++){
        var o=opts[j];
        if(o.x>=pad && o.y>=pad && o.x+box.w<=W-pad && o.y+box.h<=H-pad){ pick=o; break; }
      }
      if(!pick) pick=opts[0];
      box.x=Math.max(pad, Math.min(W-pad-box.w, pick.x));
      box.y=Math.max(pad, Math.min(H-pad-box.h, pick.y));
    }
    box.ok=true;
    for(j=0;j<walls.length;j++) if(hits(box,walls[j],6)) box.ok=false;
    return box;
  }
  var packT=0, packing=false;
  function packSoon(){ if(packing||packT) return; packT=requestAnimationFrame(function(){ packT=0; pack(); }); }
  function pack(){
    if(packing) return;
    packing=true;
    try{ packRun(); } finally { packing=false; }
  }
  function packRun(){
    var W=innerWidth||320, H=innerHeight||480, pad=10;
    var u=Math.round(Math.max(32, Math.min(42, Math.min(W,H)*0.055)));
    document.documentElement.style.setProperty("--u", u+"px");
    var g=document.getElementById("gps"), f=document.getElementById("f"), panel=document.getElementById("panel");
    if(!g||!f) return;
    var video=document.getElementById("sn-video"), sheet=document.getElementById("sn-sheet");
    if((video&&video.classList.contains("on"))||(sheet&&sheet.classList.contains("on"))){
      g.classList.add("ghost");
      if(menuEl) menuEl.classList.remove("on");
      if(tasksEl) tasksEl.classList.remove("on");
      if(cashEl) cashEl.classList.remove("on");
      return;
    }
    g.classList.remove("ghost");
    var gw=g.offsetWidth||u, gh=g.offsetHeight||(u+14);
    var walls=[], add=function(el){ var r=shownRect(el); if(r) walls.push(r); };
    add(document.getElementById("island"));
    add(panel||f);
    add(document.getElementById("sn-place"));
    add(document.getElementById("sn-pick"));
    add(menuEl&&menuEl.querySelector(".card"));
    add(tasksEl&&tasksEl.querySelector(".card"));
    add(layerBox&&layerBox.classList.contains("on")?layerBox:null);
    add(cashEl&&cashEl.querySelector(".card"));
    add(sheet&&sheet.querySelector(".card"));
    function free(c){
      var ww=c.w||gw, hh=c.h||gh;
      c.x=Math.max(pad, Math.min(W-pad-ww, c.x));
      c.y=Math.max(pad, Math.min(H-pad-hh, c.y));
      c.w=ww; c.h=hh; c.ok=true;
      for(var j=0;j<walls.length;j++) if(hits(c,walls[j],10)) c.ok=false;
      return c;
    }
    function sit(el, box){
      if(!el||!box) return box;
      var cur=el.getBoundingClientRect();
      if(Math.abs(cur.left-box.x)<3 && Math.abs(cur.top-box.y)<3){
        walls.push({x:box.x,y:box.y,w:box.w,h:box.h});
        return box;
      }
      el.style.left=Math.round(box.x)+"px";
      el.style.top=Math.round(box.y)+"px";
      el.style.right="auto";
      el.style.bottom="auto";
      walls.push({x:box.x,y:box.y,w:box.w,h:box.h});
      return box;
    }
    function placeSolid(el, prefer){
      if(!el) return null;
      var box=free(prefer);
      if(!box.ok) box=nudge(prefer, walls, W, H, pad);
      return sit(el, box);
    }
    var isl=shownRect(document.getElementById("island"));
    var topY=isl?Math.round(isl.y+isl.h+12):pad+52;
    var fr=(panel||f).getBoundingClientRect();
    var parked=loadPlace();
    var home=parked.gps?free({x:parked.gps.x, y:parked.gps.y, w:gw, h:gh}):free({x:W-pad-gw, y:fr.top-12-gh});
    if(parked.gps && !home.ok) home=free({x:W-pad-gw, y:fr.top-12-gh});
    var box=home.ok?home:null;
    if(!box){
    var pockets=[
      {x:home.x-Math.min(140,W*0.36), y:home.y},
      {x:W-pad-gw, y:topY},
      {x:pad, y:home.y},
      {x:pad, y:topY},
      {x:Math.round((W-gw)/2), y:home.y}
    ];
      for(var i=0;i<pockets.length;i++){
        var c=free(pockets[i]);
        if(c.ok){ box=c; break; }
      }
    }
    if(!box) box=nudge(home, walls, W, H, pad);
    if(!g.classList.contains("loose")){
      sit(g, box);
      if(!box.ok) g.classList.add("ghost");
    } else {
      var gr=g.getBoundingClientRect();
      box={x:gr.left,y:gr.top,w:gw,h:gh};
    }
    var line=document.getElementById("line"), panel=document.getElementById("panel");
    var extra=0;
    if(panel && !g.classList.contains("ghost")){
      var p=panel.getBoundingClientRect();
      if(box.x<p.right-4 && box.x+box.w>p.left) extra=Math.max(0, Math.ceil(p.right-box.x+8));
    }
    if(line && (line.style.paddingRight||"")!==(extra?extra+"px":"")) line.style.paddingRight=extra?extra+"px":"";
    if(pillEl&&pillEl.classList.contains("on")&&!pillEl.classList.contains("loose")&&f){
      var pw=pillEl.offsetWidth||88, ph=pillEl.offsetHeight||36;
      var ppref=parked.pill?{x:parked.pill.x,y:parked.pill.y,w:pw,h:ph}:{x:pad, y:fr.top-12-ph, w:pw, h:ph};
      placeSolid(pillEl, ppref);
    }
    if(tasksBtn&&tasksBtn.classList.contains("on")&&!tasksBtn.classList.contains("loose")){
      var tw=tasksBtn.offsetWidth||72, th=tasksBtn.offsetHeight||36;
      var tpref=parked.tasks?{x:parked.tasks.x,y:parked.tasks.y,w:tw,h:th}:{x:W-pad-tw, y:topY, w:tw, h:th};
      placeSolid(tasksBtn, tpref);
    }
    if(cartBtn&&cartBtn.classList.contains("on")&&!cartBtn.classList.contains("loose")){
      var cw=cartBtn.offsetWidth||72, ch=cartBtn.offsetHeight||36;
      var cpref=parked.cart?{x:parked.cart.x,y:parked.cart.y,w:cw,h:ch}:{x:pad, y:topY, w:cw, h:ch};
      placeSolid(cartBtn, cpref);
    }
    if(layerBtn&&layerBtn.classList.contains("on")&&!layerBtn.classList.contains("loose")){
      var lw=layerBtn.offsetWidth||72, lh=layerBtn.offsetHeight||36;
      var lpref=parked.layer?{x:parked.layer.x,y:parked.layer.y,w:lw,h:lh}:{x:W-pad-lw, y:topY+((tasksBtn&&tasksBtn.classList.contains("on"))?48:0), w:lw, h:lh};
      var lb=placeSolid(layerBtn, lpref);
      if(lb&&layerBox&&layerBox.classList.contains("on")){
        layerBox.style.left=Math.round(lb.x)+"px";
        layerBox.style.top=Math.round(lb.y+lh+8)+"px";
      }
    }
    var fixBtn=document.getElementById("sn-fix");
    if(fixBtn&&fixBtn.classList.contains("on")&&!fixBtn.classList.contains("loose")){
      var fw=fixBtn.offsetWidth||220, fh=fixBtn.offsetHeight||44;
      var fpref=parked.fix?{x:parked.fix.x,y:parked.fix.y,w:fw,h:fh}:{x:pad, y:fr.top-12-fh, w:fw, h:fh};
      placeSolid(fixBtn, fpref);
    }
    if(moneyBtn&&moneyBtn.classList.contains("loose")){
      var mw=moneyBtn.offsetWidth||132, mh=moneyBtn.offsetHeight||40;
      var mpref=parked.money?{x:parked.money.x,y:parked.money.y,w:mw,h:mh}:{x:Math.round((W-mw)/2), y:fr.top-12-mh, w:mw, h:mh};
      placeSolid(moneyBtn, mpref);
    }
  }
  function size(){ if(!canvas) return; var d=Math.min(2,devicePixelRatio||1); canvas.width=Math.max(1,Math.floor((innerWidth||320)*d)); canvas.height=Math.max(1,Math.floor((innerHeight||480)*d)); drawSig=""; pack(); needTick(); }
  function sph(latDeg,lngDeg,cx,cy,R){ var la=latDeg*Math.PI/180, ln=lngDeg*Math.PI/180-yaw; var x=Math.cos(la)*Math.sin(ln); var y=Math.sin(la); var z=Math.cos(la)*Math.cos(ln); var y2=y*Math.cos(pitch)-z*Math.sin(pitch); var z2=y*Math.sin(pitch)+z*Math.cos(pitch); if(z2<=0.02) return null; return {x:cx+R*x, y:cy-R*y2, z:z2}; }
  function drawGrid(ctx,cx,cy,R){ var lat,lng,a,b,step=15; ctx.lineWidth=Math.max(1, (devicePixelRatio||1)*0.7); ctx.strokeStyle="rgba(77,240,255,0.22)"; for(lat=-75; lat<=75; lat+=step){ ctx.beginPath(); a=null; for(lng=-180; lng<=180; lng+=6){ b=sph(lat,lng,cx,cy,R); if(b&&a){ ctx.moveTo(a.x,a.y); ctx.lineTo(b.x,b.y); } a=b; } ctx.stroke(); } ctx.strokeStyle="rgba(77,240,255,0.28)"; for(lng=-180; lng<180; lng+=step){ ctx.beginPath(); a=null; for(lat=-90; lat<=90; lat+=4){ b=sph(lat,lng,cx,cy,R); if(b&&a){ ctx.moveTo(a.x,a.y); ctx.lineTo(b.x,b.y); } a=b; } ctx.stroke(); } ctx.strokeStyle="rgba(126,233,255,0.55)"; ctx.beginPath(); ctx.arc(cx,cy,R,0,Math.PI*2); ctx.stroke(); }
  function pinLabel(p, fallback){ var n=String((p&&p.name)||fallback||""); if(!n || /^-?\d+\.\d+/.test(n) || /\d+\.\d+[NS]/.test(n)) return fallback||"PIN"; return n.slice(0,18); }
  function drawBond3d(ctx,a,b,cx,cy,R){
    if(!a||!b) return;
    var pts=bondPts(a,b), fill=jobFill(), lit=fillPts(pts, fill), i, q, last=null, d=Math.min(2,devicePixelRatio||1), done=fill>=0.99;
    ctx.save(); ctx.lineCap="round";
    ctx.strokeStyle="rgba(10,44,255,0.22)"; ctx.lineWidth=8*d; ctx.beginPath();
    last=null; for(i=0;i<pts.length;i++){ q=sph(pts[i][0],pts[i][1],cx,cy,R); if(q&&last){ ctx.moveTo(last.x,last.y); ctx.lineTo(q.x,q.y);} last=q; } ctx.stroke();
    if(lit.length>=2){
      ctx.shadowColor=done?"#ffd85a":"#3d6bff"; ctx.shadowBlur=(done?22:16)*d;
      ctx.strokeStyle=done?"rgba(255,216,90,0.45)":"rgba(10,44,255,0.45)"; ctx.lineWidth=10*d; ctx.beginPath();
      last=null; for(i=0;i<lit.length;i++){ q=sph(lit[i][0],lit[i][1],cx,cy,R); if(q&&last){ ctx.moveTo(last.x,last.y); ctx.lineTo(q.x,q.y);} last=q; } ctx.stroke();
      ctx.strokeStyle=done?"#ffd85a":"#7ee9ff"; ctx.lineWidth=2.6*d; ctx.beginPath();
      last=null; for(i=0;i<lit.length;i++){ q=sph(lit[i][0],lit[i][1],cx,cy,R); if(q&&last){ ctx.moveTo(last.x,last.y); ctx.lineTo(q.x,q.y);} last=q; } ctx.stroke();
      var tip=sph(lit[lit.length-1][0],lit[lit.length-1][1],cx,cy,R);
      if(tip){ ctx.fillStyle=done?"#ffd85a":"#7ee9ff"; ctx.beginPath(); ctx.arc(tip.x,tip.y,(done?5:4)*d,0,Math.PI*2); ctx.fill(); }
    }
    ctx.restore();
  }
  function drawPin(ctx,p,label,color,cx,cy,R){ if(!p||!isFinite(p.lat)||!isFinite(p.lng)) return; var q=sph(p.lat,p.lng,cx,cy,R); if(!q) return; var d=Math.min(2,devicePixelRatio||1); ctx.fillStyle=color; ctx.beginPath(); ctx.arc(q.x,q.y,4*d,0,Math.PI*2); ctx.fill(); ctx.fillStyle="#e8fbff"; ctx.font=(9*d)+"px system-ui"; ctx.fillText(pinLabel(p,label),q.x+6*d,q.y-4*d); }
  function tickFly(){ if(!fly) return; var u=(Date.now()-fly.t0)/fly.ms; if(u>=1){ yaw=fly.toYaw; pitch=fly.toPitch; if(fly.toDist!=null) dist=fly.toDist; var fn=fly.then; fly=null; if(fn) fn(); return; } u=u*u*(3-2*u); var dy=fly.toYaw-fly.fromYaw; while(dy>Math.PI) dy-=Math.PI*2; while(dy<-Math.PI) dy+=Math.PI*2; yaw=fly.fromYaw+dy*u; pitch=fly.fromPitch+(fly.toPitch-fly.fromPitch)*u; if(fly.toDist!=null) dist=fly.fromDist+(fly.toDist-fly.fromDist)*u; }
  function needTick(){ if(tickOn) return; tickOn=true; requestAnimationFrame(tick); }
  function tick(){ tickOn=false; try{ tickFly(); if(!drag && !pinch && !fly){ yaw+=spin; pitch=Math.max(-1.15,Math.min(1.15,pitch+pitchSpin)); spin*=0.988; pitchSpin*=0.988; if(Math.abs(spin)<0.00018) spin=0; if(Math.abs(pitchSpin)<0.00018) pitchSpin=0; } var moving=!!(drag||pinch||fly||Math.abs(spin)>0.00018||Math.abs(pitchSpin)>0.00018); var sig=yaw.toFixed(4)+"|"+pitch.toFixed(4)+"|"+dist.toFixed(3)+"|"+(here&&here.lat)+"|"+(aim&&aim.lat)+"|"+(selected&&selected.id)+"|"+globeMarks.length+"|"+jobFill().toFixed(2); if(moving || sig!==drawSig){ drawSig=sig; if(canvas){ var ctx=canvas.getContext("2d"); if(ctx){ ctx.fillStyle="#02040a"; ctx.fillRect(0,0,canvas.width,canvas.height); var w=canvas.width,h=canvas.height,cx=w*0.5,cy=h*0.46,R=Math.min(w,h)*0.42/dist; drawGrid(ctx,cx,cy,R); drawPin(ctx,here,hereName||"YOU","#4df0ff",cx,cy,R); if(aim) drawPin(ctx,aim,aim.name||"PIN","#ff8ad4",cx,cy,R); if(vendors) vendors.slice(0,8).forEach(function(v){ drawPin(ctx,v,v.name||"","#ff8ad4",cx,cy,R); }); if(selected) drawPin(ctx,selected,selected.name,"#ffd85a",cx,cy,R); if(here&&selected) drawBond3d(ctx,here,selected,cx,cy,R); globeMarks.slice(0,8).forEach(function(x){ var r=x.row, col=x.kind==="driver"?"#4df0ff":x.kind==="post"?"#9dffb0":x.kind==="drop"?"#ff8ad4":"#ffd85a"; drawPin(ctx,r,x.kind==="driver"?((r.name||"")+" base"):(r.name||r.label||x.kind),col,cx,cy,R); }); } } } }catch(e){} if(drag||pinch||fly||Math.abs(spin)>0.00018||Math.abs(pitchSpin)>0.00018) needTick(); }
  function boot(){ if(permsTried) return; permsTried=true; var returning=/[?&]paypal=/.test(location.search||""); handlePayPalReturn().then(function(){ if(returning) return locate(true); }); askMic(); watchMove(); if(window.SNWork&&SNWork.listenPeer) setTimeout(function(){ SNWork.listenPeer(); },800); }
  function repaint(){ if(map&&window.L) paintMapMarks(window.L, selected); }
  window.SN={ver:"V1",run:run,locate:locate,goHere:goHere,listen:listen,hunt:hunt,avc:avcGet,openPlace:openPlace,hands:hands,showCity:showCity,showNational:showNational,showMap:showMap,showCall:showCall,repaint:repaint,talk:talk,say:say,nameAim:nameAim,km:km,selectVendor:selectVendor,startOrder:startOrder,pack:pack,openMenu:openMenu,minMenu:minMenu,syncTasks:syncTasks,toggleTasks:toggleTasks,openTasks:openTasks,tickJustice:tickJustice,settle:settle,setLayer:setLayer,openCash:openCash,paintMoney:paintMoney,markStage:markStage,ingestJobs:ingestJobs,isMoving:isMoving,liveEscrow:liveEscrow,watchMove:watchMove,applyHere:applyHere,openPinMenu:openPinMenu,correctHere:correctHere};
  if(form) form.addEventListener("submit", function(e){ e.preventDefault(); var v=inEl&&inEl.value; if(inEl) inEl.value=""; run(v); });
  var go=document.getElementById("go"); if(go) go.addEventListener("click", function(e){ e.preventDefault(); if(inEl&&inEl.value.trim() && !listening){ run(inEl.value.trim()); inEl.value=""; return; } if(speaking){ try{ speechSynthesis.cancel(); }catch(x){} speaking=false; } listen(); });
  var plus=document.getElementById("plus"); if(plus) plus.addEventListener("click", function(){ listHere(); });
  var gpsBtn=document.getElementById("gps"); if(gpsBtn) gpsBtn.addEventListener("click", function(e){ e.preventDefault(); goHere(); });
  if(moneyBtn) moneyBtn.addEventListener("click", function(e){ e.preventDefault(); if(cashEl&&cashEl.classList.contains("on")) hideCash(); else openCash(); });
  if(cashEl){
    var cashBg=cashEl.querySelector(".bg"), cashX=cashEl.querySelector(".x");
    if(cashBg) cashBg.addEventListener("click", hideCash);
    if(cashX) cashX.addEventListener("click", function(e){ e.preventDefault(); hideCash(); });
    if(cashBody) cashBody.addEventListener("click", function(e){
      var b=e.target.closest("button"), act=b&&b.getAttribute("data-act");
      if(act==="reload") reloadPaypal(10);
      if(act==="mine"){
        var s=mineState(); s.on=!s.on; s.last=Date.now(); s.note=s.on?(listingsLive()?"Minting from listed presence.":"List a shop or a driver base to mint."):"Mint stopped."; mineSave(s); renderCash(); talk(s.on?"Mint on. Presence on SpaceNet mints AV€.":"Mint off.");
      }
    });
  }
  bindDrag(gpsBtn, "gps");
  bindDrag(moneyBtn, "money");
  bindDrag(layerBtn, "layer");
  bindDrag(document.getElementById("sn-fix"), "fix");
  bindDrag(tasksBtn, "tasks");
  bindDrag(cartBtn, "cart");
  bindDrag(pillEl, "pill");
  bindDrag(document.getElementById("plus"), "plus");
  bindDrag(document.getElementById("go"), "go");
  if(tasksBtn) tasksBtn.addEventListener("click", function(e){ e.preventDefault(); toggleTasks(); });
  (function(){ var fixBtn=document.getElementById("sn-fix"); if(fixBtn) fixBtn.addEventListener("click", function(e){ e.preventDefault(); if(fixBtn.dataset.skipClick==="1"){ fixBtn.dataset.skipClick=""; return; } correctHere(); }); })();
  if(cartBtn) cartBtn.addEventListener("click", function(e){ e.preventDefault(); if(cartEl&&cartEl.classList.contains("on")) hideCart(); else openCart(); });
  if(cartEl){
    var cBg=cartEl.querySelector(".bg"), cX=cartEl.querySelector(".x");
    if(cBg) cBg.addEventListener("click", hideCart);
    if(cX) cX.addEventListener("click", function(e){ e.preventDefault(); hideCart(); });
    if(cartList) cartList.addEventListener("click", function(e){
      var btn=e.target.closest("button"), act=btn&&btn.getAttribute("data-act");
      if(e.target&&e.target.id==="sn-floor"){ if(job) job.floor=e.target.checked; openCart(); return; }
      if(!act||!job||!job.cart) return;
      if(act==="out"){ hideCart(); startDeliver(); return; }
      var row=e.target.closest(".row"), i=row?Number(row.getAttribute("data-i")):-1;
      if(i<0||!job.cart[i]) return;
      if(act==="add") job.cart[i].qty=(Number(job.cart[i].qty)||1)+1;
      if(act==="sub"){ job.cart[i].qty=(Number(job.cart[i].qty)||1)-1; if(job.cart[i].qty<=0) job.cart.splice(i,1); }
      job.price=cartSum();
      if(!job.cart.length) hideCart(); else openCart();
    });
    if(cartList) cartList.addEventListener("change", function(e){ if(e.target&&e.target.id==="sn-floor"){ if(job) job.floor=e.target.checked; job.price=cartSum(); openCart(); } });
  }
  bindDrag(pillEl, "pill");
  if(pillEl) pillEl.addEventListener("click", function(e){ e.preventDefault(); openMenu(); });
  if(layerBtn) layerBtn.addEventListener("click", function(e){ e.preventDefault(); if(layerBox&&layerBox.classList.contains("on")) hideLayerMenu(); else openLayerMenu(); });
  if(layerBox) layerBox.addEventListener("click", function(e){ var b=e.target.closest("button"); if(b&&b.getAttribute("data-layer")) setLayer(b.getAttribute("data-layer")); });
  document.addEventListener("pointerdown", function(e){ if(!layerBox||!layerBox.classList.contains("on")) return; if(layerBox.contains(e.target)|| (layerBtn&&layerBtn.contains(e.target))) return; hideLayerMenu(); }, true);
  if(tasksEl){
    var tBg=tasksEl.querySelector(".bg"), tX=tasksEl.querySelector(".x");
    if(tBg) tBg.addEventListener("click", hideTasks);
    if(tX) tX.addEventListener("click", function(e){ e.preventDefault(); hideTasks(); });
    if(tasksList) tasksList.addEventListener("click", function(e){
      var btn=e.target.closest("button"), row=e.target.closest(".task");
      if(!row) return;
      var id=row.getAttribute("data-id"), act=btn&&btn.getAttribute("data-act");
      var t=loadTasks().filter(function(x){ return x.id===id; })[0];
      if(act==="dispute") askDispute(id);
      else if(act==="ready" && t) markStage(t.escrowId, "boxed");
      else if(act==="got" && t) markStage(t.escrowId, "with_agent");
      else if(act==="way" && t) markStage(t.escrowId, "moving");
      else if(act==="door" && t) markStage(t.escrowId, "door");
      else if(act==="leave" && t) agentLeave(t.escrowId);
      else if(act==="end" && t) goodsBack(t.escrowId);
      else if(act==="have" && t) settleVerify(t.escrowId);
      else if(act==="go") goTask(id);
      else openTaskDetail(id);
    });
  }
  if(menuEl){
    var mCard=menuEl.querySelector(".card"), mBg=menuEl.querySelector(".bg"), mX=menuEl.querySelector(".x");
    if(mBg) mBg.addEventListener("click", function(){ minMenu(); });
    if(mX) mX.addEventListener("click", function(e){ e.preventDefault(); minMenu(); });
    if(mCard){
      var mpts={}, mpinch=null;
      mCard.addEventListener("pointerdown", function(e){ mpts[e.pointerId]={x:e.clientX,y:e.clientY}; if(Object.keys(mpts).length>=2){ var ids=Object.keys(mpts), a=mpts[ids[0]], b=mpts[ids[1]]; mpinch={d:Math.hypot(a.x-b.x,a.y-b.y), s:menuScale, midY:(a.y+b.y)/2}; } });
      mCard.addEventListener("pointermove", function(e){ if(mpts[e.pointerId]) mpts[e.pointerId]={x:e.clientX,y:e.clientY}; if(!mpinch||Object.keys(mpts).length<2) return; var ids=Object.keys(mpts), a=mpts[ids[0]], b=mpts[ids[1]]; var d=Math.hypot(a.x-b.x,a.y-b.y), midY=(a.y+b.y)/2; var next=Math.abs(d-mpinch.d)>Math.abs(midY-mpinch.midY)?mpinch.s*(d/Math.max(24,mpinch.d)):mpinch.s+(mpinch.midY-midY)*0.008; menuScale=Math.max(0.72, Math.min(1.38, next)); mCard.style.setProperty("--ms", String(menuScale)); });
      function mup(e){ delete mpts[e.pointerId]; if(Object.keys(mpts).length<2) mpinch=null; }
      mCard.addEventListener("pointerup", mup);
      mCard.addEventListener("pointercancel", mup);
      mCard.addEventListener("wheel", function(e){ e.preventDefault(); menuScale=Math.max(0.72, Math.min(1.38, menuScale+(e.deltaY>0?-0.06:0.06))); mCard.style.setProperty("--ms", String(menuScale)); }, {passive:false});
    }
  }
  if(canvas){ var holdT=null; function lastXY(e,fallback){ var x=(e&&e.clientX)||(drag&&drag.lastX)||(fallback&&fallback.x)||0; var y=(e&&e.clientY)||(drag&&drag.lastY)||(fallback&&fallback.y)||0; return {x:x,y:y}; } function ptrCount(){ return Object.keys(pointers).length; } function applyGlobeZoom(next){ dist=Math.max(1.15, Math.min(3.2, next)); paintMoney(false); needTick(); if(dist<=1.18 && pinch && !pinch.descended){ pinch.descended=true; flyTap(facingPoint()); } } canvas.addEventListener("pointerdown",function(e){ needTick(); hidePlace(); pointers[e.pointerId]={x:e.clientX,y:e.clientY}; if(ptrCount()>=2){ var ids=Object.keys(pointers); var a=pointers[ids[0]], b=pointers[ids[1]]; pinch={d0:Math.hypot(a.x-b.x,a.y-b.y), dist0:dist, midY:(a.y+b.y)/2, gap:Math.hypot(a.x-b.x,a.y-b.y), descended:false}; if(holdT){ clearTimeout(holdT); holdT=null; } drag=null; spin=0; return; } drag={x:e.clientX,y:e.clientY,lastX:e.clientX,lastY:e.clientY,yaw:yaw,pitch:pitch,t:Date.now(),t0:Date.now(),held:false,samples:[{t:Date.now(),x:e.clientX,y:e.clientY}]}; spin=0; pitchSpin=0; try{canvas.setPointerCapture(e.pointerId);}catch(_){} if(holdT) clearTimeout(holdT); holdT=setTimeout(function(){ holdT=null; if(!drag||pinch) return; var moved=Math.hypot(drag.lastX-drag.x, drag.lastY-drag.y); if(moved>28) return; drag.held=true; var pt=lastXY({clientX:drag.lastX,clientY:drag.lastY}); tapScreen=pt; var hit=globeHit(pt.x,pt.y); if(!hit){ say("Hold on the globe itself."); return; } if(window.SNWork&&SNWork.takePoint&&SNWork.takePoint(hit)) return; openLevelMenu(hit, pt, "globe"); },420);}); canvas.addEventListener("pointermove",function(e){ if(pointers[e.pointerId]) pointers[e.pointerId]={x:e.clientX,y:e.clientY}; if(pinch && ptrCount()>=2){ var ids=Object.keys(pointers); var a=pointers[ids[0]], b=pointers[ids[1]]; var gap=Math.hypot(a.x-b.x,a.y-b.y); var midY=(a.y+b.y)/2; var dGap=gap-(pinch.gap||pinch.d0); var dY=midY-(pinch.midY||midY); if(Math.abs(dGap)>Math.abs(dY)+4) applyGlobeZoom(pinch.dist0*(pinch.d0/Math.max(12,gap))); else if(Math.abs(dY)>6) applyGlobeZoom(dist + dY*0.01); pinch.midY=midY; pinch.gap=gap; return; } if(!drag) return; var now=Date.now(), w=Math.max(180,canvas.clientWidth||innerWidth), hh=Math.max(180,canvas.clientHeight||innerHeight); drag.lastX=e.clientX; drag.lastY=e.clientY; drag.samples=drag.samples||[]; drag.samples.push({t:now,x:e.clientX,y:e.clientY}); if(drag.samples.length>8) drag.samples=drag.samples.slice(-8); if(drag.held) return; var moved=Math.hypot(e.clientX-drag.x,e.clientY-drag.y); if(moved<8) return; yaw=drag.yaw-(e.clientX-drag.x)/w*Math.PI*2; pitch=Math.max(-1.15,Math.min(1.15, drag.pitch+(e.clientY-drag.y)/hh*Math.PI));}); function release(e){ delete pointers[e.pointerId]; if(ptrCount()<2) pinch=null; if(holdT){ clearTimeout(holdT); holdT=null; } if(!drag)return; var pt=lastXY(e, {x:drag.lastX,y:drag.lastY}); var moved=Math.hypot(pt.x-drag.x, pt.y-drag.y); var held=drag.held; var sm=drag.samples||[]; var w=Math.max(180,canvas.clientWidth||innerWidth), hh=Math.max(180,canvas.clientHeight||innerHeight); if(!held && moved>=28 && sm.length>=2){ var a=sm[0], b=sm[sm.length-1], dt=Math.max(16,b.t-a.t); var cap=0.14; spin=(-(b.x-a.x)/w)*Math.PI*2*(16/dt); pitchSpin=((b.y-a.y)/hh)*Math.PI*(16/dt); if(spin>cap) spin=cap; if(spin<-cap) spin=-cap; if(pitchSpin>cap) pitchSpin=cap; if(pitchSpin<-cap) pitchSpin=-cap; } else { spin=0; pitchSpin=0; } drag=null; needTick(); if(held) return; if(moved<28){ var named=pinOnGlobe(pt.x,pt.y); if(named){ tapScreen=pt; openPinMenu(named); return; } var hit=globeHit(pt.x,pt.y); if(!hit){ say("Tap the globe itself."); return; } tapScreen=pt; flyTap(hit); } } canvas.addEventListener("pointerup",release); canvas.addEventListener("pointercancel",release); canvas.addEventListener("contextmenu",function(e){ e.preventDefault(); var hit=globeHit(e.clientX,e.clientY); if(hit) openLevelMenu(hit,{x:e.clientX,y:e.clientY},"globe"); }); canvas.addEventListener("wheel",function(e){ e.preventDefault(); applyGlobeZoom(dist+(e.deltaY>0?0.08:-0.08)); }, {passive:false}); }
  document.addEventListener("pointerdown", function(e){ if(!placeEl||!placeEl.classList.contains("on")) return; if(placeEl.contains(e.target)) return; if(e.target===canvas) return; hidePlace(); }, true);
  document.addEventListener("pointerdown", function(){ if(!permsTried) boot(); }, {passive:true});
  window.addEventListener("resize", size);
  if(window.visualViewport) visualViewport.addEventListener("resize", packSoon);
  ["sn-sheet","sn-menu","sn-tasks","sn-cash","sn-video","sn-pick","sn-cart","city"].forEach(function(id){
    var el=document.getElementById(id);
    if(!el) return;
    new MutationObserver(function(){ if(!packing) packSoon(); }).observe(el,{attributes:true,attributeFilter:["class"]});
  });
  size(); needTick(); setTimeout(boot,200); setTimeout(syncTasks,500); setTimeout(function(){ paintMoney(false); },400); setInterval(function(){ if(!permsTried) boot(); },4000); setInterval(function(){ tickJustice(); mineTick(); }, 20000);
})();
