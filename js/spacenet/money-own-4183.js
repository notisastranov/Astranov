/* SpaceNet 4183 — only your AV€, and only after login. */
(function () {
  if (window.__snMoneyOwn4183) return;
  window.__snMoneyOwn4183 = true;
  var OWNER = "notisastranov@gmail.com";
  function read(k, d) { try { var v = localStorage.getItem(k); return v == null ? d : v; } catch (e) { return d; } }
  function user() { try { return JSON.parse(read("sn:user", "null") || "null"); } catch (e) { return null; } }
  function email() { var u = user(); return String((u && (u.email || u.user_email || u.mail)) || "").toLowerCase(); }
  function in_() { return !!email(); }
  function isOwner() { return email() === OWNER; }
  function key() { return "sn:avc:" + email(); }
  function mine() {
    if (!in_()) return 0;
    var raw = read(key(), "");
    var n = Number(raw);
    if (raw !== "" && isFinite(n) && n >= 0) return n;
    if (isOwner()) return Math.max(0, Number(read("sn:pool", "0")) || 0, Number(read("sn:avc", "0")) || 0);
    var shared = Number(read("sn:avc", "0")) || 0;
    if (shared >= 100000) return 0;
    return Math.max(0, shared);
  }
  function paint() {
    var btn = document.getElementById("sn-money");
    if (!btn) return;
    if (!in_()) { btn.style.display = "none"; btn.textContent = ""; btn.title = "Sign in to see your AV€."; return; }
    btn.style.display = "inline-flex";
    var n = mine();
    btn.textContent = "AV€ " + (Math.round(n * 100) / 100).toFixed(n >= 10 ? 0 : 2);
    btn.title = isOwner() ? "Your pool. Only you see this." : "Your AV€. Only you see this.";
  }
  if (email() && email() !== OWNER && read("sn:owner") === "1") { try { localStorage.removeItem("sn:owner"); } catch (e) {} }
  if (!in_()) { try { if (Number(read("sn:avc", "0")) >= 100000) localStorage.setItem("sn:avc", "0"); } catch (e) {} }
  function wrap() {
    if (window.SNWallet && SNWallet.paint && !SNWallet.paint.__m4183) {
      var p = SNWallet.paint;
      SNWallet.paint = function () { paint(); try { p.apply(this, arguments); } catch (e) {} paint(); };
      SNWallet.paint.__m4183 = true;
    }
  }
  paint(); wrap(); setInterval(function () { wrap(); paint(); }, 1200);
})();
