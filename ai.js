/* MANBA — AI layer (OpenRouter / Proxy) */
import { D, SUBJ } from './data.js';
import { toast } from './utils.js';

export async function ai(msgs, json = false) {
  if (!D.key && !D.proxy) {
    toast('Sozlamada API kalit yoki proksi URL kiriting');
    if (window.__manbaGo) window.__manbaGo('set');
    throw new Error('kalit yo‘q');
  }
  let er = '';
  const models = D.mod.split(',').map(s => s.trim()).filter(Boolean);
  for (const m of models) {
    const ctl = new AbortController();
    const tmo = setTimeout(() => ctl.abort(), 70000);
    try {
      const url = D.proxy
        ? D.proxy.replace(/\/$/, '') + '/api/chat'
        : 'https://openrouter.ai/api/v1/chat/completions';
      const h = { 'Content-Type': 'application/json' };
      if (!D.proxy) h.Authorization = 'Bearer ' + D.key;
      const r = await fetch(url, {
        method: 'POST',
        headers: h,
        body: JSON.stringify({
          model: m,
          messages: msgs,
          temperature: json ? 0.3 : 0.65
        }),
        signal: ctl.signal
      });
      const j = await r.json();
      const t = j.choices?.[0]?.message?.content;
      if (t) return t;
      er = (j.error && (j.error.message || j.error)) || 'javob bo‘sh';
    } catch (e) {
      er = e.name === 'AbortError' ? 'vaqt tugadi' : e.message;
    } finally {
      clearTimeout(tmo);
    }
  }
  throw new Error(String(er));
}

export function parseJSON(t) {
  const a = t.indexOf('[');
  const b = t.lastIndexOf(']');
  if (a < 0 || b < 0) throw new Error('format xato');
  return JSON.parse(t.slice(a, b + 1));
}

/* ---------- Retrieval (TF-IDF light) ---------- */
function chunksOf(s) {
  const paras = s.x.split(/\n{2,}/).map(p => p.trim()).filter(Boolean);
  const out = [];
  const push = t => out.push({ sn: s.n, x: t, id: s.id });
  let buf = '';
  const flush = () => { if (buf.trim()) push(buf.trim()); buf = ''; };
  for (const p of paras) {
    if (p.length > 1200) {
      flush();
      for (let i = 0; i < p.length; i += 1000) push(p.slice(i, i + 1000));
      continue;
    }
    if ((buf + '\n\n' + p).length > 900) flush();
    buf = buf ? buf + '\n\n' + p : p;
  }
  flush();
  return out;
}

const stems = s => (s.toLowerCase().match(/[\p{L}\p{N}]{3,}/gu) || []).map(t => t.slice(0, 5));

export function pick(sel) {
  return sel === 'all' || !sel ? D.src : D.src.filter(s => s.id === sel);
}

function allChunks(sel) {
  return pick(sel).flatMap(chunksOf);
}

function sample(a, k) {
  if (a.length <= k) return a;
  const st = a.length / k;
  return Array.from({ length: k }, (_, i) => a[Math.floor(i * st)]);
}

export function retrieve(q, sel, k = 6) {
  const all = allChunks(sel);
  if (!all.length) return [];
  const qt = [...new Set(stems(q || ''))];
  if (!qt.length) return sample(all, k);
  const N = all.length;
  const tfs = all.map(c => {
    const m = {};
    stems(c.x).forEach(t => m[t] = (m[t] || 0) + 1);
    return m;
  });
  const df = {};
  qt.forEach(t => df[t] = tfs.filter(m => m[t]).length);
  const scored = tfs
    .map((m, i) => [
      qt.reduce((s, t) => {
        const f = m[t] || 0;
        return f ? s + (f / (f + 1.2)) * Math.log(1 + N / (1 + df[t])) : s;
      }, 0),
      i
    ])
    .filter(p => p[0] > 0)
    .sort((a, b) => b[0] - a[0])
    .slice(0, k)
    .map(p => all[p[1]]);
  return scored.length ? scored : sample(all, k);
}

export const ctxText = refs =>
  refs.map((c, i) => `[${i + 1}] ${c.sn}:\n${c.x}`).join('\n\n').slice(0, 14000);
