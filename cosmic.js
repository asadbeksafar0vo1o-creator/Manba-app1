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

  // 150 ta harakatlanuvchi va miltillovchi yulduzlar
  const stars = Array.from({ length: 150 }, () => ({
    x: Math.random() * w,
    y: Math.random() * h,
    size: Math.random() * 1.8,
    alpha: Math.random(),
    speed: Math.random() * 0.008 + 0.003
  }));

  function render() {
    ctx.clearRect(0, 0, w, h);
    
    // Miltillovchi yulduzlarni chizish
    stars.forEach(s => {
      s.alpha += s.speed;
      if(s.alpha > 1 || s.alpha < 0) s.speed = -s.speed;
      ctx.fillStyle = rgba(220, 235, 255, ${Math.abs(s.alpha)});
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
      ctx.fill();
    });

    requestAnimationFrame(render);
  }
  render();
});
