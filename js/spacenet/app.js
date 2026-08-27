(function(){
  var VER="3716";
  window.__SN_ALIVE=true;
  try{ if(navigator.vibrate) navigator.vibrate=function(){return false;}; }catch(e){}
  var canvas=document.getElementById("g");
  var cityEl=document.getElementById("city");
  var lineEl=document.getElementById("line");
  var inEl=document.getElementById("in");
  var form=document.getElementById("f");
  var liveEl=document.getElementById("sn-live");
  var yaw=0.55, dist=2.15;
  var here=null, things={}, vendors=[], selected=null, job=null;
  var listening=false, speaking=false, wantEar=true, rec=null, permsTried=false;
  var stages=["paid","picked","boxed","moving","handed","verified"];

  function say(t){ if(lineEl&&t!=null) lineEl.textContent=String(t); }
  function talk(t){ if(!t) return; say(t); speaking=true; try{ if(window.speechSynthesis){ speechSynthesis.cancel(); var u=new SpeechSynthesisUtterance(String(t)); u.onend=function(){ speaking=false; if(wantEar) setTimeout(listen,280); }; u.onerror=function(){ speaking=false; if(wantEar) setTimeout(listen,280); }; speechSynthesis.speak(u); return; } }catch(e){} speaking=false; if(wantEar) setTimeout(listen,280); }
  function clearNeed(){ things={}; if(liveEl){ liveEl.innerHTML=""; liveEl.style.display="none"; } }
  function need(spec){ spec=spec||{}; var id=spec.id||("m"+Date.now()+Math.random().toString(36).slice(2,6)); things[id]=spec; if(!liveEl) return id; liveEl.style.display="flex"; var b=document.createElement("button"); b.type="button"; b.textContent=spec.label||id; b.onclick=function(){ try{ spec.run(); }catch(e){} }; liveEl.appendChild(b); return id; }
  function showGlobe(){ if(cityEl){ cityEl.classList.remove("on"); cityEl.style.pointerEvents="none"; } }
  function km(a,b){ if(!a||!b) return 0; var R=6371,dLat=((b.lat-a.lat)*Math.PI)/180,dLng=((b.lng-a.lng)*Math.PI)/180; var x=Math.sin(dLat/2)*Math.sin(dLat/2)+Math.cos((a.lat*Math.PI)/180)*Math.cos((b.lat*Math.PI)/180)*Math.sin(dLng/2)*Math.sin(dLng/2); return R*2*Math.atan2(Math.sqrt(x),Math.sqrt(1-x)); }
  function travelMin(a,b){ return Math.max(1, Math.round((km(a,b)/22)*60)); }
  function goodsOf(text){ var l=String(text||"").toLowerCase(); if(/ice|gelato|παγω/.test(l)) return {name:"ice cream",temp:"frozen",hold:12}; if(/pizza|πιτσ/.test(l)) return {name:"pizza",temp:"hot",hold:35}; if(/coffee|καφ/.test(l)) return {name:"coffee",temp:"hot",hold:25}; if(/sushi|salad|γαλα/.test(l)) return {name:"cold",temp:"cold",hold:25}; return {name:"order",temp:"ambient",hold:90}; }

  function hunt(query){
    var q=String(query||"pizza").trim();
    job={kind:"find",query:q,status:"hunt"};
    if(!here){ talk("Allow location first."); locate().then(function(){ if(here) hunt(q); }); return; }
    say("Finding "+q+"…");
    var url="https://nominatim.openstreetmap.org/search?format=jsonv2&limit=8&q="+encodeURIComponent(q+" near "+here.lat+","+here.lng);
    fetch(url,{headers:{Accept:"application/json"}}).then(function(r){return r.json();}).then(function(rows){
      vendors=(rows||[]).filter(function(r){ return r&&r.display_name&&r.lat; }).map(function(r){
        return {name:(r.name||r.display_name.split(",")[0]), lat:+r.lat, lng:+r.lon, raw:r.display_name};
      }).filter(function(v){ return v.name && !/^driver$/i.test(v.name); });
      if(!vendors.length){ talk("No named place for "+q+" yet. Say it again."); return; }
      clearNeed();
      vendors.slice(0,6).forEach(function(v,i){
        var d=km(here,v).toFixed(1);
        need({id:"v"+i,label:v.name.toUpperCase()+" · "+d+" km", run:function(){ selectVendor(v); }});
      });
      talk("Found "+vendors.length+". Pick the one you want.");
    }).catch(function(){ talk("Hunt failed. Try again."); });
  }

  function selectVendor(v){
    selected=v;
    if(job){ job.shop=v; job.status="chosen"; }
    clearNeed();
    need({id:"now",label:"NOW",run:function(){ chooseHow("now"); }});
    need({id:"mail",label:"MAIL",run:function(){ chooseHow("mail"); }});
    need({id:"pickup",label:"PICK UP",run:function(){ chooseHow("pickup"); }});
    talk((v.name||"Shop")+". Instant delivery, mail it, or pick it up yourself.");
  }

  function offerList(how){
    var mins=here&&selected?Math.max(8, travelMin(here,selected)+6):18;
    var g=goodsOf(job&&job.query);
    var own={id:"ours",name:"Astranov",how:how,own:true,eta:how==="mail"?Math.max(mins,90):mins,note:"Our associates. Real time. Every stage verified. Heat and cold held."};
    var partner={id:"partner",name:"Local partner",how:how,own:false,eta:mins+8,note:"Our network. Partial stage check."};
    var mass=[
      {id:"doordash",name:"DoorDash",how:how,own:false,eta:mins+14,note:"Portal. Last mile only. Can arrive late or cold."},
      {id:"instacart",name:"Instacart",how:how,own:false,eta:mins+18,note:"Portal. One slice of the chain."},
      {id:"walmart",name:"Walmart",how:how,own:false,eta:mins+22,note:"Portal. Warehouse window. No full verify."}
    ];
    if(how==="mail") return [own,partner,{id:"post",name:"National post",how:how,own:false,eta:1440,note:"Days. No heat hold for "+g.name+"."}];
    if(how==="pickup") return [{id:"self",name:"You pick up",how:how,own:true,eta:mins,note:"Handoff at the shop. We confirm."}];
    return [own,partner].concat(mass);
  }

  function chooseHow(how){
    if(!selected){ talk("Pick a place first."); return; }
    if(job) job.how=how;
    showOffers(offerList(how));
  }

  function showOffers(list){
    clearNeed();
    list.forEach(function(o){
      need({id:o.id, label:o.name.toUpperCase()+" · "+(o.eta>=1440?Math.round(o.eta/1440)+"d":o.eta+"m"), run:function(){ pickCarrier(o); }});
    });
    var f=list[0];
    if(f.own){
      talk("Astranov first. About "+f.eta+" minutes. Own associates. Whole procedure watched. Portals only see a slice.");
    } else {
      talk(f.name+" · "+f.eta+" min. "+f.note);
    }
  }

  function pickCarrier(o){
    if(job) job.carrier=o;
    clearNeed();
    var price=o.how==="pickup"?6:(o.how==="mail"?14:10);
    need({id:"pay",label:"PAY",run:function(){ payDeposit(price,o); }});
    if(o.id==="ours"||(o.own&&o.how!=="pickup")){
      talk("Astranov. Paid, picked, boxed, moving, handed, verified. Temperature held. Pay when ready.");
    } else if(o.id==="self"){
      talk("Pick up at "+(selected&&selected.name||"the shop")+". We confirm the handoff. Pay when ready.");
    } else {
      talk(o.name+" · about "+o.eta+" min. They calculate a tiny part. Risk of delay or wrong temperature. Pay if you still want them.");
    }
  }

  function watchStages(){
    var i=0;
    function step(){
      if(!job||!job.carrier||job.carrier.id!=="ours") return;
      job.status=stages[i];
      talk("Stage "+stages[i]+".");
      i++;
      if(i<stages.length) setTimeout(step, 4000);
      else talk("Verified. On your hands as it should be.");
    }
    setTimeout(step, 1200);
  }

  function payDeposit(eur, carrier){
    say("PayPal…");
    fetch("/api/paypal/create-order",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({amount:eur||10,origin:location.origin})}).then(function(r){return r.json();}).then(function(j){
      if(j&&j.approve){ location.href=j.approve; return; }
      clearNeed();
      need({id:"pay",label:"PAY",run:function(){ payDeposit(eur,carrier); }});
      if(carrier&&(carrier.id==="ours"||carrier.own)){
        talk("Pay is not on this host yet. When it is, Astranov watches every stage.");
        watchStages();
      } else {
        talk("Pay is not on this host yet.");
      }
    }).catch(function(){ talk("Pay error."); });
  }

  function locate(){
    if(!navigator.geolocation){ talk("No GPS."); return Promise.resolve(); }
    say("Location…");
    return new Promise(function(resolve){
      navigator.geolocation.getCurrentPosition(function(p){
        here={lat:p.coords.latitude,lng:p.coords.longitude};
        showGlobe();
        talk("Found you. Say what you want.");
        resolve();
      }, function(){ talk("Allow location."); resolve(); }, {enableHighAccuracy:true,timeout:18000});
    });
  }

  function askMic(){
    if(!navigator.mediaDevices||!navigator.mediaDevices.getUserMedia) return Promise.resolve(false);
    return navigator.mediaDevices.getUserMedia({audio:true}).then(function(s){
      try{s.getTracks().forEach(function(t){t.stop();});}catch(e){}
      return true;
    }).catch(function(){ return false; });
  }

  function listen(){
    if(listening||speaking) return;
    var SR=window.SpeechRecognition||window.webkitSpeechRecognition;
    if(!SR) return;
    listening=true;
    rec=new SR();
    rec.continuous=false;
    rec.lang=navigator.language||"en-US";
    rec.onresult=function(ev){
      var i,tx="",fin=false;
      for(i=ev.resultIndex;i<ev.results.length;i++){ tx+=ev.results[i][0].transcript; if(ev.results[i].isFinal) fin=true; }
      if(inEl) inEl.value=tx;
      if(fin&&tx.trim()){ listening=false; try{rec.stop();}catch(e){} run(tx.trim()); }
    };
    rec.onend=function(){ listening=false; if(wantEar&&!speaking) setTimeout(listen,500); };
    rec.onerror=function(ev){ listening=false; if(ev&&ev.error==="not-allowed") wantEar=false; };
    try{ rec.start(); }catch(e){ listening=false; }
  }

  function grok(text){
    say("…");
    fetch("/api/ai",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({prompt:text})}).then(function(r){return r.json();}).then(function(j){
      talk((j&&(j.text||j.response||j.answer))||"");
    }).catch(function(){ talk("AI busy."); });
  }

  function run(raw){
    var t=String(raw||"").trim();
    if(!t) return;
    var low=t.toLowerCase();
    if(low==="reboot") return (window.SNReboot&&SNReboot());
    if(low==="locate"||low==="where am i") return locate();
    if(low==="globe"||low==="close") return showGlobe();
    if(selected&&/mail|post/.test(low)) return chooseHow("mail");
    if(selected&&/pick\s*up|collect/.test(low)) return chooseHow("pickup");
    if(selected&&(/\bnow\b|instant|deliver/.test(low))) return chooseHow("now");
    if(selected&&/astranov|ours|associates/.test(low)) return pickCarrier(offerList((job&&job.how)||"now")[0]);
    if(selected&&/doordash/.test(low)) return pickCarrier({id:"doordash",name:"DoorDash",how:(job&&job.how)||"now",own:false,eta:30,note:"Portal. Last mile only."});
    if(selected&&/instacart/.test(low)) return pickCarrier({id:"instacart",name:"Instacart",how:(job&&job.how)||"now",own:false,eta:35,note:"Portal. One slice."});
    if(selected&&/walmart/.test(low)) return pickCarrier({id:"walmart",name:"Walmart",how:(job&&job.how)||"now",own:false,eta:40,note:"Portal."});
    if(selected&&/partner/.test(low)) return pickCarrier(offerList((job&&job.how)||"now")[1]||offerList("now")[1]);
    if(/pizza|food|φαγη|πιτσ|coffee|pharm|shop|want|order|ice|gelato/.test(low)) return hunt(t);
    if(low.indexOf("pay")>=0) return payDeposit(10, job&&job.carrier);
    return grok(t);
  }

  function size(){
    if(!canvas) return;
    var d=Math.min(2,devicePixelRatio||1);
    canvas.width=Math.max(1,Math.floor((innerWidth||320)*d));
    canvas.height=Math.max(1,Math.floor((innerHeight||480)*d));
  }
  function tick(){
    try{
      if(canvas){
        var ctx=canvas.getContext("2d");
        if(ctx){
          ctx.fillStyle="#02040a";
          ctx.fillRect(0,0,canvas.width,canvas.height);
          var w=canvas.width,h=canvas.height,cx=w*0.5,cy=h*0.46,r=Math.min(w,h)*0.42/dist;
          ctx.strokeStyle="rgba(77,240,255,0.35)";
          ctx.beginPath(); ctx.arc(cx,cy,r,0,Math.PI*2); ctx.stroke();
          yaw+=0.0016;
        }
      }
    }catch(e){}
    requestAnimationFrame(tick);
  }
  function boot(){
    if(permsTried) return;
    permsTried=true;
    askMic().then(function(){ locate().then(function(){ setTimeout(listen,600); }); });
  }
  window.SN={ver:"V1",run:run,locate:locate,listen:listen,hunt:hunt};
  if(form) form.addEventListener("submit", function(e){ e.preventDefault(); var v=inEl&&inEl.value; if(inEl) inEl.value=""; run(v); });
  var go=document.getElementById("go");
  if(go) go.addEventListener("click", function(e){ e.preventDefault(); if(inEl&&inEl.value.trim()){ run(inEl.value.trim()); inEl.value=""; return; } wantEar=true; listen(); });
  var plus=document.getElementById("plus");
  if(plus) plus.addEventListener("click", function(){
    if(selected && job && !job.how) return selectVendor(selected);
    if(selected && job && job.how && !job.carrier) return showOffers(offerList(job.how));
    talk("Say what you want. Then now, mail, or pick up.");
  });
  document.addEventListener("pointerdown", function(){ if(!permsTried) boot(); }, {passive:true});
  window.addEventListener("resize", size);
  size(); tick(); setTimeout(boot,200);
})();
