/* =====================================================
   ROULA HARB — render.js (v2)
   Reads product data and builds all product cards dynamically.
   Accessibility-first: proper alt text, ARIA labels, loading hints.
   ===================================================== */

(function () {
  'use strict';

  // ─── SECTION MAP ─────────────────────────────────
  var sections = [
    { category: 'scarves',   id: 'scarves-grid',    classes: 'jookh-grid',               variant: 'tall' },
    { category: 'bags',      id: 'bags-grid',        classes: 'jookh-grid jookh-grid-4',  variant: ''     },
    { category: 'wearables', id: 'wearables-grid',   classes: 'jookh-grid',               variant: 'tall' },
    { category: 'pillows',   id: 'plo-grid',         classes: 'collection-grid',          variant: ''     },
    { category: 'paintings', id: 'paintings-grid',   classes: 'collection-grid',          variant: ''     }
  ];

  // ─── RENDER ALL SECTIONS ─────────────────────────
  function renderAll(products) {
    if (!products || !products.length) {
      console.warn('render.js: no products to display. Check inventory.csv and run node sync-products.js.');
      return;
    }

    var normalizedProducts = products.map(function (p) {
      var out = Object.assign({}, p);
      if (!Array.isArray(out.views) || !out.views.length) {
        var mappedViews = [];
        if (out.images && out.images.main)  mappedViews.push(out.images.main);
        if (out.images && out.images.hover) mappedViews.push(out.images.hover);
        if (out.images && Array.isArray(out.images.extra)) {
          out.images.extra.forEach(function (v) { if (v) mappedViews.push(v); });
        }
        out.views = mappedViews;
      }
      if (!out.medium && out.material) {
        out.medium = out.material;
      }
      return out;
    });

    sections.forEach(function (section) {
      var container = document.getElementById(section.id);
      if (!container) return;

      var items = normalizedProducts.filter(function (p) { return p.category === section.category; });

      // ── WEARABLES: group by subcollection, sold + available together ──
      if (section.category === 'wearables') {
        var cardIndex = 0;
        if (items.length) {
          var groups = {};
          var order  = [];
          items.forEach(function (p) {
            var key = p.subcollection || 'Atelier';
            if (!groups[key]) { groups[key] = []; order.push(key); }
            groups[key].push(p);
          });

          order.forEach(function (key) {
            var subHeader = el('div', 'jookh-subcat-header reveal');
            var subTitle  = el('h4',  'jookh-subcat-title');
            subTitle.textContent = key;
            var subLine   = el('div', 'jookh-subcat-line');
            subHeader.appendChild(subTitle);
            subHeader.appendChild(subLine);
            container.appendChild(subHeader);

            var grid = el('div', section.classes + ' jookh-subgrid');
            groups[key].forEach(function (product) {
              grid.appendChild(buildCard(product, section.variant, cardIndex++));
            });
            container.appendChild(grid);
          });
        }
        return;
      }

      // ── All other categories ───────
      var hasSubcollections = items.some(function (p) { return p.subcollection; });

      if (hasSubcollections) {
        var groups = {};
        var order  = [];
        items.forEach(function (p) {
          var key = p.subcollection || '';
          if (!groups[key]) { groups[key] = []; order.push(key); }
          groups[key].push(p);
        });

        var seen = {};
        var orderedKeys = [];
        order.forEach(function (k) {
          if (!seen[k] && k !== '') { seen[k] = true; orderedKeys.push(k); }
        });
        if (groups['']) orderedKeys.push('');

        var subCardIndex = 0;
        orderedKeys.forEach(function (key) {
          var groupItems = groups[key];
          if (key) {
            var subHeader = el('div', 'jookh-subcat-header reveal');
            var subTitle  = el('h4',  'jookh-subcat-title');
            subTitle.textContent = key;
            var subLine   = el('div', 'jookh-subcat-line');
            subHeader.appendChild(subTitle);
            subHeader.appendChild(subLine);
            container.appendChild(subHeader);
          }
          var grid = el('div', section.classes + ' jookh-subgrid');
          groupItems.forEach(function (product) {
            grid.appendChild(buildCard(product, section.variant, subCardIndex++));
          });
          container.appendChild(grid);
        });

      } else {
        section.classes.split(' ').forEach(function (cls) {
          if (cls) container.classList.add(cls);
        });
        items.forEach(function (product, i) {
          container.appendChild(buildCard(product, section.variant, i));
        });
      }
    });

    if (typeof window.initReveal === 'function') {
      window.initReveal();
    }
    if (typeof window.initCollectionFilters === 'function') {
      window.initCollectionFilters(normalizedProducts);
    }
  }

  // ─── LOAD STRATEGY ───────────────────────────────
  function tryFetch(url) {
    return fetch(url).then(function (r) {
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.json();
    });
  }

  if (typeof fetch !== 'undefined') {
    tryFetch('/api/products')
      .catch(function () { return tryFetch('data/products.json'); })
      .then(renderAll)
      .catch(function () { renderAll(window.PRODUCTS || []); });
  } else {
    renderAll(window.PRODUCTS || []);
  }


  // ─── CARD BUILDER ────────────────────────────────
  function buildCard(product, variant, index) {
    var isPlo         = product.collection === 'P-Lo';
    var isSold        = product.status === 'sold';
    var isWearable    = product.category === 'wearables';
    var hasSecondView = Array.isArray(product.views) && product.views.length >= 2;

    // Determine alt text
    var nameText = (product.name || 'Artwork').trim();
    var altMain = nameText + (isPlo ? ' — hand-painted pillow' : ' — hand-painted wearable art');
    var altHover = nameText + ' — alternate view';

    // ── Image container ──────────────────────────
    var wrapClass = 'card-img-wrap' + (isWearable && hasSecondView ? ' card-crossfade' : '');
    var imgWrap = el('div', wrapClass);
    imgWrap.setAttribute('role', 'button');
    imgWrap.setAttribute('tabindex', '0');
    imgWrap.setAttribute('aria-label', 'View ' + nameText + ' in lightbox');

    // Main image
    var mainImg = el('img', 'main-img');
    mainImg.src     = (product.views && product.views[0]) || '';
    mainImg.alt     = altMain;
    mainImg.loading = index < 6 ? 'eager' : 'lazy';
    mainImg.decoding = index < 6 ? 'sync' : 'async';
    imgWrap.appendChild(mainImg);

    if (isWearable && hasSecondView) {
      var hoverImg = el('img', 'hover-img');
      hoverImg.src     = product.views[1];
      hoverImg.alt     = altHover;
      hoverImg.loading = 'lazy';
      hoverImg.decoding = 'async';
      imgWrap.appendChild(hoverImg);
    }

    if (isSold) {
      var soldTag = el('div', 'card-sold-tag');
      soldTag.textContent = 'Claimed';
      soldTag.setAttribute('aria-label', 'This piece has been sold');
      imgWrap.appendChild(soldTag);
    }

    // ── Info row ───────
    var infoRow = el('div', 'card-info' + (isPlo ? ' card-info--plo' : ''));

    var nameEl = el('span', 'card-piece-num' + (isPlo ? ' card-piece-num--plo' : ''));
    nameEl.textContent = product.name || '';
    infoRow.appendChild(nameEl);

    if (product.medium && product.medium.indexOf('ENTER') === -1 && product.medium.indexOf('[') === -1) {
      var medEl = el('span', 'card-medium');
      medEl.textContent = product.medium;
      infoRow.appendChild(medEl);
    }

    var priceRaw = product.price != null ? String(product.price) : '';
    if (priceRaw && priceRaw.indexOf('ENTER') === -1 && priceRaw.trim() !== '') {
      var priceEl = el('span', 'card-price' + (isPlo ? ' card-price--plo' : ''));
      var priceNum = parseFloat(priceRaw);
      priceEl.textContent = isNaN(priceNum) ? priceRaw : '$' + priceNum.toLocaleString('en-US');
      infoRow.appendChild(priceEl);
    }

    if (isSold) {
      var soldLbl = el('span', 'card-sold-label');
      soldLbl.textContent = 'This piece found its person';
      infoRow.appendChild(soldLbl);
    } else {
      var btn = el('a', 'btn-inquire' + (isPlo ? ' btn-inquire--plo' : ''));
      btn.href                      = '#contact';
      btn.textContent               = 'Reserve this piece';
      btn.setAttribute('role', 'button');
      btn.setAttribute('aria-pressed', 'false');
      btn.dataset.productId         = product.id;
      btn.dataset.productName       = product.name || '';
      btn.dataset.productCollection = product.collection || '';
      btn.dataset.productThumb      = (product.views && product.views[0]) || '';
      infoRow.appendChild(btn);
    }

    // ── Card wrapper ─────────────────────────────
    var card = el('div', 'product-card reveal' + (isSold ? ' card--sold' : ''));
    card.dataset.lightbox         = JSON.stringify(product.views || []);
    card.dataset.productId        = product.id;
    card.dataset.collectionLine   = product.collection_line || 'Essential';
    card.style.transitionDelay    = (index % 6) * 80 + 'ms';

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
