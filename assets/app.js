/* ================== BOOT LOADER + BOOT NETWORK LINES ================== */
(function(){
  const boot = document.getElementById('boot');
  if (!boot) return;

  // Skip if user prefers reduced motion
  if (window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches) {
    boot.remove(); return;
  }

  const pctEl = document.getElementById('boot-pct');
  const barEl = document.getElementById('boot-bar');
  const statusEl = document.getElementById('boot-status');

  let prog = 0, done = false, si = 0;
  const statuses = [
    "Initializing LEARN Meeting…",
    "Loading assets…",
    "Warming up modules…",
    "Connecting services…",
    "Almost ready…"
  ];

  function render(p){
    const v = Math.max(0, Math.min(100, p|0));
    pctEl.textContent = v;
    barEl.style.width = v + '%';
    boot.style.setProperty('--pct', v); // drive conic gauge
  }

  function tick(){
    if (done) return;
    const target = 92;
    prog += (target - prog) * 0.06 + 0.18;
    if (prog > target) prog = target;
    if (Math.random() < .05 && si < statuses.length-1) {
      statusEl.textContent = statuses[++si];
    }
    render(prog);
    requestAnimationFrame(tick);
  }

  function finish(){
    if (done) return;
    done = true;
    let v = prog|0;
    const iv = setInterval(()=>{
      v += 1;
      render(v);
      if (v >= 100){
        clearInterval(iv);
        boot.classList.add('fade-out');
        setTimeout(()=>boot.remove(), 650);
      }
    }, 22);
  }

  window.addEventListener('load', finish);
  setTimeout(finish, 9000);  // safety cap
  tick();

  // Boot-only network lines
  const canvas = document.getElementById('boot-net');
  const ctx = canvas.getContext('2d');
  let w, h, dpr, nodes = [];

  function resize(){
    dpr = Math.max(1, window.devicePixelRatio || 1);
    w = canvas.clientWidth = canvas.parentElement.clientWidth;
    h = canvas.clientHeight = canvas.parentElement.clientHeight;
    canvas.width = w * dpr; canvas.height = h * dpr;
    ctx.setTransform(dpr,0,0,dpr,0,0);
    const count = Math.floor((w*h) / 22000);
    nodes = Array.from({length: count}, ()=>({
      x: Math.random()*w, y: Math.random()*h,
      vx: (Math.random()-.5)*0.16, vy: (Math.random()-.5)*0.16,
      r: 1 + Math.random()*1.8
    }));
  }
  window.addEventListener('resize', resize, {passive:true});

  function step(){
    ctx.clearRect(0,0,w,h);

    // subtle rose grid (not blue)
    ctx.globalAlpha = 0.06;
    ctx.strokeStyle = 'rgba(255, 220, 230, 0.35)';
    const grid = 42;
    ctx.beginPath();
    for(let x=0;x<w;x+=grid){ ctx.moveTo(x,0); ctx.lineTo(x,h); }
    for(let y=0;y<h;y+=grid){ ctx.moveTo(0,y); ctx.lineTo(w,y); }
    ctx.stroke();

    const maxDist = 120;
    for (let i=0;i<nodes.length;i++){
      const a = nodes[i];
      a.x += a.vx; a.y += a.vy;
      if (a.x< -20) a.x=w+20; if (a.x>w+20) a.x=-20;
      if (a.y< -20) a.y=h+20; if (a.y>h+20) a.y=-20;

      // dots (brand/mint)
      ctx.globalAlpha = 0.9;
      ctx.fillStyle = (i % 3 === 0) ? 'rgba(54,224,194,.9)' : 'rgba(161,15,47,.85)';
      ctx.beginPath(); ctx.arc(a.x, a.y, a.r, 0, Math.PI*2); ctx.fill();

      // links
      for (let j=i+1;j<nodes.length;j++){
        const b = nodes[j];
        const dx = a.x - b.x, dy = a.y - b.y;
        const dist = Math.hypot(dx, dy);
        if (dist < maxDist){
          const alpha = 1 - (dist / maxDist);
          ctx.globalAlpha = alpha * 0.55;
          const g = ctx.createLinearGradient(a.x,a.y,b.x,b.y);
          g.addColorStop(0, '#a10f2f'); // brand
          g.addColorStop(1, '#36e0c2'); // mint
          ctx.strokeStyle = g; ctx.lineWidth = 1;
          ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
        }
      }
    }
    requestAnimationFrame(step);
  }

  resize();
  step();
})();

