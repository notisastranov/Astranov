/**
 * Task ribbon — materialises action buttons for the CURRENT task only.
 * Not a permanent multi-button dock flood. Empty / minimal when idle.
 */
(function (global) {
  'use strict';

  var task = 'idle';
  var notice = '';

  var TASKS = {
    idle: {
      label: 'CLI',
      actions: [
        { id: 'help', label: 'help', run: 'help' },
        { id: 'locate', label: 'locate', run: 'locate' },
        { id: 'shops', label: 'shops', run: 'shops' },
        { id: 'rate', label: 'S rate', run: 'rate' },
      ],
    },
    map: {
      label: 'City',
      actions: [
        { id: 'shops', label: 'shops', run: 'shops' },
        { id: 'globe', label: 'globe', run: 'global' },
        { id: 'cart', label: 'cart', run: 'cart' },
        { id: 'order', label: 'order', run: 'order' },
      ],
    },
    shops: {
      label: 'Market',
      actions: [
        { id: 'cart', label: 'cart', run: 'cart' },
        { id: 'order', label: 'order', run: 'order' },
        { id: 'menu', label: 'menu', run: 'menu' },
        { id: 'globe', label: 'globe', run: 'global' },
      ],
    },
    order: {
      label: 'Order',
      actions: [
        { id: 'cart', label: 'cart', run: 'cart' },
        { id: 'tasks', label: 'tasks', run: 'task list' },
        { id: 'globe', label: 'globe', run: 'global' },
      ],
    },
    mine: {
      label: 'Mine',
      actions: [
        { id: 'res', label: 'resources', run: 'resources' },
        { id: 'donate', label: 'donate', run: 'donate on' },
        { id: 'mineoff', label: 'mine off', run: 'mine off' },
        { id: 'rate', label: 'S rate', run: 'rate' },
      ],
    },
    money: {
      label: 'S',
      actions: [
        { id: 'rate', label: 'rate', run: 'rate' },
        { id: 'wallet', label: 'wallet', run: 'wallet' },
        { id: 'mine', label: 'mine', run: 'mine on' },
        { id: 'finance', label: 'finance', run: 'finance' },
      ],
    },
    space: {
      label: 'Space',
      actions: [
        { id: 'thesis', label: 'thesis', run: 'thesis' },
        { id: 'mars', label: 'mars', run: 'go to mars' },
        { id: 'vault', label: 'vault', run: 'vault' },
        { id: 'global', label: 'earth', run: 'global' },
      ],
    },
  };

  function el() {
    return document.getElementById('sn-task-ribbon');
  }

  function setTask(name) {
    task = TASKS[name] ? name : 'idle';
    render();
  }

  function setNotice(text) {
    notice = String(text || '').slice(0, 80);
    var n = document.getElementById('sn-ribbon-notice');
    if (n) n.textContent = notice;
  }

  function render() {
    var bar = el();
    if (!bar) return;
    var def = TASKS[task] || TASKS.idle;
    var actions = def.actions || [];
    // Idle: only show compact set; still materialised for baseline ops
    var html =
      '<span class="sn-rib-task" id="sn-ribbon-task">' +
      (def.label || 'CLI') +
      '</span>';
    for (var i = 0; i < actions.length; i++) {
      var a = actions[i];
      html +=
        '<button type="button" class="sn-rib-btn" data-run="' +
        a.run.replace(/"/g, '') +
        '">' +
        a.label +
        '</button>';
    }
    // Always surface S balance chip on ribbon (currency presence)
    var bal = global.SNWallet?.formatBalance?.() || '0.00 S';
    html += '<span class="sn-rib-bal" id="sn-ribbon-bal">' + bal + '</span>';
    html += '<span class="sn-rib-notice" id="sn-ribbon-notice">' + (notice || '') + '</span>';
    bar.innerHTML = html;
    bar.querySelectorAll('[data-run]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var cmd = btn.getAttribute('data-run');
        if (cmd) global.SNCli?.run?.(cmd);
      });
    });
  }

  function inferFromCommand(line) {
    var low = String(line || '').toLowerCase();
    if (/^shops|^menu|^vendors|^market|^order|^cart/.test(low)) setTask('shops');
    else if (/^city|^map|^street/.test(low)) setTask('map');
    else if (/^mine|^resources|^donate|^boost/.test(low)) setTask('mine');
    else if (/^rate|^wallet|^money|^currency|^finance|^s\b/.test(low)) setTask('money');
    else if (/^thesis|^vault|^mars|^go to|^cosmos/.test(low)) setTask('space');
    else if (/^global|^earth|^locate/.test(low)) setTask('idle');
  }

  function init() {
    if (init._done) return;
    init._done = true;
    render();
  }

  global.SNRibbon = {
    init: init,
    render: render,
    setTask: setTask,
    setNotice: setNotice,
    infer: inferFromCommand,
    get task() {
      return task;
    },
  };
})(typeof window !== 'undefined' ? window : globalThis);
