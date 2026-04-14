/* ===================================================
   ROULA HARB — script.js
   Handles: nav scroll, reveal animations, mobile menu
   =================================================== */

(function () {
  'use strict';

  // ─── NAVBAR SCROLL ───────────────────────────────
  const navbar = document.getElementById('navbar');

  function handleNavScroll() {
    if (window.scrollY > 60) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
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

    // Close menu when a link is clicked
    navLinks.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () {
        navLinks.classList.remove('open');
        hamburger.classList.remove('open');
        hamburger.setAttribute('aria-expanded', 'false');
      });
    });
  }

  // ─── SCROLL REVEAL ───────────────────────────────
  const revealEls = document.querySelectorAll('.reveal');

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

  revealEls.forEach(function (el, i) {
    // Stagger delay for grid children
    const parent = el.parentElement;
    if (parent && (parent.classList.contains('collection-grid') ||
                   parent.classList.contains('jookh-grid') ||
                   parent.classList.contains('statement-grid') ||
                   parent.classList.contains('contact-grid'))) {
      el.style.transitionDelay = (i % 6) * 80 + 'ms';
    }
    revealObserver.observe(el);
  });

  // ─── HERO IMAGE PARALLAX ─────────────────────────
  const heroImg = document.getElementById('hero-img');

  if (heroImg) {
    heroImg.addEventListener('load', function () {
      heroImg.classList.add('loaded');
    });
    // If already cached
    if (heroImg.complete) heroImg.classList.add('loaded');

    window.addEventListener('scroll', function () {
      const scrolled = window.scrollY;
      if (scrolled < window.innerHeight) {
        heroImg.style.transform = 'scale(1) translateY(' + scrolled * 0.25 + 'px)';
      }
    }, { passive: true });
  }

  // ─── SMOOTH SCROLL (fallback for older browsers) ─
  document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
    anchor.addEventListener('click', function (e) {
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
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

  // ─── STAGGER REVEAL for grid items ───────────────
  document.querySelectorAll('.collection-grid .reveal, .jookh-grid .reveal, .contact-grid .reveal').forEach(function (el, i) {
    el.style.transitionDelay = (i % 6) * 80 + 'ms';
  });

  // ─── LIGHTBOX ────────────────────────────────────
  var lbImages = [], lbIndex = 0;

  // Build overlay DOM once
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

  // Wire cards
  document.querySelectorAll('[data-lightbox]').forEach(function (card) {
    var wrap = card.querySelector('.card-img-wrap');
    if (!wrap) return;
    wrap.addEventListener('click', function (e) {
      // Don't intercept clicks on the Inquire link
      if (e.target.closest('.btn-inquire')) return;
      var images = JSON.parse(card.dataset.lightbox);
      lbOpen(images, 0);
    });
  });

})();
