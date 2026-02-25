async function renderCart() {
  const cartItemsEl = document.getElementById('cart-items');
  const totalEl = document.getElementById('cart-total');
  const checkoutBtn = document.getElementById('checkout-btn');

  const cart = getCart();
  if (!cart.length) {
    cartItemsEl.innerHTML = '<p>Your cart is empty.</p>';
    totalEl.textContent = '0.00';
    checkoutBtn.disabled = true;
    return;
  }

  const products = await api.getProducts();
  let total = 0;

  cartItemsEl.innerHTML = cart
    .map((item) => {
      const product = products.find((p) => p.id === item.productId);
      if (!product) return '';
      const rowTotal = product.price * item.quantity;
      total += rowTotal;

      return `
        <div class="cart-row">
          <div>
            <strong>${product.title}</strong>
            <p class="muted">$${product.price.toFixed(2)} each</p>
          </div>
          <input type="number" min="1" value="${item.quantity}" data-id="${item.productId}" class="qty-input" />
          <span>$${rowTotal.toFixed(2)}</span>
          <button data-remove="${item.productId}">Remove</button>
        </div>
      `;
    })
    .join('');

  totalEl.textContent = total.toFixed(2);
  checkoutBtn.disabled = false;

  document.querySelectorAll('.qty-input').forEach((input) => {
    input.addEventListener('change', (event) => {
      const productId = event.target.getAttribute('data-id');
      updateQty(productId, Number(event.target.value));
      renderCart();
    });
  });

  document.querySelectorAll('[data-remove]').forEach((button) => {
    button.addEventListener('click', (event) => {
      const productId = event.target.getAttribute('data-remove');
      removeFromCart(productId);
      renderCart();
    });
  });
}

async function handleCheckout() {
  const auth = getAuth();
  if (!auth?.token) {
    alert('Please login before checkout.');
    window.location.href = '/login.html';
    return;
  }

  const cart = getCart();
  if (!cart.length) {
    alert('Your cart is empty.');
    return;
  }

  const result = await api.placeOrder({ items: cart }, auth.token);

  if (result.order) {
    clearCart();
    alert(`Order placed! Order ID: ${result.order.id}`);
    window.location.reload();
  } else {
    alert(result.message || 'Failed to place order');
  }
}

document.getElementById('checkout-btn')?.addEventListener('click', handleCheckout);
renderCart();
