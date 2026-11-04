(() => {
  'use strict';
  const canvas = document.querySelector('[data-orbit-canvas]');
  if (!canvas) return;
  const ctx = canvas.getContext('2d', { alpha: true });
  if (!ctx) return;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let width = 0, height = 0, frame = 0, last = 0;
  const stars = Array.from({ length: 95 }, (_, i) => ({
    x: (i * 127.1 % 997) / 997,
    y: (i * 311.7 % 991) / 991,
    r: .35 + (i % 4) * .28,
    phase: i * .73
  }));
  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 1.7);
    width = window.innerWidth; height = window.innerHeight;
    canvas.width = Math.round(width * dpr); canvas.height = Math.round(height * dpr);
    canvas.style.width = width + 'px'; canvas.style.height = height + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    draw(0);
  }
  function draw(time) {
    ctx.clearRect(0, 0, width, height);
    for (const s of stars) {
      const alpha = .22 + (Math.sin(time * .0007 + s.phase) + 1) * .2;
      ctx.beginPath(); ctx.arc(s.x * width, s.y * height, s.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(205,225,255,${alpha})`; ctx.fill();
    }
    if (width > 760) {
      const cx = width * .83, cy = height * .43;
      ctx.save(); ctx.translate(cx, cy); ctx.rotate(-.34);
      ctx.strokeStyle = 'rgba(120,190,220,.11)'; ctx.lineWidth = 1;
      for (const [rx, ry] of [[100, 34], [145, 49], [190, 66]]) {
        ctx.beginPath(); ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2); ctx.stroke();
      }
      ctx.restore();
    }
  }
  function animate(time) {
    if (time - last > 32) { draw(time); last = time; }
    if (!reduce) frame = requestAnimationFrame(animate);
  }
  window.addEventListener('resize', resize, { passive: true });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) cancelAnimationFrame(frame);
    else if (!reduce) frame = requestAnimationFrame(animate);
  });
  resize();
  if (!reduce) frame = requestAnimationFrame(animate);
})();
