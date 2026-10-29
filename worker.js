/*
 * MANBA — Cloudflare Worker / OpenRouter proxy
 *
 * Deploy as a Cloudflare Worker. Configure:
 *   Secret: OPENROUTER_KEY
 *   Optional KV binding: RATE_KV
 *
 * Enter the deployed https://....workers.dev URL in the app Settings screen.
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
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Max-Age": "86400",
  "Vary": "Origin"
};
function json(data, status=200, responseHeaders=corsHeaders) {
  return new Response(JSON.stringify(data), {status, headers:{...responseHeaders,"Content-Type":"application/json; charset=utf-8","Cache-Control":"no-store"}});
}
export default {
  async fetch(req, env, ctx) {
    const origin = req.headers.get("Origin") || "";
    const allowedOrigin = typeof env.ALLOWED_ORIGIN === "string" ? env.ALLOWED_ORIGIN.trim() : "";
    // Optional browser-origin restriction. This is a CORS guard, not authentication.
    if (allowedOrigin && origin && origin !== allowedOrigin) {
      return new Response("Origin not allowed", {status:403,headers:{...corsHeaders,"Access-Control-Allow-Origin":allowedOrigin}});
    }
    const responseHeaders = {...corsHeaders, ...(allowedOrigin ? {"Access-Control-Allow-Origin":allowedOrigin} : {})};
    const send = (data, status=200) => json(data, status, responseHeaders);
    if (req.method === "OPTIONS") return new Response(null,{status:204,headers:responseHeaders});
    if (req.method !== "POST") return send({error:{message:"Faqat POST so‘rovi qabul qilinadi."}},405);
    if (!env.OPENROUTER_KEY) return send({error:{message:"Serverda OPENROUTER_KEY sozlanmagan."}},503);
    const ip = req.headers.get("CF-Connecting-IP") || "unknown";
    if (env.RATE_KV) {
      const key=`rl:${ip}:${Math.floor(Date.now()/60000)}`;
      const current=Number.parseInt((await env.RATE_KV.get(key))||"0",10)||0;
      if(current>=20)return send({error:{message:"So‘rovlar chegarasi tugadi. Bir daqiqadan so‘ng qayta urinib ko‘ring."}},429);
      ctx.waitUntil(env.RATE_KV.put(key,String(current+1),{expirationTtl:120}));
    }
    const declared=Number(req.headers.get("Content-Length")||0);
    if(declared>MAX_BODY_BYTES)return send({error:{message:"So‘rov hajmi juda katta."}},413);
    let body;
    try { body=await req.json(); } catch { return send({error:{message:"JSON so‘rovi noto‘g‘ri."}},400); }
    if(!body||!Array.isArray(body.messages)||body.messages.length<1||body.messages.length>MAX_MESSAGES)
      return send({error:{message:"Xabarlar soni noto‘g‘ri."}},400);
    const model=typeof body.model==="string"&&ALLOWED_MODELS.has(body.model)?body.model:"openrouter/free";
    const messages=[];
    for(const m of body.messages) {
      if(!m||!["system","user","assistant"].includes(m.role)||typeof m.content!=="string")
        return send({error:{message:"Xabar formati noto‘g‘ri."}},400);
      if(m.content.length>MAX_CONTENT_CHARS)return send({error:{message:"Bitta xabar hajmi juda katta."}},413);
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
          "HTTP-Referer":env.APP_ORIGIN || req.headers.get("Origin") || "https://manba.pages.dev",
          "X-Title":"Manba — AI ustoz"
        },
        body:JSON.stringify({model,messages,temperature,max_tokens})
      });
    } catch { return send({error:{message:"AI provayderiga ulanib bo‘lmadi. Keyinroq qayta urinib ko‘ring."}},502); }
    const text=await upstream.text();
    let parsed;
    try { parsed=JSON.parse(text); } catch { parsed={error:{message:"AI provayderidan noto‘g‘ri javob keldi."}}; }
    if(!upstream.ok) {
      const status=[400,401,403,404,429].includes(upstream.status)?upstream.status:502;
      const upstreamMessage=parsed?.error?.message;
      return send({error:{message:typeof upstreamMessage==="string"?upstreamMessage:"AI xizmati vaqtincha ishlamayapti."}},status);
    }
    return send(parsed,200);
  }
};