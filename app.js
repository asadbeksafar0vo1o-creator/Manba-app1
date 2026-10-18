/* MANBA — Core App Controller */
import { $, $$, toast, downloadJSON } from './utils.js';
import { D, save, resetAll, SUBJ, EXAMS } from './data.js';
import { setP, renderPlanetPicker, startPlanetSpin, initStars } from './planets.js';
import { renderSrc, initSources } from './sources.js';
import { rc, initChat } from './chat.js';
import { initTests, renderErr } from './tests.js';
import { renderCards, initCards } from './cards.js';
import { renderStudy, initStudy } from './study.js';
import { initSlides } from './slides.js';
import { initReferat } from './referat.js';

export function go(id) {
  $$('.v').forEach(v => v.classList.toggle('on', v.id === id));
  $$('nav button').forEach(b => b.classList.toggle('on', b.dataset.v === id));
  if (id === 'pr') renderCards();
  if (id === 'err') renderErr();
  if (id === 'study') renderStudy();
  if (id === 'src') renderSrc();
  if (id === 'chat') rc();
  if (id === 'subjects') renderSubjects();
  if (id === 'exams') renderExams();
  if (id === 'slides') { /* already inited */ }
  if (id === 'referat') { /* already inited */ }
  window.scrollTo(0, 0);
}

export function showTab(id) {
  $$('.tabs [data-t]').forEach(x => x.classList.toggle('on', x.dataset.t === id));
  $$('.tb').forEach(x => x.classList.toggle('on', x.id === id));
}

export function upd() {
  const s1 = $('#s1'), s2 = $('#s2'), s3 = $('#s3'), s4 = $('#s4');
  if (s1) s1.textContent = D.src.length;
  if (s2) s2.textContent = D.cards.length;
  if (s3) s3.textContent = D.min;
  if (s4) s4.textContent = Object.keys(D.mlog).filter(k => D.mlog[k] > 0).length;
  const kd = $('#kd');
  if (kd) kd.textContent = D.cards.filter(c => !c.d || c.d <= Date.now()).length;
  const hint = $('#hint');
  if (hint) hint.hidden = D.src.length > 0;
}

function th(t) {
  D.th = t;
  document.documentElement.dataset.t = t;
  save();
  const tg = $('#tg');
  if (tg) tg.textContent = t === 'dark' ? '◐' : '◑';
}

function applySubjectTheme() {
  document.body.dataset.subj = D.subj || 'umumiy';
}

function applyExam(id, silent = false, nav = true) {
  D.exam = id;
  save();
  document.body.classList.toggle('exam', !!id);
  const badge = $('#badge');
  if (badge) {
    if (id && EXAMS[id]) {
      badge.hidden = false;
      badge.textContent = EXAMS[id].n;
    } else {
      badge.hidden = true;
    }
  }
  if (!silent) toast(id ? EXAMS[id].n + ' rejimi yoqildi' : 'Imtihon rejimi o‘chirildi');
  if (nav && id) go('pr');
  renderExams();
}

function renderHomeChips() {
  const sc = $('#subjChips');
  if (sc) {
    sc.innerHTML = Object.entries(SUBJ).map(([k, s]) =>
      `<button class="g${D.subj === k ? ' on' : ''}" data-sj="${k}">${s.symbol} ${s.n}</button>`
    ).join('');
  }
  const ec = $('#examChips');
  if (ec) {
    ec.innerHTML = Object.entries(EXAMS).map(([k, e]) =>
      `<button class="g${D.exam === k ? ' on' : ''}" data-ex="${k}">${e.symbol} ${e.n}</button>`
    ).join('');
  }
}

function renderSubjects() {
  const grid = $('#subjectGrid');
  if (!grid) return;
  grid.innerHTML = Object.entries(SUBJ).map(([k, s]) => `
    <div class="direction-card${D.subj === k ? ' selected' : ''}" style="--dir1:${s.dir1}">
      <div class="symbol">${s.symbol}</div>
      <b>${s.n}</b>
      <p>${s.h}</p>
      <button class="g" data-sj="${k}">${D.subj === k ? 'Tanlangan' : 'Tanlash'}</button>
    </div>`).join('');
  grid.onclick = e => {
    const b = e.target.closest('[data-sj]');
    if (b) {
      D.subj = b.dataset.sj;
      save();
      applySubjectTheme();
      renderSubjects();
      renderHomeChips();
      toast(SUBJ[D.subj].n + ' faollashtirildi');
    }
  };
  const det = $('#subjectDetail');
  const s = SUBJ[D.subj];
  if (det && s) det.innerHTML = `<h3>${s.symbol} ${s.n}</h3><p class="mu">${s.ai}</p>`;
}

