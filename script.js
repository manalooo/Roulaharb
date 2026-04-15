/* ===================================================
   ROULA HARB — script.js
   Handles: nav scroll, reveal animations, mobile menu,
            lightbox, inquiry basket
   =================================================== */

(function () {
  'use strict';

  // ─── WHATSAPP NUMBER ─────────────────────────────
  // Fill in Roula's number in international format, no + or spaces.
  // Example: '9613001234'  (Lebanon +961 prefix)
  var WHATSAPP_NUMBER = '';

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
  const hamburger = document.getElementById('hamburger');
  const navLinks  = document.getElementById('nav-links');

  if (hamburger && navLinks) {
    hamburger.addEventListener('click', function () {
      const isOpen = navLinks.classList.toggle('open');
      hamburger.classList.toggle('open', isOpen);
      hamburger.setAttribute('aria-expanded', isOpen);
    });

    navLinks.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () {
        navLinks.classList.remove('open');
        hamburger.classList.remove('open');
        hamburger.setAttribute('aria-expanded', 'false');
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
      }
    });
  }, { threshold: 0.4 });

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
