/* SNGreeklish — food/intent normalizer (non-UI) */
(function (g) {
  'use strict';
  var MAP = [
    [/πιτσα|πίτσα|pitza|pitsa|pizza/gi, 'pizza'],
    [/πιτογυρ|πιτόγυρ|pitogyro|pitogyra|gyros|γυρο/gi, 'gyros'],
    [/σουβλα|souvla|souvlaki/gi, 'souvlaki'],
    [/μπυρ|mpyr|mpira|myra|beer|μπίρα/gi, 'beer'],
    [/κρασι|krasi|wine|retsina|ρετσιν/gi, 'wine'],
    [/καφε|kafes|coffee|espresso/gi, 'coffee'],
    [/μπεργκερ|burger|hamurger/gi, 'burger'],
    [/σουσι|sushi/gi, 'sushi'],
    [/σαλατ|salat|salad/gi, 'salad'],
    [/νερο|nero|water|soda|αναψυκ/gi, 'drink'],
  ];
  function normalize(s) {
    var t = String(s || '');
    // Greeklish digraphs rough
    t = t
      .replace(/th/gi, 'θ')
      .replace(/ps/gi, 'ψ')
      .replace(/ch|kh/gi, 'χ');
    var out = String(s || '');
    MAP.forEach(function (pair) {
      out = out.replace(pair[0], pair[1]);
    });
    return out.toLowerCase();
  }
  function foodTokens(s) {
    var n = normalize(s);
    var found = [];
    ['pizza', 'gyros', 'souvlaki', 'burger', 'sushi', 'salad', 'coffee', 'beer', 'wine', 'drink'].forEach(
      function (f) {
        if (n.indexOf(f) >= 0) found.push(f);
      }
    );
    return found;
  }
  g.SNGreeklish = { normalize: normalize, foodTokens: foodTokens };
})(typeof window !== 'undefined' ? window : globalThis);
