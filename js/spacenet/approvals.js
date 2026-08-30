/* SpaceNet approvals 4086 — owner-only TASK cards. Guests never see these. */
(function(){
  var OWNER={"notisastranov@gmail.com":1};
  function read(k,d){ try{ var v=localStorage.getItem(k); return v==null?d:v; }catch(e){ return d; } }
  function write(k,v){ try{ localStorage.setItem(k, typeof v==="string"?v:JSON.stringify(v)); }catch(e){} }
  function talk(s){ if(window.SN&&SN.say) SN.say(s); else { var el=document.getElementById("line"); if(el) el.textContent=s; } }
  function user(){ try{ return JSON.parse(read("sn:user","null")||"null"); }catch(e){ return null; } }
  function email(){ var u=user(); return String((u&&u.email)||"").toLowerCase(); }
  function owner(){
    var e=email();
    if(OWNER[e]) return true;
    try{ var extra=JSON.parse(read("sn:architect","[]")); if(extra.indexOf(e)>=0) return true; }catch(x){}
    return false;
  }
  function doneMap(){ try{ return JSON.parse(read("sn:approvals-done","{}")||"{}"); }catch(e){ return {}; } }
  function markDone(id, how){
    var d=doneMap(); d[id]=how||"done"; write("sn:approvals-done", d);
  }
  var remote=[];
  var local=[];
  function all(){
    var seen={}, out=[], d=doneMap();
    function add(x){
      if(!x||!x.id||seen[x.id]||d[x.id]) return;
      seen[x.id]=1; out.push(x);
    }
    local.forEach(add); remote.forEach(add);
    return out;
  }
  function esc(s){ return String(s==null?"":s).replace(/&/g,"&#38;").replace(/</g,"&#60;").replace(/>/g,"&#62;"); }
  function cardHtml(it){
    return '<div class="task open" data-ask="'+esc(it.id)+'">'+ 
      '<b>'+esc(it.title||"Approval")+'</b>'+ 
      '<span>'+esc(it.body||it.what||"Needs your yes before it is built.")+'</span>'+ 
      '<div class="row">'+ 
        '<button type="button" data-act="yes" data-id="'+esc(it.id)+'">APPROVE</button>'+ 
        '<button type="button" data-act="no" data-id="'+esc(it.id)+'">DECLINE</button>'+ 
      '</div></div>';
  }
  function decide(id, yes){
    markDone(id, yes?"approved":"declined");
    talk(yes?"Approved. Only that patch.":"Declined. It will not be built.");
    paint();
  }
  var painting=false;
  function paintList(){
    if(!owner()||painting) return;
    painting=true;
    var list=document.getElementById("sn-tasks-list");
    if(!list){ painting=false; return; }
    var pending=all();
    list.querySelectorAll("[data-ask]").forEach(function(n){ n.remove(); });
    if(!pending.length){ painting=false; return; }
    var wrap=document.createElement("div");
    wrap.innerHTML=pending.map(cardHtml).join("");
    while(wrap.firstChild) list.insertBefore(wrap.firstChild, list.firstChild);
    list.querySelectorAll("[data-ask]").forEach(function(card){
      if(card.__snAsk) return;
      card.__snAsk=true;
      card.addEventListener("click", function(e){
        var b=e.target&&e.target.closest&&e.target.closest("[data-act]");
        if(!b) return;
        e.preventDefault(); e.stopPropagation();
        var id=b.getAttribute("data-id");
        if(b.getAttribute("data-act")==="yes") decide(id, true);
        else decide(id, false);
      });
    });
    painting=false;
  }
  function paintBtn(){
    if(!owner()) return;
    var btn=document.getElementById("sn-tasks-btn");
    var n=all().length;
    if(!btn||!n) return;
    btn.classList.add("on","glow");
    var t=btn.textContent||"";
    if(!/ASK/.test(t) || t==="TASKS") btn.textContent=n>1?("TASKS "+n):"TASKS";
  }
  function paint(){ paintList(); paintBtn(); }
  function pull(){
    if(!owner()) return;
    fetch("/approvals.json?t="+Date.now(),{cache:"no-store"}).then(function(r){ return r.json(); }).then(function(j){
      remote=Array.isArray(j)?j:(j&&j.items)||[];
      paint();
    }).catch(function(){});
  }
  function ask(spec){
    if(!spec||!spec.id) return;
    local=local.filter(function(x){ return x.id!==spec.id; });
    local.unshift({id:spec.id, title:spec.title||"Approval", body:spec.body||spec.what||"", t:Date.now()});
    write("sn:approvals-local", local);
    paint();
    if(owner()){
      var tasks=document.getElementById("sn-tasks");
      if(tasks) tasks.classList.add("on");
      paintList();
      talk("Approval on TASKS. "+(spec.title||""));
    }
  }
  try{ local=JSON.parse(read("sn:approvals-local","[]")||"[]"); }catch(e){ local=[]; }
  var tasks=document.getElementById("sn-tasks");
  if(tasks && !tasks.__snAsk){
    tasks.__snAsk=true;
    new MutationObserver(function(){ if(owner() && tasks.classList.contains("on")) paintList(); }).observe(tasks,{attributes:true,childList:true,subtree:true,attributeFilter:["class"]});
  }
  setInterval(function(){ if(owner()){ paintBtn(); } }, 2000);
  setInterval(function(){ if(owner()) pull(); }, 20000);
  if(owner()){ pull(); paint(); }
  window.SNAsk={ask:ask, pending:all, paint:paint};
})();
