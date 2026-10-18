/* MANBA — Leitner Flashcards */
import { $, $$, rid, esc, toast, BOX, DAY } from './utils.js';
import { D, save, SUBJ } from './data.js';
import { ai, parseJSON, retrieve, ctxText } from './ai.js';

function upd() { if (window.__manbaUpd) window.__manbaUpd(); }

export function dueCards() {
  return D.cards.filter(c => !c.d || c.d <= Date.now());
}

export function renderCards() {
  const boxes = $('#boxes');
  if (boxes) {
    boxes.innerHTML = [1, 2, 3, 4, 5].map(b =>
      `<div><b>${D.cards.filter(c => c.b === b).length}</b><span>quti ${b}</span></div>`
    ).join('');
  }
  const cl = $('#cl');
  if (cl) {
    cl.innerHTML = D.cards.map(c =>
      `<div class="si" style="margin-top:8px">
        <span>${esc(c.q)}</span>
        <button class="g" data-cd="${c.id}">🗑</button>
      </div>`
    ).join('') || '<p class="mu">Karta yo‘q</p>';
  }
  const summary = $('#clist summary');
  if (summary) summary.textContent = `Kartalar ro‘yxati (${D.cards.length})`;
  const kd = $('#kd');
  if (kd) kd.textContent = dueCards().length;
  upd();
}

let rv = null, fp = false;

function nxtCard() {
  const k = $('#kv');
  if (!k) return;
  let due = dueCards();
  if (due.length > 1) due = due.filter(c => c !== rv);
  if (!due.length) {
    k.innerHTML = '<div class="c"><p>Hozir takrorlanadigan karta yo‘q ✓</p></div>';
    rv = null;
    upd();
    return;
  }
  rv = due[Math.floor(Math.random() * due.length)];
  fp = false;
  k.innerHTML = `
    <div class="c">
      <div class="si"><span class="mu">Quti ${rv.b}/5 · qoldi: ${due.length}</span></div>
      <div class="fc" id="fc">${esc(rv.q)}</div>
      <div class="row" id="kb" hidden>
        <button class="g" data-k="0">Bilmadim</button>
        <button class="b" data-k="1">Bildim</button>
      </div>
    </div>`;
}

export async function mkCards() {
  if (!D.src.length) return toast('Avval manba qo‘shing');
  const sel = $('#ks')?.value;
  const refs = retrieve('', sel, 14);
  const b = $('#kgn');
  if (b) { b.disabled = true; b.textContent = 'Yaratilmoqda…'; }
  try {
    const t = await ai([{
      role: 'user',
      content: `${SUBJ[D.subj]?.ai || ''}
Quyidagi manba parchalaridan 12 ta o‘quv kartasi tuz (${SUBJ[D.subj]?.h || ''}).
Til: ${D.lang}. FAQAT JSON qaytar: [{"q":"","a":""}]

MANBA:
${ctxText(refs)}`
    }], true);
    const l = parseJSON(t)
      .filter(c => c && c.q && c.a)
      .map(c => ({
        id: rid(), q: String(c.q), a: String(c.a),
        src: refs[0]?.sn || '', b: 1, d: 0
      }));
    if (!l.length) throw new Error('format xato');
    D.cards.push(...l);
    save();
    renderCards();
    toast(l.length + ' ta karta qo‘shildi');
  } catch (e) {
    toast('Kartalar yaratilmadi: ' + e.message);
  }
  if (b) { b.disabled = false; b.textContent = 'AI bilan kartalar yaratish'; }
}

export function initCards() {
  $('#cl')?.addEventListener('click', e => {
    const b = e.target.closest('[data-cd]');
    if (b) {
      D.cards = D.cards.filter(c => c.id !== b.dataset.cd);
      save();
      renderCards();
    }
  });
  $('#cadd')?.addEventListener('click', () => {
    const q = $('#cq')?.value.trim();
    const a = $('#ca')?.value.trim();
    if (!q || !a) return toast('Ikkala maydonni to‘ldiring');
    D.cards.push({ id: rid(), q, a, src: 'qo‘lda', b: 1, d: 0 });
    save();
    if ($('#cq')) $('#cq').value = '';
    if ($('#ca')) $('#ca').value = '';
    renderCards();
    toast('Karta qo‘shildi');
  });
  $('#kgn')?.addEventListener('click', mkCards);
  $('#kst')?.addEventListener('click', nxtCard);
  $('#kv')?.addEventListener('click', e => {
    if (e.target.closest('#fc') && rv) {
      fp = !fp;
      const f = $('#fc');
      if (f) {
        f.textContent = fp ? rv.a : rv.q;
        f.classList.remove('fl');
        void f.offsetWidth;
        f.classList.add('fl');
      }
      const kb = $('#kb');
      if (kb) kb.hidden = !fp;
      return;
    }
    const b = e.target.closest('[data-k]');
    if (b && rv) {
      if (b.dataset.k === '1') {
        rv.b = Math.min(5, rv.b + 1);
        rv.d = Date.now() + BOX[rv.b - 1] * DAY;
      } else {
        rv.b = 1;
        rv.d = 0;
      }
      save();
      upd();
      nxtCard();
    }
  });
}
