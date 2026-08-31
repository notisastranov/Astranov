/* SpaceNet 4105 — TASKS always visible. Tap throws a neon test job. */
(function(){
  if(window.__snTaskThrow) return;
  window.__snTaskThrow=true;

  function esc(s){ return String(s||"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;"); }
  function euro(n, dec){
    n=Number(n)||0;
    var sign=n<0?"−":"";
    n=Math.abs(n);
    var whole=Math.round(n);
    var cents=Math.round((n-Math.floor(n+1e-9))*100);
    if(dec) whole=Math.floor(n+1e-9);
    else whole=Math.round(n);
    var s=String(whole), bits=[];
    while(s.length>3){ bits.unshift(s.slice(-3)); s=s.slice(0,-3); }
    if(s) bits.unshift(s);
    var out=sign+"AV€ "+bits.join(".");
    if(dec && cents) out+=","+(cents<10?"0":"")+cents;
    return out;
  }
  function km(n){
    n=Number(n)||0;
    var s=n.toFixed(1).replace(".",",");
    if(/,0$/.test(s)) s=s.slice(0,-2);
    return s+" km";
  }
  function who(){
    try{
      var u=JSON.parse(localStorage.getItem("sn:user")||"null");
      if(u&& (u.name||u.email)) return String(u.name||u.email).split("@")[0];
    }catch(e){}
    return "YOU";
  }
  function css(){
    var s=document.getElementById("sn-throw-css");
    if(s) s.remove();
    s=document.createElement("style");
    s.id="sn-throw-css";
    s.textContent=
      "#sn-tasks-btn{display:flex!important;align-items:center;justify-content:center;z-index:50;pointer-events:auto;touch-action:manipulation}"+
      "#sn-tasks-btn.on{display:flex!important}"+
      "#sn-throw{position:fixed;inset:0;z-index:90;display:none;pointer-events:none}"+
      "#sn-throw.on{display:block}"+
      "#sn-throw .drip{position:fixed;left:50%;top:max(62px,env(safe-area-inset-top) + 52px);width:156px;height:156px;transform:translateX(-50%);pointer-events:auto;z-index:2}"+
      "#sn-throw .goo{position:absolute;inset:0;border-radius:47% 53% 45% 55%/52% 40% 60% 48%;background:#000;border:2.5px solid #4df0ff;box-shadow:0 0 16px #4df0ff,0 0 36px rgba(77,240,255,.55),inset 0 0 10px rgba(77,240,255,.15);opacity:0;transform:scale(.15)}"+
      "#sn-throw.hit .goo{animation:snPop .38s cubic-bezier(.1,1.6,.2,1) forwards, snGoo 2.2s .38s ease-in-out infinite}"+
      "#sn-throw .drop{position:absolute;width:12px;height:16px;border-radius:70% 70% 55% 55%;background:#000;border:2px solid #4df0ff;box-shadow:0 0 8px #4df0ff;opacity:0}"+
      "#sn-throw.hit .drop{animation:snDrop .7s ease-out forwards}"+
      "#sn-throw .drop.d1{left:8%;top:18%;animation-delay:.05s}"+
      "#sn-throw .drop.d2{right:6%;top:28%;animation-delay:.1s}"+
      "#sn-throw .drop.d3{left:18%;bottom:8%;animation-delay:.14s}"+
      "#sn-throw .drop.d4{right:14%;bottom:12%;animation-delay:.18s}"+
      "#sn-throw .ring{position:absolute;left:50%;top:50%;width:24px;height:24px;border-radius:999px;border:2px solid rgba(77,240,255,.9);transform:translate(-50%,-50%) scale(.2);opacity:0;pointer-events:none}"+
      "#sn-throw.hit .ring{animation:snThrowRing .9s cubic-bezier(.12,.8,.2,1) forwards}"+
      "#sn-throw.hit .ring.r2{animation-delay:.08s}"+
      "#sn-throw .pay{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;flex-direction:column;font:900 26px/1 ui-monospace,system-ui;color:#4df0ff;text-shadow:0 0 8px #4df0ff,0 0 18px #4df0ff;text-align:center;pointer-events:none;opacity:0}"+
      "#sn-throw.hit .pay{animation:snFade .25s .2s forwards}"+
      "#sn-throw .pay small{display:block;font:800 8px/1 system-ui;letter-spacing:.2em;color:#4df0ff;margin-bottom:4px}"+
      "#sn-throw .strip{position:fixed;left:50%;bottom:calc(env(safe-area-inset-bottom) + 76px);transform:translateX(-50%);width:min(92vw,380px);max-height:72px;overflow:hidden;pointer-events:auto;padding:8px 12px;border-radius:16px;background:rgba(4,14,28,.78);border:1px solid rgba(77,240,255,.4);color:#c6f6ff;font:700 11px/1.35 system-ui;text-align:center;z-index:3;backdrop-filter:blur(8px)}"+
      "#sn-throw .strip b{color:#7ee9ff;letter-spacing:.12em;margin-right:6px}"+
      "#sn-perm{position:fixed;left:50%;bottom:calc(env(safe-area-inset-bottom) + 86px);transform:translateX(-50%);z-index:141;width:min(360px,92vw);padding:12px;border-radius:16px;background:rgba(4,14,28,.96);border:1px solid rgba(126,233,255,.45);color:#c6f6ff;font:600 13px/1.35 system-ui;display:none;pointer-events:auto}"+
      "#sn-perm.on{display:block}"+
      "#sn-perm b{display:block;color:#7ee9ff;font:800 11px/1 system-ui;letter-spacing:.16em;margin:0 0 6px}"+
      "#sn-perm .acts{display:flex;gap:8px;margin-top:10px}"+
      "#sn-perm button{flex:1;height:40px;border-radius:12px;border:1px solid rgba(77,240,255,.7);background:rgba(4,20,36,.9);color:#7ee9ff;font:800 10px/1 system-ui;letter-spacing:.12em}"+
      "@keyframes snPop{from{opacity:0;transform:scale(.12)}70%{opacity:1;transform:scale(1.08)}to{opacity:1;transform:scale(1)}}"+
      "@keyframes snGoo{0%,100%{border-radius:47% 53% 45% 55%/52% 40% 60% 48%}50%{border-radius:58% 42% 56% 44%/40% 62% 38% 60%}}"+
      "@keyframes snDrop{0%{opacity:1;transform:translate(0,0) scale(1)}100%{opacity:0;transform:translate(var(--dx,12px),var(--dy,28px)) scale(.3)}}"+
      "@keyframes snThrowRing{0%{transform:translate(-50%,-50%) scale(.2);opacity:.9}100%{transform:translate(-50%,-50%) scale(7);opacity:0}}"+
      "@keyframes snFade{to{opacity:1}}";
    document.head.appendChild(s);
  }

  var actx=null;
  function ctx(){
    var AC=window.AudioContext||window.webkitAudioContext;
    if(!AC) return null;
    if(!actx) actx=new AC();
    if(actx.state==="suspended") actx.resume();
    return actx;
  }
  function flyover(){
    var c=ctx();
    if(!c) return;
    var t0=c.currentTime;
    var T=13.4;
    function env(g, t, a, peak, hold, rel, lvl){
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(lvl, t+a);
      g.gain.setValueAtTime(lvl, t+a+hold);
      g.gain.exponentialRampToValueAtTime(0.0001, t+a+hold+rel);
    }
    function osc(type, f0, f1, t, dur, lvl){
      var o=c.createOscillator(), g=c.createGain(), f=c.createBiquadFilter();
      o.type=type;
      f.type="lowpass";
      f.Q.value=0.7;
      o.frequency.setValueAtTime(f0, t);
      o.frequency.exponentialRampToValueAtTime(Math.max(20,f1), t+dur);
      f.frequency.setValueAtTime(Math.min(18000, Math.max(f0,f1)*2), t);
      f.frequency.exponentialRampToValueAtTime(Math.max(80, Math.min(f0,f1)*1.4), t+dur);
      env(g, t, 0.12, lvl, Math.max(0.05, dur-0.9), 0.7, lvl);
      o.connect(f); f.connect(g); g.connect(c.destination);
      o.start(t); o.stop(t+dur+0.05);
    }
    function noiseBand(t, dur, freq, q, lvl, type){
      var n=Math.floor(c.sampleRate*dur), buf=c.createBuffer(1,n,c.sampleRate), d=buf.getChannelData(0), i;
      for(i=0;i<n;i++) d[i]=Math.random()*2-1;
      var src=c.createBufferSource(); src.buffer=buf;
      var bp=c.createBiquadFilter(); bp.type=type||"bandpass"; bp.frequency.value=freq; bp.Q.value=q;
      var g=c.createGain();
      env(g, t, 0.04, lvl, dur*0.35, dur*0.6, lvl);
      src.connect(bp); bp.connect(g); g.connect(c.destination);
      src.start(t); src.stop(t+dur+0.02);
    }
    /* jet: high scream down through the pass, 13s of air */
    osc("sawtooth", 9800, 180, t0, T-0.4, 0.16);
    osc("sawtooth", 6400, 90, t0+0.15, T-0.6, 0.12);
    osc("sine", 4200, 55, t0+0.2, T-0.5, 0.1);
    osc("triangle", 1800, 40, t0+0.35, T-0.7, 0.09);
    osc("sine", 220, 28, t0+0.5, T-0.8, 0.14);
    osc("sine", 80, 22, t0+0.8, T-1.0, 0.16);
    /* full-spectrum wash so it cuts any room noise */
    noiseBand(t0+0.05, T-0.2, 80, 0.4, 0.1, "lowpass");
    noiseBand(t0+0.1, T-0.3, 250, 0.6, 0.08, "bandpass");
    noiseBand(t0+0.12, T-0.3, 900, 0.7, 0.09, "bandpass");
    noiseBand(t0+0.14, T-0.35, 2500, 0.8, 0.1, "bandpass");
    noiseBand(t0+0.16, T-0.4, 6000, 0.9, 0.11, "bandpass");
    noiseBand(t0+0.18, T-0.45, 10000, 0.8, 0.1, "highpass");
    noiseBand(t0+0.2, T-0.5, 14000, 0.7, 0.08, "highpass");
    /* splash hit ~1.8s then a second body hit, long decay to 13s */
    function splash(at, lvl){
      noiseBand(at, 4.8, 60, 0.3, lvl*0.9, "lowpass");
      noiseBand(at, 3.6, 400, 0.5, lvl*0.7, "bandpass");
      noiseBand(at, 3.2, 1800, 0.6, lvl, "bandpass");
      noiseBand(at, 2.8, 5000, 0.7, lvl*0.95, "bandpass");
      noiseBand(at, 2.4, 9000, 0.6, lvl*0.85, "highpass");
      noiseBand(at, 2.0, 15000, 0.5, lvl*0.7, "highpass");
      osc("sine", 140, 32, at, 5.2, lvl*0.9);
      osc("triangle", 90, 24, at, 6.0, lvl*0.7);
      osc("sawtooth", 3200, 120, at, 3.4, lvl*0.35);
    }
    splash(t0+1.75, 0.28);
    splash(t0+3.1, 0.18);
    splash(t0+6.2, 0.12);
  }
  function overlayNote(job){
    var title="TASK  "+euro(job.price,false);
    var body=km(job.km)+" · "+job.vendor+" → "+job.client;
    function show(reg){
      try{
        var opts={body:body, tag:"sn-task-throw", silent:true, requireInteraction:true, vibrate:[90,40,90], data:job};
        if(reg&&reg.showNotification) reg.showNotification(title, opts);
        else if(window.Notification&&Notification.permission==="granted") new Notification(title, opts);
      }catch(e){}
    }
    if(navigator.serviceWorker&&navigator.serviceWorker.ready){
      navigator.serviceWorker.ready.then(show).catch(function(){ show(null); });
    } else show(null);
  }

  function askPerms(done){
    var needN=!("Notification" in window) ? false : Notification.permission==="default";
    var needA=!actx || actx.state==="suspended";
    ctx();
    function finish(){ if(done) done(); }
    if(!needN && !needA){ finish(); return; }
    var box=document.getElementById("sn-perm");
    if(!box){
      box=document.createElement("div");
      box.id="sn-perm";
      box.innerHTML='<b>OVERLAY + SOUND</b>SpaceNet throws tasks over whatever is on screen. Allow notifications (overlay) and sound.'+
        '<div class="acts"><button type="button" data-k="go">ALLOW</button><button type="button" data-k="skip">NOT NOW</button></div>';
      document.body.appendChild(box);
      box.addEventListener("click", function(e){
        var k=e.target && e.target.getAttribute("data-k");
        if(!k) return;
        box.classList.remove("on");
        if(k==="go"){
          ctx();
          if(window.Notification && Notification.permission==="default"){
            Notification.requestPermission().then(function(){ finish(); }).catch(finish);
            return;
          }
        }
        finish();
      });
    }
    if(needN){
      box.classList.add("on");
      return;
    }
    finish();
  }

  function jobOf(){
    return {
      id:"test-"+Date.now(),
      price:24,
      km:2.4,
      vendor:"Kalithea Oven",
      client:who(),
      from:"Kalithea, Rhodes",
      to:"Your pin",
      lat:36.382, lng:28.250
    };
  }


  function pin(){
    try{
      var p=JSON.parse(localStorage.getItem("sn:place")||"null");
      if(p&&isFinite(Number(p.lat))) return {lat:Number(p.lat),lng:Number(p.lng),name:p.name||"YOU"};
    }catch(e){}
    return {lat:36.382, lng:28.250, name:"Kalithea"};
  }
  function flyJob(job){
    var you=pin();
    var dest=you;
    if(job&&isFinite(Number(job.lat))) dest={lat:Number(job.lat),lng:Number(job.lng),name:job.vendor||job.what||"Task"};
    else if(job&&!job.labor) dest={lat:36.382,lng:28.250,name:job.vendor||"Kalithea Oven"};
    var from=you, to=dest;
    if(window.SN){
      try{
        if(from&&to&&SN.showCall&&(Math.abs(from.lat-to.lat)>0.0005||Math.abs(from.lng-to.lng)>0.0005)) SN.showCall(from,to);
        else if(SN.showCity) SN.showCity(to||from);
        else if(SN.showMap) SN.showMap(to||from, 14);
      }catch(e){}
    }
  }

  function throwSplash(job){
    css();
    var el=document.getElementById("sn-throw");
    if(!el){
      el=document.createElement("div");
      el.id="sn-throw";
      el.innerHTML='<div class="drip" data-x="take">'+
        '<div class="goo"></div><div class="ring"></div><div class="ring r2"></div>'+
        '<i class="drop d1"></i><i class="drop d2"></i><i class="drop d3"></i><i class="drop d4"></i>'+
        '<div class="pay" id="sn-throw-pay"></div></div>'+
        '<div class="strip" id="sn-throw-route"></div>';
      document.body.appendChild(el);
      el.addEventListener("click", function(e){
        var x=e.target && (e.target.getAttribute("data-x")|| (e.target.closest && e.target.closest("[data-x]") && e.target.closest("[data-x]").getAttribute("data-x")));
        if(x==="list"){
          el.classList.remove("on");
          if(window.SN && SN.openTasks) SN.openTasks();
          return;
        }
        if(x==="take" || x==="1"){
          el.classList.remove("on");
        }
      });
    }
    var pay=document.getElementById("sn-throw-pay");
    var route=document.getElementById("sn-throw-route");
    if(pay) pay.innerHTML="<small>TASK</small>"+esc(euro(job.price, false));
    if(route){
      if(job.labor){
        var extras=(job.extras||[]).join(" · ")||"no specials";
        route.innerHTML="<b>ROUTE</b>"+esc(job.what||"Labor")+" · "+String(job.hours).replace(".",",")+" h · "+esc(extras)+" · "+esc(job.client||"YOU");
      } else {
        route.innerHTML="<b>ROUTE</b>"+km(job.km)+" · "+esc(job.vendor)+" → "+esc(job.client);
      }
    }
    el.classList.remove("on","hit");
    void el.offsetWidth;
    el.classList.add("on");
    flyover();
    flyJob(job);
    overlayNote(job);
    clearTimeout(el.__hit);
    el.__hit=setTimeout(function(){ el.classList.add("hit"); }, 1750);
    try{ if(window.SN&&SN.say) SN.say("Task. "+euro(job.price,false)+". "+job.vendor+" to "+job.client+"."); }catch(e){}
    clearTimeout(el.__t);
    el.__t=setTimeout(function(){ el.classList.remove("on"); }, 8000);
  }

  function park(){
    var btn=document.getElementById("sn-tasks-btn");
    if(!btn) return;
    if(btn.classList.contains("loose")||btn.classList.contains("drag")) return;
    btn.classList.add("on");
    btn.style.display="flex";
    btn.style.zIndex="50";
    var pwr=document.getElementById("sn-power");
    var r=pwr&&pwr.getBoundingClientRect();
    var y, x;
    if(r && r.height>8 && r.top>8){
      y=Math.round(r.top);
      x=Math.round(r.right+8);
    } else {
      var isl=document.getElementById("island");
      var ir=isl&&isl.getBoundingClientRect();
      y=ir?Math.round(ir.bottom+8):Math.round((window.visualViewport&&visualViewport.offsetTop||0)+58);
      x=60;
    }
    var sup=document.getElementById("sn-support");
    var sr=sup&&sup.getBoundingClientRect();
    var tw=btn.offsetWidth||86;
    if(sr && x+tw>sr.left-8) x=Math.max(8, Math.round(sr.left-8-tw));
    btn.style.top=y+"px";
    btn.style.left=x+"px";
    btn.style.right="auto";
    btn.style.bottom="auto";
    if(!String(btn.textContent||"").replace(/\s/g,"")) btn.textContent="TASKS";
  }

  function bind(){
    css();
    var btn=document.getElementById("sn-tasks-btn");
    if(!btn) return;
    if(!btn.__snThrow){
      btn.__snThrow=true;
      btn.addEventListener("click", function(e){
        e.preventDefault();
        e.stopPropagation();
        if(e.stopImmediatePropagation) e.stopImmediatePropagation();
        if(btn.dataset.skipClick==="1"){ btn.dataset.skipClick=""; return; }
        ctx();
        if(window.Notification && Notification.permission==="default"){
          try{ Notification.requestPermission(); }catch(err){}
          var box=document.getElementById("sn-perm");
          if(!box){
            askPerms(function(){});
          }
        }
        throwSplash(jobOf());
      }, true);
    }
    park();
  }

  function hook(){
    bind();
    if(window.SN && SN.pack && !SN.pack.__throw){
      var orig=SN.pack;
      SN.pack=function(){ orig.apply(this, arguments); park(); };
      SN.pack.__throw=true;
    }
  }
  window.SNThrow={throw:function(job){ throwSplash(job||jobOf()); }, park:park, euro:euro, splash:throwSplash};
  if(document.readyState==="loading") document.addEventListener("DOMContentLoaded", hook);
  else hook();
  window.addEventListener("resize", park);
  setInterval(hook, 900);
})();
