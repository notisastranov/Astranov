/* SpaceNet voice 4122 — calm UK female. Never IN/PK compact robot. */
(function(){
  if(!window.speechSynthesis) return;
  var synth=window.speechSynthesis;
  var orig=synth.speak.bind(synth);
  synth.__snDeep=true;
  var pick=null;
  function bad(n){
    return /en-in|en-pk|en_in|en_pk|india|indian|pakistan|urdu|hindi|bengali|tamil|telugu|malayalam|kannada|rishi|kiran|heera|neerja|compact|lele|pakistani/i.test(n);
  }
  function score(v){
    var n=((v&&v.name)||"")+" "+((v&&v.lang)||"")+" "+((v&&v.voiceURI)||"");
    if(bad(n)) return -100;
    if(/male|\bman\b|david|daniel|george|thomas|fred|rishi/i.test(n) && !/female|woman|samantha/i.test(n)) return -40;
    var s=0;
    if(/^en-GB/i.test(v.lang)) s+=20;
    else if(/^en-US/i.test(v.lang)) s+=10;
    else if(/^en/i.test(v.lang)) s+=4;
    if(/uk english female|google uk.*female|en-gb-x-.*network|samantha|moira|fiona|karen|tessa|serena|hazel|susan|victoria|libby|sonia|aria|jenny/i.test(n)) s+=24;
    if(/female|woman/i.test(n)) s+=14;
    if(/network|neural|natural|premium|enhanced|wavenet|studio|online/i.test(n)) s+=16;
    if(/google/i.test(n)) s+=6;
    if(/local/i.test(n) && !/network|neural/i.test(n)) s-=2;
    return s;
  }
  function choose(){
    if(pick && pick.voiceURI) return pick;
    var list=synth.getVoices()||[], i, best=null, bestS=-1;
    for(i=0;i<list.length;i++){
      var s=score(list[i]);
      if(s>bestS){ bestS=s; best=list[i]; }
    }
    if(best && bestS>=0) pick=best;
    return pick;
  }
  function dress(u){
    var v=choose();
    if(v){ u.voice=v; u.lang=v.lang||"en-GB"; }
    else u.lang="en-GB";
    u.pitch=0.95;
    u.rate=0.88;
    u.volume=1;
  }
  try{ synth.getVoices(); synth.addEventListener("voiceschanged", function(){ pick=null; }); }catch(e){}
  synth.speak=function(u){
    if(!u) return;
    try{ dress(u); }catch(e){}
    if((synth.getVoices()||[]).length){ orig(u); return; }
    var sent=false;
    function go(){ if(sent) return; sent=true; try{ dress(u); }catch(e){} orig(u); }
    try{ synth.addEventListener("voiceschanged", go); }catch(e){}
    setTimeout(go, 400);
  };
})();
