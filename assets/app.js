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

    // --- Autoplay: ALWAYS ON (but pause when tab is hidden) ---
    function start(){ if (!delay || timer) return; timer = setInterval(()=>goTo(index+1), delay); }
    function stop(){ if (timer){ clearInterval(timer); timer = null; } }
    // Pause on user interaction or when tab hidden (doesn't scroll page)
    root.addEventListener('pointerenter', stop);
    root.addEventListener('pointerleave', start);
    root.addEventListener('focusin', stop);
    root.addEventListener('focusout', start);
    document.addEventListener('visibilitychange', () => { if (document.hidden) stop(); else start(); });

    // Init
    updateDots();
    goTo(0, 'auto');
    start();
  });
})();
