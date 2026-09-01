/* SpaceNet 4126 — listen in English. Speaking is cloud American female (voice.js). */
(function(){
  if(window.__snSpeakEn) return;
  window.__snSpeakEn=true;
  var LANG="en-US";
  function boot(){
    var SR=window.SpeechRecognition||window.webkitSpeechRecognition;
    if(SR && !SR.__snEn){
      SR.__snEn=true;
      try{
        Object.defineProperty(SR.prototype,"lang",{
          get:function(){ return LANG; },
          set:function(){},
          configurable:true
        });
      }catch(e){}
    }
  }
  if(document.readyState==="loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
  setInterval(boot, 2000);
})();
