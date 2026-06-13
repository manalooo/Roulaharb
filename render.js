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

      // ── WEARABLES: new collection first, then archive ──
      if (section.category === 'wearables') {
        var NEW_SUBS = ['Roma', 'Atelier', 'Japan', 'Jaipur', 'Oxford', 'Bretagne'];
        var newItems     = items.filter(function (p) { return NEW_SUBS.indexOf(p.subcollection) !== -1 || p.status !== 'sold'; });
        var archiveItems = items.filter(function (p) { return NEW_SUBS.indexOf(p.subcollection) === -1 && p.status === 'sold'; });
        var cardIndex    = 0;

        if (newItems.length) {
          var newGroups = {};
          var newOrder  = [];
          newItems.forEach(function (p) {
            var key = p.subcollection || 'Atelier';
            if (!newGroups[key]) { newGroups[key] = []; newOrder.push(key); }
            newGroups[key].push(p);
          });

          newOrder.forEach(function (key) {
            var subHeader = el('div', 'jookh-subcat-header reveal');
            var subTitle  = el('h4',  'jookh-subcat-title');
            subTitle.textContent = key;
            var subLine   = el('div', 'jookh-subcat-line');
            subHeader.appendChild(subTitle);
            subHeader.appendChild(subLine);
            container.appendChild(subHeader);

            var grid = el('div', section.classes + ' jookh-subgrid');
            newGroups[key].forEach(function (product) {
              grid.appendChild(buildCard(product, section.variant, cardIndex++));
            });
            container.appendChild(grid);
          });
        }

        var archiveContainer = document.getElementById('archive-grid') || container;
        if (archiveItems.length) {
          var divider = el('div', 'archive-divider reveal');
          divider.innerHTML =
            '<div class="archive-divider-rule"></div>' +
            '<div class="archive-divider-center">' +
              '<span class="archive-divider-label">The Archive</span>' +
              '<p class="archive-divider-sub">Each piece below has found its collector — shown here as a testament to the work.</p>' +
              '<p class="archive-divider-cta"><em>Drawn to a piece? Roula reproduces select archive styles on commission — <a href="#contact">write to her</a> to inquire.</em></p>' +
            '</div>' +
            '<div class="archive-divider-rule"></div>';
          archiveContainer.appendChild(divider);

          var archiveGroups = {};
          var archiveOrder  = [];
          archiveItems.forEach(function (p) {
            var key = p.subcollection || '';
            if (!archiveGroups[key]) { archiveGroups[key] = []; archiveOrder.push(key); }
            archiveGroups[key].push(p);
          });

          var seenA = {}, orderedArchiveKeys = [];
          archiveOrder.forEach(function (k) {
            if (!seenA[k] && k !== '') { seenA[k] = true; orderedArchiveKeys.push(k); }
          });
          if (archiveGroups['']) orderedArchiveKeys.push('');

          var archiveWrap = el('div', 'archive-wrap');

          orderedArchiveKeys.forEach(function (key) {
            if (key) {
              var aHeader = el('div', 'jookh-subcat-header archive-subcat-header reveal');
              var aTitle  = el('h4',  'jookh-subcat-title');
              aTitle.textContent = key;
              var aLine   = el('div', 'jookh-subcat-line');
              aHeader.appendChild(aTitle);
              aHeader.appendChild(aLine);
              archiveWrap.appendChild(aHeader);
            }
            var archiveGrid = el('div', 'jookh-grid jookh-grid-4 jookh-subgrid archive-grid');
            archiveGroups[key].forEach(function (product) {
              archiveGrid.appendChild(buildCard(product, '', cardIndex++, { isArchive: true }));
            });
            archiveWrap.appendChild(archiveGrid);
          });

          archiveContainer.appendChild(archiveWrap);

          var toggleBtn = el('button', 'archive-toggle');
          toggleBtn.type = 'button';
          toggleBtn.setAttribute('aria-expanded', 'false');
          toggleBtn.innerHTML = '<span class="archive-toggle-label">See More of the Archive</span>' +
                                '<span class="archive-toggle-icon" aria-hidden="true">↓</span>';
          toggleBtn.addEventListener('click', function () {
            var expanded = archiveWrap.classList.toggle('expanded');
            toggleBtn.classList.toggle('is-expanded', expanded);
            toggleBtn.setAttribute('aria-expanded', String(expanded));
            toggleBtn.querySelector('.archive-toggle-label').textContent =
              expanded ? 'Show Less' : 'See More of the Archive';
          });
          archiveContainer.appendChild(toggleBtn);
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
  function buildCard(product, variant, index, opts) {
    opts = opts || {};
    var isPlo         = product.collection === 'P-Lo';
    var isSold        = product.status === 'sold';
    var isArchive     = !!opts.isArchive;
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

    if (isSold && !isArchive) {
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

    if (isSold && isArchive) {
      // Archive: no CTA
    } else if (isSold) {
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
    var card = el('div', 'product-card reveal' + (isSold ? ' card--sold' : '') + (isArchive ? ' card--archive' : ''));
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
