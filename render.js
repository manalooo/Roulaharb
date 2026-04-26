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

      var items = products.filter(function (p) { return p.category === section.category; });

      // ── WEARABLES: new collection first, then archive ──
      if (section.category === 'wearables') {
        // Named living subcollections stay in new collection (even if sold — shows "found its person").
        // Unnamed/blank subcollection sold pieces go to The Archive.
        var NEW_SUBS = ['Roma', 'Atelier', 'Japan', 'Jaipur', 'Oxford', 'Bretagne'];
        var newItems     = items.filter(function (p) { return NEW_SUBS.indexOf(p.subcollection) !== -1 || p.status !== 'sold'; });
        var archiveItems = items.filter(function (p) { return NEW_SUBS.indexOf(p.subcollection) === -1 && p.status === 'sold'; });
        var cardIndex    = 0;

        // New Collection — grouped by subcollection with headers
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

        // Archive divider + collapsible grid
        if (archiveItems.length) {
          var divider = el('div', 'archive-divider reveal');
          divider.innerHTML =
            '<div class="archive-divider-rule"></div>' +
            '<div class="archive-divider-center">' +
              '<span class="archive-divider-label">The Archive</span>' +
              '<p class="archive-divider-sub">Each piece below has found its collector — shown here as a testament to the work.</p>' +
            '</div>' +
            '<div class="archive-divider-rule"></div>';
          container.appendChild(divider);

          // Group archive items by subcollection
          var archiveGroups = {};
          var archiveOrder  = [];
          archiveItems.forEach(function (p) {
            var key = p.subcollection || '';
            if (!archiveGroups[key]) { archiveGroups[key] = []; archiveOrder.push(key); }
            archiveGroups[key].push(p);
          });

          // Deduplicate order (named subcollections first, then ungrouped)
          var seenA = {}, orderedArchiveKeys = [];
          archiveOrder.forEach(function (k) {
            if (!seenA[k] && k !== '') { seenA[k] = true; orderedArchiveKeys.push(k); }
          });
          if (archiveGroups['']) orderedArchiveKeys.push('');

          // Collapsible wrapper — only first 2 rows visible by default
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
            // Archive uses 4-column grid (denser, respectful of past work)
            var archiveGrid = el('div', 'jookh-grid jookh-grid-4 jookh-subgrid archive-grid');
            archiveGroups[key].forEach(function (product) {
              archiveGrid.appendChild(buildCard(product, '', cardIndex++, { isArchive: true }));
            });
            archiveWrap.appendChild(archiveGrid);
          });

          container.appendChild(archiveWrap);

          // See More toggle button
          var toggleBtn = el('button', 'archive-toggle');
          toggleBtn.type = 'button';
          toggleBtn.innerHTML = '<span class="archive-toggle-label">See More of the Archive</span>' +
                                '<span class="archive-toggle-icon">↓</span>';
          toggleBtn.addEventListener('click', function () {
            var expanded = archiveWrap.classList.toggle('expanded');
            toggleBtn.classList.toggle('is-expanded', expanded);
            toggleBtn.querySelector('.archive-toggle-label').textContent =
              expanded ? 'Show Less' : 'See More of the Archive';
          });
          container.appendChild(toggleBtn);
        }
        return; // skip the generic logic below
      }

      // ── All other categories (original logic) ────────
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

    // Initialise scroll-reveal on the newly created cards
    if (typeof window.initReveal === 'function') {
      window.initReveal();
    }
  }

  // ─── LOAD STRATEGY ───────────────────────────────
  // 1. Try /api/products       — Cloudflare D1-backed (production)
  // 2. Try data/products.json  — static fallback (dev server, GitHub Pages, etc.)
  // 3. Fall back to window.PRODUCTS — works when opened as a local file://

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
    var isArchive     = !!opts.isArchive;   // archive mode — no Claimed ribbon
    var isNew         = !!opts.isNew;       // new collection badge
    var isWearable    = product.category === 'wearables';
    var hasSecondView = Array.isArray(product.views) && product.views.length >= 2;

    // ── Image container ──────────────────────────
    var wrapClass = 'card-img-wrap' + (isWearable && hasSecondView ? ' card-crossfade' : '');
    var imgWrap = el('div', wrapClass);

    // Main image — cover fill, consistent ratio
    var mainImg = el('img', 'main-img');
    mainImg.src     = (product.views && product.views[0]) || '';
    mainImg.alt     = product.name || '';
    mainImg.loading = 'lazy';
    imgWrap.appendChild(mainImg);

    if (isWearable && hasSecondView) {
      // Crossfade to second view on hover — art speaks alone
      var hoverImg = el('img', 'hover-img');
      hoverImg.src     = product.views[1];
      hoverImg.alt     = (product.name || '') + ' \u2014 back view';
      hoverImg.loading = 'lazy';
      imgWrap.appendChild(hoverImg);
    }
    // All other categories: no overlay — pure image, luxury depth shift on hover

    // "Claimed" ribbon only on non-archive sold cards (scarves/bags/pillows)
    if (isSold && !isArchive) {
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

    // Price line (only if filled in — hide ENTER PRICE HERE placeholder)
    var priceRaw = product.price != null ? String(product.price) : '';
    if (priceRaw && priceRaw.indexOf('ENTER') === -1 && priceRaw.trim() !== '') {
      var priceEl = el('span', 'card-price' + (isPlo ? ' card-price--plo' : ''));
      // If it's a number, prefix with $
      var priceNum = parseFloat(priceRaw);
      priceEl.textContent = isNaN(priceNum) ? priceRaw : '$' + priceNum.toLocaleString('en-US');
      infoRow.appendChild(priceEl);
    }

    if (isSold && isArchive) {
      // Archive pieces: no CTA, no label — the section header tells the story
    } else if (isSold) {
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
    var card = el('div', 'product-card reveal' + (isSold ? ' card--sold' : '') + (isArchive ? ' card--archive' : ''));
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
