/* =========================
   Smooth scroll for anchors
   ========================= */
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

/* =========================
   Copy email helper
   ========================= */
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

/* ==========================================
   Agenda tabs + dynamic vertical timeline rail
   ========================================== */
function updateDayDate(which) {
  const el = document.getElementById('dayDate');
  if (!el) return;
  el.textContent =
    which === 'day2'
      ? 'Friday, October 24, 2025'
      : 'Thursday, October 23, 2025';
}

window.switchDay = function (which) {
  const d1 = document.getElementById('day1'),
        d2 = document.getElementById('day2');
  const t1 = document.getElementById('tabDay1'),
        t2 = document.getElementById('tabDay2');

  if (which === 'day1') {
    if (d1) d1.style.display = '';
    if (d2) d2.style.display = 'none';
    if (t1) t1.classList.add('active');
    if (t2) t2.classList.remove('active');
  } else {
    if (d1) d1.style.display = 'none';
    if (d2) d2.style.display = '';
    if (t2) t2.classList.add('active');
    if (t1) t1.classList.remove('active');
  }

  updateDayDate(which);
  if (typeof drawTimeline === 'function') setTimeout(drawTimeline, 60);
};

function drawTimeline() {
  const timeline = document.getElementById('timeline');
  if (!timeline) return;

  // clear previous dynamic nodes
  Array.from(timeline.querySelectorAll('.tl-dyn')).forEach((el) => el.remove());

  const day =
    document.getElementById('day1') &&
    document.getElementById('day1').style.display === 'none'
      ? document.getElementById('day2')
      : document.getElementById('day1');
  if (!day) return;

  const slots = Array.from(day.querySelectorAll('.slot'));
  if (!slots.length) return;

  const timelineRect = timeline.getBoundingClientRect();
  const anyTC = day.querySelector('.timecell');
  const tcRect = anyTC.getBoundingClientRect();
  const railLeft = tcRect.right - timelineRect.left + 6;

  // gradient rail
  const rail = document.createElement('div');
  rail.className = 'tl-dyn';
  Object.assign(rail.style, {
    position: 'absolute',
    left: `${railLeft - 3}px`,
    top: '0',
    bottom: '0',
    width: '6px',
    borderRadius: '6px',
    background: 'linear-gradient(180deg,#2dd4bf,#38bdf8)',
    boxShadow:
      '0 0 18px rgba(56,189,248,.45), 0 0 2px rgba(45,212,191,.6) inset',
    opacity: '.95',
    zIndex: '1',
  });
  timeline.appendChild(rail);

  const centers = slots.map((s) => {
    const r = s.querySelector('.timecell').getBoundingClientRect();
    return (r.top + r.bottom) / 2 - timelineRect.top;
  });

  centers.forEach((y, i) => {
    const node = document.createElement('div');
    node.className = 'tl-dyn';
    Object.assign(node.style, {
      position: 'absolute',
      left: `${railLeft - 9}px`,
      top: `${y - 9}px`,
      width: '18px',
      height: '18px',
      borderRadius: '999px',
      background: '#0b1220',
      border: '2px solid #7dd3fc',
      boxShadow: '0 0 0 8px rgba(125,211,252,.15)',
      zIndex: '2',
    });
    timeline.appendChild(node);

    const inner = document.createElement('div');
    inner.className = 'tl-dyn';
    Object.assign(inner.style, {
      position: 'absolute',
      left: `${railLeft - 3}px`,
      top: `${y - 3}px`,
      width: '6px',
      height: '6px',
      borderRadius: '999px',
      background: '#34d399',
      animation: 'pulseGlow 1600ms ease-out infinite',
      zIndex: '2',
    });
    timeline.appendChild(inner);

    if (i < centers.length - 1) {
      const next = centers[i + 1];
      const seg = document.createElement('div');
      seg.className = 'tl-dyn';
      Object.assign(seg.style, {
        position: 'absolute',
        left: `${railLeft - 1}px`,
        top: `${y + 9}px`,
        width: '2px',
        height: `${next - y - 18}px`,
        background:
          'linear-gradient(180deg, rgba(125,211,252,0.9), rgba(45,212,191,0.6))',
        boxShadow: '0 0 10px rgba(56,189,248,.35) inset',
        zIndex: '1',
      });
      timeline.appendChild(seg);
    }
  });

  // one-time keyframes for small pulse
  if (!document.getElementById('tl-style')) {
    const st = document.createElement('style');
    st.id = 'tl-style';
    st.textContent =
      '@keyframes pulseGlow{0%{box-shadow:0 0 0 0 rgba(52,211,153,.45);}70%{box-shadow:0 0 0 14px rgba(52,211,153,0);}100%{box-shadow:0 0 0 0 rgba(52,211,153,0);}}';
    document.head.appendChild(st);
  }
}

