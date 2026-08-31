/* SpaceNet auth 4098 — Google via the YOU pill. Phone stored unverified. */
(function(){
  var SB="https://lkoatrkhuigdolnjsbie.supabase.co";
  var ANON="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxrb2F0cmtodWlnZG9sbmpzYmllIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg4ODIwOTIsImV4cCI6MjA5NDQ1ODA5Mn0.qf6Kg93YLJ0coTdVQa4baU0ppOdFY5WkmVzMvEV6ejI";
  function read(k,d){ try{ var v=localStorage.getItem(k); return v==null?d:v; }catch(e){ return d; } }
  function write(k,v){ try{ localStorage.setItem(k,v); }catch(e){} }
  function talk(s){ if(window.SN&&SN.talk) SN.talk(s); else if(window.SN&&SN.say) SN.say(s); else { var el=document.getElementById("line"); if(el) el.textContent=s; } }
  function saveUser(u){
    if(!u) return;
    var phone=read("sn:phone","");
    var row={
      id:u.id||u.sub||"",
      email:u.email||"",
      name:(u.user_metadata&& (u.user_metadata.full_name||u.user_metadata.name))||u.name||"",
      photo:(u.user_metadata&& (u.user_metadata.avatar_url||u.user_metadata.picture))||u.picture||"",
      phone:u.phone|| (u.user_metadata&&u.user_metadata.phone) || phone || "",
      verified:false
    };
    write("sn:user", JSON.stringify(row));
    if(row.phone) write("sn:phone", row.phone);
    paintMe();
    if(window.SNWallet) SNWallet.paint();
    return row;
  }
  function user(){ try{ return JSON.parse(read("sn:user","null")||"null"); }catch(e){ return null; } }
  function token(){ return read("sn:access",""); }
  function google(){
    var dest=location.origin+"/?auth=google";
    var url=SB+"/auth/v1/authorize?provider=google&redirect_to="+encodeURIComponent(dest);
    write("sn:auth-back", location.href.split("#")[0]);
    location.href=url;
  }
  function out(){
    var t=token();
    write("sn:user","");
    write("sn:access","");
    if(t){
      fetch(SB+"/auth/v1/logout",{method:"POST",headers:{apikey:ANON,Authorization:"Bearer "+t}}).catch(function(){});
    }
    paintMe();
    if(window.SNWallet) SNWallet.paint();
    talk("Signed out. Your AV€ stays on this device.");
    if(window.SNWallet) SNWallet.hookCash();
  }
  function savePhone(raw){
    var tel=String(raw||"").replace(/[^\d+ ]/g,"").trim();
    write("sn:phone", tel);
    var u=user()||{};
    u.phone=tel; u.verified=false;
    write("sn:user", JSON.stringify(u));
    var t=token();
    if(t && tel){
      fetch(SB+"/auth/v1/user",{
        method:"PUT",
        headers:{apikey:ANON,Authorization:"Bearer "+t,"Content-Type":"application/json"},
        body:JSON.stringify({data:{phone:tel,phone_verified:false}})
      }).catch(function(){});
    }
    talk(tel?("Phone stored on your profile. Unverified until Twilio is live."):"Phone cleared.");
    paintMe();
    if(window.SNWallet) SNWallet.hookCash();
  }
  function applyHash(){
    var hash=location.hash||"";
    if(hash.charAt(0)==="#") hash=hash.slice(1);
    var q=new URLSearchParams(hash);
    var at=q.get("access_token");
    var err=q.get("error_description")||q.get("error");
    if(err){ talk("Google: "+err); history.replaceState({}, "", location.pathname+location.search); return Promise.resolve(false); }
    if(!at){
      try{
        var p=new URLSearchParams(location.search);
        if(p.get("error")){ talk("Google: "+(p.get("error_description")||p.get("error"))); }
      }catch(e){}
      return Promise.resolve(!!user());
    }
    write("sn:access", at);
    return fetch(SB+"/auth/v1/user",{headers:{apikey:ANON,Authorization:"Bearer "+at}}).then(function(r){ return r.json(); }).then(function(u){
      if(u&&u.email){ saveUser(u); talk("Signed in as "+u.email+". Wallet is yours. Starts at zero until you reload."); }
      else talk("Google returned no email.");
      history.replaceState({}, "", location.pathname+(location.search||"").replace(/auth=google&?/,"").replace(/[?&]$/,""));
      if(window.SNWallet){ SNWallet.paint(); SNWallet.hookCash(); }
      paintMe();
      return true;
    }).catch(function(){ talk("Google sign-in did not finish."); return false; });
  }
  function css(){
    if(document.getElementById("sn-me-css")) return;
    var s=document.createElement("style");
    s.id="sn-me-css";
    s.textContent=
      "#sn-me{position:fixed;left:max(10px,env(safe-area-inset-left));right:auto;bottom:calc(env(safe-area-inset-bottom) + 72px);top:auto;z-index:48;width:var(--u,36px);padding:0;border:0;background:transparent;color:#4df0ff;pointer-events:auto}"+
      "#sn-me .lbl{display:block;font:800 8px/1 system-ui;letter-spacing:.2em;text-align:center;margin:0 0 4px;text-shadow:0 0 6px #4df0ff}"+
      "#sn-me .tgt{position:relative;display:flex;align-items:center;justify-content:center;width:var(--u,36px);height:var(--u,36px);margin:0 auto;border-radius:999px;overflow:hidden;border:1.5px solid rgba(77,240,255,.95);background:rgba(4,16,28,.92);box-shadow:0 0 10px rgba(77,240,255,.4)}"+
      "#sn-me img,#sn-me .ph{width:100%;height:100%;object-fit:cover;display:flex;align-items:center;justify-content:center;font:800 11px/1 system-ui;color:#4df0ff}"+
      "#sn-me.in .tgt{box-shadow:0 0 14px rgba(77,240,255,.85)}"+
      "#sn-me-sheet{position:fixed;inset:0;z-index:72;display:none;pointer-events:none}"+
      "#sn-me-sheet.on{display:block;pointer-events:auto}"+
      "#sn-me-sheet .bg{position:absolute;inset:0;background:transparent}"+
      "#sn-me-sheet .card{position:absolute;left:50%;bottom:auto;width:min(340px,92vw);transform:translateX(-50%);padding:12px;background:rgba(4,14,28,.96);border:1px solid rgba(126,233,255,.45);border-radius:16px;box-shadow:0 12px 32px rgba(0,0,0,.45)}"+
      "#sn-me-sheet .bar{display:flex;align-items:center;gap:8px;margin:0 0 10px}"+
      "#sn-me-sheet .ttl{flex:1;font:800 11px/1 system-ui;letter-spacing:.16em;color:#7ee9ff}"+
      "#sn-me-sheet .x{height:36px;padding:0 12px;border:1px solid rgba(126,233,255,.35);background:rgba(4,16,28,.9);color:#e8fbff;border-radius:10px}"+
      "#sn-me-sheet .who{display:flex;align-items:center;gap:10px;margin:0 0 12px}"+
      "#sn-me-sheet .who img,#sn-me-sheet .who .ph{width:52px;height:52px;border-radius:99px;object-fit:cover;background:rgba(77,240,255,.12);display:flex;align-items:center;justify-content:center;color:#4df0ff;font-size:22px}"+
      "#sn-me-sheet .who b{display:block;font:650 15px/1.2 system-ui;color:#e8fbff}"+
      "#sn-me-sheet .who span{display:block;margin-top:4px;font:700 11px system-ui;letter-spacing:.14em;color:#4df0ff}"+
      "#sn-me-sheet .who.out span{color:#8ec8d8}"+
      "#sn-me-sheet button.go{display:block;width:100%;height:44px;margin:8px 0 0;border:1px solid rgba(126,233,255,.55);background:rgba(4,16,28,.9);color:#7ee9ff;font:800 13px system-ui;border-radius:12px;letter-spacing:.08em}"+
      "#sn-me-sheet input{display:block;width:100%;height:40px;margin:8px 0 0;padding:0 10px;border:1px solid rgba(126,233,255,.28);background:rgba(4,16,28,.9);color:#e8fbff;border-radius:10px;font:500 14px system-ui}"+
      "#sn-me-sheet .note{margin:8px 0 0;font:500 12px/1.35 system-ui;color:#8ec8d8}"+
      "#sn-me-sheet .card{max-height:min(72vh,calc(100vh - 110px));overflow:auto}"+
      "#sn-me-sheet .icn-ttl{margin:14px 0 6px;font:800 10px/1 system-ui;letter-spacing:.16em;color:#7ee9ff}"+
      "#sn-me-sheet .icons{display:grid;grid-template-columns:repeat(6,1fr);gap:6px;max-height:168px;overflow:auto}"+
      "#sn-me-sheet .icons b{height:40px;display:flex;align-items:center;justify-content:center;font-size:22px;border-radius:10px;border:1px solid rgba(126,233,255,.28);background:rgba(4,16,28,.9)}"+
      "#sn-me-sheet .icons b.on{border-color:#4df0ff;box-shadow:0 0 10px #4df0ff}";
    document.head.appendChild(s);
  }
  function face(u){
    if(u&&u.photo) return '<img alt="" src="'+String(u.photo).replace(/"/g,"")+'">';
    var ch=(u&&(u.name||u.email)||"?").charAt(0).toUpperCase();
    return '<span class="ph">'+ch+"</span>";
  }
  function paintMe(){
    css();
    var u=user();
    var inNow=!!(u&&u.email);
    var btn=document.getElementById("sn-me");
    if(!btn){
      btn=document.createElement("button");
      btn.type="button";
      btn.id="sn-me";
      btn.setAttribute("aria-label","Login");
      btn.innerHTML='<span class="lbl">LOGIN</span><span class="tgt"><span class="ph">IN</span></span>';
      document.body.appendChild(btn);
      btn.addEventListener("click", function(e){
        e.preventDefault();
        if(btn.dataset.skipClick==="1"){ btn.dataset.skipClick=""; return; }
        openMe();
      });
    }
    btn.className=inNow?"in":"out";
    btn.innerHTML='<span class="lbl">'+(inNow?"YOU":"LOGIN")+'</span><span class="tgt">'+(inNow?face(u):'<span class="ph">IN</span>')+"</span>";
    placeMe();
    var body=document.getElementById("sn-me-body");
    if(body && document.getElementById("sn-me-sheet") && document.getElementById("sn-me-sheet").classList.contains("on")) fillBody();
  }
  function placeMe(){
    var btn=document.getElementById("sn-me");
    if(!btn) return;
    var gps=document.getElementById("gps");
    btn.style.right="auto";
    btn.style.left="max(10px, env(safe-area-inset-left))";
    var g=gps&&gps.getBoundingClientRect();
    if(g && g.height>8 && g.top>40 && g.top<(innerHeight||800)-40){
      btn.style.top=Math.round(g.top)+"px";
      btn.style.bottom="auto";
    } else {
      btn.style.top="auto";
      btn.style.bottom="calc(env(safe-area-inset-bottom) + 72px)";
    }
    var bar=document.getElementById("f")||document.getElementById("panel")||document.getElementById("dock");
    var r=bar&&bar.getBoundingClientRect();
    var sh=document.getElementById("sn-me-sheet");
    var card=sh&&sh.querySelector(".card");
    if(card && r && r.top>80){
      var ch=card.offsetHeight||220;
      card.style.top=Math.max(8, Math.round(r.top-12-ch))+"px";
      card.style.bottom="auto";
    }
  }
  function fillBody(){
    var body=document.getElementById("sn-me-body");
    if(!body) return;
    if(window.SNProfile&&SNProfile.paint){ SNProfile.paint(body); return; }
    var u=user();
    var inNow=!!(u&&u.email);
    var name=inNow?(u.name||u.email):"Guest";
    var mail=inNow?u.email:"Not signed in";
    var tel=(u&&u.phone)||read("sn:phone","")||"";
    body.innerHTML=
      '<div class="who '+(inNow?"in":"out")+'">'+face(u)+
        "<div><b>"+String(name).replace(/[<>]/g,"")+"</b><span>"+(inNow?"IN · "+String(mail).replace(/[<>]/g,""):"OUT")+"</span></div></div>"+
      (inNow
        ?'<button type="button" class="go" data-act="out">SIGN OUT</button>'
        :'<button type="button" class="go" data-act="google">GOOGLE</button>')+
      '<input id="sn-me-phone" inputmode="tel" placeholder="Phone (unverified)" value="'+String(tel).replace(/"/g,"")+'">'+
      '<button type="button" class="go" data-act="phone">SAVE PHONE</button>'+
      '<div class="icn-ttl">MAP ICON</div><div class="icons">'+iconGrid()+'</div>'+
      '<p class="note">'+(inNow?"Signed in with Google. Phone waits for Twilio.":"Sign in with Google. Each wallet is yours. Starts at zero.")+"</p>";
  }
  function iconGrid(){
    var cur=(window.SNYou&&SNYou.get&&SNYou.get())|| (function(){ try{ return localStorage.getItem("sn:you-icon")||"🛵"; }catch(e){ return "🛵"; } })();
    var list=(window.SNYou&&SNYou.list&&SNYou.list())||["🛵","🏍️","🚲","🚴","🛴","🚗","🚕","🚙","🚐","🚚","🚛","🚌","🚶","🏃","😊","😎","🧑","👨","👩"];
    return list.map(function(ch){
      return '<b data-act="icon" data-icon="'+ch+'" class="'+(ch===cur?"on":"")+'">'+ch+"</b>";
    }).join("");
  }
  function openMe(){
    css();
    var sh=document.getElementById("sn-me-sheet");
    if(!sh){
      sh=document.createElement("div");
      sh.id="sn-me-sheet";
      sh.innerHTML='<div class="bg" data-act="x"></div><div class="card"><div class="bar"><b class="ttl">YOU</b><button type="button" class="x" data-act="x">✕</button></div><div id="sn-me-body"></div></div>';
      document.body.appendChild(sh);
      sh.addEventListener("click", function(e){
        var b=e.target.closest("[data-act]");
        var act=b&&b.getAttribute("data-act");
        if(act==="x"){ sh.classList.remove("on"); return; }
        if(act==="google"){ google(); return; }
        if(act==="out"){ out(); fillBody(); return; }
        if(act==="phone"){
          var inp=document.getElementById("sn-me-phone");
          savePhone(inp&&inp.value);
          fillBody();
          return;
        }
        if(act==="icon"){
          var ic=b.getAttribute("data-icon")||"🛵";
          try{ localStorage.setItem("sn:you-icon", ic); }catch(e){}
          if(window.SNYou&&SNYou.set) SNYou.set(ic);
          fillBody();
          talk("That's you on the map.");
        }
      });
    }
    fillBody();
    sh.classList.add("on");
  }
  function boot(){
    css();
    paintMe();
    applyHash().then(function(){ paintMe(); });
    fetch("/api/auth/config").then(function(r){return r.json();}).then(function(j){
      if(j&&j.architect){
        write("sn:architect", JSON.stringify([String(j.architect).toLowerCase()]));
      }
    }).catch(function(){});
    if(!window.__snMePlace){
      window.__snMePlace=true;
      window.addEventListener("resize", placeMe);
      if(window.visualViewport) visualViewport.addEventListener("resize", placeMe);
      setInterval(placeMe, 800);
    }
  }
  window.SNAuth={google:google,out:out,savePhone:savePhone,user:user,boot:boot,paint:paintMe,open:openMe};
  if(document.readyState==="loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
