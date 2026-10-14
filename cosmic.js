// Kosmik fon va radar effekti
window.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('bg');
  if(!canvas) return;
  const ctx = canvas.getContext('2d');
  
  let w = canvas.width = window.innerWidth;
  let h = canvas.height = window.innerHeight;

  window.addEventListener('resize', () => {
    w = canvas.width = window.innerWidth;
    h = canvas.height = window.innerHeight;
  });

  const stars = Array.from({ length: 120 }, () => ({
    x: Math.random() * w,
    y: Math.random() * h,
    size: Math.random() * 1.5,
    alpha: Math.random(),
    speed: Math.random() * 0.005 + 0.002
  }));

  function animate() {
    ctx.clearRect(0, 0, w, h);
    stars.forEach(s => {
      s.alpha += s.speed;
      if(s.alpha > 1 || s.alpha < 0) s.speed = -s.speed;
      ctx.fillStyle = rgba(255, 255, 255, ${Math.abs(s.alpha)});
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
      ctx.fill();
    });
    requestAnimationFrame(animate);
  }
  animate();
});
