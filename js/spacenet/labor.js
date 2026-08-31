/* SpaceNet 4106 — PLUS starts an open labor task. 33 / hour + 33 fixed per special. */
(function(){
  if(window.__snLabor) return;
  window.__snLabor=true;
  var RATE=33;
  var STOCK=["High specialization","Night work","Far from base","Weekend","Heavy lifting","Kids / care"];
  function read(k,d){ try{ var v=localStorage.getItem(k); return v==null?d:v; }catch(e){ return d; } }
  function write(k,v){ try{ localStorage.setItem(k, typeof v==="string"?v:JSON.stringify(v)); }catch(e){} }
  function load(){ try{ return JSON.parse(read("sn:labor","[]")); }catch(e){ return []; } }
  function save(list){ write("sn:labor", list.slice(0,80)); }
  function esc(s){ return String(s||"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;"); }
  function euro(n){
    if(window.SNThrow&&SNThrow.euro) return SNThrow.euro(n,false);
    n=Math.round(Number(n)||0);
    var s=String(Math.abs(n)), bits=[];
    while(s.length>3){ bits.unshift(s.slice(-3)); s=s.slice(0,-3); }
    if(s) bits.unshift(s);
    return "AV€ "+bits.join(".");
  }
  function who(){
    try{ var u=JSON.parse(read("sn:user","null")); if(u&&(u.name||u.email)) return String(u.name||u.email).split("@")[0]; }catch(e){}
    return "YOU";
  }
  function css(){
    if(document.getElementById("sn-labor-css")) return;
    var s=document.createElement("style");
    s.id="sn-labor-css";
    s.textContent=
      "#sn-labor{position:fixed;inset:0;z-index:130;display:none;pointer-events:none}"+
      "#sn-labor.on{display:block;pointer-events:auto}"+
      "#sn-labor .bg{position:absolute;inset:0;background:rgba(0,8,18,.55)}"+
      "#sn-labor .card{position:absolute;left:50%;top:max(56px,env(safe-area-inset-top));transform:translateX(-50%);width:min(420px,94vw);max-height:min(78vh,calc(100vh - 110px));overflow:auto;padding:14px;background:rgba(4,14,28,.96);border:1px solid rgba(126,233,255,.5);border-radius:18px;box-shadow:0 16px 40px rgba(0,0,0,.45)}"+
      "#sn-labor .ttl{font:800 12px/1 system-ui;letter-spacing:.18em;color:#7ee9ff;margin:0 0 10px}"+
      "#sn-labor .x{position:absolute;top:10px;right:10px;width:36px;height:36px;border-radius:10px;border:1px solid rgba(126,233,255,.35);background:rgba(4,16,28,.9);color:#e8fbff}"+
      "#sn-labor label{display:block;font:800 10px/1 system-ui;letter-spacing:.14em;color:#7ee9ff;margin:10px 0 6px}"+
      "#sn-labor textarea,#sn-labor input[type=number],#sn-labor input[type=text]{width:100%;box-sizing:border-box;border-radius:12px;border:1px solid rgba(126,233,255,.35);background:rgba(2,10,20,.8);color:#e8fbff;font:600 14px/1.35 system-ui;padding:10px}"+
      "#sn-labor textarea{min-height:88px;resize:vertical}"+
      "#sn-labor .hrs{display:flex;align-items:center;gap:8px}"+
      "#sn-labor .hrs button{width:42px;height:42px;border-radius:12px;border:1px solid rgba(77,240,255,.7);background:rgba(4,20,36,.9);color:#7ee9ff;font:800 18px system-ui}"+
      "#sn-labor .hrs input{flex:1;text-align:center;font:800 18px ui-monospace,system-ui}"+
      "#sn-labor .chips{display:flex;flex-wrap:wrap;gap:6px}"+
      "#sn-labor .chip{border:1px solid rgba(77,240,255,.45);background:rgba(4,16,28,.9);color:#9be7ff;border-radius:999px;padding:8px 10px;font:700 11px/1 system-ui}"+
      "#sn-labor .chip.on{background:#4df0ff;color:#031018;border-color:#4df0ff}"+
      "#sn-labor .sum{margin:12px 0;padding:12px;border-radius:14px;border:1px solid rgba(77,240,255,.4);background:rgba(0,18,32,.6);color:#c6f6ff;font:600 13px/1.45 system-ui}"+
      "#sn-labor .sum .big{display:block;font:900 32px/1 ui-monospace,system-ui;color:#e8fbff;text-shadow:0 0 12px #4df0ff;margin-top:6px}"+
      "#sn-labor .post{width:100%;height:46px;border:0;border-radius:14px;background:#4df0ff;color:#031018;font:800 12px/1 system-ui;letter-spacing:.16em}";
    document.head.appendChild(s);
  }
  function state(){
    var box=document.getElementById("sn-labor");
    var what=box?box.querySelector("[name=what]"):null;
    var hrs=box?box.querySelector("[name=hours]"):null;
    var custom=box?box.querySelector("[name=custom]"):null;
    var extras=[];
    if(box) box.querySelectorAll(".chip.on").forEach(function(c){ extras.push(c.getAttribute("data-c")); });
    var more=(custom&&custom.value||"").trim();
    if(more) extras.push(more);
    var hours=Math.max(1, Number(hrs&&hrs.value)||1);
    var base=Math.round(hours*RATE);
    var extra=extras.length*RATE;
    return {what:(what&&what.value||"").trim(), hours:hours, extras:extras, base:base, extra:extra, price:base+extra};
  }
  function paintSum(){
    var s=state();
    var el=document.getElementById("sn-labor-sum");
    if(!el) return;
    el.innerHTML=
      s.hours+" h × "+RATE+" = "+euro(s.base)+
      "<br>"+(s.extras.length?s.extras.length+" special × "+RATE+" = "+euro(s.extra)+" <i>fixed for the whole task</i>":"No specials")+
      '<span class="big">'+euro(s.price)+"</span>";
  }
  function open(){
    css();
    var el=document.getElementById("sn-labor");
    if(!el){
      el=document.createElement("div");
      el.id="sn-labor";
      el.innerHTML=
        '<div class="bg" data-x="close"></div>'+
        '<div class="card">'+
        '<button type="button" class="x" data-x="close">✕</button>'+
        '<div class="ttl">OPEN TASK</div>'+
        "<label>What do you need</label>"+
        '<textarea name="what" placeholder="Pick up my kids from school. Shop 3 vendors for 3 hours. Apartment ready for my party."></textarea>'+
        "<label>Labor hours</label>"+
        '<div class="hrs"><button type="button" data-x="minus">−</button><input name="hours" type="number" min="1" step="1" value="1" inputmode="numeric"><button type="button" data-x="plus">+</button></div>'+
        "<label>Special conditions · +"+RATE+" each, fixed</label>"+
        '<div class="chips">'+STOCK.map(function(c){ return '<button type="button" class="chip" data-x="chip" data-c="'+esc(c)+'">'+esc(c)+"</button>"; }).join("")+"</div>"+
        '<input name="custom" type="text" placeholder="Your own special (counts as +'+RATE+')">'+
        '<div class="sum" id="sn-labor-sum"></div>'+
        '<button type="button" class="post" data-x="post">THROW TASK</button>'+
        "</div>";
      document.body.appendChild(el);
      el.addEventListener("click", function(e){
        var b=e.target.closest && e.target.closest("[data-x]");
        var x=b&&b.getAttribute("data-x");
        if(x==="close"){ el.classList.remove("on"); return; }
        if(x==="chip"){ b.classList.toggle("on"); paintSum(); return; }
        if(x==="minus"||x==="plus"){
          var inp=el.querySelector("[name=hours]");
          var n=Math.max(1, (Number(inp.value)||1)+(x==="plus"?1:-1));
          inp.value=n; paintSum(); return;
        }
        if(x==="post"){ post(); }
      });
      el.addEventListener("input", paintSum);
    }
    el.classList.add("on");
    paintSum();
    var ta=el.querySelector("[name=what]");
    if(ta) setTimeout(function(){ ta.focus(); }, 60);
  }
  function post(){
    var s=state();
    if(!s.what){
      if(window.SN&&SN.talk) SN.talk("Say what you need.");
      return;
    }
    var job={
      id:"labor-"+Date.now(),
      labor:1,
      price:s.price,
      base:s.base,
      extra:s.extra,
      hours:s.hours,
      extras:s.extras,
      what:s.what,
      vendor:"Open board",
      client:who(),
      from:"Your pin",
      to:"Any associate",
      km:0,
      t:Date.now(),
      status:"open",
      lat:(function(){ try{ var p=JSON.parse(localStorage.getItem("sn:place")||"null"); return p&&p.lat; }catch(e){ return null; } })(),
      lng:(function(){ try{ var p=JSON.parse(localStorage.getItem("sn:place")||"null"); return p&&p.lng; }catch(e){ return null; } })()
    };
    var list=load(); list.unshift(job); save(list);
    mergeTasks(job);
    document.getElementById("sn-labor").classList.remove("on");
    if(window.SNThrow&&SNThrow.throw) SNThrow.throw(job);
    else if(window.SN&&SN.talk) SN.talk("Task thrown. "+euro(job.price)+".");
  }
  function asTask(j){
    return {
      id:j.id,
      role:"client",
      title:j.what||"Open task",
      next:euro(j.price)+" · "+j.hours+" h · open board",
      status:j.status||"open",
      t:j.t||Date.now(),
      labor:1,
      price:j.price
    };
  }
  function mergeTasks(job){
    try{
      var list=JSON.parse(localStorage.getItem("sn:tasks")||"[]");
      if(job) list.unshift(asTask(job));
      load().forEach(function(j){
        if(!list.some(function(t){ return t.id===j.id; })) list.unshift(asTask(j));
      });
      localStorage.setItem("sn:tasks", JSON.stringify(list.slice(0,80)));
    }catch(e){}
    if(window.SN&&SN.syncTasks){
      /* keep labor rows after derived sync */
    }
  }
  function wrapSync(){
    if(!window.SN||!SN.syncTasks||SN.syncTasks.__labor) return;
    var orig=SN.syncTasks;
    SN.syncTasks=function(){
      orig.apply(this, arguments);
      try{
        var list=JSON.parse(localStorage.getItem("sn:tasks")||"[]");
        load().forEach(function(j){
          if(j.status==="done") return;
          if(!list.some(function(t){ return t.id===j.id; })) list.unshift(asTask(j));
        });
        localStorage.setItem("sn:tasks", JSON.stringify(list.slice(0,80)));
      }catch(e){}
    };
    SN.syncTasks.__labor=true;
  }
  function bind(){
    var plus=document.getElementById("plus");
    if(!plus||plus.__snLabor) return;
    plus.__snLabor=true;
    plus.addEventListener("click", function(e){
      e.preventDefault();
      e.stopPropagation();
      if(e.stopImmediatePropagation) e.stopImmediatePropagation();
      if(plus.dataset.skipClick==="1"){ plus.dataset.skipClick=""; return; }
      open();
    }, true);
  }
  function hook(){ css(); bind(); wrapSync(); }
  window.SNLabor={open:open, rate:RATE, load:load};
  if(document.readyState==="loading") document.addEventListener("DOMContentLoaded", hook);
  else hook();
  setInterval(hook, 1200);
})();
