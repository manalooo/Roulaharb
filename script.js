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
  // Re-observe to apply stagger correctly
  document.querySelectorAll('.collection-grid .reveal, .jookh-grid .reveal, .statement-grid .reveal, .contact-grid .reveal').forEach(function (el, i) {
    el.style.transitionDelay = (i % 6) * 100 + 'ms';
  });

})();
