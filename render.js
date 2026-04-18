/* =====================================================
   ROULA HARB — render.js
   Reads product data (from data/products.json via fetch,
   or window.PRODUCTS as a file:// fallback) and builds
   all product cards dynamically.

   To update products: edit inventory.csv then run
     node sync-products.js
   ===================================================== */

(function () {
  'use strict';

  // ─── SECTION MAP ─────────────────────────────────
  var sections = [
    { category: 'scarves',   id: 'scarves-grid',   classes: 'jookh-grid',               variant: 'tall' },
    { category: 'bags',      id: 'bags-grid',       classes: 'jookh-grid jookh-grid-4',  variant: ''     },
    { category: 'wearables', id: 'wearables-grid',  classes: 'jookh-grid',               variant: 'tall' },
    { category: 'pillows',   id: 'plo-grid',        classes: 'collection-grid',           variant: ''     }
  ];

  // ─── RENDER ALL SECTIONS ─────────────────────────
  function renderAll(products) {
    if (!products || !products.length) {
      console.warn('render.js: no products to display. Check inventory.csv and run node sync-products.js.');
      return;
    }

    sections.forEach(function (section) {
      var container = document.getElementById(section.id);
      if (!container) return;

      // Apply grid classes
      section.classes.split(' ').forEach(function (cls) {
        if (cls) container.classList.add(cls);
      });

      // Filter and build cards
      var items = products.filter(function (p) { return p.category === section.category; });
      items.forEach(function (product, i) {
        container.appendChild(buildCard(product, section.variant, i));
      });
    });

    // Initialise scroll-reveal on the newly created cards
    if (typeof window.initReveal === 'function') {
      window.initReveal();
    }
  }

  // ─── LOAD STRATEGY ───────────────────────────────
  // 1. Try fetch('data/products.json')  — works over HTTP (dev server / live site)
  // 2. Fall back to window.PRODUCTS    — works when opened as a local file://

  if (typeof fetch !== 'undefined') {
    fetch('data/products.json')
      .then(function (r) {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.json();
      })
      .then(renderAll)
      .catch(function () {
        // fetch failed (likely file:// protocol) — use the pre-loaded global
        renderAll(window.PRODUCTS || []);
      });
  } else {
    renderAll(window.PRODUCTS || []);
  }


  // ─── CARD BUILDER ────────────────────────────────
  function buildCard(product, variant, index) {
    var isPlo    = product.collection === 'P-Lo';
    var isSold   = product.status === 'sold';
    var hasHover = Array.isArray(product.views) && product.views.length >= 2;
    var dotCount = Math.min(Array.isArray(product.views) ? product.views.length : 1, 3);

    // ── Image container ──────────────────────────
    var imgWrap = el('div', 'card-img-wrap' + (variant === 'tall' ? ' card-tall' : ''));

    // Front image
    var mainImg = el('img', 'main-img');
    mainImg.src     = (product.views && product.views[0]) || '';
    mainImg.alt     = product.name || '';
    mainImg.loading = 'lazy';
    imgWrap.appendChild(mainImg);

    // Hover image (crossfades in on hover)
    if (hasHover) {
      var hoverImg = el('img', 'hover-img');
      hoverImg.src     = product.views[1];
      hoverImg.alt     = (product.name || '') + ' \u2014 detail view';
      hoverImg.loading = 'lazy';
      imgWrap.appendChild(hoverImg);

      // Gallery dots
      var dots = el('div', 'card-dots');
      dots.setAttribute('aria-hidden', 'true');
      for (var d = 0; d < dotCount; d++) {
        dots.appendChild(el('span', 'dot'));
      }
      imgWrap.appendChild(dots);
    }

    // Claimed ribbon
    if (isSold) {
      var soldTag = el('div', 'card-sold-tag');
      soldTag.textContent = 'Claimed';
      imgWrap.appendChild(soldTag);
    }

    // ── Label row ────────────────────────────────
    var infoRow = el('div', 'card-info' + (isPlo ? ' card-info--plo' : ''));

    var textBlock = el('div', 'card-text');

    var nameEl = el('span', 'card-piece-num' + (isPlo ? ' card-piece-num--plo' : ''));
    nameEl.textContent = product.name || '';
    textBlock.appendChild(nameEl);

    // Show medium only if it has been filled in (not a placeholder)
    if (product.medium && product.medium.indexOf('ENTER') === -1 && product.medium.indexOf('[') === -1) {
      var medEl = el('span', 'card-medium');
      medEl.textContent = product.medium;
      textBlock.appendChild(medEl);
    }

    infoRow.appendChild(textBlock);

    if (isSold) {
      var soldLbl = el('span', 'card-sold-label');
      soldLbl.textContent = 'This piece found its person';
      infoRow.appendChild(soldLbl);
    } else {
      var btn = el('a', 'btn-inquire' + (isPlo ? ' btn-inquire--plo' : ''));
      btn.href                      = '#contact';
      btn.textContent               = 'Reserve this piece';
      btn.dataset.productId         = product.id;
      btn.dataset.productName       = product.name || '';
      btn.dataset.productCollection = product.collection || '';
      btn.dataset.productThumb      = (product.views && product.views[0]) || '';
      infoRow.appendChild(btn);
    }

    // ── Card wrapper ─────────────────────────────
    var card = el('div', 'product-card reveal' + (isSold ? ' card--sold' : ''));
    card.dataset.lightbox      = JSON.stringify(product.views || []);
    card.dataset.productId     = product.id;
    card.style.transitionDelay = (index % 6) * 80 + 'ms';

    card.appendChild(imgWrap);
    card.appendChild(infoRow);
    return card;
  }

  // ─── TINY HELPER ─────────────────────────────────
  function el(tag, className) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    return node;
  }

})();
