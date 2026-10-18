/* MANBA — Cinematic planets, stars & atmospheric particles */
import { $, $$ } from './utils.js';
import { D, save, PLANETS } from './data.js';

const pl = () => $('#pl');
const mn = () => $('#mn');
let pi = D.pi || 0;
let ang = 0;
const rd = matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- Planet renderer (film quality) ---------- */
function drawPlanet(c, cols, hot) {
  const s = c.canvas.width;
  const r = s / 2;
  const cx = r, cy = r;

  c.clearRect(0, 0, s, s);

  // Soft outer glow
  const glow = c.createRadialGradient(cx, cy, r * 0.7, cx, cy, r * 1.15);
  glow.addColorStop(0, 'transparent');
  glow.addColorStop(0.6, cols[1] + '22');
  glow.addColorStop(1, 'transparent');
  c.fillStyle = glow;
  c.fillRect(0, 0, s, s);

  // Main body
  const g = c.createRadialGradient(cx * 0.68, cy * 0.62, r * 0.08, cx, cy, r * 0.95);
  cols.forEach((col, i) => g.addColorStop(i / Math.max(cols.length - 1, 1), col));
  c.beginPath();
  c.arc(cx, cy, r * 0.9, 0, Math.PI * 2);
  c.fillStyle = g;
  c.fill();

  // Atmospheric rim light
  c.beginPath();
  c.arc(cx, cy, r * 0.9, 0, Math.PI * 2);
  const rim = c.createRadialGradient(cx - r * 0.3, cy - r * 0.3, r * 0.2, cx, cy, r * 0.95);
  rim.addColorStop(0, 'rgba(255,255,255,0.12)');
  rim.addColorStop(0.5, 'rgba(255,255,255,0.03)');
  rim.addColorStop(1, 'transparent');
  c.strokeStyle = 'rgba(255,255,255,0.14)';
  c.lineWidth = Math.max(2, s / 180);
  c.stroke();

  // Specular highlight
  const hl = c.createRadialGradient(cx * 0.55, cy * 0.5, 0, cx * 0.55, cy * 0.5, r * 0.45);
  hl.addColorStop(0, 'rgba(255,255,255,0.22)');
  hl.addColorStop(1, 'transparent');
  c.beginPath();
  c.arc(cx, cy, r * 0.9, 0, Math.PI * 2);
  c.fillStyle = hl;
  c.fill();

  if (hot) {
    c.globalCompositeOperation = 'screen';
    const corona = c.createRadialGradient(cx, cy, r * 0.25, cx, cy, r * 1.05);
    corona.addColorStop(0, 'rgba(255,220,80,0.55)');
    corona.addColorStop(0.4, 'rgba(255,160,40,0.25)');
    corona.addColorStop(1, 'transparent');
    c.fillStyle = corona;
    c.fill();
    c.globalCompositeOperation = 'source-over';
  }
}

function drawMoon() {
  const canvas = mn();
  if (!canvas) return;
  const s = canvas.width;
  const r = s / 2;
  const mctx = canvas.getContext('2d');
  mctx.clearRect(0, 0, s, s);

  const g = mctx.createRadialGradient(r * 0.55, r * 0.5, 1, r, r, r * 0.95);
  g.addColorStop(0, '#f1f5f9');
  g.addColorStop(0.45, '#cbd5e1');
  g.addColorStop(0.8, '#64748b');
  g.addColorStop(1, '#334155');
  mctx.beginPath();
  mctx.arc(r, r, r * 0.88, 0, Math.PI * 2);
  mctx.fillStyle = g;
  mctx.fill();

  // Craters
  mctx.globalAlpha = 0.18;
  [[0.35, 0.4, 0.08], [0.6, 0.55, 0.05], [0.45, 0.7, 0.06]].forEach(([x, y, cr]) => {
    mctx.beginPath();
    mctx.arc(r * x * 2, r * y * 2, r * cr, 0, Math.PI * 2);
    mctx.fillStyle = '#1e293b';
    mctx.fill();
  });
  mctx.globalAlpha = 1;
}

export function setP(i, anim = true) {
  pi = ((i % PLANETS.length) + PLANETS.length) % PLANETS.length;
  D.pi = pi;
  save();
  const p = PLANETS[pi];
  const pn = $('#pn');
  const pt = $('#pt');
  if (pn) pn.textContent = p.n;
  if (pt) pt.textContent = p.t;
  $$('.pk').forEach((el, j) => el.classList.toggle('on', j === pi));
  const hero = document.querySelector('.hero');
  if (hero) hero.classList.toggle('e', !!p.moon);

  const canvas = pl();
  if (!canvas) return;

  const doDraw = () => {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = canvas.offsetWidth * dpr;
    canvas.height = canvas.offsetHeight * dpr;
    drawPlanet(canvas.getContext('2d'), p.c, p.hot);
    if (p.moon) {
      const mc = mn();
      if (mc) {
        mc.width = 140 * dpr;
        mc.height = 140 * dpr;
        drawMoon();
      }
    }
  };

  if (anim) {
    const pw = document.querySelector('.pw');
    if (pw) {
      pw.classList.add('sw');
      setTimeout(() => {
        doDraw();
        pw.classList.remove('sw');
      }, 320);
    } else doDraw();
  } else doDraw();
}

