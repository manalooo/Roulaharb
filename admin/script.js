(function () {
  const loginCard = document.getElementById('login-card');
  const appCard = document.getElementById('app-card');
  const loginForm = document.getElementById('login-form');
  const productForm = document.getElementById('product-form');
  const loginMsg = document.getElementById('login-msg');
  const formMsg = document.getElementById('form-msg');
  const submitBtn = document.getElementById('submit-btn');
  const logoutBtn = document.getElementById('logout-btn');

  const categoryEl = document.getElementById('category');
  const idPreviewEl = document.getElementById('id-preview');
  const mainImageEl = document.getElementById('main-image');
  const hoverImageEl = document.getElementById('hover-image');
  const mainPreviewEl = document.getElementById('main-preview');
  const hoverPreviewEl = document.getElementById('hover-preview');

  function setMessage(el, text, type) {
    el.textContent = text || '';
    el.className = 'msg' + (type ? ' ' + type : '');
  }

  async function jsonFetch(url, options) {
    const res = await fetch(url, options);
    let body = {};
    try { body = await res.json(); } catch (_) {}
    if (!res.ok) throw new Error(body.error || ('Request failed: ' + res.status));
    return body;
  }

  async function refreshNextId() {
    try {
      const data = await jsonFetch('/api/admin/next-id?category=' + encodeURIComponent(categoryEl.value));
      idPreviewEl.value = data.id || '';
    } catch (err) {
      idPreviewEl.value = 'Unavailable';
    }
  }

  function showLoggedIn() {
    loginCard.classList.add('hidden');
    appCard.classList.remove('hidden');
    refreshNextId();
  }

  function showLoggedOut() {
    appCard.classList.add('hidden');
    loginCard.classList.remove('hidden');
  }

  function previewFile(input, img) {
    const file = input.files && input.files[0];
    if (!file) {
      img.removeAttribute('src');
      return;
    }
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
        body: JSON.stringify({ password: password }),
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

  categoryEl.addEventListener('change', refreshNextId);
  mainImageEl.addEventListener('change', function () { previewFile(mainImageEl, mainPreviewEl); });
  hoverImageEl.addEventListener('change', function () { previewFile(hoverImageEl, hoverPreviewEl); });

  productForm.addEventListener('submit', async function (e) {
    e.preventDefault();
    setMessage(formMsg, '', '');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Publishing...';

    try {
      const name = document.getElementById('name').value.trim();
      const category = categoryEl.value;
      const status = document.getElementById('status').value;
      const subcollection = document.getElementById('subcollection').value.trim();
      const era = document.getElementById('era').value.trim();
      const price = document.getElementById('price').value.trim();
      const material = document.getElementById('material').value.trim();
      const mainFile = mainImageEl.files && mainImageEl.files[0];
      const hoverFile = hoverImageEl.files && hoverImageEl.files[0];

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
          name: name,
          category: category,
          status: status,
          subcollection: subcollection,
          era: era,
          price: price,
          material: material,
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

