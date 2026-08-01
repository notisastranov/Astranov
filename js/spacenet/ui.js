/* SpaceNet CLI — one-finger grab ANYWHERE: move + smooth expand/retract (SPECS) */
(function (global) {
  'use strict';

  var POS_KEY = 'sn:cli-pos-v1';
  var SIZE_KEY = 'sn:cli-size-v1';

  function $(id) {
    return document.getElementById(id);
  }

  function showCoach() {
    try {
      if (localStorage.getItem('sn:coach-v1')) return;
    } catch (_) {
      return;
    }
    var el = $('coach');
    if (!el) return;
    el.hidden = false;
    $('coach-ok') &&
      $('coach-ok').addEventListener(
        'click',
        function () {
          el.hidden = true;
          try {
            localStorage.setItem('sn:coach-v1', '1');
          } catch (_) {}
          $('cli-in') && $('cli-in').focus();
        },
        { once: true }
      );
  }

  /** Default expand target: 1/3 viewport (button/AI — no drag needed) */
  function defaultMaxCliPx() {
    var h = window.innerHeight || 700;
    return Math.round(h / 3);
  }

  /** User drag may go taller than default — absolute ceiling */
  function dragMaxCliPx() {
    var h = window.innerHeight || 700;
    return Math.round(h * 0.72);
  }

  function sizePx(mode) {
    var h = window.innerHeight || 700;
    var def = defaultMaxCliPx();
    if (mode === 'collapsed') return Math.max(100, Math.min(148, Math.round(h * 0.18))); // dense bottom: ribbon+input
    // Expand button → default 1/3 (drag can override higher)
    if (mode === 'expanded') return def;
    return Math.min(Math.round(h * 0.28), def);
  }

  function currentMode(panel) {
    if (panel.classList.contains('expanded')) return 'expanded';
    if (panel.classList.contains('collapsed')) return 'collapsed';
    return 'mid';
  }

  function setSize(mode, animate) {
    var panel = $('panel');
    if (!panel) return;
    panel.classList.remove('expanded', 'collapsed', 'mid');
    if (mode === 'collapsed') panel.classList.add('collapsed');
    else if (mode === 'expanded') panel.classList.add('expanded');
    else panel.classList.add('mid');
    // Default sizes (1/3 max for expanded) — drag can leave a taller height via free style
    var px = sizePx(mode === 'expanded' ? 'expanded' : mode === 'collapsed' ? 'collapsed' : 'mid');
    panel.style.maxHeight = px + 'px';
    panel.style.height = '';
    if (animate !== false) panel.classList.add('sn-size-anim');
    try {
      localStorage.setItem(SIZE_KEY, mode);
    } catch (_) {}
  }

  function expandPanel(on) {
    if (on === true) setSize('expanded');
    else if (on === false) setSize('collapsed');
    else {
      var p = $('panel');
      var m = p ? currentMode(p) : 'mid';
      if (m === 'expanded') setSize('mid');
      else if (m === 'collapsed') setSize('mid');
      else setSize('expanded');
    }
  }

  /** Put CLI back bottom-center; clear free drag scatter */
  function resetChrome() {
    var dock = $('dock');
    var panel = $('panel');
    if (!dock || !panel) return;
    try {
      localStorage.removeItem(POS_KEY);
    } catch (_) {}
    dock.classList.remove('free');
    dock.style.left = '';
    dock.style.top = '';
    dock.style.right = '';
    dock.style.bottom = '';
    dock.style.transform = '';
    dock.style.width = '';
    dock.style.padding = '';
    panel.style.margin = '';
    panel.style.maxWidth = '';
    panel.style.width = '';
    panel.style.maxHeight = '';
    panel.style.height = '';
    setSize('mid', true);
    try {
      global.SNTile?.close?.();
    } catch (_) {}
  }

  function applyPos(dock, panel, left, top) {
    var padTop = 56;
    var padSide = 8;
    var pw = panel.offsetWidth || Math.min(540, window.innerWidth - 16);
    var ph = panel.offsetHeight || 120;
    var maxL = Math.max(padSide, window.innerWidth - pw - padSide);
    var maxT = Math.max(padTop, window.innerHeight - Math.min(ph, window.innerHeight * 0.9) - 8);
    var l = Math.min(maxL, Math.max(padSide, left));
    var t = Math.min(maxT, Math.max(padTop, top));
    dock.classList.add('free');
    dock.style.left = l + 'px';
    dock.style.top = t + 'px';
    dock.style.right = 'auto';
    dock.style.bottom = 'auto';
    dock.style.transform = 'none';
    dock.style.width = 'auto';
    dock.style.padding = '0';
    panel.style.margin = '0';
    panel.style.maxWidth = Math.min(540, window.innerWidth - 16) + 'px';
    panel.style.width = Math.min(540, window.innerWidth - 16) + 'px';
    return { left: l, top: t };
  }

  function isInteractive(el) {
    if (!el || !el.closest) return false;
    var tag = (el.tagName || '').toUpperCase();
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || tag === 'BUTTON' || tag === 'A')
      return true;
    if (el.isContentEditable) return true;
    if (el.closest('button, a, input, textarea, select, [role="button"]')) return true;
    return false;
  }

  /**
   * One finger grab from ANYWHERE on #panel:
   * - vertical dominate → live expand/retract (smooth px height) → snap collapsed|mid|expanded
   * - horizontal / free → move dock (persist)
   * - taps on buttons/input still work if finger barely moves
   */
  function bindCliDrag() {
    var dock = $('dock');
    var panel = $('panel');
    if (!dock || !panel || panel._snDragBound) return;
    panel._snDragBound = true;

    var startX = 0,
      startY = 0,
      origL = 0,
      origT = 0,
      startH = 0,
      dragging = false,
      moved = false,
      mode = 'none',
      ptrId = null,
      startedOnInteractive = false;

    try {
      var raw = localStorage.getItem(POS_KEY);
      if (raw) {
        var p = JSON.parse(raw);
        if (typeof p.left === 'number' && typeof p.top === 'number')
          applyPos(dock, panel, p.left, p.top);
      }
      var sz = localStorage.getItem(SIZE_KEY);
      if (sz === 'collapsed' || sz === 'expanded' || sz === 'mid') setSize(sz, false);
      else setSize('collapsed', false);
    } catch (_) {
      setSize('collapsed', false);
    }

    function onStart(e) {
      if (e.pointerType === 'touch' && e.isPrimary === false) return;
      if (e.button != null && e.button !== 0) return;
      var t = e;
      if (!t) return;
      startedOnInteractive = isInteractive(e.target);
      // Never steal clicks from 🎙 / send / inputs — capture breaks hands-free & buttons
      if (startedOnInteractive) {
        dragging = false;
        return;
      }
      var rect = dock.getBoundingClientRect();
      if (!dock.classList.contains('free')) {
        origL = rect.left;
        origT = rect.top;
      } else {
        origL = parseFloat(dock.style.left) || rect.left;
        origT = parseFloat(dock.style.top) || rect.top;
      }
      startX = t.clientX;
      startY = t.clientY;
      startH = panel.getBoundingClientRect().height || sizePx(currentMode(panel));
      dragging = true;
      moved = false;
      mode = 'none';
      ptrId = e.pointerId;
      try {
        panel.setPointerCapture(e.pointerId);
      } catch (_) {}
      panel.classList.add('dragging');
      panel.classList.remove('sn-size-anim');
    }

    function onMove(e) {
      if (!dragging) return;
      if (ptrId != null && e.pointerId !== ptrId) return;
      var dx = e.clientX - startX;
      var dy = e.clientY - startY;
      var dist = Math.abs(dx) + Math.abs(dy);
      // On interactive targets, require a clearer drag so taps still work
      var thresh = startedOnInteractive ? 14 : 6;
      if (!moved && dist < thresh) return;
      moved = true;
      if (mode === 'none') {
        mode = Math.abs(dy) > Math.abs(dx) * 1.05 ? 'size' : 'move';
      }
      if (mode === 'move') {
        applyPos(dock, panel, origL + dx, origT + dy);
      } else {
        // Drag overrides default 1/3 — up to 72vh absolute
        var next = Math.max(100, Math.min(dragMaxCliPx(), startH - dy)); // bottom scroll floor
        panel.style.maxHeight = next + 'px';
        panel.style.height = next + 'px';
        panel.classList.remove('expanded', 'collapsed', 'mid');
        if (next < sizePx('collapsed') + 16) panel.classList.add('collapsed');
        else if (next > defaultMaxCliPx() - 8) panel.classList.add('expanded');
        else panel.classList.add('mid');
      }
      if (e.cancelable) e.preventDefault();
    }

    function onEnd(e) {
      if (!dragging) return;
      if (ptrId != null && e.pointerId !== ptrId && e.type !== 'pointercancel') return;
      dragging = false;
      panel.classList.remove('dragging');
      try {
        if (ptrId != null) panel.releasePointerCapture(ptrId);
      } catch (_) {}
      ptrId = null;
      if (!moved) {
        // pure tap — leave input/buttons alone
        mode = 'none';
        return;
      }
      if (mode === 'move') {
        try {
          localStorage.setItem(
            POS_KEY,
            JSON.stringify({
              left: parseFloat(dock.style.left) || 0,
              top: parseFloat(dock.style.top) || 0,
            })
          );
        } catch (_) {}
      } else if (mode === 'size') {
        // Keep user-dragged height — do NOT snap back to 1/3 if they overrode
        var h = panel.getBoundingClientRect().height || startH;
        var c = sizePx('collapsed');
        var def = defaultMaxCliPx();
        var pick = 'mid';
        if (h < (c + sizePx('mid')) / 2) pick = 'collapsed';
        else if (h >= def - 12) pick = 'expanded';
        panel.classList.remove('expanded', 'collapsed', 'mid');
        panel.classList.add(pick);
        // Preserve free height when user dragged past default max
        if (h > def + 4) {
          panel.style.maxHeight = Math.min(dragMaxCliPx(), Math.round(h)) + 'px';
          panel.style.height = panel.style.maxHeight;
        } else {
          setSize(pick, true);
        }
        try {
          localStorage.setItem(SIZE_KEY, pick);
        } catch (_) {}
      }
      mode = 'none';
    }

    // Whole panel is the grab surface
    panel.addEventListener('pointerdown', onStart, { passive: true });
    panel.addEventListener('pointermove', onMove, { passive: false });
    panel.addEventListener('pointerup', onEnd, { passive: true });
    panel.addEventListener('pointercancel', onEnd, { passive: true });
    // Also track on window so finger leaving panel still ends cleanly
    window.addEventListener('pointerup', onEnd, { passive: true });
    window.addEventListener('pointercancel', onEnd, { passive: true });

    window.addEventListener(
      'resize',
      function () {
        if (!dock.classList.contains('free')) return;
        applyPos(dock, panel, parseFloat(dock.style.left) || 8, parseFloat(dock.style.top) || 8);
      },
      { passive: true }
    );
  }

  function init() {
    if (init._done) return;
    init._done = true;
    // Focus expands mid so field is usable, without fighting grab
    $('cli-in') &&
      $('cli-in').addEventListener('focus', function () {
        var p = $('panel');
        if (p && p.classList.contains('collapsed')) setSize('mid', true);
      });
    $('btn-expand') &&
      $('btn-expand').addEventListener('click', function () {
        expandPanel();
      });
    bindCliDrag();
    setTimeout(showCoach, 700);
    var badge = $('perf-badge');
    if (badge) {
      badge.textContent = 'AS';
      badge.title = 'Astranov SpaceNet';
    }
  }

  global.SNUi = {
    init: init,
    showCoach: showCoach,
    expandPanel: expandPanel,
    bindCliDrag: bindCliDrag,
    setSize: setSize,
    resetChrome: resetChrome,
  };
})(window);
