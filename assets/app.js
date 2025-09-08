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
  setTimeout(drawTimeline, 60);
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

window.addEventListener('load', () => {
  updateDayDate('day1');
  drawTimeline();
});
window.addEventListener('resize', () => {
  clearTimeout(window.__tlr);
  window.__tlr = setTimeout(drawTimeline, 120);
});
window.addEventListener('orientationchange', () => setTimeout(drawTimeline, 150));



