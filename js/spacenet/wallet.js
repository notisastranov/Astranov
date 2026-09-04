/* SpaceNet wallet 4143 — AV€ in via PayPal, AV€ out via PayPal. */
(function(){
  var OWNER = { "notisastranov@gmail.com":1 };
  function read(k, d){ try{ var v=localStorage.getItem(k); return v==null?d:v; }catch(e){ return d; } }
  function write(k,v){ try{ localStorage.setItem(k, String(v)); }catch(e){} }
  function num(k){ return Math.max(0, Number(read(k,"0"))||0); }
  function user(){ try{ return JSON.parse(read("sn:user","null")||"null"); }catch(e){ return null; } }
  function emailOf(){ var u=user(); return String((u&& (u.email||u.user_email))||"").toLowerCase(); }
  function token(){ return String(read("sn:access","")||""); }
  var OWNER_MAIL={"notisastranov@gmail.com":1,"info@astranov.eu":1};
  for(var k in OWNER_MAIL) OWNER[k]=1;
  var POOL=3000000;
  function owner(){
    var e=emailOf();
    if(OWNER[e] || (e && e.indexOf("@astranov.eu")>=0)){ write("sn:owner","1"); return true; }
    try{ var extra=JSON.parse(read("sn:architect","[]")); if(e && extra.indexOf(e)>=0){ write("sn:owner","1"); return true; } }catch(x){}
    if(read("sn:owner")==="1") return true;
    var u=user(), name=String((u&&u.name)||"");
    if(/astranov/i.test(e) || /astranov/i.test(name)){ write("sn:owner","1"); return true; }
    return false;
  }
  function lockSeed(){
    var a=num("sn:avc"), p=num("sn:pool");
    if(!p && a>=1000000) p=a;
    if(p) write("sn:pool", String(p));
    if(!owner()) return;
    p=Math.max(p, a, POOL);
    write("sn:pool", String(p));
    write("sn:avc", String(p));
  }
  function shown(){
    if(!user()) return 0;
    if(owner()) return Math.max(num("sn:pool"), num("sn:avc"), POOL);
    var a=num("sn:avc"), p=num("sn:pool");
    if(p && a===p && a>=1000000) return 0;
    return a;
  }
  try{ lockSeed(); }catch(e){}
  function measure(text, font){
    var s=document.createElement("span");
    s.style.cssText="position:absolute;left:-9999px;top:0;white-space:nowrap;font:"+font;
    s.textContent=text;
    document.body.appendChild(s);
    var w=s.offsetWidth; s.remove(); return w;
  }
  function roomFor(btn){
    var isl=document.getElementById("island");
    if(!isl||!btn) return 9999;
    var used=0, i, ch;
    for(i=0;i<isl.children.length;i++){ ch=isl.children[i]; if(ch===btn) continue; used+=ch.getBoundingClientRect().width; }
    return Math.max(0, isl.clientWidth-used-28);
  }
  function euro(n, dec){
    n=Number(n)||0;
    var sign=n<0?"\u2212":"";
    n=Math.abs(n);
    var cents=Math.round((n-Math.floor(n+1e-9))*100);
    var whole=dec?Math.floor(n+1e-9):Math.round(n);
    var s=String(whole), bits=[];
    while(s.length>3){ bits.unshift(s.slice(-3)); s=s.slice(0,-3); }
    if(s) bits.unshift(s);
    var out=sign+"AV\u20ac "+bits.join(".");
    if(dec && cents) out+=","+(cents<10?"0":"")+cents;
    return out;
  }
  function bankOpen(){ var cash=document.getElementById("sn-cash"); return !!(cash && cash.classList.contains("on")); }
  function fmt(n){
    n=Number(n)||0;
    var dec=bankOpen();
    var btn=document.getElementById("sn-money");
    var font=(btn&&window.getComputedStyle)?getComputedStyle(btn).font:"800 13px ui-monospace,system-ui";
    var room=roomFor(btn), pad=28, full=euro(n, dec);
    if(measure(full,font)+pad<=room) return full;
    if(n>=1000000) return "AV\u20ac "+String(Math.round(n/1000000))+"M";
    return full;
  }
  function paint(){
    var btn=document.getElementById("sn-money");
    if(!btn) return;
    if(btn.classList.contains("loose")||btn.classList.contains("drag")) return;
    lockSeed();
    var n=shown();
    btn.textContent=fmt(n);
    btn.title=!user()?"Sign in. Wallets start at zero.":(owner()?"Your pool. Only you see this.":"Your AV\u20ac. Only you see this.");
  }
  function cashHtml(){
    var u=user(), bal=num("sn:avc"), bits=[];
    if(!u){
      bits.push('<div class="bal">AV\u20ac 0</div>');
      bits.push('<p>Your wallet starts at zero. Sign in with Google. Phone lives on YOU.</p>');
      bits.push('<button type="button" class="act" data-act="google">CONTINUE WITH GOOGLE</button>');
      bits.push('<button type="button" class="act" data-act="you">OPEN PROFILE</button>');
      return bits.join("");
    }
    bits.push('<div class="bal">'+fmt(bal)+'</div>');
    bits.push('<p>'+String(u.name||u.email||"You").replace(/[<>]/g,"")+' \u00b7 '+String(u.email||"").replace(/[<>]/g,"")+'</p>');
    bits.push('<p>In and out through PayPal. Same coins pay shops and agents.</p>');
    if(owner()){
      bits.push('<p>Owner pool: '+fmt(num("sn:pool"))+'</p>');
      bits.push('<p>SpaceNet 3% filed: '+fmt(num("sn:platform"))+'</p>');
    }
    bits.push('<button type="button" class="act" data-act="you">OPEN PROFILE</button>');
    bits.push('<button type="button" class="act" data-act="reload">RELOAD EUR \u2192 AV\u20ac</button>');
    bits.push('<button type="button" class="act" data-act="outpay">WITHDRAW AV\u20ac \u2192 PAYPAL</button>');
    bits.push('<button type="button" class="act" data-act="out">SIGN OUT</button>');
    return bits.join("");
  }
  function hookCash(){
    var body=document.getElementById("sn-cash-body");
    if(!body) return;
    body.innerHTML=cashHtml();
    body.onclick=function(e){
      var act=e.target && e.target.getAttribute && e.target.getAttribute("data-act");
      if(act==="google" && window.SNAuth && SNAuth.google) SNAuth.google();
      if(act==="you"){
        var cash=document.getElementById("sn-cash");
        if(cash) cash.classList.remove("on");
        if(window.SNAuth && SNAuth.open) SNAuth.open();
      }
      if(act==="reload") reload(10);
      if(act==="outpay") withdraw(10);
      if(act==="out" && window.SNAuth && SNAuth.out) SNAuth.out();
    };
  }
  function lineSay(t){
    var line=document.getElementById("line");
    if(line) line.textContent=t;
    if(window.SN && SN.talk) SN.talk(t);
  }
  function authHeaders(){
    var h={"Content-Type":"application/json"};
    var t=token();
    if(t.length>20) h.Authorization="Bearer "+t;
    return h;
  }
  function reload(eur){
    eur=Math.max(10, Number(eur)||10);
    try{ sessionStorage.setItem("sn:paypal-reload", String(eur)); }catch(e){}
    lineSay("PayPal reload…");
    fetch("/api/paypal/create-order",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({amount:eur,origin:location.origin,reference:"avc-reload"})})
      .then(function(r){ return r.json(); })
      .then(function(j){
        if(j&&j.ok&&j.approve){ location.href=j.approve; return; }
        lineSay((j&&j.error==="paypal_not_configured")?"PayPal is not on this host yet.":"PayPal could not start.");
      })
      .catch(function(){ lineSay("PayPal could not be reached."); });
  }
  function withdraw(eur){
    eur=Math.max(10, Number(eur)||10);
    if(!user()){ lineSay("Sign in first."); return; }
    if(!token()){ lineSay("Sign in so SpaceNet can send PayPal."); return; }
    lineSay("Sending "+fmt(eur)+" to PayPal…");
    fetch("/api/paypal/payout",{
      method:"POST",
      headers:authHeaders(),
      body:JSON.stringify({amount:eur, paypal:emailOf()})
    })
      .then(function(r){ return r.json(); })
      .then(function(j){
        if(j&&j.ok){
          var next=Math.max(0, num("sn:avc")-eur);
          if(!owner()) write("sn:avc", String(next));
          paint();
          lineSay("Sent "+fmt(eur)+" to PayPal "+emailOf()+". Left "+fmt(j.avc!=null?j.avc:next)+".");
          return;
        }
        if(j&&j.error==="insufficient") lineSay("Not enough AV\u20ac on the ledger. Reload or earn first. Ledger "+fmt(j.avc||0)+".");
        else if(j&&j.error==="min_10") lineSay("Minimum cash out is AV\u20ac 10.");
        else if(j&&j.error==="paypal_not_configured") lineSay("PayPal is not on this host yet.");
        else if(j&&j.need==="login") lineSay("Sign in to cash out.");
        else lineSay("PayPal payout did not go. "+((j&&j.error)||""));
      })
      .catch(function(){ lineSay("PayPal payout could not be reached."); });
  }
  function wrap(){
    paint();
    var cash=document.getElementById("sn-cash");
    if(cash && !cash.__snWallet){
      cash.__snWallet=true;
      var obs=new MutationObserver(function(){ if(cash.classList.contains("on")) hookCash(); });
      obs.observe(cash,{attributes:true,attributeFilter:["class"]});
    }
    if(window.SN && !window.SN.__wallet){
      window.SN.__wallet=true;
      window.SN.avc=function(){ return shown(); };
      window.SN.owner=owner;
      window.SN.user=user;
      window.SN.reload=reload;
      window.SN.withdraw=withdraw;
      if(SN.paintMoney && !SN.paintMoney.__w){
        SN.paintMoney=function(flash){
          lockSeed(); paint();
          var btn=document.getElementById("sn-money");
          if(flash && btn){ btn.classList.remove("glow"); void btn.offsetWidth; btn.classList.add("glow"); }
        };
        SN.paintMoney.__w=true;
      }
      if(SN.openCash && !SN.openCash.__w){
        var oc=SN.openCash;
        SN.openCash=function(){ oc(); setTimeout(hookCash,0); };
        SN.openCash.__w=true;
      }
    }
  }
  wrap();
  setInterval(wrap, 800);
  document.addEventListener("visibilitychange", paint);
  window.SNWallet={paint:paint, owner:owner, user:user, hookCash:hookCash, fmt:fmt, shown:shown, reload:reload, withdraw:withdraw};
})();
