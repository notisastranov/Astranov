/* SpaceNet voice 4088 — calm deep female. Never the default robot. */
(function(){
  if(!window.speechSynthesis || speechSynthesis.__snDeep) return;
  var synth=window.speechSynthesis;
  var orig=synth.speak.bind(synth);
  synth.__snDeep=true;
  var pick=null, pickEl=null;
  function score(v, greek){
    var n=((v&&v.name)||"")+" "+((v&&v.lang)||"")+" "+((v&&v.voiceURI)||"");
    var s=0;
    if(/male|\bman\b|david|daniel|george|thomas|fred|rbc|malayalam/i.test(n) && !/female|woman|samantha/i.test(n)) return -30;
    if(greek){ if(/^el/i.test(v.lang)) s+=14; }
    else {
      if(/^en-GB/i.test(v.lang)) s+=12;
      else if(/^en/i.test(v.lang)) s+=5;
    }
    if(/uk english female|google uk.*female|samantha|moira|fiona|karen|tessa|serena|hazel|susan|victoria|libby|sonia|aria|jenny|eva|zira/i.test(n)) s+=18;
    if(/female|woman/i.test(n)) s+=12;
    if(/network|neural|natural|premium|enhanced|wavenet|studio|online/i.test(n)) s+=14;
    if(/google/i.test(n)) s+=4;
    if(/compact/i.test(n)) s-=4;
    if(/local/i.test(n) && !/network|neural/i.test(n)) s-=1;
    return s;
  }
  function choose(text){
    var greek=/[\u0370-\u03FF]/.test(text||"");
    var list=synth.getVoices()||[], i, best=null, bestS=-1;
    for(i=0;i<list.length;i++){
      var s=score(list[i], greek);
      if(s>bestS){ bestS=s; best=list[i]; }
    }
    if(best && bestS>=0){ if(greek) pickEl=best; else pick=best; return best; }
    return greek?pickEl:pick;
  }
  function dress(u){
    var text=u&&u.text||"";
    var v=choose(text);
    if(v){ u.voice=v; u.lang=v.lang||u.lang; }
    else u.lang=/[\u0370-\u03FF]/.test(text)?"el-GR":"en-GB";
    u.pitch=0.68;
    u.rate=0.82;
    u.volume=1;
  }
  try{ synth.getVoices(); synth.addEventListener("voiceschanged", function(){ pick=null; pickEl=null; }); }catch(e){}
  synth.speak=function(u){
    if(!u) return;
    try{ dress(u); }catch(e){}
    var list=synth.getVoices()||[];
    if(list.length){ orig(u); return; }
    var sent=false;
    function go(){
      if(sent) return;
      sent=true;
      try{ dress(u); }catch(e){}
      orig(u);
    }
    try{ synth.addEventListener("voiceschanged", go); }catch(e){}
    setTimeout(go, 500);
  };
})();
