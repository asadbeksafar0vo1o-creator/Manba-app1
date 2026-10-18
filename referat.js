/* MANBA — Referat / Essay generator */
import { $, rid, esc, toast } from './utils.js';
import { D, save, SUBJ } from './data.js';
import { ai, retrieve, ctxText } from './ai.js';

export async function generateReferat() {
  if (!D.src.length) return toast('Avval manba qo‘shing');
  const sel = $('#rfs')?.value || 'all';
  const topic = $('#rfTopic')?.value.trim();
  if (!topic) return toast('Mavzu kiriting');
  const len = $('#rfLen')?.value || 'o‘rta';
  const refs = retrieve(topic, sel, 14);
  const btn = $('#rfGen');
  if (btn) { btn.disabled = true; btn.textContent = 'Yozilmoqda…'; }
  const preview = $('#rfPreview');
  if (preview) preview.innerHTML = '<p class="mu">AI referat yozmoqda…</p>';
  try {
    const words = len === 'qisqa' ? 350 : len === 'uzun' ? 900 : 600;
    const t = await ai([{
      role: 'user',
      content: `${SUBJ[D.subj]?.ai || ''}
Quyidagi manba parchalari asosida «${topic}» mavzusida referat (insho) yoz.
Til: ${D.lang}. Taxminan ${words} so‘z. Tuzilma: Kirish, Asosiy qism (2–3 bo‘lim), Xulosa.
Faqat manbaga tayan. Iqtiboslar uchun [1], [2] ishlat.

MANBA:
${ctxText(refs)}`
    }]);
    const item = {
      id: rid(),
      topic,
      text: t,
      at: Date.now(),
      refs: refs.map(r => r.sn)
    };
    D.referats.unshift(item);
    D.referats = D.referats.slice(0, 30);
    save();
    if (preview) {
      preview.innerHTML = `
        <h3>${esc(topic)}</h3>
        <div class="referat-preview">${esc(t)}</div>
        <div class="row" style="margin-top:12px">
          <button class="g" id="rfCopy">Nusxa olish</button>
          <button class="g" id="rfSave">Saqlanganlarga qo‘shildi ✓</button>
        </div>`;
      $('#rfCopy')?.addEventListener('click', () => {
        navigator.clipboard?.writeText(t);
        toast('Nusxa olindi');
      });
    }
    toast('Referat tayyor');
  } catch (e) {
    if (preview) preview.innerHTML = `<p class="x">Xato: ${esc(e.message)}</p>`;
    toast('Referat yozilmadi: ' + e.message);
  }
  if (btn) { btn.disabled = false; btn.textContent = 'AI bilan referat yozish'; }
}

export function initReferat() {
  $('#rfGen')?.addEventListener('click', generateReferat);
}
