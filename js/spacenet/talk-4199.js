/* SpaceNet 4199 — force visible talk say (unwrap nested JSON text) */
(function(){
  if(window.__SN_TALK_4199) return;
  window.__SN_TALK_4199=true;
  function scrubSay(s){
    s=String(s==null?"":s).trim();
    if(!s) return "";
    if(s.charAt(0)==="{" && /"say"\s*:/.test(s)){
      try{ var o=JSON.parse(s); if(o&&o.say!=null) return String(o.say).trim(); }catch(e){}
      var m=s.match(/"say"\s*:\s*"((?:\\.|[^"\\])*)"/);
      if(m){ try{ return JSON.parse('"'+m[1]+'"'); }catch(e){ return m[1]; } }
    }
    return s;
  }
  function paint(s){
    s=scrubSay(s);
    if(!s || s.charAt(0)==="{") return;
    var el=document.getElementById("line");
    if(el) el.textContent=s;
    try{ if(window.SN&&typeof SN.say==="function") SN.say(s); }catch(e){}
  }
  function normalize(j){
    if(!j||typeof j!=="object") return j;
    var say=j.say!=null?String(j.say):"";
    var text=j.text!=null?String(j.text):"";
    say=scrubSay(say);
    if((!say||say.charAt(0)==="{") && text){
      var u=scrubSay(text);
      if(u&&u!==text) say=u;
      else try{ var o=JSON.parse(text); if(o&&o.say) say=String(o.say); if(o&&o.act&&!j.act) j.act=o.act; }catch(e){}
    }
    if(say){ j.say=say; if(text.charAt(0)==="{"||/"say"\s*:/.test(text)) j.text=say; }
    return j;
  }
  var nativeFetch=window.fetch;
  window.fetch=function(url, opts){
    var u=String(url&&url.url?url.url:url||"");
    var p=nativeFetch.apply(this, arguments);
    if(!/\/api\/ai\b/.test(u)) return p;
    return p.then(function(res){
      return res.clone().json().then(function(j){
        j=normalize(j);
        if(j&&j.say){
          var act=String(j.act||"talk").toLowerCase();
          if(act==="talk"||!act||act==="") paint(j.say);
        }
        return new Response(JSON.stringify(j),{status:res.status,statusText:res.statusText,headers:{"Content-Type":"application/json"}});
      }).catch(function(){ return res; });
    });
  };
  function wrapGrok(){
    if(!window.SN||!SN.grok||SN.grok.__sn4199) return;
    var orig=SN.grok.bind(SN);
    SN.grok=function(text){
      var raw=String(text||"");
      var r=orig(text);
      [300,900,1800].forEach(function(ms){
        setTimeout(function(){
          var el=document.getElementById("line");
          var t=el?String(el.textContent||""):"";
          if(/"say"\s*:/.test(t) || (t.charAt(0)==="{" )) paint(t);
        }, ms);
      });
      return r;
    };
    SN.grok.__sn4199=true;
  }
  wrapGrok();
  setInterval(function(){
    wrapGrok();
    var el=document.getElementById("line");
    if(!el) return;
    var t=String(el.textContent||"");
    if(/"say"\s*:/.test(t) || t.charAt(0)==="{") paint(t);
  }, 1200);
  window.SNTalk4199={scrubSay:scrubSay,normalize:normalize,paint:paint};
})();
