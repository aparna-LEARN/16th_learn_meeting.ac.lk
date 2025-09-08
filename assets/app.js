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

/* ===== Network background (anchored shimmer) ===== */
(function(){
  const canvas = document.getElementById('net-bg');
  if(!canvas) return;

  // honor reduced motion
  const prefersReduced = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
  if (prefersReduced) { canvas.remove(); return; }

  const ctx = canvas.getContext('2d');

  let W, H, nodes = [], t0 = performance.now();
  let density = 0.00012;     // nodes per pixel (tweak)
  let maxDist = 120;         // link distance in px
  let pixelRatio = Math.min(window.devicePixelRatio || 1, 2);

  function resize(){
    W = canvas.width  = Math.floor(window.innerWidth  * pixelRatio);
    H = canvas.height = Math.floor(window.innerHeight * pixelRatio);
    canvas.style.width  = window.innerWidth  + 'px';
    canvas.style.height = window.innerHeight + 'px';

    // number of nodes scales with area (cap for perf)
    const target = Math.max(50, Math.min(160, Math.floor((W*H/pixelRatio/pixelRatio) * density)));

    nodes = Array.from({length: target}, () => {
      const bx = (Math.random() * W);
      const by = (Math.random() * H);
      return {
        bx, by,                           // base (anchor)
        amp: 12 + Math.random()*20,       // movement radius
        spd: 0.4 + Math.random()*0.6,     // angular speed (rad/s)
        ph:  Math.random()*Math.PI*2,     // phase
        r:   1.6 + Math.random()*1.2,     // dot radius
        hue: Math.random() < 0.5 ? 190 : 160  // two hues: sky/mint
      };
    });
  }

  function draw(now){
    const t = (now - t0) / 1000; // seconds
    ctx.clearRect(0,0,W,H);

    // precompute positions (anchored shimmer)
    for(const n of nodes){
      n.x = n.bx + Math.cos(n.ph + t*n.spd) * n.amp;
      n.y = n.by + Math.sin(n.ph + t*n.spd) * n.amp;
    }

    // dots
    for(const n of nodes){
      ctx.beginPath();
      ctx.fillStyle = `hsla(${n.hue}, 80%, 60%, 0.85)`;
      ctx.arc(n.x, n.y, n.r*pixelRatio, 0, Math.PI*2);
      ctx.fill();
    }

    // links
    for(let i=0;i<nodes.length;i++){
      const a = nodes[i];
      for(let j=i+1;j<nodes.length;j++){
        const b = nodes[j];
        const dx = a.x-b.x, dy = a.y-b.y;
        const d  = Math.hypot(dx,dy);
        if(d < maxDist*pixelRatio){
          const alpha = 1 - (d/(maxDist*pixelRatio));
          // soft mint/sky tint
          ctx.strokeStyle = `rgba(${alpha<0.5?52:56}, ${alpha<0.5?211:189}, ${alpha<0.5?153:248}, ${alpha*0.55})`;
          ctx.lineWidth = Math.max(0.5, 1.0*pixelRatio*alpha);
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }
    }

    requestAnimationFrame(draw);
  }

  // boot
  window.addEventListener('resize', resize);
  resize();
  requestAnimationFrame(draw);
})();


