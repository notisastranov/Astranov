/* SpaceNet wallet 4104 — personal AV€ only. Pool is owner-only. */
(function(){
  var OWNER = {
    "notisastranov@gmail.com":1
  };
  function read(k, d){ try{ var v=localStorage.getItem(k); return v==null?d:v; }catch(e){ return d; } }
  function write(k,v){ try{ localStorage.setItem(k, String(v)); }catch(e){} }
  function num(k){ return Math.max(0, Number(read(k,"0"))||0); }
  function user(){
    try{ return JSON.parse(read("sn:user","null")||"null"); }catch(e){ return null; }
  }
  function emailOf(){ var u=user(); return String((u&& (u.email||u.user_email))||"").toLowerCase(); }
  function owner(){
    var e=emailOf();
    if(OWNER[e]) return true;
    try{ var extra=JSON.parse(read("sn:architect","[]")); if(extra.indexOf(e)>=0) return true; }catch(x){}
    return false;
  }
  var OWNER_MAIL={"notisastranov@gmail.com":1,"info@astranov.eu":1};
  for(var k in OWNER_MAIL) OWNER[k]=1;
  function lockSeed(){
    write("sn:ave-restored","4024");
    var u=user(), isOwner=owner();
    var a=num("sn:avc"), p=num("sn:pool");
    if(!p && a>=1000000){ p=a; write("sn:pool", String(a)); }
    if(!u){
      if(a>0 && a>=1000) write("sn:avc","0");
      return;
    }
    if(isOwner){
      if(a>p) write("sn:pool", String(a));
      else if(p>a) write("sn:avc", String(p));
    } else if(a>=1000000){
      write("sn:avc","0");
    }
  }
  function shown(){
    if(!user()) return 0;
    if(owner()) return Math.max(num("sn:pool"), num("sn:avc"));
    return num("sn:avc");
  }
  try{ lockSeed(); }catch(e){}
  function measure(text, font){
    var s=document.createElement("span");
    s.style.cssText="position:absolute;left:-9999px;top:0;white-space:nowrap;font:"+font;
    s.textContent=text;
    document.body.appendChild(s);
    var w=s.offsetWidth;
    s.remove();
    return w;
  }
  function roomFor(btn){
    var isl=document.getElementById("island");
    if(!isl||!btn) return 9999;
    var used=0, i, ch;
    for(i=0;i<isl.children.length;i++){
      ch=isl.children[i];
      if(ch===btn) continue;
      used+=ch.getBoundingClientRect().width;
    }
    return Math.max(0, isl.clientWidth-used-28);
  }
  function fmt(n){
    n=Number(n)||0;
    var btn=document.getElementById("sn-money");
    var font=(btn&&window.getComputedStyle)?getComputedStyle(btn).font:"800 13px system-ui";
    var room=roomFor(btn);
    var pad=28;
    var full="AV€ "+n.toLocaleString("en-GB",{minimumFractionDigits:2,maximumFractionDigits:2});
    if(measure(full,font)+pad<=room) return full;
    var whole="AV€ "+Math.round(n).toLocaleString("en-GB");
    if(measure(whole,font)+pad<=room) return whole;
    if(n>=1000000) return "AV€ "+(n/1000000).toFixed(n%1000000?1:0)+"M";
    if(n>=10000) return "AV€ "+Math.round(n/1000)+"k";
    return whole;
  }
  function paint(){
    var btn=document.getElementById("sn-money");
    if(!btn) return;
    if(btn.classList.contains("loose")||btn.classList.contains("drag")) return;
    lockSeed();
    var n=shown();
    btn.textContent=fmt(n);
    btn.title=!user()?"Sign in. Wallets start at zero.":(owner()?"Your pool. Only you see this.":"Your AV€. Only you see this.");
  }
  function cashHtml(){
    var u=user(), bal=num("sn:avc"), phone=(u&&u.phone)||read("sn:phone","");
    var bits=[];
    if(!u){
      bits.push('<div class="bal">AV€ 0</div>');
      bits.push('<p>Your wallet starts at zero. Sign in with Google. Phone is stored on your profile until Twilio verifies it.</p>');
      bits.push('<button type="button" class="act" data-act="google">CONTINUE WITH GOOGLE</button>');
      bits.push('<label>Phone (unverified)<input id="sn-phone" type="tel" inputmode="tel" placeholder="+30 …" value="'+String(phone).replace(/"/g,"")+'">');
      bits.push('<button type="button" class="act" data-act="save-phone">SAVE PHONE</button>');
      return bits.join("");
    }
    bits.push('<div class="bal">'+fmt(bal)+'</div>');
    bits.push('<p>'+String(u.name||u.email||"You").replace(/[<>]/g,"")+' · '+String(u.email||"").replace(/[<>]/g,"")+'</p>');
    bits.push('<p>Your coins only. Other people cannot see this.</p>');
    if(owner()){
      bits.push('<p>Owner pool: '+fmt(num("sn:pool"))+'</p>');
      bits.push('<p>SpaceNet 3% filed: '+fmt(num("sn:platform"))+'</p>');
    }
    bits.push('<label>Phone (unverified until Twilio)<input id="sn-phone" type="tel" inputmode="tel" placeholder="+30 …" value="'+String(phone).replace(/"/g,"")+'"></label>');
    bits.push('<button type="button" class="act" data-act="save-phone">SAVE PHONE</button>');
    bits.push('<button type="button" class="act" data-act="reload">RELOAD EUR → AV€</button>');
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
      if(act==="save-phone"){
        var inp=document.getElementById("sn-phone");
        var tel=inp&&inp.value||"";
        if(window.SNAuth && SNAuth.savePhone) SNAuth.savePhone(tel);
      }
      if(act==="reload"){ reload(10); }
      if(act==="out" && window.SNAuth && SNAuth.out) SNAuth.out();
    };
  }
  function reload(eur){
    eur=Math.max(10, Number(eur)||10);
    try{ sessionStorage.setItem("sn:paypal-reload", String(eur)); }catch(e){}
    var line=document.getElementById("line");
    if(line) line.textContent="PayPal reload…";
    fetch("/api/paypal/create-order",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({amount:eur,origin:location.origin,reference:"avc-reload"})})
      .then(function(r){ return r.json(); })
      .then(function(j){
        if(j&&j.ok&&j.approve){ location.href=j.approve; return; }
        if(line) line.textContent=(j&&j.error==="paypal_not_configured")?"PayPal is not on this host yet.":"PayPal could not start.";
      })
      .catch(function(){ if(line) line.textContent="PayPal could not be reached."; });
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
      if(SN.paintMoney && !SN.paintMoney.__w){
        var pm=SN.paintMoney;
        SN.paintMoney=function(flash){
          lockSeed();
          paint();
          var btn=document.getElementById("sn-money");
          if(flash && btn){
            btn.classList.remove("glow");
            void btn.offsetWidth;
            btn.classList.add("glow");
          }
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
  window.SNWallet={paint:paint, owner:owner, user:user, hookCash:hookCash, fmt:fmt, shown:shown};
})();