/* ================== UTILITIES ================== */
document.addEventListener('click', (e) => {
  const a = e.target.closest('a[href^="#"]');
  if (!a) return;
  const id = a.getAttribute('href').slice(1);
  const el = document.getElementById(id);
  if (el) {
    e.preventDefault();
    el.scrollIntoView({ behavior: 'smooth' });
  }
});

window.copyEmail = function (id = 'emailLink') {
  const text = document.getElementById(id)?.textContent?.trim();
  if (!text) return;
  navigator.clipboard.writeText(text).then(() => {
    const toast = document.getElementById('toast');
    if (!toast) return;
    toast.textContent = 'Copied: ' + text;
    toast.style.opacity = '1';
    toast.style.transform = 'translateX(-50%) translateY(0)';
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(-50%) translateY(20px)';
    }, 1400);
  });
};

/* ================== CAROUSELS ================== */
(function initCarousels(){
  const carousels = Array.from(document.querySelectorAll('.carousel'));
  if (!carousels.length) return;

  carousels.forEach(root => {
    const track  = root.querySelector('.track');
    const slides = track ? Array.from(track.querySelectorAll('.slide')) : [];
    if (!track || !slides.length) return;

    const btnPrev = root.querySelector('.prev');
    const btnNext = root.querySelector('.next');

    let dotsWrap = root.parentElement && root.parentElement.querySelector(':scope > .dots');
    if (!dotsWrap) {
      dotsWrap = document.createElement('div');
      dotsWrap.className = 'dots';
      root.insertAdjacentElement('afterend', dotsWrap);
    }
    slides.forEach((_, i) => {
      const b = document.createElement('button');
      b.className = 'dot';
      b.setAttribute('aria-label', 'Go to slide ' + (i+1));
      dotsWrap.appendChild(b);
    });
    const dots = Array.from(dotsWrap.children);

    let index = 0;
    let timer = null;
    const delay = parseInt(root.dataset.autoplay || '0', 10);

    function updateDots(){ dots.forEach((d,i)=> d.classList.toggle('active', i === index)); }

    function goTo(i, behavior = 'smooth'){
      index = (i + slides.length) % slides.length;
      const slide = slides[index];
      const targetLeft = slide.offsetLeft - (track.clientWidth - slide.clientWidth) / 2;
      const maxLeft = track.scrollWidth - track.clientWidth;
      const left = Math.max(0, Math.min(targetLeft, maxLeft));
      track.scrollTo({ left, behavior });
      updateDots();
    }

    btnPrev && btnPrev.addEventListener('click', () => goTo(index - 1));
    btnNext && btnNext.addEventListener('click', () => goTo(index + 1));
    dots.forEach((d,i)=> d.addEventListener('click', () => goTo(i)));

    const io = new IntersectionObserver((entries)=>{
      entries.forEach(e=>{
        if (e.isIntersecting){
          const i = slides.indexOf(e.target);
          if (i !== -1){ index = i; updateDots(); }
        }
      });
    }, { root: track, threshold: 0.6 });
    slides.forEach(s => io.observe(s));

    function start(){ if (!delay || timer) return; timer = setInterval(()=>goTo(index+1), delay); }
    function stop(){ if (timer){ clearInterval(timer); timer = null; } }

    root.addEventListener('pointerenter', stop);
    root.addEventListener('pointerleave', start);
    root.addEventListener('focusin', stop);
    root.addEventListener('focusout', start);
    document.addEventListener('visibilitychange', () => { if (document.hidden) stop(); else start(); });

    updateDots();
    goTo(0, 'auto');
    start();
  });
})();

