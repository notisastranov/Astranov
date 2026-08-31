/* SpaceNet 4120 — Twilio SMS on the YOU profile phone field, never the bank. */
(function(){
  if(window.__snPhoneVerify) return;
  window.__snPhoneVerify=true;
  function talk(s){ if(window.SN&&SN.talk) SN.talk(s); else { var el=document.getElementById("line"); if(el) el.textContent=s; } }
  function read(k,d){ try{ var v=localStorage.getItem(k); return v==null?d:v; }catch(e){ return d; } }
  function write(k,v){ try{ localStorage.setItem(k,v); }catch(e){} }
  function phoneEl(){ return document.getElementById("sn-p-phone")||document.getElementById("sn-me-phone"); }
  function telOf(){
    var el=phoneEl();
    var raw=el?el.value:"";
    if(!raw) raw=read("sn:phone","");
    return String(raw||"").replace(/[^\d+]/g,"");
  }
  function markVerified(tel){
    write("sn:phone", tel);
    write("sn:phone-verified","1");
    try{
      var u=JSON.parse(read("sn:user","{}")||"{}");
      u.phone=tel; u.verified=true;
      write("sn:user", JSON.stringify(u));
    }catch(e){}
    if(window.SNAuth&&SNAuth.savePhone) SNAuth.savePhone(tel);
    var st=document.getElementById("sn-p-sms-st");
    if(st) st.textContent="Verified · "+tel;
  }
  function inject(){
    var ph=phoneEl();
    if(!ph) return;
    if(document.getElementById("sn-p-sms")){
      var st=document.getElementById("sn-p-sms-st");
      if(st && read("sn:phone-verified")==="1") st.textContent="Verified · "+telOf();
      return;
    }
    var box=document.createElement("div");
    box.id="sn-p-sms";
    var ok=read("sn:phone-verified")==="1";
    box.innerHTML=
      '<p id="sn-p-sms-st" class="note">'+(ok?("Verified · "+telOf()):"Unverified. We text a 6-digit code to this number.")+'</p>'+
      '<div class="row2" style="display:flex;gap:8px">'+
        '<button type="button" class="go" data-act="sms-send">SEND SMS CODE</button>'+
        '<button type="button" class="go" data-act="sms-check">VERIFY CODE</button>'+
      '</div>'+
      '<input id="sn-p-code" inputmode="numeric" maxlength="6" placeholder="6-digit code">';
    ph.parentNode.insertBefore(box, ph.nextSibling);
    var lab=ph.previousElementSibling;
    if(lab && lab.tagName==="LABEL") lab.textContent=ok?"PHONE · VERIFIED":"PHONE · SMS";
  }
  function send(){
    var tel=telOf();
    if(tel.length<8){ talk("Type a real phone first."); return; }
    write("sn:phone", tel);
    talk("Sending the text now.");
    fetch("/api/sms",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({act:"send_code",phone:tel})})
      .then(function(r){ return r.json().catch(function(){ return {}; }); })
      .then(function(j){
        if(j && (j.ok||j.sent||j.status==="sent")) talk("Code sent. Check your phone.");
        else talk((j&&(j.error||j.message))||"SMS did not send. Try again.");
      }).catch(function(){ talk("SMS could not be reached."); });
  }
  function check(){
    var tel=telOf();
    var code=String((document.getElementById("sn-p-code")||{}).value||"").replace(/\D/g,"").slice(0,6);
    if(code.length!==6){ talk("Enter the 6-digit code."); return; }
    fetch("/api/sms",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({act:"check_code",phone:tel,code:code})})
      .then(function(r){ return r.json().catch(function(){ return {}; }); })
      .then(function(j){
        if(j && (j.ok||j.verified||j.status==="verified")){ markVerified(tel); talk("Phone verified."); }
        else talk((j&&(j.error||j.message))||"Code did not match.");
      }).catch(function(){ talk("Verify could not be reached."); });
  }
  function bind(){
    var sh=document.getElementById("sn-me-sheet");
    if(!sh||sh.__snSms) return;
    sh.__snSms=true;
    sh.addEventListener("click", function(e){
      var b=e.target.closest("[data-act]");
      if(!b) return;
      var act=b.getAttribute("data-act");
      if(act==="sms-send"){ e.preventDefault(); e.stopPropagation(); send(); }
      if(act==="sms-check"){ e.preventDefault(); e.stopPropagation(); check(); }
    }, true);
  }
  function hook(){
    bind();
    if(window.SNProfile && SNProfile.paint && !SNProfile.paint.__sms){
      var orig=SNProfile.paint;
      SNProfile.paint=function(body){ orig.apply(this, arguments); inject(); bind(); };
      SNProfile.paint.__sms=true;
    }
    var sheet=document.getElementById("sn-me-sheet");
    if(sheet && sheet.classList.contains("on")) inject();
  }
  if(document.readyState==="loading") document.addEventListener("DOMContentLoaded", hook);
  else hook();
  setInterval(hook, 900);
})();
