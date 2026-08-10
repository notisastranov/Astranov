/**
 * SNWebRTC — video/voice only when order goes OFF the predicted limits
 * OWNER LAW: no call / no messaging while delivery is within limits.
 * When limits break (late, wrong route, dispute), parties may open a sealed call.
 * Demo path uses BroadcastChannel + public STUN (no server signaling required for same-LAN/tab).
 * Mechanical: window.SNWebRTC
 */
(function (global) {
  'use strict';

  var ICE = [{ urls: 'stun:stun.l.google.com:19302' }, { urls: 'stun:stun1.l.google.com:19302' }];
  var BUS = 'sn-webrtc-v1';
  var state = {
    ready: false,
    inCall: false,
    pc: null,
    localStream: null,
    remoteStream: null,
    room: null,
    reason: null,
  };
  var bc = null;

  function log(m, c) {
    try {
      if (global.SNCli && SNCli.log) SNCli.log(String(m).slice(0, 220), c || 'ok', true);
    } catch (_) {}
  }

  function ensureCss() {
    if (document.getElementById('sn-webrtc-css')) return;
    var st = document.createElement('style');
    st.id = 'sn-webrtc-css';
    st.textContent =
      '#sn-rtc-layer{position:fixed;inset:0;z-index:12000;display:none;align-items:center;justify-content:center;' +
      'background:rgba(0,4,12,.72);backdrop-filter:blur(8px);}' +
      '#sn-rtc-layer.on{display:flex;}' +
      '#sn-rtc-box{width:min(420px,92vw);border-radius:28px;overflow:hidden;border:1px solid rgba(61,158,255,.45);' +
      'background:linear-gradient(165deg,rgba(8,24,56,.95),rgba(2,8,20,.98));box-shadow:0 20px 60px rgba(0,0,0,.55);}' +
      '#sn-rtc-box video{width:100%;display:block;background:#000;max-height:42vh;object-fit:cover;}' +
      '#sn-rtc-remote{min-height:180px;}' +
      '#sn-rtc-local{position:absolute;right:12px;bottom:72px;width:28%;border-radius:16px;border:1px solid rgba(61,158,255,.5);}' +
      '#sn-rtc-vidwrap{position:relative;}' +
      '#sn-rtc-bar{display:flex;gap:8px;padding:12px;justify-content:center;flex-wrap:wrap;}' +
      '#sn-rtc-bar button{border-radius:999px;border:1px solid rgba(61,158,255,.4);background:rgba(12,40,80,.85);' +
      'color:#cfe8ff;font:700 11px system-ui;padding:10px 14px;cursor:pointer;}' +
      '#sn-rtc-bar button.hang{border-color:rgba(232,33,39,.6);color:#ffb4b8;}' +
      '#sn-rtc-meta{padding:10px 14px 0;font:600 11px system-ui;color:#8ab4e0;text-align:center;}';
    document.head.appendChild(st);
  }

  function ensureDom() {
    ensureCss();
    if (document.getElementById('sn-rtc-layer')) return;
    var el = document.createElement('div');
    el.id = 'sn-rtc-layer';
    el.innerHTML =
      '<div id="sn-rtc-box">' +
      '<div id="sn-rtc-meta">Sealed call · off-limits only</div>' +
      '<div id="sn-rtc-vidwrap">' +
      '<video id="sn-rtc-remote" autoplay playsinline></video>' +
      '<video id="sn-rtc-local" autoplay playsinline muted></video>' +
      '</div>' +
      '<div id="sn-rtc-bar">' +
      '<button type="button" data-rtc="mute">Mute</button>' +
      '<button type="button" data-rtc="cam">Cam</button>' +
      '<button type="button" class="hang" data-rtc="hang">Hang up</button>' +
      '</div></div>';
    document.body.appendChild(el);
    el.querySelector('[data-rtc="hang"]').onclick = function () {
      hangup();
    };
    el.querySelector('[data-rtc="mute"]').onclick = function () {
      if (!state.localStream) return;
      state.localStream.getAudioTracks().forEach(function (t) {
        t.enabled = !t.enabled;
      });
      log('Mic ' + (state.localStream.getAudioTracks()[0] && state.localStream.getAudioTracks()[0].enabled ? 'on' : 'muted'), 'dim');
    };
    el.querySelector('[data-rtc="cam"]').onclick = function () {
      if (!state.localStream) return;
      state.localStream.getVideoTracks().forEach(function (t) {
        t.enabled = !t.enabled;
      });
    };
  }

  function bus() {
    if (bc) return bc;
    try {
      bc = new BroadcastChannel(BUS);
      bc.onmessage = function (ev) {
        void onSignal(ev.data || {});
      };
    } catch (_) {
      bc = { postMessage: function () {}, close: function () {} };
    }
    return bc;
  }

  function post(msg) {
    try {
      bus().postMessage(Object.assign({ t: Date.now(), room: state.room }, msg));
    } catch (_) {}
  }

  function canCall(order, opts) {
    opts = opts || {};
    if (opts.force) return { ok: true, reason: 'force test' };
    if (!order) return { ok: false, reason: 'no order' };
    var limits = order.limits || (order.quote && order.quote.limits) || {};
    var late = false;
    var eta = Number(order.etaMin || limits.maxEtaMin || 0);
    var elapsed = order.startedAt ? (Date.now() - order.startedAt) / 60000 : 0;
    if (eta && elapsed > eta * 1.25) late = true;
    var offRoute = !!(order.offRoute || order.dispute || order.offLimits);
    var confirmingStuck = order.phase === 'confirming' && order.confirms;
    var sealsMissing =
      confirmingStuck &&
      order.confirms &&
      (!order.confirms.client || !order.confirms.vendor || !order.confirms.driver);
    if (late || offRoute || sealsMissing || order.phase === 'disputed') {
      return {
        ok: true,
        reason: late ? 'late vs ETA window' : offRoute ? 'off-route / dispute' : 'seal incomplete',
      };
    }
    return {
      ok: false,
      reason: 'Within predicted limits · no call / no messaging (driver safety law)',
    };
  }

  async function getMedia() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new Error('Media devices unavailable · need HTTPS + permission');
    }
    return navigator.mediaDevices.getUserMedia({
      audio: true,
      video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
    });
  }

  async function makePc() {
    var pc = new RTCPeerConnection({ iceServers: ICE });
    pc.onicecandidate = function (e) {
      if (e.candidate) post({ type: 'ice', candidate: e.candidate });
    };
    pc.ontrack = function (e) {
      state.remoteStream = e.streams[0] || new MediaStream([e.track]);
      var v = document.getElementById('sn-rtc-remote');
      if (v) v.srcObject = state.remoteStream;
    };
    pc.onconnectionstatechange = function () {
      log('RTC · ' + pc.connectionState, pc.connectionState === 'connected' ? 'ok' : 'dim');
    };
    return pc;
  }

  async function startCall(order, opts) {
    opts = opts || {};
    var gate = canCall(order, opts);
    if (!gate.ok) {
      log(gate.reason, 'err');
      return { ok: false, error: gate.reason };
    }
    if (state.inCall) {
      log('Already in a sealed call', 'dim');
      return { ok: false, error: 'busy' };
    }
    ensureDom();
    state.room = (order && order.id) || opts.room || 'room-' + Math.random().toString(36).slice(2, 8);
    state.reason = gate.reason;
    try {
      state.localStream = await getMedia();
      state.pc = await makePc();
      state.localStream.getTracks().forEach(function (t) {
        state.pc.addTrack(t, state.localStream);
      });
      var lv = document.getElementById('sn-rtc-local');
      if (lv) lv.srcObject = state.localStream;
      var meta = document.getElementById('sn-rtc-meta');
      if (meta) meta.textContent = 'Sealed call · ' + gate.reason + ' · room ' + state.room;
      document.getElementById('sn-rtc-layer').classList.add('on');
      bus();
      var offer = await state.pc.createOffer({ offerToReceiveAudio: true, offerToReceiveVideo: true });
      await state.pc.setLocalDescription(offer);
      post({ type: 'offer', sdp: state.pc.localDescription, from: 'caller' });
      state.inCall = true;
      log('Sealed video call open · ' + gate.reason, 'ok');
      return { ok: true, room: state.room, reason: gate.reason };
    } catch (e) {
      hangup();
      log('Call failed · ' + (e.message || e), 'err');
      return { ok: false, error: String(e.message || e) };
    }
  }

  async function onSignal(msg) {
    if (!msg || !msg.type) return;
    if (state.room && msg.room && msg.room !== state.room) return;
    try {
      if (msg.type === 'offer' && !state.inCall) {
        ensureDom();
        state.room = msg.room || state.room;
        state.localStream = await getMedia();
        state.pc = await makePc();
        state.localStream.getTracks().forEach(function (t) {
          state.pc.addTrack(t, state.localStream);
        });
        var lv = document.getElementById('sn-rtc-local');
        if (lv) lv.srcObject = state.localStream;
        document.getElementById('sn-rtc-layer').classList.add('on');
        await state.pc.setRemoteDescription(msg.sdp);
        var answer = await state.pc.createAnswer();
        await state.pc.setLocalDescription(answer);
        post({ type: 'answer', sdp: state.pc.localDescription });
        state.inCall = true;
        log('Joined sealed call', 'ok');
      } else if (msg.type === 'answer' && state.pc) {
        await state.pc.setRemoteDescription(msg.sdp);
      } else if (msg.type === 'ice' && state.pc && msg.candidate) {
        try {
          await state.pc.addIceCandidate(msg.candidate);
        } catch (_) {}
      } else if (msg.type === 'hang') {
        hangup(true);
      }
    } catch (e) {
      log('Signal · ' + (e.message || e), 'err');
    }
  }

  function hangup(silent) {
    try {
      if (!silent) post({ type: 'hang' });
    } catch (_) {}
    try {
      if (state.pc) state.pc.close();
    } catch (_) {}
    try {
      if (state.localStream)
        state.localStream.getTracks().forEach(function (t) {
          t.stop();
        });
    } catch (_) {}
    state.pc = null;
    state.localStream = null;
    state.remoteStream = null;
    state.inCall = false;
    var layer = document.getElementById('sn-rtc-layer');
    if (layer) layer.classList.remove('on');
    if (!silent) log('Call ended', 'dim');
  }

  function handleLine(raw) {
    var low = String(raw || '').trim().toLowerCase();
    if (!/^(call|video|webrtc|rtc)\b/.test(low)) return false;
    if (/hang|end|stop/.test(low)) {
      hangup();
      return true;
    }
    if (/test|force|demo/.test(low)) {
      void startCall({ id: 'demo-offlimits', offLimits: true, phase: 'disputed' }, { force: true });
      return true;
    }
    try {
      var list = (global.SNPolyScheduler && SNPolyScheduler.list && SNPolyScheduler.list()) || [];
      var active = list.find(function (o) {
        return o && (o.phase === 'underway' || o.phase === 'confirming' || o.phase === 'disputed');
      });
      if (!active) {
        log('No active order · use: call test  (only off-limits orders may call)', 'dim');
        return true;
      }
      void startCall(active, {});
    } catch (e) {
      log(String(e.message || e), 'err');
    }
    return true;
  }

  function installCli() {
    try {
      if (!global.SNCli || typeof SNCli.run !== 'function') return;
      if (SNCli._snRtcHook) return;
      SNCli._snRtcHook = true;
      var prev = SNCli.run.bind(SNCli);
      SNCli.run = function (raw) {
        try {
          if (handleLine(raw)) return Promise.resolve(true);
        } catch (_) {}
        return prev(raw);
      };
    } catch (_) {}
  }

  function init() {
    state.ready = true;
    ensureCss();
    installCli();
    bus();
  }

  global.SNWebRTC = {
    init: init,
    startCall: startCall,
    hangup: hangup,
    canCall: canCall,
    handleLine: handleLine,
    get inCall() {
      return state.inCall;
    },
    get ready() {
      return state.ready;
    },
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      setTimeout(init, 120);
    });
  } else {
    setTimeout(init, 120);
  }
})(typeof window !== 'undefined' ? window : globalThis);
