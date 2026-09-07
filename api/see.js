/** SpaceNet + upload → Grok vision. */
function cors(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "authorization, content-type");
  res.setHeader("Cache-Control", "no-store");
}
function bodyOf(req) {
  if (req.body && typeof req.body === "object" && !Buffer.isBuffer(req.body)) return req.body;
  if (typeof req.body === "string") { try { return JSON.parse(req.body); } catch (e) { return {}; } }
  return {};
}
function pull(j) {
  if (!j) return "";
  if (j.output_text) return String(j.output_text);
  if (j.choices && j.choices[0] && j.choices[0].message) return String(j.choices[0].message.content || "");
  return String(j.text || "");
}
module.exports = async function handler(req, res) {
  cors(res);
  if (req.method === "OPTIONS") { res.status(204).end(); return; }
  if (req.method !== "POST") { res.status(405).json({ ok: false }); return; }
  var body = bodyOf(req);
  var prompt = String(body.prompt || body.message || body.text || "Analyze this SpaceNet upload.").slice(0, 4000);
  var image = String(body.image || body.image_url || "");
  var fileText = String(body.fileText || "").slice(0, 12000);
  var key = process.env.XAI_API_KEY || process.env.GROK_API_KEY || "";
  if (!key) {
    res.status(200).json({ ok: false, act: "talk", say: "Grok key missing on host.", text: "Grok key missing on host." });
    return;
  }
  var content = [{ type: "text", text: prompt + (fileText ? "\n\nFILE TEXT:\n" + fileText : "") }];
  if (image && image.indexOf("data:image") === 0) content.push({ type: "image_url", image_url: { url: image } });
  try {
    var r = await fetch("https://api.x.ai/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: "Bearer " + key },
      body: JSON.stringify({
        model: process.env.XAI_MODEL || "grok-4",
        messages: [
          { role: "system", content: "You are Grok on Astranov SpaceNet. Read the upload. JSON only: say, act (hunt|listing|talk), places[{name,lat,lng,raw}], dishes[{name,price,sample}]. Never invent a phone." },
          { role: "user", content: content }
        ],
        temperature: 0.2,
        max_tokens: 1200
      })
    });
    var j = await r.json().catch(function () { return {}; });
    var text = pull(j);
    var parsed = {};
    var m = String(text).match(/\{[\s\S]*\}/);
    if (m) { try { parsed = JSON.parse(m[0]); } catch (e) {} }
    res.status(200).json({
      ok: !!text, text: text, say: parsed.say || text, act: parsed.act || "talk",
      places: parsed.places || [], dishes: parsed.dishes || parsed.items || [], items: parsed.items || parsed.dishes || [],
      lat: parsed.lat, lng: parsed.lng, name: parsed.name, phone: parsed.phone, hours: parsed.hours,
      via: "xai-see", model: (j && j.model) || "grok-4"
    });
  } catch (e) {
    res.status(200).json({ ok: false, act: "talk", say: "Grok could not read that file.", text: "Grok could not read that file." });
  }
};
