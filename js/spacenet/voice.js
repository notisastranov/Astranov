/* SpaceNet 4133 — one American female. Never two voices. */
(function(){
  var ANON="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxrb2F0cmtodWlnZG9sbmpzYmllIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg4ODIwOTIsImV4cCI6MjA5NDQ1ODA5Mn0.qf6Kg93YLJ0coTdVQa4baU0ppOdFY5WkmVzMvEV6ejI";
  var VOICE_URL="https://lkoatrkhuigdolnjsbie.supabase.co/functions/v1/voice";
  var player=null, lastObj="", gen=0, ctl=null, busy=false;
  function bad(n){
    return /en-in|en-pk|en_in|en_pk|india|indian|pakistan|urdu|hindi|bengali|tamil|telugu|malayalam|kannada|rishi|kiran|heera|neerja|compact|lele|pakistani|en-in-x/i.test(n);
  }
  function score(v){
    var n=((v&&v.name)||"")+" "+((v&&v.lang)||"")+" "+((v&&v.voiceURI)||"");
    if(bad(n)) return -100;
    if(/male|\bman\b|david|daniel|george|thomas|fred|guy|davis|rishi/i.test(n) && !/female|woman|samantha/i.test(n)) return -50;
    var s=0;
    if(/^en-US/i.test(v.lang)) s+=28;
    else if(/^en-GB/i.test(v.lang)) s+=2;
    else if(/^en/i.test(v.lang)) s+=1;
    else return -20;
    if(/samantha|aria|jenny|zira|google us english|en-us-x-sfg|en-us-x-tpf|en-us-neural|us english female/i.test(n)) s+=30;
    if(/female|woman/i.test(n)) s+=16;
    if(/network|neural|natural|premium|enhanced|wavenet|studio|online/i.test(n)) s+=12;
    if(/local|compact/i.test(n)) s-=8;
    return s;
  }
  function pickUS(){
    if(!window.speechSynthesis) return null;
    var list=speechSynthesis.getVoices()||[], i, best=null, bestS=-1;
    for(i=0;i<list.length;i++){
      var s=score(list[i]);
      if(s>bestS){ bestS=s; best=list[i]; }
    }
    return (best && bestS>=8) ? best : null;
  }
  function fireEnd(u){
    busy=false;
    try{ if(u && u.onend) u.onend(); }catch(e){}
    try{ if(window.SNVoice && SNVoice._end) SNVoice._end(); }catch(e){}
  }
  function stop(){
    gen++;
    busy=false;
    if(ctl){ try{ ctl.abort(); }catch(e){} ctl=null; }
    if(player){
      try{ player.onended=null; player.onerror=null; player.pause(); player.removeAttribute("src"); player.load(); }catch(e){}
      player=null;
    }
    if(lastObj){ try{ URL.revokeObjectURL(lastObj); }catch(e){} lastObj=""; }
    try{ if(origCancel) origCancel(); }catch(e){}
  }
  function fallbackUtter(u, my){
    if(my!==gen) return;
    if(!window.speechSynthesis || !u){ fireEnd(u); return; }
    var v=pickUS();
    if(v){ u.voice=v; u.lang=v.lang||"en-US"; }
    else { u.voice=null; u.lang="en-US"; }
    u.pitch=0.82; u.rate=0.84; u.volume=1;
    var prev=u.onend;
    u.onend=function(){ if(my!==gen) return; fireEnd({onend:prev}); };
    orig(u);
  }
  function playCloud(text, u, my){
    ctl=new AbortController();
    fetch(VOICE_URL,{
      method:"POST",
      headers:{"Content-Type":"application/json", apikey:ANON, Authorization:"Bearer "+ANON},
      body:JSON.stringify({text:String(text).slice(0,800), persona:"deep-american-female"}),
      signal:ctl.signal
    }).then(function(r){
      if(my!==gen) return null;
      if(!r.ok) throw new Error("tts");
      return r.blob();
    }).then(function(b){
      if(my!==gen || !b) return;
      if(player){ try{ player.pause(); }catch(e){} }
      if(lastObj){ try{ URL.revokeObjectURL(lastObj); }catch(e){} }
      lastObj=URL.createObjectURL(b);
      player=new Audio(lastObj);
      player.onended=function(){ if(my===gen) fireEnd(u); };
      player.onerror=function(){ if(my===gen) fallbackUtter(u, my); };
      return player.play();
    }).catch(function(err){
      if(my!==gen) return;
      if(err && err.name==="AbortError") return;
      fallbackUtter(u, my);
    });
  }
  if(!window.speechSynthesis) return;
  var synth=window.speechSynthesis;
  var orig=synth.speak.bind(synth);
  var origCancel=synth.cancel.bind(synth);
  synth.speak=function(u){
    if(!u) return;
    stop();
    var text=String(u.text||"").trim();
    if(!text) return;
    busy=true;
    var my=gen;
    playCloud(text, u, my);
  };
  synth.cancel=function(){ stop(); };
  window.SNVoice={stop:stop, busy:function(){ return busy; }, onend:function(fn){ this._end=fn; }};
  try{ synth.getVoices(); }catch(e){}
})();
