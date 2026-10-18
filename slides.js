/* MANBA — Premium Slides / Presentation */
import { $, rid, esc, toast } from './utils.js';
import { D, save, SUBJ } from './data.js';
import { ai, parseJSON, retrieve, ctxText } from './ai.js';

let current = 0;
let slides = [];

function renderStage() {
  const stage = $('#slideStage');
  if (!stage) return;
  if (!slides.length) {
    stage.innerHTML = '<div class="slide on"><p class="mu" style="text-align:center">Slaydlar hali yaratilmagan</p></div>';
    return;
  }
  stage.innerHTML = `
    ${slides.map((s, i) => `
      <div class="slide${i === current ? ' on' : ''}" data-i="${i}">
        <h3>${esc(s.title)}</h3>
        <p>${esc(s.body)}</p>
      </div>`).join('')}
    <div class="slide-nav">
      <button class="g" id="prevSlide">←</button>
      <div class="slide-dots">${slides.map((_, i) => `<span class="${i === current ? 'on' : ''}"></span>`).join('')}</div>
      <button class="g" id="nextSlide">→</button>
    </div>`;
  $('#prevSlide')?.addEventListener('click', () => {
    current = (current - 1 + slides.length) % slides.length;
    renderStage();
  });
  $('#nextSlide')?.addEventListener('click', () => {
    current = (current + 1) % slides.length;
    renderStage();
  });
}

export async function generateSlides() {
  if (!D.src.length) return toast('Avval manba qo‘shing');
  const sel = $('#sls')?.value || 'all';
  const topic = $('#slTopic')?.value.trim() || '';
  const n = +($('#slN')?.value || 6);
  const refs = retrieve(topic, sel, 12);
  const btn = $('#slGen');
  if (btn) { btn.disabled = true; btn.textContent = 'Yaratilmoqda…'; }
  try {
    const t = await ai([{
      role: 'user',
      content: `${SUBJ[D.subj]?.ai || ''}
Quyidagi manba asosida ${n} ta professional taqdimot slaydi tuz.
Til: ${D.lang}. Har bir slayd qisqa va aniq bo‘lsin.
FAQAT JSON: [{"title":"Sarlavha","body":"2–4 jumla matn"}]

MANBA:
${ctxText(refs)}`
    }], true);
    const list = parseJSON(t).filter(s => s && s.title && s.body);
    if (!list.length) throw new Error('format xato');
    slides = list.map(s => ({ title: String(s.title), body: String(s.body) }));
    current = 0;
    D.slides = slides;
    save();
    renderStage();
    toast(slides.length + ' ta slayd yaratildi');
  } catch (e) {
    toast('Slaydlar yaratilmadi: ' + e.message);
  }
  if (btn) { btn.disabled = false; btn.textContent = 'AI bilan slayd yaratish'; }
}

export function initSlides() {
  slides = D.slides || [];
  current = 0;
  renderStage();
  $('#slGen')?.addEventListener('click', generateSlides);
}