function renderExams() {
  const grid = $('#examGrid');
  if (grid) {
    grid.innerHTML = Object.entries(EXAMS).map(([k, e]) => `
      <div class="direction-card${D.exam === k ? ' selected' : ''}">
        <div class="symbol">${e.symbol}</div>
        <b>${e.n}</b>
        <p>${e.desc}</p>
        <button class="g" data-ex="${k}">${D.exam === k ? 'Faol' : 'Boshlash'}</button>
      </div>`).join('');
    grid.onclick = e => {
      const b = e.target.closest('[data-ex]');
      if (b) applyExam(b.dataset.ex);
    };
  }
  const st = $('#examStatus');
  if (st) {
    if (D.exam && EXAMS[D.exam]) {
      st.innerHTML = `<h3>${EXAMS[D.exam].symbol} ${EXAMS[D.exam].n} rejimi yoqilgan</h3>
        <p class="mu">Test va kartalar imtihon rejimida ishlaydi. Istalgan vaqtda chiqishingiz mumkin.</p>`;
    } else {
      st.innerHTML = `<h3>Imtihon rejimi o‘chiq</h3><p class="mu">Yo‘nalishni tanlab, imtihon rejimini boshlang.</p>`;
    }
  }
}

function setRole(role) {
  D.role = role;
  save();
  $$('.role-bar button').forEach(b => b.classList.toggle('on', b.dataset.role === role));
  document.body.dataset.role = role;
  toast(role === 'teacher' ? 'O‘qituvchi rejimi' : 'Talaba rejimi');
}

function fillSet() {
  if ($('#ky')) $('#ky').value = D.key;
  if ($('#px')) $('#px').value = D.proxy;
  if ($('#md')) $('#md').value = D.mod;
  if ($('#lg')) $('#lg').value = D.lang;
  if ($('#sj')) {
    $('#sj').innerHTML = Object.entries(SUBJ).map(([k, s]) =>
      `<option value="${k}">${s.n}</option>`
    ).join('');
    $('#sj').value = D.subj;
  }
  if ($('#gl')) $('#gl').value = D.goal;
}

function initNav() {
  $$('nav button').forEach(b => b.addEventListener('click', () => go(b.dataset.v)));
  $$('[data-go]').forEach(b => b.addEventListener('click', () => go(b.dataset.go)));
  $('.tabs')?.addEventListener('click', e => {
    const b = e.target.closest('[data-t]');
    if (b) showTab(b.dataset.t);
  });
  $('#tg')?.addEventListener('click', () => th(D.th === 'dark' ? 'light' : 'dark'));
  $('#exitExam')?.addEventListener('click', () => applyExam(null));
  $('#subjChips')?.addEventListener('click', e => {
    const b = e.target.closest('[data-sj]');
    if (b) {
      D.subj = b.dataset.sj;
      save();
      applySubjectTheme();
      renderHomeChips();
      toast(SUBJ[D.subj].n + ' tanlandi');
    }
  });
  $('#examChips')?.addEventListener('click', e => {
    const b = e.target.closest('[data-ex]');
    if (b) applyExam(b.dataset.ex);
  });
  $$('.role-bar button').forEach(b => {
    b.addEventListener('click', () => setRole(b.dataset.role));
  });
}

function initSettings() {
  $('#sv')?.addEventListener('click', () => {
    D.key = $('#ky')?.value.trim() || '';
    D.proxy = $('#px')?.value.trim() || '';
    D.mod = $('#md')?.value.trim() || 'openrouter/free';
    D.lang = $('#lg')?.value || 'o‘zbek';
    D.subj = $('#sj')?.value || 'umumiy';
    D.goal = Math.max(5, +($('#gl')?.value || 60));
    save();
    upd();
    applySubjectTheme();
    renderHomeChips();
    toast('Saqlandi');
  });
  $('#ex')?.addEventListener('click', () => {
    const { key, ...rest } = D;
    downloadJSON(rest, 'manba-zaxira.json');
  });
  $('#im')?.addEventListener('change', e => {
    const f = e.target.files[0];
    if (!f) return;
    const r = new FileReader();
    r.onload = () => {
      try {
        const j = JSON.parse(r.result);
        delete j.key;
        Object.assign(D, j);
        save();
        location.reload();
      } catch {
        toast('Fayl noto‘g‘ri');
      }
    };
    r.readAsText(f);
  });
  $('#dl')?.addEventListener('click', () => {
    if (confirm('Barcha ma’lumot o‘chiriladi. Davom etasizmi?')) resetAll();
  });
}

/* ---------- Bootstrap ---------- */
export function boot() {
  th(D.th);
  if (D.exam && EXAMS[D.exam]) applyExam(D.exam, true, false);
  else setP(D.pi || 0, false);

  applySubjectTheme();
  renderPlanetPicker();
  initStars();
  startPlanetSpin();

  renderHomeChips();
  renderSubjects();
  renderExams();
  upd();
  fillSet();

  initNav();
  initSources();
  initChat();
  initTests();
  initCards();
  initStudy();
  initSlides();
  initReferat();
  initSettings();

  // Role UI
  $$('.role-bar button').forEach(b => b.classList.toggle('on', b.dataset.role === D.role));
  document.body.dataset.role = D.role;

  go('home');
}

// Expose helpers for modules (avoid circular imports)
window.__manbaGo = go;
window.__manbaUpd = upd;
window.__manbaShowTab = showTab;
