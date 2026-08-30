/* SpaceNet auth 4082 — Google via Supabase. Phone stored unverified. */
(function(){
  var SB="https://lkoatrkhuigdolnjsbie.supabase.co";
  var ANON="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxrb2F0cmtodWlnZG9sbmpzYmllIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg4ODIwOTIsImV4cCI6MjA5NDQ1ODA5Mn0.qf6Kg93YLJ0coTdVQa4baU0ppOdFY5WkmVzMvEV6ejI";
  function read(k,d){ try{ var v=localStorage.getItem(k); return v==null?d:v; }catch(e){ return d; } }
  function write(k,v){ try{ localStorage.setItem(k,v); }catch(e){} }
  function talk(s){ if(window.SN&&SN.say) SN.say(s); else { var el=document.getElementById("line"); if(el) el.textContent=s; } }
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
      return true;
    }).catch(function(){ talk("Google sign-in did not finish."); return false; });
  }
  function boot(){
    applyHash();
    fetch("/api/auth/config").then(function(r){return r.json();}).then(function(j){
      if(j&&j.architect){
        var list=[String(j.architect).toLowerCase()];
        write("sn:architect", JSON.stringify(list));
      }
    }).catch(function(){});
    var btn=document.getElementById("sn-money");
    if(btn && !btn.__snAuth){
      btn.__snAuth=true;
      btn.addEventListener("click", function(e){
        if(user()) return;
        e.preventDefault();
        e.stopPropagation();
        var cash=document.getElementById("sn-cash");
        if(cash){ cash.classList.add("on"); if(window.SNWallet) SNWallet.hookCash(); }
        else google();
      }, true);
    }
  }
  window.SNAuth={google:google,out:out,savePhone:savePhone,user:user,boot:boot};
  if(document.readyState==="loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
