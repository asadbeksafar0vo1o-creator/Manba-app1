'use strict';
/* Manba AI — shaxsiy ta’lim platformasi. Frameworksiz (vanilla JS), GitHub Pages’da ishlaydi. */

/* ---------- yordamchilar ---------- */
const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const day = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const addDay = n => { const d = new Date(); d.setDate(d.getDate() + n); return day(d); };
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
const shuf = a => { a = [...a]; for (let i = a.length - 1; i > 0; i--) { const j = Math.random() * (i + 1) | 0; [a[i], a[j]] = [a[j], a[i]]; } return a; };
const MONTHS = ['Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun', 'Iyul', 'Avgust', 'Sentabr', 'Oktabr', 'Noyabr', 'Dekabr'];
const p2 = n => String(n).padStart(2, '0');
let tt; function toast(m) { const t = $('#toast'); t.textContent = m; t.classList.add('show'); clearTimeout(tt); tt = setTimeout(() => t.classList.remove('show'), 3400); }

/* ---------- saqlash ---------- */
const KEY = 'manba.data.v1';
const def = () => ({ sources: [], chat: [], cards: [], goals: [], events: {}, rem: [], daily: {}, points: 0, pomo: 0, settings: { model: 'openrouter/free', style: 'oddiy', theme: 'dark', role: 'talaba' } });
let S = def();
const SRC = 'manba.src.v1'; let srcDirty = false;
try { const d = JSON.parse(localStorage.getItem(KEY) || '{}'); S = { ...def(), ...d, settings: { ...def().settings, ...(d.settings || {}) } }; const s = JSON.parse(localStorage.getItem(SRC) || 'null'); if (Array.isArray(s)) S.sources = s; } catch (e) { /* buzilgan ma’lumot: bo‘sh boshlaymiz */ }
let saveT; const save = () => { clearTimeout(saveT); saveT = setTimeout(saveNow, 400); };
function saveNow() { try { const { sources, ...rest } = S; localStorage.setItem(KEY, JSON.stringify(rest)); if (srcDirty) { localStorage.setItem(SRC, JSON.stringify(sources)); srcDirty = false; } } catch (e) { toast('Xotira to‘ldi: katta manbani o‘chiring.'); } }
const saveSrc = () => { srcDirty = true; saveNow(); };
addEventListener('beforeunload', saveNow);
const D = () => (S.daily[day()] ||= { sec: 0, tests: 0, cards: 0, chats: 0, docs: 0, pomo: 0 });
function add(k, n = 1, pts = 0) { D()[k] = (D()[k] || 0) + n; S.points += pts; const ks = Object.keys(S.daily).sort(); while (ks.length > 90) delete S.daily[ks.shift()]; save(); }
const getKey = () => localStorage.getItem('manba.key') || sessionStorage.getItem('manba.key') || '';
function streak() { let n = 0, d = new Date(), first = true; for (;;) { const v = S.daily[day(d)]; const a = v && (v.sec >= 60 || v.tests || v.cards || v.chats || v.docs); if (a) n++; else if (!first) break; first = false; d.setDate(d.getDate() - 1); } return n; }
const fmtMin = sec => { const m = Math.floor(sec / 60), h = Math.floor(m / 60); return h ? `${h} soat ${m % 60} daq` : `${m} daq`; };
const last7 = f => { const o = []; for (let i = 6; i >= 0; i--) { const d = new Date(); d.setDate(d.getDate() - i); o.push({ l: ['Ya', 'Du', 'Se', 'Ch', 'Pa', 'Ju', 'Sh'][d.getDay()], v: f(S.daily[day(d)] || {}) }); } return o; };
const chart = a => { const m = Math.max(10, ...a.map(x => x.v)); return `<svg class="chart" viewBox="0 0 280 120" role="img" aria-label="Haftalik grafik">${a.map((x, i) => { const h = Math.round(x.v / m * 72); return `<rect x="${i * 40 + 8}" y="${94 - h}" width="24" height="${Math.max(h, 3)}" rx="6"></rect><text class="v" x="${i * 40 + 20}" y="${88 - h}">${x.v || ''}</text><text class="l" x="${i * 40 + 20}" y="113">${x.l}</text>`; }).join('')}</svg>`; };

