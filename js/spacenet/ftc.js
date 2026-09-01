/* SpaceNet 4126 — May 2026 failure-to-comply. File repeats. Email via digest. Owner only. */
(function(){
  if(window.__snFtc) return;
  window.__snFtc=true;
  var ANON="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxrb2F0cmtodWlnZG9sbmpzYmllIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg4ODIwOTIsImV4cCI6MjA5NDQ1ODA5Mn0.qf6Kg93YLJ0coTdVQa4baU0ppOdFY5WkmVzMvEV6ejI";
  var SB="https://lkoatrkhuigdolnjsbie.supabase.co";
  var OWNER={"notisastranov@gmail.com":1};
  function day(){ return new Date().toISOString().slice(0,10); }
  function read(k,d){ try{ var v=localStorage.getItem(k); return v==null?d:v; }catch(e){ return d; } }
  function write(k,v){ try{ localStorage.setItem(k,v); }catch(e){} }
  function email(){
    try{
      var u=JSON.parse(read("sn:user","null")||"null");
      return String((u&&u.email)||"").toLowerCase();
    }catch(e){ return ""; }
  }
  function owner(){ return !!OWNER[email()]; }
  var OPEN=[
    {id:"flat-map-zoom-out", severity:"repeat", vendor:"xai", type:"globe", fn:"leave-flat", message:"Zoom out stays on repeating flat map. Must return to globe."},
    {id:"indian-device-voice", severity:"repeat", vendor:"xai", type:"voice", fn:"voice", message:"Indian/PK compact robot voice. Required: deep American female cloud TTS."},
    {id:"twilio-invalid-username", severity:"block", type:"sms", fn:"sms", message:"Twilio invalid username. Paid SMS does not send. SID must be 34 chars."},
    {id:"hunt-no-pin-dummy", severity:"repeat", vendor:"xai", type:"grok", fn:"aicycle", message:"Hunt returns No pin. Not internet research. Pins must land on the globe."},
    {id:"grok-no-internet", severity:"repeat", vendor:"xai", type:"grok", fn:"aicycle", message:"Grok does not search web/X/news/weather/legal."},
    {id:"wallet-wipe-or-leak", severity:"repeat", type:"wallet", message:"Owner AV€ wiped or pool shown to guests."},
    {id:"wire-globe", severity:"repeat", type:"globe", message:"Wire cage globe instead of Earth."},
    {id:"task-splash-cover", severity:"repeat", type:"tasks", message:"Task offer covers map / half off screen."}
  ];
  function file(){
    if(!owner()) return;
    if(read("sn:ftc-day","")===day()) return;
    write("sn:ftc-day", day());
    var body={action:"client_report", force_daily:true, force:true, build:"4126", session_id:"ftc-"+day(), stats:{protocol:"May 2026 failure-to-comply", vendor:"xai"}, problems:OPEN, progression:[{step:"4126", note:"Daily FTC flag until live app holds the fix."}]};
    fetch(SB+"/functions/v1/support-digest",{method:"POST", headers:{"Content-Type":"application/json", apikey:ANON}, body:JSON.stringify(body)}).catch(function(){});
    fetch(SB+"/functions/v1/debug-write",{method:"POST", headers:{"Content-Type":"application/json", apikey:ANON, Authorization:"Bearer "+ANON}, body:JSON.stringify({kind:"failure_to_comply", type:"failure_to_comply", ts:Date.now(), data:{day:day(), open:OPEN.map(function(c){return c.id;})}})}).catch(function(){});
  }
  if(document.readyState==="loading") document.addEventListener("DOMContentLoaded", function(){ setTimeout(file, 2500); });
  else setTimeout(file, 2500);
})();
