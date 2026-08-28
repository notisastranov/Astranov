(function(){
  if(window.__SN_ALIVE && window.SN && window.SN.run) return;
  var VER="4026";
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
  var here=null, hereName="", hereAt=0, countryCode="", things={}, vendors=[], selected=null, job=null, currentOffers=[], huntSeq=0, offerSeq=0, locating=null, pendingHunt=null, aim=null, tapScreen=null, placeEl=null, awaiting=null, mapBound=false, mapHeld=false;
  var map=null, mapReady=null, hereMark=null, vendorMark=null, routeLine=null, routeGlow=null, aimMark=null, callLine=null, tileLayer=null, mapLayer="dark", lastRoute=null;
  var listening=false, speaking=false, wantEar=false, rec=null, permsTried=false, mindHist=[];
  function say(t){ if(lineEl&&t!=null) lineEl.textContent=String(t); packSoon(); }
  function noCoords(t){ return String(t||"").replace(/\b-?\d+\.\d+\s*[NS],?\s*-?\d+\.\d+\s*[EW]\b/gi,"").replace(/\b-?\d{1,3}\.\d+\s*,\s*-?\d{1,3}\.\d+\b/g,"").replace(/\s{2,}/g," ").trim(); }
  function talk(t){ t=noCoords(t); if(!t) return; say(t); stopListen(); speaking=true; try{ if(window.speechSynthesis){ speechSynthesis.cancel(); var u=new SpeechSynthesisUtterance(String(t)); u.onend=function(){ speaking=false; }; u.onerror=function(){ speaking=false; }; speechSynthesis.speak(u); return; } }catch(e){} speaking=false; }
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
  function need(spec){ spec=spec||{}; var id=spec.id||("m"+Date.now()+Math.random().toString(36).slice(2,6)); things[id]=spec; if(!liveEl) return id; var b=document.createElement("button"); b.type="button"; b.textContent=spec.label||id; b.onclick=function(){ try{ spec.run(); }catch(e){ talk("That step failed. Try again."); } }; liveEl.appendChild(b); openMenu(); return id; }
  var tasksBtn=document.getElementById("sn-tasks-btn");
  var tasksEl=document.getElementById("sn-tasks");
  var tasksList=document.getElementById("sn-tasks-list");
  function loadTasks(){ try{ return JSON.parse(localStorage.getItem("sn:tasks")||"[]"); }catch(e){ return []; } }
  function saveTasks(list){ try{ localStorage.setItem("sn:tasks", JSON.stringify((list||[]).slice(0,80))); }catch(e){} }
  function jobNext(j){
    if(!j) return "";
    if(j.status==="paid") return "Wait for a real associate. Picked → boxed → moving → handed → verified.";
    if(j.carrier && j.price) return "Pay "+fmtAve(j.price)+".";
    if(j.how) return "Pick a carrier.";
    if(j.shop) return "Instant, mail, or pick up.";
    if(j.query) return "Pick the place.";
    return "Finish this.";
  }
  function derivedTasks(){
    var out=[], perish=job?goodsOf(job.query):null;
    if(job && job.status && job.status!=="done" && job.status!=="paid"){
      out.push({id:"job-live", role:"user", title:job.query||"Order", next:jobNext(job), status:"open", perish:perish&&perish.strict, hold:perish&&perish.hold, t:job.t||Date.now(), auto:1});
    }
    if(window.SNWork){
    var all=SNWork.all();
    (all.shops||[]).forEach(function(s){
      if(!s||!s.id) return;
      if(s.hours && (s.menu || (s.menuPhotos&&s.menuPhotos.length))) return;
      out.push({id:"list-shop-"+s.id, role:"vendor", title:s.name||"Shop", next:"Finish hours and menu.", status:"open", listing:s, t:s.t||Date.now(), auto:1});
    });
    (all.drivers||[]).forEach(function(d){
      if(!d||!d.id) return;
      if(d.hours && d.vehicles) return;
      out.push({id:"list-driver-"+d.id, role:"driver", title:d.name||"Driver base", next:"Finish vehicles and working time.", status:"open", listing:d, t:d.t||Date.now(), auto:1});
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
      var base=(e.driver&&e.driver.name)||"Driver base";
      if(e.flag==="hold" && e.status==="paid"){
        out.push({id:"just-"+e.id+"-user", role:"user", title:title, next:"Hold is up. Take the credit back or wait.", status:"open", escrowId:e.id, perish:!!e.strict, t:e.at, auto:1});
      }
      if(e.status==="paid"){
        out.push({id:"stg-"+e.id+"-pick", role:"vendor", title:shop, next:"Mark picked.", status:"open", escrowId:e.id, perish:!!e.strict, t:e.at, auto:1});
        out.push({id:"stg-"+e.id+"-wait", role:"user", title:title, next:"Paid. Hold "+e.holdMin+" min. "+age+" min in. Waiting on the shop.", status:"open", escrowId:e.id, perish:!!e.strict, hold:e.holdMin, t:e.at, auto:1});
      } else if(e.status==="picked"){
        out.push({id:"stg-"+e.id+"-box", role:"vendor", title:shop, next:"Mark boxed.", status:"open", escrowId:e.id, perish:!!e.strict, t:e.at, auto:1});
      } else if(e.status==="boxed"){
        if(e.how==="pickup" || e.how==="mail") out.push({id:"stg-"+e.id+"-hand", role:"vendor", title:shop, next:e.how==="mail"?"Posted. Mark handed when it left.":"Hand it over. Mark handed.", status:"open", escrowId:e.id, t:e.at, auto:1});
        else out.push({id:"stg-"+e.id+"-move", role:"driver", title:base, next:"Mark moving.", status:"open", escrowId:e.id, t:e.at, auto:1});
      } else if(e.status==="moving"){
        out.push({id:"stg-"+e.id+"-hand", role:"driver", title:base, next:"Mark handed.", status:"open", escrowId:e.id, t:e.at, auto:1});
      } else if(e.status==="handed" || e.flag==="handed"){
        out.push({id:"stg-"+e.id+"-verify", role:"user", title:title, next:"Confirm you have it, or dispute.", status:"open", escrowId:e.id, t:e.at, auto:1});
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
  function renderTaskList(){
    if(!tasksList) return;
    var list=loadTasks().filter(function(t){ return t.status!=="done"; });
    if(!list.length){ tasksList.innerHTML='<p class="note">Nothing on you.</p>'; return; }
    tasksList.innerHTML=list.map(function(t){
      var ask=t.ask&&t.ask.state==="wait"?" · waiting on Grok":(t.boost!=null?" · moved":"");
      return '<div class="task" data-id="'+t.id+'"><b>'+String(t.title||"Task").replace(/[<>]/g,"")+'</b><span>'+String(t.role||"").toUpperCase()+" · "+String(t.next||"")+" "+ask+'</span><div class="row"><button type="button" data-act="go">DO</button>'+( /verify/.test(t.id)?'<button type="button" data-act="dispute">DISPUTE</button>':'')+'<button type="button" data-act="problem">PROBLEM</button></div></div>';
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
  function payoutIfMine(e){
    if(!e||!e.split) return;
    var ids=myListingIds();
    if(e.shop&&e.shop.id&&ids[e.shop.id]==="shop") payRole(e,"vendor", Number(e.split.vendor)||0);
    if(e.driver&&e.driver.id&&ids[e.driver.id]==="driver") payRole(e,"driver", Number(e.split.driver)||0);
  }
  function ingestJobs(list){
    var dirty=false;
    var order={paid:0,picked:1,boxed:2,moving:3,handed:4,released:5,done:5};
    (list||[]).forEach(function(j){
      if(!j||!j.id) return;
      var cur=escrowOf(j.id);
      if(!cur){ putEscrow(j, true); dirty=true; cur=j; }
      else if((order[j.status]||0)>(order[cur.status]||0)){ cur=Object.assign({}, cur, j); putEscrow(cur, true); dirty=true; }
      if(cur && (cur.status==="released"||cur.status==="done") && cur.split){ payoutIfMine(cur); putEscrow(cur, true); }
    });
    if(dirty) syncTasks();
  }
  function creditEarned(who, n){ if(!who||!n) return; try{ var e=JSON.parse(localStorage.getItem("sn:earned")||"{}"); e[who]=(Number(e[who])||0)+Number(n); localStorage.setItem("sn:earned", JSON.stringify(e)); }catch(x){} }
  function holdMinOf(j){ var g=goodsOf(j&&j.query); return Math.max(8, Number(g&&g.hold)||40); }
  function openEscrow(price){
    var g=goodsOf(job&&job.query);
    var row={id:"e"+(Date.now().toString(36)), kind:"job", avc:Number(price||0), held:true, status:"paid", at:Date.now(), holdMin:holdMinOf(job), strict:!!(g&&g.strict), query:(job&&job.query)||"", how:job&&job.how, shop:job&&job.shop?{id:job.shop.id,name:job.shop.name,lat:job.shop.lat,lng:job.shop.lng}:null, driver:job&&job.carrier&&job.carrier.driver?{id:job.carrier.id,name:job.carrier.name}:null, flag:"", evidence:{paidAt:Date.now()}, lat:(job&&job.shop&&job.shop.lat)||(here&&here.lat)||0, lng:(job&&job.shop&&job.shop.lng)||(here&&here.lng)||0, name:(job&&job.query)||"job"};
    putEscrow(row); if(job) job.escrowId=row.id; return row;
  }
  function settle(id, split, reason){
    var e=escrowOf(id); if(!e||!e.held) return;
    split=split||{}; var c=Math.max(0, Number(split.customer)||0), v=Math.max(0, Number(split.vendor)||0), d=Math.max(0, Number(split.driver)||0);
    var sum=c+v+d; if(sum<e.avc) c+=(e.avc-sum);
    if(c) avcAdd(c);
    e.held=false; e.status="released"; e.split={customer:c,vendor:v,driver:d,platform:0}; e.reason=reason||""; e.flag="";
    payoutIfMine(e);
    putEscrow(e);
    if(job&&job.escrowId===id) job.status="done";
    syncTasks();
    talk(reason||("Settled. You "+c.toFixed(2)+", shop "+v.toFixed(2)+", driver "+d.toFixed(2)+". SpaceNet takes none of a failed job."));
  }
  function settleRefund(id, reason){ var e=escrowOf(id); if(!e) return; settle(id, {customer:e.avc, vendor:0, driver:0}, reason||"Full credit back. Nothing was picked."); }
  function settleVerify(id){
    var e=escrowOf(id); if(!e) return;
    var v=e.how==="pickup"?e.avc:Math.round(e.avc*0.5*100)/100;
    var d=e.how==="now"?Math.round((e.avc-v)*100)/100:0;
    if(e.how==="mail"){ v=Math.round(e.avc*0.7*100)/100; d=Math.round((e.avc-v)*100)/100; }
    settle(id, {customer:0, vendor:v, driver:d}, "Verified. Shop and driver are credited. You kept the goods.");
  }
  function markStage(id, status){
    var e=escrowOf(id); if(!e||!e.held) return;
    e.status=status; e.evidence=e.evidence||{}; e.evidence[status+"At"]=Date.now();
    if(status==="handed") e.flag="handed";
    else if(e.flag!=="hold") e.flag="";
    putEscrow(e); syncTasks();
    if(status==="picked") talk("Picked. Credit still locked. Box it.");
    else if(status==="boxed") talk(e.how==="now"?"Boxed. Driver: mark moving.":(e.how==="mail"?"Boxed. Mark handed when it is posted.":"Boxed. Hand it over at the shop."));
    else if(status==="moving") talk("Moving. Mark handed when it is with them.");
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
    settle(id, {customer:split.customer, vendor:split.vendor, driver:split.driver}, m.say||"Grok settled it.");
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
        settle(e.id, {customer:Math.max(0,e.avc-v), vendor:v, driver:0}, "Went silent after pick. Shop kept a share for work started. Rest back. Driver 0. SpaceNet takes nothing.");
        dirty=true; return;
      }
      if(e.status==="moving" && stageAge>=hold*2){
        var sv=Math.round(e.avc*0.4*100)/100, sd=Math.round(e.avc*0.2*100)/100;
        settle(e.id, {customer:Math.max(0,e.avc-sv-sd), vendor:sv, driver:sd}, "Went silent while moving. Shop and driver kept a share for work marked. Rest back. We do not invent a GPS trace.");
        dirty=true; return;
      }
      if(e.status==="handed" && e.evidence&&e.evidence.handedAt && (now-e.evidence.handedAt)>15*60000 && e.flag==="handed"){
        var dropOk=false;
        if(window.SNWork){ (SNWork.all().drops||[]).forEach(function(d){ if(d&& (d.phone||d.doorbell||d.bell||d.shot||d.photo)) dropOk=true; }); }
        if(dropOk) settle(e.id, {customer:0, vendor:Math.round(e.avc*0.5*100)/100, driver:Math.round(e.avc*0.5*100)/100}, "No confirm after handoff, and a real drop was listed. Shop and driver are credited.");
        else settle(e.id, {customer:e.avc, vendor:0, driver:0}, "No confirm, and no doorbell or photo on the drop. Credit back. We don't dump that on you.");
        dirty=true;
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
      '<p>Earned on listings: '+fmtAve(earned)+'</p>'+
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
  function fetchJson(url,opt,ms){ var ctl=window.AbortController?new AbortController():null, timer=ctl&&setTimeout(function(){ctl.abort();},ms||14000); opt=opt||{}; if(ctl) opt.signal=ctl.signal; return fetch(url,opt).then(function(r){ if(!r.ok) throw new Error("http_"+r.status); return r.json(); }).finally(function(){ if(timer) clearTimeout(timer); }); }
  function cleanQuery(q){ return String(q||"").replace(/^\s*(i\s+)?(want|need|would like|am looking for|find|get|buy|order|show me)\s+(me\s+)?/i,"").trim()||String(q||"shop").trim(); }
  function escOverpass(s){ return String(s||"").replace(/[^a-z0-9\u0370-\u03ff _-]/gi," ").trim().slice(0,40); }
  function pointOf(r){ var c=r&&r.center||{}; return {lat:+(r&&r.lat!=null?r.lat:c.lat),lng:+(r&&r.lon!=null?r.lon:c.lon)}; }
  function askLocation(){ talk("Tap GPS. The globe flies you to your city."); var g=document.getElementById("gps"); if(g) g.classList.remove("on","busy"); }
  function avcGet(){ try{ if(localStorage.getItem("sn:ave-restored")!=="4024"){ localStorage.setItem("sn:avc","3000000"); localStorage.setItem("sn:ave-restored","4024"); } return Math.max(0, Number(localStorage.getItem("sn:avc")||0)); }catch(e){ return 0; } }
  function avcSet(n){ try{ localStorage.setItem("sn:avc", String(Math.max(0, Math.round(Number(n)*100)/100))); }catch(e){} paintMoney(true); }
  function avcAdd(n){ avcSet(avcGet()+Number(n||0)); }
  function humanName(j){ if(!j) return ""; var a=j.address||j.properties||{}; var blob=String((j.name||"")+" "+(j.display_name||"")+" "+(a.name||"")+" "+(a.water||"")).toLowerCase(); var n=j.name||a.amenity||a.shop||a.road||a.street||a.neighbourhood||a.suburb||a.village||a.town||a.city||a.locality||a.municipality||a.county||""; if(/ocean|sea|gulf|strait|bay of/.test(blob) && !a.road && !a.street && !a.amenity && !a.shop) return ""; n=String(n||"").trim(); if(/^-?\d+\.\d+/.test(n)) return ""; return n; }
  function overpassFilters(q){ var l=q.toLowerCase(); if(/beer|μπύρα|μπυρα|ale|lager|pub/.test(l)) return ['["amenity"~"pub|bar|biergarten",i]','["shop"~"alcohol|beverages",i]','["name"~"beer|pub|bar|μπύρα",i]']; if(/pizza|πιτσ/.test(l)) return ['["cuisine"~"pizza",i]','["name"~"pizza|pizzeria|πιτσ",i]']; if(/burger|hamburger|cheeseburger|μπέργκερ|μπουργκερ/.test(l)) return ['["cuisine"~"burger",i]','["name"~"burger|hamburger|goody|mcdonald|burger king",i]','["amenity"="fast_food"]']; if(/gyro|gyros|souvlaki|kebab|shawarma|γυρο|σουβλ/.test(l)) return ['["cuisine"~"kebab|greek|grill",i]','["name"~"gyro|gyros|souvlaki|kebab|γυρο|σουβλ",i]','["amenity"="fast_food"]']; if(/coffee|cafe|καφ/.test(l)) return ['["amenity"="cafe"]']; if(/pharm|medicine|φαρμα/.test(l)) return ['["amenity"="pharmacy"]']; if(/ice|gelato|παγω/.test(l)) return ['["amenity"="ice_cream"]','["cuisine"~"ice_cream",i]']; if(/food|restaurant|eat|φαγη|soup|salad|sushi/.test(l)) return ['["amenity"~"restaurant|fast_food|cafe"]']; if(/supermarket|grocery|market/.test(l)) return ['["shop"~"supermarket|convenience"]']; if(/shop|store/.test(l)) return ['["shop"]']; var e=escOverpass(q); return ['["name"~"'+e+'",i]','["cuisine"~"'+e+'",i]','["amenity"~"'+e+'",i]','["shop"~"'+e+'",i]']; }
  function photonQuery(q){ var l=String(q||"").toLowerCase(); if(/beer|μπύρα|μπυρα|ale|lager|pub/.test(l)) return "pub"; if(/pizza|πιτσ/.test(l)) return "pizza"; if(/food|eat|φαγη|restaurant/.test(l)) return "restaurant"; if(/shop|store/.test(l)) return "shop"; if(/coffee|cafe|καφ/.test(l)) return "cafe"; if(/pharm|φαρμα/.test(l)) return "pharmacy"; return q; }
  function overpassPlaces(q,from){ from=from||here; if(!from) return Promise.resolve([]); var clauses=overpassFilters(q).map(function(f){ return 'nwr(around:12000,'+from.lat+','+from.lng+')["name"]'+f+';'; }).join(""); var query='[out:json][timeout:14];('+clauses+');out center tags 30;'; var urls=["https://overpass-api.de/api/interpreter?data=","https://overpass.kumi.systems/api/interpreter?data="]; function attempt(i){ if(i>=urls.length) return Promise.resolve([]); return fetchJson(urls[i]+encodeURIComponent(query),{headers:{Accept:"application/json"}},17000).then(function(j){return j.elements||[];}).catch(function(){return attempt(i+1);}); } return attempt(0).then(function(rows){ return rows.map(function(r){ var p=pointOf(r),t=r.tags||{}; return {id:"osm-"+r.type+"-"+r.id,name:t.name,lat:p.lat,lng:p.lng,raw:t["addr:street"]||"OpenStreetMap",tags:t}; }).filter(function(v){return v.name&&isFinite(v.lat)&&isFinite(v.lng);}); }); }
  function nominatimPlaces(q,from){ from=from||here; if(!from) return Promise.resolve([]); var dy=.14,dx=dy/Math.max(.25,Math.cos(from.lat*Math.PI/180)); var box=[from.lng-dx,from.lat+dy,from.lng+dx,from.lat-dy].join(","); var url="https://nominatim.openstreetmap.org/search?format=jsonv2&addressdetails=1&limit=12&bounded=1&viewbox="+encodeURIComponent(box)+"&q="+encodeURIComponent(q); return fetchJson(url,{headers:{Accept:"application/json","Accept-Language":navigator.language||"en"}},13000).then(function(rows){ return (rows||[]).filter(function(r){return /amenity|shop|office|craft|tourism|healthcare|leisure/.test(String(r.category||r.class||""));}).map(function(r){return {id:"osm-"+(r.osm_type||"")+"-"+r.osm_id,name:r.name||String(r.display_name||"").split(",")[0],lat:+r.lat,lng:+r.lon,raw:r.display_name,tags:r.extratags||{}};}); }).catch(function(){return [];}); }
  function photonPlaces(q,from){ from=from||here; if(!from) return Promise.resolve([]); var url="https://photon.komoot.io/api/?q="+encodeURIComponent(photonQuery(q))+"&lat="+from.lat+"&lon="+from.lng+"&limit=16"; return fetchJson(url,{headers:{Accept:"application/json"}},12000).then(function(j){ return (j.features||[]).map(function(f){ var c=f.geometry&&f.geometry.coordinates, pr=f.properties||{}; if(!c||!pr.name) return null; return {id:"osm-"+(pr.osm_type||"n")+"-"+(pr.osm_id||""), name:pr.name, lat:+c[1], lng:+c[0], raw:[pr.street,pr.city||pr.locality].filter(Boolean).join(", ")||"OpenStreetMap", tags:pr}; }).filter(Boolean); }).catch(function(){return [];}); }
  function hunt(query,at){ var raw=String(query||"").trim(),q=cleanQuery(raw); var from=at||aim||here; job={kind:"find",query:q,status:"hunt",at:from||null}; selected=null; if(!from){ pendingHunt=raw; talk("Need you on the map. Tap GPS."); goHere(); return; } say("Finding "+q+"…"); var seq=++huntSeq;
    function near(list){ var seen={}; return (list||[]).filter(function(v){ if(!v||!v.name||!isFinite(v.lat)) return false; var k=(v.name+"|"+(+v.lat).toFixed(4)+"|"+(+v.lng).toFixed(4)).toLowerCase(); if(seen[k]) return false; seen[k]=1; return km(from,v)<=25; }).sort(function(a,b){return km(from,a)-km(from,b);}); }
    function showList(list, line){ if(seq!==huntSeq) return; if(selected && job && job.status==="chosen") return; vendors=list; clearNeed(); vendors.slice(0,6).forEach(function(v,i){ var d=km(from,v).toFixed(1); need({id:"v"+i,label:(v.kind==="driver"?((v.name||"Driver").toUpperCase()+" BASE"):v.name.toUpperCase())+" · "+d+" km",run:function(){selectVendor(v);}}); }); if(line) talk(line); }
    var extra=near(window.SNWork&&SNWork.match?SNWork.match(q, from):[]);
    if(extra.length) showList(extra, extra.length+" on this device. Checking the net…");
    Promise.all([nominatimPlaces(q,from),overpassPlaces(q,from),photonPlaces(q,from)]).then(function(groups){ if(seq!==huntSeq) return; if(selected && job && job.status==="chosen") return; var list=near(extra.concat(groups[0]).concat(groups[1]).concat(groups[2])); if(!list.length){ if(!extra.length){ clearNeed(); talk("No named place for "+q+" nearby. Say it another way."); } return; } showList(list, extra.length&&list.length<=extra.length?null:("Found "+list.length+". Ask me for the best, or tap one.")); }).catch(function(){ if(seq!==huntSeq)return; if(!extra.length){ clearNeed(); talk("Search failed. Try again."); } }); }
  function loadMap(){ if(window.L) return Promise.resolve(window.L); if(mapReady) return mapReady; mapReady=new Promise(function(resolve,reject){ if(!document.querySelector('link[data-sn-map]')){ var css=document.createElement("link"); css.rel="stylesheet"; css.href="/js/vendor/leaflet.css?v="+VER; css.setAttribute("data-sn-map",""); document.head.appendChild(css); } var s=document.createElement("script"); s.src="/js/vendor/leaflet.js?v="+VER; s.onload=function(){resolve(window.L);}; s.onerror=reject; document.head.appendChild(s); }); return mapReady; }
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
    routeGlow=window.L.polyline(latlngs,{color:"#4df0ff",weight:14,opacity:0.2,lineCap:"round",interactive:false}).addTo(map);
    routeLine=window.L.polyline(latlngs,{color:"#7ee9ff",weight:3,opacity:1,lineCap:"round",interactive:false}).addTo(map);
    try{ map.fitBounds(routeLine.getBounds(),{padding:[56,56],maxZoom:16}); }catch(e){}
  }
  function paintJobArc(){
    var stops=[], d;
    if(here) stops.push(here);
    if(selected) stops.push(selected);
    if(job&&job.carrier&&job.carrier.driver){ d=driverRow(job.carrier.id); if(d&&isFinite(d.lat)) stops.push(d); }
    if(stops.length<2) return Promise.resolve(null);
    return osrmLine(stops).then(function(line){ drawGlowLine(line); return line; });
  }
  var listMarks=[], globeMarks=[];
  function spaceAround(from){
    if(!window.SNWork) return [];
    var all=SNWork.all(), rows=[];
    function add(list, kind, w){
      (list||[]).forEach(function(r){
        if(!r||!isFinite(r.lat)) return;
        if(kind==="driver" && String(r.presence||"present")==="off") return;
        var d=from?km(from,r):0;
        if(from && d>18) return;
        rows.push({row:r, kind:kind, d:d, hits:Number(r.hits)||0, w:w});
      });
    }
    add(all.shops,"shop",3);
    add(all.drivers,"driver",3);
    add(all.posts,"post",1);
    add(all.drops,"drop",1);
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
  function paintMapMarks(L, v){ if(hereMark) hereMark.remove(); if(vendorMark) vendorMark.remove(); if(aimMark) aimMark.remove(); if(routeLine) try{map.removeLayer(routeLine);}catch(e){} if(routeGlow) try{map.removeLayer(routeGlow);}catch(e){} if(callLine) callLine.remove(); listMarks.forEach(function(m){ try{m.remove();}catch(e){} }); listMarks=[]; if(here) hereMark=L.circleMarker([here.lat,here.lng],{radius:7,color:"#4df0ff",fillColor:"#4df0ff",fillOpacity:.95}).addTo(map).bindTooltip("YOU",{permanent:true,direction:"top",className:"sn-tip",opacity:1}); if(aim && (!here || km(here,aim)>0.05)) aimMark=L.circleMarker([aim.lat,aim.lng],{radius:6,color:"#ff8ad4",fillColor:"#ff8ad4",fillOpacity:.9}).addTo(map); if(v) vendorMark=L.circleMarker([v.lat,v.lng],{radius:7,color:"#ffd85a",fillColor:"#ffd85a",fillOpacity:.9}).addTo(map).bindTooltip(v.name||"Place",{permanent:false,direction:"top",className:"sn-tip"});
    if(window.SNWork && map){
      var colors={shop:"#ffd85a",driver:"#4df0ff",drop:"#ff8ad4",post:"#9dffb0"};
      function pin(row,color,label){ if(!row||!isFinite(row.lat)) return; var m=L.circleMarker([row.lat,row.lng],{radius:7,color:color,fillColor:color,fillOpacity:.9}).addTo(map).bindTooltip(label,{permanent:false,direction:"top"}); m.on("click", function(e){ try{ L.DomEvent.stopPropagation(e); }catch(_){} mapHeld=true; if(window.SNWork) SNWork.open(row); }); listMarks.push(m); }
      spaceAround(here||aim||v).forEach(function(x){
        var r=x.row;
        var lab=x.kind==="driver"?(r.name?r.name+" base":"Driver base"):x.kind==="drop"?(r.label||"Drop"):x.kind==="post"?"Post":(r.name||"Shop");
        pin(r, colors[x.kind]||"#ffd85a", lab);
      });
      var call=SNWork.activeCall&&SNWork.activeCall();
      if(call&&call.from&&call.to&&isFinite(call.from.lat)&&isFinite(call.to.lat)){
        var pts=(SNWork.arcPts&&SNWork.arcPts(call.from,call.to))||[[call.from.lat,call.from.lng],[call.to.lat,call.to.lng]];
        callLine=L.polyline(pts,{color:"#4df0ff",weight:3,opacity:.9}).addTo(map);
      }
    }
    if(lastRoute&&lastRoute.length>=2) drawGlowLine(lastRoute);
  }
  function cityWork(p){ if(!p) return; aim=p; hidePlace(); if(window.SNWork&&SNWork.takePoint&&SNWork.takePoint(p)) return; if(window.SNWork) SNWork.open(p); nameAim(p).then(function(n){ aim=n; if(window.SNWork&&SNWork.rename) SNWork.rename(n); else if(!window.SNWork) say(n.water?"No named place on that water.":(n.name||"This place")); }); }
  function bindMap(L){ if(mapBound||!map||!cityEl) return; mapBound=true; try{ map.attributionControl.setPosition("bottomleft"); }catch(e){} var lp=null; cityEl.addEventListener("pointerdown", function(e){ if(!cityEl.classList.contains("on")) return; if(e.target && e.target.closest && e.target.closest(".leaflet-control")) return; if(e.isPrimary===false) return; lp={x:e.clientX,y:e.clientY,id:e.pointerId,held:false}; lp.t=setTimeout(function(){ if(!lp) return; lp.held=true; mapHeld=true; var ll=map.mouseEventToLatLng({clientX:lp.x,clientY:lp.y}); var p={lat:ll.lat,lng:ll.lng}; if(viewLevel()==="city") cityWork(p); else openLevelMenu(p,{x:lp.x,y:lp.y}, "national"); },420); }, true); cityEl.addEventListener("pointermove", function(e){ if(!lp||lp.held) return; if(Math.hypot(e.clientX-lp.x,e.clientY-lp.y)>16){ clearTimeout(lp.t); lp=null; } }, true); function endLp(){ if(!lp) return; clearTimeout(lp.t); lp=null; } cityEl.addEventListener("pointerup", endLp, true); cityEl.addEventListener("pointercancel", endLp, true); map.on("click", function(e){ if(mapHeld){ mapHeld=false; return; } var p={lat:e.latlng.lat,lng:e.latlng.lng}; if(window.SNWork&&SNWork.takePoint&&SNWork.takePoint(p)) return; if(map.getZoom()>=10){ cityWork(p); } else { flyTap(p); } }); map.on("zoomend", function(){ if(!map) return; if(map.getZoom()<=4) showGlobe(); paintLayerBtn(); packSoon(); }); map.on("contextmenu", function(e){ try{ L.DomEvent.preventDefault(e); }catch(_){} mapHeld=true; var p={lat:e.latlng.lat,lng:e.latlng.lng}; if(viewLevel()==="city") cityWork(p); else openLevelMenu(p, null, "national"); }); }
  function showMap(p, z){ if(!cityEl||!p||!isFinite(p.lat)) return; loadMap().then(function(L){ cityEl.classList.add("on"); cityEl.style.pointerEvents="auto"; if(!map){ map=L.map(cityEl,{zoomControl:false,attributionControl:true,tap:true,preferCanvas:true}).setView([p.lat,p.lng], z); setLayer(mapLayer||"dark"); bindMap(L); } else if(map.flyTo) map.flyTo([p.lat,p.lng], z, {duration:0.7}); else map.setView([p.lat,p.lng], z); paintMapMarks(L, selected); setTimeout(function(){ try{ map.invalidateSize(); }catch(e){} paintLayerBtn(); paintMoney(false); packSoon(); },40); }).catch(function(){ mapReady=null; showGlobe(); talk("Map failed to load."); }); }
  function showCity(v){ var p=v||selected||aim||here; if(!p){ talk("Point at a place first."); return; } aim=p; showMap(p, 14); }
  function showNational(p){ p=p||aim||here||facingPoint(); aim=p; showMap(p, 6); }
  function showCall(from, dest){ if(!from||!dest) return; var mid={lat:(from.lat+dest.lat)/2,lng:(from.lng+dest.lng)/2}; var d=km(from,dest); var z=d>80?6:d>8?10:14; showMap(mid, z); setTimeout(function(){ if(!map) return; try{ map.fitBounds([[from.lat,from.lng],[dest.lat,dest.lng]],{padding:[48,48],maxZoom:14}); }catch(e){} },500); }
  function startFly(p, then, ms, toDist){ if(!p) return; spin=0; var toYaw=p.lng*Math.PI/180, toPitch=Math.max(-1.15, Math.min(1.15, p.lat*Math.PI/180)); fly={fromYaw:yaw, fromPitch:pitch, toYaw:toYaw, toPitch:toPitch, fromDist:dist, toDist:toDist!=null?toDist:dist, t0:Date.now(), ms:ms||520, then:then||null}; needTick(); }
  function flyTap(p){ if(!p) return; if(window.SNWork&&SNWork.takePoint&&SNWork.takePoint(p)) return; aim=p; hidePlace(); var lvl=viewLevel(); nameAim(p).then(function(n){ if(aim&&Math.abs(aim.lat-p.lat)<0.3) aim=n; }); if(lvl==="globe"){ startFly(p, function(){ showNational(p); }); } else if(lvl==="national"){ showMap(p, 14); } else { cityWork(p); } }
  function startOrder(v){ if(!v) return; job={kind:"find", query:v.name||"order", status:"chosen", shop:v, t:Date.now()}; selectVendor(v); }
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
    showShopCard(v);
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
      need({id:"now",label:"NOW",run:function(){ chooseHow("now"); }});
      talk((n||"Driver base")+". Starting point. Send a job to this base.");
      return;
    }
    if(b.menu) need({id:"menu",label:"MENU",run:function(){ talk(b.menu.slice(0,280)); }});
    if(b.phone) need({id:"callshop",label:"CALL",run:function(){ location.href="tel:"+String(b.phone).replace(/[^\d+]/g,""); }});
    need({id:"now",label:"NOW",run:function(){ chooseHow("now"); }});
    need({id:"mail",label:"MAIL",run:function(){ chooseHow("mail"); }});
    need({id:"pickup",label:"PICK UP",run:function(){ chooseHow("pickup"); }});
    if(b.menu) talk(n+". Menu is here. Instant, mail, or pick up.");
    else {
      talk(n+(b.hours?". "+b.hours:"")+". Getting the menu.");
      grok("MENU for "+n+(hereName?" in "+hereName:"")+". Public menu only. act=menu. No invented prices.");
    }
  }
  function partnerPlaces(how){ if(!selected||how==="pickup") return Promise.resolve([]); var f=how==="mail"?'["amenity"="post_office"]':'["office"~"courier|logistics",i]'; var q='[out:json][timeout:12];nwr(around:25000,'+selected.lat+','+selected.lng+')["name"]'+f+';out center tags 12;'; return fetchJson("https://overpass-api.de/api/interpreter?data="+encodeURIComponent(q),{headers:{Accept:"application/json"}},15000).then(function(j){ return (j.elements||[]).map(function(r){var p=pointOf(r),t=r.tags||{};return {id:"carrier-"+r.type+"-"+r.id,name:t.name,how:how,own:false,real:true,eta:how==="mail"?1440:Math.max(12,(job&&job.routeMin)||travelMin(here,selected)+10),note:how==="mail"?"Named post. Days. No heat hold.":"Named local courier."};}).filter(function(o){return o.name;}); }).catch(function(){return [];}); }
  function portalOffers(){ return []; }
  function listedDriverBases(how){ if(how!=="now"||!window.SNWork) return []; var all=SNWork.all(), from=here||selected; var rows=(all.drivers||[]).filter(function(d){ if(!d||!isFinite(d.lat)) return false; if(String(d.presence||"present")==="off") return false; var range=Number(d.range)||25; return !from || km(from,d)<=range; }).map(function(d){ var eta=Math.max(8, (here?travelMin(d,here):10)+(selected&&selected.kind!=="driver"&&selected!==d?travelMin(d,selected):0)); return {id:d.id,name:(d.name||"Driver")+" base",how:"now",own:false,driver:true,eta:eta,note:"Driver base. Starting point. "+(d.routes?("Routes: "+d.routes+". "):"")+"Receives jobs from SpaceNet users."}; }); if(selected&&selected.kind==="driver") rows.sort(function(a,b){ return a.id===selected.id?-1:b.id===selected.id?1:0; }); return rows; }
  function offerList(how,partners){ var mins=here&&selected?Math.max(8,(job&&job.routeMin)||travelMin(here,selected)+6):18; var g=goodsOf(job&&job.query), own={id:"ours",name:"Astranov",how:how,own:true,eta:how==="mail"?Math.max(mins,90):mins,note:"Own associates. Paid, picked, boxed, moving, handed, verified."}; if(how==="pickup") return [{id:"self",name:"You pick up",how:how,own:true,eta:mins,note:"Handoff at the shop."}]; if(how==="mail"&&g.strict&&g.temp!=="ambient") return []; var list=[own].concat(listedDriverBases(how)).concat(partners||[]).concat(portalOffers(how,mins)); return list.filter(function(o){ return !(how==="now"&&g.strict&&o.eta>g.hold); }); }
  function chooseHow(how){ if(!selected){ talk("Pick a place first."); return; } if(job) job.how=how; var seq=++offerSeq; say("Checking carriers…"); partnerPlaces(how).then(function(p){ if(seq!==offerSeq||!job||job.how!==how)return; var list=offerList(how,p); if(!list.length){ clearNeed(); need({id:"pickup",label:"PICK UP",run:function(){chooseHow("pickup");}}); need({id:"place",label:"OTHER PLACE",run:function(){hunt(job&&job.query);}}); talk("That ride cannot keep "+goodsOf(job&&job.query).name+" alive. Pick it up or choose closer."); return; } showOffers(list); }); }
  function showOffers(list){ clearNeed(); currentOffers=list; list.forEach(function(o){ need({id:o.id, label:o.name.toUpperCase()+" · "+(o.eta>=1440?Math.round(o.eta/1440)+"d":o.eta+"m"), run:function(){ pickCarrier(o); }}); }); var f=list[0]; if(f.own) talk("Astranov first. About "+f.eta+" min. Own associates. Every stage checked."); else talk(f.name+" · "+f.eta+" min. "+f.note); }
  function priceOf(o){ return o&&o.how==="pickup"?6:(o&&o.how==="mail"?14:10); }
  function pickCarrier(o){ if(job) job.carrier=o; offerPay(priceOf(o)); paintJobArc(); if(o.id==="ours"||(o.own&&o.how!=="pickup")) talk("Astranov. Tasks spend AV€ now. Reload euro through PayPal only if credit is empty."); else if(o.id==="self") talk("Pick up at "+(selected&&selected.name||"the shop")+"."); else if(o.driver) talk((o.name||"Driver base")+". Starting point. Job goes to this base. About "+o.eta+" min."); else talk(o.name+" · about "+o.eta+" min. Portals see one slice."); }
  function offerPay(price){ clearNeed(); var bal=avcGet(); if(job) job.price=price; need({id:"pay",label:"PAY "+fmtAve(price),run:function(){ spendAvc(price); }}); if(bal<price) need({id:"reload",label:"RELOAD",run:function(){ reloadPaypal(Math.max(10, Math.ceil(price-bal))); }}); talk((bal>=price)?("Pay "+fmtAve(price)+". You have "+fmtAve(bal)+"."):("Need "+fmtAve(price)+". You have "+fmtAve(bal)+". Reload euro through PayPal, 1 to 1.")); }
  function spendAvc(price){ price=Number(price||(job&&job.price)||10); var bal=avcGet(); if(bal<price){ offerPay(price); return; } avcSet(bal-price); if(job){ job.status="paid"; job.paidAvc=price; } var esc=openEscrow(price); clearNeed(); syncTasks(); talk("Paid "+fmtAve(price)+". Locked, not spent in the dark. Hold "+esc.holdMin+" min."); watchStages(price); }
  function watchStages(avc){ if(!job) return; job.status="paid"; talk("Stage paid. Credit locked until picked → boxed → moving → handed → verified. If the shop goes silent, the credit comes back. SpaceNet takes nothing from a failed job."); }
  function reloadPaypal(eur){ say("PayPal reload…"); try{ sessionStorage.setItem("sn:paypal-job", JSON.stringify(job||{})); sessionStorage.setItem("sn:paypal-reload", String(eur||10)); }catch(e){} fetch("/api/paypal/create-order",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({amount:eur||10,origin:location.origin,reference:"avc-reload"})}).then(function(r){return r.json().then(function(j){j.http=r.status;return j;});}).then(function(j){ if(j&&j.ok&&j.approve){ location.href=j.approve; return; } clearNeed(); need({id:"reload",label:"RELOAD",run:function(){ reloadPaypal(eur); }}); talk(j&&j.error==="paypal_not_configured"?"PayPal is not on this host yet.":"PayPal could not start. RELOAD is still here."); }).catch(function(){ clearNeed(); need({id:"reload",label:"RELOAD",run:function(){ reloadPaypal(eur); }}); talk("PayPal could not be reached."); }); }
  function restorePayJob(){ try{ var saved=JSON.parse(sessionStorage.getItem("sn:paypal-job")||"null"); if(saved){ job=saved; selected=saved.shop||null; } }catch(e){} }
  function clearPayQuery(){ try{ var u=new URL(location.href); ["paypal","token","PayerID"].forEach(function(k){u.searchParams.delete(k);}); history.replaceState({},"",u.pathname+(u.searchParams.toString()?"?"+u.searchParams.toString():"")); }catch(e){} }
  function handlePayPalReturn(){ var p; try{p=new URLSearchParams(location.search);}catch(e){return Promise.resolve(false);} var state=p.get("paypal"), token=p.get("token"); if(!state) return Promise.resolve(false); restorePayJob(); if(state==="cancel"){ clearPayQuery(); if(job&&job.carrier) pickCarrier(job.carrier); else talk("Reload cancelled."); return Promise.resolve(true); } if(state!=="success"||!token){ clearPayQuery(); talk("PayPal returned without an order."); return Promise.resolve(true); } say("Verifying PayPal…"); return fetch("/api/paypal/capture-order",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({orderId:token})}).then(function(r){return r.json();}).then(function(j){ clearPayQuery(); if(j&&j.ok&&String(j.status).toUpperCase()==="COMPLETED"){ var credited=Number(j.avc!=null?j.avc:(sessionStorage.getItem("sn:paypal-reload")||0)); avcAdd(credited); try{ sessionStorage.removeItem("sn:paypal-job"); sessionStorage.removeItem("sn:paypal-reload"); }catch(e){} talk("Reloaded "+fmtAve(credited)+". Balance "+fmtAve(avcGet())+"."); if(job&&job.carrier&&job.price) spendAvc(job.price); return true; } clearNeed(); need({id:"verify",label:"VERIFY PAYMENT",run:function(){location.href="/?paypal=success&token="+encodeURIComponent(token);}}); talk("Payment not verified yet. AV€ not moved."); return true; }).catch(function(){ clearNeed(); need({id:"verify",label:"VERIFY PAYMENT",run:function(){location.href="/?paypal=success&token="+encodeURIComponent(token);}}); talk("Payment verification failed. AV€ not moved."); return true; }); }
  function reverseHere(){ if(!here) return Promise.resolve(""); var url="https://photon.komoot.io/reverse?lat="+here.lat+"&lon="+here.lng; return fetchJson(url,{headers:{Accept:"application/json"}},8000).then(function(j){ var f=j&&j.features&&j.features[0], pr=f&&f.properties||{}; countryCode=String(pr.countrycode||pr.country||"").slice(0,2).toLowerCase(); hereName=pr.city||pr.locality||pr.district||pr.town||pr.name||pr.county||pr.state||pr.country||""; here.name=hereName; return hereName; }).catch(function(){ var nurl="https://nominatim.openstreetmap.org/reverse?format=jsonv2&zoom=10&lat="+here.lat+"&lon="+here.lng; return fetchJson(nurl,{headers:{Accept:"application/json","Accept-Language":"en"}},8000).then(function(j){ countryCode=String(j&&j.address&&j.address.country_code||"").toLowerCase(); hereName=humanName(j)|| (j&&j.address&&(j.address.city||j.address.town||j.address.village||j.address.country))||""; here.name=hereName; return hereName; }).catch(function(){ return ""; }); }); }
  function locate(quiet, snap){ if(!navigator.geolocation){ talk("No GPS on this device."); return Promise.resolve(); } if(locating) return locating; if(!quiet) say("GPS…"); locating=new Promise(function(resolve){ navigator.geolocation.getCurrentPosition(function(p){ here={lat:p.coords.latitude,lng:p.coords.longitude}; hereAt=Date.now(); if(snap!==false){ lookAt(here); dist=1.65; if(viewLevel()==="globe") showGlobe(); } locating=null; var g=document.getElementById("gps"); if(g){ g.classList.remove("busy"); g.classList.add("on"); } reverseHere().then(function(name){ if(snap!==false){ clearNeed(); if(!quiet) talk(name?("You're in "+name+"."):"Position locked."); else if(name) say("You're in "+name+"."); } resolve(here); }); }, function(){ locating=null; var g=document.getElementById("gps"); if(g) g.classList.remove("busy","on"); if(!here){ if(!quiet) talk("Location denied. Tap GPS and allow it."); } resolve(here||undefined); }, {enableHighAccuracy:true,timeout:18000,maximumAge:0}); }); return locating; }
  function goHere(){
    var g=document.getElementById("gps");
    if(g){ g.classList.remove("on"); g.classList.add("busy"); }
    say("GPS…");
    var fresh=here && hereAt && (Date.now()-hereAt<120000);
    var jobp=fresh?Promise.resolve(here):locate(true, false);
    jobp.then(function(p){
      if(!p){ if(g) g.classList.remove("busy"); talk("Allow GPS. Tap GPS."); return; }
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
  function parseMind(j, raw){ var text=String((j&&(j.text||j.response||j.answer||j.say))||""); var act=String((j&&j.act)||"").toLowerCase(), q=(j&&j.q)||"", s=(j&&j.say)||"", ok=j&&j.priority_ok, id=(j&&(j.task_id||j.id))||"", split=j&&j.split; var m=text.match(/\{[\s\S]*\}/); if(m){ try{ var o=JSON.parse(m[0]); if(o){ if(o.act) act=String(o.act).toLowerCase(); if(o.q) q=String(o.q); if(o.say) s=String(o.say); if(!s && o.text) s=String(o.text); if(o.ok!=null) ok=o.ok; if(o.id) id=String(o.id); if(o.split) split=o.split; } }catch(e){} } if(!s) s=text.replace(/\{[\s\S]*\}/,"").trim(); return {act:act||"talk", q:q||raw, say:s||"", ok:ok, id:id, split:split}; }
  function applyMind(m, raw){ if(!m) return; var a=String(m.act||"talk").toLowerCase(); if(m.say && a!=="hunt" && a!=="order" && a!=="find" && a!=="priority") talk(m.say); else if(m.say && a!=="priority") say(m.say); if(a==="talk"||!a) return; if(a==="priority"){ var ok=m.ok===true||m.ok==="true"||m.ok===1; bumpTask(m.id||(awaiting&&awaiting.id), ok, m.say); awaiting=null; return; } if(a==="justice"){ applyJustice(m); awaiting=null; return; } if(a==="pick"){ var q=String(m.q||m.id||"").toLowerCase(); var v=(vendors||[]).find(function(x){ var n=String(x.name||"").toLowerCase(); return n && q && (n===q || n.indexOf(q)>=0 || q.indexOf(n)>=0); }); if(v) return selectVendor(v); return; } if(a==="menu") return; if(a==="locate") return goHere(); if(a==="globe"){ showGlobe(); return; } if(a==="national") return showNational(aim||here||facingPoint()); if(a==="map"||a==="city"||a==="streets") return showCity(selected||aim||here); if(a==="now") return chooseHow("now"); if(a==="mail") return chooseHow("mail"); if(a==="pickup"||a==="pick up") return chooseHow("pickup"); if(a==="pay") return spendAvc(priceOf(job&&job.carrier)); if(a==="reload") return reloadPaypal(10); if(a==="post"||a==="call"||a==="shop"||a==="drop"||a==="driver"||a==="base"){ if(window.SNWork) return SNWork.open(aim||here, a==="base"?"driver":a); return; } if(a==="hunt"||a==="order"||a==="find") return hunt(m.q||raw, aim||here); }
  function grok(text){ var raw=String(text||"").trim(); if(!raw) return; say("Grok…"); var origin=aim||here; var ctx={ place:(aim&&aim.name)||hereName||"", avc:avcGet(), shop:selected&&selected.name||"", query:job&&job.query||"", level:viewLevel(), vendors:(vendors||[]).slice(0,6).map(function(v){ var b=shopBits(v); return {id:v.id,name:v.name,km:origin?Math.round(km(origin,v)*10)/10:null,cuisine:b.cuisine,hours:b.hours,phone:!!b.phone,listed:!!b.menu}; }), tasks:loadTasks().filter(function(t){return t.status!=="done";}).slice(0,8).map(function(t){return {id:t.id,title:t.title,pri:t.pri,role:t.role,next:t.next};}), escrow:loadEscrow().filter(function(e){return e&&e.held;}).slice(0,4) }; if(awaiting&&awaiting.kind==="priority") ctx.priority_request={id:awaiting.id, reason:raw}; if(awaiting&&awaiting.kind==="justice") ctx.justice_request={id:awaiting.id, reason:raw}; fetch("/api/ai",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({prompt:raw, message:raw, here:ctx, history:mindHist, spacenet:true, fast:true, force_paid:true, allow_paid:true})}).then(function(r){return r.json().then(function(j){ j.http=r.status; return j; });}).then(function(j){ var m=parseMind(j, raw); mindHist.push({role:"user",content:raw}); mindHist.push({role:"assistant",content:m.say||m.act||""}); if(mindHist.length>16) mindHist=mindHist.slice(-16); applyMind(m, raw); }).catch(function(){ talk("Grok did not answer. Say it again."); }); }
  function savePost(a, text){ var row={level:a.level, lat:a.at&&a.at.lat, lng:a.at&&a.at.lng, name:(a.at&&a.at.name)||"", text:String(text||"").trim(), t:Date.now(), kind:"post", id:"p"+Date.now().toString(36)}; try{ var list=JSON.parse(localStorage.getItem("sn:posts")||"[]"); list.unshift(row); localStorage.setItem("sn:posts", JSON.stringify(list.slice(0,80))); }catch(e){} if(window.SNWork&&SNWork.publish) SNWork.publish(row); talk("Posted at "+(row.name||a.level)+"."); if(window.SN&&SN.repaint) SN.repaint(); }
  function startAwait(kind, level, p){ awaiting={kind:kind, level:level, at:p}; if(inEl){ inEl.value=""; inEl.placeholder= kind==="post"?"Post at this place": kind==="add"?"Name what you add":"Task at this place"; try{ inEl.focus(); }catch(e){} } var n=(p&&p.name)||level; if(kind==="post") talk("Post at "+n+". Write it."); else if(kind==="add") talk("Add at "+n+". Name it."); else talk("Task at "+n+". Say what you want."); }
  function doCall(p){ if(window.SNWork){ SNWork.open(p,"call"); return; } nameAim(p).then(function(n){ var t=n.tags||{}; var phone=t.phone||t["contact:phone"]||t.tel||""; if(phone){ talk("Calling "+(n.name||"place")+"."); location.href="tel:"+String(phone).replace(/[^\d+]/g,""); } else talk("No phone listed for "+(n.name||"this place")+"."); }); }
  function whatIsHere(p, level){ say("Looking…"); nameAim(p).then(function(n){ aim=n; showAround(n); if(level!=="city" && n.water) talk("No named place on that water."); }); }
  function run(raw){ var t=String(raw||"").trim(); if(!t) return; var low=t.toLowerCase(); if(low==="reboot") return (window.SNReboot&&SNReboot()); if(window.SNWork&&SNWork.picking&&SNWork.picking()){ SNWork.searchDest(t); return; } if(awaiting){ var a=awaiting; awaiting=null; if(inEl) inEl.placeholder="Talk to Astranov SpaceNet Grok"; if(a.kind==="priority") return grok("PRIORITY REQUEST id="+a.id+" reason: "+t); if(a.kind==="justice") return grok("JUSTICE DISPUTE escrow="+a.id+" reason: "+t); if(a.kind==="post"||a.kind==="add"){ if(window.SNWork) return SNWork.open(a.at, a.kind==="add"?"":"post"); savePost(a,t); return; } if(a.kind==="task"||a.kind==="find"){ aim=a.at||aim; return grok(t); } } var named=vendors.find(function(v){var n=(v.name||"").toLowerCase(); return n && (low===n || low.indexOf(n)>=0);}); if(named) return selectVendor(named); named=currentOffers.find(function(o){var n=(o.name||"").toLowerCase(); return n && (low===n || low.indexOf(n)>=0);}); if(named) return pickCarrier(named); return grok(t); }
  function globeHit(clientX, clientY){ if(!canvas) return null; var w=canvas.width,h=canvas.height,cx=w*0.5,cy=h*0.46,R=Math.min(w,h)*0.42/dist; var rect=canvas.getBoundingClientRect(); var px=(clientX-rect.left)*(w/Math.max(1,rect.width)); var py=(clientY-rect.top)*(h/Math.max(1,rect.height)); var x=(px-cx)/R, y2=(cy-py)/R, rr=x*x+y2*y2; if(rr>1) return null; var z2=Math.sqrt(Math.max(0,1-rr)); var cp=Math.cos(pitch), sp=Math.sin(pitch); var y=y2*cp+z2*sp; var z=-y2*sp+z2*cp; var lat=Math.asin(Math.max(-1,Math.min(1,y)))*180/Math.PI; var lng=Math.atan2(x,z)*180/Math.PI + yaw*180/Math.PI; while(lng>180) lng-=360; while(lng<-180) lng+=360; return {lat:lat,lng:lng}; }
  function nameAim(p){ if(!p) return Promise.resolve(p); var url="https://photon.komoot.io/reverse?lat="+p.lat+"&lon="+p.lng; return fetchJson(url,{headers:{Accept:"application/json"}},8000).then(function(j){ var f=j&&j.features&&j.features[0], pr=f&&f.properties||{}; var n=pr.name||pr.street||pr.city||pr.locality||pr.district||""; p.name=n||pr.county||pr.country||""; p.raw=[pr.street,pr.city||pr.locality,pr.country].filter(Boolean).join(", "); p.tags=pr; p.water=!p.name; if(!p.name) p.name="This place"; return p; }).catch(function(){ var nurl="https://nominatim.openstreetmap.org/reverse?format=jsonv2&zoom=16&lat="+p.lat+"&lon="+p.lng; return fetchJson(nurl,{headers:{Accept:"application/json","Accept-Language":navigator.language||"en"}},8000).then(function(j){ p.name=humanName(j)||"This place"; p.raw=j&&j.display_name||p.name; p.tags=(j&&j.extratags)||{}; p.water=p.name==="This place"; return p; }).catch(function(){ p.name="This place"; p.water=true; p.tags={}; return p; }); }); }
  function hidePlace(){ if(placeEl){ placeEl.classList.remove("on"); placeEl.innerHTML=""; } packSoon(); }
  function placeMenuAt(sx,sy){ if(!placeEl) return; var w=Math.min(220, innerWidth-16), h=Math.min(320, innerHeight*0.5); var x=Math.max(8, Math.min(innerWidth-w-8, (sx||innerWidth/2)-w/2)); var y=Math.max(8, Math.min(innerHeight-h-8, (sy||innerHeight/2)-20)); placeEl.style.left=x+"px"; placeEl.style.top=y+"px"; packSoon(); }
  function addPlaceBtn(label,fn){ if(!placeEl) return; var b=document.createElement("button"); b.type="button"; b.textContent=label; b.onclick=function(ev){ ev.preventDefault(); ev.stopPropagation(); hidePlace(); try{ fn(); }catch(e){ talk("That step failed."); } }; placeEl.appendChild(b); }
  function openLevelMenu(p, screen, level){ if(!p) return; level=level||viewLevel(); aim=p; if(screen) tapScreen=screen; if(level==="city"){ cityWork(p); return; } hidePlace(); if(!placeEl) placeEl=document.getElementById("sn-place"); if(!placeEl){ placeEl=document.createElement("div"); placeEl.id="sn-place"; document.body.appendChild(placeEl); } placeEl.classList.add("on"); placeMenuAt((tapScreen&&tapScreen.x)||(innerWidth/2), (tapScreen&&tapScreen.y)||(innerHeight*0.38)); var ttl=document.createElement("div"); ttl.className="ttl"; ttl.textContent=p.name&&p.name!=="This place"?p.name:(level==="globe"?"Global":"National"); placeEl.appendChild(ttl); addPlaceBtn("WHAT IS HERE", function(){ whatIsHere(p, level); }); if(level==="globe"){ addPlaceBtn("GLOBAL POST", function(){ if(window.SNWork) SNWork.open(p,"post"); else startAwait("post","globe",p); }); addPlaceBtn("GLOBAL CALL", function(){ doCall(p); }); addPlaceBtn("GLOBAL TASK", function(){ startAwait("task","globe",p); }); addPlaceBtn("ADD", function(){ if(window.SNWork) SNWork.open(p); else startAwait("add","globe",p); }); } else { addPlaceBtn("NATIONAL POST", function(){ if(window.SNWork) SNWork.open(p,"post"); else startAwait("post","national",p); }); addPlaceBtn("NATIONAL CALL", function(){ doCall(p); }); addPlaceBtn("NATIONAL TASK", function(){ startAwait("task","national",p); }); } addPlaceBtn("CANCEL", function(){}); nameAim(p).then(function(n){ if(!placeEl||!placeEl.classList.contains("on")) return; if(aim&&Math.abs(aim.lat-p.lat)<0.3){ aim=n; var el=placeEl.querySelector(".ttl"); if(el && n.name) el.textContent=n.water?"No named place":n.name; } }); }
  function openPlace(p,screen){ openLevelMenu(p, screen, viewLevel()); }
  function hands(){ hidePlace(); var p=aim||here|| (map&&map.getCenter()?{lat:map.getCenter().lat,lng:map.getCenter().lng}:facingPoint()); var screen={x:innerWidth/2,y:innerHeight*0.4}; if(!here && viewLevel()==="globe"){ talk("Tap GPS to land on your city."); } if(viewLevel()==="city"){ cityWork(p); return; } openLevelMenu(p, screen, viewLevel()); }
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
    var g=document.getElementById("gps"), f=document.getElementById("f");
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
    var fr=f.getBoundingClientRect();
    var gw=g.offsetWidth||u, gh=g.offsetHeight||(u+14);
    var walls=[], add=function(el){ var r=shownRect(el); if(r) walls.push(r); };
    add(document.getElementById("island"));
    add(f);
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
    if(layerBtn&&layerBtn.classList.contains("on")&&!layerBtn.classList.contains("loose")){
      var lw=layerBtn.offsetWidth||72, lh=layerBtn.offsetHeight||36;
      var lpref=parked.layer?{x:parked.layer.x,y:parked.layer.y,w:lw,h:lh}:{x:W-pad-lw, y:topY+((tasksBtn&&tasksBtn.classList.contains("on"))?48:0), w:lw, h:lh};
      var lb=placeSolid(layerBtn, lpref);
      if(lb&&layerBox&&layerBox.classList.contains("on")){
        layerBox.style.left=Math.round(lb.x)+"px";
        layerBox.style.top=Math.round(lb.y+lh+8)+"px";
      }
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
  function drawPin(ctx,p,label,color,cx,cy,R){ if(!p||!isFinite(p.lat)||!isFinite(p.lng)) return; var q=sph(p.lat,p.lng,cx,cy,R); if(!q) return; var d=Math.min(2,devicePixelRatio||1); ctx.fillStyle=color; ctx.beginPath(); ctx.arc(q.x,q.y,4*d,0,Math.PI*2); ctx.fill(); ctx.fillStyle="#e8fbff"; ctx.font=(9*d)+"px system-ui"; ctx.fillText(pinLabel(p,label),q.x+6*d,q.y-4*d); }
  function tickFly(){ if(!fly) return; var u=(Date.now()-fly.t0)/fly.ms; if(u>=1){ yaw=fly.toYaw; pitch=fly.toPitch; if(fly.toDist!=null) dist=fly.toDist; var fn=fly.then; fly=null; if(fn) fn(); return; } u=u*u*(3-2*u); var dy=fly.toYaw-fly.fromYaw; while(dy>Math.PI) dy-=Math.PI*2; while(dy<-Math.PI) dy+=Math.PI*2; yaw=fly.fromYaw+dy*u; pitch=fly.fromPitch+(fly.toPitch-fly.fromPitch)*u; if(fly.toDist!=null) dist=fly.fromDist+(fly.toDist-fly.fromDist)*u; }
  function needTick(){ if(tickOn) return; tickOn=true; requestAnimationFrame(tick); }
  function tick(){ tickOn=false; try{ tickFly(); if(!drag && !pinch && !fly){ yaw+=spin; pitch=Math.max(-1.15,Math.min(1.15,pitch+pitchSpin)); spin*=0.988; pitchSpin*=0.988; if(Math.abs(spin)<0.00018) spin=0; if(Math.abs(pitchSpin)<0.00018) pitchSpin=0; } var moving=!!(drag||pinch||fly||Math.abs(spin)>0.00018||Math.abs(pitchSpin)>0.00018); var sig=yaw.toFixed(4)+"|"+pitch.toFixed(4)+"|"+dist.toFixed(3)+"|"+(here&&here.lat)+"|"+(aim&&aim.lat)+"|"+(selected&&selected.id)+"|"+globeMarks.length; if(moving || sig!==drawSig){ drawSig=sig; if(canvas){ var ctx=canvas.getContext("2d"); if(ctx){ ctx.fillStyle="#02040a"; ctx.fillRect(0,0,canvas.width,canvas.height); var w=canvas.width,h=canvas.height,cx=w*0.5,cy=h*0.46,R=Math.min(w,h)*0.42/dist; drawGrid(ctx,cx,cy,R); drawPin(ctx,here,hereName||"YOU","#4df0ff",cx,cy,R); if(aim) drawPin(ctx,aim,aim.name||"PIN","#ff8ad4",cx,cy,R); if(selected) drawPin(ctx,selected,selected.name,"#ffd85a",cx,cy,R); globeMarks.slice(0,8).forEach(function(x){ var r=x.row, col=x.kind==="driver"?"#4df0ff":x.kind==="post"?"#9dffb0":x.kind==="drop"?"#ff8ad4":"#ffd85a"; drawPin(ctx,r,x.kind==="driver"?((r.name||"")+" base"):(r.name||r.label||x.kind),col,cx,cy,R); }); } } } }catch(e){} if(drag||pinch||fly||Math.abs(spin)>0.00018||Math.abs(pitchSpin)>0.00018) needTick(); }
  function boot(){ if(permsTried) return; permsTried=true; var returning=/[?&]paypal=/.test(location.search||""); handlePayPalReturn().then(function(){ if(returning) return locate(true); }); askMic(); if(window.SNWork&&SNWork.listenPeer) setTimeout(function(){ SNWork.listenPeer(); },800); }
  function repaint(){ if(map&&window.L) paintMapMarks(window.L, selected); }
  window.SN={ver:"V1",run:run,locate:locate,goHere:goHere,listen:listen,hunt:hunt,avc:avcGet,openPlace:openPlace,hands:hands,showCity:showCity,showNational:showNational,showMap:showMap,showCall:showCall,repaint:repaint,talk:talk,say:say,nameAim:nameAim,km:km,selectVendor:selectVendor,startOrder:startOrder,pack:pack,openMenu:openMenu,minMenu:minMenu,syncTasks:syncTasks,toggleTasks:toggleTasks,openTasks:openTasks,tickJustice:tickJustice,settle:settle,setLayer:setLayer,openCash:openCash,paintMoney:paintMoney,markStage:markStage,ingestJobs:ingestJobs};
  if(form) form.addEventListener("submit", function(e){ e.preventDefault(); var v=inEl&&inEl.value; if(inEl) inEl.value=""; run(v); });
  var go=document.getElementById("go"); if(go) go.addEventListener("click", function(e){ e.preventDefault(); if(inEl&&inEl.value.trim() && !listening){ run(inEl.value.trim()); inEl.value=""; return; } if(speaking){ try{ speechSynthesis.cancel(); }catch(x){} speaking=false; } listen(); });
  var plus=document.getElementById("plus"); if(plus) plus.addEventListener("click", function(){ hands(); });
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
  bindDrag(tasksBtn, "tasks");
  bindDrag(pillEl, "pill");
  bindDrag(document.getElementById("plus"), "plus");
  bindDrag(document.getElementById("go"), "go");
  if(tasksBtn) tasksBtn.addEventListener("click", function(e){ e.preventDefault(); toggleTasks(); });
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
      if(act==="problem") askProblem(id);
      else if(act==="dispute") askDispute(id);
      else if(act==="go"||!btn) goTask(id);
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
  if(canvas){ var holdT=null; function lastXY(e,fallback){ var x=(e&&e.clientX)||(drag&&drag.lastX)||(fallback&&fallback.x)||0; var y=(e&&e.clientY)||(drag&&drag.lastY)||(fallback&&fallback.y)||0; return {x:x,y:y}; } function ptrCount(){ return Object.keys(pointers).length; } function applyGlobeZoom(next){ dist=Math.max(1.15, Math.min(3.2, next)); paintMoney(false); needTick(); if(dist<=1.18 && pinch && !pinch.descended){ pinch.descended=true; flyTap(facingPoint()); } } canvas.addEventListener("pointerdown",function(e){ needTick(); hidePlace(); pointers[e.pointerId]={x:e.clientX,y:e.clientY}; if(ptrCount()>=2){ var ids=Object.keys(pointers); var a=pointers[ids[0]], b=pointers[ids[1]]; pinch={d0:Math.hypot(a.x-b.x,a.y-b.y), dist0:dist, midY:(a.y+b.y)/2, gap:Math.hypot(a.x-b.x,a.y-b.y), descended:false}; if(holdT){ clearTimeout(holdT); holdT=null; } drag=null; spin=0; return; } drag={x:e.clientX,y:e.clientY,lastX:e.clientX,lastY:e.clientY,yaw:yaw,pitch:pitch,t:Date.now(),t0:Date.now(),held:false,samples:[{t:Date.now(),x:e.clientX,y:e.clientY}]}; spin=0; pitchSpin=0; try{canvas.setPointerCapture(e.pointerId);}catch(_){} if(holdT) clearTimeout(holdT); holdT=setTimeout(function(){ holdT=null; if(!drag||pinch) return; var moved=Math.hypot(drag.lastX-drag.x, drag.lastY-drag.y); if(moved>28) return; drag.held=true; var pt=lastXY({clientX:drag.lastX,clientY:drag.lastY}); tapScreen=pt; var hit=globeHit(pt.x,pt.y); if(!hit){ say("Hold on the globe itself."); return; } if(window.SNWork&&SNWork.takePoint&&SNWork.takePoint(hit)) return; openLevelMenu(hit, pt, "globe"); },420);}); canvas.addEventListener("pointermove",function(e){ if(pointers[e.pointerId]) pointers[e.pointerId]={x:e.clientX,y:e.clientY}; if(pinch && ptrCount()>=2){ var ids=Object.keys(pointers); var a=pointers[ids[0]], b=pointers[ids[1]]; var gap=Math.hypot(a.x-b.x,a.y-b.y); var midY=(a.y+b.y)/2; var dGap=gap-(pinch.gap||pinch.d0); var dY=midY-(pinch.midY||midY); if(Math.abs(dGap)>Math.abs(dY)+4) applyGlobeZoom(pinch.dist0*(pinch.d0/Math.max(12,gap))); else if(Math.abs(dY)>6) applyGlobeZoom(dist + dY*0.01); pinch.midY=midY; pinch.gap=gap; return; } if(!drag) return; var now=Date.now(), w=Math.max(180,canvas.clientWidth||innerWidth), hh=Math.max(180,canvas.clientHeight||innerHeight); drag.lastX=e.clientX; drag.lastY=e.clientY; drag.samples=drag.samples||[]; drag.samples.push({t:now,x:e.clientX,y:e.clientY}); if(drag.samples.length>8) drag.samples=drag.samples.slice(-8); if(drag.held) return; var moved=Math.hypot(e.clientX-drag.x,e.clientY-drag.y); if(moved<8) return; yaw=drag.yaw-(e.clientX-drag.x)/w*Math.PI*2; pitch=Math.max(-1.15,Math.min(1.15, drag.pitch+(e.clientY-drag.y)/hh*Math.PI));}); function release(e){ delete pointers[e.pointerId]; if(ptrCount()<2) pinch=null; if(holdT){ clearTimeout(holdT); holdT=null; } if(!drag)return; var pt=lastXY(e, {x:drag.lastX,y:drag.lastY}); var moved=Math.hypot(pt.x-drag.x, pt.y-drag.y); var held=drag.held; var sm=drag.samples||[]; var w=Math.max(180,canvas.clientWidth||innerWidth), hh=Math.max(180,canvas.clientHeight||innerHeight); if(!held && moved>=28 && sm.length>=2){ var a=sm[0], b=sm[sm.length-1], dt=Math.max(16,b.t-a.t); var cap=0.14; spin=(-(b.x-a.x)/w)*Math.PI*2*(16/dt); pitchSpin=((b.y-a.y)/hh)*Math.PI*(16/dt); if(spin>cap) spin=cap; if(spin<-cap) spin=-cap; if(pitchSpin>cap) pitchSpin=cap; if(pitchSpin<-cap) pitchSpin=-cap; } else { spin=0; pitchSpin=0; } drag=null; needTick(); if(held) return; if(moved<28){ var hit=globeHit(pt.x,pt.y); if(!hit){ say("Tap the globe itself."); return; } tapScreen=pt; flyTap(hit); } } canvas.addEventListener("pointerup",release); canvas.addEventListener("pointercancel",release); canvas.addEventListener("contextmenu",function(e){ e.preventDefault(); var hit=globeHit(e.clientX,e.clientY); if(hit) openLevelMenu(hit,{x:e.clientX,y:e.clientY},"globe"); }); canvas.addEventListener("wheel",function(e){ e.preventDefault(); applyGlobeZoom(dist+(e.deltaY>0?0.08:-0.08)); }, {passive:false}); }
  document.addEventListener("pointerdown", function(e){ if(!placeEl||!placeEl.classList.contains("on")) return; if(placeEl.contains(e.target)) return; if(e.target===canvas) return; hidePlace(); }, true);
  document.addEventListener("pointerdown", function(){ if(!permsTried) boot(); }, {passive:true});
  window.addEventListener("resize", size);
  if(window.visualViewport) visualViewport.addEventListener("resize", packSoon);
  ["sn-sheet","sn-menu","sn-tasks","sn-cash","sn-video","sn-pick","city"].forEach(function(id){
    var el=document.getElementById(id);
    if(!el) return;
    new MutationObserver(function(){ if(!packing) packSoon(); }).observe(el,{attributes:true,attributeFilter:["class"]});
  });
  size(); needTick(); setTimeout(boot,200); setTimeout(syncTasks,500); setTimeout(function(){ paintMoney(false); },400); setInterval(function(){ if(!permsTried) boot(); },4000); setInterval(function(){ tickJustice(); mineTick(); }, 20000);
})();
