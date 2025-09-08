/* =========================
   Smooth scroll for anchors
   ========================= */
document.addEventListener('click', (e)=>{
  const a = e.target.closest('a[href^="#"]');
  if(!a) return;
  const id = a.getAttribute('href').slice(1);
  const el = document.getElementById(id);
  if(el){ e.preventDefault(); el.scrollIntoView({behavior:'smooth'}); }
});

/* =========================
   Copy email helper
   ========================= */
window.copyEmail = function(id='emailLink'){
  const text = document.getElementById(id)?.textContent?.trim();
  if(!text) return;
  navigator.clipboard.writeText(text).then(()=>{
    const toast = document.getElementById('toast');
    if(!toast) return;
    toast.textContent = 'Copied: ' + text;
    toast.style.opacity = '1';
    toast.style.transform = 'translateX(-50%) translateY(0)';
    setTimeout(()=>{ toast.style.opacity='0'; toast.style.transform='translateX(-50%) translateY(20px)'; }, 1400);
  });
};

/* ==========================================
   Agenda tabs + dynamic vertical timeline rail
   ========================================== */
function updateDayDate(which){
  const el = document.getElementById('dayDate');
  if(!el) return;
  el.textContent = (which === 'day2') ? 'Friday, October 24, 2025' : 'Thursday, October 23, 2025';
}
window.switchDay = function(which){
  const d1 = document.getElementById('day1'), d2 = document.getElementById('day2');
  const t1 = document.getElementById('tabDay1'), t2 = document.getElementById('tabDay2');
  if(which==='day1'){ d1.style.display=''; d2.style.display='none'; t1.classList.add('active'); t2.classList.remove('active'); }
  else { d1.style.display='none'; d2.style.display=''; t2.classList.add('active'); t1.classList.remove('active'); }
  updateDayDate(which);
  setTimeout(drawTimeline, 60);
};

function drawTimeline(){
  const timeline = document.getElementById('timeline');
  if(!timeline) return;
  Array.from(timeline.querySelectorAll('.tl-dyn')).forEach(el=>el.remove());
  const day = (document.getElementById('day1') && document.getElementById('day1').style.display==='none') ? document.getElementById('day2') : document.getElementById('day1');
  if(!day) return;
  const slots = Array.from(day.querySelectorAll('.slot'));
  if(!slots.length) return;

  const timelineRect = timeline.getBoundingClientRect();
  const anyTC = day.querySelector('.timecell');
  const tcRect = anyTC.getBoundingClientRect();
  const railLeft = (tcRect.right - timelineRect.left) + 6;

  // gradient rail
  const rail = document.createElement('div');
  rail.className='tl-dyn';
  Object.assign(rail.style, {
    position:'absolute', left:(railLeft-3)+'px', top:'0', bottom:'0', width:'6px',
    borderRadius:'6px',
    background:'linear-gradient(180deg,#2dd4bf,#38bdf8)',
    boxShadow:'0 0 18px rgba(56,189,248,.45), 0 0 2px rgba(45,212,191,.6) inset',
    opacity:'.95', zIndex:'1'
  });
  timeline.appendChild(rail);

  const centers = slots.map(s=>{
    const r = s.querySelector('.timecell').getBoundingClientRect();
    return (r.top + r.bottom)/2 - timelineRect.top;
  });

  centers.forEach((y,i)=>{
    const node = document.createElement('div');
    node.className='tl-dyn';
    Object.assign(node.style,{
      position:'absolute', left:(railLeft-9)+'px', top:(y-9)+'px',
      width:'18px', height:'18px', borderRadius:'999px', background:'#0b1220',
      border:'2px solid #7dd3fc', boxShadow:'0 0 0 8px rgba(125,211,252,.15)', zIndex:'2'
    });
    timeline.appendChild(node);

    const inner = document.createElement('div');
    inner.className='tl-dyn';
    Object.assign(inner.style,{
      position:'absolute', left:(railLeft-3)+'px', top:(y-3)+'px',
      width:'6px', height:'6px', borderRadius:'999px', background:'#34d399',
      animation:'pulseGlow 1600ms ease-out infinite', zIndex:'2'
    });
    timeline.appendChild(inner);

    if(i<centers.length-1){
      const next = centers[i+1];
      const seg = document.createElement('div');
      seg.className='tl-dyn';
      Object.assign(seg.style,{
        position:'absolute', left:(railLeft-1)+'px', top:(y+9)+'px',
        width:'2px', height:(next - y - 18)+'px',
        background:'linear-gradient(180deg, rgba(125,211,252,0.9), rgba(45,212,191,0.6))',
        boxShadow:'0 0 10px rgba(56,189,248,.35) inset', zIndex:'1'
      });
      timeline.appendChild(seg);
    }
  });

  if(!document.getElementById('tl-style')){
    const st = document.createElement('style'); st.id='tl-style';
    st.textContent='@keyframes pulseGlow{0%{box-shadow:0 0 0 0 rgba(52,211,153,.45);}70%{box-shadow:0 0 0 14px rgba(52,211,153,0);}100%{box-shadow:0 0 0 0 rgba(52,211,153,0);}}';
    document.head.appendChild(st);
  }
}
window.addEventListener('load', ()=>{ updateDayDate('day1'); drawTimeline(); });
window.addEventListener('resize', ()=>{ clearTimeout(window.__tlr); window.__tlr=setTimeout(drawTimeline, 120); });
window.addEventListener('orientationchange', ()=> setTimeout(drawTimeline,150));

