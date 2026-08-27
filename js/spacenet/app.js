(function(){
  var VER="3715";
  window.__SN_ALIVE=true;
  try{ if(navigator.vibrate) navigator.vibrate=function(){return false;}; }catch(e){}
  var canvas=document.getElementById("g");
  var cityEl=document.getElementById("city");
  var lineEl=document.getElementById("line");
  var inEl=document.getElementById("in");
  var form=document.getElementById("f");
  var liveEl=document.getElementById("sn-live");
  var leaflet=null, mapOn=false, tileLayer=null, vendorLayer=null, youMarker=null;
  var yaw=0.55, pitch=0.18, dist=2.15, dragging=false, lx=0, ly=0;
  var here=null, things={}, vendors=[], drivers=[], selected=null, fleet=[], orders=[], routeLines=[];
  var listening=false, speaking=false, wantEar=true, rec=null, permsTried=false, job=null;
  function say(t){ if(lineEl&&t!=null) lineEl.textContent=String(t); }
  function talk(t){ if(!t) return; say(t); speaking=true; try{ if(window.speechSynthesis){ speechSynthesis.cancel(); var u=new SpeechSynthesisUtterance(String(t)); u.onend=function(){ speaking=false; if(wantEar) setTimeout(listen,280); }; u.onerror=function(){ speaking=false; if(wantEar) setTimeout(listen,280); }; speechSynthesis.speak(u); return; } }catch(e){} speaking=false; if(wantEar) setTimeout(listen,280); }
  function clearNeed(){ things={}; if(liveEl){ liveEl.innerHTML=""; liveEl.style.display="none"; } }
  function need(spec){ spec=spec||{}; var id=spec.id||("m"+Date.now()); things[id]=spec; if(!liveEl) return id; liveEl.style.display="flex"; var b=document.createElement("button"); b.type="button"; b.textContent=spec.label||id; b.onclick=function(){ try{ spec.run(); }catch(e){} }; liveEl.appendChild(b); return id; }
  function showGlobe(){ mapOn=false; if(cityEl){ cityEl.classList.remove("on"); cityEl.style.pointerEvents="none"; } }
  function km(a,b){ if(!a||!b) return 0; var R=6371,dLat=((b.lat-a.lat)*Math.PI)/180,dLng=((b.lng-a.lng)*Math.PI)/180; var x=Math.sin(dLat/2)*Math.sin(dLat/2)+Math.cos((a.lat*Math.PI)/180)*Math.cos((b.lat*Math.PI)/180)*Math.sin(dLng/2)*Math.sin(dLng/2); return R*2*Math.atan2(Math.sqrt(x),Math.sqrt(1-x)); }
  function travelMin(a,b){ return Math.max(1, Math.round((km(a,b)/22)*60)); }
  function goodsOf(text){ var l=String(text||"").toLowerCase(); if(/ice|gelato|παγω/.test(l)) return {name:"ice cream",temp:"frozen",hold:12}; if(/pizza|πιτσ/.test(l)) return {name:"pizza",temp:"hot",hold:35}; if(/coffee|καφ/.test(l)) return {name:"coffee",temp:"hot",hold:25}; return {name:"order",temp:"ambient",hold:90}; }
  function offerList(how){
    var mins=here&&selected?Math.max(8, travelMin(here,selected)+6):18;
    var own={id:"ours",name:"Astranov",how:how,own:true,eta:how==="mail"?Math.max(mins,90):mins,note:"Associates. Every stage checked. Temperature held."};
    var partner={id:"partner",name:"Local partner",how:how,own:false,eta:mins+8,note:"Our network. Stage check."};
    var mass=[{id:"doordash",name:"DoorDash",how:how,own:false,eta:mins+14,note:"Portal. Last mile only."},{id:"instacart",name:"Instacart",how:how,own:false,eta:mins+18,note:"Portal. No full chain verify."},{id:"walmart",name:"Walmart",how:how,own:false,eta:mins+22,note:"Portal. Warehouse window."}];
    if(how==="mail") return [own,partner,{id:"post",name:"National post",how:how,own:false,eta:1440,note:"Days. No heat hold."}];
    if(how==="pickup") return [{id:"self",name:"You pick up",how:how,own:true,eta:mins,note:"Handoff at the shop. We confirm."}];
    return [own,partner].concat(mass);
  }
  function chooseHow(how){ if(!selected){ talk("Pick a place first."); return; } if(job) job.how=how; showOffers(offerList(how)); }
  function showOffers(list){ clearNeed(); list.forEach(function(o){ need({id:o.id,label:o.name.toUpperCase(), run:function(){ pickCarrier(o); }}); }); var f=list[0]; talk(f.name+" first · "+f.eta+" min · "+f.note); }
  function pickCarrier(o){ if(job) job.carrier=o; if(o.id==="ours"||(o.own&&o.how==="now")){ placeOrder(selected); talk("Astranov · paid → picked → boxed → moving → handed → verified"); return; } clearNeed(); need({id:"pay",label:"PAY",run:function(){ payDeposit(o.how==="pickup"?8:12); }}); talk(o.name+" · "+o.eta+" min. Portals see one slice. Ours watches every stage."); }
  function selectVendor(v){ selected=v; if(job) job.shop=v; clearNeed(); need({id:"now",label:"NOW",run:function(){ chooseHow("now"); }}); need({id:"mail",label:"MAIL",run:function(){ chooseHow("mail"); }}); need({id:"pickup",label:"PICK UP",run:function(){ chooseHow("pickup"); }}); talk((v.name||"Shop")+". Now, mail, or pick up."); }
  function placeOrder(v){ v=v||selected; if(!v||!here){ talk("Allow location first."); return; } var g=goodsOf(job&&job.query); if(job){ job.status="routed"; job.min=travelMin(here,v)+6; } clearNeed(); need({id:"pay",label:"PAY",run:function(){ payDeposit(10); }}); talk((v.name||"Shop")+" · "+(job&&job.min)+" min · box "+g.hold+" min. Pay when ready."); }
  function payDeposit(eur){ say("PayPal…"); fetch("/api/paypal/create-order",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({amount:eur||10,origin:location.origin})}).then(function(r){return r.json();}).then(function(j){ if(j&&j.approve){ location.href=j.approve; return; } need({id:"pay",label:"PAY",run:function(){ payDeposit(eur); }}); talk("Pay is not on this host yet."); }).catch(function(){ talk("Pay error."); }); }
  function locate(){ if(!navigator.geolocation){ talk("No GPS."); return Promise.resolve(); } say("Location…"); return new Promise(function(resolve){ navigator.geolocation.getCurrentPosition(function(p){ here={lat:p.coords.latitude,lng:p.coords.longitude}; showGlobe(); talk("Located. Say what you need."); resolve(); }, function(){ talk("Allow location."); resolve(); }, {enableHighAccuracy:true,timeout:18000}); }); }
  function askMic(){ if(!navigator.mediaDevices||!navigator.mediaDevices.getUserMedia) return Promise.resolve(false); return navigator.mediaDevices.getUserMedia({audio:true}).then(function(s){ try{s.getTracks().forEach(function(t){t.stop();});}catch(e){} return true; }).catch(function(){ return false; }); }
  function listen(){ if(listening||speaking) return; var SR=window.SpeechRecognition||window.webkitSpeechRecognition; if(!SR) return; listening=true; rec=new SR(); rec.continuous=false; rec.lang=navigator.language||"en-US"; rec.onresult=function(ev){ var i,tx="",fin=false; for(i=ev.resultIndex;i<ev.results.length;i++){ tx+=ev.results[i][0].transcript; if(ev.results[i].isFinal) fin=true; } if(inEl) inEl.value=tx; if(fin&&tx.trim()){ listening=false; try{rec.stop();}catch(e){} run(tx.trim()); } }; rec.onend=function(){ listening=false; if(wantEar&&!speaking) setTimeout(listen,500); }; rec.onerror=function(ev){ listening=false; if(ev&&ev.error==="not-allowed") wantEar=false; }; try{ rec.start(); }catch(e){ listening=false; } }
  function grok(text){ say("…"); fetch("/api/ai",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({prompt:text})}).then(function(r){return r.json();}).then(function(j){ talk((j&&(j.text||j.response||j.answer))||""); }).catch(function(){ talk("AI busy."); }); }
  function run(raw){ var t=String(raw||"").trim(); if(!t) return; var low=t.toLowerCase(); if(low==="reboot") return (window.SNReboot&&SNReboot()); if(low==="locate"||low==="where am i") return locate(); if(low==="globe"||low==="close") return showGlobe();
    if(selected&&/mail|post/.test(low)) return chooseHow("mail");
    if(selected&&/pick\s*up|collect/.test(low)) return chooseHow("pickup");
    if(selected&&(/\bnow\b|instant|deliver/.test(low))) return chooseHow("now");
    if(selected&&/astranov|ours|associates/.test(low)) return pickCarrier(offerList((job&&job.how)||"now")[0]);
    if(selected&&/doordash/.test(low)) return pickCarrier({id:"doordash",name:"DoorDash",how:"now",own:false,eta:30});
    if(selected&&/instacart/.test(low)) return pickCarrier({id:"instacart",name:"Instacart",how:"now",own:false,eta:35});
    if(selected&&/walmart/.test(low)) return pickCarrier({id:"walmart",name:"Walmart",how:"now",own:false,eta:40});
    if(/pizza|food|φαγη|πιτσ|coffee|pharm/.test(low)){ job={kind:"food",query:t,status:"open"}; if(!here) return locate(); selected=selected||{name:"Shop",lat:here.lat+0.01,lng:here.lng+0.01}; return selectVendor(selected); }
    if(low.indexOf("pay")>=0) return payDeposit(10);
    return grok(t);
  }
  function size(){ if(!canvas) return; var d=Math.min(2,devicePixelRatio||1); canvas.width=Math.max(1,Math.floor((innerWidth||320)*d)); canvas.height=Math.max(1,Math.floor((innerHeight||480)*d)); }
  function tick(){ try{ if(canvas&&!mapOn){ var ctx=canvas.getContext("2d"); if(ctx){ ctx.fillStyle="#02040a"; ctx.fillRect(0,0,canvas.width,canvas.height); var w=canvas.width,h=canvas.height,cx=w*0.5,cy=h*0.46,r=Math.min(w,h)*0.42/dist; ctx.strokeStyle="rgba(77,240,255,0.35)"; ctx.beginPath(); ctx.arc(cx,cy,r,0,Math.PI*2); ctx.stroke(); yaw+=0.0016; } } }catch(e){} requestAnimationFrame(tick); }
  function boot(){ if(permsTried) return; permsTried=true; askMic().then(function(){ locate().then(function(){ setTimeout(listen,600); }); }); }
  window.SN={ver:"V1",run:run,locate:locate,listen:listen};
  if(form) form.addEventListener("submit", function(e){ e.preventDefault(); var v=inEl&&inEl.value; if(inEl) inEl.value=""; run(v); });
  var go=document.getElementById("go"); if(go) go.addEventListener("click", function(e){ e.preventDefault(); if(inEl&&inEl.value.trim()){ run(inEl.value.trim()); inEl.value=""; return; } wantEar=true; listen(); });
  document.addEventListener("pointerdown", function(){ if(!permsTried) boot(); }, {passive:true});
  window.addEventListener("resize", size); size(); tick(); setTimeout(boot,200);
})();
