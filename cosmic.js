/* MANBA animated deep-space layer. Keeps the existing app.js behavior untouched. */
(()=>{
 const canvas=document.getElementById('bg'); if(!canvas) return;
 const ctx=canvas.getContext('2d',{alpha:true}); if(!ctx) return;
 let w=0,h=0,dpr=1,stars=[],raf=0,last=0;
 const reduce=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;
 function resize(){dpr=Math.min(window.devicePixelRatio||1,1.65);w=innerWidth;h=innerHeight;canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);canvas.style.width=w+'px';canvas.style.height=h+'px';ctx.setTransform(dpr,0,0,dpr,0,0);const count=Math.min(190,Math.max(65,Math.floor(w*h/7500)));stars=Array.from({length:count},()=>({x:Math.random()*w,y:Math.random()*h,r:Math.random()*1.25+.18,a:Math.random()*.6+.15,v:(Math.random()*.16+.025)*(Math.random()<.5?-1:1),phase:Math.random()*6.28,blue:Math.random()>.7}));}
 function draw(t){if(document.hidden){raf=0;return}const dt=Math.min(34,t-(last||t));last=t;ctx.clearRect(0,0,w,h);for(const s of stars){if(!reduce){s.y+=s.v*dt*.035;s.phase+=dt*.0012;if(s.y< -3)s.y=h+3;if(s.y>h+3)s.y=-3;}const tw=reduce?1:(.72+Math.sin(s.phase)*.28);ctx.globalAlpha=s.a*tw;ctx.fillStyle=s.blue?'#a9d9ff':'#f2f7ff';ctx.beginPath();ctx.arc(s.x,s.y,s.r,0,Math.PI*2);ctx.fill();if(s.r>1.05){ctx.globalAlpha*=.3;ctx.fillRect(s.x-3,s.y-.35,6,.7);}}ctx.globalAlpha=1;raf=requestAnimationFrame(draw)}
 resize();addEventListener('resize',resize,{passive:true});document.addEventListener('visibilitychange',()=>{if(document.hidden){if(raf)cancelAnimationFrame(raf);raf=0}else if(!raf)raf=requestAnimationFrame(draw)});raf=requestAnimationFrame(draw);
})();
