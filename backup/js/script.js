// ===== Theme (light/dark) =====
(function() {
  const root = document.documentElement;
  const stored = localStorage.getItem('theme');
  const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  root.setAttribute('data-theme', stored || (prefersDark ? 'dark' : 'light'));

  const toggle = () => {
    const next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    root.setAttribute('data-theme', next);
    localStorage.setItem('theme', next);
  };
  document.addEventListener('click', (e) => {
    if (e.target.closest('.theme-toggle')) toggle();
  });
})();

// ===== Year in footer =====
document.getElementById('year').textContent = new Date().getFullYear();

// ===== Tiny parallax enhancer (background-position, smooth) =====
(function() {
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const elems = document.querySelectorAll('[data-parallax-speed]');
  let ticking = false;

  const update = () => {
    const y = window.scrollY || window.pageYOffset;
    elems.forEach(el => {
      const speed = parseFloat(el.dataset.parallaxSpeed || '0.2');
      const offset = Math.round(y * speed * 0.25);
      el.style.backgroundPosition = `center calc(50% + ${offset}px)`;
    });
    ticking = false;
  };

  const onScroll = () => {
    if (!ticking) {
      requestAnimationFrame(update);
      ticking = true;
    }
  };

  window.addEventListener('scroll', onScroll, { passive: true });
  update();
})();

// ===== Enhanced Carousel (pause/resume + caption + drag-to-swipe) =====
(function() {
  const carousel = document.querySelector('.carousel');
  if (!carousel) return;

  const track = carousel.querySelector('.carousel-track');
  const slides = Array.from(track.children);
  const prevBtn = carousel.querySelector('.prev');
  const nextBtn = carousel.querySelector('.next');
  const dotsWrap = carousel.querySelector('.carousel-dots');
  const progressBar = carousel.querySelector('.carousel-progress .bar');
  const captionEl = carousel.querySelector('.carousel-caption');

  let index = 0;
  const delay = 4500;      // ms per slide
  let remaining = delay;   // time left in current cycle
  let startTs = 0;         // perf timestamp when cycle started
  let timeoutId = null;    // timer to advance slides

  // Build dots
  dotsWrap.innerHTML = '';
  slides.forEach((_, i) => {
    const b = document.createElement('button');
    b.setAttribute('aria-label', `Go to slide ${i+1}`);
    b.setAttribute('role', 'tab');
    dotsWrap.appendChild(b);
  });
  const dots = Array.from(dotsWrap.children);

  const updateCaption = () => {
    if (!captionEl) return;
    const img   = slides[index].querySelector('img');
    const text  = (img?.dataset.caption || img?.alt || '').trim();
    const link  = (img?.dataset.link || '').trim();

    // Set caption text
    captionEl.textContent = text;

    // If it's an <a>, wire the href; if it's a <div>, make it clickable
    if (captionEl.tagName.toLowerCase() === 'a') {
      if (link) {
        captionEl.setAttribute('href', link);
        captionEl.removeAttribute('aria-disabled');
        captionEl.style.pointerEvents = 'auto';
      } else {
        captionEl.removeAttribute('href');
        captionEl.setAttribute('aria-disabled', 'true');
        captionEl.style.pointerEvents = 'none';
      }
    } else {
      // Fallback if you kept <div class="carousel-caption"> in HTML
      captionEl.style.cursor = link ? 'pointer' : 'default';
      captionEl.onclick = link ? () => { window.location.href = link; } : null;
    }
  };


  const setActive = (i) => {
    index = (i + slides.length) % slides.length;
    track.style.transform = `translateX(-${index * 100}%)`;
    slides.forEach((s, si) => s.classList.toggle('is-active', si === index));
    dots.forEach((d, di) => d.setAttribute('aria-selected', di === index ? 'true' : 'false'));
    updateCaption();
  };

  const clearTimer = () => { if (timeoutId) { clearTimeout(timeoutId); timeoutId = null; } };

  const play = () => {
    startTs = performance.now();
    if (progressBar) {
      progressBar.style.transition = `width ${remaining}ms linear`;
      progressBar.style.width = '100%';
    }
    clearTimer();
    timeoutId = setTimeout(() => { goTo(index + 1); restartCycle(); }, remaining);
  };

  const pause = () => {
    if (!timeoutId) return;
    const elapsed = performance.now() - startTs;
    remaining = Math.max(0, remaining - elapsed);
    clearTimer();
    if (progressBar) {
      const cs = getComputedStyle(progressBar);
      const px = parseFloat(cs.width);
      const parentW = progressBar.parentElement.getBoundingClientRect().width || 1;
      const pct = (px / parentW) * 100;
      progressBar.style.transition = 'none';
      progressBar.style.width = pct + '%';
    }
  };

  const restartCycle = () => {
    remaining = delay;
    if (progressBar) {
      progressBar.style.transition = 'none';
      progressBar.style.width = '0%';
      requestAnimationFrame(() => requestAnimationFrame(play));
    } else {
      play();
    }
  };

  const goTo = (i) => { setActive(i); restartCycle(); };
  const next = () => goTo(index + 1);
  const prev = () => goTo(index - 1);

  // Buttons / dots / keyboard
  nextBtn.addEventListener('click', next);
  prevBtn.addEventListener('click', prev);
  dots.forEach((d, di) => d.addEventListener('click', () => goTo(di)));
  carousel.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') next();
    if (e.key === 'ArrowLeft')  prev();
  });

  // Pause/resume on hover
  carousel.addEventListener('mouseenter', pause);
  carousel.addEventListener('mouseleave', play);

  // --- Drag-to-swipe (Pointer Events: works for mouse + touch) ---
  let isDragging = false;
  let startX = 0;
  let deltaX = 0;
  let width = 0;

  // Prevent native image dragging ghost
  carousel.addEventListener('dragstart', e => e.preventDefault());

  const onPointerDown = (e) => {
    // ignore clicks on UI controls
    if (e.target.closest('.carousel-btn') || e.target.closest('.carousel-dots')) return;
    if (e.button !== undefined && e.button !== 0) return; // only left mouse button
    isDragging = true;
    carousel.classList.add('is-dragging');
    width = carousel.getBoundingClientRect().width || 1;
    startX = e.clientX;
    deltaX = 0;
    pause();
    track.style.transition = 'none';
    if (track.setPointerCapture && e.pointerId !== undefined) {
      track.setPointerCapture(e.pointerId);
    }
  };

  const onPointerMove = (e) => {
    if (!isDragging) return;
    deltaX = (e.clientX - startX) || 0;
    const percent = (-index * 100) + (deltaX / width * 100);
    track.style.transform = `translateX(${percent}%)`;
  };

  const onPointerUpCancel = (e) => {
    if (!isDragging) return;
    isDragging = false;
    carousel.classList.remove('is-dragging');
    track.style.transition = ''; // back to CSS (transform .5s ease)
    const threshold = Math.max(60, width * 0.15); // px or 15% of width
    if (Math.abs(deltaX) > threshold) {
      deltaX < 0 ? next() : prev();
    } else {
      // snap back and continue remaining time
      setActive(index);
      play();
    }
    if (track.releasePointerCapture && e.pointerId !== undefined) {
      try { track.releasePointerCapture(e.pointerId); } catch {}
    }
  };

  if (window.PointerEvent) {
    track.addEventListener('pointerdown', onPointerDown);
    track.addEventListener('pointermove', onPointerMove);
    track.addEventListener('pointerup', onPointerUpCancel);
    track.addEventListener('pointercancel', onPointerUpCancel);
  } else {
    // Fallback for very old browsers
    track.addEventListener('mousedown', (e) => { onPointerDown(e); window.addEventListener('mousemove', onPointerMove); });
    window.addEventListener('mouseup', (e) => { onPointerUpCancel(e); window.removeEventListener('mousemove', onPointerMove); });
    // touch fallback
    track.addEventListener('touchstart', (e) => onPointerDown({ ...e, clientX: e.touches[0].clientX, button: 0 }));
    track.addEventListener('touchmove',  (e) => onPointerMove({ ...e, clientX: e.touches[0].clientX }));
    track.addEventListener('touchend',   (e) => onPointerUpCancel({ ...e, clientX: e.changedTouches[0].clientX }));
  }

  // Init
  setActive(0);
  restartCycle();

})();


