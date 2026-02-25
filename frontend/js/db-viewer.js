const adminKeyInput = document.getElementById('db-admin-key');
const loadButton = document.getElementById('load-db-btn');
const statusEl = document.getElementById('db-status');
const tableListEl = document.getElementById('table-list');
const productsBodyEl = document.getElementById('products-table-body');

function renderTables(tables) {
  if (!Array.isArray(tables) || tables.length === 0) {
    tableListEl.innerHTML = '<li>No tables found</li>';
    return;
  }
  tableListEl.innerHTML = tables.map((table) => `<li>${table}</li>`).join('');
}

function renderProducts(products) {
  if (!Array.isArray(products) || products.length === 0) {
    productsBodyEl.innerHTML = '<tr><td colspan="6" style="padding:8px">No product rows found</td></tr>';
    return;
  }

  productsBodyEl.innerHTML = products
    .map(
      (product) => `
      <tr>
        <td style="padding:8px; border-bottom:1px solid #eee">${product.id}</td>
        <td style="padding:8px; border-bottom:1px solid #eee">${product.title}</td>
        <td style="padding:8px; border-bottom:1px solid #eee">$${Number(product.price).toFixed(2)}</td>
        <td style="padding:8px; border-bottom:1px solid #eee">${product.artistName}</td>
        <td style="padding:8px; border-bottom:1px solid #eee">${new Date(product.createdAt || Date.now()).toLocaleString()}</td>
        <td style="padding:8px; border-bottom:1px solid #eee">
          <button
            type="button"
            data-delete-product-id="${product.id}"
            style="background:#d32f2f; color:#fff; border:none; padding:6px 10px; border-radius:6px; cursor:pointer"
          >
            Delete
          </button>
        </td>
      </tr>
    `
    )
    .join('');
}

async function deleteProduct(productId) {
  const adminKey = adminKeyInput.value.trim();
  if (!adminKey) {
    statusEl.textContent = 'Enter admin key first.';
    return;
  }

  const confirmed = window.confirm('Delete this product permanently?');
  if (!confirmed) {
    return;
  }

  statusEl.textContent = 'Deleting product...';

  try {
    const response = await fetch(`/api/admin/products/${encodeURIComponent(productId)}`, {
      method: 'DELETE',
      headers: { 'x-admin-key': adminKey }
    });

    const data = await response.json();
    if (!response.ok) {
      statusEl.textContent = data.message || 'Failed to delete product.';
      return;
    }

    statusEl.textContent = 'Product deleted.';
    await loadDatabaseView();
  } catch (error) {
    statusEl.textContent = 'Failed to delete product.';
  }
}

async function loadDatabaseView() {
  const adminKey = adminKeyInput.value.trim();
  if (!adminKey) {
    statusEl.textContent = 'Enter admin key first.';
    return;
  }

  statusEl.textContent = 'Loading database...';

  try {
    const [tablesRes, productsRes] = await Promise.all([
      fetch('/api/admin/db/tables', { headers: { 'x-admin-key': adminKey } }),
      fetch('/api/admin/db/products', { headers: { 'x-admin-key': adminKey } })
    ]);

    const tablesData = await tablesRes.json();
    const productsData = await productsRes.json();

    if (!tablesRes.ok || !productsRes.ok) {
      statusEl.textContent = tablesData.message || productsData.message || 'Failed to load DB view.';
      return;
    }

    renderTables(tablesData.tables || []);
    renderProducts(productsData);
    statusEl.textContent = 'Database loaded successfully.';
  } catch (error) {
    statusEl.textContent = 'Failed to load database view.';
  }
}

loadButton?.addEventListener('click', loadDatabaseView);

productsBodyEl?.addEventListener('click', async (event) => {
  const target = event.target;
  if (!(target instanceof HTMLElement)) {
    return;
  }

  const productId = target.getAttribute('data-delete-product-id');
  if (!productId) {
    return;
  }

  await deleteProduct(productId);
});
