(function(){
  if(window.__SN_FILL_4188) return;
  window.__SN_FILL_4188=true;
  var BRAND={
    "pizza inn":{phone:"+254 700 323 323",hours:"Mon–Sun 8:00–23:00",dishes:[
      {name:"Regina (Medium)",price:7.0},{name:"Hawaiian (Medium)",price:7.0},
      {name:"Peri-Peri Chicken (Medium)",price:7.0},{name:"Chicken Tikka (Medium)",price:7.0},
      {name:"Boerewors (Medium)",price:7.0},{name:"Veg Feast (Medium)",price:7.5},
      {name:"Cheese Burger (Medium)",price:7.5},{name:"Chicken Hawaiian (Medium)",price:7.5},
      {name:"Nyama Feast (Medium)",price:8.0},{name:"Chicken Feast (Medium)",price:8.0},
      {name:"Meat Deluxe (Medium)",price:8.0},{name:"6 BBQ Wings",price:4.0}
    ]},
    "domino":{phone:"",hours:"",dishes:[
      {name:"Margherita (Regular)",price:6.5},{name:"Pepperoni (Regular)",price:8.0},
      {name:"Farm House (Regular)",price:8.5},{name:"Chicken Dominator (Regular)",price:9.5},
      {name:"Veggie Paradise (Regular)",price:8.0},{name:"Garlic Breadsticks",price:3.5}
    ]},
    "debonair":{phone:"",hours:"",dishes:[
      {name:"Margherita",price:6.0},{name:"BBQ Chicken",price:7.5},{name:"Pepperoni",price:7.0},
      {name:"Chicken & Mushroom",price:7.5},{name:"Veggie Delight",price:6.5}
    ]}
  };
  var COLS="display:grid!important;grid-template-columns:52px minmax(88px,1.5fr) 56px minmax(88px,1fr) 44px 40px!important;column-gap:12px!important;align-items:center!important;width:100%!important;box-sizing:border-box!important";
  var SPAN="display:block!important;padding:0 8px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font:800 10px/1.2 system-ui;color:#7ee9ff";
  var lastShop=null;
  var filling={};

  function css(){
    if(document.getElementById("sn-fill-4188-css")) return;
    var s=document.createElement("style");
    s.id="sn-fill-4188-css";
    s.textContent=
      "#sn-paypath-4188,#sn-call-4188{display:flex!important}"+ 
      ".sn-menu-grid .dish.sheet.head .cols,#sn-live .dish.sheet.head .cols,#sn-sheet .dish.sheet.head .cols{"+COLS+"}"+ 
      ".sn-menu-grid .dish.sheet.head .cols > span,#sn-live .dish.sheet.head .cols > span,#sn-sheet .dish.sheet.head .cols > span{"+SPAN+"}"+ 
      "#sn-sheet .card .dish.sheet.head .cols,#sn-menu .card .dish.sheet.head .cols{"+COLS+"}";
    document.head.appendChild(s);
  }
  function brandKey(name){
    var n=String(name||"").toLowerCase().replace(/[^a-z0-9]+/g," ");
    if(/pizza\s*inn/.test(n) || /pizzainn/.test(n)) return "pizza inn";
    if(/domino/.test(n)) return "domino";
    if(/debonair/.test(n)) return "debonair";
    return "";
  }
  function normDishes(list, hours){
    return (list||[]).map(function(it){
      if(typeof it==="string"){
        var m=it.split(/\s*[—\-]\s*/);
        var nm=String(m[0]||"").trim();
        if(!nm) return null;
        return {name:nm,price:Number(m[1])||0,hours:hours||"",stock:20,stock0:20,photo:"",sample:false};
      }
      if(!it||!(it.name||it.desc)) return null;
      if(it.sample===true||it.sample===1||it.sample==="true") return null;
      return {
        name:String(it.name||it.desc).trim(),
        price:Number(it.price)||0,
        hours:it.hours||hours||"",
        stock:it.stock!=null?it.stock:20,
        stock0:it.stock0!=null?it.stock0:(it.stock!=null?it.stock:20),
        photo:it.photo||"",
        sample:false
      };
    }).filter(function(d){ return d&&d.name; });
  }
  function shopPhone(shop){
    var p=String((shop&&(shop.phone||(shop.tags&&shop.tags.phone)))||"").trim();
    if(/^CALL(\s+SHOP)?$/i.test(p)) return "";
    if(!p || !/\d/.test(p)) return "";
    return p;
  }
  function brandFill(shop){
    var key=brandKey(shop&&(shop.name||shop.place||shop.raw));
    if(!key||!BRAND[key]) return null;
    var b=BRAND[key];
    return {phone:b.phone||shopPhone(shop)||"",hours:b.hours||(shop&&shop.hours)||"",dishes:normDishes(b.dishes,b.hours)};
  }
  function localFill(shop){
    if(!shop) return null;
    var dishes=normDishes(shop.dishes||shop.items||(shop.tags&&shop.tags.dishes)||[], shop.hours||"");
    if(!dishes.length && shop.menu){
      dishes=normDishes(String(shop.menu).split(/\n+/), shop.hours||"");
    }
    var phone=shopPhone(shop);
    var hours=String(shop.hours||(shop.tags&&shop.tags.hours)||"").trim();
    if(!dishes.length && !phone && !hours) return null;
    return {phone:phone,hours:hours,dishes:dishes};
  }
  function hostEl(){
    return document.querySelector("#sn-sheet.on .card")
      || document.querySelector("#sn-menu.on .card")
      || document.getElementById("sn-live");
  }
  function spaceHeads(){
    document.querySelectorAll(".dish.sheet.head .cols, #sn-sheet .cols, #sn-live .cols").forEach(function(cols){
      if(!cols || !cols.children || cols.children.length<4) return;
      cols.setAttribute("style", COLS);
      Array.prototype.forEach.call(cols.children||[], function(ch){
        if(ch&&ch.tagName==="SPAN") ch.setAttribute("style", SPAN);
      });
    });
  }
  function scrubCallShop(host, phone){
    if(!host) return;
    host.querySelectorAll("a,button").forEach(function(el){
      if(el.id==="sn-call-4188" || el.id==="sn-call-4175" || el.id==="sn-call-4173") return;
      var t=String(el.textContent||"").replace(/\s+/g," ").trim();
      if(/^CALL(\s+SHOP)?$/i.test(t)){
        if(phone){
          el.textContent="CALL "+phone;
          if(el.tagName==="A") el.setAttribute("href","tel:"+phone.replace(/[^\d+]/g,""));
        }else{
