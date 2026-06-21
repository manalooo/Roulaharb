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
    if (!url || /^https?:\/\//.test(url)) return url;               // skip absolute/CDN urls
    if (url.indexOf('images/') === 0) url = '/' + url;              // root-absolute so it works on sub-pages (/collection/, /lookbook/)
    if (!ASSET_V) return url;
    return url + (url.indexOf('?') === -1 ? '?' : '&') + 'v=' + ASSET_V;
  }

  var CATEGORY_ORDER = ['wearables', 'scarves', 'bags', 'pillows', 'paintings'];
  // Two brand worlds: Jookh = wearable art; P·Lo = pillows + paintings.
  var JOOKH_CATS = ['wearables', 'scarves', 'bags'];
  var PLO_CATS = ['pillows', 'paintings'];
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
    renderHighlight(normalizedProducts);
    renderPlo(normalizedProducts);
    renderPloPage(normalizedProducts);
    renderCollectionStats(normalizedProducts);
    wireFilters();   // availability is now folded into the faceted engine in wireArchiveFilters

    if (typeof window.initReveal === 'function') window.initReveal();
  }

  // ─── COLLECTION PAGE: scale statement + availability toggle ──
  function renderCollectionStats(products) {
    var el2 = document.getElementById('collection-stats');
    if (!el2) return;
    var subs = {};
    products.forEach(function (p) { var s = (p.subcollection || '').trim().toLowerCase(); if (s) subs[s] = 1; });
    var avail = products.filter(function (p) { return p.status !== 'sold'; }).length;
    function stat(num, label) { return '<span class="stat"><span class="stat-num">' + num + '</span><span class="stat-label">' + label + '</span></span>'; }
    el2.innerHTML =
      stat(products.length, 'one-of-a-kind works') +
      '<span class="stat-sep" aria-hidden="true">·</span>' +
      stat(Object.keys(subs).length, 'collections') +
      '<span class="stat-sep" aria-hidden="true">·</span>' +
      stat(avail, 'available now');
  }

  function wireCollectionStatus() {
    var bar = document.getElementById('collection-status');
    var grid = document.getElementById('archive-grid');
    if (!bar || !grid) return;
    Array.from(bar.querySelectorAll('.collection-filter-btn')).forEach(function (btn) {
      btn.addEventListener('click', function () {
        var st = btn.dataset.status || 'all';
        bar.querySelectorAll('.collection-filter-btn').forEach(function (b) { b.classList.toggle('is-active', b === btn); });
        grid.classList.remove('show-available', 'show-claimed');
        if (st === 'available') grid.classList.add('show-available');
        else if (st === 'claimed') grid.classList.add('show-claimed');
        if (typeof window.__rerollStickers === 'function') { window.__rerollStickers(); setTimeout(window.__rerollStickers, 80); }
      });
    });
  }

  // ─── HOME COLLECTION HIGHLIGHT ───────────────────
  // Home page: a teaser of the gallery "rooms" — one cover-tile per collection.
  // Each tile deep-links into that room on /collection/; "See more" opens the full page.
  var HOME_ROOMS = 12;   // ~2 rows of collection covers
  function renderHighlight(products) {
    var container = document.getElementById('collection-highlight');
    if (!container) return;
    container.className = 'collection-rooms home-rooms';
    container.innerHTML = '';

    var info = {}, order = [];
    products.forEach(function (p) {
      if (p.category !== 'wearables') return;
      var v = (p.subcollection || '').trim();
      if (!v) return;
      if (!info[v]) { info[v] = { count: 0, cover: (p.views && p.views[0]) || '' }; order.push(v); }
      info[v].count++;
    });

    order.slice(0, HOME_ROOMS).forEach(function (v) {
      var a = document.createElement('a');
      a.className = 'room-tile';
      a.href = '/collection/?c=' + encodeURIComponent(v);
      a.innerHTML =
        '<span class="room-img" style="background-image:url(\'' + withV(info[v].cover) + '\')"></span>' +
        '<span class="room-meta">' +
          '<span class="room-name">' + displaySubName(v) + '</span>' +
          '<span class="room-count">' + info[v].count + ' pieces</span>' +
        '</span>';
      container.appendChild(a);
    });
  }

  // ─── P-LO (home): the sister brand — pillows + paintings ──
  function renderPlo(products) {
    var container = document.getElementById('plo-grid');
    if (!container) return;
    container.innerHTML = '';
    // Home is a teaser — show a handful of each; the full set lives on /p-lo/.
    var PLO_HOME_LIMIT = 6;
    var idx = 0, any = false;
    [['pillows', 'Pillows'], ['paintings', 'Paintings']].forEach(function (g) {
      var items = products.filter(function (p) { return p.category === g[0]; });
      if (!items.length) return;
      any = true;
      container.appendChild(buildSubcatHeader(g[1], false));
      var grid = el('div', 'collection-grid plo-subgrid');
      items.slice(0, PLO_HOME_LIMIT).forEach(function (p) { grid.appendChild(buildCard(p, '', idx++)); });
      container.appendChild(grid);
    });
    if (!any) { var sec = document.getElementById('plo'); if (sec) sec.style.display = 'none'; }
  }

  // ─── P-LO PAGE (/p-lo/): the full pillows + paintings catalogue ──
  function renderPloPage(products) {
    var container = document.getElementById('plo-page-grid');
    if (!container) return;
    container.innerHTML = '';
    var idx = 0;
    [['pillows', 'Pillows'], ['paintings', 'Paintings']].forEach(function (g) {
      var items = products.filter(function (p) { return p.category === g[0]; });
      if (!items.length) return;
      container.appendChild(buildSubcatHeader(g[1], false));
      var grid = el('div', 'collection-grid plo-subgrid');
      items.forEach(function (p) { grid.appendChild(buildCard(p, '', idx++)); });
      container.appendChild(grid);
    });
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
    JOOKH_CATS.forEach(function (category) {   // Shop = Jookh wearable art only; P·Lo has its own section
      var items = available.filter(function (p) { return p.category === category; });
      if (!items.length) return;
      cardIndex = renderCategoryGroup(container, items, category, 'arrivals', cardIndex);
    });
  }

  // ─── ARCHIVE / COLLECTION ────────────────────────
  // On the Collection page (body.page-collection) this shows EVERY piece;
  // on the home page it shows only sold/claimed pieces.
  function renderArchive(products) {
    var container = document.getElementById('archive-grid');
    if (!container) return;
    container.innerHTML = '';

    var isCollection = document.body.classList.contains('page-collection');
    var sold = isCollection ? products.slice() : products.filter(function (p) { return p.status === 'sold'; });
    if (!sold.length) {
      container.innerHTML = '<p class="empty-grid-note">' + (isCollection ? 'No pieces yet.' : 'No claimed pieces yet.') + '</p>';
      return;
    }

    var cardIndex = 0;
    JOOKH_CATS.forEach(function (category) {   // The Collection = Jookh only; pillows + paintings live in the P·Lo section
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
      // Collection page: flat & all-visible — every collection on the wall, grouped by theme.
      var cSubs = {}, cOrder = [];
      items.forEach(function (p) {
        var raw = (p.subcollection || '').trim();
        var key = raw ? raw.toLowerCase() : '__atelier__';
        if (!cSubs[key]) { cSubs[key] = { name: raw, items: [] }; cOrder.push(key); }
        cSubs[key].items.push(p);
      });
      cOrder.sort(function (a, b) { if (a === '__atelier__') return 1; if (b === '__atelier__') return -1; return 0; });
      cOrder.forEach(function (key) {
        var g = cSubs[key];
        group.appendChild(buildSubcatHeader(displaySubName(g.name), true));
        var grid = el('div', 'jookh-grid jookh-subgrid');
        g.items.forEach(function (product) { grid.appendChild(buildCard(product, 'tall', cardIndex++)); });
        group.appendChild(grid);
      });
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

  // Map a colour name to a CSS swatch (a small dot beside each colour chip).
  function colorSwatch(name) {
    var m = {
      Black: '#1a1a1a', White: '#fafafa', Ivory: '#f3ece0', Beige: '#e3d6c0', Brown: '#6b4f3a',
      Taupe: '#b8a894', Sand: '#d8c8a8', Camel: '#c19a6b', Bronze: '#8c6a3f', Copper: '#a8623b',
      Gold: '#c9a24b', Grey: '#9a9a9a', Silver: '#cdd2d6', Navy: '#1f2a44', Blue: '#3a5da8',
      Green: '#4a7a4a', Emerald: '#1f7a5a', Olive: '#6b6a34', Pink: '#e39ab4', Red: '#c0392b',
      Burgundy: '#7a2638', Coral: '#f08060', Peach: '#f5c0a0', Orange: '#e08a3c', Yellow: '#e8c84a',
      Lavender: '#b9a8d6', Purple: '#8a6fb0', Denim: '#3b5a7a',
      Multicolor: 'linear-gradient(135deg,#e0556b,#e8a13c,#5aa75a,#3a6ea8)'
    };
    return m[name] || '#bbb';
  }

  // Collection page: faceted filtering.
  //  · Top bar = Category (Wearables / Scarves / …) and Availability (All / Available / Claimed).
  //  · Refine box = Collection (the place-themed names) + Type + Colour + Fit + Motif.
  // Everything combines, and every chip's count is recomputed live against the current
  // selection (a value that would yield 0 results is dimmed) — true faceted search.
  function wireArchiveFilters() {
    var catBar = document.getElementById('archive-filters');
    var grid   = document.getElementById('archive-grid');
    if (!catBar || !grid) return;

    var refineBox  = document.getElementById('archive-refine');
    var statusBar  = document.getElementById('collection-status');

    // Facet definitions. wearableOnly = value only meaningful on wearables.
    var FACETS = [
      { key: 'subcollection', boxId: 'refine-collection', all: 'All collections', wearableOnly: true,  display: displaySubName },
      { key: 'type',          boxId: 'refine-type',       all: 'All types',       wearableOnly: true },
      { key: 'color',         boxId: 'refine-color',      all: 'All colours',     swatch: true },
      { key: 'fit',           boxId: 'refine-fit',        all: 'All fits',        wearableOnly: true },
      { key: 'motif',         boxId: 'refine-motif',      all: 'All motifs',      wearableOnly: true }
    ];

    var state = { cat: 'all', avail: 'all' };
    FACETS.forEach(function (f) { state[f.key] = ''; });

    var cards = Array.prototype.slice.call(grid.querySelectorAll('.product-card'));
    cards.forEach(function (card) {
      var g = card.closest('.archive-category-group');
      card._cat  = g ? g.dataset.category : '';
      card._sold = card.classList.contains('card--sold');
    });

    // Does a card satisfy the current state? `ignore` skips one dimension
    // ('cat', 'avail', or a facet key) so we can compute faceted counts.
    function matches(card, ignore) {
      if (ignore !== 'cat' && !(state.cat === 'all' || card._cat === state.cat)) return false;
      if (ignore !== 'avail') {
        if (state.avail === 'available' && card._sold) return false;
        if (state.avail === 'claimed'  && !card._sold) return false;
      }
      for (var i = 0; i < FACETS.length; i++) {
        var k = FACETS[i].key;
        if (k === ignore) continue;
        if (state[k] && card.dataset[k] !== state[k]) return false;
      }
      return true;
    }

    function facetCount(f, val) {
      var n = 0;
      for (var i = 0; i < cards.length; i++) {
        var c = cards[i];
        if (f.wearableOnly && c._cat !== 'wearables') continue;
        if (c.dataset[f.key] !== val) continue;
        if (matches(c, f.key)) n++;
      }
      return n;
    }
    function facetAllCount(f) {
      var n = 0;
      for (var i = 0; i < cards.length; i++) {
        var c = cards[i];
        if (f.wearableOnly && c._cat !== 'wearables') continue;
        if (!c.dataset[f.key]) continue;
        if (matches(c, f.key)) n++;
      }
      return n;
    }
    function dimCount(kind, val) {   // kind: 'cat' | 'avail'
      var n = 0;
      for (var i = 0; i < cards.length; i++) {
        var c = cards[i];
        if (kind === 'cat'   && val !== 'all' && c._cat !== val) continue;
        if (kind === 'avail' && val === 'available' && c._sold) continue;
        if (kind === 'avail' && val === 'claimed'  && !c._sold) continue;
        if (matches(c, kind)) n++;
      }
      return n;
    }

    var facetRec = {};   // key -> { allChip, chips:{val:el} }
    var roomsBox = document.getElementById('collection-rooms');
    var roomRec  = {};   // subcollection value -> tile element

    function buildFacet(f) {
      var box = document.getElementById(f.boxId);
      if (!box) return;
      var present = {};
      cards.forEach(function (c) {
        if (f.wearableOnly && c._cat !== 'wearables') return;
        var v = c.dataset[f.key];
        if (v) present[v] = (present[v] || 0) + 1;
      });
      var keys = Object.keys(present).sort(function (a, b) { return present[b] - present[a] || a.localeCompare(b); });
      box.innerHTML = '';
      if (!keys.length) { if (box.parentNode) box.parentNode.hidden = true; return; }

      var rec = { chips: {} };
      var allChip = el('button', 'refine-chip is-active');
      allChip.type = 'button'; allChip.dataset.val = '';
      allChip.innerHTML = '<span class="refine-lbl">' + f.all + '</span><span class="refine-n"></span>';
      box.appendChild(allChip); rec.allChip = allChip;

      keys.forEach(function (k) {
        var b = el('button', 'refine-chip');
        b.type = 'button'; b.dataset.val = k;
        var sw = f.swatch ? '<span class="refine-sw" style="background:' + colorSwatch(k) + '"></span>' : '';
        var label = f.display ? f.display(k) : k;
        b.innerHTML = sw + '<span class="refine-lbl">' + label + '</span><span class="refine-n"></span>';
        box.appendChild(b); rec.chips[k] = b;
      });

      box.addEventListener('click', function (e) {
        var chip = e.target.closest('.refine-chip');
        if (!chip || chip.classList.contains('is-empty')) return;
        state[f.key] = chip.dataset.val;
        update();
      });
      facetRec[f.key] = rec;
    }

    // The "gallery rooms" — one cover-tile per wearable collection (place name).
    function buildRooms() {
      if (!roomsBox) return;
      var info = {}, order = [];
      cards.forEach(function (c) {
        if (c._cat !== 'wearables') return;
        var v = c.dataset.subcollection;
        if (!v) return;
        if (!info[v]) {
          var img = c.querySelector('.main-img');
          info[v] = { count: 0, cover: img ? img.getAttribute('src') : '' };
          order.push(v);
        }
        info[v].count++;
      });
      roomsBox.innerHTML = '';
      order.forEach(function (v) {
        var t = el('button', 'room-tile');
        t.type = 'button'; t.dataset.room = v;
        t.innerHTML =
          '<span class="room-img" style="background-image:url(\'' + info[v].cover + '\')"></span>' +
          '<span class="room-meta">' +
            '<span class="room-name">' + displaySubName(v) + '</span>' +
            '<span class="room-count"><span class="room-n">' + info[v].count + '</span> pieces</span>' +
          '</span>';
        roomsBox.appendChild(t);
        roomRec[v] = t;
      });
      roomsBox.addEventListener('click', function (e) {
        var tile = e.target.closest('.room-tile');
        if (!tile || tile.classList.contains('is-empty')) return;
        var v = tile.dataset.room;
        state.subcollection = (state.subcollection === v ? '' : v);
        state.cat = 'all';
        update();
        if (state.subcollection) {
          var g = document.getElementById('archive-grid');
          if (g) window.scrollTo({ top: g.getBoundingClientRect().top + window.pageYOffset - 90, behavior: 'smooth' });
        }
      });
    }

    function update() {
      // 1 — card visibility
      cards.forEach(function (c) { c.classList.toggle('is-filtered-out', !matches(c, null)); });

      // 2 — category groups + section headers fold away when empty
      document.querySelectorAll('.archive-category-group').forEach(function (group) {
        var catOk = (state.cat === 'all' || group.dataset.category === state.cat);
        var hasVisible = group.querySelectorAll('.product-card:not(.is-filtered-out)').length > 0;
        group.classList.toggle('is-filtered-out', !(catOk && hasVisible));
      });
      grid.querySelectorAll('.jookh-subcat-header, .jookh-line-header').forEach(function (header) {
        var next = header.nextElementSibling, vis = false;
        while (next && !next.classList.contains('jookh-subcat-header') && !next.classList.contains('jookh-line-header') && !next.classList.contains('archive-category-group')) {
          if (next.classList.contains('jookh-grid') || next.classList.contains('jookh-subgrid') || next.classList.contains('collection-grid')) {
            if (next.querySelectorAll('.product-card:not(.is-filtered-out)').length > 0) { vis = true; break; }
          }
          next = next.nextElementSibling;
        }
        header.classList.toggle('is-filtered-out', !vis);
      });

      // 3 — live facet counts (dim a value that would give zero) + active sync
      FACETS.forEach(function (f) {
        var rec = facetRec[f.key];
        if (!rec) return;
        if (rec.allChip) {
          rec.allChip.querySelector('.refine-n').textContent = facetAllCount(f);
          rec.allChip.classList.toggle('is-active', state[f.key] === '');
        }
        Object.keys(rec.chips).forEach(function (val) {
          var chip = rec.chips[val], n = facetCount(f, val);
          chip.querySelector('.refine-n').textContent = n;
          chip.classList.toggle('is-empty', n === 0 && state[f.key] !== val);
          chip.classList.toggle('is-active', state[f.key] === val);
        });
      });

      // 3b — gallery rooms: counts (ignoring the collection axis), dim, active
      Object.keys(roomRec).forEach(function (v) {
        var tile = roomRec[v], n = 0;
        for (var i = 0; i < cards.length; i++) {
          var c = cards[i];
          if (c._cat !== 'wearables' || c.dataset.subcollection !== v) continue;
          if (matches(c, 'subcollection')) n++;
        }
        var nEl = tile.querySelector('.room-n');
        if (nEl) nEl.textContent = n;
        tile.classList.toggle('is-empty', n === 0 && state.subcollection !== v);
        tile.classList.toggle('is-active', state.subcollection === v);
      });

      // 4 — category + availability counts + active sync
      catButtons.forEach(function (btn) {
        var s = btn.querySelector('.refine-n');
        if (s) s.textContent = dimCount('cat', btn.dataset.filter || 'all');
        btn.classList.toggle('is-active', (btn.dataset.filter || 'all') === state.cat);
      });
      statusButtons.forEach(function (btn) {
        var s = btn.querySelector('.refine-n');
        if (s) s.textContent = dimCount('avail', btn.dataset.status || 'all');
        btn.classList.toggle('is-active', (btn.dataset.status || 'all') === state.avail);
      });

      // 5 — active-filter summary in the sticky toolbar
      renderToolbarSummary(state, FACETS, cards, matches, update);

      if (typeof window.initReveal === 'function') window.initReveal();
      if (typeof window.__rerollStickers === 'function') { window.__rerollStickers(); setTimeout(window.__rerollStickers, 80); }
    }

    // Category bar — add a live count to each button, wire clicks
    var catButtons = Array.prototype.slice.call(catBar.querySelectorAll('.collection-filter-btn'));
    catButtons.forEach(function (btn) {
      if (!btn.querySelector('.refine-n')) { var s = el('span', 'refine-n'); btn.appendChild(s); }
      btn.addEventListener('click', function () {
        state.cat = btn.dataset.filter || 'all';
        state.subcollection = '';   // category and rooms are alternate navigations
        update();
      });
    });

    // Availability bar (folded into the same engine so its counts stay accurate)
    var statusButtons = statusBar ? Array.prototype.slice.call(statusBar.querySelectorAll('.collection-filter-btn')) : [];
    statusButtons.forEach(function (btn) {
      if (!btn.querySelector('.refine-n')) { var s = el('span', 'refine-n'); btn.appendChild(s); }
      btn.addEventListener('click', function () {
        state.avail = btn.dataset.status || 'all';
        statusButtons.forEach(function (b) { b.classList.toggle('is-active', b === btn); });
        update();
      });
    });

    FACETS.forEach(buildFacet);
    buildRooms();
    wireRoomsStrip();

    // Sticky filter toolbar: toggle the dropdown panel
    var toolbar = document.getElementById('collection-toolbar');
    var toolToggle = document.getElementById('toolbar-toggle');
    if (toolbar && toolToggle) {
      toolToggle.addEventListener('click', function (e) {
        e.stopPropagation();
        var open = toolbar.classList.toggle('is-open');
        toolToggle.setAttribute('aria-expanded', String(open));
      });
      // Close the panel when clicking outside it
      document.addEventListener('click', function (e) {
        if (toolbar.classList.contains('is-open') && !toolbar.contains(e.target)) {
          toolbar.classList.remove('is-open');
          toolToggle.setAttribute('aria-expanded', 'false');
        }
      });
    }

    // Clear-all
    var clearBtn = document.getElementById('toolbar-clear');
    if (clearBtn) {
      clearBtn.addEventListener('click', function () {
        state.cat = 'all'; state.avail = 'all';
        FACETS.forEach(function (f) { state[f.key] = ''; });
        update();
      });
    }

    update();

    // Deep-link from the home page:
    //   /collection/?c=<Collection>  opens that room (subcollection)
    //   /collection/?cat=<category>  opens that category (e.g. pillows for P-Lo)
    try {
      var qs = new URLSearchParams(location.search);
      var deepC = qs.get('c');
      var deepCat = (qs.get('cat') || '').toLowerCase();
      var jumped = false;
      if (deepC && roomRec[deepC]) { state.subcollection = deepC; state.cat = 'all'; jumped = true; }
      else if (deepCat && CATEGORY_LABELS[deepCat]) { state.cat = deepCat; state.subcollection = ''; jumped = true; }
      if (jumped) {
        update();
        var g = document.getElementById('archive-grid');
        if (g) setTimeout(function () {
          window.scrollTo({ top: g.getBoundingClientRect().top + window.pageYOffset - 90, behavior: 'smooth' });
        }, 350);
      }
    } catch (e) { /* no URLSearchParams — ignore */ }
  }

  // Horizontal "wings" strip: arrow controls + edge-aware visibility.
  function wireRoomsStrip() {
    var strip = document.getElementById('collection-rooms');
    if (!strip || !strip.classList.contains('rooms-strip')) return;
    var prev = document.getElementById('rooms-arrow-prev');
    var next = document.getElementById('rooms-arrow-next');
    function step() { return Math.max(220, Math.round(strip.clientWidth * 0.8)); }
    function sync() {
      var max = strip.scrollWidth - strip.clientWidth;
      if (prev) prev.hidden = strip.scrollLeft <= 12;            // epsilon covers snap/padding
      if (next) next.hidden = max <= 12 || strip.scrollLeft >= max - 12;
    }
    if (prev) prev.addEventListener('click', function () { strip.scrollBy({ left: -step(), behavior: 'smooth' }); });
    if (next) next.addEventListener('click', function () { strip.scrollBy({ left: step(), behavior: 'smooth' }); });
    strip.addEventListener('scroll', sync, { passive: true });
    window.addEventListener('resize', sync);
    sync();
    setTimeout(sync, 200);   // re-check once covers/layout settle
  }

  // Active-filter summary shown in the sticky toolbar bar (with one-click removal).
  function renderToolbarSummary(state, FACETS, cards, matches, update) {
    var sum = document.getElementById('toolbar-summary');
    var clearBtn = document.getElementById('toolbar-clear');
    if (!sum) return;

    var active = [];
    if (state.subcollection) active.push({ k: 'subcollection', label: displaySubName(state.subcollection) });
    if (state.cat !== 'all')  active.push({ k: 'cat',   label: CATEGORY_LABELS[state.cat] || state.cat });
    if (state.avail !== 'all') active.push({ k: 'avail', label: state.avail.charAt(0).toUpperCase() + state.avail.slice(1) });
    FACETS.forEach(function (f) {
      if (f.key !== 'subcollection' && state[f.key]) active.push({ k: f.key, label: state[f.key] });
    });

    var count = 0;
    for (var i = 0; i < cards.length; i++) { if (matches(cards[i], null)) count++; }

    var html = '';
    if (!active.length) {
      // Idle: a small painted palette teases what's inside.
      var dabs = ['#dd8a68', '#e7c98a', '#7fa6cb', '#9c7bb0', '#5f8f63', '#cf6f86'];
      html += '<span class="sum-palette" aria-hidden="true">';
      dabs.forEach(function (c) { html += '<i class="sum-dab" style="background:' + c + '"></i>'; });
      html += '</span>';
    }
    active.forEach(function (a) {
      html += '<button class="sum-chip" type="button" data-clear="' + a.k + '">' + a.label + '<span class="sum-x" aria-hidden="true">×</span></button>';
    });
    html += '<span class="sum-count"><span class="sum-num">' + count + '</span> piece' + (count === 1 ? '' : 's') + '</span>';
    sum.innerHTML = html;
    if (clearBtn) clearBtn.hidden = active.length === 0;

    // Active-count badge on the Filters button
    var badge = document.getElementById('toolbar-toggle-badge');
    if (badge) {
      if (active.length) { badge.textContent = active.length; badge.hidden = false; }
      else badge.hidden = true;
    }

    Array.prototype.forEach.call(sum.querySelectorAll('.sum-chip'), function (ch) {
      ch.addEventListener('click', function () {
        var k = ch.dataset.clear;
        if (k === 'cat') state.cat = 'all';
        else if (k === 'avail') state.avail = 'all';
        else state[k] = '';
        update();
      });
    });
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
      .catch(function () { return tryFetch('/data/products.json?_=' + Date.now()); })
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

    // Blur-up: hold a shimmer placeholder until the art has loaded, then dissolve.
    var markLoaded = function () { imgWrap.classList.add('img-loaded'); };
    if (mainImg.complete && mainImg.naturalWidth > 0) markLoaded();
    else { mainImg.addEventListener('load', markLoaded); mainImg.addEventListener('error', markLoaded); }

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
    if (product.type)      card.dataset.type      = product.type;
    if (product.color)     card.dataset.color     = product.color;
    if (product.fit)       card.dataset.fit       = product.fit;
    if (product.motif)     card.dataset.motif     = product.motif;
    if (product.technique) card.dataset.technique = product.technique;
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
