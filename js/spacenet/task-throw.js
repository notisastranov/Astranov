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
    if(document.getElementById("sn-throw-css")) return;
    var s=document.createElement("style");
    s.id="sn-throw-css";
    s.textContent=
      "#sn-tasks-btn{display:flex!important;align-items:center;justify-content:center;z-index:50;pointer-events:auto;touch-action:manipulation}"+
      "#sn-tasks-btn.on{display:flex!important}"+
      "#sn-throw{position:fixed;inset:0;z-index:140;display:none;align-items:center;justify-content:center;flex-direction:column;pointer-events:auto}"+
      "#sn-throw.on{display:flex}"+
      "#sn-throw .fog{position:absolute;inset:0;background:rgba(0,10,22,.55)}"+
      "#sn-throw .ring{position:absolute;left:50%;top:38%;width:40px;height:40px;border-radius:999px;border:3px solid #4df0ff;box-shadow:0 0 40px #4df0ff,0 0 90px #1aa7ff;transform:translate(-50%,-50%) scale(.2);opacity:0}"+
      "#sn-throw.on .ring{animation:snThrowRing 1.1s cubic-bezier(.12,.8,.2,1) forwards}"+
      "#sn-throw .blob{position:relative;z-index:2;min-width:min(92vw,420px);padding:28px 22px 22px;border-radius:28px;background:radial-gradient(circle at 50% 20%,rgba(80,230,255,.28),rgba(4,16,36,.92) 62%);border:1.5px solid rgba(77,240,255,.95);box-shadow:0 0 48px rgba(40,200,255,.45), inset 0 0 40px rgba(40,200,255,.12);text-align:center;transform:scale(.84);opacity:0}"+
      "#sn-throw.on .blob{animation:snThrowBlob .55s .15s cubic-bezier(.12,.8,.2,1) forwards}"+
      "#sn-throw .kicker{font:800 11px/1 system-ui;letter-spacing:.28em;color:#7ee9ff;margin:0 0 10px}"+
      "#sn-throw .pay{font:900 clamp(42px,14vw,86px)/.9 ui-monospace,system-ui;color:#e8fbff;text-shadow:0 0 18px #4df0ff,0 0 42px #1aa7ff;letter-spacing:.02em;margin:0 0 14px}"+
      "#sn-throw .route{font:700 14px/1.45 system-ui;color:#c6f6ff;text-align:left;background:rgba(0,12,24,.45);border:1px solid rgba(77,240,255,.28);border-radius:14px;padding:12px 14px;margin:0 0 12px}"+
      "#sn-throw .route b{color:#7ee9ff;display:block;font:800 10px/1 system-ui;letter-spacing:.16em;margin:0 0 4px}"+
      "#sn-throw .row{display:flex;justify-content:space-between;gap:10px;margin:3px 0}"+
      "#sn-throw .acts{display:flex;gap:8px}"+
      "#sn-throw .acts button{flex:1;height:42px;border-radius:12px;border:1px solid rgba(77,240,255,.7);background:rgba(4,20,36,.9);color:#7ee9ff;font:800 11px/1 system-ui;letter-spacing:.14em}"+
      "#sn-throw .acts .go{background:#4df0ff;color:#031018}"+
      "#sn-perm{position:fixed;left:50%;bottom:calc(env(safe-area-inset-bottom) + 86px);transform:translateX(-50%);z-index:141;width:min(360px,92vw);padding:12px;border-radius:16px;background:rgba(4,14,28,.96);border:1px solid rgba(126,233,255,.45);color:#c6f6ff;font:600 13px/1.35 system-ui;display:none}"+
      "#sn-perm.on{display:block}"+
      "#sn-perm b{display:block;color:#7ee9ff;font:800 11px/1 system-ui;letter-spacing:.16em;margin:0 0 6px}"+
      "#sn-perm .acts{display:flex;gap:8px;margin-top:10px}"+
      "#sn-perm button{flex:1;height:40px;border-radius:12px;border:1px solid rgba(77,240,255,.7);background:rgba(4,20,36,.9);color:#7ee9ff;font:800 10px/1 system-ui;letter-spacing:.12em}"+
      "@keyframes snThrowRing{0%{transform:translate(-50%,-50%) scale(.2);opacity:1}70%{opacity:.85}100%{transform:translate(-50%,-50%) scale(18);opacity:0}}"+
      "@keyframes snThrowBlob{to{transform:scale(1);opacity:1}}";
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
    function tone(type, f0, f1, g0, dur, delay){
      var o=c.createOscillator(), g=c.createGain(), f=c.createBiquadFilter();
      o.type=type;
      f.type="lowpass";
      o.frequency.setValueAtTime(f0, t0+delay);
      o.frequency.exponentialRampToValueAtTime(Math.max(30,f1), t0+delay+dur);
      f.frequency.setValueAtTime(Math.max(800,f0*2), t0+delay);
      f.frequency.exponentialRampToValueAtTime(280, t0+delay+dur);
      g.gain.setValueAtTime(0.0001, t0+delay);
      g.gain.exponentialRampToValueAtTime(g0, t0+delay+0.16);
      g.gain.exponentialRampToValueAtTime(0.0001, t0+delay+dur);
      o.connect(f); f.connect(g); g.connect(c.destination);
      o.start(t0+delay); o.stop(t0+delay+dur+0.05);
    }
    tone("sawtooth", 2100, 95, 0.18, 1.85, 0);
    tone("sine", 880, 62, 0.11, 1.9, 0.04);
    tone("triangle", 420, 48, 0.08, 1.7, 0.12);
    var splashT=1.82;
    var n=Math.floor(c.sampleRate*0.3), buf=c.createBuffer(1,n,c.sampleRate), d=buf.getChannelData(0), i;
    for(i=0;i<n;i++) d[i]=(Math.random()*2-1)*Math.pow(1-i/n, 2.2);
    var src=c.createBufferSource(), bp=c.createBiquadFilter(), sg=c.createGain();
    src.buffer=buf; bp.type="bandpass"; bp.frequency.value=1600; bp.Q.value=0.7;
    sg.gain.setValueAtTime(0.32, t0+splashT);
    sg.gain.exponentialRampToValueAtTime(0.0001, t0+splashT+0.32);
    src.connect(bp); bp.connect(sg); sg.connect(c.destination);
    src.start(t0+splashT);
    var thud=c.createOscillator(), tg=c.createGain();
    thud.type="sine";
    thud.frequency.setValueAtTime(110, t0+splashT);
    thud.frequency.exponentialRampToValueAtTime(32, t0+splashT+0.4);
    tg.gain.setValueAtTime(0.36, t0+splashT);
    tg.gain.exponentialRampToValueAtTime(0.0001, t0+splashT+0.42);
    thud.connect(tg); tg.connect(c.destination);
    thud.start(t0+splashT); thud.stop(t0+splashT+0.45);
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
      to:"Your pin"
    };
  }

  function throwSplash(job){
    css();
    var el=document.getElementById("sn-throw");
    if(!el){
      el=document.createElement("div");
      el.id="sn-throw";
      el.innerHTML='<div class="fog" data-x="1"></div><div class="ring"></div><div class="blob">'+
        '<div class="kicker">INCOMING TASK</div>'+
        '<div class="pay" id="sn-throw-pay"></div>'+
        '<div class="route" id="sn-throw-route"></div>'+
        '<div class="acts"><button type="button" class="go" data-x="take">TAKE</button><button type="button" data-x="list">TASKS</button></div>'+
        '</div>';
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
    if(pay) pay.textContent=euro(job.price, false);
    if(route){
      if(job.labor){
        var extras=(job.extras||[]).join(" · ")||"None";
        route.innerHTML=
          "<b>OPEN TASK</b>"+
          '<div class="row"><span>What</span><span>'+esc(job.what||"Labor")+"</span></div>"+
          '<div class="row"><span>Hours</span><span>'+String(job.hours).replace(".",",")+"</span></div>"+
          '<div class="row"><span>Labor</span><span>'+euro(job.base||0,false)+"</span></div>"+
          '<div class="row"><span>Specials</span><span>'+esc(extras)+"</span></div>"+
          '<div class="row"><span>Special fee</span><span>'+euro(job.extra||0,false)+" fixed</span></div>"+
          '<div class="row"><span>Client</span><span>'+esc(job.client||"YOU")+"</span></div>"+
          '<div class="row"><span>Vendor</span><span>Open board — any associate</span></div>';
      } else {
        route.innerHTML=
          "<b>ROUTE</b>"+
          '<div class="row"><span>Distance</span><span>'+km(job.km)+"</span></div>"+
          '<div class="row"><span>Vendor</span><span>'+esc(job.vendor)+"</span></div>"+
          '<div class="row"><span>Client</span><span>'+esc(job.client)+"</span></div>"+
          '<div class="row"><span>From</span><span>'+esc(job.from)+"</span></div>"+
          '<div class="row"><span>To</span><span>'+esc(job.to)+"</span></div>";
      }
    }
    el.classList.remove("on");
    void el.offsetWidth;
    el.classList.add("on");
    flyover();
    overlayNote(job);
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
