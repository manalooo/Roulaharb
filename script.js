/* ===================================================
   ROULA HARB — script.js
   Handles: nav scroll, reveal animations, mobile menu,
            lightbox, inquiry basket
   =================================================== */

(function () {
  'use strict';

  // ─── HERO SLIDESHOW ──────────────────────────────
  // Images are loaded from data/hero-slides.js (window.HERO_SLIDES).
  // To change what shows: put images in images/hero/ then run:
  //   node sync-hero.js
  (function () {
    var container = document.getElementById('hero-slides');
    if (!container) return;

    // Load image list — fetch JSON over HTTP, fall back to window.HERO_SLIDES
    function buildSlideshow(paths) {
      if (!paths || !paths.length) return;

      // Build slide DOM
      paths.forEach(function (src, i) {
        var div = document.createElement('div');
        div.className = 'hero-slide hero-slide--' + (i + 1);
        var img = document.createElement('img');
        img.src          = src;
        img.alt          = '';
        img.draggable    = false;
        img.loading      = i === 0 ? 'eager' : 'lazy';
        div.appendChild(img);
        container.appendChild(div);
      });

      // Start the cycle
      var slides   = Array.from(container.querySelectorAll('.hero-slide'));
      var DURATION = 6000;  // each slide visible for 6s
      var CLEANUP  = 2400;  // remove is-prev after crossfade completes (2.2s)
      var current  = 0;
      var timer    = null;

      slides[0].classList.add('is-active');

      function go(targetIndex) {
        if (targetIndex === current || slides.length < 2) return;
        var prev = slides[current];
        current  = (targetIndex + slides.length) % slides.length;
        var next = slides[current];
        prev.classList.remove('is-active');
        prev.classList.add('is-prev');
        next.classList.add('is-active');
        setTimeout(function () { prev.classList.remove('is-prev'); }, CLEANUP);
      }
      function nextSlide() { go(current + 1); }
      function prevSlide() { go(current - 1); }

      function startAuto() {
        stopAuto();
        timer = setInterval(nextSlide, DURATION);
      }
      function stopAuto() { if (timer) { clearInterval(timer); timer = null; } }
      function resetAuto() { startAuto(); }
      startAuto();

      // ── Arrow navigation ──
      if (slides.length > 1) {
        var hero = document.getElementById('hero');
        var btnPrev = document.createElement('button');
        btnPrev.type = 'button';
        btnPrev.className = 'hero-arrow hero-arrow--prev';
        btnPrev.setAttribute('aria-label', 'Previous image');
        btnPrev.innerHTML = '<span aria-hidden="true">&#8592;</span>';

        var btnNext = document.createElement('button');
        btnNext.type = 'button';
        btnNext.className = 'hero-arrow hero-arrow--next';
        btnNext.setAttribute('aria-label', 'Next image');
        btnNext.innerHTML = '<span aria-hidden="true">&#8594;</span>';

        btnPrev.addEventListener('click', function (e) { e.preventDefault(); prevSlide(); resetAuto(); });
        btnNext.addEventListener('click', function (e) { e.preventDefault(); nextSlide(); resetAuto(); });

        hero.appendChild(btnPrev);
        hero.appendChild(btnNext);

        // Pause auto-advance while hovering arrows so users aren't rushed
        [btnPrev, btnNext].forEach(function (b) {
          b.addEventListener('mouseenter', stopAuto);
          b.addEventListener('mouseleave', startAuto);
        });
      }
    }

    if (typeof fetch !== 'undefined') {
      fetch('data/hero-slides.json')
        .then(function (r) { if (!r.ok) throw new Error(); return r.json(); })
        .then(buildSlideshow)
        .catch(function () { buildSlideshow(window.HERO_SLIDES || []); });
    } else {
      buildSlideshow(window.HERO_SLIDES || []);
    }
  })();

  // ─── GENTLE SMOOTH SCROLL ────────────────────────
  // Intercepts all anchor links and scrolls softly over 900ms
  function gentleScrollTo(target) {
    var start    = window.scrollY;
    var end      = target.getBoundingClientRect().top + start - 80; // 80px nav offset
    var distance = end - start;
    var duration = 900;
    var startTime = null;

    function ease(t) {
      // easeInOutCubic — slow start, smooth middle, gentle landing
      return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    }

    function step(timestamp) {
      if (!startTime) startTime = timestamp;
      var elapsed  = timestamp - startTime;
      var progress = Math.min(elapsed / duration, 1);
      window.scrollTo(0, start + distance * ease(progress));
      if (progress < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  document.addEventListener('click', function (e) {
    var link = e.target.closest('a[href^="#"]');
    if (!link) return;
    // Reserve-this-piece buttons add to the inquiry basket — never scroll.
    if (link.classList.contains('btn-inquire')) return;
    var id = link.getAttribute('href').slice(1);
    if (!id) return;
    var el = document.getElementById(id);
    if (!el) return;
    e.preventDefault();
    gentleScrollTo(el);
  });

  // ─── WHATSAPP NUMBER ─────────────────────────────
  // International format, no + or spaces. Lebanon: 961 + 8-digit mobile.
  var WHATSAPP_NUMBER = '96181341586';

  // ─── NAVBAR SCROLL + HIDE ON SCROLL DOWN ────────
  const navbar = document.getElementById('navbar');
  var lastScrollY = 0;

  function handleNavScroll() {
    var scrollY = window.scrollY;

    // Scrolled state (background)
    if (scrollY > 60) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
      navbar.classList.remove('nav-hidden');
      lastScrollY = scrollY;
      return;
    }

    // Hide on scroll down, reveal on scroll up
    if (scrollY > lastScrollY + 8) {
      navbar.classList.add('nav-hidden');
    } else if (scrollY < lastScrollY - 8) {
      navbar.classList.remove('nav-hidden');
    }
    lastScrollY = scrollY;
  }

  window.addEventListener('scroll', handleNavScroll, { passive: true });
  handleNavScroll();

  // ─── MOBILE HAMBURGER ────────────────────────────
  const hamburger   = document.getElementById('hamburger');
  const navLinksAll = document.querySelectorAll('.nav-links');

  if (hamburger && navLinksAll.length) {
    hamburger.addEventListener('click', function () {
      const isOpen = hamburger.classList.toggle('open');
      navLinksAll.forEach(function (nl) { nl.classList.toggle('open', isOpen); });
      hamburger.setAttribute('aria-expanded', isOpen);
    });

    navLinksAll.forEach(function (nl) {
      nl.querySelectorAll('a').forEach(function (link) {
        link.addEventListener('click', function () {
          navLinksAll.forEach(function (nl2) { nl2.classList.remove('open'); });
          hamburger.classList.remove('open');
          hamburger.setAttribute('aria-expanded', 'false');
        });
      });
    });
  }

  // ─── SCROLL REVEAL ───────────────────────────────
  function initReveal() {
    const revealEls = document.querySelectorAll('.reveal:not(.reveal-wired)');

    const revealObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          revealObserver.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.12,
      rootMargin: '0px 0px -40px 0px'
    });

    revealEls.forEach(function (el) {
      const parent = el.parentElement;
      if (parent && (parent.classList.contains('collection-grid') ||
                     parent.classList.contains('jookh-grid') ||
                     parent.classList.contains('statement-grid') ||
                     parent.classList.contains('contact-grid'))) {
        // stagger handled per-card in render.js
      }
      el.classList.add('reveal-wired');
      revealObserver.observe(el);
    });
  }

  // Expose globally so render.js can call it after async fetch resolves
  window.initReveal = initReveal;

  // Run once immediately, then after a tick for dynamic cards
  initReveal();
  setTimeout(initReveal, 0);

  // ─── HERO NAME — LETTER BY LETTER ────────────────
  var heroNameEl = document.getElementById('hero-name');
  if (heroNameEl) {
    var heroText = heroNameEl.textContent;
    heroNameEl.textContent = '';
    heroText.split('').forEach(function (char, i) {
      var span = document.createElement('span');
      span.className = 'hero-letter';
      span.textContent = char === ' ' ? '\u00A0' : char;
      span.style.animationDelay = (300 + i * 55) + 'ms';
      heroNameEl.appendChild(span);
    });
  }

  // ─── CUSTOM CURSOR ───────────────────────────────
  var cursorDot = document.getElementById('cursor-dot');
  if (cursorDot && window.matchMedia('(pointer: fine)').matches) {
    document.addEventListener('mousemove', function (e) {
      cursorDot.style.left = e.clientX + 'px';
      cursorDot.style.top  = e.clientY + 'px';
    }, { passive: true });

    document.addEventListener('mouseover', function (e) {
      if (e.target.closest('.card-img-wrap, .brand-logo, .img-frame')) {
        cursorDot.classList.add('cursor-over-image');
      } else if (e.target.closest('a, button')) {
        cursorDot.classList.add('cursor-over-link');
      }
    });

    document.addEventListener('mouseout', function (e) {
      if (e.target.closest('.card-img-wrap, .brand-logo, .img-frame')) {
        cursorDot.classList.remove('cursor-over-image');
      } else if (e.target.closest('a, button')) {
        cursorDot.classList.remove('cursor-over-link');
      }
    });
  }

  // ─── SMOOTH SCROLL ───────────────────────────────
  document.addEventListener('click', function (e) {
    const anchor = e.target.closest('a[href^="#"]');
    if (!anchor) return;
    // Reserve-this-piece buttons add to the inquiry basket only — don't scroll.
    if (anchor.classList.contains('btn-inquire')) return;
    const target = document.querySelector(anchor.getAttribute('href'));
    if (target) {
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });

  // ─── ACTIVE NAV LINK HIGHLIGHT ───────────────────
  const sections = document.querySelectorAll('section[id]');
  const navItems = document.querySelectorAll('.nav-links a');

  const sectionObserver = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        navItems.forEach(function (link) {
          link.classList.remove('active');
          if (link.getAttribute('href') === '#' + entry.target.id) {
            link.classList.add('active');
          }
        });

        // Toggle P-Lo body class for smooth background transition
        if (entry.target.id === 'plo') {
          document.body.classList.add('plo-active');
        } else {
          document.body.classList.remove('plo-active');
        }
      }
    });
  }, { threshold: 0.25 });

  sections.forEach(function (section) { sectionObserver.observe(section); });

  // ─── LIGHTBOX ────────────────────────────────────
  var lbImages = [], lbIndex = 0;

  var lb = document.createElement('div');
  lb.className = 'lb-overlay';
  lb.setAttribute('role', 'dialog');
  lb.setAttribute('aria-modal', 'true');
  lb.setAttribute('aria-label', 'Image viewer');
  lb.innerHTML =
    '<button class="lb-btn lb-close" aria-label="Close">\u00d7</button>' +
    '<button class="lb-btn lb-prev"  aria-label="Previous">\u2190</button>' +
    '<div class="lb-img-wrap"><img class="lb-img" src="" alt="" /></div>' +
    '<button class="lb-btn lb-next"  aria-label="Next">\u2192</button>' +
    '<div class="lb-footer"><div class="lb-thumbs"></div><p class="lb-counter"></p></div>';
  document.body.appendChild(lb);

  var lbImg    = lb.querySelector('.lb-img');
  var lbThumbs = lb.querySelector('.lb-thumbs');
  var lbCount  = lb.querySelector('.lb-counter');

  function lbShow(idx) {
    lbIndex = (idx + lbImages.length) % lbImages.length;
    lbImg.style.opacity = '0';
    setTimeout(function () {
      lbImg.src = lbImages[lbIndex];
      lbImg.style.opacity = '1';
    }, 200);
    lbThumbs.querySelectorAll('.lb-thumb').forEach(function (t, i) {
      t.classList.toggle('active', i === lbIndex);
    });
    lbCount.textContent = (lbIndex + 1) + '\u2002/\u2002' + lbImages.length;
  }

  function lbOpen(images, startIdx) {
    lbImages = images;
    lbThumbs.innerHTML = images.map(function (src, i) {
      return '<img class="lb-thumb' + (i === startIdx ? ' active' : '') +
             '" src="' + src + '" alt="" data-idx="' + i + '" />';
    }).join('');
    lbImg.src = images[startIdx];
    lbCount.textContent = (startIdx + 1) + '\u2002/\u2002' + images.length;
    lbIndex = startIdx;
    lb.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function lbClose() {
    lb.classList.remove('open');
    document.body.style.overflow = '';
  }

  lb.querySelector('.lb-close').addEventListener('click', lbClose);
  lb.querySelector('.lb-prev').addEventListener('click', function () { lbShow(lbIndex - 1); });
  lb.querySelector('.lb-next').addEventListener('click', function () { lbShow(lbIndex + 1); });
  lb.querySelector('.lb-thumbs').addEventListener('click', function (e) {
    var t = e.target.closest('.lb-thumb');
    if (t) lbShow(+t.dataset.idx);
  });
  lb.addEventListener('click', function (e) { if (e.target === lb) lbClose(); });
  document.addEventListener('keydown', function (e) {
    if (!lb.classList.contains('open')) return;
    if (e.key === 'Escape')     lbClose();
    if (e.key === 'ArrowLeft')  lbShow(lbIndex - 1);
    if (e.key === 'ArrowRight') lbShow(lbIndex + 1);
  });

  // Event delegation — works for dynamically rendered cards
  document.addEventListener('click', function (e) {
    // Don't open lightbox from Inquire button or basket trigger
    if (e.target.closest('.btn-inquire') || e.target.closest('.basket-widget')) return;

    var wrap = e.target.closest('.card-img-wrap');
    if (!wrap) return;
    var card = wrap.closest('[data-lightbox]');
    if (!card) return;

    try {
      var images = JSON.parse(card.dataset.lightbox);
      lbOpen(images, 0);
    } catch (err) { /* ignore */ }
  });

  // ─── INQUIRY BASKET ──────────────────────────────
  var STORAGE_KEY = 'rh_basket';

  function loadBasket() {
    try {
      return JSON.parse(sessionStorage.getItem(STORAGE_KEY)) || [];
    } catch (e) { return []; }
  }

  function saveBasket(items) {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }

  function basketContains(id) {
    return loadBasket().some(function (p) { return p.id === id; });
  }

  function addToBasket(product) {
    var items = loadBasket();
    if (!items.some(function (p) { return p.id === product.id; })) {
      items.push(product);
      saveBasket(items);
    }
    updateBasketUI();
  }

  function removeFromBasket(id) {
    var items = loadBasket().filter(function (p) { return p.id !== id; });
    saveBasket(items);
    updateBasketUI();
  }

  function clearBasket() {
    sessionStorage.removeItem(STORAGE_KEY);
    updateBasketUI();
  }

  function buildWhatsAppMessage() {
    var items = loadBasket();
    if (!items.length) return '';
    var lines = ['Hello Roula, I am interested in the following piece(s):'];
    items.forEach(function (p, i) {
      lines.push((i + 1) + '. ' + p.name + ' (' + p.collection + ')');
    });
    lines.push('\nCould you please let me know about availability and pricing? Thank you.');
    return encodeURIComponent(lines.join('\n'));
  }

  // ── Build basket widget DOM ──────────────────────
  var basketWidget = document.createElement('div');
  basketWidget.className = 'basket-widget';
  basketWidget.setAttribute('aria-label', 'Inquiry basket');
  basketWidget.innerHTML =
    '<button class="basket-trigger" id="basket-trigger" aria-label="Open inquiry basket">' +
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
        '<path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>' +
        '<line x1="3" y1="6" x2="21" y2="6"/>' +
        '<path d="M16 10a4 4 0 01-8 0"/>' +
      '</svg>' +
      '<span class="basket-count" id="basket-count">0</span>' +
    '</button>' +
    '<div class="basket-panel" id="basket-panel" role="dialog" aria-label="Your inquiry list" hidden>' +
      '<div class="basket-panel-header">' +
        '<h4 class="basket-panel-title">Your Inquiry</h4>' +
        '<button class="basket-panel-close" id="basket-close" aria-label="Close">&#215;</button>' +
      '</div>' +
      '<div class="basket-panel-empty" id="basket-empty">No pieces selected yet.</div>' +
      '<ul class="basket-item-list" id="basket-item-list" aria-label="Selected pieces"></ul>' +
      '<div class="basket-panel-footer" id="basket-footer" hidden>' +
        '<button class="basket-clear" id="basket-clear">Clear all</button>' +
        '<a class="basket-send-btn" id="basket-send" href="#" target="_blank" rel="noopener">Send to Roula via WhatsApp</a>' +
      '</div>' +
    '</div>';
  document.body.appendChild(basketWidget);

  var trigger     = document.getElementById('basket-trigger');
  var panel       = document.getElementById('basket-panel');
  var countBadge  = document.getElementById('basket-count');
  var emptyNote   = document.getElementById('basket-empty');
  var itemList    = document.getElementById('basket-item-list');
  var footer      = document.getElementById('basket-footer');
  var sendBtn     = document.getElementById('basket-send');
  var clearBtn    = document.getElementById('basket-clear');
  var closeBtn    = document.getElementById('basket-close');

  function updateBasketUI() {
    var items = loadBasket();
    var count = items.length;

    // Badge
    countBadge.textContent = count;
    trigger.classList.toggle('basket-has-items', count > 0);

    // Update Inquire buttons
    document.querySelectorAll('.btn-inquire').forEach(function (btn) {
      var id = btn.dataset.productId;
      if (basketContains(id)) {
        btn.classList.add('in-basket');
        btn.textContent = 'Added';
      } else {
        btn.classList.remove('in-basket');
        btn.textContent = 'Request';
      }
    });

    // Panel list
    itemList.innerHTML = '';
    if (count === 0) {
      emptyNote.hidden = false;
      footer.hidden = true;
    } else {
      emptyNote.hidden = true;
      footer.hidden = false;
      items.forEach(function (p) {
        var li = document.createElement('li');
        li.className = 'basket-item';
        li.innerHTML =
          '<img class="basket-thumb" src="' + p.thumb + '" alt="' + p.name + '" />' +
          '<div class="basket-item-info">' +
            '<span class="basket-item-name">' + p.name + '</span>' +
            '<span class="basket-item-col">' + p.collection + '</span>' +
          '</div>' +
          '<button class="basket-item-remove" data-remove-id="' + p.id + '" aria-label="Remove ' + p.name + '">&times;</button>';
        itemList.appendChild(li);
      });

      // WhatsApp link
      var msg = buildWhatsAppMessage();
      var wa  = WHATSAPP_NUMBER
        ? 'https://wa.me/' + WHATSAPP_NUMBER + '?text=' + msg
        : 'https://wa.me/?text=' + msg;
      sendBtn.href = wa;
    }
  }

  // Toggle panel
  trigger.addEventListener('click', function () {
    var isOpen = !panel.hidden;
    panel.hidden = isOpen;
    trigger.setAttribute('aria-expanded', !isOpen);
  });

  closeBtn.addEventListener('click', function () {
    panel.hidden = true;
    trigger.setAttribute('aria-expanded', 'false');
  });

  clearBtn.addEventListener('click', function () {
    clearBasket();
  });

  // Remove items via event delegation
  itemList.addEventListener('click', function (e) {
    var btn = e.target.closest('[data-remove-id]');
    if (btn) removeFromBasket(btn.dataset.removeId);
  });

  // Close panel on outside click
  document.addEventListener('click', function (e) {
    if (!panel.hidden && !basketWidget.contains(e.target)) {
      panel.hidden = true;
      trigger.setAttribute('aria-expanded', 'false');
    }
  });

  // Inquire button click — event delegation
  document.addEventListener('click', function (e) {
    var btn = e.target.closest('.btn-inquire');
    if (!btn) return;
    e.preventDefault();

    var id         = btn.dataset.productId;
    var name       = btn.dataset.productName;
    var collection = btn.dataset.productCollection;
    var thumb      = btn.dataset.productThumb;

    if (basketContains(id)) {
      removeFromBasket(id);
    } else {
      addToBasket({ id: id, name: name, collection: collection, thumb: thumb });
      // Open panel briefly to confirm
      panel.hidden = false;
      trigger.setAttribute('aria-expanded', 'true');
    }
  });

  // Initialise on load (restore any session state)
  updateBasketUI();

})();

