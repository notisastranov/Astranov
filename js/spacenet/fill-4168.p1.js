
shop.hours=row.hours||shop.hours;
shop.dishes=row.dishes;
shop.menu=row.menu;
shop.tags=row;
if(window.SNWork&&SNWork.applyFill){
try{ SNWork.applyFill({name:row.name,phone:row.phone,hours:row.hours,dishes:row.dishes,items:row.dishes}); }catch(e){}
}
return row;
}catch(e){ return shop; }
}
function paintRows(shop){
css();
var dishes=normDishes((shop&&(shop.dishes||(shop.tags&&shop.tags.dishes)))||[], shop&&shop.hours);
if(!dishes.length&&shop&&shop.menu) dishes=normDishes(parseTextMenu(shop.menu), shop.hours);
var live=document.getElementById("sn-live");
if(!live) return;
try{
if(window.SN&&SN.selectVendor){ /* already selected */ }
}catch(e){}
if(!dishes.length){
live.innerHTML='<div class="dish sheet head"><span>Photo</span><span>Description</span><span>AV€</span><span>Hours</span><span>Initial</span><span>Left</span></div><p class="note">Filling public menu…</p>';
return;
}
var html='<div class="dish sheet head"><span>Photo</span><span>Description</span><span>AV€</span><span>Hours</span><span>Initial</span><span>Left</span></div>';
dishes.forEach(function(it){
html+='<button type="button" class="dish sheet order" data-name="'+String(it.name).replace(/"/g,"&quot;")+'">'+
'<img alt="" src="" style="width:48px;height:48px;background:#041018;border-radius:8px">'+
'<b>'+String(it.name||"").replace(/</g,"&lt;")+'</b>'+
'<span class="px">AV€ '+(Number(it.price)||0).toFixed(2)+'</span>'+
'<span class="hrs">'+(it.hours||(shop&&shop.hours)||"-")+'</span>'+
'<span class="st">20</span><span class="st">20</span></button>';
});
live.innerHTML=html;
var menu=document.getElementById("sn-menu");
if(menu) menu.classList.add("on");
try{
if(window.SNWork){ /* noop */ }
var ev=document.createEvent("Event");
}catch(e){}
try{
if(window.SN&&SN.startOrder){ /* don't restart */ }
}catch(e){}
if(window.SN&&SN.talk) SN.talk((shop.name||"Shop")+". "+dishes.length+" on the spreadsheet. Tap a row to cart.");
else if(window.SN&&SN.say) SN.say((shop.name||"Shop")+". "+dishes.length+" rows.");
var bar=document.getElementById("sn-paypath-4165");
if(!bar){
bar=document.createElement("div");
bar.id="sn-paypath-4165";
bar.style.cssText="display:flex;flex-wrap:wrap;gap:8px;margin:10px 0 4px";
bar.innerHTML='<button type="button" data-act="now" style="flex:1;min-width:88px;height:40px;border-radius:12px;border:1px solid rgba(77,240,255,.7);background:rgba(4,16,28,.95);color:#4df0ff;font:800 12px system-ui">NOW</button><button type="button" data-act="pay" style="flex:1;min-width:88px;height:40px;border-radius:12px;border:1px solid rgba(77,240,255,.7);background:rgba(4,16,28,.95);color:#4df0ff;font:800 12px system-ui">PAY</button><button type="button" data-act="reload" style="flex:1;min-width:88px;height:40px;border-radius:12px;border:1px solid rgba(77,240,255,.7);background:rgba(4,16,28,.95);color:#7ee9ff;font:800 12px system-ui">RELOAD</button>';
live.appendChild(bar);
}else if(!bar.parentNode) live.appendChild(bar);
}
function brandFill(shop){
var key=brandKey(shop&&shop.name);
if(!key||!BRAND[key]) return null;
var b=BRAND[key];
return {
phone:b.phone||shop.phone||"",
hours:b.hours||shop.hours||"",
dishes:normDishes(b.dishes, b.hours)
};
}
function aiFill(shop){
var name=String(shop.name||"shop");
var body={
prompt:"act=listing JSON only for THIS shop: "+name+" at "+(shop.raw||"")+" lat "+shop.lat+" lng "+shop.lng+
". Required fields: act=listing, name, phone, hours, dishes:[{name,price,hours,sample:false}]. "+
"Use published public menu prices for this brand/branch. Never act=hunt. No Rhodes. No sample=true.",
message:"LISTING FILL act=listing "+name,
spacenet:true,fast:false,force_paid:true,allow_paid:true,
here:{place:name,name:name,lat:shop.lat,lng:shop.lng}
};
return fetch("/api/ai",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)})
.then(function(r){ return r.json(); })
.then(function(j){
var dishes=normDishes(j.dishes||j.items||[], j.hours||"");
if(!dishes.length) dishes=normDishes(parseTextMenu(j.text||j.say||""), j.