(function(){
  if(window.SNWork && window.SNWork.open) return;
  var KEYS={posts:"sn:posts",shops:"sn:shops",drops:"sn:drops",drivers:"sn:drivers",calls:"sn:calls"};
  var picking=null, activeCall=null, sheet=null, card=null, pickBar=null, at=null, view="home";
  var photos={profile:"",cover:"",menu:[],shot:""};
  var peer=null, mediaStream=null, mediaCall=null, videoEl=null;

  function load(k){ try{ return JSON.parse(localStorage.getItem(k)||"[]")||[]; }catch(e){ return []; } }
  function save(k, list){ try{ localStorage.setItem(k, JSON.stringify((list||[]).slice(0,40))); }catch(e){} }
  function talk(t){ if(window.SN&&SN.talk) SN.talk(t); else if(window.SN&&SN.say) SN.say(t); }
  function say(t){ if(window.SN&&SN.say) SN.say(t); }
  function paint(){ if(window.SN&&SN.repaint) SN.repaint(); }
  function uid(p){ return p+Date.now().toString(36)+Math.random().toString(36).slice(2,5); }
  function esc(s){ return String(s==null?"":s).replace(/[&<>"']/g,function(c){ if(c==="&") return "&"+ "amp;"; if(c==="<") return "&"+"lt;"; if(c===">") return "&"+"gt;"; if(c==='"') return "&"+"quot;"; return "&#39;"; }); }
  function km(a,b){ if(window.SN&&SN.km) return SN.km(a,b); if(!a||!b) return 0; var R=6371,dLat=((b.lat-a.lat)*Math.PI)/180,dLng=((b.lng-a.lng)*Math.PI)/180; var x=Math.sin(dLat/2)*Math.sin(dLat/2)+Math.cos((a.lat*Math.PI)/180)*Math.cos((b.lat*Math.PI)/180)*Math.sin(dLng/2)*Math.sin(dLng/2); return R*2*Math.atan2(Math.sqrt(x),Math.sqrt(1-x)); }
  function all(){ return {posts:load(KEYS.posts),shops:load(KEYS.shops),drops:load(KEYS.drops),drivers:load(KEYS.drivers),calls:load(KEYS.calls)}; }
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
  function resetPhotos(){ photos={profile:"",cover:"",menu:[],shot:""}; }

  function match(q, from){
    var l=String(q||"").toLowerCase().trim();
    var out=[], a=all();
    function add(list, kind, extra){
      (list||[]).forEach(function(row){
        if(!row||!isFinite(row.lat)) return;
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
    resetPhotos();
  }

  function open(place, which){
    ensure();
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
    var b=e.target.closest("[data-act]");
    if(!b || !sheet.contains(b)) return;
    var act=b.getAttribute("data-act");
    if(act==="close"){ close(); return; }
    if(act==="home"){ view="home"; resetPhotos(); render(); return; }
    if(act==="post"||act==="call"||act==="shop"||act==="drop"||act==="driver"){ view=act; resetPhotos(); render(); return; }
    if(act==="pick-map"){ startPick(); return; }
    if(act==="dial"){ var tel=b.getAttribute("data-tel")||""; if(tel) location.href="tel:"+tel.replace(/[^\d+]/g,""); return; }
    if(act==="video"){ startVideo(b.getAttribute("data-peer")||""); return; }
    if(act==="order"){ close(); if(window.SN&&SN.selectVendor) SN.selectVendor({id:at.id,name:placeName(at),lat:at.lat,lng:at.lng,raw:"SpaceNet",tags:at.tags||at,kind:at.kind||"shop"}); return; }
    if(act==="remove"){ removeCurrent(); return; }
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
    if(kind==="driver") return saveDriver(fd);
    if(kind==="call") return searchDest(String(fd.get("q")||"").trim());
  }

  function onChange(e){
    var t=e.target;
    if(!t || t.type!=="file") return;
    var file=t.files&&t.files[0];
    if(!file) return;
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
    close(); paint(); talk("Posted at "+placeName(at)+".");
  }

  function saveShop(fd){
    var name=val(fd,"name");
    if(!name){ talk("Name the shop."); return; }
    var row=baseRow();
    row.id=uid("s"); row.kind="shop"; row.name=name;
    row.menu=val(fd,"menu"); row.hours=val(fd,"hours");
    row.open=val(fd,"open"); row.phone=val(fd,"phone");
    row.note=val(fd,"note");
    row.cover=photos.cover||"";
    row.profile=photos.profile||"";
    row.menuPhotos=(photos.menu||[]).slice();
    var list=load(KEYS.shops); list.unshift(row); save(KEYS.shops,list);
    close(); paint(); talk(name+" is listed. Cover, profile, and menu are on SpaceNet.");
  }

  function saveDrop(fd){
    var row=baseRow();
    row.id=uid("d"); row.kind="drop";
    row.label=val(fd,"label")||placeName(at);
    row.name=row.label;
    row.street=val(fd,"street"); row.number=val(fd,"number");
    row.floor=val(fd,"floor"); row.phone=val(fd,"phone");
    row.bell=val(fd,"bell"); row.bellName=val(fd,"bellName");
    row.pref=val(fd,"pref"); row.photo=photos.shot||"";
    if(!row.street && !row.number && !row.phone && !row.photo){ talk("Add a street, number, phone, or entrance photo."); return; }
    var list=load(KEYS.drops); list.unshift(row); save(KEYS.drops,list);
    close(); paint(); talk("Delivery location listed at "+row.label+".");
  }

  function saveDriver(fd){
    var row=baseRow();
    row.id=uid("r"); row.kind="driver";
    row.name=val(fd,"name")||"Driver base";
    row.presence=val(fd,"presence")||"present";
    row.routes=val(fd,"routes");
    row.vehicles=val(fd,"vehicles"); row.hours=val(fd,"hours");
    row.range=val(fd,"range"); row.carry=val(fd,"carry");
    row.pref=val(fd,"pref"); row.phone=val(fd,"phone");
    row.photo=photos.shot||"";
    if(!row.vehicles && !row.hours && !row.routes){ talk("Add a vehicle, a working time, or the routes you work."); return; }
    var list=load(KEYS.drivers); list.unshift(row); save(KEYS.drivers,list);
    close(); paint(); talk("Delivery driver base listed. Starting point. Presence and routes declared. Users can send jobs here.");
  }

  function removeCurrent(){
    if(!at||!at.id||!at.kind) return;
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
    if(other && phone) talk("Connected to "+placeName(dest)+". Video is here. You can also dial.");
    else if(other) talk("Connected to "+placeName(dest)+". Start video if they are on SpaceNet.");
    else if(phone) talk("Connected to "+placeName(dest)+". No SpaceNet video on that end — dial the listed phone.");
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
      if(peer && !peer.destroyed) return peer;
      peer=new Peer(peerId(), {debug:0});
      peer.on("call", function(c){
        if(!navigator.mediaDevices||!navigator.mediaDevices.getUserMedia){
          talk("This device cannot open a camera.");
          return;
        }
        navigator.mediaDevices.getUserMedia({video:true,audio:true}).then(function(stream){
          mediaStream=stream;
          mediaCall=c;
          c.answer(stream);
          showVideo(stream);
          c.on("stream", function(remote){ setRemote(remote); });
          c.on("close", hang);
          talk("Incoming video.");
        }).catch(function(){ talk("Allow camera and mic for video."); });
      });
      return peer;
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

  function startVideo(id){
    id=String(id||"").trim();
    if(!id){ talk("The other end is not on SpaceNet video. Dial if a phone is listed."); return; }
    if(id===peerId()){ talk("That's this device. Call someone else on SpaceNet."); return; }
    if(!navigator.mediaDevices||!navigator.mediaDevices.getUserMedia){
      talk("This device cannot open a camera. Dial if a phone is listed.");
      return;
    }
    ensurePeer().then(function(p){
      return navigator.mediaDevices.getUserMedia({video:true,audio:true}).then(function(stream){
        mediaStream=stream;
        showVideo(stream);
        var c=p.call(id, stream);
        mediaCall=c;
        c.on("stream", function(remote){ setRemote(remote); });
        c.on("error", function(){ talk("Video did not connect. They may be offline. Dial if a phone is listed."); });
        c.on("close", hang);
        talk("Calling… keep this screen open.");
      });
    }).catch(function(){
      talk("Video needs camera, mic, and the other person on SpaceNet. Dial if a phone is listed.");
    });
  }

  function listenPeer(){ ensurePeer().catch(function(){}); }

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
    return '<div class="hd"><button type="button" class="x" data-act="close">Close</button>'+(view!=="home"?'<button type="button" class="back" data-act="home">Back</button>':'')+'<div class="ttl">'+esc(title)+'</div>'+(sub?'<div class="sub">'+esc(sub)+'</div>':'')+'</div>';
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
    if(view==="home"){
      card.innerHTML=head(title, sub)+
        '<button type="button" class="opt" data-act="post"><b>Post something here</b><span>News, a note, a photo. It shows on SpaceNet.</span></button>'+
        '<button type="button" class="opt" data-act="call"><b>Start a call from here</b><span>Video if they are on SpaceNet. Or search a name and dial.</span></button>'+
        '<button type="button" class="opt" data-act="shop"><b>List your shop</b><span>Cover, profile, menu with photos and prices, hours.</span></button>'+
        '<button type="button" class="opt" data-act="drop"><b>List a delivery location</b><span>Entrance photo, floor, doorbell, phone.</span></button>'+
        '<button type="button" class="opt" data-act="driver"><b>List a delivery driver base</b><span>Starting point. Declare presence and routes. Receive jobs from SpaceNet users.</span></button>';
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
      card.innerHTML=head("Connected", placeName(c.from)+" → "+placeName(dest))+
        '<p class="note">'+(other?"They are on SpaceNet. Video uses this device camera. Keep the page open.":"No SpaceNet video on that end.")+(tel?" A phone is listed.":"")+'</p>'+
        (other?'<button type="button" class="go" data-act="video" data-peer="'+esc(other)+'">VIDEO CALL</button>':'')+
        (tel?'<button type="button" class="go" data-act="dial" data-tel="'+esc(tel)+'">DIAL '+esc(tel)+'</button>':'')+
        '<button type="button" class="opt" data-act="close"><b>Done</b><span>Arc stays on the map.</span></button>';
      return;
    }
    if(view==="shop"){
      if(at&&at.kind==="shop"&&at.id){
        var s=at.tags||at;
        card.innerHTML=head(s.name||title, (s.open||"")+(s.hours?" · "+s.hours:""))+
          (s.cover?'<img class="cover" alt="Cover" src="'+s.cover+'" />':'')+
          (s.profile?'<img class="avatar" alt="Profile" src="'+s.profile+'" />':'')+
          gallery(s.menuPhotos)+
          (s.menu?'<pre class="menu">'+esc(s.menu)+'</pre>':'')+
          (s.phone?'<button type="button" class="go" data-act="dial" data-tel="'+esc(s.phone)+'">DIAL '+esc(s.phone)+'</button>':'')+
          (s.peer?'<button type="button" class="go" data-act="video" data-peer="'+esc(s.peer)+'">VIDEO CALL</button>':'')+
          '<button type="button" class="go" data-act="order">ORDER FROM HERE</button>'+
          '<button type="button" class="opt" data-act="remove"><b>Remove listing</b><span>Off this device.</span></button>';
        return;
      }
      card.innerHTML=head("List your shop", title)+
        '<form data-kind="shop">'+
        field("name","Shop name",{ph:"Name on the door"})+
        fileField("cover","Cover picture")+
        fileField("profile","Profile picture")+
        field("menu","Menu and prices",{area:true,rows:6,ph:"Item — price. One per line."})+
        '<label>Menu photos<input type="file" accept="image/*" capture="environment" data-slot="menu" /></label><div class="gallery" data-slot="menu"></div>'+
        field("open","Availability",{select:[["open","Open now"],["order","By order"],["closed","Closed"]]})+
        field("hours","Schedule",{ph:"Mon–Sat 10–22"})+
        field("phone","Telephone",{type:"tel",ph:"+30 …",inputmode:"tel"})+
        field("note","Notes",{ph:"How to order, what you do"})+
        '<button type="submit" class="go">LIST SHOP</button></form>';
      return;
    }
    if(view==="drop"){
      if(at&&at.kind==="drop"&&at.id){
        var d=at.tags||at;
        card.innerHTML=head(d.label||d.name||"Drop", [d.street,d.number,d.floor].filter(Boolean).join(" · "))+
          (d.photo?'<img class="shot" alt="Entrance" src="'+d.photo+'" />':'')+
          '<p class="note">'+(d.bell?"Doorbell "+esc(d.bell)+(d.bellName?" · "+esc(d.bellName):""):"")+(d.pref?"\n"+esc(d.pref):"")+'</p>'+
          (d.phone?'<button type="button" class="go" data-act="dial" data-tel="'+esc(d.phone)+'">DIAL '+esc(d.phone)+'</button>':'')+
          (d.peer?'<button type="button" class="go" data-act="video" data-peer="'+esc(d.peer)+'">VIDEO CALL</button>':'')+
          '<button type="button" class="opt" data-act="remove"><b>Remove listing</b><span>Off this device.</span></button>';
        return;
      }
      card.innerHTML=head("Delivery location", title)+
        '<form data-kind="drop">'+
        field("label","What to call it",{ph:"Home, office, shop back door"})+
        fileField("shot","Photo of the entrance")+
        field("street","Street",{ph:"Street name"})+
        field("number","Number",{ph:"Building number"})+
        field("floor","Floor",{ph:"3rd, basement, …"})+
        field("phone","Telephone",{type:"tel",inputmode:"tel"})+
        field("bell","Doorbell number",{ph:"12"})+
        field("bellName","Doorbell name",{ph:"Name on the bell"})+
        field("pref","Contact preferences",{area:true,rows:3,ph:"Call first. Leave at door. Ring twice."})+
        '<button type="submit" class="go">LIST LOCATION</button></form>';
      return;
    }
    if(view==="driver"){
      if(at&&at.kind==="driver"&&at.id){
        var r=at.tags||at;
        var pres=r.presence==="off"?"Off":r.presence==="route"?"On a route":"Present at this base";
        card.innerHTML=head((r.name||"Driver base")+" · starting point", pres)+
          (r.photo?'<img class="shot" alt="Base" src="'+r.photo+'" />':'')+
          '<p class="note">'+(r.routes?"Routes: "+esc(r.routes)+"\n":"")+(r.vehicles?esc(r.vehicles)+"\n":"")+(r.hours?esc(r.hours)+"\n":"")+(r.range?"Range "+esc(r.range)+" km\n":"")+(r.carry?esc(r.carry)+"\n":"")+esc(r.pref||"")+"\nReceives jobs from SpaceNet users."+'</p>'+
          '<button type="button" class="go" data-act="order">SEND A JOB HERE</button>'+
          (r.phone?'<button type="button" class="go" data-act="dial" data-tel="'+esc(r.phone)+'">DIAL '+esc(r.phone)+'</button>':'')+
          (r.peer?'<button type="button" class="go" data-act="video" data-peer="'+esc(r.peer)+'">VIDEO CALL</button>':'')+
          '<button type="button" class="opt" data-act="remove"><b>Remove listing</b><span>Off this device.</span></button>';
        return;
      }
      card.innerHTML=head("Delivery driver base", "Starting point. Declare presence and routes. Receive jobs from users.")+
        '<form data-kind="driver">'+
        field("name","Name on the base",{ph:"How you want to be called"})+
        fileField("shot","Photo of this starting point")+
        field("presence","Presence",{select:[["present","Present at this base"],["route","On a route"],["off","Off"]]})+
        field("routes","Routes you work",{area:true,rows:3,ph:"Rhodes town — airport. Kalithea. Faliraki. What you like to run."})+
        field("vehicles","Vehicles",{ph:"Bike, car, van"})+
        field("hours","Working time",{ph:"Everyday 9–21"})+
        field("range","How far from this base (km)",{ph:"12",inputmode:"numeric"})+
        field("carry","What you carry",{ph:"Food, parcels, no frozen"})+
        field("pref","Preferences",{area:true,rows:3,ph:"Cash, AVC, stairs ok, no stairs"})+
        field("phone","Telephone",{type:"tel",inputmode:"tel"})+
        '<button type="submit" class="go">LIST DRIVER BASE</button></form>';
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
    cancelPick:cancelPick,
    activeCall:function(){ return activeCall; },
    arcPts:arcPts,
    listenPeer:listenPeer,
    hang:hang,
    peerId:peerId
  };
  if(document.readyState==="loading") document.addEventListener("DOMContentLoaded", ensure);
  else ensure();
})();