/* ═══════════════════════════════════════════════════════
   STICKERS — fresh adventure
     1. Parallax drift (each sticker moves at its own speed
        opposite to scroll, anchored to its parent section).
     2. FAST SMOOTH scroll-rotation — accumulates rotation
        from scroll distance × per-sticker speed, then lerps
        toward target each frame for buttery smoothness.
     3. Subtle viewport-progress breathing — petals scale up
        gently when near the viewport center, shrink at edges.
     4. Scroll-reveal fade-in via IntersectionObserver.
   ═══════════════════════════════════════════════════════ */
(function stickerAdventure() {
  'use strict';
  const stickers = Array.from(document.querySelectorAll('.sticker[data-parallax]'));
  if (!stickers.length) return;

  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ── Cache per-sticker geometry & per-sticker animation state
  function cache() {
    stickers.forEach(s => {
      const parent = s.parentElement;
      const r = parent.getBoundingClientRect();
      s.__anchorTop = r.top + window.scrollY;
      s.__speed     = parseFloat(s.dataset.parallax) || 0.18;
      s.__rotTarget = s.__rotTarget || 0;   // accumulating target rotation
      s.__rotCur    = s.__rotCur    || 0;   // smoothed current rotation
    });
  }

  // ── Fade-in when each sticker enters viewport
  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.04 });
  stickers.forEach(s => io.observe(s));

  if (prefersReduced) { cache(); return; }

  // ── Main rAF loop: parallax + scroll-rotation + breathing
  let lastY = window.scrollY;
  let vh    = window.innerHeight;

  function frame() {
    const y  = window.scrollY;
    const dy = y - lastY;            // signed scroll delta (px since last frame)
    lastY = y;

    // Rotation disabled — stickers stay at their fixed --rot only.
    // (Was: accumulate rotation from scroll distance — felt too busy.)

    // Per-frame smoothing + parallax + breathing
    stickers.forEach(s => {
      // PARALLAX — drift opposite to scroll, anchored to section center
      const rel = (y + vh * 0.5) - s.__anchorTop;
      const py  = rel * s.__speed * -0.95;
      s.style.setProperty('--py', py.toFixed(1) + 'px');

      // Rotation disabled — keep --scroll-rot at 0 so stickers stay still.
      s.style.setProperty('--scroll-rot', '0deg');

      // BREATHING — viewport-progress scale (peak at 1.06× when sticker is centered)
      const r  = s.getBoundingClientRect();
      const cy = r.top + r.height * 0.5;
      const distNorm = Math.min(1, Math.abs(cy - vh * 0.5) / (vh * 0.7));
      const breath   = 0.94 + (1 - distNorm) * 0.12;   // 0.94 at edge, 1.06 at center
      s.style.setProperty('--breath', breath.toFixed(3));
    });

    requestAnimationFrame(frame);
  }

  cache();
  requestAnimationFrame(frame);

  window.addEventListener('resize', () => { vh = window.innerHeight; cache(); }, { passive: true });
  window.addEventListener('load',   () => { cache(); }, { passive: true });

  // Expose so other code (grid expanders, etc.) can re-cache after DOM grows.
  window.__rerollStickers = cache;
})();

