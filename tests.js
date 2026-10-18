/* MANBA — Tests & Mistakes */
import { $, $$, rid, esc, toast } from './utils.js';
import { D, save, SUBJ } from './data.js';
import { ai, parseJSON, retrieve, ctxText } from './ai.js';
import { renderCards } from './cards.js';

function go(id) { if (window.__manbaGo) window.__manbaGo(id); }
function upd() { if (window.__manbaUpd) window.__manbaUpd(); }
function showTab(id) { if (window.__manbaShowTab) window.__manbaShowTab(id); }

let Q = [], qi = 0, ANS = [], SIM = false;

function addMistake(q) {
  if (D.mistakes.some(m => m.q === q.q)) return;
  D.mistakes.unshift({
    id: rid(), q: q.q, o: q.o, a: q.a, e: q.e || '', sn: q.sn || '', at: Date.now()
  });
  if (!D.cards.some(c => c.q === q.q)) {
    D.cards.push({
      id: rid(), q: q.q,
      a: q.o[q.a] + (q.e ? ' — ' + q.e : ''),
      src: q.sn || '', b: 1, d: 0
    });
  }
  save();
}

function qs() {
  const z = $('#qz');
  if (!z) return;
  if (!Q.length) { z.innerHTML = ''; return; }
  if (qi >= Q.length) return finish();
  const q = Q[qi];
  const ans = ANS[qi];
  const answered = ans !== undefined;
  const opts = q.o.map((o, i) => {
    let c = 'o g';
    if (answered && !SIM) {
      if (i === q.a) c += ' ok';
      else if (i === ans) c += ' no';
    }
    return `<button class="${c}" data-i="${i}" ${answered ? 'disabled' : ''}>${'ABCD'[i]}. ${esc(o)}</button>`;
  }).join('');
  z.innerHTML = `
    <div class="c">
      <div class="si">
        <span class="mu">${qi + 1} / ${Q.length}</span>
        <span class="tag">${esc(q.sn)}</span>
      </div>
      <div class="bar"><i style="width:${(qi / Q.length) * 100}%"></i></div>
      <h3>${esc(q.q)}</h3>
      ${opts}
      ${answered && !SIM ? `<p class="mu">${esc(q.e)}</p>` : ''}
      ${answered ? `<button class="b" id="nq">${qi + 1 < Q.length ? 'Keyingisi' : 'Natija'}</button>` : ''}
    </div>`;
}

function finish() {
  const score = ANS.filter((a, i) => a === Q[i].a).length;
  Q.forEach((q, i) => {
    if (ANS[i] !== undefined && ANS[i] !== q.a) addMistake(q);
  });
  D.tests.unshift({
    at: Date.now(), sn: Q[0]?.sn || '', sc: score, n: Q.length, sim: SIM
  });
  D.tests = D.tests.slice(0, 60);
  save();
  upd();
  renderTH();
  const review = SIM
    ? Q.map((q, i) => `
      <div class="c">
        <b>${i + 1}. ${esc(q.q)}</b>
        <p class="${ANS[i] === q.a ? 'ok2' : 'x'}">Sizning javob: ${ANS[i] === undefined ? '—' : esc(q.o[ANS[i]])}</p>
        <p>To‘g‘ri: <b class="ok2">${esc(q.o[q.a])}</b></p>
        <p class="mu">${esc(q.e)}</p>
      </div>`).join('')
    : '';
  $('#qz').innerHTML = `
    <div class="c">
      <h3>Natija: ${score}/${Q.length} (${Math.round((score / Q.length) * 100)}%)</h3>
      <p class="mu">Xato savollar «Xatolar» bo‘limiga va kartalarga qo‘shildi.</p>
      <button class="g" id="again">Yangi test</button>
    </div>${review}`;
  renderCards();
}

function renderTH() {
  const el = $('#thist');
  if (!el) return;
  el.innerHTML = D.tests.length
    ? `<div class="c"><h3>Natijalar tarixi</h3>${
        D.tests.slice(0, 10).map(t =>
          `<p class="mu">${new Date(t.at).toLocaleDateString()} · ${esc(t.sn)} · <b>${t.sc}/${t.n}</b> (${Math.round((t.sc / t.n) * 100)}%)${t.sim ? ' · imtihon' : ''}</p>`
        ).join('')
      }</div>`
    : '';
}

