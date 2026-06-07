/* ===================================================
   ROULA HARB — script.js (v2)
   Handles: nav scroll, reveal animations, mobile menu,
            lightbox, inquiry basket, custom cursor
   =================================================== */

(function () {
  'use strict';

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ─── HERO SLIDESHOW ──────────────────────────────
  (function () {
    var container = document.getElementById('hero-slides');
    if (!container) return;

    function buildSlideshow(paths) {
      if (!paths || !paths.length) return;

      paths.forEach(function (src, i) {
        var div = document.createElement('div');
        div.className = 'hero-slide hero-slide--' + (i + 1);
        var img = document.createElement('img');
        img.src       = src;
        img.alt       = '';
        img.draggable = false;
        img.loading   = i === 0 ? 'eager' : 'lazy';
        img.decoding  = i === 0 ? 'sync' : 'async';
        div.appendChild(img);
        container.appendChild(div);
      });

      var slides   = Array.from(container.querySelectorAll('.hero-slide'));
      var DURATION = 6000;
      var CLEANUP  = 2400;
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
  function gentleScrollTo(target) {
    if (prefersReducedMotion) {
      target.scrollIntoView({ behavior: 'auto', block: 'start' });
      return;
    }
    var start    = window.scrollY;
    var end      = target.getBoundingClientRect().top + start - 80;
    var distance = end - start;
    var duration = 900;
    var startTime = null;

    function ease(t) {
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
    if (link.classList.contains('btn-inquire')) return;
    var id = link.getAttribute('href').slice(1);
    if (!id) return;
    var el = document.getElementById(id);
    if (!el) return;
    e.preventDefault();
    gentleScrollTo(el);
  });

  // ─── WHATSAPP NUMBER ─────────────────────────────
  var WHATSAPP_NUMBER = '96181341586';

  // ─── NAVBAR SCROLL + HIDE ON SCROLL DOWN ────────
  const navbar = document.getElementById('navbar');
  var lastScrollY = 0;

  function handleNavScroll() {
    var scrollY = window.scrollY;

    if (scrollY > 60) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
      navbar.classList.remove('nav-hidden');
      lastScrollY = scrollY;
      return;
    }

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
      if (isOpen) {
        var firstLink = navLinksAll[0].querySelector('a');
        if (firstLink) firstLink.focus();
      }
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

    // Close menu on Escape
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && hamburger.classList.contains('open')) {
        navLinksAll.forEach(function (nl) { nl.classList.remove('open'); });
        hamburger.classList.remove('open');
        hamburger.setAttribute('aria-expanded', 'false');
        hamburger.focus();
      }
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

  window.initReveal = initReveal;

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
  if (cursorDot && !prefersReducedMotion && window.matchMedia('(pointer: fine)').matches) {
    var cursorX = 0, cursorY = 0, targetX = 0, targetY = 0;
    var cursorRaf = null;

    function updateCursor() {
      cursorX += (targetX - cursorX) * 0.15;
      cursorY += (targetY - cursorY) * 0.15;
      cursorDot.style.left = cursorX + 'px';
      cursorDot.style.top  = cursorY + 'px';
      cursorRaf = requestAnimationFrame(updateCursor);
    }

    document.addEventListener('mousemove', function (e) {
      targetX = e.clientX;
      targetY = e.clientY;
      if (!cursorRaf) cursorRaf = requestAnimationFrame(updateCursor);
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
  } else if (cursorDot) {
    cursorDot.style.display = 'none';
  }

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
  var lastFocusedElement = null;

  var lb = document.createElement('div');
  lb.className = 'lb-overlay';
  lb.setAttribute('role', 'dialog');
  lb.setAttribute('aria-modal', 'true');
  lb.setAttribute('aria-label', 'Image viewer');
  lb.setAttribute('tabindex', '-1');
  lb.innerHTML =
    '<button class="lb-close" aria-label="Close image viewer">×</button>' +
    '<button class="lb-nav lb-prev" aria-label="Previous image">‹</button>' +
    '<div class="lb-stage">' +
      '<div class="lb-img-wrap"><img class="lb-img" src="" alt="" /></div>' +
      '<div class="lb-caption">' +
        '<p class="lb-name"></p>' +
        '<p class="lb-meta"></p>' +
        '<div class="lb-dots"></div>' +
      '</div>' +
    '</div>' +
    '<button class="lb-nav lb-next" aria-label="Next image">›</button>';
  document.body.appendChild(lb);

  var lbImg  = lb.querySelector('.lb-img');
  var lbName = lb.querySelector('.lb-name');
  var lbMeta = lb.querySelector('.lb-meta');
  var lbDots = lb.querySelector('.lb-dots');

  // Focus trap for lightbox
  function trapFocus(element) {
    var focusable = element.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
    var first = focusable[0];
    var last = focusable[focusable.length - 1];

    element.addEventListener('keydown', function (e) {
      if (e.key !== 'Tab') return;
      if (e.shiftKey) {
        if (document.activeElement === first) {
          last.focus();
          e.preventDefault();
        }
      } else {
        if (document.activeElement === last) {
          first.focus();
          e.preventDefault();
        }
      }
    });
  }
  trapFocus(lb);

  function lbShow(idx) {
    lbIndex = (idx + lbImages.length) % lbImages.length;
    lbImg.classList.add('is-changing');
    setTimeout(function () {
      lbImg.src = lbImages[lbIndex];
      lbImg.classList.remove('is-changing');
    }, 180);
    lbDots.querySelectorAll('.lb-dot').forEach(function (d, i) {
      d.classList.toggle('active', i === lbIndex);
      d.setAttribute('aria-current', i === lbIndex ? 'true' : 'false');
    });
  }

  function lbOpen(images, startIdx, name, material) {
    lastFocusedElement = document.activeElement;
    lbImages = images;
    lbDots.innerHTML = images.map(function (_, i) {
      return '<button class="lb-dot' + (i === startIdx ? ' active' : '') +
             '" aria-label="Image ' + (i + 1) + ' of ' + images.length + '"' +
             (i === startIdx ? ' aria-current="true"' : '') +
             ' data-idx="' + i + '"></button>';
    }).join('');
    lbImg.src = images[startIdx];
    lbImg.alt = name || 'Artwork image';
    lbName.textContent = name || '';
    lbMeta.textContent = material || '';
    lbIndex = startIdx;
    lb.classList.add('open');
    document.body.style.overflow = 'hidden';
    // Focus the lightbox itself first, then the close button
    setTimeout(function () { lb.querySelector('.lb-close').focus(); }, 50);
  }

  function lbClose() {
    lb.classList.remove('open');
    document.body.style.overflow = '';
    if (lastFocusedElement) lastFocusedElement.focus();
  }

  lb.querySelector('.lb-close').addEventListener('click', lbClose);
  lb.querySelector('.lb-prev').addEventListener('click', function (e) { e.stopPropagation(); lbShow(lbIndex - 1); });
  lb.querySelector('.lb-next').addEventListener('click', function (e) { e.stopPropagation(); lbShow(lbIndex + 1); });
  lbDots.addEventListener('click', function (e) {
    var d = e.target.closest('.lb-dot');
    if (d) { e.stopPropagation(); lbShow(+d.dataset.idx); }
  });
  lb.addEventListener('click', function (e) {
    if (e.target === lb || e.target.classList.contains('lb-stage')) lbClose();
  });
  document.addEventListener('keydown', function (e) {
    if (!lb.classList.contains('open')) return;
    if (e.key === 'Escape')     { e.preventDefault(); lbClose(); }
    if (e.key === 'ArrowLeft')  { e.preventDefault(); lbShow(lbIndex - 1); }
    if (e.key === 'ArrowRight') { e.preventDefault(); lbShow(lbIndex + 1); }
  });

  // Event delegation for lightbox open — product cards
  document.addEventListener('click', function (e) {
    if (e.target.closest('.btn-inquire') || e.target.closest('.basket-widget')) return;

    var wrap = e.target.closest('.card-img-wrap');
    if (!wrap) return;
    var card = wrap.closest('[data-lightbox]');
    if (!card) return;

    try {
      var images = JSON.parse(card.dataset.lightbox);
      var nameEl = card.querySelector('.card-piece-num');
      var medEl  = card.querySelector('.card-medium');
      var name   = nameEl ? nameEl.textContent.trim() : '';
      var medium = medEl  ? medEl.textContent.trim()  : '';
      lbOpen(images, 0, name, medium);
    } catch (err) { /* ignore */ }
  });

  // Event delegation for lightbox open — lookbook shots
  document.addEventListener('click', function (e) {
    var shot = e.target.closest('.lookbook-shot');
    if (!shot) return;
    var gallery = shot.closest('.lookbook-gallery, .lookbook-pair');
    if (!gallery) return;
    var look = gallery.closest('.lookbook-look');
    if (!look) return;

    var shots = gallery.querySelectorAll('.lookbook-shot img');
    var images = Array.from(shots).map(function (img) { return img.src; });
    var clickedImg = shot.querySelector('img');
    var clickedIdx = Array.from(shots).indexOf(clickedImg);
    if (clickedIdx < 0) clickedIdx = 0;

    var titleEl = look.querySelector('.lookbook-look-title');
    var title = '';
    if (titleEl) {
      var textNodes = Array.from(titleEl.childNodes).filter(function(n) {
        return n.nodeType === Node.TEXT_NODE;
      });
      title = textNodes[0] ? textNodes[0].textContent.trim() : '';
    }
    var metaEl = look.querySelector('.lookbook-look-meta');
    var meta = metaEl ? metaEl.textContent.trim() : '';

    lbOpen(images, clickedIdx, title, meta);
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
    '<button class="basket-trigger" id="basket-trigger" aria-label="Open inquiry basket (0 items)" aria-expanded="false" aria-controls="basket-panel">' +
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
        '<path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>' +
        '<line x1="3" y1="6" x2="21" y2="6"/>' +
        '<path d="M16 10a4 4 0 01-8 0"/>' +
      '</svg>' +
      '<span class="basket-count" id="basket-count" aria-hidden="true">0</span>' +
    '</button>' +
    '<div class="basket-panel" id="basket-panel" role="dialog" aria-label="Your inquiry list" hidden>' +
      '<div class="basket-panel-header">' +
        '<h4 class="basket-panel-title">Your Inquiry</h4>' +
        '<button class="basket-panel-close" id="basket-close" aria-label="Close inquiry list">&#215;</button>' +
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

    countBadge.textContent = count;
    trigger.classList.toggle('basket-has-items', count > 0);
    trigger.setAttribute('aria-label', 'Open inquiry basket (' + count + ' item' + (count !== 1 ? 's' : '') + ')');

    document.querySelectorAll('.btn-inquire').forEach(function (btn) {
      var id = btn.dataset.productId;
      if (basketContains(id)) {
        btn.classList.add('in-basket');
        btn.textContent = 'Added';
        btn.setAttribute('aria-pressed', 'true');
      } else {
        btn.classList.remove('in-basket');
        btn.textContent = 'Request';
        btn.setAttribute('aria-pressed', 'false');
      }
    });

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
          '<img class="basket-thumb" src="' + p.thumb + '" alt="" loading="lazy" />' +
          '<div class="basket-item-info">' +
            '<span class="basket-item-name">' + p.name + '</span>' +
            '<span class="basket-item-col">' + p.collection + '</span>' +
          '</div>' +
          '<button class="basket-item-remove" data-remove-id="' + p.id + '" aria-label="Remove ' + p.name + '">&times;</button>';
        itemList.appendChild(li);
      });

      var msg = buildWhatsAppMessage();
      var wa  = WHATSAPP_NUMBER
        ? 'https://wa.me/' + WHATSAPP_NUMBER + '?text=' + msg
        : 'https://wa.me/?text=' + msg;
      sendBtn.href = wa;
    }
  }

  trigger.addEventListener('click', function () {
    var isOpen = !panel.hidden;
    panel.hidden = isOpen;
    trigger.setAttribute('aria-expanded', !isOpen);
    if (!isOpen) {
      var firstFocusable = panel.querySelector('button, a');
      if (firstFocusable) firstFocusable.focus();
    }
  });

  closeBtn.addEventListener('click', function () {
    panel.hidden = true;
    trigger.setAttribute('aria-expanded', 'false');
    trigger.focus();
  });

  clearBtn.addEventListener('click', function () {
    clearBasket();
  });

  itemList.addEventListener('click', function (e) {
    var btn = e.target.closest('[data-remove-id]');
    if (btn) removeFromBasket(btn.dataset.removeId);
  });

  document.addEventListener('click', function (e) {
    if (!panel.hidden && !basketWidget.contains(e.target)) {
      panel.hidden = true;
      trigger.setAttribute('aria-expanded', 'false');
    }
  });

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
      panel.hidden = false;
      trigger.setAttribute('aria-expanded', 'true');
    }
  });

  updateBasketUI();

})();

