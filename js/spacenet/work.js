(function(){
  if(window.SNWork && window.SNWork.open) return;
  var KEYS={posts:"sn:posts",shops:"sn:shops",drops:"sn:drops",drivers:"sn:drivers",calls:"sn:calls"};
  var picking=null, activeCall=null, sheet=null, card=null, pickBar=null, at=null, view="home", editing=false;
  var photos={profile:"",cover:"",menu:[],shot:"",face:"",vehicle:""};
  var dishPic=null;
  var peer=null, mediaStream=null, mediaCall=null, videoEl=null;
  var netCache={shops:[],drops:[],drivers:[],posts:[]};

  function load(k){ try{ return JSON.parse(localStorage.getItem(k)||"[]")||[]; }catch(e){ return []; } }
  function save(k, list){ var cap=k===KEYS.shops?500:80; try{ localStorage.setItem(k, JSON.stringify((list||[]).slice(0,cap))); }catch(e){} if(window.SN&&SN.syncTasks) setTimeout(function(){ SN.syncTasks(); },0); }
  function talk(t){ if(window.SN&&SN.talk) SN.talk(t); else if(window.SN&&SN.say) SN.say(t); }
  function say(t){ if(window.SN&&SN.say) SN.say(t); }
  function paint(){ if(window.SN&&SN.repaint) SN.repaint(); }
  function uid(p){ return p+Date.now().toString(36)+Math.random().toString(36).slice(2,5); }
  function esc(s){ return String(s==null?"":s).replace(/[&<>"']/g,function(c){ if(c==="&") return "&"+ "amp;"; if(c==="<") return "&"+"lt;"; if(c===">") return "&"+"gt;"; if(c==='"') return "&"+"quot;"; return "&#39;"; }); }
  function km(a,b){ if(window.SN&&SN.km) return SN.km(a,b); if(!a||!b) return 0; var R=6371,dLat=((b.lat-a.lat)*Math.PI)/180,dLng=((b.lng-a.lng)*Math.PI)/180; var x=Math.sin(dLat/2)*Math.sin(dLat/2)+Math.cos((a.lat*Math.PI)/180)*Math.cos((b.lat*Math.PI)/180)*Math.sin(dLng/2)*Math.sin(dLng/2); return R*2*Math.atan2(Math.sqrt(x),Math.sqrt(1-x)); }
  function all(){
    function merge(a,b){
      var seen={}, out=[];
      (a||[]).concat(b||[]).forEach(function(r){
        if(!r||!r.id||seen[r.id]) return;
        seen[r.id]=1; out.push(r);
      });
      return out;
    }
    return {
      posts:merge(load(KEYS.posts), netCache.posts),
      shops:merge(load(KEYS.shops), netCache.shops),
      drops:merge(load(KEYS.drops), netCache.drops),
      drivers:merge(load(KEYS.drivers), netCache.drivers),
      calls:load(KEYS.calls)
    };
  }
  function publish(row){
    if(!row||!row.id) return;
    if(row.secret || row.kind==="drop") return;
    fetch("/api/space",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({row:row})}).catch(function(){});
  }
  function pull(from){
    var q="";
    if(from&&isFinite(from.lat)) q="?lat="+from.lat+"&lng="+from.lng+"&peer="+encodeURIComponent(peerId());
    else q="?peer="+encodeURIComponent(peerId());
    return fetch("/api/space"+q,{headers:{Accept:"application/json"}}).then(function(r){return r.json();}).then(function(j){
      if(!j||j.ok===false) return j;
      netCache={shops:j.shops||[],drops:[],drivers:j.drivers||[],posts:j.posts||[]};
      paint();
      if(window.SN&&SN.ingestJobs) SN.ingestJobs(j.jobs||[]);
      return j;
    }).catch(function(){ return null; });
  }
  function hit(id){
    if(!id) return;
    ["shops","drops","drivers","posts"].forEach(function(k){
      var list=load(KEYS[k]), i, changed=false;
      for(i=0;i<list.length;i++){
        if(list[i]&&list[i].id===id){ list[i].hits=(Number(list[i].hits)||0)+1; changed=true; }
      }
      if(changed) save(KEYS[k], list);
    });
  }
  function placeName(p){ if(!p) return "This place"; var n=String(p.name||p.label||"").trim(); if(!n || /^-?\d+\.\d+/.test(n) || /\d+\.\d+[NS]/.test(n)) return "This place"; return n; }
  function placeLine(p){ return String((p&&(p.raw||p.street))||"").trim(); }
  function peerId(){
    try{
      var id=localStorage.getItem("sn:peer");
      if(id && /^[a-z0-9]+$/i.test(id)) return id;
      id="sn"+Math.random().toString(36).slice(2,10)+Date.now().toString(36);
      localStorage.setItem("sn:peer", id);
      return id;
    }catch(e){ return "sn"+Date.now().toString(36); }
  }
  function isAdmin(){ try{ return localStorage.getItem("sn:admin")==="1"; }catch(e){ return false; } }
  function owns(row){
    row=row&&(row.tags||row);
    if(!row) return false;
    if(row.peer) return row.peer===peerId() || isAdmin();
    var key=row.kind==="drop"?KEYS.drops:row.kind==="driver"?KEYS.drivers:KEYS.shops;
    return load(key).some(function(x){ return x&&x.id&&row.id&&x.id===row.id; });
  }
  function canEdit(row){ return isAdmin() || owns(row); }
  function resetPhotos(){ photos={profile:"",cover:"",menu:[],shot:"",face:"",vehicle:""}; }

  function match(q, from){
    var l=String(q||"").toLowerCase().trim();
    var out=[], a=all();
    function add(list, kind, extra){
      (list||[]).forEach(function(row){
        if(!row||!isFinite(row.lat)) return;
        if(kind==="drop") return;
        if(from && km(from,row)>25) return;
        var blob=((row.name||row.label||"")+" "+(row.text||"")+" "+(row.menu||"")+" "+(row.vehicles||"")+" "+(row.carry||"")+" "+(row.routes||"")+" "+kind+" "+(extra||"")).toLowerCase();
        if(l && blob.indexOf(l)<0 && l.indexOf(kind)<0) return;
        var nm=row.name||row.label||(kind==="post"?String(row.text||"Post").slice(0,28):kind==="driver"?"Driver base":kind);
        out.push({id:row.id,name:nm,lat:row.lat,lng:row.lng,raw:"SpaceNet",tags:row,kind:kind,sn:true,phone:row.phone||"",peer:row.peer||""});
      });
    }
    add(a.shops,"shop","store menu");
    add(a.drops,"drop","delivery address home");
    add(a.drivers,"driver","delivery courier ride driver base starting point presence routes");
    add(a.posts,"post","news note");
    return out;
  }

  function arcPts(a,b){
    if(!a||!b) return [];
    var lat1=a.lat*Math.PI/180, lng1=a.lng*Math.PI/180, lat2=b.lat*Math.PI/180, lng2=b.lng*Math.PI/180;
    var d=2*Math.asin(Math.min(1,Math.sqrt(Math.pow(Math.sin((lat2-lat1)/2),2)+Math.cos(lat1)*Math.cos(lat2)*Math.pow(Math.sin((lng2-lng1)/2),2))));
    var n=24, pts=[], i;
    if(!isFinite(d) || d<1e-6) return [[a.lat,a.lng],[b.lat,b.lng]];
    for(i=0;i<=n;i++){
      var f=i/n, A=Math.sin((1-f)*d)/Math.sin(d), B=Math.sin(f*d)/Math.sin(d);
      var x=A*Math.cos(lat1)*Math.cos(lng1)+B*Math.cos(lat2)*Math.cos(lng2);
      var y=A*Math.cos(lat1)*Math.sin(lng1)+B*Math.cos(lat2)*Math.sin(lng2);
      var z=A*Math.sin(lat1)+B*Math.sin(lat2);
      pts.push([Math.atan2(z,Math.sqrt(x*x+y*y))*180/Math.PI, Math.atan2(y,x)*180/Math.PI]);
    }
    return pts;
  }

  function ensure(){
    sheet=document.getElementById("sn-sheet");
    if(!sheet){
      sheet=document.createElement("div");
      sheet.id="sn-sheet";
      document.body.appendChild(sheet);
    }
    if(!sheet.querySelector(".bg")){
      sheet.innerHTML='<div class="bg" data-act="close"></div><div class="card" role="dialog" aria-label="Place work"></div>';
    }
    card=sheet.querySelector(".card");
    if(!pickBar){
      pickBar=document.getElementById("sn-pick");
      if(!pickBar){
        pickBar=document.createElement("div");
        pickBar.id="sn-pick";
        pickBar.innerHTML='<span class="msg">Tap the other end, or search</span><button type="button" data-act="cancel-pick">CANCEL</button>';
        document.body.appendChild(pickBar);
        pickBar.addEventListener("click", function(e){
          var b=e.target.closest("[data-act]");
          if(b && b.getAttribute("data-act")==="cancel-pick") cancelPick();
        });
      }
    }
    if(!videoEl){
      videoEl=document.getElementById("sn-video");
      if(!videoEl){
        videoEl=document.createElement("div");
        videoEl.id="sn-video";
        videoEl.innerHTML='<video id="sn-remote" autoplay playsinline></video><video id="sn-local" autoplay muted playsinline></video><button type="button" class="hang" data-act="hang">END CALL</button>';
        document.body.appendChild(videoEl);
      }
      if(!videoEl.__bound){
        videoEl.__bound=true;
        videoEl.addEventListener("click", function(e){
          var b=e.target.closest("[data-act]");
          if(b && b.getAttribute("data-act")==="hang") hang();
        });
      }
    }
    if(!sheet.__bound){
      sheet.__bound=true;
      sheet.addEventListener("click", onClick);
      sheet.addEventListener("submit", onSubmit);
      sheet.addEventListener("change", onChange);
    }
  }

  function showPick(){
    ensure();
    if(pickBar){
      pickBar.classList.add("on");
      var msg=pickBar.querySelector(".msg");
      if(msg) msg.textContent="Tap the other end, or search a name";
    }
  }
  function hidePick(){ if(pickBar) pickBar.classList.remove("on"); }

  function close(){
    if(sheet) sheet.classList.remove("on");
    view="home";
    editing=false;
    resetPhotos();
    if(window.SN&&SN.repaint) SN.repaint();
  }

  function listingKind(){
    if(view==="driver") return "driver";
    if(view==="drop") return "drop";
    return "shop";
  }
  function listingOpen(){
    if(!sheet||!sheet.classList.contains("on")) return false;
    if(view==="call"||view==="calldone"||view==="post"||view==="tax"||view==="report") return false;
    if(view!=="list"&&view!=="home"&&view!=="shop"&&view!=="drop"&&view!=="driver") return false;
    if(editing) return true;
    if(at&&at.id&&(at.kind==="shop"||at.kind==="drop"||at.kind==="driver")&&!editing) return false;
    return true;
  }
  function listingAt(){
    if(!sheet||!sheet.classList.contains("on")) return null;
    if(view==="call"||view==="calldone"||view==="tax") return null;
    if(!at||!isFinite(at.lat)) return null;
    return {lat:+at.lat,lng:+at.lng,name:placeName(at),kind:listingKind(),face:photos.face,photo:photos.shot||photos.profile,vehicle:photos.vehicle,profile:photos.profile,cover:photos.cover};
  }
  function setPin(p){
    if(!sheet||!sheet.classList.contains("on")) return false;
    if(view==="call"||view==="calldone") return false;
    if(!p||!isFinite(p.lat)) return false;
    at=at||{};
    at.lat=+p.lat; at.lng=+p.lng;
    if(p.name) at.name=p.name;
    if(p.raw) at.raw=p.raw;
    var sub=card&&card.querySelector(".sub");
    if(sub) sub.textContent=placeLine(at)||"Drag the pin. That is the listing.";
    if(window.SN&&SN.repaint) SN.repaint();
    talk("Pin moved. That is the listing.");
    return true;
  }

  function open(place, which){
    ensure();
    editing=false;
    if(place && place.kind && !which){
      at={lat:place.lat,lng:place.lng,name:place.name||place.label,raw:place.raw,tags:place.tags||place,kind:place.kind,id:place.id,peer:place.peer||(place.tags&&place.tags.peer)||""};
      view=place.kind==="drop"?"drop":place.kind;
      render();
      sheet.classList.add("on");
      return;
    }
    at=place||at||{};
    view=which||"home";
    resetPhotos();
    render();
    sheet.classList.add("on");
    say(placeName(at));
    if(listingOpen()){
      talk("Tap or drag the pin on the map above. The form stays.");
      if(window.SN&&SN.repaint) SN.repaint();
    }
  }

  function rename(place){
    if(!place||!at) return;
    if(!isFinite(at.lat)||Math.abs(at.lat-place.lat)>0.0008||Math.abs(at.lng-place.lng)>0.0008) return;
    at=place;
    if(!sheet||!sheet.classList.contains("on")||!card) return;
    if(view!=="home") return;
    var ttl=card.querySelector(".ttl"), sub=card.querySelector(".sub");
    if(ttl) ttl.textContent=placeName(at);
    if(sub) sub.textContent=placeLine(at);
  }

  function onClick(e){
    var call=e.target.closest("a.sn-call");
    if(call && sheet.contains(call) && (!call.getAttribute("href") || call.getAttribute("href")==="#")){
      e.preventDefault();
      say("Getting the official phone…");
      fetch("/api/place",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({name:placeName(at),place:placeLine(at),lat:at&&at.lat,lng:at&&at.lng})})
        .then(function(r){ return r.json(); })
        .then(function(j){
          var n=j&&j.phone||"";
          if(!n){ talk("No official telephone published."); return; }
          call.href="tel:"+n.replace(/[^\d+]/g,"");
          call.textContent="CALL "+n.replace(/[^\d+ ]/g,"");
          location.href=call.href;
        })
        .catch(function(){ talk("No official telephone published."); });
      return;
    }
    var b=e.target.closest("[data-act]");
    if(!b || !sheet.contains(b)) return;
    var act=b.getAttribute("data-act");
    if(act==="close"){ close(); return; }
    if(act==="save"){
      var form=card&&card.querySelector("form[data-kind]");
      if(!form){ talk("Open List a vendor, then SAVE."); return; }
      if(form.requestSubmit) form.requestSubmit();
      else form.dispatchEvent(new Event("submit",{bubbles:true,cancelable:true}));
      return;
    }
    if(act==="home"){ view="home"; resetPhotos(); render(); return; }
    if(act==="post"||act==="call"||act==="shop"||act==="drop"||act==="driver"||act==="list"||act==="report"){
      if((act==="shop"||act==="drop"||act==="driver") && at && at.kind!==act){ at.id=""; }
      view=act; resetPhotos(); render(); if(window.SN&&SN.repaint) SN.repaint(); return;
    }
    if(act==="pick-map"){ startPick(); return; }
    if(act==="dial"){ nativeCall(b.getAttribute("data-tel")||"", false); return; }
    if(act==="video-dial"){ nativeCall(b.getAttribute("data-tel")||"", true); return; }
    if(act==="video"){ startVideo(b.getAttribute("data-peer")||"", b.getAttribute("data-tel")||""); return; }
    if(act==="order"){ close(); if(window.SN&&SN.startOrder) SN.startOrder({id:at.id,name:placeName(at),lat:at.lat,lng:at.lng,raw:"SpaceNet",tags:at.tags||at,kind:at.kind||"shop"}); else if(window.SN&&SN.selectVendor) SN.selectVendor({id:at.id,name:placeName(at),lat:at.lat,lng:at.lng,raw:"SpaceNet",tags:at.tags||at,kind:at.kind||"shop"}); return; }
    if(act==="print-books"){ try{ window.print(); }catch(e){} return; }
    if(act==="books"){ view="tax"; render(); return; }
    if(act==="remove"){ removeCurrent(); return; }
    if(act==="you"){
      close();
      if(window.SN&&SN.applyHere) SN.applyHere(at, "You're here. That's YOU.");
      else talk("Tap GPS if that failed.");
      return;
    }
    if(act==="fix"){
      close();
      if(window.SN&&SN.correctHere) SN.correctHere();
      return;
    }
    if(act==="edit-shop"||act==="edit"){
      if(!canEdit(at&&(at.tags||at))){ talk("Only the owner of this pin or a SpaceNet admin can edit."); return; }
      editing=true;
      view=at&&at.kind?at.kind:"shop";
      render();
      return;
    }
    if(act==="dish-add"){
      var grid=card&&card.querySelector("[data-menu]");
      if(grid) grid.insertAdjacentHTML("beforeend", dishEdit({}));
      return;
    }
    if(act==="dish-del"){
      var row=b.closest("[data-dish]");
      if(row&&row.parentNode) row.parentNode.removeChild(row);
      return;
    }
    if(act==="dish-pic"){
      dishPic=b.closest("[data-dish]");
      var inp=card&&card.querySelector("[data-dish-file]");
      if(inp){ inp.value=""; inp.click(); }
      return;
    }
  }

  function onSubmit(e){
    e.preventDefault();
    var form=e.target;
    if(!form || !form.getAttribute) return;
    var kind=form.getAttribute("data-kind");
    var fd=new FormData(form);
    if(kind==="post") return savePost(fd);
    if(kind==="shop") return saveShop(fd);
    if(kind==="drop") return saveDrop(fd);
    if(kind==="report") return saveReport(fd);
    if(kind==="driver") return saveDriver(fd);
    if(kind==="call") return searchDest(String(fd.get("q")||"").trim());
  }

  function onChange(e){
    var t=e.target;
    if(!t || t.type!=="file") return;
    var file=t.files&&t.files[0];
    if(!file) return;
    if(t.hasAttribute("data-dish-file")){
      compress(file, 480, function(data){
        if(!data||!dishPic) return;
        dishPic.setAttribute("data-photo", data);
        var pic=dishPic.querySelector(".pic");
        if(pic) pic.innerHTML='<img alt="" src="'+data+'">';
      });
      return;
    }
    var slot=t.getAttribute("data-slot")||"shot";
    var max=slot==="cover"?960:slot==="profile"?480:640;
    compress(file, max, function(data){
      if(!data) return;
      if(slot==="menu"){ photos.menu.push(data); photos.menu=photos.menu.slice(-4); }
      else photos[slot]=data;
      var img=t.parentNode && t.parentNode.querySelector(".thumb");
      if(img){ img.src=data; img.style.display="block"; }
      if(slot==="menu") renderMenuThumbs();
    });
  }

  function renderMenuThumbs(){
    if(!sheet) return;
    var box=sheet.querySelector(".gallery[data-slot='menu']");
    if(!box) return;
    box.innerHTML=(photos.menu||[]).map(function(src){ return '<img alt="Menu" src="'+src+'" />'; }).join("");
  }

  function compress(file, max, cb){
    try{
      var url=URL.createObjectURL(file);
      var img=new Image();
      img.onload=function(){
        var c=document.createElement("canvas");
        var r=Math.min(1, (max||640)/Math.max(img.width||1, img.height||1));
        c.width=Math.max(1, Math.round((img.width||1)*r));
        c.height=Math.max(1, Math.round((img.height||1)*r));
        c.getContext("2d").drawImage(img,0,0,c.width,c.height);
        var data="";
        try{ data=c.toDataURL("image/jpeg",0.7); }catch(err){}
        try{ URL.revokeObjectURL(url); }catch(err){}
        if(data && data.length>220000){
          try{ data=c.toDataURL("image/jpeg",0.5); }catch(err){}
        }
        cb(data);
      };
      img.onerror=function(){ cb(""); };
      img.src=url;
    }catch(err){ cb(""); }
  }

  function val(fd, k){ return String(fd.get(k)||"").trim(); }
  function fillShopForm(s){
    if(!card) return;
    s=s||at||{};
    var name=s.name||s.label||(at&&at.name)||"";
    [["name",name],["hours",s.hours],["phone",s.phone],["note",s.note],["open",s.open]].forEach(function(p){
      var el=card.querySelector('[name="'+p[0]+'"]');
      if(el&&p[1]&&!el.value) el.value=p[1];
    });
  }
  function applyFill(s){
    if(!s) return;
    var id=pendingFillId||(at&&at.kind==="shop"&&at.id)||"";
    var dishes=s.dishes||s.items||[];
    if(id){
      var list=load(KEYS.shops), i;
      for(i=0;i<list.length;i++){
        if(!list[i]||list[i].id!==id) continue;
        if(s.phone) list[i].phone=s.phone;
        if(s.hours) list[i].hours=s.hours;
        if(s.note) list[i].note=s.note;
        if(s.cover) list[i].cover=s.cover;
        if(s.profile) list[i].profile=s.profile;
        if(s.open) list[i].open=s.open;
        if(dishes.length){
          list[i].dishes=dishes.map(function(it){ return {name:it.name||it.desc,price:Number(it.price)||0,hours:it.hours||s.hours||"",stock0:it.stock||20,stock:it.stock||20,photo:it.photo||"",sample:!!it.sample}; });
          list[i].menu=list[i].dishes.map(function(d){ return d.name+" — "+d.price; }).join("\n");
        }
        publish(list[i]);
        break;
      }
      save(KEYS.shops,list);
      if(window.SN&&SN.repaint) SN.repaint();
    }
    if(card&&view==="shop"){
      if(s.phone||s.hours||s.note||s.name) fillShopForm(s);
      if(s.cover){ photos.cover=s.cover; var c=card.querySelector("[data-slot=cover]"); var img=c&&c.parentNode&&c.parentNode.querySelector("img"); if(img){ img.src=s.cover; img.style.display="block"; } }
      if(dishes.length){
        var grid=card.querySelector("[data-menu]");
        if(grid) grid.innerHTML=dishHead(true)+dishes.map(function(it){ return dishEdit({name:it.name||it.desc,price:it.price,hours:it.hours||s.hours||"",stock0:it.stock||20,stock:it.stock||20,photo:it.photo||""}); }).join("");
      }
    }
    if(s.phone||dishes.length) talk((s.name||(at&&at.name)||"Shop")+" is on SpaceNet.");
  }
  var pendingFillId="";
  function autoList(p, grokFill){
    if(!p||!isFinite(+p.lat)||!isFinite(+p.lng)) return null;
    var name=String(p.name||p.label||"").trim();
    if(!name||name==="This place") return null;
    if(p.kind==="driver"||p.kind==="drop"||p.kind==="post"||p.kind==="tax") return null;
    var list=load(KEYS.shops), i, hit=null;
    for(i=0;i<list.length;i++){
      var r=list[i];
      if(!r||!r.name) continue;
      if(String(r.name).toLowerCase()===name.toLowerCase() && Math.abs(+r.lat-+p.lat)<0.002 && Math.abs(+r.lng-+p.lng)<0.002){ hit=r; break; }
    }
    if(hit) return hit;
    var tags=p.tags||{};
    var row={id:uid("s"), kind:"shop", name:name, lat:+p.lat, lng:+p.lng, raw:p.raw||"", place:name, phone:p.phone||tags.phone||tags["contact:phone"]||"", hours:tags.opening_hours||"", peer:"spacenet", auto:1, t:Date.now(), dishes:[]};
    list.unshift(row);
    save(KEYS.shops,list);
    if(grokFill!==false) publish(row);
    if(window.SN&&SN.repaint) SN.repaint();
    pendingFillId=row.id;
    fetch("/api/place",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({name:name,place:row.raw,lat:row.lat,lng:row.lng,website:tags.website||tags["contact:website"]||""})})
      .then(function(r){ return r.json(); })
      .then(function(j){ if(j&&j.ok) applyFill(j); })
      .catch(function(){});
    if(grokFill!==false && window.SN&&SN.grokListing) SN.grokListing(row);
    return row;
  }
  function fillFromWorld(){
    if(view!=="shop"||!at) return;
    say("Filling from the public listing…");
    var payload={name:placeName(at), place:placeLine(at)||(at.raw||""), lat:at.lat, lng:at.lng, website:(at.tags&&(at.tags.website||at.tags["contact:website"]))||""};
    fetch("/api/place",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)})
      .then(function(r){ return r.json(); })
      .then(function(j){ if(j&&(j.phone||j.hours||(j.items&&j.items.length)||j.cover)) applyFill(j); })
      .catch(function(){});
    if(window.SN&&SN.grokListing) SN.grokListing(at);
  }

  function baseRow(){
    return {lat:at&&at.lat, lng:at&&at.lng, place:placeName(at), raw:placeLine(at), t:Date.now(), peer:peerId()};
  }

  function savePost(fd){
    var text=val(fd,"text");
    if(!text && !photos.shot){ talk("Write the post or add a photo."); return; }
    var row=baseRow();
    row.id=uid("p"); row.kind="post"; row.text=text; row.name=placeName(at);
    row.photo=photos.shot||"";
    var list=load(KEYS.posts); list.unshift(row); save(KEYS.posts,list);
    close(); paint(); publish(row); talk("Posted at "+placeName(at)+".");
  }

  function dishHead(edit){
    return '<div class="dish sheet head"><span>Photo</span><span>Description</span><span>AV€</span><span>Hours</span><span>Initial</span><span>Left</span>'+(edit?'<span></span>':'')+'</div>';
  }
  function dishEdit(it){
    it=it||{};
    var px=it.price!=null&&it.price!==""?it.price:"";
    var init=it.stock0!=null&&it.stock0!==""?it.stock0:(it.stock!=null&&it.stock!==""?it.stock:"");
    var left=it.stock!=null&&it.stock!==""?it.stock:init;
    return '<div class="dish sheet edit" data-dish data-photo="'+esc(it.photo||"")+'">'+
      '<button type="button" class="pic" data-act="dish-pic">'+(it.photo?'<img alt="" src="'+esc(it.photo)+'">':'<span>+</span>')+'</button>'+
      '<textarea name="dname" rows="2" placeholder="Product or service">'+esc(it.name||it.desc||"")+'</textarea>'+
      '<input name="dprice" inputmode="decimal" value="'+esc(px)+'" placeholder="0.00">'+
      '<input name="dhours" value="'+esc(it.hours||"")+'" placeholder="10–22">'+
      '<input name="dstock0" inputmode="numeric" value="'+esc(init)+'" placeholder="0">'+
      '<input name="dstock" inputmode="numeric" value="'+esc(left)+'" placeholder="0">'+
      '<button type="button" class="del" data-act="dish-del">✕</button>'+
    '</div>';
  }
  function dishShow(it){
    it=it||{};
    var init=it.stock0!=null?it.stock0:it.stock;
    var left=it.stock!=null?it.stock:init;
    return '<div class="dish sheet"><img alt="" src="'+esc(it.photo||"")+'"><b>'+esc(it.name||it.desc||"")+'</b><span class="px">'+Number(it.price||0).toFixed(2)+'</span><span class="hrs">'+esc(it.hours||"—")+'</span><span class="st">'+esc(init==null?"":init)+'</span><span class="st">'+esc(left==null?"":left)+'</span></div>';
  }
  function seedDishes(){
    var s=(at&&(at.tags||at))||{};
    var list=s.dishes||[];
    if(!list.length) list=[{name:"",price:"",hours:"",stock0:"",stock:"",photo:""}];
    return dishHead(true)+list.map(dishEdit).join("");
  }
  function readDishCards(){
    var out=[];
    if(!card) return out;
    card.querySelectorAll("[data-dish]").forEach(function(el){
      var name=String((el.querySelector("[name=dname]")||{}).value||"").trim();
      var price=Number(String((el.querySelector("[name=dprice]")||{}).value||"").replace(",","."));
      var hours=String((el.querySelector("[name=dhours]")||{}).value||"").trim();
      var stock0=Number((el.querySelector("[name=dstock0]")||{}).value||0);
      var stock=Number((el.querySelector("[name=dstock]")||{}).value);
      var photo=el.getAttribute("data-photo")||"";
      if(!name||!(price>0)) return;
      if(!isFinite(stock)) stock=stock0;
      if(!isFinite(stock0)) stock0=stock;
      out.push({name:name,desc:name,price:price,hours:hours,stock0:stock0,stock:stock,photo:photo,sample:false});
    });
    return out;
  }
  function takeStock(shopId, cart){
    if(!shopId||!cart||!cart.length) return;
    var list=load(KEYS.shops), i, changed=false;
    for(i=0;i<list.length;i++){
      var s=list[i];
      if(!s||s.id!==shopId||!s.dishes) continue;
      cart.forEach(function(c){
        s.dishes.forEach(function(d){
          if(!d||d.name!==c.name) return;
          d.stock=Math.max(0, Number(d.stock||0)-(Number(c.qty)||1));
          changed=true;
        });
      });
      if(changed) publish(s);
    }
    if(changed) save(KEYS.shops,list);
  }

  function saveShop(fd){
    var name=val(fd,"name");
    if(!name){ talk("Name the shop."); return; }
    if(at&&at.id&&at.kind==="shop"&&!canEdit(at.tags||at)){ talk("Only the owner or a SpaceNet admin can edit this pin."); return; }
    var dishes=readDishCards();
    var row=baseRow();
    if(at&&at.id&&at.kind==="shop") row.id=at.id; else row.id=uid("s");
    row.kind="shop"; row.name=name;
    row.dishes=dishes;
    row.menu=dishes.map(function(d){ return d.name+" — "+d.price+" — "+d.stock; }).join("\n");
    row.menuPhotos=dishes.map(function(d){ return d.photo; }).filter(Boolean);
    row.hours=val(fd,"hours");
    row.open=val(fd,"open"); row.phone=val(fd,"phone");
    row.note=val(fd,"note");
    row.cover=photos.cover||(at&&(at.cover||(at.tags&&at.tags.cover)))||"";
    row.profile=photos.profile||(at&&(at.profile||(at.tags&&at.tags.profile)))||"";
    var list=load(KEYS.shops);
    var i, found=false;
    for(i=0;i<list.length;i++) if(list[i]&&list[i].id===row.id){ list[i]=row; found=true; break; }
    if(!found) list.unshift(row);
    save(KEYS.shops,list);
    close(); paint(); publish(row);
    talk(dishes.length?(name+" is listed. Clients see this spreadsheet."):(name+" is listed on SpaceNet. Add products on the spreadsheet when you have them."));
  }

  function saveDrop(fd){
    var row=baseRow();
    row.id=uid("d"); row.kind="drop";
    row.label=val(fd,"label")||placeName(at);
    row.name=row.label;
    row.street=val(fd,"street"); row.number=val(fd,"number");
    row.floor=val(fd,"floor"); row.phone=val(fd,"phone");
    row.bell=val(fd,"bell"); row.bellName=val(fd,"bellName");
    row.dropOut=val(fd,"dropOut");
    row.pref=val(fd,"pref"); row.photo=photos.shot||"";
    row.secret=true;
    if(!row.street && !row.number && !row.phone && !row.photo){ talk("Add a street, number, phone, or entrance photo."); return; }
    var list=load(KEYS.drops); list.unshift(row); save(KEYS.drops,list);
    close(); paint(); talk("Secret drop listed. Only the Astranov agent who takes your task sees it. Not the shop. Not the public map.");
  }

  function saveReport(fd){
    var row=baseRow();
    row.id=uid("p"); row.kind="post"; row.report=true;
    row.text=val(fd,"text");
    row.photo=photos.shot||"";
    if(!row.text && !row.photo){ talk("Write what is wrong, or add a photo."); return; }
    var list=load(KEYS.posts); list.unshift(row); save(KEYS.posts,list);
    close(); paint(); publish(row); talk("Report posted on SpaceNet at this pin.");
  }

  function saveDriver(fd){
    var row=baseRow();
    row.id=uid("r"); row.kind="driver";
    row.name=val(fd,"name")||"Driver base";
    row.presence=val(fd,"presence")||"present";
    row.routes=val(fd,"routes");
    row.dest=val(fd,"dest");
    row.vehicles=val(fd,"vehicles"); row.hours=val(fd,"hours");
    row.range=val(fd,"range"); row.carry=val(fd,"carry");
    row.pref=val(fd,"pref"); row.phone=val(fd,"phone");
    row.langMain=val(fd,"langMain")||"el";
    row.langAlt=val(fd,"langAlt")||"en";
    row.face=photos.face||"";
    row.vehicle=photos.vehicle||"";
    row.photo=photos.face||photos.shot||photos.vehicle||"";
    if(!row.vehicles && !row.hours && !row.routes){ talk("Add a vehicle, a working time, or the routes you work."); return; }
    var list=load(KEYS.drivers); list.unshift(row); save(KEYS.drivers,list);
    close(); paint(); publish(row); talk("Driver base listed. Starting point, trips, range, schedule. Jobs pay 1 AV€ per km plus extras.");
  }

  function taxOffice(){
    return {id:"tax-rodos", kind:"tax", name:"ΔΟΥ Ρόδου", lat:36.43114, lng:28.23609, raw:"G. Mavrou 2, Zephyros, 851 00 Rhodes", phone:"+302241363305", email:"doy.rodou@aade.gr"};
  }
  function monthKey(t){ var d=new Date(t||Date.now()); return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0"); }
  function monthLabel(k){ var p=String(k||monthKey()).split("-"); var names="Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec".split(" "); return (names[Number(p[1])-1]||p[1])+" "+p[0]; }
  function loadEscrow(){ try{ return JSON.parse(localStorage.getItem("sn:escrow")||"[]")||[]; }catch(e){ return []; } }
  function booksOf(month){
    month=month||monthKey();
    var jobs=loadEscrow().filter(function(e){ return e && monthKey(e.at)===month && Number(e.avc)>0; });
    var shop={}, drv={}, cli={};
    jobs.forEach(function(e){
      var line={id:e.id, at:e.at, query:e.query||e.name||"job", avc:Number(e.avc)||0, goods:Number(e.goods)||0, ride:Number(e.ride)||0, status:e.status};
      var sn=(e.shop&&e.shop.name)||"Shop";
      var dn=(e.driver&&e.driver.name)||"Agent";
      (shop[sn]=shop[sn]||[]).push(line);
      (drv[dn]=drv[dn]||[]).push(line);
      (cli["You"]=cli["You"]||[]).push(line);
    });
    return {month:month, shop:shop, driver:drv, client:cli};
  }
  function booksHtml(){
    var b=booksOf();
    function block(title, groups, empty){
      var names=Object.keys(groups);
      if(!names.length) return '<p class="note">'+esc(empty)+"</p>";
      return names.map(function(n){
        var lines=groups[n], sum=0;
        var rows=lines.map(function(l){ sum+=l.avc; var d=new Date(l.at); return '<div class="inv">'+(d.getDate())+" · "+esc(l.query)+" · AV€ "+l.avc.toFixed(2)+"</div>"; }).join("");
        return "<h4>"+esc(title)+" · "+esc(n)+"</h4>"+rows+"<b>Total AV€ "+sum.toFixed(2)+"</b>";
      }).join("");
    }
    return '<div class="books"><p class="note">Astranov SpaceNet issues these monthly. Filed at ΔΟΥ Ρόδου, G. Mavrou 2, Zephyros. Phone 22413 63305.</p>'+
      block("INVOICE shop", b.shop, "No shop invoices this month.")+
      block("INVOICE driver", b.driver, "No driver invoices this month.")+
      block("RECEIPT client", b.client, "No client receipts this month.")+
      '<button type="button" class="go" data-act="print-books">PRINT FOR ΔΟΥ</button></div>';
  }
  function flagOf(code){
    var m={el:"🇬🇷",en:"🇬🇧",de:"🇩🇪",fr:"🇫🇷",it:"🇮🇹",tr:"🇹🇷",ru:"🇷🇺",ar:"🇸🇦",es:"🇪🇸",nl:"🇳🇱"};
    return m[String(code||"").toLowerCase()]||"";
  }
  function removeCurrent(){
    if(!at||!at.id||!at.kind) return;
    if(!canEdit(at.tags||at)){ talk("Only the owner of this pin or a SpaceNet admin can remove it."); return; }
    var key=KEYS[at.kind==="drop"?"drops":at.kind==="driver"?"drivers":at.kind==="shop"?"shops":"posts"];
    save(key, load(key).filter(function(r){ return r.id!==at.id; }));
    close(); paint(); talk("Removed.");
  }

  function startPick(){
    if(!at) return;
    picking={kind:"call", from:{lat:at.lat,lng:at.lng,name:placeName(at),raw:placeLine(at),tags:at.tags||{},peer:at.peer||peerId()}};
    close();
    showPick();
    say("Tap the other end, or search a name.");
  }

  function cancelPick(){
    picking=null;
    hidePick();
    say("Call cancelled.");
  }

  function takePoint(p){
    if(!picking || !p || !isFinite(p.lat)) return false;
    var from=picking.from;
    picking=null;
    hidePick();
    resolveName(p, function(dest){ connect(from, dest); });
    return true;
  }

  function resolveName(p, cb){
    if(p && p.name && p.name!=="This place"){ cb(p); return; }
    if(window.SN && SN.nameAim){
      SN.nameAim(p).then(function(n){ cb(n||p); }).catch(function(){ cb(p); });
      return;
    }
    var url="https://photon.komoot.io/reverse?lat="+p.lat+"&lon="+p.lng;
    fetch(url,{headers:{Accept:"application/json"}}).then(function(r){return r.json();}).then(function(j){
      var f=j&&j.features&&j.features[0], pr=f&&f.properties||{};
      p.name=pr.name||pr.street||pr.city||pr.locality||"This place";
      p.tags=pr; p.raw=[pr.street,pr.city||pr.locality].filter(Boolean).join(", ");
      cb(p);
    }).catch(function(){ p.name=p.name||"This place"; cb(p); });
  }

  function searchDest(q){
    if(!q){ talk("Name who or where."); return; }
    if(!picking){
      picking={kind:"call", from:{lat:at&&at.lat,lng:at&&at.lng,name:placeName(at),raw:placeLine(at),tags:(at&&at.tags)||{},peer:(at&&at.peer)||peerId()}};
    }
    say("Finding "+q+"…");
    var from=picking.from;
    var hits=match(q, from);
    if(hits.length){ takePoint(hits[0]); return; }
    var url="https://photon.komoot.io/api/?q="+encodeURIComponent(q)+"&limit=8";
    if(from&&isFinite(from.lat)) url+="&lat="+from.lat+"&lon="+from.lng;
    fetch(url,{headers:{Accept:"application/json"}}).then(function(r){return r.json();}).then(function(j){
      var f=(j.features||[])[0], c=f&&f.geometry&&f.geometry.coordinates, pr=f&&f.properties||{};
      if(!c){ talk("No named place for that."); return; }
      takePoint({lat:+c[1],lng:+c[0],name:pr.name||q,raw:[pr.street,pr.city||pr.locality].filter(Boolean).join(", "),tags:pr,peer:pr.peer||""});
    }).catch(function(){ talk("Search failed."); });
  }

  function destPeer(dest){
    if(!dest) return "";
    return dest.peer || (dest.tags&& (dest.tags.peer||dest.tags.snPeer)) || "";
  }

  function connect(from, dest){
    var tags=(dest&&dest.tags)||{};
    var phone=tags.phone||tags["contact:phone"]||tags.tel||dest.phone||"";
    var other=destPeer(dest);
    var row={id:uid("c"),kind:"call",from:from,to:dest,phone:String(phone||""),peer:other,t:Date.now()};
    var list=load(KEYS.calls); list.unshift(row); save(KEYS.calls,list);
    activeCall=row;
    paint();
    if(window.SN&&SN.showCall) SN.showCall(from, dest);
    else if(window.SN&&SN.showMap) SN.showMap(dest, 12);
    at=dest; view="calldone";
    ensure(); render(); sheet.classList.add("on");
    if(other && phone) talk("Arc to "+placeName(dest)+". Video if they answer. You can also dial.");
    else if(other) talk("Arc to "+placeName(dest)+". Video if they answer. They may be offline.");
    else if(phone) talk("Arc to "+placeName(dest)+". No SpaceNet video on that end — dial the listed phone.");
    else talk("Arc to "+placeName(dest)+". No video peer and no phone listed. Search someone on SpaceNet, or add a number.");
  }

  function loadPeerLib(){
    if(window.Peer) return Promise.resolve(window.Peer);
    return new Promise(function(resolve, reject){
      var s=document.createElement("script");
      s.src="https://cdn.jsdelivr.net/npm/peerjs@1.5.4/dist/peerjs.min.js";
      s.onload=function(){ resolve(window.Peer); };
      s.onerror=function(){ reject(new Error("peer")); };
      document.head.appendChild(s);
    });
  }

  function ensurePeer(){
    return loadPeerLib().then(function(Peer){
      if(peer && !peer.destroyed && peer.open) return peer;
      if(!(peer && !peer.destroyed)){
        peer=new Peer(peerId(), {debug:0});
        peer.on("call", function(c){
          if(!allowIncoming(c)){
            try{ c.close(); }catch(e){}
            return;
          }
          if(!navigator.mediaDevices||!navigator.mediaDevices.getUserMedia){
            talk("This device cannot open a camera.");
            return;
          }
          navigator.mediaDevices.getUserMedia({video:true,audio:true}).then(function(stream){
            mediaStream=stream;
            mediaCall=c;
            c.answer(stream);
            c.on("stream", function(remote){ showVideo(stream); setRemote(remote); talk("Astranov video."); });
            c.on("close", hang);
          }).catch(function(){ talk("Allow camera and mic for video."); });
        });
      }
      return new Promise(function(resolve, reject){
        if(peer.open){ resolve(peer); return; }
        var t=setTimeout(function(){ reject(new Error("peer_timeout")); }, 8000);
        peer.once("open", function(){ clearTimeout(t); resolve(peer); });
        peer.once("error", function(){ clearTimeout(t); reject(new Error("peer")); });
      });
    });
  }

  function showVideo(local){
    ensure();
    if(!videoEl) return;
    videoEl.classList.add("on");
    var lv=document.getElementById("sn-local");
    if(lv && local) lv.srcObject=local;
  }
  function setRemote(remote){
    var rv=document.getElementById("sn-remote");
    if(rv && remote) rv.srcObject=remote;
  }
  function hang(){
    try{ if(mediaCall) mediaCall.close(); }catch(e){}
    try{ if(mediaStream) mediaStream.getTracks().forEach(function(t){ t.stop(); }); }catch(e){}
    mediaCall=null; mediaStream=null;
    var lv=document.getElementById("sn-local"), rv=document.getElementById("sn-remote");
    if(lv) lv.srcObject=null;
    if(rv) rv.srcObject=null;
    if(videoEl) videoEl.classList.remove("on");
    talk("Call ended.");
  }

  function nativeCall(tel, video){
    var n=String(tel||"").replace(/[^\d+]/g,"");
    if(!n) return false;
    var ua=navigator.userAgent||"";
    if(video && /iPhone|iPad|Macintosh/.test(ua)){ location.href="facetime:"+n; return true; }
    location.href="tel:"+n;
    return true;
  }

  function liveJob(){ return window.SN&&SN.liveEscrow?SN.liveEscrow():null; }
  function movingNow(){ return !!(window.SN&&SN.isMoving&&SN.isMoving()); }
  function iAmDriver(e){
    if(!e||!e.driver||!e.driver.id) return false;
    return load(KEYS.drivers).some(function(d){ return d&&d.id===e.driver.id; });
  }
  function iAmVendor(e){
    if(!e||!e.shop||!e.shop.id) return false;
    return load(KEYS.shops).some(function(s){ return s&&s.id===e.shop.id; });
  }
  function allowIncoming(c){
    var e=liveJob(), from=c.peer, meta=(c&&c.metadata)||{};
    if(iAmDriver(e)){
      if(movingNow()){ talk("Video is off while you are moving."); return false; }
      var client=e.customerPeer||"";
      if(client && from!==client && meta.from!==client){ talk("Only the client of this job can video you."); return false; }
      if(!client && meta.role && meta.role!=="client"){ talk("Only the client of this job can video you."); return false; }
    }
    return true;
  }
  function startVideo(id, tel, meta){
    id=String(id||"").trim();
    tel=String(tel||(activeCall&&activeCall.phone)||"").replace(/[^\d+]/g,"");
    meta=meta||{};
    meta.from=peerId();
    var e=liveJob();
    if(iAmDriver(e)){
      if(movingNow()){ talk("Video is off while you are moving."); return; }
      if(e.customerPeer && id!==e.customerPeer){ talk("You can only video the client of this job."); return; }
    }
    if(!id){
      if(tel){ nativeCall(tel, true); return; }
      talk("The other end is not on SpaceNet video.");
      return;
    }
    if(id===peerId()){
      if(tel){ nativeCall(tel, true); return; }
      talk("That's this device. Call someone else on SpaceNet.");
      return;
    }
    if(!navigator.mediaDevices||!navigator.mediaDevices.getUserMedia){
      if(tel){ nativeCall(tel, true); return; }
      talk("This device cannot open a camera.");
      return;
    }
    ensurePeer().then(function(p){
      return navigator.mediaDevices.getUserMedia({video:true,audio:true}).then(function(stream){
        mediaStream=stream;
        var c=p.call(id, stream, {metadata:meta});
        mediaCall=c;
        var wait=setTimeout(function(){
          talk("They did not answer.");
          hang();
        }, 12000);
        c.on("stream", function(remote){ clearTimeout(wait); showVideo(stream); setRemote(remote); talk("Astranov video."); });
        c.on("error", function(){
          clearTimeout(wait);
          talk("Video did not connect. They may be offline.");
        });
        c.on("close", hang);
        talk("Astranov video… keep this screen open.");
      });
    }).catch(function(){
      talk("Video needs camera, mic, and the other person on SpaceNet.");
    });
  }

  function listenPeer(){ ensurePeer().catch(function(){}); pull(); }

  function field(name, label, opts){
    opts=opts||{};
    var v=opts.value||"";
    if(opts.area) return '<label>'+esc(label)+'<textarea name="'+esc(name)+'" rows="'+(opts.rows||4)+'" placeholder="'+esc(opts.ph||"")+'">'+esc(v)+'</textarea></label>';
    if(opts.select){
      var optsHtml=opts.select.map(function(s){ return '<option value="'+esc(s[0])+'"'+(v===s[0]?" selected":"")+'>'+esc(s[1])+'</option>'; }).join("");
      return '<label>'+esc(label)+'<select name="'+esc(name)+'">'+optsHtml+'</select></label>';
    }
    return '<label>'+esc(label)+'<input name="'+esc(name)+'" type="'+(opts.type||"text")+'" value="'+esc(v)+'" placeholder="'+esc(opts.ph||"")+'"'+(opts.inputmode?' inputmode="'+opts.inputmode+'"':'')+' /></label>';
  }

  function fileField(slot, label){
    return '<label>'+esc(label)+'<input type="file" accept="image/*" capture="environment" data-slot="'+esc(slot)+'" /><img class="thumb" alt="" style="display:none" /></label>';
  }

  function head(title, sub){
    var save=view==="shop"||view==="drop"||view==="driver"||view==="post"||view==="report";
    return '<div class="hd">'
      +(save?'<button type="button" class="save" data-act="save">SAVE</button>':'')
      +'<button type="button" class="x" data-act="close">'+(save?"✕":"Close")+'</button>'
      +(view!=="home"?'<button type="button" class="back" data-act="home">Back</button>':'')
      +'<div class="ttl">'+esc(title)+'</div>'+(sub?'<div class="sub">'+esc(sub)+'</div>':'')+'</div>';
  }

  function gallery(urls){
    if(!urls||!urls.length) return "";
    return '<div class="gallery">'+urls.map(function(src){ return '<img alt="" src="'+src+'" />'; }).join("")+'</div>';
  }

  function render(){
    ensure();
    if(!card) return;
    var title=placeName(at);
    var sub=placeLine(at);
    if(view==="home"||view==="list"){
      var three=
        '<button type="button" class="opt" data-act="shop"><b>List a vendor</b><span>Menu with photos, prices, stock, schedule.</span></button>'+
        '<button type="button" class="opt" data-act="driver"><b>List a driver base</b><span>Starting point, trips, range, schedule. 1 AV€/km.</span></button>'+
        '<button type="button" class="opt" data-act="drop"><b>List a secret drop</b><span>Only the agent on that task sees it. Never the shop. Never the public map.</span></button>';
      card.innerHTML=head(title, sub)+
        '<button type="button" class="opt" data-act="you"><b>This is my location</b><span>YOU pin. Not a shop.</span></button>'+
        '<button type="button" class="opt" data-act="fix"><b>Fix my location</b><span>Next tap on the map is YOU. Order stays.</span></button>'+
        '<button type="button" class="opt" data-act="post"><b>Post something here</b><span>News, a note, a photo. It shows on SpaceNet.</span></button>'+
        '<button type="button" class="opt" data-act="report"><b>Report something here</b><span>A problem at this pin. It posts on SpaceNet.</span></button>'+
        '<button type="button" class="opt" data-act="call"><b>Start a call from here</b><span>Video if they are on SpaceNet. Or search a name and dial.</span></button>'+
        three;
      return;
    }
    if(view==="report"){
      card.innerHTML=head("Report here", title)+
        '<form data-kind="report">'+field("text","What is wrong",{area:true,rows:5,ph:"Write it."})+
        fileField("shot","Photo (optional)")+
        '<button type="submit" class="go">REPORT</button></form>';
      return;
    }
    if(view==="post"){
      card.innerHTML=head("Post here", title)+
        '<form data-kind="post">'+field("text","The post",{area:true,rows:5,ph:"Write it."})+
        fileField("shot","Photo (optional)")+
        '<button type="submit" class="go">POST</button></form>';
      return;
    }
    if(view==="call"){
      card.innerHTML=head("Call from "+title, "Other end on the map, or a name")+
        '<form data-kind="call">'+field("q","Search somebody or a company",{ph:"Name, shop, place"})+
        '<button type="submit" class="go">FIND OTHER END</button></form>'+
        '<button type="button" class="opt" data-act="pick-map"><b>Tap the map</b><span>Globe, national, or city. Then video or dial.</span></button>';
      return;
    }
    if(view==="calldone"){
      var c=activeCall||{};
      var dest=c.to||{};
      var tel=String(c.phone||"").replace(/[^\d+]/g,"");
      var other=c.peer||destPeer(dest);
      card.innerHTML=head("Call", placeName(c.from)+" → "+placeName(dest))+
        '<p class="note">'+(other?"They list a SpaceNet video. It connects only if they answer.":"No SpaceNet video on that end.")+(tel?" A phone is listed.":"")+'</p>'+
        (other?'<button type="button" class="go" data-act="video" data-peer="'+esc(other)+'" data-tel="'+esc(tel)+'">VIDEO CALL</button>':'')+
        (tel?'<button type="button" class="go" data-act="video-dial" data-tel="'+esc(tel)+'">PHONE VIDEO</button>':'')+
        (tel?'<button type="button" class="go" data-act="dial" data-tel="'+esc(tel)+'">DIAL '+esc(tel)+'</button>':'')+
        '<button type="button" class="opt" data-act="close"><b>Done</b><span>Arc stays on the map.</span></button>';
      return;
    }
    if(view==="shop"){
      if(at&&at.kind==="shop"&&at.id&&!editing){
        var s=at.tags||at;
        var dishes=s.dishes||[];
        var mine=canEdit(s);
        card.innerHTML=head(s.name||title, (s.open||"")+(s.hours?" · "+s.hours:""))+
          (s.cover?'<img class="cover" alt="Cover" src="'+s.cover+'" />':'')+
          (s.profile?'<img class="avatar" alt="Profile" src="'+s.profile+'" />':'')+
          (dishes.length?'<div class="sn-menu-grid">'+dishHead(false)+dishes.map(dishShow).join("")+'</div>':(s.menu?'<pre class="menu">'+esc(s.menu)+'</pre>':''))+
          '<a class="go sn-call" href="'+(s.phone?("tel:"+String(s.phone).replace(/[^\d+]/g,"")):"#")+'">CALL '+(s.phone?String(s.phone).replace(/[^\d+ ]/g,""):"SHOP")+'</a>'+
          (s.peer?'<button type="button" class="go" data-act="video" data-peer="'+esc(s.peer)+'" data-tel="'+esc(s.phone||"")+'">VIDEO CALL</button>':'')+
          '<button type="button" class="go" data-act="order">ORDER FROM HERE</button>'+
          (mine?'<button type="button" class="opt" data-act="edit-shop"><b>Edit this menu</b><span>Same photo, price, stock the client sees.</span></button>':'')+
          (mine?'<button type="button" class="opt" data-act="books"><b>This month</b><span>SpaceNet invoice at ΔΟΥ Ρόδου.</span></button>':'')+
          (mine?'<button type="button" class="opt" data-act="remove"><b>Remove listing</b><span>Owner or SpaceNet admin.</span></button>':'');
        return;
      }
      if(at&&at.id&&(at.kind==="shop")&&!canEdit(at.tags||at)){ talk("Only the owner or a SpaceNet admin can edit this pin."); view="home"; render(); return; }
      card.innerHTML=head(placeName(at)==="This place"?"List your shop":placeName(at), "This spreadsheet is what the client sees. Pin is on the map above.")+
        '<form data-kind="shop">'+
        field("name","Shop name",{ph:"Name on the door"})+
        fileField("cover","Cover picture")+
        fileField("profile","Profile picture")+
        '<label>Products and services</label>'+
        '<div class="sn-menu-grid" data-menu>'+seedDishes()+'</div>'+
        '<input type="file" accept="image/*" capture="environment" hidden data-dish-file>'+
        '<button type="button" class="opt" data-act="dish-add"><b>Add a row</b><span>Photo, description, hours, initial stock, stock left.</span></button>'+
        field("open","Availability",{select:[["open","Open now"],["order","By order"],["closed","Closed"]]})+
        field("hours","Schedule",{ph:"Mon–Sat 10–22"})+
        field("phone","Telephone",{type:"tel",ph:"+30 …",inputmode:"tel"})+
        field("note","Notes",{ph:"How to order, what you do"})+
        '<button type="submit" class="go">SAVE</button></form>';
      fillShopForm(at&&(at.tags||at));
      fillFromWorld();
      return;
    }
    if(view==="drop"){
      if(at&&at.kind==="drop"&&at.id&&!editing){
        var d=at.tags||at;
        var mine=canEdit(d);
        card.innerHTML=head(d.label||d.name||"Drop", [d.street,d.number,d.floor].filter(Boolean).join(" · "))+
          (d.photo?'<img class="shot" alt="Entrance" src="'+d.photo+'" />':'')+
          '<p class="note">'+(d.bell?"Doorbell "+esc(d.bell)+(d.bellName?" · "+esc(d.bellName):""):"")+(d.pref?"\n"+esc(d.pref):"")+'</p>'+
          (d.phone?'<button type="button" class="go" data-act="dial" data-tel="'+esc(d.phone)+'">DIAL '+esc(d.phone)+'</button>':'')+
          (d.peer?'<button type="button" class="go" data-act="video" data-peer="'+esc(d.peer)+'">VIDEO CALL</button>':'')+
          (mine?'<button type="button" class="opt" data-act="edit"><b>Edit this drop</b><span>Owner or SpaceNet admin.</span></button>':'')+
          (mine?'<button type="button" class="opt" data-act="books"><b>This month</b><span>Receipts at ΔΟΥ Ρόδου.</span></button>':'')+
          (mine?'<button type="button" class="opt" data-act="remove"><b>Remove listing</b><span>Owner or SpaceNet admin.</span></button>':'');
        return;
      }
      if(at&&at.id&&at.kind==="drop"&&!canEdit(at.tags||at)){ talk("Only the owner or a SpaceNet admin can edit this pin."); view="home"; render(); return; }
      card.innerHTML=head("Secret drop", "Only the agent on your task sees this. Not the shop. Not the public map.")+
        '<form data-kind="drop">'+
        field("label","What to call it",{ph:"Home, office, shop back door"})+
        fileField("shot","Photo of the entrance")+
        field("street","Street",{ph:"Street name"})+
        field("number","Number",{ph:"Building number"})+
        field("floor","Floor",{ph:"3rd, basement, …"})+
        field("phone","Telephone",{type:"tel",inputmode:"tel"})+
        field("bell","Doorbell number",{ph:"12"})+
        field("bellName","Doorbell name",{ph:"Name on the bell"})+
        field("dropOut","Drop-out / leave-at",{ph:"Gate, lobby, back door, box"})+
        field("pref","Contact preferences",{area:true,rows:3,ph:"Call first. Leave at door. Ring twice."})+
        '<button type="submit" class="go">SAVE</button></form>';
      return;
    }
    if(view==="driver"){
      if(at&&at.kind==="driver"&&at.id&&!editing){
        var r=at.tags||at;
        var pres=r.presence==="off"?"Off":r.presence==="route"?"On a route":"Present at this base";
        var mine=canEdit(r);
        card.innerHTML=head((r.name||"Driver base")+" · starting point", pres+" "+(flagOf(r.langMain)||"")+(flagOf(r.langAlt)||""))+
          (r.face?'<img class="avatar" alt="Face" src="'+r.face+'" />':'')+
          (r.vehicle?'<img class="shot" alt="Vehicle" src="'+r.vehicle+'" />':(r.photo?'<img class="shot" alt="Base" src="'+r.photo+'" />':''))+
          '<p class="note">'+(r.routes?"Routes: "+esc(r.routes)+"\n":"")+(r.vehicles?esc(r.vehicles)+"\n":"")+(r.hours?esc(r.hours)+"\n":"")+(r.range?"Range "+esc(r.range)+" km\n":"")+(r.carry?esc(r.carry)+"\n":"")+esc(r.pref||"")+"\nReceives jobs from SpaceNet users."+'</p>'+
          '<button type="button" class="go" data-act="order">SEND A JOB HERE</button>'+
          (r.phone?'<button type="button" class="go" data-act="dial" data-tel="'+esc(r.phone)+'">DIAL '+esc(r.phone)+'</button>':'')+
          (r.peer?'<button type="button" class="go" data-act="video" data-peer="'+esc(r.peer)+'">VIDEO CALL</button>':'')+
          (mine?'<button type="button" class="opt" data-act="edit"><b>Edit this base</b><span>Owner or SpaceNet admin.</span></button>':'')+
          (mine?'<button type="button" class="opt" data-act="books"><b>This month</b><span>Driver invoice at ΔΟΥ Ρόδου.</span></button>':'')+
          (mine?'<button type="button" class="opt" data-act="remove"><b>Remove listing</b><span>Owner or SpaceNet admin.</span></button>':'');
        return;
      }
      if(at&&at.id&&at.kind==="driver"&&!canEdit(at.tags||at)){ talk("Only the owner or a SpaceNet admin can edit this pin."); view="home"; render(); return; }
      card.innerHTML=head("Delivery driver base", "Starting point. Declare presence and routes. Receive jobs from users.")+
        '<form data-kind="driver">'+
        field("name","Name on the base",{ph:"How you want to be called"})+
        fileField("face","Face photo")+
        fileField("vehicle","Vehicle photo")+
        field("langMain","Main language",{select:[["el","Greek 🇬🇷"],["en","English 🇬🇧"],["de","German 🇩🇪"],["fr","French 🇫🇷"],["it","Italian 🇮🇹"],["tr","Turkish 🇹🇷"],["ru","Russian 🇷🇺"]]})+
        field("langAlt","Second language",{select:[["en","English 🇬🇧"],["el","Greek 🇬🇷"],["de","German 🇩🇪"],["fr","French 🇫🇷"],["it","Italian 🇮🇹"],["tr","Turkish 🇹🇷"],["ru","Russian 🇷🇺"]]})+
        field("presence","Presence",{select:[["present","Present at this base"],["route","On a route"],["off","Off"]]})+
        field("routes","Routes you work",{area:true,rows:3,ph:"Rhodes town — airport. Kalithea. Faliraki."})+
        field("dest","Desired trips / drop zones",{area:true,rows:3,ph:"Where you want to go. Town, coast, airport."})+
        field("vehicles","Vehicles",{ph:"Bike, car, van"})+
        field("hours","Working time",{ph:"Everyday 9–21"})+
        field("range","How far from this base (km)",{ph:"12",inputmode:"numeric"})+
        field("carry","What you carry",{ph:"Food, parcels, no frozen"})+
        field("pref","Preferences",{area:true,rows:3,ph:"Cash, AVC, stairs ok, no stairs"})+
        field("phone","Telephone",{type:"tel",inputmode:"tel"})+
        '<button type="submit" class="go">SAVE</button></form>';
      return;
    }
    if(view==="tax"){
      var tx=taxOffice();
      card.innerHTML=head("ΔΟΥ Ρόδου", tx.raw+" · "+monthLabel())+booksHtml();
      return;
    }
    view="home"; render();
  }

  window.SNWork={
    open:open,
    close:close,
    rename:rename,
    all:all,
    hit:hit,
    match:match,
    picking:function(){ return picking; },
    takePoint:takePoint,
    searchDest:searchDest,
    publish:publish,
    cancelPick:cancelPick,
    activeCall:function(){ return activeCall; },
    arcPts:arcPts,
    listenPeer:listenPeer,
    hang:hang,
    peerId:peerId,
    applyFill:applyFill,
    autoList:autoList,
    fillFromWorld:fillFromWorld,
    isAdmin:isAdmin,
    takeStock:takeStock,
    startVideo:startVideo,
    pull:pull,
    publish:publish,
    taxOffice:taxOffice,
    flagOf:flagOf,
    booksOf:booksOf,
    listingAt:listingAt,
    listingOpen:listingOpen,
    setPin:setPin
  };
  if(document.readyState==="loading") document.addEventListener("DOMContentLoaded", ensure);
  else ensure();
})();
