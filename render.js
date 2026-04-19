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
    var isPlo  = product.collection === 'P-Lo';
    var isSold = product.status === 'sold';

    // ── Image container ──────────────────────────
    var imgWrap = el('div', 'card-img-wrap');

    // Main image — cover fill, consistent ratio
    var mainImg = el('img', 'main-img');
    mainImg.src     = (product.views && product.views[0]) || '';
    mainImg.alt     = product.name || '';
    mainImg.loading = 'lazy';
    imgWrap.appendChild(mainImg);

    // Glassmorphism hover overlay with VIEW DETAILS
    if (!isSold) {
      var glass = el('div', 'card-glass-overlay');
      var viewBtn = el('span', 'card-view-btn');
      viewBtn.textContent = 'View Details';
      glass.appendChild(viewBtn);
      imgWrap.appendChild(glass);
    }

    // Claimed ribbon
    if (isSold) {
      var soldTag = el('div', 'card-sold-tag');
      soldTag.textContent = 'Claimed';
      imgWrap.appendChild(soldTag);
    }

    // ── Info row — centred under the image ───────
    var infoRow = el('div', 'card-info' + (isPlo ? ' card-info--plo' : ''));

    var nameEl = el('span', 'card-piece-num' + (isPlo ? ' card-piece-num--plo' : ''));
    nameEl.textContent = product.name || '';
    infoRow.appendChild(nameEl);

    // Medium line (only if filled in)
    if (product.medium && product.medium.indexOf('ENTER') === -1 && product.medium.indexOf('[') === -1) {
      var medEl = el('span', 'card-medium');
      medEl.textContent = product.medium;
      infoRow.appendChild(medEl);
    }

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
