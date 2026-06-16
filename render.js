/* =====================================================
   ROULA HARB — render.js (v3)
   Renders the Arrivals (available) and Archive (sold) grids.
   ===================================================== */

(function () {
  'use strict';

  // Image cache-busting.
  //  · Local dev (localhost / file://): use a per-load timestamp so edited/cropped
  //    images always show on a plain refresh — no version bump needed.
  //  · Production: tie to this script's ?v= build token so images cache efficiently
  //    and only refresh when the version is bumped.
  var IS_LOCAL = location.protocol === 'file:' ||
    /^(localhost|127\.0\.0\.1|\[::1\]|0\.0\.0\.0)$/.test(location.hostname);
  var ASSET_V = IS_LOCAL ? String(Date.now()) : (function () {
    try {
      var s = document.currentScript || document.querySelector('script[src*="render.js"]');
      var m = s && s.src.match(/[?&]v=([^&]+)/);
      return m ? m[1] : '';
    } catch (e) { return ''; }
  })();
  function withV(url) {
    if (!url || !ASSET_V || /^https?:\/\//.test(url)) return url;   // skip absolute/CDN urls
    return url + (url.indexOf('?') === -1 ? '?' : '&') + 'v=' + ASSET_V;
  }

  var CATEGORY_ORDER = ['wearables', 'scarves', 'bags', 'pillows', 'paintings'];
  var CATEGORY_LABELS = {
    wearables: 'Wearables',
    scarves: 'Scarves',
    bags: 'Bags',
    pillows: 'Pillows',
    paintings: 'Paintings'
  };
  var LINE_ORDER = ['Canvas', 'Luxurious', "Levi's x Jookh", 'Essential', '24 Carats'];

  // ─── RENDER ALL ──────────────────────────────────
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
      if (!out.medium && out.material) out.medium = out.material;
      return out;
    }).filter(function (p) { return p.id && p.category; });   // skip empty-ID artifacts

    renderArrivals(normalizedProducts);
    renderArchive(normalizedProducts);
    wireFilters();

    if (typeof window.initReveal === 'function') window.initReveal();
  }

  // ─── ARRIVALS ────────────────────────────────────
  function renderArrivals(products) {
    var container = document.getElementById('arrivals-grid');
    if (!container) return;
    container.innerHTML = '';

    var available = products.filter(function (p) { return p.status !== 'sold'; });
    if (!available.length) {
      container.innerHTML = '<p class="empty-grid-note">No pieces available at the moment. Explore the archive or get in touch for commissions.</p>';
      return;
    }

    var cardIndex = 0;
    CATEGORY_ORDER.forEach(function (category) {
      var items = available.filter(function (p) { return p.category === category; });
      if (!items.length) return;
      cardIndex = renderCategoryGroup(container, items, category, 'arrivals', cardIndex);
    });
  }

  // ─── ARCHIVE ─────────────────────────────────────
  function renderArchive(products) {
    var container = document.getElementById('archive-grid');
    if (!container) return;
    container.innerHTML = '';

    var sold = products.filter(function (p) { return p.status === 'sold'; });
    if (!sold.length) {
      container.innerHTML = '<p class="empty-grid-note">No claimed pieces yet.</p>';
      return;
    }

    var cardIndex = 0;
    CATEGORY_ORDER.forEach(function (category) {
      var items = sold.filter(function (p) { return p.category === category; });
      if (!items.length) return;
      cardIndex = renderCategoryGroup(container, items, category, 'archive', cardIndex);
    });
  }

  // ─── RENDER ONE CATEGORY GROUP ───────────────────
  function renderCategoryGroup(container, items, category, section, cardIndex) {
    var group = el('div', section + '-category-group');
    group.dataset.category = category;

    // Category header
    var catHeader = el('div', 'jookh-cat-header reveal');
    var catTitle  = el('h3',  'jookh-cat-title');
    catTitle.textContent = CATEGORY_LABELS[category] || category;
    var catLine   = el('div', 'jookh-cat-line');
    catHeader.appendChild(catTitle);
    catHeader.appendChild(catLine);
    group.appendChild(catHeader);

    if (category === 'wearables' && section === 'archive') {
      // ── Two-level navigation: Main Collection (line) → Theme (subcollection) → pieces ──
      var refreshFx = function () {
        if (typeof window.initReveal === 'function') window.initReveal();
        if (typeof window.__rerollStickers === 'function') { window.__rerollStickers(); setTimeout(window.__rerollStickers, 80); }
      };

      // Group by line, then by theme within line (preserve CSV order for themes).
      var lineMap = {}, linesSeen = [];
      items.forEach(function (p) {
        var line = (p.collection_line || 'Essential').trim() || 'Essential';
        var rawTheme = (p.subcollection || '').trim();
        var themeKey = rawTheme ? rawTheme.toLowerCase() : '__atelier__';
        if (!lineMap[line]) { lineMap[line] = { themes: {}, themeOrder: [] }; linesSeen.push(line); }
        var L = lineMap[line];
        if (!L.themes[themeKey]) { L.themes[themeKey] = { name: rawTheme, items: [] }; L.themeOrder.push(themeKey); }
        L.themes[themeKey].items.push(p);
      });

      linesSeen.sort(function (a, b) {
        var ai = LINE_ORDER.indexOf(a), bi = LINE_ORDER.indexOf(b);
        return ((ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi)) || a.localeCompare(b);
      });

      var lineNav    = el('div', 'collection-nav collection-nav--lines reveal');
      lineNav.setAttribute('role', 'tablist');
      lineNav.setAttribute('aria-label', 'Main collections');
      var blocksWrap = el('div', 'line-blocks');

      linesSeen.forEach(function (line, li) {
        var L = lineMap[line];
        var lineFirst = li === 0;
        var lineTotal = L.themeOrder.reduce(function (n, tk) { return n + L.themes[tk].items.length; }, 0);

        var lineTab = el('button', 'collection-tab collection-tab--line' + (lineFirst ? ' is-active' : ''));
        lineTab.type = 'button';
        lineTab.dataset.line = line;
        lineTab.setAttribute('role', 'tab');
        lineTab.setAttribute('aria-selected', lineFirst ? 'true' : 'false');
        lineTab.innerHTML = '<span class="collection-tab-name">' + displaySubName(line) + '</span>' +
                            '<span class="collection-tab-count">' + lineTotal + '</span>';
        lineNav.appendChild(lineTab);

        var block = el('div', 'line-block' + (lineFirst ? ' is-active' : ''));
        block.dataset.line = line;

        var multiTheme = L.themeOrder.length > 1;
        var themeNav   = el('div', 'collection-nav collection-nav--themes');
        themeNav.setAttribute('role', 'tablist');
        var themePanels = el('div', 'collection-panels');

        L.themeOrder.forEach(function (tk, ti) {
          var T = L.themes[tk];
          var themeFirst = ti === 0;

          if (multiTheme) {
            var themeTab = el('button', 'collection-tab' + (themeFirst ? ' is-active' : ''));
            themeTab.type = 'button';
            themeTab.dataset.theme = tk;
            themeTab.setAttribute('role', 'tab');
            themeTab.setAttribute('aria-selected', themeFirst ? 'true' : 'false');
            themeTab.innerHTML = '<span class="collection-tab-name">' + displaySubName(T.name) + '</span>' +
                                 '<span class="collection-tab-count">' + T.items.length + '</span>';
            themeNav.appendChild(themeTab);
          }

          var panel = el('div', 'collection-panel' + (themeFirst ? ' is-active' : ''));
          panel.dataset.theme = tk;
          var grid = el('div', 'jookh-grid jookh-subgrid');
          T.items.forEach(function (product) { grid.appendChild(buildCard(product, 'tall', cardIndex++)); });
          panel.appendChild(grid);
          themePanels.appendChild(panel);
        });

        if (multiTheme) block.appendChild(themeNav);
        block.appendChild(themePanels);

        Array.from(themeNav.querySelectorAll('.collection-tab')).forEach(function (tt) {
          tt.addEventListener('click', function () {
            var tk = tt.dataset.theme;
            Array.from(themeNav.querySelectorAll('.collection-tab')).forEach(function (x) {
              var on = x === tt; x.classList.toggle('is-active', on); x.setAttribute('aria-selected', on ? 'true' : 'false');
            });
            Array.from(themePanels.querySelectorAll('.collection-panel')).forEach(function (pnl) {
              pnl.classList.toggle('is-active', pnl.dataset.theme === tk);
            });
            refreshFx();
          });
        });

        blocksWrap.appendChild(block);
      });

      Array.from(lineNav.querySelectorAll('.collection-tab--line')).forEach(function (lt) {
        lt.addEventListener('click', function () {
          var line = lt.dataset.line;
          Array.from(lineNav.querySelectorAll('.collection-tab--line')).forEach(function (x) {
            var on = x === lt; x.classList.toggle('is-active', on); x.setAttribute('aria-selected', on ? 'true' : 'false');
          });
          Array.from(blocksWrap.querySelectorAll('.line-block')).forEach(function (blk) {
            blk.classList.toggle('is-active', blk.dataset.line === line);
          });
          refreshFx();
        });
      });

      group.appendChild(lineNav);
      group.appendChild(blocksWrap);
    } else if (category === 'wearables') {
      // Arrivals: group by real CSV subcollection name, preserving CSV order ('(none)' → Atelier, last).
      var arrSubs = {}, arrOrder = [];
      items.forEach(function (p) {
        var raw = (p.subcollection || '').trim();
        var key = raw ? raw.toLowerCase() : '__atelier__';
        if (!arrSubs[key]) { arrSubs[key] = { name: raw, items: [] }; arrOrder.push(key); }
        arrSubs[key].items.push(p);
      });
      arrOrder.sort(function (a, b) {   // keep first-seen order but push Atelier to the end
        if (a === '__atelier__') return 1;
        if (b === '__atelier__') return -1;
        return 0;
      });

      // Filter chips so visitors can jump straight to a subcollection.
      var subFilter = el('div', 'collection-nav arrivals-sub-filter reveal');
      subFilter.setAttribute('role', 'tablist');
      subFilter.setAttribute('aria-label', 'Filter wearables');
      var allChip = el('button', 'collection-tab is-active');
      allChip.type = 'button';
      allChip.dataset.sub = '__all__';
      allChip.innerHTML = '<span class="collection-tab-name">All</span><span class="collection-tab-count">' + items.length + '</span>';
      subFilter.appendChild(allChip);

      var subBlocks = el('div', 'arr-sub-blocks');
      arrOrder.forEach(function (key) {
        var g = arrSubs[key];
        var chip = el('button', 'collection-tab');
        chip.type = 'button';
        chip.dataset.sub = key;
        chip.innerHTML = '<span class="collection-tab-name">' + displaySubName(g.name) + '</span><span class="collection-tab-count">' + g.items.length + '</span>';
        subFilter.appendChild(chip);

        var block = el('div', 'arr-sub-block');
        block.dataset.sub = key;
        block.appendChild(buildSubcatHeader(displaySubName(g.name), false));
        var grid = el('div', 'jookh-grid jookh-subgrid');
        g.items.forEach(function (p) { grid.appendChild(buildCard(p, 'tall', cardIndex++)); });
        block.appendChild(grid);
        subBlocks.appendChild(block);
      });

      Array.from(subFilter.querySelectorAll('.collection-tab')).forEach(function (chip) {
        chip.addEventListener('click', function () {
          var sub = chip.dataset.sub;
          Array.from(subFilter.querySelectorAll('.collection-tab')).forEach(function (c) {
            var on = c === chip; c.classList.toggle('is-active', on); c.setAttribute('aria-selected', on ? 'true' : 'false');
          });
          Array.from(subBlocks.querySelectorAll('.arr-sub-block')).forEach(function (b) {
            b.style.display = (sub === '__all__' || b.dataset.sub === sub) ? '' : 'none';
          });
          if (typeof window.initReveal === 'function') window.initReveal();
          if (typeof window.__rerollStickers === 'function') { window.__rerollStickers(); setTimeout(window.__rerollStickers, 80); }
        });
      });

      group.appendChild(subFilter);
      group.appendChild(subBlocks);
    } else {
      var hasSub = items.some(function (p) { return p.subcollection; });
      if (hasSub) {
        var groups = {}, order = [];
        items.forEach(function (p) {
          var key = p.subcollection || '';
          if (!groups[key]) { groups[key] = []; order.push(key); }
          groups[key].push(p);
        });
        var seen = {}, orderedKeys = [];
        order.forEach(function (k) { if (k && !seen[k]) { seen[k] = true; orderedKeys.push(k); } });
        if (groups['']) orderedKeys.push('');

        orderedKeys.forEach(function (key) {
          if (key) group.appendChild(buildSubcatHeader(key, section === 'archive'));
          var grid = el('div', gridClassesFor(category));
          groups[key].forEach(function (product) {
            grid.appendChild(buildCard(product, '', cardIndex++));
          });
          group.appendChild(grid);
          appendSeeMore(group, grid, groups[key].length, section);
        });
      } else {
        var grid = el('div', gridClassesFor(category));
        items.forEach(function (product) {
          grid.appendChild(buildCard(product, '', cardIndex++));
        });
        group.appendChild(grid);
        appendSeeMore(group, grid, items.length, section);
      }
    }

    container.appendChild(group);
    return cardIndex;
  }

  function gridClassesFor(category) {
    if (category === 'bags') return 'jookh-grid jookh-grid-4 jookh-subgrid';
    if (category === 'pillows' || category === 'paintings') return 'collection-grid jookh-subgrid';
    return 'jookh-grid jookh-subgrid';
  }

  // Tidy a subcollection label for display: trim, fix ALL-CAPS to Title Case.
  function displaySubName(raw) {
    var t = (raw || '').trim();
    if (!t) return 'Atelier';
    if (t === t.toUpperCase()) {
      t = t.toLowerCase().replace(/\b\w/g, function (c) { return c.toUpperCase(); });
    }
    return t;
  }

  function buildSubcatHeader(title, isArchive) {
    var cls = 'jookh-subcat-header reveal' + (isArchive ? ' archive-subcat-header' : '');
    var header = el('div', cls);
    var h = el('h4', 'jookh-subcat-title');
    h.textContent = title;
    var line = el('div', 'jookh-subcat-line');
    header.appendChild(h);
    header.appendChild(line);
    return header;
  }

  // Collapse a grid to a single row on Arrivals, with a See-more toggle.
  var ARRIVALS_ROW = 4;
  function appendSeeMore(parent, grid, count, section) {
    if (section !== 'arrivals' || count <= ARRIVALS_ROW) return;
    var cards = grid.querySelectorAll('.product-card');
    for (var i = ARRIVALS_ROW; i < cards.length; i++) cards[i].classList.add('is-hidden');
    var hidden = count - ARRIVALS_ROW;
    var btn = el('button', 'grid-expand-btn');
    btn.type = 'button';
    btn.setAttribute('aria-expanded', 'false');
    btn.innerHTML = '<span class="btn-text">+ See ' + hidden + ' more</span><span class="arrow" aria-hidden="true">↓</span>';
    btn.addEventListener('click', function () {
      var open = btn.getAttribute('aria-expanded') === 'true';
      btn.setAttribute('aria-expanded', String(!open));
      [].forEach.call(grid.querySelectorAll('.product-card'), function (c, idx) { if (idx >= ARRIVALS_ROW) c.classList.toggle('is-hidden', open); });
      btn.querySelector('.btn-text').textContent = open ? '+ See ' + hidden + ' more' : '− Show fewer';
      if (typeof window.__rerollStickers === 'function') { window.__rerollStickers(); setTimeout(window.__rerollStickers, 80); }
    });
    parent.appendChild(btn);
  }

  // ─── FILTER CHIPS ────────────────────────────────
  function wireFilters() {
    wireCategoryFilters('arrivals-filters', '.arrivals-category-group');
    wireArchiveFilters();
  }

  function wireCategoryFilters(barId, groupSelector) {
    var filterBar = document.getElementById(barId);
    if (!filterBar) return;

    var buttons = Array.from(filterBar.querySelectorAll('.collection-filter-btn'));
    buttons.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var filter = btn.dataset.filter || 'all';
        buttons.forEach(function (b) { b.classList.toggle('is-active', b === btn); });

        document.querySelectorAll(groupSelector).forEach(function (group) {
          var show = filter === 'all' || group.dataset.category === filter;
          group.classList.toggle('is-filtered-out', !show);
        });
      });
    });
  }

  function wireArchiveFilters() {
    var catBar = document.getElementById('archive-filters');
    var subBar = document.getElementById('archive-subcollection-filter');
    var subChips = document.getElementById('archive-subcollection-chips');
    var grid   = document.getElementById('archive-grid');
    if (!catBar || !subBar || !subChips || !grid) return;

    // Collect subcollections per category from rendered cards
    var subsByCat = {};
    grid.querySelectorAll('.archive-category-group').forEach(function (group) {
      var cat = group.dataset.category;
      if (!subsByCat[cat]) subsByCat[cat] = {};
      group.querySelectorAll('.product-card').forEach(function (card) {
        var sub = card.dataset.subcollection;
        if (sub) subsByCat[cat][sub] = true;
      });
    });

    function applyFilter(cat, sub) {
      // Category groups
      document.querySelectorAll('.archive-category-group').forEach(function (group) {
        var showCat = cat === 'all' || group.dataset.category === cat;
        group.classList.toggle('is-filtered-out', !showCat);
      });

      // Cards
      grid.querySelectorAll('.product-card').forEach(function (card) {
        var cardCat = card.closest('.archive-category-group').dataset.category;
        var cardSub = card.dataset.subcollection || '';
        var show = (cat === 'all' || cardCat === cat) && (!sub || cardSub === sub);
        card.classList.toggle('is-filtered-out', !show);
      });

      // Headers
      grid.querySelectorAll('.jookh-subcat-header, .jookh-line-header').forEach(function (header) {
        var next = header.nextElementSibling;
        var hasVisible = false;
        while (next && !next.classList.contains('jookh-subcat-header') && !next.classList.contains('jookh-line-header') && !next.classList.contains('archive-category-group')) {
          if (next.classList.contains('jookh-grid') || next.classList.contains('jookh-subgrid') || next.classList.contains('collection-grid')) {
            if (next.querySelectorAll('.product-card:not(.is-filtered-out)').length > 0) {
              hasVisible = true;
              break;
            }
          }
          next = next.nextElementSibling;
        }
        header.classList.toggle('is-filtered-out', !hasVisible);
      });
    }

    function buildSubChips(category) {
      // Subcollection browsing is now handled by the in-grid collection navigator
      // (collection-nav tabs). Keep this legacy chip-bar hidden to avoid duplication.
      subChips.innerHTML = '';
      subBar.hidden = true;
      return;
      // eslint-disable-next-line no-unreachable
      var subs = subsByCat[category] ? Object.keys(subsByCat[category]).sort(function (a, b) { return a.localeCompare(b); }) : [];
      if (!subs.length) {
        subBar.hidden = true;
        return;
      }

      subBar.hidden = false;
      var allBtn = document.createElement('button');
      allBtn.className = 'collection-filter-btn is-active';
      allBtn.type = 'button';
      allBtn.dataset.sub = '';
      allBtn.textContent = 'All ' + (CATEGORY_LABELS[category] || category);
      subChips.appendChild(allBtn);

      subs.forEach(function (sub) {
        var btn = document.createElement('button');
        btn.className = 'collection-filter-btn';
        btn.type = 'button';
        btn.dataset.sub = sub;
        btn.textContent = sub;
        subChips.appendChild(btn);
      });

      Array.from(subChips.querySelectorAll('.collection-filter-btn')).forEach(function (btn) {
        btn.addEventListener('click', function () {
          var selectedSub = btn.dataset.sub;
          subChips.querySelectorAll('.collection-filter-btn').forEach(function (b) {
            b.classList.toggle('is-active', b === btn);
          });
          applyFilter(category, selectedSub);
        });
      });
    }

    // Category chip clicks
    Array.from(catBar.querySelectorAll('.collection-filter-btn')).forEach(function (btn) {
      btn.addEventListener('click', function () {
        var cat = btn.dataset.filter || 'all';
        catBar.querySelectorAll('.collection-filter-btn').forEach(function (b) {
          b.classList.toggle('is-active', b === btn);
        });
        buildSubChips(cat);
        applyFilter(cat, '');
      });
    });

    // Start with All selected and no subcollection bar
    subBar.hidden = true;
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
      .catch(function () { return tryFetch('data/products.json?_=' + Date.now()); })
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

    var nameText = (product.name || 'Artwork').trim();
    var altMain  = nameText + (isPlo ? ' — hand-painted pillow' : ' — hand-painted wearable art');
    var altHover = nameText + ' — alternate view';

    var wrapClass = 'card-img-wrap' + (isWearable && hasSecondView ? ' card-crossfade' : '');
    var imgWrap = el('div', wrapClass);
    imgWrap.setAttribute('role', 'button');
    imgWrap.setAttribute('tabindex', '0');
    imgWrap.setAttribute('aria-label', 'View ' + nameText + ' in lightbox');

    var mainImg = el('img', 'main-img');
    mainImg.src      = withV((product.views && product.views[0]) || '');
    mainImg.alt      = altMain;
    mainImg.loading  = index < 6 ? 'eager' : 'lazy';
    mainImg.decoding = index < 6 ? 'sync' : 'async';
    imgWrap.appendChild(mainImg);

    if (isWearable && hasSecondView) {
      var hoverImg = el('img', 'hover-img');
      hoverImg.src      = withV(product.views[1]);
      hoverImg.alt      = altHover;
      hoverImg.loading  = 'lazy';
      hoverImg.decoding = 'async';
      imgWrap.appendChild(hoverImg);
    }

    if (isSold) {
      var soldTag = el('div', 'card-sold-tag');
      soldTag.textContent = 'Claimed';
      soldTag.setAttribute('aria-label', 'This piece has been sold');
      imgWrap.appendChild(soldTag);
    }

    var infoRow = el('div', 'card-info' + (isPlo ? ' card-info--plo' : ''));

    var nameEl = el('span', 'card-piece-num' + (isPlo ? ' card-piece-num--plo' : ''));
    nameEl.textContent = product.name || '';
    infoRow.appendChild(nameEl);

    if (product.medium && product.medium.indexOf('ENTER') === -1 && product.medium.indexOf('[') === -1) {
      var medEl = el('span', 'card-medium');
      medEl.textContent = product.medium;
      infoRow.appendChild(medEl);
    }

    // Sold/claimed pieces (the Archive) never show a price — the "Claimed" tag says it all.
    var priceRaw = product.price != null ? String(product.price) : '';
    if (!isSold && priceRaw && priceRaw.indexOf('ENTER') === -1 && priceRaw.trim() !== '') {
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

    var card = el('div', 'product-card reveal' + (isSold ? ' card--sold' : ''));
    card.dataset.lightbox       = JSON.stringify((product.views || []).map(withV));
    card.dataset.productId      = product.id;
    card.dataset.name           = product.name || '';
    card.dataset.subcollection  = product.subcollection || '';
    card.dataset.collectionLine = product.collection_line || 'Essential';
    card.style.transitionDelay  = (index % 6) * 80 + 'ms';

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
