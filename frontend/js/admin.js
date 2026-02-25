const adminForm = document.getElementById('admin-product-form');
const statusEl = document.getElementById('admin-status');
const postedProductsEl = document.getElementById('posted-products');
const refreshButton = document.getElementById('refresh-products');

function getAdminKey() {
  return document.getElementById('admin-key').value.trim();
}

function renderPostedProducts(products) {
  if (!Array.isArray(products) || products.length === 0) {
    postedProductsEl.innerHTML = '<p class="muted">No products posted yet.</p>';
    return;
  }

  postedProductsEl.innerHTML = products
    .map(
      (product) => `
      <article class="cart-row">
        <div>
          <strong>${product.title}</strong>
          <p class="muted">${product.description}</p>
          <p class="muted">Artist: ${product.artistName}</p>
          <p class="muted">Posted: ${new Date(product.createdAt || Date.now()).toLocaleString()}</p>
        </div>
        <img src="${product.image}" alt="${product.title}" style="width:70px;height:70px;object-fit:cover;border-radius:8px" />
        <span>$${Number(product.price).toFixed(2)}</span>
        <div style="display:grid;gap:6px;justify-items:end">
          <span class="muted">${product.id}</span>
          <button type="button" data-delete-id="${product.id}">Delete</button>
        </div>
      </article>
    `
    )
    .join('');

  postedProductsEl.querySelectorAll('[data-delete-id]').forEach((button) => {
    button.addEventListener('click', async (event) => {
      const productId = event.currentTarget.getAttribute('data-delete-id');
      await deleteProduct(productId);
    });
  });
}

async function deleteProduct(productId) {
  const adminKey = getAdminKey();
  if (!adminKey) {
    statusEl.textContent = 'Enter admin key first.';
    return;
  }

  const confirmed = window.confirm('Delete this product and uploaded image?');
  if (!confirmed) return;

  try {
    const response = await fetch(`/api/admin/products/${productId}`, {
      method: 'DELETE',
      headers: {
        'x-admin-key': adminKey
      }
    });

    const result = await response.json();
    if (!response.ok) {
      statusEl.textContent = result.message || 'Failed to delete product';
      return;
    }

    statusEl.textContent = 'Product deleted successfully.';
    await loadPostedProducts();
  } catch (error) {
    statusEl.textContent = 'Delete request failed.';
  }
}

async function loadPostedProducts() {
  const adminKey = getAdminKey();
  if (!adminKey) {
    statusEl.textContent = 'Enter admin key first to load products.';
    return;
  }

  try {
    const response = await fetch('/api/admin/products', {
      method: 'GET',
      headers: {
        'x-admin-key': adminKey
      }
    });

    const result = await response.json();
    if (!response.ok) {
      statusEl.textContent = result.message || 'Failed to load posted products';
      return;
    }

    renderPostedProducts(result);
  } catch (error) {
    statusEl.textContent = 'Could not load posted products.';
  }
}

adminForm?.addEventListener('submit', async (event) => {
  event.preventDefault();

  const adminKey = document.getElementById('admin-key').value.trim();
  const title = document.getElementById('title').value.trim();
  const price = document.getElementById('price').value;
  const artistName = document.getElementById('artist-name').value.trim();
  const description = document.getElementById('description').value.trim();
  const imageFile = document.getElementById('image').files?.[0];
  const imageUrl = document.getElementById('image-url').value.trim();

  const formData = new FormData();
  formData.append('title', title);
  formData.append('price', price);
  formData.append('artistName', artistName);
  formData.append('description', description);

  if (imageFile) {
    formData.append('image', imageFile);
  }

  if (imageUrl) {
    formData.append('imageUrl', imageUrl);
  }

  statusEl.textContent = 'Publishing product...';

  try {
    const response = await fetch('/api/admin/products', {
      method: 'POST',
      headers: {
        'x-admin-key': adminKey
      },
      body: formData
    });

    const result = await response.json();
    if (!response.ok) {
      statusEl.textContent = result.message || 'Failed to publish product';
      return;
    }

    const savedAdminKey = adminKey;
    statusEl.textContent = 'Product published successfully. It is now visible in Gallery.';
    adminForm.reset();
    document.getElementById('admin-key').value = savedAdminKey;
    await loadPostedProducts();
  } catch (error) {
    statusEl.textContent = 'Request failed. Please try again.';
  }
});

refreshButton?.addEventListener('click', loadPostedProducts);
