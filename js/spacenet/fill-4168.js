(function(){
  if(window.__SN_FILL_4168_BOOT) return;
  window.__SN_FILL_4168_BOOT=true;
  var n=3, parts=[], left=n;
  function go(){
    if(left) return;
    try{ (0,eval)(parts.join("")); }catch(e){ console.warn("fill-4168",e); }
  }
  for(var i=0;i<n;i++)(function(i){
    fetch("/js/spacenet/fill-4168.p"+i+".js?v=4168").then(function(r){return r.text()}).then(function(t){
      parts[i]=t; left--; go();
    }).catch(function(e){ console.warn(e); left--; go(); });
  })(i);
})();
