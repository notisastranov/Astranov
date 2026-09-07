/* SpaceNet 4195 — #sn-tasks-btn stays JOBS. app.js/approvals/task-throw still write TASKS; intercept so it never flashes. */
(function () {
  if (window.__SN_JOBS_LABEL_4195) return;
  window.__SN_JOBS_LABEL_4195 = true;

  var desc = Object.getOwnPropertyDescriptor(Node.prototype, "textContent");
  if (!desc || !desc.get || !desc.set) return;

  function jobsLabel(v) {
    var s = String(v == null ? "" : v);
    s = s.replace(/TASKS/gi, "JOBS");
    if (!String(s).replace(/\s/g, "")) s = "JOBS";
    return s;
  }

  function freeze(b) {
    if (!b) return;
    if (!b.__snJobsLabel) {
      b.__snJobsLabel = true;
      Object.defineProperty(b, "textContent", {
        configurable: true,
        enumerable: true,
        get: function () {
          return desc.get.call(this);
        },
        set: function (v) {
          desc.set.call(this, jobsLabel(v));
        },
      });
    }
    var now = desc.get.call(b);
    var next = jobsLabel(now);
    if (now !== next) desc.set.call(b, next);
  }

  function tick() {
    freeze(document.getElementById("sn-tasks-btn"));
  }

  tick();
  setInterval(tick, 200);
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", tick);
})();