/* ═══════════════════════════════════════════════════════
   GRID EXPANDERS — show first N cards in long grids,
   reveal the rest behind a "+ see N more" button.
   ═══════════════════════════════════════════════════════ */
(function gridExpanders() {
  'use strict';
  // One full row visible by default — desktop has 3 cols (4 for bags).
  // Click the "+ N more" button to reveal the rest.
  const presets = {
    'scarves-grid':   { initial: 3, label: 'scarves'   },
    'bags-grid':      { initial: 4, label: 'bags'      },
    'wearables-grid': { initial: 3, label: 'pieces'    },
    'plo-grid':       { initial: 3, label: 'pillows'   },
  };

  function setupExpanders() {
    Object.keys(presets).forEach(gridId => {
      const container = document.getElementById(gridId);
      if (!container) return;
      // skip if already wired
      if (container.dataset.expanderApplied) return;

      // grids may be wrapped in .jookh-subgrid (or .collection-grid for pillows)
      const grids = container.querySelectorAll('.jookh-grid, .jookh-subgrid, .collection-grid');
      if (!grids.length) return;

      grids.forEach(grid => {
        // Skip archive grids — they have their own toggle (.archive-wrap)
        if (grid.closest('.archive-wrap')) return;
        const cards = Array.from(grid.querySelectorAll('.product-card'));
        const { initial, label } = presets[gridId];
        if (cards.length <= initial) return;

        const hidden = cards.slice(initial);
        hidden.forEach(c => c.classList.add('is-hidden'));

        const btn = document.createElement('button');
        btn.className = 'grid-expand-btn';
        btn.setAttribute('aria-expanded', 'false');
        btn.innerHTML =
          '<span class="btn-text">+ See ' + hidden.length + ' more ' + label + '</span>' +
          '<span class="arrow">↓</span>';

        btn.addEventListener('click', () => {
          const wasOpen = btn.getAttribute('aria-expanded') === 'true';
          btn.setAttribute('aria-expanded', String(!wasOpen));
          hidden.forEach(c => c.classList.toggle('is-hidden', wasOpen));
          btn.querySelector('.btn-text').textContent = wasOpen
            ? '+ See ' + hidden.length + ' more ' + label
            : '− Show fewer ' + label;
          // Section just grew/shrank — re-cache sticker anchors so parallax stays aligned
          // and stickers don't drift off-screen.
          if (typeof window.__rerollStickers === 'function') {
            window.__rerollStickers();
            // and once more after layout settles
            setTimeout(window.__rerollStickers, 80);
          }
        });

        // Insert after the grid (so it sits below the cards)
        grid.parentNode.insertBefore(btn, grid.nextSibling);
      });

      container.dataset.expanderApplied = '1';
    });
  }

  // render.js builds grids on DOMContentLoaded; we run after it.
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => setTimeout(setupExpanders, 50));
  } else {
    setTimeout(setupExpanders, 50);
  }
})();

