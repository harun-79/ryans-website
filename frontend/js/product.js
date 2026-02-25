async function renderProductDetails() {
  const content = document.getElementById('product-details');
  const params = new URLSearchParams(window.location.search);
  const id = params.get('id');

  if (!id) {
    content.innerHTML = '<p>Product not found.</p>';
    return;
  }

  try {
    const product = await api.getProductById(id);
    content.innerHTML = `
      <article class="card">
        <img src="${product.image}" alt="${product.title}" />
        <div class="card-body">
          <h2>${product.title}</h2>
          <p class="price">$${product.price.toFixed(2)}</p>
          <p>${product.description}</p>
          <p class="muted">Artist: ${product.artistName}</p>
          <button id="add-btn">Add to Cart</button>
        </div>
      </article>
    `;

    document.getElementById('add-btn').addEventListener('click', () => {
      addToCart(product.id);
      alert('Product added to cart');
    });
  } catch (error) {
    content.innerHTML = '<p>Could not load product details.</p>';
  }
}

renderProductDetails();
