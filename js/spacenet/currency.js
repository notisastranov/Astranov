/**
 * S - SpaceNets currency (SPECS A5)
 * Unit of account on SpaceNet. Dynamic value vs fiat/crypto/other money,
 * tightly coupled to SpaceNet network value - not AVC, not a fixed EUR coin.
 */
(function (global) {
  "use strict";

  var STORAGE_KEY = "spacenet_currency_v1";
  var SYMBOL = "S";
  var NAME = "SpaceNets";
  var TICKER = "S";

  var state = {
    networkIndex: 1.0,
    lastUpdated: 0,
    quotes: {
      EUR: 1.0,
      USD: 1.08,
      BTC: 0.000015,
      ETH: 0.00025
    }
  };

  function load() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      var data = JSON.parse(raw);
      if (data && typeof data.networkIndex === "number" && data.networkIndex > 0) {
        state.networkIndex = data.networkIndex;
      }
      if (data && data.quotes && typeof data.quotes === "object") {
        Object.keys(data.quotes).forEach(function (k) {
          if (typeof data.quotes[k] === "number" && data.quotes[k] > 0) {
            state.quotes[k] = data.quotes[k];
          }
        });
      }
      if (data && data.lastUpdated) state.lastUpdated = data.lastUpdated;
    } catch (e) {
      /* ignore */
    }
  }

  function save() {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          networkIndex: state.networkIndex,
          quotes: state.quotes,
          lastUpdated: state.lastUpdated
        })
      );
    } catch (e) {
      /* ignore */
    }
  }

  function recomputeQuotes() {
    var n = state.networkIndex;
    state.quotes.EUR = n * 1.0;
    state.quotes.USD = n * 1.08;
    state.quotes.BTC = n * 0.000015;
    state.quotes.ETH = n * 0.00025;
    state.lastUpdated = Date.now();
    save();
  }

  function format(amountS, opts) {
    opts = opts || {};
    var n = Number(amountS);
    if (!isFinite(n)) n = 0;
    var digits = opts.digits != null ? opts.digits : 2;
    var body = n.toFixed(digits);
    if (opts.compact) return body + " " + SYMBOL;
    return body + " " + SYMBOL;
  }

  function formatPair(amountS, fiatCode) {
    fiatCode = (fiatCode || "EUR").toUpperCase();
    var s = format(amountS);
    var rate = state.quotes[fiatCode];
    if (!rate || !isFinite(rate)) return s;
    var fiat = (Number(amountS) * rate).toFixed(2);
    return s + " (~" + fiat + " " + fiatCode + ")";
  }

  function parseAmount(raw) {
    if (raw == null) return 0;
    if (typeof raw === "number") return isFinite(raw) ? raw : 0;
    var s = String(raw).trim().replace(/,/g, ".");
    s = s.replace(/\s*(S|SpaceNets|EUR|€|\$|USD)\s*/gi, "");
    s = s.replace(/[^\d.-]/g, "");
    var n = parseFloat(s);
    return isFinite(n) ? n : 0;
  }

  function fromFiat(amountFiat, fiatCode) {
    fiatCode = (fiatCode || "EUR").toUpperCase();
    var rate = state.quotes[fiatCode] || state.quotes.EUR || 1;
    if (!rate) rate = 1;
    return Number(amountFiat) / rate;
  }

  function toFiat(amountS, fiatCode) {
    fiatCode = (fiatCode || "EUR").toUpperCase();
    var rate = state.quotes[fiatCode] || state.quotes.EUR || 1;
    return Number(amountS) * rate;
  }

  function setNetworkIndex(index) {
    var n = Number(index);
    if (!isFinite(n) || n <= 0) return false;
    state.networkIndex = n;
    recomputeQuotes();
    return true;
  }

  function bumpNetwork(deltaPct) {
    var d = Number(deltaPct);
    if (!isFinite(d)) return state.networkIndex;
    state.networkIndex = Math.max(0.0001, state.networkIndex * (1 + d / 100));
    recomputeQuotes();
    return state.networkIndex;
  }

  function statusLines() {
    return [
      "Currency: " + NAME + " (" + SYMBOL + ")",
      "Unit: S = SpaceNets (dynamic, network-linked)",
      "Network index: " + state.networkIndex.toFixed(4),
      "1 S ~ " + state.quotes.EUR.toFixed(4) + " EUR / " + state.quotes.USD.toFixed(4) + " USD",
      "1 S ~ " + state.quotes.BTC.toExponential(3) + " BTC / " + state.quotes.ETH.toExponential(3) + " ETH",
      "Fees (gross in S): platform 3% · driver 15%",
      "Not AVC. Not a fixed coin. Value tracks SpaceNet."
    ];
  }

  load();
  if (!state.lastUpdated) recomputeQuotes();

  global.SNCurrency = {
    SYMBOL: SYMBOL,
    NAME: NAME,
    TICKER: TICKER,
    format: format,
    formatPair: formatPair,
    parse: parseAmount,
    fromFiat: fromFiat,
    toFiat: toFiat,
    quote: function (code) {
      return state.quotes[(code || "EUR").toUpperCase()] || null;
    },
    rate: function (code) {
      return this.quote(code);
    },
    networkIndex: function () {
      return state.networkIndex;
    },
    setNetworkIndex: setNetworkIndex,
    bumpNetwork: bumpNetwork,
    status: statusLines,
    fees: { platformPct: 3, driverPct: 15 }
  };
})(typeof window !== "undefined" ? window : globalThis);
