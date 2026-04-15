/* =====================================================
   ROULA HARB — render.js
   Reads window.PRODUCTS (data/products.js) and builds
   all product cards dynamically. Never edit cards here —
   edit the data in data/products.js instead.
   ===================================================== */

(function () {
  'use strict';

  var products = window.PRODUCTS || [];

  if (!products.length) {
    console.warn('render.js: window.PRODUCTS is empty. Check data/products.js.');
    return;
  }

  // ─── SECTION MAP ─────────────────────────────────
  // category → { containerId, gridClasses, cardVariant }
  var sections = [
    { category: 'scarves',   id: 'scarves-grid',   classes: 'jookh-grid',               variant: 'tall'   },
    { category: 'bags',      id: 'bags-grid',      classes: 'jookh-grid jookh-grid-4',  variant: ''       },
    { category: 'wearables', id: 'wearables-grid', classes: 'jookh-grid',               variant: 'tall'   },
    { category: 'pillows',   id: 'plo-grid',       classes: 'collection-grid',           variant: ''       }
  ];

  sections.forEach(function (section) {
    var container = document.getElementById(section.id);
    if (!container) return;

    // Apply grid classes
    section.classes.split(' ').forEach(function (cls) {
      if (cls) container.classList.add(cls);
    });

    // Filter and render
    var items = products.filter(function (p) { return p.category === section.category; });
    items.forEach(function (product, i) {
      container.appendChild(buildCard(product, section.variant, i));
    });
  });


  // ─── CARD BUILDER ────────────────────────────────
  // Takes one product object, returns one DOM element.

  function buildCard(product, variant, index) {
    var isPlo    = product.collection === 'P-Lo';
    var isSold   = product.status === 'sold';
    var hasHover = product.views.length >= 2;
    var dotCount = Math.min(product.views.length, 3);

    // ── Image container ──────────────────────────
    var imgWrap = el('div', 'card-img-wrap' + (variant === 'tall' ? ' card-tall' : ''));

    // Front image (always shown)
    var mainImg = el('img', 'main-img');
    mainImg.src     = product.views[0];
    mainImg.alt     = product.name;
    mainImg.loading = 'lazy';
    imgWrap.appendChild(mainImg);

    // Back/detail image (fades in on hover)
    if (hasHover) {
      var hoverImg = el('img', 'hover-img');
      hoverImg.src     = product.views[1];
      hoverImg.alt     = product.name + ' — detail view';
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

    // "Sold" ribbon
    if (isSold) {
      var soldTag = el('div', 'card-sold-tag');
      soldTag.textContent = 'Sold';
      imgWrap.appendChild(soldTag);
    }

    // ── Label row ────────────────────────────────
    var infoRow = el('div', 'card-info' + (isPlo ? ' card-info--plo' : ''));

    var textBlock = el('div', 'card-text');

    var nameEl = el('span', 'card-piece-num' + (isPlo ? ' card-piece-num--plo' : ''));
    nameEl.textContent = product.name;
    textBlock.appendChild(nameEl);

    if (product.medium && product.medium.indexOf('[') === -1) {
      // Only show medium if it's been filled in (not a placeholder)
      var medEl = el('span', 'card-medium');
      medEl.textContent = product.medium;
      textBlock.appendChild(medEl);
    }

    infoRow.appendChild(textBlock);

    // Inquire button or Sold label
    if (isSold) {
      var soldLbl = el('span', 'card-sold-label');
      soldLbl.textContent = 'Sold';
      infoRow.appendChild(soldLbl);
    } else {
      var btn = el('a', 'btn-inquire' + (isPlo ? ' btn-inquire--plo' : ''));
      btn.href                        = '#contact';
      btn.textContent                 = 'Inquire';
      btn.dataset.productId           = product.id;
      btn.dataset.productName         = product.name;
      btn.dataset.productCollection   = product.collection;
      btn.dataset.productThumb        = product.views[0];
      infoRow.appendChild(btn);
    }

    // ── Card wrapper ─────────────────────────────
    var card = el('div', 'product-card reveal' + (isSold ? ' card--sold' : ''));
    card.dataset.lightbox      = JSON.stringify(product.views);
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
