/* SpaceNet support-gate 4085 — support only after Google + one verified PayPal. Owner always in. */
(function(){
  var OWNER={"notisastranov@gmail.com":1};
  function read(k,d){ try{ var v=localStorage.getItem(k); return v==null?d:v; }catch(e){ return d; } }
  function write(k,v){ try{ localStorage.setItem(k,String(v)); }catch(e){} }
  function talk(s){ if(window.SN&&SN.say) SN.say(s); else { var el=document.getElementById("line"); if(el) el.textContent=s; } }
  function user(){ try{ return JSON.parse(read("sn:user","null")||"null"); }catch(e){ return null; } }
  function email(){ var u=user(); return String((u&&u.email)||"").toLowerCase(); }
  function token(){ return read("sn:access",""); }
  function owner(){
    var e=email();
    if(OWNER[e]) return true;
    try{ var extra=JSON.parse(read("sn:architect","[]")); if(extra.indexOf(e)>=0) return true; }catch(x){}
    return false;
  }
  function paidLocal(){ return read("sn:paypal-paid","") === "1"; }
  function authHeaders(){
    var t=token();
    var h={"Content-Type":"application/json"};
    if(t) h.Authorization="Bearer "+t;
    return h;
  }
  var nativeFetch=window.fetch;
  window.fetch=function(url, opt){
    opt=opt||{};
    var u=String(typeof url==="string"?url:(url&&url.url)||"");
    if(/\/api\/paypal\/capture-order/.test(u) || /\/api\/support\//.test(u)){
      var t=token();
      var headers=Object.assign({}, opt.headers||{});
      if(t && !headers.Authorization && !headers.authorization) headers.Authorization="Bearer "+t;
      opt=Object.assign({}, opt, {headers:headers});
    }
    return nativeFetch.call(this, url, opt).then(function(r){
      if(/\/api\/paypal\/capture-order/.test(u)){
        r.clone().json().then(function(j){
          if(j && j.ok && String(j.status||"").toUpperCase()==="COMPLETED"){
            write("sn:paypal-paid","1");
            paint();
          }
        }).catch(function(){});
      }
      return r;
    });
  };
  var last=0;
  function paint(){
    var btn=document.getElementById("sn-support");
    if(!btn) return;
    btn.removeAttribute("href");
    btn.setAttribute("role","button");
    btn.setAttribute("aria-label","Support");
    var ok=!!user() && (owner() || paidLocal());
    if(ok) btn.classList.remove("locked");
    else btn.classList.add("locked");
  }
  function deny(need){
    if(need==="login"){
      talk("Support is for signed-in customers only. Continue with Google first.");
      if(window.SNAuth&&SNAuth.google) setTimeout(function(){ SNAuth.google(); }, 600);
      else if(window.SN&&SN.openCash) SN.openCash();
      return;
    }
    talk("Support opens after one verified PayPal payment on your account. Reload euro, then tap support.");
    if(window.SN&&SN.openCash) SN.openCash();
    else if(window.SNWallet) SNWallet.hookCash();
  }
  function openSupport(e){
    if(e){ e.preventDefault(); e.stopPropagation(); if(e.stopImmediatePropagation) e.stopImmediatePropagation(); }
    var btn=document.getElementById("sn-support");
    if(btn && btn.dataset.skipClick==="1") return;
    if(Date.now()-last<8000){ talk("Support is already opening."); return; }
    if(!user() || !token()){ deny("login"); return; }
    last=Date.now();
    talk("Checking support access…");
    nativeFetch("/api/support/open",{method:"POST",headers:authHeaders(),body:"{}"}).then(function(r){ return r.json().then(function(j){ j.http=r.status; return j; }); }).then(function(j){
      if(j && j.ok && j.url){
        write("sn:paypal-paid","1");
        paint();
        try{ var w=window.open(j.url,"_blank","noopener,noreferrer"); if(!w) location.href=j.url; }catch(x){ location.href=j.url; }
        return;
      }
      last=0;
      if(j && j.need==="login") deny("login");
      else if(j && j.need==="paypal") deny("paypal");
      else talk((j && j.error) || "Support is closed.");
    }).catch(function(){ last=0; talk("Support could not be reached."); });
  }
  function bind(){
    var btn=document.getElementById("sn-support");
    if(!btn || btn.__snGate) { paint(); return; }
    btn.__snGate=true;
    btn.addEventListener("click", openSupport, true);
    btn.addEventListener("auxclick", openSupport, true);
    paint();
  }
  function bindReport(){
    var sheet=document.getElementById("sn-sheet");
    if(!sheet || sheet.__snGate) return;
    sheet.__snGate=true;
    sheet.addEventListener("click", function(e){
      var b=e.target && e.target.closest && e.target.closest("[data-act=report]");
      if(!b) return;
      if(owner() || (user() && paidLocal())) return;
      e.preventDefault();
      e.stopPropagation();
      deny(user()?"paypal":"login");
    }, true);
  }
  var style=document.getElementById("sn-support-css");
  if(!style){
    style=document.createElement("style");
    style.id="sn-support-css";
    style.textContent="#sn-support.locked{opacity:.38;animation:none;box-shadow:none;filter:grayscale(.4)}";
    document.head.appendChild(style);
  }
  bind();
  bindReport();
  setInterval(function(){ bind(); paint(); }, 1500);
  window.SNSupport={paint:paint, open:openSupport};
})();
