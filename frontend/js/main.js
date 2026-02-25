async function renderProductGrid(containerId, limit = null) {
  const container = document.getElementById(containerId);
  if (!container) return;

  try {
    const products = await api.getProducts();
    const visibleProducts = limit ? products.slice(0, limit) : products;

    container.innerHTML = visibleProducts
      .map(
        (product) => `
        <article class="card">
          <img src="${product.image}" alt="${product.title}" />
          <div class="card-body">
            <h3>${product.title}</h3>
            <p class="price">$${product.price.toFixed(2)}</p>
            <a class="btn" href="/product.html?id=${product.id}">View Details</a>
          </div>
        </article>
      `
      )
      .join('');
  } catch (error) {
    container.innerHTML = '<p>Could not load products.</p>';
  }
}
