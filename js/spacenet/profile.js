/* SpaceNet 4094 — YOU: details, finger-sign, roles. Agent 1% for life out of the 3%. */
(function(){
  if(window.SNProfile) return;
  var DEF={name:"",email:"",phone:"",address:"",base:"",shops:"",sign:"",signedAt:0,roles:{},promo:"",referredBy:"",agentAvc:0};
  function readLS(k,d){ try{ var v=localStorage.getItem(k); return v==null?d:v; }catch(e){ return d; } }
  function writeLS(k,v){ try{ localStorage.setItem(k,v); }catch(e){} }
  function talk(s){ if(window.SN&&SN.talk) SN.talk(s); else { var el=document.getElementById("line"); if(el) el.textContent=s; } }
  function load(){
    var p=DEF;
    try{ p=Object.assign({}, DEF, JSON.parse(readLS("sn:profile","{}")||"{}")); }catch(e){ p=Object.assign({},DEF); }
    p.roles=p.roles||{};
    var u=window.SNAuth&&SNAuth.user&&SNAuth.user();
    if(u){
      if(!p.email) p.email=u.email||"";
      if(!p.name) p.name=u.name||"";
      if(!p.phone) p.phone=u.phone||readLS("sn:phone","");
    }
    if(!p.phone) p.phone=readLS("sn:phone","");
    if(!p.referredBy) p.referredBy=readLS("sn:referred-by","");
    p.agentAvc=Number(readLS("sn:agent-avc", p.agentAvc||0))||0;
    return p;
  }
  function save(p){
    writeLS("sn:profile", JSON.stringify(p));
    if(p.phone) writeLS("sn:phone", p.phone);
    if(p.referredBy) writeLS("sn:referred-by", p.referredBy);
    writeLS("sn:agent-avc", String(p.agentAvc||0));
    var t=readLS("sn:access","");
    if(t){
      fetch("https://lkoatrkhuigdolnjsbie.supabase.co/auth/v1/user",{
        method:"PUT",
        headers:{apikey:"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxrb2F0cmtodWlnZG9sbmpzYmllIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg4ODIwOTIsImV4cCI6MjA5NDQ1ODA5Mn0.qf6Kg93YLJ0coTdVQa4baU0ppOdFY5WkmVzMvEV6ejI",Authorization:"Bearer "+t,"Content-Type":"application/json"},
        body:JSON.stringify({data:{profile:p,phone:p.phone,phone_verified:false}})
      }).catch(function(){});
    }
  }
  function slug(name){
    return String(name||"AGENT").toUpperCase().replace(/[^A-Z0-9]+/g,"-").replace(/^-+|-+$/g,"").slice(0,16)||"AGENT";
  }
  function makePromo(name){
    var id=Math.random().toString(36).slice(2,6).toUpperCase();
    return "ASTRANOV-"+slug(name)+"-"+id;
  }
  function agentName(code){
    var p=String(code||"").split("-");
    if(p.length>=3 && p[0]==="ASTRANOV") return p.slice(1,-1).join("-")||"AGENT";
    return "AGENT";
  }
  function css(){
    if(document.getElementById("sn-prof-css")) return;
    var s=document.createElement("style");
    s.id="sn-prof-css";
    s.textContent=
      "#sn-me-sheet .card{max-height:min(78vh,calc(100vh - 96px));overflow:auto;-webkit-overflow-scrolling:touch}"+
      "#sn-me-sheet label{display:block;margin:8px 0 0;font:800 9px/1 system-ui;letter-spacing:.14em;color:#7ee9ff}"+
      "#sn-me-sheet input,#sn-me-sheet textarea{display:block;width:100%;margin:6px 0 0;padding:8px 10px;border:1px solid rgba(126,233,255,.28);background:rgba(4,16,28,.9);color:#e8fbff;border-radius:10px;font:500 14px system-ui}"+
      "#sn-me-sheet textarea{min-height:64px;resize:vertical}"+
      "#sn-me-sheet .roles{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin:10px 0 0}"+
      "#sn-me-sheet .roles button{height:44px;border-radius:12px;border:1px solid rgba(126,233,255,.45);background:rgba(4,16,28,.9);color:#7ee9ff;font:800 11px/1 system-ui;letter-spacing:.08em}"+
      "#sn-me-sheet .roles button.on{color:#02040a;background:#4df0ff;border-color:#4df0ff;box-shadow:0 0 12px #4df0ff}"+
      "#sn-me-sheet .sign{margin:8px 0 0;border:1px dashed rgba(126,233,255,.55);border-radius:12px;background:rgba(2,10,18,.9);touch-action:none}"+
      "#sn-me-sheet canvas{display:block;width:100%;height:110px}"+
      "#sn-me-sheet .icn-ttl{margin:14px 0 6px;font:800 10px/1 system-ui;letter-spacing:.16em;color:#7ee9ff}"+
      "#sn-me-sheet .contract{margin:8px 0 0;font:500 12px/1.45 system-ui;color:#c7eef7;white-space:pre-wrap}"+
      "#sn-me-sheet .promo{margin:8px 0 0;padding:8px;border:1px solid rgba(77,240,255,.45);border-radius:10px;font:700 12px/1.4 ui-monospace,monospace;color:#4df0ff;word-break:break-all}"+
      "#sn-me-sheet .row2{display:flex;gap:8px}"+
      "#sn-me-sheet .row2 button{flex:1}";
    document.head.appendChild(s);
  }
  function shopsHint(){
    try{
      var a=window.SNWork&&SNWork.all&&SNWork.all()||{};
      return (a.shops||[]).map(function(s){ return s&&s.name; }).filter(Boolean).join("\n");
    }catch(e){ return ""; }
  }
  function val(id){ var el=document.getElementById(id); return el?String(el.value||"").trim():""; }
  function grab(p){
    p.name=val("sn-p-name")||p.name;
    p.email=val("sn-p-email")||p.email;
    p.phone=val("sn-p-phone")||p.phone;
    p.address=val("sn-p-address")||p.address;
    p.base=val("sn-p-base")||p.base;
    p.shops=val("sn-p-shops")||p.shops;
    var c=document.getElementById("sn-p-sign");
    if(c && c.__dirty) p.sign=c.toDataURL("image/png");
    return p;
  }
  function missing(role, p){
    var need=["name","email","phone"];
    if(!p.sign) return "Sign the agreement with your finger.";
    if(role==="client") need.push("address");
    if(role==="driver") need.push("base");
    if(role==="vendor") need.push("shops");
    for(var i=0;i<need.length;i++){
      if(!String(p[need[i]]||"").trim()) return "Fill "+need[i]+" first.";
    }
    return "";
  }
  function CONTRACT(p){
    var who=p.referredBy?("Agent "+agentName(p.referredBy)+" brought you. Their unique code is "+p.referredBy+". Out of SpaceNet's 3%, they earn 1% for life. Astranov keeps 2%."):"SpaceNet takes 3% of each transaction. Astranov holds that 3% unless an agent brought you.";
    return "ASTRANOV SPACENET AGREEMENT\nI am a real person. This profile is mine and true.\nI activate only roles I will perform: client, vendor, delivery driver, agent.\n"+who+"\nAn agent code is unique. It carries ASTRANOV and the agent's name. I sign with my finger on this screen.";
  }
  function iconGrid(){
    var cur=(window.SNYou&&SNYou.get&&SNYou.get())||readLS("sn:you-icon","🛵");
    var list=(window.SNYou&&SNYou.list&&SNYou.list())||["🛵","🏍️","🚲","🚗","🚚","😊"];
    return list.map(function(ch){ return '<b data-act="icon" data-icon="'+ch+'" class="'+(ch===cur?"on":"")+'">'+ch+"</b>"; }).join("");
  }
  function paint(body){
    if(!body) return;
    css();
    var p=load();
    var u=window.SNAuth&&SNAuth.user&&SNAuth.user();
    var inNow=!!(u&&u.email);
    var name=p.name||(inNow?(u.name||u.email):"Guest");
    var face= (u&&u.photo) ? '<img alt="" src="'+String(u.photo).replace(/"/g,"")+'">' : '<span class="ph">'+String(name).charAt(0).toUpperCase()+"</span>";
    var roles=p.roles||{};
    var shops=p.shops||shopsHint();
    body.innerHTML=
      '<div class="who '+(inNow?"in":"out")+'">'+face+"<div><b>"+esc(name)+"</b><span>"+(inNow?"IN · "+esc(u.email):"OUT")+"</span></div></div>"+
      (inNow?'<button type="button" class="go" data-act="out">SIGN OUT</button>':'<button type="button" class="go" data-act="google">GOOGLE</button>')+
      '<div class="icn-ttl">DETAILS</div>'+
      "<label>NAME</label><input id=\"sn-p-name\" value=\""+esc(p.name)+"\" placeholder=\"Your name\">"+
      "<label>EMAIL</label><input id=\"sn-p-email\" value=\""+esc(p.email|| (u&&u.email)||"")+"\" placeholder=\"you@email\" inputmode=\"email\">"+
      "<label>PHONE</label><input id=\"sn-p-phone\" value=\""+esc(p.phone)+"\" placeholder=\"Phone (unverified)\" inputmode=\"tel\">"+
      "<label>DELIVERY ADDRESS</label><textarea id=\"sn-p-address\" placeholder=\"Door, floor, bell\">"+esc(p.address)+"</textarea>"+
      "<label>DRIVER BASE</label><textarea id=\"sn-p-base\" placeholder=\"Where your vehicle lives\">"+esc(p.base)+"</textarea>"+
      '<button type="button" class="go" data-act="use-gps">USE MY GPS AS BASE</button>'+
      "<label>SHOPS I OWN</label><textarea id=\"sn-p-shops\" placeholder=\"One shop per line\">"+esc(shops)+"</textarea>"+
      (p.referredBy?'<p class="note">Brought by agent '+esc(agentName(p.referredBy))+" · "+esc(p.referredBy)+"</p>":
        "<label>AGENT CODE</label><input id=\"sn-p-ref\" value=\"\" placeholder=\"ASTRANOV-NAME-XXXX\">")+
      '<button type="button" class="go" data-act="save">SAVE DETAILS</button>'+
      '<div class="icn-ttl">MAP ICON</div><div class="icons">'+iconGrid()+"</div>"+
      '<div class="icn-ttl">AGREEMENT</div><p class="contract">'+esc(CONTRACT(p))+"</p>"+
      '<canvas id="sn-p-sign" class="sign" width="640" height="220"></canvas>'+
      '<div class="row2"><button type="button" class="go" data-act="sign-clear">CLEAR SIGN</button><button type="button" class="go" data-act="sign-keep">LOCK SIGN</button></div>'+
      (p.sign?'<p class="note">Signed. Activate a role.</p>':'<p class="note">Sign with your finger, then lock it.</p>')+
      '<div class="icn-ttl">ROLES</div><div class="roles">'+
        roleBtn("client","CLIENT",roles.client)+
        roleBtn("vendor","VENDOR",roles.vendor)+
        roleBtn("driver","DRIVER",roles.driver)+
        roleBtn("agent","AGENT",roles.agent)+
      "</div>"+
      (roles.agent?agentBox(p):"")+
      '<p class="note">Roles turn on only after details + finger sign. Agent earns 1% for life out of the 3% from people who join with their code.</p>';
    bindSign(document.getElementById("sn-p-sign"), p);
    if(p.sign) drawSaved(document.getElementById("sn-p-sign"), p.sign);
  }
  function roleBtn(id,label,on){
    return '<button type="button" class="'+(on?"on":"")+'" data-act="role" data-role="'+id+'">'+(on?"ON · ":"")+label+"</button>";
  }
  function agentBox(p){
    var code=p.promo||"";
    var link=location.origin+"/?a="+encodeURIComponent(code);
    return '<div class="icn-ttl">YOUR AGENT CODE</div><div class="promo">'+esc(code)+"</div>"+
      '<p class="note">Share this. ASTRANOV + your name. Unique. 1% for life.</p>'+
      '<div class="promo">'+esc(link)+"</div>"+
      '<button type="button" class="go" data-act="copy-promo">COPY LINK</button>'+
      '<p class="note">Lifetime 1% on this book: AV€ '+Number(p.agentAvc||0).toFixed(2)+"</p>";
  }
  function esc(s){ return String(s||"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;"); }
  function bindSign(c){
    if(!c||c.__bound) return;
    c.__bound=true;
    var ctx=c.getContext("2d");
    ctx.strokeStyle="#4df0ff"; ctx.lineWidth=3; ctx.lineCap="round"; ctx.lineJoin="round";
    var last=null;
    function pos(e){
      var r=c.getBoundingClientRect();
      var t=(e.touches&&e.touches[0])||e;
      return {x:(t.clientX-r.left)*(c.width/r.width), y:(t.clientY-r.top)*(c.height/r.height)};
    }
    function down(e){ e.preventDefault(); last=pos(e); c.__dirty=true; }
    function move(e){
      if(!last) return;
      e.preventDefault();
      var p=pos(e);
      ctx.beginPath(); ctx.moveTo(last.x,last.y); ctx.lineTo(p.x,p.y); ctx.stroke();
      last=p; c.__dirty=true;
    }
    function up(){ last=null; }
    c.addEventListener("pointerdown", down);
    c.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    c.addEventListener("touchstart", down,{passive:false});
    c.addEventListener("touchmove", move,{passive:false});
    c.addEventListener("touchend", up);
  }
  function drawSaved(c, url){
    if(!c||!url) return;
    var img=new Image();
    img.onload=function(){ c.getContext("2d").drawImage(img,0,0,c.width,c.height); };
    img.src=url;
  }
  function clearSign(){
    var c=document.getElementById("sn-p-sign");
    if(!c) return;
    c.getContext("2d").clearRect(0,0,c.width,c.height);
    c.__dirty=false;
    var p=load(); p.sign=""; p.signedAt=0; save(p);
  }
  function lockSign(){
    var c=document.getElementById("sn-p-sign");
    var p=grab(load());
    if(!c) return;
    var blank=false;
    try{
      var ctx=c.getContext("2d"), d=ctx.getImageData(0,0,c.width,c.height).data, i, n=0;
      for(i=3;i<d.length;i+=4){ if(d[i]>20) n++; }
      blank=n<40;
    }catch(e){ blank=!c.__dirty && !p.sign; }
    if(blank){ talk("Sign with your finger first."); return; }
    p.sign=c.toDataURL("image/png");
    p.signedAt=Date.now();
    save(p);
    talk("Signed. You can activate a role.");
    var body=document.getElementById("sn-me-body");
    if(body) paint(body);
  }
  function saveDetails(){
    var p=grab(load());
    var ref=val("sn-p-ref");
    if(ref && /^ASTRANOV-[A-Z0-9-]+$/i.test(ref)) p.referredBy=ref.toUpperCase();
    save(p);
    if(window.SNAuth&&SNAuth.savePhone) SNAuth.savePhone(p.phone);
    talk("Details saved.");
  }
  function useGps(){
    var p=grab(load());
    var here=null;
    try{ here=window.SN&&null; }catch(e){}
    navigator.geolocation.getCurrentPosition(function(pos){
      p.base=pos.coords.latitude.toFixed(5)+", "+pos.coords.longitude.toFixed(5);
      save(p);
      var el=document.getElementById("sn-p-base");
      if(el) el.value=p.base;
      talk("Driver base set from GPS.");
    }, function(){ talk("GPS did not answer. Type the base."); }, {enableHighAccuracy:true,timeout:8000,maximumAge:10000});
  }
  function toggleRole(role){
    var p=grab(load());
    if(p.roles[role]){ p.roles[role]=false; save(p); talk(role+" off."); paint(document.getElementById("sn-me-body")); return; }
    var miss=missing(role,p);
    if(miss){ talk(miss); return; }
    if(role==="agent" && !p.promo) p.promo=makePromo(p.name);
    p.roles[role]=true;
    save(p);
    if(role==="agent") talk("Agent on. Your code is "+p.promo+". 1% for life from people who join with it.");
    else talk(role+" on.");
    paint(document.getElementById("sn-me-body"));
  }
  function copyPromo(){
    var p=load();
    var link=location.origin+"/?a="+encodeURIComponent(p.promo||"");
    if(navigator.clipboard&&navigator.clipboard.writeText) navigator.clipboard.writeText(link).catch(function(){});
    talk("Link copied. "+p.promo);
  }
  function onAct(act, el){
    if(act==="save"){ saveDetails(); return true; }
    if(act==="sign-clear"){ clearSign(); return true; }
    if(act==="sign-keep"){ lockSign(); return true; }
    if(act==="use-gps"){ useGps(); return true; }
    if(act==="role"){ toggleRole(el.getAttribute("data-role")); return true; }
    if(act==="copy-promo"){ copyPromo(); return true; }
    return false;
  }
  function bindSheet(){
    var sh=document.getElementById("sn-me-sheet");
    if(!sh||sh.__snProf) return;
    sh.__snProf=true;
    sh.addEventListener("click", function(e){
      var b=e.target.closest("[data-act]");
      if(!b) return;
      onAct(b.getAttribute("data-act"), b);
    });
  }
  function captureCode(){
    try{
      var q=new URLSearchParams(location.search);
      var a=(q.get("a")||q.get("code")||q.get("promo")||"").toUpperCase();
      if(/^ASTRANOV-[A-Z0-9-]+$/.test(a)){
        var p=load();
        if(p.referredBy!==a){
          p.referredBy=a;
          save(p);
          talk("Agent "+agentName(a)+" is on this account. They earn 1% for life out of the 3%.");
        }
      }
    }catch(e){}
  }
  function splitFee(){
    if(window.__snFeeWatch) return;
    window.__snFeeWatch=true;
    var last=Number(readLS("sn:platform","0")||0);
    setInterval(function(){
      var now=Number(readLS("sn:platform","0")||0);
      if(now>last+0.0001){
        var delta=Math.round((now-last)*100)/100;
        last=now;
        var p=load();
        if(!p.referredBy) return;
        var cut=Math.round(delta/3*100)/100;
        if(cut<=0) return;
        var plat=Math.max(0, Math.round((Number(readLS("sn:platform","0"))-cut)*100)/100);
        writeLS("sn:platform", String(plat));
        last=plat;
        var hold={};
        try{ hold=JSON.parse(readLS("sn:agent-hold","{}")||"{}"); }catch(e){ hold={}; }
        hold[p.referredBy]=Math.round(((hold[p.referredBy]||0)+cut)*100)/100;
        writeLS("sn:agent-hold", JSON.stringify(hold));
        if(p.promo && p.promo===p.referredBy){
          p.agentAvc=Math.round(((p.agentAvc||0)+cut)*100)/100;
          save(p);
        }
      } else last=now;
    }, 600);
  }
  function hook(){
    captureCode();
    splitFee();
    if(window.SNAuth && !SNAuth.__prof){
      SNAuth.__prof=true;
      var fill=null;
      var open=SNAuth.open;
      SNAuth.open=function(){
        open();
        var body=document.getElementById("sn-me-body");
        paint(body);
        bindSheet();
      };
    }
    bindSheet();
  }
  window.SNProfile={paint:paint,load:load,save:save,hook:hook};
  if(document.readyState==="loading") document.addEventListener("DOMContentLoaded", hook);
  else hook();
  setInterval(hook, 1500);
})();