export function renderPlanetPicker() {
  const box = $('#pks');
  if (!box) return;
  box.innerHTML = PLANETS.map((p, i) =>
    `<button class="pk${i === pi ? ' on' : ''}" data-i="${i}" type="button">
      <i style="background:radial-gradient(circle at 32% 28%,${p.c[0]},${p.c[Math.min(2, p.c.length - 1)]})"></i>
      ${p.n.split(' ')[0]}
    </button>`
  ).join('');
  box.onclick = e => {
    const b = e.target.closest('.pk');
    if (b) setP(+b.dataset.i);
  };
  const nx = $('#nx');
  if (nx) nx.onclick = () => setP(pi + 1);
  setP(pi, false);
}

export function startPlanetSpin() {
  if (rd) return;
  const loop = () => {
    ang += 0.0015;
    const c = pl();
    if (c) c.style.transform = `rotate(${ang}deg)`;
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
}

/* ---------- Cinematic starfield + ambient particles ---------- */
const SUBJECT_PARTICLE = {
  umumiy: { r: 56, g: 189, b: 248 },
  matem:  { r: 96, g: 165, b: 250 },
  ingliz: { r: 52, g: 211, b: 153 },
  tarix:  { r: 245, g: 158, b: 11 },
  huquq:  { r: 212, g: 160, b: 23 },
  kod:    { r: 192, g: 132, b: 252 }
};

export function initStars() {
  const st = $('#st');
  if (!st) return;
  const sctx = st.getContext('2d');
  let stars = [];
  let particles = [];
  let shooting = [];
  let w = 0, h = 0;

  function color() {
    return SUBJECT_PARTICLE[D.subj] || SUBJECT_PARTICLE.umumiy;
  }

  function resize() {
    w = st.width = innerWidth;
    h = st.height = innerHeight;
    const count = Math.min(220, Math.floor((w * h) / 7000));
    stars = Array.from({ length: count }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      r: Math.random() * 1.6 + 0.15,
      a: Math.random(),
      s: Math.random() * 0.01 + 0.002,
      tw: Math.random() * Math.PI * 2
    }));
    particles = Array.from({ length: 28 }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      r: Math.random() * 2.2 + 0.8,
      vx: (Math.random() - 0.5) * 0.15,
      vy: (Math.random() - 0.5) * 0.12,
      a: Math.random() * 0.4 + 0.1
    }));
  }

  function spawnShooting() {
    if (Math.random() > 0.008 || shooting.length > 2) return;
    shooting.push({
      x: Math.random() * w * 0.7,
      y: Math.random() * h * 0.4,
      len: Math.random() * 80 + 40,
      speed: Math.random() * 6 + 4,
      life: 1,
      angle: Math.PI / 4 + (Math.random() - 0.5) * 0.3
    });
  }

  function draw() {
    sctx.clearRect(0, 0, w, h);
    const col = color();

    // Stars
    stars.forEach(s => {
      s.tw += s.s;
      const alpha = 0.15 + (Math.sin(s.tw) * 0.5 + 0.5) * 0.65;
      sctx.beginPath();
      sctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      sctx.fillStyle = `rgba(255,255,255,${alpha})`;
      sctx.fill();
    });

    // Subject-colored ambient particles
    particles.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;
      if (p.x < 0) p.x = w;
      if (p.x > w) p.x = 0;
      if (p.y < 0) p.y = h;
      if (p.y > h) p.y = 0;
      const grd = sctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 4);
      grd.addColorStop(0, `rgba(${col.r},${col.g},${col.b},${p.a})`);
      grd.addColorStop(1, 'transparent');
      sctx.fillStyle = grd;
      sctx.beginPath();
      sctx.arc(p.x, p.y, p.r * 4, 0, Math.PI * 2);
      sctx.fill();
    });

    // Shooting stars
    spawnShooting();
    shooting = shooting.filter(sh => {
      sh.x += Math.cos(sh.angle) * sh.speed;
      sh.y += Math.sin(sh.angle) * sh.speed;
      sh.life -= 0.018;
      if (sh.life <= 0) return false;
      sctx.beginPath();
      sctx.moveTo(sh.x, sh.y);
      sctx.lineTo(
        sh.x - Math.cos(sh.angle) * sh.len * sh.life,
        sh.y - Math.sin(sh.angle) * sh.len * sh.life
      );
      sctx.strokeStyle = `rgba(255,255,255,${sh.life * 0.85})`;
      sctx.lineWidth = 1.5;
      sctx.lineCap = 'round';
      sctx.stroke();
      return true;
    });

    requestAnimationFrame(draw);
  }

  addEventListener('resize', resize);
  resize();
  if (!rd) draw();
  else {
    // Static stars for reduced motion
    stars.forEach(s => {
      sctx.beginPath();
      sctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      sctx.fillStyle = `rgba(255,255,255,${0.3 + s.a * 0.5})`;
      sctx.fill();
    });
  }
}