/* ================== WG RIBBON (slow, seamless) ================== */
(function initRibbon(){
  const track = document.querySelector('.wg-ribbon-track');
  if (!track) return;

  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  let totalWidth = 0, halfWidth = 0;
  function measure(){
    totalWidth = Array.from(track.children).reduce((sum, el) => sum + el.getBoundingClientRect().width, 0);
    halfWidth = totalWidth / 2;
  }

  const imgs = Array.from(track.querySelectorAll('img'));
  let loaded = 0;
  function maybeMeasure(){ loaded++; if (loaded >= imgs.length) measure(); }
  imgs.forEach(img => { if (img.complete) maybeMeasure(); else img.addEventListener('load', maybeMeasure, { once:true }); });
  window.addEventListener('resize', measure);
  window.addEventListener('orientationchange', () => setTimeout(measure, 120));
  window.addEventListener('load', () => { if (!halfWidth) measure(); });

  let x = 0;
  const SPEED = 12; // px/sec
  let last = performance.now();

  function step(now){
    const dt = (now - last) / 1000; last = now;
    x -= SPEED * dt;
    if (halfWidth > 0 && -x >= halfWidth){ x += halfWidth; }
    track.style.transform = `translate3d(${x}px,0,0)`;
    requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
})();

/* ================== PAGE NETWORK BACKGROUND (anchored shimmer) ================== */
(function () {
  const canvas = document.getElementById('net-bg');
  if (!canvas) return;

  if (window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches) {
    canvas.remove();
    return;
  }

  const ctx = canvas.getContext('2d');
  let W, H, nodes = [], t0 = performance.now();
  const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);

  let density = 0.00022;
  let maxDist = 170;

  function resize() {
    W = canvas.width = Math.floor(window.innerWidth * pixelRatio);
    H = canvas.height = Math.floor(window.innerHeight * pixelRatio);
    canvas.style.width = window.innerWidth + 'px';
    canvas.style.height = window.innerHeight + 'px';

    const target = Math.max(80, Math.min(240, Math.floor((W * H) / (pixelRatio * pixelRatio) * density)));
    nodes = Array.from({ length: target }, () => {
      const bx = Math.random() * W, by = Math.random() * H;
      return { bx, by, amp: 16 + Math.random() * 28, spd: 0.35 + Math.random() * 0.55, ph: Math.random() * Math.PI * 2, r: 1.6 + Math.random() * 1.3, hue: Math.random() < 0.5 ? 190 : 160 };
    });
  }

  function draw(now) {
    const t = (now - t0) / 1000;
    ctx.clearRect(0, 0, W, H);

    for (const n of nodes) {
      n.x = n.bx + Math.cos(n.ph + t * n.spd) * n.amp;
      n.y = n.by + Math.sin(n.ph + t * n.spd) * n.amp;
    }

    for (const n of nodes) {
      ctx.beginPath();
      ctx.fillStyle = `hsla(${n.hue}, 80%, 60%, 0.9)`;
      ctx.arc(n.x, n.y, n.r * pixelRatio, 0, Math.PI * 2);
      ctx.fill();
    }

    const linkCutoff = maxDist * pixelRatio;
    for (let i = 0; i < nodes.length; i++) {
      const a = nodes[i];
      for (let j = i + 1; j < nodes.length; j++) {
        const b = nodes[j];
        const dx = a.x - b.x, dy = a.y - b.y;
        const d = Math.hypot(dx, dy);
        if (d < linkCutoff) {
          const alpha = 1 - d / linkCutoff;
          ctx.strokeStyle = `rgba(${alpha < 0.5 ? 52 : 56}, ${alpha < 0.5 ? 211 : 189}, ${alpha < 0.5 ? 153 : 248}, ${alpha * 0.6})`;
          ctx.lineWidth = Math.max(0.6, pixelRatio * alpha);
          ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
        }
      }
    }
    requestAnimationFrame(draw);
  }

  window.addEventListener('resize', resize, { passive: true });
  window.addEventListener('orientationchange', () => setTimeout(resize, 120));
  resize();
  requestAnimationFrame(draw);
})();