/* ═══════════════════════════════════════════════════════
   STICKERS — parallax drift with reduced motion support
   ═══════════════════════════════════════════════════════ */
(function stickerAdventure() {
  'use strict';
  const stickers = Array.from(document.querySelectorAll('.sticker[data-parallax]'));
  if (!stickers.length) return;

  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function cache() {
    stickers.forEach(s => {
      const parent = s.parentElement;
      const r = parent.getBoundingClientRect();
      s.__anchorTop = r.top + window.scrollY;
      s.__speed     = parseFloat(s.dataset.parallax) || 0.18;
      s.__rotTarget = s.__rotTarget || 0;
      s.__rotCur    = s.__rotCur    || 0;
    });
  }

  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.04 });
  stickers.forEach(s => io.observe(s));

  if (prefersReduced) { cache(); return; }

  let lastY = window.scrollY;
  let vh    = window.innerHeight;

  function frame() {
    const y  = window.scrollY;
    const dy = y - lastY;
    lastY = y;

    stickers.forEach(s => {
      const rel = (y + vh * 0.5) - s.__anchorTop;
      const py  = rel * s.__speed * -0.95;
      s.style.setProperty('--py', py.toFixed(1) + 'px');
      s.style.setProperty('--scroll-rot', '0deg');

      const r  = s.getBoundingClientRect();
      const cy = r.top + r.height * 0.5;
      const distNorm = Math.min(1, Math.abs(cy - vh * 0.5) / (vh * 0.7));
      const breath   = 0.94 + (1 - distNorm) * 0.12;
      s.style.setProperty('--breath', breath.toFixed(3));
    });

    requestAnimationFrame(frame);
  }

  cache();
  requestAnimationFrame(frame);

  window.addEventListener('resize', () => { vh = window.innerHeight; cache(); }, { passive: true });
  window.addEventListener('load',   () => { cache(); }, { passive: true });

  window.__rerollStickers = cache;
})();