export async function mkTest() {
  if (!D.src.length) return toast('Avval manba qo‘shing');
  const sel = $('#ts1')?.value;
  const topic = $('#ttp')?.value.trim() || '';
  const n = +($('#tn')?.value || 10);
  const lv = $('#tl')?.value || 'o‘rta';
  const refs = retrieve(topic, sel, 12);
  const b = $('#tgn');
  if (b) { b.disabled = true; b.textContent = 'Tuzilmoqda…'; }
  try {
    const t = await ai([{
      role: 'user',
      content: `${SUBJ[D.subj]?.ai || ''}
Quyidagi manba parchalari asosida ${n} ta ${lv} darajadagi test savoli tuz.
Til: ${D.lang}. Har savolda bitta to‘g‘ri javob bo‘lsin, variantlar mantiqan bir xil uzunlikda.
FAQAT JSON qaytar: [{"q":"savol","o":["A","B","C","D"],"a":0,"e":"qisqa izoh"}]

MANBA:
${ctxText(refs)}`
    }], true);
    const list = parseJSON(t).filter(q =>
      q && q.q && Array.isArray(q.o) && q.o.length === 4 &&
      Number.isInteger(q.a) && q.a >= 0 && q.a < 4
    );
    if (!list.length) throw new Error('format xato');
    Q = list.map(q => ({
      q: String(q.q), o: q.o.map(String), a: q.a,
      e: String(q.e || ''), sn: refs[0]?.sn || ''
    }));
    qi = 0; ANS = []; SIM = $('#sim')?.checked || false;
    showTab('tt');
    qs();
  } catch (e) {
    toast('Test tuzib bo‘lmadi: ' + e.message);
  }
  if (b) { b.disabled = false; b.textContent = 'AI bilan test tuzish'; }
}

export function renderErr() {
  const L = $('#el');
  if (!L) return;
  if (!D.mistakes.length) {
    L.innerHTML = '<p class="mu">Xato yo‘q. Test ishlang — xatolar shu yerda chiqadi.</p>';
    return;
  }
  L.innerHTML = D.mistakes.map(m => `
    <div class="c">
      <b>${esc(m.q)}</b>
      <p class="ok2">To‘g‘ri: ${esc(m.o[m.a])}</p>
      <p class="mu">${esc(m.e)}</p>
      <div class="si">
        <span class="tag">${esc(m.sn)}</span>
        <button class="g" data-rm="${m.id}">🗑</button>
      </div>
    </div>`).join('');
}

export function initTests() {
  $('#tgn')?.addEventListener('click', mkTest);
  $('#qz')?.addEventListener('click', e => {
    const o = e.target.closest('.o');
    const nx = e.target.closest('#nq');
    const ag = e.target.closest('#again');
    if (o && ANS[qi] === undefined) {
      ANS[qi] = +o.dataset.i;
      qs();
      return;
    }
    if (nx) { qi++; qs(); return; }
    if (ag) { Q = []; $('#qz').innerHTML = ''; }
  });
  $('#el')?.addEventListener('click', e => {
    const b = e.target.closest('[data-rm]');
    if (b) {
      D.mistakes = D.mistakes.filter(m => m.id !== b.dataset.rm);
      save();
      renderErr();
      upd();
    }
  });
  $('#emq')?.addEventListener('click', () => {
    if (!D.mistakes.length) return toast('Xato yo‘q');
    Q = D.mistakes.map(m => ({ q: m.q, o: m.o, a: m.a, e: m.e || '', sn: m.sn || '' }));
    qi = 0; ANS = []; SIM = false;
    go('pr');
    showTab('tt');
    qs();
  });
  $('#ecl')?.addEventListener('click', () => {
    if (confirm('Barcha xatolar o‘chirilsinmi?')) {
      D.mistakes = [];
      save();
      renderErr();
    }
  });
  renderTH();
}
