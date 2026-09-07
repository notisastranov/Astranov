/* SpaceNet 4189 — unwrap nested say JSON so talk/photosynthesis shows science, not say-blobs. */
(function(){
  if(window.__SN_TALK_4189) return;
  window.__SN_TALK_4189=true;

  function scrubSay(s){
    s=String(s==null?"":s).trim();
    if(!s) return "";
    if(/^\s*\{[\s\S]*"say"\s*:/.test(s)){
      try{
        var o=JSON.parse(s);
        if(o && o.say!=null) return String(o.say).trim();
      }catch(e){}
      var m=s.match(/"say"\s*:\s*"((?:\\.|[^"\\])*)"/);
      if(m){
        try{ return JSON.parse('"'+m[1]+'"'); }catch(e){ return m[1]; }
      }
    }
    return s;
  }

  function normalizeMind(j){
    if(!j || typeof j!=="object") return j;
    try{
      var say=j.say!=null?String(j.say):"";
      var text=j.text!=null?String(j.text):"";
      say=scrubSay(say);
      if((!say || /^\s*\{/.test(say)) && text){
        var un=scrubSay(text);
        if(un && un!==text) say=un;
        else {
          try{
            var o=JSON.parse(text);
            if(o && o.say) say=String(o.say);
            if(o && o.act && !j.act) j.act=o.act;
          }catch(e){}
        }
      }
      if(say) j.say=say;
      // Prefer plain say for text so parseMind does not show JSON
      if(say && (/^\s*\{/.test(text) || /"say"\s*:/.test(text))) j.text=say;
    }catch(e){}
    return j;
  }

  function paintLine(s){
    s=scrubSay(s);
    if(!s || /^\s*\{/.test(s)) return;
    try{
      if(window.SN && typeof SN.talk==="function"){ SN.talk(s); return; }
    }catch(e){}
    try{
      if(window.SN && typeof SN.say==="function"){ SN.say(s); return; }
    }catch(e){}
    var el=document.getElementById("line");
    if(el) el.textContent=s;
  }

  var nativeFetch=window.fetch;
  window.fetch=function(url, opts){
    var u=String(url && url.url ? url.url : url || "");
    var p=nativeFetch.apply(this, arguments);
    if(!/\/api\/ai\b/.test(u)) return p;
    return p.then(function(res){
      try{
        var clone=res.clone();
        return clone.json().then(function(j){
          j=normalizeMind(j);
          var body=JSON.stringify(j);
          return new Response(body,{status:res.status,statusText:res.statusText,headers:{"Content-Type":"application/json"}});
        }).catch(function(){ return res; });
      }catch(e){ return res; }
    });
  };

  function wrapGrok(){
    if(!window.SN||!SN.grok||SN.grok.__sn4189) return;
    var orig=SN.grok.bind(SN);
    SN.grok=function(text){
      var raw=String(text||"");
      var r=orig(text);
      // After mind returns, if #line still looks like JSON, scrub it
      setTimeout(function(){
        var el=document.getElementById("line");
        if(!el) return;
        var t=String(el.textContent||"");
        if(/"say"\s*:/.test(t) || /^\s*\{/.test(t)){
          var clean=scrubSay(t);
          if(clean) el.textContent=clean;
        }
        // photosynthesis rescue: if still empty after a science ask, nudge once from last response cache
        if(/photo\s*synth/i.test(raw) && (!t || t.length<8 || /^\s*\{/.test(t))){
          // no-op if already painted; fetch path should have fixed
        }
      }, 400);
      setTimeout(function(){
        var el=document.getElementById("line");
        if(!el) return;
        var t=String(el.textContent||"");
        if(/"say"\s*:/.test(t) || /^\s*\{/.test(t)){
          var clean=scrubSay(t);
          if(clean) paintLine(clean);
        }
      }, 1200);
      return r;
    };
    SN.grok.__sn4189=true;
  }

  function scrubLineNow(){
    var el=document.getElementById("line");
    if(!el) return;
    var t=String(el.textContent||"");
    if(/"say"\s*:/.test(t) || /^\s*\{/.test(t)){
      var clean=scrubSay(t);
      if(clean && clean!==t) el.textContent=clean;
    }
  }

  wrapGrok();
  setInterval(function(){ wrapGrok(); scrubLineNow(); }, 1600);
  window.SNTalk4189={scrubSay:scrubSay,normalizeMind:normalizeMind};
})();
