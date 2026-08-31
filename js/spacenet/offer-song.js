/* SpaceNet 4118 — cat choir on the task throw, all 432 bands with the dolphins. */
(function(){
  if(window.__snOfferSong) return;
  window.__snOfferSong=true;

  function choir(){
    var c=window.__snActx;
    var master=window.__snMaster;
    if(!c || !master){
      var AC=window.AudioContext||window.webkitAudioContext;
      if(!AC) return;
      if(!c){ c=new AC(); window.__snActx=c; }
      if(c.state==="suspended") c.resume();
      if(!master){
        master=c.createGain();
        master.gain.value=0.8;
        master.connect(c.destination);
        window.__snMaster=master;
      }
    }
    if(c.state==="suspended") c.resume();
    var t0=c.currentTime;
    var T=13.6;
    var A=432;

    function meow(f0, fPeak, f1, at, dur, lvl){
      f0=Math.max(24,f0); fPeak=Math.max(24,fPeak); f1=Math.max(24,f1);
      var o=c.createOscillator(), o2=c.createOscillator(), g=c.createGain();
      var lfo=c.createOscillator(), lg=c.createGain();
      o.type="triangle";
      o2.type="sine";
      var mid=at+dur*0.38;
      o.frequency.setValueAtTime(f0, at);
      o.frequency.exponentialRampToValueAtTime(fPeak, mid);
      o.frequency.exponentialRampToValueAtTime(f1, at+dur);
      o2.frequency.setValueAtTime(f0*2.02, at);
      o2.frequency.exponentialRampToValueAtTime(fPeak*2.02, mid);
      o2.frequency.exponentialRampToValueAtTime(f1*2.02, at+dur);
      lfo.type="sine";
      lfo.frequency.setValueAtTime(6.2, at);
      lfo.frequency.linearRampToValueAtTime(4.1, at+dur);
      lg.gain.value=Math.max(8, f0*0.035);
      lfo.connect(lg); lg.connect(o.frequency);
      g.gain.setValueAtTime(0.0001, at);
      g.gain.exponentialRampToValueAtTime(lvl, at+Math.min(0.12, dur*0.2));
      g.gain.setValueAtTime(lvl, at+dur*0.45);
      g.gain.exponentialRampToValueAtTime(0.0001, at+dur);
      o.connect(g); o2.connect(g); g.connect(master);
      o.start(at); o2.start(at); lfo.start(at);
      o.stop(at+dur+0.04); o2.stop(at+dur+0.04); lfo.stop(at+dur+0.04);
    }
    function purr(f, at, dur, lvl){
      var o=c.createOscillator(), g=c.createGain(), lfo=c.createOscillator(), lg=c.createGain();
      o.type="triangle";
      o.frequency.setValueAtTime(Math.max(24,f), at);
      o.frequency.exponentialRampToValueAtTime(Math.max(24,f*0.72), at+dur);
      lfo.type="sine";
      lfo.frequency.value=26;
      lg.gain.value=lvl;
      g.gain.setValueAtTime(0.0001, at);
      g.gain.exponentialRampToValueAtTime(lvl, at+0.25);
      g.gain.setValueAtTime(lvl, at+dur*0.75);
      g.gain.exponentialRampToValueAtTime(0.0001, at+dur);
      lfo.connect(lg); lg.connect(g.gain);
      o.connect(g); g.connect(master);
      o.start(at); lfo.start(at);
      o.stop(at+dur+0.03); lfo.stop(at+dur+0.03);
    }

    /* purr bed — sinks with the whale floor */
    purr(A/16, t0+0.2, T-0.5, 0.16);
    purr(A/8, t0+0.4, T-0.7, 0.12);
    purr(A/4, t0+1.0, 8.8, 0.08);

    /* cat meows on every 432 band, falling with the dolphin whistles */
    meow(A/8, A/4, A/16, t0+0.35, 1.1, 0.22);
    meow(A/4, A/2, A/8, t0+0.9, 1.0, 0.2);
    meow(A/2, A, A/4, t0+1.6, 0.95, 0.22);
    meow(A, A*1.5, A/2, t0+2.3, 1.05, 0.2);
    meow(A*2, A*3, A, t0+3.2, 1.15, 0.18);
    meow(A*4, A*6, A*2, t0+4.1, 1.2, 0.16);
    meow(A*8, A*12, A*3, t0+5.2, 1.3, 0.14);
    meow(A*16, A*24, A*4, t0+6.4, 1.4, 0.11);
    meow(A*32, A*20, A*2, t0+8.0, 1.6, 0.1);
    meow(A*8, A*4, A/2, t0+9.2, 1.8, 0.14);
    meow(A*4, A*2, A/4, t0+10.4, 2.2, 0.16);
    meow(A*2, A, A/8, t0+11.2, 2.0, 0.18);
    meow(A, A/2, A/16, t0+11.8, 1.6, 0.14);
  }

  function hook(){
    if(!window.SNThrow || SNThrow.__cats) return;
    var orig=SNThrow.throw;
    SNThrow.throw=function(job){
      orig.apply(this, arguments);
      setTimeout(choir, 80);
      setTimeout(choir, 3280);
    };
    if(SNThrow.splash && SNThrow.splash!==SNThrow.throw){
      var splash=SNThrow.splash;
      SNThrow.splash=function(job){
        splash.apply(this, arguments);
        setTimeout(choir, 80);
      };
    }
    SNThrow.__cats=true;
  }
  if(document.readyState==="loading") document.addEventListener("DOMContentLoaded", hook);
  else hook();
  setInterval(hook, 700);
})();