/* ═══════════════════════════════════════════════════════
   GRID EXPANDERS
   ═══════════════════════════════════════════════════════ */
(function gridExpanders() {
  'use strict';
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
      if (container.dataset.expanderApplied) return;

      const grids = container.querySelectorAll('.jookh-grid, .jookh-subgrid, .collection-grid');
      if (!grids.length) return;

      grids.forEach(grid => {
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
          '<span class="arrow" aria-hidden="true">↓</span>';

        btn.addEventListener('click', () => {
          const wasOpen = btn.getAttribute('aria-expanded') === 'true';
          btn.setAttribute('aria-expanded', String(!wasOpen));
          hidden.forEach(c => c.classList.toggle('is-hidden', wasOpen));
          btn.querySelector('.btn-text').textContent = wasOpen
            ? '+ See ' + hidden.length + ' more ' + label
            : '− Show fewer ' + label;
          if (typeof window.__rerollStickers === 'function') {
            window.__rerollStickers();
            setTimeout(window.__rerollStickers, 80);
          }
        });

        grid.parentNode.insertBefore(btn, grid.nextSibling);
      });

      container.dataset.expanderApplied = '1';
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => setTimeout(setupExpanders, 50));
  } else {
    setTimeout(setupExpanders, 50);
  }
})();

/* ═══════════════════════════════════════════════════════
   PETAL FALL — reduced motion aware
   ═══════════════════════════════════════════════════════ */
(function petalFall() {
  'use strict';
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReduced) return;

  const PETAL_COLORS = [
    '#C94A5A', '#E88B6E', '#F5B99C', '#FBE4D8',
    '#6B1F2E', '#B84530', '#F6D9A8', '#D48A3A',
  ];
  const GRAVITY  = 0.07;
  const DRAG     = 0.987;

  function spawn(x, y) {
    const count = 6 + (Math.random() * 4 | 0);
    for (let i = 0; i < count; i++) {
      const p = document.createElement('div');
      p.className = 'petal-fall';
      p.style.background = PETAL_COLORS[Math.random() * PETAL_COLORS.length | 0];
      const scale = 0.7 + Math.random() * 0.7;
      document.body.appendChild(p);

      let px = x + (Math.random() - 0.5) * 14;
      let py = y + (Math.random() - 0.5) * 14;
      let vx = (Math.random() - 0.5) * 5;
      let vy = -Math.random() * 2.5 - 0.4;
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
