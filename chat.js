/* MANBA — AI Chat */
import { $, esc, toast } from './utils.js';
import { D, save, SUBJ } from './data.js';
import { ai, retrieve, ctxText } from './ai.js';

function go(id) {
  if (window.__manbaGo) window.__manbaGo(id);
}

const fmt = s => esc(s)
  .replace(/\*\*(.+?)\*\*/g, '<b>$1</b>')
  .replace(/\[(\d+)\]/g, '<span class="cite">[$1]</span>');

export function rc() {
  const cm = $('#cm');
  if (!cm) return;
  cm.innerHTML = D.chat.slice(-50).map(m => {
    if (m.r === 'u') return `<div class="m u">${esc(m.c)}</div>`;
    const refs = (m.refs || []).map((r, i) =>
      `<div><b>[${i + 1}] ${esc(r.sn)}</b>: ${esc(r.x.slice(0, 170))}…</div>`
    ).join('');
    return `<div class="m a">${fmt(m.c)}${refs ? `<div class="refs">${refs}</div>` : ''}</div>`;
  }).join('');
  scrollTo(0, document.body.scrollHeight);
}

export async function snd(q) {
  q = (q || $('#ci')?.value || '').trim();
  if (!q) return;
  if (!D.src.length) {
    toast('Avval manba qo‘shing');
    return go('src');
  }
  const sel = $('#cs')?.value || 'all';
  if ($('#ci')) $('#ci').value = '';
  const refs = retrieve(q, sel, 7);
  D.chat.push({ r: 'u', c: q });
  const w = { r: 'a', c: '…' };
  D.chat.push(w);
  rc();
  try {
    const hist = D.chat.slice(-8, -2).map(m => ({
      role: m.r === 'u' ? 'user' : 'assistant',
      content: m.c
    }));
    const sys = `Sen MANBA o‘quv yordamchisisan. ${SUBJ[D.subj]?.ai || ''}
Faqat quyidagi manba parchalari asosida ${D.lang} qisqa, aniq javob ber (2–7 jumla).
Har bir faktni tegishli parcha raqami bilan belgila, masalan [1].
Parchalarda javob bo‘lmasa, «Manbada bu haqida ma’lumot yo‘q» de.

MANBA PARCHALARI:
${ctxText(refs)}`;
    w.c = await ai([{ role: 'system', content: sys }, ...hist, { role: 'user', content: q }]);
    w.refs = refs.map(c => ({ sn: c.sn, x: c.x.slice(0, 420) }));
  } catch (e) {
    w.c = 'Xato: ' + (e.message || 'AI javob bermadi');
  }
  save();
  rc();
}

export function initChat() {
  $('#cg')?.addEventListener('click', () => snd());
  $('#ci')?.addEventListener('keydown', e => { if (e.key === 'Enter') snd(); });
  $('#chips')?.addEventListener('click', e => {
    const b = e.target.closest('.chip');
    if (b) snd(b.textContent);
  });
  $('#cclr')?.addEventListener('click', () => {
    D.chat = [];
    save();
    rc();
  });
}
