/* SpaceNet 4184 — JOBS stays left. No park nudge. */
(function () {
  if (window.__snJobsPin4184) return;
  window.__snJobsPin4184 = true;
  function css() {
    if (document.getElementById("sn-jobs-pin-css")) return;
    var s = document.createElement("style"); s.id = "sn-jobs-pin-css";
    s.textContent = "#sn-tasks-btn{position:fixed!important;top:calc(max(8px,env(safe-area-inset-top)) + 52px)!important;left:3.6rem!important;right:auto!important;transform:none!important;margin:0!important}";
    document.head.appendChild(s);
  }
  function pin() {
    var b = document.getElementById("sn-tasks-btn");
    if (!b) return;
    b.style.left = "3.6rem";
    b.style.right = "auto";
    b.style.transform = "none";
    b.style.top = "calc(max(8px, env(safe-area-inset-top)) + 52px)";
    b.classList.remove("loose", "drag", "o");
    if (b.textContent && /^JOBS\s+\d+/.test(b.textContent.trim())) b.textContent = "JOBS";
  }
  css(); pin(); setInterval(pin, 400);
})();
