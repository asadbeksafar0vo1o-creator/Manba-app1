/* MANBA — Pomodoro / Study timer */
import { $, $$, toast, td, ymd } from './utils.js';
import { D, save } from './data.js';

function upd() { if (window.__manbaUpd) window.__manbaUpd(); }

let tm = 25, left = 1500, end = 0, iv = 0;

const fm = s => String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0');

function addMin(m) {
  D.min += m;
  D.mlog[td()] = (D.mlog[td()] || 0) + m;
  save();
  upd();
}

function streak() {
  let d = new Date(), s = 0;
  if (!(D.mlog[td()] > 0)) d.setDate(d.getDate() - 1);
  while (D.mlog[ymd(d)] > 0) {
    s++;
    d.setDate(d.getDate() - 1);
  }
  return s;
}

export function renderStudy() {
  const today = D.mlog[td()] || 0;
  const el = id => $(id);
  if (el('#today')) el('#today').textContent = today;
  if (el('#goal')) el('#goal').textContent = D.goal;
  if (el('#gbar')) el('#gbar').style.width = Math.min(100, (today / D.goal) * 100) + '%';
  if (el('#streak')) el('#streak').textContent = streak();
  if (el('#tdy')) el('#tdy').textContent = D.min;
}

export function initStudy() {
  $('#pre')?.addEventListener('click', e => {
    const b = e.target.closest('[data-m]');
    if (!b || iv) return;
    tm = +b.dataset.m;
    left = tm * 60;
    $$('#pre button').forEach(x => x.classList.toggle('on', x === b));
    if ($('#clk')) $('#clk').textContent = fm(left);
  });

  $('#tgo')?.addEventListener('click', () => {
    if (iv) {
      clearInterval(iv);
      iv = 0;
      left = Math.max(0, Math.round((end - Date.now()) / 1000));
      if ($('#tgo')) $('#tgo').textContent = '▶ Davom';
      return;
    }
    end = Date.now() + left * 1000;
    iv = setInterval(() => {
      const s = Math.max(0, Math.round((end - Date.now()) / 1000));
      if ($('#clk')) $('#clk').textContent = fm(s);
      if (!s) {
        clearInterval(iv);
        iv = 0;
        addMin(tm);
        left = tm * 60;
        if ($('#tgo')) $('#tgo').textContent = '▶ Boshlash';
        if (navigator.vibrate) navigator.vibrate(300);
        toast('Vaqt tugadi. +' + tm + ' daqiqa');
        renderStudy();
      }
    }, 400);
    if ($('#tgo')) $('#tgo').textContent = '⏸ Pauza';
  });

  $('#trs')?.addEventListener('click', () => {
    clearInterval(iv);
    iv = 0;
    left = tm * 60;
    if ($('#clk')) $('#clk').textContent = fm(left);
    if ($('#tgo')) $('#tgo').textContent = '▶ Boshlash';
  });
}
