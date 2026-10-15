/* MANBA V5 starfield — reduced particle count and pixel ratio on phones. */
(()=>{'use strict';
const c=document.getElementById('bg'); if(!c)return;
const x=c.getContext('2d',{alpha:true}); if(!x)return;
let w=0,h=0,d=1,stars=[],raf=0,last=0,visible=true;
const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
const mobile=matchMedia('(max-width: 720px)').matches||matchMedia('(pointer: coarse)').matches;
function resize(){
  d=Math.min(devicePixelRatio||1,mobile?1:1.25); w=innerWidth; h=innerHeight;
  c.width=Math.round(w*d); c.height=Math.round(h*d);
  c.style.width=w+'px'; c.style.height=h+'px'; x.setTransform(d,0,0,d,0,0);
  const count=mobile?Math.min(55,Math.max(28,Math.floor(w*h/22000))):Math.min(130,Math.max(55,Math.floor(w*h/13000)));
  stars=Array.from({length:count},()=>({x:Math.random()*w,y:Math.random()*h,r:Math.random()*.75+.15,a:Math.random()*.4+.12,p:Math.random()*6.28,v:(Math.random()*.09+.02)*(Math.random()<.5?-1:1),b:Math.random()>.8}));
  drawStatic(performance.now());
}
function drawStatic(t){
  x.clearRect(0,0,w,h);
  for(const s of stars){const tw=reduce?1:.8+.2*Math.sin(t*.001+s.p);x.globalAlpha=s.a*tw;x.fillStyle=s.b?'#b6d9ff':'#edf5ff';x.beginPath();x.arc(s.x,s.y,s.r,0,6.283);x.fill();}
  x.globalAlpha=1;
}
function draw(t){
  raf=0;if(document.hidden||!visible)return;
  if(mobile&&t-last<1000/24){raf=requestAnimationFrame(draw);return;}
  const dt=Math.min(40,last?t-last:16);last=t;
  if(!reduce){for(const s of stars){s.y+=s.v*dt*.06;s.x+=Math.sin(t*.00012+s.p)*.012*dt;if(s.y< -2)s.y=h+2;if(s.y>h+2)s.y=-2;}}
  drawStatic(t);if(!reduce)raf=requestAnimationFrame(draw);
}
function start(){if(!raf&&!document.hidden&&visible&&!reduce)raf=requestAnimationFrame(draw);}
addEventListener('resize',resize,{passive:true});
document.addEventListener('visibilitychange',()=>{if(document.hidden){if(raf)cancelAnimationFrame(raf);raf=0;}else start();});
if('IntersectionObserver'in window){new IntersectionObserver(e=>{visible=!!e[0]?.isIntersecting;if(!visible&&raf){cancelAnimationFrame(raf);raf=0;}else start();}).observe(c);}
resize();start();
})();
