(function(){
if(window.__SN_FILL_4168) return;
window.__SN_FILL_4168=true;
var KES_EUR=140;
var BRAND={
"pizza inn":{phone:"+254 723 971 417",hours:"Mon\u2013Sun 8:00\u201323:00",dishes:[
{name:"Regina (Medium)",price:7.0},
{name:"Hawaiian (Medium)",price:7.0},
{name:"Peri-Peri Chicken (Medium)",price:7.0},
{name:"Chicken Tikka (Medium)",price:7.0},
{name:"Boerewors (Medium)",price:7.0},
{name:"Veg Feast (Medium)",price:7.5},
{name:"Cheese Burger (Medium)",price:7.5},
{name:"Chicken Hawaiian (Medium)",price:7.5},
{name:"Nyama Feast (Medium)",price:8.0},
{name:"Chicken Feast (Medium)",price:8.0},
{name:"Meat Deluxe (Medium)",price:8.0},
{name:"6 BBQ Wings",price:4.0}
]},
"domino":{phone:"",hours:"",dishes:[
{name:"Margherita (Regular)",price:6.5},{name:"Pepperoni (Regular)",price:8.0},{name:"Farm House (Regular)",price:8.5},
{name:"Chicken Dominator (Regular)",price:9.5},{name:"Veggie Paradise (Regular)",price:8.0},{name:"Garlic Breadsticks",price:3.5}
]},
"debonair":{phone:"",hours:"",dishes:[
{name:"Margherita",price:6.0},{name:"BBQ Chicken",price:7.5},{name:"Pepperoni",price:7.0},
{name:"Chicken & Mushroom",price:7.5},{name:"Veggie Delight",price:6.5}
]}
};
function css(){
if(document.getElementById("sn-fill-4168-css")) return;
var s=document.createElement("style");
s.id="sn-fill-4168-css";
s.textContent=
"#sn-live .dish.sheet.head,#sn-sheet .dish.sheet.head{display:grid!important;grid-template-columns:56px minmax(0,1.6fr) 64px minmax(0,.9fr) 48px 48px;gap:6px;align-items:center;width:100%;font:800 10px/1.2 system-ui;letter-spacing:.04em;color:#7ee9ff;padding:6px 4px}"+
"#sn-live .dish.sheet.head span,#sn-sheet .dish.sheet.head span{display:block;margin:0;white-space:nowrap}"+
"#sn-live .dish.sheet:not(.head),#sn-sheet .dish.sheet:not(.head){display:grid!important;grid-template-columns:56px minmax(0,1.6fr) 64px minmax(0,.9fr) 48px 48px;gap:6px;align-items:center;width:100%}"+
"#sn-live .dish.sheet img,#sn-sheet .dish.sheet img{width:48px;height:48px;object-fit:cover;border-radius:8px}"+
"#sn-paypath-4165{display:flex!important}";
document.head.appendChild(s);
}
function brandKey(name){
var n=String(name||"").toLowerCase();
if(/pizza\s*inn/.test(n)) return "pizza inn";
if(/domino/.test(n)) return "domino";
if(/debonair/.test(n)) return "debonair";
return "";
}
function normDishes(list, hours){
return (list||[]).map(function(it){
if(!it||!(it.name||it.desc)) return null;
return {
name:String(it.name||it.desc).trim(),
price:Number(it.price)||0,
hours:it.hours||hours||"",
stock:it.stock||20,
stock0:it.stock0||it.stock||20,
photo:it.photo||"",
sample:false
};
}).filter(function(d){ return d&&d.name; });
}
function parseTextMenu(text){
var out=[];
String(text||"").split(/\n+/).forEach(function(line){
var m=String(line).match(/^\s*[-*]?\s*(.+?)\s*[—\-–:]\s*(?:KSh|KES|AV€|€|EUR)?\s*([0-9]+(?:\.[0-9]+)?)/i);
if(!m) return;
var price=+m[2];
if(price>50) price=Math.round((price/KES_EUR)*10)/10; // KES → EUR
out.push({name:m[1].trim(),price:price,sample:false});
});
return out;
}
function writeShop(shop, fill){
if(!shop||!fill) return shop;
try{
var raw=localStorage.getItem("sn:shops");
var list=raw?JSON.parse(raw):[];
if(!Array.isArray(list)) list=[];
var id=shop.id, hit=-1, i;
for(i=0;i<list.length;i++){
if(list[i]&&id&&list[i].id===id){ hit=i; break; }
if(list[i]&&shop.name&&String(list[i].name).toLowerCase()===String(shop.name).toLowerCase() && Math.abs(+list[i].lat-+shop.lat)<0.01){ hit=i; break; }
}
var row=hit>=0?list[hit]:{id:shop.id||("s"+Date.now()),kind:"shop",name:shop.name,lat:+shop.lat,lng:+shop.lng,raw:shop.raw||"",peer:"spacenet",auto:1,t:Date.now()};
if(fill.phone) row.phone=fill.phone;
if(fill.hours) row.hours=fill.hours;
if(fill.dishes&&fill.dishes.length){
row.dishes=fill.dishes;
row.menu=fill.dishes.map(function(d){ return d.name+" — "+d.price; }).join("\n");
}
row.sample=false;
if(hit>=0) list[hit]=row; else list.unshift(row);
localStorage.setItem("sn:shops", JSON.stringify(list));
shop.phone=row.phone||shop.phone;