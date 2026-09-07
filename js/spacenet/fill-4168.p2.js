hours||"");
return {
phone:j.phone||"",
hours:j.hours||"",
dishes:dishes
};
}).catch(function(){ return {phone:"",hours:"",dishes:[]}; });
}
function placeFill(shop){
return fetch("/api/place",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({name:shop.name||"",place:shop.raw||"",lat:shop.lat,lng:shop.lng})})
.then(function(r){ return r.json(); })
.then(function(j){
if(!j||!j.ok) return {phone:"",hours:"",dishes:[]};
return {phone:j.phone||"",hours:j.hours||"",dishes:normDishes(j.items||j.dishes||[], j.hours||"")};
}).catch(function(){ return {phone:"",hours:"",dishes:[]}; });
}
function mergeFill(a,b,c){
var out={phone:"",hours:"",dishes:[]};
[a,b,c].forEach(function(x){
if(!x) return;
if(x.phone&&!out.phone) out.phone=x.phone;
if(x.hours&&!out.hours) out.hours=x.hours;
if(x.dishes&&x.dishes.length&&!out.dishes.length) out.dishes=x.dishes;
});
[a,b,c].forEach(function(x){
if(x&&x.dishes&&x.dishes.length>out.dishes.length) out.dishes=x.dishes;
});
return out;
}
var filling=false;
function fillShop(shop){
if(!shop||!isFinite(+shop.lat)) return;
css();
paintRows(shop); // show head correctly even while loading
if(filling) return;
filling=true;
var tags=shop.tags||{};
var tagged={
phone:shop.phone||tags.phone||tags["contact:phone"]||tags.tel||"",
hours:shop.hours||tags.opening_hours||tags.hours||"",
dishes:normDishes(shop.dishes||tags.dishes||[], shop.hours)
};
Promise.all([placeFill(shop), aiFill(shop)]).then(function(pair){
var brand=brandFill(shop);
var fill=mergeFill(tagged, pair[0], pair[1]);
if((!fill.dishes||!fill.dishes.length)&&brand) fill=mergeFill(fill, brand, null);
if(brand){
if(!fill.phone&&brand.phone) fill.phone=brand.phone;
if(!fill.hours&&brand.hours) fill.hours=brand.hours;
}
if(!fill.dishes) fill.dishes=[];
var row=writeShop(shop, fill);
paintRows(row||shop);
filling=false;
}).catch(function(){
var brand=brandFill(shop);
if(brand){
var row=writeShop(shop, brand);
paintRows(row||shop);
}
filling=false;
});
}
function wrapSelect(){
if(!window.SN||!SN.selectVendor) return setTimeout(wrapSelect, 40);
if(SN.selectVendor.__fill4168) return;
var orig=SN.selectVendor.bind(SN);
SN.selectVendor=function(v){
var r=orig(v);
try{ setTimeout(function(){ fillShop(v); }, 50); setTimeout(function(){ fillShop(v); }, 700); }catch(e){}
return r;
};
SN.selectVendor.__fill4168=true;
}
var ofetch=window.fetch;
window.fetch=function(input, init){
var url=typeof input==="string"?input:(input&&input.url)||"";
var u=String(url);
var isListing=false;
try{
if(u.indexOf("/api/ai")!==-1&&init&&init.body){
var b=typeof init.body==="string"?JSON.parse(init.body):init.body;
var t=String((b&&(b.prompt||b.message))||"");
if(/LISTING FILL|act\s*=\s*listing/i.test(t)) isListing=true;
}
}catch(e){}
var p=ofetch.apply(this, arguments);
if(!isListing||u.indexOf("/api/ai")===-1) return p;
return p.then(function(res){
var clone=res.clone();
return clone.json().then(function(j){
try{
if(j&&typeof j==="object"){
j=Object.assign({}, j, {act:"listing",action:"listing"});
if(!j.dishes&&j.items) j.dishes=j.items;
return new Response(JSON.stringify(j),{status:res.status,headers:{"Content-Type":"application/json"}});
}
}catch(e){}
return res;
}).catch(function(){ return res; });
});
};
css();
wrapSelect();
setInterval(function(){ wrapSelect(); css(); }, 2000);
})();