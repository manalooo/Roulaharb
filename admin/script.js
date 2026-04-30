(function () {
  const loginCard  = document.getElementById('login-card');
  const appCard    = document.getElementById('app-card');
  const loginForm  = document.getElementById('login-form');
  const productForm = document.getElementById('product-form');
  const loginMsg   = document.getElementById('login-msg');
  const formMsg    = document.getElementById('form-msg');
  const submitBtn  = document.getElementById('submit-btn');
  const logoutBtn  = document.getElementById('logout-btn');
  const refreshProductsBtn = document.getElementById('refresh-products-btn');

  const categoryEl    = document.getElementById('category');
  const idPreviewEl   = document.getElementById('id-preview');
  const mainImageEl   = document.getElementById('main-image');
  const hoverImageEl  = document.getElementById('hover-image');
  const mainPreviewEl = document.getElementById('main-preview');
  const hoverPreviewEl = document.getElementById('hover-preview');

  const productsTable   = document.getElementById('products-table');
  const productsTbody   = document.getElementById('products-tbody');
  const productsLoading = document.getElementById('products-loading');
  const productsEmpty   = document.getElementById('products-empty');
  const productsMsg     = document.getElementById('products-msg');

  // ── Helpers ───────────────────────────────────────────────────────────────

  function setMessage(el, text, type) {
    el.textContent = text || '';
    el.className = 'msg' + (type ? ' ' + type : '');
  }

  function escHtml(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  async function jsonFetch(url, options) {
    const res = await fetch(url, options);
    let body = {};
    try { body = await res.json(); } catch (_) {}
    if (!res.ok) throw new Error(body.error || ('Request failed: ' + res.status));
    return body;
  }

  // ── Tab switching ─────────────────────────────────────────────────────────

  document.querySelectorAll('.tab').forEach(function (btn) {
    btn.addEventListener('click', function () {
      document.querySelectorAll('.tab').forEach(function (t) { t.classList.remove('active'); });
      document.querySelectorAll('.tab-panel').forEach(function (p) { p.classList.add('hidden'); });
      btn.classList.add('active');
      const target = document.getElementById('tab-' + btn.dataset.tab);
      if (target) target.classList.remove('hidden');
    });
  });

  // ── Auth ──────────────────────────────────────────────────────────────────

  function showLoggedIn() {
    loginCard.classList.add('hidden');
    appCard.classList.remove('hidden');
    loadProducts();
    refreshNextId();
  }

  function showLoggedOut() {
    appCard.classList.add('hidden');
    loginCard.classList.remove('hidden');
  }

  async function init() {
    try {
      await jsonFetch('/api/admin/session');
      showLoggedIn();
    } catch (_) {
      showLoggedOut();
    }
  }

  loginForm.addEventListener('submit', async function (e) {
    e.preventDefault();
    setMessage(loginMsg, '', '');
    const password = document.getElementById('password').value;
    try {
      await jsonFetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      document.getElementById('password').value = '';
      showLoggedIn();
    } catch (err) {
      setMessage(loginMsg, err.message, 'error');
    }
  });

  logoutBtn.addEventListener('click', async function () {
    try { await jsonFetch('/api/admin/logout', { method: 'POST' }); } catch (_) {}
    showLoggedOut();
  });

  // ── Products table ────────────────────────────────────────────────────────

  async function loadProducts() {
    productsLoading.classList.remove('hidden');
    productsTable.classList.add('hidden');
    productsEmpty.classList.add('hidden');
    setMessage(productsMsg, '', '');

    try {
      const products = await jsonFetch('/api/admin/products');
      renderProducts(Array.isArray(products) ? products : []);
    } catch (err) {
      setMessage(productsMsg, err.message, 'error');
    } finally {
      productsLoading.classList.add('hidden');
    }
  }

  function renderProducts(products) {
    productsTbody.innerHTML = '';
    if (!products.length) {
      productsEmpty.classList.remove('hidden');
      return;
    }
    productsTable.classList.remove('hidden');

    products.forEach(function (p) {
      const tr = document.createElement('tr');
      tr.dataset.id = p.id;
      const imgSrc = p.main_image ? '/images/' + p.main_image : '';
      const section = p.section || 'current';

      tr.innerHTML =
        '<td><img class="admin-thumb" src="' + escHtml(imgSrc) + '" alt="' + escHtml(p.name) + '" /></td>' +
        '<td class="cell-id">' + escHtml(p.id) + '</td>' +
        '<td><input class="cell-input" name="name" value="' + escHtml(p.name) + '" /></td>' +
        '<td class="cell-cat">' + escHtml(p.category) + '</td>' +
        '<td>' +
          '<select class="cell-select" name="status">' +
            '<option value="available"' + (p.status === 'available' ? ' selected' : '') + '>available</option>' +
            '<option value="sold"' + (p.status === 'sold' ? ' selected' : '') + '>sold</option>' +
          '</select>' +
        '</td>' +
        '<td>' +
          '<select class="cell-select" name="section">' +
            '<option value="current"' + (section === 'current' ? ' selected' : '') + '>current</option>' +
            '<option value="archive"' + (section === 'archive' ? ' selected' : '') + '>archive</option>' +
          '</select>' +
        '</td>' +
        '<td><button class="btn-save-row" data-id="' + escHtml(p.id) + '">Save</button></td>';

      productsTbody.appendChild(tr);
    });
  }

  productsTbody.addEventListener('click', async function (e) {
    const btn = e.target.closest('.btn-save-row');
    if (!btn) return;
    const id = btn.dataset.id;
    const tr = document.querySelector('tr[data-id="' + id + '"]');
    if (!tr) return;

    const name    = tr.querySelector('input[name="name"]').value.trim();
    const status  = tr.querySelector('select[name="status"]').value;
    const section = tr.querySelector('select[name="section"]').value;

    btn.disabled = true;
    btn.textContent = '…';

    try {
      await jsonFetch('/api/admin/products/' + id, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, status, section }),
      });
      btn.textContent = '✓';
      setMessage(productsMsg, 'Saved ' + id, 'success');
      setTimeout(function () { btn.textContent = 'Save'; btn.disabled = false; }, 1400);
    } catch (err) {
      btn.textContent = 'Save';
      btn.disabled = false;
      setMessage(productsMsg, err.message, 'error');
    }
  });

  refreshProductsBtn.addEventListener('click', loadProducts);

  // ── Add Product form ──────────────────────────────────────────────────────

  async function refreshNextId() {
    try {
      const data = await jsonFetch('/api/admin/next-id?category=' + encodeURIComponent(categoryEl.value));
      idPreviewEl.value = data.id || '';
    } catch (err) {
      idPreviewEl.value = 'Unavailable';
    }
  }

  function previewFile(input, img) {
    const file = input.files && input.files[0];
    if (!file) { img.removeAttribute('src'); return; }
    const reader = new FileReader();
    reader.onload = function () { img.src = reader.result; };
    reader.readAsDataURL(file);
  }

  async function uploadOne(file, role, name, category) {
    const fd = new FormData();
    fd.append('file', file);
    fd.append('role', role);
    fd.append('name', name);
    fd.append('category', category);
    return jsonFetch('/api/admin/upload', { method: 'POST', body: fd });
  }

  categoryEl.addEventListener('change', refreshNextId);
  mainImageEl.addEventListener('change', function () { previewFile(mainImageEl, mainPreviewEl); });
  hoverImageEl.addEventListener('change', function () { previewFile(hoverImageEl, hoverPreviewEl); });

  productForm.addEventListener('submit', async function (e) {
    e.preventDefault();
    setMessage(formMsg, '', '');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Publishing…';

    try {
      const name          = document.getElementById('name').value.trim();
      const category      = categoryEl.value;
      const status        = document.getElementById('status').value;
      const section       = document.getElementById('section').value;
      const subcollection = document.getElementById('subcollection').value.trim();
      const era           = document.getElementById('era').value.trim();
      const price         = document.getElementById('price').value.trim();
      const material      = document.getElementById('material').value.trim();
      const mainFile      = mainImageEl.files && mainImageEl.files[0];
      const hoverFile     = hoverImageEl.files && hoverImageEl.files[0];

      if (!name) throw new Error('Name is required');
      if (!mainFile) throw new Error('Main image is required');

      const mainUpload = await uploadOne(mainFile, 'main', name, category);
      let hoverKey = '';
      if (hoverFile) {
        const hoverUpload = await uploadOne(hoverFile, 'hover', name, category);
        hoverKey = hoverUpload.key || '';
      }

      const created = await jsonFetch('/api/admin/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name, category, status, section, subcollection, era, price, material,
          main_image: mainUpload.key,
          hover_image: hoverKey,
        }),
      });

      setMessage(formMsg, 'Published as ' + created.id, 'success');
      productForm.reset();
      previewFile(mainImageEl, mainPreviewEl);
      previewFile(hoverImageEl, hoverPreviewEl);
      refreshNextId();
    } catch (err) {
      setMessage(formMsg, err.message, 'error');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Save and Publish';
    }
  });

  init();
})();