/* Initial state + redraw hooks */
window.addEventListener('load', () => {
  try {
    const d1 = document.getElementById('day1');
    const d2 = document.getElementById('day2');
    if (d1) d1.style.display = '';
    if (d2) d2.style.display = 'none';
    const t1 = document.getElementById('tabDay1');
    const t2 = document.getElementById('tabDay2');
    if (t1) t1.classList.add('active');
    if (t2) t2.classList.remove('active');
  } catch (_) {}
  updateDayDate('day1');
  drawTimeline();
});

window.addEventListener('resize', () => {
  clearTimeout(window.__tlr);
  window.__tlr = setTimeout(drawTimeline, 120);
});
window.addEventListener('orientationchange', () =>
  setTimeout(drawTimeline, 150)
);

/* ===========================================================
   Network background (anchored shimmer)
   =========================================================== */
(function () {
  const canvas = document.getElementById('net-bg');
  if (!canvas) return;

  // honor reduced motion
  const prefersReduced =
    window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
  if (prefersReduced) {
    canvas.remove();
    return;
  }

  const ctx = canvas.getContext('2d');

  let W, H, nodes = [], t0 = performance.now();
  const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);

  // Tweaks: denser nodes + longer links
  let density = 0.00022;
  let maxDist = 170;

  function resize() {
    W = canvas.width = Math.floor(window.innerWidth * pixelRatio);
    H = canvas.height = Math.floor(window.innerHeight * pixelRatio);
    canvas.style.width = window.innerWidth + 'px';
    canvas.style.height = window.innerHeight + 'px';

    // scale node count with area (guard rails for perf)
    const target = Math.max(
      80,
      Math.min(240, Math.floor((W * H) / (pixelRatio * pixelRatio) * density))
    );

    nodes = Array.from({ length: target }, () => {
      const bx = Math.random() * W;
      const by = Math.random() * H;
      return {
        bx,
        by,                                // base (anchor)
        amp: 16 + Math.random() * 28,      // movement radius
        spd: 0.35 + Math.random() * 0.55,  // angular speed (rad/s)
        ph: Math.random() * Math.PI * 2,   // phase
        r: 1.6 + Math.random() * 1.3,      // dot radius
        hue: Math.random() < 0.5 ? 190 : 160, // sky / mint
      };
    });
  }

  function draw(now) {
    const t = (now - t0) / 1000; // seconds
    ctx.clearRect(0, 0, W, H);

    // positions (anchored shimmer)
    for (const n of nodes) {
      n.x = n.bx + Math.cos(n.ph + t * n.spd) * n.amp;
      n.y = n.by + Math.sin(n.ph + t * n.spd) * n.amp;
    }

    // dots
    for (const n of nodes) {
      ctx.beginPath();
      ctx.fillStyle = `hsla(${n.hue}, 80%, 60%, 0.9)`;
      ctx.arc(n.x, n.y, n.r * pixelRatio, 0, Math.PI * 2);
      ctx.fill();
    }

    // links
    const linkCutoff = maxDist * pixelRatio;
    for (let i = 0; i < nodes.length; i++) {
      const a = nodes[i];
      for (let j = i + 1; j < nodes.length; j++) {
        const b = nodes[j];
        const dx = a.x - b.x, dy = a.y - b.y;
        const d = Math.hypot(dx, dy);
        if (d < linkCutoff) {
          const alpha = 1 - d / linkCutoff; // closer => stronger
          // mint/sky blend
          ctx.strokeStyle = `rgba(${alpha < 0.5 ? 52 : 56}, ${
            alpha < 0.5 ? 211 : 189
          }, ${alpha < 0.5 ? 153 : 248}, ${alpha * 0.6})`;
          ctx.lineWidth = Math.max(0.6, pixelRatio * alpha);
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
  window.addEventListener('resize', resize, { passive: true });
  window.addEventListener('orientationchange', () => setTimeout(resize, 120));
  resize();
  requestAnimationFrame(draw);
})();

/* ===========================================================
   15th AGM Carousel logic (autoplay always; no page jump)
   =========================================================== */
(function initCarousels(){
  const carousels = Array.from(document.querySelectorAll('.carousel'));
  if (!carousels.length) return;

  carousels.forEach(root => {
    const track  = root.querySelector('.track');
    const slides = track ? Array.from(track.querySelectorAll('.slide')) : [];
    if (!track || !slides.length) return;

    const btnPrev = root.querySelector('.prev');
    const btnNext = root.querySelector('.next');

    // Find or create dots wrapper (prefer sibling .dots used in HTML)
    let dotsWrap = root.parentElement && root.parentElement.querySelector(':scope > .dots');
    if (!dotsWrap) dotsWrap = root.parentElement && root.parentElement.querySelector('.dots');
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

    function updateDots(){
      dots.forEach((d,i)=> d.classList.toggle('active', i === index));
    }

    // Horizontal-only scroll (NO page scroll)
    function goTo(i, behavior = 'smooth'){
      index = (i + slides.length) % slides.length;
      const slide = slides[index];
      const targetLeft = slide.offsetLeft - (track.clientWidth - slide.clientWidth) / 2;
      const maxLeft = track.scrollWidth - track.clientWidth;
      const left = Math.max(0, Math.min(targetLeft, maxLeft));
      track.scrollTo({ left, behavior });
      updateDots();
    }

    // Controls
    btnPrev && btnPrev.addEventListener('click', () => goTo(index - 1));
    btnNext && btnNext.addEventListener('click', () => goTo(index + 1));
    dots.forEach((d,i)=> d.addEventListener('click', () => goTo(i)));

    // Keep index in sync on manual scroll inside track
    const io = new IntersectionObserver((entries)=>{
      entries.forEach(e=>{
        if (e.isIntersecting){
          const i = slides.indexOf(e.target);
          if (i !== -1){ index = i; updateDots(); }
        }
      });
    }, { root: track, threshold: 0.6 });
    slides.forEach(s => io.observe(s));

    // --- Autoplay: ALWAYS ON (pause when tab is hidden) ---
    function start(){ if (!delay || timer) return; timer = setInterval(()=>goTo(index+1), delay); }
    function stop(){ if (timer){ clearInterval(timer); timer = null; } }

    root.addEventListener('pointerenter', stop);
    root.addEventListener('pointerleave', start);
    root.addEventListener('focusin', stop);
    root.addEventListener('focusout', start);
    document.addEventListener('visibilitychange', () => { if (document.hidden) stop(); else start(); });

    // Init
    updateDots();
    goTo(0, 'auto'); // snap to first without animation
    start();
  });
})();

/* ===========================================================
   Working-Groups ribbon scroller (slow, seamless)
   =========================================================== */
(function initRibbon(){
  const track = document.querySelector('.wg-ribbon-track');
  if (!track) return;

  // Respect reduced motion
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  let totalWidth = 0;
  let halfWidth = 0;

  function measure(){
    totalWidth = Array.from(track.children)
      .reduce((sum, el) => sum + el.getBoundingClientRect().width, 0);
    halfWidth = totalWidth / 2;
  }

  // Re-measure after images load and on resize
  const imgs = Array.from(track.querySelectorAll('img'));
  let loaded = 0;
  function maybeMeasure(){ loaded++; if (loaded >= imgs.length) measure(); }
  imgs.forEach(img => {
    if (img.complete) maybeMeasure();
    else img.addEventListener('load', maybeMeasure, { once:true });
  });
  window.addEventListener('resize', () => { measure(); });
  window.addEventListener('orientationchange', () => setTimeout(measure, 120));
  // Fallback measure after load in case some images were cached
  window.addEventListener('load', () => { if (!halfWidth) measure(); });

  let x = 0;
  const SPEED = 12; // px/sec — tweak for slower/faster
  let last = performance.now();

  function step(now){
    const dt = (now - last) / 1000; last = now;
    x -= SPEED * dt;

    if (halfWidth > 0 && -x >= halfWidth){
      x += halfWidth; // seamless wrap
    }

    track.style.transform = `translate3d(${x}px,0,0)`;
    requestAnimationFrame(step);
  }

  requestAnimationFrame(step);
})();

/* =========================
   Simple lightbox for .gallery images
   ========================= */
(function initLightbox(){
  const dlg = document.getElementById('lb');
  if (!dlg) return;
  const big = dlg.querySelector('img');
  const closer = document.getElementById('lbClose');

  document.addEventListener('click', (e)=>{
    const t = e.target.closest('.gallery img');
    if (!t) return;
    const src = t.getAttribute('data-full') || t.src;
    big.src = src;
    dlg.showModal();
  });
  closer?.addEventListener('click', ()=> dlg.close());
  dlg.addEventListener('click', (e)=>{ if (e.target === dlg) dlg.close(); });
})();



/* ===== Sponsorship tabs: switch panels + animate ===== */
(function initSponsorshipTabs(){
  const root = document.getElementById('sponsorship');
  if (!root) return;

  const tabs = Array.from(root.querySelectorAll('.s-tab'));
  const panels = {
    platinum: root.querySelector('#tier-platinum'),
    gold:     root.querySelector('#tier-gold'),
    silver:   root.querySelector('#tier-silver'),
    bronze:   root.querySelector('#tier-bronze'),
  };

  function show(tier){
    tabs.forEach(t=>{
      const on = t.dataset.tier === tier;
      t.classList.toggle('active', on);
      t.setAttribute('aria-selected', on ? 'true' : 'false');
    });

    Object.entries(panels).forEach(([k,el])=>{
      if (!el) return;
      const on = (k === tier);
      if (on){
        el.hidden = false;
        el.classList.remove('show');
        void el.offsetWidth;            // restart CSS animation
        el.classList.add('show');
      } else {
        el.hidden = true;
        el.classList.remove('show');
      }
    });
  }

  tabs.forEach(t=> t.addEventListener('click', ()=> show(t.dataset.tier)));

  // Keyboard navigation: ← →
  root.addEventListener('keydown', (e)=>{
    const i = tabs.findIndex(t=> t.classList.contains('active'));
    if (e.key === 'ArrowRight'){ e.preventDefault(); tabs[(i+1)%tabs.length].click(); }
    if (e.key === 'ArrowLeft'){  e.preventDefault(); tabs[(i-1+tabs.length)%tabs.length].click(); }
  });

  show('platinum'); // default
})();


/* =========================
   Finish index Page
   ========================= */

/* ===== Trim agenda height to last event (per day) =====
   containerSel:  CSS selector for the day wrapper (e.g. '#day2')
   pad:           extra minutes to keep after the last event (optional)
*/
function trimAgendaDay(containerSel, pad = 0){
  const day = document.querySelector(containerSel);
  if (!day) return;
  const grid = day.querySelector('.schedule-grid');
  if (!grid) return;

  // Find the last event's end time (in minutes)
  let maxEnd = 0;
  grid.querySelectorAll('.event').forEach(ev => {
    const start = parseFloat(ev.style.getPropertyValue('--start')) || 0;
    const dur   = parseFloat(ev.style.getPropertyValue('--dur'))   || 0;
    maxEnd = Math.max(maxEnd, start + dur);
  });
  if (!maxEnd) return;

  // Optional small padding after the last event
  maxEnd += pad;

  // Apply end bound to the grid and hide hour labels beyond it
  grid.style.setProperty('--day-end', maxEnd);

  grid.querySelectorAll('.time').forEach(t => {
    const at = parseFloat(t.style.getPropertyValue('--at')) || 0;
    if (at > maxEnd) t.style.display = 'none';
  });
}

// Run once when the page loads (you can also run after switching tabs)
window.addEventListener('load', () => {
  // Trim Day 2; add 0–30 min padding if you like: trimAgendaDay('#day2', 30)
  trimAgendaDay('#day2', 0);
});

