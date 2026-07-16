const state = {
  token: localStorage.getItem('token') || '',
  selectedImageId: '',
  images: [],
};

const output = document.querySelector('#output');
const authStatus = document.querySelector('#authStatus');
const imageCount = document.querySelector('#imageCount');
const selectedImageText = document.querySelector('#selectedImageText');
const imagesEl = document.querySelector('#images');

const show = (data) => {
  output.textContent = JSON.stringify(data, null, 2);
};

const authHeaders = () => ({
  Authorization: `Bearer ${state.token}`,
});

const api = async (path, options = {}) => {
  const response = await fetch(path, options);
  const contentType = response.headers.get('content-type') || '';
  const data = contentType.includes('application/json')
    ? await response.json()
    : await response.text();

  if (!response.ok) throw data;
  return data;
};

const setToken = (token) => {
  state.token = token;
  localStorage.setItem('token', token);
  renderAuth();
};

const renderAuth = async () => {
  if (!state.token) {
    authStatus.textContent = 'Logged out';
    authStatus.classList.add('danger');
    return;
  }

  try {
    const data = await api('/me', { headers: authHeaders() });
    authStatus.textContent = `Logged in as ${data.user.username}`;
    authStatus.classList.remove('danger');
  } catch {
    state.token = '';
    localStorage.removeItem('token');
    authStatus.textContent = 'Logged out';
    authStatus.classList.add('danger');
  }
};

const setSelectedImage = (id) => {
  state.selectedImageId = id;
  selectedImageText.textContent = id ? `Selected: ${id}` : 'No image selected.';
  renderImages();
};

const renderImages = () => {
  imageCount.textContent = `${state.images.length} loaded`;

  if (state.images.length === 0) {
    imagesEl.innerHTML = '<p class="muted">No images loaded yet.</p>';
    return;
  }

  imagesEl.innerHTML = state.images.map((image) => `
    <article class="image-card ${image._id === state.selectedImageId ? 'selected' : ''}" data-id="${image._id}">
      <img src="${image.url}" alt="${image.originalName}" loading="lazy" />
      <div class="image-body">
        <p><strong>${image.originalName}</strong></p>
        <p class="muted small">${image.width || '?'}×${image.height || '?'} · ${image.format || 'unknown'}</p>
        <p class="muted small">${image.isTransformed ? 'Transformed' : 'Original'}</p>
        <p class="muted small">${image._id}</p>
        <div class="image-actions">
          <a href="${image.url}" target="_blank" rel="noreferrer">Open</a>
          <button class="delete" type="button" data-delete="${image._id}">Delete</button>
        </div>
      </div>
    </article>
  `).join('');
};

const loadImages = async () => {
  const data = await api('/images?page=1&limit=50', {
    headers: authHeaders(),
  });

  state.images = data.images;
  renderImages();
  show(data);
};

document.querySelector('#registerForm').addEventListener('submit', async (event) => {
  event.preventDefault();
  const form = new FormData(event.currentTarget);

  try {
    const data = await api('/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: form.get('username'),
        password: form.get('password'),
      }),
    });

    setToken(data.token);
    show(data);
    await loadImages();
  } catch (error) {
    show(error);
  }
});

document.querySelector('#loginForm').addEventListener('submit', async (event) => {
  event.preventDefault();
  const form = new FormData(event.currentTarget);

  try {
    const data = await api('/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: form.get('username'),
        password: form.get('password'),
      }),
    });

    setToken(data.token);
    show(data);
    await loadImages();
  } catch (error) {
    show(error);
  }
});

document.querySelector('#uploadForm').addEventListener('submit', async (event) => {
  event.preventDefault();
  const form = new FormData(event.currentTarget);

  try {
    const data = await api('/images', {
      method: 'POST',
      headers: authHeaders(),
      body: form,
    });

    show(data);
    event.currentTarget.reset();
    await loadImages();
    setSelectedImage(data.id);
  } catch (error) {
    show(error);
  }
});

document.querySelector('#transformForm').addEventListener('submit', async (event) => {
  event.preventDefault();

  if (!state.selectedImageId) {
    show({ message: 'Select an image first.' });
    return;
  }

  const form = new FormData(event.currentTarget);
  const transformations = {};
  const width = Number(form.get('width'));
  const height = Number(form.get('height'));
  const rotate = Number(form.get('rotate'));
  const quality = Number(form.get('quality'));
  const format = form.get('format');

  if (width || height) {
    transformations.resize = {};
    if (width) transformations.resize.width = width;
    if (height) transformations.resize.height = height;
  }

  if (form.get('rotate') !== '') transformations.rotate = rotate;
  if (format) transformations.format = format;
  if (form.get('quality') !== '') transformations.quality = quality;
  if (form.get('flip')) transformations.flip = true;
  if (form.get('mirror')) transformations.mirror = true;

  const filters = {};
  if (form.get('grayscale')) filters.grayscale = true;
  if (form.get('sepia')) filters.sepia = true;
  if (Object.keys(filters).length > 0) transformations.filters = filters;

  try {
    const data = await api(`/images/${state.selectedImageId}/transform`, {
      method: 'POST',
      headers: {
        ...authHeaders(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ transformations }),
    });

    show(data);
    await loadImages();
    setSelectedImage(data.id);
  } catch (error) {
    show(error);
  }
});

imagesEl.addEventListener('click', async (event) => {
  const deleteButton = event.target.closest('[data-delete]');

  if (deleteButton) {
    event.stopPropagation();
    const id = deleteButton.dataset.delete;
    if (!confirm('Delete this image?')) return;

    try {
      const data = await api(`/images/${id}`, {
        method: 'DELETE',
        headers: authHeaders(),
      });

      show(data);
      if (state.selectedImageId === id) setSelectedImage('');
      await loadImages();
    } catch (error) {
      show(error);
    }

    return;
  }

  const card = event.target.closest('.image-card');
  if (card) setSelectedImage(card.dataset.id);
});

document.querySelector('#refreshBtn').addEventListener('click', async () => {
  try {
    await loadImages();
  } catch (error) {
    show(error);
  }
});

document.querySelector('#logoutBtn').addEventListener('click', () => {
  state.token = '';
  state.images = [];
  localStorage.removeItem('token');
  setSelectedImage('');
  renderAuth();
  renderImages();
  show({ message: 'Logged out' });
});

document.querySelector('#clearSelectionBtn').addEventListener('click', () => {
  setSelectedImage('');
});

renderAuth();
renderImages();

if (state.token) {
  loadImages().catch(show);
}
