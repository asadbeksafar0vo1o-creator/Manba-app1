/*
 * MANBA — Cloudflare Worker / OpenRouter proxy (6.0: matn + rasm)
 * Secret: OPENROUTER_KEY   Optional KV binding: RATE_KV
 * Worker URL’ni Sozlamalar → AI provayder → Cloudflare Worker URL bo‘limiga kiriting.
 */
const ALLOWED_MODELS = new Set([
  "openrouter/free",
  "meta-llama/llama-3.3-70b-instruct:free",
  "google/gemma-3-27b-it:free",
  "qwen/qwen3-8b:free"
]);
const VISION_MODEL = "google/gemma-3-27b-it:free";
const MAX_BODY_BYTES = 3_000_000;
const MAX_MESSAGES = 24;
const MAX_CONTENT_CHARS = 18_000;
const MAX_PARTS = 4;
const MAX_IMAGE_DATA_CHARS = 2_500_000;
const IMAGE_RE = /^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/;
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Max-Age": "86400",
  "Vary": "Origin"
};
function json(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { ...corsHeaders, "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" } });
}
function fail(message, status) { return { error: { message, status } }; }

// Matn yoki [text, image_url] massivini tekshiradi. Xato bo‘lsa { error }, aks holda { content, hasImage }.
function checkContent(content) {
  if (typeof content === "string") {
    return content.length > MAX_CONTENT_CHARS ? fail("Bitta xabar hajmi juda katta.", 413) : { content, hasImage: false };
  }
  if (!Array.isArray(content) || content.length < 1 || content.length > MAX_PARTS) return fail("Xabar formati noto‘g‘ri.", 400);
  let hasImage = false, textLength = 0;
  const parts = [];
  for (const p of content) {
    if (p && p.type === "text" && typeof p.text === "string") {
      textLength += p.text.length; parts.push({ type: "text", text: p.text });
    } else if (p && p.type === "image_url" && p.image_url && typeof p.image_url.url === "string") {
      const url = p.image_url.url;
      if (url.length > MAX_IMAGE_DATA_CHARS) return fail("Rasm hajmi juda katta.", 413);
      if (!IMAGE_RE.test(url)) return fail("Rasm formati noto‘g‘ri. PNG, JPEG yoki WEBP yuboring.", 400);
      hasImage = true; parts.push({ type: "image_url", image_url: { url } });
    } else {
      return fail("Xabar formati noto‘g‘ri.", 400);
    }
  }
  if (textLength > MAX_CONTENT_CHARS) return fail("Bitta xabar hajmi juda katta.", 413);
  return { content: parts, hasImage };
}

export default {
  async fetch(req, env, ctx) {
    if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders });
    if (req.method !== "POST") return json({ error: { message: "Faqat POST so‘rovi qabul qilinadi." } }, 405);
    if (!env.OPENROUTER_KEY) return json({ error: { message: "Serverda OPENROUTER_KEY sozlanmagan." } }, 503);
    const ip = req.headers.get("CF-Connecting-IP") || "unknown";
    if (env.RATE_KV) {
      const key = `rl:${ip}:${Math.floor(Date.now() / 60000)}`;
      const current = Number.parseInt((await env.RATE_KV.get(key)) || "0", 10) || 0;
      if (current >= 20) return json({ error: { message: "So‘rovlar chegarasi tugadi. Bir daqiqadan so‘ng qayta urinib ko‘ring." } }, 429);
      ctx.waitUntil(env.RATE_KV.put(key, String(current + 1), { expirationTtl: 120 }));
    }
    const declared = Number(req.headers.get("Content-Length") || 0);
    if (declared > MAX_BODY_BYTES) return json({ error: { message: "So‘rov hajmi juda katta." } }, 413);
    let body;
    try { body = await req.json(); } catch { return json({ error: { message: "JSON so‘rovi noto‘g‘ri." } }, 400); }
    if (!body || !Array.isArray(body.messages) || body.messages.length < 1 || body.messages.length > MAX_MESSAGES)
      return json({ error: { message: "Xabarlar soni noto‘g‘ri." } }, 400);
    if (JSON.stringify(body).length > MAX_BODY_BYTES) return json({ error: { message: "So‘rov hajmi juda katta." } }, 413);

    const messages = [];
    let hasImage = false;
    for (const m of body.messages) {
      if (!m || !["system", "user", "assistant"].includes(m.role)) return json({ error: { message: "Xabar formati noto‘g‘ri." } }, 400);
      const checked = checkContent(m.content);
      if (checked.error) return json({ error: { message: checked.error.message } }, checked.error.status);
      hasImage = hasImage || checked.hasImage;
      messages.push({ role: m.role, content: checked.content });
    }
    // Rasm bo‘lsa, faqat ko‘ruvchi (vision) model ishlaydi.
    const model = hasImage ? VISION_MODEL : (typeof body.model === "string" && ALLOWED_MODELS.has(body.model) ? body.model : "openrouter/free");
    const temperature = Number.isFinite(body.temperature) ? Math.max(0, Math.min(1.2, body.temperature)) : 0.3;
    const max_tokens = Number.isFinite(body.max_tokens) ? Math.max(100, Math.min(3500, Math.floor(body.max_tokens))) : 1500;

    let upstream;
    try {
      upstream = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${env.OPENROUTER_KEY}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://manba.pages.dev",
          "X-Title": "Manba — AI ustoz"
        },
        body: JSON.stringify({ model, messages, temperature, max_tokens })
      });
    } catch { return json({ error: { message: "AI provayderiga ulanib bo‘lmadi. Keyinroq qayta urinib ko‘ring." } }, 502); }
    const text = await upstream.text();
    let parsed;
    try { parsed = JSON.parse(text); } catch { parsed = { error: { message: "AI provayderidan noto‘g‘ri javob keldi." } }; }
    if (!upstream.ok) {
      const status = [400, 401, 403, 404, 429].includes(upstream.status) ? upstream.status : 502;
      const upstreamMessage = parsed?.error?.message;
      return json({ error: { message: typeof upstreamMessage === "string" ? upstreamMessage : "AI xizmati vaqtincha ishlamayapti." } }, status);
    }
    return json(parsed, 200);
  }
};
