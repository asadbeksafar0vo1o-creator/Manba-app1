/* MANBA — Data & Persistence */
import { toast } from './utils.js';

export const SUBJ = {
  umumiy: {
    n: 'Umumiy', h: 'umumiy bilim',
    ai: 'Sen umumiy o‘quv yordamchisisan. Tushunarli va qiziqarli javob ber.',
    symbol: '🌌', dir1: 'rgba(56,189,248,.16)'
  },
  matem: {
    n: 'Matematika', h: 'matematik tushunchalar',
    ai: 'Sen matematik o‘qituvchisan. Aniq, qadam-baqadam va misollar bilan tushuntir.',
    symbol: '∫', dir1: 'rgba(59,130,246,.18)'
  },
  ingliz: {
    n: 'Ingliz tili', h: 'ingliz tili',
    ai: 'You are an English teacher. Explain clearly, give examples and short exercises.',
    symbol: 'A', dir1: 'rgba(16,185,129,.16)'
  },
  tarix: {
    n: 'Tarix', h: 'tarixiy voqealar',
    ai: 'Sen tarix o‘qituvchisisan. Chronologik tartibda, faktlarga asoslanib tushuntir.',
    symbol: '⏳', dir1: 'rgba(180,83,9,.16)'
  },
  huquq: {
    n: 'Huquq', h: 'huquqiy tushunchalar',
    ai: 'Sen huquq o‘qituvchisisan. Aniq, qonuniy atamalar bilan tushuntir.',
    symbol: '⚖', dir1: 'rgba(186,148,72,.16)'
  },
  kod: {
    n: 'Dasturlash', h: 'dasturlash',
    ai: 'Sen dasturlash o‘qituvchisisan. Kod misollari va amaliy tushuntirish ber.',
    symbol: '</>', dir1: 'rgba(168,85,247,.16)'
  }
};

export const EXAMS = {
  dtm:   { n: 'DTM / Milliy sertifikat', desc: 'Umumiy bilim testi tayyorgarligi', symbol: '📋' },
  ielts: { n: 'IELTS', desc: 'Ingliz tili imtihoni', symbol: '🗣️' },
  sat:   { n: 'SAT', desc: 'Matematika va o‘qish', symbol: '📐' },
  olimp: { n: 'Olimpiada', desc: 'Chuqr bilim va masalalar', symbol: '🏆' }
};

export const PLANETS = [
  { n: 'Yer va Oy', t: 'Bizning sayyoramiz va tabiiy yo‘ldoshimiz. Ular birgalikda ajoyib kosmik uyg‘unlikni yaratadi.', c: ['#1e3a5f', '#2d6a4f', '#40916c', '#52b788'], moon: true },
  { n: 'Yupiter',  t: 'Quyosh tizimidagi ulkan gaz giganti. Uning bo‘ronlari asrlar davomida davom etadi.', c: ['#9c6644', '#c38e70', '#e6b89c', '#f5d5c8'] },
  { n: 'Quyosh',   t: 'Hayot manbai, ulkan energiya manbai. Uning nuri butun koinotni yoritadi.', c: ['#ff9f1c', '#ffbf69', '#ffd6a5', '#fff1e6'], hot: true },
  { n: 'Mars',     t: 'Qizil sayyora. Kelajakdagi insoniyat koloniyalari uchun eng yaqin nomzod.', c: ['#9b2226', '#ae2012', '#bb3e03', '#ca6702'] },
  { n: 'Saturn',   t: 'Halqalari bilan mashhur gaz giganti. Kosmosning eng chiroyli bezagi.', c: ['#e9c46a', '#f4a261', '#e76f51', '#2a9d8f'] },
  { n: 'Neptun',   t: 'Eng uzoq gaz giganti. Kuchli shamollar va chuqur ko‘k atmosfera.', c: ['#023e8a', '#0077b6', '#00b4d8', '#90e0ef'] }
];

const KEY = 'manba4';

const defaultState = () => ({
  key: '', proxy: '', mod: 'openrouter/free',
  lang: 'o‘zbek', subj: 'umumiy', goal: 60,
  role: 'student', // student | teacher
  src: [], chat: [], cards: [], mistakes: [], tests: [],
  slides: [], referats: [],
  min: 0, mlog: {}, th: 'dark', exam: null, pi: 0
});

export let D = (() => {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return { ...defaultState(), ...JSON.parse(raw) };
  } catch {}
  return defaultState();
})();

export function save() {
  try {
    localStorage.setItem(KEY, JSON.stringify(D));
  } catch (e) {
    toast('Saqlash xatosi: xotira to‘ldi');
  }
}

export function resetAll() {
  localStorage.removeItem(KEY);
  location.reload();
}