/* ===========================================================
   Optional: Network Lines Background (bluish/greenish)
   - Full-screen fixed canvas behind content
   - Looks subtle on white sections via CSS mix-blend:multiply
   - Auto-resizes and honors prefers-reduced-motion
   =========================================================== */
(function initNetworkLines(){
  const prefersReduced = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
  const canvas = document.getElementById('net-bg');
  if(!canvas || prefersReduced) return;

  const ctx = canvas.getContext('2d');
  let dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
  let W = 0, H = 0, particles = [], mouse = {x:0, y:0, active:false};
  let running = true;

  // number of particles based on viewport area
  function targetCount(){ return Math.round((W*H) / 16000); } // ~60–100 typical

  function resize(){
    W = window.innerWidth; H = window.innerHeight;
    canvas.width = Math.floor(W * dpr);
    canvas.height = Math.floor(H * dpr);
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';
    ctx.setTransform(dpr,0,0,dpr,0,0);

    // adjust particle pool
    const n = targetCount();
    if(particles.length < n){
      for(let i=particles.length;i<n;i++) particles.push(newParticle());
    }else if(particles.length > n){
      particles.length = n;
    }
  }

  function rand(min,max){ return Math.random()*(max-min)+min; }

  function newParticle(){
    // subtle velocity
    const speed = rand(0.12,0.35);
    const angle = rand(0, Math.PI*2);
    return {
      x: rand(0, W), y: rand(0, H),
      vx: Math.cos(angle)*speed, vy: Math.sin(angle)*speed,
      r: rand(1.2, 2.2)
    };
  }

  function update(){
    for(const p of particles){
      // mild parallax toward mouse
      if(mouse.active){
        const dx = (mouse.x - p.x), dy = (mouse.y - p.y);
        p.vx += dx * 0.00002;
        p.vy += dy * 0.00002;
      }
      p.x += p.vx; p.y += p.vy;

      // soft wrap edges
      if(p.x < -10) p.x = W+10;
      if(p.x > W+10) p.x = -10;
      if(p.y < -10) p.y = H+10;
      if(p.y > H+10) p.y = -10;

      // tiny friction so parallax doesn’t explode
      p.vx *= 0.995; p.vy *= 0.995;
    }
  }

  function draw(){
    ctx.clearRect(0,0,W,H);

    // connections
    const maxDist = 140;
    for(let i=0;i<particles.length;i++){
      const a = particles[i];
      for(let j=i+1;j<particles.length;j++){
        const b = particles[j];
        const dx=a.x-b.x, dy=a.y-b.y;
        const d2 = dx*dx + dy*dy;
        if(d2 < maxDist*maxDist){
          const t = 1 - (Math.sqrt(d2)/maxDist);
          ctx.globalAlpha = Math.max(0, Math.min(0.55, t*0.65));
          const g = ctx.createLinearGradient(a.x,a.y,b.x,b.y);
          g.addColorStop(0,'#2dd4bf'); // mint
          g.addColorStop(1,'#38bdf8'); // sky
          ctx.strokeStyle = g;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(a.x,a.y);
          ctx.lineTo(b.x,b.y);
          ctx.stroke();
        }
      }
    }

    // dots
    ctx.globalAlpha = 0.7;
    ctx.fillStyle = '#0a79a733'; // transparent brand-2
    for(const p of particles){
      ctx.beginPath();
      ctx.arc(p.x,p.y,p.r,0,Math.PI*2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  function loop(){
    if(!running) return;
    update(); draw();
    window.requestAnimationFrame(loop);
  }

  // input
  window.addEventListener('mousemove', e=>{
    mouse.x = e.clientX; mouse.y = e.clientY; mouse.active = true;
  }, {passive:true});
  window.addEventListener('mouseleave', ()=>{ mouse.active = false; });

  // lifecycle / performance
  document.addEventListener('visibilitychange', ()=>{
    running = (document.visibilityState === 'visible');
    if(running) loop();
  });

  window.addEventListener('resize', ()=>{
    clearTimeout(window.__net_rz);
    window.__net_rz = setTimeout(resize, 120);
  });
  window.addEventListener('orientationchange', ()=> setTimeout(resize, 150));

  // init
  resize();
  particles = Array.from({length: targetCount()}, newParticle);
  loop();
})();

