/* MANBA — Sources management */
import { $, $$, rid, esc, toast } from './utils.js';
import { D, save } from './data.js';

function upd() {
  if (window.__manbaUpd) window.__manbaUpd();
}

export function renderSrc() {
  const sl = $('#sl');
  if (!sl) return;
  sl.innerHTML = D.src.length
    ? D.src.map(s => `
      <div class="c si">
        <div>
          <b>${esc(s.n)}</b>
          <p class="mu">${esc(s.x.slice(0, 90))}… · ${new Date(s.at).toLocaleDateString()}</p>
        </div>
        <div class="row">
          <button class="g" data-view="${s.id}">👁</button>
          <button class="g" data-del="${s.id}">🗑</button>
        </div>
      </div>`).join('')
    : '<p class="mu">Hali manba yo‘q. Matn, fayl yoki havola qo‘shing.</p>';

  $$('#cs, #ts1, #ks, #sls, #rfs').forEach(sel => {
    if (!sel) return;
    const v = sel.value;
    sel.innerHTML = '<option value="all">Barcha manbalar</option>' +
      D.src.map(s => `<option value="${s.id}">${esc(s.n)}</option>`).join('');
    sel.value = v || 'all';
  });
}

export function initSources() {
  const sl = $('#sl');
  if (sl) {
    sl.onclick = e => {
      const del = e.target.closest('[data-del]');
      if (del) {
        D.src = D.src.filter(s => s.id !== del.dataset.del);
        save();
        renderSrc();
        upd();
        toast('Manba o‘chirildi');
        return;
      }
      const view = e.target.closest('[data-view]');
      if (view) {
        const s = D.src.find(x => x.id === view.dataset.view);
        if (!s) return;
        const v = $('#viewer');
        if (v) {
          v.hidden = false;
          v.innerHTML = `<h3>${esc(s.n)}</h3><div class="referat-preview">${esc(s.x.slice(0, 8000))}</div>
            <button class="g" id="closeView">Yopish</button>`;
          $('#closeView').onclick = () => { v.hidden = true; };
        }
      }
    };
  }

  $('#ssv')?.addEventListener('click', () => {
    const n = $('#sn').value.trim();
    const x = $('#sx').value.trim();
    if (!n || !x) return toast('Nom va matn kerak');
    D.src.unshift({ id: rid(), n, x, at: Date.now(), by: D.role });
    save();
    $('#sn').value = '';
    $('#sx').value = '';
    renderSrc();
    upd();
    toast('Manba saqlandi');
  });

  $('#sf')?.addEventListener('change', async e => {
    const f = e.target.files[0];
    if (!f) return;
    const prog = $('#sprog');
    if (prog) prog.textContent = 'Yuklanmoqda…';
    try {
      let t = '';
      if (f.type.startsWith('text') || /\.(txt|md|csv)$/i.test(f.name)) {
        t = await f.text();
      } else {
        t = `[Fayl: ${f.name}]\n\nBrauzerda to‘liq ekstraksiya uchun kutubxona (pdf.js / mammoth) qo‘shilishi mumkin. Hozircha nom saqlandi.`;
      }
      D.src.unshift({ id: rid(), n: f.name, x: t.slice(0, 60000), at: Date.now(), by: D.role });
      save();
      renderSrc();
      upd();
      toast('Fayl qo‘shildi');
    } catch {
      toast('Fayl o‘qilmadi');
    }
    if (prog) prog.textContent = '';
    e.target.value = '';
  });

  $('#sul')?.addEventListener('click', () => {
    const url = $('#su').value.trim();
    if (!url) return toast('Havola kiriting');
    D.src.unshift({
      id: rid(),
      n: url.slice(0, 60),
      x: `Veb-sahifa: ${url}\n\n(Proksi orqali yuklash sozlangan bo‘lsa, AI ushbu manbadan foydalanishi mumkin.)`,
      at: Date.now(),
      by: D.role
    });
    save();
    $('#su').value = '';
    renderSrc();
    upd();
    toast('Havola qo‘shildi');
  });
}
