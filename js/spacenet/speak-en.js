/* SpaceNet 4120 — speak English. Natural rate. Never device-robot / Greek default. */
(function(){
  if(window.__snSpeakEn) return;
  window.__snSpeakEn=true;
  var LANG="en-US";

  function bestVoice(){
    if(!window.speechSynthesis) return null;
    var list=speechSynthesis.getVoices()||[], i, best=null, bestS=-99;
    for(i=0;i<list.length;i++){
      var v=list[i], n=((v.name||"")+" "+(v.lang||"")+" "+(v.voiceURI||"")).toLowerCase();
      var s=0;
      if(!/^en/i.test(v.lang||"")) s-=40;
      if(/^en-US/i.test(v.lang)) s+=16;
      else if(/^en-GB/i.test(v.lang)) s+=10;
      else if(/^en/i.test(v.lang)) s+=8;
      if(/google us english|google english|samantha|aria|jenny|guy|davis|samantha|natural|neural|network|wavenet|online|premium/i.test(n)) s+=20;
      if(/female|woman|samantha|aria|jenny|zira|moira|karen|fiona/i.test(n)) s+=6;
      if(/compact|robot|espeak|pico|el-gr|greek/i.test(n)) s-=25;
      if(s>bestS){ bestS=s; best=v; }
    }
    return bestS>=0?best:null;
  }

  function dress(u){
    if(!u) return;
    var v=bestVoice();
    u.lang=LANG;
    if(v){ u.voice=v; u.lang=v.lang||LANG; }
    u.pitch=1;
    u.rate=1.02;
    u.volume=1;
  }

  if(window.speechSynthesis && !speechSynthesis.__snEn){
    var synth=speechSynthesis;
    var orig=synth.speak.bind(synth);
    synth.__snEn=true;
    try{ synth.getVoices(); }catch(e){}
    synth.speak=function(u){
      try{ dress(u); }catch(e){}
      orig(u);
    };
  }

  function hookListen(){
    if(window.SN && SN.listen && !SN.listen.__en){
      var L=SN.listen;
      SN.listen=function(){
        var r=L.apply(this, arguments);
        try{
          var rec=window.__snRec;
        }catch(e){}
        return r;
      };
      SN.listen.__en=true;
    }
    var SR=window.SpeechRecognition||window.webkitSpeechRecognition;
    if(SR && !SR.__snEn){
      SR.__snEn=true;
      var proto=SR.prototype;
      var desc=Object.getOwnPropertyDescriptor(proto,"lang");
      try{
        Object.defineProperty(proto,"lang",{
          get:function(){ return LANG; },
          set:function(){ },
          configurable:true
        });
      }catch(e){}
    }
  }

  function wrapTalk(){
    if(!window.SN || !SN.talk || SN.talk.__en) return;
    var t=SN.talk;
    SN.talk=function(msg){
      return t.call(this, msg);
    };
    SN.talk.__en=true;
  }

  function boot(){ hookListen(); wrapTalk(); }
  if(document.readyState==="loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
  setInterval(boot, 1200);
})();
