/**
 * Manual city · Build 20260827133000-city-manual
 * Login + Locate on screen. City map after locate / pizza.
 * Real OSM vendors only. Published menus (Pizza Inn Kenya, Debonairs,
 * Pizza Fan Rhodes, Domino's Rodos) with photos, prices, +/- cart.
 * Order → available drivers = YOU only. No fake shops / drivers / menus.
 */
(function (G) {
  "use strict";
  var BUILD = "20260827133000-city-manual";
  if (G.__snCityManual20260827133000 && G.SNCityManual && G.SNCityManual.build === BUILD) return;
  G.__snCityManual20260827133000 = 1;
  try {
    G.__snGuestPizzaCam20260827121000 = 1;
  } catch (_) {}

  var NAIROBI = { lat: -1.286, lng: 36.817 };
  var origin = { lat: NAIROBI.lat, lng: NAIROBI.lng, source: "camera" };
  var shops = [];
  var cart = [];
  var pickMap = {};
  var activeShop = null;
  var cityOn = false;
  var cityZ = 15;
  var cityLat = NAIROBI.lat;
  var cityLng = NAIROBI.lng;
  var dragging = false;
  var lx = 0;
  var ly = 0;
  var canvas = null;
  var ctx = null;
  var dpr = 1;
  var tileCache = {};
  var hunting = false;
  var huntGen = 0;

  var OVERPASS_FETCH_MS = 12000;
  var OVERPASS_ENDPOINTS = [
    "https://maps.mail.ru/osm/tools/overpass/api/interpreter",
    "https://overpass.osm.ch/api/interpreter",
    "https://overpass.openstreetmap.fr/api/interpreter",
    "https://overpass.kumi.systems/api/interpreter",
    "https://overpass.osm.jp/api/interpreter",
  ];

  var IMG = {
    marg: "/media/menu/margherita.jpg",
    pepp: "/media/menu/pepperoni.jpg",
    bbq: "/media/menu/bbq-chicken.jpg",
    wings: "/media/menu/wings.jpg",
  };

  /* Published Pizza Inn Kenya menu (pizzainn.co.ke 2025–2026 price grid). */
  var PIZZA_INN = {
    brand: "Pizza Inn",
    source: "pizzainn.co.ke · published Kenya menu",
    currency: "KES",
    photo: IMG.marg,
    groups: [
      {
        title: "Classic",
        items: [
          { id: "pi-haw", name: "Hawaiian", detail: "Macon, pineapple, mozzarella", photo: IMG.marg, sizes: [{ s: "Regular", p: 650 }, { s: "Medium", p: 950 }, { s: "Large", p: 1200 }, { s: "Mega", p: 1550 }] },
          { id: "pi-boe", name: "Boerewors", detail: "Seasoned beef mince, tomato, onion", photo: IMG.bbq, sizes: [{ s: "Regular", p: 650 }, { s: "Medium", p: 950 }, { s: "Large", p: 1200 }, { s: "Mega", p: 1550 }] },
          { id: "pi-bbq", name: "BBQ Steak", detail: "Barbecue steak, onion, peppers", photo: IMG.bbq, sizes: [{ s: "Regular", p: 650 }, { s: "Medium", p: 950 }, { s: "Large", p: 1200 }, { s: "Mega", p: 1550 }] },
          { id: "pi-reg", name: "Regina", detail: "Sandwich beef, mushrooms", photo: IMG.pepp, sizes: [{ s: "Regular", p: 650 }, { s: "Medium", p: 950 }, { s: "Large", p: 1200 }, { s: "Mega", p: 1550 }] },
          { id: "pi-peri", name: "Peri Peri Chicken", detail: "Peri peri chicken, onion, cheese", photo: IMG.bbq, sizes: [{ s: "Regular", p: 650 }, { s: "Medium", p: 950 }, { s: "Large", p: 1200 }, { s: "Mega", p: 1550 }] },
          { id: "pi-cm", name: "Chicken Mushroom", detail: "BBQ chicken, mushroom, creamy mayo", photo: IMG.bbq, sizes: [{ s: "Regular", p: 650 }, { s: "Medium", p: 950 }, { s: "Large", p: 1200 }, { s: "Mega", p: 1550 }] },
          { id: "pi-tik", name: "Chicken Tikka", detail: "Tikka chicken, peppers, onion", photo: IMG.bbq, sizes: [{ s: "Regular", p: 650 }, { s: "Medium", p: 950 }, { s: "Large", p: 1200 }, { s: "Mega", p: 1550 }] },
          { id: "pi-veg", name: "Veg Tikka", detail: "Corn, peppers, mushroom, jalapeño, tikka", photo: IMG.marg, sizes: [{ s: "Regular", p: 650 }, { s: "Medium", p: 950 }, { s: "Large", p: 1200 }, { s: "Mega", p: 1550 }] },
        ],
      },
      {
        title: "Deluxe",
        items: [
          { id: "pi-cbp", name: "Chicken & Beef Pepperoni", detail: "BBQ chicken, beef pepperoni, mushroom, peppers", photo: IMG.pepp, sizes: [{ s: "Regular", p: 700 }, { s: "Medium", p: 1000 }, { s: "Large", p: 1290 }, { s: "Mega", p: 1650 }] },
          { id: "pi-cmb", name: "Chicken Macon BBQ", detail: "BBQ chicken, chicken macon, cheese", photo: IMG.bbq, sizes: [{ s: "Regular", p: 700 }, { s: "Medium", p: 1000 }, { s: "Large", p: 1290 }, { s: "Mega", p: 1650 }] },
          { id: "pi-cha", name: "Chicken Hawaiian", detail: "Chicken, ham, pineapple", photo: IMG.marg, sizes: [{ s: "Regular", p: 700 }, { s: "Medium", p: 1000 }, { s: "Large", p: 1290 }, { s: "Mega", p: 1650 }] },
          { id: "pi-burg", name: "Cheese Burger", detail: "Seasoned beef, cheddar, onion, mayo, BBQ", photo: IMG.pepp, sizes: [{ s: "Regular", p: 700 }, { s: "Medium", p: 1000 }, { s: "Large", p: 1290 }, { s: "Mega", p: 1650 }] },
          { id: "pi-feta", name: "Roast Veg & Feta", detail: "Roasted peppers, olives, mushroom, feta", photo: IMG.marg, sizes: [{ s: "Regular", p: 700 }, { s: "Medium", p: 1000 }, { s: "Large", p: 1290 }, { s: "Mega", p: 1650 }] },
        ],
      },
      {
        title: "Supreme",
        items: [
          { id: "pi-md", name: "Meat Deluxe", detail: "Pepperoni, BBQ steak, macon, sandwich beef", photo: IMG.pepp, sizes: [{ s: "Regular", p: 730 }, { s: "Medium", p: 1090 }, { s: "Large", p: 1390 }, { s: "Mega", p: 1750 }] },
          { id: "pi-cf", name: "Chicken Feast", detail: "Tikka, peri-peri, peppers, corn, mushroom", photo: IMG.bbq, sizes: [{ s: "Regular", p: 730 }, { s: "Medium", p: 1090 }, { s: "Large", p: 1390 }, { s: "Mega", p: 1750 }] },
          { id: "pi-ny", name: "Nyama Feast", detail: "Steak, pepperoni, boerewors, macon, ham, veg", photo: IMG.pepp, sizes: [{ s: "Regular", p: 730 }, { s: "Medium", p: 1090 }, { s: "Large", p: 1390 }, { s: "Mega", p: 1750 }] },
        ],
      },
      {
        title: "Sides",
        items: [{ id: "pi-w6", name: "Wings", detail: "6 pieces", photo: IMG.wings, sizes: [{ s: "6 pcs", p: 650 }] }],
      },
    ],
  };

  /* Published Debonairs standard menu (debonairspizza.co.za). */
  var DEBONAIRS = {
    brand: "Debonairs",
    source: "debonairspizza.co.za · standard menu",
    currency: "ZAR",
    photo: IMG.pepp,
    groups: [
      {
        title: "Clazzics",
        items: [
          { id: "db-mar", name: "Margherita", detail: "Tomato, mozzarella", photo: IMG.marg, sizes: [{ s: "Small", p: 31.9 }, { s: "Medium", p: 59.9 }, { s: "Large", p: 84.9 }] },
          { id: "db-haw", name: "Hawaiian", detail: "Ham, pineapple", photo: IMG.marg, sizes: [{ s: "Small", p: 49.9 }, { s: "Medium", p: 79.9 }, { s: "Large", p: 124.9 }] },
          { id: "db-pep", name: "Pepperoni", detail: "Pepperoni, mozzarella", photo: IMG.pepp, sizes: [{ s: "Small", p: 49.9 }, { s: "Medium", p: 79.9 }, { s: "Large", p: 124.9 }] },
          { id: "db-bbqc", name: "BBQ Chicken", detail: "Barbecue chicken", photo: IMG.bbq, sizes: [{ s: "Small", p: 31.9 }, { s: "Medium", p: 62.9 }, { s: "Large", p: 95.9 }] },
          { id: "db-tik", name: "Tikka Chicken", detail: "Tikka chicken", photo: IMG.bbq, sizes: [{ s: "Small", p: 59.9 }, { s: "Medium", p: 99.9 }, { s: "Large", p: 154.9 }] },
          { id: "db-meat", name: "Something Meaty", detail: "Mixed meats", photo: IMG.pepp, sizes: [{ s: "Small", p: 59.9 }, { s: "Medium", p: 99.9 }, { s: "Large", p: 154.9 }] },
          { id: "db-veg", name: "Original Veggie", detail: "Garden vegetables", photo: IMG.marg, sizes: [{ s: "Small", p: 49.9 }, { s: "Medium", p: 79.9 }, { s: "Large", p: 124.9 }] },
        ],
      },
      {
        title: "Sides",
        items: [
          { id: "db-w6", name: "Wings", detail: "BBQ or peri-peri", photo: IMG.wings, sizes: [{ s: "6 pcs", p: 112.9 }, { s: "4 pcs", p: 76.9 }, { s: "2 pcs", p: 44.9 }] },
          { id: "db-cs", name: "Chicken Shots", detail: "Crispy shots", photo: IMG.wings, sizes: [{ s: "15 pcs", p: 39.9 }, { s: "30 pcs", p: 59.9 }] },
        ],
      },
    ],
  };

  /* Pizza Fan Agios Nikolaos, Rhodes — prices posted on Wolt. */
  var PIZZA_FAN = {
    brand: "Pizza Fan",
    source: "wolt.com · Pizza Fan Agios Nikolaos, Rhodes",
    currency: "EUR",
    photo: IMG.marg,
    groups: [
      {
        title: "Pizzas",
        items: [
          { id: "pf-mar", name: "Margherita", detail: "Tomato sauce, Gouda", photo: IMG.marg, sizes: [{ s: "Standard", p: 8.89 }] },
          { id: "pf-ch", name: "Cheese 'N' Ham", detail: "Tomato sauce, Gouda, ham", photo: IMG.marg, sizes: [{ s: "Standard", p: 9.89 }] },
          { id: "pf-pep", name: "Pepperonati", detail: "Tomato sauce, Gouda, extra pepperoni", photo: IMG.pepp, sizes: [{ s: "Standard", p: 9.89 }] },
          { id: "pf-gr", name: "Greek", detail: "Gouda, white cheese, onion, olives, pepper, tomato", photo: IMG.marg, sizes: [{ s: "Standard", p: 10.89 }] },
          { id: "pf-fan", name: "Fan Special", detail: "Cream, Gouda, white cheese, smoked ham, bacon, mushroom, tomato, onion", photo: IMG.pepp, sizes: [{ s: "Standard", p: 11.5 }] },
          { id: "pf-cls", name: "Classic Special", detail: "Pepperoni, sausage, ham, bacon, mushroom, pepper", photo: IMG.pepp, sizes: [{ s: "Standard", p: 11.5 }] },
          { id: "pf-bbq", name: "BBQ Chicken", detail: "BBQ sauce, mozzarella, chicken fillet, mushroom", photo: IMG.bbq, sizes: [{ s: "Standard", p: 11.5 }] },
          { id: "pf-ck", name: "Chicken Fan", detail: "Cream, Gouda, chicken, mushroom, tomato, pepper, chalky cheese", photo: IMG.bbq, sizes: [{ s: "Standard", p: 11.5 }] },
          { id: "pf-4c", name: "4 Cheese", detail: "Cream, Gouda, parmesan, chalky cheese, mozzarella", photo: IMG.marg, sizes: [{ s: "Standard", p: 11.5 }] },
          { id: "pf-hot", name: "Hot & Spicy", detail: "Mexican sauce, Gouda, bacon, double soutzouki, hot pepper", photo: IMG.pepp, sizes: [{ s: "Standard", p: 10.89 }] },
          { id: "pf-cyc", name: "Cycladic", detail: "Naxos Gruyere PDO, Mykonos smoked sausage, cherry tomato", photo: IMG.marg, sizes: [{ s: "Standard", p: 10.89 }] },
          { id: "pf-veg", name: "Vegetarian", detail: "Multigrain, mushroom, onion, tomato, pepper, olives", photo: IMG.marg, sizes: [{ s: "Standard", p: 7.9 }] },
        ],
      },
    ],
  };

  /* Domino's Pizza Rodos — prices posted on Wolt Rhodes. */
  var DOMINOS_GR = {
    brand: "Domino's",
    source: "wolt.com · Domino's Pizza Rodos",
    currency: "EUR",
    photo: IMG.pepp,
    groups: [
      {
        title: "Value",
        items: [
          { id: "dg-mar", name: "Margarita", detail: "Mozzarella, tomato sauce, extra mozzarella", photo: IMG.marg, sizes: [{ s: "Listed", p: 8.7 }] },
          { id: "dg-hm", name: "Ham & Mushroom", detail: "Ham, mushroom, mozzarella", photo: IMG.marg, sizes: [{ s: "Listed", p: 8.7 }] },
          { id: "dg-gc", name: "Garden Classic", detail: "Garden vegetables", photo: IMG.marg, sizes: [{ s: "Listed", p: 8.7 }] },
        ],
      },
      {
        title: "Classic",
        items: [
          { id: "dg-pep", name: "Pepperoni Classic", detail: "Pepperoni, mozzarella", photo: IMG.pepp, sizes: [{ s: "Listed", p: 10.5 }] },
          { id: "dg-bbq", name: "Barbecue Chicken", detail: "Barbecue chicken", photo: IMG.bbq, sizes: [{ s: "Listed", p: 10.5 }] },
          { id: "dg-dia", name: "Diavola", detail: "Spicy salami", photo: IMG.pepp, sizes: [{ s: "Listed", p: 8.7 }] },
          { id: "dg-grk", name: "Greek", detail: "Greek toppings", photo: IMG.marg, sizes: [{ s: "Listed", p: 10.5 }] },
          { id: "dg-mam", name: "Mama's Pizza", detail: "House classic", photo: IMG.pepp, sizes: [{ s: "Listed", p: 10.5 }] },
          { id: "dg-trp", name: "Tropicana", detail: "Ham, pineapple", photo: IMG.marg, sizes: [{ s: "Listed", p: 8.7 }] },
          { id: "dg-spc", name: "Domino's Special", detail: "House special", photo: IMG.pepp, sizes: [{ s: "Listed", p: 10.5 }] },
        ],
      },
      {
        title: "Premium",
        items: [
          { id: "dg-ext", name: "Pepperoni Extreme", detail: "Extra pepperoni", photo: IMG.pepp, sizes: [{ s: "Listed", p: 12.5 }] },
          { id: "dg-mea", name: "Meat Passion", detail: "Mixed meats", photo: IMG.pepp, sizes: [{ s: "Listed", p: 12.5 }] },
          { id: "dg-4c", name: "4 Cheese", detail: "Four cheeses", photo: IMG.marg, sizes: [{ s: "Listed", p: 12.5 }] },
        ],
      },
      {
        title: "Chicken",
        items: [
          { id: "dg-wbbq", name: "Buffalo Wings BBQ", detail: "BBQ wings", photo: IMG.wings, sizes: [{ s: "Listed", p: 8.0 }] },
          { id: "dg-wbo", name: "Buffalo Wings Bourbon", detail: "Bourbon wings", photo: IMG.wings, sizes: [{ s: "Listed", p: 8.0 }] },
        ],
      },
    ],
  };

  function say(t) {
    try {
      var el = document.getElementById("line");
      if (el && t != null) el.textContent = String(t);
    } catch (_) {}
  }

  function hideLeaflet() {
    try {
      var el = document.getElementById("city");
      if (!el) return;
      el.classList.remove("on");
      el.style.setProperty("display", "none", "important");
      el.style.setProperty("pointer-events", "none", "important");
      el.style.setProperty("opacity", "0", "important");
      el.style.setProperty("visibility", "hidden", "important");
    } catch (_) {}
  }

  function money(n, cur) {
    n = Number(n);
    if (!isFinite(n)) return "";
    if (cur === "KES") return "KSh " + Math.round(n).toLocaleString();
    if (cur === "ZAR") return "R " + n.toFixed(2);
    if (cur === "EUR") return "\u20AC" + n.toFixed(2);
    return String(n);
  }

  function signedUser() {
    try {
      if (G.SNAuth && SNAuth.user) return SNAuth.user;
      if (G.SNAuth && SNAuth.session && SNAuth.session.user) return SNAuth.session.user;
    } catch (_) {}
    return null;
  }

  function displayName() {
    var u = signedUser();
    if (!u) return "You";
    var n = u.user_metadata && (u.user_metadata.full_name || u.user_metadata.name);
    n = n || u.email || "You";
    return String(n).split("@")[0].split(" ")[0];
  }

  function avatarOf() {
    var u = signedUser();
    if (!u) return "";
    try {
      if (G.SNAuth && typeof SNAuth.avatarUrl === "function") return SNAuth.avatarUrl(u) || "";
    } catch (_) {}
    return (u.user_metadata && (u.user_metadata.avatar_url || u.user_metadata.picture)) || "";
  }

  function matchMenu(shop) {
    var n = String((shop && shop.name) || "").toLowerCase();
    if (/pizza\s*inn/.test(n)) return PIZZA_INN;
    if (/debonair/.test(n)) return DEBONAIRS;
    if (/pizza\s*fan|pizzafan/.test(n)) return PIZZA_FAN;
    if (/domino/.test(n) && shop && shop.lat > 20) return DOMINOS_GR;
    return null;
  }

  function haversineKm(a, b) {
    if (!a || !b) return 9999;
    var R = 6371;
    var dLat = ((b.lat - a.lat) * Math.PI) / 180;
    var dLng = ((b.lng - a.lng) * Math.PI) / 180;
    var s =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
    return R * 2 * Math.atan2(Math.sqrt(s), Math.sqrt(1 - s));
  }

  function injectCss() {
    if (document.getElementById("sn-city-manual-css")) return;
    var s = document.createElement("style");
    s.id = "sn-city-manual-css";
    s.textContent =
      "#sn-actions{position:fixed;top:max(56px,calc(env(safe-area-inset-top) + 48px));left:12px;z-index:46;display:flex;flex-wrap:wrap;gap:8px;pointer-events:none}" +
      "#sn-actions button{pointer-events:auto;cursor:pointer;min-height:44px;min-width:44px;padding:0 16px;border:1px solid rgba(126,233,255,.55);background:rgba(4,16,28,.88);color:#7ee9ff;font:600 13px/1 system-ui;border-radius:12px;box-shadow:0 0 0 1px rgba(77,240,255,.12)}" +
      "#sn-actions button.primary{background:#d8f6ff;color:#02040a;border-color:transparent}" +
      "#sn-actions button:active{transform:scale(.98)}" +
      "#sn-live button{cursor:pointer}" +
      "#sn-live button.primary{background:#d8f6ff;color:#02040a;border-color:transparent}" +
      "#sn-citymap{position:fixed;inset:0;z-index:2;display:none;background:#02040a}" +
      "#sn-citymap.on{display:block}" +
      "#sn-citymap canvas{width:100%;height:100%;display:block;touch-action:none}" +
      "#sn-city-list{position:fixed;top:max(104px,calc(env(safe-area-inset-top) + 96px));left:12px;z-index:5;display:none;width:min(228px,58vw);max-height:42vh;overflow:auto;-webkit-overflow-scrolling:touch;background:rgba(4,16,28,.9);border-radius:16px;box-shadow:0 0 0 1px rgba(126,233,255,.28);padding:6px}" +
      "#sn-city-list.on{display:block}" +
      "#sn-city-list button{display:block;width:100%;text-align:left;cursor:pointer;min-height:44px;padding:8px 10px;margin:0 0 4px;border:0;border-radius:12px;background:transparent;color:#d8f6ff;font:600 12px/1.25 system-ui}" +
      "#sn-city-list button.has-menu{background:rgba(216,246,255,.12)}" +
      "#sn-city-list button span{display:block;color:#7ee9ff;font:500 10px/1.2 ui-monospace,monospace;margin-top:2px;opacity:.85}" +
      "#sn-city-pins{position:fixed;inset:0;z-index:3;pointer-events:none}" +
      "#sn-city-pins button{position:absolute;pointer-events:auto;cursor:pointer;transform:translate(-50%,-100%);min-width:44px;max-width:168px;padding:8px 10px;border:0;border-radius:12px 12px 12px 4px;background:rgba(4,16,28,.92);color:#d8f6ff;font:600 11px/1.25 system-ui;box-shadow:0 0 0 1px rgba(126,233,255,.4);text-align:left}" +
      "#sn-city-pins button.has-menu{background:#d8f6ff;color:#02040a;box-shadow:0 0 0 1px rgba(77,240,255,.55)}" +
      "#sn-city-pins button b{display:block;font:600 12px/1.2 system-ui}" +
      "#sn-city-pins button span{display:block;opacity:.72;font:500 10px/1.2 ui-monospace,monospace;margin-top:2px}" +
      "#sn-sheet{position:fixed;left:0;right:0;bottom:0;z-index:50;max-height:86vh;display:none;flex-direction:column;background:#071018;color:#e8fbff;border-radius:24px 24px 0 0;box-shadow:0 0 0 1px rgba(126,233,255,.22);overflow:hidden}" +
      "#sn-sheet.on{display:flex}" +
      "#sn-sheet .hero{position:relative;height:168px;flex-shrink:0;overflow:hidden}" +
      "#sn-sheet .hero img{width:100%;height:100%;object-fit:cover;outline:1px solid rgba(255,255,255,.1);outline-offset:-1px}" +
      "#sn-sheet .hero .x{position:absolute;top:12px;right:12px;width:44px;height:44px;border:0;border-radius:12px;background:rgba(2,8,16,.78);color:#e8fbff;font:600 18px system-ui;cursor:pointer}" +
      "#sn-sheet .body{overflow:auto;padding:16px 16px 24px;-webkit-overflow-scrolling:touch}" +
      "#sn-sheet h2{margin:0 0 4px;font:600 22px/1.15 system-ui;letter-spacing:-.02em}" +
      "#sn-sheet .meta{color:#7ee9ff;font:500 12px/1.4 system-ui;margin:0 0 16px;opacity:.85}" +
      "#sn-sheet h3{margin:20px 0 10px;font:600 12px/1 system-ui;color:#7ee9ff;letter-spacing:.04em;text-transform:uppercase}" +
      "#sn-sheet .row{display:grid;grid-template-columns:72px 1fr;gap:12px;align-items:start;padding:12px 0;border-top:1px solid rgba(126,233,255,.14)}" +
      "#sn-sheet .row img{width:72px;height:72px;object-fit:cover;border-radius:12px;outline:1px solid rgba(255,255,255,.1);outline-offset:-1px}" +
      "#sn-sheet .row b{display:block;font:600 14px/1.2 system-ui}" +
      "#sn-sheet .row p{margin:4px 0 8px;color:#9ad7e8;font:400 12px/1.35 system-ui}" +
      "#sn-sheet .sizes{display:flex;flex-wrap:wrap;gap:6px;margin:0 0 8px}" +
      "#sn-sheet .sizes button{min-height:32px;padding:0 10px;border-radius:10px;border:1px solid rgba(126,233,255,.28);background:#0c1a26;color:#d8f6ff;font:600 11px system-ui;cursor:pointer}" +
      "#sn-sheet .sizes button.on{background:#d8f6ff;color:#02040a;border-color:transparent}" +
      "#sn-sheet .qty{display:flex;align-items:center;gap:8px}" +
      "#sn-sheet .qty button{width:36px;height:36px;border-radius:10px;border:1px solid rgba(126,233,255,.28);background:#0c1a26;color:#d8f6ff;font:600 16px system-ui;cursor:pointer}" +
      "#sn-sheet .qty span{min-width:16px;text-align:center;font:600 13px ui-monospace,monospace}" +
      "#sn-sheet .price{font:600 13px ui-monospace,monospace;color:#d8f6ff;margin-left:auto}" +
      "#sn-sheet .empty{padding:24px 8px;color:#9ad7e8;font:400 14px/1.5 system-ui}" +
      "#sn-sheet .empty a{color:#d8f6ff}" +
      "#sn-sheet .foot{flex-shrink:0;padding:12px 16px calc(12px + env(safe-area-inset-bottom));border-top:1px solid rgba(126,233,255,.18);background:#071018}" +
      "#sn-sheet .foot button{width:100%;height:48px;border:0;border-radius:14px;background:#d8f6ff;color:#02040a;font:600 15px system-ui;cursor:pointer}" +
      "#sn-sheet .foot button:disabled{opacity:.4;cursor:default}" +
      "#sn-sheet .driver{display:flex;gap:12px;align-items:center;padding:12px;border-radius:16px;background:#0c1a26;box-shadow:0 0 0 1px rgba(126,233,255,.16)}" +
      "#sn-sheet .driver img,#sn-sheet .driver .av{width:48px;height:48px;border-radius:14px;object-fit:cover;background:#123}" +
      "@media (prefers-reduced-motion:reduce){*{animation:none!important;transition:none!important}}";
    (document.head || document.documentElement).appendChild(s);
  }

  function actionSlot() {
    var el = document.getElementById("sn-actions");
    if (!el) {
      el = document.createElement("div");
      el.id = "sn-actions";
      (document.body || document.documentElement).appendChild(el);
    }
    return el;
  }

  function liveSlot() {
    return document.getElementById("sn-live");
  }

  function makeBtn(id, label, primary, fn) {
    var b = document.createElement("button");
    b.type = "button";
    b.id = id;
    b.className = primary ? "primary" : "";
    b.textContent = label;
    b.addEventListener("click", fn);
    return b;
  }

  function materialize() {
    var logged = !!signedUser();
    var loginLabel = logged ? displayName() : "Login";
    var bar = actionSlot();
    bar.innerHTML = "";
    bar.appendChild(makeBtn("btn-login", loginLabel, !logged, onLogin));
    bar.appendChild(makeBtn("btn-locate", "Locate", logged, onLocate));
    if (cityOn) bar.appendChild(makeBtn("btn-earth", "Earth", false, leaveCity));
    var slot = liveSlot();
    if (slot) {
      slot.innerHTML = "";
      slot.appendChild(makeBtn("btn-login-dock", loginLabel, !logged, onLogin));
      slot.appendChild(makeBtn("btn-locate-dock", "Locate", logged, onLocate));
      if (cityOn) slot.appendChild(makeBtn("btn-earth-dock", "Earth", false, leaveCity));
    }
  }

  function onLogin(e) {
    try {
      if (e) e.preventDefault();
    } catch (_) {}
    ensureAuth(function () {
      try {
        if (G.SNAuth && typeof SNAuth.toggle === "function") {
          SNAuth.toggle()
            .then(function () {
              materialize();
              say(signedUser() ? "In · " + displayName() : "Signed out");
            })
            .catch(function (err) {
              say(String((err && err.message) || err || "Login busy"));
              materialize();
            });
          return;
        }
      } catch (_) {}
      say("Login · Google client not ready on this origin");
    });
  }

  function ensureAuth(cb) {
    if (G.SNAuth) {
      try {
        if (typeof SNAuth.init === "function") SNAuth.init();
      } catch (_) {}
      cb();
      return;
    }
    var s = document.createElement("script");
    s.src = "/js/spacenet/auth.js?v=" + BUILD;
    s.onload = function () {
      try {
        if (G.SNAuth && SNAuth.init) SNAuth.init();
      } catch (_) {}
      cb();
    };
    s.onerror = function () {
      say("Login module missing");
      cb();
    };
    (document.head || document.documentElement).appendChild(s);
  }

  function onLocate() {
    hideLeaflet();
    say("Locate\u2026");
    if (!navigator.geolocation) {
      say("No GPS \u00b7 city from camera");
      enterCity(cameraOrigin(), "camera");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      function (p) {
        enterCity({ lat: p.coords.latitude, lng: p.coords.longitude, source: "gps" }, "gps");
      },
      function () {
        say("Locate denied \u00b7 city from camera");
        enterCity(cameraOrigin(), "camera");
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
    );
  }

  function cameraOrigin() {
    try {
      if (G.SNGlobe && typeof SNGlobe.viewLatLng === "function") {
        var v = SNGlobe.viewLatLng();
        if (v && isFinite(v.lat)) return { lat: +v.lat, lng: +v.lng, source: "camera" };
      }
    } catch (_) {}
    return { lat: NAIROBI.lat, lng: NAIROBI.lng, source: "nairobi" };
  }

  function enterCity(o, why) {
    origin = o;
    cityLat = o.lat;
    cityLng = o.lng;
    cityZ = 15;
    cityOn = true;
    try {
      if (G.SNGlobe && typeof SNGlobe.viewLatLng === "function") SNGlobe.viewLatLng(o.lat, o.lng, 15);
    } catch (_) {}
    showCityMap();
    materialize();
    say("City \u00b7 " + o.lat.toFixed(4) + "," + o.lng.toFixed(4) + " \u00b7 " + (why === "gps" ? "GPS" : "camera"));
    hunt(o);
  }

  function leaveCity() {
    cityOn = false;
    var m = document.getElementById("sn-citymap");
    if (m) m.classList.remove("on");
    var p = document.getElementById("sn-city-pins");
    if (p) p.innerHTML = "";
    var lst = document.getElementById("sn-city-list");
    if (lst) {
      lst.classList.remove("on");
      lst.innerHTML = "";
    }
    var h = document.getElementById("sn-city-hud");
    if (h) h.textContent = "";
    closeSheet();
    materialize();
    say("Earth");
    try {
      if (G.SN && typeof SN.run === "function") {
        /* already in wrap; seat via globe */
      }
      if (G.SNGlobe && typeof SNGlobe.viewLatLng === "function") {
        var z = origin && origin.source === "gps" ? 8 : 8;
        SNGlobe.viewLatLng(cityLat, cityLng, z);
      }
    } catch (_) {}
  }

  function showCityMap() {
    hideLeaflet();
    var wrap = document.getElementById("sn-citymap");
    if (!wrap) {
      wrap = document.createElement("div");
      wrap.id = "sn-citymap";
      canvas = document.createElement("canvas");
      wrap.appendChild(canvas);
      var dock = document.getElementById("dock");
      (document.body || document.documentElement).insertBefore(wrap, dock || null);
      bindCityInput();
    } else {
      canvas = wrap.querySelector("canvas");
    }
    wrap.classList.add("on");
    sizeCity();
    paintCity();
    paintPins();
    var nKick = 0;
    var kick = setInterval(function () {
      nKick++;
      if (!cityOn || nKick > 24) {
        clearInterval(kick);
        return;
      }
      paintCity();
    }, 350);
    setHud("City map · pan · tap a shop");
  }

  function setHud(t) {
    var el = document.getElementById("sn-city-hud");
    if (!el) {
      el = document.createElement("div");
      el.id = "sn-city-hud";
      (document.body || document.documentElement).appendChild(el);
    }
    el.textContent = t || "";
  }

  function sizeCity() {
    if (!canvas) return;
    dpr = Math.min(2, G.devicePixelRatio || 1);
    var w = Math.max(1, Math.floor((G.innerWidth || 320) * dpr));
    var h = Math.max(1, Math.floor((G.innerHeight || 480) * dpr));
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
      canvas.style.width = (G.innerWidth || 320) + "px";
      canvas.style.height = (G.innerHeight || 480) + "px";
    }
    ctx = canvas.getContext("2d");
  }

  function mercX(lng, z) {
    return ((lng + 180) / 360) * Math.pow(2, z);
  }
  function mercY(lat, z) {
    var s = Math.sin((Math.max(-85.051, Math.min(85.051, lat)) * Math.PI) / 180);
    return (0.5 - Math.log((1 + s) / (1 - s)) / (4 * Math.PI)) * Math.pow(2, z);
  }
  function tileUrl(z, x, y, kind) {
    if (kind === 1) {
      return "https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/" + z + "/" + y + "/" + x;
    }
    if (kind === 2) {
      return "https://a.basemaps.cartocdn.com/rastertiles/voyager/" + z + "/" + x + "/" + y + ".png";
    }
    return "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/" + z + "/" + y + "/" + x;
  }
  function loadTile(z, x, y) {
    var key = z + "/" + x + "/" + y;
    if (tileCache[key]) return tileCache[key];
    var img = new Image();
    tileCache[key] = img;
    var kind = 0;
    function tryKind() {
      img.onload = function () {
        if (cityOn) paintCity();
      };
      img.onerror = function () {
        kind += 1;
        if (kind > 2) return;
        tryKind();
      };
      img.src = tileUrl(z, x, y, kind);
    }
    tryKind();
    return img;
  }

  function paintCity() {
    if (!cityOn || !canvas || !ctx) return;
    sizeCity();
    var w = canvas.width;
    var h = canvas.height;
    ctx.fillStyle = "#02040a";
    ctx.fillRect(0, 0, w, h);
    var z = Math.round(cityZ);
    var cx = mercX(cityLng, z);
    var cy = mercY(cityLat, z);
    var tw = 256 * dpr;
    var n = Math.pow(2, z);
    var px = w / 2 - (cx - Math.floor(cx)) * tw;
    var py = h / 2 - (cy - Math.floor(cy)) * tw;
    var x0 = Math.floor(cx) - Math.ceil(w / tw) - 1;
    var y0 = Math.floor(cy) - Math.ceil(h / tw) - 1;
    var x1 = Math.floor(cx) + Math.ceil(w / tw) + 1;
    var y1 = Math.floor(cy) + Math.ceil(h / tw) + 1;
    var x, y;
    for (y = y0; y <= y1; y++) {
      if (y < 0 || y >= n) continue;
      for (x = x0; x <= x1; x++) {
        var tx = ((x % n) + n) % n;
        var img = loadTile(z, tx, y);
        var dx = px + (x - Math.floor(cx)) * tw;
        var dy = py + (y - Math.floor(cy)) * tw;
        if (img && img.naturalWidth) {
          try {
            ctx.drawImage(img, dx, dy, tw, tw);
          } catch (_) {}
        }
      }
    }
  }

  function shopCss(lat, lng) {
    var z = Math.round(cityZ);
    var dx = (mercX(lng, z) - mercX(cityLng, z)) * 256;
    var dy = (mercY(lat, z) - mercY(cityLat, z)) * 256;
    return { left: (G.innerWidth || 320) / 2 + dx, top: (G.innerHeight || 480) / 2 + dy };
  }

  function bindCityInput() {
    if (!canvas || canvas.__snCityBound) return;
    canvas.__snCityBound = 1;
    canvas.addEventListener("pointerdown", function (e) {
      dragging = true;
      lx = e.clientX;
      ly = e.clientY;
      try {
        canvas.setPointerCapture(e.pointerId);
      } catch (_) {}
    });
    canvas.addEventListener("pointermove", function (e) {
      if (!dragging) return;
      var k = 360 / (256 * Math.pow(2, cityZ));
      cityLng += (lx - e.clientX) * k;
      var latK = k * Math.cos((cityLat * Math.PI) / 180);
      cityLat -= (e.clientY - ly) * latK;
      if (cityLat > 80) cityLat = 80;
      if (cityLat < -80) cityLat = -80;
      lx = e.clientX;
      ly = e.clientY;
      paintCity();
      paintPins();
    });
    function up() {
      dragging = false;
    }
    canvas.addEventListener("pointerup", up);
    canvas.addEventListener("pointercancel", up);
    canvas.addEventListener(
      "wheel",
      function (e) {
        e.preventDefault();
        cityZ = Math.max(12, Math.min(18, cityZ + (e.deltaY > 0 ? -0.4 : 0.4)));
        paintCity();
        paintPins();
      },
      { passive: false }
    );
  }

  function pinRoot() {
    var el = document.getElementById("sn-city-pins");
    if (!el) {
      el = document.createElement("div");
      el.id = "sn-city-pins";
      (document.body || document.documentElement).appendChild(el);
    }
    return el;
  }

  function paintPins() {
    var root = pinRoot();
    if (!cityOn) {
      root.innerHTML = "";
      paintList();
      return;
    }
    root.innerHTML = "";
    var placed = [];
    var vis = 0;
    shops.forEach(function (shop, i) {
      var p = shopCss(shop.lat, shop.lng);
      if (p.left < -40 || p.top < 40 || p.left > (G.innerWidth || 320) + 40 || p.top > (G.innerHeight || 480) - 40) return;
      var g = 0;
      while (g < 14) {
        var hit = false;
        var k;
        for (k = 0; k < placed.length; k++) {
          if (Math.abs(placed[k].left - p.left) < 88 && Math.abs(placed[k].top - p.top) < 40) {
            hit = true;
            break;
          }
        }
        if (!hit) break;
        p.top -= 38;
        p.left += g % 2 ? 22 : -22;
        g++;
      }
      if (vis >= 16) return;
      vis++;
      placed.push({ left: p.left, top: p.top });
      var btn = document.createElement("button");
      btn.type = "button";
      btn.setAttribute("data-sn-city-pin", String(i));
      if (shop.menu) btn.className = "has-menu";
      var km = isFinite(shop.km) ? shop.km.toFixed(1) + " km" : "";
      btn.appendChild(document.createElement("b")).textContent = shop.name;
      var sp = document.createElement("span");
      sp.textContent = km + (shop.menu ? " · menu" : "");
      btn.appendChild(sp);
      btn.style.left = p.left.toFixed(1) + "px";
      btn.style.top = p.top.toFixed(1) + "px";
      btn.addEventListener("click", function (ev) {
        ev.preventDefault();
        ev.stopPropagation();
        openVendor(shop);
      });
      root.appendChild(btn);
    });
    paintList();
  }

  function listRoot() {
    var el = document.getElementById("sn-city-list");
    if (!el) {
      el = document.createElement("div");
      el.id = "sn-city-list";
      (document.body || document.documentElement).appendChild(el);
    }
    return el;
  }

  function paintList() {
    var el = listRoot();
    if (!cityOn || !shops.length) {
      el.classList.remove("on");
      el.innerHTML = "";
      return;
    }
    el.classList.add("on");
    el.innerHTML = "";
    shops.slice(0, 24).forEach(function (shop) {
      var b = document.createElement("button");
      b.type = "button";
      if (shop.menu) b.className = "has-menu";
      b.appendChild(document.createElement("b")).textContent = shop.name;
      var sp = document.createElement("span");
      var km = isFinite(shop.km) ? shop.km.toFixed(1) + " km" : "";
      sp.textContent = km + (shop.menu ? " · published menu" : " · details");
      b.appendChild(sp);
      b.addEventListener("click", function (ev) {
        ev.preventDefault();
        ev.stopPropagation();
        openVendor(shop);
      });
      el.appendChild(b);
    });
  }

  function overpassLandQL(lat, lng) {
    var around = "(around:20000," + Number(lat).toFixed(5) + "," + Number(lng).toFixed(5) + ")";
    return (
      "[out:json][timeout:18];(" +
      'node["amenity"="restaurant"]["cuisine"~"pizza",i]' +
      around +
      ";" +
      'node["amenity"="fast_food"]["cuisine"~"pizza",i]' +
      around +
      ";" +
      'node["amenity"="restaurant"]["name"~"[Pp]izza"]' +
      around +
      ";" +
      'node["amenity"="fast_food"]["name"~"[Pp]izza"]' +
      around +
      ";" +
      ");out center 80;"
    );
  }

  async function fetchOverpassOnce(url, body, ms) {
    async function one(method) {
      var ctrl = typeof AbortController !== "undefined" ? new AbortController() : null;
      var to = setTimeout(function () {
        try {
          if (ctrl) ctrl.abort();
        } catch (_) {}
      }, ms);
      try {
        var href = url;
        var opts = { method: method, signal: ctrl ? ctrl.signal : undefined, mode: "cors", credentials: "omit", cache: "no-store" };
        if (method === "POST") {
          opts.headers = { "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8" };
          opts.body = "data=" + encodeURIComponent(body);
        } else {
          href = url + (url.indexOf("?") >= 0 ? "&" : "?") + "data=" + encodeURIComponent(body);
        }
        return (await fetch(href, opts)) || null;
      } catch (_) {
        return null;
      } finally {
        try {
          clearTimeout(to);
        } catch (_) {}
      }
    }
    var gotP = one("GET");
    var postP = one("POST");
    return await new Promise(function (resolve) {
      var left = 2;
      var leftover = null;
      function slot(p) {
        Promise.resolve(p).then(function (res) {
          if (res && res.ok) {
            resolve(res);
            left = -9;
            return;
          }
          if (res) leftover = leftover || res;
          left--;
          if (left === 0) resolve(leftover);
        });
      }
      slot(gotP);
      slot(postP);
    });
  }

  function osmElToShop(e) {
    if (!e) return null;
    var lat = e.lat != null ? +e.lat : e.center && e.center.lat != null ? +e.center.lat : null;
    var lng = e.lon != null ? +e.lon : e.center && e.center.lon != null ? +e.center.lon : null;
    if (!isFinite(lat) || !isFinite(lng)) return null;
    var tags = e.tags || {};
    var name = tags.name || tags.brand || tags["name:en"] || "";
    if (!name || /^(fast food|restaurant|cafe|bar|pub)$/i.test(name)) return null;
    var shop = {
      id: "osm-" + (e.type || "n") + "-" + e.id,
      osm_id: e.id,
      name: name,
      lat: lat,
      lng: lng,
      amenity: tags.amenity || "",
      cuisine: tags.cuisine || "",
      phone: tags.phone || tags["contact:phone"] || "",
      website: tags.website || tags["contact:website"] || "",
      addr: [tags["addr:housenumber"], tags["addr:street"], tags["addr:city"]].filter(Boolean).join(" "),
      hours: tags.opening_hours || "",
      source: "overpass",
    };
    shop.km = haversineKm(origin, shop);
    shop.menu = matchMenu(shop);
    return shop;
  }

  async function queryOverpassQL(body) {
    var lastErr = null;
    var sawOk = false;
    return await new Promise(function (resolve, reject) {
      var pending = OVERPASS_ENDPOINTS.length;
      var done = false;
      OVERPASS_ENDPOINTS.forEach(function (url) {
        fetchOverpassOnce(url, body, OVERPASS_FETCH_MS)
          .then(function (res) {
            if (done) return null;
            if (!res || !res.ok) {
              lastErr = new Error("overpass HTTP " + (res ? res.status : "fail"));
              return null;
            }
            return res.json().then(function (j) {
              if (done) return;
              sawOk = true;
              var rows = [];
              ((j && j.elements) || []).forEach(function (el) {
                var s = osmElToShop(el);
                if (s) rows.push(s);
              });
              if (rows.length) {
                done = true;
                resolve(rows);
              }
            });
          })
          .catch(function (e) {
            lastErr = e;
          })
          .then(function () {
            if (done) return;
            pending--;
            if (pending > 0) return;
            if (sawOk) resolve([]);
            else reject(lastErr || new Error("overpass failed"));
          });
      });
    });
  }

  async function hunt(o) {
    huntGen++;
    var gen = huntGen;
    hunting = true;
    say("OSM hunt \u00b7 city \u00b7 no fake shops");
    setHud("Finding OSM pizza\u2026");
    try {
      var rows = await queryOverpassQL(overpassLandQL(o.lat, o.lng));
      if (gen !== huntGen) return;
      var seen = {};
      shops = [];
      (rows || []).forEach(function (s) {
        var k = s.osm_id || s.name + s.lat.toFixed(4);
        if (seen[k]) return;
        seen[k] = 1;
        s.km = haversineKm(o, s);
        s.menu = matchMenu(s);
        shops.push(s);
      });
      shops.sort(function (a, b) {
        if (!!b.menu - !!a.menu) return !!b.menu - !!a.menu;
        return a.km - b.km;
      });
      shops = shops.slice(0, 40);
      try {
        if (G.SNGlobe && typeof SNGlobe.pulse === "function") {
          shops.forEach(function (s) {
            SNGlobe.pulse(s.lat, s.lng, { color: s.menu ? "#d8f6ff" : "#4df0ff" });
          });
        }
      } catch (_) {}
      paintPins();
      var withMenu = shops.filter(function (s) {
        return s.menu;
      }).length;
      var msg = "City \u00b7 " + shops.length + " OSM pizza \u00b7 " + withMenu + " with published menus \u00b7 tap a pin";
      say(msg);
      setHud(msg);
    } catch (e) {
      if (gen !== huntGen) return;
      say("Hunt failed");
      setHud("Hunt failed \u00b7 try Locate again");
    } finally {
      if (gen === huntGen) hunting = false;
    }
  }

  function sheetEl() {
    var el = document.getElementById("sn-sheet");
    if (!el) {
      el = document.createElement("div");
      el.id = "sn-sheet";
      el.setAttribute("role", "dialog");
      (document.body || document.documentElement).appendChild(el);
    }
    return el;
  }

  function closeSheet() {
    var el = document.getElementById("sn-sheet");
    if (el) el.classList.remove("on");
    activeShop = null;
  }

  function pickedSize(item) {
    var name = pickMap[item.id];
    var i;
    for (i = 0; i < item.sizes.length; i++) if (item.sizes[i].s === name) return item.sizes[i];
    return item.sizes[item.sizes.length > 2 ? 2 : item.sizes.length - 1];
  }

  function qtyOf(id) {
    var i;
    for (i = 0; i < cart.length; i++) if (cart[i].id === id) return cart[i].qty;
    return 0;
  }

  function setQty(item, size, n) {
    var id = item.id + ":" + size.s;
    n = Math.max(0, n);
    var i;
    for (i = 0; i < cart.length; i++) {
      if (cart[i].id === id) {
        if (n === 0) cart.splice(i, 1);
        else cart[i].qty = n;
        return;
      }
    }
    if (n > 0) {
      cart.push({
        id: id,
        name: item.name + " \u00b7 " + size.s,
        price: size.p,
        currency: (activeShop && activeShop.menu && activeShop.menu.currency) || "KES",
        qty: n,
        shop: activeShop && activeShop.name,
      });
    }
  }

  function cartTotal() {
    var t = 0;
    cart.forEach(function (c) {
      t += c.price * c.qty;
    });
    return t;
  }
  function cartCur() {
    return (cart[0] && cart[0].currency) || "KES";
  }
  function cartCount() {
    var n = 0;
    cart.forEach(function (c) {
      n += c.qty;
    });
    return n;
  }

  function openVendor(shop) {
    if (!activeShop || activeShop.id !== shop.id) {
      cart = [];
      pickMap = {};
    }
    activeShop = shop;
    var el = sheetEl();
    var menu = shop.menu;
    var hero = menu ? menu.photo : IMG.marg;
    var html =
      '<div class="hero"><img src="' +
      hero +
      '" alt=""><button type="button" class="x" id="sn-sheet-x">Close</button></div><div class="body">';
    html += "<h2>" + escapeHtml(shop.name) + "</h2>";
    html +=
      '<div class="meta">' +
      (isFinite(shop.km) ? shop.km.toFixed(1) + " km" : "") +
      (shop.addr ? " \u00b7 " + escapeHtml(shop.addr) : "") +
      (shop.cuisine ? " \u00b7 " + escapeHtml(shop.cuisine) : "") +
      (menu ? " \u00b7 " + escapeHtml(menu.source) : "") +
      "</div>";
    if (!menu) {
      html +=
        '<div class="empty">No public menu posted for this shop. ' +
        (shop.website
          ? '<a href="' + escapeHtml(shop.website) + '" target="_blank" rel="noopener">Open their site</a>.'
          : "Only chains with a published online menu can be ordered here.") +
        (shop.phone ? "<br>" + escapeHtml(shop.phone) : "") +
        (shop.hours ? "<br>" + escapeHtml(shop.hours) : "") +
        "</div>";
    } else {
      menu.groups.forEach(function (g) {
        html += "<h3>" + escapeHtml(g.title) + "</h3>";
        g.items.forEach(function (it) {
          var size = pickedSize(it);
          var id = it.id + ":" + size.s;
          html += '<div class="row" data-item="' + escapeHtml(it.id) + '">';
          html += '<img src="' + it.photo + '" alt="">';
          html += "<div><b>" + escapeHtml(it.name) + "</b><p>" + escapeHtml(it.detail) + "</p>";
          if (it.sizes.length > 1) {
            html += '<div class="sizes">';
            it.sizes.forEach(function (sz) {
              html +=
                '<button type="button" class="' +
                (sz.s === size.s ? "on" : "") +
                '" data-pick="' +
                escapeHtml(it.id) +
                '" data-size="' +
                escapeHtml(sz.s) +
                '">' +
                escapeHtml(sz.s) +
                " \u00b7 " +
                money(sz.p, menu.currency) +
                "</button>";
            });
            html += "</div>";
          }
          html +=
            '<div class="qty"><span class="price" data-price="' +
            escapeHtml(it.id) +
            '">' +
            money(size.p, menu.currency) +
            '</span><button type="button" data-minus="' +
            escapeHtml(it.id) +
            '">\u2212</button><span data-qty="' +
            escapeHtml(it.id) +
            '">' +
            qtyOf(id) +
            '</span><button type="button" data-plus="' +
            escapeHtml(it.id) +
            '">+</button></div></div></div>';
        });
      });
    }
    html += "</div>";
    html +=
      '<div class="foot"><button type="button" id="sn-order"' +
      (menu ? "" : " disabled") +
      ">Order</button></div>";
    el.innerHTML = html;
    el.classList.add("on");
    var xbtn = el.querySelector("#sn-sheet-x");
    if (xbtn) xbtn.onclick = closeSheet;
    el.onclick = onSheetClick;
    var ob = el.querySelector("#sn-order");
    if (ob) ob.onclick = onOrder;
    refreshSheetFoot();
  }

  function onSheetClick(e) {
    var t = e.target;
    if (!t || !activeShop || !activeShop.menu) return;
    var pick = t.getAttribute && t.getAttribute("data-pick");
    if (pick) {
      pickMap[pick] = t.getAttribute("data-size");
      openVendor(activeShop);
      return;
    }
    var plus = t.getAttribute && t.getAttribute("data-plus");
    var minus = t.getAttribute && t.getAttribute("data-minus");
    var itemId = plus || minus;
    if (!itemId) return;
    var found = null;
    activeShop.menu.groups.forEach(function (g) {
      g.items.forEach(function (it) {
        if (it.id === itemId) found = it;
      });
    });
    if (!found) return;
    var size = pickedSize(found);
    var key = found.id + ":" + size.s;
    var n = qtyOf(key) + (plus ? 1 : -1);
    setQty(found, size, n);
    var span = document.querySelector('[data-qty="' + found.id.replace(/"/g, "") + '"]');
    if (span) span.textContent = String(qtyOf(key));
    refreshSheetFoot();
  }

  function refreshSheetFoot() {
    var ob = document.getElementById("sn-order");
    if (!ob) return;
    var n = cartCount();
    ob.textContent = n ? "Order \u00b7 " + n + " \u00b7 " + money(cartTotal(), cartCur()) : "Order";
    ob.disabled = !n;
  }

  function onOrder(e) {
    try {
      e.preventDefault();
    } catch (_) {}
    if (!cart.length) {
      say("Cart empty");
      return;
    }
    showDrivers();
  }

  function showDrivers() {
    var el = sheetEl();
    var name = displayName();
    var av = avatarOf();
    var lines = cart
      .map(function (c) {
        return c.qty + " \u00d7 " + escapeHtml(c.name) + " \u00b7 " + money(c.price * c.qty, c.currency);
      })
      .join("<br>");
    el.innerHTML =
      '<div class="hero"><img src="' +
      IMG.bbq +
      '" alt=""><button type="button" class="x" id="sn-sheet-x">Close</button></div>' +
      '<div class="body"><h2>Available drivers</h2>' +
      '<div class="meta">No fake fleet. Only you.</div>' +
      '<div class="driver">' +
      (av ? '<img src="' + escapeHtml(av) + '" alt="">' : '<div class="av"></div>') +
      "<div><b>" +
      escapeHtml(name) +
      "</b><p>You \u00b7 available now</p><p>" +
      lines +
      "<br>" +
      money(cartTotal(), cartCur()) +
      "</p></div></div></div>" +
      '<div class="foot"><button type="button" id="sn-ack">I will take this</button></div>';
    el.classList.add("on");
    el.querySelector("#sn-sheet-x").onclick = closeSheet;
    el.querySelector("#sn-ack").onclick = function () {
      say("You \u00b7 driver \u00b7 " + money(cartTotal(), cartCur()) + " \u00b7 camera stays");
      closeSheet();
    };
  }

  function escapeHtml(s) {
    return String(s || "").replace(/[&<>"]/g, function (ch) {
      if (ch === "&") return "&" + "amp;";
      if (ch === "<") return "&" + "lt;";
      if (ch === ">") return "&" + "gt;";
      return "&" + "quot;";
    });
  }

  function wrapRun() {
    try {
      var SN = G.SN;
      if (!SN || typeof SN.run !== "function" || SN.run.__snCityManual) return;
      var prev = SN.run.bind(SN);
      var wrap = function (raw) {
        var t = String(raw || "").trim();
        var low = t.toLowerCase();
        if (low === "login" || low === "sign in") return onLogin();
        if (low === "locate" || low === "gps") return onLocate();
        if (low === "pizza" || /^pizza\b/.test(low) || low === "pizzeria" || low === "city" || low === "map") {
          enterCity(cameraOrigin(), "camera");
          return;
        }
        if (low === "earth" || low === "globe") {
          leaveCity();
          return prev(raw);
        }
        return prev(raw);
      };
      wrap.__snCityManual = 1;
      wrap.__snEarth = 1;
      wrap.__snPizzaCam = 1;
      SN.run = wrap;
    } catch (_) {}
  }

  function boot() {
    injectCss();
    hideLeaflet();
    materialize();
    wrapRun();
    ensureAuth(function () {
      materialize();
    });
    G.addEventListener("resize", function () {
      if (cityOn) {
        paintCity();
        paintPins();
      }
    });
  }

  boot();
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  setInterval(function () {
    hideLeaflet();
    wrapRun();
    if (!document.getElementById("btn-locate")) materialize();
  }, 1500);

  G.SNCityManual = {
    build: BUILD,
    locate: onLocate,
    login: onLogin,
    city: function () {
      enterCity(cameraOrigin(), "camera");
    },
    shops: function () {
      return shops.slice();
    },
  };
})(typeof window !== "undefined" ? window : globalThis);
