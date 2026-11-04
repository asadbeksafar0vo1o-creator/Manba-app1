/*
 * MANBA — Cloudflare Worker / OpenRouter proxy
 *
 * Deploy as a Cloudflare Worker. Configure:
 *   Secret: OPENROUTER_KEY
 *   Optional KV binding: RATE_KV
 *
 * Then paste the deployed https://....workers.dev URL into CONFIG.PROXY_URL in app.js.
 */
const ALLOWED_MODELS = new Set([
  "openrouter/free",
  "meta-llama/llama-3.3-70b-instruct:free",
  "google/gemma-3-27b-it:free",
  "qwen/qwen3-8b:free"
]);
const MAX_BODY_BYTES = 120_000;
const MAX_MESSAGES = 24;
const MAX_CONTENT_CHARS = 18_000;
// Allow only the deployed GitHub Pages origin by default. Add other trusted
// origins in Cloudflare Worker variable ALLOWED_ORIGINS (comma-separated).
const DEFAULT_ORIGINS = [
  "https://asadbeksafar0vo1o-creator.github.io",
  "http://localhost:8080",
  "http://127.0.0.1:8080"
];
function allowedOrigin(origin, env) {
  if (!origin) return true; // CLI/health checks; browsers still enforce CORS.
  const configured = typeof env.ALLOWED_ORIGINS === "string"
    ? env.ALLOWED_ORIGINS.split(",").map(s => s.trim()).filter(Boolean)
    : DEFAULT_ORIGINS;
  return configured.includes(origin);
}
function corsFor(origin) {
  const headers = {
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Max-Age": "86400",
    "Vary": "Origin"
  };
  if (origin) headers["Access-Control-Allow-Origin"] = origin;
  return headers;
}
function json(data, status=200, origin=null) {
  return new Response(JSON.stringify(data), {status, headers:{...corsFor(origin),"Content-Type":"application/json; charset=utf-8","Cache-Control":"no-store"}});
}
export default {
  async fetch(req, env, ctx) {
    const origin = req.headers.get("Origin");
    if (!allowedOrigin(origin, env)) return new Response("Origin ruxsat etilmagan.", {status:403, headers:{"Vary":"Origin"}});
    if (req.method === "OPTIONS") return new Response(null,{status:204,headers:corsFor(origin)});
    if (req.method !== "POST") return json({error:{message:"Faqat POST so‘rovi qabul qilinadi."}},405,origin);
    if (!env.OPENROUTER_KEY) return json({error:{message:"Serverda OPENROUTER_KEY sozlanmagan."}},503,origin);
    const ip = req.headers.get("CF-Connecting-IP") || "unknown";
    if (env.RATE_KV) {
      const key=`rl:${ip}:${Math.floor(Date.now()/60000)}`;
      const current=Number.parseInt((await env.RATE_KV.get(key))||"0",10)||0;
      if(current>=20)return json({error:{message:"So‘rovlar chegarasi tugadi. Bir daqiqadan so‘ng qayta urinib ko‘ring."}},429,origin);
      ctx.waitUntil(env.RATE_KV.put(key,String(current+1),{expirationTtl:120}));
    }
    const declared=Number(req.headers.get("Content-Length")||0);
    if(declared>MAX_BODY_BYTES)return json({error:{message:"So‘rov hajmi juda katta."}},413,origin);
    let body;
    try {
      const raw = await req.text();
      if (new TextEncoder().encode(raw).byteLength > MAX_BODY_BYTES)
        return json({error:{message:"So‘rov hajmi juda katta."}},413,origin);
      body = JSON.parse(raw);
    } catch { return json({error:{message:"JSON so‘rovi noto‘g‘ri."}},400,origin); }
    if(!body||!Array.isArray(body.messages)||body.messages.length<1||body.messages.length>MAX_MESSAGES)
      return json({error:{message:"Xabarlar soni noto‘g‘ri."}},400,origin);
    const model=typeof body.model==="string"&&ALLOWED_MODELS.has(body.model)?body.model:"openrouter/free";
    const messages=[];
    for(const m of body.messages) {
      if(!m||!["system","user","assistant"].includes(m.role)||typeof m.content!=="string")
        return json({error:{message:"Xabar formati noto‘g‘ri."}},400,origin);
      if(m.content.length>MAX_CONTENT_CHARS)return json({error:{message:"Bitta xabar hajmi juda katta."}},413,origin);
      messages.push({role:m.role,content:m.content});
    }
    const temperature=Number.isFinite(body.temperature)?Math.max(0,Math.min(1.2,body.temperature)):0.3;
    const max_tokens=Number.isFinite(body.max_tokens)?Math.max(100,Math.min(3500,Math.floor(body.max_tokens))):1500;
    let upstream;
    try {
      upstream=await fetch("https://openrouter.ai/api/v1/chat/completions",{
        method:"POST",
        headers:{
          "Authorization":`Bearer ${env.OPENROUTER_KEY}`,
          "Content-Type":"application/json",
          "HTTP-Referer":"https://manba.pages.dev",
          "X-Title":"Manba — AI ustoz"
        },
        body:JSON.stringify({model,messages,temperature,max_tokens})
      });
    } catch { return json({error:{message:"AI provayderiga ulanib bo‘lmadi. Keyinroq qayta urinib ko‘ring."}},502,origin); }
    const text=await upstream.text();
    let parsed;
    try { parsed=JSON.parse(text); } catch { parsed={error:{message:"AI provayderidan noto‘g‘ri javob keldi."}}; }
    if(!upstream.ok) {
      const status=[400,401,403,404,429].includes(upstream.status)?upstream.status:502;
      const upstreamMessage=parsed?.error?.message;
      return json({error:{message:typeof upstreamMessage==="string"?upstreamMessage:"AI xizmati vaqtincha ishlamayapti."}},status,origin);
    }
    return json(parsed,200,origin);
  }
};