/* ═══════════════════════════════════════════════════════
   PETAL FALL — clicking any sticker scatters 6-9 petal
   shapes from its center; petals drift with gravity + sway,
   slowly rotate, and fade out.
   ═══════════════════════════════════════════════════════ */
(function petalFall() {
  'use strict';
  const PETAL_COLORS = [
    '#C94A5A',  // rose madder
    '#E88B6E',  // terracotta
    '#F5B99C',  // peach sorbet
    '#FBE4D8',  // dawn blush
    '#6B1F2E',  // deep wine madder
    '#B84530',  // painterly terracotta
    '#F6D9A8',  // champagne gold
    '#D48A3A',  // burnt amber
  ];
  const GRAVITY  = 0.07;
  const DRAG     = 0.987;

  function spawn(x, y) {
    const count = 6 + (Math.random() * 4 | 0);
    for (let i = 0; i < count; i++) {
      const p = document.createElement('div');
      p.className = 'petal-fall';
      p.style.background = PETAL_COLORS[Math.random() * PETAL_COLORS.length | 0];
      // randomise size a touch
      const scale = 0.7 + Math.random() * 0.7;
      document.body.appendChild(p);

      let px = x + (Math.random() - 0.5) * 14;
      let py = y + (Math.random() - 0.5) * 14;
      let vx = (Math.random() - 0.5) * 5;
      let vy = -Math.random() * 2.5 - 0.4;     // initial upward burst
      let rot = Math.random() * 360;
      let rotV = (Math.random() - 0.5) * 5;
      const sway = 0.04 + Math.random() * 0.05;
      const phase = Math.random() * Math.PI * 2;
      let life = 0;
      const maxLife = 110 + Math.random() * 60;

      function step() {
        life++;
        if (life > maxLife || py > window.innerHeight + 60) { p.remove(); return; }
        vx = (vx + Math.sin(life * sway + phase) * 0.06) * DRAG;
        vy = (vy + GRAVITY) * DRAG;
        px += vx;
        py += vy;
        rot += rotV * (1 + life * 0.003);
        const o = 1 - Math.pow(life / maxLife, 2.4);
        p.style.transform = 'translate(' + px.toFixed(1) + 'px, ' + py.toFixed(1) + 'px) rotate(' + rot.toFixed(1) + 'deg) scale(' + scale.toFixed(2) + ')';
        p.style.opacity = o.toFixed(2);
        requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
    }
  }

  document.addEventListener('click', function (e) {
    const s = e.target.closest('.sticker');
    if (!s) return;
    const r = s.getBoundingClientRect();
    spawn(r.left + r.width / 2, r.top + r.height / 2);
  });
})();
