/* SpaceNet 4154 — bigger + and mic, clear emojis, no auto voice. */
(function () {
  if (window.__snPlusMic) return;
  window.__snPlusMic = true;
  window.__snEarArmed = false;
  function css() {
    if (document.getElementById("sn-pm-css")) return;
    var s = document.createElement("style"); s.id = "sn-pm-css";
    s.textContent = "#dock .hub button,#plus,#go{width:44px!important;height:44px!important;min-width:44px;min-height:44px;font-size:22px!important;line-height:44px;padding:0!important;border-radius:999px!important}#plus,#go{display:flex;align-items:center;justify-content:center}";
    document.head.appendChild(s);
  }
  function icons() {
    var plus = document.getElementById("plus");
    if (plus) { plus.textContent = "➕"; plus.setAttribute("aria-label", "Post a job"); }
    var go = document.getElementById("go");
    if (go) { go.textContent = "🎤"; go.setAttribute("aria-label", "Voice"); }
  }
  function armGo() {
    var go = document.getElementById("go");
    if (!go || go.__pm) return;
    go.__pm = true;
    go.addEventListener("click", function () { window.__snEarArmed = true; }, true);
  }
  function wrapSR() {
    var Rec = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Rec || Rec.__pm) return;
    function Wrap() {
      var r = new Rec();
      var start = r.start.bind(r);
      r.start = function () { if (!window.__snEarArmed) return; return start(); };
      return r;
    }
    Wrap.__pm = true;
    window.SpeechRecognition = Wrap;
    window.webkitSpeechRecognition = Wrap;
  }
  function wrapGum() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia || navigator.mediaDevices.getUserMedia.__pm) return;
    var gum = navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices);
    navigator.mediaDevices.getUserMedia = function (c) {
      if (c && c.audio && !c.video && !window.__snEarArmed) {
        return Promise.reject(new DOMException("mic waits for tap", "NotAllowedError"));
      }
      return gum(c);
    };
    navigator.mediaDevices.getUserMedia.__pm = true;
  }
  function boot() { css(); icons(); armGo(); wrapSR(); wrapGum(); }
  boot();
  try { if (window.speechSynthesis) speechSynthesis.cancel(); } catch (e) {}
  setInterval(boot, 1500);
})();
