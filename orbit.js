/* Manba AI orbital scene — lightweight canvas effects, no external runtime dependency. */
(() => {
  'use strict';
  const canvas = document.querySelector('[data-orbit-canvas]');
  if (!canvas) return;
  const ctx = canvas.getContext('2d', { alpha: true });
  if (!ctx) return;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  let w = 0, h = 0, dpr = 1, raf = 0, last = 0, pointerX = 0, pointerY = 0;
  let stars = [], meteors = [], satellites = [];
  const rand = (a, b) => a + Math.random() * (b - a);
  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 1.6);
    w = Math.max(1, window.innerWidth); h = Math.max(1, window.innerHeight);
    canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
    canvas.style.width = `${w}px`; canvas.style.height = `${h}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    stars = Array.from({ length: Math.min(180, Math.round(w * h / 6500)) }, () => ({ x: rand(0,w), y: rand(0,h), r: rand(.35,1.5), a: rand(.15,.8), p: rand(0,6.28), s: rand(.15,.7) }));
    meteors = Array.from({ length: 3 }, () => ({ x: rand(0,w), y: rand(0,h*.65), len: rand(35,95), speed: rand(3,7), wait: rand(0,500), a: 0 }));
    satellites = [
      { rx: Math.min(w*.32, 390), ry: Math.min(h*.17, 170), speed: .00020, phase: .5, color: '#67e8ff', size: 2.4 },
      { rx: Math.min(w*.39, 470), ry: Math.min(h*.23, 230), speed: -.00013, phase: 2.6, color: '#b9a2ff', size: 1.9 },
      { rx: Math.min(w*.24, 300), ry: Math.min(h*.29, 270), speed: .00016, phase: 4.1, color: '#ffd28a', size: 1.7 }
    ];
  }
  function drawSatellite(x, y, size, color) {
    ctx.save(); ctx.translate(x,y); ctx.rotate(-.38);
    ctx.shadowColor = color; ctx.shadowBlur = 9;
    ctx.fillStyle = '#e8f6ff'; ctx.fillRect(-size*.7,-size*.7,size*1.4,size*1.4);
    ctx.shadowBlur = 0; ctx.fillStyle = color;
    ctx.fillRect(-size*3.8,-size*.55,size*2.5,size*1.1); ctx.fillRect(size*1.3,-size*.55,size*2.5,size*1.1);
    ctx.strokeStyle = 'rgba(200,235,255,.65)'; ctx.lineWidth = .65;
    ctx.beginPath(); ctx.moveTo(0,0); ctx.lineTo(size*.1,-size*2.3); ctx.stroke(); ctx.restore();
  }
  function frame(t) {
    if (document.hidden) { raf = requestAnimationFrame(frame); return; }
    const dt = Math.min(40, t - (last || t)); last = t;
    ctx.clearRect(0,0,w,h);
    for (const s of stars) {
      const twinkle = .72 + Math.sin(t*.0006*s.s + s.p)*.28;
      ctx.globalAlpha = s.a * twinkle;
      ctx.fillStyle = '#d9edff'; ctx.beginPath(); ctx.arc(s.x + pointerX*.006*s.r, s.y + pointerY*.006*s.r, s.r, 0, Math.PI*2); ctx.fill();
    }
    ctx.globalAlpha = 1;
    const cx = w*.76, cy = h*.24;
    satellites.forEach((s, i) => {
      const angle = t*s.speed + s.phase;
      const x = cx + Math.cos(angle)*s.rx;
      const y = cy + Math.sin(angle)*s.ry;
      ctx.save(); ctx.translate(cx,cy); ctx.rotate(-.17 + i*.25); ctx.strokeStyle = s.color + '28'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.ellipse(0,0,s.rx,s.ry,0,0,Math.PI*2); ctx.stroke(); ctx.restore();
      drawSatellite(x,y,s.size,s.color);
    });
    if (!reduced.matches) {
      for (const m of meteors) {
        if (m.wait > 0) { m.wait -= dt; continue; }
        m.x += m.speed*dt*.7; m.y += m.speed*dt*.28; m.a = Math.min(1,m.a+.018);
        const grad = ctx.createLinearGradient(m.x,m.y,m.x-m.len,m.y-m.len*.38);
        grad.addColorStop(0,`rgba(185,232,255,${m.a*.75})`); grad.addColorStop(1,'rgba(185,232,255,0)');
        ctx.strokeStyle=grad;ctx.lineWidth=1.2;ctx.beginPath();ctx.moveTo(m.x,m.y);ctx.lineTo(m.x-m.len,m.y-m.len*.38);ctx.stroke();
        if (m.x>w+120 || m.y>h+120) Object.assign(m,{x:rand(-w*.2,w*.75),y:rand(-h*.3,h*.3),len:rand(35,95),speed:rand(3,7),wait:rand(500,4500),a:0});
      }
    }
    ctx.globalAlpha=1;
    raf = requestAnimationFrame(frame);
  }
  window.addEventListener('resize', resize, { passive:true });
  window.addEventListener('pointermove', e => { pointerX = (e.clientX/w-.5)*14; pointerY=(e.clientY/h-.5)*14; }, { passive:true });
  document.addEventListener('visibilitychange', () => { if (!document.hidden && !raf) raf=requestAnimationFrame(frame); });
  resize();
  if (reduced.matches) { satellites = []; }
  raf = requestAnimationFrame(frame);
})();