// ===== Page fade: show only after full load, fade out on navigation =====
(function() {
  document.documentElement.classList.add('js');
  const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const body = document.body;
  const FADE_OUT_MS = 250;

  // When EVERYTHING is loaded (images, fonts, etc), fade in the page
  window.addEventListener('load', () => {
    if (reduce) { body.classList.remove('is-hidden'); return; }
    // Switch from hidden -> visible (triggers .35s fade-in)
    body.classList.remove('is-hidden');
    body.classList.add('is-visible');
  });

  // Don’t fade for hash-only jumps on the same page
  const isHashOnlyJump = (url) => {
    try {
      const u = new URL(url, location.href);
      return u.pathname === location.pathname && u.hash && u.hash !== '#';
    } catch { return false; }
  };

  // Only fade for same-origin navigations (internal links)
  const isSameOrigin = (url) => {
    try { return new URL(url, location.href).origin === location.origin; }
    catch { return false; }
  };

  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href]');
    if (!a) return;

    // Let these pass through
    if (a.target === '_blank') return;
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
    if (!isSameOrigin(a.href)) return;
    if (isHashOnlyJump(a.href)) return;

    // Fade out current page, then navigate
    e.preventDefault();
    if (!reduce) body.classList.add('is-leaving');
    setTimeout(() => { location.href = a.href; }, reduce ? 0 : FADE_OUT_MS);
  });

  // In case of bfcache restores, make sure it's visible again
  window.addEventListener('pageshow', () => {
    body.classList.remove('is-leaving');
  });
})();