/* ---------- matn va fayl ---------- */
function md(t) {
  let o = '', ul = false, ol = false; const close = () => { if (ul) { o += '</ul>'; ul = false; } if (ol) { o += '</ol>'; ol = false; } };
  const inl = s => s.replace(/\*\*(.+?)\*\*/g, '<b>$1</b>').replace(/`([^`]+)`/g, '<code>$1</code>').replace(/(^|[^*])\*([^*\n]+)\*/g, '$1<i>$2</i>');
  for (const l of esc(t).split('\n')) {
    let m;
    if (l.trim() === '====') { close(); o += '<div style="page-break-after:always"></div>'; }
    else if (l.trim() === '~') { close(); o += '<p style="margin:34px 0">&nbsp;</p>'; }
    else if ((m = l.match(/^\^\s?(.*)/))) { close(); o += `<p style="text-align:center">${inl(m[1])}</p>`; }
    else if ((m = l.match(/^#{1,4}\s+(.*)/))) { close(); o += `<h4>${inl(m[1])}</h4>`; }
    else if ((m = l.match(/^\s*[-*•]\s+(.*)/))) { if (!ul) { close(); o += '<ul>'; ul = true; } o += `<li>${inl(m[1])}</li>`; }
    else if ((m = l.match(/^\s*\d+[.)]\s+(.*)/))) { if (!ol) { close(); o += '<ol>'; ol = true; } o += `<li>${inl(m[1])}</li>`; }
    else if (!l.trim()) close(); else { close(); o += `<p>${inl(l)}</p>`; }
  }
  close(); return o;
}
function pj(t) {
  const m = String(t).replace(/```json|```/g, ''), a = m.search(/[\[{]/), z = Math.max(m.lastIndexOf(']'), m.lastIndexOf('}'));
  if (a < 0 || z < a) throw new Error('AI javobi kutilgan formatda emas. Qayta urinib ko‘ring.');
  try { return JSON.parse(m.slice(a, z + 1)); } catch (e) { throw new Error('AI javobini o‘qib bo‘lmadi. Qayta urinib ko‘ring.'); }
}
function dl(name, type, content) { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob(['\ufeff', content], { type: type + ';charset=utf-8' })); a.download = name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 4000); }
const LIB = { pdf: 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js', pdfw: 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js', docx: 'https://cdnjs.cloudflare.com/ajax/libs/mammoth/1.6.0/mammoth.browser.min.js', pptx: 'https://cdnjs.cloudflare.com/ajax/libs/PptxGenJS/3.12.0/pptxgen.bundle.js' };
const lib = src => document.querySelector(`script[src="${src}"]`) ? Promise.resolve() : new Promise((ok, no) => { const s = document.createElement('script'); s.src = src; s.onload = ok; s.onerror = () => no(new Error('Kutubxona yuklanmadi. Internetni tekshiring.')); document.head.appendChild(s); });
async function readFile(f) {
  const n = f.name.toLowerCase();
  if (n.endsWith('.pdf')) { await lib(LIB.pdf); pdfjsLib.GlobalWorkerOptions.workerSrc = LIB.pdfw; const doc = await pdfjsLib.getDocument({ data: await f.arrayBuffer() }).promise; let t = ''; for (let i = 1; i <= doc.numPages; i++) { const c = await (await doc.getPage(i)).getTextContent(); t += c.items.map(x => x.str).join(' ') + '\n'; } return t; }
  if (n.endsWith('.docx')) { await lib(LIB.docx); return (await mammoth.extractRawText({ arrayBuffer: await f.arrayBuffer() })).value; }
  return f.text();
}
const toDataURL = f => new Promise((ok, no) => { const r = new FileReader(); r.onload = () => ok(r.result); r.onerror = () => no(new Error('Fayl o‘qilmadi.')); r.readAsDataURL(f); });

/* ---------- AI ---------- */
const API = 'https://openrouter.ai/api/v1/chat/completions';
const hdr = key => ({ 'Content-Type': 'application/json', Authorization: 'Bearer ' + key, 'HTTP-Referer': location.origin, 'X-Title': 'Manba AI' });
async function ai(messages, o = {}) {
  const key = getKey(); if (!key) throw new Error('Avval Sozlamalar bo‘limida OpenRouter API kalitini kiriting.');
  for (let n = 0; ; n++) {
    let r; try { r = await fetch(API, { method: 'POST', headers: hdr(key), body: JSON.stringify({ model: S.settings.model || 'openrouter/free', messages, temperature: o.t ?? .4, max_tokens: o.max || 2500 }) }); } catch (e) { throw new Error('Internetga ulanib bo‘lmadi.'); }
    const d = await r.json().catch(() => ({}));
    if ((r.status === 429 || r.status >= 500) && n < 2) { await new Promise(s => setTimeout(s, 1500 * (n + 1))); continue; }
    if (r.status === 401) throw new Error('API kaliti noto‘g‘ri yoki muddati tugagan. Sozlamalarda tekshiring.');
    if (r.status === 402) throw new Error('OpenRouter hisobida mablag‘ yetarli emas yoki model pullik.');
    if (r.status === 429) throw new Error('Bepul modelning limiti tugadi. Birozdan keyin urinib ko‘ring yoki boshqa model tanlang.');
    if (!r.ok) throw new Error(d.error?.message || `AI xatosi (${r.status}). Kalit yoki modelni tekshiring.`);
    const c = d.choices?.[0]?.message?.content, t = Array.isArray(c) ? c.map(x => x.text || '').join('') : c;
    if (!t || !String(t).trim()) { if (n < 1) continue; throw new Error('AI bo‘sh javob qaytardi. Qayta urinib ko‘ring yoki boshqa model tanlang.'); }
    return String(t);
  }
}
async function aiJ(m, o) { for (let i = 0; ; i++) { const t = await ai(m, o); try { return pj(t); } catch (e) { if (i) throw e; } } }
async function aiStream(messages, o, on) {
  const key = getKey(); if (!key) return null;
  const r = await fetch(API, { method: 'POST', headers: hdr(key), body: JSON.stringify({ model: S.settings.model || 'openrouter/free', messages, temperature: .4, max_tokens: o.max || 2000, stream: true }) });
  if (!r.ok || !r.body) return null;
  const rd = r.body.getReader(), dec = new TextDecoder(); let buf = '', full = '';
  for (;;) { const { done, value } = await rd.read(); if (done) break; buf += dec.decode(value, { stream: true }); let i;
    while ((i = buf.indexOf('\n')) >= 0) { const line = buf.slice(0, i).trim(); buf = buf.slice(i + 1); if (!line.startsWith('data:')) continue; const d = line.slice(5).trim(); if (d === '[DONE]') continue; try { const t = JSON.parse(d).choices?.[0]?.delta?.content; if (t) { full += t; on(full); } } catch (e) { /* to‘liq bo‘lmagan qism */ } } }
  return full;
}
const STY = { oddiy: 'Oddiy va tushunarli tilda tushuntiring.', ilmiy: 'Ilmiy-rasmiy uslubda yozing.', qisqa: 'Juda qisqa va aniq yozing.' };
const sys = () => `Siz Manba AI — o‘zbekcha ta’lim yordamchisisiz. ${STY[S.settings.style] || ''} ${ROLE[S.settings.role] ? 'Foydalanuvchi: ' + ROLE[S.settings.role] + '.' : ''} Javobni o‘zbek tilida yozing (boshqa til so‘ralmasa). Aniq bo‘ling, faktlarni to‘qib chiqarmang; bilmasangiz, shuni ayting.`;
function ctx(max = 28000) { const a = S.sources.filter(s => s.on !== false); if (!a.length) return ''; const per = Math.floor(max / a.length); return a.map(s => `### ${s.name}\n${s.text.slice(0, per)}`).join('\n\n'); }
const srcNote = () => { const c = ctx(); return c ? `\n\nMANBALAR (faqat shularga tayaning; javob manbada bo‘lmasa, buni aniq ayting):\n${c}` : ''; };
async function busy(btn, out, fn) {
  const o = btn.textContent; btn.disabled = true; btn.textContent = 'Tayyorlanmoqda…'; if (out) out.innerHTML = '<div class="load"><i></i> AI ishlayapti…</div>';
  try { await fn(); } catch (e) { if (out) out.innerHTML = `<div class="err">${esc(e.message)}</div>`; toast(e.message); } finally { btn.disabled = false; btn.textContent = o; }
}
function showOut(el, text, name) {
  el.innerHTML = `<article class="panel" id="outbox"><div class="md">${md(text)}</div><div class="row"><button class="btn" data-a="copy">Nusxa olish</button><button class="btn" data-a="txt">.txt</button><button class="btn" data-a="doc">Word (.doc)</button><button class="btn" data-a="print">PDF / Chop etish</button></div></article>`;
  el.onclick = e => { const a = e.target.dataset?.a; if (!a) return; if (a === 'copy') navigator.clipboard.writeText(text).then(() => toast('Nusxalandi'), () => toast('Nusxalab bo‘lmadi')); else if (a === 'txt') dl(name + '.txt', 'text/plain', text); else if (a === 'doc') dl(name + '.doc', 'application/msword', `<html><head><meta charset="utf-8"></head><body>${md(text)}</body></html>`); else window.print(); };
}
function listen(onText, btn) {
  const R = window.SpeechRecognition || window.webkitSpeechRecognition; if (!R) return toast('Brauzer ovozdan matnni qo‘llamaydi (Chrome yoki Edge tavsiya).');
  const r = new R(); r.lang = 'uz-UZ'; r.interimResults = false; r.onresult = e => onText([...e.results].map(x => x[0].transcript).join(' ')); r.onerror = e => toast('Mikrofon xatosi: ' + e.error); r.onend = () => btn?.classList.remove('rec'); btn?.classList.add('rec'); r.start();
}
function speak(t) {
  if (!('speechSynthesis' in window)) return toast('Brauzer ovozli o‘qishni qo‘llamaydi.');
  speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(String(t).replace(/[#*`]/g, '').slice(0, 4000)); u.lang = 'uz-UZ'; const v = speechSynthesis.getVoices().find(v => /^uz/i.test(v.lang)); if (v) u.voice = v; speechSynthesis.speak(u);
}

/* ---------- sahifalar ---------- */
const IC = {"tick": "<path d=\"m5 12 5 5L20 7\"/>", "play": "<path d=\"M6 4l14 8-14 8z\" fill=\"currentColor\"/>", "pause": "<path d=\"M7 4h4v16H7zM13 4h4v16h-4z\" fill=\"currentColor\"/>", "flask": "<path d=\"M9 3h6M10 3v6L4 19a2 2 0 0 0 2 3h12a2 2 0 0 0 2-3l-6-10V3\"/>", "cap": "<path d=\"M22 10 12 5 2 10l10 5z\"/><path d=\"M6 12v5c3 2 9 2 12 0v-5\"/>", "reset": "<path d=\"M3 12a9 9 0 1 0 3-6.7L3 8\"/><path d=\"M3 3v5h5\"/>", "pen": "<path d=\"M12 20h9\"/><path d=\"M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z\"/>", "plus": "<path d=\"M12 5v14M5 12h14\"/>", "crown": "<path d=\"M2 20h20M4 20 2 7l6 5 4-8 4 8 6-5-2 13\"/>", "chev": "<path d=\"m15 18-6-6 6-6\"/>", "home": "<path d=\"M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z\"/>", "sparkles": "<path d=\"m12 3 1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z\"/><path d=\"m19 16 .8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8z\"/>", "book": "<path d=\"M2 4h7a3 3 0 0 1 3 3v14a2 2 0 0 0-2-2H2z\"/><path d=\"M22 4h-7a3 3 0 0 0-3 3v14a2 2 0 0 1 2-2h8z\"/>", "check": "<path d=\"m9 11 3 3L22 4\"/><path d=\"M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11\"/>", "layers": "<path d=\"m12 2 10 5-10 5L2 7z\"/><path d=\"m2 17 10 5 10-5\"/><path d=\"m2 12 10 5 10-5\"/>", "file": "<path d=\"M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z\"/><path d=\"M14 2v6h6M8 13h8M8 17h8M8 9h2\"/>", "slides": "<path d=\"M2 3h20M21 3v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V3M12 16v5M8 21h8M7 12l3-3 2 2 4-4\"/>", "target": "<circle cx=\"12\" cy=\"12\" r=\"10\"/><circle cx=\"12\" cy=\"12\" r=\"6\"/><circle cx=\"12\" cy=\"12\" r=\"2\"/>", "timer": "<circle cx=\"12\" cy=\"14\" r=\"8\"/><path d=\"M12 14l3-3M10 2h4\"/>", "cal": "<rect x=\"3\" y=\"4\" width=\"18\" height=\"18\" rx=\"2\"/><path d=\"M8 2v4M16 2v4M3 10h18\"/>", "bell": "<path d=\"M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9M10.3 21a1.94 1.94 0 0 0 3.4 0\"/>", "chart": "<path d=\"M12 20V10M18 20V4M6 20v-4\"/>", "tools": "<path d=\"M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94z\"/>", "users": "<path d=\"M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2\"/><circle cx=\"9\" cy=\"7\" r=\"4\"/><path d=\"M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75\"/>", "sliders": "<path d=\"M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6\"/>", "send": "<path d=\"M22 2 11 13M22 2l-7 20-4-9-9-4z\"/>", "clock": "<circle cx=\"12\" cy=\"12\" r=\"10\"/><path d=\"M12 6v6l4 2\"/>", "flame": "<path d=\"M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.07-2.14-.22-4.05 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.15.43-2.29 1-3a2.5 2.5 0 0 0 2.5 2.5z\"/>", "trophy": "<path d=\"M6 9H4.5a2.5 2.5 0 0 1 0-5H6M18 9h1.5a2.5 2.5 0 0 0 0-5H18M4 22h16M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22M18 2H6v7a6 6 0 0 0 12 0z\"/>", "star": "<path d=\"m12 2 3.1 6.3 6.9 1-5 4.9 1.2 6.8-6.2-3.3-6.2 3.3L8 14.2l-5-4.9 6.9-1z\"/>", "globe": "<circle cx=\"12\" cy=\"12\" r=\"10\"/><path d=\"M2 12h20M12 2a15 15 0 0 1 0 20 15 15 0 0 1 0-20\"/>", "search": "<circle cx=\"11\" cy=\"11\" r=\"8\"/><path d=\"m21 21-4.3-4.3\"/>", "chat": "<path d=\"M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z\"/>", "image": "<rect x=\"3\" y=\"3\" width=\"18\" height=\"18\" rx=\"2\"/><circle cx=\"9\" cy=\"9\" r=\"2\"/><path d=\"m21 15-5-5L5 21\"/>", "sigma": "<path d=\"M18 7V5H6l6 7-6 7h12v-2\"/>", "mic": "<path d=\"M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z\"/><path d=\"M19 10v2a7 7 0 0 1-14 0v-2M12 19v3\"/>", "volume": "<path d=\"M11 5 6 9H2v6h4l5 4z\"/><path d=\"M15.5 8.5a5 5 0 0 1 0 7M19 5a10 10 0 0 1 0 14\"/>", "menu": "<path d=\"M4 6h16M4 12h16M4 18h16\"/>", "user": "<circle cx=\"12\" cy=\"8\" r=\"4\"/><path d=\"M4 21a8 8 0 0 1 16 0\"/>"};
const ic = (n, s = 22) => `<svg class="ic" width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${IC[n] || ''}</svg>`;
const NAV = [['home', 'Bosh sahifa', 'home'], ['tutor', 'AI Ustoz', 'sparkles'], ['sources', 'Manbalar', 'book'], ['tests', 'Testlar', 'check'], ['cards', 'Flashkartalar', 'layers'], ['referat', 'Referat', 'file'], ['independent', 'Mustaqil ish', 'pen'], ['slides', 'Slaydlar', 'slides'], ['teacher', 'O‘qituvchi', 'users'], ['pomodoro', 'Pomodoro', 'timer'], ['goals', 'Maqsadlar', 'target'], ['stats', 'Statistika', 'chart'], ['calendar', 'Kalendar', 'cal'], ['reminders', 'Eslatmalar', 'bell'], ['tools', 'Vositalar', 'tools'], ['settings', 'Sozlamalar', 'sliders']];
const ROLE = { talaba: 'talaba (o‘rganish va rivojlanish)', oqituvchi: 'o‘qituvchi (dars tayyorlash va tahlil)', tadqiqotchi: 'tadqiqotchi (manba tahlili va yozuv)' };
const MODELS = ['openrouter/free', 'meta-llama/llama-3.3-70b-instruct:free', 'google/gemma-3-27b-it:free', 'deepseek/deepseek-chat-v3.1:free'];
const COL = { home: '#6aa3ff', tutor: '#4c8dff', sources: '#3aa7ff', tests: '#a35cff', cards: '#19c58b', referat: '#4d9bff', independent: '#f59e0b', slides: '#d44cf0', teacher: '#ffb020', pomodoro: '#ff4d5e', goals: '#f472b6', stats: '#2dd4bf', calendar: '#60a5fa', reminders: '#fbbf24', tools: '#a3e635', settings: '#94a3b8' };
const TILES = ['tutor', 'sources', 'tests', 'cards', 'referat', 'slides', 'goals', 'pomodoro', 'calendar', 'reminders', 'stats', 'settings'];
const TL = { summary: ['Konspekt', 'Quyidagi matndan o‘zbek tilida tartibli konspekt tuzing: asosiy g‘oyalar, muhim atamalar, qisqa xulosa.'], translate: ['Tarjima'], analyze: ['Matn tahlili', 'Matnning asosiy mavzusi, g‘oyalari, uslubi, kuchli va zaif tomonlarini tahlil qiling va xulosa yozing.'], formula: ['Formula yechish', 'Masalani bosqichma-bosqich yeching: berilgan, topish kerak, formula, hisob-kitob, yakuniy javob.'], image: ['Rasm tahlili', 'Rasmni diqqat bilan ko‘ring: undagi matn, jadval, grafik yoki masalani tushuntiring va kerak bo‘lsa yeching.'], simple: ['Oddiy tushuntirish', 'Mavzuni 10 yoshli bolaga tushuntirgandek, oddiy misollar bilan tushuntiring, so‘ng 3 ta savol bilan tekshiring.'] };
const MI = { 'Tahliliy ish': 'II bob — tahlil: ma’lumotlar, taqqoslash jadvali, sabab-oqibat tahlili va o‘z xulosalaringiz.', 'Amaliy ish': 'II bob — amaliy qism: kamida 3 ta aniq masala yoki topshiriq va ularning bosqichma-bosqich yechimi.', 'Loyiha ishi': 'II bob — loyiha: maqsad, bosqichlar, kerakli resurslar, kutilayotgan natija va xavflar.', 'Esse': 'Asosiy qism: tezis, kamida 3 ta argument, qarama-qarshi fikr va unga javob (bob bo‘linmasdan, esse uslubida).' };
const EXTRAS = [['summary', 'file', 'Konspekt', 'Matndan qisqa konspekt'], ['translate', 'globe', 'Tarjima', 'Ko‘p tilli tarjima'], ['analyze', 'search', 'Matn tahlili', 'Asosiy g‘oyalar, xulosa'], ['chat', 'chat', 'PDF bilan chat', 'Hujjat bilan AI suhbat'], ['image', 'image', 'Rasm tahlili', 'Rasm, javob, grafika'], ['formula', 'sigma', 'Formula yechish', 'Matematika, fizika, kimyo'], ['voice', 'mic', 'Ovozdan matn', 'Diktant, ma’ruza yozuvi'], ['voice', 'volume', 'Matndan ovoz', 'Tabiiy talaffuzda tinglash']];
const TP = { lesson: ['Dars rejasi', 'Dars rejasi tuzing: maqsad va vazifalar, kerakli jihozlar, dars bosqichlari (vaqt taqsimoti bilan), faol metodlar, mustahkamlash, baholash, uy vazifasi.'], quiz: ['Nazorat testi', '10 ta savoldan iborat nazorat testi tuzing (A/B/C/D variantlar), oxirida javoblar kaliti bering va ikki xil (A va B) nusxa tayyorlang.'], hw: ['Uy vazifasi', 'Differensial uy vazifalarini tuzing: oson, o‘rta va murakkab darajada 3 tadan topshiriq hamda tekshirish mezoni.'], rubric: ['Baholash mezonlari', '5 ballik baholash mezonlarini (rubrika) aniq ko‘rsatkichlar bilan tuzing.'], method: ['Metodik tavsiya', 'Mavzuni qiziqarli o‘tish uchun metodik tavsiyalar bering: motivatsiya, interfaol o‘yinlar, vizual vositalar, o‘quvchilarning tipik xatolari.'] };
let PRE = null, PREQ = null;

const V = {
  home: {
    t: 'Bosh sahifa',
    html() {
      const T = D(), all = Object.values(S.daily), sum = k => all.reduce((a, v) => a + (v[k] || 0), 0);
      const aT = T.tests || 0, aC = T.cards || 0, aM = Math.floor((T.sec || 0) / 60), rr = (a, b) => Math.min(1, a / b), pct = Math.round((rr(aT, 5) + rr(aC, 30) + rr(aM, 60)) / 3 * 100);
      const done = S.goals.filter(g => g.done >= g.target).length, lbl = v => NAV.find(x => x[0] === v);
      const ev = (S.events[day()] || []).map(e => e.t), rm = S.rem.filter(r => !r.done).sort((a, b) => a.at.localeCompare(b.at)).slice(0, 3).map(r => `⏰ ${r.text} · ${r.at.slice(5).replace('T', ' ')}`), today = [...ev.map(t => '📅 ' + t), ...rm];
      const SAT = '<svg class="sat" viewBox="0 0 120 80" aria-hidden="true"><rect x="46" y="28" width="28" height="24" rx="4" fill="#cfd8f6"/><rect x="2" y="30" width="38" height="20" rx="2" fill="#2d6cdf"/><rect x="80" y="30" width="38" height="20" rx="2" fill="#2d6cdf"/><path d="M60 28V12M54 12h12" stroke="#cfd8f6" stroke-width="3"/><circle cx="60" cy="40" r="6" fill="#38bdf8"/></svg>';
      const CHIP = '<svg class="chip3" viewBox="0 0 120 120" aria-hidden="true"><defs><linearGradient id="cg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#38bdf8"/><stop offset="1" stop-color="#a855f7"/></linearGradient></defs><g stroke="url(#cg)" stroke-width="3" fill="none" stroke-linecap="round"><path d="M44 16v16M60 16v16M76 16v16M44 88v16M60 88v16M76 88v16M16 44h16M16 60h16M16 76h16M88 44h16M88 60h16M88 76h16"/><rect x="32" y="32" width="56" height="56" rx="10" fill="rgba(80,120,255,.18)"/></g><text x="60" y="69" text-anchor="middle" font-size="26" font-weight="800" fill="#fff">AI</text></svg>';
      const T8 = [['tutor', 'Savol-javob, tushuntirish'], ['sources', 'PDF, DOCX, TXT yuklash va tahlil'], ['tests', 'Mavzu bo‘yicha test yaratish'], ['cards', 'Tez va samarali yodlash'], ['referat', 'Ilmiy matn yaratish'], ['slides', 'Zamonaviy taqdimot (PPTX, PDF)'], ['teacher', 'Dars rejasi, savollar'], ['pomodoro', 'Diqqat va vaqt']];
      const row = (i, txt, ok) => `<div class="ar"><span class="ti sm" style="--c:#34d399">${ic(i, 18)}</span><span>${txt}</span><i class="ck ${ok ? 'ok' : ''}">${ok ? ic('tick', 13) : ''}</i></div>`;
      const mods = [...new Set([S.settings.model, ...MODELS])];
      const R = [['talaba', 'users', 'Talaba', 'O‘rganish va rivojlanish'], ['oqituvchi', 'user', 'O‘qituvchi', 'Dars tayyorlash va tahlil'], ['tadqiqotchi', 'flask', 'Tadqiqotchi', 'Manba tahlili va yozuv']];
      const ring = (rid, big, bid, bt, sm, off) => `<div class="ring2 ${big ? 'big' : ''}"><svg viewBox="0 0 100 100"><circle class="t" cx="50" cy="50" r="42"></circle><circle class="p" ${rid ? `id="${rid}"` : ''} cx="50" cy="50" r="42" style="stroke-dashoffset:${off}"></circle></svg><b ${bid ? `id="${bid}"` : ''}>${bt}</b><small>${sm}</small></div>`;
      return `<div class="dash"><div class="dmain">
<section class="hero">${SAT}<div class="hero-txt"><h1>Manba <span>AI</span></h1><p class="hl2">Talabalar va o‘qituvchilar uchun zamonaviy AI ta’lim platformasi</p><div class="chips2"><a href="#/tutor">${ic('book', 16)} O‘rgan</a><a href="#/referat">${ic('pen', 16)} Yarat</a><a href="#/tests">${ic('check', 16)} Sinovdan o‘tkaz</a><a href="#/stats">${ic('chart', 16)} Rivojlan</a></div><form id="ask" class="ask big"><span class="sp2">${ic('sparkles', 22)}</span><input id="askq" maxlength="400" placeholder="Savolingizni yozing yoki mavzu kiriting…" autocomplete="off" aria-label="Savolingiz"><button aria-label="Yuborish">${ic('send', 20)}</button></form></div></section>
<div class="t8s">${T8.map(([v, s]) => `<a class="t8" href="#/${v}" style="--c:${COL[v]}">${ic(lbl(v)[2], 40)}<b>${lbl(v)[1]}</b><small>${s}</small></a>`).join('')}</div>
<div class="row3"><div class="panel"><h3 class="ph">${ic('chart', 20)} Bugungi faoliyat</h3><div class="act">${ring('', false, '', pct + '%', 'Kundalik maqsad', 264 * (1 - pct / 100))}<div class="arows">${row('check', `Test: ${aT} / 5`, aT >= 5)}${row('layers', `Kartalar: ${aC} / 30`, aC >= 30)}${row('book', `O‘qish: ${aM} daqiqa`, aM >= 60)}</div></div></div>
<div class="panel"><h3 class="ph">${ic('flame', 20)} Tezkor harakatlar</h3><div class="qa4"><a href="#/tests" style="--c:#6aa3ff">${ic('check', 18)} Yangi test</a><a href="#/cards" style="--c:#fb923c">${ic('layers', 18)} Kartalar to‘plami</a><a href="#/slides" style="--c:#d44cf0">${ic('slides', 18)} Slayd yaratish</a><a href="#/referat" style="--c:#4d9bff">${ic('file', 18)} Referat yozish</a></div></div>
<div class="panel"><h3 class="ph">${ic('sparkles', 20)} AI modellari</h3><div class="mdl"><div class="msel"><label>Provayder<select id="hm-p" disabled><option>OpenRouter (Tavsiya)</option></select></label><label>Model<select id="hm-m">${mods.map(m => `<option ${m === S.settings.model ? 'selected' : ''}>${esc(m)}</option>`).join('')}</select></label></div>${CHIP}</div></div></div>
<div class="panel role"><div class="rq"><span class="cap">${ic('cap', 40)}</span><b>Siz kim sifatida foydalanasiz?</b></div><div class="rbtns">${R.map(([k, i, t, s]) => `<button class="rb ${S.settings.role === k ? 'on' : ''}" data-r="${k}"><span class="ti sm">${ic(i, 20)}</span><span><b>${t}</b><small>${s}</small></span><i class="rck">${ic('tick', 13)}</i></button>`).join('')}</div></div>
<div class="panel"><p class="eyebrow">✦ QO‘SHIMCHA KUCHLI FUNKSIYALAR</p><div class="extras">${EXTRAS.map((x, i) => `<button class="extra" data-x="${x[0]}" style="--c:${['#60a5fa', '#a78bfa', '#38bdf8', '#34d399', '#e879f9', '#fb923c', '#f87171', '#2dd4bf'][i]}"><span class="ti">${ic(x[1], 24)}</span><span>${x[2]}</span><small>${x[3]}</small></button>`).join('')}</div></div>
<div class="cols"><div class="panel"><h3>Maqsadlar (${done}/${S.goals.length})</h3>${S.goals.slice(0, 3).map(g => `<div style="margin-bottom:12px"><div class="row between"><span>${esc(g.name)}</span><small class="muted">${g.done}/${g.target}</small></div><div class="bar"><i style="width:${Math.min(100, g.done / g.target * 100)}%"></i></div></div>`).join('') || '<p class="muted">Hali maqsad yo‘q.</p>'}<a class="btn block" href="#/goals" style="margin-top:8px">Maqsadlarni boshqarish</a></div><div class="panel"><h3>Haftalik o‘qish vaqti (daqiqa)</h3>${chart(last7(v => Math.round((v.sec || 0) / 60)))}</div><div class="panel"><h3>Bugun</h3>${today.map(t => `<div class="item">${esc(t)}</div>`).join('') || '<p class="muted">Bugunga reja yo‘q.</p>'}<a class="btn block" href="#/calendar" style="margin-top:10px">Kalendar</a></div></div>
</div>
<aside class="drail"><div class="panel"><h3 class="ph">${ic('chart', 20)} Umumiy statistika</h3><div class="st4">${[['chat', '#4c8dff', sum('chats'), 'Suhbat'], ['check', '#e85dd4', sum('tests'), 'Test'], ['layers', '#19c58b', S.cards.length, 'Kartalar'], ['file', '#4d9bff', S.sources.length, 'Manba']].map(([i, c, v, l]) => `<div style="--c:${c}"><span class="ti sm">${ic(i, 20)}</span><span><b>${v}</b><small>${l}</small></span></div>`).join('')}</div></div>
<div class="panel"><div class="row between" style="margin-bottom:10px"><h3 class="ph" style="margin:0">${ic('cal', 20)} Kalendar</h3></div><div class="row between" style="margin:0 0 6px"><button class="mcb" id="mc-p" aria-label="Oldingi oy">‹</button><b id="mc-t"></b><button class="mcb" id="mc-n" aria-label="Keyingi oy">›</button></div><div class="mc" id="mc-g"></div></div>
<div class="panel"><h3 class="ph">${ic('timer', 20)} Pomodoro</h3><div class="hpm">${ring('hp-r', true, 'hp-t', '25:00', 'Ish vaqti', 0)}</div><div class="row center" style="margin:0"><a class="icon-btn" href="#/pomodoro" aria-label="Pomodoro sozlamalari">${ic('sliders', 18)}</a><button class="play" id="hp-go" aria-label="Boshlash/Pauza"></button><button class="icon-btn" id="hp-rs" aria-label="Qayta boshlash">${ic('reset', 18)}</button></div></div></aside></div>`;
    },
    bind() {
      $('#ask').onsubmit = e => { e.preventDefault(); PREQ = $('#askq').value.trim(); go('tutor'); };
      $$('.extra').forEach(b => b.onclick = () => { const x = b.dataset.x; if (x === 'chat') go('tutor'); else { PRE = x; go('tools'); } });
      $('#hm-m').onchange = e => { S.settings.model = e.target.value; save(); toast('Model: ' + e.target.value); };
      $$('.rb').forEach(b => b.onclick = () => { S.settings.role = b.dataset.r; save(); $$('.rb').forEach(x => x.classList.toggle('on', x === b)); toast('Rol tanlandi: ' + b.querySelector('b').textContent); });
      $('#hp-go').onclick = pomoToggle; $('#hp-rs').onclick = () => { P.run = false; P.left = P.total; document.title = 'Manba AI'; pomoDraw(); }; pomoDraw();
      let mv = new Date();
      const mc = () => { const y = mv.getFullYear(), m = mv.getMonth(), off = (new Date(y, m, 1).getDay() + 6) % 7, n = new Date(y, m + 1, 0).getDate(); $('#mc-t').textContent = `${MONTHS[m]} ${y}`; $('#mc-g').innerHTML = ['Du', 'Se', 'Ch', 'Pa', 'Ju', 'Sh', 'Ya'].map(w => `<span class="w">${w}</span>`).join('') + '<span></span>'.repeat(off) + Array.from({ length: n }, (_, i) => { const k = `${y}-${p2(m + 1)}-${p2(i + 1)}`; return `<button data-k="${k}" class="${k === day() ? 'td' : ''} ${(S.events[k] || []).length ? 'ev' : ''}">${i + 1}</button>`; }).join(''); };
      $('#mc-p').onclick = () => { mv = new Date(mv.getFullYear(), mv.getMonth() - 1, 1); mc(); }; $('#mc-n').onclick = () => { mv = new Date(mv.getFullYear(), mv.getMonth() + 1, 1); mc(); }; $('#mc-g').onclick = e => { if (e.target.dataset?.k) go('calendar'); }; mc();
    }
  },

  tutor: {
    t: 'AI Ustoz',
    html() { return `<h2>AI Ustoz</h2><p class="muted">${S.sources.filter(s => s.on !== false).length ? 'Javoblar sizning manbalaringizga tayanadi.' : 'Manba yuklanmagan: umumiy bilimlar asosida javob beraman. Aniq javob uchun Manbalar bo‘limida PDF/DOCX yuklang.'}</p><div class="panel"><div class="chat" id="msgs" aria-live="polite"></div><div class="chips"><button class="chip" data-p="Mavzuni sodda tilda tushuntirib ber: ">Mavzuni tushuntir</button><button class="chip" data-p="Quyidagi mavzu bo‘yicha 5 ta test savoli tuzib ber: ">Test tuzib ber</button><button class="chip" data-p="Quyidagi mavzu uchun slayd rejasini tayyorla: ">Slayd tayyorla</button><button class="chip" data-p="Quyidagi mavzuda referat rejasini yoz: ">Referat yoz</button></div><div class="composer"><textarea id="mi" rows="1" placeholder="Savolingizni yozing…" aria-label="Savol"></textarea><button class="btn" id="mic" aria-label="Ovoz bilan yozish">🎙️</button><button class="btn pri" id="ms">Yuborish</button></div><div class="row"><button class="btn danger" id="mc">Suhbatni tozalash</button></div></div>`; },
    bind() {
      const box = $('#msgs');
      const draw = () => { box.innerHTML = S.chat.length ? S.chat.map((m, i) => `<div class="msg ${m.role === 'user' ? 'u' : 'a'}">${m.role === 'user' ? `<p>${esc(m.content)}</p>` : `<div class="md">${md(m.content)}</div><button class="sp" data-i="${i}">🔊 Tinglash</button>`}</div>`).join('') : '<p class="muted center">Savol bering: masalan, “Fotosintez qanday ishlaydi?”</p>'; box.scrollTop = box.scrollHeight; };
      draw();
      box.onclick = e => { const i = e.target.dataset?.i; if (i) speak(S.chat[i].content); };
      const send = async () => {
        const q = $('#mi').value.trim(); if (!q) return; $('#mi').value = ''; S.chat.push({ role: 'user', content: q }); draw();
        box.insertAdjacentHTML('beforeend', '<div class="msg a" id="live"><div class="md"><p class="muted">O‘ylayapman…</p></div></div>'); box.scrollTop = box.scrollHeight; $('#ms').disabled = true;
        try { const m = [{ role: 'system', content: sys() + srcNote() }, ...S.chat.slice(-10).map(({ role, content }) => ({ role, content }))]; let a = await aiStream(m, { max: 2000 }, t => { const l = $('#live .md'); if (l) { l.innerHTML = md(t); box.scrollTop = box.scrollHeight; } }).catch(() => null); if (!a) a = await ai(m, { max: 2000 }); S.chat.push({ role: 'assistant', content: a }); add('chats', 1, 1); }
        catch (e) { toast(e.message); S.chat.push({ role: 'assistant', content: '⚠️ ' + e.message }); }
        S.chat = S.chat.slice(-60); save(); $('#ms') && ($('#ms').disabled = false); if ($('#msgs')) draw();
      };
      $('#ms').onclick = send; $$('.chip').forEach(b => b.onclick = () => { $('#mi').value = b.dataset.p; $('#mi').focus(); }); $('#mi').onkeydown = e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } };
      $('#mic').onclick = e => listen(t => { $('#mi').value = ($('#mi').value + ' ' + t).trim(); }, e.currentTarget);
      $('#mc').onclick = () => { if (confirm('Suhbat tarixi o‘chirilsinmi?')) { S.chat = []; save(); draw(); } };
      if (PREQ) { $('#mi').value = PREQ; PREQ = null; send(); }
    }
  },

  sources: {
    t: 'Manbalar',
    html() { return `<h2>Manbalar</h2><p class="muted">PDF, DOCX yoki TXT yuklang — AI, testlar, kartalar va referat shu manbaga tayanadi. Fayllar qurilmangizdan chiqmaydi; faqat AI so‘roviga matn qismi yuboriladi.</p><div class="panel"><label>Fayl tanlang (PDF, DOCX, TXT, MD)<input type="file" id="sf" accept=".pdf,.docx,.txt,.md" multiple></label><label>Yoki matnni qo‘yib chiqing<textarea id="st" placeholder="Matnni shu yerga joylang…"></textarea></label><button class="btn pri" id="sa">Matnni manba sifatida qo‘shish</button></div><div class="panel"><h3>Yuklangan manbalar</h3><div id="sl"></div></div>`; },
    bind() {
      const list = () => { $('#sl').innerHTML = S.sources.length ? S.sources.map(s => `<div class="item"><label style="margin:0;display:flex;align-items:center"><input type="checkbox" data-t="${s.id}" ${s.on !== false ? 'checked' : ''}> <span>${esc(s.name)} <small class="muted">· ${s.text.length.toLocaleString('en-US')} belgi</small></span></label><button class="btn danger" data-d="${s.id}" aria-label="O‘chirish">✕</button></div>`).join('') : '<p class="muted">Hali manba yo‘q.</p>'; };
      list();
      $('#sl').onclick = e => { const d = e.target.dataset?.d, t = e.target.dataset?.t; if (d) { S.sources = S.sources.filter(s => s.id !== d); saveSrc(); list(); } if (t) { const s = S.sources.find(x => x.id === t); s.on = e.target.checked; saveSrc(); } };
      const addSrc = (name, text) => { text = text.replace(/\s+\n/g, '\n').trim(); if (text.length < 20) return toast(`“${name}” da matn topilmadi (skanerlangan PDF bo‘lishi mumkin).`); S.sources.push({ id: uid(), name, text: text.slice(0, 300000), on: true }); add('docs', 1, 5); saveSrc(); list(); toast(`“${name}” qo‘shildi`); };
      $('#sf').onchange = async e => { for (const f of e.target.files) { if (f.size > 40 * 1024 * 1024) { toast(`${f.name}: 40 MB dan katta.`); continue; } try { toast(`${f.name} o‘qilmoqda…`); addSrc(f.name, await readFile(f)); } catch (er) { toast(er.message); } } e.target.value = ''; };
      $('#sa').onclick = () => { const t = $('#st').value; if (!t.trim()) return toast('Matn kiriting.'); addSrc('Matn ' + new Date().toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' }), t); $('#st').value = ''; };
    }
  },

  tests: {
    t: 'Testlar',
    html() { return `<h2>Testlar</h2><p class="muted">Mavzu bo‘yicha yoki yuklangan manba asosida test tuzing. Har bir to‘g‘ri javob uchun +10 ball.</p><div class="panel"><label>Mavzu yoki fan (manba bo‘lsa, bo‘sh qoldirish mumkin)<input id="tt" maxlength="120" placeholder="Masalan: Fotosintez"></label><div class="two"><label>Savollar soni<select id="tn">${[5, 10, 15, 20, 30, 50].map(n => `<option ${n === 10 ? 'selected' : ''}>${n}</option>`).join('')}</select></label><label>Qiyinlik<select id="tl"><option>Oson</option><option selected>O‘rtacha</option><option>Qiyin</option></select></label></div><button class="btn pri block" id="tg">Test yaratish</button></div><div id="tout"></div>`; },
    bind() {
      const norm = a => (Array.isArray(a) ? a : a.questions || []).filter(x => x && x.q && Array.isArray(x.o) && x.o.length >= 2 && Number.isInteger(x.a) && x.a >= 0 && x.a < x.o.length).map(x => { const s = shuf(x.o.map((v, i) => ({ v: String(v), c: i === x.a }))); return { q: String(x.q), o: s.map(z => z.v), a: s.findIndex(z => z.c), w: String(x.w || '') }; });
      $('#tg').onclick = e => busy(e.target, $('#tout'), async () => {
        const topic = $('#tt').value.trim(), n = +$('#tn').value, lvl = $('#tl').value; if (!topic && !ctx()) throw new Error('Mavzu yozing yoki Manbalar bo‘limida manba yuklang.');
        let qs = [];
        while (qs.length < n) {
          const k = Math.min(10, n - qs.length); $('#tout').innerHTML = `<div class="load"><i></i> ${qs.length}/${n} savol tayyor…</div>`;
          const t = await aiJ([{ role: 'system', content: sys() + srcNote() }, { role: 'user', content: `${topic ? `Mavzu: ${topic}. ` : ''}${k} ta test savoli tuzing. Qiyinlik: ${lvl}. Har savolda 4 variant. FAQAT JSON massiv qaytaring: [{"q":"savol","o":["variant1","variant2","variant3","variant4"],"a":0,"w":"to‘g‘ri javob izohi"}] — "a" to‘g‘ri variant indeksi (0-3). ${qs.length ? 'Bularni takrorlamang: ' + qs.map(x => x.q.slice(0, 50)).join(' | ') : ''}` }], { t: .5, max: 3500 });
          const got = norm(t); if (!got.length) throw new Error('AI savol qaytarmadi. Qayta urinib ko‘ring.'); qs.push(...got);
        }
        run(qs.slice(0, n));
      });
      function run(qs) {
        const box = $('#tout'); let score = 0, done = 0; const wrong = [];
        box.innerHTML = `<div class="panel row between"><b id="tp">0 / ${qs.length}</b><b id="ts">To‘g‘ri: 0</b></div>` + qs.map((q, i) => `<div class="panel q" data-i="${i}"><p><b>${i + 1}.</b> ${esc(q.q)}</p>${q.o.map((o, j) => `<button class="opt" data-j="${j}">${'ABCDEF'[j]}) ${esc(o)}</button>`).join('')}<div class="why muted small"></div></div>`).join('') + '<div id="tf"></div>';
        box.onclick = e => {
          const b = e.target.closest('.opt'); if (!b) return; const c = b.closest('.q'); if (c.dataset.done) return; c.dataset.done = 1;
          const q = qs[+c.dataset.i], j = +b.dataset.j; $$('.opt', c).forEach((x, k) => { x.disabled = true; if (k === q.a) x.classList.add('ok'); });
          if (j === q.a) score++; else { b.classList.add('bad'); wrong.push(q); } if (q.w) c.querySelector('.why').textContent = '💡 ' + q.w;
          done++; $('#tp').textContent = `${done} / ${qs.length}`; $('#ts').textContent = `To‘g‘ri: ${score}`; if (done === qs.length) fin();
        };
        function fin() {
          add('tests', 1, score * 10); const pct = Math.round(score / qs.length * 100);
          $('#tf').innerHTML = `<div class="panel center"><h3>Natija: ${score} / ${qs.length} (${pct}%)</h3><p class="muted">+${score * 10} ball</p>${wrong.length ? '<button class="btn pri" id="tw">Xatolarni flashkartaga qo‘shish</button>' : '<p>Xato yo‘q, ajoyib! 🎉</p>'}</div>`;
          const w = $('#tw'); if (w) w.onclick = () => { wrong.forEach(q => S.cards.push({ id: uid(), q: q.q, a: q.o[q.a] + (q.w ? ' — ' + q.w : ''), box: 0, due: day() })); save(); toast(wrong.length + ' ta karta qo‘shildi'); w.disabled = true; };
          $('#tf').scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }
    }
  },

  cards: {
    t: 'Flashkartalar',
    html() { return `<h2>Flashkartalar</h2><p class="muted">Intervalli takrorlash (Leitner): bilgan kartalaringiz kechroq, bilmaganlaringiz tezroq qaytadi.</p><div id="cs"></div><div class="panel"><h3>AI bilan yaratish</h3><div class="two"><label>Mavzu (manba bo‘lsa, bo‘sh qoldirish mumkin)<input id="ct" maxlength="120"></label><label>Kartalar soni<select id="cn">${[10, 20, 30].map(n => `<option>${n}</option>`).join('')}</select></label></div><button class="btn pri block" id="cg">Kartalar yaratish</button><div id="co"></div></div><div class="panel"><h3>Qo‘lda qo‘shish</h3><div class="two"><label>Savol / atama<input id="cq" maxlength="200"></label><label>Javob<input id="ca" maxlength="400"></label></div><div class="row"><button class="btn" id="cm">Qo‘shish</button><button class="btn danger" id="cx">Barcha kartalarni o‘chirish</button></div></div>`; },
    bind() {
      const study = () => {
        const el = $('#cs'); if (!el) return; const t = day();
        if (!S.cards.length) { el.innerHTML = '<div class="panel center muted">Hozircha karta yo‘q. Quyida yarating.</div>'; return; }
        const due = S.cards.filter(c => c.due <= t).sort((a, b) => a.due < b.due ? -1 : a.due > b.due ? 1 : (a.t || 0) - (b.t || 0));
        if (!due.length) { el.innerHTML = `<div class="panel center"><h3>🎉 Bugungi takrorlash tugadi</h3><p class="muted">Jami ${S.cards.length} ta karta.</p><button class="btn" id="cr">Hammasini qayta takrorlash</button></div>`; $('#cr').onclick = () => { S.cards.forEach(c => c.due = t); save(); study(); }; return; }
        const c = due[0];
        el.innerHTML = `<p class="muted center">Bugun qoldi: ${due.length} · Jami: ${S.cards.length}</p><div class="flip" id="fl" tabindex="0" role="button" aria-label="Kartani aylantirish"><div class="face f"><div><small>Savol</small><p>${esc(c.q)}</p></div></div><div class="face b"><div><small>Javob</small><p>${esc(c.a)}</p></div></div></div><div class="row center" id="rt" hidden><button class="btn danger" data-r="no">Bilmayman</button><button class="btn" data-r="mid">Qisman</button><button class="btn pri" data-r="yes">Bilaman</button></div><p class="muted center small">Kartani bosib aylantiring</p>`;
        const flip = () => { $('#fl').classList.toggle('on'); $('#rt').hidden = false; };
        $('#fl').onclick = flip; $('#fl').onkeydown = e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); flip(); } };
        $$('#rt button').forEach(b => b.onclick = () => { const r = b.dataset.r, iv = [0, 1, 3, 7, 14, 30]; if (r === 'no') c.box = 0; else if (r === 'yes') c.box = Math.min(5, (c.box || 0) + 1); c.due = addDay(r === 'no' ? 0 : r === 'mid' ? (c.box ? 1 : 0) : iv[c.box]); c.t = Date.now(); add('cards', 1, r === 'yes' ? 3 : 1); study(); });
      };
      study();
      $('#cg').onclick = e => busy(e.target, $('#co'), async () => {
        const topic = $('#ct').value.trim(), n = +$('#cn').value; if (!topic && !ctx()) throw new Error('Mavzu yozing yoki manba yuklang.');
        const a = await aiJ([{ role: 'system', content: sys() + srcNote() }, { role: 'user', content: `${topic ? `Mavzu: ${topic}. ` : ''}${n} ta flashkarta tuzing: savol/atama va qisqa, aniq javob. FAQAT JSON massiv qaytaring: [{"q":"...","a":"..."}]` }], { t: .4, max: 3500 });
        const got = (Array.isArray(a) ? a : a.cards || []).filter(x => x && x.q && x.a).map(x => ({ id: uid(), q: String(x.q), a: String(x.a), box: 0, due: day() }));
        if (!got.length) throw new Error('AI karta qaytarmadi. Qayta urinib ko‘ring.'); S.cards.push(...got); save(); $('#co').innerHTML = `<p class="center">✅ ${got.length} ta karta qo‘shildi</p>`; study();
      });
      $('#cm').onclick = () => { const q = $('#cq').value.trim(), a = $('#ca').value.trim(); if (!q || !a) return toast('Savol va javobni kiriting.'); S.cards.push({ id: uid(), q, a, box: 0, due: day() }); save(); $('#cq').value = $('#ca').value = ''; study(); toast('Karta qo‘shildi'); };
      $('#cx').onclick = () => { if (confirm('Barcha kartalar o‘chirilsinmi?')) { S.cards = []; save(); study(); } };
    }
  },

  referat: {
    t: 'Referat',
    html() { return `<h2>Referat</h2><p class="muted">Reja, kirish, asosiy qism, xulosa bilan tayyor referat. Manba yuklangan bo‘lsa, shunga tayanadi.</p><div class="panel"><label>Mavzu<input id="rt" maxlength="160" placeholder="Masalan: Sun’iy intellekt ta’limda"></label><div class="three"><label>Hajm<select id="rh"><option>3–4 sahifa</option><option selected>5–7 sahifa</option><option>8–10 sahifa</option></select></label><label>Daraja<select id="rd"><option>Maktab</option><option selected>Talaba</option><option>Ilmiy</option></select></label><label>Uslub<select id="ru"><option>Ilmiy</option><option>Oddiy</option></select></label></div><button class="btn pri block" id="rg">Referat yaratish</button></div><div id="ro"></div>`; },
    bind() { $('#rg').onclick = e => busy(e.target, $('#ro'), async () => { const t = $('#rt').value.trim(); if (!t) throw new Error('Mavzuni kiriting.'); const out = await ai([{ role: 'system', content: sys() + srcNote() }, { role: 'user', content: `“${t}” mavzusida referat yozing. Hajm: ${$('#rh').value}. Daraja: ${$('#rd').value}. Uslub: ${$('#ru').value}. Tuzilma: sarlavha, reja, kirish, 3–4 asosiy bo‘lim, xulosa. Adabiyotlar ro‘yxatini to‘qib chiqarmang: faqat manbada ko‘rsatilganini yozing, bo‘lmasa bu bo‘limni qoldiring.` }], { t: .5, max: 4500 }); showOut($('#ro'), out, 'referat'); add('docs', 1, 15); }); }
  },

  slides: {
    t: 'Slaydlar',
    html() { return `<h2>Slaydlar</h2><p class="muted">AI taqdimot tuzadi. Ko‘rib chiqing va PowerPoint (.pptx) sifatida yuklab oling.</p><div class="panel"><label>Mavzu<input id="gt" maxlength="160" placeholder="Masalan: Quyosh tizimi"></label><div class="two"><label>Slaydlar soni<select id="gn">${[5, 8, 10, 12, 15].map(n => `<option ${n === 8 ? 'selected' : ''}>${n}</option>`).join('')}</select></label><label>Auditoriya<select id="ga"><option>Maktab o‘quvchilari</option><option selected>Talabalar</option><option>Mutaxassislar</option></select></label></div><button class="btn pri block" id="gg">Taqdimot yaratish</button></div><div id="go"></div>`; },
    bind() {
      $('#gg').onclick = e => busy(e.target, $('#go'), async () => {
        const t = $('#gt').value.trim(); if (!t && !ctx()) throw new Error('Mavzu yozing yoki manba yuklang.'); const n = +$('#gn').value;
        const d = await aiJ([{ role: 'system', content: sys() + srcNote() }, { role: 'user', content: `${t ? `Mavzu: ${t}. ` : ''}${n} ta slayddan iborat taqdimot tuzing. Auditoriya: ${$('#ga').value}. Birinchi slayd — sarlavha slaydi (b da bitta qisqa kichik sarlavha). Qolganlarida 3–5 ta qisqa band. FAQAT JSON qaytaring: {"title":"...","slides":[{"t":"slayd sarlavhasi","b":["band","band"],"n":"o‘qituvchi uchun izoh"}]}` }], { t: .5, max: 4000 });
        const sl = (d.slides || []).filter(s => s && s.t).map(s => ({ t: String(s.t), b: (Array.isArray(s.b) ? s.b : []).map(String), n: String(s.n || '') })); if (!sl.length) throw new Error('AI slayd qaytarmadi. Qayta urinib ko‘ring.');
        const deck = { title: String(d.title || t || 'Taqdimot'), slides: sl }; let i = 0; add('docs', 1, 15);
        const draw = () => { const s = sl[i]; $('#go').innerHTML = `<div class="panel"><div class="slide">${i === 0 ? `<h3 style="font-size:clamp(24px,5vw,46px)">${esc(s.t)}</h3><p>${esc(s.b.join(' · '))}</p>` : `<h3>${esc(s.t)}</h3><ul>${s.b.map(b => `<li>${esc(b)}</li>`).join('')}</ul>`}</div>${s.n ? `<p class="muted small">🗒 ${esc(s.n)}</p>` : ''}<div class="row between"><button class="btn" id="sp" ${i ? '' : 'disabled'}>← Oldingi</button><b>${i + 1} / ${sl.length}</b><button class="btn" id="sn" ${i < sl.length - 1 ? '' : 'disabled'}>Keyingi →</button></div><div class="row"><button class="btn pri" id="sx">PowerPoint (.pptx) yuklab olish</button><button class="btn" id="st2">Matn sifatida (.txt)</button></div></div>`; $('#sp').onclick = () => { i--; draw(); }; $('#sn').onclick = () => { i++; draw(); }; $('#st2').onclick = () => dl('taqdimot.txt', 'text/plain', `${deck.title}\n\n` + sl.map((s, k) => `${k + 1}. ${s.t}\n${s.b.map(b => ' - ' + b).join('\n')}`).join('\n\n')); $('#sx').onclick = ev => busy(ev.target, null, () => pptx(deck)); };
        draw();
      });
      async function pptx(deck) {
        await lib(LIB.pptx); const p = new PptxGenJS(); p.layout = 'LAYOUT_WIDE'; p.title = deck.title;
        deck.slides.forEach((s, i) => { const sl = p.addSlide(); sl.background = { color: '0B1430' };
          if (i === 0) { sl.addText(s.t, { x: .8, y: 2.3, w: 11.7, h: 1.6, fontSize: 40, bold: true, color: 'FFFFFF' }); sl.addText(s.b.join(' · '), { x: .8, y: 4, w: 11.7, h: 1, fontSize: 20, color: '8FB4FF' }); }
          else { sl.addText(s.t, { x: .6, y: .4, w: 12, h: .9, fontSize: 30, bold: true, color: '7DD3FC' }); sl.addText(s.b.map(t => ({ text: t, options: { bullet: true, breakLine: true } })), { x: .8, y: 1.5, w: 11.7, h: 5, fontSize: 20, color: 'E6ECFF', valign: 'top', paraSpaceAfter: 10 }); }
          if (s.n) sl.addNotes(s.n); });
        await p.writeFile({ fileName: (deck.title.replace(/[\\/:*?"<>|]/g, '') || 'taqdimot') + '.pptx' });
      }
    }
  },

  goals: {
    t: 'Maqsadlar',
    html() { return `<h2>Maqsadlar va Challenge</h2><p class="muted">Kunlik, doimiy, muddatli maqsadlar yoki N kunlik challenge belgilang.</p><div class="panel"><div class="two"><label>Maqsad nomi<input id="gn1" maxlength="70" placeholder="Masalan: Inglizcha 30 ta so‘z"></label><label>Turi<select id="gk"><option value="kunlik">Kunlik</option><option value="doimiy">Doimiy</option><option value="muddatli">Muddatli</option><option value="challenge">Challenge (kunlar soni)</option></select></label></div><div class="two"><label>Miqdor / kunlar<input id="gt1" type="number" min="1" max="10000" value="30"></label><label id="gdw" hidden>Tugash sanasi<input id="gd" type="date"></label></div><button class="btn pri block" id="ga1">Maqsad qo‘shish</button></div><div class="panel" id="gl"></div>`; },
    bind() {
      S.goals.forEach(g => { if (g.kind === 'kunlik' && g.day !== day()) { g.done = 0; g.day = day(); } }); save();
      const list = () => { $('#gl').innerHTML = S.goals.length ? S.goals.map(g => { const pct = Math.min(100, Math.round(g.done / g.target * 100)); const left = g.deadline ? Math.ceil((new Date(g.deadline) - new Date(day())) / 864e5) : null; return `<div class="item" style="display:block"><div class="row between"><b>${esc(g.name)}</b><small class="muted">${g.kind}${left !== null ? ` · ${left >= 0 ? left + ' kun qoldi' : 'muddat tugagan'}` : ''}</small></div><div class="bar"><i style="width:${pct}%"></i></div><div class="row between"><small>${g.done} / ${g.target} · ${pct}%</small><span class="row" style="margin:0">${g.kind === 'challenge' ? `<button class="btn" data-a="day" data-i="${g.id}" ${g.last === day() ? 'disabled' : ''}>Bugun bajardim</button>` : `<button class="btn" data-a="p1" data-i="${g.id}">+1</button><button class="btn" data-a="p5" data-i="${g.id}">+5</button>`}<button class="btn" data-a="rs" data-i="${g.id}" aria-label="Nolga tushirish">↺</button><button class="btn danger" data-a="del" data-i="${g.id}" aria-label="O‘chirish">✕</button></span></div></div>`; }).join('') : '<p class="muted">Hali maqsad yo‘q.</p>'; };
      list();
      $('#gk').onchange = () => { $('#gdw').hidden = $('#gk').value !== 'muddatli'; };
      $('#ga1').onclick = () => { const name = $('#gn1').value.trim(), target = +$('#gt1').value, kind = $('#gk').value; if (!name || !(target > 0)) return toast('Nom va miqdorni kiriting.'); const g = { id: uid(), name, target, kind, done: 0, day: day() }; if (kind === 'muddatli') { if (!$('#gd').value) return toast('Tugash sanasini tanlang.'); g.deadline = $('#gd').value; } if (kind === 'challenge') g.deadline = addDay(target); S.goals.push(g); save(); $('#gn1').value = ''; list(); };
      $('#gl').onclick = e => { const a = e.target.dataset?.a, g = S.goals.find(x => x.id === e.target.dataset?.i); if (!a || !g) return; if (a === 'p1') g.done = Math.min(g.target, g.done + 1); if (a === 'p5') g.done = Math.min(g.target, g.done + 5); if (a === 'day') { g.done = Math.min(g.target, g.done + 1); g.last = day(); } if (a === 'rs') { g.done = 0; g.last = ''; } if (a === 'del') S.goals = S.goals.filter(x => x !== g); if ((a === 'p1' || a === 'p5' || a === 'day') && g.done >= g.target) { S.points += 50; toast('🎉 Maqsad bajarildi! +50 ball'); } save(); list(); };
    }
  },

  pomodoro: {
    t: 'Pomodoro',
    html() { return `<h2>Pomodoro</h2><p class="muted">Diqqatni jamlash: ishlang, dam oling, takrorlang. Bugun: ${D().pomo || 0} ta sessiya · jami ${S.pomo}.</p><div class="panel center"><div class="seg" id="pm">${[['pomodoro', 'Pomodoro'], ['short', 'Qisqa tanaffus'], ['long', 'Uzoq tanaffus']].map(([k, l]) => `<button class="btn ${P.mode === k ? 'on' : ''}" data-m="${k}">${l}</button>`).join('')}</div><div class="ring"><svg viewBox="0 0 200 200"><defs><linearGradient id="pg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#7c6cff"/><stop offset="1" stop-color="#38bdf8"/></linearGradient></defs><circle class="t" cx="100" cy="100" r="88"/><circle class="p" id="pr" cx="100" cy="100" r="88"/></svg><b id="pt">25:00</b></div><div class="row center"><button class="btn pri" id="pg1" style="min-width:140px">Boshlash</button><button class="btn" id="pr1">Qayta</button></div><label style="max-width:220px;margin:16px auto 0">Daqiqa (shu rejim uchun)<input id="pc" type="number" min="1" max="180" value="${P.min[P.mode]}"></label></div>`; },
    bind() {
      pomoDraw();
      $('#pm').onclick = e => { const m = e.target.dataset?.m; if (!m) return; P.mode = m; P.run = false; P.total = P.left = P.min[m] * 60; $('#pc').value = P.min[m]; $$('#pm .btn').forEach(b => b.classList.toggle('on', b.dataset.m === m)); pomoDraw(); };
      $('#pg1').onclick = pomoToggle;
      $('#pr1').onclick = () => { P.run = false; P.left = P.total; document.title = 'Manba AI'; pomoDraw(); };
      $('#pc').onchange = e => { const v = Math.max(1, Math.min(180, +e.target.value || 25)); P.min[P.mode] = v; if (!P.run) { P.total = P.left = v * 60; pomoDraw(); } };
    }
  },

  calendar: {
    t: 'Kalendar',
    html() { return `<h2>Kalendar</h2><p class="muted">Kunni tanlab, shu kunga reja yozing.</p><div class="panel"><div class="row between"><button class="btn" id="cp" aria-label="Oldingi oy">‹</button><h3 id="cm1" style="margin:0"></h3><button class="btn" id="cn1" aria-label="Keyingi oy">›</button></div><div class="cal">${['Du', 'Se', 'Ch', 'Pa', 'Ju', 'Sh', 'Ya'].map(w => `<span class="w">${w}</span>`).join('')}</div><div class="cal" id="cd"></div></div><div class="panel"><h3 id="ch1"></h3><div class="row" style="margin:0 0 8px"><input id="cx1" maxlength="120" placeholder="Masalan: Biologiya testi" style="flex:1;margin:0"><button class="btn pri" id="ca1">Qo‘shish</button></div><div id="cl"></div></div>`; },
    bind() {
      let view = new Date(), sel = day();
      const draw = () => {
        const y = view.getFullYear(), m = view.getMonth(), off = (new Date(y, m, 1).getDay() + 6) % 7, n = new Date(y, m + 1, 0).getDate(); $('#cm1').textContent = `${MONTHS[m]} ${y}`;
        $('#cd').innerHTML = '<span></span>'.repeat(off) + Array.from({ length: n }, (_, i) => { const k = `${y}-${p2(m + 1)}-${p2(i + 1)}`; return `<button data-k="${k}" class="${k === day() ? 'td' : ''} ${k === sel ? 'sel' : ''} ${(S.events[k] || []).length ? 'ev' : ''}">${i + 1}</button>`; }).join('');
        $('#ch1').textContent = 'Reja: ' + sel; const it = S.events[sel] || [];
        $('#cl').innerHTML = it.length ? it.map(x => `<div class="item"><span>${esc(x.t)}</span><button class="btn danger" data-d="${x.id}" aria-label="O‘chirish">✕</button></div>`).join('') : '<p class="muted">Bu kunga reja yo‘q.</p>';
      };
      draw();
      $('#cp').onclick = () => { view = new Date(view.getFullYear(), view.getMonth() - 1, 1); draw(); }; $('#cn1').onclick = () => { view = new Date(view.getFullYear(), view.getMonth() + 1, 1); draw(); };
      $('#cd').onclick = e => { if (e.target.dataset?.k) { sel = e.target.dataset.k; draw(); } };
      const addE = () => { const t = $('#cx1').value.trim(); if (!t) return toast('Reja matnini kiriting.'); (S.events[sel] ||= []).push({ id: uid(), t }); save(); $('#cx1').value = ''; draw(); };
      $('#ca1').onclick = addE; $('#cx1').onkeydown = e => { if (e.key === 'Enter') addE(); };
      $('#cl').onclick = e => { const d = e.target.dataset?.d; if (!d) return; S.events[sel] = (S.events[sel] || []).filter(x => x.id !== d); if (!S.events[sel].length) delete S.events[sel]; save(); draw(); };
    }
  },

  reminders: {
    t: 'Eslatmalar',
    html() { return `<h2>Eslatmalar</h2><p class="muted">Vaqti kelganda sahifa ochiq (yoki fonda) bo‘lsa, xabar va bildirishnoma chiqadi. Sayt butunlay yopiq bo‘lsa, eslatma ishlamaydi.</p><div class="panel"><label>Nima haqida?<input id="rx" maxlength="120" placeholder="Masalan: Flashkartalarni takrorlash"></label><label>Qachon<input id="ra" type="datetime-local"></label><button class="btn pri block" id="rb">Eslatma qo‘shish</button></div><div class="panel" id="rl"></div>`; },
    bind() {
      const list = () => { const a = [...S.rem].sort((x, y) => x.at.localeCompare(y.at)); $('#rl').innerHTML = a.length ? a.map(r => `<div class="item ${r.done ? 'done' : ''}"><span>${r.done ? '✓' : '⏰'} ${esc(r.text)} <small class="muted">· ${esc(r.at.replace('T', ' '))}</small></span><button class="btn danger" data-d="${r.id}" aria-label="O‘chirish">✕</button></div>`).join('') : '<p class="muted">Hozircha eslatma yo‘q.</p>'; };
      list();
      $('#rb').onclick = () => { const text = $('#rx').value.trim(), at = $('#ra').value; if (!text || !at) return toast('Matn va vaqtni kiriting.'); S.rem.push({ id: uid(), text, at, done: false }); save(); $('#rx').value = $('#ra').value = ''; list(); try { if ('Notification' in window && Notification.permission === 'default') Notification.requestPermission(); } catch (e) { /* ruxsat so‘ralmadi */ } };
      $('#rl').onclick = e => { const d = e.target.dataset?.d; if (!d) return; S.rem = S.rem.filter(r => r.id !== d); save(); list(); };
    }
  },

  stats: {
    t: 'Statistika',
    html() {
      const all = Object.values(S.daily), sum = k => all.reduce((a, v) => a + (v[k] || 0), 0);
      const k = [['⏳ O‘qish vaqti (jami)', fmtMin(sum('sec'))], ['🔥 Ketma-ketlik', streak() + ' kun'], ['🏆 Umumiy ball', S.points], ['✅ Testlar', sum('tests')], ['🗂️ Takrorlangan kartalar', sum('cards')], ['🧠 Suhbatlar', sum('chats')], ['📚 Manbalar', S.sources.length], ['⏱️ Pomodoro', S.pomo]];
      return `<h2>Statistika</h2><div class="kpi">${k.map(([a, b]) => `<div class="stat"><small>${a}</small><strong>${b}</strong></div>`).join('')}</div><div class="panel"><h3>Haftalik o‘qish vaqti (daqiqa)</h3>${chart(last7(v => Math.round((v.sec || 0) / 60)))}</div><div class="panel"><h3>Haftalik faollik (test, karta, suhbat)</h3>${chart(last7(v => (v.tests || 0) + (v.cards || 0) + (v.chats || 0)))}</div><p class="muted small">Ball: to‘g‘ri test javobi +10, flashkarta +1…3, manba +5, referat/slayd +15, Pomodoro +20, bajarilgan maqsad +50. O‘qish vaqti sahifa ko‘rinib turganda hisoblanadi.</p>`;
    }
  },

  tools: {
    t: 'Vositalar',
    html() { return `<h2>Vositalar</h2><div class="panel"><label>Vosita<select id="tk">${Object.entries(TL).map(([k, v]) => `<option value="${k}">${v[0]}</option>`).join('')}</select></label><label id="tlw" hidden>Tarjima tili<select id="tlg"><option>ingliz</option><option>rus</option><option>o‘zbek</option><option>turk</option><option>nemis</option><option>fransuz</option></select></label><label id="tfw" hidden>Rasm (4 MB gacha)<input type="file" id="tf1" accept="image/*"></label><label>Matn yoki masala<textarea id="ti" maxlength="12000" placeholder="Matn yoki masalani kiriting…"></textarea></label><button class="btn pri block" id="tr">Bajarish</button></div><div id="tout"></div><div class="panel" id="voice"><h3>🎙️ Ovoz</h3><div class="row" style="margin:0"><button class="btn" id="tsp">🔊 Matnni ovozda o‘qish</button><button class="btn" id="tsx">⏹ To‘xtatish</button><button class="btn" id="tmic">🎙️ Gapirib yozish</button></div><p class="muted small">Ovozli funksiyalar brauzerga bog‘liq (Chrome/Edge yaxshi). O‘zbek ovozi qurilmada bo‘lmasa, standart ovoz ishlatiladi.</p></div>`; },
    bind() {
      const sync = () => { $('#tlw').hidden = $('#tk').value !== 'translate'; $('#tfw').hidden = $('#tk').value !== 'image'; }; $('#tk').onchange = sync;
      if (PRE && TL[PRE]) { $('#tk').value = PRE; sync(); } if (PRE === 'voice') $('#voice').scrollIntoView({ behavior: 'smooth' }); PRE = null;
      $('#tr').onclick = e => busy(e.target, $('#tout'), async () => {
        const k = $('#tk').value, txt = $('#ti').value.trim(), f = $('#tf1').files[0]; let content;
        if (k === 'image') { if (!f) throw new Error('Rasm tanlang.'); if (f.size > 4 * 1024 * 1024) throw new Error('Rasm 4 MB dan katta.'); content = [{ type: 'text', text: TL.image[1] + '\n' + txt }, { type: 'image_url', image_url: { url: await toDataURL(f) } }]; }
        else { if (!txt) throw new Error('Matn yoki masalani kiriting.'); content = `${k === 'translate' ? `Quyidagi matnni ${$('#tlg').value} tiliga aniq va tabiiy tarjima qiling. Faqat tarjimani yozing.` : TL[k][1]}\n\n${txt}`; }
        showOut($('#tout'), await ai([{ role: 'system', content: sys() }, { role: 'user', content }], { max: 2500 }), 'manba-' + k); add('chats', 1, 2);
      });
      $('#tsp').onclick = () => { const t = $('#ti').value.trim(); t ? speak(t) : toast('O‘qish uchun matn kiriting.'); }; $('#tsx').onclick = () => 'speechSynthesis' in window && speechSynthesis.cancel();
      $('#tmic').onclick = e => listen(t => { $('#ti').value = ($('#ti').value + ' ' + t).trim(); }, e.currentTarget);
    }
  },

  independent: {
    t: 'Mustaqil ish',
    html() {
      const o = a => a.map(x => `<option>${x}</option>`).join('');
      return `<h2>Mustaqil ish</h2><p class="muted">Referatdan farqi: nazariy qism bilan birga amaliy yoki tahliliy qism, o‘z xulosalaringiz va himoya savollari bor. Titul varag‘i avtomatik tayyorlanadi.</p>
<div class="panel"><h3>Titul varag‘i</h3><div class="two"><label>Oliy ta’lim muassasasi<input id="mi-u" maxlength="120" placeholder="Masalan: Toshkent davlat yuridik universiteti"></label><label>Fakultet / yo‘nalish<input id="mi-f" maxlength="120"></label></div><div class="two"><label>Talaba F.I.Sh<input id="mi-n" maxlength="80"></label><label>Guruh<input id="mi-g" maxlength="30"></label></div><div class="two"><label>O‘qituvchi F.I.Sh<input id="mi-t" maxlength="80"></label><label>Shahar<input id="mi-c" maxlength="40" placeholder="Toshkent"></label></div></div>
<div class="panel"><h3>Ish ma’lumotlari</h3><div class="two"><label>Fan<input id="mi-fan" maxlength="80"></label><label>Mavzu<input id="mi-m" maxlength="200"></label></div><div class="three"><label>Turi<select id="mi-k">${o(Object.keys(MI))}</select></label><label>Hajm<select id="mi-h"><option>8–10 sahifa</option><option selected>10–15 sahifa</option><option>15–20 sahifa</option></select></label><label>Daraja<select id="mi-d"><option>Talaba</option><option>Magistr</option><option>Maktab / litsey</option></select></label></div><label>O‘qituvchi talablari (ixtiyoriy)<textarea id="mi-r" style="min-height:80px" maxlength="1000" placeholder="Masalan: 3 ta jadval, 2 ta misol, shrift 14…"></textarea></label><label style="display:flex;align-items:center"><input type="checkbox" id="mi-q" checked> Himoya uchun savol-javoblar qo‘shilsin</label><button class="btn pri block" id="mi-go">Mustaqil ish yaratish</button></div><div id="mi-out"></div>`;
    },
    bind() {
      const F = { u: '#mi-u', f: '#mi-f', n: '#mi-n', g: '#mi-g', t: '#mi-t', c: '#mi-c' }, t0 = S.titul || {};
      for (const k in F) $(F[k]).value = t0[k] || '';
      $('#mi-go').onclick = e => busy(e.target, $('#mi-out'), async () => {
        const fan = $('#mi-fan').value.trim(), mavzu = $('#mi-m').value.trim(); if (!fan || !mavzu) throw new Error('Fan va mavzuni kiriting.');
        const t = {}; for (const k in F) t[k] = $(F[k]).value.trim(); S.titul = t; save();
        const tur = $('#mi-k').value, talab = $('#mi-r').value.trim(), y = new Date().getFullYear();
        const titul = ['^ **O‘ZBEKISTON RESPUBLIKASI OLIY TA’LIM, FAN VA INNOVATSIYALAR VAZIRLIGI**', t.u && `^ **${t.u.toUpperCase()}**`, t.f && `^ ${t.f}`, '~', '^ **MUSTAQIL ISH**', '~', `^ Fan: **${fan}**`, `^ Mavzu: **${mavzu}**`, '~', t.n && `Bajardi: ${t.n}${t.g ? ` (${t.g} guruh)` : ''}`, t.t && `Qabul qildi: ${t.t}`, '~', `^ ${t.c ? t.c + ', ' : ''}${y}`, '===='].filter(Boolean).join('\n');
        const body = await ai([{ role: 'system', content: sys() + srcNote() }, { role: 'user', content: `Fan: ${fan}. Mavzu: ${mavzu}. Ish turi: ${tur}. Hajm: ${$('#mi-h').value}. Daraja: ${$('#mi-d').value}. ${talab ? 'O‘qituvchi talablari: ' + talab + '. ' : ''}\nMustaqil ish matnini yozing (titul varag‘isiz). Bu referat emas: o‘z mustaqil tahlil va xulosalaringiz bo‘lsin. Tuzilma: Reja; Kirish (dolzarbligi, maqsad va vazifalar); I bob — nazariy asoslar; ${MI[tur]} Xulosa; Tavsiyalar; Foydalanilgan adabiyotlar (faqat manbada ko‘rsatilganini yozing; bo‘lmasa “Adabiyotlar ro‘yxatini talaba o‘zi to‘ldiradi” deb yozing, hech qachon to‘qib chiqarmang).${$('#mi-q').checked ? ' Oxirida himoya uchun 5 ta kutilayotgan savol va qisqa javoblar bering.' : ''}` }], { t: .5, max: 4500 });
        showOut($('#mi-out'), titul + '\n' + body, 'mustaqil-ish'); add('docs', 1, 20);
      });
    }
  },

  teacher: {
    t: 'O‘qituvchi rejimi',
    html() { return `<h2>O‘qituvchi rejimi</h2><p class="muted">Dars rejasi, nazorat testi, uy vazifasi va baholash mezonlari — tayyor materiallar.</p><div class="panel"><label>Nima tayyorlaymiz?<select id="pk">${Object.entries(TP).map(([k, v]) => `<option value="${k}">${v[0]}</option>`).join('')}</select></label><div class="three"><label>Fan<input id="pf" maxlength="60" placeholder="Biologiya"></label><label>Sinf / kurs<input id="ps" maxlength="30" placeholder="8-sinf"></label><label>Davomiyligi (daqiqa)<input id="pd" type="number" min="10" max="240" value="45"></label></div><label>Mavzu<input id="pm1" maxlength="160" placeholder="Hujayra tuzilishi"></label><button class="btn pri block" id="pg2">Tayyorlash</button></div><div id="po"></div>`; },
    bind() { $('#pg2').onclick = e => busy(e.target, $('#po'), async () => { const k = $('#pk').value, m = $('#pm1').value.trim(); if (!m) throw new Error('Mavzuni kiriting.'); showOut($('#po'), await ai([{ role: 'system', content: sys() + srcNote() }, { role: 'user', content: `Fan: ${$('#pf').value || 'ko‘rsatilmagan'}. Sinf/kurs: ${$('#ps').value || 'ko‘rsatilmagan'}. Dars davomiyligi: ${$('#pd').value} daqiqa. Mavzu: ${m}.\n${TP[k][1]} O‘zbekiston ta’lim sharoitiga mos yozing.` }], { t: .5, max: 4000 }), 'oqituvchi-' + k); add('docs', 1, 10); }); }
  },

  settings: {
    t: 'Sozlamalar',
    html() { const st = S.settings; return `<h2>Sozlamalar</h2><div class="panel"><h3>AI ulanishi</h3><p class="muted small">Kalitni <b>openrouter.ai/keys</b> sahifasidan oling. Kalit faqat shu brauzerda saqlanadi va faqat OpenRouter’ga yuboriladi. Uni hech qachon GitHub’ga yoki kodga yozmang.</p><label>OpenRouter API kaliti<input id="sk" type="password" autocomplete="off" placeholder="sk-or-…" value="${esc(getKey())}"></label><label style="display:flex;align-items:center"><input type="checkbox" id="sr" ${localStorage.getItem('manba.key') ? 'checked' : ''}> Shu qurilmada eslab qolish (umumiy kompyuterda belgilamang)</label><label>Model<input id="sm" list="ml" value="${esc(st.model)}"><datalist id="ml"><option value="openrouter/free"><option value="meta-llama/llama-3.3-70b-instruct:free"><option value="google/gemma-3-27b-it:free"><option value="deepseek/deepseek-chat-v3.1:free"></datalist></label><p class="muted small">Standart “openrouter/free” bepul modelni o‘zi tanlaydi. Rasm tahlili uchun rasm ko‘ra oladigan model kerak.</p><div class="two"><label>Javob uslubi<select id="sy"><option value="oddiy">Oddiy</option><option value="ilmiy">Ilmiy</option><option value="qisqa">Qisqa</option></select></label><label>Mavzu<select id="sth"><option value="dark">Qorong‘i (kosmik)</option><option value="light">Yorug‘</option></select></label></div><div class="row"><button class="btn pri" id="ss">Saqlash</button><button class="btn" id="stt">Ulanishni tekshirish</button></div><p class="small" id="sres" aria-live="polite"></p></div><div class="panel"><h3>Ma’lumotlar</h3><div class="row" style="margin:0"><button class="btn" id="se">Eksport (JSON)</button><label class="btn" style="margin:0;cursor:pointer">Import<input type="file" id="si" accept=".json" hidden></label><button class="btn" id="sin" hidden>📲 Ilovani o‘rnatish</button><button class="btn danger" id="sc">Barcha ma’lumotni o‘chirish</button></div><p class="muted small">Barcha ma’lumot (manbalar, kartalar, statistika) shu brauzerda saqlanadi. Brauzer ma’lumotlari tozalansa, ular ham o‘chadi — vaqti-vaqti bilan eksport qiling.</p></div>`; },
    bind() {
      $('#sy').value = S.settings.style; $('#sth').value = S.settings.theme;
      $('#ss').onclick = () => { const k = $('#sk').value.trim(); localStorage.removeItem('manba.key'); sessionStorage.removeItem('manba.key'); if (k) ($('#sr').checked ? localStorage : sessionStorage).setItem('manba.key', k); S.settings.model = $('#sm').value.trim() || 'openrouter/free'; S.settings.style = $('#sy').value; S.settings.theme = $('#sth').value; applyTheme(); saveNow(); toast('Saqlandi ✓'); };
      $('#stt').onclick = e => { $('#ss').click(); const b = e.target, o = $('#sres'); b.disabled = true; o.textContent = 'Tekshirilmoqda…'; ai([{ role: 'user', content: 'Faqat OK deb javob bering.' }], { max: 20 }).then(r => { o.textContent = '✅ Ulanish ishlayapti. Model javobi: ' + r.slice(0, 40); }).catch(er => { o.textContent = '❌ ' + er.message; }).finally(() => { b.disabled = false; }); };
      $('#se').onclick = () => dl('manba-zaxira.json', 'application/json', JSON.stringify(S));
      $('#si').onchange = async e => { try { const d = JSON.parse(await e.target.files[0].text()); if (typeof d !== 'object' || !d) throw 0; S = { ...def(), ...d, settings: { ...def().settings, ...(d.settings || {}) } }; srcDirty = true; saveNow(); applyTheme(); toast('Import qilindi'); render(); } catch (er) { toast('Fayl noto‘g‘ri.'); } };
      $('#sc').onclick = () => { if (confirm('Barcha manbalar, kartalar va statistika o‘chiriladi. Davom etasizmi?')) { S = def(); srcDirty = true; saveNow(); applyTheme(); toast('Ma’lumotlar o‘chirildi'); render(); } };
      if (inst) { $('#sin').hidden = false; $('#sin').onclick = async () => { inst.prompt(); await inst.userChoice; inst = null; $('#sin').hidden = true; }; }
    }
  }
};

/* ---------- pomodoro holati ---------- */
const P = { mode: 'pomodoro', min: { pomodoro: 25, short: 5, long: 15 }, total: 1500, left: 1500, run: false, end: 0 };
function pomoToggle() { if (P.run) { P.run = false; } else { if (P.left <= 0) P.left = P.total; P.end = Date.now() + P.left * 1000; P.run = true; } pomoDraw(); }
function pomoDraw() {
  const tm = `${p2(Math.floor(P.left / 60))}:${p2(P.left % 60)}`, off = 1 - P.left / P.total, hp = $('#hp-t'); if (hp) { hp.textContent = tm; $('#hp-r').style.strokeDashoffset = 264 * off; $('#hp-go').innerHTML = ic(P.run ? 'pause' : 'play', 22); } const t = $('#pt'); if (!t) return; t.textContent = `${p2(Math.floor(P.left / 60))}:${p2(P.left % 60)}`; $('#pr').style.strokeDashoffset = 553 * (1 - P.left / P.total); $('#pg1').textContent = P.run ? 'Pauza' : (P.left < P.total ? 'Davom etish' : 'Boshlash'); }
function beep() { try { const a = new (window.AudioContext || window.webkitAudioContext)(); [0, .35, .7].forEach(t => { const o = a.createOscillator(), g = a.createGain(); o.frequency.value = 880; o.connect(g); g.connect(a.destination); g.gain.setValueAtTime(.2, a.currentTime + t); g.gain.exponentialRampToValueAtTime(.001, a.currentTime + t + .3); o.start(a.currentTime + t); o.stop(a.currentTime + t + .3); }); } catch (e) { /* ovoz yo‘q */ } }
setInterval(() => {
  if (!P.run) return; P.left = Math.max(0, Math.ceil((P.end - Date.now()) / 1000)); document.title = `${p2(Math.floor(P.left / 60))}:${p2(P.left % 60)} · Manba AI`; pomoDraw();
  if (P.left <= 0) { P.run = false; beep(); toast('⏰ Vaqt tugadi!'); document.title = 'Manba AI'; if (P.mode === 'pomodoro') { S.pomo++; add('pomo', 1, 20); } pomoDraw(); }
}, 250);

/* ---------- eslatmalar, vaqt hisobi, soat ---------- */
let tc = 0;
function tick() {
  if (document.visibilityState === 'visible') { D().sec += 5; if (++tc % 6 === 0) save(); }
  const n = new Date(); $('#clock').textContent = `${p2(n.getHours())}:${p2(n.getMinutes())}`; $('#date').textContent = `${n.getDate()} ${MONTHS[n.getMonth()].toLowerCase()}`;
  const pend = S.rem.filter(r => !r.done).length, bd = $('#bdg'); bd.hidden = !pend; bd.textContent = pend;
}
function checkRem() {
  const now = new Date(); let ch = false;
  S.rem.forEach(r => { if (r.done || new Date(r.at) > now) return; r.done = true; ch = true; toast('⏰ ' + r.text); try { if ('Notification' in window && Notification.permission === 'granted') new Notification('Manba AI eslatmasi', { body: r.text, icon: 'icon-192.png' }); } catch (e) { /* bildirishnoma yo‘q */ } });
  if (ch) { save(); if (location.hash === '#/reminders') render(); }
}

/* ---------- router ---------- */
/* ---------- Kosmik fon: Yer va Oy (teksturadan haqiqiy shar, kinematik yoritish) ---------- */
const TEX = {};
const loadTex = (src, m = 6) => TEX[src] ||= new Promise(ok => { const im = new Image(); im.onload = () => { try { const w = im.naturalWidth - 2 * m, h = im.naturalHeight - 2 * m, c = document.createElement('canvas'); c.width = w; c.height = h; const x = c.getContext('2d', { willReadFrequently: true }); x.drawImage(im, m, m, w, h, 0, 0, w, h); ok({ d: x.getImageData(0, 0, w, h).data, w, h }); } catch (e) { ok(null); } }; im.onerror = () => ok(null); im.src = src; });
const noise2 = (gw, gh) => { const g = Float32Array.from({ length: (gw + 1) * (gh + 1) }, Math.random); return (u, v) => { const x = u * gw, y = v * gh, x0 = x | 0, y0 = y | 0, fx = x - x0, fy = y - y0, i = y0 * (gw + 1) + x0, a = g[i], b = g[i + 1], c = g[i + gw + 1], d = g[i + gw + 2]; return (a + (b - a) * fx) * (1 - fy) + (c + (d - c) * fx) * fy; }; };
async function cityMap(tex) {
  const W = tex.w, H = tex.h, c = new Uint8Array(W * H);
  const real = await new Promise(ok => { const im = new Image(); im.onload = () => ok(im); im.onerror = () => ok(null); im.src = 'earth-night.webp'; });
  if (real) { try { const cv = document.createElement('canvas'); cv.width = W; cv.height = H; const x = cv.getContext('2d', { willReadFrequently: true }); x.drawImage(real, 0, 0, W, H); const d = x.getImageData(0, 0, W, H).data; for (let i = 0; i < W * H; i++) c[i] = Math.min(255, Math.max(d[i * 4], d[i * 4 + 1], d[i * 4 + 2]) * 1.5); return c; } catch (e) { /* protsedural variantga o‘tamiz */ } }
  const d = tex.d, n1 = noise2(48, 24), n2 = noise2(160, 80);
  for (let y = 0; y < H; y++) { if (Math.abs(.5 - y / H) * 180 > 68) continue; for (let x = 0; x < W; x++) { const i = y * W + x, r = d[i * 4], g = d[i * 4 + 1], b = d[i * 4 + 2]; if ((r > 165 && g > 165 && b > 165) || !(g > b * .88 || r > b * .95)) continue; const n = n1(x / W * .999, y / H * .999) * .55 + n2(x / W * .999, y / H * .999) * .3 + Math.random() * .15, m = Math.min(1, Math.max(0, (n - .52) / .22)); if (m > 0) c[i] = 255 * m * (.45 + .55 * Math.random()); } }
  return c;
}
async function planet(cv, src, o) {
  if (!cv) return; const tex = await loadTex(src);
  if (!tex) { cv.style.cssText += `;border-radius:50%;background:url(${src}) center/cover`; return; }
  const city = o.city ? (tex.city ||= await cityMap(tex)) : null;
  const W = tex.w, H = tex.h, td = tex.d, ct = Math.cos(o.tilt), st = Math.sin(o.tilt);
  let L = [-.62, .42, .66]; const ln = Math.hypot(...L); L = L.map(v => v / ln); const Hh = [L[0], L[1], L[2] + 1], hl = Math.hypot(...Hh); for (let k = 0; k < 3; k++) Hh[k] /= hl;
  let N, M, ctx, lon, r0, r1, fy, sh, rim, pm, nt, sp, wm, base, out;
  const build = px => {
    N = cv.width = cv.height = px; ctx = cv.getContext('2d'); M = N * N; const c = N / 2, R = c / 1.18, lh = Math.hypot(L[0], L[1]);
    lon = new Float32Array(M); r0 = new Int32Array(M); r1 = new Int32Array(M); fy = new Float32Array(M); sh = new Float32Array(M); rim = new Float32Array(M); nt = new Float32Array(M); sp = new Float32Array(M); wm = new Float32Array(M); pm = new Uint8Array(M);
    base = ctx.createImageData(N, N); out = ctx.createImageData(N, N);
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
      const i = y * N + x, dx = (x + .5 - c) / R, dy = (y + .5 - c) / R, r = Math.hypot(dx, dy), d = (r - 1) * R;
      if (d < .5) {
        const nz = Math.sqrt(Math.max(0, 1 - r * r)), qx = dx * ct - dy * st, qy = dx * st + dy * ct, lat = Math.asin(Math.max(-1, Math.min(1, -qy)));
        lon[i] = Math.atan2(qx, nz) / (2 * Math.PI) + .5;
        const v = (.5 - lat / Math.PI) * (H - 1), v0 = Math.floor(v); r0[i] = v0 * W; r1[i] = Math.min(H - 1, v0 + 1) * W; fy[i] = v - v0;
        const dot = dx * L[0] - dy * L[1] + nz * L[2];
        sh[i] = .035 + .965 * Math.pow(Math.max(0, dot), .8);
        rim[i] = Math.pow(1 - nz, 3) * .7 * (.25 + .75 * Math.max(0, dot + .35));
        nt[i] = Math.pow(Math.min(1, Math.max(0, (.1 - dot) / .3)), 1.5);
        sp[i] = dot > 0 ? Math.pow(Math.max(0, dx * Hh[0] - dy * Hh[1] + nz * Hh[2]), 70) : 0;
        wm[i] = Math.exp(-(((dot - .08) / .12) ** 2));
        pm[i] = d < -1 ? 255 : Math.round(255 * Math.min(1, (.5 - d) / 1.5));
      } else if (d < .2 * R) { const g = 1 - d / (.2 * R), lit = .25 + .75 * ((dx / r * L[0] - dy / r * L[1]) / lh * .5 + .5), j = i * 4; base.data[j] = o.glow[0]; base.data[j + 1] = o.glow[1]; base.data[j + 2] = o.glow[2]; base.data[j + 3] = 255 * g * g * o.gs * lit; }
    }
  };
  let rot = Math.random(), px = o.px; build(px);
  const draw = () => {
    const od = out.data, rr = o.rim; od.set(base.data);
    for (let i = 0; i < M; i++) {
      if (!pm[i]) continue;
      let u = (lon[i] + rot) * W; u -= Math.floor(u / W) * W;
      const x0 = u | 0, fx = u - x0, x1 = x0 + 1 === W ? 0 : x0 + 1, f = fy[i], w1 = (1 - fx) * (1 - f), w2 = fx * (1 - f), w3 = (1 - fx) * f, w4 = fx * f;
      const a = (r0[i] + x0) * 4, b = (r0[i] + x1) * 4, cc = (r1[i] + x0) * 4, dd = (r1[i] + x1) * 4, s = sh[i], j = i * 4;
      const R = td[a] * w1 + td[b] * w2 + td[cc] * w3 + td[dd] * w4, G = td[a + 1] * w1 + td[b + 1] * w2 + td[cc + 1] * w3 + td[dd + 1] * w4, B = td[a + 2] * w1 + td[b + 2] * w2 + td[cc + 2] * w3 + td[dd + 2] * w4;
      let oR = R * s, oG = G * s, oB = B * s;
      const sv = sp[i]; if (sv > .01 && o.spec) { const k = sv * Math.min(1, Math.max(0, (B - Math.max(R, G)) / 45)) * o.spec * 255; oR += k * .9; oG += k * .95; oB += k; }
      const ni = nt[i]; if (city && ni > .02) { const cl = city[r0[i] + x0]; if (cl) { const l = cl / 255 * ni; oR += 255 * l; oG += 175 * l; oB += 80 * l; } }
      const w = wm[i] * o.warm; if (w) { oR += 45 * w; oG += 20 * w; }
      const q = rim[i]; od[j] = Math.min(255, oR + q * rr[0]); od[j + 1] = Math.min(255, oG + q * rr[1]); od[j + 2] = Math.min(255, oB + q * rr[2]); od[j + 3] = pm[i];
    }
    ctx.putImageData(out, 0, 0);
  };
  const budget = o.budget || 18, minpx = o.min || 340;
  for (let k = 0; k < 3; k++) { draw(); const t0 = performance.now(); draw(); const ms = performance.now() - t0; if (ms <= budget || px <= minpx) break; px = Math.max(minpx, Math.round(px * Math.sqrt(budget / ms))); build(px); }
  draw(); if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  let last = performance.now(), ema = 0, fr = 0;
  const loop = t => {
    if (!cv.isConnected) return;
    if (!document.hidden && t - last >= o.dt) { rot = (rot + (t - last) / o.period) % 1; last = t; const t0 = performance.now(); draw(); ema = ema * .9 + (performance.now() - t0) * .1; if (++fr % 30 === 0 && ema > budget * 1.7 && px > minpx) { px = Math.max(minpx, Math.round(px * .8)); build(px); ema = 0; } }
    else if (document.hidden) last = t;
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
}
let inst = null;
addEventListener('beforeinstallprompt', e => { e.preventDefault(); inst = e; });
const go = v => { location.hash = '#/' + v; };
function applyTheme() { document.documentElement.dataset.theme = S.settings.theme; $('meta[name=theme-color]').content = S.settings.theme === 'light' ? '#eef3fb' : '#040813'; $$('[data-th]').forEach(b => b.classList.toggle('on', b.dataset.th === S.settings.theme)); }
function render() {
  let v = location.hash.replace(/^#\//, '') || 'home'; if (!V[v]) v = 'home';
  document.body.classList.toggle('v-home', v === 'home'); $('#view').innerHTML = V[v].html(); const h2 = $('#view h2'), nv = NAV.find(x => x[0] === v); if (h2 && nv && v !== 'home') h2.insertAdjacentHTML('afterbegin', `<span class="hi" style="--c:${COL[v]}">${ic(nv[2], 24)}</span>`); V[v].bind?.(); $('#ptitle').textContent = V[v].t;
  $$('#nav a').forEach(a => a.classList.toggle('on', a.dataset.v === v)); $$('.bnav a:not(.fab)').forEach(a => a.classList.toggle('on', a.getAttribute('href') === '#/' + v));
  closeMenu(); window.scrollTo(0, 0); $('#view').focus({ preventScroll: true });
}
const closeMenu = () => { const s = $('#sheet'); if (s) s.hidden = true; document.body.classList.remove('lock'); };
const openMenu = () => { $('#sheet').hidden = false; document.body.classList.add('lock'); $('#sheet a')?.focus(); };

/* ---------- doimiy kosmik fon: yulduzlar, parallaks, Yer va Oy ---------- */
function cosmos() {
  const c = $('#stars'), x = c.getContext('2d'), dpr = Math.min(devicePixelRatio || 1, 2); let st = [], W = 0, Ht = 0;
  const init = () => { W = innerWidth + 40; Ht = innerHeight + 40; c.width = W * dpr; c.height = Ht * dpr; x.setTransform(dpr, 0, 0, dpr, 0, 0); st = Array.from({ length: Math.round(W * Ht / 6500) }, () => ({ x: Math.random() * W, y: Math.random() * Ht, r: Math.random() * 1.2 + .2, a: .25 + Math.random() * .75, p: Math.random() * 6.3, s: .4 + Math.random() * 1.6, b: Math.random() > .85 })); };
  init(); let rt; addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(init, 250); });
  const par = { x: 0, y: 0, tx: 0, ty: 0 }; addEventListener('pointermove', e => { par.tx = e.clientX / innerWidth - .5; par.ty = e.clientY / innerHeight - .5; }, { passive: true });
  const lE = $('#layE'), lM = $('#layM'), reduce = matchMedia('(prefers-reduced-motion: reduce)').matches; let shoot = null, nextShoot = 7000, last = 0;
  const loop = t => {
    requestAnimationFrame(loop); if (document.hidden) return;
    par.x += (par.tx - par.x) * .05; par.y += (par.ty - par.y) * .05; const sy = scrollY;
    c.style.transform = `translate3d(${-par.x * 8}px,${-par.y * 6 - sy * .02}px,0)`;
    lE.style.transform = `translate3d(${-par.x * 18}px,${-par.y * 12 - sy * .05}px,0) scale(${1 + .012 * Math.sin(t / 4200)})`;
    lM.style.transform = `translate3d(${-par.x * 34}px,${-par.y * 24 - sy * .09}px,0)`;
    if (t - last < 50) return; last = t; x.clearRect(0, 0, W, Ht);
    for (const s of st) { x.globalAlpha = s.a * (reduce ? 1 : .65 + .35 * Math.sin(t / 1000 * s.s + s.p)); x.fillStyle = s.b ? '#9fc4ff' : '#fff'; x.beginPath(); x.arc(s.x, s.y, s.r, 0, 6.3); x.fill(); }
    if (reduce) return;
    if (!shoot && t > nextShoot) shoot = { x: Math.random() * W * .7 + W * .1, y: Math.random() * Ht * .35, t0: t };
    if (shoot) { const k = (t - shoot.t0) / 900; if (k > 1) { shoot = null; nextShoot = t + 9000 + Math.random() * 8000; } else { const ex = shoot.x + k * 420, ey = shoot.y + k * 210, g = x.createLinearGradient(ex - 160, ey - 80, ex, ey); g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(1, `rgba(255,255,255,${.9 * (1 - k)})`); x.globalAlpha = 1; x.strokeStyle = g; x.lineWidth = 1.6; x.beginPath(); x.moveTo(ex - 160, ey - 80); x.lineTo(ex, ey); x.stroke(); } }
  };
  requestAnimationFrame(loop);
  const big = innerWidth > 700;
  planet($('#bgEarth'), 'earth.webp', { px: big ? 800 : 540, tilt: .41, period: 95000, dt: 60, budget: 18, min: 360, glow: [70, 140, 255], gs: .75, rim: [60, 130, 255], city: true, spec: .9, warm: 1 });
  planet($('#bgMoon'), 'moon.webp', { px: big ? 240 : 170, tilt: -.1, period: 160000, dt: 90, budget: 5, min: 120, glow: [200, 210, 255], gs: .2, rim: [80, 90, 130], city: false, spec: 0, warm: 0 });
}

/* ---------- ishga tushirish ---------- */
$('#nav').innerHTML = NAV.map(([v, l, i]) => `${v === 'pomodoro' ? '<hr class="nd">' : ''}<a href="#/${v}" data-v="${v}" title="${l}" style="--c:${COL[v]}"><i>${ic(i, 20)}</i><span>${l}</span></a>`).join('');
$('#side').insertAdjacentHTML('beforeend', `<div class="side-foot"><button class="pro" id="pro">${ic('crown', 18)}<span>Pro</span></button><button class="col" id="col" aria-label="Menyuni yig‘ish">${ic('chev', 18)}<span>Yig‘ish</span></button></div>`);
document.body.insertAdjacentHTML('beforeend', `<div class="sheet" id="sheet" hidden role="dialog" aria-modal="true" aria-label="Bo‘limlar"><div class="sheet-in"><div class="row between" style="margin:0 0 14px"><h3 style="margin:0">Bo‘limlar</h3><button class="icon-btn" id="sx" aria-label="Yopish">✕</button></div><div class="sgrid">${NAV.map(([v, l, i]) => `<a href="#/${v}" style="--c:${COL[v]}"><span class="ti">${ic(i, 24)}</span>${l}</a>`).join('')}</div></div></div>`);
$('.bnav').innerHTML = `<a href="#/home">${ic('home')}<span>Bosh sahifa</span></a><a href="#/tutor">${ic('sparkles')}<span>AI Ustoz</span></a><button class="fab" id="more" aria-label="Barcha bo‘limlar">${ic('star', 28)}</button><a href="#/tests">${ic('check')}<span>Testlar</span></a><a href="#/settings">${ic('user')}<span>Profil</span></a>`;
$('#menu').onclick = openMenu; $('#more').onclick = openMenu; $('#sx').onclick = closeMenu;
$('#sheet').onclick = e => { if (e.target.id === 'sheet' || e.target.closest('a')) closeMenu(); };
addEventListener('keydown', e => { if (e.key === 'Escape') closeMenu(); });
const CMD = [...NAV.map(([v, l, i]) => ({ l, v, i })), { l: 'Yangi test yaratish', v: 'tests', i: 'check' }, { l: 'Kartalar to‘plami yaratish', v: 'cards', i: 'layers' }, { l: 'Slayd yaratish', v: 'slides', i: 'slides' }, { l: 'Referat yozish', v: 'referat', i: 'file' }, { l: 'Manba yuklash', v: 'sources', i: 'plus' }];
document.body.insertAdjacentHTML('beforeend', `<div class="cmd" id="cmd" hidden role="dialog" aria-modal="true" aria-label="Qidiruv"><div class="cmd-in"><div class="cmd-bar">${ic('search', 20)}<input id="cq" placeholder="Bo‘lim yoki amalni yozing… yoki AI Ustozga savol bering" autocomplete="off"><kbd>Esc</kbd></div><div id="cl2"></div></div></div>`);
let ci = 0;
const cmdList = () => { const q = $('#cq').value.trim().toLowerCase(); return CMD.filter(x => !q || x.l.toLowerCase().includes(q)).slice(0, 8); };
const cmdDraw = () => { const a = cmdList(), q = $('#cq').value.trim(); ci = Math.min(ci, Math.max(0, a.length - 1)); $('#cl2').innerHTML = a.map((x, k) => `<a href="#/${x.v}" class="${k === ci ? 'on' : ''}">${ic(x.i, 18)}<span>${x.l}</span></a>`).join('') + (q ? `<a href="#/tutor" data-ask="1" class="${!a.length ? 'on' : ''}">${ic('sparkles', 18)}<span>AI Ustozdan so‘rash: “${esc(q)}”</span></a>` : ''); };
const cmdClose = () => { $('#cmd').hidden = true; document.body.classList.remove('lock'); };
const cmdOpen = () => { $('#cmd').hidden = false; document.body.classList.add('lock'); $('#cq').value = ''; ci = 0; cmdDraw(); $('#cq').focus(); };
const cmdGo = a => { const q = $('#cq').value.trim(); cmdClose(); if (a === 'ask') { PREQ = q; location.hash === '#/tutor' ? render() : go('tutor'); } else go(a); };
$('#srch').onclick = cmdOpen; $('#cq').oninput = () => { ci = 0; cmdDraw(); };
$('#cq').onkeydown = e => { const a = cmdList(); if (e.key === 'ArrowDown') { e.preventDefault(); ci = Math.min(ci + 1, a.length - 1); cmdDraw(); } else if (e.key === 'ArrowUp') { e.preventDefault(); ci = Math.max(ci - 1, 0); cmdDraw(); } else if (e.key === 'Enter') { e.preventDefault(); a.length ? cmdGo(a[ci].v) : $('#cq').value.trim() && cmdGo('ask'); } };
$('#cmd').onclick = e => { const a = e.target.closest('a'); if (e.target.id === 'cmd') cmdClose(); else if (a) { e.preventDefault(); cmdGo(a.dataset.ask ? 'ask' : a.getAttribute('href').slice(2)); } };
addEventListener('keydown', e => { if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); cmdOpen(); } else if (e.key === 'Escape') cmdClose(); });
$('#pro2').onclick = () => toast('Pro rejim tez kunda. Hozircha barcha funksiyalar bepul.');
$('#lang').onclick = () => toast('Hozircha faqat o‘zbek tili. Rus va ingliz tillari keyingi yangilanishda.');
$('#pro').onclick = () => toast('Pro rejim tez kunda. Hozircha barcha funksiyalar bepul.');
const layout = () => $('.app').classList.toggle('compact', !!S.settings.compact);
$('#col').onclick = () => { S.settings.compact = !S.settings.compact; layout(); saveNow(); };
layout();
$$('[data-th]').forEach(b => b.onclick = () => { S.settings.theme = b.dataset.th; applyTheme(); saveNow(); });
addEventListener('hashchange', render);
applyTheme(); cosmos(); render(); tick(); checkRem();
setInterval(tick, 5000); setInterval(checkRem, 15000);
if ('serviceWorker' in navigator && location.protocol.startsWith('http')) navigator.serviceWorker.register('sw.js').catch(() => { /* ixtiyoriy */ });
