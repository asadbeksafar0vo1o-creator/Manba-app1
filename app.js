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
const def = () => ({ sources: [], chat: [], cards: [], goals: [], events: {}, rem: [], daily: {}, points: 0, pomo: 0, settings: { model: 'openrouter/free', style: 'oddiy', theme: 'dark' } });
let S = def();
try { const d = JSON.parse(localStorage.getItem(KEY) || '{}'); S = { ...def(), ...d, settings: { ...def().settings, ...(d.settings || {}) } }; } catch (e) { /* buzilgan ma’lumot: bo‘sh boshlaymiz */ }
let saveT; const save = () => { clearTimeout(saveT); saveT = setTimeout(saveNow, 250); };
function saveNow() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { toast('Xotira to‘ldi: katta manbani o‘chiring.'); } }
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
    if ((m = l.match(/^#{1,4}\s+(.*)/))) { close(); o += `<h4>${inl(m[1])}</h4>`; }
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
async function ai(messages, o = {}) {
  const key = getKey(); if (!key) throw new Error('Avval Sozlamalar bo‘limida OpenRouter API kalitini kiriting.');
  let r; try {
    r = await fetch('https://openrouter.ai/api/v1/chat/completions', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + key, 'HTTP-Referer': location.origin, 'X-Title': 'Manba AI' }, body: JSON.stringify({ model: S.settings.model || 'openrouter/free', messages, temperature: o.t ?? .4, max_tokens: o.max || 2500 }) });
  } catch (e) { throw new Error('Internetga ulanib bo‘lmadi.'); }
  const d = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(d.error?.message || `AI xatosi (${r.status}). Kalit yoki modelni tekshiring.`);
  const t = d.choices?.[0]?.message?.content; if (!t) throw new Error('AI bo‘sh javob qaytardi. Qayta urinib ko‘ring.');
  return t;
}
const STY = { oddiy: 'Oddiy va tushunarli tilda tushuntiring.', ilmiy: 'Ilmiy-rasmiy uslubda yozing.', qisqa: 'Juda qisqa va aniq yozing.' };
const sys = () => `Siz Manba AI — o‘zbekcha ta’lim yordamchisisiz. ${STY[S.settings.style] || ''} Javobni o‘zbek tilida yozing (boshqa til so‘ralmasa). Aniq bo‘ling, faktlarni to‘qib chiqarmang; bilmasangiz, shuni ayting.`;
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
const NAV = [['home', 'Bosh sahifa', '🏠'], ['tutor', 'AI Ustoz', '🧠'], ['sources', 'Manbalar', '📚'], ['tests', 'Testlar', '✅'], ['cards', 'Flashkartalar', '🗂️'], ['referat', 'Referat', '📄'], ['slides', 'Slaydlar', '🖥️'], ['goals', 'Maqsadlar', '🎯'], ['pomodoro', 'Pomodoro', '⏱️'], ['calendar', 'Kalendar', '📅'], ['reminders', 'Eslatmalar', '🔔'], ['stats', 'Statistika', '📊'], ['tools', 'Vositalar', '🛠️'], ['teacher', 'O‘qituvchi rejimi', '👩‍🏫'], ['settings', 'Sozlamalar', '⚙️']];
const TILES = ['tutor', 'sources', 'tests', 'cards', 'referat', 'slides', 'goals', 'pomodoro', 'calendar', 'reminders', 'stats', 'settings'];
const TL = { summary: ['Konspekt', 'Quyidagi matndan o‘zbek tilida tartibli konspekt tuzing: asosiy g‘oyalar, muhim atamalar, qisqa xulosa.'], translate: ['Tarjima'], analyze: ['Matn tahlili', 'Matnning asosiy mavzusi, g‘oyalari, uslubi, kuchli va zaif tomonlarini tahlil qiling va xulosa yozing.'], formula: ['Formula yechish', 'Masalani bosqichma-bosqich yeching: berilgan, topish kerak, formula, hisob-kitob, yakuniy javob.'], image: ['Rasm tahlili', 'Rasmni diqqat bilan ko‘ring: undagi matn, jadval, grafik yoki masalani tushuntiring va kerak bo‘lsa yeching.'], simple: ['Oddiy tushuntirish', 'Mavzuni 10 yoshli bolaga tushuntirgandek, oddiy misollar bilan tushuntiring, so‘ng 3 ta savol bilan tekshiring.'] };
const EXTRAS = [['summary', '📝', 'Konspekt', 'Matndan qisqa konspekt'], ['translate', '🌐', 'Tarjima', 'Ko‘p tilli tarjima'], ['analyze', '🔍', 'Matn tahlili', 'Asosiy g‘oyalar, xulosa'], ['chat', '💬', 'PDF bilan chat', 'Hujjat bilan AI suhbat'], ['image', '🖼️', 'Rasm tahlili', 'Rasm, javob, grafika'], ['formula', '🧮', 'Formula yechish', 'Matematika, fizika, kimyo'], ['voice', '🎙️', 'Ovozdan matn', 'Diktant, ma’ruza yozuvi'], ['voice', '🔊', 'Matndan ovoz', 'Tabiiy talaffuzda tinglash']];
const TP = { lesson: ['Dars rejasi', 'Dars rejasi tuzing: maqsad va vazifalar, kerakli jihozlar, dars bosqichlari (vaqt taqsimoti bilan), faol metodlar, mustahkamlash, baholash, uy vazifasi.'], quiz: ['Nazorat testi', '10 ta savoldan iborat nazorat testi tuzing (A/B/C/D variantlar), oxirida javoblar kaliti bering va ikki xil (A va B) nusxa tayyorlang.'], hw: ['Uy vazifasi', 'Differensial uy vazifalarini tuzing: oson, o‘rta va murakkab darajada 3 tadan topshiriq hamda tekshirish mezoni.'], rubric: ['Baholash mezonlari', '5 ballik baholash mezonlarini (rubrika) aniq ko‘rsatkichlar bilan tuzing.'], method: ['Metodik tavsiya', 'Mavzuni qiziqarli o‘tish uchun metodik tavsiyalar bering: motivatsiya, interfaol o‘yinlar, vizual vositalar, o‘quvchilarning tipik xatolari.'] };
let PRE = null, PREQ = null;

const V = {
  home: {
    t: 'Bosh sahifa',
    html() {
      const done = S.goals.filter(g => g.done >= g.target).length, tot = S.goals.length, pct = tot ? Math.round(done / tot * 100) : 0;
      const ev = (S.events[day()] || []).map(e => e.t), rm = S.rem.filter(r => !r.done).sort((a, b) => a.at.localeCompare(b.at)).slice(0, 3).map(r => `⏰ ${r.text} · ${r.at.slice(5).replace('T', ' ')}`);
      const today = [...ev.map(t => '📅 ' + t), ...rm];
      return `<section class="hero"><div class="earth"></div><div class="moon"></div><div class="hero-in"><p class="eyebrow">ULTIMATE EDUCATION PLATFORM</p><h1>Manba AI</h1><p class="sub">Sizning shaxsiy ta’lim yordamchingiz</p><form id="ask" class="ask"><input id="askq" maxlength="400" placeholder="Bugun nimani o‘rganamiz?" autocomplete="off" aria-label="Savolingiz"><button aria-label="Yuborish">➤</button></form></div></section>
<div class="tiles">${TILES.map(v => { const n = NAV.find(x => x[0] === v); return `<a class="tile" href="#/${v}"><b>${n[2]}</b><span>${n[1]}</span></a>`; }).join('')}</div>
<div class="strip"><div class="stat"><small>Bugungi maqsadlar (${done}/${tot})</small><strong>${pct}%</strong><div class="bar"><i style="width:${pct}%"></i></div></div><div class="stat"><small>⏳ O‘qish vaqti</small><strong>${fmtMin(D().sec)}</strong></div><div class="stat"><small>🔥 Ketma-ketlik</small><strong>${streak()} kun</strong></div><div class="stat"><small>🏆 Umumiy ball</small><strong>${S.points.toLocaleString('en-US').replace(/,/g, ' ')}</strong></div></div>
<div class="panel"><p class="eyebrow">✦ QO‘SHIMCHA KUCHLI FUNKSIYALAR</p><div class="extras">${EXTRAS.map(x => `<button class="extra" data-x="${x[0]}"><b>${x[1]}</b><span>${x[2]}</span><small>${x[3]}</small></button>`).join('')}</div></div>
<div class="cols"><div class="panel"><h3>🎯 Maqsadlar</h3>${S.goals.slice(0, 3).map(g => `<div style="margin-bottom:12px"><div class="row between"><span>${esc(g.name)}</span><small class="muted">${g.done}/${g.target}</small></div><div class="bar"><i style="width:${Math.min(100, g.done / g.target * 100)}%"></i></div></div>`).join('') || '<p class="muted">Hali maqsad yo‘q.</p>'}<a class="btn block center" style="display:block;margin-top:8px" href="#/goals">Maqsadlarni boshqarish</a></div>
<div class="panel"><h3>📊 Haftalik o‘qish vaqti (daqiqa)</h3>${chart(last7(v => Math.round((v.sec || 0) / 60)))}</div>
<div class="panel"><h3>📌 Bugun</h3>${today.map(t => `<div class="item">${esc(t)}</div>`).join('') || '<p class="muted">Bugunga reja yo‘q.</p>'}<a class="btn block center" style="display:block;margin-top:10px" href="#/calendar">Kalendar</a></div></div>`;
    },
    bind() {
      $('#ask').onsubmit = e => { e.preventDefault(); PREQ = $('#askq').value.trim(); go('tutor'); };
      $$('.extra').forEach(b => b.onclick = () => { const x = b.dataset.x; if (x === 'chat') go('tutor'); else { PRE = x; go('tools'); } });
    }
  },

  tutor: {
    t: 'AI Ustoz',
    html() { return `<h2>AI Ustoz</h2><p class="muted">${S.sources.filter(s => s.on !== false).length ? 'Javoblar sizning manbalaringizga tayanadi.' : 'Manba yuklanmagan: umumiy bilimlar asosida javob beraman. Aniq javob uchun Manbalar bo‘limida PDF/DOCX yuklang.'}</p><div class="panel"><div class="chat" id="msgs" aria-live="polite"></div><div class="composer"><textarea id="mi" rows="1" placeholder="Savolingizni yozing…" aria-label="Savol"></textarea><button class="btn" id="mic" aria-label="Ovoz bilan yozish">🎙️</button><button class="btn pri" id="ms">Yuborish</button></div><div class="row"><button class="btn danger" id="mc">Suhbatni tozalash</button></div></div>`; },
    bind() {
      const box = $('#msgs');
      const draw = () => { box.innerHTML = S.chat.length ? S.chat.map((m, i) => `<div class="msg ${m.role === 'user' ? 'u' : 'a'}">${m.role === 'user' ? `<p>${esc(m.content)}</p>` : `<div class="md">${md(m.content)}</div><button class="sp" data-i="${i}">🔊 Tinglash</button>`}</div>`).join('') : '<p class="muted center">Savol bering: masalan, “Fotosintez qanday ishlaydi?”</p>'; box.scrollTop = box.scrollHeight; };
      draw();
      box.onclick = e => { const i = e.target.dataset?.i; if (i) speak(S.chat[i].content); };
      const send = async () => {
        const q = $('#mi').value.trim(); if (!q) return; $('#mi').value = ''; S.chat.push({ role: 'user', content: q }); draw();
        box.insertAdjacentHTML('beforeend', '<div class="load" id="ld"><i></i> O‘ylayapman…</div>'); box.scrollTop = box.scrollHeight; $('#ms').disabled = true;
        try { const a = await ai([{ role: 'system', content: sys() + srcNote() }, ...S.chat.slice(-10).map(({ role, content }) => ({ role, content }))], { max: 2000 }); S.chat.push({ role: 'assistant', content: a }); add('chats', 1, 1); }
        catch (e) { toast(e.message); S.chat.push({ role: 'assistant', content: '⚠️ ' + e.message }); }
        S.chat = S.chat.slice(-60); save(); $('#ms') && ($('#ms').disabled = false); if ($('#msgs')) draw();
      };
      $('#ms').onclick = send; $('#mi').onkeydown = e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } };
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
      $('#sl').onclick = e => { const d = e.target.dataset?.d, t = e.target.dataset?.t; if (d) { S.sources = S.sources.filter(s => s.id !== d); save(); list(); } if (t) { const s = S.sources.find(x => x.id === t); s.on = e.target.checked; save(); } };
      const addSrc = (name, text) => { text = text.replace(/\s+\n/g, '\n').trim(); if (text.length < 20) return toast(`“${name}” da matn topilmadi (skanerlangan PDF bo‘lishi mumkin).`); S.sources.push({ id: uid(), name, text: text.slice(0, 300000), on: true }); add('docs', 1, 5); saveNow(); list(); toast(`“${name}” qo‘shildi`); };
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
          const t = await ai([{ role: 'system', content: sys() + srcNote() }, { role: 'user', content: `${topic ? `Mavzu: ${topic}. ` : ''}${k} ta test savoli tuzing. Qiyinlik: ${lvl}. Har savolda 4 variant. FAQAT JSON massiv qaytaring: [{"q":"savol","o":["variant1","variant2","variant3","variant4"],"a":0,"w":"to‘g‘ri javob izohi"}] — "a" to‘g‘ri variant indeksi (0-3). ${qs.length ? 'Bularni takrorlamang: ' + qs.map(x => x.q.slice(0, 50)).join(' | ') : ''}` }], { t: .5, max: 3500 });
          const got = norm(pj(t)); if (!got.length) throw new Error('AI savol qaytarmadi. Qayta urinib ko‘ring.'); qs.push(...got);
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
        const a = pj(await ai([{ role: 'system', content: sys() + srcNote() }, { role: 'user', content: `${topic ? `Mavzu: ${topic}. ` : ''}${n} ta flashkarta tuzing: savol/atama va qisqa, aniq javob. FAQAT JSON massiv qaytaring: [{"q":"...","a":"..."}]` }], { t: .4, max: 3500 }));
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
        const d = pj(await ai([{ role: 'system', content: sys() + srcNote() }, { role: 'user', content: `${t ? `Mavzu: ${t}. ` : ''}${n} ta slayddan iborat taqdimot tuzing. Auditoriya: ${$('#ga').value}. Birinchi slayd — sarlavha slaydi (b da bitta qisqa kichik sarlavha). Qolganlarida 3–5 ta qisqa band. FAQAT JSON qaytaring: {"title":"...","slides":[{"t":"slayd sarlavhasi","b":["band","band"],"n":"o‘qituvchi uchun izoh"}]}` }], { t: .5, max: 4000 }));
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
      $('#pg1').onclick = () => { if (P.run) { P.run = false; } else { if (P.left <= 0) P.left = P.total; P.end = Date.now() + P.left * 1000; P.run = true; } pomoDraw(); };
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

  teacher: {
    t: 'O‘qituvchi rejimi',
    html() { return `<h2>O‘qituvchi rejimi</h2><p class="muted">Dars rejasi, nazorat testi, uy vazifasi va baholash mezonlari — tayyor materiallar.</p><div class="panel"><label>Nima tayyorlaymiz?<select id="pk">${Object.entries(TP).map(([k, v]) => `<option value="${k}">${v[0]}</option>`).join('')}</select></label><div class="three"><label>Fan<input id="pf" maxlength="60" placeholder="Biologiya"></label><label>Sinf / kurs<input id="ps" maxlength="30" placeholder="8-sinf"></label><label>Davomiyligi (daqiqa)<input id="pd" type="number" min="10" max="240" value="45"></label></div><label>Mavzu<input id="pm1" maxlength="160" placeholder="Hujayra tuzilishi"></label><button class="btn pri block" id="pg2">Tayyorlash</button></div><div id="po"></div>`; },
    bind() { $('#pg2').onclick = e => busy(e.target, $('#po'), async () => { const k = $('#pk').value, m = $('#pm1').value.trim(); if (!m) throw new Error('Mavzuni kiriting.'); showOut($('#po'), await ai([{ role: 'system', content: sys() + srcNote() }, { role: 'user', content: `Fan: ${$('#pf').value || 'ko‘rsatilmagan'}. Sinf/kurs: ${$('#ps').value || 'ko‘rsatilmagan'}. Dars davomiyligi: ${$('#pd').value} daqiqa. Mavzu: ${m}.\n${TP[k][1]} O‘zbekiston ta’lim sharoitiga mos yozing.` }], { t: .5, max: 4000 }), 'oqituvchi-' + k); add('docs', 1, 10); }); }
  },

  settings: {
    t: 'Sozlamalar',
    html() { const st = S.settings; return `<h2>Sozlamalar</h2><div class="panel"><h3>AI ulanishi</h3><p class="muted small">Kalitni <b>openrouter.ai/keys</b> sahifasidan oling. Kalit faqat shu brauzerda saqlanadi va faqat OpenRouter’ga yuboriladi. Uni hech qachon GitHub’ga yoki kodga yozmang.</p><label>OpenRouter API kaliti<input id="sk" type="password" autocomplete="off" placeholder="sk-or-…" value="${esc(getKey())}"></label><label style="display:flex;align-items:center"><input type="checkbox" id="sr" ${localStorage.getItem('manba.key') ? 'checked' : ''}> Shu qurilmada eslab qolish (umumiy kompyuterda belgilamang)</label><label>Model<input id="sm" list="ml" value="${esc(st.model)}"><datalist id="ml"><option value="openrouter/free"><option value="meta-llama/llama-3.3-70b-instruct:free"><option value="google/gemma-3-27b-it:free"><option value="deepseek/deepseek-chat-v3.1:free"></datalist></label><p class="muted small">Standart “openrouter/free” bepul modelni o‘zi tanlaydi. Rasm tahlili uchun rasm ko‘ra oladigan model kerak.</p><div class="two"><label>Javob uslubi<select id="sy"><option value="oddiy">Oddiy</option><option value="ilmiy">Ilmiy</option><option value="qisqa">Qisqa</option></select></label><label>Mavzu<select id="sth"><option value="dark">Qorong‘i (kosmik)</option><option value="light">Yorug‘</option></select></label></div><button class="btn pri" id="ss">Saqlash</button></div><div class="panel"><h3>Ma’lumotlar</h3><div class="row" style="margin:0"><button class="btn" id="se">Eksport (JSON)</button><label class="btn" style="margin:0;cursor:pointer">Import<input type="file" id="si" accept=".json" hidden></label><button class="btn" id="sin" hidden>📲 Ilovani o‘rnatish</button><button class="btn danger" id="sc">Barcha ma’lumotni o‘chirish</button></div><p class="muted small">Barcha ma’lumot (manbalar, kartalar, statistika) shu brauzerda saqlanadi. Brauzer ma’lumotlari tozalansa, ular ham o‘chadi — vaqti-vaqti bilan eksport qiling.</p></div>`; },
    bind() {
      $('#sy').value = S.settings.style; $('#sth').value = S.settings.theme;
      $('#ss').onclick = () => { const k = $('#sk').value.trim(); localStorage.removeItem('manba.key'); sessionStorage.removeItem('manba.key'); if (k) ($('#sr').checked ? localStorage : sessionStorage).setItem('manba.key', k); S.settings.model = $('#sm').value.trim() || 'openrouter/free'; S.settings.style = $('#sy').value; S.settings.theme = $('#sth').value; applyTheme(); saveNow(); toast('Saqlandi ✓'); };
      $('#se').onclick = () => dl('manba-zaxira.json', 'application/json', JSON.stringify(S));
      $('#si').onchange = async e => { try { const d = JSON.parse(await e.target.files[0].text()); if (typeof d !== 'object' || !d) throw 0; S = { ...def(), ...d, settings: { ...def().settings, ...(d.settings || {}) } }; saveNow(); applyTheme(); toast('Import qilindi'); render(); } catch (er) { toast('Fayl noto‘g‘ri.'); } };
      $('#sc').onclick = () => { if (confirm('Barcha manbalar, kartalar va statistika o‘chiriladi. Davom etasizmi?')) { S = def(); saveNow(); applyTheme(); toast('Ma’lumotlar o‘chirildi'); render(); } };
      if (inst) { $('#sin').hidden = false; $('#sin').onclick = async () => { inst.prompt(); await inst.userChoice; inst = null; $('#sin').hidden = true; }; }
    }
  }
};

/* ---------- pomodoro holati ---------- */
const P = { mode: 'pomodoro', min: { pomodoro: 25, short: 5, long: 15 }, total: 1500, left: 1500, run: false, end: 0 };
function pomoDraw() { const t = $('#pt'); if (!t) return; t.textContent = `${p2(Math.floor(P.left / 60))}:${p2(P.left % 60)}`; $('#pr').style.strokeDashoffset = 553 * (1 - P.left / P.total); $('#pg1').textContent = P.run ? 'Pauza' : (P.left < P.total ? 'Davom etish' : 'Boshlash'); }
function beep() { try { const a = new (window.AudioContext || window.webkitAudioContext)(); [0, .35, .7].forEach(t => { const o = a.createOscillator(), g = a.createGain(); o.frequency.value = 880; o.connect(g); g.connect(a.destination); g.gain.setValueAtTime(.2, a.currentTime + t); g.gain.exponentialRampToValueAtTime(.001, a.currentTime + t + .3); o.start(a.currentTime + t); o.stop(a.currentTime + t + .3); }); } catch (e) { /* ovoz yo‘q */ } }
setInterval(() => {
  if (!P.run) return; P.left = Math.max(0, Math.ceil((P.end - Date.now()) / 1000)); document.title = `${p2(Math.floor(P.left / 60))}:${p2(P.left % 60)} · Manba AI`; pomoDraw();
  if (P.left <= 0) { P.run = false; beep(); toast('⏰ Vaqt tugadi!'); document.title = 'Manba AI'; if (P.mode === 'pomodoro') { S.pomo++; add('pomo', 1, 20); } pomoDraw(); }
}, 250);

/* ---------- eslatmalar, vaqt hisobi, soat ---------- */
function tick() {
  if (document.visibilityState === 'visible') { D().sec += 5; save(); }
  const n = new Date(); $('#clock').textContent = `${p2(n.getHours())}:${p2(n.getMinutes())} · ${n.getDate()} ${MONTHS[n.getMonth()].toLowerCase()}`;
}
function checkRem() {
  const now = new Date(); let ch = false;
  S.rem.forEach(r => { if (r.done || new Date(r.at) > now) return; r.done = true; ch = true; toast('⏰ ' + r.text); try { if ('Notification' in window && Notification.permission === 'granted') new Notification('Manba AI eslatmasi', { body: r.text, icon: 'icon-192.png' }); } catch (e) { /* bildirishnoma yo‘q */ } });
  if (ch) { save(); if (location.hash === '#/reminders') render(); }
}

/* ---------- router ---------- */
let inst = null;
addEventListener('beforeinstallprompt', e => { e.preventDefault(); inst = e; });
const go = v => { location.hash = '#/' + v; };
function applyTheme() { document.documentElement.dataset.theme = S.settings.theme; $('meta[name=theme-color]').content = S.settings.theme === 'light' ? '#eef3fb' : '#040813'; }
function render() {
  let v = location.hash.replace(/^#\//, '') || 'home'; if (!V[v]) v = 'home';
  $('#view').innerHTML = V[v].html(); V[v].bind?.(); $('#ptitle').textContent = V[v].t;
  $$('#nav a').forEach(a => a.classList.toggle('on', a.dataset.v === v)); $$('.bnav a').forEach(a => a.style.opacity = a.getAttribute('href') === '#/' + v ? 1 : .65);
  closeMenu(); window.scrollTo(0, 0); $('#view').focus({ preventScroll: true });
}
const closeMenu = () => { $('#side').classList.remove('open'); $('#scrim').classList.remove('open'); };
const openMenu = () => { $('#side').classList.add('open'); $('#scrim').classList.add('open'); };

/* ---------- yulduzlar ---------- */
function stars() {
  const c = $('#stars'), x = c.getContext('2d'), dpr = Math.min(devicePixelRatio || 1, 2);
  const draw = () => { c.width = innerWidth * dpr; c.height = innerHeight * dpr; x.scale(dpr, dpr); const n = Math.round(innerWidth * innerHeight / 7000); for (let i = 0; i < n; i++) { x.globalAlpha = .25 + Math.random() * .75; x.fillStyle = Math.random() > .85 ? '#9fc4ff' : '#fff'; x.beginPath(); x.arc(Math.random() * innerWidth, Math.random() * innerHeight, Math.random() * 1.2 + .2, 0, 6.3); x.fill(); } };
  draw(); let rt; addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(draw, 250); });
}

/* ---------- ishga tushirish ---------- */
$('#nav').innerHTML = NAV.map(([v, l, i]) => `<a href="#/${v}" data-v="${v}"><i>${i}</i>${l}</a>`).join('');
$('#menu').onclick = openMenu; $('#more').onclick = openMenu; $('#scrim').onclick = closeMenu;
$('#theme').onclick = () => { S.settings.theme = S.settings.theme === 'light' ? 'dark' : 'light'; applyTheme(); saveNow(); };
addEventListener('hashchange', render);
applyTheme(); stars(); render(); tick(); checkRem();
setInterval(tick, 5000); setInterval(checkRem, 15000);
if ('serviceWorker' in navigator && location.protocol.startsWith('http')) navigator.serviceWorker.register('sw.js').catch(() => { /* ixtiyoriy */ });
