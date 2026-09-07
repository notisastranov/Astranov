(function(){
  if(window.__SN_FILL_4188_BOOT) return;
  window.__SN_FILL_4188_BOOT=true;
  var n=3, parts=[], left=n;
  function go(){
    if(left) return;
    try{ (0,eval)(parts.join("")); }catch(e){ console.warn("fill-4188",e); }
  }
  for(var i=0;i<n;i++)(function(i){
    fetch("/js/spacenet/fill-4188.p"+i+".js?v=4188").then(function(r){return r.text()}).then(function(t){
      parts[i]=t; left--; go();
    }).catch(function(){ left--; go(); });
  })(i);
})();
